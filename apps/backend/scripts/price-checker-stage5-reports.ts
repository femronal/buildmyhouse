/**
 * Stage 5 benchmark validation — replays the STORED Stage 4 benchmark
 * evidence through the Stage 5 confidence engine and report generator.
 *
 * NO live AI or web calls: uses only scripts/data/benchmark-*.json.
 * Latest run wins per benchmark id (final > regate > results); 'failed'
 * runs (credit exhaustion) carry no evidence and are skipped.
 *
 * Conservative mapping assumptions (the Stage 4 summaries do not persist
 * every classification):
 * - Seller location class → 'unknown' (0 location points) because the
 *   summary does not retain the location classification per source.
 * - Spec match: stored specMatchLevel when present; otherwise 'close' for
 *   comparable sources from the older run format.
 * - Source tier: registry tier for registered domains, else Tier 3
 *   (accepted live merchant/marketplace listing).
 *
 * Output: scripts/data/stage5-report-validation.json (+ sample rendered
 * reports for founder review).
 */
import * as fs from 'fs';
import * as path from 'path';
import { ScoringObservation, SpecMatchClass } from '../src/price-intelligence/reports/confidence';
import { generateReport, renderReportText } from '../src/price-intelligence/reports/report';
import { policyForUrl, domainOf, SOURCE_POLICIES } from '../src/price-intelligence/research/source-registry';

interface StoredSource {
  url: string;
  seller: string | null;
  price: number;
  currency: string;
  unit: string | null;
  normalizedPrice: number | null;
  normalizedUnit: string | null;
  dateChecked: string;
  specMatchLevel?: 'exact' | 'close' | 'partial';
  comparable: boolean;
  comparabilityNotes?: string[];
}

interface StoredItem {
  id: string;
  description: string;
  expectation: string;
  outcome: 'successful' | 'insufficient_data' | 'failed';
  acceptedSources: StoredSource[];
}

const DATA_DIR = path.join(__dirname, 'data');

function loadRun(file: string): StoredItem[] {
  const full = path.join(DATA_DIR, file);
  if (!fs.existsSync(full)) return [];
  return (JSON.parse(fs.readFileSync(full, 'utf8')) as { perItem: StoredItem[] }).perItem;
}

function tierFor(url: string): 1 | 2 | 3 | 4 {
  const host = domainOf(url);
  const registered = SOURCE_POLICIES.some(
    (p) => p.domain !== '*' && !p.domain.includes('*') && (host === p.domain || host.endsWith('.' + p.domain)),
  );
  return registered ? policyForUrl(url).confidenceTier : 3;
}

function toScoring(item: StoredItem): ScoringObservation[] {
  return item.acceptedSources.map((s, i) => {
    const domain = domainOf(s.url);
    const spec: SpecMatchClass = s.specMatchLevel ?? (s.comparable ? 'close' : 'partial');
    return {
      observationId: `${item.id}:${i}`,
      sourceUrl: s.url,
      sourceDomain: domain,
      sourceTier: tierFor(s.url),
      sellerName: s.seller,
      independentGroupId: `${domain}|${(s.seller ?? '').toLowerCase().trim()}`,
      originalPrice: s.price,
      currency: s.currency,
      originalUnit: s.unit,
      normalizedPrice: s.normalizedPrice,
      normalizedUnit: s.normalizedUnit,
      checkedAtIso: s.dateChecked,
      listingDateIso: null,
      specMatch: spec,
      locationMatch: 'unknown',
      condition: 'unknown',
      comparable: s.comparable,
      comparabilityNotes: s.comparabilityNotes ?? [],
      deliveryState: 'unknown',
      installationState: 'not_applicable',
      vatState: 'unknown',
      retailOrWholesale: 'unknown',
      negotiable: 'unknown',
    };
  });
}

function locationLabelFor(id: string): string {
  if (id.includes('abuja')) return 'Abuja';
  if (id.includes('benin')) return 'Benin City';
  return 'Lagos';
}

async function main() {
  // Latest evidence wins; 'failed' runs carry no evidence.
  const runsInPriorityOrder = ['benchmark-final.json', 'benchmark-regate.json', 'benchmark-results.json'];
  const byId = new Map<string, { item: StoredItem; run: string }>();
  for (const run of runsInPriorityOrder) {
    for (const item of loadRun(run)) {
      if (item.outcome === 'failed') continue;
      if (!byId.has(item.id)) byId.set(item.id, { item, run });
    }
  }

  const generatedAtIso = new Date().toISOString();
  const records: Record<string, unknown>[] = [];
  const sampleTexts: string[] = [];

  for (const { item, run } of [...byId.values()].sort((a, b) => a.item.id.localeCompare(b.item.id))) {
    const observations = toScoring(item);
    const report = generateReport(
      {
        reportId: `stage5-${item.id}`,
        productName: item.description,
        brand: null,
        specification: {},
        requestedUnit: null,
        requestedLocationLabel: locationLabelFor(item.id),
        requestedCondition: 'any',
        generatedAtIso,
      },
      observations,
    );

    // Traceability: every source shown must carry a URL and check date that
    // exist in the stored Stage 4 evidence.
    const storedUrls = new Set(item.acceptedSources.map((s) => s.url));
    const allClaimsTraceable =
      report.sources.every((s) => storedUrls.has(s.sourceUrl) && Boolean(s.dateChecked)) &&
      report.reproducibility.observationIds.every((id) => id.startsWith(item.id)) &&
      report.reproducibility.excludedObservationIds.every((id) => id.startsWith(item.id));

    const failures: string[] = [];
    if (!allClaimsTraceable) failures.push('untraceable report claim');
    if (item.id === 'bm-obscure-insufficient' && report.status !== 'insufficient_data') {
      failures.push('deliberately data-poor query did not return insufficient data');
    }
    if (report.status === 'complete' && report.pricing.independentSourceCount < 2) {
      failures.push('market range produced from fewer than two independent sources');
    }
    if (report.status !== 'complete' && report.pricing.typicalPrice !== null) {
      failures.push('non-complete report carries a typical price');
    }
    if (item.outcome === 'insufficient_data' && report.status === 'complete') {
      failures.push('Stage 4 said insufficient but Stage 5 produced a market range');
    }

    records.push({
      queryId: item.id,
      sourceRun: run,
      stage4Outcome: item.outcome,
      reportStatus: report.status,
      acceptedObservationCount: report.pricing.acceptedObservationCount,
      independentSourceCount: report.pricing.independentSourceCount,
      observedRange:
        report.pricing.observedLow !== null
          ? { low: report.pricing.observedLow, high: report.pricing.observedHigh, unit: report.pricing.normalisedUnit }
          : null,
      typicalPrice: report.pricing.typicalPrice,
      singleSourcePrice: report.pricing.singleSourcePrice,
      confidenceScore: report.confidence.score,
      confidenceLabel: report.confidence.label,
      components: report.confidence.components,
      hardGateFailures: report.confidence.hardGateFailures,
      excludedObservations: report.confidence.excludedObservations,
      inputHash: report.reproducibility.reportInputHash,
      scoringVersion: report.reproducibility.scoringVersion,
      allClaimsTraceable,
      pass: failures.length === 0,
      failureReason: failures.length ? failures.join('; ') : null,
    });

    if (['bm-cement-lagos', 'bm-obscure-insufficient', 'bm-window-lagos'].includes(item.id)) {
      sampleTexts.push(`=== ${item.id} (${run}) ===\n\n${renderReportText(report)}\n`);
    }
  }

  const summary = {
    generatedAt: generatedAtIso,
    totalQueries: records.length,
    passed: records.filter((r) => r.pass).length,
    failed: records.filter((r) => !r.pass).length,
    liveSpend: 'none — stored Stage 4 evidence only',
    records,
  };

  fs.writeFileSync(path.join(DATA_DIR, 'stage5-report-validation.json'), JSON.stringify(summary, null, 2));
  fs.writeFileSync(path.join(DATA_DIR, 'stage5-sample-reports.txt'), sampleTexts.join('\n\n'));

  console.log(`Stage 5 benchmark validation: ${summary.passed}/${summary.totalQueries} passed`);
  for (const r of records) {
    console.log(
      `  ${r.pass ? 'PASS' : 'FAIL'}  ${String(r.queryId).padEnd(28)} status=${String(r.reportStatus).padEnd(17)} ` +
        `indep=${r.independentSourceCount} score=${r.confidenceScore} label=${r.confidenceLabel}` +
        (r.failureReason ? `  << ${r.failureReason}` : ''),
    );
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
