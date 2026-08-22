import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles, RolesGuard } from '../auth/rbac.guard';
import { OptionalJwtAuthGuard } from '../auth/optional-jwt-auth.guard';
import {
  ApplyVendorDto,
  PublicVendorSearchDto,
  VendorDocumentInputDto,
  VendorManageUpdateDto,
  VendorQuoteRequestDto,
  VendorSensitiveChangeDto,
} from './dto/vendors.dto';
import { VendorsService } from './vendors.service';

@Controller('vendors')
export class VendorsPublicController {
  constructor(private readonly vendors: VendorsService) {}

  @Get()
  search(@Query() query: PublicVendorSearchDto) {
    return this.vendors.searchPublic(query);
  }

  @Get('claim/:token')
  previewClaim(@Param('token') token: string) {
    return this.vendors.previewClaim(token);
  }

  @Post('claim/:token')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('vendor', 'homeowner', 'general_contractor', 'admin')
  acceptClaim(@Param('token') token: string, @Req() req: any) {
    return this.vendors.acceptClaim(token, req.user.sub);
  }

  /**
   * Allow claim-capable roles too: JWT may still say homeowner/gc until re-login
   * after acceptClaim upgrades DB role to vendor. Service still requires a linked profile.
   */
  @Get('me')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('vendor', 'admin', 'homeowner', 'general_contractor')
  getMe(@Req() req: any) {
    return this.vendors.getManagedProfile(req.user.sub);
  }

  @Post('me')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('vendor', 'admin', 'homeowner', 'general_contractor')
  updateMe(@Req() req: any, @Body() body: VendorManageUpdateDto) {
    return this.vendors.updateManagedProfile(req.user.sub, body);
  }

  @Post('me/change-requests')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('vendor', 'admin', 'homeowner', 'general_contractor')
  sensitiveChange(@Req() req: any, @Body() body: VendorSensitiveChangeDto) {
    return this.vendors.submitSensitiveChange(req.user.sub, body);
  }

  @Post('me/documents')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('vendor', 'admin', 'homeowner', 'general_contractor')
  addDocument(@Req() req: any, @Body() body: VendorDocumentInputDto) {
    return this.vendors.addManagedDocument(req.user.sub, body);
  }

  @Post('me/verify')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('vendor', 'admin', 'homeowner', 'general_contractor')
  selfVerifyBlocked() {
    return this.vendors.assertVendorCannotSelfVerify();
  }

  @Post('me/approve')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('vendor', 'admin', 'homeowner', 'general_contractor')
  selfApproveBlocked() {
    return this.vendors.assertVendorCannotSelfVerify();
  }

  @Post('apply')
  @UseGuards(OptionalJwtAuthGuard)
  @Throttle({ short: { limit: 10, ttl: 60000 } })
  apply(@Body() body: ApplyVendorDto, @Req() req: any) {
    return this.vendors.apply(body, req.user?.sub);
  }

  @Get(':slug')
  getBySlug(@Param('slug') slug: string) {
    return this.vendors.getPublicBySlug(slug);
  }

  @Post(':slug/quote-requests')
  @Throttle({ short: { limit: 20, ttl: 60000 } })
  quote(@Param('slug') slug: string, @Body() body: VendorQuoteRequestDto) {
    return this.vendors.createQuoteRequest(slug, body);
  }
}
