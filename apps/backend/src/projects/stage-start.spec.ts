import { buildStageStart, nextStageToStart, readStageStartRequests, withStageStartRequest } from './stage-start';

const stages = [
  { id: 's1', name: 'Inspection', status: 'completed', order: 1 },
  { id: 's2', name: 'Scope', status: 'completed', order: 2 },
  { id: 's3', name: 'Part Procurement', status: 'not_started', order: 3 },
  { id: 's4', name: 'Repair', status: 'not_started', order: 4 },
];

describe('stage start', () => {
  it('waits on the next stage after the approved ones', () => {
    expect(nextStageToStart(stages)?.stage.id).toBe('s3');
    const view = buildStageStart({
      paymentModel: 'pay_by_stage',
      stages,
      deposits: [10500, 4500, 7500, 20000],
      totalPayable: 42500,
      received: 15000,
      requests: {},
    });
    expect(view).toMatchObject({
      stageId: 's3',
      stageName: 'Part Procurement',
      amountDue: 7500,
      funded: false,
      requestedAt: null,
    });
  });

  it('treats the next stage as funded once its deposit is covered', () => {
    const view = buildStageStart({
      paymentModel: 'pay_by_stage',
      stages,
      deposits: [10500, 4500, 7500, 20000],
      totalPayable: 42500,
      received: 22500,
      requests: { s3: { requestedAt: '2026-10-26T00:00:00.000Z' } },
    });
    expect(view?.funded).toBe(true);
    expect(view?.requestedAt).toBe('2026-10-26T00:00:00.000Z');
  });

  it('does not offer a new stage while one is still open', () => {
    expect(nextStageToStart([
      { id: 's1', status: 'completed', order: 1 },
      { id: 's2', status: 'in_progress', order: 2 },
      { id: 's3', status: 'not_started', order: 3 },
    ])).toBeNull();
  });

  it('keeps a funding request on the project without dropping other notes', () => {
    const next = withStageStartRequest({ summary: 'keep' }, 's3', { requestedAt: '2026-10-26T00:00:00.000Z' });
    expect(next.summary).toBe('keep');
    expect(readStageStartRequests(next).s3.requestedAt).toBe('2026-10-26T00:00:00.000Z');
    const again = withStageStartRequest(next, 's3', { homeownerReadyAt: '2026-10-26T01:00:00.000Z' });
    expect(readStageStartRequests(again).s3).toMatchObject({
      requestedAt: '2026-10-26T00:00:00.000Z',
      homeownerReadyAt: '2026-10-26T01:00:00.000Z',
    });
  });
});
