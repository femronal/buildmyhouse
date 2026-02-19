import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { StripeService } from './stripe.service';
import { CreatePaymentIntentDto } from '../dto/create-payment-intent.dto';
import { CreatePayoutDto } from '../dto/create-payout.dto';

@Injectable()
export class PaymentsService {
  // Use `any` for model access to reduce coupling to Prisma schema changes.
  private prisma = new PrismaClient() as any;

  constructor(private readonly stripeService: StripeService) {}

  async createSetupCheckoutSession(
    userId: string,
    params: { successUrl?: string; cancelUrl?: string; origin?: string },
  ) {
    if (!userId) {
      throw new BadRequestException('User not found');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, stripeCustomerId: true },
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    let stripeCustomerId = user.stripeCustomerId as string | null;
    if (!stripeCustomerId) {
      const customer = await this.stripeService.getOrCreateCustomer(user.email, userId);
      stripeCustomerId = customer.id;
      await this.prisma.user.update({
        where: { id: userId },
        data: { stripeCustomerId },
      });
    }

    const origin = params.origin || 'http://localhost:8081';
    const successUrl = params.successUrl || `${origin}/billing-payments?setup=success`;
    const cancelUrl = params.cancelUrl || `${origin}/billing-payments?setup=cancel`;

    const session = await this.stripeService.createSetupCheckoutSession({
      customerId: stripeCustomerId,
      successUrl,
      cancelUrl,
      metadata: { userId },
    });

    return {
      id: session.id,
      url: session.url,
    };
  }

  async createSetupIntent(userId: string) {
    if (!userId) {
      throw new BadRequestException('User not found');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, stripeCustomerId: true },
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    let stripeCustomerId = user.stripeCustomerId as string | null;
    if (!stripeCustomerId) {
      const customer = await this.stripeService.getOrCreateCustomer(user.email, userId);
      stripeCustomerId = customer.id;
      await this.prisma.user.update({
        where: { id: userId },
        data: { stripeCustomerId },
      });
    }

    const setupIntent = await this.stripeService.createSetupIntent({
      customerId: stripeCustomerId,
      metadata: { userId },
    });

    const ephemeralKey = await this.stripeService.createEphemeralKey(stripeCustomerId);

    return {
      customerId: stripeCustomerId,
      ephemeralKey: ephemeralKey.secret,
      setupIntent: {
        id: setupIntent.id,
        clientSecret: setupIntent.client_secret,
      },
    };
  }

  async listPaymentMethods(userId: string) {
    if (!userId) {
      throw new BadRequestException('User not found');
    }

    const methods = await this.prisma.paymentMethod.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    return methods.map((m: any) => ({
      id: m.id,
      brand: m.brand,
      last4: m.last4,
      expMonth: m.expMonth,
      expYear: m.expYear,
      holderName: m.holderName,
      stripePaymentMethodId: m.stripePaymentMethodId,
      isDefault: !m.isBackup,
      createdAt: m.createdAt,
      updatedAt: m.updatedAt,
    }));
  }

  async setDefaultPaymentMethod(userId: string, paymentMethodId: string) {
    if (!userId) {
      throw new BadRequestException('User not found');
    }
    if (!paymentMethodId) {
      throw new BadRequestException('paymentMethodId is required');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, stripeCustomerId: true },
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const method = await this.prisma.paymentMethod.findFirst({
      where: { id: paymentMethodId, userId },
    });
    if (!method) {
      throw new NotFoundException('Payment method not found');
    }

    await this.prisma.$transaction([
      this.prisma.paymentMethod.updateMany({
        where: { userId },
        data: { isBackup: true },
      }),
      this.prisma.paymentMethod.update({
        where: { id: method.id },
        data: { isBackup: false },
      }),
    ]);

    if (user.stripeCustomerId && method.stripePaymentMethodId) {
      // Best-effort: keep Stripe customer default in sync with our DB default.
      try {
        await this.stripeService.setCustomerDefaultPaymentMethod({
          customerId: user.stripeCustomerId,
          paymentMethodId: method.stripePaymentMethodId,
        });
      } catch (e: any) {
        // Don't block DB update if Stripe update fails (e.g. PM not attached yet).
      }
    }

    return { success: true };
  }

  async createPaymentIntent(userId: string, dto: CreatePaymentIntentDto) {
    if (!userId) {
      throw new BadRequestException('User not found');
    }

    // Validate project exists (and belongs to user when possible)
    const project = await this.prisma.project.findUnique({
      where: { id: dto.projectId },
      select: { id: true, homeownerId: true },
    });
    if (!project) {
      throw new NotFoundException('Project not found');
    }
    if (project.homeownerId && project.homeownerId !== userId) {
      // Role checks happen in controller guards.
      throw new BadRequestException('You do not have access to this project');
    }

    // For activation payments (no stageId), ensure we don't create duplicates
    if (!dto.stageId) {
      const existingActivation = await this.prisma.payment.findFirst({
        where: {
          projectId: dto.projectId,
          stageId: null,
          status: 'completed',
        },
      });
      if (existingActivation) {
        throw new BadRequestException('This project has already been paid for and activated.');
      }
    }

    const paymentIntent = await this.stripeService.createPaymentIntent({
      amount: dto.amount,
      currency: dto.currency || 'usd',
      description: dto.description,
      metadata: {
        userId,
        projectId: dto.projectId,
        ...(dto.stageId ? { stageId: dto.stageId } : {}),
      },
    });

    // Store pending payment
    const payment = await this.prisma.payment.create({
      data: {
        projectId: dto.projectId,
        stageId: dto.stageId || null,
        amount: dto.amount,
        status: 'pending',
        method: 'stripe',
        transactionId: paymentIntent.id,
      },
    });

    return {
      paymentIntent: {
        id: paymentIntent.id,
        clientSecret: paymentIntent.client_secret,
        amount: dto.amount,
        currency: dto.currency || 'usd',
      },
      payment,
    };
  }

  async getProjectPayments(projectId: string) {
    return this.prisma.payment.findMany({
      where: { projectId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getUserPayments(userId: string) {
    // Payments are linked to projects; fetch projects the user is associated with.
    const projects = await this.prisma.project.findMany({
      where: {
        OR: [{ homeownerId: userId }, { generalContractorId: userId }],
      },
      select: { id: true },
    });
    const projectIds = projects.map((p: any) => p.id);
    if (projectIds.length === 0) return [];

    return this.prisma.payment.findMany({
      where: { projectId: { in: projectIds } },
      orderBy: { createdAt: 'desc' },
      include: {
        project: { select: { name: true } },
        stage: { select: { name: true } },
      },
    });
  }

  /**
   * Get homeowner's payments structured as: one activation payment per project + sub-payments from GC-recorded materials and team members.
   */
  async getUserPaymentsStructured(userId: string) {
    const projects = await this.prisma.project.findMany({
      where: { homeownerId: userId },
      select: { id: true, name: true },
    });
    if (projects.length === 0) return [];

    const result: Array<{
      projectId: string;
      projectName: string;
      activationPayment: { id: string; amount: number; method: string; createdAt: string } | null;
      subPayments: Array<{
        type: 'material' | 'team_member';
        id: string;
        stageName: string;
        description: string;
        amount: number;
        createdAt: string;
      }>;
    }> = [];

    for (const project of projects) {
      const activationPayment = await this.prisma.payment.findFirst({
        where: { projectId: project.id, stageId: null, status: 'completed' },
        orderBy: { createdAt: 'desc' },
      });

      const stages = await this.prisma.stage.findMany({
        where: { projectId: project.id },
        select: { id: true, name: true },
        orderBy: { order: 'asc' },
      });

      const subPayments: Array<{
        type: 'material' | 'team_member';
        id: string;
        stageName: string;
        description: string;
        amount: number;
        createdAt: string;
      }> = [];

      for (const stage of stages) {
        const materials = await this.prisma.stageMaterial.findMany({
          where: { stageId: stage.id },
          orderBy: { createdAt: 'asc' },
        });
        for (const m of materials) {
          subPayments.push({
            type: 'material',
            id: m.id,
            stageName: stage.name,
            description: m.name,
            amount: m.totalPrice,
            createdAt: m.createdAt.toISOString(),
          });
        }

        const teamMembers = await this.prisma.stageTeamMember.findMany({
          where: { stageId: stage.id },
          orderBy: { createdAt: 'asc' },
        });
        for (const t of teamMembers) {
          const days =
            t.startDate && t.endDate
              ? Math.max(1, Math.ceil((t.endDate.getTime() - t.startDate.getTime()) / (1000 * 60 * 60 * 24)))
              : 1;
          const amount = (t.dailyRate ?? 0) * days;
          subPayments.push({
            type: 'team_member',
            id: t.id,
            stageName: stage.name,
            description: `${t.name} (${t.role})`,
            amount,
            createdAt: t.createdAt.toISOString(),
          });
        }
      }

      subPayments.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      result.push({
        projectId: project.id,
        projectName: project.name,
        activationPayment: activationPayment
          ? {
              id: activationPayment.id,
              amount: activationPayment.amount,
              method: activationPayment.method,
              createdAt: activationPayment.createdAt.toISOString(),
            }
          : null,
        subPayments,
      });
    }

    return result;
  }

  async getPayment(id: string) {
    const payment = await this.prisma.payment.findUnique({ where: { id } });
    if (!payment) {
      throw new NotFoundException('Payment not found');
    }
    return payment;
  }

  /**
   * Create a completed activation payment for manual payment confirmation.
   * Called when admin confirms manual payment.
   */
  async createManualActivationPayment(projectId: string, amount: number) {
    const existing = await this.prisma.payment.findFirst({
      where: { projectId, stageId: null, status: 'completed' },
    });
    if (existing) return existing;

    return this.prisma.payment.create({
      data: {
        projectId,
        stageId: null,
        amount,
        status: 'completed',
        method: 'manual',
        transactionId: null,
      },
    });
  }

  async createPayout(dto: CreatePayoutDto) {
    const payout = await this.stripeService.createPayout({
      amount: dto.amount,
      currency: dto.currency || 'usd',
      description: dto.description,
      metadata: {
        contractorId: dto.contractorId,
        ...(dto.projectId ? { projectId: dto.projectId } : {}),
      },
    });

    return {
      payout,
    };
  }

  /**
   * Stripe webhook: payment succeeded
   */
  async handlePaymentSuccess(paymentIntentId: string) {
    const payment = await this.prisma.payment.findFirst({
      where: { transactionId: paymentIntentId },
    });
    if (!payment) return;

    if (payment.status !== 'completed') {
      await this.prisma.payment.update({
        where: { id: payment.id },
        data: { status: 'completed' },
      });

      // Update project spent
      await this.prisma.project.update({
        where: { id: payment.projectId },
        data: { spent: { increment: payment.amount } },
      });
    }
  }

  /**
   * Stripe webhook: payment failed
   */
  async handlePaymentFailure(paymentIntentId: string) {
    const payment = await this.prisma.payment.findFirst({
      where: { transactionId: paymentIntentId },
    });
    if (!payment) return;

    await this.prisma.payment.update({
      where: { id: payment.id },
      data: { status: 'failed' },
    });
  }

  /**
   * Stripe webhook: setup intent succeeded (card saved)
   */
  async handleSetupIntentSucceeded(params: {
    setupIntentId: string;
    userId?: string;
    customerId?: string;
    paymentMethodId?: string;
  }) {
    const userId = params.userId;
    if (!userId || !params.paymentMethodId) return;

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, stripeCustomerId: true },
    });
    if (!user) return;

    // Ensure we remember the Stripe customer used for the SetupIntent.
    if (params.customerId && !user.stripeCustomerId) {
      await this.prisma.user.update({
        where: { id: userId },
        data: { stripeCustomerId: params.customerId },
      });
    }

    // Retrieve card metadata from Stripe to persist a non-sensitive record.
    const pm = await this.stripeService.retrievePaymentMethod(params.paymentMethodId);
    const card = (pm as any).card;
    if (!card) return;

    // Best-effort: make sure the payment method is attached to the customer.
    // (If we created the SetupIntent with a customer, Stripe usually attaches automatically.)
    if (params.customerId) {
      try {
        await this.stripeService.attachPaymentMethodToCustomer({
          paymentMethodId: params.paymentMethodId,
          customerId: params.customerId,
        });
      } catch (e: any) {
        // Ignore "already attached" errors and other non-critical failures.
      }
    }

    const existing = await this.prisma.paymentMethod.findFirst({
      where: { userId, stripePaymentMethodId: params.paymentMethodId },
    });

    const hasAny = (await this.prisma.paymentMethod.count({ where: { userId } })) > 0;
    const shouldBeDefault = !hasAny || (existing && !existing.isBackup);

    // If this is the first card, make it default (isBackup=false). Otherwise, keep it as backup.
    const data = {
      userId,
      brand: card.brand || 'unknown',
      last4: card.last4,
      expMonth: card.exp_month,
      expYear: card.exp_year,
      holderName: (pm as any).billing_details?.name || null,
      stripePaymentMethodId: params.paymentMethodId,
      isBackup: shouldBeDefault ? false : true,
      updatedAt: new Date(),
    };

    if (existing) {
      await this.prisma.paymentMethod.update({
        where: { id: existing.id },
        data,
      });
    } else {
      await this.prisma.paymentMethod.create({
        data,
      });
    }

    // If this is the first card, set Stripe default too.
    if (params.customerId && shouldBeDefault) {
      try {
        await this.stripeService.setCustomerDefaultPaymentMethod({
          customerId: params.customerId,
          paymentMethodId: params.paymentMethodId,
        });
      } catch (e: any) {
        // Non-blocking
      }
    }
  }
}

