/**
 * Level 1 families — finishes (tiles, paint, POP/ceilings, external paving,
 * kitchens, sanitary wares).
 * All sample observations are illustrative structure tests, never market data.
 */
import { ProductFamily } from '../types';
import { ALL_INCLUSION_CHECKS, COMMODITY_RISK_FLAGS, COMMON_QUESTIONS, EQUIPMENT_RISK_FLAGS, q, sample } from './common';

export const TILES: ProductFamily = {
  key: 'tiles',
  name: 'Tiles, adhesive & grout',
  // Spot-check additions 2026-07-28: "compound tiles" (outdoor), "super polish" finish language; carton coverage stated as "1.44sqm in a carton, 4pcs"
  marketNames: ['tiles', 'floor tiles', 'wall tiles', 'porcelain', 'ceramic tiles', 'spanish tiles', 'granite tiles', 'vitrified', 'compound tiles', 'super polish tiles'],
  parentCategory: 'finishes',
  kind: 'product',
  applicableConditions: ['new'],
  funnelRole: 'both',
  subProducts: [
    { key: 'ceramic-floor', label: 'Ceramic floor tiles' },
    { key: 'porcelain-floor', label: 'Porcelain/vitrified floor tiles' },
    { key: 'wall-tiles', label: 'Wall tiles' },
    { key: 'granite-tiles', label: 'Granite tiles' },
    { key: 'adhesive-grout', label: 'Tile adhesive & grout', aliases: ['tile gum', 'grout'] },
  ],
  attributes: [
    { key: 'tile_type', label: 'Tile type', priceChanging: true, values: ['ceramic', 'porcelain', 'granite'] },
    { key: 'application', label: 'Floor or wall', priceChanging: true, values: ['floor', 'wall'] },
    { key: 'size_cm', label: 'Dimensions', priceChanging: true, values: ['25x40', '30x30', '30x60', '40x40', '60x60', '120x60'] },
    { key: 'origin_brand', label: 'Origin/brand', priceChanging: true, values: ['nigerian', 'chinese', 'indian', 'spanish', 'italian'] },
    { key: 'grade', label: 'Grade', priceChanging: true, values: ['standard', 'premium'] },
    { key: 'sqm_per_carton', label: 'm² per carton', priceChanging: false },
  ],
  sellerUnits: ['carton', 'sqm'],
  normalizedUnit: 'sqm',
  normalizedUnitRationale:
    'Cartons cover different areas by tile size; comparison is only honest per m², converted with the exact product’s m²-per-carton. Original carton price is always preserved.',
  questions: [
    q('application', 'Floor tiles or wall tiles?', 'single_select', 'always', { options: ['Floor', 'Wall'], allowUnknown: false }),
    q('size_cm', 'What tile size?', 'single_select', 'always', { options: ['25×40', '30×30', '30×60', '40×40', '60×60', '120×60', 'Not sure'], allowUnknown: true }),
    q('tile_type', 'Ceramic, porcelain or granite?', 'single_select', 'always', { options: ['Ceramic', 'Porcelain/vitrified', 'Granite', 'Not sure'], whyItMatters: 'Porcelain costs more than ceramic at the same size; granite more again.', allowUnknown: true }),
    q('origin_brand', 'Any origin preference (Nigerian, Spanish, Indian, Chinese)?', 'single_select', 'optional', { options: ['Nigerian', 'Spanish', 'Indian', 'Chinese', 'No preference'] }),
    q('area_sqm', 'How many square metres are you tiling?', 'number', 'always', { whyItMatters: 'We add standard cutting wastage to estimate cartons.', allowUnknown: true }),
    ...COMMON_QUESTIONS,
  ],
  matching: {
    exactMatchKeys: ['tile_type', 'application', 'size_cm', 'origin_brand', 'grade'],
    closeMatchKeys: ['tile_type', 'application', 'size_cm'],
    neverComparableAcross: ['application', 'tile_type'],
  },
  inclusionChecks: ALL_INCLUSION_CHECKS,
  riskFlags: [...COMMODITY_RISK_FLAGS, 'smaller_spec'],
  reviewers: { primary: 'architect_interior', secondary: 'quantity_surveyor', reason: 'Tile grading/wastage norms are finishing domain; carton coverage arithmetic is QS.' },
  samples: [
    sample('60×60 porcelain, Nigerian brand, carton of 4 pcs (1.44 m² stated)', 18000, 'carton', 'established_ecommerce', 'Tests carton→m² conversion with product-spec factor.'),
    sample('30×60 ceramic wall tile, per m², Orile market', 7800, 'sqm', 'merchant_confirmed', 'Tests direct per-m² observation.'),
  ],
};

export const PAINT: ProductFamily = {
  key: 'paint',
  name: 'Paint systems',
  // Spot-check additions 2026-07-28: finish-first naming (matt/silk/satin emulsion), "drum" = 20L container, hybrid emulsion lines (Berger Clinstay)
  marketNames: ['paint', 'emulsion', 'satin', 'gloss', 'texcote', 'screeding', 'pop paint', 'dulux', 'matt emulsion', 'silk paint', 'satin emulsion', 'hybrid emulsion', 'drum of paint'],
  parentCategory: 'finishes',
  kind: 'system',
  applicableConditions: ['new'],
  funnelRole: 'both',
  subProducts: [
    { key: 'emulsion', label: 'Emulsion (matt) wall paint' },
    { key: 'satin-silk', label: 'Satin/silk washable paint' },
    { key: 'gloss', label: 'Oil/gloss paint' },
    { key: 'texture', label: 'Textured coating', aliases: ['texcote'] },
    { key: 'screeding', label: 'Screeding/filler', aliases: ['pop screeding'] },
    { key: 'primer-sealer', label: 'Primer/sealer' },
  ],
  attributes: [
    { key: 'paint_type', label: 'Paint type', priceChanging: true, values: ['emulsion', 'satin', 'gloss', 'texture', 'screeding', 'primer'] },
    { key: 'brand_tier', label: 'Brand tier', priceChanging: true, values: ['premium (Dulux/Berger)', 'mid (Meyer/Finecoat)', 'economy'] },
    { key: 'pack_size', label: 'Pack size', priceChanging: true, values: ['20L bucket', '4L gallon'] },
  ],
  sellerUnits: ['bucket_20l', 'gallon_4l', 'litre'],
  normalizedUnit: 'litre',
  normalizedUnitRationale: 'Bucket and gallon prices normalise deterministically to per litre (fixed pack sizes in canonical units).',
  questions: [
    q('paint_type', 'What type of paint?', 'single_select', 'always', { options: ['Emulsion (matt)', 'Satin/silk (washable)', 'Gloss', 'Textured (Texcote type)', 'Screeding', 'Primer'], allowUnknown: true }),
    q('brand_tier', 'Premium brand or budget?', 'single_select', 'always', { options: ['Premium (Dulux, Berger)', 'Mid-range (Meyer, Finecoat)', 'Economy', 'Not sure'], allowUnknown: true }),
    q('surface_area', 'Roughly what area are you painting (m²) or how many rooms?', 'free_text', 'optional', { whyItMatters: 'Helps estimate buckets needed, including two coats.' }),
    ...COMMON_QUESTIONS,
  ],
  matching: {
    exactMatchKeys: ['paint_type', 'brand_tier', 'pack_size'],
    closeMatchKeys: ['paint_type', 'brand_tier'],
    neverComparableAcross: ['paint_type'],
  },
  inclusionChecks: ALL_INCLUSION_CHECKS,
  riskFlags: COMMODITY_RISK_FLAGS,
  reviewers: { primary: 'architect_interior', secondary: 'quantity_surveyor', reason: 'Coating systems and coverage norms are finishing domain.' },
  samples: [
    sample('Premium emulsion, 20 L bucket, Lagos', 42000, 'bucket_20l', 'established_ecommerce', 'Tests bucket→litre fixed conversion.'),
    sample('Textured coating, 4 L gallon, mid brand', 9500, 'gallon_4l', 'merchant_confirmed', 'Tests pack-size separation.'),
  ],
};

export const POP_CEILINGS: ProductFamily = {
  key: 'pop-ceilings',
  name: 'POP, gypsum & ceiling systems',
  // Spot-check additions 2026-07-28: "pop cement"/"gypsum pop cement" is the dominant material name; "plaster board"; product vs installation-service ads mix in searches
  marketNames: ['pop', 'pop ceiling', 'gypsum board', 'gypsum ceiling', 'suspended ceiling', 'pvc ceiling', 'ceiling', 'pop cement', 'gypsum pop cement', 'white pop cement', 'plaster board', 'ceiling pop'],
  parentCategory: 'finishes',
  kind: 'system',
  applicableConditions: ['new'],
  funnelRole: 'both',
  subProducts: [
    { key: 'gypsum-board', label: 'Gypsum boards' },
    { key: 'pop-cement', label: 'POP cement (plaster of Paris)' },
    { key: 'suspended-grid', label: 'Suspended ceiling tiles & grid' },
    { key: 'pvc-panels', label: 'PVC ceiling panels' },
    { key: 'accessories', label: 'Channels, screws, mesh, cornice' },
  ],
  attributes: [
    { key: 'system_type', label: 'System', priceChanging: true, values: ['gypsum_board', 'pop_wet', 'suspended', 'pvc'] },
    { key: 'board_size', label: 'Board/panel size', priceChanging: true, values: ['1200x1200', '1220x2440', '600x600'] },
    { key: 'thickness_mm', label: 'Thickness', priceChanging: true, values: ['9', '12'] },
    { key: 'brand', label: 'Brand', priceChanging: true },
  ],
  sellerUnits: ['piece', 'bag_40kg', 'sqm', 'bundle'],
  normalizedUnit: 'sqm',
  normalizedUnitRationale: 'Ceiling budgets are per m² of ceiling; board→m² converts via stated board dimensions.',
  questions: [
    q('system_type', 'Which ceiling system?', 'single_select', 'always', { options: ['Gypsum board', 'Wet POP', 'Suspended ceiling', 'PVC panels', 'Not sure'], allowUnknown: true }),
    q('area_sqm', 'How many square metres of ceiling?', 'number', 'always', { allowUnknown: true }),
    q('design_complexity', 'Simple flat ceiling or a design (bulkheads, curves, lighting troughs)?', 'single_select', 'optional', { options: ['Simple flat', 'Some design', 'Full designer ceiling'], whyItMatters: 'Designed ceilings consume more material and labour per m².' }),
    q('installation_needed', 'Include installation labour?', 'yes_no', 'optional'),
    ...COMMON_QUESTIONS,
  ],
  matching: {
    exactMatchKeys: ['system_type', 'board_size', 'thickness_mm', 'brand'],
    closeMatchKeys: ['system_type', 'thickness_mm'],
    neverComparableAcross: ['system_type'],
  },
  inclusionChecks: ALL_INCLUSION_CHECKS,
  riskFlags: [...COMMODITY_RISK_FLAGS, 'incomplete_bundle'],
  reviewers: { primary: 'architect_interior', secondary: 'quantity_surveyor', reason: 'Ceiling systems and design complexity are finishing domain.' },
  samples: [
    sample('Gypsum board 1220×2440×12 mm, per board', 12500, 'piece', 'established_ecommerce', 'Tests board→m² conversion via dimensions.'),
    sample('POP cement 40 kg bag', 9800, 'bag_40kg', 'merchant_confirmed', 'Tests wet-POP material unit.'),
  ],
};

export const EXTERNAL_PAVING: ProductFamily = {
  key: 'external-paving',
  name: 'German flooring, interlocking stones & external paving',
  // Spot-check additions 2026-07-28: "interlock stone", per-piece + design names ("T design"); most ads are production+installation services
  marketNames: ['german floor', 'german flooring', 'interlocking', 'interlocking stones', 'paving stone', 'kerb', 'compound flooring', 'interlock stone', 'interlock', 'pavers'],
  parentCategory: 'finishes',
  kind: 'system',
  applicableConditions: ['new'],
  funnelRole: 'both',
  subProducts: [
    { key: 'interlocking-paver', label: 'Interlocking paving stones', aliases: ['60mm paver', '80mm paver'] },
    { key: 'german-concrete', label: 'Cast concrete “German” floor' },
    { key: 'kerbs', label: 'Kerbs and edge restraints' },
    { key: 'stamped-concrete', label: 'Stamped/increte concrete' },
  ],
  attributes: [
    { key: 'system_type', label: 'System', priceChanging: true, values: ['interlocking', 'german_cast', 'stamped'] },
    { key: 'paver_thickness_mm', label: 'Paver thickness', priceChanging: true, values: ['60', '80'] },
    { key: 'includes_material_labour', label: 'Material + laying bundled', priceChanging: true },
  ],
  sellerUnits: ['sqm', 'piece'],
  normalizedUnit: 'sqm',
  normalizedUnitRationale: 'Compound paving is universally negotiated per m²; “with laying” vs “material only” must be separated.',
  questions: [
    q('system_type', 'Interlocking stones or cast concrete (German) floor?', 'single_select', 'always', { options: ['Interlocking stones', 'Cast concrete/German floor', 'Stamped concrete', 'Not sure'], allowUnknown: true }),
    q('paver_thickness_mm', 'What paver thickness — 60 mm (foot traffic) or 80 mm (vehicles)?', 'single_select', 'conditional', {
      options: ['60mm', '80mm', 'Not sure'],
      dependsOn: { questionId: 'system_type', valueIn: ['Interlocking stones'] },
      whyItMatters: '80 mm pavers carry vehicles and cost more.',
    }),
    q('area_sqm', 'How many square metres of compound?', 'number', 'always', { allowUnknown: true }),
    q('with_laying', 'Do you want material only, or material + laying?', 'single_select', 'always', { options: ['Material only', 'Material + laying'], allowUnknown: false }),
    ...COMMON_QUESTIONS,
  ],
  matching: {
    exactMatchKeys: ['system_type', 'paver_thickness_mm', 'includes_material_labour'],
    closeMatchKeys: ['system_type', 'paver_thickness_mm'],
    neverComparableAcross: ['system_type', 'includes_material_labour'],
  },
  inclusionChecks: ALL_INCLUSION_CHECKS,
  riskFlags: [...COMMODITY_RISK_FLAGS, 'incomplete_bundle'],
  reviewers: { primary: 'quantity_surveyor', secondary: 'structural_engineer', reason: 'Material-vs-labour separation and m² rate build-ups are QS core.' },
  samples: [
    sample('80 mm interlocking paver, material + laying, per m², Lagos', 11000, 'sqm', 'supplier_quotation', 'Tests bundled labour separation flag.'),
    sample('60 mm paver, material only, per m², Ogun factory', 6500, 'sqm', 'merchant_confirmed', 'Tests thickness + bundle matching.'),
  ],
};

export const KITCHEN_CABINETS: ProductFamily = {
  key: 'kitchen-cabinets',
  name: 'Kitchen cabinets & worktops',
  // Spot-check additions 2026-07-28: HDF is the defining material term; ready-made/portable (ft-sized) vs custom-fabrication ads; marble-top phrasing
  marketNames: ['kitchen cabinet', 'kitchen', 'cabinet', 'wardrobe kitchen', 'worktop', 'countertop', 'granite top', 'hdf kitchen cabinet', 'hdf cabinet', 'ready-made kitchen cabinet', 'portable kitchen cabinet', 'marble top kitchen cabinet'],
  parentCategory: 'finishes',
  kind: 'system',
  applicableConditions: ['new'],
  funnelRole: 'paid_research',
  subProducts: [
    { key: 'base-wall-units', label: 'Base & wall cabinet units' },
    { key: 'worktop', label: 'Worktops (granite/quartz/marble/laminate)' },
    { key: 'island', label: 'Kitchen islands' },
    { key: 'hardware', label: 'Hinges, rails, handles (hardware grade)' },
  ],
  attributes: [
    { key: 'carcass_material', label: 'Carcass material', priceChanging: true, values: ['marine_board', 'hdf', 'particle_board'] },
    { key: 'door_finish', label: 'Door finish', priceChanging: true, values: ['hdf_spray', 'laminate', 'pvc_wrap', 'glass'] },
    { key: 'worktop_material', label: 'Worktop material', priceChanging: true, values: ['granite', 'quartz', 'marble', 'laminate'] },
    { key: 'hardware_grade', label: 'Hardware grade', priceChanging: true, values: ['standard', 'soft_close_premium'] },
    { key: 'pricing_basis', label: 'Per linear metre or complete kitchen', priceChanging: true, values: ['linear_metre', 'complete_kitchen'] },
    { key: 'appliances_included', label: 'Appliances included', priceChanging: true },
  ],
  sellerUnits: ['linear_metre', 'job', 'sqm'],
  normalizedUnit: 'linear_metre',
  normalizedUnitRationale:
    'Fabricators quote per running metre of cabinetry; “complete kitchen” lump sums compare only when the metreage and inclusions are stated.',
  questions: [
    q('kitchen_size', 'How long is the cabinet run (linear metres), or share your kitchen dimensions/photo?', 'free_text', 'always', { allowUnknown: true }),
    q('carcass_material', 'What carcass material?', 'single_select', 'always', { options: ['Marine board (moisture resistant)', 'HDF', 'Particle board', 'Not sure'], whyItMatters: 'Marine board resists Nigerian kitchen humidity and costs more.', allowUnknown: true }),
    q('worktop_material', 'What worktop?', 'single_select', 'always', { options: ['Granite', 'Quartz', 'Marble', 'Laminate', 'Not sure'], allowUnknown: true }),
    q('appliances_included', 'Should appliances (sink, hob, hood) be part of the quote?', 'yes_no', 'always', { allowUnknown: false }),
    q('installation_needed', 'Include fabrication + installation?', 'yes_no', 'always', { allowUnknown: false }),
    ...COMMON_QUESTIONS,
  ],
  matching: {
    exactMatchKeys: ['carcass_material', 'door_finish', 'worktop_material', 'hardware_grade', 'pricing_basis'],
    closeMatchKeys: ['carcass_material', 'worktop_material', 'pricing_basis'],
    neverComparableAcross: ['pricing_basis'],
  },
  inclusionChecks: ALL_INCLUSION_CHECKS,
  riskFlags: EQUIPMENT_RISK_FLAGS,
  reviewers: { primary: 'architect_interior', secondary: 'quantity_surveyor', reason: 'Kitchen specification and finish grading are interior domain; rate structures are QS.' },
  samples: [
    sample('Marine board carcass + HDF spray doors, per linear metre incl. installation', 185000, 'linear_metre', 'supplier_quotation', 'Tests linear-metre basis with installation included.'),
    sample('Complete 3.6 m L-kitchen with granite top, lump sum', 950000, 'job', 'classified_listing', 'Tests complete-kitchen bundle gating (needs metreage to compare).'),
  ],
};

export const SANITARY_WARES: ProductFamily = {
  key: 'sanitary-wares',
  name: 'Sanitary wares & bathroom fittings',
  // Spot-check additions 2026-07-28: "complete set" is the key inclusion phrase; Twyford used generically; "wash hand basin", 2-piece WC
  marketNames: ['wc', 'water closet', 'toilet', 'basin', 'shower', 'mixer', 'tap', 'sanitary ware', 'bathroom set', 'jacuzzi', 'wc set', 'water closet set', 'complete set wc', 'wash hand basin', '2 piece wc', 'twyford'],
  parentCategory: 'finishes',
  kind: 'accessory_set',
  applicableConditions: ['new'],
  funnelRole: 'both',
  subProducts: [
    { key: 'wc-close-coupled', label: 'Close-coupled WC sets' },
    { key: 'wc-wall-hung', label: 'Wall-hung WC + concealed cistern' },
    { key: 'basin', label: 'Wash-hand basins' },
    { key: 'taps-mixers', label: 'Taps & mixers' },
    { key: 'shower-sets', label: 'Showers & shower sets' },
    { key: 'bathtub', label: 'Bathtubs/jacuzzis' },
    { key: 'complete-set', label: 'Complete bathroom sets' },
  ],
  attributes: [
    { key: 'item_or_set', label: 'Single item or complete set', priceChanging: true, values: ['item', 'complete_set'] },
    { key: 'mounting', label: 'Mounting', priceChanging: true, values: ['floor', 'wall_hung', 'concealed'] },
    { key: 'brand_tier', label: 'Brand/origin tier', priceChanging: true, values: ['premium_european', 'mid (Twyford-type)', 'economy'] },
    { key: 'fittings_included', label: 'Fittings/accessories included', priceChanging: true },
  ],
  sellerUnits: ['piece', 'set'],
  normalizedUnit: 'piece',
  normalizedUnitRationale: 'Items trade per piece; complete sets are compared only with sets of stated composition.',
  questions: [
    q('item_or_set', 'One item (e.g. WC) or a complete bathroom set?', 'single_select', 'always', { options: ['Single item', 'Complete bathroom set'], allowUnknown: false }),
    q('which_item', 'Which item?', 'single_select', 'conditional', {
      options: ['WC (toilet)', 'Basin', 'Tap/mixer', 'Shower set', 'Bathtub'],
      dependsOn: { questionId: 'item_or_set', valueIn: ['Single item'] },
    }),
    q('mounting', 'Floor-mounted or wall-hung (concealed cistern)?', 'single_select', 'conditional', {
      options: ['Floor-mounted', 'Wall-hung/concealed', 'Not sure'],
      dependsOn: { questionId: 'which_item', valueIn: ['WC (toilet)'] },
      whyItMatters: 'Wall-hung WCs need a concealed cistern and cost significantly more with installation.',
    }),
    q('brand_tier', 'Premium European, mid-range or economy?', 'single_select', 'always', { options: ['Premium European', 'Mid-range (Twyford type)', 'Economy', 'Not sure'], allowUnknown: true }),
    q('installation_needed', 'Include plumbing installation?', 'yes_no', 'optional'),
    ...COMMON_QUESTIONS,
  ],
  matching: {
    exactMatchKeys: ['item_or_set', 'mounting', 'brand_tier', 'fittings_included'],
    closeMatchKeys: ['item_or_set', 'mounting'],
    neverComparableAcross: ['item_or_set'],
  },
  inclusionChecks: ALL_INCLUSION_CHECKS,
  riskFlags: EQUIPMENT_RISK_FLAGS,
  reviewers: { primary: 'building_services', secondary: 'architect_interior', reason: 'Sanitary connections are wet-services domain; finish tiering is interior.' },
  samples: [
    sample('Close-coupled WC set, mid brand, with seat + fittings', 95000, 'set', 'established_ecommerce', 'Tests set composition flag.'),
    sample('Basin mixer tap, premium brand, item only', 48000, 'piece', 'classified_listing', 'Tests item vs set separation.'),
  ],
};

export const FINISHES_FAMILIES: readonly ProductFamily[] = [
  TILES,
  PAINT,
  POP_CEILINGS,
  EXTERNAL_PAVING,
  KITCHEN_CABINETS,
  SANITARY_WARES,
];
