import { ON_SITE_RADIUS_METERS } from '../stages/stage-media-provenance';
import {
  attentionReasons,
  hasConfirmedMoney,
  isDormant,
  isLiveJob,
  lastActivityAt,
  type DashboardProject,
} from './dashboard-rules';

const NOW = new Date('2026-11-10T12:00:00.000Z');

function daysAgo(days: number): Date {
  return new Date(NOW.getTime() - days * 24 * 60 * 60 * 1000);
}

function project(overrides: Partial<DashboardProject> = {}): DashboardProject {
  return {
    id: 'project-1',
    name: 'Lekki duplex',
    status: 'active',
    archivedAt: null,
    updatedAt: daysAgo(1),
    generalContractorId: 'gc-1',
    paymentConfirmationStatus: 'not_declared',
    budget: 1000,
    stages: [],
    payments: [],
    disputes: [],
    ...overrides,
  };
}

describe('dashboard rules', () => {
  it('last activity is the latest of project update, stage update and photo upload', () => {
    const row = project({
      updatedAt: daysAgo(3),
      stages: [
        {
          id: 'stage-1',
          updatedAt: daysAgo(2),
          media: [{ createdAt: daysAgo(0) }],
        },
      ],
    });
    expect(lastActivityAt(row).toISOString()).toBe(daysAgo(0).toISOString());
  });

  it('a job with a confirmed payment status has confirmed money', () => {
    expect(hasConfirmedMoney(project({ paymentConfirmationStatus: 'confirmed', payments: [] }))).toBe(true);
  });

  it('a job with one completed payment row has confirmed money', () => {
    expect(hasConfirmedMoney(project({ payments: [{ status: 'completed', amount: 10 }] }))).toBe(true);
  });

  it('no money and 28 days without an update is dormant', () => {
    expect(isDormant(project({ updatedAt: daysAgo(28) }), NOW)).toBe(true);
  });

  it('no money and 27 days without an update is not dormant', () => {
    expect(isDormant(project({ updatedAt: daysAgo(27) }), NOW)).toBe(false);
  });

  it('no money and no GC is dormant even when updated today', () => {
    expect(isDormant(project({ generalContractorId: null, updatedAt: NOW }), NOW)).toBe(true);
  });

  it('a job with confirmed money is never dormant even after 200 days', () => {
    const row = project({
      updatedAt: daysAgo(200),
      paymentConfirmationStatus: 'confirmed',
    });
    expect(isDormant(row, NOW)).toBe(false);
  });

  it('a dormant job is not a live job and has no attention reasons', () => {
    const row = project({ updatedAt: daysAgo(40), riskLevel: 'high', needsExtraMonitoring: true });
    expect(isDormant(row, NOW)).toBe(true);
    expect(isLiveJob(row, NOW)).toBe(false);
    expect(attentionReasons(row, NOW)).toEqual([]);
  });

  it('7 days without an update gives no_update', () => {
    expect(attentionReasons(project({ updatedAt: daysAgo(7) }), NOW)).toContain('no_update');
  });

  it('6 days without an update gives no reason', () => {
    expect(attentionReasons(project({ updatedAt: daysAgo(6) }), NOW)).toEqual([]);
  });

  it('high risk level gives high_risk', () => {
    expect(attentionReasons(project({ riskLevel: 'high' }), NOW)).toContain('high_risk');
  });

  it('an in_review dispute gives open_dispute', () => {
    const row = project({ disputes: [{ id: 'dispute-1', status: 'in_review', createdAt: daysAgo(1) }] });
    expect(attentionReasons(row, NOW)).toContain('open_dispute');
  });

  it('a stage submitted for approval 2 days ago gives approval_overdue and 1 day ago does not', () => {
    const overdue = project({
      stages: [{ id: 'stage-1', status: 'pending_homeowner_approval', submittedForApprovalAt: daysAgo(2) }],
    });
    const recent = project({
      stages: [{ id: 'stage-1', status: 'pending_homeowner_approval', submittedForApprovalAt: daysAgo(1) }],
    });
    expect(attentionReasons(overdue, NOW)).toContain('approval_overdue');
    expect(attentionReasons(recent, NOW)).not.toContain('approval_overdue');
  });

  it('a reused photo on an unfinished stage gives flagged_photo', () => {
    const row = project({
      stages: [{ id: 'stage-1', status: 'in_progress', media: [{ duplicateOfMediaId: 'other', distanceFromSiteMeters: 10 }] }],
    });
    expect(attentionReasons(row, NOW)).toContain('flagged_photo');
  });

  it('a photo farther than ON_SITE_RADIUS_METERS gives flagged_photo', () => {
    const row = project({
      stages: [{
        id: 'stage-1',
        status: 'in_progress',
        media: [{ distanceFromSiteMeters: ON_SITE_RADIUS_METERS + 1 }],
      }],
    });
    expect(attentionReasons(row, NOW)).toContain('flagged_photo');
  });

  it('flagged photos on a completed stage are ignored', () => {
    const row = project({
      stages: [{
        id: 'stage-1',
        status: 'completed',
        media: [{ duplicateOfMediaId: 'other', distanceFromSiteMeters: ON_SITE_RADIUS_METERS + 50 }],
      }],
    });
    expect(attentionReasons(row, NOW)).not.toContain('flagged_photo');
  });

  it('needsExtraMonitoring gives extra_monitoring', () => {
    expect(attentionReasons(project({ needsExtraMonitoring: true }), NOW)).toContain('extra_monitoring');
  });
});
