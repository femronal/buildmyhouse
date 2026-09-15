import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles, RolesGuard } from '../auth/rbac.guard';
import { CreateWaitlistDto, UpdateWaitlistDto } from './dto/admin-waitlist.dto';
import { JoinWaitlistDto } from './dto/join-waitlist.dto';
import { WaitlistService } from './waitlist.service';

@Controller('waitlist')
export class WaitlistController {
  constructor(private readonly waitlistService: WaitlistService) {}

  @Post('join')
  @Throttle({ short: { limit: 8, ttl: 60_000 } })
  join(@Body() dto: JoinWaitlistDto) {
    return this.waitlistService.join(dto);
  }

  @Get('admin/lists')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  listWaitlists() {
    return this.waitlistService.listWaitlists();
  }

  @Post('admin/lists')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  createWaitlist(@Body() dto: CreateWaitlistDto) {
    return this.waitlistService.createWaitlist(dto);
  }

  @Patch('admin/lists/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  updateWaitlist(@Param('id') id: string, @Body() dto: UpdateWaitlistDto) {
    return this.waitlistService.updateWaitlist(id, dto);
  }

  @Get('admin/people')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  listPeople() {
    return this.waitlistService.listPeople();
  }

  @Get('admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  listAdmin(@Query('productKey') productKey?: string) {
    return this.waitlistService.listAdmin(productKey);
  }
}
