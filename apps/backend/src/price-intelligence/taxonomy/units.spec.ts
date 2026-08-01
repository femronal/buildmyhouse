import { CONVERSION_RULES, convertPrice, getUnit, isConversionFailure, resolveUnitAlias, UNITS, unitsComparable } from './units';

describe('canonical unit dictionary', () => {
  it('has unique canonical codes', () => {
    const codes = UNITS.map((u) => u.code);
    expect(new Set(codes).size).toBe(codes.length);
  });

  it('resolves market aliases to canonical units', () => {
    expect(resolveUnitAlias('per bag')?.code).toBe('bag_50kg');
    expect(resolveUnitAlias('m2')?.code).toBe('sqm');
    expect(resolveUnitAlias('TON')?.code).toBe('tonne');
  });

  it('every conversion rule references registered units', () => {
    for (const rule of CONVERSION_RULES) {
      expect(getUnit(rule.fromUnit)).toBeDefined();
      expect(getUnit(rule.toUnit)).toBeDefined();
    }
  });
});

describe('deterministic conversions', () => {
  it('converts fixed-factor units (trailer → bags)', () => {
    const result = convertPrice({ fromUnit: 'trailer_600bags', toUnit: 'bag_50kg', price: 5400000 });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.normalizedPrice).toBe(9000);
      expect(result.factorSource).toBe('fixed');
    }
  });

  it('converts carton → m² only with a product-spec factor', () => {
    const withFactor = convertPrice({ fromUnit: 'carton', toUnit: 'sqm', price: 18000, unitsPerFrom: 1.44 });
    expect(withFactor.ok).toBe(true);
    if (withFactor.ok) {
      expect(withFactor.normalizedPrice).toBe(12500);
    }
  });

  it('preserves the original seller price and unit on every conversion', () => {
    const result = convertPrice({ fromUnit: 'bucket_20l', toUnit: 'litre', price: 42000 });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.originalPrice).toBe(42000);
      expect(result.originalUnit).toBe('bucket_20l');
      expect(result.formula).toContain('42000');
    }
  });

  it('records the conversion formula and factor source', () => {
    const result = convertPrice({ fromUnit: 'coil', toUnit: 'metre', price: 68000, unitsPerFrom: 91.44 });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.factorUsed).toBe(91.44);
      expect(result.factorSource).toBe('seller_stated');
    }
  });
});

describe('prohibited conversions', () => {
  it('refuses unregistered conversions (bag of cement → m²)', () => {
    const result = convertPrice({ fromUnit: 'bag_50kg', toUnit: 'sqm', price: 9500 });
    if (!isConversionFailure(result)) throw new Error('expected failure');
    expect(result.reason).toBe('conversion_not_registered');
  });

  it('refuses carton → m² when the product factor is missing', () => {
    const result = convertPrice({ fromUnit: 'carton', toUnit: 'sqm', price: 18000 });
    if (!isConversionFailure(result)) throw new Error('expected failure');
    expect(result.reason).toBe('missing_required_factor');
  });

  it('refuses invalid factors instead of guessing', () => {
    const result = convertPrice({ fromUnit: 'carton', toUnit: 'sqm', price: 18000, unitsPerFrom: 0 });
    if (!isConversionFailure(result)) throw new Error('expected failure');
    expect(result.reason).toBe('invalid_factor');
  });
});

describe('unit compatibility', () => {
  it('same unit is always comparable', () => {
    expect(unitsComparable('piece', 'piece')).toBe(true);
  });

  it('units with a registered conversion are comparable', () => {
    expect(unitsComparable('carton', 'sqm')).toBe(true);
    expect(unitsComparable('tonne', 'kg')).toBe(true);
  });

  it('unrelated units are never comparable', () => {
    expect(unitsComparable('bag_50kg', 'sqm')).toBe(false);
    expect(unitsComparable('piece', 'litre')).toBe(false);
  });
});
