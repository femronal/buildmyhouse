import { Body, Controller, Get, Param, Patch, Query, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles, RolesGuard } from '../auth/rbac.guard';
import { PermissionsGuard } from '../hr/permissions/permissions.guard';
import { RequirePermissions } from '../hr/permissions/require-permissions.decorator';
import { JoinRequestsService } from './join-requests.service';

@Controller('admin/join-requests')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Roles('admin')
export class JoinRequestsAdminController {
  constructor(private readonly joinRequests: JoinRequestsService) {}

  @Get()
  @RequirePermissions('join_requests.view')
  list(@Query('path') path?: string, @Query('status') status?: string, @Query('page') page?: string) {
    return this.joinRequests.list({ path, status, page });
  }

  @Get(':id')
  @RequirePermissions('join_requests.view')
  get(@Param('id') id: string) {
    return this.joinRequests.get(id);
  }

  @Patch(':id')
  @RequirePermissions('join_requests.manage')
  update(
    @Req() req: any,
    @Param('id') id: string,
    @Body() body: { status?: string; adminNotes?: string },
  ) {
    return this.joinRequests.update(id, body, req.user.sub);
  }
}
