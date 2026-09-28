import { Body, Controller, Get, Param, Post, Query, Req, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles, RolesGuard } from '../auth/rbac.guard';
import {
  ApplyProfessionalDto,
  ClaimProfessionalDto,
  ProfessionalDocumentInputDto,
  ProfessionalEnquiryDto,
  ProfessionalManageUpdateDto,
  ProfessionalOwnerCredentialDto,
  PublicProfessionalSearchDto,
} from './dto/professionals.dto';
import { ProfessionalsService } from './professionals.service';

const CLAIM_ROLES = ['vendor', 'homeowner', 'general_contractor', 'admin'] as const;

@Controller('professionals')
export class ProfessionalsPublicController {
  constructor(private readonly professionals: ProfessionalsService) {}

  @Get()
  search(@Query() query: PublicProfessionalSearchDto) {
    return this.professionals.searchPublic(query);
  }

  @Get('meta')
  meta() {
    return this.professionals.getMeta(true);
  }

  @Post('applications')
  @Throttle({ short: { limit: 10, ttl: 60000 } })
  apply(@Body() body: ApplyProfessionalDto) {
    return this.professionals.apply(body);
  }

  @Post('claims')
  @Throttle({ short: { limit: 10, ttl: 60000 } })
  claim(@Body() body: ClaimProfessionalDto) {
    return this.professionals.claim(body);
  }

  @Post('enquiries')
  @Throttle({ short: { limit: 20, ttl: 60000 } })
  enquire(@Body() body: ProfessionalEnquiryDto) {
    return this.professionals.createEnquiry(body);
  }

  @Get('claim/:token')
  previewClaim(@Param('token') token: string) {
    return this.professionals.previewClaim(token);
  }

  @Post('claim/:token')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...CLAIM_ROLES)
  acceptClaim(@Param('token') token: string, @Req() req: any) {
    return this.professionals.acceptClaim(token, req.user.sub);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...CLAIM_ROLES)
  getMe(@Req() req: any) {
    return this.professionals.getManagedProfile(req.user.sub);
  }

  @Post('me')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...CLAIM_ROLES)
  updateMe(@Req() req: any, @Body() body: ProfessionalManageUpdateDto) {
    return this.professionals.updateManaged(req.user.sub, body);
  }

  @Post('me/credentials/:credentialId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...CLAIM_ROLES)
  updateMyCredential(
    @Req() req: any,
    @Param('credentialId') credentialId: string,
    @Body() body: ProfessionalOwnerCredentialDto,
  ) {
    return this.professionals.updateManagedCredential(req.user.sub, credentialId, body);
  }

  @Post('me/documents')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...CLAIM_ROLES)
  addDocument(@Req() req: any, @Body() body: ProfessionalDocumentInputDto) {
    return this.professionals.addManagedDocument(req.user.sub, body);
  }

  @Post('me/verify')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...CLAIM_ROLES)
  selfVerifyBlocked() {
    return this.professionals.assertPublicCannotSelfVerify();
  }

  @Get(':slug')
  getBySlug(@Param('slug') slug: string) {
    return this.professionals.getPublicBySlug(slug);
  }

  @Post(':slug/enquiries')
  @Throttle({ short: { limit: 20, ttl: 60000 } })
  enquireForSlug(@Param('slug') slug: string, @Body() body: ProfessionalEnquiryDto) {
    return this.professionals.createEnquiry({ ...body, slug });
  }

  @Post(':slug/verify')
  selfVerifyBlocked() {
    return this.professionals.assertPublicCannotSelfVerify();
  }
}
