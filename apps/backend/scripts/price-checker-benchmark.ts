/**
 * Stage 4 sections 8/19/20 — live benchmark harness.
 *
 * Runs the OpenAI-first research pipeline over the representative benchmark
 * requests and measures discovery/retrieval/extraction/latency/cost so the
 * founder can decide (with evidence) whether any external provider is
 * justified. This is an explicit integration command — NOT part of jest — and
 * requires a real API key. It never prints the key.
 *
 * Usage (from apps/backend):
 *   npx ts-node scripts/price-checker-benchmark.ts --limit=3
 *   npx ts-node scripts/price-checker-benchmark.ts --only=bm-cement-lagos,bm-tiling-labour-lagos
 *   npx ts-node scripts/price-checker-benchmark.ts --out=scripts/data/benchmark-results.json
 *
 * Honesty guarantees enforced by the pipeline + this harness:
 *   - a price only appears if the retriever actually fetched the page AND the
 *     deterministic validator grounded it in that page's content;
 *   - every accepted observation carries its source URL and check date;
 *   - ungrounded observations are reported and MUST be zero.
 */
import * as fs from 'fs';
import * as path from 'path';
import OpenAI from 'openai';
import { loadResearchConfig } from '../src/price-intelligence/research/research.config';
import { loadModelPricing } from '../src/price-intelligence/research/cost';
import {
  buildSearchProvider,
  buildPageRetriever,
  buildExtractor,
  buildBrowserRetriever,
} from '../src/price-intelligence/research/providers';
import { researchItem, Planner } from '../src/price-intelligence/research/pipeline';
import { generateSearchPlan, PlanTarget } from '../src/price-intelligence/research/planner';
import { BENCHMARK_REQUESTS } from '../src/price-intelligence/research/benchmark/benchmark-requests';
import { itemMetric, summarize, BenchmarkItemMetric } from '../src/price-intelligence/research/benchmark/metrics';

function loadEnvFile(envPath: string): Record<string, string> {
  if (!fs.existsSync(envPath)) return {};
  const vars: Record<string, string> = {};
  for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
    if (!m) continue;
    vars[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
  return vars;
}

function parseArgs(argv: string[]) {
  const opts = { limit: Infinity, only: [] as string[], out: path.resolve(__dirname, 'data', 'benchmark-results.json') };
  for (const a of argv) {
    if (a.startsWith('--limit=')) opts.limit = Number(a.slice('--limit='.length)) || Infinity;
    else if (a.startsWith('--only=')) opts.only = a.slice('--only='.length).split(',').map((s) => s.trim()).filter(Boolean);
    else if (a.startsWith('--out=')) opts.out = path.resolve(process.cwd(), a.slice('--out='.length));
  }
  return opts;
}

async function main() {
  const env = { ...loadEnvFile(path.resolve(__dirname, '..', '.env')), ...process.env } as NodeJS.ProcessEnv;
  const apiKey = env.OPENAI_API_KEY;
  if (!apiKey) {
    console.error('FAIL: OPENAI_API_KEY not set');
    process.exit(1);
  }
  const opts = parseArgs(process.argv.slice(2));
  const config = loadResearchConfig(env);
  const pricing = loadModelPricing(env);
  const client = new OpenAI({ apiKey });

  const searchProvider = buildSearchProvider(client, config);
  const pageRetriever = buildPageRetriever(config);
  const extractor = buildExtractor(client, config);
  const browserRetriever = buildBrowserRetriever(config);

  const planner: Planner = {
    plan: (target: PlanTarget, signal?: AbortSignal) => generateSearchPlan(client, config, target, signal),
  };

  let requests = BENCHMARK_REQUESTS.slice();
  if (opts.only.length) requests = requests.filter((r) => opts.only.includes(r.id));
  requests = requests.slice(0, opts.limit);

  console.log(`Running ${requests.length} benchmark request(s) with model '${config.extractionModel}'…\n`);

  const metrics: BenchmarkItemMetric[] = [];
  const allDiagnostics: { outcome: string }[] = [];
  const perItem: any[] = [];

  for (const req of requests) {
    const started = Date.now();
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), config.researchTimeoutMs);
    try {
      const res = await researchItem(
        {
          requestItemId: req.id,
          researchRunId: `bench-${req.id}`,
          canonicalProductName: req.canonicalProductName,
          aliases: req.aliases,
          brand: req.brand ?? null,
          model: req.model ?? null,
          specification: req.specification,
          locationLabel: req.locationLabel,
          requestedLocationCode: req.locationCode,
          matchedFamilyId: req.matchedFamilyId,
          preferredComparisonUnit: req.preferredComparisonUnit,
          requiredAttributes: req.requiredAttributes,
          isService: req.isService,
          currentYear: new Date().getFullYear(),
        },
        { planner, searchProvider, pageRetriever, extractor, browserRetriever, config, pricing },
        controller.signal,
      );
      clearTimeout(timer);
      const latency = Date.now() - started;
      const m = itemMetric(req.id, req.kind, res, latency);
      metrics.push(m);
      allDiagnostics.push(...res.retrievalDiagnostics.map((d) => ({ outcome: d.outcome })));
      perItem.push({
        id: req.id,
        description: req.description,
        expectation: req.expectation,
        outcome: res.outcome,
        confidence: res.result.confidence,
        range: res.result.rangeLow !== null ? [res.result.rangeLow, res.result.rangeHigh] : null,
        median: res.result.median,
        unit: res.result.unit,
        independentSources: res.result.independentSourceCount,
        discoveredUrls: res.discoveredUrls,
        retrieval: res.retrievalDiagnostics,
        acceptedSources: res.acceptedObservations.map((a) => ({
          url: a.extraction.sourceUrl,
          seller: a.extraction.sellerName,
          price: a.extraction.originalPrice,
          currency: a.extraction.currency,
          unit: a.extraction.originalUnit,
          normalizedPrice: a.normalizedPrice,
          normalizedUnit: a.normalizedUnit,
          dateChecked: a.extraction.dateChecked,
          specMatchLevel: a.specMatchLevel,
          comparable: a.comparable,
          comparabilityNotes: a.comparabilityNotes,
        })),
        rejectedExtractions: res.rejectedExtractions,
        reasons: res.reasons,
        cost: res.cost,
      });
      console.log(
        `${req.id.padEnd(26)} ${res.outcome.padEnd(16)} conf=${res.result.confidence.padEnd(16)} ` +
          `indep=${res.result.independentSourceCount} ` +
          `range=${res.result.rangeLow ?? '-'}..${res.result.rangeHigh ?? '-'} ${res.result.unit ?? ''} ` +
          `${latency}ms $${res.cost.estimatedUsd}`,
      );
    } catch (err) {
      clearTimeout(timer);
      console.error(`${req.id}: ERROR ${err instanceof Error ? err.stack ?? err.message : String(err)}`);
      perItem.push({ id: req.id, error: err instanceof Error ? err.message : String(err) });
    }
  }

  const summary = summarize(metrics, allDiagnostics);
  const report = { runAt: new Date().toISOString(), model: config.extractionModel, config, summary, perItem };
  fs.mkdirSync(path.dirname(opts.out), { recursive: true });
  fs.writeFileSync(opts.out, JSON.stringify(report, null, 2));

  console.log('\n=== SUMMARY ===');
  console.log(JSON.stringify(summary, null, 2));
  console.log(`\nReport written to ${opts.out}`);
  if (summary.totalUngroundedObservations > 0) {
    console.error(`\n❌ ${summary.totalUngroundedObservations} ungrounded observation(s) — investigate before trusting this run.`);
    process.exit(2);
  }
}

void main();
