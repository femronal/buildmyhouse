/**
 * OPTIONAL professional-review record logic (escalation only).
 * Doc: docs/price-checker/MATRIX_VALIDATION_AND_ESCALATION_POLICY.md
 *
 * Founder decision 2026-07-28: human professional review is NOT required for
 * matrices, catalogue searches, custom searches or Stage 2 closure. This
 * module remains so that WHEN an optional escalation review happens, the
 * record is honest: a matrix is "professionally reviewed" ONLY when a
 * complete review record exists for the CURRENT matrix version with an
 * approving outcome and an admin approver. Entering a reviewer's name is not
 * a review, and no fake professional approval can ever be recorded.
 */
import { ProfessionalReviewRecord, ReviewerType } from './types';

export type MatrixReviewStatus = 'not_reviewed' | 'review_outdated' | 'changes_requested' | 'professionally_reviewed';

function isCompleteRecord(record: ProfessionalReviewRecord): boolean {
  return Boolean(
    record.reviewerName.trim() &&
      record.relevantQualification.trim() &&
      record.reviewScope.trim() &&
      record.reviewDate &&
      record.adminApprover.trim(),
  );
}

export function matrixReviewStatus(
  currentVersion: number,
  records: readonly ProfessionalReviewRecord[],
): MatrixReviewStatus {
  const complete = records.filter(isCompleteRecord);
  if (complete.length === 0) return 'not_reviewed';

  const forCurrent = complete.filter((r) => r.matrixVersion === currentVersion);
  if (forCurrent.length === 0) return 'review_outdated';

  const latest = [...forCurrent].sort((a, b) => b.reviewDate.localeCompare(a.reviewDate))[0];
  if (latest.outcome === 'changes_requested') return 'changes_requested';
  return 'professionally_reviewed';
}

/** Audit-trail entry: reviews are append-only; corrections are new records. */
export interface ReviewAuditEntry {
  at: string; // ISO datetime
  actorId: string;
  action: 'review_submitted' | 'review_admin_approved' | 'matrix_version_bumped' | 'review_superseded';
  matrixKey: string;
  matrixVersion: number;
  detail?: string;
}

/**
 * A review submitted by someone whose profession does not match the family's
 * assigned reviewer types must not count toward review status.
 */
export function reviewerQualifiesForFamily(
  reviewerProfession: ReviewerType,
  assigned: { primary: ReviewerType; secondary?: ReviewerType },
): boolean {
  return reviewerProfession === assigned.primary || reviewerProfession === assigned.secondary;
}
