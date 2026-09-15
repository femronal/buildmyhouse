import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ProfessionalReviewStatus } from '@prisma/client';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles, RolesGuard } from '../auth/rbac.guard';
import { PermissionsGuard } from '../hr/permissions/permissions.guard';
import { RequirePermissions } from '../hr/permissions/require-permissions.decorator';
import {
  AdminCreateProfessionalDto,
  AdminCredentialDocumentDto,
  AdminCredentialDto,
  AdminEngagementDto,
  AdminEngagementUpdateDto,
  AdminListingStatusDto,
  AdminProcurementDto,
  AdminProfessionalSearchDto,
  AdminProfessionalWriteDto,
  AdminReviewDto,
  AdminTaxonomyPatchDto,
  AdminVerificationActionDto,
} from './dto/professionals.dto';
import { ProfessionalsService } from './professionals.service';

@Controller('admin/professionals')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Roles('admin')
export class ProfessionalsAdminController {
  constructor(private readonly professionals: ProfessionalsService) {}

  @Get()
  @RequirePermissions('professionals.view')
  search(@Query() query: AdminProfessionalSearchDto) {
    return this.professionals.adminSearch(query);
  }

  @Get('meta')
  @RequirePermissions('professionals.view')
  meta() {
    return this.professionals.getMeta(false);
  }

  @Get('duplicates')
  @RequirePermissions('professionals.view')
  duplicates(
    @Query('displayName') displayName?: string,
    @Query('phone') phone?: string,
    @Query('email') email?: string,
    @Query('website') website?: string,
    @Query('regulatorKey') regulatorKey?: string,
    @Query('registrationNumber') registrationNumber?: string,
    @Query('excludeId') excludeId?: string,
  ) {
    return this.professionals.findDuplicates({
      displayName,
      phone,
      email,
      website,
      regulatorKey,
      registrationNumber,
      excludeId,
    });
  }

  @Get('applications')
  @RequirePermissions('professionals.review')
  applications(@Query('status') status?: ProfessionalReviewStatus) {
    return this.professionals.listApplications(status);
  }

  @Get('claims')
  @RequirePermissions('professionals.review')
  claims(@Query('status') status?: ProfessionalReviewStatus) {
    return this.professionals.listClaims(status);
  }

  @Get('enquiries')
  @RequirePermissions('professionals.view')
  enquiries() {
    return this.professionals.listEnquiries();
  }

  @Post()
  @RequirePermissions('professionals.create')
  create(@Req() req: any, @Body() body: AdminCreateProfessionalDto) {
    return this.professionals.adminCreate(req.user.sub, body);
  }

  @Get(':id')
  @RequirePermissions('professionals.view')
  get(@Param('id') id: string) {
    return this.professionals.adminGet(id);
  }

  @Patch(':id')
  @RequirePermissions('professionals.edit')
  update(@Param('id') id: string, @Body() body: AdminProfessionalWriteDto) {
    return this.professionals.adminUpdate(id, body);
  }

  @Patch(':id/listing-status')
  @RequirePermissions('professionals.review')
  listingStatus(@Param('id') id: string, @Body() body: AdminListingStatusDto) {
    return this.professionals.setListingStatus(id, body);
  }

  @Patch(':id/verification')
  @RequirePermissions('professionals.verify')
  verification(@Req() req: any, @Param('id') id: string, @Body() body: AdminVerificationActionDto) {
    return this.professionals.setVerification(req.user.sub, id, body);
  }

  @Patch(':id/procurement')
  @RequirePermissions('professionals.edit')
  procurement(@Param('id') id: string, @Body() body: AdminProcurementDto) {
    return this.professionals.upsertProcurement(id, body);
  }

  @Post(':id/credentials')
  @RequirePermissions('professionals.verify')
  addCredential(@Req() req: any, @Param('id') id: string, @Body() body: AdminCredentialDto) {
    return this.professionals.addCredential(req.user.sub, id, body);
  }

  @Post(':id/engagements')
  @RequirePermissions('professionals.edit')
  createEngagement(@Req() req: any, @Param('id') id: string, @Body() body: AdminEngagementDto) {
    return this.professionals.createEngagement(req.user.sub, id, body);
  }

  @Patch('credentials/:credentialId')
  @RequirePermissions('professionals.verify')
  updateCredential(
    @Req() req: any,
    @Param('credentialId') credentialId: string,
    @Body() body: AdminCredentialDto,
  ) {
    return this.professionals.updateCredential(req.user.sub, credentialId, body);
  }

  @Delete('credentials/:credentialId')
  @RequirePermissions('professionals.verify')
  deleteCredential(@Param('credentialId') credentialId: string) {
    return this.professionals.deleteCredential(credentialId);
  }

  @Post('credentials/:credentialId/documents')
  @RequirePermissions('professionals.verify')
  addDocument(
    @Req() req: any,
    @Param('credentialId') credentialId: string,
    @Body() body: AdminCredentialDocumentDto,
  ) {
    return this.professionals.addCredentialDocument(credentialId, body, req.user.sub);
  }

  @Patch('applications/:id')
  @RequirePermissions('professionals.review')
  reviewApplication(@Req() req: any, @Param('id') id: string, @Body() body: AdminReviewDto) {
    return this.professionals.reviewApplication(req.user.sub, id, body);
  }

  @Patch('claims/:id')
  @RequirePermissions('professionals.review')
  reviewClaim(@Req() req: any, @Param('id') id: string, @Body() body: AdminReviewDto) {
    return this.professionals.reviewClaim(req.user.sub, id, body);
  }

  @Patch('engagements/:id')
  @RequirePermissions('professionals.edit')
  updateEngagement(@Param('id') id: string, @Body() body: AdminEngagementUpdateDto) {
    return this.professionals.updateEngagement(id, body);
  }

  @Patch('taxonomy/:kind/:id')
  @RequirePermissions('professionals.edit')
  patchTaxonomy(
    @Param('kind') kind: 'profession' | 'specialty' | 'service' | 'deliverable' | 'stage',
    @Param('id') id: string,
    @Body() body: AdminTaxonomyPatchDto,
  ) {
    return this.professionals.patchTaxonomy(kind, id, body);
  }
}
