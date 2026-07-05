export type HomeownerUserLike = {
  profileSetupCompleted?: boolean | null;
  managedParticipant?: boolean | null;
};

export function needsHomeownerIntroOnboarding(user?: HomeownerUserLike | null): boolean {
  if (!user) return false;
  if (user.managedParticipant) return false;
  return !user.profileSetupCompleted;
}
