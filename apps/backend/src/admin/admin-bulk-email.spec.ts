import { AdminEmailAudience } from './dto/send-bulk-email.dto';
import { AdminService } from './admin.service';

describe('admin bulk email reply-to', () => {
  const prisma = {
    user: { findMany: jest.fn() },
  };
  const notificationsService = { createForUser: jest.fn() };
  const emailService = { send: jest.fn() };

  function createService(campaignReplyTo?: string) {
    const config = {
      get: jest.fn((key: string) => (key === 'CAMPAIGN_REPLY_TO' ? campaignReplyTo : undefined)),
    };
    return new AdminService(
      prisma as any,
      {} as any,
      notificationsService as any,
      {} as any,
      emailService as any,
      config as any,
    );
  }

  beforeEach(() => {
    jest.clearAllMocks();
    prisma.user.findMany.mockResolvedValue([{ email: 'homeowner@example.com' }]);
    emailService.send.mockResolvedValue(true);
    notificationsService.createForUser.mockResolvedValue(undefined);
  });

  it('sends bulk email with the default inspect reply-to', async () => {
    const service = createService(undefined);

    const result = await service.sendBulkEmail('admin-1', {
      audience: AdminEmailAudience.ALL_HOMEOWNERS,
      subject: 'Project update',
      text: 'Your build is on track.',
    });

    expect(emailService.send).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'homeowner@example.com',
        subject: 'Project update',
        replyTo: 'inspect@buildmyhouse.app',
      }),
    );
    expect(result.replyTo).toBe('inspect@buildmyhouse.app');
    expect(notificationsService.createForUser).toHaveBeenCalledWith(
      'admin-1',
      expect.objectContaining({
        type: 'admin_bulk_email_sent',
        data: expect.objectContaining({
          audience: AdminEmailAudience.ALL_HOMEOWNERS,
          totalRecipients: 1,
          sent: 1,
          failed: 0,
          replyTo: 'inspect@buildmyhouse.app',
        }),
      }),
    );
  });

  it('uses CAMPAIGN_REPLY_TO when it is set', async () => {
    const service = createService('  replies@example.com  ');

    const result = await service.sendBulkEmail('admin-1', {
      audience: AdminEmailAudience.ALL_USERS,
      subject: 'Hello',
      html: '<p>Hello</p>',
    });

    expect(emailService.send).toHaveBeenCalledWith(
      expect.objectContaining({
        replyTo: 'replies@example.com',
      }),
    );
    expect(result.replyTo).toBe('replies@example.com');
    expect(notificationsService.createForUser).toHaveBeenCalledWith(
      'admin-1',
      expect.objectContaining({
        data: expect.objectContaining({ replyTo: 'replies@example.com' }),
      }),
    );
  });
});
