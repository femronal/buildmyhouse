import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../email/email.service';
import { JoinWaitlistDto } from './dto/join-waitlist.dto';

const ALLOWED_PRODUCT_KEYS = new Set(['land-verification-checker']);

@Injectable()
export class WaitlistService {
  private readonly logger = new Logger(WaitlistService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly emailService: EmailService,
    private readonly config: ConfigService,
  ) {}

  async join(dto: JoinWaitlistDto) {
    const productKey = dto.productKey.trim().toLowerCase();
    if (!ALLOWED_PRODUCT_KEYS.has(productKey)) {
      throw new BadRequestException('Unknown waitlist product');
    }

    const email = dto.email.trim().toLowerCase();
    const fullName = dto.fullName?.trim() || null;
    const sourcePath = dto.sourcePath?.trim() || null;

    const existing = await this.prisma.waitlistSignup.findUnique({
      where: { productKey_email: { productKey, email } },
    });

    if (existing) {
      return {
        ok: true,
        alreadyJoined: true,
        message: 'You are already on this waitlist. We will email you when it launches.',
      };
    }

    const signup = await this.prisma.waitlistSignup.create({
      data: {
        productKey,
        email,
        fullName,
        sourcePath,
      },
    });

    void this.notifyTeam({
      productKey,
      email,
      fullName,
      sourcePath,
      signupId: signup.id,
    });

    return {
      ok: true,
      alreadyJoined: false,
      message: 'You are on the waitlist. We will email you when the Land Verification Checker launches.',
    };
  }

  async listAdmin(productKey?: string) {
    const key = productKey?.trim().toLowerCase();
    const items = await this.prisma.waitlistSignup.findMany({
      where: key ? { productKey: key } : undefined,
      orderBy: { createdAt: 'desc' },
      take: 500,
    });
    return {
      count: items.length,
      items,
    };
  }

  private async notifyTeam(input: {
    productKey: string;
    email: string;
    fullName: string | null;
    sourcePath: string | null;
    signupId: string;
  }) {
    const notifyTo =
      this.config.get<string>('WAITLIST_NOTIFY_EMAIL') ||
      this.config.get<string>('ADMIN_NOTIFY_EMAIL') ||
      this.config.get<string>('SUPPORT_EMAIL');

    if (!notifyTo) {
      this.logger.log(
        `Waitlist signup stored (${input.productKey}) for ${input.email}; no WAITLIST_NOTIFY_EMAIL configured`,
      );
      return;
    }

    const subject = `Waitlist signup: ${input.productKey}`;
    const html = `
      <p>New waitlist signup</p>
      <ul>
        <li><strong>Product:</strong> ${escapeHtml(input.productKey)}</li>
        <li><strong>Email:</strong> ${escapeHtml(input.email)}</li>
        <li><strong>Name:</strong> ${escapeHtml(input.fullName || '—')}</li>
        <li><strong>Source:</strong> ${escapeHtml(input.sourcePath || '—')}</li>
        <li><strong>ID:</strong> ${escapeHtml(input.signupId)}</li>
      </ul>
    `;

    try {
      await this.emailService.send({
        to: notifyTo,
        subject,
        html,
        text: `Waitlist signup (${input.productKey}): ${input.email}`,
      });
    } catch (error) {
      this.logger.warn(`Failed to notify team about waitlist signup: ${String(error)}`);
    }
  }
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
