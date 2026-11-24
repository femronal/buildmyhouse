import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';
import { buildPartnershipCounts } from './partnership-metrics';

describe('partnership counts', () => {
  it('matches a hand count and the four groups add up to the pipeline', () => {
    const now = new Date('2026-11-30T12:00:00.000Z');
    const past = new Date('2026-11-20T11:00:00.000Z');
    const leads = [
      { archivedAt: null, stage: 'initial_outreach', followUpStep: 'day_0', lastContactAt: past, nextFollowUpOverride: null, temperature: 'warm', meetings: [] },
      { archivedAt: null, stage: 'gatekeeper', followUpStep: 'day_4', lastContactAt: new Date('2026-11-24T11:00:00.000Z'), nextFollowUpOverride: null, temperature: 'cold', meetings: [] },
      { archivedAt: null, stage: 'pilot_candidate', followUpStep: 'pilot_evaluation', lastContactAt: past, nextFollowUpOverride: null, temperature: 'engaged', meetings: [] },
      { archivedAt: null, stage: 'pilot_candidate', followUpStep: 'pilot_evaluation', lastContactAt: past, nextFollowUpOverride: null, temperature: null, meetings: [{ status: 'booked', startsAt: new Date('2026-12-02T10:00:00.000Z') }] },
      { archivedAt: null, stage: 'dormant', followUpStep: 'day_60', lastContactAt: past, nextFollowUpOverride: new Date('2026-11-01T00:00:00.000Z'), temperature: 'dormant', meetings: [] },
      { archivedAt: null, stage: 'closed_not_interested', followUpStep: 'day_0', lastContactAt: past, nextFollowUpOverride: null, temperature: null, meetings: [] },
      { archivedAt: null, stage: 'active_partner', followUpStep: 'day_90', lastContactAt: past, nextFollowUpOverride: null, temperature: 'strong', meetings: [] },
      { archivedAt: null, stage: 'conversation_booked', followUpStep: 'day_10', lastContactAt: new Date('2026-11-28T11:00:00.000Z'), nextFollowUpOverride: null, temperature: 'aware', meetings: [] },
      { archivedAt: new Date(), stage: 'initial_outreach', followUpStep: 'day_0', lastContactAt: past, nextFollowUpOverride: null, temperature: 'warm', meetings: [] },
    ];
    const counts = buildPartnershipCounts(leads, now);
    expect(counts.pipeline).toBe(8);
    expect(counts.open + counts.dormant + counts.closed + counts.partner).toBe(counts.pipeline);
    expect(counts.overdue).toBe(1);
    expect(counts.dueToday).toBe(1);
    expect(counts.actionRequired).toBe(2);
    expect(counts.pilotCandidates).toBe(2);
    expect(counts.pilotsNeedingMeeting).toBe(1);
    expect(counts.dormant).toBe(1);
    expect(counts.closed).toBe(1);
    expect(counts.partner).toBe(1);
    expect(counts.open).toBe(5);
    expect(counts.nurtureChecks).toBe(1);
    expect(counts.today.conversationsBooked).toBe(1);
    expect(counts.today.warmOrBetter).toBe(3);
  });
});

describe('partner panel rate text', () => {
  it('does not keep a rate constant in the tracker code', () => {
    const files = readdirSync(__dirname).filter((file) => file.endsWith('.ts') && !file.endsWith('.spec.ts'));
    for (const file of files) {
      const text = readFileSync(join(__dirname, file), 'utf8');
      expect(text.includes('0.025')).toBe(false);
      expect(text.includes('2.5')).toBe(false);
      expect(/\b250\b/.test(text)).toBe(false);
    }
  });
});
