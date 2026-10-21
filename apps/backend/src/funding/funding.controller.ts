import { Body, Controller, Get, Param, Patch, Post, Request, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles, RolesGuard } from '../auth/rbac.guard';
import { FundingService } from './funding.service';

@Controller('funding')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class FundingController {
  constructor(private readonly funding: FundingService) {}

  @Get('account')
  async account() {
    return { account: await this.funding.getAccount() };
  }

  @Patch('account')
  saveAccount(@Request() req: any, @Body() body: unknown) {
    return this.funding.saveAccount(body, req.user?.sub);
  }

  @Post('projects/:projectId/invoice')
  resendInvoice(@Param('projectId') projectId: string) {
    return this.funding.sendProjectInvoice(projectId, { resend: true });
  }
}
