/**
 * Price Checker Stage 2 — GPT terminology spot-check runner.
 *
 * Validates that each Level 1 family matrix captures real Nigerian seller
 * terminology, using the configured OpenAI model (NOT human reviewers).
 * Founder policy: docs/price-checker/MATRIX_VALIDATION_AND_ESCALATION_POLICY.md
 *
 * Usage (from apps/backend):
 *   npx ts-node scripts/price-checker-terminology-check.ts --all
 *   npx ts-node scripts/price-checker-terminology-check.ts --families=cement,tiles
 *   npx ts-node scripts/price-checker-terminology-check.ts --all --dry-run
 *   npx ts-node scripts/price-checker-terminology-check.ts --all --out=scripts/data/terminology-check-results.json
 *
 * Model: env PRICE_CHECKER_MATRIX_MODEL (default 'gpt-5.6-sol' — the API id
 * of the approved "GPT-5.6" reasoning model for this project).
 * Samples: scripts/data/terminology-samples.json (real, permitted public
 * listing texts with source references — no restricted scraping).
 *
 * This is an explicit integration-validation command. It is NOT part of the
 * automated jest suite and requires a real API key. It never prints the key.
 * An AI spot check is not a professional certification, and sample prices are
 * never treated as market data.
 */
import * as fs from 'fs';
import * as path from 'path';
import OpenAI from 'openai';
import { LEVEL1_FAMILIES } from '../src/price-intelligence/taxonomy/families';
import { ProductFamily } from '../src/price-intelligence/taxonomy/types';

// ----------------------------------------------------------------------------
// Env / CLI
// ----------------------------------------------------------------------------

function loadEnvFile(envPath: string): Record<string, string> {
  if (!fs.existsSync(envPath)) return {};
  const vars: Record<string, string> = {};
  for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
    const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
    if (!match) continue;
    vars[match[1]] = match[2].replace(/^["']|["']$/g, '');
  }
  return vars;
}

interface CliOptions {
  families: string[] | 'all';
  dryRun: boolean;
  outPath: string;
}

function parseArgs(argv: string[]): CliOptions {
  const options: CliOptions = {
    families: 'all',
    dryRun: false,
    outPath: path.resolve(__dirname, 'data', 'terminology-check-results.json'),
  };
  for (const arg of argv) {
    if (arg === '--all') options.families = 'all';
    else if (arg.startsWith('--families=')) options.families = arg.slice('--families='.length).split(',').map((s) => s.trim()).filter(Boolean);
    else if (arg === '--dry-run') options.dryRun = true;
    else if (arg.startsWith('--out=')) options.outPath = path.resolve(process.cwd(), arg.slice('--out='.length));
  }
  return options;
}

// ----------------------------------------------------------------------------
// Sample corpus
// ----------------------------------------------------------------------------

interface TerminologySample {
  sourceType: string;
  sourceName: string;
  sourceRef: string;
  dateSeen: string;
  text: string;
}

type SampleCorpus = Record<string, TerminologySample[]>;

function loadSamples(): SampleCorpus {
  const samplesPath = path.resolve(__dirname, 'data', 'terminology-samples.json');
  if (!fs.existsSync(samplesPath)) {
    console.error(`FAIL: sample corpus missing at ${samplesPath}`);
    process.exit(1);
  }
  return JSON.parse(fs.readFileSync(samplesPath, 'utf8')) as SampleCorpus;
}

// ----------------------------------------------------------------------------
// Structured-output schema validation (strict, deterministic)
// ----------------------------------------------------------------------------

interface SpotCheckFinding {
  familyKey: string;
  marketTerminology: string[];
  aliasesDetected: string[];
  spellingVariations: string[];
  sellerShorthand: string[];
  specificationsPresent: string[];
  specificationsMissing: string[];
  matrixCapturesTerminology: boolean;
  proposedNewAliases: string[];
  proposedNewAttributes: string[];
  proposedNewQuestions: string[];
  itemNature: 'product_only' | 'bundle' | 'accessory' | 'used' | 'rental' | 'installation_inclusive';
  confidence: number;
  notes: string;
}

const ITEM_NATURES = ['product_only', 'bundle', 'accessory', 'used', 'rental', 'installation_inclusive'];
const STRING_ARRAY_FIELDS: (keyof SpotCheckFinding)[] = [
  'marketTerminology', 'aliasesDetected', 'spellingVariations', 'sellerShorthand',
  'specificationsPresent', 'specificationsMissing', 'proposedNewAliases',
  'proposedNewAttributes', 'proposedNewQuestions',
];

function validateFinding(raw: unknown): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return { valid: false, errors: ['not an object'] };
  const f = raw as Record<string, unknown>;
  if (typeof f.familyKey !== 'string' || !f.familyKey) errors.push('familyKey missing');
  for (const field of STRING_ARRAY_FIELDS) {
    const value = f[field];
    if (!Array.isArray(value) || !value.every((v) => typeof v === 'string')) errors.push(`${field} must be string[]`);
  }
  if (typeof f.matrixCapturesTerminology !== 'boolean') errors.push('matrixCapturesTerminology must be boolean');
  if (!ITEM_NATURES.includes(f.itemNature as string)) errors.push(`itemNature invalid: ${String(f.itemNature)}`);
  if (typeof f.confidence !== 'number' || f.confidence < 0 || f.confidence > 1) errors.push('confidence must be 0..1');
  if (typeof f.notes !== 'string') errors.push('notes must be string');
  return { valid: errors.length === 0, errors };
}

// ----------------------------------------------------------------------------
// Prompting
// ----------------------------------------------------------------------------

function familySummary(family: ProductFamily): string {
  return JSON.stringify({
    key: family.key,
    name: family.name,
    knownMarketNames: family.marketNames,
    subProducts: family.subProducts.map((s) => ({ key: s.key, label: s.label, aliases: s.aliases ?? [] })),
    attributes: family.attributes.map((a) => ({ key: a.key, label: a.label, priceChanging: a.priceChanging })),
    clarifyingQuestionIds: family.questions.map((q) => q.id),
    sellerUnits: family.sellerUnits,
  });
}

function buildPrompt(family: ProductFamily, sample: TerminologySample): string {
  return [
    'You are validating a Nigerian construction-products price-intelligence taxonomy.',
    'Below is (A) the current product-family definition and (B) one REAL seller listing/description text.',
    'Analyse ONLY the terminology and specification coverage. Never treat the listing price as market data.',
    '',
    '(A) FAMILY DEFINITION:',
    familySummary(family),
    '',
    '(B) LISTING TEXT:',
    sample.text,
    '',
    'Return STRICT JSON (no markdown) with exactly these keys:',
    '{',
    `  "familyKey": "${family.key}",`,
    '  "marketTerminology": string[],        // Nigerian market terms present in the listing',
    '  "aliasesDetected": string[],          // aliases for the product used by the seller',
    '  "spellingVariations": string[],       // misspellings/variants seen',
    '  "sellerShorthand": string[],          // abbreviations/shorthand used',
    '  "specificationsPresent": string[],    // important specs the listing states',
    '  "specificationsMissing": string[],    // important price-affecting specs the listing omits',
    '  "matrixCapturesTerminology": boolean, // does the family definition already capture the seller terminology?',
    '  "proposedNewAliases": string[],       // aliases the family should add (empty if none)',
    '  "proposedNewAttributes": string[],    // attributes the family should add (empty if none)',
    '  "proposedNewQuestions": string[],     // clarification questions the family should add (empty if none)',
    '  "itemNature": "product_only" | "bundle" | "accessory" | "used" | "rental" | "installation_inclusive",',
    '  "confidence": number,                 // 0..1 confidence in this analysis',
    '  "notes": string                       // brief remarks, incl. uncertainty',
    '}',
  ].join('\n');
}

// ----------------------------------------------------------------------------
// Run
// ----------------------------------------------------------------------------

interface CheckRecord {
  modelUsed: string;
  modelResponseId: string | null;
  productFamily: string;
  sourceReference: string;
  sourceType: string;
  dateChecked: string;
  termsDiscovered: string[];
  proposedMatrixCorrections: {
    aliases: string[];
    attributes: string[];
    questions: string[];
  };
  itemNature: string | null;
  matrixCapturesTerminology: boolean | null;
  validationResult: 'valid' | 'invalid_after_retry' | 'call_failed' | 'dry_run';
  validationErrors: string[];
  confidence: number | null;
  notes: string | null;
  adminCorrectionApplied: boolean;
  usage: { promptTokens: number; completionTokens: number } | null;
}

async function callModel(
  client: OpenAI,
  model: string,
  prompt: string,
): Promise<{ parsed: unknown; responseId: string | null; usage: CheckRecord['usage']; rawText: string }> {
  const response = await client.chat.completions.create({
    model,
    messages: [{ role: 'user', content: prompt }],
    response_format: { type: 'json_object' },
    max_completion_tokens: 4000,
  });
  const rawText = response.choices[0]?.message?.content ?? '';
  let parsed: unknown = null;
  try {
    parsed = JSON.parse(rawText);
  } catch {
    parsed = null;
  }
  return {
    parsed,
    responseId: response.id ?? null,
    usage: response.usage
      ? { promptTokens: response.usage.prompt_tokens ?? 0, completionTokens: response.usage.completion_tokens ?? 0 }
      : null,
    rawText,
  };
}

async function main() {
  const envVars = loadEnvFile(path.resolve(__dirname, '..', '.env'));
  const apiKey = process.env.OPENAI_API_KEY || envVars.OPENAI_API_KEY;
  const model = (process.env.PRICE_CHECKER_MATRIX_MODEL || envVars.PRICE_CHECKER_MATRIX_MODEL || 'gpt-5.6-sol').trim();
  const options = parseArgs(process.argv.slice(2));

  const targetFamilies =
    options.families === 'all'
      ? LEVEL1_FAMILIES
      : LEVEL1_FAMILIES.filter((f) => (options.families as string[]).includes(f.key));

  if (targetFamilies.length === 0) {
    console.error('FAIL: no matching families. Valid keys:', LEVEL1_FAMILIES.map((f) => f.key).join(', '));
    process.exit(1);
  }

  const corpus = loadSamples();
  const records: CheckRecord[] = [];
  let failures = 0;
  let totalPromptTokens = 0;
  let totalCompletionTokens = 0;

  if (!options.dryRun && !apiKey) {
    console.error('FAIL: OPENAI_API_KEY not available (env or apps/backend/.env). Key value is never printed.');
    process.exit(1);
  }
  const client = options.dryRun ? null : new OpenAI({ apiKey: apiKey as string });

  for (const family of targetFamilies) {
    const samples = corpus[family.key] ?? [];
    if (samples.length === 0) {
      console.warn(`WARN: no samples for family '${family.key}' — skipped (counts as failure).`);
      failures += 1;
      continue;
    }

    for (const sample of samples) {
      const base: CheckRecord = {
        modelUsed: model,
        modelResponseId: null,
        productFamily: family.key,
        sourceReference: `${sample.sourceName} — ${sample.sourceRef}`,
        sourceType: sample.sourceType,
        dateChecked: new Date().toISOString(),
        termsDiscovered: [],
        proposedMatrixCorrections: { aliases: [], attributes: [], questions: [] },
        itemNature: null,
        matrixCapturesTerminology: null,
        validationResult: 'dry_run',
        validationErrors: [],
        confidence: null,
        notes: null,
        adminCorrectionApplied: false,
        usage: null,
      };

      if (options.dryRun || !client) {
        console.log(`DRY-RUN: ${family.key} ← ${sample.sourceName}`);
        records.push(base);
        continue;
      }

      const prompt = buildPrompt(family, sample);
      try {
        let attempt = await callModel(client, model, prompt);
        let validation = validateFinding(attempt.parsed);

        if (!validation.valid) {
          // one retry with corrective instruction for malformed structured output
          const retryPrompt = `${prompt}\n\nYour previous output was invalid: ${validation.errors.join('; ')}. Return corrected strict JSON only.`;
          attempt = await callModel(client, model, retryPrompt);
          validation = validateFinding(attempt.parsed);
        }

        if (attempt.usage) {
          totalPromptTokens += attempt.usage.promptTokens;
          totalCompletionTokens += attempt.usage.completionTokens;
        }

        if (!validation.valid) {
          failures += 1;
          records.push({ ...base, modelResponseId: attempt.responseId, usage: attempt.usage, validationResult: 'invalid_after_retry', validationErrors: validation.errors });
          console.error(`INVALID: ${family.key} ← ${sample.sourceName}: ${validation.errors.join('; ')}`);
          continue;
        }

        const finding = attempt.parsed as SpotCheckFinding;
        records.push({
          ...base,
          modelResponseId: attempt.responseId,
          usage: attempt.usage,
          validationResult: 'valid',
          termsDiscovered: [
            ...finding.marketTerminology,
            ...finding.aliasesDetected,
            ...finding.spellingVariations,
            ...finding.sellerShorthand,
          ],
          proposedMatrixCorrections: {
            aliases: finding.proposedNewAliases,
            attributes: finding.proposedNewAttributes,
            questions: finding.proposedNewQuestions,
          },
          itemNature: finding.itemNature,
          matrixCapturesTerminology: finding.matrixCapturesTerminology,
          confidence: finding.confidence,
          notes: finding.notes,
        });
        console.log(`OK: ${family.key} ← ${sample.sourceName} (captures=${finding.matrixCapturesTerminology}, conf=${finding.confidence})`);
      } catch (error) {
        failures += 1;
        const message = error instanceof Error ? error.message : String(error);
        records.push({ ...base, validationResult: 'call_failed', validationErrors: [message] });
        console.error(`CALL FAILED: ${family.key} ← ${sample.sourceName}: ${message}`);
      }
    }
  }

  fs.mkdirSync(path.dirname(options.outPath), { recursive: true });
  fs.writeFileSync(
    options.outPath,
    JSON.stringify(
      {
        runAt: new Date().toISOString(),
        model,
        dryRun: options.dryRun,
        familiesChecked: targetFamilies.map((f) => f.key),
        totals: {
          records: records.length,
          valid: records.filter((r) => r.validationResult === 'valid').length,
          failures,
          promptTokens: totalPromptTokens,
          completionTokens: totalCompletionTokens,
        },
        disclaimer:
          'AI spot checks are not professional certification. Sample listing prices are not market data.',
        records,
      },
      null,
      2,
    ),
  );

  console.log(`\nResults written to ${options.outPath}`);
  console.log(`Token usage: prompt=${totalPromptTokens}, completion=${totalCompletionTokens}`);
  if (failures > 0) {
    console.error(`FAIL: ${failures} check(s) failed or were skipped.`);
    process.exit(1);
  }
  console.log('PASS: all terminology checks completed and validated.');
  process.exit(0);
}

void main();
