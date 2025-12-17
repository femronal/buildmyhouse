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
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { RolesGuard, Roles } from '../../auth/rbac.guard';

@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

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
