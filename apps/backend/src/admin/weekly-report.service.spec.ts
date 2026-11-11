import { lagosWeekFromIso } from './lagos-week';
import { MONEY_LABELS, PENDING_APPROVAL_MONEY_LABELS } from './money-labels';
import { PHOTO_TRACKING_MIGRATION, REPORT_TRACKING_MIGRATION, WeeklyReportService } from './weekly-report.service';

const WEEK = lagosWeekFromIso('2026-10-05');

function prismaDouble() {
  const store: Record<string, { findMany: jest.Mock; count: jest.Mock }> = {};
  const query = jest.fn().mockResolvedValue([{ finished_at: new Date('2020-01-01T00:00:00.000Z') }]);
  const prisma = new Proxy({ $queryRawUnsafe: query }, {
    get(target, prop: string) {
      if (prop in target) return (target as any)[prop];
      if (!store[prop]) {
        store[prop] = {
          findMany: jest.fn().mockResolvedValue([]),
          count: jest.fn().mockResolvedValue(0),
        };
      }
      return store[prop];
    },
  });
  return { prisma, query, store };
}

function serviceFor(prisma: object) {
  return new WeeklyReportService(
    prisma as any,
    { adminListUnverifiedGCs: jest.fn().mockResolvedValue([]) } as any,
    { scanMissingPlanFiles: jest.fn().mockResolvedValue([]) } as any,
  );
}

function project(overrides: Record<string, unknown> = {}) {
  return {
    id: 'job-1',
    name: 'Lekki duplex',
    status: 'active',
    archivedAt: null,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-10-01T00:00:00.000Z'),
    budget: 1000,
    generalContractorId: 'gc-1',
    paymentConfirmationStatus: 'not_declared',
    homeowner: { fullName: 'Ada' },
    generalContractor: { fullName: 'Example GC' },
    stages: [],
    payments: [],
    disputes: [],
    ...overrides,
  };
}

describe('weekly report service', () => {
  function datesFor(name: string) {
    if (name === PHOTO_TRACKING_MIGRATION) return new Date('2026-11-01T00:00:00.000Z');
    if (name === REPORT_TRACKING_MIGRATION) return new Date('2026-11-20T00:00:00.000Z');
    return null;
  }

  it('a week that ended before the tracking migration shows not tracked before the date for invoicedAt, verifiedAt and confirmedBy lines', async () => {
    const { prisma, query } = prismaDouble();
    query.mockImplementation(async (_sql: string, name: string) => {
      const finished = datesFor(name);
      return finished ? [{ finished_at: finished }] : [];
    });
    const report = await serviceFor(prisma).buildReport(WEEK);
    for (const key of ['invoiced_oldest_days', 'gcs_verified', 'payments_confirmed_by']) {
      const row = report.sections.flatMap((section) => section.lines).find((line) => line.key === key);
      expect(row?.status).toBe('not_tracked');
      expect(row?.value).toBeNull();
      expect(row?.note).toContain('Not tracked before');
      expect(row?.note).not.toBe('0');
    }
  });

  it('a week that spans the migration date shows the value as partial with tracked from the date', async () => {
    const { prisma, query } = prismaDouble();
    const started = new Date('2026-10-07T12:00:00.000Z');
    query.mockResolvedValue([{ finished_at: started }]);
    const report = await serviceFor(prisma).buildReport(WEEK);
    const row = report.sections.flatMap((section) => section.lines).find((line) => line.key === 'gcs_verified');
    expect(row?.status).toBe('partial');
    expect(row?.note).toContain('Tracked from');
  });

  it('a missing migration row shows not tracked yet and never a zero', async () => {
    const { prisma, query } = prismaDouble();
    query.mockResolvedValue([]);
    (prisma as any).contractor.count.mockResolvedValue(4);
    const report = await serviceFor(prisma).buildReport(WEEK);
    const row = report.sections.flatMap((section) => section.lines).find((line) => line.key === 'gcs_verified');
    expect(row?.status).toBe('not_tracked');
    expect(row?.value).toBeNull();
    expect(row?.note).toBe('Not tracked yet');
  });

  it('photo lines use the stage media provenance migration date', async () => {
    const { prisma, query } = prismaDouble();
    query.mockImplementation(async (_sql: string, name: string) => [{ finished_at: datesFor(name) }]);
    const report = await serviceFor(prisma).buildReport(WEEK);
    const photo = report.sections.flatMap((section) => section.lines).find((line) => line.key === 'photos_on_site');
    const verified = report.sections.flatMap((section) => section.lines).find((line) => line.key === 'gcs_verified');
    expect(photo?.note).toContain('1 Nov 2026');
    expect(verified?.note).toContain('20 Nov 2026');
    expect(photo?.note).not.toContain('20 Nov 2026');
  });

  it('money in counts completed payments inside the Lagos week only', async () => {
    const { prisma } = prismaDouble();
    (prisma as any).payment.findMany.mockResolvedValue([
      { amount: 200, status: 'completed', createdAt: WEEK.start, confirmedById: null },
      { amount: 50, status: 'completed', createdAt: new Date('2020-01-01T00:00:00.000Z'), confirmedById: null },
      { amount: 9, status: 'failed', createdAt: WEEK.start, confirmedById: null },
    ]);
    const report = await serviceFor(prisma).buildReport(WEEK);
    const row = report.sections.flatMap((section) => section.lines).find((line) => line.key === 'money_in');
    expect(row?.value).toBe(200);
  });

  it('paid to team members excludes lines paid by the GC', async () => {
    const { prisma } = prismaDouble();
    (prisma as any).stageTeamMember.findMany.mockResolvedValue([
      { payStatus: 'paid', paidBy: 'bmh', paidAmount: 80, paidAt: WEEK.start },
      { payStatus: 'paid', paidBy: 'gc', paidAmount: 500, paidAt: WEEK.start },
    ]);
    const report = await serviceFor(prisma).buildReport(WEEK);
    const row = report.sections.flatMap((section) => section.lines).find((line) => line.key === 'paid_to_team');
    expect(row?.value).toBe(80);
  });

  it('money labels come from MONEY_LABELS and PENDING_APPROVAL_MONEY_LABELS', async () => {
    const { prisma } = prismaDouble();
    const report = await serviceFor(prisma).buildReport(WEEK);
    const labels = report.sections.flatMap((section) => section.lines).map((line) => line.label);
    expect(labels).toContain(PENDING_APPROVAL_MONEY_LABELS.moneyIn);
    expect(labels).toContain(PENDING_APPROVAL_MONEY_LABELS.invoicedNotPaid);
    expect(labels).toContain(MONEY_LABELS.sentToContractor);
    expect(labels).toContain(MONEY_LABELS.paidToShopsForMaterials);
    expect(labels).toContain(MONEY_LABELS.paidToTeamMembers);
    expect(labels).toContain(MONEY_LABELS.stillWithBuildMyHouse);
  });

  it('dormant jobs are counted with the dashboard rule and a job with confirmed money is never dormant', async () => {
    const { prisma } = prismaDouble();
    (prisma as any).project.findMany.mockResolvedValue([
      project({ id: 'old', updatedAt: new Date('2026-01-01T00:00:00.000Z') }),
      project({ id: 'paid', updatedAt: new Date('2025-01-01T00:00:00.000Z'), paymentConfirmationStatus: 'confirmed' }),
    ]);
    const report = await serviceFor(prisma).buildReport(WEEK);
    const dormant = report.sections.flatMap((section) => section.lines).find((line) => line.key === 'dormant_jobs');
    expect(dormant?.value).toBe(1);
    expect(report.jobs.map((job) => job.projectId)).toContain('paid');
    expect(report.jobs.find((job) => job.projectId === 'paid')?.dormant).toBe(false);
  });

  it('median days to approval is null with a note when nothing was approved', async () => {
    const { prisma } = prismaDouble();
    const report = await serviceFor(prisma).buildReport(WEEK);
    const row = report.sections.flatMap((section) => section.lines).find((line) => line.key === 'median_days_to_approval');
    expect(row?.value).toBeNull();
    expect(row?.status).toBe('ok');
    expect(row?.note).toBe('No approvals this week');
  });

  it('scam report lines are counts only with no text, reporter or listing', async () => {
    const { prisma } = prismaDouble();
    (prisma as any).scamReport.findMany = jest.fn().mockResolvedValue([{ whatHappened: 'SECRET_STORY_ZX91', reporterUserId: 'secret-user' }]);
    (prisma as any).scamReport.count.mockResolvedValue(2);
    const report = await serviceFor(prisma).buildReport(WEEK);
    const text = JSON.stringify(report);
    expect(text).not.toContain('SECRET_STORY_ZX91');
    expect(text).not.toContain('secret-user');
    expect(report.sections.find((section) => section.key === 'trust')?.lines.find((line) => line.key === 'scam_reports_new')?.value).toBe(2);
  });

  it('no label or note contains a blocked money word', async () => {
    const { prisma } = prismaDouble();
    const report = await serviceFor(prisma).buildReport(WEEK);
    const text = JSON.stringify(report).toLowerCase();
    expect(text).not.toContain('esc' + 'row');
    expect(text).not.toContain('wa' + 'iting');
    expect(text).not.toMatch(new RegExp('\\b' + 'he' + 'ld' + '\\b'));
  });
});
