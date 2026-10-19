export function adminReferrerUpdate(userRole: string | undefined, referrerId: string | null | undefined) {
  if (userRole !== 'admin' || referrerId === undefined) return {};
  if (!referrerId) {
    return { referrerId: null, referralSource: null, referredAt: null };
  }
  return { referrerId, referralSource: 'admin', referredAt: new Date() };
}
