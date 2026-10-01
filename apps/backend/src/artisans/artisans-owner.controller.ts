import { Body, Controller, Delete, Get, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles, RolesGuard } from '../auth/rbac.guard';
import { ArtisansService } from './artisans.service';
import { ArtisanMediaInputDto, ArtisanOwnerUpdateDto, ArtisanVerificationSubmitDto } from './dto/artisans.dto';

@Controller('artisans/my-listings')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('general_contractor', 'admin', 'homeowner')
export class ArtisansOwnerController {
  constructor(private readonly artisans: ArtisansService) {}

  @Get()
  list(@Req() req: any) {
    return this.artisans.listMine(req.user.sub);
  }

  @Post('intro-seen')
  intro(@Req() req: any) {
    return this.artisans.markIntroSeen(req.user.sub);
  }

  @Get(':id')
  getOne(@Req() req: any, @Param('id') id: string) {
    return this.artisans.getMine(req.user.sub, id);
  }

  @Patch(':id')
  update(@Req() req: any, @Param('id') id: string, @Body() body: ArtisanOwnerUpdateDto) {
    return this.artisans.updateMine(req.user.sub, id, body);
  }

  @Post(':id/media')
  addMedia(@Req() req: any, @Param('id') id: string, @Body() body: ArtisanMediaInputDto) {
    return this.artisans.addMedia(req.user.sub, id, body);
  }

  @Delete(':id/media/:mediaId')
  removeMedia(@Req() req: any, @Param('id') id: string, @Param('mediaId') mediaId: string) {
    return this.artisans.removeMedia(req.user.sub, id, mediaId);
  }

  @Post(':id/verification')
  verify(@Req() req: any, @Param('id') id: string, @Body() body: ArtisanVerificationSubmitDto) {
    return this.artisans.submitVerification(req.user.sub, id, body);
  }
}
