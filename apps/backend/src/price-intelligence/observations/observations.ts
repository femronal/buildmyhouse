/**
 * Deterministic observation lifecycle rules (Stage 3).
 *
 * price_observations is APPEND-ONLY: a new price never overwrites historical
 * evidence. This module contains the pure duplicate-detection and
 * supersession rules; services persist the transitions it returns.
 */
import { createHash } from 'crypto';

export type ObservationStatus =
  | 'active'
  | 'stale'
  | 'superseded'
  | 'rejected'
  | 'duplicate';

/**
 * Tri-state inclusion values (founder req. 5). A missing value must never
 * silently mean 'excluded' — parsers default to 'unknown'.
 */
export type InclusionState = 'included' | 'excluded' | 'unknown' | 'not_applicable';

export const INCLUSION_STATES: readonly InclusionState[] = [
  'included',
  'excluded',
  'unknown',
  'not_applicable',
];

/** Parse an arbitrary raw value into an InclusionState. NEVER defaults to excluded. */
export function parseInclusionState(raw: unknown): InclusionState {
  if (typeof raw === 'string' && (INCLUSION_STATES as readonly string[]).includes(raw)) {
    return raw as InclusionState;
  }
  // Booleans from legacy inputs are accepted explicitly; absence is unknown.
  if (raw === true) return 'included';
  if (raw === false) return 'excluded';
  return 'unknown';
}

export interface ObservationFingerprintInput {
  familyKey: string;
  sourceCode: string;
  sellerName?: string | null;
  originalWording: string;
  originalPrice: string | number; // decimal as string preferred
  originalUnitCode: string;
  listingDate?: string | null; // ISO date
}

function normalizeText(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, ' ');
}

/**
 * Deterministic duplicate fingerprint: identical evidence (same source,
 * seller, wording, price, unit and listing date) always produces the same
 * fingerprint, regardless of collection time.
 */
export function observationFingerprint(input: ObservationFingerprintInput): string {
  const parts = [
    normalizeText(input.familyKey),
    normalizeText(input.sourceCode),
    normalizeText(input.sellerName ?? ''),
    normalizeText(input.originalWording),
    String(input.originalPrice),
    normalizeText(input.originalUnitCode),
    input.listingDate ?? '',
  ];
  return createHash('sha256').update(parts.join('\u0000')).digest('hex');
}

export interface ExistingObservationSummary {
  id: string;
  status: ObservationStatus;
  duplicateFingerprint: string;
  sellerId?: string | null;
  sourceId: string;
  familyId: string;
  normalizedUnitCode?: string | null;
  checkedDate: Date;
}

export interface IncomingObservationSummary {
  duplicateFingerprint: string;
  sellerId?: string | null;
  sourceId: string;
  familyId: string;
  normalizedUnitCode?: string | null;
  checkedDate: Date;
}

export type ObservationIngestAction =
  | { kind: 'reject_duplicate'; duplicateOfObservationId: string }
  | {
      kind: 'insert_and_supersede';
      /** Prior ACTIVE rows from the same seller+source+family+unit to mark superseded (never deleted). */
      supersedeObservationIds: string[];
    }
  | { kind: 'insert' };

/**
 * Decide what happens when a newly collected observation arrives.
 *
 *  - Same fingerprint as ANY existing row -> the new row is a duplicate
 *    (stored with status 'duplicate', linked to the original) — deterministic.
 *  - Same seller + source + family + normalised unit, newer checkedDate ->
 *    prior ACTIVE rows become 'superseded' with supersededByObservationId set.
 *    Historical rows are NEVER deleted.
 *  - Otherwise plain insert.
 */
export function planObservationIngest(
  incoming: IncomingObservationSummary,
  existing: readonly ExistingObservationSummary[],
): ObservationIngestAction {
  const duplicateOf = existing.find(
    (e) => e.duplicateFingerprint === incoming.duplicateFingerprint,
  );
  if (duplicateOf) {
    return { kind: 'reject_duplicate', duplicateOfObservationId: duplicateOf.id };
  }

  const supersedable = existing.filter(
    (e) =>
      e.status === 'active' &&
      e.familyId === incoming.familyId &&
      e.sourceId === incoming.sourceId &&
      (e.sellerId ?? null) === (incoming.sellerId ?? null) &&
      e.sellerId != null &&
      (e.normalizedUnitCode ?? null) === (incoming.normalizedUnitCode ?? null) &&
      e.checkedDate.getTime() < incoming.checkedDate.getTime(),
  );

  if (supersedable.length > 0) {
    return {
      kind: 'insert_and_supersede',
      supersedeObservationIds: supersedable.map((e) => e.id),
    };
  }

  return { kind: 'insert' };
}

/**
 * Legal status transitions. Append-only semantics: valid historical rows are
 * demoted (stale/superseded), never deleted; terminal states never reactivate.
 */
const LEGAL_TRANSITIONS: Record<ObservationStatus, readonly ObservationStatus[]> = {
  active: ['stale', 'superseded', 'rejected', 'duplicate'],
  stale: ['superseded', 'rejected'],
  superseded: [],
  rejected: [],
  duplicate: [],
};

export function isLegalStatusTransition(
  from: ObservationStatus,
  to: ObservationStatus,
): boolean {
  return LEGAL_TRANSITIONS[from]?.includes(to) ?? false;
}
