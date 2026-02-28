import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRentalListingDto } from './dto/create-rental-listing.dto';
import { WebSocketService } from '../websocket/websocket.service';

@Injectable()
export class RentalsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly wsService: WebSocketService,
  ) {}

  async getAll() {
    return this.prisma.rentalListing.findMany({
      where: { isActive: true },
      include: { images: { orderBy: { order: 'asc' } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getById(id: string) {
    const rental = await this.prisma.rentalListing.findUnique({
      where: { id },
      include: { images: { orderBy: { order: 'asc' } } },
    });
    if (!rental) {
      throw new NotFoundException('Rental listing not found');
    }
    return rental;
  }

  async getAdminList() {
    return this.prisma.rentalListing.findMany({
      include: { images: { orderBy: { order: 'asc' } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(dto: CreateRentalListingDto) {
    return this.prisma.rentalListing.create({
      data: {
        title: dto.title,
        description: dto.description,
        propertyType: dto.propertyType,
        location: dto.location,
        annualRent: Number(dto.annualRent),
        serviceCharge: Number(dto.serviceCharge),
        cautionDeposit: Number(dto.cautionDeposit),
        legalFeePercent: Number(dto.legalFeePercent),
        agencyFeePercent:
          dto.agencyFeePercent !== undefined ? Number(dto.agencyFeePercent) : 2,
        bedrooms: Number(dto.bedrooms),
        bathrooms: Number(dto.bathrooms),
        sizeSqm: Number(dto.sizeSqm),
        furnishing: dto.furnishing,
        paymentPattern: dto.paymentPattern,
        power: dto.power,
        water: dto.water,
        internet: dto.internet,
        parking: dto.parking,
        security: dto.security,
        rules: dto.rules,
        inspectionWindow: dto.inspectionWindow,
        proximity: dto.proximity || [],
        verificationDocs: dto.verificationDocs || [],
        images: {
          create: (dto.images || []).map((img, i) => ({
            url: img.url,
            label: img.label || `Image ${i + 1}`,
            order: img.order ?? i,
          })),
        },
      },
      include: { images: { orderBy: { order: 'asc' } } },
    });
  }

  async delete(id: string) {
    await this.prisma.rentalListing.delete({ where: { id } });
    return { message: 'Rental listing deleted successfully' };
  }

  async requestInspection(rentalId: string, homeownerId: string) {
    const rental = await this.prisma.rentalListing.findUnique({
      where: { id: rentalId },
      select: { id: true },
    });
    if (!rental) {
      throw new NotFoundException('Rental listing not found');
    }

    const homeowner = await this.prisma.user.findUnique({
      where: { id: homeownerId },
      select: { id: true, role: true },
    });
    if (!homeowner) {
      throw new NotFoundException('Homeowner account not found');
    }
    if (homeowner.role !== 'homeowner') {
      throw new ForbiddenException('Only homeowners can request rental inspection');
    }

    const interest = await this.prisma.rentalViewingInterest.create({
      data: {
        rentalListingId: rentalId,
        homeownerId,
      },
    });

    await this.wsService.sendNotificationToRole('admin', {
      type: 'rental_inspection_request',
      title: 'New rental inspection request',
      message: 'A homeowner requested rental inspection.',
      data: {
        rentalListingId: rentalId,
        interestId: interest.id,
      },
    });

    return {
      message: 'Rental inspection request sent to admin',
      interestId: interest.id,
    };
  }

  async getAdminViewingInterests() {
    const items = await this.prisma.rentalViewingInterest.findMany({
      include: {
        rentalListing: {
          select: {
            id: true,
            title: true,
            location: true,
            annualRent: true,
            images: {
              orderBy: { order: 'asc' },
              take: 1,
              select: { url: true, label: true },
            },
          },
        },
        homeowner: {
          select: {
            id: true,
            fullName: true,
            email: true,
            phone: true,
            pictureUrl: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    const unreadCount = await this.prisma.rentalViewingInterest.count({
      where: { isRead: false },
    });

    return { unreadCount, items };
  }

  async markViewingInterestsRead() {
    await this.prisma.rentalViewingInterest.updateMany({
      where: { isRead: false },
      data: { isRead: true, readAt: new Date() },
    });
    return { message: 'Rental viewing interests marked as read' };
  }

  async updateViewingOutcome(interestId: string, outcomeStatus: 'abandoned' | 'purchased') {
    const existing = await this.prisma.rentalViewingInterest.findUnique({
      where: { id: interestId },
      include: {
        rentalListing: {
          select: {
            annualRent: true,
          },
        },
      },
    });

    if (!existing) {
      throw new NotFoundException('Rental inspection request not found');
    }

    const updated = await this.prisma.rentalViewingInterest.update({
      where: { id: interestId },
      data: {
        outcomeStatus,
        purchaseAmount: outcomeStatus === 'purchased' ? existing.rentalListing?.annualRent ?? null : null,
        purchaseMarkedAt: outcomeStatus === 'purchased' ? new Date() : null,
      },
    });

    await this.wsService.sendNotification(updated.homeownerId, {
      type: 'rental_viewing_outcome',
      title: 'Rental viewing update',
      message:
        outcomeStatus === 'purchased'
          ? 'Your rental viewing has been marked as purchased.'
          : 'Your rental viewing has been marked as not proceeding.',
      data: {
        interestId: updated.id,
        rentalListingId: updated.rentalListingId,
        outcomeStatus: updated.outcomeStatus,
      },
    });

    return {
      message: 'Rental viewing outcome updated',
      item: updated,
    };
  }

  async getHomeownerPurchases(homeownerId: string) {
    return this.prisma.rentalViewingInterest.findMany({
      where: {
        homeownerId,
        outcomeStatus: 'purchased',
      },
      include: {
        rentalListing: {
          select: {
            id: true,
            title: true,
            location: true,
            annualRent: true,
            serviceCharge: true,
            cautionDeposit: true,
            legalFeePercent: true,
            agencyFeePercent: true,
            images: {
              orderBy: { order: 'asc' },
              take: 1,
              select: {
                url: true,
              },
            },
          },
        },
      },
      orderBy: { purchaseMarkedAt: 'desc' },
    });
  }
}

