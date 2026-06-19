import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';
import {
  buildGCVerificationApprovedPlainText,
  renderGCVerificationApprovedEmail,
} from './templates/gc-verification-approved.template';
import { GC_WEEKLY_VERIFICATION_REMINDER_TEMPLATE } from './templates/gc-weekly-verification-reminder.template';

export interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
  attachments?: Array<{
    filename: string;
    content: Buffer | string;
    contentType?: string;
  }>;
}

export type EmailHealthReport = {
  configured: boolean;
  provider: 'resend';
  fromAddress: string;
  fromUsesResendOnboarding: boolean;
  keySource: string | null;
  resendApiReachable: boolean | null;
  resendStatus: 'ok' | 'misconfigured' | 'provider_error' | 'not_checked';
  resendMessage: string;
  checkedAt: string;
};

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly resend: Resend | null = null;
  private readonly from: string;
  private readonly enabled: boolean;
  private readonly keySource: string | null = null;
  private readonly checkedKeyNames = [
    'RESEND_API_KEY',
    'RESEND_API_TOKEN',
    'RESEND_KEY',
    'RESEND_TOKEN',
  ] as const;
  private readonly resendSendOnlyKeyMessage = 'restricted to only send emails';

  constructor(private readonly config: ConfigService) {
    const apiKey =
      this.config.get<string>('RESEND_API_KEY') ||
      this.config.get<string>('RESEND_API_TOKEN') ||
      this.config.get<string>('RESEND_KEY') ||
      this.config.get<string>('RESEND_TOKEN');
    this.keySource = this.checkedKeyNames.find((name) => !!this.config.get<string>(name)) || null;
    this.from =
      this.config.get<string>('EMAIL_FROM') ||
      this.config.get<string>('RESEND_FROM') ||
      'BuildMyHouse <onboarding@resend.dev>';
    this.enabled = !!apiKey;

    if (apiKey) {
      this.resend = new Resend(apiKey);
      this.logger.log('Email service initialized with Resend');
    } else {
      const checkedNames = this.checkedKeyNames.join(', ');
      const env = this.config.get<string>('NODE_ENV') || 'development';
      const message = `Resend key not set (${checkedNames}) - email notifications will be skipped`;
      if (env === 'production') {
        this.logger.error(message);
      } else {
        this.logger.warn(message);
      }
    }
  }

  async send(options: SendEmailOptions): Promise<boolean> {
    if (!this.enabled || !this.resend) {
      this.logger.warn('Email send skipped: Resend API key not configured');
      return false;
    }

    try {
      this.logger.log(`Sending email to ${options.to}: "${options.subject}"`);
      const { data, error } = await this.resend.emails.send({
        from: this.from,
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text,
        attachments: (options.attachments || []).map((attachment) => ({
          filename: attachment.filename,
          content:
            typeof attachment.content === 'string'
              ? attachment.content
              : attachment.content.toString('base64'),
          contentType: attachment.contentType || 'application/octet-stream',
        })),
      });

      if (error) {
        this.logger.error(
          `Email send failed to ${options.to}: ${error.message}. ` +
            `If using onboarding@resend.dev, Resend only delivers to your signup email. ` +
            `Verify your domain at resend.com/domains to send to any address.`,
        );
        return false;
      }

      this.logger.log(`Email sent successfully to ${options.to} (id: ${data?.id})`);
      return true;
    } catch (err: any) {
      this.logger.error(
        `Email dispatch failed for ${options.to}: ${err?.message || 'unknown error'}`,
      );
      return false;
    }
  }

  private formatNaira(value: number): string {
    return `₦${Number(value || 0).toLocaleString('en-NG', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  }

  async sendHomeownerQuoteEmail(params: {
    to: string;
    homeownerName: string;
    projectName: string;
    projectAddress?: string | null;
    contractorName: string;
    estimatedDuration?: string | null;
    baseQuoteAmount: number;
    monitoringFeeAmount: number;
    coordinationFeeAmount: number;
    contingencyFeeAmount: number;
    totalQuoteAmount: number;
    quotePdfBuffer: Buffer;
    quotePdfFileName: string;
  }): Promise<boolean> {
    const safeHomeowner = this.escapeHtml(params.homeownerName || 'Homeowner');
    const safeProjectName = this.escapeHtml(params.projectName || 'Project');
    const safeProjectAddress = this.escapeHtml(params.projectAddress || 'Address not provided');
    const safeContractorName = this.escapeHtml(params.contractorName || 'General Contractor');
    const safeDuration = this.escapeHtml(params.estimatedDuration || 'To be confirmed');
    const baseAmount = this.formatNaira(params.baseQuoteAmount);
    const monitoringFee = this.formatNaira(params.monitoringFeeAmount);
    const coordinationFee = this.formatNaira(params.coordinationFeeAmount);
    const contingencyFee = this.formatNaira(params.contingencyFeeAmount);
    const totalAmount = this.formatNaira(params.totalQuoteAmount);
    const safePdfFileName = String(params.quotePdfFileName || 'buildmyhouse-quote.pdf').trim();

    const subject = `BuildMyHouse Quote Ready: ${params.projectName}`;
    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${this.escapeHtml(subject)}</title>
</head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:680px;margin:0 auto;padding:24px;">
    <tr>
      <td style="background:#ffffff;border-radius:12px;padding:28px;box-shadow:0 1px 3px rgba(0,0,0,0.08);">
        <h1 style="margin:0 0 10px 0;font-size:20px;color:#111827;">Your BuildMyHouse Quote Is Ready</h1>
        <p style="margin:0 0 20px 0;font-size:14px;color:#4b5563;">Hi ${safeHomeowner}, your contractor has accepted your project after physical inspection.</p>

        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;margin-bottom:18px;">
          <tr><td style="padding:8px 0;color:#6b7280;font-size:13px;">Project</td><td style="padding:8px 0;color:#111827;font-size:13px;text-align:right;">${safeProjectName}</td></tr>
          <tr><td style="padding:8px 0;color:#6b7280;font-size:13px;">Address</td><td style="padding:8px 0;color:#111827;font-size:13px;text-align:right;">${safeProjectAddress}</td></tr>
          <tr><td style="padding:8px 0;color:#6b7280;font-size:13px;">Contractor</td><td style="padding:8px 0;color:#111827;font-size:13px;text-align:right;">${safeContractorName}</td></tr>
          <tr><td style="padding:8px 0;color:#6b7280;font-size:13px;">Estimated Duration</td><td style="padding:8px 0;color:#111827;font-size:13px;text-align:right;">${safeDuration}</td></tr>
        </table>

        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;background:#f9fafb;border-radius:10px;padding:14px;margin-bottom:18px;">
          <tr><td style="padding:8px 0;color:#111827;font-size:14px;">Engineer Quote</td><td style="padding:8px 0;color:#111827;font-size:14px;text-align:right;">${baseAmount}</td></tr>
          <tr><td style="padding:8px 0;color:#374151;font-size:13px;">BuildMyHouse Monitoring Fee (5%)</td><td style="padding:8px 0;color:#374151;font-size:13px;text-align:right;">${monitoringFee}</td></tr>
          <tr><td style="padding:8px 0;color:#374151;font-size:13px;">BuildMyHouse Coordination Fee (5%)</td><td style="padding:8px 0;color:#374151;font-size:13px;text-align:right;">${coordinationFee}</td></tr>
          <tr><td style="padding:8px 0;color:#374151;font-size:13px;">BuildMyHouse Contingency Fee (20%)</td><td style="padding:8px 0;color:#374151;font-size:13px;text-align:right;">${contingencyFee}</td></tr>
          <tr><td colspan="2" style="border-top:1px solid #e5e7eb;padding-top:10px;"></td></tr>
          <tr><td style="padding:8px 0;color:#111827;font-size:16px;font-weight:700;">Total Amount Payable</td><td style="padding:8px 0;color:#111827;font-size:16px;font-weight:700;text-align:right;">${totalAmount}</td></tr>
        </table>

        <div style="background:#111827;color:#ffffff;border-radius:10px;padding:14px;margin-bottom:16px;">
          <p style="margin:0 0 8px 0;font-size:13px;font-weight:600;">Pay to BuildMyHouse Verified Account</p>
          <p style="margin:0;font-size:13px;line-height:1.7;">
            Monipoint MFB<br>
            8139036559<br>
            Amala Class Concepts (or Godswill Oluwafemi Okunola)
          </p>
        </div>

        <p style="margin:0 0 8px 0;font-size:13px;color:#111827;">
          After payment, send your payment receipt together with the attached quote PDF to BuildMyHouse WhatsApp for approval to begin:
        </p>
        <p style="margin:0 0 18px 0;font-size:14px;font-weight:700;color:#111827;">+2348105475652</p>

        <p style="margin:0;font-size:12px;color:#6b7280;">
          Attached file: ${this.escapeHtml(safePdfFileName)}
        </p>
      </td>
    </tr>
  </table>
</body>
</html>
    `.trim();

    const text = `Hi ${params.homeownerName},

Your BuildMyHouse quote is ready for ${params.projectName}.

Project: ${params.projectName}
Address: ${params.projectAddress || 'Address not provided'}
Contractor: ${params.contractorName}
Estimated Duration: ${params.estimatedDuration || 'To be confirmed'}

Engineer Quote: ${baseAmount}
BuildMyHouse Monitoring Fee (5%): ${monitoringFee}
BuildMyHouse Coordination Fee (5%): ${coordinationFee}
BuildMyHouse Contingency Fee (20%): ${contingencyFee}
Total Amount Payable: ${totalAmount}

Pay to BuildMyHouse Verified Account:
Monipoint MFB
8139036559
Amala Class Concepts (or Godswill Oluwafemi Okunola)

After payment, send your receipt and the attached quote PDF to BuildMyHouse WhatsApp for approval to begin:
+2348105475652`;

    return this.send({
      to: params.to,
      subject,
      html,
      text,
      attachments: [
        {
          filename: safePdfFileName,
          content: params.quotePdfBuffer,
          contentType: 'application/pdf',
        },
      ],
    });
  }

  async getHealthReport(): Promise<EmailHealthReport> {
    const checkedAt = new Date().toISOString();
    const fromUsesResendOnboarding = /onboarding@resend\.dev/i.test(this.from);

    if (!this.enabled || !this.resend) {
      return {
        configured: false,
        provider: 'resend',
        fromAddress: this.from,
        fromUsesResendOnboarding,
        keySource: this.keySource,
        resendApiReachable: null,
        resendStatus: 'misconfigured',
        resendMessage:
          'Resend API key is missing. Set RESEND_API_KEY (or supported alias) in backend environment.',
        checkedAt,
      };
    }

    try {
      const resendAny = this.resend as any;
      if (resendAny?.domains?.list) {
        const probe = await resendAny.domains.list();
        if (probe?.error) {
          const providerMessage = probe.error?.message || 'Unknown provider error from Resend';
          const isSendOnlyKey = providerMessage
            .toLowerCase()
            .includes(this.resendSendOnlyKeyMessage);
          if (isSendOnlyKey) {
            return {
              configured: true,
              provider: 'resend',
              fromAddress: this.from,
              fromUsesResendOnboarding,
              keySource: this.keySource,
              resendApiReachable: true,
              resendStatus: 'ok',
              resendMessage: fromUsesResendOnboarding
                ? 'Resend key is valid (send-only scope). NOTE: onboarding@resend.dev can only deliver to your Resend signup email.'
                : 'Resend key is valid (send-only scope). Domain listing is blocked for this key type.',
              checkedAt,
            };
          }
          return {
            configured: true,
            provider: 'resend',
            fromAddress: this.from,
            fromUsesResendOnboarding,
            keySource: this.keySource,
            resendApiReachable: false,
            resendStatus: 'provider_error',
            resendMessage: providerMessage,
            checkedAt,
          };
        }
      }

      return {
        configured: true,
        provider: 'resend',
        fromAddress: this.from,
        fromUsesResendOnboarding,
        keySource: this.keySource,
        resendApiReachable: true,
        resendStatus: 'ok',
        resendMessage: fromUsesResendOnboarding
          ? 'Resend is reachable. NOTE: onboarding@resend.dev can only deliver to your Resend signup email.'
          : 'Resend API is reachable and email configuration looks valid.',
        checkedAt,
      };
    } catch (err: any) {
      const message = err?.message || 'Unknown provider error';
      const isSendOnlyKey = String(message)
        .toLowerCase()
        .includes(this.resendSendOnlyKeyMessage);
      if (isSendOnlyKey) {
        return {
          configured: true,
          provider: 'resend',
          fromAddress: this.from,
          fromUsesResendOnboarding,
          keySource: this.keySource,
          resendApiReachable: true,
          resendStatus: 'ok',
          resendMessage: fromUsesResendOnboarding
            ? 'Resend key is valid (send-only scope). NOTE: onboarding@resend.dev can only deliver to your Resend signup email.'
            : 'Resend key is valid (send-only scope). Domain listing is blocked for this key type.',
          checkedAt,
        };
      }
      return {
        configured: true,
        provider: 'resend',
        fromAddress: this.from,
        fromUsesResendOnboarding,
        keySource: this.keySource,
        resendApiReachable: false,
        resendStatus: 'provider_error',
        resendMessage: message,
        checkedAt,
      };
    }
  }

  /**
   * Send a notification email (used by NotificationsService)
   */
  async sendNotificationEmail(params: {
    to: string;
    recipientName?: string;
    recipientRole?: string;
    notificationType?: string;
    title: string;
    message: string;
    data?: Record<string, unknown>;
  }): Promise<boolean> {
    const { to, recipientName, recipientRole, notificationType, title, message, data } = params;

    const isGCWeeklyReminder = notificationType === 'gc_verification_weekly_reminder';
    const isGCVerificationApproved =
      notificationType === 'account_verified' && recipientRole === 'general_contractor';
    const cta = this.resolveNotificationCta({
      notificationType,
      recipientRole,
      data,
    });
    const dashboardUrl = `${this.getContractorAppUrl()}/contractor/gc-dashboard`;
    const contractorFirstName = this.firstName(recipientName || 'Contractor');
    const verifiedSpecialty = String(data?.specialty || data?.verifiedSpecialty || 'General Contractor').trim();
    const html =
      isGCWeeklyReminder
        ? GC_WEEKLY_VERIFICATION_REMINDER_TEMPLATE
        : isGCVerificationApproved
          ? renderGCVerificationApprovedEmail({
              contractorName: contractorFirstName,
              specialty: verifiedSpecialty || 'General Contractor',
              dashboardUrl,
            })
          : this.buildNotificationHtml({
              recipientName: recipientName || 'User',
              title,
              message,
              ctaLabel: cta.label,
              ctaUrl: cta.url,
            });
    const subject = isGCWeeklyReminder
      ? 'You’re leaving money on the table.'
      : isGCVerificationApproved
        ? '🎉 You’re Now a Verified Contractor on BuildMyHouse'
        : `BuildMyHouse: ${title}`;
    const text = isGCVerificationApproved
      ? buildGCVerificationApprovedPlainText({
          contractorName: contractorFirstName,
          specialty: verifiedSpecialty || 'General Contractor',
          dashboardUrl,
        })
      : `${title}\n\n${message}${cta.url ? `\n\n${cta.label}: ${cta.url}` : ''}`;

    return this.send({
      to,
      subject,
      html,
      text,
    });
  }

  private escapeHtml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  private firstName(fullName: string): string {
    const trimmed = String(fullName || '').trim();
    if (!trimmed) return 'Contractor';
    return trimmed.split(/\s+/)[0];
  }

  private buildNotificationHtml(params: {
    recipientName: string;
    title: string;
    message: string;
    ctaLabel: string;
    ctaUrl: string;
  }): string {
    const { recipientName, title, message, ctaLabel, ctaUrl } = params;
    const safeTitle = this.escapeHtml(title);
    const safeMessage = this.escapeHtml(message).replace(/\n/g, '<br>');
    const safeName = this.escapeHtml(recipientName);
    const safeCtaLabel = this.escapeHtml(ctaLabel);
    const safeCtaUrl = this.escapeHtml(ctaUrl);

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${safeTitle}</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f4f4f5;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 600px; margin: 0 auto; padding: 24px;">
    <tr>
      <td style="background-color: #ffffff; border-radius: 8px; padding: 32px; box-shadow: 0 1px 3px rgba(0,0,0,0.08);">
        <h1 style="margin: 0 0 8px 0; font-size: 18px; font-weight: 600; color: #18181b;">
          BuildMyHouse
        </h1>
        <p style="margin: 0 0 24px 0; font-size: 14px; color: #71717a;">
          Hi ${safeName},
        </p>
        <h2 style="margin: 0 0 16px 0; font-size: 16px; font-weight: 600; color: #18181b;">
          ${safeTitle}
        </h2>
        <p style="margin: 0; font-size: 15px; line-height: 1.6; color: #3f3f46;">
          ${safeMessage}
        </p>
        <a
          href="${safeCtaUrl}"
          target="_blank"
          rel="noopener noreferrer"
          style="display:inline-block;margin:24px 0 0 0;padding:12px 20px;background:#111827;color:#ffffff;text-decoration:none;border-radius:999px;font-size:14px;font-weight:600;"
        >
          ${safeCtaLabel}
        </a>
        <p style="margin: 24px 0 0 0; font-size: 13px; color: #71717a;">
          View this in the BuildMyHouse app for more details.
        </p>
      </td>
    </tr>
    <tr>
      <td style="padding: 16px 0 0 0; text-align: center;">
        <p style="margin: 0; font-size: 12px; color: #a1a1aa;">
          © ${new Date().getFullYear()} BuildMyHouse. All rights reserved.
        </p>
      </td>
    </tr>
  </table>
</body>
</html>
    `.trim();
  }

  private normalizeAppUrl(url: string): string {
    return String(url || '').trim().replace(/\/+$/, '');
  }

  private getHomeownerAppUrl(): string {
    return this.normalizeAppUrl(
      this.config.get<string>('HOMEOWNER_APP_URL') || 'https://buildmyhouse.app',
    );
  }

  private getContractorAppUrl(): string {
    return this.normalizeAppUrl(
      this.config.get<string>('CONTRACTOR_APP_URL') || 'https://gc.buildmyhouse.app',
    );
  }

  private getAdminAppUrl(): string {
    return this.normalizeAppUrl(
      this.config.get<string>('ADMIN_DASHBOARD_URL') || 'https://admin.buildmyhouse.app',
    );
  }

  private resolveNotificationCta(params: {
    notificationType?: string;
    recipientRole?: string;
    data?: Record<string, unknown>;
  }): { label: string; url: string } {
    const type = String(params.notificationType || '').trim();
    const role = String(params.recipientRole || '').trim();
    const data = params.data || {};
    const projectId = String((data.projectId as string) || '').trim();
    const reviewLink = String((data.reviewLink as string) || '').trim();
    const explicitCtaUrl = String((data.ctaUrl as string) || '').trim();
    const explicitCtaLabel = String((data.ctaLabel as string) || '').trim();

    if (explicitCtaUrl) {
      return {
        label: explicitCtaLabel || 'Open in app',
        url: explicitCtaUrl,
      };
    }

    if (reviewLink) {
      return {
        label: explicitCtaLabel || 'Leave your review',
        url: reviewLink,
      };
    }

    if (role === 'admin') {
      if (type.includes('verification') || type.includes('account_verified') || type.includes('account_unverified')) {
        return { label: 'Open Verification', url: `${this.getAdminAppUrl()}/verification` };
      }
      if (projectId) {
        return { label: 'Open Project Queue', url: `${this.getAdminAppUrl()}/projects` };
      }
      return { label: 'Open Admin Dashboard', url: `${this.getAdminAppUrl()}/dashboard` };
    }

    if (role === 'general_contractor') {
      if (projectId) {
        return {
          label: 'Open Project',
          url: `${this.getContractorAppUrl()}/contractor/gc-project-detail?id=${encodeURIComponent(projectId)}`,
        };
      }
      return {
        label: 'Open Contractor App',
        url: `${this.getContractorAppUrl()}/contractor/gc-dashboard`,
      };
    }

    if (projectId) {
      return {
        label: 'Open Project Dashboard',
        url: `${this.getHomeownerAppUrl()}/dashboard?projectId=${encodeURIComponent(projectId)}`,
      };
    }

    return {
      label: 'Open BuildMyHouse',
      url: this.getHomeownerAppUrl(),
    };
  }
}
