/**
 * Stage 7 — secure recovery email for guest paid sessions.
 */
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { createHash, randomBytes } from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';
import { EmailService } from '../../email/email.service';
import { UsageIdentity } from '../consumer/price-checker-usage.service';
import { PriceCheckerPaymentService } from './payment.service';

@Injectable()
export class PriceCheckerRecoveryService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly email: EmailService,
    private readonly payments: PriceCheckerPaymentService,
  ) {}

  async sendRecoveryEmail(paymentOrderId: string, identity: UsageIdentity): Promise<{ sent: boolean }> {
    const order = await this.prisma.priceCheckPaymentOrder.findUnique({
      where: { id: paymentOrderId },
      include: { lineItems: true },
    });
    if (!order) throw new NotFoundException('Payment order not found');

    // Ownership check via safe status (throws if not owner)
    this.payments.toSafeDto(order, order.lineItems);
    if (order.userId && identity.userId !== order.userId) {
      // fall through to session check
    }
    const owns =
      (order.userId && identity.userId === order.userId) ||
      (order.anonymousSessionId && identity.anonymousSessionId === order.anonymousSessionId) ||
      (identity.anonymousSessionId && order.sessionId === identity.anonymousSessionId);
    if (!owns) throw new NotFoundException('Payment order not found');

    if (order.status !== 'success') {
      throw new BadRequestException('Recovery email is only available after successful payment.');
    }

    const token = randomBytes(32).toString('base64url');
    const hash = createHash('sha256').update(token).digest('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await this.prisma.priceCheckPaymentOrder.update({
      where: { id: order.id },
      data: { recoveryTokenHash: hash, recoveryTokenExpiresAt: expiresAt },
    });

    const base = (process.env.PRICE_CHECKER_WEB_BASE_URL ?? process.env.HOMEOWNER_APP_URL ?? 'https://buildmyhouse.app').replace(
      /\/+$/,
      '',
    );
    const recoveryUrl = `${base}/tools/price-checker/payment/recover?token=${encodeURIComponent(token)}&order=${encodeURIComponent(order.id)}`;
    const reportCount = order.lineItems.length;
    const amountNaira = ((order.amountPaidKobo ?? order.amountExpectedKobo) / 100).toLocaleString('en-NG');

    const subject = 'Your BuildMyHouse Price Checker payment';
    const text = [
      'Payment confirmed for your Price Checker reports.',
      '',
      `Reports purchased: ${reportCount}`,
      `Amount: ₦${amountNaira}`,
      `Payment reference: ${order.providerReference}`,
      '',
      `Return to your reports: ${recoveryUrl}`,
      '',
      'This link expires in 7 days and does not create an account.',
      'If you did not make this payment, contact support.',
    ].join('\n');

    const html = `
      <p>Payment confirmed for your Price Checker reports.</p>
      <ul>
        <li>Reports purchased: <strong>${reportCount}</strong></li>
        <li>Amount: <strong>₦${amountNaira}</strong></li>
        <li>Payment reference: <code>${order.providerReference}</code></li>
      </ul>
      <p><a href="${recoveryUrl}">Return to your reports</a></p>
      <p style="color:#666;font-size:13px">This link expires in 7 days and does not create an account.</p>
    `;

    const sent = await this.email.send({
      to: order.customerEmail,
      subject,
      html,
      text,
    });

    return { sent };
  }

  async resolveRecoveryToken(token: string): Promise<{ paymentOrderId: string; sessionId: string }> {
    if (!token || typeof token !== 'string' || token.length < 20) {
      throw new BadRequestException('Invalid recovery token');
    }
    const hash = createHash('sha256').update(token).digest('hex');
    const order = await this.prisma.priceCheckPaymentOrder.findFirst({
      where: { recoveryTokenHash: hash },
    });
    if (!order) throw new NotFoundException('Recovery link is invalid or expired');
    if (!order.recoveryTokenExpiresAt || order.recoveryTokenExpiresAt.getTime() < Date.now()) {
      throw new BadRequestException('Recovery link has expired');
    }
    return { paymentOrderId: order.id, sessionId: order.sessionId };
  }
}
