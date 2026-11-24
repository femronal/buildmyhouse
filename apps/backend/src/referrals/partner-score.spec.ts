import { activityStats, movement, rankByScore, scorePartner, type ActivityDay, type ScoreInputs } from './partner-score';

const asOf = new Date('2026-11-24T10:00:00.000Z');

function day(offset: number) {
  const date = new Date(asOf.getTime() + 60 * 60 * 1000);
  date.setUTCDate(date.getUTCDate() + offset);
  return date.toISOString().slice(0, 10);
}

function partner(id: string, approvedAt: string, extra: Partial<ScoreInputs> = {}): ScoreInputs {
  return {
    referrer: { id, approvedAt: new Date(approvedAt), createdAt: new Date(approvedAt) },
    clicks: [],
    signUps: [],
    projects: [],
    commissions: [],
    activityDays: [],
    ...extra,
  };
}

function ranked(rows: ScoreInputs[], when = asOf) {
  return rankByScore(rows.map((row) => {
    const scored = scorePartner(row, when);
    return {
      id: row.referrer.id,
      total: scored.total,
      approvedAt: new Date(row.referrer.approvedAt || row.referrer.createdAt),
      createdAt: new Date(row.referrer.createdAt),
    };
  }));
}

describe('partner score', () => {
  it('ranks the earlier approval first when nothing else differs', () => {
    const rows = ranked([
      partner('later', '2026-06-01T00:00:00.000Z'),
      partner('earlier', '2026-05-01T00:00:00.000Z'),
    ]);
    expect(rows.map((row) => row.id)).toEqual(['earlier', 'later']);
    expect(rows.map((row) => row.rank)).toEqual([1, 2]);
    expect(rows[0].total).toBe(rows[1].total);
  });

  it('gives an invited professional 60 points over a self-signup approved the same day', () => {
    const invited = partner('invited', '2026-11-01T00:00:00.000Z', {
      referrer: { id: 'invited', approvedAt: new Date('2026-11-01T00:00:00.000Z'), createdAt: new Date('2026-11-01T00:00:00.000Z'), partnershipLeadId: 'lead-1' },
    });
    const self = partner('self', '2026-11-01T00:00:00.000Z');
    const rows = ranked([self, invited]);
    expect(rows[0].id).toBe('invited');
    expect(rows[0].total - rows[1].total).toBe(60);
  });

  it('counts a streak that ended yesterday and ignores one that ended two days ago', () => {
    const yesterday = [1, 2, 3].map((offset) => ({ day: day(-offset), logins: 1, visits: 0 }));
    const older = [2, 3, 4].map((offset) => ({ day: day(-offset), logins: 1, visits: 0 }));
    expect(activityStats(yesterday, asOf).streak).toBe(3);
    expect(activityStats(older, asOf).streak).toBe(0);
  });

  it('ranks four recent sign-in days above none', () => {
    const activeDays: ActivityDay[] = [0, 1, 2, 3].map((offset) => ({ day: day(-offset), logins: 1, visits: 0 }));
    const rows = ranked([
      partner('quiet', '2026-11-01T00:00:00.000Z'),
      partner('active', '2026-11-01T00:00:00.000Z', { activityDays: activeDays }),
    ]);
    expect(rows[0].id).toBe('active');
  });

  it('ignores commission that is not approved or paid', () => {
    const scored = scorePartner(partner('mixed', '2026-10-01T00:00:00.000Z', {
      commissions: [
        { amount: 40000, status: 'awaiting_checks', approvedAt: '2026-11-01T00:00:00.000Z' },
        { amount: 10000, status: 'needs_review', approvedAt: '2026-11-01T00:00:00.000Z' },
        { amount: 80000, status: 'reversed', approvedAt: '2026-11-01T00:00:00.000Z' },
        { amount: 50000, status: 'approved', approvedAt: '2026-11-01T00:00:00.000Z' },
      ],
    }), asOf);
    expect(scored.parts.find((part) => part.key === 'commission')?.points).toBe(500);
  });

  it('lets one approved commission outrank every other capped part before a sign-up', () => {
    const days: ActivityDay[] = [];
    for (let offset = 0; offset < 30; offset += 1) days.push({ day: day(-offset), logins: 1, visits: 0 });
    for (const offset of [35, 42, 49]) days.push({ day: day(-offset), logins: 1, visits: 0 });
    const stats = activityStats(days, asOf);
    expect(stats.activeDaysLast7).toBe(7);
    expect(stats.activeDaysLast30).toBe(30);
    expect(stats.streak).toBeGreaterThanOrEqual(10);
    expect(stats.activeWeeksLast8).toBe(8);
    const ceiling = scorePartner({
      referrer: {
        id: 'ceiling',
        approvedAt: new Date('2026-05-01T00:00:00.000Z'),
        createdAt: new Date('2026-05-01T00:00:00.000Z'),
        partnershipLeadId: 'lead-1',
        phone: '0801',
        leaderboardNickname: 'Heron',
      },
      payout: { bankName: 'Bank', accountName: 'Ada', accountNumber: '0123456789' },
      agreementAcceptedAt: '2026-05-02T00:00:00.000Z',
      clicks: Array.from({ length: 120 }, () => ({ clickedAt: '2026-11-01T00:00:00.000Z' })),
      activityDays: days,
    }, asOf);
    expect(ceiling.total).toBe(462);
    const paid = scorePartner(partner('paid', '2026-11-24T09:00:00.000Z', {
      commissions: [{ amount: 50000, status: 'approved', approvedAt: '2026-11-24T09:00:00.000Z' }],
    }), asOf);
    expect(paid.parts.find((part) => part.key === 'commission')?.points).toBe(500);
    expect(paid.total).toBeGreaterThan(ceiling.total);
  });

  it('gives every partner a rank from 1 to N', () => {
    const rows = ranked([
      partner('a', '2026-11-01T00:00:00.000Z'),
      partner('b', '2026-10-01T00:00:00.000Z'),
      partner('c', '2026-09-01T00:00:00.000Z'),
    ]);
    expect(rows.map((row) => row.rank)).toEqual([1, 2, 3]);
    expect(rows.every((row) => row.rank != null)).toBe(true);
  });

  it('shows how many places a partner moved, and marks a new approval', () => {
    const early = partner('early', '2026-09-01T00:00:00.000Z', {
      commissions: [{ amount: 20000, status: 'approved', approvedAt: '2026-10-01T00:00:00.000Z' }],
    });
    const late = partner('late', '2026-09-01T00:00:00.000Z', {
      commissions: [
        { amount: 10000, status: 'approved', approvedAt: '2026-10-01T00:00:00.000Z' },
        { amount: 20000, status: 'paid', paidAt: '2026-11-20T00:00:00.000Z' },
      ],
    });
    const now = ranked([early, late], asOf);
    const then = ranked([early, late], new Date('2026-11-17T10:00:00.000Z'));
    const nowLate = now.find((row) => row.id === 'late')!;
    const thenLate = then.find((row) => row.id === 'late')!;
    expect(movement(nowLate.rank, thenLate.rank, new Date('2026-09-01T00:00:00.000Z'), new Date('2026-09-01T00:00:00.000Z'), asOf)).toEqual({ direction: 'up', places: thenLate.rank - nowLate.rank });
    expect(movement(1, null, new Date('2026-11-21T10:00:00.000Z'), new Date('2026-11-21T10:00:00.000Z'), asOf).direction).toBe('new');
  });

  it('ignores events dated after the score date', () => {
    const scored = scorePartner(partner('future', '2026-10-01T00:00:00.000Z', {
      clicks: [{ clickedAt: '2026-11-25T00:00:00.000Z' }],
      signUps: [{ lockedAt: '2026-11-25T00:00:00.000Z' }],
      commissions: [{ amount: 50000, status: 'approved', approvedAt: '2026-11-25T00:00:00.000Z' }],
      projects: [{ status: 'completed', createdAt: '2026-11-25T00:00:00.000Z', completedAt: '2026-11-25T00:00:00.000Z' }],
    }), asOf);
    expect(scored.parts.find((part) => part.key === 'visitors')?.points).toBe(0);
    expect(scored.parts.find((part) => part.key === 'signUps')?.points).toBe(0);
    expect(scored.parts.find((part) => part.key === 'commission')?.points).toBe(0);
    expect(scored.parts.find((part) => part.key === 'completed')?.points).toBe(0);
  });
});
