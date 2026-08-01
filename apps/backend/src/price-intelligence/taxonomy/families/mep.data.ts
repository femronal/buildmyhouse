/**
 * Level 1 families — mechanical/electrical/plumbing inputs (cables, protection,
 * pipes, pumps, tanks).
 * All sample observations are illustrative structure tests, never market data.
 */
import { ProductFamily } from '../types';
import { ALL_INCLUSION_CHECKS, COMMODITY_RISK_FLAGS, COMMON_QUESTIONS, EQUIPMENT_RISK_FLAGS, q, sample } from './common';

export const ELECTRICAL_CABLES: ProductFamily = {
  key: 'electrical-cables',
  name: 'Electrical cables',
  // Spot-check additions 2026-07-28: "single cable"/"1core", coil language ("full roll", "factory coil", "100 meters"), "3c" shorthand for 3-core flexible
  marketNames: ['cable', 'wire', '2.5mm wire', 'coleman', 'cutix', 'nigerchin', 'armoured cable', 'flex wire', 'single cable', 'single core cable', '1core', '3c cable', 'flexible cable', 'full roll', 'factory coil'],
  parentCategory: 'mep',
  kind: 'product',
  applicableConditions: ['new'],
  funnelRole: 'both',
  subProducts: [
    { key: 'single-core', label: 'Single-core house wiring' },
    { key: 'flexible', label: 'Flexible multi-strand cables' },
    { key: 'armoured', label: 'Armoured (SWA) cables' },
    { key: 'coaxial-data', label: 'Coaxial/data cables' },
  ],
  attributes: [
    { key: 'brand', label: 'Brand', priceChanging: true, values: ['Coleman', 'Cutix', 'Nigerchin', 'Other'] },
    { key: 'cable_type', label: 'Cable type', priceChanging: true, values: ['single_core', 'flexible', 'armoured'] },
    { key: 'size_sqmm', label: 'Conductor size (mm²)', priceChanging: true, values: ['1.0', '1.5', '2.5', '4', '6', '10', '16', '25'] },
    { key: 'cores', label: 'Number of cores', priceChanging: true, values: ['1', '2', '3', '4'] },
    { key: 'conductor', label: 'Conductor material', priceChanging: true, values: ['pure_copper', 'copper_clad_aluminium'] },
    { key: 'coil_length', label: 'Coil/drum length', priceChanging: true },
  ],
  sellerUnits: ['coil', 'metre'],
  normalizedUnit: 'metre',
  normalizedUnitRationale:
    'Coils vary (100 yards vs 90 m vs 50 m drums); per-metre comparison requires the seller-stated coil length. Counterfeit/CCA “copper” is a known hazard — brand and conductor material gate matching.',
  questions: [
    q('size_sqmm', 'What cable size (mm²)? Your electrician’s load schedule specifies this.', 'single_select', 'always', { options: ['1.0', '1.5', '2.5', '4', '6', '10', '16', '25'], allowUnknown: true }),
    q('cable_type', 'Single-core wiring, flexible, or armoured cable?', 'single_select', 'always', { options: ['Single-core', 'Flexible', 'Armoured'], allowUnknown: true }),
    q('brand', 'Which brand? (Coleman, Cutix, Nigerchin…)', 'brand_search', 'always', { whyItMatters: 'Cable is the most counterfeited electrical product in Nigeria; brand determines both price and safety.' }),
    q('conductor', 'Pure copper or copper-clad aluminium?', 'single_select', 'professional_review', { options: ['Pure copper', 'Copper-clad aluminium', 'Not sure'], whyItMatters: 'CCA cable is cheaper but carries less current — an electrician should confirm suitability.' }),
    ...COMMON_QUESTIONS,
  ],
  matching: {
    exactMatchKeys: ['brand', 'cable_type', 'size_sqmm', 'cores', 'conductor'],
    closeMatchKeys: ['cable_type', 'size_sqmm', 'cores'],
    neverComparableAcross: ['size_sqmm', 'conductor'],
  },
  inclusionChecks: ALL_INCLUSION_CHECKS,
  riskFlags: [...COMMODITY_RISK_FLAGS, 'smaller_spec'],
  reviewers: { primary: 'electrical_engineer', secondary: 'quantity_surveyor', reason: 'Conductor sizing and counterfeit risk are electrical-safety domain.' },
  samples: [
    sample('Coleman 2.5 mm² single-core, 100-yard coil, Dosunmu market', 68000, 'coil', 'merchant_confirmed', 'Tests coil→metre seller-stated conversion.'),
    sample('4-core 16 mm² armoured cable, per metre', 9500, 'metre', 'supplier_quotation', 'Tests armoured type separation.'),
  ],
};

export const ELECTRICAL_PROTECTION: ProductFamily = {
  key: 'electrical-protection',
  name: 'Electrical protection & wiring accessories',
  // Spot-check additions 2026-07-28: knife vs automatic changeover (ATS), fuse units; manual/automatic distinction is a huge price driver
  marketNames: ['distribution board', 'db box', 'breaker', 'mcb', 'changeover', 'socket', 'switch', 'consumer unit', 'change over switch', 'changeover switch', 'transfer switch', 'ats', 'knife switch', 'fuse unit'],
  parentCategory: 'mep',
  kind: 'accessory_set',
  applicableConditions: ['new'],
  funnelRole: 'paid_research',
  subProducts: [
    { key: 'distribution-board', label: 'Distribution boards / consumer units' },
    { key: 'breakers', label: 'MCB/MCCB/RCCB breakers' },
    { key: 'changeover', label: 'Changeover switches (manual/automatic)' },
    { key: 'sockets-switches', label: 'Sockets & switches' },
    { key: 'earthing', label: 'Earthing materials' },
  ],
  attributes: [
    { key: 'item_type', label: 'Item', priceChanging: true, values: ['db', 'mcb', 'rccb', 'changeover_manual', 'changeover_auto', 'socket', 'switch'] },
    { key: 'ways_or_rating', label: 'Ways (DB) or amp rating', priceChanging: true },
    { key: 'brand', label: 'Brand', priceChanging: true, values: ['Schneider', 'ABB', 'Hager', 'MK', 'Crabtree-type', 'Economy'] },
    { key: 'phase', label: 'Single or three phase', priceChanging: true, values: ['single', 'three'] },
  ],
  sellerUnits: ['piece', 'set'],
  normalizedUnit: 'piece',
  normalizedUnitRationale: 'Protection devices trade per piece; DB “populated vs empty” must be flagged as bundle state.',
  questions: [
    q('item_type', 'Which item do you need?', 'single_select', 'always', { options: ['Distribution board', 'Breaker (MCB/RCCB)', 'Changeover switch', 'Sockets & switches', 'Earthing materials'], allowUnknown: false }),
    q('ways_or_rating', 'What size — number of ways (DB) or amp rating (breaker/changeover)?', 'free_text', 'always', { allowUnknown: true }),
    q('phase', 'Single-phase or three-phase supply?', 'single_select', 'always', { options: ['Single-phase', 'Three-phase', 'Not sure'], allowUnknown: true }),
    q('brand', 'Brand preference?', 'brand_search', 'optional', { whyItMatters: 'Genuine Schneider/ABB devices cost multiples of economy brands.' }),
    q('populated', 'For a DB: empty board or populated with breakers?', 'single_select', 'conditional', {
      options: ['Empty', 'Populated with breakers'],
      dependsOn: { questionId: 'item_type', valueIn: ['Distribution board'] },
    }),
    ...COMMON_QUESTIONS,
  ],
  matching: {
    exactMatchKeys: ['item_type', 'ways_or_rating', 'brand', 'phase'],
    closeMatchKeys: ['item_type', 'ways_or_rating', 'phase'],
    neverComparableAcross: ['item_type', 'phase'],
  },
  inclusionChecks: ALL_INCLUSION_CHECKS,
  riskFlags: [...EQUIPMENT_RISK_FLAGS],
  reviewers: { primary: 'electrical_engineer', reason: 'Protection sizing and counterfeit detection are electrical-safety domain.' },
  samples: [
    sample('12-way single-phase DB, populated, mid brand', 145000, 'set', 'supplier_quotation', 'Tests populated-vs-empty bundle flag.'),
    sample('63A manual changeover, per piece', 38000, 'piece', 'merchant_confirmed', 'Tests rating-based matching.'),
  ],
};

export const PLUMBING_PIPES: ProductFamily = {
  key: 'plumbing-pipes',
  name: 'Plumbing pipes & fittings',
  // Spot-check additions 2026-07-28: brand-led naming (Sanica, IPS, Polytech), "hot and cold" phrasing, bar-rated PVC ("7 bar")
  marketNames: ['pvc pipe', 'ppr pipe', 'pressure pipe', 'waste pipe', 'tigre', 'pipes', 'fittings', 'elbow', 'conduit pipe', 'ips pipe', 'sanica', 'hot and cold pipe', 'ppr connectors'],
  parentCategory: 'mep',
  kind: 'product',
  applicableConditions: ['new'],
  funnelRole: 'both',
  subProducts: [
    { key: 'pvc-pressure', label: 'PVC pressure pipes' },
    { key: 'pvc-waste', label: 'PVC waste/soil pipes' },
    { key: 'ppr', label: 'PPR hot/cold pipes' },
    { key: 'conduit', label: 'Electrical conduit pipes' },
    { key: 'fittings', label: 'Fittings (elbows, tees, sockets, valves)' },
  ],
  attributes: [
    { key: 'pipe_type', label: 'Pipe type', priceChanging: true, values: ['pvc_pressure', 'pvc_waste', 'ppr', 'conduit'] },
    { key: 'diameter_inch', label: 'Diameter', priceChanging: true, values: ['1/2', '3/4', '1', '1.5', '2', '3', '4'] },
    { key: 'brand', label: 'Brand', priceChanging: true },
    { key: 'pressure_class', label: 'Pressure class (PPR/pressure)', priceChanging: true, values: ['PN10', 'PN16', 'PN20'] },
  ],
  sellerUnits: ['length_5_8m', 'piece', 'metre'],
  normalizedUnit: 'length_5_8m',
  normalizedUnitRationale: 'Nigerian pipe lengths are ~5.8 m standard; fittings stay per piece — pipes and fittings never cross-compare.',
  questions: [
    q('pipe_type', 'What pipe type — pressure (water supply), waste, PPR (hot water) or conduit?', 'single_select', 'always', { options: ['PVC pressure', 'PVC waste', 'PPR', 'Conduit'], allowUnknown: true }),
    q('diameter_inch', 'What diameter?', 'single_select', 'always', { options: ['1/2"', '3/4"', '1"', '1.5"', '2"', '3"', '4"'], allowUnknown: true }),
    q('brand', 'Brand preference?', 'brand_search', 'optional'),
    ...COMMON_QUESTIONS,
  ],
  matching: {
    exactMatchKeys: ['pipe_type', 'diameter_inch', 'brand', 'pressure_class'],
    closeMatchKeys: ['pipe_type', 'diameter_inch'],
    neverComparableAcross: ['pipe_type', 'diameter_inch'],
  },
  inclusionChecks: ALL_INCLUSION_CHECKS,
  riskFlags: COMMODITY_RISK_FLAGS,
  reviewers: { primary: 'building_services', secondary: 'quantity_surveyor', reason: 'Pipe classes and hot/cold suitability are wet-services domain.' },
  samples: [
    sample('1-inch PVC pressure pipe, 5.8 m length', 4200, 'length_5_8m', 'merchant_confirmed', 'Tests diameter + type matching.'),
    sample('PPR 3/4" PN20, per length, premium brand', 7800, 'length_5_8m', 'established_ecommerce', 'Tests pressure-class attribute.'),
  ],
};

export const WATER_PUMPS: ProductFamily = {
  key: 'water-pumps',
  name: 'Water pumps',
  // Spot-check additions 2026-07-28: "Italian pump" as origin claim, stainless/flat-head/self-priming descriptors, sewage pumps in same searches
  marketNames: ['pumping machine', 'water pump', 'sumo', 'surface pump', 'submersible', 'pedrollo', 'booster pump', 'italian pump', 'stainless pump', 'self priming pump', 'flat head pump', 'sewage pump'],
  parentCategory: 'mep',
  kind: 'product',
  applicableConditions: ['new', 'used'],
  funnelRole: 'both',
  subProducts: [
    { key: 'surface', label: 'Surface pumps' },
    { key: 'submersible', label: 'Submersible pumps', aliases: ['sumo'] },
    { key: 'booster', label: 'Pressure booster sets' },
    { key: 'controller', label: 'Pump controllers & pressure switches' },
  ],
  attributes: [
    { key: 'pump_type', label: 'Pump type', priceChanging: true, values: ['surface', 'submersible', 'booster'] },
    { key: 'brand', label: 'Brand', priceChanging: true, values: ['Pedrollo', 'Grundfos', 'Interdab', 'Ingco/economy', 'Other'] },
    { key: 'horsepower', label: 'Horsepower', priceChanging: true, values: ['0.5', '1', '1.5', '2', '3'] },
    { key: 'head_m', label: 'Pumping head (m)', priceChanging: true },
    { key: 'condition', label: 'New or used', priceChanging: true, values: ['new', 'used'] },
    { key: 'accessories_included', label: 'Accessories/controller included', priceChanging: true },
  ],
  sellerUnits: ['piece'],
  normalizedUnit: 'piece',
  normalizedUnitRationale: 'Pumps trade per unit; type + HP + brand gate all comparisons, and used units never compare with new.',
  questions: [
    q('pump_type', 'Surface pump (beside tank) or submersible (inside borehole/well)?', 'single_select', 'always', { options: ['Surface', 'Submersible (sumo)', 'Booster set', 'Not sure'], allowUnknown: true }),
    q('horsepower', 'What horsepower? (1 HP is the common house size.)', 'single_select', 'always', { options: ['0.5 HP', '1 HP', '1.5 HP', '2 HP', '3 HP', 'Not sure'], allowUnknown: true }),
    q('brand', 'Brand preference? Genuine Pedrollo vs clones is a big price difference.', 'brand_search', 'always', { whyItMatters: 'Counterfeit “Pedrollo” pumps are widespread; brand authenticity drives price.' }),
    q('condition', 'New or fairly used?', 'single_select', 'always', { options: ['New', 'Fairly used'], allowUnknown: false }),
    q('installation_needed', 'Include installation by a plumber?', 'yes_no', 'optional'),
    ...COMMON_QUESTIONS,
  ],
  matching: {
    exactMatchKeys: ['pump_type', 'brand', 'horsepower', 'condition'],
    closeMatchKeys: ['pump_type', 'horsepower', 'condition'],
    neverComparableAcross: ['pump_type', 'condition'],
  },
  inclusionChecks: ALL_INCLUSION_CHECKS,
  riskFlags: EQUIPMENT_RISK_FLAGS,
  reviewers: { primary: 'building_services', secondary: 'electrical_engineer', reason: 'Pump sizing/head is mechanical; motor ratings electrical.' },
  samples: [
    sample('Pedrollo 1 HP surface pump, new, boxed with warranty card', 95000, 'piece', 'established_ecommerce', 'Tests brand-authenticity attribute.'),
    sample('1.5 HP submersible + controller, new, Jiji listing', 120000, 'piece', 'classified_listing', 'Tests accessories-included flag and Tier 3 caution.'),
  ],
};

export const WATER_TANKS: ProductFamily = {
  key: 'water-tanks',
  name: 'Water-storage tanks',
  // Spot-check additions 2026-07-28: "GP tank"/"Gee Pee" spellings, "rubber tank" (plastic tank), Storex brand
  marketNames: ['water tank', 'geepee tank', 'storage tank', 'overhead tank', 'surface tank', '2000 litres tank', 'gp tank', 'gee pee tank', 'rubber tank', 'storex'],
  parentCategory: 'mep',
  kind: 'product',
  applicableConditions: ['new'],
  funnelRole: 'free_traffic',
  subProducts: [
    { key: 'plastic-vertical', label: 'Vertical plastic tanks' },
    { key: 'plastic-horizontal', label: 'Horizontal/loft plastic tanks' },
    { key: 'stainless', label: 'Stainless steel tanks' },
    { key: 'underground', label: 'Underground/septic tanks' },
  ],
  attributes: [
    { key: 'material', label: 'Material', priceChanging: true, values: ['plastic', 'stainless_steel', 'fibreglass'] },
    { key: 'capacity_litres', label: 'Capacity (litres)', priceChanging: true, values: ['500', '1000', '1500', '2000', '3000', '5000', '10000'] },
    { key: 'brand', label: 'Brand', priceChanging: true, values: ['GeePee', 'Tank Africa-type', 'Sonaz-type', 'Other'] },
    { key: 'layers', label: 'Layer construction', priceChanging: true, values: ['single', 'double', 'triple'] },
  ],
  sellerUnits: ['piece'],
  normalizedUnit: 'piece',
  normalizedUnitRationale: 'Tanks trade per unit at stated capacity; capacity gates comparison (no per-litre normalisation — pricing is non-linear).',
  questions: [
    q('capacity_litres', 'What tank capacity (litres)?', 'single_select', 'always', { options: ['500', '1000', '1500', '2000', '3000', '5000', '10000+'], allowUnknown: true }),
    q('material', 'Plastic or stainless steel?', 'single_select', 'always', { options: ['Plastic', 'Stainless steel', 'Not sure'], allowUnknown: true }),
    q('brand', 'Brand preference (GeePee etc.)?', 'brand_search', 'optional'),
    ...COMMON_QUESTIONS,
  ],
  matching: {
    exactMatchKeys: ['material', 'capacity_litres', 'brand', 'layers'],
    closeMatchKeys: ['material', 'capacity_litres'],
    neverComparableAcross: ['material', 'capacity_litres'],
  },
  inclusionChecks: ALL_INCLUSION_CHECKS,
  riskFlags: COMMODITY_RISK_FLAGS,
  reviewers: { primary: 'building_services', reason: 'Tank sizing and installation loads are services domain.' },
  samples: [
    sample('GeePee 2000 L vertical tank, ex-store Lagos', 145000, 'piece', 'established_ecommerce', 'Tests capacity + brand matching.'),
    sample('Stainless 1000 L tank, delivered Abuja', 260000, 'piece', 'supplier_quotation', 'Tests material separation.'),
  ],
};

export const MEP_FAMILIES: readonly ProductFamily[] = [
  ELECTRICAL_CABLES,
  ELECTRICAL_PROTECTION,
  PLUMBING_PIPES,
  WATER_PUMPS,
  WATER_TANKS,
];
