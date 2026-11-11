import { AdminService } from './admin.service';
import { MONEY_LABELS, PENDING_APPROVAL_MONEY_LABELS } from './money-labels';

const NOW = new Date();

function daysAgo(days: number): Date {
  return new Date(NOW.getTime() - days * 24 * 60 * 60 * 1000);
}

function job(overrides: Record<string, unknown> = {}) {
  return {
    id: 'job-1',
    name: 'Washing Machine Repair',
    status: 'active',
    archivedAt: null,
    updatedAt: daysAgo(1),
    budget: 1_400_000,
    riskLevel: 'low',
    needsExtraMonitoring: false,
    generalContractorId: 'gc-1',
    paymentConfirmationStatus: 'not_declared',
    paymentDeclaredAt: null,
    homeowner: { fullName: 'Example Homeowner A' },
    generalContractor: { fullName: 'Example Builders Ltd' },
    stages: [],
    payments: [],
    disputes: [],
    stageChangeRequests: [],
    ...overrides,
  };
}

describe('admin dashboard', () => {
  const prisma = {
    project: { findMany: jest.fn() },
    payment: { findMany: jest.fn() },
    stageMaterial: { findMany: jest.fn() },
    stageTeamMember: { findMany: jest.fn() },
    scamReport: { count: jest.fn() },
    listingReview: { count: jest.fn() },
    design: { count: jest.fn() },
    vendorProfile: { count: jest.fn() },
    professionalClaimRequest: { count: jest.fn() },
    artisanClaimRequest: { count: jest.fn() },
  };
  const contractorsService = { adminListUnverifiedGCs: jest.fn() };
  const notificationsService = { getMyNotifications: jest.fn() };
  const planFileHealthService = { scanMissingPlanFiles: jest.fn() };
  const emailService = {};

  let service: AdminService;

  beforeEach(() => {
    jest.clearAllMocks();
    prisma.project.findMany.mockResolvedValue([]);
    prisma.payment.findMany.mockImplementation(async (args: { where?: { status?: string } }) => {
      if (args?.where?.status === 'failed') return [];
      return [];
    });
    prisma.stageMaterial.findMany.mockResolvedValue([]);
    prisma.stageTeamMember.findMany.mockResolvedValue([]);
    prisma.scamReport.count.mockResolvedValue(0);
    prisma.listingReview.count.mockResolvedValue(0);
    prisma.design.count.mockResolvedValue(0);
    prisma.vendorProfile.count.mockResolvedValue(0);
    prisma.professionalClaimRequest.count.mockResolvedValue(0);
    prisma.artisanClaimRequest.count.mockResolvedValue(0);
    contractorsService.adminListUnverifiedGCs.mockResolvedValue([]);
    notificationsService.getMyNotifications.mockResolvedValue({ items: [] });
    planFileHealthService.scanMissingPlanFiles.mockResolvedValue([]);
    service = new AdminService(
      prisma as any,
      contractorsService as any,
      notificationsService as any,
      planFileHealthService as any,
      emailService as any,
    );
  });

  function load(projects: unknown[]) {
    prisma.project.findMany.mockResolvedValue(projects);
  }

  it('live jobs needing attention and the strip count use the same rule', async () => {
    load([
      job({ id: 'quiet', updatedAt: daysAgo(9), paymentConfirmationStatus: 'confirmed' }),
      job({ id: 'risky', riskLevel: 'high' }),
      job({ id: 'fine', name: 'On track' }),
    ]);
    const result = await service.getDashboard('admin-1');
    const needing = result.liveJobs.filter((item) => item.attention.length > 0);
    expect(result.strip.liveJobs.needAttention).toBe(needing.length);
    expect(needing.map((item) => item.id).sort()).toEqual(['quiet', 'risky']);
  });

  it('strip says zero need attention only when no live job has a reason', async () => {
    load([job({ id: 'fine' }), job({ id: 'also-fine', updatedAt: daysAgo(3) })]);
    const result = await service.getDashboard('admin-1');
    expect(result.liveJobs.every((item) => item.attention.length === 0)).toBe(true);
    expect(result.strip.liveJobs.needAttention).toBe(0);
  });

  it('dormant jobs are counted but never appear in the queues or live jobs', async () => {
    load([
      job({ id: 'old', name: 'Washing Machine Repair', updatedAt: daysAgo(40), homeowner: { fullName: 'Ada' } }),
      job({ id: 'live', name: 'Lekki duplex' }),
    ]);
    const result = await service.getDashboard('admin-1');
    expect(result.dormant.count).toBe(1);
    expect(result.dormant.examples[0].id).toBe('old');
    const queued = [...result.queue.money, ...result.queue.jobs].map((item) => item.projectId);
    expect(queued).not.toContain('old');
    expect(result.liveJobs.map((item) => item.id)).toEqual(['live']);
  });

  it('three jobs with the same name get three distinct queue ids and show homeowner names', async () => {
    load([
      job({ id: 'a', updatedAt: daysAgo(10), paymentConfirmationStatus: 'confirmed', homeowner: { fullName: 'Ada' } }),
      job({ id: 'b', updatedAt: daysAgo(12), paymentConfirmationStatus: 'confirmed', homeowner: { fullName: 'Bola' } }),
      job({ id: 'c', updatedAt: daysAgo(15), paymentConfirmationStatus: 'confirmed', homeowner: { fullName: 'Chioma' } }),
    ]);
    const result = await service.getDashboard('admin-1');
    const items = result.queue.jobs.filter((item) => item.kind === 'no_update');
    expect(items).toHaveLength(3);
    expect(new Set(items.map((item) => item.id)).size).toBe(3);
    expect(items.map((item) => item.homeownerName).sort()).toEqual(['Ada', 'Bola', 'Chioma']);
    expect(items.every((item) => item.detail.includes(String(item.homeownerName)))).toBe(true);
  });

  it('an overdue approval links to the exact stage page', async () => {
    load([
      job({
        id: 'lekki',
        stages: [{
          id: 'stage-2',
          name: 'Blockwork',
          status: 'pending_homeowner_approval',
          submittedForApprovalAt: daysAgo(4),
          approvalReminderCount: 3,
          order: 2,
        }],
      }),
    ]);
    const result = await service.getDashboard('admin-1');
    const item = result.queue.jobs.find((row) => row.kind === 'approval_overdue');
    expect(item?.href).toBe('/projects/lekki/stages/stage-2');
    expect(item?.detail).toContain('3 reminders sent');
  });

  it('a no update item links to the exact project page', async () => {
    load([job({ id: 'ikeja', updatedAt: daysAgo(9), paymentConfirmationStatus: 'confirmed' })]);
    const result = await service.getDashboard('admin-1');
    const item = result.queue.jobs.find((row) => row.kind === 'no_update');
    expect(item?.href).toBe('/projects/ikeja');
    expect(item?.actionLabel).toBe('Open job');
  });

  it('a declared payment becomes a Confirm item with no invented amount', async () => {
    load([
      job({
        id: 'lekki',
        paymentConfirmationStatus: 'declared',
        paymentDeclaredAt: daysAgo(2),
      }),
    ]);
    const result = await service.getDashboard('admin-1');
    const item = result.queue.money.find((row) => row.kind === 'payment_declared');
    expect(item?.actionLabel).toBe('Confirm');
    expect(item?.href).toBe('/projects/lekki');
    expect(item).not.toHaveProperty('amount');
    expect(JSON.stringify(item)).not.toMatch(/1800000|1,800,000/);
  });

  it('invoiced payout lines are grouped per stage with the summed amount', async () => {
    load([
      job({
        id: 'ajah',
        stages: [{
          id: 'stage-3',
          name: 'Roofing',
          status: 'in_progress',
          order: 3,
          materials: [
            { status: 'invoiced', totalPrice: 200_000, updatedAt: daysAgo(3) },
            { status: 'invoiced', totalPrice: 100_000, updatedAt: daysAgo(1) },
            { status: 'paid', payeeKind: 'shop', totalPrice: 50_000 },
          ],
          teamMembers: [{ payStatus: 'invoiced', paidAmount: 40_000, updatedAt: daysAgo(2) }],
        }],
      }),
    ]);
    const result = await service.getDashboard('admin-1');
    const items = result.queue.money.filter((row) => row.kind === 'invoiced_not_paid');
    expect(items).toHaveLength(1);
    expect(items[0].id).toBe('invoiced:stage-3');
    expect(items[0].amount).toBe(340_000);
    expect(items[0].count).toBe(3);
    expect(items[0].href).toBe('/projects/ajah/stages/stage-3');
    expect(items[0].title).toBe(PENDING_APPROVAL_MONEY_LABELS.invoicedNotPaid);
  });

  it('money in this week counts only completed payments inside the Lagos week', async () => {
    prisma.payment.findMany.mockImplementation(async (args: { where?: { status?: string; createdAt?: { gte: Date; lte: Date } } }) => {
      if (args?.where?.status === 'completed') {
        expect(args.where.createdAt?.gte).toBeInstanceOf(Date);
        expect(args.where.createdAt?.lte).toBeInstanceOf(Date);
        return [{ amount: 2_000_000, status: 'completed' }, { amount: 400_000, status: 'completed' }];
      }
      return [];
    });
    const result = await service.getDashboard('admin-1');
    const line = result.moneyThisWeek.lines.find((item) => item.key === 'moneyIn');
    expect(line?.amount).toBe(2_400_000);
    expect(result.strip.moneyIn.amount).toBe(2_400_000);
    expect(result.strip.moneyIn.count).toBe(2);
  });

  it('sent to contractor this week counts only artisan lines paid inside the week', async () => {
    prisma.stageMaterial.findMany.mockResolvedValue([
      { payeeKind: 'artisan', status: 'paid', totalPrice: 900_000 },
      { payeeKind: 'shop', status: 'paid', totalPrice: 410_000 },
      { payeeKind: 'other', status: 'paid', totalPrice: 15_000 },
    ]);
    const result = await service.getDashboard('admin-1');
    expect(result.moneyThisWeek.lines.find((item) => item.key === 'sentToContractor')?.amount).toBe(900_000);
    expect(result.moneyThisWeek.lines.find((item) => item.key === 'paidToShopsForMaterials')?.amount).toBe(410_000);
  });

  it('team lines paid by the GC are not counted as paid to team members', async () => {
    prisma.stageTeamMember.findMany.mockResolvedValue([
      { payStatus: 'paid', paidBy: 'bmh', paidAmount: 180_000 },
      { payStatus: 'paid', paidBy: 'gc', paidAmount: 999_000 },
    ]);
    const result = await service.getDashboard('admin-1');
    expect(result.moneyThisWeek.lines.find((item) => item.key === 'paidToTeamMembers')?.amount).toBe(180_000);
  });

  it('money this week uses the pending approval label constant for Received from homeowners and Invoiced, not yet paid', async () => {
    const result = await service.getDashboard('admin-1');
    const labels = result.moneyThisWeek.lines.map((item) => item.label);
    expect(labels).toContain(PENDING_APPROVAL_MONEY_LABELS.moneyIn);
    expect(labels).toContain(PENDING_APPROVAL_MONEY_LABELS.invoicedNotPaid);
    expect(labels).toContain(MONEY_LABELS.sentToContractor);
    expect(labels).toContain(MONEY_LABELS.paidToShopsForMaterials);
    expect(labels).toContain(MONEY_LABELS.paidToTeamMembers);
    expect(labels).toContain(MONEY_LABELS.stillWithBuildMyHouse);
  });

  it('trust rows with a zero count are left out', async () => {
    prisma.scamReport.count.mockResolvedValue(1);
    contractorsService.adminListUnverifiedGCs.mockResolvedValue([
      { hasUploadedAllVerificationDocuments: true },
      { hasUploadedAllVerificationDocuments: false },
    ]);
    const result = await service.getDashboard('admin-1');
    expect(result.trust.map((item) => item.kind)).toEqual(['scam_reports', 'gcs_ready']);
    expect(result.trust.find((item) => item.kind === 'gcs_ready')?.count).toBe(1);
  });

  it('activity drops bulk email and affiliate notifications and returns at most 5', async () => {
    const items = [
      ...['stage_media_added', 'stage_approved', 'manual_payment_declared', 'new_dispute', 'gc_accepted', 'project_completed'].map((type, index) => ({
        id: `note-${index}`,
        type,
        title: type,
        message: type,
        createdAt: new Date(NOW.getTime() - index * 1000),
        data: { projectId: 'lekki', stageId: index === 0 ? 'stage-1' : undefined },
      })),
      { id: 'bulk', type: 'bulk_email', title: 'Bulk', message: 'sent', createdAt: NOW, data: {} },
      { id: 'aff', type: 'affiliate_application', title: 'Affiliate', message: 'new', createdAt: NOW, data: { referrerId: 'ref-1' } },
    ];
    notificationsService.getMyNotifications.mockResolvedValue({ items });
    const result = await service.getDashboard('admin-1');
    expect(result.activity).toHaveLength(5);
    expect(result.activity.map((item) => item.type)).not.toContain('bulk_email');
    expect(result.activity.map((item) => item.type)).not.toContain('affiliate_application');
    expect(result.activity[0].link).toBe('/projects/lekki/stages/stage-1');
  });

  it('the response has no totalUsers, verifiedPercent, paymentsSuccessPercent or urgentDisputes fields', async () => {
    const result = await service.getDashboard('admin-1');
    const text = JSON.stringify(result);
    expect(text).not.toContain('totalUsers');
    expect(text).not.toContain('verifiedPercent');
    expect(text).not.toContain('paymentsSuccessPercent');
    expect(text).not.toContain('urgentDisputes');
    expect(result).not.toHaveProperty('stats');
    expect(result).not.toHaveProperty('criticalAlerts');
  });

  it('no label in the response contains a blocked money word', async () => {
    load([
      job({
        paymentConfirmationStatus: 'declared',
        paymentDeclaredAt: daysAgo(1),
        stages: [{ id: 'stage-1', status: 'in_progress', materials: [{ status: 'invoiced', totalPrice: 10, updatedAt: daysAgo(1) }] }],
      }),
    ]);
    const result = await service.getDashboard('admin-1');
    const text = JSON.stringify(result).toLowerCase();
    const blocked = ['esc' + 'row', 'wa' + 'iting'];
    for (const word of blocked) expect(text).not.toContain(word);
    expect(text).not.toMatch(new RegExp('\\b' + 'he' + 'ld' + '\\b'));
  });
});
