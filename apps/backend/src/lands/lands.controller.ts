import { Body, Controller, Delete, Get, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles, RolesGuard } from '../auth/rbac.guard';
import { CreateLandForSaleDto } from './dto/create-land-for-sale.dto';
import { UpdateLandViewingOutcomeDto } from './dto/update-land-viewing-outcome.dto';
import { LandsService } from './lands.service';

@Controller('lands')
export class LandsController {
  constructor(private readonly landsService: LandsService) {}

  @Get()
  getAll() {
    return this.landsService.getAll();
  }

  @Get('admin/list')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  getAdminList() {
    return this.landsService.getAdminList();
  }

  @Get('admin/viewing-interests')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  getAdminViewingInterests() {
    return this.landsService.getAdminViewingInterests();
  }

  @Patch('admin/viewing-interests/read')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  markViewingInterestsRead() {
    return this.landsService.markViewingInterestsRead();
  }

  @Patch('admin/viewing-interests/:interestId/outcome')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  updateViewingOutcome(
    @Param('interestId') interestId: string,
    @Body() dto: UpdateLandViewingOutcomeDto,
  ) {
    return this.landsService.updateViewingOutcome(interestId, dto.outcomeStatus);
  }

  @Get('me/purchases')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('homeowner')
  getHomeownerPurchases(@Req() req: any) {
    return this.landsService.getHomeownerPurchases(req.user?.sub);
  }

  @Get(':id')
  getById(@Param('id') id: string) {
    return this.landsService.getById(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  create(@Body() dto: CreateLandForSaleDto) {
    return this.landsService.create(dto);
  }

  @Post(':id/schedule-viewing')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('homeowner')
  scheduleViewing(@Param('id') id: string, @Req() req: any) {
    return this.landsService.scheduleViewing(id, req.user?.sub);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  delete(@Param('id') id: string) {
    return this.landsService.delete(id);
  }
}
