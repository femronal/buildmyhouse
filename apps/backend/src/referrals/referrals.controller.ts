import { Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles, RolesGuard } from '../auth/rbac.guard';
import { ReferralsService } from './referrals.service';

@Controller('referrals')
export class ReferralsController {
  constructor(private readonly referrals: ReferralsService) {}

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
