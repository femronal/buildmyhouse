import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles, RolesGuard } from '../auth/rbac.guard';
import { PermissionsGuard } from '../hr/permissions/permissions.guard';
import { RequirePermissions } from '../hr/permissions/require-permissions.decorator';
import { AdminSessionGuard } from './admin-session.guard';
import { AdminAccessService } from './admin-access.service';
import {
  AcceptInviteDto,
  AssignRoleDto,
  CreateAccessRequestDto,
  DecideAccessRequestDto,
  ExtendAccessDto,
  GrantAccessDto,
  LinkStaffProfileDto,
  OverridePermissionDto,
  RemoveOverrideDto,
  RestoreAccessDto,
  RevokeAccessDto,
  SuspendAccessDto,
  UpdateAccessDto,
  UpsertRoleDto,
} from './dto/admin-access.dto';

@Controller('admin/access')
@UseGuards(JwtAuthGuard, AdminSessionGuard, RolesGuard, PermissionsGuard)
@Roles('admin')
export class AdminAccessController {
  constructor(private readonly access: AdminAccessService) {}

  @Get('stats')
  @RequirePermissions('admin_access.view')
  getStats() {
    return this.access.getStats();
  }

  @Get('accounts')
  @RequirePermissions('admin_access.view')
  listAccounts(
    @Query('status') status?: string,
    @Query('roleKey') roleKey?: string,
    @Query('q') q?: string,
    @Query('relationship') relationship?: string,
  ) {
    return this.access.listAccounts({ status, roleKey, q, relationship });
  }

  @Get('accounts/:userId')
  @RequirePermissions('admin_access.view')
  getAccount(@Param('userId') userId: string) {
    return this.access.getAccount(userId);
  }

  @Post('grant')
  @RequirePermissions('admin_access.grant')
  grantAccess(@Request() req: any, @Body() dto: GrantAccessDto) {
    return this.access.grantAccess(req.user.sub, dto);
  }

  @Patch('accounts/:userId')
  @RequirePermissions('admin_access.modify')
  updateAccess(
    @Request() req: any,
    @Param('userId') userId: string,
    @Body() dto: UpdateAccessDto,
  ) {
    return this.access.updateAccess(req.user.sub, userId, dto);
  }

  @Post('accounts/:userId/assign-role')
  @RequirePermissions('admin_access.modify')
  assignRole(
    @Request() req: any,
    @Param('userId') userId: string,
    @Body() dto: AssignRoleDto,
  ) {
    return this.access.assignRole(req.user.sub, userId, dto);
  }

  @Post('accounts/:userId/suspend')
  @RequirePermissions('admin_access.suspend')
  suspendAccess(
    @Request() req: any,
    @Param('userId') userId: string,
    @Body() dto: SuspendAccessDto,
  ) {
    return this.access.suspendAccess(req.user.sub, userId, dto);
  }

  @Post('accounts/:userId/revoke')
  @RequirePermissions('admin_access.suspend')
  revokeAccess(
    @Request() req: any,
    @Param('userId') userId: string,
    @Body() dto: RevokeAccessDto,
  ) {
    return this.access.revokeAccess(req.user.sub, userId, dto);
  }

  @Post('accounts/:userId/restore')
  @RequirePermissions('admin_access.grant')
  restoreAccess(
    @Request() req: any,
    @Param('userId') userId: string,
    @Body() dto: RestoreAccessDto,
  ) {
    return this.access.restoreAccess(req.user.sub, userId, dto);
  }

  @Post('accounts/:userId/revoke-sessions')
  @RequirePermissions('admin_access.suspend')
  revokeSessions(@Request() req: any, @Param('userId') userId: string) {
    return this.access.revokeSessions(req.user.sub, userId);
  }

  @Post('accounts/:userId/extend')
  @RequirePermissions('admin_access.modify')
  extendAccess(
    @Request() req: any,
    @Param('userId') userId: string,
    @Body() dto: ExtendAccessDto,
  ) {
    return this.access.extendAccess(req.user.sub, userId, dto);
  }

  @Post('accounts/:userId/link-staff')
  @RequirePermissions('admin_access.modify')
  linkStaff(
    @Request() req: any,
    @Param('userId') userId: string,
    @Body() dto: LinkStaffProfileDto,
  ) {
    return this.access.linkStaffProfile(req.user.sub, userId, dto);
  }

  @Post('accounts/:userId/overrides')
  @RequirePermissions('admin_access.permissions.manage')
  setOverride(
    @Request() req: any,
    @Param('userId') userId: string,
    @Body() dto: OverridePermissionDto,
  ) {
    return this.access.setOverride(req.user.sub, userId, dto);
  }

  @Post('accounts/:userId/overrides/remove')
  @RequirePermissions('admin_access.permissions.manage')
  removeOverride(
    @Request() req: any,
    @Param('userId') userId: string,
    @Body() dto: RemoveOverrideDto,
  ) {
    return this.access.removeOverride(req.user.sub, userId, dto);
  }

  @Get('roles')
  @RequirePermissions('admin_access.view')
  listRoles() {
    return this.access.listRoles();
  }

  @Post('roles')
  @RequirePermissions('admin_access.roles.manage')
  createRole(@Request() req: any, @Body() dto: UpsertRoleDto) {
    return this.access.upsertRole(req.user.sub, dto);
  }

  @Patch('roles/:roleId')
  @RequirePermissions('admin_access.roles.manage')
  updateRole(
    @Request() req: any,
    @Param('roleId') roleId: string,
    @Body() dto: UpsertRoleDto,
  ) {
    return this.access.upsertRole(req.user.sub, dto, roleId);
  }

  @Get('permissions')
  @RequirePermissions('admin_access.view')
  listPermissions() {
    return this.access.listPermissions();
  }

  @Get('audit')
  @RequirePermissions('admin_access.view')
  listAudit(
    @Query('targetUserId') targetUserId?: string,
    @Query('action') action?: string,
    @Query('take') take?: string,
  ) {
    return this.access.listAudit({
      targetUserId,
      action,
      take: take ? Number(take) : undefined,
    });
  }

  @Get('requests')
  @RequirePermissions('admin_access.view')
  listRequests(@Query('status') status?: string) {
    return this.access.listRequests(status);
  }

  /** Any dashboard admin can request additional permissions. */
  @Post('requests')
  @RequirePermissions('dashboard.view')
  createRequest(@Request() req: any, @Body() dto: CreateAccessRequestDto) {
    return this.access.createRequest(req.user.sub, dto);
  }

  @Post('requests/:id/decide')
  @RequirePermissions('admin_access.modify')
  decideRequest(
    @Request() req: any,
    @Param('id') id: string,
    @Body() dto: DecideAccessRequestDto,
  ) {
    return this.access.decideRequest(req.user.sub, id, dto);
  }

  // --- Legacy compatibility (same paths as previous AdminController) ---
  // Permission keys optional during migration; RolesGuard + AdminSessionGuard still apply.

  @Get('full-admins')
  getFullAdmins() {
    return this.access.compatGetFullAdmins();
  }

  @Post('full-admins')
  createFullAdmin(
    @Request() req: any,
    @Body() body: { email?: string; password?: string; fullName?: string },
  ) {
    return this.access.compatCreateAdmin({
      actorUserId: req.user.sub,
      email: String(body?.email || ''),
      password: String(body?.password || ''),
      fullName: String(body?.fullName || ''),
    });
  }

  @Patch('full-admins/:adminUserId')
  setFullAdminAccess(
    @Request() req: any,
    @Param('adminUserId') adminUserId: string,
    @Body() body: { enabled?: boolean },
  ) {
    if (typeof body?.enabled !== 'boolean') {
      throw new BadRequestException('enabled must be a boolean value.');
    }
    return this.access.compatSetAccess({
      actorUserId: req.user.sub,
      targetUserId: adminUserId,
      enabled: body.enabled,
    });
  }
}

/** Public invitation acceptance (no auth). */
@Controller('admin/access')
export class AdminAccessPublicController {
  constructor(private readonly access: AdminAccessService) {}

  @Post('invitations/accept')
  acceptInvitation(@Body() dto: AcceptInviteDto) {
    return this.access.acceptInvitation(dto.token, dto.password, dto.fullName);
  }
}
