import { Body, Controller, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles, RolesGuard } from '../auth/rbac.guard';
import { PermissionsGuard } from '../hr/permissions/permissions.guard';
import { RequirePermissions } from '../hr/permissions/require-permissions.decorator';
import { AttachReferrerDto, CommissionDecisionDto, CreateReferrerDto, PublishReferralRuleDto, UpdateReferralProgramDto, UpdateReferrerDto } from './dto/referrals.dto';
import { PartnerProgramService } from './partner-program.service';
import { ReferralsService } from './referrals.service';

@Controller('admin/referrals')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Roles('admin')
export class ReferralsAdminController {
  constructor(
    private readonly referrals: ReferralsService,
    private readonly partners: PartnerProgramService,
  ) {}

  @Get()
  @RequirePermissions('referrals.view')
  list(@Query('type') type?: string, @Query('q') q?: string, @Query('includeArchived') includeArchived?: string) {
    return this.referrals.list({ type, q, includeArchived });
  }

  @Get('settings')
  @RequirePermissions('referrals.view')
  settings() {
    return this.referrals.getSettings();
  }

  @Patch('settings')
  @RequirePermissions('referrals.edit')
  updateSettings(@Body() body: UpdateReferralProgramDto) {
    return this.referrals.updateSettings(body);
  }

  @Get('summary')
  @RequirePermissions('referrals.view')
  summary() {
    return this.referrals.summary();
  }

  @Get('targets')
  @RequirePermissions('referrals.view')
  targets(@Query('targetType') targetType = 'project', @Query('q') q = '') {
    return this.referrals.searchTargets(targetType, q);
  }

  @Get('rules')
  @RequirePermissions('referrals.view')
  rules() {
    return this.partners.listRules();
  }

  @Post('rules')
  @RequirePermissions('referrals.edit')
  publishRules(@Req() req: any, @Body() body: PublishReferralRuleDto) {
    return this.partners.publishRule(req.user?.sub, body);
  }

  @Get('commissions')
  @RequirePermissions('referrals.view')
  commissions() {
    return this.partners.listCommissions();
  }

  @Post('commissions/:commissionId/approve')
  @RequirePermissions('referrals.edit')
  approveCommission(@Req() req: any, @Param('commissionId') commissionId: string, @Body() body: CommissionDecisionDto) {
    return this.partners.approveCommission(commissionId, req.user?.sub, body);
  }

  @Post('commissions/:commissionId/pay')
  @RequirePermissions('referrals.edit')
  payCommission(@Param('commissionId') commissionId: string, @Body() body: CommissionDecisionDto) {
    return this.partners.payCommission(commissionId, body.paymentReference || '');
  }

  @Post('commissions/:commissionId/reverse')
  @RequirePermissions('referrals.edit')
  reverseCommission(@Param('commissionId') commissionId: string, @Body() body: CommissionDecisionDto) {
    return this.partners.reverseCommission(commissionId, body.reason || '');
  }

  @Get('attribution')
  @RequirePermissions('referrals.view')
  attribution() {
    return this.partners.attributionAdmin();
  }

  @Get('performance')
  @RequirePermissions('referrals.view')
  performance() {
    return this.partners.performance();
  }

  @Get('campaigns')
  @RequirePermissions('referrals.view')
  campaigns() {
    return this.partners.campaigns();
  }

  @Get(':id')
  @RequirePermissions('referrals.view')
  detail(@Param('id') id: string) {
    return this.referrals.detail(id);
  }

  @Post()
  @RequirePermissions('referrals.edit')
  create(@Req() req: any, @Body() body: CreateReferrerDto) {
    return this.referrals.create(req.user?.sub, body);
  }

  @Patch('attach')
  @RequirePermissions('referrals.edit')
  attach(@Body() body: AttachReferrerDto) {
    return this.referrals.attach(body);
  }

  @Patch(':id')
  @RequirePermissions('referrals.edit')
  update(@Param('id') id: string, @Body() body: UpdateReferrerDto) {
    return this.referrals.update(id, body);
  }

  @Post(':id/approve')
  @RequirePermissions('referrals.edit')
  approve(@Req() req: any, @Param('id') id: string) {
    return this.partners.approve(id, req.user?.sub);
  }

  @Post(':id/suspend')
  @RequirePermissions('referrals.edit')
  suspend(@Param('id') id: string) {
    return this.partners.suspend(id);
  }

  @Post(':id/login-link')
  @RequirePermissions('referrals.edit')
  loginLink(@Param('id') id: string) {
    return this.partners.sendLoginLink(id);
  }
}
