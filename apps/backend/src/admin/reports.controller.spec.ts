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
import { previousLagosWeek } from './lagos-week';
import { ReportsController } from './reports.controller';
import { WeeklyReportService, resolveWeeklyReportWeek } from './weekly-report.service';

describe('weekly report http', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [ReportsController],
      providers: [
        Reflector,
        JwtAuthGuard,
        RolesGuard,
        PermissionsGuard,
        {
          provide: WeeklyReportService,
          useValue: {
            reportFor: jest.fn(async (week?: string) => {
              const resolved = resolveWeeklyReportWeek(week);
              return {
                weekStart: resolved.weekStartIso,
                weekEnd: resolved.weekStartIso,
                generatedAt: new Date().toISOString(),
                sections: [],
                jobs: [],
              };
            }),
          },
        },
        {
          provide: JwtAuthService,
          useValue: {
            verifyToken: jest.fn(async (token: string) => {
              if (token === 'admin-ok') return { sub: 'admin-ok', email: 'ada@example.com', role: 'admin' };
              if (token === 'admin-no') return { sub: 'admin-no', email: 'no@example.com', role: 'admin' };
              if (token === 'homeowner') return { sub: 'homeowner', email: 'ho@example.com', role: 'homeowner' };
              throw new Error('bad token');
            }),
          },
        },
        { provide: ConfigService, useValue: { get: () => '' } },
        { provide: PrismaService, useValue: { user: { findMany: jest.fn().mockResolvedValue([]) } } },
        {
          provide: AdminAccessPermissionsService,
          useValue: {
            userHasPermission: jest.fn(async (userId: string) => userId === 'admin-ok'),
          },
        },
      ],
    }).compile();
    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    if (app) await app.close();
  });

  it('weekly report needs an admin with dashboard.view', async () => {
    await request(app.getHttpServer()).get('/admin/reports/weekly').expect(401);
    await request(app.getHttpServer()).get('/admin/reports/weekly').set('Authorization', 'Bearer homeowner').expect(403);
    await request(app.getHttpServer()).get('/admin/reports/weekly').set('Authorization', 'Bearer admin-no').expect(403);
    await request(app.getHttpServer()).get('/admin/reports/weekly').set('Authorization', 'Bearer admin-ok').expect(200);
  });

  it('weekly report without week returns the previous full Lagos week', async () => {
    const response = await request(app.getHttpServer()).get('/admin/reports/weekly').set('Authorization', 'Bearer admin-ok').expect(200);
    expect(response.body.weekStart).toBe(previousLagosWeek(new Date()).weekStartIso);
  });

  it('weekly report rejects a date that is not a Monday', async () => {
    const response = await request(app.getHttpServer()).get('/admin/reports/weekly?week=2026-11-10').set('Authorization', 'Bearer admin-ok').expect(400);
    expect(response.body.message).toBe('Pick a Monday.');
  });

  it('weekly report rejects a week that is not over', async () => {
    const response = await request(app.getHttpServer()).get('/admin/reports/weekly?week=2027-01-04').set('Authorization', 'Bearer admin-ok').expect(400);
    expect(response.body.message).toBe('That week is not over yet.');
  });

  it('csv endpoint returns filename and csv text', async () => {
    const response = await request(app.getHttpServer()).get('/admin/reports/weekly/csv?week=2020-01-06').set('Authorization', 'Bearer admin-ok').expect(200);
    expect(response.body.filename).toBe('bmh-weekly-report-2020-01-06.csv');
    expect(response.body.csv).toContain('projectId,name,');
    expect(response.body.csv).toContain('section,line,value,status,note');
  });
});
