import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../email/email.service';
import { S3UploadService } from '../upload/s3-upload.service';
import { WebSocketService } from '../websocket/websocket.service';
import {
  FUNDING_ACCOUNT_SETTING_KEY,
  FundingAccount,
  FundingInvoice,
  parseFundingAccount,
  payableFromRequest,
  paymentReference,
  readFundingInvoice,
  referenceFromText,
  withFundingInvoice,
} from './funding-invoice';
import { amountStillDue, isPaymentModel, netReceived } from '../projects/payment-model';

const MAX_RECEIPT_BYTES = 8 * 1024 * 1024;

type InboundAttachment = {
  filename: string;
  contentType: string;
  content: Buffer;
};

export type InvoiceSendResult = {
  sent: boolean;
  skipped?: boolean;
  reason?: string;
  reference?: string;
};

@Injectable()
export class FundingService {
  private readonly logger = new Logger(FundingService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly emailService: EmailService,
    private readonly uploads: S3UploadService,
    private readonly wsService: WebSocketService,
    private readonly config: ConfigService,
  ) {}

  async getAccount(): Promise<FundingAccount | null> {
    const row = await this.prisma.priceIntelligenceSetting.findUnique({
      where: { key: FUNDING_ACCOUNT_SETTING_KEY },
    });
    return parseFundingAccount(row?.valueJson);
  }

  async saveAccount(input: unknown, adminId?: string): Promise<FundingAccount> {
    const account = parseFundingAccount(input);
    if (!account) {
      throw new BadRequestException('Enter the bank name, a 10-digit account number, and the account name.');
    }
    await this.prisma.priceIntelligenceSetting.upsert({
      where: { key: FUNDING_ACCOUNT_SETTING_KEY },
      create: {
        key: FUNDING_ACCOUNT_SETTING_KEY,
        valueJson: account,
        updatedByAdminId: adminId || null,
      },
      update: {
        valueJson: account,
        updatedByAdminId: adminId || null,
      },
    });
    return account;
  }

  async sendProjectInvoice(projectId: string, options?: { resend?: boolean }): Promise<InvoiceSendResult> {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      include: {
        homeowner: { select: { email: true, fullName: true } },
        projectRequests: {
          where: { stageId: null },
          orderBy: { updatedAt: 'desc' },
          take: 1,
          select: { gcNotes: true, totalQuoteAmount: true },
        },
        stages: { orderBy: { order: 'asc' }, select: { depositDue: true, estimatedCost: true, order: true } },
        payments: { where: { status: { in: ['completed', 'refunded'] } }, select: { amount: true, status: true } },
      },
    });
    if (!project) return { sent: false, reason: 'missing_project' };

    const existing = readFundingInvoice(project.aiAnalysis);
    if (existing?.sentAt && !options?.resend) {
      return { sent: true, skipped: true, reference: existing.reference };
    }

    const quoted = payableFromRequest(project.projectRequests[0]);
    const amount = this.invoiceAmount(project, quoted);
    const account = await this.getAccount();
    const reference = existing?.reference || paymentReference(project.id);
    const email = String(project.homeowner?.email || '').trim();

    if (!account || amount <= 0 || !email) {
      const reason = !account ? 'no_account' : amount <= 0 ? 'no_amount' : 'no_email';
      await this.notifyAdmins(
        'funding_invoice',
        'Invoice was not sent',
        !account
          ? `${project.name} is ready to fund. Save today’s payment account, then resend the invoice.`
          : `${project.name} is ready to fund, but the invoice could not be sent (${reason}).`,
        project.id,
      );
      return { sent: false, reason, reference };
    }

    const sent = await this.emailService.sendFundingInvoiceEmail({
      to: email,
      replyTo: this.replyAddress(),
      homeownerName: project.homeowner?.fullName || 'Homeowner',
      projectName: project.name,
      amount,
      reference,
      account,
    });
    if (!sent) {
      await this.notifyAdmins(
        'funding_invoice',
        'Invoice email failed',
        `The invoice for ${project.name} (${reference}) did not send. Resend it from the project.`,
        project.id,
      );
      return { sent: false, reason: 'email_failed', reference };
    }

    const invoice: FundingInvoice = {
      reference,
      amount,
      sentAt: new Date().toISOString(),
      account,
      receipt: existing?.receipt || null,
    };
    await this.prisma.project.update({
      where: { id: project.id },
      data: { aiAnalysis: withFundingInvoice(project.aiAnalysis, invoice) as any },
    });
    return { sent: true, reference };
  }

  async receiveResendEvent(event: any): Promise<{ matched: boolean; declared?: boolean }> {
    if (event?.type !== 'email.received') return { matched: false };
    const data = event.data || {};
    const emailId = String(data.email_id || data.emailId || '').trim();
    let subject = String(data.subject || '');
    let from = String(data.from || '');
    let text = String(data.text || data.html || '');
    let listed = Array.isArray(data.attachments) ? data.attachments : [];

    if (emailId) {
      const received = await this.fetchReceivedEmail(emailId);
      if (received) {
        subject = received.subject || subject;
        from = received.from || from;
        text = received.text || received.html || text;
        if (Array.isArray(received.attachments) && received.attachments.length) {
          listed = received.attachments;
        }
      }
    }

    const attachments = await this.collectAttachments(emailId, listed);
    return this.recordReply({ subject, text, from, attachments });
  }

  async recordReply(params: {
    subject: string;
    text?: string;
    from?: string;
    attachments: InboundAttachment[];
  }): Promise<{ matched: boolean; declared?: boolean }> {
    const reference = referenceFromText(`${params.subject}\n${params.text || ''}`);
    if (!reference) return { matched: false };

    const project = await this.prisma.project.findFirst({
      where: {
        aiAnalysis: {
          path: ['fundingInvoice', 'reference'],
          equals: reference,
        },
      },
    });
    if (!project) return { matched: false };

    const existing = readFundingInvoice(project.aiAnalysis);
    const file = params.attachments.find((item) => this.isReceipt(item)) || null;
    if (!file) {
      if (!existing?.receipt) {
        await this.notifyAdmins(
          'funding_receipt',
          'Payment reply has no receipt',
          `${project.name} (${reference}) got a reply without a receipt attachment.`,
          project.id,
        );
      }
      return { matched: true, declared: project.paymentConfirmationStatus === 'declared' };
    }

    const uploaded = await this.uploads.uploadBuffer({
      buffer: file.content,
      folder: 'files/payment-receipts',
      contentType: file.contentType || 'application/octet-stream',
      originalName: this.safeFileName(file.filename),
    });
    const nextReceipt = {
      fileName: this.safeFileName(file.filename),
      url: uploaded.url,
      from: String(params.from || '').trim(),
      receivedAt: new Date().toISOString(),
      confirmedAt: null,
    };
    const prior = existing?.receipts?.length
      ? existing.receipts
      : existing?.receipt
        ? [existing.receipt]
        : [];
    const invoice: FundingInvoice = {
      reference,
      amount: existing?.amount || 0,
      sentAt: existing?.sentAt || null,
      account: existing?.account || null,
      receipt: nextReceipt,
      receipts: [...prior, nextReceipt],
    };
    const now = new Date();
    await this.prisma.project.update({
      where: { id: project.id },
      data: {
        aiAnalysis: withFundingInvoice(project.aiAnalysis, invoice) as any,
        paymentConfirmationStatus: 'declared',
        paymentDeclaredAt: project.paymentDeclaredAt ?? now,
        status: project.status === 'draft' ? 'pending_payment' : project.status,
      },
    });
    await this.notifyAdmins(
      'funding_receipt',
      'Payment receipt received',
      `${project.name}: a receipt arrived for ${reference}. Confirm the amount on the receipt before the project or the next stage can move.`,
      project.id,
    );
    return { matched: true, declared: true };
  }

  private invoiceAmount(project: {
    paymentModel?: string | null;
    budget?: number | null;
    aiAnalysis?: unknown;
    stages?: Array<{ depositDue?: number | null; estimatedCost?: number | null }>;
    payments?: Array<{ amount?: number | null; status?: string | null }>;
  }, quoted: number): number {
    const model = project.paymentModel;
    if (!isPaymentModel(model)) return quoted;
    const phaseDeposits = Array.isArray((project.aiAnalysis as { phases?: Array<{ depositDue?: number }> } | null)?.phases)
      ? ((project.aiAnalysis as { phases: Array<{ depositDue?: number }> }).phases || []).map((phase) => Number(phase.depositDue) || 0)
      : [];
    const stageDeposits = (project.stages || []).some((stage) => Number(stage.depositDue) > 0)
      ? (project.stages || []).map((stage) => Number(stage.depositDue) || 0)
      : phaseDeposits;
    const invoice = quoted > 0
      ? quoted
      : stageDeposits.reduce((sum, value) => sum + value, 0);
    const due = amountStillDue({
      paymentModel: model,
      totalPayable: invoice,
      stageDeposits,
      received: netReceived(project.payments),
    });
    return due > 0 ? due : 0;
  }

  private replyAddress(): string {
    return String(this.config.get<string>('PAYMENTS_REPLY_TO') || 'inspect@buildmyhouse.app').trim();
  }

  private async notifyAdmins(type: string, title: string, message: string, projectId: string) {
    try {
      await this.wsService.sendNotificationToRole('admin', {
        type,
        title,
        message,
        data: { projectId },
      });
    } catch (error) {
      this.logger.warn(`Admin notice failed: ${error instanceof Error ? error.message : error}`);
    }
  }

  private isReceipt(file: InboundAttachment): boolean {
    if (!file.content?.length || file.content.length > MAX_RECEIPT_BYTES) return false;
    const type = file.contentType.toLowerCase();
    const name = file.filename.toLowerCase();
    return type.startsWith('image/') || type === 'application/pdf' || name.endsWith('.pdf') || /\.(png|jpe?g|webp|heic)$/.test(name);
  }

  private safeFileName(name: string): string {
    const cleaned = String(name || 'receipt').replace(/[^\w.\-]+/g, '_').slice(0, 80);
    return cleaned || 'receipt';
  }

  private async fetchReceivedEmail(emailId: string): Promise<any | null> {
    const apiKey = this.resendKey();
    if (!apiKey) return null;
    try {
      const response = await fetch(`https://api.resend.com/emails/receiving/${encodeURIComponent(emailId)}`, {
        headers: { Authorization: `Bearer ${apiKey}` },
        signal: AbortSignal.timeout(10000),
      });
      if (!response.ok) {
        this.logger.warn(`Resend receiving lookup failed: ${response.status}`);
        return null;
      }
      return response.json();
    } catch (error) {
      this.logger.warn(`Resend receiving lookup failed: ${error instanceof Error ? error.message : error}`);
      return null;
    }
  }

  private async collectAttachments(emailId: string, listed: any[]): Promise<InboundAttachment[]> {
    const files: InboundAttachment[] = [];
    for (const item of listed.slice(0, 3)) {
      const inline = this.inlineAttachment(item);
      if (inline) {
        files.push(inline);
        continue;
      }
      const id = String(item?.id || '').trim();
      if (!emailId || !id) continue;
      const downloaded = await this.downloadAttachment(emailId, id, item);
      if (downloaded) files.push(downloaded);
    }
    return files;
  }

  private inlineAttachment(item: any): InboundAttachment | null {
    const content = item?.content;
    if (typeof content !== 'string' || !content) return null;
    try {
      const buffer = Buffer.from(content, 'base64');
      if (!buffer.length) return null;
      return {
        filename: String(item.filename || item.file_name || 'receipt'),
        contentType: String(item.content_type || item.contentType || 'application/octet-stream'),
        content: buffer,
      };
    } catch {
      return null;
    }
  }

  private async downloadAttachment(emailId: string, attachmentId: string, meta: any): Promise<InboundAttachment | null> {
    const apiKey = this.resendKey();
    if (!apiKey) return null;
    try {
      const response = await fetch(
        `https://api.resend.com/emails/receiving/${encodeURIComponent(emailId)}/attachments/${encodeURIComponent(attachmentId)}`,
        { headers: { Authorization: `Bearer ${apiKey}` }, signal: AbortSignal.timeout(10000) },
      );
      if (!response.ok) return null;
      const body = await response.json();
      const downloadUrl = String(body?.download_url || body?.downloadUrl || '').trim();
      if (!downloadUrl) return null;
      const file = await fetch(downloadUrl, { signal: AbortSignal.timeout(15000) });
      if (!file.ok) return null;
      const content = Buffer.from(await file.arrayBuffer());
      return {
        filename: String(body.filename || meta?.filename || 'receipt'),
        contentType: String(body.content_type || meta?.content_type || file.headers.get('content-type') || 'application/octet-stream'),
        content,
      };
    } catch (error) {
      this.logger.warn(`Receipt download failed: ${error instanceof Error ? error.message : error}`);
      return null;
    }
  }

  private resendKey(): string {
    return String(
      this.config.get<string>('RESEND_API_KEY') ||
        this.config.get<string>('RESEND_API_TOKEN') ||
        '',
    ).trim();
  }
}
