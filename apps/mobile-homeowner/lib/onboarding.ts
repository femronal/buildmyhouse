type HomeownerUserLike = {
  profileSetupCompleted?: boolean | null;
};

export function needsHomeownerIntroOnboarding(user?: HomeownerUserLike | null): boolean {
  if (!user) return false;
  return !user.profileSetupCompleted;
}
