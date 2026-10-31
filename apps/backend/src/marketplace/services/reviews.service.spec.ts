import { BadRequestException } from '@nestjs/common';
import { ReviewsService } from './reviews.service';

function buildService() {
  const prisma: any = {
    project: { findUnique: jest.fn() },
    review: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
    },
    contractor: { update: jest.fn().mockResolvedValue({}) },
  };
  const service = new ReviewsService();
  (service as any).prisma = prisma;
  jest.spyOn(service as any, 'validateContractorReviewReasons').mockResolvedValue({
    contractor: { id: 'c1', userId: 'gc-user' },
    reasons: ['Quality'],
    otherReason: null,
  });
  return { service, prisma };
}

const finishedProject = {
  id: 'p1',
  homeownerId: 'home-1',
  generalContractorId: 'gc-user',
  progress: 100,
  status: 'completed',
};

describe('contractor reviews', () => {
  it('rejects a contractor review with no project', async () => {
    const { service } = buildService();
    await expect(service.create('home-1', { contractorId: 'c1', rating: 5 } as any)).rejects.toThrow(
      'A finished project is required to review a contractor',
    );
  });

  it('rejects a review from someone who is not the homeowner', async () => {
    const { service, prisma } = buildService();
    prisma.project.findUnique.mockResolvedValue(finishedProject);
    await expect(
      service.create('other-user', { contractorId: 'c1', rating: 5, projectId: 'p1' } as any),
    ).rejects.toThrow('Only the homeowner of this project can submit this review');
  });

  it('rejects a review for a contractor who is not assigned', async () => {
    const { service, prisma } = buildService();
    prisma.project.findUnique.mockResolvedValue({ ...finishedProject, generalContractorId: 'someone-else' });
    await expect(
      service.create('home-1', { contractorId: 'c1', rating: 5, projectId: 'p1' } as any),
    ).rejects.toThrow('Selected contractor is not assigned to this project');
  });

  it('rejects a review when the project is only 60 percent done', async () => {
    const { service, prisma } = buildService();
    prisma.project.findUnique.mockResolvedValue({ ...finishedProject, progress: 60, status: 'active' });
    await expect(
      service.create('home-1', { contractorId: 'c1', rating: 5, projectId: 'p1' } as any),
    ).rejects.toThrow('Project must be fully complete before submitting a GC review');
  });

  it('rejects a review on a cancelled project', async () => {
    const { service, prisma } = buildService();
    prisma.project.findUnique.mockResolvedValue({ ...finishedProject, progress: 100, status: 'cancelled' });
    await expect(
      service.create('home-1', { contractorId: 'c1', rating: 5, projectId: 'p1' } as any),
    ).rejects.toThrow('Project must be fully complete before submitting a GC review');
  });

  it('saves a homeowner review on a finished project and stores the Bayesian rating', async () => {
    const { service, prisma } = buildService();
    prisma.project.findUnique.mockResolvedValue(finishedProject);
    prisma.review.findFirst.mockResolvedValue(null);
    prisma.review.create.mockResolvedValue({ id: 'r1' });
    prisma.review.findMany.mockResolvedValue([{ rating: 5 }]);

    await service.create('home-1', { contractorId: 'c1', rating: 5, projectId: 'p1', reasons: ['Quality'] } as any);

    expect(prisma.contractor.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ rating: 4.7, reviews: 1 }),
      }),
    );
  });

  it('rejects a second review and a unique-constraint clash with the same message', async () => {
    const { service, prisma } = buildService();
    prisma.project.findUnique.mockResolvedValue(finishedProject);
    prisma.review.findFirst.mockResolvedValue({ id: 'r1' });
    await expect(
      service.create('home-1', { contractorId: 'c1', rating: 5, projectId: 'p1' } as any),
    ).rejects.toThrow('You have already reviewed this contractor for this project');

    prisma.review.findFirst.mockResolvedValue(null);
    prisma.review.create.mockRejectedValue({ code: 'P2002' });
    await expect(
      service.create('home-1', { contractorId: 'c1', rating: 4, projectId: 'p1' } as any),
    ).rejects.toBeInstanceOf(BadRequestException);
    await expect(
      service.create('home-1', { contractorId: 'c1', rating: 4, projectId: 'p1' } as any),
    ).rejects.toThrow('You have already reviewed this contractor for this project');
  });

  it('sets rating 0 and reviews 0 when the last review is deleted', async () => {
    const { service, prisma } = buildService();
    prisma.review.findUnique.mockResolvedValue({
      id: 'r1',
      userId: 'home-1',
      contractorId: 'c1',
      materialId: null,
    });
    prisma.review.delete.mockResolvedValue({});
    prisma.review.findMany.mockResolvedValue([]);

    await service.remove('r1', 'home-1');

    expect(prisma.contractor.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { rating: 0, reviews: 0 },
      }),
    );
  });
});
