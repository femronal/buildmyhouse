import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles, RolesGuard } from '../auth/rbac.guard';
import { CreateRentalListingDto } from './dto/create-rental-listing.dto';
import { UpdateRentalViewingOutcomeDto } from './dto/update-rental-viewing-outcome.dto';
import { RentalsService } from './rentals.service';

@Controller('rentals')
export class RentalsController {
  constructor(private readonly rentalsService: RentalsService) {}

  @Get()
  getAll() {
    return this.rentalsService.getAll();
  }

  @Get('admin/list')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  getAdminList() {
    return this.rentalsService.getAdminList();
  }

  @Get('admin/viewing-interests')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  getAdminViewingInterests() {
    return this.rentalsService.getAdminViewingInterests();
  }

  @Patch('admin/viewing-interests/read')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  markViewingInterestsRead() {
    return this.rentalsService.markViewingInterestsRead();
  }

  @Patch('admin/viewing-interests/:interestId/outcome')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  updateViewingOutcome(
    @Param('interestId') interestId: string,
    @Body() dto: UpdateRentalViewingOutcomeDto,
  ) {
    return this.rentalsService.updateViewingOutcome(interestId, dto.outcomeStatus);
  }

  @Get('me/purchases')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('homeowner')
  getHomeownerPurchases(@Req() req: any) {
    return this.rentalsService.getHomeownerPurchases(req.user?.sub);
  }

  @Get(':id')
  getById(@Param('id') id: string) {
    return this.rentalsService.getById(id);
  }

  @Post(':id/request-inspection')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('homeowner')
  requestInspection(@Param('id') id: string, @Req() req: any) {
    return this.rentalsService.requestInspection(id, req.user?.sub);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  create(@Body() dto: CreateRentalListingDto) {
    return this.rentalsService.create(dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  delete(@Param('id') id: string) {
    return this.rentalsService.delete(id);
  }
}

