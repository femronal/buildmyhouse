/**
 * Stage 8 — maker-checker rule for manual price entry approval.
 */

import { canApproveOwnEntry } from './permissions';

export interface MakerCheckerInput {
  creatorAdminId: string;
  reviewerAdminId: string;
  reviewerPermissions: readonly string[] | null | undefined;
}

export interface MakerCheckerResult {
  allowed: boolean;
  reason: string | null;
}

export function evaluateMakerChecker(input: MakerCheckerInput): MakerCheckerResult {
  if (input.creatorAdminId !== input.reviewerAdminId) {
    return { allowed: true, reason: null };
  }
  if (canApproveOwnEntry(input.reviewerPermissions)) {
    return { allowed: true, reason: 'SUPER_ADMIN self-approval' };
  }
  return {
    allowed: false,
    reason: 'Creator cannot approve their own manual entry (maker-checker)',
  };
}

export function assertMakerChecker(input: MakerCheckerInput): void {
  const result = evaluateMakerChecker(input);
  if (!result.allowed) {
    throw new Error(result.reason ?? 'Maker-checker violation');
  }
}
