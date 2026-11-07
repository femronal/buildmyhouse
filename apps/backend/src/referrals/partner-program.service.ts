import { BadRequestException, Injectable, Logger, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Prisma } from '@prisma/client';
import { createHash, randomBytes } from 'crypto';
import { EmailService } from '../email/email.service';
import { JwtAuthService } from '../auth/jwt-auth.service';
import { PrismaService } from '../prisma/prisma.service';
import {
  CONTROLLING_FEE_RATE,
  DEFAULT_AFFILIATE_RATE_BPS,
  DISCLOSURE,
  FOUNDING_AGREEMENT_VERSION,
  commissionExample,
  decideCommission,
  maskHomeownerName,
  pipelineStage,
} from './commission-math';
import { normalizeReferralCode, randomReferralCode } from './referral-code';

const AFFILIATE_RULE_ID = '11111111-1111-4111-8111-111111111111';
const REFERRER_RULE_ID = '22222222-2222-4222-8222-222222222222';
const LOGIN_TTL_MS = 30 * 60 * 1000;

const CAMPAIGNS = [
  {
    id: '33333333-3333-4333-8333-333333333333',
    slug: 'price-checker',
    title: 'Price Checker',
    audience: 'Homeowners comparing material prices',
    problem: 'People pay for cement, rods or roofing materials without knowing what the market is charging.',
    promise: 'Check what the market is saying before you pay.',
    destinationPath: '/tools/price-checker',
    caption: 'Before paying for cement, rods or roofing materials, check what the market is saying.',
    sortOrder: 1,
  },
  {
    id: '44444444-4444-4444-8444-444444444444',
    slug: 'renovation-budget',
    title: 'Renovation Budget Planner',
    audience: 'People renovating a family house',
    problem: 'Renovation costs are unclear before the work starts.',
    promise: 'Understand what the work may cost before you commit.',
    destinationPath: '/tools/renovation-budget-planner',
    caption: 'Want to renovate your family house in Nigeria? Start by understanding what the work may cost.',
    sortOrder: 2,
  },
  {
    id: '55555555-5555-4555-8555-555555555555',
    slug: 'milestone-payments',
    title: 'Milestone Payment Schedule',
    audience: 'Nigerians funding construction from abroad',
    problem: 'Money is sent before it is clear what should be finished first.',
    promise: 'Work out what should be completed before the next payment.',
    destinationPath: '/tools/milestone-payment-schedule',
    caption: 'Before sending the next payment, work out what should be completed first.',
    sortOrder: 3,
  },
] as const;

type LockSource = 'link' | 'code_entered' | 'admin';

@Injectable()
export class PartnerProgramService {
  private readonly logger = new Logger(PartnerProgramService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly email: EmailService,
    private readonly jwt: JwtAuthService,
    private readonly config: ConfigService,
  ) {}

  async ensureDefaults() {
    const now = new Date();
    await this.prisma.referralProgramRule.upsert({
      where: { id: AFFILIATE_RULE_ID },
      update: {},
      create: {
        id: AFFILIATE_RULE_ID,
        program: 'affiliate',
        version: 1,
        status: 'published',
        rateBps: DEFAULT_AFFILIATE_RATE_BPS,
        rateBase: 'contractor_amount',
        fundingSource: 'controlling_fee',
        contingencyExcluded: true,
        clickWindowDays: 30,
        attributionRule: 'first_touch',
        lifetime: true,
        rewardKind: 'percent',
        publishedAt: now,
        updatedAt: now,
      },
    });
    await this.prisma.referralProgramRule.upsert({
      where: { id: REFERRER_RULE_ID },
      update: {},
      create: {
        id: REFERRER_RULE_ID,
        program: 'referrer',
        version: 1,
        status: 'draft',
        rateBase: 'contractor_amount',
        fundingSource: 'unpublished',
        contingencyExcluded: true,
        clickWindowDays: 30,
        attributionRule: 'first_touch',
        lifetime: false,
        rewardKind: 'unpublished',
        updatedAt: now,
      },
    });
    for (const campaign of CAMPAIGNS) {
      await this.prisma.marketingCampaign.upsert({
        where: { slug: campaign.slug },
        update: {},
        create: {
          ...campaign,
          disclosure: DISCLOSURE,
          status: 'approved',
          updatedAt: now,
        },
      });
    }
  }

  async listRules() {
    await this.ensureDefaults();
    const rules = await this.prisma.referralProgramRule.findMany({
      orderBy: [{ program: 'asc' }, { version: 'desc' }],
    });
    const affiliate = rules.find((rule) => rule.program === 'affiliate' && rule.status === 'published');
    return {
      rules,
      example: commissionExample(50_000_000, affiliate?.rateBps || DEFAULT_AFFILIATE_RATE_BPS),
      controllingFeeRate: CONTROLLING_FEE_RATE,
      disclosure: DISCLOSURE,
    };
  }

  async publishRule(
    adminId: string,
    input: {
      program: 'affiliate' | 'referrer';
      publish?: boolean;
      rateBps?: number;
      clickWindowDays?: number;
      rewardKind?: 'percent' | 'fixed' | 'unpublished';
      fixedRewardNaira?: number;
    },
  ) {
    await this.ensureDefaults();
    const latest = await this.prisma.referralProgramRule.findFirst({
      where: { program: input.program },
      orderBy: { version: 'desc' },
    });
    const version = (latest?.version || 0) + 1;
    const publish = input.publish !== false;
    const rewardKind =
      input.program === 'affiliate' ? 'percent' : input.rewardKind || (publish ? 'fixed' : 'unpublished');
    const rateBps =
      input.program === 'affiliate'
        ? clampRate(input.rateBps ?? latest?.rateBps ?? DEFAULT_AFFILIATE_RATE_BPS)
        : input.rateBps
          ? clampRate(input.rateBps)
          : null;
    if (input.program === 'affiliate' && publish && !rateBps) {
      throw new BadRequestException('An affiliate rate is required.');
    }
    if (rewardKind === 'fixed' && publish && !(Number(input.fixedRewardNaira) > 0)) {
      throw new BadRequestException('A one-time referrer reward needs an amount.');
    }
    const clickWindowDays = clampDays(input.clickWindowDays ?? latest?.clickWindowDays ?? 30);
    if (publish) {
      await this.prisma.referralProgramRule.updateMany({
        where: { program: input.program, status: 'published' },
        data: { status: 'retired' },
      });
    }
    const created = await this.prisma.referralProgramRule.create({
      data: {
        program: input.program,
        version,
        status: publish ? 'published' : 'draft',
        rateBps,
        rateBase: 'contractor_amount',
        fundingSource: rewardKind === 'unpublished' ? 'unpublished' : 'controlling_fee',
        contingencyExcluded: true,
        clickWindowDays,
        attributionRule: 'first_touch',
        lifetime: input.program === 'affiliate',
        rewardKind,
        fixedRewardNaira: rewardKind === 'fixed' ? Math.round(Number(input.fixedRewardNaira) * 100) / 100 : null,
        publishedAt: publish ? new Date() : null,
        publishedById: publish ? adminId || null : null,
        updatedAt: new Date(),
      },
    });
    if (publish && input.program === 'affiliate') {
      await this.prisma.referralProgramSettings.update({
        where: { id: 'default' },
        data: { linkValidityDays: clickWindowDays, attributionRule: 'first_touch' },
      }).catch(() => undefined);
    }
    return created;
  }

  async recordClick(input: { code?: string | null; landingPath?: string | null; campaignSlug?: string | null; anonymousId?: string | null }) {
    const referrer = await this.resolveActive(input.code);
    if (!referrer) return { recorded: false };
    const rule = await this.publishedRule('affiliate');
    const days = rule?.clickWindowDays || 30;
    const clickedAt = new Date();
    const expiresAt = new Date(clickedAt.getTime() + days * 24 * 60 * 60 * 1000);
    await this.prisma.referralClick.create({
      data: {
        referrerId: referrer.id,
        code: referrer.code,
        landingPath: cleanPath(input.landingPath),
        campaignSlug: cleanSlug(input.campaignSlug),
        anonymousId: cleanId(input.anonymousId),
        clickedAt,
        expiresAt,
      },
    });
    return { recorded: true, expiresAt };
  }

  async lockHomeowner(input: { userId: string; code?: string | null; source?: string | null; anonymousId?: string | null }) {
    const existing = await this.prisma.customerAttribution.findUnique({
      where: { userId: input.userId },
      include: { referrer: true },
    });
    if (existing?.referrer && !existing.referrer.archivedAt) return existing;

    const source: LockSource = input.source === 'code_entered' ? 'code_entered' : input.source === 'admin' ? 'admin' : 'link';
    const rule = await this.publishedRule('affiliate');
    let referrerId = '';
    let clickId: string | null = null;
    let campaignSlug: string | null = null;
    if (source === 'link') {
      const click = await this.findEligibleClick({
        code: input.code,
        anonymousId: input.anonymousId,
        attributionRule: rule?.attributionRule || 'first_touch',
      });
      if (!click?.referrer || click.referrer.archivedAt) return null;
      referrerId = click.referrer.id;
      clickId = click.id;
      campaignSlug = click.campaignSlug;
      if (await this.isSelf(click.referrer, input.userId)) return null;
    } else {
      const referrer = await this.resolveActive(input.code);
      if (!referrer) return null;
      if (await this.isSelf(referrer, input.userId)) return null;
      referrerId = referrer.id;
    }

    try {
      return await this.prisma.customerAttribution.create({
        data: {
          userId: input.userId,
          referrerId,
          source,
          clickId,
          campaignSlug,
        },
        include: { referrer: true },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        return this.prisma.customerAttribution.findUnique({
          where: { userId: input.userId },
          include: { referrer: true },
        });
      }
      throw error;
    }
  }

  async referralFieldsForNewProject(homeownerId: string, code?: string | null, source?: string | null, anonymousId?: string | null) {
    const locked = await this.lockHomeowner({ userId: homeownerId, code, source, anonymousId });
    if (!locked?.referrer || locked.referrer.archivedAt) return {};
    if (locked.referrer.userId && locked.referrer.userId === homeownerId) return {};
    return {
      referrerId: locked.referrerId,
      referredAt: new Date(),
      referralSource: locked.source === 'code_entered' ? 'code_entered' : locked.source === 'admin' ? 'admin' : 'link',
    };
  }

  async referralIdForLead(code?: string | null, source?: string | null, anonymousId?: string | null) {
    if (source === 'code_entered') {
      const referrer = await this.resolveActive(code);
      return referrer?.id || null;
    }
    const rule = await this.publishedRule('affiliate');
    const click = await this.findEligibleClick({
      code,
      anonymousId,
      attributionRule: rule?.attributionRule || 'first_touch',
    });
    return click?.referrer && !click.referrer.archivedAt ? click.referrer.id : null;
  }

  async apply(input: { name: string; email: string; phone?: string; whatsapp?: string; audience?: string }) {
    const email = input.email.trim().toLowerCase();
    const existing = await this.prisma.referrer.findFirst({
      where: { email: { equals: email, mode: 'insensitive' } },
      select: { id: true },
    });
    if (existing) return { ok: true };
    const code = await this.uniqueCode();
    await this.prisma.referrer.create({
      data: {
        type: 'affiliate',
        name: input.name.trim(),
        email,
        phone: blank(input.phone),
        whatsapp: blank(input.whatsapp),
        audience: blank(input.audience),
        code,
        applicationStatus: 'applied',
        appliedAt: new Date(),
      },
    });
    return { ok: true };
  }

  async requestLogin(emailRaw: string, reveal = false) {
    const email = String(emailRaw || '').trim().toLowerCase();
    const referrer = email
      ? await this.prisma.referrer.findFirst({
          where: {
            email: { equals: email, mode: 'insensitive' },
            type: 'affiliate',
            applicationStatus: 'approved',
            archivedAt: null,
          },
        })
      : null;
    if (!referrer?.email) return { ok: true as const };
    return this.issueLoginLink(referrer.id, referrer.email, referrer.name, reveal);
  }

  async consumeLogin(rawToken: string) {
    const token = String(rawToken || '').trim();
    if (!token) throw new UnauthorizedException('This sign-in link is invalid or has expired.');
    const row = await this.prisma.partnerLoginToken.findUnique({
      where: { tokenHash: hashToken(token) },
      include: { referrer: true },
    });
    if (!row || row.usedAt || row.expiresAt <= new Date()) {
      throw new UnauthorizedException('This sign-in link is invalid or has expired.');
    }
    const referrer = row.referrer;
    if (!referrer || referrer.archivedAt || referrer.type !== 'affiliate' || referrer.applicationStatus !== 'approved' || !referrer.email) {
      throw new UnauthorizedException('This partner login is no longer active.');
    }
    await this.prisma.partnerLoginToken.update({ where: { id: row.id }, data: { usedAt: new Date() } });
    await this.prisma.partnerAgreement.updateMany({
      where: { referrerId: referrer.id, status: 'active', acceptedAt: null },
      data: { acceptedAt: new Date() },
    });
    const session = await this.jwt.generatePartnerToken(referrer.id, referrer.email);
    return {
      token: session,
      partner: { id: referrer.id, name: referrer.name, email: referrer.email, code: referrer.code },
    };
  }

  async approve(id: string, adminId: string) {
    const referrer = await this.mustReferrer(id);
    if (!referrer.email) throw new BadRequestException('Add an email before approving this affiliate.');
    const rule = await this.publishedRule('affiliate');
    if (!rule?.rateBps) throw new BadRequestException('Publish an affiliate rule before approving a partner.');
    const updated = await this.prisma.referrer.update({
      where: { id },
      data: {
        type: 'affiliate',
        applicationStatus: 'approved',
        approvedAt: referrer.approvedAt || new Date(),
        archivedAt: null,
      },
    });
    const active = await this.prisma.partnerAgreement.findFirst({
      where: { referrerId: id, status: 'active' },
    });
    if (!active) {
      await this.prisma.partnerAgreement.create({
        data: {
          referrerId: id,
          ruleId: rule.id,
          rateBps: rule.rateBps,
          lifetime: true,
          status: 'active',
          agreementVersion: FOUNDING_AGREEMENT_VERSION,
          effectiveFrom: new Date(),
          updatedAt: new Date(),
        },
      });
    }
    const link = await this.issueLoginLink(updated.id, updated.email || referrer.email, updated.name, true);
    this.logger.log(`affiliate approved id=${id} admin=${adminId || 'unknown'} emailSent=${link.emailSent}`);
    return { referrer: updated, ...link };
  }

  async sendLoginLink(id: string) {
    const referrer = await this.mustReferrer(id);
    if (referrer.applicationStatus !== 'approved' || referrer.type !== 'affiliate' || !referrer.email) {
      throw new BadRequestException('Approve this affiliate and save an email before sending a sign-in link.');
    }
    return this.issueLoginLink(referrer.id, referrer.email, referrer.name, true);
  }

  async suspend(id: string) {
    const referrer = await this.mustReferrer(id);
    return this.prisma.referrer.update({
      where: { id: referrer.id },
      data: { applicationStatus: 'suspended' },
    });
  }

  async evaluateProjectCommission(projectId: string) {
    const existing = await this.prisma.partnerCommission.findUnique({ where: { projectId } });
    if (existing) return { action: 'kept' as const, id: existing.id, status: existing.status };

    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      include: {
        payments: { select: { status: true, amount: true } },
        stages: { select: { status: true, approvedAt: true } },
        projectRequests: {
          where: { status: 'accepted' },
          orderBy: { updatedAt: 'desc' },
          select: {
            estimatedBudget: true,
            monitoringFeeAmount: true,
            coordinationFeeAmount: true,
            contingencyFeeAmount: true,
            homeownerAcceptedQuoteAt: true,
          },
        },
        homeowner: { select: { id: true, email: true } },
        referrer: true,
      },
    });
    if (!project) return { action: 'skip' as const, reasons: ['Project not found.'] };

    const locked = await this.prisma.customerAttribution.findUnique({
      where: { userId: project.homeownerId },
      include: { referrer: true },
    });
    const referrer =
      project.referrer && !project.referrer.archivedAt
        ? project.referrer
        : locked?.referrer && !locked.referrer.archivedAt
          ? locked.referrer
          : null;
    if (!referrer || referrer.archivedAt) return { action: 'skip' as const, reasons: ['No partner is attached.'] };

    const agreement = await this.prisma.partnerAgreement.findFirst({
      where: { referrerId: referrer.id, status: 'active' },
      orderBy: { effectiveFrom: 'desc' },
    });
    const affiliateReady = referrer.type === 'affiliate' && referrer.applicationStatus === 'approved' && !!agreement;
    let rateBps = agreement?.rateBps || 0;
    let fixedNaira: number | null = null;
    let ruleId = agreement?.ruleId || null;
    let agreementId = agreement?.id || null;
    if (!affiliateReady) {
      const referrerRule = await this.publishedRule('referrer');
      if (!referrerRule || referrerRule.rewardKind === 'unpublished' || referrerRule.status !== 'published') {
        return { action: 'skip' as const, reasons: ['The one-time referrer reward is not published.'] };
      }
      const prior = await this.prisma.partnerCommission.count({
        where: { referrerId: referrer.id, homeownerId: project.homeownerId, status: { not: 'reversed' } },
      });
      if (prior > 0) return { action: 'skip' as const, reasons: ['This referrer was already rewarded for this homeowner.'] };
      rateBps = referrerRule.rewardKind === 'percent' ? referrerRule.rateBps || 0 : 0;
      fixedNaira = referrerRule.rewardKind === 'fixed' ? referrerRule.fixedRewardNaira : null;
      ruleId = referrerRule.id;
      agreementId = null;
    }

    const quote = pickQuote(project.projectRequests);
    const projectCompleted =
      project.status === 'completed' &&
      !!project.completedAt &&
      project.stages.length > 0 &&
      project.stages.every((stage) => stage.status === 'completed' && !!stage.approvedAt);
    const confirmedPayments = project.payments
      .filter((payment) => payment.status === 'completed')
      .reduce((sum, payment) => sum + Number(payment.amount || 0), 0);
    const samePerson =
      (!!referrer.userId && referrer.userId === project.homeownerId) ||
      emailsEqual(referrer.email, project.homeowner?.email);
    const contractorConflict = !!referrer.userId && referrer.userId === project.generalContractorId;
    const decision = decideCommission({
      contractorAmount: Number(quote?.estimatedBudget || 0),
      monitoringFee: quote?.monitoringFeeAmount,
      coordinationFee: quote?.coordinationFeeAmount,
      contingencyFee: quote?.contingencyFeeAmount,
      confirmedPayments,
      rateBps,
      fixedNaira,
      projectCompleted,
      agreementActive: affiliateReady || agreementId === null,
      selfReferral: samePerson,
      contractorConflict,
    });
    if (decision.action !== 'record') return { action: 'skip' as const, reasons: decision.reasons };

    const created = await this.prisma.partnerCommission.create({
      data: {
        referrerId: referrer.id,
        homeownerId: project.homeownerId,
        projectId: project.id,
        agreementId,
        ruleId,
        eligibleContractorAmount: decision.eligibleContractorAmount,
        controllingFeeAmount: decision.controllingFeeAmount,
        contingencyAmount: decision.contingencyAmount,
        rateBps: decision.rateBps,
        amount: decision.amount,
        status: decision.status,
        reviewReasons: decision.reasons.join(' '),
        updatedAt: new Date(),
      },
    });
    if (!project.referrerId) {
      await this.prisma.project.update({
        where: { id: project.id },
        data: { referrerId: referrer.id, referredAt: project.referredAt || new Date(), referralSource: project.referralSource || 'link' },
      });
    }
    return { action: 'recorded' as const, id: created.id, status: created.status, amount: created.amount };
  }

  async listCommissions() {
    const rows = await this.prisma.partnerCommission.findMany({
      orderBy: { calculatedAt: 'desc' },
      take: 200,
      include: {
        referrer: { select: { id: true, name: true, code: true, type: true } },
        homeowner: { select: { id: true, fullName: true, email: true } },
        project: { select: { id: true, name: true, status: true, state: true } },
      },
    });
    return rows;
  }

  async approveCommission(id: string, adminId: string, input: { override?: boolean; note?: string }) {
    const row = await this.prisma.partnerCommission.findUnique({ where: { id } });
    if (!row) throw new NotFoundException('Commission not found');
    if (row.status === 'paid' || row.status === 'reversed' || row.status === 'approved') {
      throw new BadRequestException('This commission can no longer be approved.');
    }
    if (row.status === 'needs_review' && !input.override) {
      throw new BadRequestException('This commission needs a recorded decision before it can be approved.');
    }
    if (input.override && String(input.note || '').trim().length < 8) {
      throw new BadRequestException('Write why this exception is approved.');
    }
    const updated = await this.prisma.partnerCommission.update({
      where: { id },
      data: {
        status: 'approved',
        approvedAt: new Date(),
        approvedById: adminId || null,
        reviewReasons: input.note?.trim() ? `${row.reviewReasons || ''} ${input.note.trim()}`.trim() : row.reviewReasons,
      },
    });
    const [referrer, payout] = await Promise.all([
      this.prisma.referrer.findUnique({ where: { id: row.referrerId }, select: { email: true, name: true } }),
      this.prisma.partnerPayoutProfile.findUnique({ where: { referrerId: row.referrerId } }),
    ]);
    if (referrer?.email && payout?.notifyEarnings !== false) {
      await this.email.send({
        to: referrer.email,
        subject: 'A BuildMyHouse commission is approved',
        text: `Hello ${referrer.name},\n\nA commission of ₦${updated.amount.toLocaleString('en-NG')} is approved and waiting for payment.\n`,
        html: `<p>Hello ${escapeHtml(referrer.name)},</p><p>A commission of ₦${updated.amount.toLocaleString('en-NG')} is approved and waiting for payment.</p>`,
      });
    }
    return updated;
  }

  async payCommission(id: string, paymentReference: string) {
    const reference = String(paymentReference || '').trim();
    if (reference.length < 3) throw new BadRequestException('A payment reference is required.');
    const row = await this.prisma.partnerCommission.findUnique({ where: { id } });
    if (!row) throw new NotFoundException('Commission not found');
    if (row.status !== 'approved') throw new BadRequestException('Approve the commission before recording a payment.');
    return this.prisma.partnerCommission.update({
      where: { id },
      data: { status: 'paid', paidAt: new Date(), paymentReference: reference },
    });
  }

  async reverseCommission(id: string, reason: string) {
    const reversalReason = String(reason || '').trim();
    if (reversalReason.length < 8) throw new BadRequestException('Write why this commission is reversed.');
    const row = await this.prisma.partnerCommission.findUnique({ where: { id } });
    if (!row) throw new NotFoundException('Commission not found');
    if (row.status === 'reversed') return row;
    return this.prisma.partnerCommission.update({
      where: { id },
      data: { status: 'reversed', reversedAt: new Date(), reversalReason },
    });
  }

  async attributionAdmin() {
    const [locks, clicks, conflicts] = await Promise.all([
      this.prisma.customerAttribution.findMany({
        orderBy: { lockedAt: 'desc' },
        take: 100,
        include: {
          referrer: { select: { id: true, name: true, code: true, type: true } },
          user: { select: { id: true, fullName: true, email: true, city: true, state: true } },
        },
      }),
      this.prisma.referralClick.findMany({
        orderBy: { clickedAt: 'desc' },
        take: 100,
        include: { referrer: { select: { id: true, name: true, code: true } } },
      }),
      this.prisma.partnerCommission.findMany({
        where: { status: 'needs_review' },
        orderBy: { calculatedAt: 'desc' },
        take: 50,
        include: { referrer: { select: { name: true, code: true } }, project: { select: { id: true, name: true } } },
      }),
    ]);
    return { locks, clicks, conflicts };
  }

  async performance() {
    const [commissions, clicks, locks, activeAffiliates] = await Promise.all([
      this.prisma.partnerCommission.findMany({
        select: { amount: true, controllingFeeAmount: true, homeownerId: true, referrerId: true, status: true },
      }),
      this.prisma.referralClick.count(),
      this.prisma.customerAttribution.count(),
      this.prisma.referrer.count({ where: { type: 'affiliate', applicationStatus: 'approved', archivedAt: null } }),
    ]);
    const live = commissions.filter((row) => row.status !== 'reversed');
    const byHomeowner = new Map<string, number>();
    for (const row of live) byHomeowner.set(row.homeownerId, (byHomeowner.get(row.homeownerId) || 0) + 1);
    const sum = (status?: string) =>
      live.filter((row) => (status ? row.status === status : true)).reduce((total, row) => total + row.amount, 0);
    const controlling = live.reduce((total, row) => total + row.controllingFeeAmount, 0);
    const commission = sum();
    return {
      northStar: live.length,
      completedProjects: live.length,
      awaitingAmount: sum('awaiting_checks') + sum('needs_review'),
      approvedAmount: sum('approved'),
      paidAmount: sum('paid'),
      commissionAmount: commission,
      controllingFeeAmount: controlling,
      commissionShareOfControllingFee: controlling > 0 ? Math.round((commission / controlling) * 10000) / 100 : 0,
      repeatHomeowners: [...byHomeowner.values()].filter((count) => count > 1).length,
      activeAffiliates,
      clicks,
      lockedHomeowners: locks,
    };
  }

  async campaigns() {
    await this.ensureDefaults();
    return this.prisma.marketingCampaign.findMany({
      where: { status: 'approved' },
      orderBy: { sortOrder: 'asc' },
    });
  }

  async adminSnapshot(referrerId: string) {
    const [agreement, payout, commissions] = await Promise.all([
      this.prisma.partnerAgreement.findFirst({
        where: { referrerId, status: 'active' },
        orderBy: { effectiveFrom: 'desc' },
      }),
      this.prisma.partnerPayoutProfile.findUnique({ where: { referrerId } }),
      this.prisma.partnerCommission.findMany({
        where: { referrerId },
        orderBy: { calculatedAt: 'desc' },
        take: 20,
      }),
    ]);
    return { agreement, payout, commissions };
  }

  async overview(referrerId: string) {
    const referrer = await this.requirePartner(referrerId);
    const [commissions, visitors, locked, campaigns] = await Promise.all([
      this.prisma.partnerCommission.findMany({ where: { referrerId } }),
      this.prisma.referralClick.count({ where: { referrerId } }),
      this.prisma.customerAttribution.count({ where: { referrerId } }),
      this.campaigns(),
    ]);
    const live = commissions.filter((row) => row.status !== 'reversed');
    const sum = (statuses: string[]) =>
      live.filter((row) => statuses.includes(row.status)).reduce((total, row) => total + row.amount, 0);
    const next = campaigns[0];
    return {
      name: referrer.name,
      code: referrer.code,
      rateBps: (await this.activeRate(referrerId)) || DEFAULT_AFFILIATE_RATE_BPS,
      earnings: {
        pending: sum(['awaiting_checks', 'needs_review']),
        approved: sum(['approved']),
        paid: sum(['paid']),
        total: sum(['awaiting_checks', 'needs_review', 'approved', 'paid']),
      },
      visitors,
      lockedHomeowners: locked,
      completedProjects: live.length,
      nextCampaign: next
        ? { title: next.title, caption: next.caption, link: this.trackedLink(referrer.code, next.destinationPath, next.slug) }
        : null,
    };
  }

  async links(referrerId: string) {
    const referrer = await this.requirePartner(referrerId);
    const campaigns = await this.campaigns();
    return {
      start: this.trackedLink(referrer.code, '/start'),
      campaigns: campaigns.map((campaign) => ({
        ...campaign,
        link: this.trackedLink(referrer.code, campaign.destinationPath, campaign.slug),
      })),
    };
  }

  async referrals(referrerId: string) {
    await this.requirePartner(referrerId);
    const locks = await this.prisma.customerAttribution.findMany({
      where: { referrerId },
      orderBy: { lockedAt: 'desc' },
      take: 200,
      include: {
        user: {
          select: {
            fullName: true,
            city: true,
            state: true,
            homeownerProjects: {
              where: { archivedAt: null },
              select: { status: true, createdAt: true, state: true, city: true },
            },
          },
        },
      },
    });
    return locks.map((lock) => {
      const projects = lock.user.homeownerProjects || [];
      return {
        id: lock.id,
        homeowner: maskHomeownerName(lock.user.fullName),
        area: [lock.user.city, lock.user.state].filter(Boolean).join(', '),
        stage: pipelineStage(projects.map((project) => project.status)),
        lockedAt: lock.lockedAt,
        projects: projects.map((project) => ({
          status: project.status,
          createdAt: project.createdAt,
          area: [project.city, project.state].filter(Boolean).join(', '),
        })),
      };
    });
  }

  async earnings(referrerId: string) {
    await this.requirePartner(referrerId);
    const rows = await this.prisma.partnerCommission.findMany({
      where: { referrerId },
      orderBy: { calculatedAt: 'desc' },
    });
    return rows.map((row) => ({
      id: row.id,
      eligibleContractorAmount: row.eligibleContractorAmount,
      controllingFeeAmount: row.controllingFeeAmount,
      contingencyAmount: row.contingencyAmount,
      contingencyExcluded: true,
      rateBps: row.rateBps,
      amount: row.amount,
      status: row.status,
      reviewReasons: row.reviewReasons,
      calculatedAt: row.calculatedAt,
      approvedAt: row.approvedAt,
      paidAt: row.paidAt,
      paymentReference: row.paymentReference,
      reversalReason: row.reversalReason,
    }));
  }

  async settings(referrerId: string) {
    const referrer = await this.requirePartner(referrerId);
    const payout = await this.prisma.partnerPayoutProfile.findUnique({ where: { referrerId } });
    const agreement = await this.prisma.partnerAgreement.findFirst({
      where: { referrerId, status: 'active' },
      orderBy: { effectiveFrom: 'desc' },
    });
    return {
      name: referrer.name,
      email: referrer.email,
      phone: referrer.phone,
      whatsapp: referrer.whatsapp,
      agreementVersion: agreement?.agreementVersion || null,
      acceptedAt: agreement?.acceptedAt || null,
      payout: payout
        ? {
            accountName: payout.accountName,
            bankName: payout.bankName,
            accountNumber: payout.accountNumber,
            currency: payout.currency,
            taxId: payout.taxId,
            notifyEarnings: payout.notifyEarnings,
          }
        : { accountName: '', bankName: '', accountNumber: '', currency: 'NGN', taxId: '', notifyEarnings: true },
    };
  }

  async updateSettings(
    referrerId: string,
    input: {
      name?: string;
      phone?: string;
      whatsapp?: string;
      accountName?: string;
      bankName?: string;
      accountNumber?: string;
      currency?: string;
      taxId?: string;
      notifyEarnings?: boolean;
    },
  ) {
    await this.requirePartner(referrerId);
    if (input.name?.trim()) {
      await this.prisma.referrer.update({ where: { id: referrerId }, data: { name: input.name.trim() } });
    }
    if (input.phone !== undefined || input.whatsapp !== undefined) {
      await this.prisma.referrer.update({
        where: { id: referrerId },
        data: {
          phone: input.phone !== undefined ? blank(input.phone) : undefined,
          whatsapp: input.whatsapp !== undefined ? blank(input.whatsapp) : undefined,
        },
      });
    }
    await this.prisma.partnerPayoutProfile.upsert({
      where: { referrerId },
      update: {
        accountName: input.accountName !== undefined ? blank(input.accountName) : undefined,
        bankName: input.bankName !== undefined ? blank(input.bankName) : undefined,
        accountNumber: input.accountNumber !== undefined ? blank(input.accountNumber) : undefined,
        currency: input.currency ? input.currency.trim().toUpperCase().slice(0, 8) : undefined,
        taxId: input.taxId !== undefined ? blank(input.taxId) : undefined,
        notifyEarnings: input.notifyEarnings,
      },
      create: {
        referrerId,
        accountName: blank(input.accountName),
        bankName: blank(input.bankName),
        accountNumber: blank(input.accountNumber),
        currency: (input.currency || 'NGN').trim().toUpperCase().slice(0, 8),
        taxId: blank(input.taxId),
        notifyEarnings: input.notifyEarnings !== false,
        updatedAt: new Date(),
      },
    });
    return this.settings(referrerId);
  }

  private async issueLoginLink(referrerId: string, email: string, name: string, reveal: boolean) {
    const raw = randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + LOGIN_TTL_MS);
    await this.prisma.partnerLoginToken.create({
      data: { referrerId, tokenHash: hashToken(raw), expiresAt },
    });
    const devLink = `${this.partnerWeb()}/auth?token=${raw}`;
    const emailSent = await this.email.send({
      to: email,
      subject: 'Sign in to the BuildMyHouse Partner Network',
      text: `Hello ${name},\n\nUse this link to sign in. It expires in 30 minutes.\n\n${devLink}\n\nIntroduce homeowners. Earn from the projects they complete.\n`,
      html: `<p>Hello ${escapeHtml(name)},</p><p><a href="${devLink}">Sign in to the BuildMyHouse Partner Network</a></p><p>This link expires in 30 minutes.</p><p>Introduce homeowners. Earn from the projects they complete.</p>`,
    });
    const show = reveal || this.config.get<string>('NODE_ENV') !== 'production';
    return { ok: true as const, emailSent, ...(show ? { devLink } : {}) };
  }

  private async requirePartner(referrerId: string) {
    const referrer = await this.prisma.referrer.findUnique({ where: { id: referrerId } });
    if (!referrer || referrer.archivedAt || referrer.type !== 'affiliate' || referrer.applicationStatus !== 'approved') {
      throw new UnauthorizedException('This partner login is no longer active.');
    }
    return referrer;
  }

  private async activeRate(referrerId: string) {
    const agreement = await this.prisma.partnerAgreement.findFirst({
      where: { referrerId, status: 'active' },
      orderBy: { effectiveFrom: 'desc' },
    });
    return agreement?.rateBps || null;
  }

  private async publishedRule(program: 'affiliate' | 'referrer') {
    return this.prisma.referralProgramRule.findFirst({
      where: { program, status: 'published' },
      orderBy: { version: 'desc' },
    });
  }

  private async resolveActive(code?: string | null) {
    const normalized = normalizeReferralCode(code);
    if (!normalized) return null;
    const row = await this.prisma.referrer.findUnique({ where: { code: normalized } });
    if (!row || row.archivedAt) return null;
    return row;
  }

  private async findEligibleClick(input: { code?: string | null; anonymousId?: string | null; attributionRule: string }) {
    const code = normalizeReferralCode(input.code);
    const anonymousId = cleanId(input.anonymousId);
    const or: Prisma.ReferralClickWhereInput[] = [];
    if (anonymousId) or.push({ anonymousId });
    if (code) or.push({ code });
    if (!or.length) return null;
    const clicks = await this.prisma.referralClick.findMany({
      where: { expiresAt: { gt: new Date() }, OR: or },
      orderBy: { clickedAt: 'asc' },
      include: { referrer: true },
    });
    const live = clicks.filter((click) => click.referrer && !click.referrer.archivedAt);
    if (!live.length) return null;
    return input.attributionRule === 'latest_code' ? live[live.length - 1] : live[0];
  }

  private async isSelf(referrer: { userId: string | null; email: string | null }, userId: string) {
    if (referrer.userId && referrer.userId === userId) return true;
    const user = await this.prisma.user.findUnique({ where: { id: userId }, select: { email: true } });
    return emailsEqual(referrer.email, user?.email);
  }

  private async uniqueCode() {
    for (let attempt = 0; attempt < 8; attempt += 1) {
      const code = randomReferralCode();
      const existing = await this.prisma.referrer.findUnique({ where: { code }, select: { id: true } });
      if (!existing) return code;
    }
    throw new BadRequestException('Could not generate a referral code. Try again.');
  }

  private async mustReferrer(id: string) {
    const referrer = await this.prisma.referrer.findUnique({ where: { id } });
    if (!referrer) throw new NotFoundException('Referrer not found');
    return referrer;
  }

  private trackedLink(code: string, path: string, slug?: string | null) {
    const base = `${this.homeownerWeb()}${path.startsWith('/') ? path : `/${path}`}`;
    const params = new URLSearchParams({ ref: code });
    if (slug) params.set('utm_campaign', slug);
    return `${base}?${params.toString()}`;
  }

  private homeownerWeb() {
    return String(this.config.get<string>('HOMEOWNER_APP_URL') || 'https://buildmyhouse.app').replace(/\/+$/, '');
  }

  private partnerWeb() {
    return String(this.config.get<string>('PARTNER_PORTAL_URL') || 'http://localhost:3002').replace(/\/+$/, '');
  }
}

function pickQuote(
  requests: Array<{
    estimatedBudget: number | null;
    monitoringFeeAmount: number | null;
    coordinationFeeAmount: number | null;
    contingencyFeeAmount: number | null;
    homeownerAcceptedQuoteAt: Date | null;
  }>,
) {
  const priced = requests.filter((row) => Number(row.estimatedBudget) > 0);
  return priced.find((row) => row.homeownerAcceptedQuoteAt) || priced[0] || null;
}

function hashToken(token: string) {
  return createHash('sha256').update(token).digest('hex');
}

function emailsEqual(left?: string | null, right?: string | null) {
  const a = String(left || '').trim().toLowerCase();
  const b = String(right || '').trim().toLowerCase();
  return !!a && a === b;
}

function blank(value?: string | null) {
  const trimmed = String(value || '').trim();
  return trimmed || null;
}

function cleanPath(value?: string | null) {
  const path = String(value || '/').trim().slice(0, 300);
  if (!path.startsWith('/')) return `/${path.replace(/^https?:\/\/[^/]+/i, '')}`.slice(0, 300);
  return path.split('?')[0];
}

function cleanSlug(value?: string | null) {
  const slug = String(value || '').trim().toLowerCase();
  return /^[a-z0-9-]{2,60}$/.test(slug) ? slug : null;
}

function cleanId(value?: string | null) {
  const id = String(value || '').trim();
  return /^[A-Za-z0-9-]{8,64}$/.test(id) ? id : null;
}

function clampRate(value: number) {
  const rate = Math.round(Number(value));
  if (!Number.isFinite(rate) || rate < 1 || rate > 1000) {
    throw new BadRequestException('The affiliate rate must stay within the 10% controlling fee.');
  }
  return rate;
}

function clampDays(value: number) {
  const days = Math.round(Number(value));
  if (!Number.isFinite(days) || days < 1 || days > 365) {
    throw new BadRequestException('The click window must be between 1 and 365 days.');
  }
  return days;
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char] || char));
}
