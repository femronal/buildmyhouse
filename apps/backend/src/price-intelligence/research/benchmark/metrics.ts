/**
 * Stage 4 section 8 — benchmark metric aggregation (pure, testable).
 * Turns per-item research results into the measures the founder requires to
 * decide whether any external provider is justified.
 */
import { ResearchItemResult } from '../pipeline';

export interface BenchmarkItemMetric {
  id: string;
  kind: string;
  outcome: ResearchItemResult['outcome'];
  confidence: string;
  discoveredSources: number;
  pagesRetrieved: number;
  pagesUsable: number;
  validObservations: number;
  independentSources: number;
  nigerianDomains: number;
  rejectedExtractions: number;
  latencyMs: number;
  estimatedUsd: number;
  pricingKnown: boolean;
  /** Guard: an accepted observation whose URL was never retrieved (must be 0). */
  ungroundedObservations: number;
}

const NG_DOMAIN = /\.ng$|\.com\.ng$|nigeria/i;

export function itemMetric(
  id: string,
  kind: string,
  res: ResearchItemResult,
  latencyMs: number,
): BenchmarkItemMetric {
  const retrievedUrls = new Set(res.retrievalDiagnostics.flatMap((d) => [d.url, d.finalUrl].filter(Boolean)));
  const usable = res.retrievalDiagnostics.filter((d) =>
    ['fetched_successfully', 'structured_data_found', 'readable_text_found'].includes(d.outcome),
  ).length;
  const nigerianDomains = new Set(
    res.acceptedObservations.map((a) => a.extraction.sourceDomain).filter((d) => NG_DOMAIN.test(d)),
  ).size;
  const ungrounded = res.acceptedObservations.filter((a) => {
    const url = a.extraction.sourceUrl;
    return ![...retrievedUrls].some((u) => u === url || url.startsWith(u) || u.startsWith(url));
  }).length;

  return {
    id,
    kind,
    outcome: res.outcome,
    confidence: res.result.confidence,
    discoveredSources: res.discoveredUrls.length,
    pagesRetrieved: res.retrievalDiagnostics.length,
    pagesUsable: usable,
    validObservations: res.acceptedObservations.length,
    independentSources: res.result.independentSourceCount,
    nigerianDomains,
    rejectedExtractions: res.rejectedExtractions.length,
    latencyMs,
    estimatedUsd: res.cost.estimatedUsd,
    pricingKnown: res.cost.pricingKnown,
    ungroundedObservations: ungrounded,
  };
}

export interface BenchmarkSummary {
  items: number;
  priced: number;
  insufficientData: number;
  failed: number;
  withThreePlusIndependent: number;
  discoverySuccessRate: number; // items with >=1 discovered source
  retrievalSuccessRate: number; // usable pages / retrieved pages
  extractionSuccessRate: number; // valid observations / usable pages
  avgLatencyMs: number;
  totalEstimatedUsd: number;
  costPerSuccessfulItemUsd: number | null;
  pricingKnown: boolean;
  totalUngroundedObservations: number; // MUST be 0
  failuresByRetrievalOutcome: Record<string, number>;
}

export function summarize(
  metrics: BenchmarkItemMetric[],
  allDiagnostics: { outcome: string }[],
): BenchmarkSummary {
  const items = metrics.length;
  const priced = metrics.filter((m) => m.outcome === 'successful').length;
  const insufficient = metrics.filter((m) => m.outcome === 'insufficient_data').length;
  const failed = metrics.filter((m) => m.outcome === 'failed').length;
  const threePlus = metrics.filter((m) => m.independentSources >= 3).length;

  const totalRetrieved = metrics.reduce((s, m) => s + m.pagesRetrieved, 0);
  const totalUsable = metrics.reduce((s, m) => s + m.pagesUsable, 0);
  const totalValid = metrics.reduce((s, m) => s + m.validObservations, 0);
  const totalUsd = Number(metrics.reduce((s, m) => s + m.estimatedUsd, 0).toFixed(6));
  const pricingKnown = metrics.some((m) => m.pricingKnown);

  const failuresByOutcome: Record<string, number> = {};
  for (const d of allDiagnostics) {
    if (!['fetched_successfully', 'structured_data_found', 'readable_text_found'].includes(d.outcome)) {
      failuresByOutcome[d.outcome] = (failuresByOutcome[d.outcome] ?? 0) + 1;
    }
  }

  return {
    items,
    priced,
    insufficientData: insufficient,
    failed,
    withThreePlusIndependent: threePlus,
    discoverySuccessRate: items ? metrics.filter((m) => m.discoveredSources > 0).length / items : 0,
    retrievalSuccessRate: totalRetrieved ? totalUsable / totalRetrieved : 0,
    extractionSuccessRate: totalUsable ? totalValid / totalUsable : 0,
    avgLatencyMs: items ? Math.round(metrics.reduce((s, m) => s + m.latencyMs, 0) / items) : 0,
    totalEstimatedUsd: totalUsd,
    costPerSuccessfulItemUsd: priced ? Number((totalUsd / priced).toFixed(6)) : null,
    pricingKnown,
    totalUngroundedObservations: metrics.reduce((s, m) => s + m.ungroundedObservations, 0),
    failuresByRetrievalOutcome: failuresByOutcome,
  };
}
