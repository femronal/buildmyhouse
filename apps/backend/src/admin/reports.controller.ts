import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles, RolesGuard } from '../auth/rbac.guard';
import { PermissionsGuard } from '../hr/permissions/permissions.guard';
import { RequirePermissions } from '../hr/permissions/require-permissions.decorator';
import { toWeeklyReportCsv } from './weekly-report-csv';
import { WeeklyReportService } from './weekly-report.service';

@Controller('admin/reports')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Roles('admin')
@RequirePermissions('dashboard.view')
export class ReportsController {
  constructor(private readonly reports: WeeklyReportService) {}

  @Get('weekly/csv')
  async weeklyCsv(@Query('week') week?: string) {
    const report = await this.reports.reportFor(week);
    return { filename: `bmh-weekly-report-${report.weekStart}.csv`, csv: toWeeklyReportCsv(report) };
  }

  @Get('weekly')
  weekly(@Query('week') week?: string) {
    return this.reports.reportFor(week);
  }
}
