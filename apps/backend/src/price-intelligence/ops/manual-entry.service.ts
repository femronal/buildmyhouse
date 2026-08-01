import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { assertMakerChecker } from './maker-checker';
import { PriceIntelligenceAuditService } from './audit.service';
import {
  ADMIN_MANUAL_SOURCE_CODE,
  createApprovedObservation,
} from './observation-factory';

export interface ManualEntryItemInput {
  familyKey?: string | null;
  productLabel: string;
  brandName?: string | null;
  originalWording: string;
  originalPrice: number;
  currencyCode?: string;
  originalUnitCode: string;
  locationKey?: string | null;
  specification?: Record<string, unknown> | null;
}

@Injectable()
export class ManualEntryService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: PriceIntelligenceAuditService,
  ) {}

  async list(take = 50, skip = 0, status?: string) {
    const where = status ? { status } : {};
    const [items, total] = await Promise.all([
      this.prisma.manualPriceEntry.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: Math.min(take, 200),
        skip,
        include: {
          items: true,
          createdBy: { select: { id: true, fullName: true, email: true } },
          reviewedBy: { select: { id: true, fullName: true, email: true } },
        },
      }),
      this.prisma.manualPriceEntry.count({ where }),
    ]);
    return { items, total, take, skip };
  }

  async get(id: string) {
    const row = await this.prisma.manualPriceEntry.findUnique({
      where: { id },
      include: {
        items: true,
        createdBy: { select: { id: true, fullName: true, email: true } },
        reviewedBy: { select: { id: true, fullName: true, email: true } },
      },
    });
    if (!row) throw new NotFoundException('Manual entry not found');
    return row;
  }

  async create(input: {
    title: string;
    notes?: string;
    evidenceFileRef?: string;
    evidenceDocumentId?: string;
    locationKey?: string;
    items: ManualEntryItemInput[];
    createdByAdminId: string;
  }) {
    if (!input.items?.length) throw new BadRequestException('At least one item is required');

    const entry = await this.prisma.manualPriceEntry.create({
      data: {
        title: input.title,
        notes: input.notes ?? null,
        evidenceFileRef: input.evidenceFileRef ?? null,
        evidenceDocumentId: input.evidenceDocumentId ?? null,
        locationKey: input.locationKey ?? null,
        createdByAdminId: input.createdByAdminId,
        status: 'draft',
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
      action: 'manual_entry.create',
      entityType: 'ManualPriceEntry',
      entityId: entry.id,
      actorAdminId: input.createdByAdminId,
      afterJson: { title: entry.title, itemCount: entry.items.length },
    });
    return entry;
  }

  async submit(id: string, actorAdminId: string) {
    const entry = await this.get(id);
    if (entry.status !== 'draft') {
      throw new BadRequestException('Only draft entries can be submitted');
    }
    const updated = await this.prisma.manualPriceEntry.update({
      where: { id },
      data: { status: 'submitted' },
      include: { items: true },
    });
    await this.audit.write({
      action: 'manual_entry.submit',
      entityType: 'ManualPriceEntry',
      entityId: id,
      actorAdminId,
    });
    return updated;
  }

  async review(input: {
    entryId: string;
    reviewerAdminId: string;
    reviewerPermissions: readonly string[] | null | undefined;
    decision: 'approve' | 'reject';
    reviewNote?: string;
    itemDecisions?: Array<{ itemId: string; decision: 'approve' | 'reject'; reason?: string }>;
  }) {
    const entry = await this.get(input.entryId);
    if (entry.status !== 'submitted') {
      throw new BadRequestException('Only submitted entries can be reviewed');
    }

    try {
      assertMakerChecker({
        creatorAdminId: entry.createdByAdminId,
        reviewerAdminId: input.reviewerAdminId,
        reviewerPermissions: input.reviewerPermissions,
      });
    } catch (err) {
      throw new ForbiddenException((err as Error).message);
    }

    if (input.decision === 'reject' && !input.itemDecisions?.length) {
      const updated = await this.prisma.manualPriceEntry.update({
        where: { id: entry.id },
        data: {
          status: 'rejected',
          reviewedByAdminId: input.reviewerAdminId,
          reviewedAt: new Date(),
          reviewNote: input.reviewNote ?? 'Rejected',
          items: { updateMany: { where: { entryId: entry.id }, data: { status: 'rejected' } } },
        },
        include: { items: true },
      });
      await this.audit.write({
        action: 'manual_entry.reject',
        entityType: 'ManualPriceEntry',
        entityId: entry.id,
        actorAdminId: input.reviewerAdminId,
        reason: input.reviewNote,
      });
      return updated;
    }

    const decisions =
      input.itemDecisions ??
      entry.items.map((i) => ({ itemId: i.id, decision: 'approve' as const }));

    for (const d of decisions) {
      const item = entry.items.find((i) => i.id === d.itemId);
      if (!item) continue;

      if (d.decision === 'reject') {
        await this.prisma.manualPriceEntryItem.update({
          where: { id: item.id },
          data: { status: 'rejected', rejectionReason: d.reason ?? input.reviewNote ?? 'Rejected' },
        });
        continue;
      }

      if (!item.familyKey) {
        throw new BadRequestException(`Item ${item.id} needs familyKey before approval`);
      }

      const observation = await createApprovedObservation(this.prisma, {
        familyKey: item.familyKey,
        productLabel: item.productLabel,
        originalWording: item.originalWording,
        originalPrice: String(item.originalPrice),
        originalUnitCode: item.originalUnitCode,
        currencyCode: item.currencyCode,
        collectionMethod: 'admin_entry',
        evidenceClass: 'admin_manual_entry',
        evidenceDocumentId: entry.evidenceDocumentId,
        sourceCode: ADMIN_MANUAL_SOURCE_CODE,
      });

      await this.prisma.manualPriceEntryItem.update({
        where: { id: item.id },
        data: { status: 'approved', observationId: observation.id },
      });
    }

    const refreshed = await this.get(entry.id);
    const approved = refreshed.items.filter((i) => i.status === 'approved').length;
    const rejected = refreshed.items.filter((i) => i.status === 'rejected').length;
    const status =
      approved > 0 && rejected > 0
        ? 'partially_approved'
        : approved > 0
          ? 'approved'
          : 'rejected';

    const updated = await this.prisma.manualPriceEntry.update({
      where: { id: entry.id },
      data: {
        status,
        reviewedByAdminId: input.reviewerAdminId,
        reviewedAt: new Date(),
        reviewNote: input.reviewNote ?? null,
      },
      include: { items: true },
    });

    await this.audit.write({
      action: 'manual_entry.review',
      entityType: 'ManualPriceEntry',
      entityId: entry.id,
      actorAdminId: input.reviewerAdminId,
      afterJson: { status, approved, rejected },
      reason: input.reviewNote,
    });
    return updated;
  }
}
