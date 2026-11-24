export const PARTNER_SCORE = {
  seniorityPerDay: 1, seniorityMax: 90,
  joinedVia: { invited_professional: 60, invited_by_bmh: 40, self_signup: 0 },
  activeDayLast7: 6, activeDayLast7Max: 42,
  activeDayLast30: 1, activeDayLast30Max: 30,
  streakPerDay: 3, streakMax: 30,
  activeWeekLast8: 10, activeWeekLast8Max: 80,
  profileItem: 6,
  visitor: 1, visitorMax: 100,
  signUp: 20, signUpMax: 400,
  projectStarted: 40,
  projectCompleted: 150,
  commissionPointsPerNaira: 0.01,
} as const;
