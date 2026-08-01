/**
 * Stage 3 round-trip proof: verifies that everything in the Stage 2 typed
 * taxonomy exists in the database (after seeding) and that key fields
 * survive the round trip unchanged.
 *
 * Run: DATABASE_URL=... npx ts-node scripts/price-catalogue-roundtrip-check.ts
 * Exits non-zero on any mismatch.
 */
import { PrismaClient } from '@prisma/client';

import { UNITS, CONVERSION_RULES } from '../src/price-intelligence/taxonomy/units';
import { LOCATIONS } from '../src/price-intelligence/taxonomy/locations';
import { LEVEL1_FAMILIES } from '../src/price-intelligence/taxonomy/families';
import { SERVICE_FAMILIES } from '../src/price-intelligence/taxonomy/services.data';

const prisma = new PrismaClient();
const problems: string[] = [];

function check(condition: boolean, message: string): void {
  if (!condition) problems.push(message);
}

async function main(): Promise<void> {
  // Units
  for (const u of UNITS) {
    const row = await prisma.priceUnit.findUnique({ where: { code: u.code } });
    check(!!row, `unit missing: ${u.code}`);
    if (row) {
      check(row.dimension === u.dimension, `unit dimension mismatch: ${u.code}`);
      check(row.label === u.label, `unit label mismatch: ${u.code}`);
    }
  }

  // Conversion rules
  for (const r of CONVERSION_RULES) {
    const row = await prisma.priceConversionRule.findUnique({
      where: {
        fromUnitCode_toUnitCode_factorSource: {
          fromUnitCode: r.fromUnit,
          toUnitCode: r.toUnit,
          factorSource: r.factorSource,
        },
      },
    });
    check(!!row, `conversion rule missing: ${r.fromUnit} -> ${r.toUnit} (${r.factorSource})`);
    if (row && r.factorSource === 'fixed') {
      check(
        row.fixedFactor !== null && Number(row.fixedFactor) === r.fixedFactor,
        `fixed factor mismatch: ${r.fromUnit} -> ${r.toUnit}`,
      );
    }
  }

  // Locations (including parent linkage)
  for (const loc of LOCATIONS) {
    const row = await prisma.priceLocation.findUnique({
      where: { code: loc.key },
      include: { parent: true },
    });
    check(!!row, `location missing: ${loc.key}`);
    if (row) {
      check(row.type === loc.type, `location type mismatch: ${loc.key}`);
      check(
        (row.parent?.code ?? undefined) === loc.parentKey,
        `location parent mismatch: ${loc.key}`,
      );
    }
  }

  // Product families with products, aliases, spec definitions
  for (const family of LEVEL1_FAMILIES) {
    const row = await prisma.priceProductFamily.findUnique({
      where: { key: family.key },
      include: { products: true, aliases: true, specDefs: true, category: true },
    });
    check(!!row, `family missing: ${family.key}`);
    if (!row) continue;

    check(row.name === family.name, `family name mismatch: ${family.key}`);
    check(row.category.code === family.parentCategory, `family category mismatch: ${family.key}`);
    check(row.normalizedUnitCode === family.normalizedUnit, `family unit mismatch: ${family.key}`);
    check(
      row.escalationPrimary === family.reviewers.primary,
      `family escalation mismatch: ${family.key}`,
    );

    for (const sub of family.subProducts) {
      check(
        row.products.some((p) => p.key === sub.key && p.name === sub.label),
        `product missing: ${family.key}/${sub.key}`,
      );
    }
    for (const alias of family.marketNames) {
      const normalized = alias.trim().toLowerCase().replace(/\s+/g, ' ');
      check(
        row.aliases.some((a) => a.normalizedAlias === normalized),
        `alias missing: ${family.key} '${alias}'`,
      );
    }
    for (const attr of family.attributes) {
      check(
        row.specDefs.some((s) => s.key === attr.key && s.priceChanging === attr.priceChanging),
        `spec definition missing/mismatched: ${family.key}/${attr.key}`,
      );
    }

    // Definition JSON round-trips the matrix template
    const definition = row.definition as { attributes?: unknown[]; questions?: unknown[] };
    check(
      Array.isArray(definition.attributes) && definition.attributes.length === family.attributes.length,
      `definition.attributes mismatch: ${family.key}`,
    );
    check(
      Array.isArray(definition.questions) && definition.questions.length === family.questions.length,
      `definition.questions mismatch: ${family.key}`,
    );
  }

  // Service families
  for (const svc of SERVICE_FAMILIES) {
    const row = await prisma.priceServiceFamily.findUnique({ where: { key: svc.key } });
    check(!!row, `service family missing: ${svc.key}`);
    if (row) check(row.pricingBasis === svc.pricingBasis, `service pricing basis mismatch: ${svc.key}`);
  }

  // Seed meta present
  const meta = await prisma.priceSeedMeta.findUnique({ where: { key: 'taxonomy_seed_version' } });
  check(!!meta, 'seed meta missing: taxonomy_seed_version');

  if (problems.length > 0) {
    console.error(`❌ Round-trip check FAILED with ${problems.length} problem(s):`);
    for (const p of problems) console.error(`  - ${p}`);
    process.exit(1);
  }
  console.log(
    `✅ Round-trip check passed: ${LEVEL1_FAMILIES.length} families, ${UNITS.length} units, ` +
      `${CONVERSION_RULES.length} conversion rules, ${LOCATIONS.length} locations, ` +
      `${SERVICE_FAMILIES.length} service families verified against the database.`,
  );
}

main()
  .catch((err) => {
    console.error('❌ Round-trip check errored:', err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
