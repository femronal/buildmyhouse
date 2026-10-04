import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { ArtisanCapabilityKind } from '@prisma/client';
import { IsArray, IsBoolean, IsIn, IsOptional, IsString } from 'class-validator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles, RolesGuard } from '../auth/rbac.guard';
import { PermissionsGuard } from '../hr/permissions/permissions.guard';
import { RequirePermissions } from '../hr/permissions/require-permissions.decorator';
import { ArtisansService } from './artisans.service';
import {
  AdminArtisanPatchDto,
  AdminArtisanSearchDto,
  AdminArtisanWriteDto,
  ArtisanApplicationReviewDto,
  AdminClaimInviteDto,
  AdminClaimReviewDto,
  AdminListingStatusDto,
  AdminMediaReviewDto,
  AdminRecruitmentDto,
  AdminVerificationDto,
} from './dto/artisans.dto';

class TradeBodyDto {
  @IsString()
  label!: string;
}

class TradePatchDto {
  @IsOptional()
  @IsString()
  label?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

class TradeReorderDto {
  @IsArray()
  @IsString({ each: true })
  ids!: string[];
}

class CapabilityBodyDto {
  @IsString()
  label!: string;

  @IsIn(['problem', 'service', 'specialty'])
  kind!: 'problem' | 'service' | 'specialty';

  @IsOptional()
  @IsString()
  professionalNote?: string;
}

class CapabilityPatchDto {
  @IsOptional()
  @IsString()
  label?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsString()
  professionalNote?: string;
}

@Controller('admin/artisans')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Roles('admin')
export class ArtisansAdminController {
  constructor(private readonly artisans: ArtisansService) {}

  @Get()
  @RequirePermissions('artisans.view')
  search(@Query() query: AdminArtisanSearchDto) {
    return this.artisans.adminSearch(query);
  }

  @Get('meta')
  @RequirePermissions('artisans.view')
  meta() {
    return this.artisans.getMeta();
  }

  @Get('catalog')
  @RequirePermissions('artisans.view')
  catalog() {
    return this.artisans.getCatalog();
  }

  @Post('trades')
  @RequirePermissions('artisans.edit')
  createTrade(@Body() body: TradeBodyDto) {
    return this.artisans.createTrade(body.label);
  }

  @Patch('trades/reorder')
  @RequirePermissions('artisans.edit')
  reorderTrades(@Body() body: TradeReorderDto) {
    return this.artisans.reorderTrades(body.ids);
  }

  @Patch('trades/:tradeId')
  @RequirePermissions('artisans.edit')
  updateTrade(@Param('tradeId') tradeId: string, @Body() body: TradePatchDto) {
    return this.artisans.updateTrade(tradeId, body);
  }

  @Delete('trades/:tradeId')
  @RequirePermissions('artisans.edit')
  deleteTrade(@Param('tradeId') tradeId: string) {
    return this.artisans.deleteTrade(tradeId);
  }

  @Post('trades/:tradeId/capabilities')
  @RequirePermissions('artisans.edit')
  createCapability(@Param('tradeId') tradeId: string, @Body() body: CapabilityBodyDto) {
    return this.artisans.createCapability(tradeId, body.kind as ArtisanCapabilityKind, body.label, body.professionalNote);
  }

  @Patch('capabilities/:capabilityId')
  @RequirePermissions('artisans.edit')
  updateCapability(@Param('capabilityId') capabilityId: string, @Body() body: CapabilityPatchDto) {
    return this.artisans.updateCapability(capabilityId, body);
  }

  @Delete('capabilities/:capabilityId')
  @RequirePermissions('artisans.edit')
  deleteCapability(@Param('capabilityId') capabilityId: string) {
    return this.artisans.deleteCapability(capabilityId);
  }

  @Get('claims')
  @RequirePermissions('artisans.review')
  claims() {
    return this.artisans.listClaims();
  }

  @Patch('claims/:id')
  @RequirePermissions('artisans.review')
  reviewClaim(@Req() req: any, @Param('id') id: string, @Body() body: AdminClaimReviewDto) {
    return this.artisans.reviewClaim(req.user.sub, id, body);
  }

  @Get('applications')
  @RequirePermissions('artisans.review')
  applications() {
    return this.artisans.listApplications();
  }

  @Patch('applications/:id')
  @RequirePermissions('artisans.review')
  reviewApplication(@Req() req: any, @Param('id') id: string, @Body() body: ArtisanApplicationReviewDto) {
    return this.artisans.reviewApplication(req.user.sub, id, body.status, body.adminNotes);
  }

  @Get('duplicates')
  @RequirePermissions('artisans.view')
  duplicates(
    @Query('displayName') displayName?: string,
    @Query('phone') phone?: string,
    @Query('email') email?: string,
    @Query('website') website?: string,
  ) {
    return this.artisans.findDuplicates({ displayName, phone, email, website });
  }

  @Patch('media/:mediaId')
  @RequirePermissions('artisans.edit')
  reviewMedia(@Req() req: any, @Param('mediaId') mediaId: string, @Body() body: AdminMediaReviewDto) {
    return this.artisans.reviewMedia(req.user.sub, mediaId, body);
  }

  @Post()
  @RequirePermissions('artisans.create')
  create(@Req() req: any, @Body() body: AdminArtisanWriteDto) {
    return this.artisans.createListing(body, req.user.sub);
  }

  @Get(':id')
  @RequirePermissions('artisans.view')
  getOne(@Param('id') id: string) {
    return this.artisans.adminGet(id);
  }

  @Patch(':id')
  @RequirePermissions('artisans.edit')
  patch(@Param('id') id: string, @Body() body: AdminArtisanPatchDto) {
    return this.artisans.adminPatch(id, body);
  }

  @Patch(':id/listing-status')
  @RequirePermissions('artisans.review')
  listingStatus(@Param('id') id: string, @Body() body: AdminListingStatusDto) {
    return this.artisans.setListingStatus(id, body);
  }

  @Patch(':id/recruitment-status')
  @RequirePermissions('artisans.edit')
  recruitment(@Param('id') id: string, @Body() body: AdminRecruitmentDto) {
    return this.artisans.setRecruitment(id, body);
  }

  @Patch(':id/verification')
  @RequirePermissions('artisans.verify')
  verification(@Req() req: any, @Param('id') id: string, @Body() body: AdminVerificationDto) {
    return this.artisans.setVerification(req.user.sub, id, body);
  }

  @Get(':id/claim-link')
  @RequirePermissions('artisans.view')
  getClaimLink(@Param('id') id: string) {
    return this.artisans.getClaimLink(id);
  }

  @Post(':id/claim-link')
  @RequirePermissions('artisans.edit')
  ensureClaimLink(@Req() req: any, @Param('id') id: string) {
    return this.artisans.ensureClaimLink(id, req.user.sub);
  }

  @Post(':id/claim-link/email')
  @RequirePermissions('artisans.edit')
  emailClaimLink(@Req() req: any, @Param('id') id: string, @Body() body: AdminClaimInviteDto) {
    return this.artisans.emailArtisanClaimLink(id, req.user.sub, body?.email);
  }

  @Post(':id/claim-link/regenerate')
  @RequirePermissions('artisans.edit')
  regenerateClaimLink(@Req() req: any, @Param('id') id: string) {
    return this.artisans.regenerateArtisanClaimLink(id, req.user.sub);
  }

  @Post(':id/claim-invitation')
  @RequirePermissions('artisans.review')
  invite(@Req() req: any, @Param('id') id: string, @Body() body: AdminClaimInviteDto) {
    return this.artisans.createInvite(id, req.user.sub, body);
  }
}
