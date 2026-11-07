import { Body, Controller, Get, Patch, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles, RolesGuard } from '../auth/rbac.guard';
import { UpdatePartnerSettingsDto } from './dto/referrals.dto';
import { PartnerProgramService } from './partner-program.service';

@Controller('partner')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('partner')
export class PartnerController {
  constructor(private readonly partners: PartnerProgramService) {}

  @Get('overview')
  overview(@Req() req: any) {
    return this.partners.overview(this.referrerId(req));
  }

  @Get('links')
  links(@Req() req: any) {
    return this.partners.links(this.referrerId(req));
  }

  @Get('referrals')
  referrals(@Req() req: any) {
    return this.partners.referrals(this.referrerId(req));
  }

  @Get('earnings')
  earnings(@Req() req: any) {
    return this.partners.earnings(this.referrerId(req));
  }

  @Get('campaigns')
  campaigns() {
    return this.partners.campaigns();
  }

  @Get('settings')
  settings(@Req() req: any) {
    return this.partners.settings(this.referrerId(req));
  }

  @Patch('settings')
  updateSettings(@Req() req: any, @Body() body: UpdatePartnerSettingsDto) {
    return this.partners.updateSettings(this.referrerId(req), body);
  }

  private referrerId(req: any) {
    return String(req.user?.referrerId || req.user?.sub || '');
  }
}
