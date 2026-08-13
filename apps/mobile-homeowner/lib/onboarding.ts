export type HomeownerUserLike = {
  profileSetupCompleted?: boolean | null;
  managedParticipant?: boolean | null;
};

/**
 * Forced profile onboarding is disabled.
 * New users should reach the home screen immediately after sign-in
 * so they can explore (e.g. Start Building) without filling forms first.
 * Profile details remain available later via Personal Information.
 */
export function needsHomeownerIntroOnboarding(_user?: HomeownerUserLike | null): boolean {
  return false;
}
