/**
 * Canonical unit dictionary and deterministic conversion policy.
 * Policy doc: docs/price-checker/UNIT_DICTIONARY_AND_CONVERSION_POLICY.md
 *
 * Rules:
 * - Free-text units are prohibited; every observation stores a canonical code.
 * - Original seller price/unit/quantity are ALWAYS preserved alongside any
 *   normalised value.
 * - No conversion factor may be invented. Factors come from fixed physics,
 *   manufacturer specs, product specs, or the seller's own statement.
 */
import { ConversionRule, UnitDefinition } from './types';

export const UNITS: readonly UnitDefinition[] = [
  // count / package
  { code: 'piece', label: 'Per piece', aliases: ['each', 'unit', 'pc', 'one'], dimension: 'count' },
  { code: 'set', label: 'Per set', aliases: ['complete set', 'full set'], dimension: 'package' },
  { code: 'pair', label: 'Per pair', aliases: [], dimension: 'package' },
  { code: 'bag_50kg', label: 'Per 50 kg bag', aliases: ['bag', 'per bag'], dimension: 'package' },
  { code: 'bag_40kg', label: 'Per 40 kg bag', aliases: [], dimension: 'package' },
  { code: 'carton', label: 'Per carton', aliases: ['ctn', 'box'], dimension: 'package' },
  { code: 'bundle', label: 'Per bundle', aliases: [], dimension: 'package' },
  { code: 'pallet', label: 'Per pallet', aliases: [], dimension: 'package' },
  { code: 'roll', label: 'Per roll', aliases: [], dimension: 'package' },
  { code: 'coil', label: 'Per coil', aliases: ['per roll of cable'], dimension: 'package' },
  { code: 'drum', label: 'Per drum', aliases: ['keg'], dimension: 'package' },
  { code: 'bucket_20l', label: 'Per 20 L bucket', aliases: ['bucket', '20 litres'], dimension: 'package' },
  { code: 'gallon_4l', label: 'Per 4 L gallon', aliases: ['gallon'], dimension: 'package' },
  { code: 'truckload', label: 'Per truckload', aliases: ['trip', 'per trip', 'tipper'], dimension: 'package' },
  { code: 'trailer_600bags', label: 'Per 600-bag trailer', aliases: ['trailer load'], dimension: 'package' },

  // length / area / volume
  { code: 'length_12m', label: 'Per 12 m length', aliases: ['per length', 'full length'], dimension: 'length' },
  { code: 'length_5_8m', label: 'Per 5.8 m length', aliases: [], dimension: 'length' },
  { code: 'metre', label: 'Per metre', aliases: ['m', 'per meter'], dimension: 'length' },
  { code: 'sqm', label: 'Per square metre', aliases: ['m2', 'sq m', 'per square meter'], dimension: 'area' },
  { code: 'cubic_metre', label: 'Per cubic metre', aliases: ['m3'], dimension: 'volume' },
  { code: 'litre', label: 'Per litre', aliases: ['l', 'ltr'], dimension: 'volume' },

  // mass
  { code: 'kg', label: 'Per kilogram', aliases: ['kilo'], dimension: 'mass' },
  { code: 'tonne', label: 'Per tonne', aliases: ['ton', 'tons'], dimension: 'mass' },

  // electrical
  { code: 'watt', label: 'Per watt', aliases: ['w'], dimension: 'power' },
  { code: 'kva', label: 'Per kVA', aliases: [], dimension: 'power' },
  { code: 'kwh', label: 'Per kWh', aliases: [], dimension: 'energy' },
  { code: 'ah', label: 'Per amp-hour', aliases: [], dimension: 'electric_capacity' },

  // service units
  { code: 'point', label: 'Per installation point', aliases: ['per point'], dimension: 'service' },
  { code: 'room', label: 'Per room', aliases: [], dimension: 'service' },
  { code: 'job', label: 'Per job', aliases: ['per project', 'lump sum'], dimension: 'service' },
  { code: 'day', label: 'Per day', aliases: ['daily'], dimension: 'service' },
  { code: 'linear_metre', label: 'Per linear metre', aliases: ['running metre'], dimension: 'length' },
] as const;

const UNIT_INDEX = new Map(UNITS.map((u) => [u.code, u]));

export function getUnit(code: string): UnitDefinition | undefined {
  return UNIT_INDEX.get(code);
}

export function resolveUnitAlias(raw: string): UnitDefinition | undefined {
  const needle = raw.trim().toLowerCase();
  return UNITS.find((u) => u.code === needle || u.label.toLowerCase() === needle || u.aliases.includes(needle));
}

/**
 * Registered deterministic conversions. Anything not listed here is prohibited.
 */
export const CONVERSION_RULES: readonly ConversionRule[] = [
  {
    fromUnit: 'tonne',
    toUnit: 'kg',
    factorSource: 'fixed',
    fixedFactor: 1000,
    requiredInput: 'None — physical constant.',
  },
  {
    fromUnit: 'bucket_20l',
    toUnit: 'litre',
    factorSource: 'fixed',
    fixedFactor: 20,
    requiredInput: 'None — bucket size is part of the canonical unit.',
  },
  {
    fromUnit: 'gallon_4l',
    toUnit: 'litre',
    factorSource: 'fixed',
    fixedFactor: 4,
    requiredInput: 'None — gallon size is part of the canonical unit.',
  },
  {
    fromUnit: 'trailer_600bags',
    toUnit: 'bag_50kg',
    factorSource: 'fixed',
    fixedFactor: 600,
    requiredInput: 'None — trailer size is part of the canonical unit.',
  },
  {
    fromUnit: 'carton',
    toUnit: 'sqm',
    factorSource: 'product_spec',
    requiredInput: 'Square metres per carton for the EXACT tile product (from carton label or product spec).',
    note: 'Prohibited when m² per carton is unknown. Never assume a generic coverage.',
  },
  {
    fromUnit: 'carton',
    toUnit: 'piece',
    factorSource: 'product_spec',
    requiredInput: 'Pieces per carton for the exact product.',
  },
  {
    fromUnit: 'coil',
    toUnit: 'metre',
    factorSource: 'seller_stated',
    requiredInput: 'Coil length in metres as stated by the seller or printed on the drum.',
  },
  {
    fromUnit: 'length_12m',
    toUnit: 'tonne',
    factorSource: 'manufacturer_spec',
    requiredInput: 'Kilograms per 12 m length for the exact rebar diameter (standard mass tables).',
    note: 'Diameter must be known; conversion prohibited if diameter unknown.',
  },
  {
    fromUnit: 'piece',
    toUnit: 'watt',
    factorSource: 'manufacturer_spec',
    requiredInput: 'Rated wattage of the exact solar panel model.',
    note: 'Produces price-per-watt for solar panels only.',
  },
  {
    fromUnit: 'truckload',
    toUnit: 'tonne',
    factorSource: 'seller_stated',
    requiredInput: 'Load tonnage as stated by the seller (e.g. "20 tons of sharp sand").',
    note: 'A "tipper" has no standard size; the seller statement is mandatory.',
  },
  {
    fromUnit: 'roll',
    toUnit: 'sqm',
    factorSource: 'product_spec',
    requiredInput: 'Roll dimensions (width × length) for the exact membrane product.',
  },
] as const;

export interface ConversionInput {
  fromUnit: string;
  toUnit: string;
  price: number;
  /**
   * Product/seller-provided factor: how many `toUnit` are in one `fromUnit`.
   * Required unless the rule has a fixedFactor.
   */
  unitsPerFrom?: number;
  factorSource?: ConversionRule['factorSource'];
}

export interface ConversionResult {
  ok: true;
  normalizedPrice: number;
  normalizedUnit: string;
  formula: string;
  factorUsed: number;
  factorSource: ConversionRule['factorSource'];
  originalPrice: number;
  originalUnit: string;
}

export interface ConversionFailure {
  ok: false;
  reason:
    | 'conversion_not_registered'
    | 'missing_required_factor'
    | 'invalid_factor'
    | 'factor_source_mismatch';
  detail: string;
}

export function isConversionFailure(
  result: ConversionResult | ConversionFailure,
): result is ConversionFailure {
  return !result.ok;
}

const PRICE_PRECISION = 2;

/**
 * Deterministic price conversion. Returns a failure object (never a guess)
 * when the conversion is unregistered or the required factor is missing.
 */
export function convertPrice(input: ConversionInput): ConversionResult | ConversionFailure {
  const rule = CONVERSION_RULES.find((r) => r.fromUnit === input.fromUnit && r.toUnit === input.toUnit);

  if (!rule) {
    return {
      ok: false,
      reason: 'conversion_not_registered',
      detail: `No registered conversion from '${input.fromUnit}' to '${input.toUnit}'. Comparison in original units only.`,
    };
  }

  let factor: number | undefined;
  if (rule.factorSource === 'fixed') {
    factor = rule.fixedFactor;
  } else {
    if (input.unitsPerFrom === undefined) {
      return {
        ok: false,
        reason: 'missing_required_factor',
        detail: `Conversion '${rule.fromUnit}' → '${rule.toUnit}' requires: ${rule.requiredInput}`,
      };
    }
    if (input.factorSource && input.factorSource !== rule.factorSource) {
      return {
        ok: false,
        reason: 'factor_source_mismatch',
        detail: `Factor must come from '${rule.factorSource}', got '${input.factorSource}'.`,
      };
    }
    factor = input.unitsPerFrom;
  }

  if (!factor || !Number.isFinite(factor) || factor <= 0) {
    return { ok: false, reason: 'invalid_factor', detail: `Invalid conversion factor: ${String(factor)}` };
  }

  const normalized = input.price / factor;
  const rounded = Number(normalized.toFixed(PRICE_PRECISION));

  return {
    ok: true,
    normalizedPrice: rounded,
    normalizedUnit: input.toUnit,
    formula: `${input.price} ÷ ${factor} (${rule.factorSource})`,
    factorUsed: factor,
    factorSource: rule.factorSource,
    originalPrice: input.price,
    originalUnit: input.fromUnit,
  };
}

/** True when two canonical units may EVER be compared (directly or via a registered conversion). */
export function unitsComparable(unitA: string, unitB: string): boolean {
  if (unitA === unitB) return true;
  return CONVERSION_RULES.some(
    (r) => (r.fromUnit === unitA && r.toUnit === unitB) || (r.fromUnit === unitB && r.toUnit === unitA),
  );
}
