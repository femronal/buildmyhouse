import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { PaymentsService } from '../services/payments.service';
import { CreatePaymentIntentDto } from '../dto/create-payment-intent.dto';
import { CreatePayoutDto } from '../dto/create-payout.dto';
import { SetDefaultPaymentMethodDto } from '../dto/set-default-payment-method.dto';
import { CreateSetupCheckoutSessionDto } from '../dto/create-setup-checkout-session.dto';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { RolesGuard, Roles } from '../../auth/rbac.guard';

@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('setup-checkout')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('homeowner', 'admin')
  createSetupCheckoutSession(
    @Request() req: any,
    @Body() dto: CreateSetupCheckoutSessionDto,
  ) {
    const userId = req.user?.sub;
    const origin = req.headers?.origin as string | undefined;
    return this.paymentsService.createSetupCheckoutSession(userId, {
      successUrl: dto.successUrl,
      cancelUrl: dto.cancelUrl,
      origin,
    });
  }

  @Post('setup-intent')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('homeowner', 'admin')
  createSetupIntent(@Request() req: any) {
    const userId = req.user?.sub;
    return this.paymentsService.createSetupIntent(userId);
  }

  @Get('methods')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('homeowner', 'admin')
  listPaymentMethods(@Request() req: any) {
    const userId = req.user?.sub;
    return this.paymentsService.listPaymentMethods(userId);
  }

  @Post('methods/default')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('homeowner', 'admin')
  setDefaultPaymentMethod(
    @Request() req: any,
    @Body() dto: SetDefaultPaymentMethodDto,
  ) {
    const userId = req.user?.sub;
    return this.paymentsService.setDefaultPaymentMethod(userId, dto.paymentMethodId);
  }

  @Post('intent')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('homeowner', 'admin')
  createPaymentIntent(
    @Request() req: any,
    @Body() createPaymentIntentDto: CreatePaymentIntentDto,
  ) {
    const userId = req.user?.sub;
    return this.paymentsService.createPaymentIntent(userId, createPaymentIntentDto);
  }

  @Get('project/:projectId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('homeowner', 'general_contractor', 'admin')
  getProjectPayments(@Param('projectId') projectId: string) {
    return this.paymentsService.getProjectPayments(projectId);
  }

  @Get('my')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('homeowner', 'general_contractor', 'subcontractor', 'vendor', 'admin')
  getMyPayments(@Request() req: any) {
    const userId = req.user?.sub;
    return this.paymentsService.getUserPayments(userId);
  }

  @Get('my-structured')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('homeowner', 'admin')
  getMyPaymentsStructured(@Request() req: any) {
    const userId = req.user?.sub;
    return this.paymentsService.getUserPaymentsStructured(userId);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('homeowner', 'general_contractor', 'subcontractor', 'vendor', 'admin')
  getPayment(@Param('id') id: string) {
    return this.paymentsService.getPayment(id);
  }

  @Post('payout')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'vendor')
  createPayout(@Body() createPayoutDto: CreatePayoutDto) {
    return this.paymentsService.createPayout(createPayoutDto);
  }
}
