/**
 * Level 1 families — building envelope (roofing, waterproofing, doors, windows).
 * All sample observations are illustrative structure tests, never market data.
 */
import { ProductFamily } from '../types';
import { ALL_INCLUSION_CHECKS, COMMODITY_RISK_FLAGS, COMMON_QUESTIONS, EQUIPMENT_RISK_FLAGS, q, sample } from './common';

export const ROOFING: ProductFamily = {
  key: 'roofing',
  name: 'Roofing sheets & accessories',
  // Spot-check additions 2026-07-28: sellers say "0.55 gauge", "shingle", "stone coated roofing tiles"; brands Gerard/Kristin/AMB with 50-year warranty claims
  marketNames: ['roofing sheet', 'aluminium roofing', 'stone coated', 'step tile', 'longspan', 'long span', 'gerard', 'roofing', 'shingle', '0.55 gauge', 'stone coated roofing tiles'],
  parentCategory: 'envelope',
  kind: 'system',
  applicableConditions: ['new'],
  funnelRole: 'both',
  subProducts: [
    { key: 'stone-coated', label: 'Stone-coated steel tiles', aliases: ['gerard type', 'milano', 'bond', 'shingle'] },
    { key: 'longspan-aluminium', label: 'Long-span aluminium', aliases: ['0.55 aluminium', 'towergate type'] },
    { key: 'step-tile-aluminium', label: 'Step-tile aluminium' },
    { key: 'corrugated', label: 'Corrugated/metcoppo sheets' },
    { key: 'accessories', label: 'Ridges, flashings, gutters, fasteners', aliases: ['ridge cap', 'flashing', 'gutter'] },
  ],
  attributes: [
    { key: 'sheet_type', label: 'Sheet type', priceChanging: true, values: ['stone_coated', 'longspan_aluminium', 'step_tile', 'corrugated'] },
    { key: 'thickness_mm', label: 'Thickness/gauge', priceChanging: true, values: ['0.45', '0.55', '0.7'] },
    { key: 'profile', label: 'Profile', priceChanging: true },
    { key: 'brand', label: 'Brand', priceChanging: true },
    { key: 'colour', label: 'Colour/coating', priceChanging: false },
    { key: 'effective_width_m', label: 'Effective width', priceChanging: true },
  ],
  sellerUnits: ['sqm', 'piece', 'bundle'],
  normalizedUnit: 'sqm',
  normalizedUnitRationale:
    'Roofing quotes mix per-sheet and per-m². Sheet→m² conversion requires effective width × length for the exact profile; prohibited otherwise (overlap eats coverage).',
  questions: [
    q('sheet_type', 'Which roofing type?', 'single_select', 'always', { options: ['Stone-coated', 'Long-span aluminium', 'Step-tile aluminium', 'Corrugated'], allowUnknown: true }),
    q('thickness_mm', 'What thickness (gauge)?', 'single_select', 'always', { options: ['0.45mm', '0.55mm', '0.7mm'], whyItMatters: '0.45 vs 0.55 is the single biggest price driver in aluminium roofing.', allowUnknown: true }),
    q('roof_area', 'Roughly how many square metres is the roof? (Your carpenter or drawing can tell you.)', 'number', 'always', { allowUnknown: true }),
    q('accessories_needed', 'Should we include ridges, flashings and gutters?', 'yes_no', 'optional', { whyItMatters: 'Accessories often add 10–20% that quotes hide.' }),
    q('installation_needed', 'Do you also want installation labour priced?', 'yes_no', 'optional'),
    ...COMMON_QUESTIONS,
  ],
  matching: {
    exactMatchKeys: ['sheet_type', 'thickness_mm', 'profile', 'brand'],
    closeMatchKeys: ['sheet_type', 'thickness_mm'],
    neverComparableAcross: ['sheet_type'],
  },
  inclusionChecks: ALL_INCLUSION_CHECKS,
  riskFlags: [...COMMODITY_RISK_FLAGS, 'accessory_only', 'incomplete_bundle'],
  reviewers: { primary: 'architect_interior', secondary: 'structural_engineer', reason: 'Profile/coverage is architectural; structural loading of tiles vs sheets is engineering.' },
  samples: [
    sample('0.55 mm long-span aluminium, per m², Lagos supplier', 5800, 'sqm', 'established_ecommerce', 'Tests thickness matching in m².'),
    sample('Stone-coated bond tile, per piece (0.45 m² coverage stated)', 3900, 'piece', 'supplier_quotation', 'Tests piece→m² conversion with product-spec coverage.'),
  ],
};

export const WATERPROOFING: ProductFamily = {
  key: 'waterproofing',
  name: 'Waterproofing materials & systems',
  // Spot-check additions 2026-07-28: felt/emulsion terminology (Bitunil, Armorseal), APP/SBS modifier language
  marketNames: ['waterproofing', 'bitumen membrane', 'damp proof', 'water guard', 'tanking', 'flexseal', 'bitumen felt', 'roofing felt', 'app membrane', 'sbs membrane', 'bitumen emulsion'],
  parentCategory: 'envelope',
  kind: 'system',
  applicableConditions: ['new'],
  funnelRole: 'paid_research',
  subProducts: [
    { key: 'bituminous-membrane', label: 'Torch-on bituminous membrane rolls' },
    { key: 'cementitious', label: 'Cementitious slurry systems' },
    { key: 'liquid-membrane', label: 'Liquid-applied membranes' },
    { key: 'admixture', label: 'Concrete waterproofing admixtures' },
  ],
  attributes: [
    { key: 'system_type', label: 'System type', priceChanging: true, values: ['bituminous_membrane', 'cementitious', 'liquid_membrane', 'admixture'] },
    { key: 'thickness_mm', label: 'Membrane thickness', priceChanging: true, values: ['3', '4'] },
    { key: 'brand', label: 'Brand', priceChanging: true },
    { key: 'coverage', label: 'Coverage per unit', priceChanging: true },
  ],
  sellerUnits: ['roll', 'litre', 'kg', 'sqm', 'drum'],
  normalizedUnit: 'sqm',
  normalizedUnitRationale: 'Waterproofing decisions are made per m² of surface; roll/litre→m² requires product-spec coverage.',
  questions: [
    q('surface', 'What are you waterproofing?', 'single_select', 'always', { options: ['Flat roof/deck', 'Bathroom/wet area', 'Foundation/basement', 'Water tank', 'Other'], allowUnknown: true }),
    q('system_type', 'Do you know which system you want?', 'single_select', 'optional', { options: ['Torch-on membrane', 'Cement slurry', 'Liquid membrane', 'Not sure'], whyItMatters: 'Systems differ in price and durability; “not sure” routes to professional guidance.' }),
    q('area_sqm', 'Roughly how many square metres?', 'number', 'always', { allowUnknown: true }),
    q('installation_needed', 'Should we include application labour?', 'yes_no', 'optional'),
    ...COMMON_QUESTIONS,
  ],
  matching: {
    exactMatchKeys: ['system_type', 'thickness_mm', 'brand'],
    closeMatchKeys: ['system_type', 'thickness_mm'],
    neverComparableAcross: ['system_type'],
  },
  inclusionChecks: ALL_INCLUSION_CHECKS,
  riskFlags: [...COMMODITY_RISK_FLAGS, 'incomplete_bundle'],
  reviewers: { primary: 'building_services', secondary: 'structural_engineer', reason: 'System suitability spans wet services and structure; misapplication is a costly defect.' },
  samples: [
    sample('4 mm torch-on membrane roll (10 m × 1 m stated)', 38000, 'roll', 'established_ecommerce', 'Tests roll→m² product-spec conversion.'),
    sample('Cementitious slurry 25 kg bag (coverage 8 m² at 2 coats stated)', 42000, 'kg', 'supplier_price_list', 'Tests coverage-based normalisation gating.'),
  ],
};

export const DOORS: ProductFamily = {
  key: 'doors',
  name: 'Doors',
  // Spot-check additions 2026-07-28: "Turkey door" variant, entrance/exit-door phrasing; sellers mislabel mm as m ("900m by 2100m")
  marketNames: ['door', 'security door', 'turkish door', 'flush door', 'panel door', 'armored door', 'armoured door', 'turkey door', 'turkey security door', 'entrance door', 'front door', 'exit door'],
  parentCategory: 'envelope',
  kind: 'product',
  applicableConditions: ['new'],
  funnelRole: 'paid_research',
  subProducts: [
    { key: 'steel-security', label: 'Steel security doors', aliases: ['turkish security door', 'armoured door'] },
    { key: 'hdf-flush', label: 'HDF/flush internal doors' },
    { key: 'solid-wood', label: 'Solid wood panel doors' },
    { key: 'glass', label: 'Glass/aluminium doors' },
    { key: 'pvc-bathroom', label: 'PVC bathroom doors' },
  ],
  attributes: [
    { key: 'material', label: 'Material', priceChanging: true, values: ['steel', 'hdf', 'solid_wood', 'glass_aluminium', 'pvc'] },
    { key: 'size', label: 'Size (W×H)', priceChanging: true, values: ['900x2100', '1200x2100', 'double_1500x2100', 'custom'] },
    { key: 'use_position', label: 'Internal or external', priceChanging: true, values: ['internal', 'external'] },
    { key: 'frame_included', label: 'Frame included', priceChanging: true },
    { key: 'lockset_included', label: 'Lockset included', priceChanging: true },
    { key: 'origin', label: 'Local or imported', priceChanging: true, values: ['local', 'turkish', 'chinese', 'other_import'] },
  ],
  sellerUnits: ['piece', 'set'],
  normalizedUnit: 'piece',
  normalizedUnitRationale: 'Doors trade per unit; “set” (door + frame + lockset) must be flagged and compared only with sets.',
  questions: [
    q('use_position', 'Is this an entrance/external door or an internal room door?', 'single_select', 'always', { options: ['External/entrance', 'Internal room', 'Bathroom'], allowUnknown: false }),
    q('material', 'What material do you want?', 'single_select', 'always', { options: ['Steel security', 'HDF/flush', 'Solid wood', 'Glass/aluminium', 'PVC', 'Not sure'], allowUnknown: true }),
    q('size', 'What door size? (Standard single is 900 mm × 2100 mm.)', 'single_select', 'always', { options: ['Standard single (900×2100)', 'Wide single (1200×2100)', 'Double (1500×2100+)', 'Custom — I will give measurements'], allowUnknown: true }),
    q('frame_lockset', 'Do you need it complete with frame and lockset?', 'yes_no', 'always', { whyItMatters: 'A “door” price may exclude the frame and lock, which add a lot.', allowUnknown: false }),
    q('installation_needed', 'Should we include installation?', 'yes_no', 'optional'),
    ...COMMON_QUESTIONS,
  ],
  matching: {
    exactMatchKeys: ['material', 'size', 'use_position', 'frame_included', 'lockset_included', 'origin'],
    closeMatchKeys: ['material', 'size', 'use_position'],
    neverComparableAcross: ['material'],
  },
  inclusionChecks: ALL_INCLUSION_CHECKS,
  riskFlags: EQUIPMENT_RISK_FLAGS,
  reviewers: { primary: 'architect_interior', secondary: 'quantity_surveyor', reason: 'Door specification and finish grading are architectural.' },
  samples: [
    sample('Turkish steel security door 900×2100, frame + lockset included', 385000, 'set', 'established_ecommerce', 'Tests set vs bare-door separation.'),
    sample('HDF flush door 900×2100, door leaf only', 48000, 'piece', 'classified_listing', 'Tests frame_included=false comparison gating.'),
  ],
};

export const ALUMINIUM_WINDOWS: ProductFamily = {
  key: 'aluminium-windows',
  name: 'Aluminium windows & glass systems',
  // Spot-check additions 2026-07-28: "Ghana window", projected/swing/frameless styles, net-position language ("with net", "sliding net")
  marketNames: ['aluminium window', 'sliding window', 'casement window', 'window', 'aluminum window', 'glass window', 'ghana window', 'ghana sliding window', 'projected window', 'swing window', 'frameless window', 'window with net'],
  parentCategory: 'envelope',
  kind: 'system',
  applicableConditions: ['new'],
  funnelRole: 'paid_research',
  subProducts: [
    { key: 'casement', label: 'Casement windows' },
    { key: 'sliding', label: 'Sliding windows' },
    { key: 'fixed-glazing', label: 'Fixed glazing/curtain panels' },
    { key: 'net-burglary', label: 'Mosquito net & burglary bars add-ons' },
  ],
  attributes: [
    { key: 'window_type', label: 'Window type', priceChanging: true, values: ['casement', 'sliding', 'fixed'] },
    { key: 'profile_gauge', label: 'Aluminium profile/gauge', priceChanging: true, values: ['1.2mm', '1.5mm', '2.0mm'] },
    { key: 'glass_type', label: 'Glass type', priceChanging: true, values: ['clear_5mm', 'tinted_5mm', 'reflective', 'double_glazed'] },
    { key: 'size', label: 'Size (W×H)', priceChanging: true },
    { key: 'net_included', label: 'Mosquito net included', priceChanging: true },
    { key: 'burglary_included', label: 'Burglary protection included', priceChanging: true },
  ],
  sellerUnits: ['sqm', 'piece', 'set'],
  normalizedUnit: 'sqm',
  normalizedUnitRationale:
    'Fabricators price per m² of fabricated window; fixed-size “piece” quotes convert via stated dimensions only.',
  questions: [
    q('window_type', 'Casement or sliding windows?', 'single_select', 'always', { options: ['Casement', 'Sliding', 'Fixed glazing', 'Not sure'], whyItMatters: 'Casement windows use more profile and glass, so they cost more per m².', allowUnknown: true }),
    q('glass_type', 'What glass do you want?', 'single_select', 'always', { options: ['Clear 5mm', 'Tinted 5mm', 'Reflective', 'Double glazed', 'Not sure'], allowUnknown: true }),
    q('sizes', 'List your window sizes (e.g. 1200×1200 × 4 windows). A photo of your window schedule also works.', 'free_text', 'always', { allowUnknown: true }),
    q('net_burglary', 'Include mosquito nets and burglary bars?', 'multi_select', 'optional', { options: ['Mosquito net', 'Burglary bars', 'Neither'] }),
    q('installation_needed', 'Include fabrication + installation?', 'yes_no', 'always', { allowUnknown: false }),
    ...COMMON_QUESTIONS,
  ],
  matching: {
    exactMatchKeys: ['window_type', 'profile_gauge', 'glass_type', 'net_included', 'burglary_included'],
    closeMatchKeys: ['window_type', 'glass_type'],
    neverComparableAcross: ['window_type'],
  },
  inclusionChecks: ALL_INCLUSION_CHECKS,
  riskFlags: [...EQUIPMENT_RISK_FLAGS],
  reviewers: { primary: 'architect_interior', secondary: 'quantity_surveyor', reason: 'Window schedules, profiles and glazing specs are architectural.' },
  samples: [
    sample('Sliding window, 1.2 mm profile, clear 5 mm glass, per m² fabricated', 65000, 'sqm', 'supplier_quotation', 'Tests per-m² fabrication pricing.'),
    sample('Casement 1200×1200 with net, per window', 145000, 'piece', 'merchant_confirmed', 'Tests piece→m² dimension conversion.'),
  ],
};

export const ENVELOPE_FAMILIES: readonly ProductFamily[] = [ROOFING, WATERPROOFING, DOORS, ALUMINIUM_WINDOWS];
