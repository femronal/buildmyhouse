import { Body, Controller, Get, Param, Patch, Query, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles, RolesGuard } from '../auth/rbac.guard';
import { PermissionsGuard } from '../hr/permissions/permissions.guard';
import { AdminScamReportQueryDto, UpdateScamReportDto } from './dto/listing-feedback.dto';
import { ListingFeedbackService } from './listing-feedback.service';

@Controller('admin/scam-reports')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Roles('admin')
export class ScamReportsAdminController {
  constructor(private readonly feedback: ListingFeedbackService) {}

  @Get()
  list(@Query() query: AdminScamReportQueryDto) {
    return this.feedback.adminListReports(query);
  }

  @Get(':id')
  one(@Param('id') id: string) {
    return this.feedback.adminGetReport(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Req() req: { user: { sub: string } }, @Body() body: UpdateScamReportDto) {
    return this.feedback.updateReport(id, req.user.sub, body);
  }
}
