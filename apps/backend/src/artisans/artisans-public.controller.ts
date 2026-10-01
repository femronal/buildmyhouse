import { Body, Controller, Get, Param, Post, Query, Req, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles, RolesGuard } from '../auth/rbac.guard';
import { ArtisansService } from './artisans.service';
import { ArtisanApplicationDto, ArtisanClaimRequestDto, PublicArtisanSearchDto } from './dto/artisans.dto';

@Controller('artisans')
export class ArtisansPublicController {
  constructor(private readonly artisans: ArtisansService) {}

  @Get()
  search(@Query() query: PublicArtisanSearchDto) {
    return this.artisans.searchPublic(query);
  }

  @Get('meta')
  meta() {
    return this.artisans.getMeta();
  }

  @Get('claim/:token')
  previewClaim(@Param('token') token: string) {
    return this.artisans.previewClaim(token);
  }

  @Post('claim/:token')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('general_contractor', 'admin', 'homeowner')
  acceptClaim(@Param('token') token: string, @Req() req: any) {
    return this.artisans.acceptClaim(token, req.user.sub);
  }

  @Post('applications')
  @Throttle({ short: { limit: 8, ttl: 60000 } })
  apply(@Body() body: ArtisanApplicationDto) {
    return this.artisans.apply(body);
  }

  @Post('claims')
  @Throttle({ short: { limit: 8, ttl: 60000 } })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('general_contractor', 'admin')
  requestClaim(@Req() req: any, @Body() body: ArtisanClaimRequestDto) {
    return this.artisans.requestClaim(req.user.sub, body);
  }

  @Get(':slug')
  getOne(@Param('slug') slug: string) {
    return this.artisans.getPublic(slug);
  }
}
