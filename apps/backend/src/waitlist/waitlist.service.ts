import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../email/email.service';
import { CreateWaitlistDto, UpdateWaitlistDto } from './dto/admin-waitlist.dto';
import { JoinWaitlistDto } from './dto/join-waitlist.dto';
import { slugifyWaitlistKey } from './waitlist.constants';

const DEFAULT_WAITLIST = {
  key: 'land-verification-checker',
  name: 'Land Verification Checker',
  purpose: 'tool',
  description: 'Email capture for the upcoming Land Verification Checker.',
  pagePath: '/land-verification-in-nigeria-guide',
};

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
    const waitlist = await this.resolveActiveWaitlist(productKey);

    const email = dto.email.trim().toLowerCase();
    const fullName = dto.fullName?.trim() || null;
    const sourcePath = dto.sourcePath?.trim() || waitlist.pagePath || null;

    const existing = await this.prisma.waitlistSignup.findUnique({
      where: { productKey_email: { productKey, email } },
    });

    if (existing) {
      return {
        ok: true,
        alreadyJoined: true,
        message: `You are already on this waitlist. We will email you about ${waitlist.name}.`,
      };
    }

    const signup = await this.prisma.waitlistSignup.create({
      data: {
        waitlistId: waitlist.id,
        productKey,
        email,
        fullName,
        sourcePath,
      },
    });

    void this.notifyTeam({
      productKey,
      waitlistName: waitlist.name,
      purpose: waitlist.purpose,
      email,
      fullName,
      sourcePath,
      signupId: signup.id,
    });

    return {
      ok: true,
      alreadyJoined: false,
      message: `You are on the waitlist. We will email you about ${waitlist.name}.`,
    };
  }

  async listAdmin(productKey?: string) {
    await this.ensureDefaultWaitlist();
    const key = productKey?.trim().toLowerCase();
    const items = await this.prisma.waitlistSignup.findMany({
      where: key ? { productKey: key } : undefined,
      include: { waitlist: true },
      orderBy: { createdAt: 'desc' },
      take: 500,
    });
    return {
      count: items.length,
      items: items.map((item) => ({
        id: item.id,
        productKey: item.productKey,
        email: item.email,
        fullName: item.fullName,
        sourcePath: item.sourcePath,
        createdAt: item.createdAt,
        waitlistName: item.waitlist?.name || item.productKey,
        purpose: item.waitlist?.purpose || 'other',
        pagePath: item.waitlist?.pagePath || item.sourcePath,
      })),
    };
  }

  async listPeople() {
    await this.ensureDefaultWaitlist();
    const items = await this.prisma.waitlistSignup.findMany({
      include: { waitlist: true },
      orderBy: { createdAt: 'desc' },
      take: 1000,
    });

    const byEmail = new Map<
      string,
      {
        email: string;
        fullName: string | null;
        joinedAt: Date;
        purposes: {
          waitlistName: string;
          purpose: string;
          productKey: string;
          pagePath: string | null;
          createdAt: Date;
        }[];
      }
    >();

    for (const item of items) {
      const current = byEmail.get(item.email) || {
        email: item.email,
        fullName: item.fullName,
        joinedAt: item.createdAt,
        purposes: [],
      };
      if (item.fullName && !current.fullName) current.fullName = item.fullName;
      if (item.createdAt < current.joinedAt) current.joinedAt = item.createdAt;
      current.purposes.push({
        waitlistName: item.waitlist?.name || item.productKey,
        purpose: item.waitlist?.purpose || 'other',
        productKey: item.productKey,
        pagePath: item.waitlist?.pagePath || item.sourcePath,
        createdAt: item.createdAt,
      });
      byEmail.set(item.email, current);
    }

    return {
      count: byEmail.size,
      items: [...byEmail.values()].sort((a, b) => b.joinedAt.getTime() - a.joinedAt.getTime()),
    };
  }

  async listWaitlists() {
    await this.ensureDefaultWaitlist();
    const lists = await this.prisma.waitlist.findMany({
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { signups: true } } },
    });
    return {
      items: lists.map((list) => ({
        id: list.id,
        key: list.key,
        name: list.name,
        purpose: list.purpose,
        description: list.description,
        pagePath: list.pagePath,
        isActive: list.isActive,
        signupCount: list._count.signups,
        createdAt: list.createdAt,
      })),
    };
  }

  async createWaitlist(dto: CreateWaitlistDto) {
    const name = dto.name.trim();
    const key = slugifyWaitlistKey(dto.key || name);
    if (!key) {
      throw new BadRequestException('Give this waitlist a name we can turn into a key.');
    }

    const existing = await this.prisma.waitlist.findUnique({ where: { key } });
    if (existing) {
      throw new BadRequestException('A waitlist with this key already exists.');
    }

    const waitlist = await this.prisma.waitlist.create({
      data: {
        key,
        name,
        purpose: dto.purpose,
        description: dto.description?.trim() || null,
        pagePath: normalizePagePath(dto.pagePath),
      },
    });

    return waitlist;
  }

  async updateWaitlist(id: string, dto: UpdateWaitlistDto) {
    const existing = await this.prisma.waitlist.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('Waitlist not found');
    }

    return this.prisma.waitlist.update({
      where: { id },
      data: {
        ...(dto.name !== undefined ? { name: dto.name.trim() } : {}),
        ...(dto.purpose !== undefined ? { purpose: dto.purpose } : {}),
        ...(dto.description !== undefined ? { description: dto.description.trim() || null } : {}),
        ...(dto.pagePath !== undefined ? { pagePath: normalizePagePath(dto.pagePath) } : {}),
        ...(dto.isActive !== undefined ? { isActive: dto.isActive } : {}),
      },
    });
  }

  private async resolveActiveWaitlist(productKey: string) {
    await this.ensureDefaultWaitlist();
    const waitlist = await this.prisma.waitlist.findUnique({ where: { key: productKey } });
    if (!waitlist || !waitlist.isActive) {
      throw new BadRequestException('Unknown waitlist');
    }
    return waitlist;
  }

  private async ensureDefaultWaitlist() {
    const existing = await this.prisma.waitlist.findUnique({
      where: { key: DEFAULT_WAITLIST.key },
    });
    if (existing) {
      await this.prisma.waitlistSignup.updateMany({
        where: { productKey: DEFAULT_WAITLIST.key, waitlistId: null },
        data: { waitlistId: existing.id },
      });
      return existing;
    }

    const created = await this.prisma.waitlist.create({ data: DEFAULT_WAITLIST });
    await this.prisma.waitlistSignup.updateMany({
      where: { productKey: DEFAULT_WAITLIST.key, waitlistId: null },
      data: { waitlistId: created.id },
    });
    return created;
  }

  private async notifyTeam(input: {
    productKey: string;
    waitlistName: string;
    purpose: string;
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

    const subject = `Waitlist signup: ${input.waitlistName}`;
    const html = `
      <p>New waitlist signup</p>
      <ul>
        <li><strong>Waitlist:</strong> ${escapeHtml(input.waitlistName)}</li>
        <li><strong>Purpose:</strong> ${escapeHtml(input.purpose)}</li>
        <li><strong>Key:</strong> ${escapeHtml(input.productKey)}</li>
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
        text: `Waitlist signup (${input.waitlistName}): ${input.email}`,
      });
    } catch (error) {
      this.logger.warn(`Failed to notify team about waitlist signup: ${String(error)}`);
    }
  }
}

function normalizePagePath(value?: string | null) {
  const trimmed = value?.trim();
  if (!trimmed) return null;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
