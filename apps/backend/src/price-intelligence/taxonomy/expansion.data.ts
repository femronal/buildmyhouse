/**
 * Level 2 expansion backlog — families that must FIT the taxonomy but do not
 * receive full launch matrices in Stage 2.
 * Doc: docs/price-checker/LEVEL2_EXPANSION_BACKLOG.md
 */
import { ExpansionFamily } from './types';

export const EXPANSION_FAMILIES: readonly ExpansionFamily[] = [
  { key: 'air-conditioners', name: 'Air conditioners', whyValuable: 'High-ticket, brand/BTU spec-dense, installation-sensitive; strong repairs overlap.', paidReportPotential: 'high', likelyReviewer: 'building_services', likelySourceAvailability: 'good', proposedPriority: 1 },
  { key: 'water-heaters', name: 'Water heaters', whyValuable: 'Common renovation item; capacity/brand specs; installation bundling.', paidReportPotential: 'medium', likelyReviewer: 'building_services', likelySourceAvailability: 'good', proposedPriority: 1 },
  { key: 'borehole-equipment', name: 'Borehole equipment', whyValuable: 'Opaque, high-variance pricing; pairs with borehole-drilling service; diaspora-relevant.', paidReportPotential: 'high', likelyReviewer: 'building_services', likelySourceAvailability: 'moderate', proposedPriority: 1 },
  { key: 'water-treatment', name: 'Water-treatment equipment', whyValuable: 'Filter/RO systems with murky spec-price relationships.', paidReportPotential: 'medium', likelyReviewer: 'building_services', likelySourceAvailability: 'moderate', proposedPriority: 2 },
  { key: 'automatic-transfer-switches', name: 'Automatic transfer switches', whyValuable: 'Pairs with generators/inverters; safety-critical sizing.', paidReportPotential: 'medium', likelyReviewer: 'electrical_engineer', likelySourceAvailability: 'moderate', proposedPriority: 2 },
  { key: 'electric-fencing', name: 'Electric fencing', whyValuable: 'Security spend, per-metre pricing, installation-dominant.', paidReportPotential: 'medium', likelyReviewer: 'security_low_voltage', likelySourceAvailability: 'moderate', proposedPriority: 2 },
  { key: 'access-control', name: 'Access-control systems', whyValuable: 'Estate/commercial demand; bundle-prone quotes.', paidReportPotential: 'medium', likelyReviewer: 'security_low_voltage', likelySourceAvailability: 'moderate', proposedPriority: 2 },
  { key: 'smart-locks', name: 'Smart locks', whyValuable: 'Growing consumer item; brand-authenticity risk.', paidReportPotential: 'low', likelyReviewer: 'security_low_voltage', likelySourceAvailability: 'good', proposedPriority: 3 },
  { key: 'lighting-systems', name: 'Lighting systems', whyValuable: 'High SEO volume; low unit value but bulk purchases add up.', paidReportPotential: 'low', likelyReviewer: 'electrical_engineer', likelySourceAvailability: 'good', proposedPriority: 2 },
  { key: 'wardrobe-systems', name: 'Wardrobe systems', whyValuable: 'Interior big-ticket; same fabricator economics as kitchens.', paidReportPotential: 'high', likelyReviewer: 'architect_interior', likelySourceAvailability: 'moderate', proposedPriority: 1 },
  { key: 'stone-finishes', name: 'Marble, granite slab & quartz finishes', whyValuable: 'Premium finish; huge price spread by origin/grade.', paidReportPotential: 'high', likelyReviewer: 'architect_interior', likelySourceAvailability: 'moderate', proposedPriority: 1 },
  { key: 'glass-balustrades', name: 'Glass balustrades & shower enclosures', whyValuable: 'Fabrication pricing per m²; quote-inflation prone.', paidReportPotential: 'medium', likelyReviewer: 'architect_interior', likelySourceAvailability: 'moderate', proposedPriority: 2 },
  { key: 'steel-trusses-timber', name: 'Steel trusses & roofing timber', whyValuable: 'Roof structure cost driver; pairs with roofing family.', paidReportPotential: 'medium', likelyReviewer: 'structural_engineer', likelySourceAvailability: 'moderate', proposedPriority: 2 },
  { key: 'drainage-channels', name: 'Drainage channels & covers', whyValuable: 'Compound works; pairs with drainage-construction service.', paidReportPotential: 'low', likelyReviewer: 'structural_engineer', likelySourceAvailability: 'moderate', proposedPriority: 3 },
  { key: 'kerbs', name: 'Kerbs', whyValuable: 'Complements paving family.', paidReportPotential: 'low', likelyReviewer: 'quantity_surveyor', likelySourceAvailability: 'moderate', proposedPriority: 3 },
  { key: 'building-chemicals', name: 'Building chemicals', whyValuable: 'Admixtures/curing compounds; professional buyers.', paidReportPotential: 'medium', likelyReviewer: 'structural_engineer', likelySourceAvailability: 'moderate', proposedPriority: 2 },
  { key: 'sealants-adhesives', name: 'Sealants & adhesives', whyValuable: 'High SEO, low ticket; supports other families.', paidReportPotential: 'low', likelyReviewer: 'architect_interior', likelySourceAvailability: 'good', proposedPriority: 3 },
  { key: 'scaffolding-hire', name: 'Scaffolding & equipment hire', whyValuable: 'Rental pricing model (per day/week); contractor demand.', paidReportPotential: 'medium', likelyReviewer: 'quantity_surveyor', likelySourceAvailability: 'poor', proposedPriority: 2 },
  { key: 'fencing-gates', name: 'Fencing & gate systems', whyValuable: 'Every compound needs one; fabrication + installation heavy.', paidReportPotential: 'high', likelyReviewer: 'architect_interior', likelySourceAvailability: 'moderate', proposedPriority: 1 },
  { key: 'landscaping', name: 'Landscaping inputs', whyValuable: 'Grass/plants/irrigation; premium estates.', paidReportPotential: 'low', likelyReviewer: 'architect_interior', likelySourceAvailability: 'poor', proposedPriority: 3 },
  { key: 'fire-safety', name: 'Fire-safety equipment', whyValuable: 'Regulatory demand (extinguishers, alarms, hydrants) for commercial buyers.', paidReportPotential: 'medium', likelyReviewer: 'security_low_voltage', likelySourceAvailability: 'good', proposedPriority: 2 },
  { key: 'commercial-pumps', name: 'Commercial pumps & controls', whyValuable: 'Estates/hotels/schools; engineering-spec purchases.', paidReportPotential: 'medium', likelyReviewer: 'building_services', likelySourceAvailability: 'moderate', proposedPriority: 3 },
  { key: 'fuel-station-equipment', name: 'Fuel-station equipment', whyValuable: 'Future commercial vertical (dispensers, tanks); very high ticket.', paidReportPotential: 'medium', likelyReviewer: 'building_services', likelySourceAvailability: 'poor', proposedPriority: 3 },
] as const;
