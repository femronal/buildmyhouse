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
    const html =
      isGCWeeklyReminder
        ? GC_WEEKLY_VERIFICATION_REMINDER_TEMPLATE
        : isGCVerificationApproved
          ? this.buildGCVerificationApprovedHtml({
              contractorName: recipientName || 'Contractor',
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
      ? this.buildGCVerificationApprovedText({
          contractorName: recipientName || 'Contractor',
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

  private buildGCVerificationApprovedHtml(params: {
    contractorName: string;
    dashboardUrl: string;
  }): string {
    const safeName = this.escapeHtml(params.contractorName);
    const safeDashboardUrl = this.escapeHtml(params.dashboardUrl);

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>You’re Now a Verified Contractor on BuildMyHouse</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f4f4f5;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 640px; margin: 0 auto; padding: 24px;">
    <tr>
      <td style="background-color: #ffffff; border-radius: 10px; padding: 32px; box-shadow: 0 1px 3px rgba(0,0,0,0.08);">
        <h1 style="margin: 0 0 20px 0; font-size: 20px; font-weight: 700; color: #111827;">
          🎉 You’re Now a Verified Contractor on BuildMyHouse
        </h1>

        <p style="margin: 0 0 14px 0; color: #374151; font-size: 15px; line-height: 1.6;">
          Hi ${safeName},
        </p>
        <p style="margin: 0 0 14px 0; color: #374151; font-size: 15px; line-height: 1.6;">
          Congratulations — your BuildMyHouse contractor verification has been approved. ✅
        </p>
        <p style="margin: 0 0 20px 0; color: #374151; font-size: 15px; line-height: 1.6;">
          You are now officially a Verified General Contractor on BuildMyHouse and can begin receiving project opportunities from homeowners on the platform.
        </p>

        <h2 style="margin: 0 0 10px 0; font-size: 16px; color: #111827;">What this means</h2>
        <p style="margin: 0 0 12px 0; color: #374151; font-size: 15px; line-height: 1.7;">
          As a verified contractor, you can now:
        </p>
        <p style="margin: 0 0 6px 0; color: #374151; font-size: 15px; line-height: 1.7;">✔ Receive project requests from homeowners</p>
        <p style="margin: 0 0 6px 0; color: #374151; font-size: 15px; line-height: 1.7;">✔ Get matched with diaspora clients looking for trusted professionals</p>
        <p style="margin: 0 0 6px 0; color: #374151; font-size: 15px; line-height: 1.7;">✔ Participate in structured, stage-based projects</p>
        <p style="margin: 0 0 20px 0; color: #374151; font-size: 15px; line-height: 1.7;">✔ Build your reputation through completed work and verified progress updates</p>

        <h2 style="margin: 0 0 10px 0; font-size: 16px; color: #111827;">Important Reminder</h2>
        <p style="margin: 0 0 12px 0; color: #374151; font-size: 15px; line-height: 1.7;">
          BuildMyHouse is built around:
        </p>
        <p style="margin: 0 0 4px 0; color: #374151; font-size: 15px; line-height: 1.7;">professionalism,</p>
        <p style="margin: 0 0 4px 0; color: #374151; font-size: 15px; line-height: 1.7;">communication,</p>
        <p style="margin: 0 0 4px 0; color: #374151; font-size: 15px; line-height: 1.7;">clear stage progression,</p>
        <p style="margin: 0 0 12px 0; color: #374151; font-size: 15px; line-height: 1.7;">and accountability.</p>
        <p style="margin: 0 0 12px 0; color: #374151; font-size: 15px; line-height: 1.7;">
          Homeowners on the platform trust verified contractors to:
        </p>
        <p style="margin: 0 0 4px 0; color: #374151; font-size: 15px; line-height: 1.7;">communicate clearly,</p>
        <p style="margin: 0 0 4px 0; color: #374151; font-size: 15px; line-height: 1.7;">upload proper updates,</p>
        <p style="margin: 0 0 4px 0; color: #374151; font-size: 15px; line-height: 1.7;">respect timelines,</p>
        <p style="margin: 0 0 12px 0; color: #374151; font-size: 15px; line-height: 1.7;">and complete stages professionally before requesting payment approval.</p>
        <p style="margin: 0 0 20px 0; color: #374151; font-size: 15px; line-height: 1.7;">
          Your performance on the platform directly affects your visibility, future project opportunities, and homeowner trust.
        </p>

        <h2 style="margin: 0 0 10px 0; font-size: 16px; color: #111827;">What to do next</h2>
        <p style="margin: 0 0 4px 0; color: #374151; font-size: 15px; line-height: 1.7;">👉 Log in to your contractor dashboard</p>
        <p style="margin: 0 0 4px 0; color: #374151; font-size: 15px; line-height: 1.7;">👉 Complete any remaining setup</p>
        <p style="margin: 0 0 4px 0; color: #374151; font-size: 15px; line-height: 1.7;">👉 Keep your specialties and portfolio updated</p>
        <p style="margin: 0 0 18px 0; color: #374151; font-size: 15px; line-height: 1.7;">👉 Turn on notifications so you never miss a project request</p>

        <p style="margin: 0 0 10px 0; color: #374151; font-size: 15px; line-height: 1.7;">
          Access your dashboard here:
        </p>
        <a
          href="${safeDashboardUrl}"
          target="_blank"
          rel="noopener noreferrer"
          style="display:inline-block;margin:0 0 20px 0;padding:12px 20px;background:#111827;color:#ffffff;text-decoration:none;border-radius:999px;font-size:14px;font-weight:600;"
        >
          Open Contractor Dashboard
        </a>

        <p style="margin: 0 0 12px 0; color: #374151; font-size: 15px; line-height: 1.7;">Welcome to BuildMyHouse.</p>
        <p style="margin: 0 0 16px 0; color: #374151; font-size: 15px; line-height: 1.7;">
          We’re excited to have you as part of a new generation of contractors helping make property work in Nigeria more structured, transparent, and trustworthy.
        </p>
        <p style="margin: 0; color: #6b7280; font-size: 13px; line-height: 1.6;">
          — The BuildMyHouse Team<br>
          Manage property work in Nigeria with more structure, visibility, and control.
        </p>
      </td>
    </tr>
  </table>
</body>
</html>
    `.trim();
  }

  private buildGCVerificationApprovedText(params: {
    contractorName: string;
    dashboardUrl: string;
  }): string {
    return `Hi ${params.contractorName},

Congratulations — your BuildMyHouse contractor verification has been approved. ✅

You are now officially a Verified General Contractor on BuildMyHouse and can begin receiving project opportunities from homeowners on the platform.

What this means

As a verified contractor, you can now:
✔ Receive project requests from homeowners
✔ Get matched with diaspora clients looking for trusted professionals
✔ Participate in structured, stage-based projects
✔ Build your reputation through completed work and verified progress updates

Important Reminder

BuildMyHouse is built around:
professionalism,
communication,
clear stage progression,
and accountability.

Homeowners on the platform trust verified contractors to:
communicate clearly,
upload proper updates,
respect timelines,
and complete stages professionally before requesting payment approval.

Your performance on the platform directly affects:
your visibility,
future project opportunities,
and homeowner trust.

What to do next

👉 Log in to your contractor dashboard
👉 Complete any remaining setup
👉 Keep your specialties and portfolio updated
👉 Turn on notifications so you never miss a project request

Access your dashboard here:
Open Contractor Dashboard: ${params.dashboardUrl}

Welcome to BuildMyHouse.

We’re excited to have you as part of a new generation of contractors helping make property work in Nigeria more structured, transparent, and trustworthy.

—
The BuildMyHouse Team
Manage property work in Nigeria with more structure, visibility, and control.`;
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
