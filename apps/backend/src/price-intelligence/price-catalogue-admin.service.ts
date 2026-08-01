import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

/**
 * Read-only catalogue queries for the Stage 3 admin view.
 * Proves the seeded taxonomy round-trips completely through the database.
 * No mutation endpoints exist here by design — catalogue changes go through
 * the PriceTaxonomyChangeRequest approval flow (later stage).
 */
@Injectable()
export class PriceCatalogueAdminService {
  constructor(private readonly prisma: PrismaService) {}

  async getOverview() {
    const [
      categories,
      familyCount,
      productCount,
      aliasCount,
      specDefCount,
      brandCount,
      unitCount,
      conversionRuleCount,
      locationCount,
      sourceCount,
      serviceFamilyCount,
      seedMeta,
    ] = await Promise.all([
      this.prisma.priceCategory.findMany({
        where: { deletedAt: null },
        orderBy: { sortOrder: 'asc' },
        include: { _count: { select: { families: true } } },
      }),
      this.prisma.priceProductFamily.count({ where: { deletedAt: null } }),
      this.prisma.priceProduct.count({ where: { deletedAt: null } }),
      this.prisma.priceAlias.count({ where: { deletedAt: null } }),
      this.prisma.priceSpecificationDefinition.count({ where: { deletedAt: null } }),
      this.prisma.priceBrand.count({ where: { deletedAt: null } }),
      this.prisma.priceUnit.count({ where: { deletedAt: null } }),
      this.prisma.priceConversionRule.count({ where: { deletedAt: null } }),
      this.prisma.priceLocation.count({ where: { deletedAt: null } }),
      this.prisma.priceSource.count({ where: { deletedAt: null } }),
      this.prisma.priceServiceFamily.count({ where: { deletedAt: null } }),
      this.prisma.priceSeedMeta.findUnique({ where: { key: 'taxonomy_seed_version' } }),
    ]);

    return {
      seedVersion: seedMeta?.value ?? null,
      seedAppliedAt: seedMeta?.appliedAt ?? null,
      counts: {
        families: familyCount,
        products: productCount,
        aliases: aliasCount,
        specificationDefinitions: specDefCount,
        brands: brandCount,
        units: unitCount,
        conversionRules: conversionRuleCount,
        locations: locationCount,
        sources: sourceCount,
        serviceFamilies: serviceFamilyCount,
      },
      categories: categories.map((c) => ({
        code: c.code,
        name: c.name,
        familyCount: c._count.families,
      })),
    };
  }

  async listFamilies() {
    const families = await this.prisma.priceProductFamily.findMany({
      where: { deletedAt: null },
      orderBy: { key: 'asc' },
      include: {
        category: { select: { code: true, name: true } },
        _count: { select: { products: true, aliases: true, specDefs: true } },
      },
    });
    return families.map((f) => ({
      key: f.key,
      name: f.name,
      category: f.category.code,
      kind: f.kind,
      funnelRole: f.funnelRole,
      version: f.version,
      normalizedUnitCode: f.normalizedUnitCode,
      escalationPrimary: f.escalationPrimary,
      productCount: f._count.products,
      aliasCount: f._count.aliases,
      specificationCount: f._count.specDefs,
    }));
  }

  async getFamilyByKey(key: string) {
    const family = await this.prisma.priceProductFamily.findUnique({
      where: { key },
      include: {
        category: { select: { code: true, name: true } },
        normalizedUnit: { select: { code: true, label: true, dimension: true } },
        products: {
          where: { deletedAt: null },
          orderBy: { key: 'asc' },
          include: { brand: { select: { name: true } } },
        },
        aliases: { where: { deletedAt: null }, orderBy: { normalizedAlias: 'asc' } },
        specDefs: { where: { deletedAt: null }, orderBy: { key: 'asc' } },
      },
    });
    if (!family || family.deletedAt) {
      throw new NotFoundException(`Price product family '${key}' not found`);
    }
    return family;
  }

  listUnits() {
    return this.prisma.priceUnit.findMany({
      where: { deletedAt: null },
      orderBy: { code: 'asc' },
    });
  }

  listConversionRules() {
    return this.prisma.priceConversionRule.findMany({
      where: { deletedAt: null },
      orderBy: [{ fromUnitCode: 'asc' }, { toUnitCode: 'asc' }],
    });
  }

  listLocations() {
    return this.prisma.priceLocation.findMany({
      where: { deletedAt: null },
      orderBy: { code: 'asc' },
      include: { parent: { select: { code: true } } },
    });
  }

  listSources() {
    return this.prisma.priceSource.findMany({
      where: { deletedAt: null },
      orderBy: { tier: 'asc' },
    });
  }

  listServiceFamilies() {
    return this.prisma.priceServiceFamily.findMany({
      where: { deletedAt: null },
      orderBy: { key: 'asc' },
    });
  }
}
