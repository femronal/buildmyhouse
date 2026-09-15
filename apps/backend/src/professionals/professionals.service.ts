import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import {
  ProfessionalCredentialVerification,
  ProfessionalEngagementStatus,
  ProfessionalListingStatus,
  ProfessionalOwnershipStatus,
  ProfessionalReviewStatus,
  ProfessionalSourceType,
  ProfessionalVerificationMode,
  ProfessionalVerificationStatus,
  Prisma,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import {
  DELIVERABLES,
  NEEDS,
  NIGERIAN_STATES,
  PROCUREMENT_CAPABILITY_TAGS,
  PROFESSIONS,
  PROJECT_STAGES,
  SERVICES,
  SPECIALTIES,
} from './professional-taxonomy';
import {
  aggregateVerification,
  computeCompleteness,
  computeSearchRank,
  credentialCurrencyStatus,
  isPubliclyListed,
  normalizeDisplayName,
  normalizeEmail,
  normalizePhone,
  normalizeProfessionalSlug,
  normalizeRegKey,
  toPublicProfessionalCard,
  toPublicProfessionalProfile,
  websiteDomain,
} from './professional-helpers';
import {
  AdminCreateProfessionalDto,
  AdminCredentialDocumentDto,
  AdminCredentialDto,
  AdminEngagementDto,
  AdminEngagementUpdateDto,
  AdminListingStatusDto,
  AdminProcurementDto,
  AdminProfessionalSearchDto,
  AdminProfessionalWriteDto,
  AdminReviewDto,
  AdminTaxonomyPatchDto,
  AdminVerificationActionDto,
  ApplyProfessionalDto,
  ClaimProfessionalDto,
  ProfessionalEnquiryDto,
  PublicProfessionalSearchDto,
} from './dto/professionals.dto';

const PUBLIC_INCLUDE = {
  primaryProfession: true,
  specialties: { include: { specialty: true } },
  services: { include: { service: true } },
  deliverables: { include: { deliverable: true } },
  projectStages: { include: { projectStage: true } },
  credentials: true,
} satisfies Prisma.ProfessionalListingInclude;

const ADMIN_INCLUDE = {
  ...PUBLIC_INCLUDE,
  procurement: true,
  credentials: { include: { documents: true, verifiedBy: { select: { id: true, fullName: true } } } },
  engagements: {
    include: {
      project: { select: { id: true, name: true, city: true, state: true } },
      stage: { select: { id: true, name: true, status: true } },
      service: true,
      requiredDeliverable: true,
    },
    orderBy: { createdAt: 'desc' as const },
    take: 50,
  },
  claims: { orderBy: { createdAt: 'desc' as const }, take: 20 },
  applications: { orderBy: { createdAt: 'desc' as const }, take: 10 },
  enquiries: { orderBy: { createdAt: 'desc' as const }, take: 20 },
} satisfies Prisma.ProfessionalListingInclude;

@Injectable()
export class ProfessionalsService implements OnModuleInit {
  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit() {
    await this.ensureTaxonomy();
  }

  async ensureTaxonomy() {
    await this.prisma.$transaction([
      ...PROFESSIONS.map((row) =>
        this.prisma.professionCatalog.upsert({
          where: { id: row.id },
          update: {
            key: row.key,
            label: row.label,
            description: row.description,
            regulatorKey: row.regulatorKey,
            regulatorLabel: row.regulatorLabel,
            verificationMode: row.verificationMode,
            sortOrder: row.sortOrder,
          },
          create: {
            id: row.id,
            key: row.key,
            label: row.label,
            description: row.description,
            regulatorKey: row.regulatorKey,
            regulatorLabel: row.regulatorLabel,
            verificationMode: row.verificationMode,
            sortOrder: row.sortOrder,
          },
        }),
      ),
    ]);
    await this.prisma.$transaction([
      ...SPECIALTIES.map((row) =>
        this.prisma.professionSpecialty.upsert({
          where: { id: row.id },
          update: { key: row.key, professionId: row.professionId, label: row.label, sortOrder: row.sortOrder },
          create: { id: row.id, key: row.key, professionId: row.professionId, label: row.label, sortOrder: row.sortOrder },
        }),
      ),
      ...SERVICES.map((row) =>
        this.prisma.professionService.upsert({
          where: { id: row.id },
          update: { key: row.key, label: row.label, sortOrder: row.sortOrder },
          create: { id: row.id, key: row.key, label: row.label, sortOrder: row.sortOrder },
        }),
      ),
      ...DELIVERABLES.map((row) =>
        this.prisma.professionDeliverable.upsert({
          where: { id: row.id },
          update: { key: row.key, label: row.label, sortOrder: row.sortOrder },
          create: { id: row.id, key: row.key, label: row.label, sortOrder: row.sortOrder },
        }),
      ),
      ...PROJECT_STAGES.map((row) =>
        this.prisma.professionalProjectStage.upsert({
          where: { id: row.id },
          update: { key: row.key, label: row.label, sortOrder: row.sortOrder },
          create: { id: row.id, key: row.key, label: row.label, sortOrder: row.sortOrder },
        }),
      ),
    ]);
    await this.prisma.$transaction(
      NEEDS.map((row) =>
        this.prisma.professionalNeed.upsert({
          where: { id: row.id },
          update: {
            key: row.key,
            label: row.label,
            description: row.description,
            primaryProfessionId: row.primaryProfessionId,
            serviceId: row.serviceId,
            sortOrder: row.sortOrder,
          },
          create: {
            id: row.id,
            key: row.key,
            label: row.label,
            description: row.description,
            primaryProfessionId: row.primaryProfessionId,
            serviceId: row.serviceId,
            sortOrder: row.sortOrder,
          },
        }),
      ),
    );
  }

  async getMeta(activeOnly = true) {
    const where = activeOnly ? { isActive: true } : {};
    const [professions, specialties, services, deliverables, projectStages, needs] = await Promise.all([
      this.prisma.professionCatalog.findMany({ where, orderBy: { sortOrder: 'asc' } }),
      this.prisma.professionSpecialty.findMany({ where, orderBy: { sortOrder: 'asc' } }),
      this.prisma.professionService.findMany({ where, orderBy: { sortOrder: 'asc' } }),
      this.prisma.professionDeliverable.findMany({ where, orderBy: { sortOrder: 'asc' } }),
      this.prisma.professionalProjectStage.findMany({ where, orderBy: { sortOrder: 'asc' } }),
      this.prisma.professionalNeed.findMany({
        where,
        orderBy: { sortOrder: 'asc' },
        include: { primaryProfession: true, service: true },
      }),
    ]);
    return {
      professions,
      specialties,
      services,
      deliverables,
      projectStages,
      needs: needs.map((need) => ({
        key: need.key,
        label: need.label,
        description: need.description,
        professionKey: need.primaryProfession.key,
        serviceKey: need.service?.key || null,
        disclaimer: 'Professionals commonly relevant to this task — not a professional or legal diagnosis.',
      })),
      states: NIGERIAN_STATES,
      capabilityTags: PROCUREMENT_CAPABILITY_TAGS,
    };
  }

  private publicWhere(query: PublicProfessionalSearchDto): Prisma.ProfessionalListingWhereInput {
    const and: Prisma.ProfessionalListingWhereInput[] = [
      { listingStatus: ProfessionalListingStatus.listed, archivedAt: null },
    ];
    if (query.profession) {
      and.push({
        OR: [
          { primaryProfession: { key: query.profession } },
          { primaryProfession: { id: query.profession } },
        ],
      });
    }
    if (query.specialty) {
      and.push({ specialties: { some: { specialty: { OR: [{ key: query.specialty }, { id: query.specialty }] } } } });
    }
    if (query.service) {
      and.push({ services: { some: { service: { OR: [{ key: query.service }, { id: query.service }] } } } });
    }
    if (query.deliverable) {
      and.push({
        deliverables: { some: { deliverable: { OR: [{ key: query.deliverable }, { id: query.deliverable }] } } },
      });
    }
    if (query.projectStage) {
      and.push({
        projectStages: { some: { projectStage: { OR: [{ key: query.projectStage }, { id: query.projectStage }] } } },
      });
    }
    if (query.state) {
      const state = query.state.toLowerCase();
      and.push({
        OR: [
          { stateKey: state },
          { state: { equals: query.state, mode: 'insensitive' } },
          { serviceStates: { has: query.state } },
          { serviceStates: { has: state } },
        ],
      });
    }
    if (query.city) {
      and.push({
        OR: [
          { city: { contains: query.city, mode: 'insensitive' } },
          { serviceCities: { has: query.city } },
        ],
      });
    }
    if (query.credentialChecked) {
      and.push({ verificationStatus: ProfessionalVerificationStatus.verified });
    }
    if (query.usedByBmh) and.push({ usedByBmh: true });
    if (query.remoteConsultation) and.push({ remoteConsultation: true });
    if (query.siteVisits) and.push({ siteVisits: true });
    if (query.signedReport) and.push({ canIssueSignedReport: true });
    if (query.professionalType) and.push({ professionalType: query.professionalType });
    if (query.q?.trim()) {
      const q = query.q.trim();
      and.push({
        OR: [
          { displayName: { contains: q, mode: 'insensitive' } },
          { bio: { contains: q, mode: 'insensitive' } },
          { city: { contains: q, mode: 'insensitive' } },
          { state: { contains: q, mode: 'insensitive' } },
          { primaryProfession: { label: { contains: q, mode: 'insensitive' } } },
          { primaryProfession: { key: { contains: q, mode: 'insensitive' } } },
          { specialties: { some: { specialty: { label: { contains: q, mode: 'insensitive' } } } } },
          { services: { some: { service: { label: { contains: q, mode: 'insensitive' } } } } },
          { deliverables: { some: { deliverable: { label: { contains: q, mode: 'insensitive' } } } } },
          { credentials: { some: { registrationNumber: { contains: q, mode: 'insensitive' } } } },
          { credentials: { some: { regulatorLabel: { contains: q, mode: 'insensitive' } } } },
          { credentials: { some: { regulatorKey: { contains: q, mode: 'insensitive' } } } },
        ],
      });
    }
    return { AND: and };
  }

  async resolveNeed(needKey?: string) {
    if (!needKey) return null;
    return this.prisma.professionalNeed.findFirst({
      where: { key: needKey, isActive: true },
      include: { primaryProfession: true, service: true },
    });
  }

  async searchPublic(query: PublicProfessionalSearchDto) {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const need = await this.resolveNeed(query.need);
    const merged: PublicProfessionalSearchDto = {
      ...query,
      profession: query.profession || need?.primaryProfession.key,
      service: query.service || need?.service?.key,
    };
    const where = this.publicWhere(merged);
    const [total, rows] = await Promise.all([
      this.prisma.professionalListing.count({ where }),
      this.prisma.professionalListing.findMany({
        where,
        include: PUBLIC_INCLUDE,
        orderBy: [{ searchRank: 'desc' }, { displayName: 'asc' }],
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);
    return {
      data: rows.filter((row) => isPubliclyListed(row.listingStatus)).map(toPublicProfessionalCard),
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) || 1 },
      appliedNeed: need
        ? {
            key: need.key,
            label: need.label,
            description: need.description,
            disclaimer: 'Professionals commonly relevant to this task — not a professional or legal diagnosis.',
          }
        : null,
    };
  }

  async getPublicBySlug(slug: string) {
    const listing = await this.prisma.professionalListing.findFirst({
      where: { slug, listingStatus: ProfessionalListingStatus.listed, archivedAt: null },
      include: PUBLIC_INCLUDE,
    });
    if (!listing) throw new NotFoundException('Professional not found');
    return toPublicProfessionalProfile(listing);
  }

  async apply(dto: ApplyProfessionalDto) {
    const profession = dto.professionKey
      ? await this.prisma.professionCatalog.findFirst({
          where: { OR: [{ key: dto.professionKey }, { id: dto.professionKey }], isActive: true },
        })
      : null;
    const created = await this.prisma.professionalApplication.create({
      data: {
        professionalType: dto.professionalType,
        displayName: dto.displayName.trim(),
        professionId: profession?.id,
        specialtyKeys: dto.specialtyKeys || [],
        serviceKeys: dto.serviceKeys || [],
        phone: dto.phone,
        email: normalizeEmail(dto.email),
        whatsapp: dto.whatsapp,
        website: dto.website,
        state: dto.state,
        city: dto.city,
        regulatorKey: dto.regulatorKey,
        registrationNumber: dto.registrationNumber,
        shortDescription: dto.shortDescription,
      },
    });
    return {
      id: created.id,
      status: created.status,
      message: 'Application received. BuildMyHouse will review it before any listing is published.',
    };
  }

  async claim(dto: ClaimProfessionalDto) {
    const listing = await this.findListingByIdOrSlug(dto.listingId, dto.slug);
    if (!isPubliclyListed(listing.listingStatus) && listing.listingStatus !== ProfessionalListingStatus.hidden) {
      throw new NotFoundException('Professional not found');
    }
    const created = await this.prisma.professionalClaimRequest.create({
      data: {
        professionalListingId: listing.id,
        requesterName: dto.requesterName.trim(),
        relationshipToPractice: dto.relationshipToPractice.trim(),
        email: normalizeEmail(dto.email) || dto.email,
        phone: dto.phone,
        proofMethod: dto.proofMethod,
        proofNotes: dto.proofNotes,
      },
    });
    await this.prisma.professionalListing.update({
      where: { id: listing.id },
      data: { ownershipStatus: ProfessionalOwnershipStatus.claim_pending },
    });
    return {
      id: created.id,
      status: created.status,
      message: 'Claim request received. Claiming a listing is not the same as credential verification.',
    };
  }

  async createEnquiry(dto: ProfessionalEnquiryDto) {
    let listingId: string | undefined;
    if (dto.listingId || dto.slug) {
      const listing = await this.findListingByIdOrSlug(dto.listingId, dto.slug);
      if (!isPubliclyListed(listing.listingStatus)) throw new NotFoundException('Professional not found');
      listingId = listing.id;
    }
    const created = await this.prisma.professionalEnquiry.create({
      data: {
        professionalListingId: listingId,
        requesterName: dto.requesterName.trim(),
        email: normalizeEmail(dto.email) || dto.email,
        phone: dto.phone,
        propertyState: dto.propertyState,
        propertyCity: dto.propertyCity,
        whatDoYouNeed: dto.whatDoYouNeed.trim(),
        message: dto.message,
      },
    });
    return { id: created.id, status: created.status, message: 'Request received. BuildMyHouse will follow up.' };
  }

  private async findListingByIdOrSlug(id?: string, slug?: string) {
    const listing = await this.prisma.professionalListing.findFirst({
      where: id ? { id } : { slug: slug || '' },
    });
    if (!listing) throw new NotFoundException('Professional not found');
    return listing;
  }

  async adminSearch(query: AdminProfessionalSearchDto) {
    const page = query.page || 1;
    const limit = query.limit || 30;
    const and: Prisma.ProfessionalListingWhereInput[] = [];
    if (query.listingStatus) and.push({ listingStatus: query.listingStatus });
    if (query.verificationStatus) and.push({ verificationStatus: query.verificationStatus });
    if (query.procurementStatus) and.push({ procurementStatus: query.procurementStatus });
    if (query.ownershipStatus) and.push({ ownershipStatus: query.ownershipStatus });
    if (query.profession) {
      and.push({
        OR: [{ primaryProfession: { key: query.profession } }, { primaryProfessionId: query.profession }],
      });
    }
    if (query.state) {
      and.push({
        OR: [{ stateKey: query.state }, { state: { contains: query.state, mode: 'insensitive' } }],
      });
    }
    if (query.usedByBmh) and.push({ usedByBmh: true });
    if (query.incomplete) and.push({ completenessScore: { lt: 70 } });
    if (query.query?.trim()) {
      const q = query.query.trim();
      and.push({
        OR: [
          { displayName: { contains: q, mode: 'insensitive' } },
          { slug: { contains: q, mode: 'insensitive' } },
          { phone: { contains: q } },
          { email: { contains: q, mode: 'insensitive' } },
          { city: { contains: q, mode: 'insensitive' } },
          { credentials: { some: { registrationNumber: { contains: q, mode: 'insensitive' } } } },
          { primaryProfession: { label: { contains: q, mode: 'insensitive' } } },
        ],
      });
    }
    const where: Prisma.ProfessionalListingWhereInput = and.length ? { AND: and } : {};
    const [total, rows, counts] = await Promise.all([
      this.prisma.professionalListing.count({ where }),
      this.prisma.professionalListing.findMany({
        where,
        include: {
          primaryProfession: true,
          credentials: true,
          procurement: true,
        },
        orderBy: { updatedAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.adminCounts(),
    ]);
    return {
      data: rows.map((row) => this.toAdminListItem(row)),
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) || 1 },
      counts,
    };
  }

  private async adminCounts() {
    const [total, listed, credentialChecked, pending, procurementReady, usedByBmh] = await Promise.all([
      this.prisma.professionalListing.count(),
      this.prisma.professionalListing.count({ where: { listingStatus: ProfessionalListingStatus.listed } }),
      this.prisma.professionalListing.count({
        where: { verificationStatus: ProfessionalVerificationStatus.verified },
      }),
      this.prisma.professionalListing.count({
        where: { verificationStatus: ProfessionalVerificationStatus.pending },
      }),
      this.prisma.professionalListing.count({ where: { procurementStatus: 'ready' } }),
      this.prisma.professionalListing.count({ where: { usedByBmh: true } }),
    ]);
    return { total, listed, credentialChecked, pending, procurementReady, usedByBmh };
  }

  async adminGet(id: string) {
    const listing = await this.prisma.professionalListing.findUnique({
      where: { id },
      include: ADMIN_INCLUDE,
    });
    if (!listing) throw new NotFoundException('Professional not found');
    return this.toAdminDetail(listing);
  }

  async findDuplicates(input: {
    displayName?: string;
    phone?: string;
    email?: string;
    website?: string;
    regulatorKey?: string;
    registrationNumber?: string;
    excludeId?: string;
  }) {
    const or: Prisma.ProfessionalListingWhereInput[] = [];
    const name = normalizeDisplayName(input.displayName);
    const phone = normalizePhone(input.phone);
    const email = normalizeEmail(input.email);
    const domain = websiteDomain(input.website);
    const reg = normalizeRegKey(input.regulatorKey, input.registrationNumber);
    if (name) or.push({ normalizedName: name });
    if (phone) or.push({ normalizedPhone: phone });
    if (email) or.push({ normalizedEmail: email });
    if (domain) or.push({ websiteDomain: domain });
    if (reg) or.push({ credentials: { some: { normalizedRegKey: reg } } });
    if (!or.length) return [];
    return this.prisma.professionalListing.findMany({
      where: {
        AND: [{ OR: or }, input.excludeId ? { id: { not: input.excludeId } } : {}],
      },
      select: { id: true, displayName: true, slug: true, city: true, state: true, listingStatus: true },
      take: 8,
    });
  }

  async adminCreate(adminId: string, dto: AdminCreateProfessionalDto) {
    if (dto.usedByBmh && !dto.usedByBmhNote) {
      throw new BadRequestException('Historical Used by BMH requires an internal note.');
    }
    const profession = await this.prisma.professionCatalog.findUnique({ where: { id: dto.primaryProfessionId } });
    if (!profession) throw new BadRequestException('Unknown profession');
    const duplicates = await this.findDuplicates(dto);
    const slug = await this.uniqueSlug(dto.slug || `${dto.displayName} ${profession.key}`);
    const listing = await this.prisma.professionalListing.create({
      data: {
        displayName: dto.displayName.trim(),
        professionalType: dto.professionalType,
        primaryProfessionId: dto.primaryProfessionId,
        bio: dto.bio,
        yearsExperience: dto.yearsExperience,
        phone: dto.phone,
        email: normalizeEmail(dto.email) ?? dto.email,
        whatsapp: dto.whatsapp,
        website: dto.website,
        address: dto.address,
        city: dto.city,
        state: dto.state,
        stateKey: dto.stateKey || (dto.state ? dto.state.toLowerCase().replace(/\s+/g, '-') : undefined),
        serviceStates: dto.serviceStates || [],
        serviceCities: dto.serviceCities || [],
        remoteConsultation: dto.remoteConsultation ?? false,
        siteVisits: dto.siteVisits ?? false,
        canIssueSignedReport: dto.canIssueSignedReport ?? false,
        publicPhone: dto.publicPhone ?? false,
        publicEmail: dto.publicEmail ?? false,
        publicWhatsapp: dto.publicWhatsapp ?? false,
        publicWebsite: dto.publicWebsite ?? true,
        listingStatus: dto.listingStatus || ProfessionalListingStatus.draft,
        ownershipStatus: dto.ownershipStatus,
        procurementStatus: dto.procurementStatus,
        sourceType: dto.sourceType || ProfessionalSourceType.admin_research,
        sourceNotes: dto.sourceNotes,
        sourceUrls: dto.sourceUrls || [],
        usedByBmh: dto.usedByBmh ?? false,
        usedByBmhSince: dto.usedByBmhSince ? new Date(dto.usedByBmhSince) : undefined,
        usedByBmhNote: dto.usedByBmhNote,
        slug,
        createdByAdminId: adminId,
        listedAt: dto.listingStatus === ProfessionalListingStatus.listed ? new Date() : null,
        normalizedName: normalizeDisplayName(dto.displayName),
        normalizedPhone: normalizePhone(dto.phone),
        normalizedEmail: normalizeEmail(dto.email),
        websiteDomain: websiteDomain(dto.website),
      },
    });
    await this.replaceJoins(listing.id, dto);
    await this.prisma.professionalProcurementProfile.create({
      data: { professionalListingId: listing.id },
    });
    await this.refreshScores(listing.id);
    return { ...(await this.adminGet(listing.id)), possibleDuplicates: duplicates };
  }

  async adminUpdate(id: string, dto: AdminProfessionalWriteDto) {
    const existing = await this.prisma.professionalListing.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Professional not found');
    if (dto.usedByBmh && !existing.usedByBmh && !dto.usedByBmhNote && !existing.usedByBmhNote) {
      throw new BadRequestException('Marking Used by BMH without a completed engagement requires an internal note.');
    }
    if (dto.slug && dto.slug !== existing.slug) {
      dto.slug = await this.uniqueSlug(dto.slug, id);
    }
    await this.prisma.professionalListing.update({
      where: { id },
      data: {
        ...this.writeData(dto),
        listedAt:
          dto.listingStatus === ProfessionalListingStatus.listed && !existing.listedAt
            ? new Date()
            : existing.listedAt,
        archivedAt: dto.listingStatus === ProfessionalListingStatus.archived ? new Date() : existing.archivedAt,
      },
    });
    await this.replaceJoins(id, dto);
    await this.refreshScores(id);
    return this.adminGet(id);
  }

  async setListingStatus(id: string, dto: AdminListingStatusDto) {
    return this.adminUpdate(id, { listingStatus: dto.listingStatus });
  }

  async setVerification(adminId: string, id: string, dto: AdminVerificationActionDto) {
    const listing = await this.prisma.professionalListing.findUnique({
      where: { id },
      include: { primaryProfession: true, credentials: true },
    });
    if (!listing) throw new NotFoundException('Professional not found');
    if (dto.verificationStatus === ProfessionalVerificationStatus.verified) {
      this.assertCanVerify(listing);
    }
    await this.prisma.professionalListing.update({
      where: { id },
      data: { verificationStatus: dto.verificationStatus },
    });
    if (dto.note) {
      const primary = listing.credentials.find((c) => c.isPrimary) || listing.credentials[0];
      if (primary) {
        await this.prisma.professionalCredential.update({
          where: { id: primary.id },
          data: {
            verificationNotes: dto.note,
            verifiedByAdminId: adminId,
            verifiedAt: dto.verificationStatus === ProfessionalVerificationStatus.verified ? new Date() : primary.verifiedAt,
          },
        });
      }
    }
    await this.refreshScores(id);
    return this.adminGet(id);
  }

  private assertCanVerify(listing: {
    primaryProfession: { verificationMode: ProfessionalVerificationMode } | null;
    credentials: Array<{
      registrationNumber: string | null;
      verificationSourceUrl: string | null;
      verificationNotes: string | null;
      verifiedAt: Date | null;
      verifiedByAdminId: string | null;
      verificationStatus: ProfessionalCredentialVerification;
    }>;
  }) {
    const regulated = listing.primaryProfession?.verificationMode === ProfessionalVerificationMode.regulator;
    const ready = listing.credentials.find(
      (c) =>
        c.verificationStatus === ProfessionalCredentialVerification.checked &&
        !!c.registrationNumber &&
        !!(c.verificationSourceUrl || c.verificationNotes) &&
        !!c.verifiedAt &&
        !!c.verifiedByAdminId,
    );
    if (regulated && !ready) {
      throw new BadRequestException(
        'A regulated profession needs a checked credential with registration number, source or note, date, and reviewer before it can be marked credential-checked.',
      );
    }
    if (!listing.credentials.length) {
      throw new BadRequestException('Add at least one credential or document record before marking credential-checked.');
    }
  }

  async addCredential(adminId: string, listingId: string, dto: AdminCredentialDto) {
    const listing = await this.prisma.professionalListing.findUnique({
      where: { id: listingId },
      include: { primaryProfession: true },
    });
    if (!listing) throw new NotFoundException('Professional not found');
    const normalizedRegKey = normalizeRegKey(dto.regulatorKey, dto.registrationNumber);
    if (normalizedRegKey) {
      const clash = await this.prisma.professionalCredential.findUnique({ where: { normalizedRegKey } });
      if (clash && clash.professionalListingId !== listingId) {
        throw new ConflictException('That regulator registration number is already on another listing.');
      }
    }
    const expiresAt = dto.expiresAt ? new Date(dto.expiresAt) : null;
    const created = await this.prisma.professionalCredential.create({
      data: {
        professionalListingId: listingId,
        credentialType: dto.credentialType || listing.primaryProfession.regulatorKey || 'document',
        regulatorKey: dto.regulatorKey || listing.primaryProfession.regulatorKey,
        regulatorLabel: dto.regulatorLabel || listing.primaryProfession.regulatorLabel,
        registrationNumber: dto.registrationNumber,
        normalizedRegKey,
        holderName: dto.holderName || listing.displayName,
        holderType: dto.holderType || listing.professionalType,
        verificationSourceUrl: dto.verificationSourceUrl,
        issuedAt: dto.issuedAt ? new Date(dto.issuedAt) : null,
        expiresAt,
        credentialStatus: credentialCurrencyStatus(expiresAt),
        verificationStatus: dto.markChecked
          ? ProfessionalCredentialVerification.checked
          : ProfessionalCredentialVerification.pending,
        verificationNotes: dto.verificationNotes,
        isPrimary: dto.isPrimary ?? true,
        isPublic: dto.isPublic ?? true,
        verifiedAt: dto.markChecked ? new Date() : null,
        verifiedByAdminId: dto.markChecked ? adminId : null,
      },
    });
    await this.syncListingVerification(listingId);
    return created;
  }

  async updateCredential(adminId: string, credentialId: string, dto: AdminCredentialDto) {
    const existing = await this.prisma.professionalCredential.findUnique({ where: { id: credentialId } });
    if (!existing) throw new NotFoundException('Credential not found');
    const normalizedRegKey =
      dto.regulatorKey || dto.registrationNumber
        ? normalizeRegKey(dto.regulatorKey ?? existing.regulatorKey, dto.registrationNumber ?? existing.registrationNumber)
        : existing.normalizedRegKey;
    if (normalizedRegKey && normalizedRegKey !== existing.normalizedRegKey) {
      const clash = await this.prisma.professionalCredential.findUnique({ where: { normalizedRegKey } });
      if (clash && clash.id !== credentialId) {
        throw new ConflictException('That regulator registration number is already on another listing.');
      }
    }
    const expiresAt = dto.expiresAt ? new Date(dto.expiresAt) : existing.expiresAt;
    await this.prisma.professionalCredential.update({
      where: { id: credentialId },
      data: {
        credentialType: dto.credentialType ?? existing.credentialType,
        regulatorKey: dto.regulatorKey ?? existing.regulatorKey,
        regulatorLabel: dto.regulatorLabel ?? existing.regulatorLabel,
        registrationNumber: dto.registrationNumber ?? existing.registrationNumber,
        normalizedRegKey,
        holderName: dto.holderName ?? existing.holderName,
        holderType: dto.holderType ?? existing.holderType,
        verificationSourceUrl: dto.verificationSourceUrl ?? existing.verificationSourceUrl,
        issuedAt: dto.issuedAt ? new Date(dto.issuedAt) : existing.issuedAt,
        expiresAt,
        credentialStatus: credentialCurrencyStatus(expiresAt),
        verificationNotes: dto.verificationNotes ?? existing.verificationNotes,
        isPrimary: dto.isPrimary ?? existing.isPrimary,
        isPublic: dto.isPublic ?? existing.isPublic,
        verificationStatus: dto.markChecked
          ? ProfessionalCredentialVerification.checked
          : existing.verificationStatus,
        verifiedAt: dto.markChecked ? new Date() : existing.verifiedAt,
        verifiedByAdminId: dto.markChecked ? adminId : existing.verifiedByAdminId,
      },
    });
    await this.syncListingVerification(existing.professionalListingId);
    return this.adminGet(existing.professionalListingId);
  }

  async deleteCredential(credentialId: string) {
    const existing = await this.prisma.professionalCredential.findUnique({ where: { id: credentialId } });
    if (!existing) throw new NotFoundException('Credential not found');
    await this.prisma.professionalCredential.delete({ where: { id: credentialId } });
    await this.syncListingVerification(existing.professionalListingId);
    return { ok: true };
  }

  async addCredentialDocument(credentialId: string, dto: AdminCredentialDocumentDto, uploadedBy?: string) {
    const credential = await this.prisma.professionalCredential.findUnique({ where: { id: credentialId } });
    if (!credential) throw new NotFoundException('Credential not found');
    return this.prisma.professionalCredentialDocument.create({
      data: {
        credentialId,
        documentType: dto.documentType,
        fileName: dto.fileName,
        fileRef: dto.fileRef,
        mimeType: dto.mimeType,
        fileSizeBytes: dto.fileSizeBytes,
        uploadedBy,
        isPublic: false,
      },
    });
  }

  async upsertProcurement(id: string, dto: AdminProcurementDto) {
    const listing = await this.prisma.professionalListing.findUnique({ where: { id } });
    if (!listing) throw new NotFoundException('Professional not found');
    await this.prisma.professionalProcurementProfile.upsert({
      where: { professionalListingId: id },
      update: {
        availabilityStatus: dto.availabilityStatus,
        inspectionFee: dto.inspectionFee,
        reportFee: dto.reportFee,
        consultationFee: dto.consultationFee,
        currency: dto.currency,
        travelFeeNotes: dto.travelFeeNotes,
        rateNotes: dto.rateNotes,
        typicalTurnaroundHours: dto.typicalTurnaroundHours,
        acceptsBmhNegotiatedRates: dto.acceptsBmhNegotiatedRates,
        capabilityTags: dto.capabilityTags,
        lastContactedAt: dto.lastContactedAt ? new Date(dto.lastContactedAt) : undefined,
        internalNotes: dto.internalNotes,
      },
      create: {
        professionalListingId: id,
        availabilityStatus: dto.availabilityStatus,
        inspectionFee: dto.inspectionFee,
        reportFee: dto.reportFee,
        consultationFee: dto.consultationFee,
        currency: dto.currency || 'NGN',
        travelFeeNotes: dto.travelFeeNotes,
        rateNotes: dto.rateNotes,
        typicalTurnaroundHours: dto.typicalTurnaroundHours,
        acceptsBmhNegotiatedRates: dto.acceptsBmhNegotiatedRates ?? false,
        capabilityTags: dto.capabilityTags || [],
        lastContactedAt: dto.lastContactedAt ? new Date(dto.lastContactedAt) : undefined,
        internalNotes: dto.internalNotes,
      },
    });
    if (dto.procurementStatus) {
      await this.prisma.professionalListing.update({
        where: { id },
        data: { procurementStatus: dto.procurementStatus },
      });
    }
    return this.adminGet(id);
  }

  async reviewApplication(adminId: string, id: string, dto: AdminReviewDto) {
    const application = await this.prisma.professionalApplication.findUnique({ where: { id } });
    if (!application) throw new NotFoundException('Application not found');
    let createdListingId = application.createdListingId;
    if (dto.status === ProfessionalReviewStatus.approved && dto.createListing && !createdListingId) {
      if (!application.professionId) throw new BadRequestException('Application has no profession to create a listing from.');
      const created = await this.adminCreate(adminId, {
        displayName: application.displayName,
        professionalType: application.professionalType,
        primaryProfessionId: application.professionId,
        phone: application.phone || undefined,
        email: application.email || undefined,
        whatsapp: application.whatsapp || undefined,
        website: application.website || undefined,
        state: application.state || undefined,
        city: application.city || undefined,
        bio: application.shortDescription || undefined,
        sourceType: ProfessionalSourceType.self_submitted,
        listingStatus: ProfessionalListingStatus.draft,
      });
      createdListingId = created.id;
    }
    await this.prisma.professionalApplication.update({
      where: { id },
      data: {
        status: dto.status,
        adminNotes: dto.adminNotes,
        reviewedByAdminId: adminId,
        reviewedAt: new Date(),
        createdListingId,
      },
    });
    return this.prisma.professionalApplication.findUnique({ where: { id } });
  }

  async reviewClaim(adminId: string, id: string, dto: AdminReviewDto) {
    const claim = await this.prisma.professionalClaimRequest.findUnique({ where: { id } });
    if (!claim) throw new NotFoundException('Claim not found');
    await this.prisma.professionalClaimRequest.update({
      where: { id },
      data: {
        status: dto.status,
        adminNotes: dto.adminNotes,
        reviewedByAdminId: adminId,
        reviewedAt: new Date(),
      },
    });
    await this.prisma.professionalListing.update({
      where: { id: claim.professionalListingId },
      data: {
        ownershipStatus:
          dto.status === ProfessionalReviewStatus.approved
            ? ProfessionalOwnershipStatus.claimed
            : ProfessionalOwnershipStatus.unclaimed,
        sourceType:
          dto.status === ProfessionalReviewStatus.approved
            ? ProfessionalSourceType.claimed
            : undefined,
      },
    });
    await this.refreshScores(claim.professionalListingId);
    return this.adminGet(claim.professionalListingId);
  }

  async listApplications(status?: ProfessionalReviewStatus) {
    return this.prisma.professionalApplication.findMany({
      where: status ? { status } : undefined,
      include: { profession: true, createdListing: { select: { id: true, slug: true, displayName: true } } },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }

  async listClaims(status?: ProfessionalReviewStatus) {
    return this.prisma.professionalClaimRequest.findMany({
      where: status ? { status } : undefined,
      include: { listing: { select: { id: true, slug: true, displayName: true } } },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }

  async listEnquiries() {
    return this.prisma.professionalEnquiry.findMany({
      include: { listing: { select: { id: true, slug: true, displayName: true } } },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }

  async createEngagement(adminId: string, listingId: string, dto: AdminEngagementDto) {
    const listing = await this.prisma.professionalListing.findUnique({ where: { id: listingId } });
    if (!listing) throw new NotFoundException('Professional not found');
    const project = await this.prisma.project.findUnique({ where: { id: dto.projectId } });
    if (!project) throw new BadRequestException('Project not found');
    if (dto.stageId) {
      const stage = await this.prisma.stage.findFirst({ where: { id: dto.stageId, projectId: dto.projectId } });
      if (!stage) throw new BadRequestException('Stage does not belong to that project');
    }
    const created = await this.prisma.professionalEngagement.create({
      data: {
        professionalListingId: listingId,
        projectId: dto.projectId,
        stageId: dto.stageId,
        purpose: dto.purpose.trim(),
        serviceId: dto.serviceId,
        requiredDeliverableId: dto.requiredDeliverableId,
        fee: dto.fee,
        currency: dto.currency || 'NGN',
        status: dto.status || ProfessionalEngagementStatus.assigned,
        assignedAt: new Date(),
        dueAt: dto.dueAt ? new Date(dto.dueAt) : null,
        reportUrl: dto.reportUrl,
        reportNotes: dto.reportNotes,
        professionalRecommendation: dto.professionalRecommendation,
        internalDecisionNotes: dto.internalDecisionNotes,
        createdByAdminId: adminId,
      },
    });
    return created;
  }

  async updateEngagement(id: string, dto: AdminEngagementUpdateDto) {
    const existing = await this.prisma.professionalEngagement.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Engagement not found');
    const completed =
      dto.status === ProfessionalEngagementStatus.completed &&
      existing.status !== ProfessionalEngagementStatus.completed;
    await this.prisma.professionalEngagement.update({
      where: { id },
      data: {
        status: dto.status,
        stageId: dto.stageId,
        fee: dto.fee,
        dueAt: dto.dueAt ? new Date(dto.dueAt) : undefined,
        reportUrl: dto.reportUrl,
        reportNotes: dto.reportNotes,
        professionalRecommendation: dto.professionalRecommendation,
        internalDecisionNotes: dto.internalDecisionNotes,
        deliveredAt: dto.status === ProfessionalEngagementStatus.delivered ? new Date() : existing.deliveredAt,
        completedAt: completed ? new Date() : existing.completedAt,
      },
    });
    if (completed) {
      await this.prisma.professionalListing.update({
        where: { id: existing.professionalListingId },
        data: {
          usedByBmh: true,
          usedByBmhSince: new Date(),
          usedByBmhNote: existing.purpose,
        },
      });
      await this.refreshScores(existing.professionalListingId);
    }
    return this.prisma.professionalEngagement.findUnique({
      where: { id },
      include: {
        project: { select: { id: true, name: true } },
        stage: { select: { id: true, name: true } },
      },
    });
  }

  async patchTaxonomy(kind: 'profession' | 'specialty' | 'service' | 'deliverable' | 'stage', id: string, dto: AdminTaxonomyPatchDto) {
    const data = { isActive: dto.isActive, label: dto.label, sortOrder: dto.sortOrder };
    if (kind === 'profession') return this.prisma.professionCatalog.update({ where: { id }, data });
    if (kind === 'specialty') return this.prisma.professionSpecialty.update({ where: { id }, data });
    if (kind === 'service') return this.prisma.professionService.update({ where: { id }, data });
    if (kind === 'deliverable') return this.prisma.professionDeliverable.update({ where: { id }, data });
    return this.prisma.professionalProjectStage.update({ where: { id }, data });
  }

  assertPublicCannotSelfVerify() {
    throw new ForbiddenException('Professionals cannot mark their own credentials as checked.');
  }

  private writeData(dto: AdminProfessionalWriteDto): Prisma.ProfessionalListingUncheckedUpdateInput {
    return {
      displayName: dto.displayName?.trim(),
      professionalType: dto.professionalType,
      primaryProfessionId: dto.primaryProfessionId,
      bio: dto.bio,
      yearsExperience: dto.yearsExperience,
      phone: dto.phone,
      email: normalizeEmail(dto.email) ?? dto.email,
      whatsapp: dto.whatsapp,
      website: dto.website,
      address: dto.address,
      city: dto.city,
      state: dto.state,
      stateKey: dto.stateKey || (dto.state ? dto.state.toLowerCase().replace(/\s+/g, '-') : undefined),
      serviceStates: dto.serviceStates,
      serviceCities: dto.serviceCities,
      remoteConsultation: dto.remoteConsultation,
      siteVisits: dto.siteVisits,
      canIssueSignedReport: dto.canIssueSignedReport,
      publicPhone: dto.publicPhone,
      publicEmail: dto.publicEmail,
      publicWhatsapp: dto.publicWhatsapp,
      publicWebsite: dto.publicWebsite,
      listingStatus: dto.listingStatus,
      ownershipStatus: dto.ownershipStatus,
      procurementStatus: dto.procurementStatus,
      sourceType: dto.sourceType,
      sourceNotes: dto.sourceNotes,
      sourceUrls: dto.sourceUrls,
      usedByBmh: dto.usedByBmh,
      usedByBmhSince: dto.usedByBmhSince ? new Date(dto.usedByBmhSince) : undefined,
      usedByBmhNote: dto.usedByBmhNote,
      slug: dto.slug,
      normalizedName: normalizeDisplayName(dto.displayName),
      normalizedPhone: normalizePhone(dto.phone),
      normalizedEmail: normalizeEmail(dto.email),
      websiteDomain: websiteDomain(dto.website),
    };
  }

  private async replaceJoins(listingId: string, dto: AdminProfessionalWriteDto) {
    if (dto.specialtyIds) {
      await this.prisma.professionalListingSpecialty.deleteMany({ where: { professionalListingId: listingId } });
      if (dto.specialtyIds.length) {
        await this.prisma.professionalListingSpecialty.createMany({
          data: dto.specialtyIds.map((specialtyId) => ({ professionalListingId: listingId, specialtyId })),
        });
      }
    }
    if (dto.serviceIds) {
      await this.prisma.professionalListingService.deleteMany({ where: { professionalListingId: listingId } });
      if (dto.serviceIds.length) {
        await this.prisma.professionalListingService.createMany({
          data: dto.serviceIds.map((serviceId) => ({ professionalListingId: listingId, serviceId })),
        });
      }
    }
    if (dto.deliverableIds) {
      await this.prisma.professionalListingDeliverable.deleteMany({ where: { professionalListingId: listingId } });
      if (dto.deliverableIds.length) {
        await this.prisma.professionalListingDeliverable.createMany({
          data: dto.deliverableIds.map((deliverableId) => ({ professionalListingId: listingId, deliverableId })),
        });
      }
    }
    if (dto.projectStageIds) {
      await this.prisma.professionalListingStage.deleteMany({ where: { professionalListingId: listingId } });
      if (dto.projectStageIds.length) {
        await this.prisma.professionalListingStage.createMany({
          data: dto.projectStageIds.map((projectStageId) => ({ professionalListingId: listingId, projectStageId })),
        });
      }
    }
  }

  private async uniqueSlug(input: string, excludeId?: string) {
    const base = normalizeProfessionalSlug(input) || 'professional';
    let slug = base;
    let i = 2;
    while (
      await this.prisma.professionalListing.findFirst({
        where: { slug, ...(excludeId ? { id: { not: excludeId } } : {}) },
        select: { id: true },
      })
    ) {
      slug = `${base}-${i}`;
      i += 1;
    }
    return slug;
  }

  private async syncListingVerification(listingId: string) {
    const credentials = await this.prisma.professionalCredential.findMany({ where: { professionalListingId: listingId } });
    const verificationStatus = aggregateVerification(credentials);
    await this.prisma.professionalListing.update({
      where: { id: listingId },
      data: { verificationStatus },
    });
    await this.refreshScores(listingId);
  }

  private async refreshScores(listingId: string) {
    const listing = await this.prisma.professionalListing.findUnique({
      where: { id: listingId },
      include: {
        specialties: true,
        services: true,
        deliverables: true,
        projectStages: true,
        credentials: true,
      },
    });
    if (!listing) return;
    const completenessScore = computeCompleteness({
      displayName: listing.displayName,
      professionalType: listing.professionalType,
      primaryProfessionId: listing.primaryProfessionId,
      phone: listing.phone,
      email: listing.email,
      website: listing.website,
      whatsapp: listing.whatsapp,
      city: listing.city,
      state: listing.state,
      serviceStatesCount: listing.serviceStates.length,
      specialtiesCount: listing.specialties.length,
      servicesCount: listing.services.length,
      deliverablesCount: listing.deliverables.length,
      stagesCount: listing.projectStages.length,
      bio: listing.bio,
      yearsExperience: listing.yearsExperience,
      credentialsCount: listing.credentials.length,
      remoteConsultation: listing.remoteConsultation,
      siteVisits: listing.siteVisits,
    });
    const searchRank = computeSearchRank({
      usedByBmh: listing.usedByBmh,
      verificationStatus: listing.verificationStatus,
      ownershipStatus: listing.ownershipStatus,
      completenessScore,
    });
    await this.prisma.professionalListing.update({
      where: { id: listingId },
      data: { completenessScore, searchRank },
    });
  }

  private toAdminListItem(row: any) {
    return {
      id: row.id,
      slug: row.slug,
      displayName: row.displayName,
      professionalType: row.professionalType,
      profession: row.primaryProfession ? { id: row.primaryProfession.id, key: row.primaryProfession.key, label: row.primaryProfession.label, regulatorLabel: row.primaryProfession.regulatorLabel } : null,
      city: row.city,
      state: row.state,
      listingStatus: row.listingStatus,
      ownershipStatus: row.ownershipStatus,
      verificationStatus: row.verificationStatus,
      procurementStatus: row.procurementStatus,
      usedByBmh: row.usedByBmh,
      completenessScore: row.completenessScore,
      phone: row.phone,
      email: row.email,
      updatedAt: row.updatedAt,
    };
  }

  private toAdminDetail(row: any) {
    return {
      ...this.toAdminListItem(row),
      bio: row.bio,
      yearsExperience: row.yearsExperience,
      phone: row.phone,
      email: row.email,
      whatsapp: row.whatsapp,
      website: row.website,
      address: row.address,
      serviceStates: row.serviceStates,
      serviceCities: row.serviceCities,
      remoteConsultation: row.remoteConsultation,
      siteVisits: row.siteVisits,
      canIssueSignedReport: row.canIssueSignedReport,
      publicPhone: row.publicPhone,
      publicEmail: row.publicEmail,
      publicWhatsapp: row.publicWhatsapp,
      publicWebsite: row.publicWebsite,
      usedByBmhSince: row.usedByBmhSince,
      usedByBmhNote: row.usedByBmhNote,
      sourceType: row.sourceType,
      sourceNotes: row.sourceNotes,
      sourceUrls: row.sourceUrls,
      linkedUserId: row.linkedUserId,
      createdAt: row.createdAt,
      specialties: (row.specialties || []).map((s: any) => s.specialty),
      services: (row.services || []).map((s: any) => s.service),
      deliverables: (row.deliverables || []).map((s: any) => s.deliverable),
      projectStages: (row.projectStages || []).map((s: any) => s.projectStage),
      credentials: row.credentials,
      procurement: row.procurement,
      engagements: row.engagements,
      claims: row.claims,
      applications: row.applications,
      enquiries: row.enquiries,
    };
  }
}
