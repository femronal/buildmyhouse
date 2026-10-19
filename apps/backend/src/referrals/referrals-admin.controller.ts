import { Body, Controller, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles, RolesGuard } from '../auth/rbac.guard';
import { PermissionsGuard } from '../hr/permissions/permissions.guard';
import { RequirePermissions } from '../hr/permissions/require-permissions.decorator';
import { AttachReferrerDto, CreateReferrerDto, UpdateReferrerDto } from './dto/referrals.dto';
import { ReferralsService } from './referrals.service';

@Controller('admin/referrals')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Roles('admin')
export class ReferralsAdminController {
  constructor(private readonly referrals: ReferralsService) {}

  @Get()
  @RequirePermissions('referrals.view')
  list(@Query('type') type?: string, @Query('q') q?: string, @Query('includeArchived') includeArchived?: string) {
    return this.referrals.list({ type, q, includeArchived });
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
}
