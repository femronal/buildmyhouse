import { PARTNER_SCORE } from './partner-score.config';
import { countsTowardRank } from './leaderboard';

export type JoinedVia = keyof typeof PARTNER_SCORE.joinedVia;

export type ProfileItem = { key: string; label: string; done: boolean };

export type ScorePart = { key: string; label: string; points: number; detail: string };

export type ActivityDay = { day: string; logins: number; visits: number };

export type ScoreInputs = {
  referrer: {
    id: string;
    approvedAt?: Date | string | null;
    createdAt: Date | string;
    userId?: string | null;
    createdByAdminId?: string | null;
    partnershipLeadId?: string | null;
    phone?: string | null;
    whatsapp?: string | null;
    leaderboardNickname?: string | null;
  };
  payout?: { bankName?: string | null; accountName?: string | null; accountNumber?: string | null } | null;
  agreementAcceptedAt?: Date | string | null;
  clicks?: { clickedAt: Date | string }[];
  signUps?: { lockedAt: Date | string }[];
  projects?: { status: string; createdAt: Date | string; completedAt?: Date | string | null; archivedAt?: Date | string | null }[];
  commissions?: { amount: number; status: string; approvedAt?: Date | string | null; paidAt?: Date | string | null }[];
  activityDays?: ActivityDay[];
};

const DAY_MS = 24 * 60 * 60 * 1000;

export function lagosDay(date: Date) {
  return new Date(date.getTime() + 60 * 60 * 1000).toISOString().slice(0, 10);
}

export function shiftDay(day: string, delta: number) {
  const date = new Date(`${day}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + delta);
  return date.toISOString().slice(0, 10);
}

function asDate(value?: Date | string | null) {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function dayDiff(from: Date, to: Date) {
  const ms = new Date(`${lagosDay(to)}T00:00:00.000Z`).getTime() - new Date(`${lagosDay(from)}T00:00:00.000Z`).getTime();
  return Math.max(0, Math.round(ms / DAY_MS));
}

function onOrBefore(value: Date | string | null | undefined, asOf: Date) {
  const date = asDate(value);
  return !!date && date.getTime() <= asOf.getTime();
}

function filled(value?: string | null) {
  return String(value || '').trim().length > 0;
}

export function joinedVia(referrer: { userId?: string | null; createdByAdminId?: string | null; partnershipLeadId?: string | null }): JoinedVia {
  if (referrer.partnershipLeadId || referrer.userId) return 'invited_professional';
  if (referrer.createdByAdminId) return 'invited_by_bmh';
  return 'self_signup';
}

export function profileItems(
  referrer: { phone?: string | null; whatsapp?: string | null; leaderboardNickname?: string | null },
  payout?: { bankName?: string | null; accountName?: string | null; accountNumber?: string | null } | null,
  agreementAcceptedAt?: Date | string | null,
): ProfileItem[] {
  return [
    { key: 'contact', label: 'Phone or WhatsApp', done: filled(referrer.phone) || filled(referrer.whatsapp) },
    { key: 'nickname', label: 'Nickname on the leaderboard', done: filled(referrer.leaderboardNickname) },
    { key: 'bank', label: 'Bank name', done: filled(payout?.bankName) },
    { key: 'account', label: 'Account name and number', done: filled(payout?.accountName) && filled(payout?.accountNumber) },
    { key: 'agreement', label: 'Agreement accepted', done: !!asDate(agreementAcceptedAt) },
  ];
}

function mondayOf(day: string) {
  const date = new Date(`${day}T00:00:00.000Z`);
  const delta = date.getUTCDay() === 0 ? -6 : 1 - date.getUTCDay();
  return shiftDay(day, delta);
}

export function activityStats(days: ActivityDay[], asOf: Date) {
  const today = lagosDay(asOf);
  const active = new Set(
    days.filter((row) => row.logins + row.visits > 0 && row.day <= today).map((row) => row.day),
  );
  const last7 = Array.from({ length: 7 }, (_, index) => active.has(shiftDay(today, index - 6)));
  const activeDaysLast7 = last7.filter(Boolean).length;
  let activeDaysLast30 = 0;
  for (let index = 0; index < 30; index += 1) {
    if (active.has(shiftDay(today, -index))) activeDaysLast30 += 1;
  }
  let end = today;
  if (!active.has(today)) {
    const yesterday = shiftDay(today, -1);
    if (!active.has(yesterday)) {
      return { activeDaysLast7, activeDaysLast30, streak: 0, activeWeeksLast8: countWeeks(active, today), last7 };
    }
    end = yesterday;
  }
  let streak = 0;
  let cursor = end;
  while (active.has(cursor)) {
    streak += 1;
    cursor = shiftDay(cursor, -1);
  }
  return { activeDaysLast7, activeDaysLast30, streak, activeWeeksLast8: countWeeks(active, today), last7 };
}

function countWeeks(active: Set<string>, today: string) {
  const newest = mondayOf(today);
  const oldest = shiftDay(newest, -7 * 7);
  const weeks = new Set<string>();
  for (const day of active) {
    const monday = mondayOf(day);
    if (monday >= oldest && monday <= newest) weeks.add(monday);
  }
  return weeks.size;
}

function cap(points: number, max: number) {
  return Math.min(max, Math.max(0, Math.round(points)));
}

function naira(amount: number) {
  return `₦${Math.round(amount).toLocaleString('en-US')}`;
}

export function scorePartner(inputs: ScoreInputs, asOf: Date) {
  const startedAt = asDate(inputs.referrer.approvedAt) || asDate(inputs.referrer.createdAt) || asOf;
  const seniorityDays = dayDiff(startedAt, asOf);
  const seniorityPoints = cap(seniorityDays * PARTNER_SCORE.seniorityPerDay, PARTNER_SCORE.seniorityMax);
  const via = joinedVia(inputs.referrer);
  const joinedPoints = PARTNER_SCORE.joinedVia[via];
  const stats = activityStats(inputs.activityDays || [], asOf);
  const recent7 = cap(stats.activeDaysLast7 * PARTNER_SCORE.activeDayLast7, PARTNER_SCORE.activeDayLast7Max);
  const recent30 = cap(stats.activeDaysLast30 * PARTNER_SCORE.activeDayLast30, PARTNER_SCORE.activeDayLast30Max);
  const recentPoints = recent7 + recent30;
  const streakPoints = cap(stats.streak * PARTNER_SCORE.streakPerDay, PARTNER_SCORE.streakMax);
  const consistencyPoints = cap(stats.activeWeeksLast8 * PARTNER_SCORE.activeWeekLast8, PARTNER_SCORE.activeWeekLast8Max);
  const items = profileItems(inputs.referrer, inputs.payout, inputs.agreementAcceptedAt);
  const profilePoints = items.filter((item) => item.done).length * PARTNER_SCORE.profileItem;
  const visitors = (inputs.clicks || []).filter((row) => onOrBefore(row.clickedAt, asOf)).length;
  const visitorPoints = cap(visitors * PARTNER_SCORE.visitor, PARTNER_SCORE.visitorMax);
  const signUps = (inputs.signUps || []).filter((row) => onOrBefore(row.lockedAt, asOf)).length;
  const signUpPoints = cap(signUps * PARTNER_SCORE.signUp, PARTNER_SCORE.signUpMax);
  const started = (inputs.projects || []).filter((row) => !row.archivedAt && ['active', 'paused', 'completed'].includes(row.status) && onOrBefore(row.createdAt, asOf)).length;
  const startedPoints = started * PARTNER_SCORE.projectStarted;
  const completed = (inputs.projects || []).filter((row) => !row.archivedAt && row.status === 'completed' && onOrBefore(row.completedAt, asOf)).length;
  const completedPoints = completed * PARTNER_SCORE.projectCompleted;
  const counted = (inputs.commissions || []).filter((row) => countsTowardRank(row.status) && onOrBefore(row.approvedAt || row.paidAt, asOf));
  const commissionAmount = counted.reduce((total, row) => total + (Number(row.amount) || 0), 0);
  const commissionPoints = Math.round(commissionAmount * PARTNER_SCORE.commissionPointsPerNaira);
  const joinedDetail = via === 'invited_professional' ? 'invited professional' : via === 'invited_by_bmh' ? 'invited by BuildMyHouse' : 'signed up';
  const parts: ScorePart[] = [
    { key: 'commission', label: 'Approved and paid commission', points: commissionPoints, detail: `${naira(commissionAmount)}, ${commissionPoints} points` },
    { key: 'completed', label: 'Completed projects', points: completedPoints, detail: `${completed} project${completed === 1 ? '' : 's'}, ${completedPoints} points` },
    { key: 'started', label: 'Projects started', points: startedPoints, detail: `${started} project${started === 1 ? '' : 's'}, ${startedPoints} points` },
    { key: 'signUps', label: 'Homeowner sign-ups', points: signUpPoints, detail: `${signUps} sign-up${signUps === 1 ? '' : 's'}, ${signUpPoints} points` },
    { key: 'visitors', label: 'Link visitors', points: visitorPoints, detail: `${visitors} visitor${visitors === 1 ? '' : 's'}, ${visitorPoints} points` },
    { key: 'consistency', label: 'Consistency', points: consistencyPoints, detail: `${stats.activeWeeksLast8} of the last 8 weeks, ${consistencyPoints} points` },
    { key: 'recent', label: 'Recent activity', points: recentPoints, detail: `${stats.activeDaysLast7} of the last 7 days and ${stats.activeDaysLast30} of the last 30, ${recentPoints} points` },
    { key: 'streak', label: 'Streak', points: streakPoints, detail: `${stats.streak} day streak, ${streakPoints} points` },
    { key: 'profile', label: 'Profile', points: profilePoints, detail: `${items.filter((item) => item.done).length} of 5 done, ${profilePoints} points` },
    { key: 'joined', label: 'How you joined', points: joinedPoints, detail: `${joinedDetail}, ${joinedPoints} points` },
    { key: 'seniority', label: 'Time in the program', points: seniorityPoints, detail: `${seniorityDays} days, ${seniorityPoints} points` },
  ];
  return {
    total: parts.reduce((sum, part) => sum + part.points, 0),
    parts,
    streak: stats.streak,
    activeDaysLast7: stats.activeDaysLast7,
    last7: stats.last7,
    profileItems: items,
  };
}

export function rankByScore<T extends { id: string; total: number; approvedAt?: Date | null; createdAt: Date }>(rows: T[]) {
  const sorted = [...rows].sort((left, right) => {
    if (right.total !== left.total) return right.total - left.total;
    const leftTime = (left.approvedAt || left.createdAt).getTime();
    const rightTime = (right.approvedAt || right.createdAt).getTime();
    if (leftTime !== rightTime) return leftTime - rightTime;
    return left.id < right.id ? -1 : left.id > right.id ? 1 : 0;
  });
  return sorted.map((row, index) => ({ ...row, rank: index + 1 }));
}

export function movement(rankNow: number, rankLastWeek: number | null, approvedAt: Date | null, createdAt: Date, asOf: Date) {
  const start = approvedAt || createdAt;
  if (dayDiff(start, asOf) < 7) return { direction: 'new' as const, places: 0 };
  if (rankLastWeek == null || rankLastWeek === rankNow) return { direction: 'same' as const, places: 0 };
  if (rankNow < rankLastWeek) return { direction: 'up' as const, places: rankLastWeek - rankNow };
  return { direction: 'down' as const, places: rankNow - rankLastWeek };
}
