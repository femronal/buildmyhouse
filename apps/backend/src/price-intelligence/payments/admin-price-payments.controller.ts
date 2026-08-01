import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { Roles, RolesGuard } from '../../auth/rbac.guard';
import { AdminPricePaymentsService } from './admin-price-payments.service';

@Controller('admin/price-payments')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class AdminPricePaymentsController {
  constructor(private readonly service: AdminPricePaymentsService) {}

  @Get('revenue')
  revenue(@Query('days') days?: string) {
    return this.service.revenueCards(days ? Number(days) : 30);
  }

  @Get('transactions')
  transactions(@Query('take') take?: string) {
    return this.service.transactions(take ? Number(take) : 50);
  }

  @Get('unit-economics')
  unitEconomics(@Query('take') take?: string) {
    return this.service.unitEconomics(take ? Number(take) : 50);
  }

  @Get('alerts')
  alerts() {
    return this.service.alerts();
  }
}
