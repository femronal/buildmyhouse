import { CEMENT, REINFORCEMENT_STEEL } from './families/structural.data';
import { BATTERIES } from './families/energy-security.data';
import { EXTERNAL_PAVING } from './families/finishes.data';
import { compareSpecifications, isServiceKey, matchQueryToFamilies, normalizeQuery } from './matching';

describe('alias matching', () => {
  it('matches Nigerian market names to product families', () => {
    expect(matchQueryToFamilies('iron rod')[0]?.key).toBe('reinforcement-steel');
    expect(matchQueryToFamilies('chippings')[0]?.key).toBe('granite-aggregates');
    expect(matchQueryToFamilies('german floor')[0]?.key).toBe('external-paving');
    expect(matchQueryToFamilies('pumping machine')[0]?.key).toBe('water-pumps');
  });

  it('matches common misspellings', () => {
    expect(matchQueryToFamilies('aluminum window')[0]?.key).toBe('aluminium-windows');
    expect(matchQueryToFamilies('armored door')[0]?.key).toBe('doors');
  });

  it('matches inside longer queries', () => {
    const matches = matchQueryToFamilies('price of dangote in Lagos today');
    expect(matches.some((m) => m.key === 'cement')).toBe(true);
  });

  it('matches service families separately from products', () => {
    const matches = matchQueryToFamilies('borehole man');
    expect(matches[0]?.kind).toBe('service');
    expect(matches[0]?.key).toBe('borehole-drilling');
  });

  it('returns no match for unsupported products (routes to custom research)', () => {
    expect(matchQueryToFamilies('helicopter landing pad lighting')).toHaveLength(0);
  });

  it('normalizes queries deterministically', () => {
    expect(normalizeQuery('  IRON   ROD!! ')).toBe('iron rod');
  });
});

describe('specification comparison', () => {
  it('exact match when all exact keys agree', () => {
    const spec = { brand: 'Dangote', grade: '42.5', bag_weight: '50kg', purchase_type: 'retail' };
    expect(compareSpecifications(CEMENT, spec, { ...spec }).level).toBe('exact');
  });

  it('close match when close keys agree but exact keys are unknown', () => {
    const a = { brand: 'Dangote', grade: '42.5', bag_weight: '50kg', purchase_type: 'retail' };
    const b = { grade: '42.5', bag_weight: '50kg', purchase_type: 'retail' };
    const result = compareSpecifications(CEMENT, a, b);
    expect(result.level).toBe('close');
    expect(result.blockingKeys).toContain('brand');
  });

  it('partial match when close keys are incomplete', () => {
    const a = { diameter_mm: '12' };
    const b = { diameter_mm: '12' };
    // length/origin/grade unknown on both → not close, but no hard block
    const result = compareSpecifications(REINFORCEMENT_STEEL, a, b);
    expect(result.level).toBe('partial');
  });

  it('prohibits comparison across battery chemistries', () => {
    const lithium = { chemistry: 'lithium_lifepo4', voltage: '48/51.2', capacity_ah: '100' };
    const tubular = { chemistry: 'tubular_lead_acid', voltage: '12', capacity_ah: '220' };
    const result = compareSpecifications(BATTERIES, lithium, tubular);
    expect(result.level).toBe('not_comparable');
    expect(result.blockingKeys).toContain('chemistry');
  });

  it('prohibits comparing retail cement with trailer wholesale', () => {
    const retail = { brand: 'Dangote', grade: '42.5', bag_weight: '50kg', purchase_type: 'retail' };
    const trailer = { brand: 'Dangote', grade: '42.5', bag_weight: '50kg', purchase_type: 'wholesale_trailer' };
    expect(compareSpecifications(CEMENT, retail, trailer).level).toBe('not_comparable');
  });
});

describe('labour and material separation', () => {
  it('recognises service keys as services, not products', () => {
    expect(isServiceKey('tiling')).toBe(true);
    expect(isServiceKey('cement')).toBe(false);
  });

  it('never compares material-only paving with material-plus-laying', () => {
    const materialOnly = { system_type: 'interlocking', paver_thickness_mm: '80', includes_material_labour: 'no' };
    const withLaying = { system_type: 'interlocking', paver_thickness_mm: '80', includes_material_labour: 'yes' };
    expect(compareSpecifications(EXTERNAL_PAVING, materialOnly, withLaying).level).toBe('not_comparable');
  });
});
