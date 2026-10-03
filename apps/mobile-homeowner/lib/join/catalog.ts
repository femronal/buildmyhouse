import { LAGOS_VENDOR_AREAS, VENDOR_CATEGORIES, VENDOR_CATEGORY_GROUPS } from '@buildmyhouse/shared-types';

export const SOMETHING_ELSE = 'something-else';

export type Card = { id: string; title: string; description: string };

export const WHAT_CARDS: Card[] = [
  { id: 'repairs', title: 'Repairs and trades', description: 'Plumber, electrician, tiler, painter and more.' },
  { id: 'cleaning', title: 'Cleaning and upkeep', description: 'Home, office and after-build cleaning, fumigation, laundry.' },
  { id: 'builders', title: 'Building team or contractor', description: 'You build, renovate or run a site crew.' },
  { id: 'professional', title: 'Professional', description: 'Architect, engineer, surveyor, lawyer and similar.' },
  { id: 'materials', title: 'Materials shop', description: 'You sell cement, tiles, pipes, paint and similar.' },
];

const BLURB: Record<string, string> = {
  plumber: 'Leaks, taps, pipes, drains.',
  electrician: 'Wiring, sockets, power faults.',
  roofer: 'Leaks, sheets, storm damage.',
  tiler: 'Floors, walls, repairs.',
  painter: 'Walls, ceilings, finishing.',
};

export const REPAIR_GROUPS: { heading: string; keys: string[] }[] = [
  { heading: 'Building and structure', keys: ['bricklayer-mason', 'carpenter-joiner', 'roofer', 'tiler', 'painter', 'pop-ceiling', 'flooring', 'waterproofing'] },
  { heading: 'Metal, glass and doors', keys: ['welder-metal-fabricator', 'aluminium-glass', 'locksmith-door'] },
  { heading: 'Water and drainage', keys: ['plumber', 'drainage', 'pump', 'borehole'] },
  { heading: 'Power and cooling', keys: ['electrician', 'generator', 'solar-inverter', 'ac-hvac'] },
  { heading: 'Security and appliances', keys: ['cctv-security', 'appliance-repair'] },
  { heading: 'Outdoors and pests', keys: ['interlocking-paving', 'gardener-grounds', 'pest-treatment'] },
];

export const TRADE_TITLES: Record<string, string> = {
  'bricklayer-mason': 'Bricklayer / Mason',
  plumber: 'Plumber',
  electrician: 'Electrician',
  'carpenter-joiner': 'Carpenter / Joiner',
  roofer: 'Roofer',
  tiler: 'Tiler',
  painter: 'Painter',
  'welder-metal-fabricator': 'Welder / Metal Fabricator',
  'aluminium-glass': 'Aluminium & Glass',
  'pop-ceiling': 'POP / Ceiling',
  waterproofing: 'Waterproofing',
  drainage: 'Drainage',
  pump: 'Pump technician',
  borehole: 'Borehole',
  'ac-hvac': 'AC / HVAC',
  generator: 'Generator',
  'solar-inverter': 'Solar / inverter',
  'cctv-security': 'CCTV / security',
  'locksmith-door': 'Locksmith / doors',
  flooring: 'Flooring',
  'interlocking-paving': 'Interlocking / paving',
  'gardener-grounds': 'Gardener / grounds',
  'pest-treatment': 'Pest treatment',
  'appliance-repair': 'Appliance repair',
  'cleaning-upkeep': 'Cleaning Service',
};

export function tradeCard(key: string): Card {
  return { id: key, title: TRADE_TITLES[key] || key, description: BLURB[key] || 'Tell us more on WhatsApp.' };
}

export const CLEANING_CARDS: Array<Card & { tradeKey: string; serviceLabel: string }> = [
  { id: 'home-cleaning', title: 'Home cleaning', description: 'Regular and deep cleaning for homes.', tradeKey: 'cleaning-upkeep', serviceLabel: 'Regular home cleaning, Deep cleaning' },
  { id: 'after-build', title: 'After-build cleaning', description: 'Dust and debris after building work.', tradeKey: 'cleaning-upkeep', serviceLabel: 'Post-construction cleaning' },
  { id: 'office', title: 'Office cleaning', description: 'Offices and shops.', tradeKey: 'cleaning-upkeep', serviceLabel: 'Office cleaning' },
  { id: 'fumigation', title: 'Fumigation and pest cleaning', description: 'Treating pests like cockroaches, ants and termites.', tradeKey: 'pest-treatment', serviceLabel: 'Fumigation' },
  { id: 'laundry', title: 'Laundry', description: 'Washing and ironing.', tradeKey: 'cleaning-upkeep', serviceLabel: 'Laundry and ironing' },
];

export const BUILDER_CARDS: Card[] = [
  { id: 'general_contractor', title: 'New builds', description: 'From foundation to roof.' },
  { id: 'renovator', title: 'Renovation', description: 'Rebuilding or changing existing buildings.' },
  { id: 'upgrader', title: 'Upgrades and finishing', description: 'Kitchens, bathrooms, floors, fit-out.' },
  { id: 'repairer', title: 'A repairs team', description: 'Many small repair jobs.' },
];

export const PROFESSION_GROUPS: { heading: string; keys: string[] }[] = [
  { heading: 'Design and planning', keys: ['architect', 'interior-designer', 'town-planner'] },
  { heading: 'Engineers', keys: ['structural-engineer', 'civil-engineer', 'electrical-engineer', 'mechanical-building-services-engineer', 'geotechnical-engineer'] },
  { heading: 'Surveying and costs', keys: ['quantity-surveyor', 'land-surveyor', 'estate-surveyor-valuer'] },
  { heading: 'Building and site', keys: ['registered-builder', 'project-manager', 'health-safety-professional', 'environmental-consultant', 'facilities-manager'] },
  { heading: 'Legal', keys: ['property-lawyer'] },
];

export const PROFESSIONS: Record<string, { title: string; regulatorShort?: string; regulatorFull?: string }> = {
  architect: { title: 'Architect', regulatorShort: 'ARCON', regulatorFull: 'Architects Registration Council of Nigeria' },
  'interior-designer': { title: 'Interior Designer' },
  'town-planner': { title: 'Town Planner', regulatorShort: 'TOPREC', regulatorFull: 'Town Planners Registration Council' },
  'structural-engineer': { title: 'Structural Engineer', regulatorShort: 'COREN', regulatorFull: 'Council for the Regulation of Engineering in Nigeria' },
  'civil-engineer': { title: 'Civil Engineer', regulatorShort: 'COREN', regulatorFull: 'Council for the Regulation of Engineering in Nigeria' },
  'electrical-engineer': { title: 'Electrical Engineer', regulatorShort: 'COREN', regulatorFull: 'Council for the Regulation of Engineering in Nigeria' },
  'mechanical-building-services-engineer': { title: 'Mechanical / Building Services Engineer', regulatorShort: 'COREN', regulatorFull: 'Council for the Regulation of Engineering in Nigeria' },
  'geotechnical-engineer': { title: 'Geotechnical Engineer', regulatorShort: 'COREN', regulatorFull: 'Council for the Regulation of Engineering in Nigeria' },
  'quantity-surveyor': { title: 'Quantity Surveyor', regulatorShort: 'QSRBN', regulatorFull: 'Quantity Surveyors Registration Board of Nigeria' },
  'land-surveyor': { title: 'Land Surveyor', regulatorShort: 'SURCON', regulatorFull: 'Surveyors Council of Nigeria' },
  'estate-surveyor-valuer': { title: 'Estate Surveyor & Valuer', regulatorShort: 'ESVARBON', regulatorFull: 'Estate Surveyors and Valuers Registration Board of Nigeria' },
  'registered-builder': { title: 'Registered Builder', regulatorShort: 'CORBON', regulatorFull: 'Council of Registered Builders of Nigeria' },
  'project-manager': { title: 'Project Manager' },
  'health-safety-professional': { title: 'Health & Safety Professional' },
  'environmental-consultant': { title: 'Environmental Consultant' },
  'facilities-manager': { title: 'Facilities Manager' },
  'property-lawyer': { title: 'Property Lawyer', regulatorShort: 'NBA', regulatorFull: 'Nigerian Bar Association (NBA)' },
};

export const STATE_CARDS: Card[] = [
  { id: 'lagos', title: 'Lagos', description: 'You are based in Lagos.' },
  { id: 'abuja', title: 'Abuja (FCT)', description: 'You are based in Abuja.' },
  { id: 'ogun', title: 'Ogun', description: 'You are based in Ogun.' },
  { id: 'rivers', title: 'Rivers', description: 'You are based in Rivers.' },
  { id: 'oyo', title: 'Oyo', description: 'You are based in Oyo.' },
];

export const LAGOS_AREA_CARDS: Card[] = [
  ...LAGOS_VENDOR_AREAS.map((area) => ({ id: area.key, title: area.label, description: 'You work here.' })),
  { id: 'anywhere-lagos', title: 'Anywhere in Lagos', description: 'You can work across Lagos.' },
];

export const MATERIAL_GROUPS: Card[] = VENDOR_CATEGORY_GROUPS.map((group) => ({
  id: group,
  title: group,
  description: 'A group of materials you sell.',
}));

export function materialCards(group: string): Card[] {
  return VENDOR_CATEGORIES.filter((item) => item.group === group).map((item) => ({
    id: item.slug,
    title: item.label,
    description: 'You sell this.',
  }));
}

export const ORIGINAL_REPAIR_KEYS = REPAIR_GROUPS.flatMap((group) => group.keys);
export const PROFESSION_KEYS = PROFESSION_GROUPS.flatMap((group) => group.keys);
