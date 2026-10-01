type ContractorUserLike = {
  profileSetupCompleted?: boolean | null;
  managedParticipant?: boolean | null;
  artisanClaimAccess?: boolean | null;
};

export function needsContractorIntroOnboarding(user?: ContractorUserLike | null): boolean {
  if (!user) return false;
  if (user.managedParticipant) return false;
  if (user.artisanClaimAccess) return false;
  return !user.profileSetupCompleted;
}
