/**
 * Price Intelligence idempotent seed (Stage 3).
 *
 * Loads the Stage 2 typed taxonomy (src/price-intelligence/taxonomy) into the
 * permanent catalogue tables. Every write is an upsert keyed on a natural
 * unique key (code / key / composite), so running this seed any number of
 * times produces the same result and never duplicates rows.
 *
 * NOTE: Stage 2 illustrative samples are deliberately NOT seeded — they are
 * structure-testing fixtures (`illustrativeOnly: true`) and must never enter
 * the price_observations evidence table.
 *
 * Run: pnpm --filter backend prisma:seed:price
 */
import { PrismaClient } from '@prisma/client';

import { UNITS, CONVERSION_RULES } from '../../src/price-intelligence/taxonomy/units';
import { LOCATIONS } from '../../src/price-intelligence/taxonomy/locations';
import { SOURCE_ACCESS_REGISTER } from '../../src/price-intelligence/taxonomy/evidence';
import { LEVEL1_FAMILIES } from '../../src/price-intelligence/taxonomy/families';
import { SERVICE_FAMILIES } from '../../src/price-intelligence/taxonomy/services.data';

export const PRICE_TAXONOMY_SEED_VERSION = '1';

const CATEGORIES: ReadonlyArray<{ code: string; name: string; sortOrder: number }> = [
  { code: 'structural', name: 'Structural', sortOrder: 1 },
  { code: 'envelope', name: 'Envelope & Roofing', sortOrder: 2 },
  { code: 'finishes', name: 'Finishes', sortOrder: 3 },
  { code: 'mep', name: 'MEP (Mechanical / Electrical / Plumbing)', sortOrder: 4 },
  { code: 'energy', name: 'Energy & Power', sortOrder: 5 },
  { code: 'security', name: 'Security', sortOrder: 6 },
];

/**
 * Evidence tier per source (1 = strongest). Derived from the Stage 2
 * evidence-class tiering; deterministic data, not AI output.
 */
const SOURCE_TIERS: Record<string, number> = {
  'manufacturer-distributor-sites': 1,
  'jumia-nigeria': 2,
  'jiji-ng': 3,
  konga: 2,
  'facebook-marketplace-social-pages': 4,
  'merchant-whatsapp-price-lists': 2,
  'google-business-profiles': 4,
};

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/\(.*?\)/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .split('-')
    .slice(0, 5)
    .join('-');
}

function normalizeAlias(alias: string): string {
  return alias.trim().toLowerCase().replace(/\s+/g, ' ');
}

export async function seedPriceIntelligence(prisma: PrismaClient): Promise<void> {
  // 1. Categories --------------------------------------------------------
  for (const c of CATEGORIES) {
    await prisma.priceCategory.upsert({
      where: { code: c.code },
      update: { name: c.name, sortOrder: c.sortOrder, deletedAt: null },
      create: c,
    });
  }

  // 2. Units --------------------------------------------------------------
  for (const u of UNITS) {
    await prisma.priceUnit.upsert({
      where: { code: u.code },
      update: { label: u.label, dimension: u.dimension, aliases: [...u.aliases], deletedAt: null },
      create: { code: u.code, label: u.label, dimension: u.dimension, aliases: [...u.aliases] },
    });
  }

  // 3. Conversion rules (whitelist — AI can never add rows) ----------------
  for (const r of CONVERSION_RULES) {
    const where = {
      fromUnitCode_toUnitCode_factorSource: {
        fromUnitCode: r.fromUnit,
        toUnitCode: r.toUnit,
        factorSource: r.factorSource,
      },
    };
    const data = {
      fixedFactor: r.fixedFactor ?? null,
      requiredInput: r.requiredInput,
      note: r.note ?? null,
      deletedAt: null as Date | null,
    };
    await prisma.priceConversionRule.upsert({
      where,
      update: data,
      create: {
        fromUnitCode: r.fromUnit,
        toUnitCode: r.toUnit,
        factorSource: r.factorSource,
        ...data,
      },
    });
  }

  // 4. Locations (two passes so parents exist before children) -------------
  for (const loc of LOCATIONS) {
    await prisma.priceLocation.upsert({
      where: { code: loc.key },
      update: {
        name: loc.label,
        type: loc.type,
        launchPriority: loc.launchPriority ?? false,
        deletedAt: null,
      },
      create: {
        code: loc.key,
        name: loc.label,
        type: loc.type,
        launchPriority: loc.launchPriority ?? false,
      },
    });
  }
  for (const loc of LOCATIONS) {
    if (!loc.parentKey) continue;
    const parent = await prisma.priceLocation.findUnique({ where: { code: loc.parentKey } });
    if (!parent) throw new Error(`Seed integrity error: parent location '${loc.parentKey}' missing for '${loc.key}'`);
    await prisma.priceLocation.update({ where: { code: loc.key }, data: { parentId: parent.id } });
  }

  // 5. Sources (ethics register) -------------------------------------------
  for (const s of SOURCE_ACCESS_REGISTER) {
    const code = slugify(s.sourceName);
    await prisma.priceSource.upsert({
      where: { code },
      update: { name: s.sourceName, accessStatus: s.accessStatus, accessNote: s.note, tier: SOURCE_TIERS[code] ?? 4, deletedAt: null },
      create: { code, name: s.sourceName, accessStatus: s.accessStatus, accessNote: s.note, tier: SOURCE_TIERS[code] ?? 4 },
    });
  }

  // 6. Product families + products + aliases + spec definitions + brands ---
  const brandNames = new Set<string>();

  for (const family of LEVEL1_FAMILIES) {
    const category = await prisma.priceCategory.findUnique({ where: { code: family.parentCategory } });
    if (!category) throw new Error(`Seed integrity error: category '${family.parentCategory}' missing`);

    const definition = {
      attributes: family.attributes,
      questions: family.questions,
      matching: family.matching,
      inclusionChecks: family.inclusionChecks,
      riskFlags: family.riskFlags,
      normalizedUnitRationale: family.normalizedUnitRationale,
    };

    const familyData = {
      name: family.name,
      categoryId: category.id,
      kind: family.kind,
      funnelRole: family.funnelRole,
      normalizedUnitCode: family.normalizedUnit,
      normalizedUnitRationale: family.normalizedUnitRationale,
      sellerUnitCodes: [...family.sellerUnits],
      applicableConditions: [...family.applicableConditions],
      definition: definition as object,
      definitionSchemaVersion: 1,
      escalationPrimary: family.reviewers.primary,
      escalationSecondary: family.reviewers.secondary ?? null,
      escalationReason: family.reviewers.reason,
      deletedAt: null as Date | null,
    };

    const dbFamily = await prisma.priceProductFamily.upsert({
      where: { key: family.key },
      update: familyData, // note: does NOT bump `version` — admin edits do that
      create: { key: family.key, ...familyData },
    });

    // Named permanent products (Stage 2 sub-products)
    for (const sub of family.subProducts) {
      await prisma.priceProduct.upsert({
        where: { familyId_key: { familyId: dbFamily.id, key: sub.key } },
        update: { name: sub.label, deletedAt: null },
        create: { familyId: dbFamily.id, key: sub.key, name: sub.label },
      });
      for (const alias of sub.aliases ?? []) {
        const product = await prisma.priceProduct.findUnique({
          where: { familyId_key: { familyId: dbFamily.id, key: sub.key } },
        });
        await prisma.priceAlias.upsert({
          where: { familyId_normalizedAlias: { familyId: dbFamily.id, normalizedAlias: normalizeAlias(alias) } },
          update: { alias, productId: product?.id ?? null, deletedAt: null },
          create: {
            familyId: dbFamily.id,
            productId: product?.id ?? null,
            alias,
            normalizedAlias: normalizeAlias(alias),
            source: 'stage2_taxonomy',
          },
        });
      }
    }

    // Family-level market names / aliases
    for (const alias of family.marketNames) {
      await prisma.priceAlias.upsert({
        where: { familyId_normalizedAlias: { familyId: dbFamily.id, normalizedAlias: normalizeAlias(alias) } },
        update: { alias, deletedAt: null },
        create: { familyId: dbFamily.id, alias, normalizedAlias: normalizeAlias(alias), source: 'stage2_taxonomy' },
      });
    }

    // Specification definitions (normalised from matrix attributes)
    for (const attr of family.attributes) {
      await prisma.priceSpecificationDefinition.upsert({
        where: { familyId_key: { familyId: dbFamily.id, key: attr.key } },
        update: {
          label: attr.label,
          priceChanging: attr.priceChanging,
          allowedValues: attr.values ? [...attr.values] : undefined,
          deletedAt: null,
        },
        create: {
          familyId: dbFamily.id,
          key: attr.key,
          label: attr.label,
          priceChanging: attr.priceChanging,
          allowedValues: attr.values ? [...attr.values] : undefined,
        },
      });
      if (attr.key === 'brand' && attr.values) {
        for (const v of attr.values) brandNames.add(v);
      }
    }
  }

  // 7. Brands (extracted from brand attributes across families) ------------
  for (const name of brandNames) {
    const normalizedName = normalizeAlias(name);
    if (normalizedName === 'other' || normalizedName === 'unknown') continue;
    await prisma.priceBrand.upsert({
      where: { normalizedName },
      update: { name, deletedAt: null },
      create: { name, normalizedName },
    });
  }

  // 8. Service families ------------------------------------------------------
  for (const svc of SERVICE_FAMILIES) {
    const definition = {
      marketNames: svc.marketNames,
      pricingUnits: svc.pricingUnits,
      hasMinimumJobCharge: svc.hasMinimumJobCharge,
      scopeFactors: svc.scopeFactors,
      notes: svc.notes ?? null,
    };
    await prisma.priceServiceFamily.upsert({
      where: { key: svc.key },
      update: {
        name: svc.name,
        pricingBasis: svc.pricingBasis,
        definition: definition as object,
        escalationPrimary: svc.reviewers.primary,
        escalationSecondary: svc.reviewers.secondary ?? null,
        escalationReason: svc.reviewers.reason,
        deletedAt: null,
      },
      create: {
        key: svc.key,
        name: svc.name,
        pricingBasis: svc.pricingBasis,
        definition: definition as object,
        escalationPrimary: svc.reviewers.primary,
        escalationSecondary: svc.reviewers.secondary ?? null,
        escalationReason: svc.reviewers.reason,
      },
    });
  }

  // 9. Seed bookkeeping -------------------------------------------------------
  await prisma.priceSeedMeta.upsert({
    where: { key: 'taxonomy_seed_version' },
    update: { value: PRICE_TAXONOMY_SEED_VERSION, appliedAt: new Date() },
    create: { key: 'taxonomy_seed_version', value: PRICE_TAXONOMY_SEED_VERSION },
  });
}

// Standalone runner: ts-node prisma/seeds/price-intelligence.seed.ts
if (require.main === module) {
  const prisma = new PrismaClient();
  seedPriceIntelligence(prisma)
    .then(async () => {
      const counts = {
        categories: await prisma.priceCategory.count(),
        families: await prisma.priceProductFamily.count(),
        products: await prisma.priceProduct.count(),
        aliases: await prisma.priceAlias.count(),
        specDefs: await prisma.priceSpecificationDefinition.count(),
        brands: await prisma.priceBrand.count(),
        units: await prisma.priceUnit.count(),
        conversionRules: await prisma.priceConversionRule.count(),
        locations: await prisma.priceLocation.count(),
        sources: await prisma.priceSource.count(),
        serviceFamilies: await prisma.priceServiceFamily.count(),
      };
      console.log('✅ Price intelligence seed complete:', counts);
      await prisma.$disconnect();
    })
    .catch(async (err) => {
      console.error('❌ Price intelligence seed failed:', err);
      await prisma.$disconnect();
      process.exit(1);
    });
}
