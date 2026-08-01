import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { Roles, RolesGuard } from '../../auth/rbac.guard';
import { ResearchDiagnosticsService } from './research-diagnostics.service';

/**
 * READ-ONLY admin research diagnostics (Stage 4 deliverable 16). Admin-only.
 */
@Controller('admin/price-research')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class ResearchDiagnosticsController {
  constructor(private readonly service: ResearchDiagnosticsService) {}

  @Get('config')
  getConfig() {
    return this.service.getConfig();
  }

  /** Stage 5 audit: full report snapshot (components, reasons, gates, exclusions, hash). */
  @Get('reports/:reportId')
  getReportAudit(@Param('reportId') reportId: string) {
    return this.service.getReportAudit(reportId);
  }

  @Get('runs/:requestId')
  getRuns(@Param('requestId') requestId: string) {
    return this.service.getRunsForRequest(requestId);
  }

  @Get('observations/:familyId')
  getObservations(@Param('familyId') familyId: string, @Query('take') take?: string) {
    return this.service.getObservations(familyId, take ? Number(take) : undefined);
  }
}
