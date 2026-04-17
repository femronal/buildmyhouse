import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';
import { GC_WEEKLY_VERIFICATION_REMINDER_TEMPLATE } from './templates/gc-weekly-verification-reminder.template';

export interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
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
    notificationType?: string;
    title: string;
    message: string;
    data?: Record<string, unknown>;
  }): Promise<boolean> {
    const { to, recipientName, notificationType, title, message } = params;

    const isGCWeeklyReminder = notificationType === 'gc_verification_weekly_reminder';
    const html =
      isGCWeeklyReminder
        ? GC_WEEKLY_VERIFICATION_REMINDER_TEMPLATE
        : this.buildNotificationHtml({
            recipientName: recipientName || 'User',
            title,
            message,
          });
    const subject = isGCWeeklyReminder
      ? 'You’re leaving money on the table.'
      : `BuildMyHouse: ${title}`;

    return this.send({
      to,
      subject,
      html,
      text: `${title}\n\n${message}`,
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

  private buildNotificationHtml(params: {
    recipientName: string;
    title: string;
    message: string;
  }): string {
    const { recipientName, title, message } = params;
    const safeTitle = this.escapeHtml(title);
    const safeMessage = this.escapeHtml(message).replace(/\n/g, '<br>');
    const safeName = this.escapeHtml(recipientName);

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
}
