import { ContractorsService } from './contractors.service';

function buildService() {
  const prisma: any = {
    user: {
      findUnique: jest.fn(),
      update: jest.fn().mockResolvedValue({}),
    },
    contractor: { update: jest.fn().mockResolvedValue({}) },
  };
  const service = new ContractorsService(
    { sendNotification: jest.fn().mockResolvedValue(undefined) } as any,
    {} as any,
    {} as any,
    {} as any,
    {} as any,
    {} as any,
    {} as any,
  );
  (service as any).prisma = prisma;
  jest.spyOn(service as any, 'getContractorByUserIdOrThrow').mockResolvedValue({
    id: 'c1',
    type: 'general_contractor',
    specialtyCategory: 'general_contractor',
    specialtyTags: ['General Contractor'],
    specialty: 'General Contractor',
  });
  jest.spyOn(service as any, 'getVerificationDocumentStatus').mockResolvedValue({
    hasUploadedAllRequiredDocuments: true,
    missingRequiredDocuments: [],
  });
  return { service, prisma };
}

describe('GC verifiedAt', () => {
  it('verifying a GC sets verifiedAt', async () => {
    const { service, prisma } = buildService();
    prisma.user.findUnique.mockResolvedValue({ id: 'u1', role: 'general_contractor', verified: false });

    await service.adminSetGCVerification('u1', true);

    expect(prisma.contractor.update).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ verified: true, verifiedAt: expect.any(Date) }),
    }));
  });

  it('unverifying a GC clears verifiedAt', async () => {
    const { service, prisma } = buildService();
    prisma.user.findUnique.mockResolvedValue({ id: 'u1', role: 'general_contractor', verified: true });

    await service.adminSetGCVerification('u1', false);

    expect(prisma.contractor.update).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ verified: false, verifiedAt: null }),
    }));
  });

  it('saving an already verified GC leaves verifiedAt out of the update', async () => {
    const { service, prisma } = buildService();
    prisma.user.findUnique.mockResolvedValue({ id: 'u1', role: 'general_contractor', verified: true });

    await service.adminSetGCVerification('u1', true);

    const data = prisma.contractor.update.mock.calls[0][0].data;
    expect(data.verified).toBe(true);
    expect(data.verifiedAt).toBeUndefined();
  });
});
