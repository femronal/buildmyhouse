import { buildMoneyBarLabel, buildMoneyBreakdown } from './money-breakdown';

const washingMachine = {
  hasHomeownerReceipts: true,
  youSentIn: 19500,
  stillWithBuildMyHouse: 14500,
  sentToContractor: 0,
  paidToShopsForMaterials: 3000,
  paidToTeamMembers: 2000,
};

describe('buildMoneyBreakdown', () => {
  it('turns the washing machine receipts into 75, 0, 15 and 10', () => {
    const breakdown = buildMoneyBreakdown(washingMachine);
    expect(breakdown.segments.map((segment) => segment.pct)).toEqual([75, 0, 15, 10]);
    expect(breakdown.segments.reduce((sum, segment) => sum + segment.widthPct, 0)).toBeCloseTo(100, 5);
    expect(breakdown.showBar).toBe(true);
    expect(breakdown.overPaid).toBe(false);
    expect(buildMoneyBarLabel(breakdown)).toBe(
      'Of ₦19,500 you sent in: 75% still with BuildMyHouse, 0% sent to your contractor, 15% paid to shops for materials, 10% paid to team members',
    );
  });

  it('uses money already paid out when there are no receipts', () => {
    const breakdown = buildMoneyBreakdown({
      hasHomeownerReceipts: false,
      youSentIn: 0,
      stillWithBuildMyHouse: 0,
      sentToContractor: 4000,
      paidToShopsForMaterials: 1000,
      paidToTeamMembers: 0,
    });
    expect(breakdown.base).toBe(5000);
    expect(breakdown.mode).toBe('moved');
    expect(breakdown.segments[0].pct).toBeNull();
    expect(breakdown.segments[0].widthPct).toBe(0);
    expect(breakdown.segments.slice(1).map((segment) => segment.pct)).toEqual([80, 20, 0]);
    expect(breakdown.showBar).toBe(true);
  });

  it('hides the bar when nothing has been recorded', () => {
    const breakdown = buildMoneyBreakdown({
      hasHomeownerReceipts: false,
      youSentIn: null,
      sentToContractor: 0,
      paidToShopsForMaterials: 0,
      paidToTeamMembers: 0,
    });
    expect(breakdown.showBar).toBe(false);
    expect(breakdown.mode).toBe('empty');
    expect(breakdown.segments.every((segment) => segment.widthPct === 0)).toBe(true);
  });

  it('caps the bar when payouts are higher than the receipts', () => {
    const breakdown = buildMoneyBreakdown({
      hasHomeownerReceipts: true,
      youSentIn: 10000,
      stillWithBuildMyHouse: 5000,
      sentToContractor: 8000,
      paidToShopsForMaterials: 4000,
      paidToTeamMembers: 0,
    });
    expect(breakdown.overPaid).toBe(true);
    expect(breakdown.segments[0].amount).toBe(0);
    expect(breakdown.segments[0].widthPct).toBe(0);
    const numeric = breakdown.segments.map((segment) => segment.pct || 0);
    expect(numeric.reduce((sum, value) => sum + value, 0)).toBe(100);
    expect(numeric[0]).toBe(0);
  });

  it('keeps whole percents at 100 whenever there is a base', () => {
    const breakdown = buildMoneyBreakdown({
      hasHomeownerReceipts: true,
      youSentIn: 1000,
      stillWithBuildMyHouse: 333,
      sentToContractor: 333,
      paidToShopsForMaterials: 334,
      paidToTeamMembers: 0,
    });
    const numeric = breakdown.segments.map((segment) => segment.pct || 0);
    expect(numeric.reduce((sum, value) => sum + value, 0)).toBe(100);
  });

  it('treats negative amounts as zero', () => {
    const breakdown = buildMoneyBreakdown({
      hasHomeownerReceipts: true,
      youSentIn: 1000,
      stillWithBuildMyHouse: -20,
      sentToContractor: -5,
      paidToShopsForMaterials: 1000,
      paidToTeamMembers: 0,
    });
    expect(breakdown.segments[0].amount).toBe(0);
    expect(breakdown.segments[1].amount).toBe(0);
  });
});
