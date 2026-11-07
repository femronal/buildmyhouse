import { Body, Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles, RolesGuard } from '../auth/rbac.guard';
import { ApplyAffiliateDto, LockReferralDto, PartnerLoginConsumeDto, PartnerLoginDto, RecordReferralClickDto } from './dto/referrals.dto';
import { PartnerProgramService } from './partner-program.service';
import { ReferralsService } from './referrals.service';

@Controller('referrals')
export class ReferralsController {
  constructor(
    private readonly referrals: ReferralsService,
    private readonly partners: PartnerProgramService,
  ) {}

  @Get('program')
  @Throttle({ short: { limit: 60, ttl: 60000 } })
  program() {
    return this.referrals.publicProgram();
  }

  @Get('code/:code')
  @Throttle({ short: { limit: 30, ttl: 60000 } })
  code(@Param('code') code: string) {
    return this.referrals.codeValidity(code);
  }

  @Post('touch')
  @Throttle({ short: { limit: 30, ttl: 60000 } })
  touch(@Body() body: RecordReferralClickDto) {
    return this.partners.recordClick(body);
  }

  @Post('lock')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('homeowner')
  lock(@Req() req: any, @Body() body: LockReferralDto) {
    return this.partners.lockHomeowner({ userId: req.user.sub, ...body });
  }

  @Post('apply')
  @Throttle({ short: { limit: 5, ttl: 60000 } })
  apply(@Body() body: ApplyAffiliateDto) {
    return this.partners.apply(body);
  }

  @Post('partner-login')
  @Throttle({ short: { limit: 5, ttl: 60000 } })
  partnerLogin(@Body() body: PartnerLoginDto) {
    return this.partners.requestLogin(body.email);
  }

  @Post('partner-login/consume')
  @Throttle({ short: { limit: 10, ttl: 60000 } })
  consume(@Body() body: PartnerLoginConsumeDto) {
    return this.partners.consumeLogin(body.token);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('general_contractor', 'admin')
  mine(@Req() req: any) {
    return this.referrals.mine(req.user.sub);
  }

  @Post('me/invite-prompt-seen')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('general_contractor', 'admin', 'homeowner')
  seen(@Req() req: any) {
    return this.referrals.markInvitePromptSeen(req.user.sub);
  }
}
