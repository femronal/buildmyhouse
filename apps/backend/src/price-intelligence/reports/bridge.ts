/**
 * Stage 5 bridge — converts Stage 4 pipeline output (AcceptedObservation)
 * into ScoringObservation records for the confidence engine, without
 * modifying any Stage 4 behaviour. Tier comes from the source registry;
 * location levels map onto the Stage 5 classification.
 */
import { AcceptedObservation } from '../research/pipeline';
import { policyForUrl, domainOf, SOURCE_POLICIES } from '../research/source-registry';
import { SellerType } from '../research/extraction-schema';
import { ScoringObservation, LocationMatchClass, SpecMatchClass } from './confidence';

/**
 * Deterministic source tier for scoring.
 * - Domains explicitly registered in the source registry keep their tier.
 * - Unknown domains derive a tier from the evidence-backed seller type, but
 *   never above Tier 2 (Tier 1 requires an explicit registry entry).
 */
export function scoringTierForSource(url: string, sellerType: SellerType): 1 | 2 | 3 | 4 {
  const host = domainOf(url);
  const registered = SOURCE_POLICIES.some(
    (p) => p.domain !== '*' && !p.domain.includes('*') && (host === p.domain || host.endsWith('.' + p.domain)),
  );
  if (registered) return policyForUrl(url).confidenceTier;
  switch (sellerType) {
    case 'manufacturer':
    case 'authorised_distributor':
      return 2;
    case 'retailer':
    case 'marketplace_seller':
    case 'contractor':
      return 3;
    default:
      return 4;
  }
}

/** Stage 4 location ladder → Stage 5 location classes. */
export function mapLocationLevel(level: string): LocationMatchClass {
  switch (level) {
    case 'exact_local_area':
    case 'same_city':
      return 'exact_city';
    case 'same_state':
      return 'same_state';
    case 'nearby_state':
      return 'nearby_market';
    case 'national':
      return 'national_supplier';
    case 'insufficient':
    default:
      return 'unknown';
  }
}

export function toScoringObservation(accepted: AcceptedObservation, observationId: string): ScoringObservation {
  const e = accepted.extraction;
  return {
    observationId,
    sourceUrl: e.sourceUrl,
    sourceDomain: e.sourceDomain,
    sourceTier: scoringTierForSource(e.sourceUrl, e.sellerType),
    sellerName: e.sellerName,
    independentGroupId: accepted.independentGroupId || observationId,
    originalPrice: e.originalPrice ?? 0,
    currency: e.currency ?? 'NGN',
    originalUnit: e.originalUnit,
    normalizedPrice: accepted.normalizedPrice,
    normalizedUnit: accepted.normalizedUnit,
    checkedAtIso: e.dateChecked,
    listingDateIso: e.listingDate ?? e.sourceUpdateDate,
    specMatch: accepted.specMatchLevel as SpecMatchClass,
    locationMatch: mapLocationLevel(accepted.locationMatchLevel),
    condition: e.condition,
    comparable: accepted.comparable,
    comparabilityNotes: accepted.comparabilityNotes,
    deliveryState: e.deliveryState,
    installationState: e.installationState,
    vatState: e.vatState,
    retailOrWholesale: e.retailOrWholesale,
    negotiable: e.negotiable,
  };
}

export function toScoringObservations(accepted: readonly AcceptedObservation[], idPrefix: string): ScoringObservation[] {
  return accepted.map((a, i) => toScoringObservation(a, `${idPrefix}:${i}`));
}
