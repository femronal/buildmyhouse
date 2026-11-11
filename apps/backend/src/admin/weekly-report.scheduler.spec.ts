import { previousLagosWeek } from './lagos-week';
import { WeeklyReportScheduler } from './weekly-report.scheduler';
import type { WeeklyReport } from './weekly-report.service';

const MONDAY_8AM = new Date('2026-11-09T07:00:00.000Z');

function report(): WeeklyReport {
  return {
    weekStart: '2026-11-02',
    weekEnd: '2026-11-08',
    generatedAt: MONDAY_8AM.toISOString(),
    sections: [
      {
        key: 'north_star',
        title: 'North Star',
        lines: [
          { key: 'live_jobs', label: 'Live jobs', value: 3, unit: 'count', status: 'ok' },
          { key: 'stages_approved', label: 'Stages approved', value: 1, unit: 'count', status: 'ok' },
          { key: 'invoiced_oldest_days', label: 'Oldest invoiced line, days', value: null, unit: 'days', status: 'not_tracked', note: 'Not tracked before 11 Nov 2026' },
        ],
      },
      {
        key: 'money',
        title: 'Money',
        lines: [
          { key: 'money_in', label: 'Received from homeowners', value: 10, unit: 'naira', status: 'ok' },
          { key: 'invoiced_not_paid', label: 'Invoiced, not yet paid', value: 1, unit: 'naira', status: 'ok' },
        ],
      },
      {
        key: 'problems',
        title: 'Problems',
        lines: [
          { key: 'disputes_open_at_week_end', label: 'Disputes open at week end', value: 0, unit: 'count', status: 'ok' },
          { key: 'dormant_jobs', label: 'Dormant jobs', value: null, unit: 'count', status: 'not_tracked', note: 'Not tracked before 11 Nov 2026' },
        ],
      },
    ],
    jobs: [],
  };
}

function memory(users: Array<{ id: string; email: string; fullName: string }>) {
  const sends: Array<Record<string, any>> = [];
  const recipients: Array<Record<string, any>> = [];
  const unique = () => {
    const error = new Error('unique') as Error & { code: string };
    error.code = 'P2002';
    return error;
  };
  const prisma = {
    weeklyReportSend: {
      create: jest.fn(async ({ data }: { data: Record<string, unknown> }) => {
        const weekStart = data.weekStart as Date;
        if (sends.some((row) => row.weekStart.getTime() === weekStart.getTime())) throw unique();
        const row = { id: `send-${sends.length + 1}`, recipients: [], ...data };
        sends.push(row);
        return row;
      }),
      findUnique: jest.fn(async ({ where }: { where: { weekStart: Date } }) => sends.find((row) => row.weekStart.getTime() === where.weekStart.getTime()) || null),
      update: jest.fn(async ({ where, data }: { where: { id: string }; data: Record<string, unknown> }) => {
        const row = sends.find((item) => item.id === where.id);
        Object.assign(row, data);
        return row;
      }),
    },
    weeklyReportRecipient: {
      create: jest.fn(async ({ data }: { data: Record<string, unknown> }) => {
        if (recipients.some((row) => row.sendId === data.sendId && row.userId === data.userId)) throw unique();
        const row = { id: `r-${recipients.length + 1}`, ...data };
        recipients.push(row);
        return row;
      }),
      updateMany: jest.fn(async ({ where, data }: { where: { sendId: string; userId: string }; data: Record<string, unknown> }) => {
        recipients.filter((row) => row.sendId === where.sendId && row.userId === where.userId).forEach((row) => Object.assign(row, data));
        return { count: 1 };
      }),
      findMany: jest.fn(async ({ where }: { where: { sendId: string } }) => recipients.filter((row) => row.sendId === where.sendId)),
    },
    user: { findMany: jest.fn(async () => users) },
  };
  return { prisma, sends, recipients };
}

function schedulerFor(prisma: object, access: Record<string, { accessAllowed: boolean; permissions: string[] }>, sent: Array<Record<string, unknown>>) {
  return new WeeklyReportScheduler(
    prisma as any,
    { buildReport: jest.fn(async () => report()) } as any,
    {
      getAdminAppUrl: () => 'https://admin.buildmyhouse.app',
      send: jest.fn(async (message: Record<string, unknown>) => {
        sent.push(message);
        return true;
      }),
    } as any,
    { getEffectivePermissions: jest.fn(async (userId: string) => access[userId] || { accessAllowed: false, permissions: [] }) } as any,
  );
}

describe('weekly report scheduler', () => {
  it('Monday 08:00 Lagos sends the previous Monday to Sunday', async () => {
    const sent: Array<Record<string, unknown>> = [];
    const { prisma } = memory([{ id: 'a1', email: 'ada@example.com', fullName: 'Ada' }]);
    const scheduler = schedulerFor(prisma, { a1: { accessAllowed: true, permissions: ['dashboard.view'] } }, sent);
    const result = await scheduler.run(MONDAY_8AM);
    expect(result.weekStart).toBe(previousLagosWeek(MONDAY_8AM).weekStartIso);
    expect(sent).toHaveLength(1);
    expect(String(sent[0].subject)).toContain('2 Nov to 8 Nov 2026');
  });

  it('a second run sends nothing', async () => {
    const sent: Array<Record<string, unknown>> = [];
    const { prisma } = memory([{ id: 'a1', email: 'ada@example.com', fullName: 'Ada' }]);
    const scheduler = schedulerFor(prisma, { a1: { accessAllowed: true, permissions: ['dashboard.view'] } }, sent);
    await scheduler.run(MONDAY_8AM);
    await scheduler.run(new Date('2026-11-09T09:00:00.000Z'));
    expect(sent).toHaveLength(1);
  });

  it('two runs at the same time never email the same admin twice', async () => {
    const sent: Array<Record<string, unknown>> = [];
    const { prisma } = memory([{ id: 'a1', email: 'ada@example.com', fullName: 'Ada' }]);
    const scheduler = schedulerFor(prisma, { a1: { accessAllowed: true, permissions: ['dashboard.view'] } }, sent);
    await Promise.all([scheduler.run(MONDAY_8AM), scheduler.run(MONDAY_8AM)]);
    expect(sent).toHaveLength(1);
  });

  it('a run after a restart only emails admins who have no recipient row', async () => {
    const sent: Array<Record<string, unknown>> = [];
    const users = [
      { id: 'a1', email: 'ada@example.com', fullName: 'Ada' },
      { id: 'b1', email: 'bola@example.com', fullName: 'Bola' },
    ];
    const { prisma, sends, recipients } = memory(users);
    sends.push({ id: 'send-existing', weekStart: previousLagosWeek(MONDAY_8AM).start, status: 'sending' });
    recipients.push({ id: 'r-old', sendId: 'send-existing', userId: 'a1', email: 'ada@example.com', status: 'sent' });
    const scheduler = schedulerFor(prisma, {
      a1: { accessAllowed: true, permissions: ['dashboard.view'] },
      b1: { accessAllowed: true, permissions: ['dashboard.view'] },
    }, sent);
    await scheduler.run(MONDAY_8AM);
    expect(sent.map((message) => message.to)).toEqual(['bola@example.com']);
  });

  it('a failed send is marked failed and is not retried', async () => {
    const { prisma, recipients } = memory([{ id: 'a1', email: 'ada@example.com', fullName: 'Ada' }]);
    const email = { getAdminAppUrl: () => 'https://admin.buildmyhouse.app', send: jest.fn(async () => { throw new Error('down'); }) };
    const scheduler = new WeeklyReportScheduler(
      prisma as any,
      { buildReport: jest.fn(async () => report()) } as any,
      email as any,
      { getEffectivePermissions: jest.fn(async () => ({ accessAllowed: true, permissions: ['dashboard.view'] })) } as any,
    );
    await scheduler.run(MONDAY_8AM);
    expect(recipients[0].status).toBe('failed');
    await scheduler.run(new Date('2026-11-09T10:00:00.000Z'));
    expect(email.send).toHaveBeenCalledTimes(1);
  });

  it('admins without dashboard access, without dashboard.view, or with access turned off are excluded', async () => {
    const sent: Array<Record<string, unknown>> = [];
    const users = [
      { id: 'ok', email: 'ok@example.com', fullName: 'Ok' },
      { id: 'none', email: 'none@example.com', fullName: 'None' },
      { id: 'off', email: 'off@example.com', fullName: 'Off' },
      { id: 'blank', email: '   ', fullName: 'Blank' },
    ];
    const { prisma } = memory(users);
    const scheduler = schedulerFor(prisma, {
      ok: { accessAllowed: true, permissions: ['dashboard.view'] },
      none: { accessAllowed: true, permissions: ['projects.view'] },
      off: { accessAllowed: false, permissions: ['dashboard.view'] },
      blank: { accessAllowed: true, permissions: ['*'] },
    }, sent);
    await scheduler.run(MONDAY_8AM);
    expect(sent.map((message) => message.to)).toEqual(['ok@example.com']);
  });

  it('the email has the six summary lines and a link, with no attachment', async () => {
    const sent: Array<Record<string, unknown>> = [];
    const { prisma } = memory([{ id: 'a1', email: 'ada@example.com', fullName: 'Ada' }]);
    const scheduler = schedulerFor(prisma, { a1: { accessAllowed: true, permissions: ['*'] } }, sent);
    await scheduler.run(MONDAY_8AM);
    const message = sent[0];
    expect(message.attachments).toBeUndefined();
    expect(String(message.text)).toContain('Live jobs: 3');
    expect(String(message.text)).toContain('https://admin.buildmyhouse.app/reports/weekly?week=2026-11-02');
    expect(String(message.text)).toContain('Dormant jobs: Not tracked before 11 Nov 2026');
    expect(String(message.text)).not.toContain('Dormant jobs: 0');
  });
});
