import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

export interface ReviewQueueQuery {
  status?: string;
  priority?: string;
  caseType?: string;
  assignedReviewerId?: string;
  productFamilyKey?: string;
  q?: string;
  sort?: 'priority' | 'dueAt' | 'openedAt';
  order?: 'asc' | 'desc';
  take?: number;
  skip?: number;
  overdueOnly?: boolean;
}

@Injectable()
export class ReviewQueueService {
  constructor(private readonly prisma: PrismaService) {}

  async list(query: ReviewQueueQuery) {
    const take = Math.min(Math.max(query.take ?? 50, 1), 200);
    const skip = Math.max(query.skip ?? 0, 0);
    const order = query.order === 'asc' ? 'asc' : 'desc';

    const where: Prisma.PriceReviewCaseWhereInput = {
      ...(query.status ? { status: query.status } : {}),
      ...(query.priority ? { priority: query.priority } : {}),
      ...(query.caseType ? { caseType: query.caseType } : {}),
      ...(query.assignedReviewerId ? { assignedReviewerId: query.assignedReviewerId } : {}),
      ...(query.productFamilyKey ? { productFamilyKey: query.productFamilyKey } : {}),
      ...(query.overdueOnly
        ? { dueAt: { lt: new Date() }, status: { notIn: ['closed', 'resolved'] } }
        : {}),
      ...(query.q
        ? {
            OR: [
              { productLabel: { contains: query.q, mode: 'insensitive' } },
              { productFamilyKey: { contains: query.q, mode: 'insensitive' } },
              { triggerCode: { contains: query.q, mode: 'insensitive' } },
              { priorityReason: { contains: query.q, mode: 'insensitive' } },
              { id: { equals: query.q } },
            ],
          }
        : {}),
    };

    const orderBy: Prisma.PriceReviewCaseOrderByWithRelationInput[] =
      query.sort === 'dueAt'
        ? [{ dueAt: order }, { priorityScore: 'desc' }]
        : query.sort === 'openedAt'
          ? [{ openedAt: order }]
          : [{ priorityScore: order === 'asc' ? 'asc' : 'desc' }, { dueAt: 'asc' }];

    const [items, total] = await Promise.all([
      this.prisma.priceReviewCase.findMany({
        where,
        orderBy,
        take,
        skip,
        include: {
          assignedReviewer: { select: { id: true, fullName: true, email: true } },
          report: { select: { id: true, status: true, currentVersion: true, generatedAt: true } },
        },
      }),
      this.prisma.priceReviewCase.count({ where }),
    ]);

    return { items, total, take, skip };
  }
}
