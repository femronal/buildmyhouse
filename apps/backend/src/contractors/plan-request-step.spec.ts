import { getPlanRequestStep } from './plan-request-step';

const project = { designId: 'design-1' };

describe('getPlanRequestStep', () => {
  const sentAt = new Date('2026-10-20T10:00:00.000Z');

  it('starts on step 1 for the contractor', () => {
    const step = getPlanRequestStep({ status: 'pending', sentAt }, project, 'gc', new Date('2026-10-20T12:00:00.000Z'));
    expect(step.step).toBe(1);
    expect(step.state).toBe('current');
    expect(getPlanRequestStep({ status: 'pending', sentAt }, project, 'homeowner', new Date('2026-10-20T12:00:00.000Z')).state).toBe('waiting_other_side');
  });

  it('waits for the homeowner after contact', () => {
    const step = getPlanRequestStep(
      { status: 'pending', sentAt, contactedAt: new Date('2026-10-20T11:00:00.000Z') },
      project,
      'homeowner',
      new Date('2026-10-20T12:00:00.000Z'),
    );
    expect(step.step).toBe(2);
    expect(step.state).toBe('current');
  });

  it('marks a step late after 48 hours', () => {
    const step = getPlanRequestStep(
      { status: 'pending', sentAt },
      project,
      'gc',
      new Date('2026-10-22T11:00:00.000Z'),
    );
    expect(step.state).toBe('late');
  });

  it('returns declined when the contractor rejects', () => {
    const step = getPlanRequestStep(
      { status: 'rejected', sentAt, declineReason: 'Busy' },
      project,
      'homeowner',
    );
    expect(step.state).toBe('declined');
  });

  it('lets the contractor accept the job only after a fair check', () => {
    const ready = {
      status: 'pending',
      sentAt,
      contactedAt: sentAt,
      homeownerConfirmedContactAt: sentAt,
      inspectedAt: sentAt,
      homeownerConfirmedInspectionAt: sentAt,
      quoteGeneratedAt: sentAt,
      homeownerAcceptedQuoteAt: sentAt,
      bmhCheckResult: 'fair',
      bmhCheckAt: sentAt,
    };
    const waiting = getPlanRequestStep(ready, project, 'gc', new Date('2026-10-20T12:00:00.000Z'));
    expect(waiting.step).toBe(6);
    expect(waiting.actor).toBe('gc');
    const accepted = getPlanRequestStep(
      { ...ready, status: 'accepted', respondedAt: sentAt },
      project,
      'homeowner',
      new Date('2026-10-20T12:00:00.000Z'),
    );
    expect(accepted.step).toBe(6);
    expect(accepted.state).toBe('done');
  });

  it('sends a failed quote check back to the contractor', () => {
    const step = getPlanRequestStep(
      {
        status: 'pending',
        sentAt,
        contactedAt: sentAt,
        homeownerConfirmedContactAt: sentAt,
        inspectedAt: sentAt,
        homeownerConfirmedInspectionAt: sentAt,
        quoteGeneratedAt: sentAt,
        bmhCheckResult: 'too_high',
        bmhCheckAt: sentAt,
      },
      project,
      'gc',
      new Date('2026-10-20T12:00:00.000Z'),
    );
    expect(step.step).toBe(4);
    expect(step.actor).toBe('gc');
  });
});
