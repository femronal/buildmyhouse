import {
  PARTNERSHIP_STAGES,
  allowedStageMoves,
  canMoveStage,
  daysSinceLastContact,
  findDuplicate,
  followUpStatus,
  nextStep,
  nurtureCheckDue,
  playbookDueIso,
  sheetsSerialToDate,
  toE164Nigeria,
} from './partnership-math';

const today = '2026-11-30';
const generous = { hasMeeting: true, hasHeldMeeting: true, hasLinkedPartner: true, hasManage: true, reason: 'A written reason', viaFirstOutreach: true };

describe('partnership math', () => {
  it('marks a day 0 lead overdue when the last contact was 5 days ago and there is no override', () => {
    const last = new Date('2026-11-25T11:00:00.000Z');
    const due = playbookDueIso(last, 'day_0');
    expect(due).toBe('2026-11-29');
    expect(followUpStatus('initial_outreach', due, today)).toBe('overdue');
  });

  it('keeps a dormant lead dormant and flags a nurture check when the date has passed', () => {
    expect(followUpStatus('dormant', '2026-11-01', today)).toBe('dormant');
    expect(nurtureCheckDue('dormant', '2026-11-01', today)).toBe(true);
    expect(nurtureCheckDue('initial_outreach', '2026-11-01', today)).toBe(false);
  });

  it('keeps a closed lead closed', () => {
    expect(followUpStatus('closed_not_interested', '2026-11-01', today)).toBe('closed');
    expect(nurtureCheckDue('closed_poor_fit', '2026-11-01', today)).toBe(false);
  });

  it('gives pilot evaluation no due date', () => {
    expect(playbookDueIso(new Date('2026-11-20T11:00:00.000Z'), 'pilot_evaluation')).toBeNull();
    expect(followUpStatus('pilot_candidate', null, today)).toBe('no_date');
  });

  it('never returns a negative number of days when the last contact is after today', () => {
    expect(daysSinceLastContact(new Date('2026-12-02T11:00:00.000Z'), today)).toBe(0);
    expect(daysSinceLastContact(null, today)).toBeNull();
  });

  it('parses a Sheets serial into a real date', () => {
    const iso = sheetsSerialToDate(46285);
    expect(iso).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    const parsed = new Date(`${iso}T12:00:00+01:00`);
    expect(Number.isNaN(parsed.getTime())).toBe(false);
    expect(iso).toBe('2026-09-20');
  });

  it('normalises Nigerian phone numbers from the sheet', () => {
    expect(toE164Nigeria("'+234 806 000 0000")).toBe('+2348060000000');
    expect(toE164Nigeria('=2348100000000')).toBe('+2348100000000');
    expect(toE164Nigeria('not a phone')).toBeNull();
  });

  it('rejects every stage move that the table does not allow', () => {
    for (const from of PARTNERSHIP_STAGES) {
      const allowed = new Set(allowedStageMoves(from));
      for (const to of PARTNERSHIP_STAGES) {
        if (from === to) continue;
        const result = canMoveStage(from, to, generous);
        if (allowed.has(to)) expect(result.ok).toBe(true);
        else expect(result.ok).toBe(false);
      }
    }
    expect(canMoveStage('researching', 'initial_outreach', {}).ok).toBe(false);
    expect(canMoveStage('initial_outreach', 'conversation_booked', {}).ok).toBe(false);
    expect(canMoveStage('conversation_booked', 'evaluation_completed', { hasMeeting: true }).ok).toBe(false);
    expect(canMoveStage('pilot_active', 'active_partner', {}).ok).toBe(false);
    expect(canMoveStage('active_partner', 'dormant', {}).ok).toBe(false);
    expect(canMoveStage('dormant', 'initial_outreach', {}).ok).toBe(false);
    expect(canMoveStage('closed_not_interested', 'dormant', { reason: 'They asked again' }).ok).toBe(false);
  });

  it('walks the playbook forward and stops at day 90 and pilot evaluation', () => {
    expect(nextStep('day_0')).toBe('day_4');
    expect(nextStep('day_90')).toBe('day_90');
    expect(nextStep('pilot_evaluation')).toBe('pilot_evaluation');
  });

  it('blocks on email or website and only warns on the company name', () => {
    const existing = [{ id: 'a', leadRef: 'PL-0001', companyNameNormalised: 'test qs', websiteDomain: 'testqs.example', emails: ['ada@example.test'] }];
    expect(findDuplicate({ email: 'Ada@example.test' }, existing)?.kind).toBe('email');
    expect(findDuplicate({ domain: 'https://www.testqs.example/about' }, existing)?.kind).toBe('domain');
    expect(findDuplicate({ companyName: 'Test QS Ltd' }, existing)?.kind).toBe('name');
    expect(findDuplicate({ companyName: 'Another Firm' }, existing)).toBeNull();
  });
});
