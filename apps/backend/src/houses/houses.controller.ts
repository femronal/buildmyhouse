import { Controller, Get, Post, Delete, Patch, Param, Body, Req, UseGuards } from '@nestjs/common';
import { HousesService } from './houses.service';
import { CreateHouseForSaleDto } from './dto/create-house-for-sale.dto';
import { UpdateHouseViewingOutcomeDto } from './dto/update-house-viewing-outcome.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard, Roles } from '../auth/rbac.guard';

@Controller('houses')
export class HousesController {
  constructor(private readonly housesService: HousesService) {}

  @Get()
  getAll() {
    return this.housesService.getAll();
  }

  @Get('admin/list')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  getAdminList() {
    return this.housesService.getAdminList();
  }

  @Get('admin/viewing-interests')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  getAdminViewingInterests() {
    return this.housesService.getAdminViewingInterests();
  }

  @Patch('admin/viewing-interests/read')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  markViewingInterestsRead() {
    return this.housesService.markViewingInterestsRead();
  }

  @Patch('admin/viewing-interests/:interestId/outcome')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  updateViewingOutcome(
    @Param('interestId') interestId: string,
    @Body() dto: UpdateHouseViewingOutcomeDto,
  ) {
    return this.housesService.updateViewingOutcome(interestId, dto.outcomeStatus);
  }

  @Get('me/purchases')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('homeowner')
  getHomeownerPurchases(@Req() req: any) {
    return this.housesService.getHomeownerPurchases(req.user?.sub);
  }

  @Get(':id')
  getById(@Param('id') id: string) {
    return this.housesService.getById(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  create(@Body() dto: CreateHouseForSaleDto) {
    return this.housesService.create(dto);
  }

  @Post(':id/schedule-viewing')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('homeowner')
  scheduleViewing(@Param('id') id: string, @Req() req: any) {
    return this.housesService.scheduleViewing(id, req.user?.sub);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  delete(@Param('id') id: string) {
    return this.housesService.delete(id);
  }
}
