/**
 * AI-assisted extraction of line items from a merchant price-list image
 * (WhatsApp screenshot / market photo / PDF page rendered as image).
 *
 * Humans still review and approve — this only drafts items for the form.
 * Uses GPT-5.6 Sol (PRICE_CHECKER_EXTRACTION_MODEL) via Chat Completions vision.
 */
import {
  BadRequestException,
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import OpenAI from 'openai';
import { LEVEL1_FAMILIES } from '../taxonomy/families';
import { UNITS } from '../taxonomy/units';
import { loadResearchConfig } from '../research/research.config';
import { parseJsonFromText } from '../research/providers/openai-client';
import { PriceIntelligenceAuditService } from './audit.service';

export type ExtractedMerchantLineItem = {
  productLabel: string;
  familyKey: string | null;
  brandName: string | null;
  originalWording: string;
  originalPrice: number;
  originalUnitCode: string;
  currencyCode: string;
  confidence: number;
  notes: string | null;
};

export type MerchantListExtractionResult = {
  items: ExtractedMerchantLineItem[];
  model: string;
  warnings: string[];
  rawItemCount: number;
};

const UNIT_CODES = new Set(UNITS.map((u) => u.code));
const FAMILY_KEYS = new Set(LEVEL1_FAMILIES.map((f) => f.key));

function normalizeUnit(raw: unknown): string {
  if (typeof raw !== 'string' || !raw.trim()) return 'piece';
  const code = raw.trim().toLowerCase().replace(/\s+/g, '_');
  if (UNIT_CODES.has(code)) return code;
  const aliases: Record<string, string> = {
    bag: 'bag_50kg',
    bags: 'bag_50kg',
    '50kg': 'bag_50kg',
    '50_kg': 'bag_50kg',
    tonne: 'tonne',
    ton: 'tonne',
    length: 'length_12m',
    '12m': 'length_12m',
    pcs: 'piece',
    pc: 'piece',
    unit: 'piece',
    each: 'piece',
    kg: 'kg',
    m2: 'm2',
    sqm: 'm2',
    litre: 'litre',
    liter: 'litre',
  };
  return aliases[code] ?? 'piece';
}

function normalizeFamily(raw: unknown): string | null {
  if (typeof raw !== 'string' || !raw.trim()) return null;
  const key = raw.trim().toLowerCase().replace(/\s+/g, '_');
  if (FAMILY_KEYS.has(key)) return key;
  // loose contains match on family key/name
  for (const f of LEVEL1_FAMILIES) {
    if (f.key === key || f.name.toLowerCase().includes(key) || key.includes(f.key)) {
      return f.key;
    }
  }
  return null;
}

@Injectable()
export class MerchantListExtractorService {
  private readonly logger = new Logger(MerchantListExtractorService.name);

  constructor(private readonly audit: PriceIntelligenceAuditService) {}

  async extractFromImage(input: {
    imageUrl: string;
    actorAdminId: string;
    hintTitle?: string;
  }): Promise<MerchantListExtractionResult> {
    if (!input.imageUrl?.trim()) {
      throw new BadRequestException('imageUrl is required');
    }
    const apiKey = process.env.OPENAI_API_KEY?.trim();
    if (!apiKey) {
      throw new ServiceUnavailableException('OpenAI is not configured for price-list extraction');
    }

    const config = loadResearchConfig();
    const model = config.extractionModel;
    const familyCatalog = LEVEL1_FAMILIES.map((f) => `${f.key} (${f.name})`).join(', ');
    const unitCatalog = UNITS.map((u) => u.code).slice(0, 40).join(', ');

    const client = new OpenAI({ apiKey });
    const system = [
      'You extract structured Nigerian building-material price-list rows from an image.',
      'Return ONLY JSON: { "items": [ ... ], "warnings": string[] }',
      'Each item: productLabel, familyKey (from catalogue or null), brandName, originalWording (verbatim from image),',
      'originalPrice (number, NGN), originalUnitCode (from unit catalogue), currencyCode ("NGN"), confidence (0-1), notes.',
      'Rules:',
      '- Only extract rows that clearly show a product AND a price.',
      '- Never invent prices. If unreadable, skip the row and add a warning.',
      '- Prefer retail bag/piece/length units common in Nigerian markets.',
      `- Family keys: ${familyCatalog}`,
      `- Unit codes (prefer these): ${unitCatalog}`,
    ].join('\n');

    const userText = input.hintTitle
      ? `Price list title/context: ${input.hintTitle}. Extract every priced line item you can read.`
      : 'Extract every priced line item you can read from this merchant price list.';

    let completion: OpenAI.Chat.Completions.ChatCompletion;
    try {
      completion = await client.chat.completions.create({
        model,
        temperature: 0,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: system },
          {
            role: 'user',
            content: [
              { type: 'text', text: userText },
              { type: 'image_url', image_url: { url: input.imageUrl, detail: 'high' } },
            ],
          },
        ],
      });
    } catch (err) {
      this.logger.error(
        `Merchant list extraction failed: ${err instanceof Error ? err.message : String(err)}`,
      );
      throw new ServiceUnavailableException('Could not extract items from the price-list image');
    }

    const text = completion.choices[0]?.message?.content ?? '';
    const parsed = parseJsonFromText(text) as {
      items?: unknown[];
      warnings?: unknown;
    } | null;

    const warnings: string[] = Array.isArray(parsed?.warnings)
      ? parsed!.warnings.filter((w): w is string => typeof w === 'string').slice(0, 20)
      : [];
    const rawItems = Array.isArray(parsed?.items) ? parsed!.items : [];
    const items: ExtractedMerchantLineItem[] = [];

    for (const raw of rawItems) {
      if (!raw || typeof raw !== 'object') continue;
      const row = raw as Record<string, unknown>;
      const productLabel =
        typeof row.productLabel === 'string'
          ? row.productLabel.trim()
          : typeof row.originalWording === 'string'
            ? row.originalWording.trim()
            : '';
      const price = Number(row.originalPrice);
      if (!productLabel || !Number.isFinite(price) || price <= 0) {
        warnings.push(`Skipped unreadable or invalid row: ${productLabel || '(no label)'}`);
        continue;
      }
      const wording =
        typeof row.originalWording === 'string' && row.originalWording.trim()
          ? row.originalWording.trim()
          : productLabel;
      items.push({
        productLabel: productLabel.slice(0, 200),
        familyKey: normalizeFamily(row.familyKey),
        brandName:
          typeof row.brandName === 'string' && row.brandName.trim()
            ? row.brandName.trim().slice(0, 80)
            : null,
        originalWording: wording.slice(0, 400),
        originalPrice: Math.round(price * 100) / 100,
        originalUnitCode: normalizeUnit(row.originalUnitCode),
        currencyCode:
          typeof row.currencyCode === 'string' && row.currencyCode.trim()
            ? row.currencyCode.trim().toUpperCase().slice(0, 3)
            : 'NGN',
        confidence:
          typeof row.confidence === 'number' && row.confidence >= 0 && row.confidence <= 1
            ? row.confidence
            : 0.6,
        notes: typeof row.notes === 'string' ? row.notes.slice(0, 300) : null,
      });
    }

    if (items.length === 0) {
      warnings.push('No priced line items could be extracted. Enter items manually.');
    }

    await this.audit.write({
      action: 'merchant_submission.extract_from_image',
      entityType: 'MerchantPriceListImage',
      entityId: null,
      actorAdminId: input.actorAdminId,
      afterJson: {
        imageUrl: input.imageUrl.slice(0, 300),
        model,
        itemCount: items.length,
        rawItemCount: rawItems.length,
      },
    });

    return {
      items: items.slice(0, 80),
      model,
      warnings,
      rawItemCount: rawItems.length,
    };
  }
}
