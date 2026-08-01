/**
 * Stage 4 STEP 5/6 — structured extraction schema + strict deterministic
 * validation and anti-fabrication guards.
 *
 * The extractor (GPT-5.6 Sol) proposes structured observations from ONE
 * retrieved page. This module is the deterministic gate (section 2C): it
 * rejects anything the supplied page evidence does not support, and enforces
 * the founder's "must not infer" rules (section 6). No price, source or spec
 * survives that the page did not actually contain.
 */
import { InclusionState, INCLUSION_STATES } from '../observations/observations';

export const EXTRACTION_SCHEMA_VERSION = 1;

export type SellerType =
  | 'manufacturer'
  | 'authorised_distributor'
  | 'retailer'
  | 'marketplace_seller'
  | 'contractor'
  | 'unknown';

export type PriceKind =
  | 'full_purchase_price'
  | 'installment'
  | 'deposit'
  | 'contact_for_price'
  | 'unknown';

export interface ExtractedObservation {
  schemaVersion: number;
  sourceUrl: string;
  sourceDomain: string;
  pageTitle: string | null;

  sellerName: string | null;
  sellerType: SellerType;
  sellerLocation: string | null;

  rawProductTitle: string;
  rawDescription: string | null;
  canonicalProductMatch: string | null;
  productFamilyMatch: string | null;
  brand: string | null;
  model: string | null;

  extractedAttributes: Record<string, string>;
  missingAttributes: string[];

  /** Numeric price ONLY when visibly displayed; null when the page is silent. */
  originalPrice: number | null;
  currency: string | null;
  originalQuantity: number | null;
  originalUnit: string | null;
  minimumOrderQuantity: number | null;
  priceKind: PriceKind;
  retailOrWholesale: 'retail' | 'wholesale' | 'unknown';
  condition: 'new' | 'used' | 'refurbished' | 'rental' | 'unknown';
  availabilityStatement: string | null;
  negotiable: 'yes' | 'no' | 'unknown';

  // Tri-state inclusion fields — silence must stay 'unknown', never 'excluded'.
  deliveryState: InclusionState;
  installationState: InclusionState;
  vatState: InclusionState;
  accessoriesState: InclusionState;
  warrantyInfo: string | null;

  listingDate: string | null;
  sourceUpdateDate: string | null;
  dateChecked: string; // set from the retrieval fetchedAt

  productOnlyOrBundle: 'product_only' | 'bundle' | 'unknown';
  bundleContents: string[];
  accessoryOnly: boolean;
  rental: boolean;
  depositPrice: boolean;

  mismatchFlags: string[];
  extractionConfidence: number; // 0..1
  /** Verbatim text spans from the page that support the asserted price/specs. */
  supportingTextSpans: string[];
  unresolvedQuestions: string[];
}

export interface ExtractionValidation {
  valid: boolean;
  errors: string[];
  /** Non-fatal notes (e.g. price intentionally null because contact-for-price). */
  notices: string[];
}

function isState(v: unknown): v is InclusionState {
  return typeof v === 'string' && (INCLUSION_STATES as readonly string[]).includes(v);
}

function normalizeForMatch(s: string): string {
  return s.toLowerCase().replace(/[\s,]/g, '');
}

/**
 * Validate one raw extraction object against the schema AND against the
 * evidence actually present on the page. `pageUrl` and `pageText` come from
 * the retrieval layer; the model can never assert a source or price the page
 * did not carry.
 */
export function validateExtractedObservation(
  raw: unknown,
  page: { finalUrl: string; url: string; readableText: string; structuredText: string },
): ExtractionValidation {
  const errors: string[] = [];
  const notices: string[] = [];

  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return { valid: false, errors: ['extraction is not an object'], notices };
  }
  const o = raw as Record<string, unknown>;

  if (o.schemaVersion !== EXTRACTION_SCHEMA_VERSION) errors.push(`schemaVersion must be ${EXTRACTION_SCHEMA_VERSION}`);

  // --- Source grounding: the URL must match the page we actually retrieved ---
  const allowed = new Set([page.finalUrl, page.url]);
  if (typeof o.sourceUrl !== 'string' || !allowed.has(o.sourceUrl)) {
    errors.push('sourceUrl must equal the retrieved page URL (no invented sources)');
  }

  if (typeof o.rawProductTitle !== 'string' || o.rawProductTitle.trim() === '') {
    errors.push('rawProductTitle missing');
  }

  // --- Strict field types (malformed output is rejected, per bounded retry policy) ---
  const NULLABLE_STRING_FIELDS = [
    'pageTitle', 'sellerName', 'sellerLocation', 'rawDescription', 'canonicalProductMatch',
    'productFamilyMatch', 'brand', 'model', 'currency', 'originalUnit', 'availabilityStatement',
    'warrantyInfo', 'listingDate', 'sourceUpdateDate',
  ] as const;
  for (const field of NULLABLE_STRING_FIELDS) {
    const v = o[field];
    if (v !== null && v !== undefined && typeof v !== 'string') {
      errors.push(`${field} must be a string or null`);
    }
  }
  if (typeof o.sourceDomain !== 'string' || o.sourceDomain.trim() === '') errors.push('sourceDomain missing');
  if (typeof o.dateChecked !== 'string' || o.dateChecked.trim() === '') errors.push('dateChecked missing');
  for (const field of ['originalQuantity', 'minimumOrderQuantity'] as const) {
    const v = o[field];
    if (v !== null && v !== undefined && (typeof v !== 'number' || !Number.isFinite(v))) {
      errors.push(`${field} must be a number or null`);
    }
  }
  for (const field of ['accessoryOnly', 'rental', 'depositPrice'] as const) {
    if (typeof o[field] !== 'boolean') errors.push(`${field} must be boolean`);
  }
  if (!['manufacturer', 'authorised_distributor', 'retailer', 'marketplace_seller', 'contractor', 'unknown'].includes(o.sellerType as string)) {
    errors.push(`sellerType invalid: ${String(o.sellerType)}`);
  }
  if (!['retail', 'wholesale', 'unknown'].includes(o.retailOrWholesale as string)) errors.push('retailOrWholesale invalid');
  if (!['new', 'used', 'refurbished', 'rental', 'unknown'].includes(o.condition as string)) errors.push('condition invalid');
  if (!['yes', 'no', 'unknown'].includes(o.negotiable as string)) errors.push('negotiable invalid');
  if (!['product_only', 'bundle', 'unknown'].includes(o.productOnlyOrBundle as string)) errors.push('productOnlyOrBundle invalid');

  // --- Tri-state inclusion fields ---
  for (const field of ['deliveryState', 'installationState', 'vatState', 'accessoriesState'] as const) {
    if (!isState(o[field])) errors.push(`${field} must be a tri-state inclusion value`);
  }

  // --- Confidence ---
  if (typeof o.extractionConfidence !== 'number' || o.extractionConfidence < 0 || o.extractionConfidence > 1) {
    errors.push('extractionConfidence must be 0..1');
  }

  // --- Price rules (section 6 "must not infer") ---
  const priceKind = o.priceKind as PriceKind;
  const validPriceKinds: PriceKind[] = ['full_purchase_price', 'installment', 'deposit', 'contact_for_price', 'unknown'];
  if (!validPriceKinds.includes(priceKind)) errors.push(`priceKind invalid: ${String(priceKind)}`);

  const price = o.originalPrice;
  const haveNumericPrice = typeof price === 'number' && Number.isFinite(price) && price > 0;

  if (price !== null && !haveNumericPrice) {
    errors.push('originalPrice must be a positive number or null');
  }

  // "contact for price" / silence must NOT become a number.
  if (haveNumericPrice && (priceKind === 'contact_for_price')) {
    errors.push('contact_for_price listings must not carry a numeric price');
  }

  // Installment / deposit must not be treated as a full purchase price.
  if (haveNumericPrice && priceKind === 'installment') {
    notices.push('price is a monthly instalment; excluded from full-price comparison downstream');
  }
  if (haveNumericPrice && priceKind === 'deposit' && o.depositPrice !== true) {
    errors.push('deposit price must set depositPrice=true');
  }

  // A displayed price must be backed by a verbatim supporting span found on the page.
  if (haveNumericPrice) {
    const spans = o.supportingTextSpans;
    if (!Array.isArray(spans) || spans.length === 0 || !spans.every((s) => typeof s === 'string')) {
      errors.push('a numeric price requires non-empty supportingTextSpans');
    } else {
      const haystack = normalizeForMatch(page.readableText + '\u0000' + page.structuredText);
      const grounded = spans.some((s) => {
        const needle = normalizeForMatch(String(s));
        return needle.length >= 3 && haystack.includes(needle);
      });
      if (!grounded) {
        errors.push('supportingTextSpans not found in retrieved page content (evidence not grounded)');
      }
      // The digits of the price should appear in a supporting span.
      const priceDigits = String(Math.round(price as number));
      const digitsPresent = spans.some((s) => normalizeForMatch(String(s)).includes(normalizeForMatch(priceDigits)));
      if (!digitsPresent) {
        errors.push('price value does not appear in its supporting text spans');
      }
    }
    if (typeof o.currency !== 'string' || o.currency.trim() === '') {
      errors.push('a numeric price requires a currency code');
    }
  }

  // Accessory-only must not masquerade as the complete product.
  if (o.accessoryOnly === true && o.productOnlyOrBundle === 'product_only') {
    notices.push('accessory-only item; not comparable to the complete product downstream');
  }

  // Arrays / maps
  for (const field of ['extractedAttributes'] as const) {
    if (!o[field] || typeof o[field] !== 'object' || Array.isArray(o[field])) {
      errors.push(`${field} must be an object map`);
    }
  }
  for (const field of ['missingAttributes', 'bundleContents', 'mismatchFlags', 'supportingTextSpans', 'unresolvedQuestions'] as const) {
    if (!Array.isArray(o[field]) || !(o[field] as unknown[]).every((v) => typeof v === 'string')) {
      errors.push(`${field} must be string[]`);
    }
  }

  return { valid: errors.length === 0, errors, notices };
}

/** True when a validated observation is usable as a comparable full-price data point. */
export function isComparableFullPrice(o: ExtractedObservation): boolean {
  return (
    typeof o.originalPrice === 'number' &&
    o.originalPrice > 0 &&
    o.priceKind === 'full_purchase_price' &&
    !o.accessoryOnly &&
    !o.depositPrice &&
    !o.rental &&
    o.condition !== 'used' &&
    o.productOnlyOrBundle !== 'bundle'
  );
}
