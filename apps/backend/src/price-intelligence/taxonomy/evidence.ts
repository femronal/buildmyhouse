/**
 * Evidence classes, document lifecycle states, source-access policy and
 * sensitive-field redaction.
 * Policy doc: docs/price-checker/SOURCE_EVIDENCE_POLICY.md
 */
import { EvidenceClass } from './types';

export const EVIDENCE_CLASS_TIER: Record<EvidenceClass, 1 | 2 | 3 | 4> = {
  manufacturer_distributor: 1,
  supplier_price_list: 2,
  supplier_quotation: 2,
  established_ecommerce: 2,
  merchant_confirmed: 2,
  receipt_invoice: 2,
  classified_listing: 3,
  user_submitted: 3,
  weak_secondary: 4,
};

export type EvidenceDocumentState =
  | 'uploaded'
  | 'extraction_pending'
  | 'extraction_complete'
  | 'clarification_required'
  | 'under_review'
  | 'approved_as_evidence'
  | 'rejected'
  | 'duplicate'
  | 'expired'
  | 'private_archive_only';

export type SourceAccessStatus =
  | 'official_api_available'
  | 'merchant_feed_possible'
  | 'public_structured_data'
  | 'public_manual_research_only'
  | 'permission_required'
  | 'automated_extraction_prohibited'
  | 'not_recommended';

export interface SourcePolicyEntry {
  sourceName: string;
  accessStatus: SourceAccessStatus;
  note: string;
}

/**
 * Stage 2 source-access register (verify each again in Stage 4 before any
 * automated collection is built).
 */
export const SOURCE_ACCESS_REGISTER: readonly SourcePolicyEntry[] = [
  { sourceName: 'Manufacturer / distributor sites (Dangote, BUA, Lafarge, cable makers…)', accessStatus: 'public_manual_research_only', note: 'Price lists are rarely public; distributor confirmation preferred.' },
  { sourceName: 'Jumia Nigeria', accessStatus: 'public_structured_data', note: 'Product pages carry structured data; respect robots and rate limits. Re-verify ToS in Stage 4.' },
  { sourceName: 'Jiji.ng', accessStatus: 'public_manual_research_only', note: 'Classified listings (Tier 3). Treat prices as negotiable asking prices. Automated extraction to be assessed against ToS in Stage 4.' },
  { sourceName: 'Konga', accessStatus: 'automated_extraction_prohibited', note: 'Access-restricted platform per Stage 2 instruction; manual research only unless partnership.' },
  { sourceName: 'Facebook Marketplace / social pages', accessStatus: 'automated_extraction_prohibited', note: 'Login-gated; no automation. Manual, permission-based only.' },
  { sourceName: 'Merchant WhatsApp price lists', accessStatus: 'permission_required', note: 'Preferred channel: consented weekly submissions via admin entry.' },
  { sourceName: 'Google Business profiles', accessStatus: 'public_manual_research_only', note: 'Use for merchant identity/location verification, not automated price harvest.' },
] as const;

/**
 * Fields that must NEVER be publicly exposed from uploaded evidence.
 * These are redacted before any evidence is shown outside admin review.
 */
export const SENSITIVE_EVIDENCE_FIELDS = [
  'customerName',
  'phoneNumber',
  'homeAddress',
  'bankDetails',
  'cardDetails',
  'privateInvoiceNumber',
  'signature',
  'email',
  'accountNumber',
] as const;

export type SensitiveEvidenceField = (typeof SENSITIVE_EVIDENCE_FIELDS)[number];

const REDACTED = '[REDACTED]';

/**
 * Returns a copy of an extracted-evidence record with all sensitive fields
 * replaced. Unknown keys pass through untouched; sensitive keys are redacted
 * whether nested or top-level.
 */
export function redactSensitiveFields<T extends Record<string, unknown>>(record: T): Record<string, unknown> {
  const sensitive = new Set<string>(SENSITIVE_EVIDENCE_FIELDS);
  const walk = (value: unknown): unknown => {
    if (Array.isArray(value)) return value.map(walk);
    if (value && typeof value === 'object') {
      return Object.fromEntries(
        Object.entries(value as Record<string, unknown>).map(([k, v]) => [k, sensitive.has(k) ? REDACTED : walk(v)]),
      );
    }
    return value;
  };
  return walk(record) as Record<string, unknown>;
}

/** Every stored evidence sample must document these capture fields. */
export const EVIDENCE_CAPTURE_FIELDS = [
  'sourceType',
  'sourceName',
  'sourceUrlOrDocumentRef',
  'seller',
  'sellerLocation',
  'productDescription',
  'price',
  'currency',
  'originalUnit',
  'quantity',
  'dateShownBySource',
  'dateChecked',
  'deliveryIncluded',
  'installationIncluded',
  'vatIncluded',
  'retailOrWholesale',
  'availabilityStatus',
  'newOrUsed',
  'negotiable',
  'extractionMethod',
  'archivedEvidenceRef',
  'limitations',
] as const;
