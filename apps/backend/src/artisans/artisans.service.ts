import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  OnModuleInit,
  Optional,
} from '@nestjs/common';
import { createHash, randomBytes } from 'crypto';
import {
  ArtisanCapabilityKind,
  ArtisanCheckStatus,
  ArtisanClaimStatus,
  ArtisanListingStatus,
  ArtisanMediaReviewStatus,
  ArtisanMediaType,
  ArtisanRecruitmentStatus,
  ArtisanReviewStatus,
  ArtisanSourceType,
  ArtisanVerificationCheckKey,
  ArtisanVerificationStatus,
  Prisma,
} from '@prisma/client';
import { EmailService } from '../email/email.service';
import { PrismaService } from '../prisma/prisma.service';
import { ARTISAN_TRADES, slugKey } from './artisan-taxonomy';
import { ARTISAN_TRUST_EXPLANATION, computeArtisanTrust, type ArtisanTrustInput } from './artisan-trust';
import { toPublicArtisanCard, toPublicArtisanProfile } from './artisan-public';
import type {
  AdminArtisanPatchDto,
  AdminArtisanSearchDto,
  AdminArtisanWriteDto,
  AdminClaimInviteDto,
  AdminClaimReviewDto,
  AdminListingStatusDto,
  AdminMediaReviewDto,
  AdminRecruitmentDto,
  AdminVerificationDto,
  ArtisanApplicationDto,
  ArtisanClaimRequestDto,
  ArtisanMediaInputDto,
  ArtisanOwnerUpdateDto,
  ArtisanVerificationSubmitDto,
  PublicArtisanSearchDto,
} from './dto/artisans.dto';

const PUBLIC_SITE = 'https://buildmyhouse.app';

const LISTING_INCLUDE = {
  primaryTrade: true,
  capabilities: { include: { capability: true } },
  media: { orderBy: [{ sortOrder: 'asc' as const }, { createdAt: 'asc' as const }] },
  checks: true,
} satisfies Prisma.ArtisanListingInclude;

@Injectable()
export class ArtisansService implements OnModuleInit {
  constructor(
    private readonly prisma: PrismaService,
    @Optional() private readonly email?: EmailService,
  ) {}

  async onModuleInit() {
    await this.ensureTaxonomy();
  }

  async ensureTaxonomy() {
    for (const [index, trade] of ARTISAN_TRADES.entries()) {
      await this.prisma.artisanTrade.upsert({
        where: { id: trade.id },
        update: { key: trade.key, label: trade.label, sortOrder: index, isActive: true },
        create: { id: trade.id, key: trade.key, label: trade.label, sortOrder: index },
      });
      const groups: Array<[ArtisanCapabilityKind, string[]]> = [
        [ArtisanCapabilityKind.specialty, trade.specialties],
        [ArtisanCapabilityKind.service, trade.services],
      ];
      for (const [kind, labels] of groups) {
        for (const [sortOrder, label] of labels.entries()) {
          const id = `${trade.id}_${kind}_${slugKey(label)}`;
          await this.prisma.artisanCapability.upsert({
            where: { id },
            update: { label, sortOrder, tradeId: trade.id, kind, key: slugKey(label) },
            create: { id, tradeId: trade.id, kind, key: slugKey(label), label, sortOrder },
          });
        }
      }
      for (const [sortOrder, problem] of trade.problems.entries()) {
        const id = `${trade.id}_problem_${slugKey(problem.label)}`;
        await this.prisma.artisanCapability.upsert({
          where: { id },
          update: {
            label: problem.label,
            sortOrder,
            professionalNote: problem.professionalNote || null,
            professionalHref: problem.professionalHref || null,
          },
          create: {
            id,
            tradeId: trade.id,
            kind: ArtisanCapabilityKind.problem,
            key: slugKey(problem.label),
            label: problem.label,
            professionalNote: problem.professionalNote || null,
            professionalHref: problem.professionalHref || null,
            sortOrder,
          },
        });
        for (const serviceLabel of problem.services) {
          const serviceId = `${trade.id}_service_${slugKey(serviceLabel)}`;
          await this.prisma.artisanProblemService.upsert({
            where: { problemId_serviceId: { problemId: id, serviceId } },
            update: {},
            create: { problemId: id, serviceId },
          });
        }
      }
    }
  }

  async getMeta() {
    const trades = await this.prisma.artisanTrade.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
      include: { capabilities: { orderBy: { sortOrder: 'asc' } } },
    });
    const problems = trades.flatMap((trade) =>
      trade.capabilities
        .filter((item) => item.kind === 'problem')
        .map((item) => ({
          key: item.key,
          label: item.label,
          tradeKey: trade.key,
          tradeLabel: trade.label,
          professionalNote: item.professionalNote,
          professionalHref: item.professionalHref,
        })),
    );
    const counts = await this.prisma.artisanListing.groupBy({
      by: ['primaryTradeId'],
      where: { listingStatus: ArtisanListingStatus.listed, archivedAt: null },
      _count: { _all: true },
    });
    const countByTrade = new Map(counts.map((row) => [row.primaryTradeId, row._count._all]));
    return {
      trades: trades.map((trade) => ({
        id: trade.id,
        key: trade.key,
        label: trade.label,
        listingCount: countByTrade.get(trade.id) || 0,
        specialties: trade.capabilities.filter((item) => item.kind === 'specialty'),
        services: trade.capabilities.filter((item) => item.kind === 'service'),
        problems: trade.capabilities.filter((item) => item.kind === 'problem'),
      })),
      problems,
      trustExplanation: ARTISAN_TRUST_EXPLANATION,
    };
  }

  async searchPublic(dto: PublicArtisanSearchDto) {
    const page = dto.page || 1;
    const limit = dto.limit || 20;
    const q = dto.q?.trim();
    const where: Prisma.ArtisanListingWhereInput = {
      listingStatus: ArtisanListingStatus.listed,
      archivedAt: null,
      AND: [
        q
          ? {
              OR: [
                { displayName: { contains: q, mode: 'insensitive' } },
                { businessName: { contains: q, mode: 'insensitive' } },
                { city: { contains: q, mode: 'insensitive' } },
                { state: { contains: q, mode: 'insensitive' } },
                { bio: { contains: q, mode: 'insensitive' } },
                { primaryTrade: { label: { contains: q, mode: 'insensitive' } } },
                { capabilities: { some: { capability: { label: { contains: q, mode: 'insensitive' } } } } },
              ],
            }
          : {},
        dto.trade ? { primaryTrade: { key: dto.trade } } : {},
        dto.service ? { capabilities: { some: { capability: { kind: 'service', key: dto.service } } } } : {},
        dto.problem ? { capabilities: { some: { capability: { kind: 'problem', key: dto.problem } } } } : {},
        dto.state ? { OR: [{ state: { equals: dto.state, mode: 'insensitive' } }, { serviceStates: { has: dto.state } }] } : {},
        dto.city ? { OR: [{ city: { equals: dto.city, mode: 'insensitive' } }, { serviceCities: { has: dto.city } }] } : {},
        dto.verifiedOnly ? { verificationStatus: ArtisanVerificationStatus.verified } : {},
        dto.usedByBmh ? { usedByBmh: true } : {},
        dto.claimed ? { claimStatus: ArtisanClaimStatus.claimed } : {},
        dto.hasWorkshop
          ? { media: { some: { mediaType: ArtisanMediaType.workshop_cover, reviewStatus: { not: ArtisanMediaReviewStatus.rejected }, isPublic: true } } }
          : {},
      ],
    };
    const [total, rows] = await this.prisma.$transaction([
      this.prisma.artisanListing.count({ where }),
      this.prisma.artisanListing.findMany({
        where,
        include: LISTING_INCLUDE,
        orderBy: dto.sort === 'name' ? [{ displayName: 'asc' as const }] : [{ trustScore: 'desc' as const }, { displayName: 'asc' as const }],
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);
    return { data: rows.map((row) => toPublicArtisanCard(row as any)), page, limit, total };
  }

  async getPublic(slug: string) {
    if (['meta', 'claim', 'my-listings', 'applications', 'claims'].includes(slug)) {
      throw new NotFoundException('Artisan listing not found');
    }
    const listing = await this.prisma.artisanListing.findFirst({
      where: { slug, listingStatus: ArtisanListingStatus.listed, archivedAt: null },
      include: LISTING_INCLUDE,
    });
    if (!listing) throw new NotFoundException('Artisan listing not found');
    return toPublicArtisanProfile(listing as any);
  }

  async apply(dto: ArtisanApplicationDto) {
    if (dto.companyFax?.trim()) return { received: true };
    const trade = await this.prisma.artisanTrade.findUnique({ where: { key: dto.tradeKey } });
    if (!trade) throw new BadRequestException('Choose a supported trade.');
    const application = await this.prisma.artisanApplication.create({
      data: {
        displayName: dto.displayName.trim(),
        businessName: dto.businessName?.trim() || null,
        tradeKey: dto.tradeKey,
        phone: dto.phone || null,
        email: normalizeEmail(dto.email),
        whatsapp: dto.whatsapp || null,
        city: dto.city || null,
        state: dto.state || null,
        bio: dto.bio || null,
        serviceLabels: dto.serviceLabels || [],
        status: ArtisanReviewStatus.pending,
      },
    });
    if (application.email && this.email) {
      await this.email.send({
        to: application.email,
        subject: 'We received your BuildMyHouse artisan application',
        text: 'BuildMyHouse received your repair-business application. It is not public until we review it.',
        html: '<p>BuildMyHouse received your repair-business application. It is not public until we review it.</p>',
      });
    }
    return { id: application.id, status: 'pending', received: true };
  }

  async requestClaim(userId: string | null, dto: ArtisanClaimRequestDto) {
    const listing = await this.prisma.artisanListing.findFirst({ where: { slug: dto.slug, archivedAt: null } });
    if (!listing) throw new NotFoundException('Artisan listing not found');
    if (listing.claimStatus === ArtisanClaimStatus.claimed) {
      throw new ConflictException('This listing has already been claimed.');
    }
    await this.prisma.artisanListing.update({
      where: { id: listing.id },
      data: { claimStatus: ArtisanClaimStatus.claim_pending },
    });
    return this.prisma.artisanClaimRequest.create({
      data: {
        artisanListingId: listing.id,
        requesterUserId: userId,
        requesterName: dto.requesterName.trim(),
        email: dto.email.trim().toLowerCase(),
        phone: dto.phone || null,
        notes: dto.notes || null,
      },
    });
  }

  async previewClaim(rawToken: string) {
    const invite = await this.findInvite(rawToken);
    const listing = await this.prisma.artisanListing.findUnique({
      where: { id: invite.artisanListingId },
      include: { primaryTrade: true },
    });
    if (!listing) throw new NotFoundException('Artisan listing not found');
    if (!invite.openedAt) {
      await this.prisma.artisanClaimInvite.update({ where: { id: invite.id }, data: { openedAt: new Date() } });
    }
    return {
      displayName: listing.displayName,
      slug: listing.slug,
      trade: listing.primaryTrade.label,
      city: listing.city,
      state: listing.state,
      email: invite.email,
      expiresAt: invite.expiresAt,
    };
  }

  async acceptClaim(rawToken: string, userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('Account not found');
    if (!['general_contractor', 'admin', 'homeowner'].includes(user.role)) {
      throw new ForbiddenException('Sign in with the account that should manage this listing.');
    }
    const invite = await this.findInvite(rawToken);
    const listing = await this.prisma.artisanListing.findUnique({ where: { id: invite.artisanListingId } });
    if (!listing) throw new NotFoundException('Artisan listing not found');
    if (listing.linkedUserId && listing.linkedUserId !== userId) {
      throw new ConflictException('This listing has already been claimed');
    }
    const contractor =
      user.role === 'general_contractor' || user.role === 'admin'
        ? await this.ensureContractor(user.id, user.fullName, user.profileSetupCompleted)
        : null;
    const recruitment = this.advanceRecruitment(listing.recruitmentStatus, ArtisanRecruitmentStatus.claimed);
    await this.prisma.$transaction([
      this.prisma.artisanClaimInvite.update({ where: { id: invite.id }, data: { usedAt: new Date() } }),
      this.prisma.artisanListing.update({
        where: { id: listing.id },
        data: {
          linkedUserId: userId,
          linkedContractorId: contractor?.id,
          claimedAt: listing.claimedAt || new Date(),
          claimStatus: ArtisanClaimStatus.claimed,
          recruitmentStatus: recruitment,
        },
      }),
      this.prisma.user.update({
        where: { id: userId },
        data: { artisanClaimAccess: user.role === 'general_contractor' || user.role === 'admin' },
      }),
    ]);
    const updated = await this.reload(listing.id);
    return {
      listing: this.toManaged(updated),
      introPending: true,
    };
  }

  async listMine(userId: string) {
    const rows = await this.prisma.artisanListing.findMany({
      where: { linkedUserId: userId, archivedAt: null },
      include: LISTING_INCLUDE,
      orderBy: { updatedAt: 'desc' },
    });
    return rows.map((row) => this.toManaged(row));
  }

  async getMine(userId: string, id: string) {
    return this.toManaged(await this.requireOwned(userId, id));
  }

  async updateMine(userId: string, id: string, dto: ArtisanOwnerUpdateDto) {
    const listing = await this.requireOwned(userId, id);
    await this.prisma.artisanListing.update({
      where: { id: listing.id },
      data: {
        displayName: dto.displayName?.trim(),
        businessName: dto.businessName?.trim(),
        bio: dto.bio,
        primaryTradeId: dto.primaryTradeId,
        phone: dto.phone,
        whatsapp: dto.whatsapp,
        email: dto.email !== undefined ? normalizeEmail(dto.email) : undefined,
        website: dto.website,
        publicPhone: dto.publicPhone,
        publicEmail: dto.publicEmail,
        publicWhatsapp: dto.publicWhatsapp,
        publicWebsite: dto.publicWebsite,
        workingHours: dto.workingHours,
        address: dto.address,
        city: dto.city,
        state: dto.state,
        serviceStates: dto.serviceStates,
        serviceCities: dto.serviceCities,
        normalizedName: dto.displayName ? normalizeName(dto.displayName) : undefined,
        normalizedPhone: dto.phone !== undefined ? normalizePhone(dto.phone) : undefined,
        normalizedWhatsapp: dto.whatsapp !== undefined ? normalizePhone(dto.whatsapp) : undefined,
        normalizedEmail: dto.email !== undefined ? normalizeEmail(dto.email) : undefined,
        websiteDomain: dto.website !== undefined ? websiteDomain(dto.website) : undefined,
      },
    });
    if (dto.capabilityIds) await this.replaceCapabilities(listing.id, dto.capabilityIds);
    return this.toManaged(await this.recalculate(listing.id));
  }

  async addMedia(userId: string, id: string, dto: ArtisanMediaInputDto) {
    const listing = await this.requireOwned(userId, id);
    if (dto.mediaType === ArtisanMediaType.logo || dto.mediaType === ArtisanMediaType.workshop_cover) {
      await this.prisma.artisanMedia.deleteMany({ where: { artisanListingId: listing.id, mediaType: dto.mediaType } });
    }
    await this.prisma.artisanMedia.create({
      data: {
        artisanListingId: listing.id,
        mediaType: dto.mediaType,
        fileRef: dto.fileRef,
        label: dto.label || null,
        uploadedByUserId: userId,
        isPublic: true,
        reviewStatus: ArtisanMediaReviewStatus.uploaded,
      },
    });
    return this.toManaged(await this.recalculate(listing.id));
  }

  async removeMedia(userId: string, id: string, mediaId: string) {
    const listing = await this.requireOwned(userId, id);
    const media = await this.prisma.artisanMedia.findFirst({ where: { id: mediaId, artisanListingId: listing.id } });
    if (!media) throw new NotFoundException('Photo not found');
    await this.prisma.artisanMedia.delete({ where: { id: media.id } });
    return this.toManaged(await this.recalculate(listing.id));
  }

  async submitVerification(userId: string, id: string, dto: ArtisanVerificationSubmitDto) {
    const listing = await this.requireOwned(userId, id);
    await this.prisma.artisanVerificationCheck.create({
      data: {
        artisanListingId: listing.id,
        checkKey: dto.checkKey,
        status: ArtisanCheckStatus.pending,
        notes: dto.notes || null,
        evidenceFileRef: dto.evidenceFileRef || null,
      },
    });
    if (listing.verificationStatus === ArtisanVerificationStatus.unverified) {
      await this.prisma.artisanListing.update({
        where: { id: listing.id },
        data: {
          verificationStatus: ArtisanVerificationStatus.pending,
          recruitmentStatus: this.advanceRecruitment(listing.recruitmentStatus, ArtisanRecruitmentStatus.verification_pending),
        },
      });
    }
    return this.toManaged(await this.recalculate(listing.id));
  }

  async markIntroSeen(userId: string) {
    await this.prisma.user.update({
      where: { id: userId },
      data: { listingManagementIntroSeenAt: new Date() },
    });
    return { ok: true };
  }

  async adminSearch(dto: AdminArtisanSearchDto) {
    const page = dto.page || 1;
    const limit = dto.limit || 30;
    const q = dto.q?.trim();
    const where: Prisma.ArtisanListingWhereInput = {
      AND: [
        dto.listingStatus ? { listingStatus: dto.listingStatus } : { archivedAt: null },
        q
          ? {
              OR: [
                { displayName: { contains: q, mode: 'insensitive' } },
                { businessName: { contains: q, mode: 'insensitive' } },
                { phone: { contains: q } },
                { whatsapp: { contains: q } },
                { email: { contains: q, mode: 'insensitive' } },
                { slug: { contains: q, mode: 'insensitive' } },
                { city: { contains: q, mode: 'insensitive' } },
                { state: { contains: q, mode: 'insensitive' } },
                { primaryTrade: { label: { contains: q, mode: 'insensitive' } } },
                { capabilities: { some: { capability: { label: { contains: q, mode: 'insensitive' } } } } },
              ],
            }
          : {},
        dto.trade ? { primaryTrade: { key: dto.trade } } : {},
        dto.state ? { state: { contains: dto.state, mode: 'insensitive' } } : {},
        dto.city ? { city: { contains: dto.city, mode: 'insensitive' } } : {},
        dto.claimStatus ? { claimStatus: dto.claimStatus as ArtisanClaimStatus } : {},
        dto.verificationStatus ? { verificationStatus: dto.verificationStatus } : {},
        dto.recruitmentStatus ? { recruitmentStatus: dto.recruitmentStatus } : {},
        dto.sourceType ? { sourceType: dto.sourceType } : {},
        dto.usedByBmh ? { usedByBmh: true } : {},
        dto.trustMin != null || dto.trustMax != null
          ? { trustScore: { gte: dto.trustMin, lte: dto.trustMax } }
          : {},
        dto.missingWorkshop
          ? { media: { none: { mediaType: ArtisanMediaType.workshop_cover, reviewStatus: { not: ArtisanMediaReviewStatus.rejected } } } }
          : {},
        dto.contacted === true ? { lastContactedAt: { not: null } } : {},
        dto.contacted === false ? { lastContactedAt: null } : {},
      ],
    };
    const [total, rows] = await this.prisma.$transaction([
      this.prisma.artisanListing.count({ where }),
      this.prisma.artisanListing.findMany({
        where,
        include: { primaryTrade: true },
        orderBy: { updatedAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);
    return {
      data: rows.map((row) => ({
        id: row.id,
        slug: row.slug,
        displayName: row.displayName,
        businessName: row.businessName,
        trade: row.primaryTrade.label,
        city: row.city,
        state: row.state,
        trustScore: row.trustScore,
        claimStatus: row.claimStatus,
        verificationStatus: row.verificationStatus,
        recruitmentStatus: row.recruitmentStatus,
        listingStatus: row.listingStatus,
        usedByBmh: row.usedByBmh,
        sourceType: row.sourceType,
        publicUrl: `${PUBLIC_SITE}/artisans/${row.slug}`,
      })),
      page,
      limit,
      total,
    };
  }

  async adminGet(id: string) {
    const listing = await this.prisma.artisanListing.findUnique({
      where: { id },
      include: { ...LISTING_INCLUDE, claimInvites: { orderBy: { createdAt: 'desc' }, take: 5 }, claimRequests: { orderBy: { createdAt: 'desc' }, take: 10 } },
    });
    if (!listing) throw new NotFoundException('Artisan not found');
    const trust = this.trustFor(listing);
    return { ...listing, trust, publicUrl: `${PUBLIC_SITE}/artisans/${listing.slug}` };
  }

  async createListing(dto: AdminArtisanWriteDto, adminId: string | null) {
    const trade = await this.prisma.artisanTrade.findUnique({ where: { key: dto.tradeKey } });
    if (!trade) throw new BadRequestException('Unknown trade.');
    const identity = {
      displayName: dto.businessName || dto.displayName,
      phone: dto.phone,
      whatsapp: dto.whatsapp,
      email: dto.email,
      website: dto.website,
      address: dto.address,
    };
    const suppressed = await this.findSuppressed(identity);
    if (suppressed && !dto.overrideSuppressionReason?.trim()) {
      throw new BadRequestException(
        `This person or business asked not to be listed again${suppressed.reason ? ` (${suppressed.reason})` : ''}. Add an override reason to create the listing anyway.`,
      );
    }
    const duplicates = await this.findDuplicates(identity);
    if (duplicates.length && !dto.acknowledgeDuplicates) {
      const lines = duplicates.map((item) => `${item.kind}: ${item.name} (${item.href})`).join('; ');
      throw new ConflictException(`Possible duplicates. Create anyway to publish. ${lines}`);
    }
    const listing = await this.prisma.artisanListing.create({
      data: {
        slug: await this.uniqueSlug(dto.businessName || dto.displayName),
        displayName: dto.displayName.trim(),
        businessName: dto.businessName?.trim() || null,
        primaryTradeId: trade.id,
        bio: dto.bio || null,
        phone: dto.phone || null,
        whatsapp: dto.whatsapp || null,
        email: normalizeEmail(dto.email),
        website: dto.website || null,
        instagramUrl: dto.instagramUrl || null,
        facebookUrl: dto.facebookUrl || null,
        workingHours: dto.workingHours || null,
        researchConfidence: dto.researchConfidence || null,
        address: dto.address || null,
        city: dto.city || null,
        state: dto.state || null,
        serviceStates: dto.serviceStates || [],
        serviceCities: dto.serviceCities || [],
        listingStatus: dto.listingStatus || ArtisanListingStatus.listed,
        claimStatus: ArtisanClaimStatus.unclaimed,
        verificationStatus: ArtisanVerificationStatus.unverified,
        recruitmentStatus: dto.sourceType === ArtisanSourceType.grok_research ? ArtisanRecruitmentStatus.researched : ArtisanRecruitmentStatus.discovered,
        sourceType: dto.sourceType || ArtisanSourceType.admin_research,
        sourceNotes: [dto.sourceNotes, dto.overrideSuppressionReason ? `Relist override: ${dto.overrideSuppressionReason}` : null]
          .filter(Boolean)
          .join('\n') || null,
        sourceUrls: dto.sourceUrls || [],
        internalNotes: dto.internalNotes || null,
        normalizedName: normalizeName(dto.businessName || dto.displayName),
        normalizedPhone: normalizePhone(dto.phone),
        normalizedWhatsapp: normalizePhone(dto.whatsapp),
        normalizedEmail: normalizeEmail(dto.email),
        websiteDomain: websiteDomain(dto.website),
        createdByAdminId: adminId,
        listedAt: new Date(),
        hasWorkshop: false,
      },
    });
    if (dto.capabilityIds?.length) await this.replaceCapabilities(listing.id, dto.capabilityIds);
    const scored = await this.recalculate(listing.id);
    let claimUrl: string | null = null;
    if (dto.sendClaimInvite) {
      const invite = await this.createInvite(scored.id, adminId, { email: dto.inviteEmail || dto.email, phone: dto.invitePhone || dto.phone });
      claimUrl = invite.claimUrl;
    }
    return {
      id: scored.id,
      slug: scored.slug,
      publicUrl: `${PUBLIC_SITE}/artisans/${scored.slug}`,
      trustScore: scored.trustScore,
      listingStatus: scored.listingStatus,
      claimUrl,
      duplicates,
    };
  }

  async adminPatch(id: string, dto: AdminArtisanPatchDto) {
    const existing = await this.prisma.artisanListing.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Artisan not found');
    let primaryTradeId: string | undefined;
    if (dto.tradeKey) {
      const trade = await this.prisma.artisanTrade.findUnique({ where: { key: dto.tradeKey } });
      if (!trade) throw new BadRequestException('Unknown trade.');
      primaryTradeId = trade.id;
    }
    await this.prisma.artisanListing.update({
      where: { id },
      data: {
        displayName: dto.displayName?.trim(),
        businessName: dto.businessName?.trim(),
        bio: dto.bio,
        primaryTradeId,
        phone: dto.phone,
        whatsapp: dto.whatsapp,
        email: dto.email !== undefined ? normalizeEmail(dto.email) : undefined,
        website: dto.website,
        instagramUrl: dto.instagramUrl,
        facebookUrl: dto.facebookUrl,
        researchConfidence: dto.researchConfidence,
        suppressedFromRelist: dto.suppressedFromRelist,
        suppressionReason: dto.suppressionReason,
        address: dto.address,
        city: dto.city,
        state: dto.state,
        serviceStates: dto.serviceStates,
        serviceCities: dto.serviceCities,
        workingHours: dto.workingHours,
        internalNotes: dto.internalNotes,
        availabilityNotes: dto.availabilityNotes,
        callOutFeeNotes: dto.callOutFeeNotes,
        inspectionFeeNotes: dto.inspectionFeeNotes,
        workmanshipNotes: dto.workmanshipNotes,
        transportNotes: dto.transportNotes,
        emergencyJobs: dto.emergencyJobs,
        sameDayJobs: dto.sameDayJobs,
        weekendWork: dto.weekendWork,
        crewSize: dto.crewSize,
        hasWorkshop: dto.hasWorkshop,
        hasVehicle: dto.hasVehicle,
        ownsTools: dto.ownsTools,
        canIssueInvoice: dto.canIssueInvoice,
        residentialExperience: dto.residentialExperience,
        commercialExperience: dto.commercialExperience,
        usedByBmh: dto.usedByBmh,
        usedByBmhNote: dto.usedByBmhNote,
        usedByBmhSince: dto.usedByBmh ? existing.usedByBmhSince || new Date() : undefined,
        sourceNotes: dto.sourceNotes,
        sourceUrls: dto.sourceUrls,
        lastResearchedAt: new Date(),
        normalizedName:
          dto.displayName !== undefined || dto.businessName !== undefined
            ? normalizeName(dto.businessName || dto.displayName || existing.businessName || existing.displayName)
            : undefined,
        normalizedPhone: dto.phone !== undefined ? normalizePhone(dto.phone) : undefined,
        normalizedWhatsapp: dto.whatsapp !== undefined ? normalizePhone(dto.whatsapp) : undefined,
        normalizedEmail: dto.email !== undefined ? normalizeEmail(dto.email) : undefined,
        websiteDomain: dto.website !== undefined ? websiteDomain(dto.website) : undefined,
      },
    });
    if (dto.capabilityIds) await this.replaceCapabilities(id, dto.capabilityIds);
    await this.recalculate(id);
    return this.adminGet(id);
  }

  async setListingStatus(id: string, dto: AdminListingStatusDto) {
    await this.prisma.artisanListing.update({
      where: { id },
      data: {
        listingStatus: dto.listingStatus,
        archivedAt: dto.listingStatus === ArtisanListingStatus.archived ? new Date() : null,
        listedAt: dto.listingStatus === ArtisanListingStatus.listed ? new Date() : undefined,
        suppressedFromRelist: dto.suppressFromRelist || undefined,
        suppressionReason: dto.suppressFromRelist ? dto.suppressionReason || 'Asked not to be listed' : undefined,
      },
    });
    return this.adminGet(id);
  }

  async setRecruitment(id: string, dto: AdminRecruitmentDto) {
    await this.prisma.artisanListing.update({
      where: { id },
      data: {
        recruitmentStatus: dto.recruitmentStatus,
        lastContactedAt: dto.recruitmentStatus === ArtisanRecruitmentStatus.contacted ? new Date() : undefined,
      },
    });
    return this.adminGet(id);
  }

  async setVerification(adminId: string, id: string, dto: AdminVerificationDto) {
    if (dto.verificationStatus === ArtisanVerificationStatus.verified && !dto.notes?.trim()) {
      throw new BadRequestException('A note is required, including the evidence this verification rests on.');
    }
    await this.prisma.artisanListing.update({
      where: { id },
      data: { verificationStatus: dto.verificationStatus },
    });
    if (dto.checkKey || dto.verificationStatus === ArtisanVerificationStatus.verified) {
      await this.prisma.artisanVerificationCheck.create({
        data: {
          artisanListingId: id,
          checkKey: dto.checkKey || ArtisanVerificationCheckKey.identity_checked,
          status: dto.checkStatus || (dto.verificationStatus === ArtisanVerificationStatus.verified ? ArtisanCheckStatus.passed : ArtisanCheckStatus.pending),
          notes: dto.notes || null,
          checkedByAdminId: adminId,
          checkedAt: new Date(),
        },
      });
    }
    await this.recalculate(id);
    return this.adminGet(id);
  }

  async reviewMedia(adminId: string, mediaId: string, dto: AdminMediaReviewDto) {
    const media = await this.prisma.artisanMedia.update({
      where: { id: mediaId },
      data: {
        reviewStatus: dto.reviewStatus,
        rejectionReason: dto.reviewStatus === ArtisanMediaReviewStatus.rejected ? dto.rejectionReason || null : null,
        reviewedByAdminId: adminId,
        reviewedAt: new Date(),
      },
    });
    await this.recalculate(media.artisanListingId);
    return this.adminGet(media.artisanListingId);
  }

  async createInvite(id: string, adminId: string | null, dto: AdminClaimInviteDto) {
    const listing = await this.prisma.artisanListing.findUnique({ where: { id } });
    if (!listing) throw new NotFoundException('Artisan not found');
    const raw = randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + (dto.expiresInDays || 90) * 24 * 60 * 60 * 1000);
    const created = await this.prisma.artisanClaimInvite.create({
      data: {
        artisanListingId: id,
        tokenHash: hashToken(raw),
        rawToken: raw,
        email: dto.email || listing.email,
        phone: dto.phone || listing.phone,
        invitedByAdminId: adminId,
        expiresAt,
      },
    });
    await this.prisma.artisanListing.update({
      where: { id },
      data: { recruitmentStatus: this.advanceRecruitment(listing.recruitmentStatus, ArtisanRecruitmentStatus.claim_invited) },
    });
    const claimUrl = `https://buildmyhouse.app/artisans/claim/${raw}`;
    const to = dto.email || listing.email;
    let emailSent = false;
    if (to && this.email) {
      const safeName = listing.displayName.replace(/[&<>"]/g, (char) =>
        char === '&' ? '&amp;' : char === '<' ? '&lt;' : char === '>' ? '&gt;' : '&quot;',
      );
      emailSent = await this.email.send({
        to,
        subject: 'Claim your BuildMyHouse artisan listing',
        html: `<p>BuildMyHouse added <strong>${safeName}</strong> to the artisan directory.</p><p><a href="${claimUrl}">Claim my listing</a></p><p>Claiming lets you add a logo, workshop photo and services. It does not verify the business.</p>`,
        text: `Claim your artisan listing: ${claimUrl}`,
      });
      if (emailSent) {
        await this.prisma.artisanClaimInvite.update({ where: { id: created.id }, data: { emailedAt: new Date() } });
      }
    }
    return { claimUrl, expiresAt, emailSent };
  }

  async getClaimLink(id: string) {
    const listing = await this.requireArtisan(id);
    return this.artisanClaimLinkState(listing);
  }

  async ensureClaimLink(id: string, adminId: string) {
    const listing = await this.requireArtisan(id);
    if (listing.linkedUserId) return this.artisanClaimLinkState(listing);
    const current = await this.latestArtisanInvite(id);
    if (current) return this.artisanClaimLinkState(listing, current);
    const created = await this.insertArtisanInvite(listing, adminId);
    return this.artisanClaimLinkState(listing, created);
  }

  async emailArtisanClaimLink(id: string, adminId: string, email?: string) {
    const listing = await this.requireArtisan(id);
    const to = (email || listing.email || '').trim();
    if (!to) throw new BadRequestException('This listing has no email address. Copy the claim link and send it yourself.');
    let invite = await this.latestArtisanInvite(id);
    if (!invite?.rawToken) {
      if (invite) throw new BadRequestException('A valid link was already issued, but it cannot be displayed. Regenerate the link before emailing it.');
      invite = await this.insertArtisanInvite(listing, adminId);
    }
    const claimUrl = `https://buildmyhouse.app/artisans/claim/${invite.rawToken}`;
    const sent = this.email
      ? await this.email.send({
          to,
          subject: 'Claim your BuildMyHouse artisan listing',
          html: `<p><a href="${claimUrl}">Claim your listing</a></p>`,
          text: `Claim your artisan listing: ${claimUrl}`,
        })
      : false;
    if (sent) {
      invite = await this.prisma.artisanClaimInvite.update({ where: { id: invite.id }, data: { emailedAt: new Date(), email: to } });
    }
    return { ...(await this.artisanClaimLinkState(listing, invite)), emailSent: sent, email: to };
  }

  async regenerateArtisanClaimLink(id: string, adminId: string) {
    const listing = await this.requireArtisan(id);
    if (listing.linkedUserId) throw new ConflictException('This listing is already claimed.');
    await this.prisma.artisanClaimInvite.updateMany({
      where: { artisanListingId: id, usedAt: null, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    const created = await this.insertArtisanInvite(listing, adminId);
    return this.artisanClaimLinkState(listing, created);
  }

  async listClaims() {
    return this.prisma.artisanClaimRequest.findMany({ orderBy: { createdAt: 'desc' }, take: 100, include: { listing: { select: { displayName: true, slug: true } } } });
  }

  async reviewClaim(adminId: string, id: string, dto: AdminClaimReviewDto) {
    const request = await this.prisma.artisanClaimRequest.findUnique({ where: { id } });
    if (!request) throw new NotFoundException('Claim request not found');
    await this.prisma.artisanClaimRequest.update({
      where: { id },
      data: {
        status: dto.status === 'approved' ? ArtisanReviewStatus.approved : ArtisanReviewStatus.rejected,
        notes: dto.notes || null,
        reviewedByAdminId: adminId,
        reviewedAt: new Date(),
      },
    });
    if (dto.status === 'approved' && request.requesterUserId) {
      return this.acceptApprovedRequest(request.artisanListingId, request.requesterUserId);
    }
    if (dto.status === 'rejected') {
      await this.prisma.artisanListing.update({
        where: { id: request.artisanListingId },
        data: { claimStatus: ArtisanClaimStatus.unclaimed },
      });
    }
    return { ok: true };
  }

  async listApplications() {
    return this.prisma.artisanApplication.findMany({ orderBy: { createdAt: 'desc' }, take: 100 });
  }

  async findDuplicates(input: { displayName?: string | null; phone?: string | null; whatsapp?: string | null; email?: string | null; website?: string | null; address?: string | null; excludeId?: string }) {
    const name = normalizeName(input.displayName);
    const phone = normalizePhone(input.phone);
    const whatsapp = normalizePhone(input.whatsapp);
    const email = normalizeEmail(input.email);
    const domain = websiteDomain(input.website);
    const address = input.address?.trim().toLowerCase();
    const matches: Array<{ kind: string; id: string; name: string; href: string }> = [];
    const artisanOr: Prisma.ArtisanListingWhereInput[] = [];
    if (name) artisanOr.push({ normalizedName: name });
    if (phone) artisanOr.push({ OR: [{ normalizedPhone: phone }, { normalizedWhatsapp: phone }] });
    if (whatsapp) artisanOr.push({ OR: [{ normalizedWhatsapp: whatsapp }, { normalizedPhone: whatsapp }] });
    if (email) artisanOr.push({ normalizedEmail: email });
    if (domain) artisanOr.push({ websiteDomain: domain });
    if (address) artisanOr.push({ address: { equals: input.address!.trim(), mode: 'insensitive' } });
    if (artisanOr.length) {
      const rows = await this.prisma.artisanListing.findMany({
        where: { OR: artisanOr, id: input.excludeId ? { not: input.excludeId } : undefined },
        select: { id: true, slug: true, displayName: true },
        take: 8,
      });
      rows.forEach((row) => matches.push({ kind: 'artisan', id: row.id, name: row.displayName, href: `/artisans/${row.slug}` }));
    }
    const vendorOr: Prisma.VendorProfileWhereInput[] = [];
    if (name) vendorOr.push({ normalizedTradingName: name });
    if (phone) vendorOr.push({ OR: [{ normalizedPhone: phone }, { normalizedWhatsApp: phone }] });
    if (whatsapp) vendorOr.push({ OR: [{ normalizedWhatsApp: whatsapp }, { normalizedPhone: whatsapp }] });
    if (email) vendorOr.push({ normalizedEmail: email });
    if (domain) vendorOr.push({ websiteDomain: domain });
    if (address) vendorOr.push({ publicAddress: { equals: input.address!.trim(), mode: 'insensitive' } });
    if (vendorOr.length) {
      const rows = await this.prisma.vendorProfile.findMany({
        where: { deletedAt: null, OR: vendorOr },
        select: { id: true, slug: true, tradingName: true },
        take: 8,
      });
      rows.forEach((row) => matches.push({ kind: 'vendor', id: row.id, name: row.tradingName, href: `/vendors/${row.slug}` }));
    }
    const professionalOr: Prisma.ProfessionalListingWhereInput[] = [];
    if (name) professionalOr.push({ normalizedName: name });
    if (phone) professionalOr.push({ normalizedPhone: phone });
    if (email) professionalOr.push({ normalizedEmail: email });
    if (domain) professionalOr.push({ websiteDomain: domain });
    const phoneTail = (phone || whatsapp || '').slice(-10);
    if (phoneTail.length >= 8) professionalOr.push({ whatsapp: { contains: phoneTail } });
    if (address) professionalOr.push({ address: { equals: input.address!.trim(), mode: 'insensitive' } });
    if (professionalOr.length) {
      const rows = await this.prisma.professionalListing.findMany({
        where: { archivedAt: null, OR: professionalOr },
        select: { id: true, slug: true, displayName: true },
        take: 8,
      });
      rows.forEach((row) => matches.push({ kind: 'professional', id: row.id, name: row.displayName, href: `/professionals/${row.slug}` }));
    }
    return matches;
  }

  private async findSuppressed(input: { displayName?: string | null; phone?: string | null; whatsapp?: string | null; email?: string | null; website?: string | null }) {
    const name = normalizeName(input.displayName);
    const phone = normalizePhone(input.phone);
    const whatsapp = normalizePhone(input.whatsapp);
    const domain = websiteDomain(input.website);
    const ors: Prisma.ArtisanListingWhereInput[] = [];
    if (name) ors.push({ normalizedName: name });
    if (phone) ors.push({ normalizedPhone: phone });
    if (whatsapp) ors.push({ normalizedWhatsapp: whatsapp });
    if (domain) ors.push({ websiteDomain: domain });
    if (!ors.length) return null;
    return this.prisma.artisanListing.findFirst({
      where: { suppressedFromRelist: true, OR: ors },
      select: { id: true, displayName: true, suppressionReason: true },
    }).then((row) => (row ? { id: row.id, reason: row.suppressionReason } : null));
  }

  async reviewApplication(adminId: string, id: string, status: 'approved' | 'rejected', adminNotes?: string) {
    const application = await this.prisma.artisanApplication.findUnique({ where: { id } });
    if (!application) throw new NotFoundException('Application not found');
    let createdListingId = application.createdListingId;
    if (status === 'approved' && !createdListingId) {
      const created = await this.createListing(
        {
          displayName: application.displayName,
          businessName: application.businessName || undefined,
          tradeKey: application.tradeKey,
          bio: application.bio || undefined,
          phone: application.phone || undefined,
          whatsapp: application.whatsapp || undefined,
          email: application.email || undefined,
          city: application.city || undefined,
          state: application.state || undefined,
          sourceType: ArtisanSourceType.self_submitted,
          acknowledgeDuplicates: true,
          listingStatus: ArtisanListingStatus.listed,
        },
        adminId,
      );
      createdListingId = created.id;
    }
    await this.prisma.artisanApplication.update({
      where: { id },
      data: {
        status: status === 'approved' ? ArtisanReviewStatus.approved : ArtisanReviewStatus.rejected,
        adminNotes: adminNotes || null,
        reviewedByAdminId: adminId,
        reviewedAt: new Date(),
        createdListingId,
      },
    });
    return { id, status, createdListingId };
  }

  private async acceptApprovedRequest(listingId: string, userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || (user.role !== 'general_contractor' && user.role !== 'admin')) {
      throw new BadRequestException('The requester needs a contractor account before the listing can be linked.');
    }
    const contractor = await this.ensureContractor(user.id, user.fullName, user.profileSetupCompleted);
    await this.prisma.artisanListing.update({
      where: { id: listingId },
      data: {
        linkedUserId: userId,
        linkedContractorId: contractor.id,
        claimedAt: new Date(),
        claimStatus: ArtisanClaimStatus.claimed,
      },
    });
    await this.prisma.user.update({ where: { id: userId }, data: { artisanClaimAccess: true } });
    return this.adminGet(listingId);
  }

  private async requireArtisan(id: string) {
    const listing = await this.prisma.artisanListing.findUnique({ where: { id } });
    if (!listing) throw new NotFoundException('Artisan not found');
    return listing;
  }

  private async latestArtisanInvite(listingId: string) {
    const invites = await this.prisma.artisanClaimInvite.findMany({
      where: { artisanListingId: listingId, usedAt: null, revokedAt: null },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });
    return invites.find((invite) => invite.expiresAt.getTime() > Date.now()) || null;
  }

  private async insertArtisanInvite(listing: { id: string; email?: string | null; phone?: string | null }, adminId: string) {
    const rawToken = randomBytes(32).toString('hex');
    return this.prisma.artisanClaimInvite.create({
      data: {
        artisanListingId: listing.id,
        tokenHash: hashToken(rawToken),
        rawToken,
        email: listing.email || null,
        phone: listing.phone || null,
        invitedByAdminId: adminId,
        expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
      },
    });
  }

  private async artisanClaimLinkState(
    listing: { id: string; linkedUserId?: string | null; claimedAt?: Date | null },
    invite?: { rawToken?: string | null; expiresAt: Date; emailedAt?: Date | null } | null,
  ) {
    const current = invite === undefined ? await this.latestArtisanInvite(listing.id) : invite;
    if (listing.linkedUserId) {
      const owner = await this.prisma.user.findUnique({ where: { id: listing.linkedUserId }, select: { fullName: true, email: true } });
      return {
        status: 'claimed' as const,
        claimUrl: null,
        expiresAt: null,
        emailedAt: current?.emailedAt || null,
        claimedAt: listing.claimedAt || null,
        claimedBy: owner?.fullName || owner?.email || null,
        legacy: false,
      };
    }
    if (!current) {
      const expired = await this.prisma.artisanClaimInvite.findFirst({
        where: { artisanListingId: listing.id, usedAt: null, revokedAt: null, expiresAt: { lt: new Date() } },
        orderBy: { createdAt: 'desc' },
      });
      if (expired) {
        return { status: 'expired' as const, claimUrl: null, expiresAt: expired.expiresAt, emailedAt: expired.emailedAt, claimedAt: null, claimedBy: null, legacy: false };
      }
      return { status: 'not_generated' as const, claimUrl: null, expiresAt: null, emailedAt: null, claimedAt: null, claimedBy: null, legacy: false };
    }
    return {
      status: current.emailedAt ? ('emailed' as const) : ('generated' as const),
      claimUrl: current.rawToken ? `https://buildmyhouse.app/artisans/claim/${current.rawToken}` : null,
      expiresAt: current.expiresAt,
      emailedAt: current.emailedAt || null,
      claimedAt: null,
      claimedBy: null,
      legacy: !current.rawToken,
    };
  }

  private async requireOwned(userId: string, id: string) {
    const listing = await this.prisma.artisanListing.findFirst({
      where: { id, linkedUserId: userId },
      include: LISTING_INCLUDE,
    });
    if (!listing) throw new NotFoundException('This account does not manage that artisan listing.');
    return listing;
  }

  private async reload(id: string) {
    const listing = await this.prisma.artisanListing.findUnique({ where: { id }, include: LISTING_INCLUDE });
    if (!listing) throw new NotFoundException('Artisan not found');
    return listing;
  }

  private async replaceCapabilities(listingId: string, capabilityIds: string[]) {
    await this.prisma.artisanListingCapability.deleteMany({ where: { artisanListingId: listingId } });
    if (!capabilityIds.length) return;
    await this.prisma.artisanListingCapability.createMany({
      data: capabilityIds.map((capabilityId) => ({ artisanListingId: listingId, capabilityId })),
      skipDuplicates: true,
    });
  }

  private async recalculate(id: string) {
    const listing = await this.reload(id);
    const trust = this.trustFor(listing);
    return this.prisma.artisanListing.update({
      where: { id },
      data: { trustScore: trust.score },
      include: LISTING_INCLUDE,
    });
  }

  private trustFor(listing: Prisma.ArtisanListingGetPayload<{ include: typeof LISTING_INCLUDE }>) {
    const caps = listing.capabilities.map((row) => row.capability);
    const media = listing.media.filter((item) => item.isPublic && item.reviewStatus !== ArtisanMediaReviewStatus.rejected);
    const input: ArtisanTrustInput = {
      displayName: listing.displayName,
      businessName: listing.businessName,
      hasTrade: !!listing.primaryTradeId,
      bio: listing.bio,
      phone: listing.phone,
      whatsapp: listing.whatsapp,
      email: listing.email,
      website: listing.website,
      state: listing.state,
      city: listing.city,
      address: listing.address,
      serviceAreaCount: listing.serviceStates.length + listing.serviceCities.length,
      hasLogo: media.some((item) => item.mediaType === ArtisanMediaType.logo),
      hasWorkshopCover: media.some((item) => item.mediaType === ArtisanMediaType.workshop_cover),
      galleryCount: media.filter((item) => ['work_gallery', 'workshop', 'before', 'after'].includes(item.mediaType)).length,
      specialtyCount: caps.filter((item) => item.kind === 'specialty').length,
      serviceCount: caps.filter((item) => item.kind === 'service').length,
      problemCount: caps.filter((item) => item.kind === 'problem').length,
      claimed: listing.claimStatus === ArtisanClaimStatus.claimed,
      verificationSubmitted: listing.checks.length > 0 || listing.verificationStatus !== ArtisanVerificationStatus.unverified,
      verificationCheckPassed: listing.checks.some((item) => item.status === ArtisanCheckStatus.passed) || listing.verificationStatus === ArtisanVerificationStatus.verified,
      verificationApproved: listing.verificationStatus === ArtisanVerificationStatus.verified,
    };
    return { ...computeArtisanTrust(input), explanation: ARTISAN_TRUST_EXPLANATION };
  }

  private toManaged(listing: Prisma.ArtisanListingGetPayload<{ include: typeof LISTING_INCLUDE }>) {
    const trust = this.trustFor(listing);
    return {
      id: listing.id,
      slug: listing.slug,
      displayName: listing.displayName,
      businessName: listing.businessName,
      bio: listing.bio,
      trade: listing.primaryTrade,
      phone: listing.phone,
      email: listing.email,
      whatsapp: listing.whatsapp,
      website: listing.website,
      publicPhone: listing.publicPhone,
      publicEmail: listing.publicEmail,
      publicWhatsapp: listing.publicWhatsapp,
      publicWebsite: listing.publicWebsite,
      workingHours: listing.workingHours,
      address: listing.address,
      city: listing.city,
      state: listing.state,
      serviceStates: listing.serviceStates,
      serviceCities: listing.serviceCities,
      listingStatus: listing.listingStatus,
      claimStatus: listing.claimStatus,
      verificationStatus: listing.verificationStatus,
      usedByBmh: listing.usedByBmh,
      capabilityIds: listing.capabilities.map((row) => row.capabilityId),
      capabilities: listing.capabilities.map((row) => row.capability),
      media: listing.media,
      trustScore: trust.score,
      trustSuggestions: trust.suggestions,
      trustExplanation: trust.explanation,
      publicUrl: `${PUBLIC_SITE}/artisans/${listing.slug}`,
    };
  }

  private async ensureContractor(userId: string, fullName: string, profileSetupCompleted: boolean) {
    const existing = await this.prisma.contractor.findUnique({ where: { userId } });
    if (!existing) {
      return this.prisma.contractor.create({
        data: {
          userId,
          name: fullName || 'Artisan',
          specialty: 'Artisan',
          specialtyCategory: 'artisan',
          type: 'general_contractor',
          platformKind: 'artisan',
          hiringFee: 0,
          rating: 0,
          projects: 0,
          reviews: 0,
        },
      });
    }
    const platformKind = existing.platformKind === 'both' || (existing.platformKind === 'general_contractor' && profileSetupCompleted)
      ? 'both'
      : existing.platformKind === 'artisan'
        ? 'artisan'
        : profileSetupCompleted
          ? 'both'
          : 'artisan';
    if (platformKind !== existing.platformKind) {
      return this.prisma.contractor.update({ where: { id: existing.id }, data: { platformKind } });
    }
    return existing;
  }

  private async findInvite(rawToken: string) {
    const invite = await this.prisma.artisanClaimInvite.findUnique({ where: { tokenHash: hashToken(rawToken) } });
    if (!invite) throw new NotFoundException('This claim link is invalid.');
    if (invite.usedAt) throw new ConflictException('This claim link has already been used.');
    if (invite.revokedAt) throw new BadRequestException('This claim link has been revoked.');
    if (invite.expiresAt.getTime() < Date.now()) throw new BadRequestException('This claim link has expired.');
    return invite;
  }

  private async uniqueSlug(name: string) {
    const base = slugKey(name) || 'artisan';
    let slug = base;
    let n = 2;
    while (await this.prisma.artisanListing.findUnique({ where: { slug } })) {
      slug = `${base}-${n++}`;
    }
    return slug;
  }

  private advanceRecruitment(current: ArtisanRecruitmentStatus, next: ArtisanRecruitmentStatus) {
    const order: ArtisanRecruitmentStatus[] = [
      ArtisanRecruitmentStatus.discovered,
      ArtisanRecruitmentStatus.researched,
      ArtisanRecruitmentStatus.contacted,
      ArtisanRecruitmentStatus.claim_invited,
      ArtisanRecruitmentStatus.claimed,
      ArtisanRecruitmentStatus.verification_pending,
    ];
    const currentIndex = order.indexOf(current);
    const nextIndex = order.indexOf(next);
    if (currentIndex === -1 || nextIndex === -1) return current;
    return nextIndex > currentIndex ? next : current;
  }
}

function hashToken(raw: string) {
  return createHash('sha256').update(raw).digest('hex');
}

function normalizeName(value?: string | null) {
  if (!value) return null;
  return value.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim() || null;
}

function normalizePhone(value?: string | null) {
  if (!value) return null;
  const digits = value.replace(/\D/g, '');
  return digits || null;
}

function normalizeEmail(value?: string | null) {
  if (!value) return null;
  return value.trim().toLowerCase() || null;
}

function websiteDomain(value?: string | null) {
  if (!value) return null;
  try {
    const withProtocol = value.startsWith('http') ? value : `https://${value}`;
    return new URL(withProtocol).hostname.replace(/^www\./, '');
  } catch {
    return null;
  }
}
