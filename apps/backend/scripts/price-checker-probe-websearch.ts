/**
 * One-off capability probe (NOT part of the jest suite): confirms the
 * OpenAI Responses API + web_search tool works with the configured model.
 * Prints tool call + citations shape so the Stage 4 providers target the
 * real API surface. Never prints the API key.
 *
 * Run from apps/backend:  npx ts-node scripts/price-checker-probe-websearch.ts
 */
import * as fs from 'fs';
import * as path from 'path';
import OpenAI from 'openai';

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

async function main() {
  const env = loadEnvFile(path.resolve(__dirname, '..', '.env'));
  const apiKey = process.env.OPENAI_API_KEY || env.OPENAI_API_KEY;
  if (!apiKey) {
    console.error('FAIL: no OPENAI_API_KEY');
    process.exit(1);
  }
  const model = (process.env.PRICE_CHECKER_EXTRACTION_MODEL || env.PRICE_CHECKER_MATRIX_MODEL || 'gpt-5.6-sol').trim();
  const client = new OpenAI({ apiKey });

  console.log(`Probing Responses API + web_search with model '${model}'…`);
  try {
    const response = await (client as any).responses.create({
      model,
      tools: [{ type: 'web_search' }],
      input:
        'Find one current public retail listing for a 50kg bag of Dangote cement in Lagos, Nigeria. ' +
        'Return the seller, the price in NGN and the source URL. Use web search.',
      max_output_tokens: 1200,
    });
    console.log('OK. Response id:', response.id);
    console.log('Output text:\n', (response as any).output_text?.slice(0, 800) ?? '(none)');
    const items = (response as any).output ?? [];
    const kinds = items.map((i: any) => i.type);
    console.log('Output item types:', JSON.stringify(kinds));
    // Look for web_search calls and citations
    for (const item of items) {
      if (item.type === 'web_search_call') {
        console.log('web_search_call action:', JSON.stringify(item.action ?? item).slice(0, 300));
      }
      if (item.type === 'message') {
        for (const c of item.content ?? []) {
          if (c.annotations?.length) {
            console.log('annotations:', JSON.stringify(c.annotations).slice(0, 600));
          }
        }
      }
    }
    console.log('usage:', JSON.stringify((response as any).usage ?? {}));
  } catch (err) {
    console.error('web_search probe FAILED:', err instanceof Error ? err.message : String(err));
    process.exit(2);
  }
}

void main();
