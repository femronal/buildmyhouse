/**
 * Stage 1 exit-criterion check: verifies OPENAI_API_KEY in apps/backend/.env works.
 * Run from apps/backend:  npx ts-node scripts/check-openai-key.ts
 * Cost: one minimal completion call (fraction of a cent).
 */
import * as fs from 'fs';
import * as path from 'path';
import OpenAI from 'openai';

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

async function main() {
  const envVars = loadEnvFile(path.resolve(__dirname, '..', '.env'));
  const apiKey = process.env.OPENAI_API_KEY || envVars.OPENAI_API_KEY;

  if (!apiKey) {
    console.error('FAIL: OPENAI_API_KEY is not set in apps/backend/.env');
    process.exit(1);
  }

  const client = new OpenAI({ apiKey });
  const model = (process.env.OPENAI_MODEL || envVars.OPENAI_MODEL || 'gpt-4o-mini').trim();

  try {
    const response = await client.chat.completions.create({
      model,
      messages: [{ role: 'user', content: 'Reply with the single word: ok' }],
      max_tokens: 5,
    });

    const text = response.choices[0]?.message?.content?.trim();
    console.log(`PASS: OpenAI key works. Model: ${model}. Response: "${text}"`);
    process.exit(0);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`FAIL: OpenAI call failed — ${message}`);
    process.exit(1);
  }
}

void main();
