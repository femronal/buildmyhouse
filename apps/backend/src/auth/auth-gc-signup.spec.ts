import { AuthService } from './auth.service';

describe('general contractor signup', () => {
  it('creates a contractor with rating 0, reviews 0 and projects 0', async () => {
    const service = new AuthService(
      {} as any,
      { get: () => undefined } as any,
      {} as any,
      { sendNotification: jest.fn(), sendNotificationToRole: jest.fn() } as any,
      { send: jest.fn() } as any,
    );
    const prisma: any = {
      user: {
        findUnique: jest.fn().mockResolvedValue(null),
        create: jest.fn().mockResolvedValue({
          id: 'user-1',
          email: 'ada@gmail.com',
          fullName: 'Ada Builder',
          role: 'general_contractor',
          verified: false,
          pictureUrl: null,
        }),
      },
      contractor: { create: jest.fn().mockResolvedValue({ id: 'c1' }) },
    };
    (service as any).prisma = prisma;
    jest.spyOn(service as any, 'notifyAdminNewSignup').mockResolvedValue(undefined);
    jest.spyOn(service as any, 'sendHomeownerWelcomeEmail').mockResolvedValue(undefined);
    jest.spyOn(service as any, 'sendGeneralContractorWelcomeEmail').mockResolvedValue(undefined);
    jest.spyOn(service as any, 'generateToken').mockResolvedValue('token');

    await service.register({
      email: 'ada@gmail.com',
      password: 'password1',
      fullName: 'Ada Builder',
      role: 'general_contractor',
    } as any);

    expect(prisma.contractor.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          rating: 0,
          reviews: 0,
          projects: 0,
        }),
      }),
    );
  });
});
