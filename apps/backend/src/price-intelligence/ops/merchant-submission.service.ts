import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { PriceIntelligenceAuditService } from './audit.service';
import {
  MERCHANT_WHATSAPP_SOURCE_CODE,
  createApprovedObservation,
} from './observation-factory';
import { ManualEntryItemInput } from './manual-entry.service';

@Injectable()
export class MerchantSubmissionService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: PriceIntelligenceAuditService,
  ) {}

  async listMerchants(take = 50, skip = 0) {
    const [items, total] = await Promise.all([
      this.prisma.priceMerchant.findMany({
        where: { deletedAt: null },
        orderBy: { createdAt: 'desc' },
        take: Math.min(take, 200),
        skip,
      }),
      this.prisma.priceMerchant.count({ where: { deletedAt: null } }),
    ]);
    return { items, total, take, skip };
  }

  async createMerchant(input: {
    businessName: string;
    tradingName?: string;
    sellerType?: string;
    city?: string;
    state?: string;
    sourceTier?: number;
    riskNotes?: string;
    contactPhone?: string;
    contactEmail?: string;
    actorAdminId: string;
  }) {
    const row = await this.prisma.priceMerchant.create({
      data: {
        businessName: input.businessName,
        tradingName: input.tradingName ?? null,
        sellerType: input.sellerType ?? 'retailer',
        city: input.city ?? null,
        state: input.state ?? null,
        sourceTier: input.sourceTier ?? 3,
        riskNotes: input.riskNotes ?? null,
        contactPhone: input.contactPhone ?? null,
        contactEmail: input.contactEmail ?? null,
      },
    });
    await this.audit.write({
      action: 'merchant.create',
      entityType: 'PriceMerchant',
      entityId: row.id,
      actorAdminId: input.actorAdminId,
      afterJson: { businessName: row.businessName },
    });
    return row;
  }

  async listSubmissions(take = 50, skip = 0, status?: string) {
    const where = status ? { status } : {};
    const [items, total] = await Promise.all([
      this.prisma.merchantPriceSubmission.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: Math.min(take, 200),
        skip,
        include: {
          items: true,
          merchant: true,
          createdBy: { select: { id: true, fullName: true, email: true } },
        },
      }),
      this.prisma.merchantPriceSubmission.count({ where }),
    ]);
    return { items, total, take, skip };
  }

  async getSubmission(id: string) {
    const row = await this.prisma.merchantPriceSubmission.findUnique({
      where: { id },
      include: { items: true, merchant: true },
    });
    if (!row) throw new NotFoundException('Merchant submission not found');
    return row;
  }

  async createSubmission(input: {
    merchantId?: string;
    title: string;
    notes?: string;
    channel?: string;
    evidenceFileRef?: string;
    evidenceDocumentId?: string;
    items: ManualEntryItemInput[];
    createdByAdminId: string;
    submit?: boolean;
  }) {
    if (!input.items?.length) throw new BadRequestException('At least one item is required');

    const submission = await this.prisma.merchantPriceSubmission.create({
      data: {
        merchantId: input.merchantId ?? null,
        title: input.title,
        notes: input.notes ?? null,
        channel: input.channel ?? 'whatsapp',
        evidenceFileRef: input.evidenceFileRef ?? null,
        evidenceDocumentId: input.evidenceDocumentId ?? null,
        createdByAdminId: input.createdByAdminId,
        status: input.submit ? 'submitted' : 'draft',
        submittedAt: input.submit ? new Date() : null,
        items: {
          create: input.items.map((item) => ({
            familyKey: item.familyKey ?? null,
            productLabel: item.productLabel,
            brandName: item.brandName ?? null,
            originalWording: item.originalWording,
            originalPrice: new Prisma.Decimal(item.originalPrice),
            currencyCode: item.currencyCode ?? 'NGN',
            originalUnitCode: item.originalUnitCode,
            locationKey: item.locationKey ?? null,
            specification: (item.specification ?? undefined) as Prisma.InputJsonValue | undefined,
          })),
        },
      },
      include: { items: true },
    });

    await this.audit.write({
      action: 'merchant_submission.create',
      entityType: 'MerchantPriceSubmission',
      entityId: submission.id,
      actorAdminId: input.createdByAdminId,
      afterJson: { title: submission.title, status: submission.status },
    });
    return submission;
  }

  async submit(id: string, actorAdminId: string) {
    const existing = await this.getSubmission(id);
    if (existing.status !== 'draft') {
      throw new BadRequestException('Only draft submissions can be submitted');
    }
    const updated = await this.prisma.merchantPriceSubmission.update({
      where: { id },
      data: { status: 'submitted', submittedAt: new Date() },
      include: { items: true },
    });
    await this.audit.write({
      action: 'merchant_submission.submit',
      entityType: 'MerchantPriceSubmission',
      entityId: id,
      actorAdminId,
    });
    return updated;
  }

  /** Item-level approve/reject → creates PriceObservation on approve. */
  async reviewItem(input: {
    submissionId: string;
    itemId: string;
    decision: 'approve' | 'reject';
    reason?: string;
    reviewerAdminId: string;
  }) {
    const submission = await this.getSubmission(input.submissionId);
    if (!['submitted', 'in_review', 'partially_approved'].includes(submission.status)) {
      throw new BadRequestException('Submission is not reviewable');
    }
    const item = submission.items.find((i) => i.id === input.itemId);
    if (!item) throw new NotFoundException('Submission item not found');
    if (item.status !== 'pending') {
      throw new BadRequestException('Item already reviewed');
    }

    if (input.decision === 'reject') {
      await this.prisma.merchantPriceSubmissionItem.update({
        where: { id: item.id },
        data: {
          status: 'rejected',
          rejectionReason: input.reason ?? 'Rejected',
          reviewedByAdminId: input.reviewerAdminId,
          reviewedAt: new Date(),
        },
      });
    } else {
      if (!item.familyKey) {
        throw new BadRequestException('Item needs familyKey before approval');
      }
      const observation = await createApprovedObservation(this.prisma, {
        familyKey: item.familyKey,
        productLabel: item.productLabel,
        originalWording: item.originalWording,
        originalPrice: String(item.originalPrice),
        originalUnitCode: item.originalUnitCode,
        currencyCode: item.currencyCode,
        collectionMethod: 'merchant_feed',
        evidenceClass: 'merchant_submission',
        evidenceDocumentId: submission.evidenceDocumentId,
        sourceCode: MERCHANT_WHATSAPP_SOURCE_CODE,
      });
      await this.prisma.merchantPriceSubmissionItem.update({
        where: { id: item.id },
        data: {
          status: 'approved',
          observationId: observation.id,
          reviewedByAdminId: input.reviewerAdminId,
          reviewedAt: new Date(),
        },
      });
    }

    const refreshed = await this.getSubmission(input.submissionId);
    const pending = refreshed.items.filter((i) => i.status === 'pending').length;
    const approved = refreshed.items.filter((i) => i.status === 'approved').length;
    const rejected = refreshed.items.filter((i) => i.status === 'rejected').length;
    const status =
      pending > 0
        ? approved + rejected > 0
          ? 'in_review'
          : 'submitted'
        : approved > 0 && rejected > 0
          ? 'partially_approved'
          : approved > 0
            ? 'approved'
            : 'rejected';

    const updated = await this.prisma.merchantPriceSubmission.update({
      where: { id: input.submissionId },
      data: { status },
      include: { items: true, merchant: true },
    });

    await this.audit.write({
      action: `merchant_submission.item_${input.decision}`,
      entityType: 'MerchantPriceSubmissionItem',
      entityId: input.itemId,
      actorAdminId: input.reviewerAdminId,
      reason: input.reason,
      afterJson: { submissionStatus: status },
    });
    return updated;
  }
}
