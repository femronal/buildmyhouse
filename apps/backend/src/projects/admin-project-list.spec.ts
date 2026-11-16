import { ProjectsService } from './projects.service';

function buildService() {
  const prisma: any = {
    project: { findMany: jest.fn() },
  };
  const service = new ProjectsService(
    {} as any,
    {} as any,
    {} as any,
    { get: () => undefined } as any,
    {} as any,
    {} as any,
  );
  (service as any).prisma = prisma;
  return { service, prisma };
}

const day = 24 * 60 * 60 * 1000;

describe('admin project list attention', () => {
  it('keeps a paid quiet job out of dormant, marks an unmatched draft dormant, and flags 8 quiet days', async () => {
    const { service, prisma } = buildService();
    const now = Date.now();
    prisma.project.findMany.mockResolvedValue([
      {
        id: '11111111-2222-3333-4444-555555555555',
        name: 'Paid quiet job',
        status: 'active',
        archivedAt: null,
        updatedAt: new Date(now - 60 * day),
        generalContractorId: 'gc-1',
        paymentConfirmationStatus: 'not_declared',
        budget: 1000,
        payments: [{ id: 'pay-1', amount: 1000, status: 'completed', method: 'manual', createdAt: new Date(now - 60 * day) }],
        disputes: [],
        stages: [{ id: 's1', status: 'in_progress', order: 0, updatedAt: new Date(now - 60 * day), media: [{ id: 'm1', createdAt: new Date(now - 60 * day) }] }],
        projectRequests: [],
      },
      {
        id: 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
        name: 'Draft with no GC',
        status: 'draft',
        archivedAt: null,
        updatedAt: new Date(now),
        generalContractorId: null,
        paymentConfirmationStatus: 'not_declared',
        budget: 0,
        payments: [],
        disputes: [],
        stages: [],
        projectRequests: [],
      },
      {
        id: '99999999-8888-7777-6666-555555555555',
        name: 'Quiet active job',
        status: 'active',
        archivedAt: null,
        updatedAt: new Date(now - 8 * day),
        generalContractorId: 'gc-2',
        paymentConfirmationStatus: 'not_declared',
        riskLevel: 'low',
        needsExtraMonitoring: false,
        budget: 500,
        payments: [],
        disputes: [],
        stages: [],
        projectRequests: [],
      },
    ]);

    const rows = await service.getAllProjects(undefined, true);

    expect(rows[0].attention.dormant).toBe(false);
    expect(rows[1].attention.dormant).toBe(true);
    expect(rows[2].attention.reasons).toContain('no_update');
    for (const row of rows) {
      expect(row.paymentRef.startsWith('BMH-PAY-')).toBe(true);
      expect(Object.prototype.hasOwnProperty.call(row, 'payments')).toBe(false);
      expect(Object.prototype.hasOwnProperty.call(row, 'disputes')).toBe(false);
      for (const stage of row.stages || []) {
        expect(Object.prototype.hasOwnProperty.call(stage, 'media')).toBe(false);
      }
    }
  });
});
