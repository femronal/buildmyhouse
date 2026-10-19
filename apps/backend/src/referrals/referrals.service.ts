import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Prisma, ReferrerType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AttachReferrerDto, CreateReferrerDto, UpdateReferralProgramDto, UpdateReferrerDto } from './dto/referrals.dto';
import { assertCustomReferralCode, normalizeReferralCode, randomReferralCode } from './referral-code';

const LIST_CAP = 200;
const SETTINGS_ID = 'default';

type MetricRow = {
  listingsCount: number;
  artisanListingsCount: number;
  professionalListingsCount: number;
  jobsCount: number;
  leadsCount: number;
  paidJobsCount: number;
  completedJobsCount: number;
  firstReferralAt: Date | null;
  lastReferralAt: Date | null;
};

@Injectable()
export class ReferralsService {
  private readonly logger = new Logger(ReferralsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getSettings() {
    const existing = await this.prisma.referralProgramSettings.findUnique({ where: { id: SETTINGS_ID } });
    if (existing) return existing;
    return this.prisma.referralProgramSettings.create({
      data: {
        id: SETTINGS_ID,
        allowHomeownerTypedCode: false,
        linkValidityDays: 30,
        attributionRule: 'first_touch',
        trackVendors: false,
        countsWhen: 'undecided',
      },
    });
  }

  async updateSettings(dto: UpdateReferralProgramDto) {
    await this.getSettings();
    return this.prisma.referralProgramSettings.update({
      where: { id: SETTINGS_ID },
      data: {
        allowHomeownerTypedCode: dto.allowHomeownerTypedCode,
        linkValidityDays: dto.linkValidityDays,
        attributionRule: dto.attributionRule,
        trackVendors: dto.trackVendors,
        countsWhen: dto.countsWhen,
        payoutRules: dto.payoutRules !== undefined ? blankToNull(dto.payoutRules) : undefined,
      },
    });
  }

  async publicProgram() {
    const settings = await this.getSettings();
    return {
      allowHomeownerTypedCode: settings.allowHomeownerTypedCode,
      linkValidityDays: settings.linkValidityDays,
      attributionRule: settings.attributionRule,
    };
  }

  async list(query: { type?: string; q?: string; includeArchived?: string }) {
    const where: Prisma.ReferrerWhereInput = {};
    if (query.type === 'referrer' || query.type === 'affiliate') where.type = query.type;
    if (query.includeArchived !== 'true') where.archivedAt = null;
    const q = String(query.q || '').trim();
    if (q) {
      where.OR = [
        { name: { contains: q, mode: 'insensitive' } },
        { code: { contains: q.toUpperCase(), mode: 'insensitive' } },
        { phone: { contains: q, mode: 'insensitive' } },
        { whatsapp: { contains: q, mode: 'insensitive' } },
      ];
    }
    const rows = await this.prisma.referrer.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 500,
    });
    const metrics = await this.metricsFor(rows.map((row) => row.id));
    return rows.map((row) => ({
      id: row.id,
      type: row.type,
      name: row.name,
      code: row.code,
      phone: row.phone,
      whatsapp: row.whatsapp,
      email: row.email,
      userId: row.userId,
      createdAt: row.createdAt,
      archivedAt: row.archivedAt,
      ...(metrics.get(row.id) || emptyMetrics()),
    }));
  }

  async summary() {
    const active = await this.prisma.referrer.findMany({
      where: { archivedAt: null },
      select: { id: true },
    });
    const ids = active.map((row) => row.id);
    const metrics = await this.metricsFor(ids);
    const totals = emptyMetrics();
    for (const row of metrics.values()) {
      totals.listingsCount += row.listingsCount;
      totals.artisanListingsCount += row.artisanListingsCount;
      totals.professionalListingsCount += row.professionalListingsCount;
      totals.jobsCount += row.jobsCount;
      totals.leadsCount += row.leadsCount;
      totals.paidJobsCount += row.paidJobsCount;
      totals.completedJobsCount += row.completedJobsCount;
    }
    const settings = await this.getSettings();
    const [projectsWithoutReferrer, artisanListingsWithoutReferrer, professionalListingsWithoutReferrer, vendorsWithoutReferrer] =
      await Promise.all([
        this.prisma.project.count({ where: { referrerId: null, archivedAt: null } }),
        this.prisma.artisanListing.count({ where: { referrerId: null, archivedAt: null } }),
        this.prisma.professionalListing.count({ where: { referrerId: null, archivedAt: null } }),
        settings.trackVendors
          ? this.prisma.vendorProfile.count({ where: { referrerId: null, deletedAt: null } })
          : Promise.resolve(0),
      ]);
    return {
      listingsCount: totals.listingsCount,
      jobsCount: totals.jobsCount,
      paidJobsCount: totals.paidJobsCount,
      completedJobsCount: totals.completedJobsCount,
      projectsWithoutReferrer,
      listingsWithoutReferrer: artisanListingsWithoutReferrer + professionalListingsWithoutReferrer + vendorsWithoutReferrer,
      countsWhen: settings.countsWhen,
    };
  }

  async detail(id: string) {
    const row = await this.prisma.referrer.findUnique({ where: { id } });
    if (!row) throw new NotFoundException('Referrer not found');
    const metrics = await this.metricsFor([id]);
    const settings = await this.getSettings();
    const [artisans, professionals, projects, leads, vendors] = await Promise.all([
      this.prisma.artisanListing.findMany({
        where: { referrerId: id },
        orderBy: { createdAt: 'desc' },
        take: LIST_CAP,
        select: {
          id: true,
          displayName: true,
          slug: true,
          state: true,
          claimStatus: true,
          createdAt: true,
        },
      }),
      this.prisma.professionalListing.findMany({
        where: { referrerId: id },
        orderBy: { createdAt: 'desc' },
        take: LIST_CAP,
        select: {
          id: true,
          displayName: true,
          slug: true,
          state: true,
          ownershipStatus: true,
          createdAt: true,
        },
      }),
      this.prisma.project.findMany({
        where: { referrerId: id, archivedAt: null },
        orderBy: { createdAt: 'desc' },
        take: LIST_CAP,
        select: {
          id: true,
          name: true,
          state: true,
          status: true,
          paymentConfirmationStatus: true,
          referralSource: true,
          createdAt: true,
          payments: { where: { status: 'completed' }, select: { id: true }, take: 1 },
        },
      }),
      this.prisma.startRequest.findMany({
        where: { referrerId: id },
        orderBy: { createdAt: 'desc' },
        take: LIST_CAP,
        select: { reference: true, path: true, createdAt: true },
      }),
      settings.trackVendors
        ? this.prisma.vendorProfile.findMany({
            where: { referrerId: id, deletedAt: null },
            orderBy: { createdAt: 'desc' },
            take: LIST_CAP,
            select: { id: true, tradingName: true, slug: true, stateLabel: true, claimStatus: true, createdAt: true },
          })
        : Promise.resolve([]),
    ]);
    return {
      ...row,
      shareUrl: this.shareUrl(row.code),
      ...(metrics.get(id) || emptyMetrics()),
      listings: [
        ...artisans.map((item) => ({
          id: item.id,
          kind: 'artisan' as const,
          displayName: item.displayName,
          slug: item.slug,
          state: item.state,
          claimStatus: item.claimStatus,
          createdAt: item.createdAt,
        })),
        ...professionals.map((item) => ({
          id: item.id,
          kind: 'professional' as const,
          displayName: item.displayName,
          slug: item.slug,
          state: item.state,
          claimStatus: item.ownershipStatus,
          createdAt: item.createdAt,
        })),
        ...vendors.map((item) => ({
          id: item.id,
          kind: 'vendor' as const,
          displayName: item.tradingName,
          slug: item.slug,
          state: item.stateLabel,
          claimStatus: item.claimStatus,
          createdAt: item.createdAt,
        })),
      ]
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
        .slice(0, LIST_CAP),
      projects: projects.map((project) => ({
        id: project.id,
        name: project.name,
        state: project.state,
        status: project.status,
        paymentConfirmationStatus: project.paymentConfirmationStatus,
        paid: project.paymentConfirmationStatus === 'confirmed' || project.payments.length > 0,
        referralSource: project.referralSource,
        createdAt: project.createdAt,
      })),
      startRequests: leads,
    };
  }

  async create(adminUserId: string, dto: CreateReferrerDto) {
    const code = dto.code?.trim() ? assertCustomReferralCode(dto.code) : await this.generateUniqueCode();
    try {
      return await this.prisma.referrer.create({
        data: {
          type: dto.type as ReferrerType,
          name: dto.name.trim(),
          phone: blankToNull(dto.phone),
          whatsapp: blankToNull(dto.whatsapp),
          email: blankToNull(dto.email),
          code,
          notes: blankToNull(dto.notes),
          createdByAdminId: adminUserId || null,
        },
      });
    } catch (error) {
      throw this.asCodeTaken(error);
    }
  }

  async update(id: string, dto: UpdateReferrerDto) {
    const existing = await this.prisma.referrer.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Referrer not found');
    const code = dto.code?.trim() ? assertCustomReferralCode(dto.code) : undefined;
    try {
      return await this.prisma.referrer.update({
        where: { id },
        data: {
          type: dto.type as ReferrerType | undefined,
          name: dto.name?.trim(),
          phone: dto.phone !== undefined ? blankToNull(dto.phone) : undefined,
          whatsapp: dto.whatsapp !== undefined ? blankToNull(dto.whatsapp) : undefined,
          email: dto.email !== undefined ? blankToNull(dto.email) : undefined,
          code,
          notes: dto.notes !== undefined ? blankToNull(dto.notes) : undefined,
          archivedAt: dto.archived === undefined ? undefined : dto.archived ? new Date() : null,
        },
      });
    } catch (error) {
      throw this.asCodeTaken(error);
    }
  }

  async attach(dto: AttachReferrerDto) {
    if (dto.referrerId) {
      const referrer = await this.prisma.referrer.findUnique({ where: { id: dto.referrerId } });
      if (!referrer || referrer.archivedAt) throw new BadRequestException('Choose an active referrer.');
    }
    const referrerId = dto.referrerId || null;
    if (dto.targetType === 'project') {
      const project = await this.prisma.project.findUnique({ where: { id: dto.targetId } });
      if (!project) throw new NotFoundException('Project not found');
      return this.prisma.project.update({
        where: { id: dto.targetId },
        data: referrerId
          ? { referrerId, referralSource: 'admin', referredAt: new Date() }
          : { referrerId: null, referralSource: null, referredAt: null },
        select: { id: true, referrerId: true },
      });
    }
    if (dto.targetType === 'artisan_listing') {
      return this.prisma.artisanListing.update({
        where: { id: dto.targetId },
        data: { referrerId },
        select: { id: true, referrerId: true },
      });
    }
    if (dto.targetType === 'vendor') {
      const settings = await this.getSettings();
      if (!settings.trackVendors) {
        throw new BadRequestException('Vendor tracking is turned off. Turn it on in referral rules.');
      }
      return this.prisma.vendorProfile.update({
        where: { id: dto.targetId },
        data: { referrerId },
        select: { id: true, referrerId: true },
      });
    }
    return this.prisma.professionalListing.update({
      where: { id: dto.targetId },
      data: { referrerId },
      select: { id: true, referrerId: true },
    });
  }

  async searchTargets(targetType: string, q: string) {
    const query = q.trim();
    if (query.length < 2) return [];
    if (targetType === 'project') {
      const rows = await this.prisma.project.findMany({
        where: { archivedAt: null, name: { contains: query, mode: 'insensitive' } },
        take: 20,
        select: { id: true, name: true },
      });
      return rows.map((row) => ({ id: row.id, label: row.name }));
    }
    if (targetType === 'vendor') {
      const settings = await this.getSettings();
      if (!settings.trackVendors) return [];
      const rows = await this.prisma.vendorProfile.findMany({
        where: { deletedAt: null, tradingName: { contains: query, mode: 'insensitive' } },
        take: 20,
        select: { id: true, tradingName: true },
      });
      return rows.map((row) => ({ id: row.id, label: row.tradingName }));
    }
    if (targetType === 'artisan_listing') {
      const rows = await this.prisma.artisanListing.findMany({
        where: { archivedAt: null, displayName: { contains: query, mode: 'insensitive' } },
        take: 20,
        select: { id: true, displayName: true },
      });
      return rows.map((row) => ({ id: row.id, label: row.displayName }));
    }
    const rows = await this.prisma.professionalListing.findMany({
      where: { archivedAt: null, displayName: { contains: query, mode: 'insensitive' } },
      take: 20,
      select: { id: true, displayName: true },
    });
    return rows.map((row) => ({ id: row.id, label: row.displayName }));
  }

  async codeValidity(code: string) {
    const resolved = await this.resolveActiveReferrer(code);
    return { valid: !!resolved };
  }

  async mine(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, fullName: true, contractorProfile: { select: { name: true } } },
    });
    if (!user) throw new NotFoundException('User not found');
    let referrer = await this.prisma.referrer.findUnique({ where: { userId } });
    if (!referrer) {
      referrer = await this.prisma.referrer.create({
        data: {
          type: 'referrer',
          userId,
          name: user.contractorProfile?.name || user.fullName || 'BuildMyHouse contractor',
          code: await this.generateUniqueCode(),
        },
      });
    }
    const [projects, leads] = await Promise.all([
      this.prisma.project.count({ where: { referrerId: referrer.id, archivedAt: null } }),
      this.prisma.startRequest.count({ where: { referrerId: referrer.id } }),
    ]);
    const shareUrl = await this.shareUrlForUser(userId, referrer.code);
    return {
      code: referrer.code,
      shareUrl,
      clientsJoinedCount: projects + leads,
    };
  }

  async markInvitePromptSeen(userId: string) {
    await this.prisma.user.update({
      where: { id: userId },
      data: { inviteClientPromptSeenAt: new Date() },
    });
    return { ok: true };
  }

  async resolveActiveReferrer(code?: string | null) {
    const normalized = normalizeReferralCode(code);
    if (!normalized) return null;
    const row = await this.prisma.referrer.findUnique({ where: { code: normalized } });
    if (!row || row.archivedAt) return null;
    return { id: row.id, userId: row.userId };
  }

  async referralFieldsForNewProject(homeownerId: string, code?: string | null, source?: string | null) {
    try {
      const resolved = await this.resolveActiveReferrer(code);
      if (!resolved) return {};
      if (resolved.userId && resolved.userId === homeownerId) return {};
      return {
        referrerId: resolved.id,
        referredAt: new Date(),
        referralSource: source === 'code_entered' ? 'code_entered' : 'link',
      };
    } catch (error) {
      this.logger.error(`referral attach skipped message=${error instanceof Error ? error.message : 'unknown'}`);
      return {};
    }
  }

  async referralIdForLead(code?: string | null) {
    try {
      const resolved = await this.resolveActiveReferrer(code);
      return resolved?.id || null;
    } catch (error) {
      this.logger.error(`lead referral skipped message=${error instanceof Error ? error.message : 'unknown'}`);
      return null;
    }
  }

  async generateUniqueCode() {
    for (let attempt = 0; attempt < 8; attempt += 1) {
      const code = randomReferralCode();
      const existing = await this.prisma.referrer.findUnique({ where: { code }, select: { id: true } });
      if (!existing) return code;
    }
    throw new BadRequestException('Could not generate a referral code. Try again.');
  }

  private shareUrl(code: string) {
    return `${this.homeownerWeb()}/start?ref=${code}`;
  }

  private async shareUrlForUser(userId: string, code: string) {
    const artisan = await this.prisma.artisanListing.findFirst({
      where: { linkedUserId: userId, archivedAt: null, listingStatus: 'listed' },
      orderBy: { claimedAt: 'desc' },
      select: { slug: true },
    });
    if (artisan?.slug) return `${this.homeownerWeb()}/artisans/${artisan.slug}?ref=${code}`;
    const professional = await this.prisma.professionalListing.findFirst({
      where: {
        archivedAt: null,
        listingStatus: 'listed',
        OR: [{ claimedByUserId: userId }, { linkedUserId: userId }],
      },
      orderBy: { claimedAt: 'desc' },
      select: { slug: true },
    });
    if (professional?.slug) return `${this.homeownerWeb()}/professionals/${professional.slug}?ref=${code}`;
    return this.shareUrl(code);
  }

  private homeownerWeb() {
    return String(process.env.HOMEOWNER_APP_URL || 'https://buildmyhouse.app').replace(/\/+$/, '');
  }

  private async metricsFor(ids: string[]): Promise<Map<string, MetricRow>> {
    const map = new Map<string, MetricRow>();
    for (const id of ids) map.set(id, emptyMetrics());
    if (!ids.length) return map;
    const whereIds = { in: ids };
    const [artisans, professionals, jobs, leads, paid, completed] = await Promise.all([
      this.prisma.artisanListing.groupBy({
        by: ['referrerId'],
        where: { referrerId: whereIds },
        _count: { _all: true },
        _min: { createdAt: true },
        _max: { createdAt: true },
      }),
      this.prisma.professionalListing.groupBy({
        by: ['referrerId'],
        where: { referrerId: whereIds },
        _count: { _all: true },
        _min: { createdAt: true },
        _max: { createdAt: true },
      }),
      this.prisma.project.groupBy({
        by: ['referrerId'],
        where: { referrerId: whereIds, archivedAt: null },
        _count: { _all: true },
        _min: { createdAt: true },
        _max: { createdAt: true },
      }),
      this.prisma.startRequest.groupBy({
        by: ['referrerId'],
        where: { referrerId: whereIds },
        _count: { _all: true },
        _min: { createdAt: true },
        _max: { createdAt: true },
      }),
      this.prisma.project.findMany({
        where: {
          referrerId: whereIds,
          archivedAt: null,
          OR: [
            { paymentConfirmationStatus: 'confirmed' },
            { payments: { some: { status: 'completed' } } },
          ],
        },
        select: { id: true, referrerId: true },
      }),
      this.prisma.project.groupBy({
        by: ['referrerId'],
        where: { referrerId: whereIds, archivedAt: null, status: 'completed' },
        _count: { _all: true },
      }),
    ]);

    const bump = (id: string | null, count: number, first?: Date | null, last?: Date | null) => {
      if (!id || !map.has(id)) return;
      const row = map.get(id)!;
      row.firstReferralAt = earlier(row.firstReferralAt, first);
      row.lastReferralAt = later(row.lastReferralAt, last);
      return row;
    };

    for (const row of artisans) {
      const target = bump(row.referrerId, row._count._all, row._min.createdAt, row._max.createdAt);
      if (target) {
        target.artisanListingsCount += row._count._all;
        target.listingsCount += row._count._all;
      }
    }
    for (const row of professionals) {
      const target = bump(row.referrerId, row._count._all, row._min.createdAt, row._max.createdAt);
      if (target) {
        target.professionalListingsCount += row._count._all;
        target.listingsCount += row._count._all;
      }
    }
    const settings = await this.getSettings();
    if (settings.trackVendors) {
      const vendors = await this.prisma.vendorProfile.groupBy({
        by: ['referrerId'],
        where: { referrerId: whereIds, deletedAt: null },
        _count: { _all: true },
        _min: { createdAt: true },
        _max: { createdAt: true },
      });
      for (const row of vendors) {
        const target = bump(row.referrerId, row._count._all, row._min.createdAt, row._max.createdAt);
        if (target) target.listingsCount += row._count._all;
      }
    }
    for (const row of jobs) {
      const target = bump(row.referrerId, row._count._all, row._min.createdAt, row._max.createdAt);
      if (target) target.jobsCount += row._count._all;
    }
    for (const row of leads) {
      const target = bump(row.referrerId, row._count._all, row._min.createdAt, row._max.createdAt);
      if (target) target.leadsCount += row._count._all;
    }
    const paidSeen = new Set<string>();
    for (const project of paid) {
      if (!project.referrerId || paidSeen.has(project.id)) continue;
      paidSeen.add(project.id);
      const target = map.get(project.referrerId);
      if (target) target.paidJobsCount += 1;
    }
    for (const row of completed) {
      const target = row.referrerId ? map.get(row.referrerId) : undefined;
      if (target) target.completedJobsCount += row._count._all;
    }
    return map;
  }

  private asCodeTaken(error: unknown) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return new BadRequestException('That code is already taken');
    }
    return error;
  }
}

function emptyMetrics(): MetricRow {
  return {
    listingsCount: 0,
    artisanListingsCount: 0,
    professionalListingsCount: 0,
    jobsCount: 0,
    leadsCount: 0,
    paidJobsCount: 0,
    completedJobsCount: 0,
    firstReferralAt: null,
    lastReferralAt: null,
  };
}

function earlier(current: Date | null, next?: Date | null) {
  if (!next) return current;
  if (!current || next < current) return next;
  return current;
}

function later(current: Date | null, next?: Date | null) {
  if (!next) return current;
  if (!current || next > current) return next;
  return current;
}

function blankToNull(value?: string | null) {
  const trimmed = String(value || '').trim();
  return trimmed || null;
}
