/**
 * Level 1 families — energy & security systems (solar, inverters, batteries,
 * generators, CCTV). These are the strongest ₦15,000 paid-report families:
 * high ticket, spec-dense, bundle-prone, counterfeit-prone.
 * All sample observations are illustrative structure tests, never market data.
 */
import { ProductFamily } from '../types';
import { ALL_INCLUSION_CHECKS, COMMON_QUESTIONS, EQUIPMENT_RISK_FLAGS, q, sample } from './common';

export const SOLAR_PANELS: ProductFamily = {
  key: 'solar-panels',
  name: 'Solar panels',
  // Spot-check additions 2026-07-28: half-cut/144-cell/bifacial descriptors ("front and back charger"), 550W the common size
  marketNames: ['solar panel', 'solar', 'mono panel', 'jinko', 'canadian solar', '400w panel', 'pv panel', 'half cut panel', 'halfcut', 'bifacial panel', '144 cells', '550w panel'],
  parentCategory: 'energy',
  kind: 'product',
  applicableConditions: ['new', 'used'],
  funnelRole: 'paid_research',
  subProducts: [
    { key: 'mono', label: 'Monocrystalline panels' },
    { key: 'poly', label: 'Polycrystalline panels' },
    { key: 'mounting', label: 'Mounting rails & accessories' },
  ],
  attributes: [
    { key: 'panel_type', label: 'Panel type', priceChanging: true, values: ['mono', 'poly', 'mono_half_cut'] },
    { key: 'wattage', label: 'Rated wattage', priceChanging: true, values: ['200', '300', '400', '450', '550', '600'] },
    { key: 'brand', label: 'Brand', priceChanging: true, values: ['Jinko', 'Canadian Solar', 'LONGi', 'JA Solar', 'Generic'] },
    { key: 'condition', label: 'New or used', priceChanging: true, values: ['new', 'used'] },
    { key: 'warranty_years', label: 'Warranty', priceChanging: true },
  ],
  sellerUnits: ['piece', 'watt'],
  normalizedUnit: 'watt',
  normalizedUnitRationale:
    'Price-per-watt is the honest comparator across different panel sizes; the conversion divides panel price by manufacturer-rated wattage (always known for the exact model). Per-panel price is preserved.',
  questions: [
    q('wattage', 'What panel wattage? (Or tell us the total kW you want and we’ll note panel count.)', 'single_select', 'always', { options: ['200W', '300W', '400W', '450W', '550W', '600W', 'Not sure'], allowUnknown: true }),
    q('panel_type', 'Mono or poly panels?', 'single_select', 'optional', { options: ['Mono', 'Poly', 'Not sure'], whyItMatters: 'Mono panels yield more per m² and dominate current supply.' }),
    q('brand', 'Brand preference?', 'brand_search', 'optional', { whyItMatters: 'Tier-1 brands carry real 25-year warranties; generic panels often do not.' }),
    q('condition', 'New or fairly used?', 'single_select', 'always', { options: ['New', 'Fairly used'], allowUnknown: false }),
    ...COMMON_QUESTIONS,
  ],
  matching: {
    exactMatchKeys: ['panel_type', 'wattage', 'brand', 'condition'],
    closeMatchKeys: ['panel_type', 'wattage', 'condition'],
    neverComparableAcross: ['condition'],
  },
  inclusionChecks: ALL_INCLUSION_CHECKS,
  riskFlags: EQUIPMENT_RISK_FLAGS,
  reviewers: { primary: 'electrical_engineer', reason: 'PV ratings, authenticity and system matching are electrical domain.' },
  samples: [
    sample('550 W mono half-cut, tier-1 brand, new, per panel', 185000, 'piece', 'established_ecommerce', 'Tests piece→watt manufacturer-spec conversion.'),
    sample('400 W mono, used (ex-UK), per panel', 65000, 'piece', 'classified_listing', 'Tests used-condition gating.'),
  ],
};

export const INVERTERS: ProductFamily = {
  key: 'inverters',
  name: 'Inverters',
  // Spot-check additions 2026-07-28: all-in-one systems, battery-independent, transformer-based descriptors; many ads are full bundles (inverter+battery+panels)
  marketNames: ['inverter', 'hybrid inverter', 'growatt', 'felicity', '5kva inverter', 'power inverter', 'all in one inverter', 'battery independent inverter', 'transformer based inverter'],
  parentCategory: 'energy',
  kind: 'product',
  applicableConditions: ['new', 'used'],
  funnelRole: 'paid_research',
  subProducts: [
    { key: 'hybrid', label: 'Hybrid (solar-ready) inverters' },
    { key: 'standalone', label: 'Standalone battery inverters' },
    { key: 'system-bundle', label: 'Complete inverter system bundles' },
  ],
  attributes: [
    { key: 'capacity_kva', label: 'Rated capacity (kVA)', priceChanging: true, values: ['1.5', '2.5', '3.5', '5', '7.5', '10'] },
    { key: 'inverter_type', label: 'Hybrid or standalone', priceChanging: true, values: ['hybrid', 'standalone'] },
    { key: 'waveform', label: 'Waveform', priceChanging: true, values: ['pure_sine', 'modified_sine'] },
    { key: 'battery_voltage', label: 'Battery voltage', priceChanging: true, values: ['12', '24', '48'] },
    { key: 'mppt_included', label: 'MPPT charge controller built in', priceChanging: true },
    { key: 'brand', label: 'Brand', priceChanging: true, values: ['Growatt', 'Felicity', 'Luminous', 'Prag', 'Other'] },
    { key: 'bundle_state', label: 'Unit only or system bundle', priceChanging: true, values: ['unit_only', 'with_batteries', 'full_system'] },
  ],
  sellerUnits: ['piece', 'set'],
  normalizedUnit: 'piece',
  normalizedUnitRationale:
    'Inverter-only prices compare per unit at matched kVA/voltage; bundles (with batteries/panels) are a separate bundle_state and never compare with bare units.',
  questions: [
    q('capacity_kva', 'What inverter capacity (kVA)? Tell us what you want to power if unsure.', 'single_select', 'always', { options: ['1.5', '2.5', '3.5', '5', '7.5', '10', 'Not sure'], allowUnknown: true }),
    q('inverter_type', 'Hybrid (works with solar) or standalone?', 'single_select', 'always', { options: ['Hybrid', 'Standalone', 'Not sure'], allowUnknown: true }),
    q('battery_voltage', 'System battery voltage (12/24/48V)?', 'single_select', 'optional', { options: ['12V', '24V', '48V', 'Not sure'], whyItMatters: '48V systems are standard above 3.5 kVA; voltage must match your batteries.' }),
    q('bundle_state', 'Inverter only, or complete system with batteries (and panels)?', 'single_select', 'always', { options: ['Inverter only', 'Inverter + batteries', 'Full solar system'], allowUnknown: false }),
    q('installation_needed', 'Include installation?', 'yes_no', 'optional'),
    ...COMMON_QUESTIONS,
  ],
  matching: {
    exactMatchKeys: ['capacity_kva', 'inverter_type', 'waveform', 'battery_voltage', 'brand', 'bundle_state'],
    closeMatchKeys: ['capacity_kva', 'inverter_type', 'bundle_state'],
    neverComparableAcross: ['bundle_state', 'capacity_kva'],
  },
  inclusionChecks: ALL_INCLUSION_CHECKS,
  riskFlags: EQUIPMENT_RISK_FLAGS,
  reviewers: { primary: 'electrical_engineer', reason: 'Capacity, waveform and battery matching are electrical-safety domain.' },
  samples: [
    sample('Growatt 5 kVA 48V hybrid, unit only, new', 850000, 'piece', 'established_ecommerce', 'Tests bundle_state=unit_only matching.'),
    sample('3.5 kVA + 2×220Ah tubular bundle, installed Lagos', 1450000, 'set', 'supplier_quotation', 'Tests bundle separation from bare units.'),
  ],
};

export const BATTERIES: ProductFamily = {
  key: 'batteries',
  name: 'Solar & inverter batteries',
  // Spot-check addition 2026-07-28: "tall tubular" is the standard form descriptor (Luminous Inverlast, Nexus, Glow Energy, Indian-made claims)
  marketNames: ['battery', 'tubular battery', 'lithium battery', 'inverter battery', '220ah battery', 'lifepo4', 'tall tubular battery'],
  parentCategory: 'energy',
  kind: 'product',
  applicableConditions: ['new', 'used'],
  funnelRole: 'paid_research',
  subProducts: [
    { key: 'lithium', label: 'Lithium (LiFePO4) batteries' },
    { key: 'tubular', label: 'Tubular (tall) lead-acid batteries' },
    { key: 'gel-agm', label: 'Gel/AGM sealed batteries' },
  ],
  attributes: [
    { key: 'chemistry', label: 'Battery chemistry', priceChanging: true, values: ['lithium_lifepo4', 'tubular_lead_acid', 'gel_agm'] },
    { key: 'voltage', label: 'Voltage', priceChanging: true, values: ['12', '24', '48/51.2'] },
    { key: 'capacity_ah', label: 'Capacity (Ah)', priceChanging: true, values: ['100', '150', '200', '220', '280'] },
    { key: 'brand', label: 'Brand', priceChanging: true },
    { key: 'condition', label: 'New or used', priceChanging: true, values: ['new', 'used'] },
    { key: 'warranty_months', label: 'Warranty', priceChanging: true },
    { key: 'bundle_state', label: 'Battery only or system bundle', priceChanging: true, values: ['battery_only', 'bundle'] },
  ],
  sellerUnits: ['piece', 'kwh'],
  normalizedUnit: 'piece',
  normalizedUnitRationale:
    'Chemistries are economically different products (lifespan, usable depth): comparison across chemistry is PROHIBITED, so per-piece at matched chemistry/voltage/Ah is the honest unit. kWh figures are stored when stated for lithium.',
  questions: [
    q('chemistry', 'Lithium or tubular battery?', 'single_select', 'always', { options: ['Lithium (LiFePO4)', 'Tubular (lead-acid)', 'Gel/AGM', 'Not sure'], whyItMatters: 'Lithium costs more upfront but lasts several times longer — they are not directly comparable.', allowUnknown: true }),
    q('voltage', 'What voltage?', 'single_select', 'always', { options: ['12V', '24V', '48V/51.2V', 'Not sure'], allowUnknown: true }),
    q('capacity_ah', 'What capacity (Ah)?', 'single_select', 'always', { options: ['100Ah', '150Ah', '200Ah', '220Ah', '280Ah', 'Not sure'], allowUnknown: true }),
    q('condition', 'New or used?', 'single_select', 'always', { options: ['New', 'Used'], allowUnknown: false }),
    ...COMMON_QUESTIONS,
  ],
  matching: {
    exactMatchKeys: ['chemistry', 'voltage', 'capacity_ah', 'brand', 'condition', 'bundle_state'],
    closeMatchKeys: ['chemistry', 'voltage', 'capacity_ah', 'condition'],
    neverComparableAcross: ['chemistry', 'voltage', 'condition', 'bundle_state'],
  },
  inclusionChecks: ALL_INCLUSION_CHECKS,
  riskFlags: EQUIPMENT_RISK_FLAGS,
  reviewers: { primary: 'electrical_engineer', reason: 'Chemistry suitability, cycle-life claims and voltage matching are electrical domain.' },
  samples: [
    sample('51.2V 100Ah LiFePO4 (5.12 kWh stated), new, 5-yr warranty', 1150000, 'piece', 'established_ecommerce', 'Tests lithium spec matching + kWh capture.'),
    sample('220Ah/12V tubular battery, new, per piece', 285000, 'piece', 'merchant_confirmed', 'Tests chemistry-gated comparison (must never pair with lithium).'),
  ],
};

export const GENERATORS: ProductFamily = {
  key: 'generators',
  name: 'Generators',
  // Spot-check additions 2026-07-28: soundproof/semi-silent/silent-canopy descriptors, key start, copper-coil claims; brands Perkins, Senci, Kipor
  marketNames: ['generator', 'gen', 'silent generator', 'diesel generator', 'firman', 'elepaq', 'belgium generator', '10kva gen', 'soundproof generator', 'semi silent generator', 'silent canopy', 'perkins', 'senci', 'kipor'],
  parentCategory: 'energy',
  kind: 'product',
  applicableConditions: ['new', 'used', 'refurbished'],
  funnelRole: 'paid_research',
  subProducts: [
    { key: 'petrol-small', label: 'Small petrol generators (≤10 kVA)' },
    { key: 'diesel-silent', label: 'Silent diesel generators' },
    { key: 'gas', label: 'Gas/dual-fuel generators' },
    { key: 'industrial', label: 'Industrial diesel sets (Mikano/Perkins class)' },
  ],
  attributes: [
    { key: 'rated_kva', label: 'Rated output (kVA)', priceChanging: true },
    { key: 'fuel', label: 'Fuel', priceChanging: true, values: ['petrol', 'diesel', 'gas', 'dual'] },
    { key: 'enclosure', label: 'Silent or open frame', priceChanging: true, values: ['silent', 'open'] },
    { key: 'brand', label: 'Brand', priceChanging: true, values: ['Firman/Sumec', 'Elepaq', 'Lutian', 'Perkins', 'Mikano', 'Other'] },
    { key: 'condition', label: 'Condition', priceChanging: true, values: ['new', 'used_belgium', 'refurbished'] },
    { key: 'changeover_included', label: 'Installation/changeover included', priceChanging: true },
  ],
  sellerUnits: ['piece'],
  normalizedUnit: 'piece',
  normalizedUnitRationale:
    'Generators trade per unit at matched kVA/fuel/enclosure; “Belgium” (imported used) units are a distinct condition class and never compare with new.',
  questions: [
    q('rated_kva', 'What generator size (kVA)? Tell us what you want to power if unsure.', 'free_text', 'always', { allowUnknown: true }),
    q('fuel', 'Petrol, diesel or gas?', 'single_select', 'always', { options: ['Petrol', 'Diesel', 'Gas/dual-fuel', 'Not sure'], allowUnknown: true }),
    q('enclosure', 'Silent (soundproof) or open frame?', 'single_select', 'always', { options: ['Silent', 'Open frame', 'Not sure'], allowUnknown: true }),
    q('condition', 'New, or fairly-used “Belgium”?', 'single_select', 'always', { options: ['New', 'Fairly-used (Belgium)', 'Refurbished'], allowUnknown: false }),
    q('changeover_needed', 'Include delivery + changeover installation?', 'yes_no', 'optional'),
    ...COMMON_QUESTIONS,
  ],
  matching: {
    exactMatchKeys: ['rated_kva', 'fuel', 'enclosure', 'brand', 'condition'],
    closeMatchKeys: ['rated_kva', 'fuel', 'enclosure', 'condition'],
    neverComparableAcross: ['fuel', 'condition'],
  },
  inclusionChecks: ALL_INCLUSION_CHECKS,
  riskFlags: EQUIPMENT_RISK_FLAGS,
  reviewers: { primary: 'electrical_engineer', secondary: 'building_services', reason: 'Load sizing and changeover wiring are electrical; fuel/mechanical service is services domain.' },
  samples: [
    sample('10 kVA silent diesel, new, mid brand, Lagos', 4800000, 'piece', 'established_ecommerce', 'Tests kVA+fuel+enclosure matching.'),
    sample('6.5 kVA petrol, fairly-used Belgium, Jiji', 480000, 'piece', 'classified_listing', 'Tests condition-class separation and Tier 3 caution.'),
  ],
};

export const CCTV_SECURITY: ProductFamily = {
  key: 'cctv-security',
  name: 'CCTV & security equipment',
  // Spot-check additions 2026-07-28: Turbo HD/AHD tech names, channel-count phrasing, "complete kit" composition (DVR+cameras+cable+power+storage)
  marketNames: ['cctv', 'camera', 'security camera', 'hikvision', 'dahua', '4 camera kit', 'nvr', 'dvr', 'turbo hd', 'ahd', 'camera kit', 'complete camera kit', 'cctv kit', 'channel dvr'],
  parentCategory: 'security',
  kind: 'system',
  applicableConditions: ['new'],
  funnelRole: 'paid_research',
  subProducts: [
    { key: 'analogue-kit', label: 'Analogue (HD-CVI/TVI) camera kits' },
    { key: 'ip-kit', label: 'IP/PoE camera kits' },
    { key: 'single-camera', label: 'Individual cameras' },
    { key: 'recorder-storage', label: 'DVR/NVR & storage' },
    { key: 'accessories', label: 'Cable, power supplies, monitors' },
  ],
  attributes: [
    { key: 'system_type', label: 'Analogue or IP', priceChanging: true, values: ['analogue', 'ip_poe'] },
    { key: 'camera_count', label: 'Number of cameras', priceChanging: true, values: ['4', '8', '16'] },
    { key: 'resolution_mp', label: 'Resolution', priceChanging: true, values: ['2MP', '4MP', '8MP'] },
    { key: 'brand', label: 'Brand', priceChanging: true, values: ['Hikvision', 'Dahua', 'CP Plus', 'Generic'] },
    { key: 'storage_tb', label: 'Storage (TB)', priceChanging: true, values: ['1', '2', '4'] },
    { key: 'bundle_state', label: 'Complete package or camera-only', priceChanging: true, values: ['complete_package', 'camera_only'] },
    { key: 'remote_viewing', label: 'Remote phone viewing configured', priceChanging: false },
  ],
  sellerUnits: ['set', 'piece'],
  normalizedUnit: 'set',
  normalizedUnitRationale:
    'Buyers shop complete kits (cameras + recorder + storage + power); kit composition gates comparison, camera-only prices stay per piece.',
  questions: [
    q('camera_count', 'How many cameras do you need?', 'single_select', 'always', { options: ['4', '8', '16', 'Not sure'], allowUnknown: true }),
    q('system_type', 'IP (network) or analogue system?', 'single_select', 'optional', { options: ['IP/PoE', 'Analogue', 'Not sure'], whyItMatters: 'IP systems cost more but scale and resolve better.' }),
    q('resolution_mp', 'What resolution?', 'single_select', 'optional', { options: ['2MP', '4MP', '8MP', 'Not sure'] }),
    q('bundle_state', 'Complete package (recorder + storage + cabling) or cameras only?', 'single_select', 'always', { options: ['Complete package', 'Cameras only'], allowUnknown: false }),
    q('installation_needed', 'Include professional installation?', 'yes_no', 'always', { allowUnknown: false }),
    ...COMMON_QUESTIONS,
  ],
  matching: {
    exactMatchKeys: ['system_type', 'camera_count', 'resolution_mp', 'brand', 'storage_tb', 'bundle_state'],
    closeMatchKeys: ['system_type', 'camera_count', 'resolution_mp', 'bundle_state'],
    neverComparableAcross: ['system_type', 'bundle_state'],
  },
  inclusionChecks: ALL_INCLUSION_CHECKS,
  riskFlags: EQUIPMENT_RISK_FLAGS,
  reviewers: { primary: 'security_low_voltage', secondary: 'electrical_engineer', reason: 'CCTV system design is low-voltage/security specialist domain.' },
  samples: [
    sample('Hikvision 4-camera 2MP analogue kit, DVR + 1TB, complete package', 385000, 'set', 'established_ecommerce', 'Tests kit-composition matching.'),
    sample('8MP IP dome camera, single unit', 95000, 'piece', 'supplier_price_list', 'Tests camera-only separation from kits.'),
  ],
};

export const ENERGY_SECURITY_FAMILIES: readonly ProductFamily[] = [
  SOLAR_PANELS,
  INVERTERS,
  BATTERIES,
  GENERATORS,
  CCTV_SECURITY,
];
