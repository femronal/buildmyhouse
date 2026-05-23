type ContractorUserLike = {
  profileSetupCompleted?: boolean | null;
};

export function needsContractorIntroOnboarding(user?: ContractorUserLike | null): boolean {
  if (!user) return false;
  return !user.profileSetupCompleted;
}
