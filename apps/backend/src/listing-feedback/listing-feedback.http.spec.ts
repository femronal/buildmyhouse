import 'reflect-metadata';
import { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { Test } from '@nestjs/testing';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const request = require('supertest');
import { AdminAccessPermissionsService } from '../admin-access/admin-access-permissions.service';
import { JwtAuthService } from '../auth/jwt-auth.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/rbac.guard';
import { PermissionsGuard } from '../hr/permissions/permissions.guard';
import { PrismaService } from '../prisma/prisma.service';
import { ListingFeedbackPublicController } from './listing-feedback-public.controller';
import { ListingFeedbackService } from './listing-feedback.service';
import { ListingReviewsAdminController } from './listing-reviews-admin.controller';
import { ScamReportsAdminController } from './scam-reports-admin.controller';

describe('listing feedback http guards', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [ListingFeedbackPublicController, ListingReviewsAdminController, ScamReportsAdminController],
      providers: [
        Reflector,
        JwtAuthGuard,
        RolesGuard,
        PermissionsGuard,
        {
          provide: ListingFeedbackService,
          useValue: {
            listPublicReviews: jest.fn().mockResolvedValue({ reviews: [], summary: { average: null, count: 0 }, page: 1 }),
            submitReview: jest.fn(),
            submitReport: jest.fn(),
            myReview: jest.fn(),
            adminListReviews: jest.fn(),
            approveReview: jest.fn(),
            rejectReview: jest.fn(),
            queueCounts: jest.fn(),
            adminListReports: jest.fn(),
            adminGetReport: jest.fn(),
            updateReport: jest.fn(),
          },
        },
        {
          provide: JwtAuthService,
          useValue: {
            verifyToken: jest.fn(async (token: string) => {
              if (token === 'homeowner') return { sub: 'homeowner', email: 'ada@example.com', role: 'homeowner' };
              throw new Error('bad token');
            }),
          },
        },
        { provide: ConfigService, useValue: { get: () => '' } },
        { provide: PrismaService, useValue: {} },
        { provide: AdminAccessPermissionsService, useValue: { userHasPermission: jest.fn().mockResolvedValue(false) } },
      ],
    }).compile();
    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('returns 401 when a signed-out user posts a review', async () => {
    await request(app.getHttpServer())
      .post('/listing-feedback/vendor/acme-blocks/reviews')
      .send({ rating: 5, comment: 'This comment is long enough to save.' })
      .expect(401);
  });

  it('returns 403 for a non-admin on every admin endpoint', async () => {
    const http = request(app.getHttpServer());
    const calls = [
      () => http.get('/admin/listing-reviews'),
      () => http.get('/admin/listing-reviews/counts'),
      () => http.patch('/admin/listing-reviews/review-1/approve').send({}),
      () => http.patch('/admin/listing-reviews/review-1/reject').send({ reason: 'Not enough detail for this review.' }),
      () => http.get('/admin/scam-reports'),
      () => http.get('/admin/scam-reports/report-1'),
      () => http.patch('/admin/scam-reports/report-1').send({ status: 'investigating' }),
    ];
    for (const call of calls) {
      await call().set('Authorization', 'Bearer homeowner').expect(403);
    }
  });
});
