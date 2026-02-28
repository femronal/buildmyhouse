import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';

export interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly resend: Resend | null = null;
  private readonly from: string;
  private readonly enabled: boolean;

  constructor(private readonly config: ConfigService) {
    const apiKey = this.config.get<string>('RESEND_API_KEY');
    this.from =
      this.config.get<string>('EMAIL_FROM') ||
      'BuildMyHouse <onboarding@resend.dev>';
    this.enabled = !!apiKey;

    if (apiKey) {
      this.resend = new Resend(apiKey);
      this.logger.log('Email service initialized with Resend');
    } else {
      this.logger.warn(
        'RESEND_API_KEY not set - email notifications will be skipped',
      );
    }
  }

  async send(options: SendEmailOptions): Promise<boolean> {
    if (!this.enabled || !this.resend) {
      this.logger.warn('Email send skipped: RESEND_API_KEY not configured');
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

  /**
   * Send a notification email (used by NotificationsService)
   */
  async sendNotificationEmail(params: {
    to: string;
    recipientName?: string;
    title: string;
    message: string;
    data?: Record<string, unknown>;
  }): Promise<boolean> {
    const { to, recipientName, title, message } = params;

    const html = this.buildNotificationHtml({
      recipientName: recipientName || 'User',
      title,
      message,
    });

    return this.send({
      to,
      subject: `BuildMyHouse: ${title}`,
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
