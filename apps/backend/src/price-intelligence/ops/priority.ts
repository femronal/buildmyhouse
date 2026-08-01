/**
 * Stage 8 — deterministic review-case priority scoring.
 */

export type PriorityLabel = 'critical' | 'high' | 'medium' | 'low';

export interface PriorityInput {
  caseType: string;
  confidenceLabel?: string | null;
  confidenceScore?: number | null;
  paidCustomerImpactCount?: number;
  customerImpactCount?: number;
  /** True when a paid customer already received a delivered report. */
  paidDelivered?: boolean;
  /** Source marked failing / disabled. */
  sourceFailing?: boolean;
  /** Manual override — requires overrideReason. */
  overrideLabel?: PriorityLabel | null;
  overrideReason?: string | null;
}

export interface PriorityResult {
  label: PriorityLabel;
  score: number;
  reason: string;
  overridden: boolean;
}

const LABEL_SCORE: Record<PriorityLabel, number> = {
  critical: 100,
  high: 75,
  medium: 50,
  low: 25,
};

function clampScore(n: number): number {
  return Math.max(0, Math.min(100, Math.round(n)));
}

function labelFromScore(score: number): PriorityLabel {
  if (score >= 90) return 'critical';
  if (score >= 70) return 'high';
  if (score >= 40) return 'medium';
  return 'low';
}

/**
 * Deterministic priority. Override requires a non-empty reason.
 */
export function computePriority(input: PriorityInput): PriorityResult {
  if (input.overrideLabel) {
    const reason = (input.overrideReason ?? '').trim();
    if (!reason) {
      throw new Error('Priority override requires a reason');
    }
    return {
      label: input.overrideLabel,
      score: LABEL_SCORE[input.overrideLabel],
      reason: `Override: ${reason}`,
      overridden: true,
    };
  }

  let score = 40;
  const reasons: string[] = [];

  if (input.caseType === 'insufficient_data') {
    score += 15;
    reasons.push('insufficient_data outcome');
  } else if (input.caseType === 'low_confidence') {
    score += 20;
    reasons.push('low confidence');
  } else if (input.caseType === 'outlier') {
    score += 25;
    reasons.push('price outlier');
  } else if (input.caseType === 'source_failure') {
    score += 30;
    reasons.push('source failure');
  } else if (input.caseType === 'customer_dispute') {
    score += 35;
    reasons.push('customer dispute');
  }

  const conf = (input.confidenceLabel ?? '').toLowerCase();
  if (conf === 'insufficient_data') {
    score += 10;
    reasons.push('confidence=insufficient_data');
  } else if (conf === 'low') {
    score += 15;
    reasons.push('confidence=low');
  }

  if (typeof input.confidenceScore === 'number' && input.confidenceScore < 0.4) {
    score += 10;
    reasons.push(`confidenceScore=${input.confidenceScore.toFixed(2)}`);
  }

  const paid = input.paidCustomerImpactCount ?? (input.paidDelivered ? 1 : 0);
  if (paid > 0) {
    score += Math.min(25, 10 + paid * 5);
    reasons.push(`paidCustomerImpact=${paid}`);
  }

  const impact = input.customerImpactCount ?? 1;
  if (impact > 1) {
    score += Math.min(15, (impact - 1) * 3);
    reasons.push(`customerImpact=${impact}`);
  }

  if (input.sourceFailing) {
    score += 20;
    reasons.push('source failing');
  }

  score = clampScore(score);
  const label = labelFromScore(score);
  return {
    label,
    score,
    reason: reasons.length ? reasons.join('; ') : 'default medium priority',
    overridden: false,
  };
}
