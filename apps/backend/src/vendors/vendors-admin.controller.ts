import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles, RolesGuard } from '../auth/rbac.guard';
import { PermissionsGuard } from '../hr/permissions/permissions.guard';
import { RequirePermissions } from '../hr/permissions/require-permissions.decorator';
import {
  AdminActivityDto,
  AdminClaimInviteDto,
  AdminCreateVendorDto,
  AdminNoteDto,
  AdminReviewActionDto,
  AdminUpdateVendorDto,
  AdminUpsertVerificationChecksDto,
  AdminVendorSearchDto,
} from './dto/vendors.dto';
import { VendorsService } from './vendors.service';

@Controller('admin/vendors')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Roles('admin')
export class VendorsAdminController {
  constructor(private readonly vendors: VendorsService) {}

  @Get()
  @RequirePermissions('vendors.view')
  search(@Query() query: AdminVendorSearchDto) {
    return this.vendors.adminSearch(query);
  }

  @Get('duplicates')
  @RequirePermissions('vendors.view')
  duplicates(
    @Query('tradingName') tradingName?: string,
    @Query('phone') phone?: string,
    @Query('whatsapp') whatsapp?: string,
    @Query('email') email?: string,
    @Query('cacNumber') cacNumber?: string,
    @Query('websiteUrl') websiteUrl?: string,
    @Query('excludeId') excludeId?: string,
  ) {
    return this.vendors.findDuplicateCandidates({
      tradingName,
      phone,
      whatsapp,
      email,
      cacNumber,
      websiteUrl,
      excludeId,
    });
  }

  @Post()
  @RequirePermissions('vendors.create')
  create(@Req() req: any, @Body() body: AdminCreateVendorDto) {
    return this.vendors.adminCreate(req.user.sub, body);
  }

  @Get(':id')
  @RequirePermissions('vendors.view')
  get(@Param('id') id: string) {
    return this.vendors.adminGet(id);
  }

  @Patch(':id')
  @RequirePermissions('vendors.edit')
  update(@Param('id') id: string, @Req() req: any, @Body() body: AdminUpdateVendorDto) {
    return this.vendors.adminUpdate(id, req.user.sub, body);
  }

  @Post(':id/under-review')
  @RequirePermissions('vendors.review')
  underReview(@Param('id') id: string, @Req() req: any) {
    return this.vendors.adminSetUnderReview(id, req.user.sub);
  }

  @Post(':id/request-clarification')
  @RequirePermissions('vendors.review')
  clarify(@Param('id') id: string, @Req() req: any, @Body() body: AdminReviewActionDto) {
    return this.vendors.adminRequestClarification(id, req.user.sub, body);
  }

  @Post(':id/approve-listing')
  @RequirePermissions('vendors.review')
  approve(@Param('id') id: string, @Req() req: any, @Body() body: AdminReviewActionDto) {
    return this.vendors.adminApproveListing(id, req.user.sub, body);
  }

  @Post(':id/reject')
  @RequirePermissions('vendors.review')
  reject(@Param('id') id: string, @Req() req: any, @Body() body: AdminReviewActionDto) {
    return this.vendors.adminReject(id, req.user.sub, body);
  }

  @Post(':id/suspend')
  @RequirePermissions('vendors.suspend')
  suspend(@Param('id') id: string, @Req() req: any, @Body() body: AdminReviewActionDto) {
    return this.vendors.adminSuspend(id, req.user.sub, body);
  }

  @Post(':id/restore')
  @RequirePermissions('vendors.suspend')
  restore(@Param('id') id: string, @Req() req: any, @Body() body: AdminReviewActionDto) {
    return this.vendors.adminRestore(id, req.user.sub, body);
  }

  @Post(':id/verification-checks')
  @RequirePermissions('vendors.verify')
  verificationChecks(
    @Param('id') id: string,
    @Req() req: any,
    @Body() body: AdminUpsertVerificationChecksDto,
  ) {
    return this.vendors.adminUpsertVerificationChecks(id, req.user.sub, body);
  }

  @Post(':id/notes')
  @RequirePermissions('vendors.notes.manage')
  addNote(@Param('id') id: string, @Req() req: any, @Body() body: AdminNoteDto) {
    return this.vendors.adminAddNote(id, req.user.sub, body.body);
  }

  @Post(':id/activities')
  @RequirePermissions('vendors.notes.manage')
  addActivity(@Param('id') id: string, @Req() req: any, @Body() body: AdminActivityDto) {
    return this.vendors.adminAddActivity(id, req.user.sub, body);
  }

  @Post(':id/claim-invite')
  @RequirePermissions('vendors.edit')
  claimInvite(@Param('id') id: string, @Req() req: any, @Body() body: AdminClaimInviteDto) {
    return this.vendors.adminCreateClaimInvite(id, req.user.sub, body);
  }
}
