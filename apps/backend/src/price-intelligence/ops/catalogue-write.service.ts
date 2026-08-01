import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { PriceIntelligenceAuditService } from './audit.service';
import { normalizeQuery } from '../taxonomy/matching';

@Injectable()
export class CatalogueWriteService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: PriceIntelligenceAuditService,
  ) {}

  async createAlias(input: {
    familyKey: string;
    productKey?: string | null;
    alias: string;
    actorAdminId: string;
  }) {
    const family = await this.prisma.priceProductFamily.findUnique({
      where: { key: input.familyKey },
    });
    if (!family) throw new NotFoundException('Family not found');

    let productId: string | null = null;
    if (input.productKey) {
      const product = await this.prisma.priceProduct.findUnique({
        where: { familyId_key: { familyId: family.id, key: input.productKey } },
      });
      if (!product) throw new NotFoundException('Product not found');
      productId = product.id;
    }

    const normalizedAlias = normalizeQuery(input.alias);
    if (!normalizedAlias) throw new BadRequestException('Alias is empty');

    const impact = await this.impactWarningForAlias(normalizedAlias, family.key);

    const alias = await this.prisma.priceAlias.create({
      data: {
        familyId: family.id,
        productId,
        alias: input.alias.trim(),
        normalizedAlias,
        source: 'admin',
      },
    });

    await this.prisma.priceTaxonomyChangeRequest.create({
      data: {
        type: 'new_alias',
        payload: {
          familyKey: input.familyKey,
          productKey: input.productKey ?? null,
          alias: input.alias.trim(),
          normalizedAlias,
          aliasId: alias.id,
        } as Prisma.InputJsonValue,
        proposedBy: 'admin',
        status: 'approved',
        approvedByAdminId: input.actorAdminId,
        decidedAt: new Date(),
        decisionNote: 'Admin catalogue write',
        auditLog: [
          { at: new Date().toISOString(), actor: input.actorAdminId, action: 'approved' },
        ] as Prisma.InputJsonValue,
      },
    });

    await this.audit.write({
      action: 'catalogue.alias_create',
      entityType: 'PriceAlias',
      entityId: alias.id,
      actorAdminId: input.actorAdminId,
      afterJson: { alias: alias.alias, familyKey: input.familyKey, impact },
    });

    return { alias, impactWarnings: impact };
  }

  async createBrand(input: { name: string; verified?: boolean; actorAdminId: string }) {
    const normalizedName = normalizeQuery(input.name);
    if (!normalizedName) throw new BadRequestException('Brand name is empty');

    const brand = await this.prisma.priceBrand.upsert({
      where: { normalizedName },
      create: {
        name: input.name.trim(),
        normalizedName,
        verified: input.verified ?? false,
      },
      update: {
        name: input.name.trim(),
        verified: input.verified ?? undefined,
        deletedAt: null,
      },
    });

    await this.prisma.priceTaxonomyChangeRequest.create({
      data: {
        type: 'family_edit',
        payload: { kind: 'brand_upsert', brandId: brand.id, name: brand.name } as Prisma.InputJsonValue,
        proposedBy: 'admin',
        status: 'approved',
        approvedByAdminId: input.actorAdminId,
        decidedAt: new Date(),
        decisionNote: 'Admin brand upsert',
      },
    });

    await this.audit.write({
      action: 'catalogue.brand_upsert',
      entityType: 'PriceBrand',
      entityId: brand.id,
      actorAdminId: input.actorAdminId,
      afterJson: brand,
    });
    return brand;
  }

  /** Soft-deactivate product — no hard delete. */
  async deactivateProduct(input: {
    familyKey: string;
    productKey: string;
    actorAdminId: string;
    reason: string;
  }) {
    if (!input.reason?.trim()) throw new BadRequestException('Reason is required');
    const family = await this.prisma.priceProductFamily.findUnique({
      where: { key: input.familyKey },
    });
    if (!family) throw new NotFoundException('Family not found');
    const product = await this.prisma.priceProduct.findUnique({
      where: { familyId_key: { familyId: family.id, key: input.productKey } },
    });
    if (!product) throw new NotFoundException('Product not found');

    const obsCount = await this.prisma.priceObservation.count({
      where: { productId: product.id, status: 'active' },
    });
    const impactWarnings = [
      obsCount > 0
        ? `${obsCount} active observation(s) still reference this product`
        : 'No active observations reference this product',
      'Soft-deactivate only — row retained for history',
    ];

    const updated = await this.prisma.priceProduct.update({
      where: { id: product.id },
      data: { deletedAt: new Date() },
    });

    await this.prisma.priceTaxonomyChangeRequest.create({
      data: {
        type: 'family_edit',
        payload: {
          kind: 'product_deactivate',
          familyKey: input.familyKey,
          productKey: input.productKey,
          productId: product.id,
        } as Prisma.InputJsonValue,
        proposedBy: 'admin',
        status: 'approved',
        approvedByAdminId: input.actorAdminId,
        decidedAt: new Date(),
        decisionNote: input.reason,
      },
    });

    await this.audit.write({
      action: 'catalogue.product_deactivate',
      entityType: 'PriceProduct',
      entityId: product.id,
      actorAdminId: input.actorAdminId,
      reason: input.reason,
      afterJson: { impactWarnings },
    });

    return { product: updated, impactWarnings };
  }

  async deactivateAlias(aliasId: string, actorAdminId: string, reason: string) {
    if (!reason?.trim()) throw new BadRequestException('Reason is required');
    const alias = await this.prisma.priceAlias.findUnique({ where: { id: aliasId } });
    if (!alias) throw new NotFoundException('Alias not found');

    const updated = await this.prisma.priceAlias.update({
      where: { id: aliasId },
      data: { deletedAt: new Date() },
    });

    await this.audit.write({
      action: 'catalogue.alias_deactivate',
      entityType: 'PriceAlias',
      entityId: aliasId,
      actorAdminId,
      reason,
    });
    return updated;
  }

  private async impactWarningForAlias(normalizedAlias: string, familyKey: string) {
    const collisions = await this.prisma.priceAlias.findMany({
      where: { normalizedAlias, deletedAt: null },
      include: { family: { select: { key: true, name: true } } },
      take: 5,
    });
    const warnings: string[] = [];
    for (const c of collisions) {
      if (c.family.key !== familyKey) {
        warnings.push(`Alias already maps to family ${c.family.key} (${c.family.name})`);
      }
    }
    const queryHits = await this.prisma.priceQuery.count({
      where: { normalizedQuery: { contains: normalizedAlias } },
    });
    if (queryHits > 0) {
      warnings.push(`${queryHits} historical quer(ies) contain this term`);
    }
    return warnings;
  }
}
