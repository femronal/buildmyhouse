import { Logger } from '@nestjs/common';
import { DesignsService } from './designs.service';

function createdDesign() {
  return {
    id: 'design-1',
    name: 'Sliding door repair',
    projectTypeTag: 'repair',
    planType: 'renovation',
    createdBy: {
      fullName: 'Taiwo',
      contractorProfile: { name: 'Taiwo' },
    },
  };
}

function buildService(findMany: jest.Mock, send: jest.Mock) {
  const prisma = {
    user: {
      findUnique: jest.fn().mockResolvedValue({ id: 'gc-1', role: 'general_contractor' }),
      findMany,
    },
    contractor: {
      findUnique: jest.fn().mockResolvedValue({ verified: true, name: 'Taiwo' }),
    },
    design: {
      create: jest.fn().mockResolvedValue(createdDesign()),
    },
  };
  const wsService = { sendNotificationToRole: jest.fn(), sendNotification: jest.fn() };
  const emailService = { send };
  return new DesignsService(wsService as any, emailService as any, prisma as any);
}

const dto = {
  name: 'Sliding door repair',
  description: 'The door sticks.',
  estimatedCost: 62500,
  estimatedDuration: '1 to 3 days',
  images: [{ url: 'https://example.com/a.webp', label: 'Door', order: 0 }],
} as any;

describe('DesignsService homeowner plan emails', () => {
  const originalFlag = process.env.HOMEOWNER_NEW_PLAN_EMAILS_ENABLED;

  afterEach(() => {
    if (originalFlag === undefined) delete process.env.HOMEOWNER_NEW_PLAN_EMAILS_ENABLED;
    else process.env.HOMEOWNER_NEW_PLAN_EMAILS_ENABLED = originalFlag;
    jest.restoreAllMocks();
  });

  it('returns the created design when the homeowner query fails and does not raise an unhandled rejection', async () => {
    process.env.HOMEOWNER_NEW_PLAN_EMAILS_ENABLED = 'true';
    const rejections: unknown[] = [];
    const onRejection = (reason: unknown) => {
      rejections.push(reason);
    };
    process.on('unhandledRejection', onRejection);
    const errorSpy = jest.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);
    const findMany = jest.fn().mockRejectedValue(new Error('Argument not must not be null'));
    const service = buildService(findMany, jest.fn());

    const created = await service.createDesign('gc-1', dto, { publishImmediately: true, reviewedById: 'admin-1' });
    await new Promise((resolve) => setTimeout(resolve, 30));

    expect(created.id).toBe('design-1');
    expect(errorSpy).toHaveBeenCalled();
    expect(String(errorSpy.mock.calls.join(' '))).toContain('design-1');
    expect(rejections).toEqual([]);
    process.off('unhandledRejection', onRejection);
  });

  it('does not query homeowners with email not null', async () => {
    process.env.HOMEOWNER_NEW_PLAN_EMAILS_ENABLED = 'true';
    const findMany = jest.fn().mockResolvedValue([]);
    const service = buildService(findMany, jest.fn());

    await service.createDesign('gc-1', dto, { publishImmediately: true });
    await new Promise((resolve) => setTimeout(resolve, 30));

    const where = findMany.mock.calls[0][0].where;
    expect(where).toEqual({ role: 'homeowner', email: { not: '' } });
    expect(JSON.stringify(where)).not.toContain('null');
  });

  it('sends no email when the flag is off', async () => {
    delete process.env.HOMEOWNER_NEW_PLAN_EMAILS_ENABLED;
    const findMany = jest.fn();
    const send = jest.fn();
    const service = buildService(findMany, send);

    await service.createDesign('gc-1', dto, { publishImmediately: true });
    await new Promise((resolve) => setTimeout(resolve, 30));

    expect(findMany).not.toHaveBeenCalled();
    expect(send).not.toHaveBeenCalled();
  });

  it('sends emails one at a time and keeps going after one failure', async () => {
    process.env.HOMEOWNER_NEW_PLAN_EMAILS_ENABLED = 'true';
    const order: string[] = [];
    const send = jest.fn().mockImplementation(async ({ to }: { to: string }) => {
      order.push(`start:${to}`);
      await new Promise((resolve) => setTimeout(resolve, 5));
      order.push(`end:${to}`);
      if (to === 'a@example.com') throw new Error('bounce');
    });
    const findMany = jest.fn().mockResolvedValue([
      { email: 'a@example.com' },
      { email: ' ' },
      { email: 'b@example.com' },
    ]);
    const service = buildService(findMany, send);

    await service.createDesign('gc-1', dto, { publishImmediately: true });
    await new Promise((resolve) => setTimeout(resolve, 700));

    expect(order).toEqual(['start:a@example.com', 'end:a@example.com', 'start:b@example.com', 'end:b@example.com']);
    expect(send).toHaveBeenCalledTimes(2);
  });
});
