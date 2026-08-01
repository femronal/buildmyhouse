/**
 * Level 1 families — structural commodities (cement, rebar, blocks, sand, aggregates).
 * All sample observations are illustrative structure tests, never market data.
 */
import { ProductFamily } from '../types';
import { ALL_INCLUSION_CHECKS, COMMODITY_RISK_FLAGS, COMMON_QUESTIONS, q, sample } from './common';

export const CEMENT: ProductFamily = {
  key: 'cement',
  name: 'Cement',
  // Spot-check additions 2026-07-28 (gpt-5.6-sol vs real Jiji listings): Lafarge misspellings, 3X product name
  marketNames: ['cement', 'bag of cement', 'dangote', 'bua cement', 'elephant cement', 'siment', 'cememt', 'lafarge', 'lafarg', 'lafage', '3x cement'],
  parentCategory: 'structural',
  kind: 'product',
  applicableConditions: ['new'],
  funnelRole: 'free_traffic',
  subProducts: [
    { key: 'opc-425', label: 'Ordinary Portland 42.5 grade', aliases: ['42.5r', '42.5n', 'grade 42.5'] },
    { key: 'opc-325', label: 'Limestone/Portland 32.5 grade', aliases: ['32.5'] },
    { key: 'block-master', label: 'Block-moulding cement variants', aliases: ['blocmaster', '3x'] },
  ],
  attributes: [
    { key: 'brand', label: 'Brand', priceChanging: true, values: ['Dangote', 'BUA', 'Lafarge (Elephant/Supaset)', 'UniCem', 'Other'] },
    { key: 'grade', label: 'Cement grade', priceChanging: true, values: ['42.5', '32.5'] },
    { key: 'bag_weight', label: 'Bag weight', priceChanging: true, values: ['50kg'] },
    { key: 'purchase_type', label: 'Retail or wholesale', priceChanging: true, values: ['retail', 'wholesale_trailer'] },
  ],
  sellerUnits: ['bag_50kg', 'trailer_600bags'],
  normalizedUnit: 'bag_50kg',
  normalizedUnitRationale: 'Nigerian cement trades universally per 50 kg bag; trailer prices divide deterministically by 600.',
  questions: [
    q('brand', 'Which brand do you want?', 'brand_search', 'always', { whyItMatters: 'Brands price differently and availability varies by area.' }),
    q('grade', 'Which grade — 42.5 or 32.5?', 'single_select', 'conditional', {
      options: ['42.5', '32.5', 'Not sure'],
      dependsOn: { questionId: 'brand', valueIn: ['Lafarge (Elephant/Supaset)', 'BUA', 'Other'] },
      whyItMatters: '42.5 is the common structural grade; 32.5 variants are cheaper.',
    }),
    q('purchase_type', 'Are you buying retail bags or a full trailer (600 bags)?', 'single_select', 'always', { options: ['Retail bags', 'Full trailer (600 bags)'], allowUnknown: false }),
    ...COMMON_QUESTIONS,
  ],
  matching: {
    exactMatchKeys: ['brand', 'grade', 'bag_weight', 'purchase_type'],
    closeMatchKeys: ['grade', 'bag_weight', 'purchase_type'],
    neverComparableAcross: ['purchase_type'],
  },
  inclusionChecks: ALL_INCLUSION_CHECKS,
  riskFlags: COMMODITY_RISK_FLAGS,
  reviewers: { primary: 'structural_engineer', secondary: 'quantity_surveyor', reason: 'Grade suitability is structural; unit/rate conventions are QS domain.' },
  samples: [
    sample('Dangote 42.5R, 50 kg bag, ex-depot Lagos mainland', 9500, 'bag_50kg', 'merchant_confirmed', 'Tests brand+grade+retail matching.'),
    sample('BUA 42.5, 600-bag trailer, Ogun delivery included', 5400000, 'trailer_600bags', 'supplier_quotation', 'Tests trailer→bag fixed conversion and delivery inclusion.'),
  ],
};

export const REINFORCEMENT_STEEL: ProductFamily = {
  key: 'reinforcement-steel',
  name: 'Reinforcement steel',
  // Spot-check additions 2026-07-28: sellers lead with "TMT" + brand (LCI, Monac, PSL, Lion) and per-ton pricing
  marketNames: ['iron rod', 'rods', 'reinforcement', 'rebar', 'y12', 'y16', '12mm rod', 'iron rods', 'tmt', 'tmt rod', 'tmt iron rod', 'tmt rebar'],
  parentCategory: 'structural',
  kind: 'product',
  applicableConditions: ['new'],
  funnelRole: 'both',
  subProducts: [
    { key: 'deformed-bar', label: 'Deformed high-yield bars (Y-bars)' },
    { key: 'mild-bar', label: 'Mild steel round bars (R-bars)' },
    { key: 'brc-mesh', label: 'BRC wire mesh', aliases: ['brc'] },
    { key: 'binding-wire', label: 'Binding wire' },
  ],
  attributes: [
    { key: 'diameter_mm', label: 'Diameter (mm)', priceChanging: true, values: ['8', '10', '12', '16', '20', '25'] },
    { key: 'length_m', label: 'Length', priceChanging: true, values: ['12m'] },
    { key: 'origin', label: 'Local or imported', priceChanging: true, values: ['local', 'imported'] },
    { key: 'grade', label: 'Grade', priceChanging: true, values: ['grade60', 'other'] },
  ],
  sellerUnits: ['length_12m', 'tonne', 'bundle'],
  normalizedUnit: 'length_12m',
  normalizedUnitRationale:
    'Retail buyers purchase per 12 m length; tonne↔length converts via manufacturer mass tables once diameter is known (e.g. one 12 m Y12 ≈ 10.7 kg).',
  questions: [
    q('diameter_mm', 'What rod diameter do you need?', 'single_select', 'always', { options: ['8mm', '10mm', '12mm', '16mm', '20mm', '25mm'], whyItMatters: 'Price scales with diameter; your structural drawing specifies it.', allowUnknown: true }),
    q('origin', 'Local or imported rods?', 'single_select', 'optional', { options: ['Local', 'Imported', 'Not sure'], whyItMatters: 'Imported bars usually price higher per tonne.' }),
    q('sell_unit', 'Are you buying per length or per tonne?', 'single_select', 'always', { options: ['Per length', 'Per tonne'], allowUnknown: false }),
    ...COMMON_QUESTIONS,
  ],
  matching: {
    exactMatchKeys: ['diameter_mm', 'length_m', 'origin', 'grade'],
    closeMatchKeys: ['diameter_mm', 'length_m'],
    neverComparableAcross: ['diameter_mm'],
  },
  inclusionChecks: ALL_INCLUSION_CHECKS,
  riskFlags: COMMODITY_RISK_FLAGS,
  reviewers: { primary: 'structural_engineer', secondary: 'quantity_surveyor', reason: 'Bar schedules and grade suitability are structural; tonne/length rate build-ups are QS domain.' },
  samples: [
    sample('12 mm local deformed bar, 12 m length, Owode Onirin', 14500, 'length_12m', 'merchant_confirmed', 'Tests diameter matching and retail unit.'),
    sample('16 mm imported, per tonne, Lagos', 1250000, 'tonne', 'supplier_price_list', 'Tests tonne→length manufacturer-spec conversion gating.'),
  ],
};

export const CONCRETE_BLOCKS: ProductFamily = {
  key: 'concrete-blocks',
  name: 'Concrete blocks',
  // Spot-check additions 2026-07-28: stone-dust-based blocks, 4-inch size; block-search results are polluted by moulding-machine ads (see riskFlags)
  marketNames: ['blocks', '9 inch block', '6 inch block', 'hollow block', 'solid block', 'vibrated block', '4 inch block', 'stone dust block'],
  parentCategory: 'structural',
  kind: 'product',
  applicableConditions: ['new'],
  funnelRole: 'free_traffic',
  subProducts: [
    { key: 'hollow-9', label: '9-inch hollow' },
    { key: 'hollow-6', label: '6-inch hollow' },
    { key: 'solid-6', label: '6-inch solid' },
    { key: 'interlocking-block', label: 'Interlocking building blocks' },
  ],
  attributes: [
    { key: 'size_inch', label: 'Size', priceChanging: true, values: ['9', '6', '5', '4'] },
    { key: 'form', label: 'Hollow or solid', priceChanging: true, values: ['hollow', 'solid'] },
    { key: 'moulding', label: 'Vibrated or hand-mould', priceChanging: true, values: ['vibrated', 'hand_mould'] },
  ],
  sellerUnits: ['piece'],
  normalizedUnit: 'piece',
  normalizedUnitRationale: 'Blocks trade per piece everywhere in Nigeria; bulk deals are still quoted per piece.',
  questions: [
    q('size_inch', 'Which block size?', 'single_select', 'always', { options: ['9 inch', '6 inch', '5 inch', '4 inch'], allowUnknown: true }),
    q('form', 'Hollow or solid?', 'single_select', 'always', { options: ['Hollow', 'Solid'], whyItMatters: 'Solid blocks cost more and are used for specific walls.' }),
    q('moulding', 'Vibrated (machine) or hand-mould?', 'single_select', 'optional', { options: ['Vibrated', 'Hand-mould', 'Not sure'], whyItMatters: 'Vibrated blocks are stronger and cost slightly more.' }),
    ...COMMON_QUESTIONS,
  ],
  matching: {
    exactMatchKeys: ['size_inch', 'form', 'moulding'],
    closeMatchKeys: ['size_inch', 'form'],
    neverComparableAcross: ['size_inch'],
  },
  inclusionChecks: ALL_INCLUSION_CHECKS,
  riskFlags: COMMODITY_RISK_FLAGS,
  reviewers: { primary: 'structural_engineer', secondary: 'quantity_surveyor', reason: 'Block strength/type suitability is structural.' },
  samples: [
    sample('9-inch hollow vibrated block, ex-factory Mowe', 550, 'piece', 'merchant_confirmed', 'Tests size+form+moulding matching.'),
    sample('6-inch hollow, delivered Ajah (delivery included)', 520, 'piece', 'classified_listing', 'Tests delivery-included flag on commodity.'),
  ],
};

export const SAND: ProductFamily = {
  key: 'sand',
  name: 'Sand',
  // Spot-check addition 2026-07-28: "laterite sand" appears alongside sharp/plaster sand in supplier ads
  marketNames: ['sharp sand', 'plaster sand', 'filling sand', 'sand supply', 'tipper of sand', 'erosion sand', 'laterite sand'],
  parentCategory: 'structural',
  kind: 'product',
  applicableConditions: ['new'],
  funnelRole: 'free_traffic',
  subProducts: [
    { key: 'sharp-sand', label: 'Sharp sand (concrete/masonry)' },
    { key: 'plaster-sand', label: 'Plaster (smooth) sand' },
    { key: 'filling-sand', label: 'Filling/erosion sand' },
    { key: 'stone-dust', label: 'Stone dust', aliases: ['quarry dust'] },
  ],
  attributes: [
    { key: 'sand_type', label: 'Sand type', priceChanging: true, values: ['sharp', 'plaster', 'filling', 'stone_dust'] },
    { key: 'load_tonnage', label: 'Load size (tonnes)', priceChanging: true, values: ['5', '10', '20', '30'] },
  ],
  sellerUnits: ['truckload', 'tonne', 'cubic_metre'],
  normalizedUnit: 'tonne',
  normalizedUnitRationale:
    '“Tipper” has no standard size; loads are only comparable via the seller-stated tonnage. Prices normalise to per tonne with the load size preserved.',
  questions: [
    q('sand_type', 'What type of sand?', 'single_select', 'always', { options: ['Sharp sand', 'Plaster sand', 'Filling sand', 'Stone dust'], whyItMatters: 'Sharp, plaster and filling sand have very different prices and uses.', allowUnknown: true }),
    q('load_tonnage', 'What load size (e.g. 20-tonne tipper)?', 'single_select', 'always', { options: ['5 tonnes', '10 tonnes', '20 tonnes', '30 tonnes'], allowUnknown: true }),
    ...COMMON_QUESTIONS,
  ],
  matching: {
    exactMatchKeys: ['sand_type', 'load_tonnage'],
    closeMatchKeys: ['sand_type'],
    neverComparableAcross: ['sand_type'],
  },
  inclusionChecks: ALL_INCLUSION_CHECKS,
  riskFlags: COMMODITY_RISK_FLAGS,
  reviewers: { primary: 'structural_engineer', secondary: 'quantity_surveyor', reason: 'Sand suitability for concrete vs plaster is a technical/structural call.' },
  samples: [
    sample('Sharp sand, 20-tonne tipper, delivered Ikeja', 85000, 'truckload', 'merchant_confirmed', 'Tests seller-stated tonnage → per-tonne conversion.'),
    sample('Plaster sand, 10-tonne load, Abeokuta', 45000, 'truckload', 'classified_listing', 'Tests type separation from sharp sand.'),
  ],
};

export const GRANITE_AGGREGATES: ProductFamily = {
  key: 'granite-aggregates',
  name: 'Granite & aggregates',
  // Spot-check addition 2026-07-28: "stone dust" sold by the same aggregate suppliers, priced per ton
  marketNames: ['granite', 'chippings', 'gravel', 'stone', '3/4 granite', 'quarry stone', 'aggregate', 'stone dust'],
  parentCategory: 'structural',
  kind: 'product',
  applicableConditions: ['new'],
  funnelRole: 'free_traffic',
  subProducts: [
    { key: 'granite-34', label: '3/4-inch granite' },
    { key: 'granite-12', label: '1/2-inch granite' },
    { key: 'granite-14', label: '1/4-inch granite' },
    { key: 'gravel', label: 'Washed gravel' },
    { key: 'hardcore', label: 'Hardcore/boulder filling' },
  ],
  attributes: [
    { key: 'stone_type', label: 'Stone type', priceChanging: true, values: ['granite', 'gravel', 'hardcore'] },
    { key: 'stone_size', label: 'Stone size', priceChanging: true, values: ['3/4', '1/2', '1/4', 'mixed'] },
    { key: 'load_tonnage', label: 'Load size (tonnes)', priceChanging: true, values: ['5', '10', '20', '30'] },
  ],
  sellerUnits: ['truckload', 'tonne'],
  normalizedUnit: 'tonne',
  normalizedUnitRationale: 'Same as sand: loads compare only via seller-stated tonnage.',
  questions: [
    q('stone_type', 'Granite, gravel or hardcore?', 'single_select', 'always', { options: ['Granite', 'Gravel', 'Hardcore'], allowUnknown: true }),
    q('stone_size', 'What stone size (e.g. 3/4)?', 'single_select', 'conditional', {
      options: ['3/4', '1/2', '1/4', 'Mixed'],
      dependsOn: { questionId: 'stone_type', valueIn: ['Granite'] },
      whyItMatters: '3/4 granite is the standard for concrete; smaller sizes price differently.',
    }),
    q('load_tonnage', 'What load size?', 'single_select', 'always', { options: ['5 tonnes', '10 tonnes', '20 tonnes', '30 tonnes'], allowUnknown: true }),
    ...COMMON_QUESTIONS,
  ],
  matching: {
    exactMatchKeys: ['stone_type', 'stone_size', 'load_tonnage'],
    closeMatchKeys: ['stone_type', 'stone_size'],
    neverComparableAcross: ['stone_type'],
  },
  inclusionChecks: ALL_INCLUSION_CHECKS,
  riskFlags: COMMODITY_RISK_FLAGS,
  reviewers: { primary: 'structural_engineer', secondary: 'quantity_surveyor', reason: 'Aggregate grading suitability is structural.' },
  samples: [
    sample('3/4 granite, 30-tonne load, ex-quarry Ogun', 380000, 'truckload', 'supplier_quotation', 'Tests granite size + tonnage normalisation.'),
    sample('Washed gravel, 20 tonnes, Benin City delivery', 210000, 'truckload', 'classified_listing', 'Tests type separation and location tagging.'),
  ],
};

export const STRUCTURAL_FAMILIES: readonly ProductFamily[] = [
  CEMENT,
  REINFORCEMENT_STEEL,
  CONCRETE_BLOCKS,
  SAND,
  GRANITE_AGGREGATES,
];
