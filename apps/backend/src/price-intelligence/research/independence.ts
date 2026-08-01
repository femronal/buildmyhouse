/**
 * Stage 4 STEP 6 / section 13 — independent-source detection.
 *
 * Three URLs are not necessarily three independent sources. Confidence must
 * use the INDEPENDENT-source count, never the raw URL count. This module
 * groups observations that trace back to the same underlying source
 * (same domain, same seller, syndicated/duplicated descriptions) so the
 * result builder counts each real source once.
 *
 * Private seller identifiers are used only to GROUP; they are never exposed
 * publicly (the caller stores/telemeters group ids, not phone numbers).
 */
import { createHash } from 'crypto';

export interface IndependenceInput {
  observationId: string;
  sourceDomain: string;
  sellerNameNormalized: string | null;
  /** Private seller identifier (e.g. phone) if lawfully available — hashed, never exposed. */
  sellerIdentifier?: string | null;
  descriptionNormalized: string;
  /** Distributor/brand the listing ultimately resolves to, if known. */
  underlyingDistributor?: string | null;
}

export interface IndependenceResult {
  rawSourceCount: number;
  independentSourceCount: number;
  /** observationId -> independence group id. */
  groupByObservation: Record<string, string>;
  /** group id -> observationIds that were merged into it. */
  groups: Record<string, string[]>;
}

function shingles(text: string, size = 4): Set<string> {
  const tokens = text.split(/\s+/).filter(Boolean);
  const out = new Set<string>();
  for (let i = 0; i + size <= tokens.length; i++) {
    out.add(tokens.slice(i, i + size).join(' '));
  }
  if (out.size === 0 && tokens.length > 0) out.add(tokens.join(' '));
  return out;
}

function jaccard(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 && b.size === 0) return 0;
  let inter = 0;
  for (const s of a) if (b.has(s)) inter++;
  const union = a.size + b.size - inter;
  return union === 0 ? 0 : inter / union;
}

const DUP_DESCRIPTION_THRESHOLD = 0.8;

/**
 * Deterministic grouping. Two observations are the same source when any of:
 *  - identical (domain + seller name)
 *  - identical private seller identifier (hashed)
 *  - same underlying distributor AND near-duplicate description
 *  - near-duplicate description on the same domain (syndicated/copied listing)
 */
export function computeIndependence(inputs: readonly IndependenceInput[]): IndependenceResult {
  const groupByObservation: Record<string, string> = {};
  const groups: Record<string, string[]> = {};
  const reps: { groupId: string; input: IndependenceInput; desc: Set<string> }[] = [];

  const groupIdFor = (seed: string): string => 'grp_' + createHash('sha1').update(seed).digest('hex').slice(0, 12);

  for (const input of inputs) {
    const desc = shingles(input.descriptionNormalized);
    const idHash = input.sellerIdentifier
      ? createHash('sha256').update(input.sellerIdentifier.trim().toLowerCase()).digest('hex')
      : null;

    let matched: string | null = null;
    for (const rep of reps) {
      const sameDomainSeller =
        rep.input.sourceDomain === input.sourceDomain &&
        !!input.sellerNameNormalized &&
        rep.input.sellerNameNormalized === input.sellerNameNormalized;

      const sameIdentifier =
        !!idHash &&
        !!rep.input.sellerIdentifier &&
        createHash('sha256').update(rep.input.sellerIdentifier.trim().toLowerCase()).digest('hex') === idHash;

      const descSim = jaccard(rep.desc, desc);
      const sameDistributorDup =
        !!input.underlyingDistributor &&
        rep.input.underlyingDistributor === input.underlyingDistributor &&
        descSim >= DUP_DESCRIPTION_THRESHOLD;

      const sameDomainDup = rep.input.sourceDomain === input.sourceDomain && descSim >= DUP_DESCRIPTION_THRESHOLD;

      if (sameDomainSeller || sameIdentifier || sameDistributorDup || sameDomainDup) {
        matched = rep.groupId;
        break;
      }
    }

    const groupId = matched ?? groupIdFor(`${input.sourceDomain}|${input.sellerNameNormalized ?? input.observationId}`);
    if (!matched) reps.push({ groupId, input, desc });
    groupByObservation[input.observationId] = groupId;
    (groups[groupId] ??= []).push(input.observationId);
  }

  return {
    rawSourceCount: inputs.length,
    independentSourceCount: Object.keys(groups).length,
    groupByObservation,
    groups,
  };
}
