/**
 * Shared helpers to create PriceObservation rows from admin/merchant approvals.
 * Never overwrites existing observations.
 */

import { Prisma } from '@prisma/client';
import { observationFingerprint } from '../observations/observations';

export const ADMIN_MANUAL_SOURCE_CODE = 'admin-manual';
export const MERCHANT_WHATSAPP_SOURCE_CODE = 'merchant-whatsapp';

export type PrismaLike = {
  priceSource: {
    upsert: (args: {
      where: { code: string };
      create: Prisma.PriceSourceCreateInput;
      update: Prisma.PriceSourceUpdateInput;
    }) => Promise<{ id: string; code: string }>;
  };
  priceProductFamily: {
    findUnique: (args: { where: { key: string } }) => Promise<{ id: string; key: string } | null>;
  };
  priceUnit: {
    findUnique: (args: { where: { code: string } }) => Promise<{ code: string } | null>;
  };
  priceObservation: {
    create: (args: { data: Prisma.PriceObservationCreateInput }) => Promise<{ id: string }>;
  };
};

export async function ensureOpsSource(
  prisma: PrismaLike,
  code: typeof ADMIN_MANUAL_SOURCE_CODE | typeof MERCHANT_WHATSAPP_SOURCE_CODE,
): Promise<{ id: string; code: string }> {
  const meta =
    code === ADMIN_MANUAL_SOURCE_CODE
      ? { name: 'Admin manual entry', tier: 2, accessStatus: 'allowed_manual' }
      : { name: 'Merchant WhatsApp / price-list feed', tier: 3, accessStatus: 'allowed_merchant' };

  return prisma.priceSource.upsert({
    where: { code },
    create: {
      code,
      name: meta.name,
      tier: meta.tier,
      accessStatus: meta.accessStatus,
      healthStatus: 'healthy',
    },
    update: {},
  });
}

export interface CreateApprovedObservationInput {
  familyKey: string;
  productLabel: string;
  originalWording: string;
  originalPrice: number | string;
  originalUnitCode: string;
  currencyCode?: string;
  collectionMethod: 'admin_entry' | 'merchant_feed';
  evidenceClass: string;
  evidenceDocumentId?: string | null;
  sourceCode: typeof ADMIN_MANUAL_SOURCE_CODE | typeof MERCHANT_WHATSAPP_SOURCE_CODE;
  checkedDate?: Date;
  confidence?: number;
}

export async function createApprovedObservation(
  prisma: PrismaLike,
  input: CreateApprovedObservationInput,
): Promise<{ id: string }> {
  const family = await prisma.priceProductFamily.findUnique({ where: { key: input.familyKey } });
  if (!family) {
    throw new Error(`Unknown product family: ${input.familyKey}`);
  }

  const unit = await prisma.priceUnit.findUnique({ where: { code: input.originalUnitCode } });
  if (!unit) {
    throw new Error(`Unknown unit code: ${input.originalUnitCode}`);
  }

  const source = await ensureOpsSource(prisma, input.sourceCode);
  const checkedDate = input.checkedDate ?? new Date();
  const price = String(input.originalPrice);
  const fingerprint = observationFingerprint({
    familyKey: input.familyKey,
    sourceCode: source.code,
    sellerName: null,
    originalWording: input.originalWording,
    originalPrice: price,
    originalUnitCode: input.originalUnitCode,
    listingDate: checkedDate.toISOString().slice(0, 10),
  });

  return prisma.priceObservation.create({
    data: {
      family: { connect: { id: family.id } },
      source: { connect: { id: source.id } },
      originalWording: input.originalWording || input.productLabel,
      originalPrice: new Prisma.Decimal(price),
      currencyCode: input.currencyCode ?? 'NGN',
      originalQuantity: new Prisma.Decimal(1),
      originalUnit: { connect: { code: input.originalUnitCode } },
      normalizedPrice: new Prisma.Decimal(price),
      normalizedUnit: { connect: { code: input.originalUnitCode } },
      checkedDate,
      collectionMethod: input.collectionMethod,
      evidenceClass: input.evidenceClass,
      confidence: input.confidence ?? 0.85,
      status: 'active',
      duplicateFingerprint: fingerprint,
      reviewStatus: 'verified',
      ...(input.evidenceDocumentId
        ? { evidenceDocument: { connect: { id: input.evidenceDocumentId } } }
        : {}),
    },
  });
}
