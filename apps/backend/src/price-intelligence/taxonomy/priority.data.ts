/**
 * Paid-report value model — commercial scoring of every deep-launch and
 * expansion family, 1 (low) to 5 (high) per dimension.
 * Doc: docs/price-checker/CATALOGUE_PRIORITY.md
 *
 * Scores are founder/analyst judgments recorded for prioritisation; they are
 * NOT market facts and should be revisited with real demand data after launch.
 */

export interface ValueScores {
  searchDemand: number;
  paidWillingness: number;
  purchaseValue: number;
  specComplexity: number;
  quoteInflationRisk: number;
  sellerInconsistency: number;
  deliverySensitivity: number;
  installationSensitivity: number;
  onlineSources: number;
  offlineSuppliers: number;
  unitNormalisationEase: number;
  counterfeitRisk: number;
  repairsRelevance: number;
  renovationRelevance: number;
  constructionRelevance: number;
  diasporaRelevance: number;
  seoPotential: number;
  serviceConversion: number;
}

export interface FamilyPriority {
  key: string;
  level: 1 | 2;
  scores: ValueScores;
  funnel: 'free' | 'paid' | 'both';
  why: string;
}

const s = (
  searchDemand: number, paidWillingness: number, purchaseValue: number, specComplexity: number,
  quoteInflationRisk: number, sellerInconsistency: number, deliverySensitivity: number, installationSensitivity: number,
  onlineSources: number, offlineSuppliers: number, unitNormalisationEase: number, counterfeitRisk: number,
  repairsRelevance: number, renovationRelevance: number, constructionRelevance: number, diasporaRelevance: number,
  seoPotential: number, serviceConversion: number,
): ValueScores => ({
  searchDemand, paidWillingness, purchaseValue, specComplexity, quoteInflationRisk, sellerInconsistency,
  deliverySensitivity, installationSensitivity, onlineSources, offlineSuppliers, unitNormalisationEase,
  counterfeitRisk, repairsRelevance, renovationRelevance, constructionRelevance, diasporaRelevance,
  seoPotential, serviceConversion,
});

export function totalScore(scores: ValueScores): number {
  return Object.values(scores).reduce((sum, v) => sum + v, 0);
}

export const FAMILY_PRIORITIES: readonly FamilyPriority[] = [
  // ------------------------------- Level 1 --------------------------------
  { key: 'cement', level: 1, funnel: 'free', why: 'Highest search volume in the niche; cheap to cache; nobody pays ₦15k for one bag price — pure SEO/free anchor.', scores: s(5, 1, 2, 1, 2, 3, 4, 1, 4, 5, 5, 2, 2, 3, 5, 3, 5, 2) },
  { key: 'reinforcement-steel', level: 1, funnel: 'both', why: 'High search + tonne-level purchases reach millions; diameter/tonne confusion makes quotes inflatable.', scores: s(4, 3, 4, 3, 4, 4, 4, 1, 3, 5, 3, 3, 1, 2, 5, 4, 4, 2) },
  { key: 'concrete-blocks', level: 1, funnel: 'free', why: 'Everyday construction query; low unit value; strong SEO.', scores: s(4, 1, 2, 2, 2, 3, 4, 1, 2, 5, 5, 1, 1, 2, 5, 3, 4, 2) },
  { key: 'sand', level: 1, funnel: 'free', why: 'Tipper-load opacity annoys buyers but ticket is modest; free traffic + trust builder.', scores: s(4, 2, 2, 2, 4, 5, 5, 1, 2, 5, 2, 1, 2, 3, 5, 3, 4, 2) },
  { key: 'granite-aggregates', level: 1, funnel: 'free', why: 'Same economics as sand.', scores: s(3, 2, 3, 2, 4, 5, 5, 1, 2, 5, 2, 1, 1, 2, 5, 3, 4, 2) },
  { key: 'roofing', level: 1, funnel: 'both', why: 'Multi-million purchases, thickness/profile games, accessory-hiding — classic paid report; also high SEO.', scores: s(4, 4, 5, 4, 5, 4, 4, 4, 3, 4, 2, 3, 3, 3, 5, 5, 5, 4) },
  { key: 'tiles', level: 1, funnel: 'both', why: 'Carton/m² confusion + origin tiers; strong SEO and mid-strength paid pull for whole-house tiling.', scores: s(5, 3, 4, 3, 4, 4, 4, 3, 4, 5, 3, 2, 3, 5, 4, 4, 5, 4) },
  { key: 'paint', level: 1, funnel: 'both', why: 'High SEO; bucket-size and brand-tier tricks; repaints are core repairs revenue.', scores: s(4, 2, 3, 3, 4, 4, 3, 3, 4, 5, 4, 4, 4, 5, 4, 4, 5, 4) },
  { key: 'electrical-cables', level: 1, funnel: 'both', why: 'Counterfeit-heavy, safety-critical; whole-house wiring is a big spend and quote-inflation target.', scores: s(3, 3, 4, 4, 4, 4, 2, 2, 3, 5, 3, 5, 4, 4, 5, 4, 4, 4) },
  { key: 'electrical-protection', level: 1, funnel: 'paid', why: 'DB/breaker/changeover quotes confuse homeowners; genuine-vs-fake brand spreads are extreme.', scores: s(2, 3, 3, 4, 4, 4, 2, 3, 3, 4, 4, 5, 4, 4, 4, 3, 3, 4) },
  { key: 'plumbing-pipes', level: 1, funnel: 'both', why: 'Repairs-first overlap; modest tickets but constant demand.', scores: s(3, 2, 2, 3, 3, 3, 3, 2, 3, 5, 4, 3, 5, 4, 4, 3, 4, 4) },
  { key: 'water-pumps', level: 1, funnel: 'both', why: 'Counterfeit Pedrollo economy; frequent replacement item in repairs.', scores: s(3, 3, 3, 3, 3, 4, 2, 3, 4, 4, 5, 5, 5, 3, 4, 4, 4, 5) },
  { key: 'water-tanks', level: 1, funnel: 'free', why: 'Simple spec, well-listed online; free/SEO strength.', scores: s(3, 2, 3, 2, 2, 3, 4, 2, 4, 4, 5, 2, 3, 3, 4, 3, 4, 3) },
  { key: 'solar-panels', level: 1, funnel: 'paid', why: 'Diaspora favourite; per-watt clarity is a differentiator; pairs with inverter/battery reports.', scores: s(4, 5, 4, 4, 4, 4, 2, 4, 4, 3, 4, 4, 2, 4, 3, 5, 4, 5) },
  { key: 'inverters', level: 1, funnel: 'paid', why: 'kVA/bundle confusion; multi-million systems; strongest single paid-report anchor with batteries.', scores: s(4, 5, 5, 5, 5, 4, 2, 4, 4, 3, 3, 4, 3, 4, 3, 5, 4, 5) },
  { key: 'batteries', level: 1, funnel: 'paid', why: 'Chemistry confusion (lithium vs tubular) makes naive comparisons costly — exactly what the report solves.', scores: s(4, 5, 5, 5, 4, 4, 2, 3, 4, 3, 3, 4, 3, 4, 3, 5, 4, 5) },
  { key: 'generators', level: 1, funnel: 'paid', why: 'High ticket, used-“Belgium” market opacity, diaspora purchases for family houses.', scores: s(4, 4, 5, 4, 4, 5, 3, 3, 4, 4, 4, 4, 3, 3, 3, 5, 4, 4) },
  { key: 'doors', level: 1, funnel: 'paid', why: 'Turkish security doors are a classic diaspora/quote-inflation product.', scores: s(3, 4, 4, 4, 4, 4, 3, 4, 4, 4, 4, 3, 3, 5, 4, 5, 4, 4) },
  { key: 'aluminium-windows', level: 1, funnel: 'paid', why: 'Per-m² fabrication is opaque to homeowners; whole-house window packages are large.', scores: s(3, 4, 4, 5, 5, 4, 2, 5, 2, 4, 3, 2, 3, 5, 5, 5, 4, 4) },
  { key: 'sanitary-wares', level: 1, funnel: 'both', why: 'Set-vs-item bundle confusion; bathroom renovation is a BuildMyHouse wedge service.', scores: s(3, 3, 3, 4, 4, 4, 3, 4, 4, 4, 4, 3, 4, 5, 4, 4, 4, 5) },
  { key: 'kitchen-cabinets', level: 1, funnel: 'paid', why: 'Multi-million fabrication quotes with invisible material downgrades — top quotation-verification family.', scores: s(3, 5, 5, 5, 5, 5, 2, 5, 2, 3, 2, 3, 2, 5, 4, 5, 4, 5) },
  { key: 'pop-ceilings', level: 1, funnel: 'both', why: 'Common renovation line item; design complexity inflates quotes.', scores: s(3, 2, 3, 3, 4, 4, 2, 4, 3, 4, 3, 2, 3, 5, 4, 3, 4, 4) },
  { key: 'external-paving', level: 1, funnel: 'both', why: '“German floor” is a signature Nigerian compound spend; material/labour bundling confuses pricing.', scores: s(3, 3, 4, 3, 4, 4, 3, 5, 2, 4, 4, 1, 2, 4, 4, 4, 4, 5) },
  { key: 'waterproofing', level: 1, funnel: 'paid', why: 'Leak repairs are BuildMyHouse core; system choice is technical and mispriced constantly.', scores: s(2, 3, 3, 4, 4, 4, 2, 5, 3, 3, 2, 3, 5, 4, 3, 3, 3, 5) },
  { key: 'cctv-security', level: 1, funnel: 'paid', why: 'Kit-composition games; diaspora remote-monitoring demand; strong installation conversion.', scores: s(3, 4, 4, 5, 5, 4, 2, 5, 4, 4, 3, 4, 3, 4, 3, 5, 4, 5) },

  // ------------------------------- Level 2 --------------------------------
  { key: 'air-conditioners', level: 2, funnel: 'both', why: 'High-ticket appliance with BTU/inverter specs; strong repairs overlap.', scores: s(4, 3, 4, 3, 3, 3, 3, 4, 5, 4, 4, 3, 4, 4, 2, 4, 4, 5) },
  { key: 'water-heaters', level: 2, funnel: 'both', why: 'Renovation staple; modest ticket.', scores: s(3, 2, 2, 2, 3, 3, 2, 4, 4, 4, 4, 2, 4, 4, 2, 3, 3, 4) },
  { key: 'borehole-equipment', level: 2, funnel: 'paid', why: 'Opaque drilling+equipment packages; diaspora water independence.', scores: s(3, 4, 4, 4, 5, 5, 3, 5, 2, 3, 2, 3, 3, 3, 4, 4, 4, 5) },
  { key: 'water-treatment', level: 2, funnel: 'paid', why: 'RO/filtration spec confusion.', scores: s(2, 3, 3, 4, 4, 4, 2, 4, 3, 3, 3, 3, 2, 3, 2, 3, 3, 4) },
  { key: 'automatic-transfer-switches', level: 2, funnel: 'paid', why: 'Pairs with generator/inverter purchases.', scores: s(2, 3, 3, 4, 4, 3, 2, 4, 3, 3, 4, 4, 3, 3, 3, 3, 2, 4) },
  { key: 'electric-fencing', level: 2, funnel: 'paid', why: 'Per-metre security spend on new fences.', scores: s(2, 3, 3, 3, 4, 4, 2, 5, 2, 3, 3, 2, 2, 3, 4, 4, 3, 4) },
  { key: 'access-control', level: 2, funnel: 'paid', why: 'Estate/commercial bundles.', scores: s(2, 3, 3, 4, 4, 4, 2, 5, 3, 3, 3, 3, 2, 3, 3, 3, 2, 4) },
  { key: 'smart-locks', level: 2, funnel: 'free', why: 'Consumer item, well-listed online.', scores: s(3, 2, 2, 3, 2, 3, 2, 3, 5, 3, 5, 4, 3, 3, 1, 4, 4, 3) },
  { key: 'lighting-systems', level: 2, funnel: 'free', why: 'High SEO; bulk fit-outs add up but items are cheap.', scores: s(4, 1, 2, 2, 2, 3, 2, 3, 5, 5, 5, 3, 3, 4, 3, 3, 5, 3) },
  { key: 'wardrobe-systems', level: 2, funnel: 'paid', why: 'Same fabricator economics as kitchens.', scores: s(3, 4, 4, 4, 5, 5, 2, 5, 2, 3, 2, 2, 2, 5, 3, 4, 3, 4) },
  { key: 'stone-finishes', level: 2, funnel: 'paid', why: 'Origin/grade spreads are extreme (marble/quartz).', scores: s(2, 4, 4, 4, 5, 5, 3, 4, 2, 3, 3, 3, 1, 4, 3, 4, 3, 4) },
  { key: 'glass-balustrades', level: 2, funnel: 'paid', why: 'Per-m² fabrication opacity.', scores: s(2, 3, 3, 4, 5, 4, 2, 5, 2, 3, 3, 2, 2, 4, 3, 4, 3, 4) },
  { key: 'steel-trusses-timber', level: 2, funnel: 'paid', why: 'Roof structure cost driver.', scores: s(2, 3, 4, 4, 4, 4, 4, 3, 2, 4, 2, 2, 2, 2, 5, 3, 3, 3) },
  { key: 'drainage-channels', level: 2, funnel: 'free', why: 'Compound works complement.', scores: s(2, 2, 2, 2, 3, 3, 4, 3, 1, 4, 3, 1, 3, 3, 4, 2, 2, 3) },
  { key: 'kerbs', level: 2, funnel: 'free', why: 'Paving complement.', scores: s(1, 1, 2, 1, 2, 3, 4, 2, 1, 4, 4, 1, 1, 2, 4, 2, 2, 2) },
  { key: 'building-chemicals', level: 2, funnel: 'both', why: 'Professional buyers; supports structural families.', scores: s(2, 2, 2, 4, 3, 3, 2, 2, 3, 3, 3, 3, 3, 3, 4, 2, 3, 3) },
  { key: 'sealants-adhesives', level: 2, funnel: 'free', why: 'SEO support items.', scores: s(3, 1, 1, 2, 2, 2, 1, 2, 4, 5, 4, 3, 4, 3, 3, 2, 4, 3) },
  { key: 'scaffolding-hire', level: 2, funnel: 'paid', why: 'Rental model; contractor demand.', scores: s(2, 2, 3, 3, 3, 4, 3, 2, 1, 3, 2, 1, 2, 3, 4, 2, 2, 3) },
  { key: 'fencing-gates', level: 2, funnel: 'paid', why: 'Fabricated gates are big-ticket diaspora purchases.', scores: s(3, 4, 4, 4, 5, 5, 3, 5, 2, 4, 2, 2, 2, 4, 5, 5, 4, 5) },
  { key: 'landscaping', level: 2, funnel: 'free', why: 'Premium estates niche.', scores: s(2, 2, 2, 2, 3, 4, 3, 4, 1, 3, 2, 1, 2, 3, 3, 3, 3, 3) },
  { key: 'fire-safety', level: 2, funnel: 'both', why: 'Regulatory demand for commercial buyers.', scores: s(2, 2, 2, 3, 3, 3, 2, 3, 4, 3, 4, 3, 2, 2, 3, 2, 3, 3) },
  { key: 'commercial-pumps', level: 2, funnel: 'paid', why: 'Engineering purchases for estates/hotels.', scores: s(1, 3, 4, 5, 4, 3, 2, 4, 2, 3, 3, 3, 2, 2, 3, 2, 2, 3) },
  { key: 'fuel-station-equipment', level: 2, funnel: 'paid', why: 'Future commercial vertical; very high ticket.', scores: s(1, 3, 5, 5, 4, 4, 3, 5, 2, 2, 2, 3, 1, 1, 3, 2, 1, 2) },
] as const;

export interface RankedPriority extends FamilyPriority {
  total: number;
}

export function rankedPriorities(): RankedPriority[] {
  return FAMILY_PRIORITIES.map((p) => ({ ...p, total: totalScore(p.scores) })).sort((a, b) => b.total - a.total);
}
