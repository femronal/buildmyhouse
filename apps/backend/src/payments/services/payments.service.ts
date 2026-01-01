import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { StripeService } from './stripe.service';
import { CreatePaymentIntentDto } from '../dto/create-payment-intent.dto';
import { CreatePayoutDto } from '../dto/create-payout.dto';
import { WebSocketService } from '../../websocket/websocket.service';

@Injectable()
export class PaymentsService {
  private prisma = new PrismaClient();
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    private readonly stripeService: StripeService,
    private readonly wsService: WebSocketService,
  ) {}

  /**
   * Create payment intent for a project/stage
   */
  async createPaymentIntent(userId: string, createPaymentIntentDto: CreatePaymentIntentDto) {
    const { amount, projectId, stageId, currency, description } = createPaymentIntentDto;

    // Verify project exists and user has access
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      include: { homeowner: true },
    });

    if (!project) {
      throw new NotFoundException(`Project with ID ${projectId} not found`);
    }

    // Verify user is the homeowner
    if (project.homeownerId !== userId) {
      throw new BadRequestException('Only the project homeowner can create payments');
    }

    // Verify stage if provided
    if (stageId) {
      const stage = await this.prisma.stage.findUnique({
        where: { id: stageId },
      });

      if (!stage || stage.projectId !== projectId) {
        throw new NotFoundException(`Stage with ID ${stageId} not found in this project`);
      }
    }

    let customer;
    let paymentIntent;
    
    try {
      // Get or create Stripe customer
      customer = await this.stripeService.getOrCreateCustomer(
        project.homeowner.email,
        userId,
      );

      // Create payment intent
      paymentIntent = await this.stripeService.createPaymentIntent({
        amount,
        currency,
        description: description || `Payment for project: ${project.name}`,
        metadata: {
          projectId,
          stageId: stageId || '',
          userId,
          customerId: customer.id,
        },
      });
    } catch (error: any) {
      this.logger.error(`Failed to create payment intent: ${error.message}`);
      
      // Handle Stripe API errors
      if (error.type === 'StripeAuthenticationError' || error.message?.includes('Invalid API Key')) {
        throw new BadRequestException(
          'Stripe API key is invalid or not configured. Please check your STRIPE_SECRET_KEY in the backend .env file.'
        );
      }
      
      // Re-throw other errors
      throw new BadRequestException(`Failed to create payment intent: ${error.message}`);
    }

    // Create payment record in database
    const payment = await this.prisma.payment.create({
      data: {
        projectId,
        stageId: stageId || null,
        amount,
        status: 'pending',
        method: 'stripe',
        transactionId: paymentIntent.id,
      },
      include: {
        project: true,
        stage: true,
      },
    });

    this.logger.log(`Payment intent created: ${paymentIntent.id} for project ${projectId}`);

    return {
      paymentIntent: {
        id: paymentIntent.id,
        clientSecret: paymentIntent.client_secret,
        amount: paymentIntent.amount / 100, // Convert from cents
        currency: paymentIntent.currency,
        status: paymentIntent.status,
      },
      payment: {
        id: payment.id,
        amount: payment.amount,
        status: payment.status,
      },
    };
  }

  /**
   * Handle successful payment (called from webhook)
   */
  async handlePaymentSuccess(paymentIntentId: string) {
    const payment = await this.prisma.payment.findFirst({
      where: { transactionId: paymentIntentId },
      include: {
        project: true,
        stage: true,
      },
    });

    if (!payment) {
      this.logger.warn(`Payment not found for intent: ${paymentIntentId}`);
      return;
    }

    // Update payment status
    await this.prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: 'completed',
      },
    });

    // Update project spent amount
    await this.prisma.project.update({
      where: { id: payment.projectId },
      data: {
        spent: {
          increment: payment.amount,
        },
      },
    });

    // Emit real-time update
    this.wsService.emitProjectUpdate(payment.projectId, {
      type: 'budget_update',
      data: {
        paymentId: payment.id,
        amount: payment.amount,
        status: 'completed',
      },
    });

    // Send notification to homeowner
    this.wsService.sendNotification(payment.project.homeownerId, {
      type: 'payment_completed',
      title: 'Payment Successful',
      message: `Payment of $${payment.amount} has been processed successfully`,
      data: {
        paymentId: payment.id,
        projectId: payment.projectId,
      },
    });

    this.logger.log(`Payment ${payment.id} marked as completed`);
  }

  /**
   * Handle failed payment (called from webhook)
   */
  async handlePaymentFailure(paymentIntentId: string) {
    const payment = await this.prisma.payment.findFirst({
      where: { transactionId: paymentIntentId },
      include: {
        project: true,
      },
    });

    if (!payment) {
      this.logger.warn(`Payment not found for intent: ${paymentIntentId}`);
      return;
    }

    // Update payment status
    await this.prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: 'failed',
      },
    });

    // Send notification
    this.wsService.sendNotification(payment.project.homeownerId, {
      type: 'payment_failed',
      title: 'Payment Failed',
      message: `Payment of $${payment.amount} could not be processed`,
      data: {
        paymentId: payment.id,
        projectId: payment.projectId,
      },
    });

    this.logger.log(`Payment ${payment.id} marked as failed`);
  }

  /**
   * Create payout to contractor
   */
  async createPayout(createPayoutDto: CreatePayoutDto) {
    const { contractorId, amount, currency, description, projectId } = createPayoutDto;

    // Get contractor
    const contractor = await this.prisma.contractor.findUnique({
      where: { id: contractorId },
      include: {
        user: true,
      },
    });

    if (!contractor) {
      throw new NotFoundException(`Contractor with ID ${contractorId} not found`);
    }

    // TODO: Verify contractor has Stripe connected account
    // For now, we'll create a payout to their email
    // In production, you'd use Stripe Connect and transfer to connected account

    try {
      // Create payout (in production, use createTransfer for connected accounts)
      const payout = await this.stripeService.createPayout({
        amount,
        currency,
        description: description || `Payout to ${contractor.name}`,
        metadata: {
          contractorId,
          projectId: projectId || '',
        },
      });

      // Create payment record for tracking
      const payment = await this.prisma.payment.create({
        data: {
          projectId: projectId || null,
          amount: -amount, // Negative for payouts
          status: 'processing',
          method: 'stripe_payout',
          transactionId: payout.id,
        },
      });

      this.logger.log(`Payout created: ${payout.id} for contractor ${contractorId}`);

      return {
        payout: {
          id: payout.id,
          amount: payout.amount / 100,
          currency: payout.currency,
          status: payout.status,
        },
        payment: {
          id: payment.id,
          amount: payment.amount,
          status: payment.status,
        },
      };
    } catch (error) {
      this.logger.error(`Failed to create payout: ${error.message}`);
      throw new BadRequestException(`Failed to create payout: ${error.message}`);
    }
  }

  /**
   * Get payment by ID
   */
  async getPayment(paymentId: string) {
    const payment = await this.prisma.payment.findUnique({
      where: { id: paymentId },
      include: {
        project: {
          select: {
            id: true,
            name: true,
            homeowner: {
              select: {
                id: true,
                fullName: true,
              },
            },
          },
        },
        stage: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!payment) {
      throw new NotFoundException(`Payment with ID ${paymentId} not found`);
    }

    return payment;
  }

  /**
   * Get payments for a project
   */
  async getProjectPayments(projectId: string) {
    return this.prisma.payment.findMany({
      where: { projectId },
      include: {
        stage: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  /**
   * Get payments for a user
   */
  async getUserPayments(userId: string) {
    // Get all projects where user is homeowner
    const projects = await this.prisma.project.findMany({
      where: { homeownerId: userId },
      select: { id: true },
    });

    const projectIds = projects.map((p) => p.id);

    return this.prisma.payment.findMany({
      where: {
        projectId: {
          in: projectIds,
        },
      },
      include: {
        project: {
          select: {
            id: true,
            name: true,
          },
        },
        stage: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }
}



