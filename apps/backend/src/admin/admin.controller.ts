import { Body, Controller, Get, Post, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard, Roles } from '../auth/rbac.guard';
import { AdminService } from './admin.service';
import { SendBulkEmailDto } from './dto/send-bulk-email.dto';
import { PlanFileHealthService } from './plan-file-health.service';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class AdminController {
  constructor(
    private readonly adminService: AdminService,
    private readonly planFileHealthService: PlanFileHealthService,
  ) {}

  @Get('dashboard')
  getDashboard(@Request() req: any) {
    const userId = req.user?.sub;
    return this.adminService.getDashboard(userId);
  }

  @Get('email-health')
  getEmailHealth() {
    return this.adminService.getEmailHealth();
  }

  @Get('emails/audience-counts')
  getEmailAudienceCounts() {
    return this.adminService.getBulkEmailAudienceCounts();
  }

  @Post('emails/send')
  sendBulkEmail(@Request() req: any, @Body() dto: SendBulkEmailDto) {
    const userId = req.user?.sub;
    return this.adminService.sendBulkEmail(userId, dto);
  }

  @Post('plan-files/repair')
  async repairPlanFiles(@Body() body?: { limit?: number }) {
    const limit = Number(body?.limit || 300);
    const normalizedLimit = Number.isFinite(limit) ? Math.max(20, Math.min(limit, 1000)) : 300;
    const repair = await this.planFileHealthService.repairMissingPlanFiles(normalizedLimit);
    const missing = await this.planFileHealthService.scanMissingPlanFiles(normalizedLimit);
    return {
      ...repair,
      missingAfterRepair: missing.length,
      missingProjectIds: missing.slice(0, 100).map((item) => item.projectId),
    };
  }

  @Post('plan-files/notify-homeowners')
  notifyHomeownersForMissingPlanFiles(@Body() body?: { projectIds?: string[]; limit?: number }) {
    return this.adminService.notifyHomeownersForMissingPlanFiles({
      projectIds: body?.projectIds,
      limit: body?.limit,
    });
  }
}
