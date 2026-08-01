import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { assertTransition, allowedTransitions, isReviewStatus } from './review-state-machine';
import { computePriority, PriorityLabel } from './priority';
import { computeDueAt } from './sla';
import { PriceIntelligenceSettingsService } from './settings.service';
import { PriceIntelligenceAuditService } from './audit.service';
import { observationFingerprint } from '../observations/observations';
import {
  ADMIN_MANUAL_SOURCE_CODE,
  ensureOpsSource,
} from './observation-factory';

@Injectable()
export class ReviewCaseService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly settings: PriceIntelligenceSettingsService,
    private readonly audit: PriceIntelligenceAuditService,
  ) {}

  async getWorkspace(caseId: string) {
    const row = await this.prisma.priceReviewCase.findUnique({
      where: { id: caseId },
      include: {
        events: { orderBy: { createdAt: 'asc' } },
        assignedReviewer: { select: { id: true, fullName: true, email: true } },
        report: {
          include: {
            items: true,
            revisions: { orderBy: { version: 'asc' } },
          },
        },
        reportItem: true,
        observation: true,
        source: true,
        corrections: true,
      },
    });
    if (!row) throw new NotFoundException('Review case not found');
    return {
      ...row,
      allowedTransitions: isReviewStatus(row.status) ? allowedTransitions(row.status) : [],
    };
  }

  async assign(caseId: string, reviewerAdminId: string, actorAdminId: string) {
    const existing = await this.requireCase(caseId);
    const from = existing.status;
    let to = from;
    if (from === 'open' || from === 'reopened') {
      assertTransition(from, 'assigned');
      to = 'assigned';
    }

    const updated = await this.prisma.priceReviewCase.update({
      where: { id: caseId },
      data: {
        assignedReviewerId: reviewerAdminId,
        status: to,
        events: {
          create: {
            eventType: 'assigned',
            fromStatus: from,
            toStatus: to,
            actorAdminId,
            note: `Assigned to ${reviewerAdminId}`,
          },
        },
      },
    });

    await this.audit.write({
      action: 'review_case.assign',
      entityType: 'PriceReviewCase',
      entityId: caseId,
      actorAdminId,
      afterJson: { assignedReviewerId: reviewerAdminId, status: to },
    });
    return updated;
  }

  async transition(caseId: string, toStatus: string, actorAdminId: string, note?: string) {
    const existing = await this.requireCase(caseId);
    const { from, to } = assertTransition(existing.status, toStatus);

    const data: Prisma.PriceReviewCaseUpdateInput = {
      status: to,
      events: {
        create: {
          eventType: 'transition',
          fromStatus: from,
          toStatus: to,
          actorAdminId,
          note: note ?? null,
        },
      },
    };
    if (to === 'resolved') data.resolvedAt = new Date();
    if (to === 'closed') data.closedAt = new Date();
    if (to === 'reopened') {
      data.closedAt = null;
      data.resolvedAt = null;
    }

    const updated = await this.prisma.priceReviewCase.update({ where: { id: caseId }, data });
    await this.audit.write({
      action: 'review_case.transition',
      entityType: 'PriceReviewCase',
      entityId: caseId,
      actorAdminId,
      beforeJson: { status: from },
      afterJson: { status: to },
      reason: note,
    });
    return updated;
  }

  async addNote(caseId: string, actorAdminId: string, note: string) {
    if (!note?.trim()) throw new BadRequestException('Note is required');
    await this.requireCase(caseId);
    const event = await this.prisma.priceReviewCaseEvent.create({
      data: {
        caseId,
        eventType: 'note',
        note: note.trim(),
        actorAdminId,
      },
    });
    return event;
  }

  async overridePriority(
    caseId: string,
    label: PriorityLabel,
    reason: string,
    actorAdminId: string,
  ) {
    const existing = await this.requireCase(caseId);
    const priority = computePriority({
      caseType: existing.caseType,
      overrideLabel: label,
      overrideReason: reason,
    });
    const sla = await this.settings.getSlaHours();
    const dueAt = computeDueAt(priority.label, existing.openedAt, sla);

    const updated = await this.prisma.priceReviewCase.update({
      where: { id: caseId },
      data: {
        priority: priority.label,
        priorityScore: priority.score,
        priorityReason: priority.reason,
        dueAt,
        events: {
          create: {
            eventType: 'priority_override',
            actorAdminId,
            note: reason,
            metadata: { label, score: priority.score } as Prisma.InputJsonValue,
          },
        },
      },
    });

    await this.audit.write({
      action: 'review_case.priority_override',
      entityType: 'PriceReviewCase',
      entityId: caseId,
      actorAdminId,
      reason,
      afterJson: { priority: label, score: priority.score },
    });
    return updated;
  }

  async approve(caseId: string, actorAdminId: string, note?: string) {
    return this.transition(caseId, 'approved', actorAdminId, note ?? 'Approved');
  }

  async reject(caseId: string, actorAdminId: string, note: string) {
    if (!note?.trim()) throw new BadRequestException('Rejection reason is required');
    return this.transition(caseId, 'rejected', actorAdminId, note.trim());
  }

  /**
   * Supersede an existing observation with a corrected row (never overwrite).
   */
  async correctObservation(
    caseId: string,
    actorAdminId: string,
    input: {
      originalObservationId: string;
      correctedFields: {
        originalPrice?: number;
        originalUnitCode?: string;
        originalWording?: string;
        currencyCode?: string;
      };
      reason: string;
      correctionType?: string;
    },
  ) {
    if (!input.reason?.trim()) throw new BadRequestException('Correction reason is required');
    const existing = await this.requireCase(caseId);
    const original = await this.prisma.priceObservation.findUnique({
      where: { id: input.originalObservationId },
      include: { family: true, source: true },
    });
    if (!original) throw new NotFoundException('Original observation not found');

    const price = input.correctedFields.originalPrice ?? Number(original.originalPrice);
    const unitCode = input.correctedFields.originalUnitCode ?? original.originalUnitCode;
    const wording = input.correctedFields.originalWording ?? original.originalWording;
    const currency = input.correctedFields.currencyCode ?? original.currencyCode;
    const checkedDate = new Date();

    const fingerprint = observationFingerprint({
      familyKey: original.family.key,
      sourceCode: original.source.code,
      sellerName: null,
      originalWording: wording,
      originalPrice: String(price),
      originalUnitCode: unitCode,
      listingDate: checkedDate.toISOString().slice(0, 10),
    });

    const changedFields: Record<string, { from: unknown; to: unknown }> = {};
    if (input.correctedFields.originalPrice !== undefined) {
      changedFields.originalPrice = { from: String(original.originalPrice), to: String(price) };
    }
    if (input.correctedFields.originalUnitCode !== undefined) {
      changedFields.originalUnitCode = { from: original.originalUnitCode, to: unitCode };
    }
    if (input.correctedFields.originalWording !== undefined) {
      changedFields.originalWording = { from: original.originalWording, to: wording };
    }

    const result = await this.prisma.$transaction(async (tx) => {
      const corrected = await tx.priceObservation.create({
        data: {
          familyId: original.familyId,
          productId: original.productId,
          sourceId: original.sourceId,
          sellerId: original.sellerId,
          sellerLocationId: original.sellerLocationId,
          deliveryLocationId: original.deliveryLocationId,
          sourceMarketLocationId: original.sourceMarketLocationId,
          originalWording: wording,
          originalPrice: new Prisma.Decimal(price),
          currencyCode: currency,
          originalQuantity: original.originalQuantity,
          originalUnitCode: unitCode,
          normalizedPrice: new Prisma.Decimal(price),
          normalizedUnitCode: unitCode,
          condition: original.condition,
          availabilityState: original.availabilityState,
          deliveryIncluded: original.deliveryIncluded,
          installationIncluded: original.installationIncluded,
          vatIncluded: original.vatIncluded,
          accessoriesIncluded: original.accessoriesIncluded,
          warrantyIncluded: original.warrantyIncluded,
          listingDate: original.listingDate,
          checkedDate,
          collectionMethod: 'admin_entry',
          evidenceClass: original.evidenceClass,
          confidence: original.confidence,
          evidenceDocumentId: original.evidenceDocumentId,
          status: 'active',
          duplicateFingerprint: fingerprint,
          reviewStatus: 'verified',
        },
      });

      await tx.priceObservation.update({
        where: { id: original.id },
        data: {
          status: 'superseded',
          supersededByObservationId: corrected.id,
        },
      });

      const correction = await tx.priceObservationCorrection.create({
        data: {
          originalObservationId: original.id,
          correctedObservationId: corrected.id,
          correctionType: input.correctionType ?? 'price',
          changedFields: changedFields as Prisma.InputJsonValue,
          reason: input.reason.trim(),
          reviewCaseId: caseId,
          createdByAdminId: actorAdminId,
        },
      });

      const nextStatus = advanceToCorrected(existing.status);

      await tx.priceReviewCase.update({
        where: { id: caseId },
        data: {
          status: nextStatus,
          observationId: corrected.id,
          events: {
            create: {
              eventType: 'correction',
              fromStatus: existing.status,
              toStatus: nextStatus,
              actorAdminId,
              note: input.reason.trim(),
              metadata: { correctionId: correction.id, correctedObservationId: corrected.id },
            },
          },
        },
      });

      return { corrected, correction, status: nextStatus };
    });

    await this.audit.write({
      action: 'observation.correct',
      entityType: 'PriceObservation',
      entityId: result.corrected.id,
      actorAdminId,
      reason: input.reason,
      beforeJson: { originalObservationId: original.id },
      afterJson: { correctedObservationId: result.corrected.id, changedFields },
    });

    return result;
  }

  /**
   * When no DB observation exists for a report item: create a new observation
   * from reviewer-supplied structured fields and mark the case corrected.
   */
  async correctStructuredFields(
    caseId: string,
    actorAdminId: string,
    input: {
      familyKey: string;
      originalWording: string;
      originalPrice: number;
      originalUnitCode: string;
      currencyCode?: string;
      reason: string;
      approvedPrices?: number[];
    },
  ) {
    if (!input.reason?.trim()) throw new BadRequestException('Correction reason is required');
    const existing = await this.requireCase(caseId);
    const family = await this.prisma.priceProductFamily.findUnique({
      where: { key: input.familyKey },
    });
    if (!family) throw new BadRequestException(`Unknown family: ${input.familyKey}`);

    const source = await ensureOpsSource(this.prisma, ADMIN_MANUAL_SOURCE_CODE);
    const checkedDate = new Date();
    const fingerprint = observationFingerprint({
      familyKey: input.familyKey,
      sourceCode: source.code,
      sellerName: null,
      originalWording: input.originalWording,
      originalPrice: String(input.originalPrice),
      originalUnitCode: input.originalUnitCode,
      listingDate: checkedDate.toISOString().slice(0, 10),
    });

    const observation = await this.prisma.priceObservation.create({
      data: {
        familyId: family.id,
        sourceId: source.id,
        originalWording: input.originalWording,
        originalPrice: new Prisma.Decimal(input.originalPrice),
        currencyCode: input.currencyCode ?? 'NGN',
        originalQuantity: new Prisma.Decimal(1),
        originalUnitCode: input.originalUnitCode,
        normalizedPrice: new Prisma.Decimal(input.originalPrice),
        normalizedUnitCode: input.originalUnitCode,
        checkedDate,
        collectionMethod: 'admin_entry',
        evidenceClass: 'admin_structured_correction',
        confidence: 0.8,
        status: 'active',
        duplicateFingerprint: fingerprint,
        reviewStatus: 'verified',
      },
    });

    const nextStatus = advanceToCorrected(existing.status);

    await this.prisma.priceReviewCase.update({
      where: { id: caseId },
      data: {
        status: nextStatus,
        observationId: observation.id,
        triggerDetails: {
          ...((existing.triggerDetails as object) ?? {}),
          structuredCorrection: {
            observationId: observation.id,
            approvedPrices: input.approvedPrices ?? [input.originalPrice],
          },
        } as Prisma.InputJsonValue,
        events: {
          create: {
            eventType: 'correction',
            fromStatus: existing.status,
            toStatus: nextStatus,
            actorAdminId,
            note: input.reason.trim(),
            metadata: { observationId: observation.id, kind: 'structured_fields' },
          },
        },
      },
    });

    await this.audit.write({
      action: 'observation.structured_correction',
      entityType: 'PriceObservation',
      entityId: observation.id,
      actorAdminId,
      reason: input.reason,
      afterJson: { caseId, observationId: observation.id },
    });

    return { observation, status: nextStatus };
  }

  private async requireCase(caseId: string) {
    const row = await this.prisma.priceReviewCase.findUnique({ where: { id: caseId } });
    if (!row) throw new NotFoundException('Review case not found');
    return row;
  }
}

/** Move a case to corrected, chaining through in_review when needed. */
function advanceToCorrected(status: string): string {
  if (status === 'corrected') return 'corrected';
  if (status === 'in_review' || status === 'awaiting_information') {
    assertTransition(status, 'corrected');
    return 'corrected';
  }
  if (status === 'assigned') {
    assertTransition('assigned', 'in_review');
    assertTransition('in_review', 'corrected');
    return 'corrected';
  }
  if (status === 'open' || status === 'reopened') {
    // open → in_review is allowed; reopened → in_review is allowed
    assertTransition(status, 'in_review');
    assertTransition('in_review', 'corrected');
    return 'corrected';
  }
  // Already in a later state — leave as-is
  return status;
}
