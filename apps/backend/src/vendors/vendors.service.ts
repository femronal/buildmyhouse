import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  Prisma,
  VendorAcquisitionSource,
  VendorActivityType,
  VendorClaimStatus,
  VendorListingStatus,
  VendorVerificationCheckKey,
  VendorVerificationCheckStatus,
  VendorVerificationStatus,
} from '@prisma/client';
import { createHash, randomBytes } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../email/email.service';
import {
  AdminActivityDto,
  AdminClaimInviteDto,
  AdminCreateVendorDto,
  AdminReviewActionDto,
  AdminUpdateVendorDto,
  AdminUpsertVerificationChecksDto,
  AdminVendorSearchDto,
  ApplyVendorDto,
  PublicVendorSearchDto,
  VendorDocumentInputDto,
  VendorManageUpdateDto,
  VendorOfferingInputDto,
  VendorQuoteRequestDto,
  VendorRepresentativeInputDto,
  VendorSensitiveChangeDto,
  VendorServiceAreaInputDto,
} from './dto/vendors.dto';
import {
  VERIFICATION_CHECK_KEYS,
  buildApplicationReference,
  computeProfileCompleteness,
  isPubliclyListed,
  normalizeEmail,
  normalizePhone,
  normalizeTradingName,
  normalizeVendorSlug,
  toPublicVendorCard,
  toPublicVendorProfile,
  websiteDomain,
} from './vendor-helpers';

const PUBLIC_INCLUDE = {
  offerings: { orderBy: { sortOrder: 'asc' as const } },
  serviceAreas: true,
  representatives: true,
  verificationChecks: true,
} satisfies Prisma.VendorProfileInclude;

const ADMIN_INCLUDE = {
  ...PUBLIC_INCLUDE,
  documents: { orderBy: { createdAt: 'desc' as const } },
  adminNotes: { orderBy: { createdAt: 'desc' as const }, take: 50 },
  activities: { orderBy: { createdAt: 'desc' as const }, take: 50 },
  claimInvites: { orderBy: { createdAt: 'desc' as const }, take: 10 },
  quoteRequests: { orderBy: { createdAt: 'desc' as const }, take: 20 },
  changeRequests: { orderBy: { createdAt: 'desc' as const }, take: 20 },
} satisfies Prisma.VendorProfileInclude;

@Injectable()
export class VendorsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly email: EmailService,
  ) {}

  // ---------------------------------------------------------------------------
  // Public
  // ---------------------------------------------------------------------------

  async searchPublic(dto: PublicVendorSearchDto) {
    const page = dto.page ?? 1;
    const limit = dto.limit ?? 20;
    const skip = (page - 1) * limit;
    const where = this.buildPublicWhere(dto);

    const [total, rows] = await Promise.all([
      this.prisma.vendorProfile.count({ where }),
      this.prisma.vendorProfile.findMany({
        where,
        include: {
          offerings: true,
          serviceAreas: true,
          verificationChecks: true,
        },
        skip,
        take: limit,
        orderBy: [
          { verificationStatus: 'desc' },
          { profileCompleteness: 'desc' },
          { listedAt: 'desc' },
          { createdAt: 'desc' },
        ],
      }),
    ]);

    return {
      data: rows.map(toPublicVendorCard),
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) || 0 },
    };
  }

  async getPublicBySlug(slug: string) {
    const profile = await this.prisma.vendorProfile.findFirst({
      where: {
        slug: normalizeVendorSlug(slug),
        listingStatus: VendorListingStatus.listed,
        deletedAt: null,
      },
      include: PUBLIC_INCLUDE,
    });
    if (!profile) throw new NotFoundException('Vendor not found');
    return toPublicVendorProfile(profile);
  }

  async apply(dto: ApplyVendorDto, userId?: string) {
    if (
      !dto.accuracyConfirmed ||
      !dto.contactConsent ||
      !dto.publicDisplayConsent ||
      !dto.noGuaranteeAcknowledged
    ) {
      throw new BadRequestException('Required application acknowledgements were not accepted');
    }

    const duplicates = await this.findDuplicateCandidates({
      tradingName: dto.tradingName,
      phone: dto.publicPhone,
      whatsapp: dto.publicWhatsApp,
      email: dto.publicEmail,
      cacNumber: dto.cacNumber,
      websiteUrl: dto.websiteUrl,
    });

    const slug = await this.uniqueSlug(dto.tradingName);
    const applicationReference = await this.uniqueApplicationReference();
    const completeness = this.completenessFromPayload(dto);

    const profile = await this.prisma.vendorProfile.create({
      data: {
        userId: userId || null,
        slug,
        tradingName: dto.tradingName.trim(),
        legalName: dto.legalName?.trim() || null,
        description: dto.description?.trim() || null,
        logoUrl: dto.logoUrl || null,
        yearEstablished: dto.yearEstablished ?? null,
        businessTypes: dto.businessTypes || [],
        listingStatus: VendorListingStatus.submitted,
        verificationStatus: VendorVerificationStatus.unverified,
        claimStatus: userId ? VendorClaimStatus.claimed : VendorClaimStatus.unclaimed,
        profileCompleteness: completeness,
        applicationReference,
        acquisitionSource: VendorAcquisitionSource.vendor_self_signup,
        publicPhone: dto.publicPhone || null,
        publicWhatsApp: dto.publicWhatsApp || null,
        publicEmail: dto.publicEmail || null,
        showPublicPhone: dto.showPublicPhone ?? true,
        showPublicWhatsApp: dto.showPublicWhatsApp ?? true,
        showPublicEmail: dto.showPublicEmail ?? false,
        websiteUrl: dto.websiteUrl || null,
        socialLinks: dto.socialLinks || undefined,
        preferredContactMethod: dto.preferredContactMethod || null,
        salesContactName: dto.salesContactName || null,
        quotationEmail: dto.quotationEmail || null,
        businessHours: dto.businessHours || null,
        acceptsSmallOrders: dto.acceptsSmallOrders ?? true,
        acceptsBulkOrders: dto.acceptsBulkOrders ?? true,
        acceptsProjectQuotations: dto.acceptsProjectQuotations ?? true,
        canSupplyBoqQuotations: dto.canSupplyBoqQuotations ?? false,
        canSourceUnstocked: dto.canSourceUnstocked ?? false,
        deliveryFleetAvailable: dto.deliveryFleetAvailable ?? false,
        thirdPartyDelivery: dto.thirdPartyDelivery ?? false,
        pickupAvailable: dto.pickupAvailable ?? true,
        interstateDelivery: dto.interstateDelivery ?? false,
        nationwideDelivery: dto.nationwideDelivery ?? false,
        installationAvailable: dto.installationAvailable ?? false,
        afterSalesSupport: dto.afterSalesSupport ?? false,
        warrantyHandling: dto.warrantyHandling ?? false,
        paymentMethodsAccepted: dto.paymentMethodsAccepted || [],
        depositRequired: dto.depositRequired ?? null,
        pricesNegotiable: dto.pricesNegotiable ?? true,
        priceListAvailable: dto.priceListAvailable ?? false,
        priceListUrl: dto.priceListUrl || null,
        typicalQuoteResponseHours: dto.typicalQuoteResponseHours ?? null,
        stateKey: dto.stateKey || null,
        stateLabel: dto.stateLabel || null,
        cityKey: dto.cityKey || null,
        cityLabel: dto.cityLabel || null,
        lgaLabel: dto.lgaLabel || null,
        publicAddress: dto.publicAddress || null,
        privateBusinessAddress: dto.privateBusinessAddress || null,
        addressVisibility: dto.addressVisibility || undefined,
        cacRegistrationStatus: dto.cacRegistrationStatus || null,
        cacNumber: dto.cacNumber || null,
        taxIdentificationNumber: dto.taxIdentificationNumber || null,
        normalizedTradingName: normalizeTradingName(dto.tradingName),
        normalizedPhone: normalizePhone(dto.publicPhone),
        normalizedWhatsApp: normalizePhone(dto.publicWhatsApp),
        normalizedEmail: normalizeEmail(dto.publicEmail),
        websiteDomain: websiteDomain(dto.websiteUrl),
        submittedAt: new Date(),
        offerings: dto.offerings?.length
          ? { create: dto.offerings.map((o, i) => this.mapOfferingCreate(o, i)) }
          : undefined,
        serviceAreas: dto.serviceAreas?.length
          ? { create: dto.serviceAreas.map((a) => this.mapServiceAreaCreate(a)) }
          : undefined,
        representatives: dto.representative
          ? { create: [this.mapRepresentativeCreate(dto.representative)] }
          : undefined,
        documents: dto.documents?.length
          ? { create: dto.documents.map((d) => this.mapDocumentCreate(d, userId)) }
          : undefined,
        verificationChecks: {
          create: VERIFICATION_CHECK_KEYS.map((checkKey) => ({
            checkKey: checkKey as VendorVerificationCheckKey,
            status: VendorVerificationCheckStatus.not_started,
          })),
        },
        activities: {
          create: {
            type: VendorActivityType.other,
            summary: 'Vendor application submitted',
            actorAdminId: null,
          },
        },
      },
      include: PUBLIC_INCLUDE,
    });

    if (dto.publicEmail) {
      await this.email.send({
        to: dto.publicEmail,
        subject: 'BuildMyHouse vendor application received',
        html: `<p>We received your application for <strong>${profile.tradingName}</strong>.</p>
<p>Reference: <strong>${profile.applicationReference}</strong></p>
<p>Submission does not guarantee approval or verification. Our team will review your details.</p>`,
        text: `We received your application for ${profile.tradingName}. Reference: ${profile.applicationReference}`,
      });
    }

    return {
      id: profile.id,
      applicationReference: profile.applicationReference,
      listingStatus: profile.listingStatus,
      message: 'Application received',
      possibleDuplicatesFlagged: duplicates.length,
    };
  }

  async createQuoteRequest(slug: string, dto: VendorQuoteRequestDto) {
    if (!dto.buyerEmail && !dto.buyerPhone) {
      throw new BadRequestException('Provide a buyer email or phone number');
    }
    const profile = await this.prisma.vendorProfile.findFirst({
      where: {
        slug: normalizeVendorSlug(slug),
        listingStatus: VendorListingStatus.listed,
        deletedAt: null,
      },
    });
    if (!profile) throw new NotFoundException('Vendor not found');

    const request = await this.prisma.vendorQuoteRequest.create({
      data: {
        vendorProfileId: profile.id,
        product: dto.product.trim(),
        specification: dto.specification || null,
        quantity: dto.quantity || null,
        deliveryLocation: dto.deliveryLocation || null,
        buyerName: dto.buyerName.trim(),
        buyerEmail: dto.buyerEmail || null,
        buyerPhone: dto.buyerPhone || null,
        projectId: dto.projectId || null,
        note: dto.note || null,
      },
    });

    await this.prisma.vendorActivity.create({
      data: {
        vendorProfileId: profile.id,
        type: VendorActivityType.quotation_requested,
        summary: `Quote request for ${dto.product}`,
        note: dto.note || null,
        projectId: dto.projectId || null,
        metadata: { quoteRequestId: request.id },
      },
    });

    const notifyEmail = profile.quotationEmail || profile.publicEmail;
    if (notifyEmail) {
      await this.email.send({
        to: notifyEmail,
        subject: `New quote request via BuildMyHouse — ${dto.product}`,
        html: `<p>A buyer requested a quote for <strong>${dto.product}</strong>.</p>
<p>Buyer: ${dto.buyerName}<br/>Phone: ${dto.buyerPhone || '—'}<br/>Email: ${dto.buyerEmail || '—'}</p>
<p>Quantity: ${dto.quantity || '—'}<br/>Delivery: ${dto.deliveryLocation || '—'}</p>
<p>${dto.note || ''}</p>`,
        text: `Quote request for ${dto.product} from ${dto.buyerName}`,
      });
    }

    return { id: request.id, status: request.status };
  }

  // ---------------------------------------------------------------------------
  // Admin
  // ---------------------------------------------------------------------------

  async adminSearch(dto: AdminVendorSearchDto) {
    const page = dto.page ?? 1;
    const limit = dto.limit ?? 30;
    const skip = (page - 1) * limit;
    const where = this.buildAdminWhere(dto);

    const [total, rows] = await Promise.all([
      this.prisma.vendorProfile.count({ where }),
      this.prisma.vendorProfile.findMany({
        where,
        include: {
          offerings: true,
          representatives: true,
          _count: { select: { documents: true, quoteRequests: true } },
        },
        skip,
        take: limit,
        orderBy: [{ updatedAt: 'desc' }],
      }),
    ]);

    return {
      data: rows,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) || 0 },
    };
  }

  async adminGet(id: string) {
    const profile = await this.prisma.vendorProfile.findFirst({
      where: { id, deletedAt: null },
      include: ADMIN_INCLUDE,
    });
    if (!profile) throw new NotFoundException('Vendor not found');
    return profile;
  }

  async adminCreate(adminId: string, dto: AdminCreateVendorDto) {
    const duplicates = await this.findDuplicateCandidates({
      tradingName: dto.tradingName,
      phone: dto.publicPhone,
      whatsapp: dto.publicWhatsApp,
      email: dto.publicEmail,
    });

    const slug = await this.uniqueSlug(dto.tradingName);
    const listingStatus = dto.saveAsInternalOnly
      ? VendorListingStatus.internal_only
      : VendorListingStatus.draft;

    const profile = await this.prisma.vendorProfile.create({
      data: {
        slug,
        tradingName: dto.tradingName.trim(),
        legalName: dto.legalName?.trim() || null,
        description: dto.description?.trim() || null,
        businessTypes: dto.businessTypes || [],
        listingStatus,
        verificationStatus: VendorVerificationStatus.unverified,
        claimStatus: VendorClaimStatus.unclaimed,
        acquisitionSource: dto.acquisitionSource || VendorAcquisitionSource.admin_manual,
        acquisitionNote: dto.acquisitionNote || null,
        publicPhone: dto.publicPhone || null,
        publicWhatsApp: dto.publicWhatsApp || null,
        publicEmail: dto.publicEmail || null,
        stateKey: dto.stateKey || null,
        stateLabel: dto.stateLabel || null,
        cityLabel: dto.cityLabel || null,
        normalizedTradingName: normalizeTradingName(dto.tradingName),
        normalizedPhone: normalizePhone(dto.publicPhone),
        normalizedWhatsApp: normalizePhone(dto.publicWhatsApp),
        normalizedEmail: normalizeEmail(dto.publicEmail),
        createdByAdminId: adminId,
        profileCompleteness: this.completenessFromPayload(dto),
        offerings: dto.offerings?.length
          ? { create: dto.offerings.map((o, i) => this.mapOfferingCreate(o, i)) }
          : undefined,
        representatives: dto.representative
          ? { create: [this.mapRepresentativeCreate(dto.representative)] }
          : undefined,
        verificationChecks: {
          create: VERIFICATION_CHECK_KEYS.map((checkKey) => ({
            checkKey: checkKey as VendorVerificationCheckKey,
            status: VendorVerificationCheckStatus.not_started,
          })),
        },
        adminNotes: dto.internalNote
          ? { create: [{ body: dto.internalNote, authorAdminId: adminId }] }
          : undefined,
        activities: {
          create: {
            type: VendorActivityType.note,
            summary: 'Vendor created by admin',
            actorAdminId: adminId,
          },
        },
      },
      include: ADMIN_INCLUDE,
    });

    return { ...profile, possibleDuplicates: duplicates };
  }

  async adminUpdate(id: string, adminId: string, dto: AdminUpdateVendorDto) {
    await this.requireVendor(id);
    const data: Prisma.VendorProfileUpdateInput = {
      tradingName: dto.tradingName?.trim(),
      legalName: dto.legalName?.trim(),
      description: dto.description?.trim(),
      logoUrl: dto.logoUrl,
      yearEstablished: dto.yearEstablished,
      businessTypes: dto.businessTypes,
      publicPhone: dto.publicPhone,
      publicWhatsApp: dto.publicWhatsApp,
      publicEmail: dto.publicEmail,
      showPublicPhone: dto.showPublicPhone,
      showPublicWhatsApp: dto.showPublicWhatsApp,
      showPublicEmail: dto.showPublicEmail,
      websiteUrl: dto.websiteUrl,
      socialLinks: dto.socialLinks,
      preferredContactMethod: dto.preferredContactMethod,
      salesContactName: dto.salesContactName,
      procurementContactName: dto.procurementContactName,
      quotationEmail: dto.quotationEmail,
      businessHours: dto.businessHours,
      afterHoursAvailable: dto.afterHoursAvailable,
      stateKey: dto.stateKey,
      stateLabel: dto.stateLabel,
      cityKey: dto.cityKey,
      cityLabel: dto.cityLabel,
      lgaLabel: dto.lgaLabel,
      publicAddress: dto.publicAddress,
      privateBusinessAddress: dto.privateBusinessAddress,
      addressVisibility: dto.addressVisibility,
      acceptsSmallOrders: dto.acceptsSmallOrders,
      acceptsBulkOrders: dto.acceptsBulkOrders,
      acceptsProjectQuotations: dto.acceptsProjectQuotations,
      canSupplyBoqQuotations: dto.canSupplyBoqQuotations,
      canSourceUnstocked: dto.canSourceUnstocked,
      deliveryFleetAvailable: dto.deliveryFleetAvailable,
      thirdPartyDelivery: dto.thirdPartyDelivery,
      pickupAvailable: dto.pickupAvailable,
      interstateDelivery: dto.interstateDelivery,
      nationwideDelivery: dto.nationwideDelivery,
      installationAvailable: dto.installationAvailable,
      afterSalesSupport: dto.afterSalesSupport,
      warrantyHandling: dto.warrantyHandling,
      paymentMethodsAccepted: dto.paymentMethodsAccepted,
      depositRequired: dto.depositRequired,
      creditTermsNotes: dto.creditTermsNotes,
      pricesNegotiable: dto.pricesNegotiable,
      priceListAvailable: dto.priceListAvailable,
      priceListUrl: dto.priceListUrl,
      typicalQuoteResponseHours: dto.typicalQuoteResponseHours,
      cacRegistrationStatus: dto.cacRegistrationStatus,
      cacNumber: dto.cacNumber,
      taxIdentificationNumber: dto.taxIdentificationNumber,
      bankAccountName: dto.bankAccountName,
      procurementRelationship: dto.procurementRelationship,
      previouslyUsedByBmh: dto.previouslyUsedByBmh,
      lastReviewedAt: new Date(),
      normalizedTradingName: dto.tradingName
        ? normalizeTradingName(dto.tradingName)
        : undefined,
      normalizedPhone: dto.publicPhone !== undefined ? normalizePhone(dto.publicPhone) : undefined,
      normalizedWhatsApp:
        dto.publicWhatsApp !== undefined ? normalizePhone(dto.publicWhatsApp) : undefined,
      normalizedEmail: dto.publicEmail !== undefined ? normalizeEmail(dto.publicEmail) : undefined,
      websiteDomain: dto.websiteUrl !== undefined ? websiteDomain(dto.websiteUrl) : undefined,
    };

    await this.prisma.vendorProfile.update({
      where: { id },
      data: this.stripUndefined(data),
    });

    if (dto.offerings) {
      await this.prisma.vendorOffering.deleteMany({ where: { vendorProfileId: id } });
      if (dto.offerings.length) {
        await this.prisma.vendorOffering.createMany({
          data: dto.offerings.map((o, i) => ({
            vendorProfileId: id,
            ...this.mapOfferingCreate(o, i),
          })),
        });
      }
    }

    if (dto.serviceAreas) {
      await this.prisma.vendorServiceArea.deleteMany({ where: { vendorProfileId: id } });
      if (dto.serviceAreas.length) {
        await this.prisma.vendorServiceArea.createMany({
          data: dto.serviceAreas.map((a) => ({
            vendorProfileId: id,
            ...this.mapServiceAreaCreate(a),
          })),
        });
      }
    }

    if (dto.representative) {
      await this.prisma.vendorRepresentative.deleteMany({
        where: { vendorProfileId: id, isPrimary: true },
      });
      await this.prisma.vendorRepresentative.create({
        data: { vendorProfileId: id, ...this.mapRepresentativeCreate(dto.representative) },
      });
    }

    await this.refreshCompleteness(id);
    await this.prisma.vendorActivity.create({
      data: {
        vendorProfileId: id,
        type: VendorActivityType.profile_correction,
        summary: 'Admin updated vendor profile',
        actorAdminId: adminId,
      },
    });

    return this.adminGet(id);
  }

  async adminSetUnderReview(id: string, adminId: string) {
    await this.transitionListing(id, [VendorListingStatus.submitted, VendorListingStatus.clarification_required, VendorListingStatus.draft, VendorListingStatus.internal_only], VendorListingStatus.under_review, adminId, VendorActivityType.other, 'Moved to under review');
    return this.adminGet(id);
  }

  async adminRequestClarification(id: string, adminId: string, dto: AdminReviewActionDto) {
    if (!dto.clarificationMessage?.trim()) {
      throw new BadRequestException('clarificationMessage is required');
    }
    const profile = await this.requireVendor(id);
    await this.prisma.vendorProfile.update({
      where: { id },
      data: {
        listingStatus: VendorListingStatus.clarification_required,
        clarificationMessage: dto.clarificationMessage.trim(),
        lastReviewedAt: new Date(),
      },
    });
    await this.prisma.vendorActivity.create({
      data: {
        vendorProfileId: id,
        type: VendorActivityType.clarification_requested,
        summary: 'Clarification requested',
        note: dto.clarificationMessage,
        actorAdminId: adminId,
      },
    });
    if (profile.publicEmail) {
      await this.email.send({
        to: profile.publicEmail,
        subject: 'BuildMyHouse needs more information about your vendor profile',
        html: `<p>We need clarification for <strong>${profile.tradingName}</strong>.</p><p>${dto.clarificationMessage}</p>`,
        text: dto.clarificationMessage,
      });
    }
    return this.adminGet(id);
  }

  async adminApproveListing(id: string, adminId: string, dto: AdminReviewActionDto) {
    const profile = await this.requireVendor(id);
    if (
      !(
        [
          VendorListingStatus.under_review,
          VendorListingStatus.submitted,
          VendorListingStatus.clarification_required,
          VendorListingStatus.draft,
          VendorListingStatus.internal_only,
          VendorListingStatus.suspended,
        ] as VendorListingStatus[]
      ).includes(profile.listingStatus)
    ) {
      throw new BadRequestException(`Cannot approve listing from status ${profile.listingStatus}`);
    }
    await this.prisma.vendorProfile.update({
      where: { id },
      data: {
        listingStatus: VendorListingStatus.listed,
        approvedByAdminId: adminId,
        approvedAt: new Date(),
        listedAt: new Date(),
        lastReviewedAt: new Date(),
        clarificationMessage: null,
        rejectionReason: null,
        suspensionReason: null,
        suspendedAt: null,
      },
    });
    await this.prisma.vendorActivity.create({
      data: {
        vendorProfileId: id,
        type: VendorActivityType.listing_approved,
        summary: 'Listing approved',
        note: dto.note || null,
        actorAdminId: adminId,
      },
    });
    if (profile.publicEmail) {
      await this.email.send({
        to: profile.publicEmail,
        subject: 'Your BuildMyHouse vendor listing was approved',
        html: `<p><strong>${profile.tradingName}</strong> is now listed on BuildMyHouse.</p>
<p>Listing is not the same as BuildMyHouse Verified. Verification may follow separately.</p>
<p>Profile: https://buildmyhouse.app/vendors/${profile.slug}</p>`,
        text: `${profile.tradingName} is now listed on BuildMyHouse.`,
      });
    }
    return this.adminGet(id);
  }

  async adminReject(id: string, adminId: string, dto: AdminReviewActionDto) {
    if (!dto.reason?.trim()) throw new BadRequestException('reason is required');
    const profile = await this.requireVendor(id);
    await this.prisma.vendorProfile.update({
      where: { id },
      data: {
        listingStatus: VendorListingStatus.rejected,
        rejectionReason: dto.reason.trim(),
        lastReviewedAt: new Date(),
      },
    });
    await this.prisma.vendorActivity.create({
      data: {
        vendorProfileId: id,
        type: VendorActivityType.other,
        summary: 'Application rejected',
        note: dto.reason,
        actorAdminId: adminId,
      },
    });
    if (profile.publicEmail) {
      await this.email.send({
        to: profile.publicEmail,
        subject: 'Update on your BuildMyHouse vendor application',
        html: `<p>We could not approve <strong>${profile.tradingName}</strong> at this time.</p><p>${dto.reason}</p>`,
        text: dto.reason,
      });
    }
    return this.adminGet(id);
  }

  async adminSuspend(id: string, adminId: string, dto: AdminReviewActionDto) {
    if (!dto.reason?.trim()) throw new BadRequestException('reason is required');
    const profile = await this.requireVendor(id);
    await this.prisma.vendorProfile.update({
      where: { id },
      data: {
        listingStatus: VendorListingStatus.suspended,
        suspensionReason: dto.reason.trim(),
        suspendedAt: new Date(),
        lastReviewedAt: new Date(),
      },
    });
    await this.prisma.vendorActivity.create({
      data: {
        vendorProfileId: id,
        type: VendorActivityType.suspension,
        summary: 'Vendor suspended',
        note: dto.reason,
        actorAdminId: adminId,
      },
    });
    if (profile.publicEmail) {
      await this.email.send({
        to: profile.publicEmail,
        subject: 'Your BuildMyHouse vendor profile was suspended',
        html: `<p>Your profile for <strong>${profile.tradingName}</strong> was suspended.</p><p>${dto.reason}</p>`,
        text: dto.reason,
      });
    }
    return this.adminGet(id);
  }

  async adminRestore(id: string, adminId: string, dto: AdminReviewActionDto) {
    await this.requireVendor(id);
    await this.prisma.vendorProfile.update({
      where: { id },
      data: {
        listingStatus: VendorListingStatus.listed,
        suspensionReason: null,
        suspendedAt: null,
        listedAt: new Date(),
        lastReviewedAt: new Date(),
      },
    });
    await this.prisma.vendorActivity.create({
      data: {
        vendorProfileId: id,
        type: VendorActivityType.restoration,
        summary: 'Vendor restored to listed',
        note: dto.note || null,
        actorAdminId: adminId,
      },
    });
    return this.adminGet(id);
  }

  async adminUpsertVerificationChecks(
    id: string,
    adminId: string,
    dto: AdminUpsertVerificationChecksDto,
  ) {
    await this.requireVendor(id);
    for (const check of dto.checks) {
      await this.prisma.vendorVerificationCheck.upsert({
        where: {
          vendorProfileId_checkKey: { vendorProfileId: id, checkKey: check.checkKey },
        },
        create: {
          vendorProfileId: id,
          checkKey: check.checkKey,
          status: check.status,
          notes: check.notes || null,
          failureReason: check.failureReason || null,
          evidenceDocumentId: check.evidenceDocumentId || null,
          expiresAt: check.expiresAt ? new Date(check.expiresAt) : null,
          reviewedByAdminId: adminId,
          reviewedAt: new Date(),
        },
        update: {
          status: check.status,
          notes: check.notes || null,
          failureReason: check.failureReason || null,
          evidenceDocumentId: check.evidenceDocumentId || null,
          expiresAt: check.expiresAt ? new Date(check.expiresAt) : null,
          reviewedByAdminId: adminId,
          reviewedAt: new Date(),
        },
      });
    }

    const checks = await this.prisma.vendorVerificationCheck.findMany({
      where: { vendorProfileId: id },
    });
    const passedOrNa = checks.filter((c) =>
      (
        [
          VendorVerificationCheckStatus.passed,
          VendorVerificationCheckStatus.not_applicable,
        ] as VendorVerificationCheckStatus[]
      ).includes(c.status),
    );
    const failed = checks.some((c) => c.status === VendorVerificationCheckStatus.failed);
    let verificationStatus: VendorVerificationStatus = VendorVerificationStatus.unverified;
    if (failed) verificationStatus = VendorVerificationStatus.unverified;
    else if (passedOrNa.length === VERIFICATION_CHECK_KEYS.length) {
      verificationStatus = VendorVerificationStatus.verified;
    } else if (passedOrNa.length > 0) {
      verificationStatus = VendorVerificationStatus.partial;
    }

    const shouldMarkVerified =
      dto.markVerifiedIfReady && verificationStatus === VendorVerificationStatus.verified;

    await this.prisma.vendorProfile.update({
      where: { id },
      data: {
        verificationStatus: shouldMarkVerified
          ? VendorVerificationStatus.verified
          : verificationStatus,
        verifiedAt: shouldMarkVerified ? new Date() : undefined,
        verifiedByAdminId: shouldMarkVerified ? adminId : undefined,
        lastReviewedAt: new Date(),
      },
    });

    if (shouldMarkVerified) {
      const profile = await this.requireVendor(id);
      await this.prisma.vendorActivity.create({
        data: {
          vendorProfileId: id,
          type: VendorActivityType.verification_completed,
          summary: 'BuildMyHouse verification completed',
          actorAdminId: adminId,
        },
      });
      if (profile.publicEmail) {
        await this.email.send({
          to: profile.publicEmail,
          subject: 'Your BuildMyHouse vendor profile is verified',
          html: `<p><strong>${profile.tradingName}</strong> is now BuildMyHouse Verified.</p>
<p>Verification means we completed defined business/identity checks. It is not a guarantee of product quality or every future transaction.</p>`,
          text: `${profile.tradingName} is now BuildMyHouse Verified.`,
        });
      }
    }

    return this.adminGet(id);
  }

  async adminAddNote(id: string, adminId: string, body: string) {
    await this.requireVendor(id);
    return this.prisma.vendorAdminNote.create({
      data: { vendorProfileId: id, authorAdminId: adminId, body: body.trim() },
    });
  }

  async adminAddActivity(id: string, adminId: string, dto: AdminActivityDto) {
    await this.requireVendor(id);
    const activity = await this.prisma.vendorActivity.create({
      data: {
        vendorProfileId: id,
        type: dto.type,
        summary: dto.summary || null,
        note: dto.note || null,
        projectId: dto.projectId || null,
        actorAdminId: adminId,
      },
    });
    if (
      (
        [
          VendorActivityType.contacted,
          VendorActivityType.quotation_received,
          VendorActivityType.purchase_completed,
        ] as VendorActivityType[]
      ).includes(dto.type)
    ) {
      const map: Partial<Record<VendorActivityType, string>> = {
        [VendorActivityType.contacted]: 'contacted',
        [VendorActivityType.quotation_received]: 'quoted',
        [VendorActivityType.purchase_completed]: 'purchased_from',
      };
      const rel = map[dto.type];
      if (rel) {
        await this.prisma.vendorProfile.update({
          where: { id },
          data: {
            procurementRelationship: rel as any,
            previouslyUsedByBmh:
              dto.type === VendorActivityType.purchase_completed ? true : undefined,
          },
        });
      }
    }
    return activity;
  }

  async adminCreateClaimInvite(id: string, adminId: string, dto: AdminClaimInviteDto) {
    const profile = await this.requireVendor(id);
    const email = dto.email || profile.publicEmail;
    if (!email) throw new BadRequestException('Invite email is required');

    const rawToken = randomBytes(32).toString('hex');
    const tokenHash = this.hashToken(rawToken);
    const expiresInDays = dto.expiresInDays ?? 14;
    const expiresAt = new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000);

    await this.prisma.vendorClaimInvite.create({
      data: {
        vendorProfileId: id,
        tokenHash,
        email,
        phone: dto.phone || profile.publicWhatsApp || profile.publicPhone || null,
        invitedByAdminId: adminId,
        expiresAt,
      },
    });

    await this.prisma.vendorProfile.update({
      where: { id },
      data: { claimStatus: VendorClaimStatus.invite_sent },
    });
    await this.prisma.vendorActivity.create({
      data: {
        vendorProfileId: id,
        type: VendorActivityType.invitation_sent,
        summary: `Claim invite sent to ${email}`,
        actorAdminId: adminId,
      },
    });

    const claimUrl = `https://buildmyhouse.app/vendors/claim/${rawToken}`;
    await this.email.send({
      to: email,
      subject: 'Claim your BuildMyHouse vendor profile',
      html: `<p>BuildMyHouse invited you to claim <strong>${profile.tradingName}</strong>.</p>
<p><a href="${claimUrl}">Claim profile</a></p>
<p>This link expires on ${expiresAt.toISOString().slice(0, 10)}.</p>`,
      text: `Claim your vendor profile: ${claimUrl}`,
    });

    return { expiresAt, claimUrl, email };
  }

  async findDuplicateCandidates(input: {
    tradingName?: string | null;
    phone?: string | null;
    whatsapp?: string | null;
    email?: string | null;
    cacNumber?: string | null;
    websiteUrl?: string | null;
    excludeId?: string;
  }) {
    const ors: Prisma.VendorProfileWhereInput[] = [];
    const nName = normalizeTradingName(input.tradingName);
    const nPhone = normalizePhone(input.phone);
    const nWa = normalizePhone(input.whatsapp);
    const nEmail = normalizeEmail(input.email);
    const domain = websiteDomain(input.websiteUrl);

    if (nName) ors.push({ normalizedTradingName: nName });
    if (nPhone) ors.push({ normalizedPhone: nPhone }, { normalizedWhatsApp: nPhone });
    if (nWa) ors.push({ normalizedPhone: nWa }, { normalizedWhatsApp: nWa });
    if (nEmail) ors.push({ normalizedEmail: nEmail });
    if (input.cacNumber) ors.push({ cacNumber: input.cacNumber.trim() });
    if (domain) ors.push({ websiteDomain: domain });
    if (!ors.length) return [];

    return this.prisma.vendorProfile.findMany({
      where: {
        deletedAt: null,
        id: input.excludeId ? { not: input.excludeId } : undefined,
        OR: ors,
      },
      select: {
        id: true,
        tradingName: true,
        slug: true,
        listingStatus: true,
        publicPhone: true,
        publicWhatsApp: true,
        publicEmail: true,
        cacNumber: true,
        websiteDomain: true,
      },
      take: 10,
    });
  }

  // ---------------------------------------------------------------------------
  // Claim + vendor manage
  // ---------------------------------------------------------------------------

  async previewClaim(rawToken: string) {
    const invite = await this.findValidInvite(rawToken);
    const profile = await this.requireVendor(invite.vendorProfileId);
    return {
      tradingName: profile.tradingName,
      slug: profile.slug,
      email: invite.email,
      expiresAt: invite.expiresAt,
    };
  }

  async acceptClaim(rawToken: string, userId: string) {
    const invite = await this.findValidInvite(rawToken);
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    const existing = await this.prisma.vendorProfile.findUnique({ where: { userId } });
    if (existing && existing.id !== invite.vendorProfileId) {
      throw new ConflictException('This account already manages another vendor profile');
    }

    await this.prisma.$transaction([
      this.prisma.vendorClaimInvite.update({
        where: { id: invite.id },
        data: { usedAt: new Date() },
      }),
      this.prisma.vendorProfile.update({
        where: { id: invite.vendorProfileId },
        data: {
          userId,
          claimStatus: VendorClaimStatus.claimed,
        },
      }),
      this.prisma.user.update({
        where: { id: userId },
        data: { role: user.role === 'admin' ? user.role : 'vendor' },
      }),
      this.prisma.vendorActivity.create({
        data: {
          vendorProfileId: invite.vendorProfileId,
          type: VendorActivityType.claim_accepted,
          summary: 'Vendor claimed profile',
          metadata: { userId },
        },
      }),
    ]);

    return this.getManagedProfile(userId);
  }

  async getManagedProfile(userId: string) {
    const profile = await this.prisma.vendorProfile.findUnique({
      where: { userId },
      include: {
        ...PUBLIC_INCLUDE,
        documents: {
          select: {
            id: true,
            documentType: true,
            label: true,
            reviewStatus: true,
            createdAt: true,
            rejectionReason: true,
          },
        },
        changeRequests: {
          where: { status: 'pending' },
          orderBy: { createdAt: 'desc' },
          take: 20,
        },
      },
    });
    if (!profile) throw new NotFoundException('No vendor profile linked to this account');
    return profile;
  }

  async updateManagedProfile(userId: string, dto: VendorManageUpdateDto) {
    const profile = await this.getManagedProfile(userId);
    if (
      ([VendorListingStatus.suspended, VendorListingStatus.rejected] as VendorListingStatus[]).includes(
        profile.listingStatus,
      )
    ) {
      throw new ForbiddenException('This profile cannot be edited in its current status');
    }

    await this.prisma.vendorProfile.update({
      where: { id: profile.id },
      data: this.stripUndefined({
        description: dto.description,
        businessHours: dto.businessHours,
        publicPhone: dto.publicPhone,
        publicWhatsApp: dto.publicWhatsApp,
        publicEmail: dto.publicEmail,
        showPublicPhone: dto.showPublicPhone,
        showPublicWhatsApp: dto.showPublicWhatsApp,
        showPublicEmail: dto.showPublicEmail,
        websiteUrl: dto.websiteUrl,
        logoUrl: dto.logoUrl,
        socialLinks: dto.socialLinks,
        paymentMethodsAccepted: dto.paymentMethodsAccepted,
        pricesNegotiable: dto.pricesNegotiable,
        pickupAvailable: dto.pickupAvailable,
        interstateDelivery: dto.interstateDelivery,
        nationwideDelivery: dto.nationwideDelivery,
        installationAvailable: dto.installationAvailable,
        normalizedPhone: dto.publicPhone !== undefined ? normalizePhone(dto.publicPhone) : undefined,
        normalizedWhatsApp:
          dto.publicWhatsApp !== undefined ? normalizePhone(dto.publicWhatsApp) : undefined,
        normalizedEmail: dto.publicEmail !== undefined ? normalizeEmail(dto.publicEmail) : undefined,
        websiteDomain: dto.websiteUrl !== undefined ? websiteDomain(dto.websiteUrl) : undefined,
      }),
    });

    if (dto.offerings) {
      await this.prisma.vendorOffering.deleteMany({ where: { vendorProfileId: profile.id } });
      if (dto.offerings.length) {
        await this.prisma.vendorOffering.createMany({
          data: dto.offerings.map((o, i) => ({
            vendorProfileId: profile.id,
            ...this.mapOfferingCreate(o, i),
          })),
        });
      }
    }

    if (dto.serviceAreas) {
      await this.prisma.vendorServiceArea.deleteMany({ where: { vendorProfileId: profile.id } });
      if (dto.serviceAreas.length) {
        await this.prisma.vendorServiceArea.createMany({
          data: dto.serviceAreas.map((a) => ({
            vendorProfileId: profile.id,
            ...this.mapServiceAreaCreate(a),
          })),
        });
      }
    }

    await this.refreshCompleteness(profile.id);
    return this.getManagedProfile(userId);
  }

  async submitSensitiveChange(userId: string, dto: VendorSensitiveChangeDto) {
    const profile = await this.getManagedProfile(userId);
    const group = String(dto.fieldGroup || '').trim();
    if (!['identity', 'registration', 'representative', 'location', 'documents', 'other'].includes(group)) {
      throw new BadRequestException('Invalid fieldGroup');
    }
    return this.prisma.vendorProfileChangeRequest.create({
      data: {
        vendorProfileId: profile.id,
        requestedByUserId: userId,
        fieldGroup: group,
        proposedPayload: dto.proposedPayload as Prisma.InputJsonValue,
        currentPayload: {
          tradingName: profile.tradingName,
          legalName: profile.legalName,
          cacNumber: profile.cacNumber,
        } as Prisma.InputJsonValue,
      },
    });
  }

  async addManagedDocument(userId: string, dto: VendorDocumentInputDto) {
    const profile = await this.getManagedProfile(userId);
    const doc = await this.prisma.vendorDocument.create({
      data: {
        vendorProfileId: profile.id,
        ...this.mapDocumentCreate(dto, userId),
      },
    });
    await this.prisma.vendorProfileChangeRequest.create({
      data: {
        vendorProfileId: profile.id,
        requestedByUserId: userId,
        fieldGroup: 'documents',
        proposedPayload: { documentId: doc.id, documentType: doc.documentType },
      },
    });
    await this.refreshCompleteness(profile.id);
    return doc;
  }

  assertVendorCannotSelfVerify() {
    throw new ForbiddenException('Vendors cannot verify or approve their own profiles');
  }

  // ---------------------------------------------------------------------------
  // Internals
  // ---------------------------------------------------------------------------

  private buildPublicWhere(dto: PublicVendorSearchDto): Prisma.VendorProfileWhereInput {
    const where: Prisma.VendorProfileWhereInput = {
      listingStatus: VendorListingStatus.listed,
      deletedAt: null,
    };
    const and: Prisma.VendorProfileWhereInput[] = [];

    if (dto.query?.trim()) {
      const q = dto.query.trim();
      and.push({
        OR: [
          { tradingName: { contains: q, mode: 'insensitive' } },
          { description: { contains: q, mode: 'insensitive' } },
          { offerings: { some: { brands: { has: q } } } },
          { offerings: { some: { familyKey: { contains: q, mode: 'insensitive' } } } },
          { offerings: { some: { customCategoryLabel: { contains: q, mode: 'insensitive' } } } },
        ],
      });
    }
    if (dto.verifiedOnly) {
      and.push({ verificationStatus: VendorVerificationStatus.verified });
    }
    if (dto.stateKey) and.push({ stateKey: dto.stateKey });
    if (dto.cityKey) and.push({ cityKey: dto.cityKey });
    if (dto.familyKey || dto.category || dto.brand || dto.retail || dto.wholesale || dto.delivery) {
      and.push({
        offerings: {
          some: {
            AND: [
              dto.familyKey ? { familyKey: dto.familyKey } : {},
              dto.category
                ? {
                    OR: [
                      { categoryCode: dto.category },
                      { familyKey: dto.category },
                      { customCategoryLabel: { contains: dto.category, mode: 'insensitive' } },
                    ],
                  }
                : {},
              dto.brand ? { brands: { has: dto.brand } } : {},
              dto.retail ? { sellsRetail: true } : {},
              dto.wholesale ? { sellsWholesale: true } : {},
              dto.delivery ? { deliveryAvailable: true } : {},
            ],
          },
        },
      });
    }
    if (dto.deliveryStateKey) {
      and.push({
        OR: [
          { nationwideDelivery: true },
          { serviceAreas: { some: { stateKey: dto.deliveryStateKey } } },
        ],
      });
    }
    if (and.length) where.AND = and;
    return where;
  }

  private buildAdminWhere(dto: AdminVendorSearchDto): Prisma.VendorProfileWhereInput {
    const where: Prisma.VendorProfileWhereInput = { deletedAt: null };
    const and: Prisma.VendorProfileWhereInput[] = [];
    if (dto.listingStatus) and.push({ listingStatus: dto.listingStatus });
    if (dto.verificationStatus) and.push({ verificationStatus: dto.verificationStatus });
    if (dto.procurementRelationship) {
      and.push({ procurementRelationship: dto.procurementRelationship });
    }
    if (dto.acquisitionSource) and.push({ acquisitionSource: dto.acquisitionSource });
    if (dto.stateKey) and.push({ stateKey: dto.stateKey });
    if (dto.previouslyUsed) and.push({ previouslyUsedByBmh: true });
    if (dto.query?.trim()) {
      const q = dto.query.trim();
      and.push({
        OR: [
          { tradingName: { contains: q, mode: 'insensitive' } },
          { legalName: { contains: q, mode: 'insensitive' } },
          { publicPhone: { contains: q } },
          { publicWhatsApp: { contains: q } },
          { publicEmail: { contains: q, mode: 'insensitive' } },
          { applicationReference: { contains: q, mode: 'insensitive' } },
          { cacNumber: { contains: q, mode: 'insensitive' } },
        ],
      });
    }
    if (dto.familyKey || dto.brand || dto.wholesale) {
      and.push({
        offerings: {
          some: {
            AND: [
              dto.familyKey ? { familyKey: dto.familyKey } : {},
              dto.brand ? { brands: { has: dto.brand } } : {},
              dto.wholesale ? { sellsWholesale: true } : {},
            ],
          },
        },
      });
    }
    if (dto.deliveryStateKey) {
      and.push({
        OR: [
          { nationwideDelivery: true },
          { serviceAreas: { some: { stateKey: dto.deliveryStateKey } } },
        ],
      });
    }
    if (and.length) where.AND = and;
    return where;
  }

  private async requireVendor(id: string) {
    const profile = await this.prisma.vendorProfile.findFirst({
      where: { id, deletedAt: null },
    });
    if (!profile) throw new NotFoundException('Vendor not found');
    return profile;
  }

  private async transitionListing(
    id: string,
    from: VendorListingStatus[],
    to: VendorListingStatus,
    adminId: string,
    activityType: VendorActivityType,
    summary: string,
  ) {
    const profile = await this.requireVendor(id);
    if (!from.includes(profile.listingStatus)) {
      throw new BadRequestException(`Cannot move from ${profile.listingStatus} to ${to}`);
    }
    await this.prisma.vendorProfile.update({
      where: { id },
      data: { listingStatus: to, lastReviewedAt: new Date() },
    });
    await this.prisma.vendorActivity.create({
      data: {
        vendorProfileId: id,
        type: activityType,
        summary,
        actorAdminId: adminId,
      },
    });
  }

  private async uniqueSlug(tradingName: string): Promise<string> {
    const base = normalizeVendorSlug(tradingName) || 'vendor';
    let candidate = base;
    for (let i = 0; i < 20; i++) {
      const existing = await this.prisma.vendorProfile.findUnique({
        where: { slug: candidate },
        select: { id: true },
      });
      if (!existing) return candidate;
      candidate = `${base}-${randomBytes(2).toString('hex')}`;
    }
    return `${base}-${Date.now().toString(36)}`;
  }

  private async uniqueApplicationReference(): Promise<string> {
    for (let i = 0; i < 10; i++) {
      const ref = buildApplicationReference();
      const existing = await this.prisma.vendorProfile.findUnique({
        where: { applicationReference: ref },
        select: { id: true },
      });
      if (!existing) return ref;
    }
    return `VND-${Date.now()}`;
  }

  private completenessFromPayload(dto: {
    tradingName?: string;
    description?: string | null;
    logoUrl?: string | null;
    stateKey?: string | null;
    stateLabel?: string | null;
    cityLabel?: string | null;
    publicPhone?: string | null;
    publicWhatsApp?: string | null;
    publicEmail?: string | null;
    websiteUrl?: string | null;
    businessTypes?: string[];
    offerings?: VendorOfferingInputDto[];
    serviceAreas?: VendorServiceAreaInputDto[];
    representative?: VendorRepresentativeInputDto;
    documents?: VendorDocumentInputDto[];
    paymentMethodsAccepted?: string[];
    pricesNegotiable?: boolean;
    interstateDelivery?: boolean;
    nationwideDelivery?: boolean;
  }): number {
    const brandsCount = (dto.offerings || []).reduce((n, o) => n + (o.brands?.length || 0), 0);
    return computeProfileCompleteness({
      tradingName: dto.tradingName,
      description: dto.description,
      logoUrl: dto.logoUrl,
      stateKey: dto.stateKey,
      stateLabel: dto.stateLabel,
      cityLabel: dto.cityLabel,
      publicPhone: dto.publicPhone,
      publicWhatsApp: dto.publicWhatsApp,
      publicEmail: dto.publicEmail,
      websiteUrl: dto.websiteUrl,
      businessTypes: dto.businessTypes,
      offeringsCount: dto.offerings?.length || 0,
      brandsCount,
      serviceAreasCount: dto.serviceAreas?.length || 0,
      hasDeliveryInfo: !!(dto.interstateDelivery || dto.nationwideDelivery),
      documentsCount: dto.documents?.length || 0,
      hasRepresentative: !!dto.representative?.name,
      hasPricingInfo: !!(dto.paymentMethodsAccepted?.length || dto.pricesNegotiable != null),
    });
  }

  private async refreshCompleteness(id: string) {
    const profile = await this.prisma.vendorProfile.findUnique({
      where: { id },
      include: {
        offerings: true,
        serviceAreas: true,
        documents: true,
        representatives: true,
      },
    });
    if (!profile) return;
    const score = computeProfileCompleteness({
      tradingName: profile.tradingName,
      description: profile.description,
      logoUrl: profile.logoUrl,
      stateKey: profile.stateKey,
      stateLabel: profile.stateLabel,
      cityLabel: profile.cityLabel,
      publicPhone: profile.publicPhone,
      publicWhatsApp: profile.publicWhatsApp,
      publicEmail: profile.publicEmail,
      websiteUrl: profile.websiteUrl,
      businessTypes: profile.businessTypes,
      offeringsCount: profile.offerings.length,
      brandsCount: profile.offerings.reduce((n, o) => n + o.brands.length, 0),
      serviceAreasCount: profile.serviceAreas.length,
      hasDeliveryInfo: profile.nationwideDelivery || profile.interstateDelivery,
      documentsCount: profile.documents.length,
      hasRepresentative: profile.representatives.length > 0,
      hasPricingInfo: profile.paymentMethodsAccepted.length > 0 || profile.priceListAvailable,
    });
    await this.prisma.vendorProfile.update({
      where: { id },
      data: { profileCompleteness: score },
    });
  }

  private mapOfferingCreate(o: VendorOfferingInputDto, sortOrder: number) {
    return {
      familyKey: o.familyKey || null,
      categoryCode: o.categoryCode || null,
      customCategoryLabel: o.customCategoryLabel || null,
      productTypes: o.productTypes || [],
      brands: o.brands || [],
      sellsRetail: o.sellsRetail ?? true,
      sellsWholesale: o.sellsWholesale ?? false,
      normalUnit: o.normalUnit || null,
      minimumOrderQuantity: o.minimumOrderQuantity ?? null,
      minimumOrderUnit: o.minimumOrderUnit || null,
      stockedNormally: o.stockedNormally ?? true,
      specialOrder: o.specialOrder ?? false,
      deliveryAvailable: o.deliveryAvailable ?? false,
      installationAvailable: o.installationAvailable ?? false,
      acceptsQuotations: o.acceptsQuotations ?? true,
      quantityBreakNotes: o.quantityBreakNotes || null,
      pricesNegotiable: o.pricesNegotiable ?? true,
      deliveryIncluded: o.deliveryIncluded ?? null,
      deliveryPricingMethod: o.deliveryPricingMethod || null,
      installationIncluded: o.installationIncluded ?? null,
      vatStatus: o.vatStatus || null,
      examplePriceAmount: o.examplePriceAmount != null ? o.examplePriceAmount : null,
      examplePriceUnit: o.examplePriceUnit || null,
      examplePriceNotes: o.examplePriceNotes || null,
      sortOrder,
    };
  }

  private mapServiceAreaCreate(a: VendorServiceAreaInputDto) {
    return {
      locationKey: a.locationKey || null,
      stateKey: a.stateKey || null,
      stateLabel: a.stateLabel || null,
      cityKey: a.cityKey || null,
      cityLabel: a.cityLabel || null,
      coverageType: a.coverageType || 'delivery',
      notes: a.notes || null,
    };
  }

  private mapRepresentativeCreate(r: VendorRepresentativeInputDto) {
    return {
      name: r.name.trim(),
      role: r.role || null,
      phone: r.phone || null,
      email: r.email || null,
      showPublicly: r.showPublicly ?? false,
      isPrimary: r.isPrimary ?? true,
    };
  }

  private mapDocumentCreate(d: VendorDocumentInputDto, uploadedByUserId?: string | null) {
    return {
      documentType: d.documentType,
      fileRef: d.fileRef,
      label: d.label || null,
      mimeType: d.mimeType || null,
      fileSizeBytes: d.fileSizeBytes ?? null,
      uploadedByUserId: uploadedByUserId || null,
    };
  }

  private hashToken(raw: string) {
    return createHash('sha256').update(raw).digest('hex');
  }

  private async findValidInvite(rawToken: string) {
    const tokenHash = this.hashToken(rawToken);
    const invite = await this.prisma.vendorClaimInvite.findUnique({ where: { tokenHash } });
    if (!invite) throw new NotFoundException('Invite not found');
    if (invite.usedAt) throw new ConflictException('Invite has already been used');
    if (invite.expiresAt.getTime() < Date.now()) {
      throw new BadRequestException('Invite has expired');
    }
    return invite;
  }

  private stripUndefined<T extends Record<string, unknown>>(obj: T): T {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(obj)) {
      if (v !== undefined) out[k] = v;
    }
    return out as T;
  }
}

export { isPubliclyListed };
