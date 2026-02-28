import { ForbiddenException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { CreateLandForSaleDto } from './dto/create-land-for-sale.dto';
import { PrismaService } from '../prisma/prisma.service';
import { WebSocketService } from '../websocket/websocket.service';

@Injectable()
export class LandsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly wsService: WebSocketService,
  ) {}

  private getLandModel() {
    const model = this.prisma.landForSale;
    if (!model) {
      throw new InternalServerErrorException(
        'Land model is unavailable. Check Prisma schema/migrations and regenerate client.',
      );
    }
    return model;
  }

  private getLandViewingModel() {
    const model = this.prisma.landViewingInterest;
    if (!model) {
      throw new InternalServerErrorException(
        'Land viewing model is unavailable. Check Prisma schema/migrations and regenerate client.',
      );
    }
    return model;
  }

  async getAll() {
    const landModel = this.getLandModel();
    return landModel.findMany({
      where: { isActive: true },
      include: { images: { orderBy: { order: 'asc' } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getById(id: string) {
    const landModel = this.getLandModel();
    const land = await landModel.findUnique({
      where: { id },
      include: { images: { orderBy: { order: 'asc' } } },
    });
    if (!land) throw new NotFoundException('Land not found');
    return land;
  }

  async getAdminList() {
    const landModel = this.getLandModel();
    return landModel.findMany({
      include: { images: { orderBy: { order: 'asc' } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(dto: CreateLandForSaleDto) {
    const landModel = this.getLandModel();
    return landModel.create({
      data: {
        name: dto.name,
        description: dto.description,
        location: dto.location,
        price: Number(dto.price),
        sizeSqm: Number(dto.sizeSqm),
        titleDocument: dto.titleDocument,
        zoningType: dto.zoningType,
        topography: dto.topography,
        roadAccess: dto.roadAccess,
        ownershipType: dto.ownershipType,
        documents: dto.documents || [],
        nearbyLandmarks: dto.nearbyLandmarks || [],
        restrictions: dto.restrictions || [],
        contactName: dto.contactName,
        contactPhone: dto.contactPhone,
        images: {
          create: (dto.images || []).map((img, i: number) => ({
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
    const landModel = this.getLandModel();
    await landModel.delete({ where: { id } });
    return { message: 'Land deleted successfully' };
  }

  async scheduleViewing(landId: string, homeownerId: string) {
    const landModel = this.getLandModel();
    const viewingModel = this.getLandViewingModel();

    const land = await landModel.findUnique({
      where: { id: landId },
      select: { id: true },
    });
    if (!land) throw new NotFoundException('Land not found');

    const homeowner = await this.prisma.user.findUnique({
      where: { id: homeownerId },
      select: { id: true, role: true },
    });
    if (!homeowner) {
      throw new NotFoundException('Homeowner account not found');
    }
    if (homeowner.role !== 'homeowner') {
      throw new ForbiddenException('Only homeowners can schedule land viewing');
    }

    const interest = await viewingModel.create({
      data: {
        landForSaleId: landId,
        homeownerId,
      },
    });

    await this.wsService.sendNotificationToRole('admin', {
      type: 'land_viewing_request',
      title: 'New land viewing request',
      message: 'A homeowner requested to view land for sale.',
      data: {
        landForSaleId: landId,
        interestId: interest.id,
      },
    });

    return {
      message: 'Land viewing request sent to admin',
      interestId: interest.id,
    };
  }

  async getAdminViewingInterests() {
    const viewingModel = this.getLandViewingModel();

    const items = await viewingModel.findMany({
      include: {
        landForSale: {
          select: {
            id: true,
            name: true,
            location: true,
            price: true,
            sizeSqm: true,
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

    const unreadCount = await viewingModel.count({
      where: { isRead: false },
    });

    return { unreadCount, items };
  }

  async markViewingInterestsRead() {
    const viewingModel = this.getLandViewingModel();
    await viewingModel.updateMany({
      where: { isRead: false },
      data: { isRead: true, readAt: new Date() },
    });
    return { message: 'Land viewing interests marked as read' };
  }

  async updateViewingOutcome(interestId: string, outcomeStatus: 'abandoned' | 'purchased') {
    const viewingModel = this.getLandViewingModel();

    const existing = await viewingModel.findUnique({
      where: { id: interestId },
      include: {
        landForSale: {
          select: {
            price: true,
          },
        },
      },
    });

    if (!existing) {
      throw new NotFoundException('Viewing request not found');
    }

    const updated = await viewingModel.update({
      where: { id: interestId },
      data: {
        outcomeStatus,
        purchaseAmount: outcomeStatus === 'purchased' ? existing.landForSale?.price ?? null : null,
        purchaseMarkedAt: outcomeStatus === 'purchased' ? new Date() : null,
      },
    });

    await this.wsService.sendNotification(updated.homeownerId, {
      type: 'land_viewing_outcome',
      title: 'Land viewing update',
      message:
        outcomeStatus === 'purchased'
          ? 'Congratulations! You have been marked as the successful purchaser of this land.'
          : 'Your land viewing has been marked as not proceeding.',
      data: {
        interestId: updated.id,
        landForSaleId: updated.landForSaleId,
        outcomeStatus: updated.outcomeStatus,
      },
    });

    return {
      message: 'Land viewing outcome updated',
      item: updated,
    };
  }

  async getHomeownerPurchases(homeownerId: string) {
    const viewingModel = this.getLandViewingModel();
    return viewingModel.findMany({
      where: {
        homeownerId,
        outcomeStatus: 'purchased',
      },
      include: {
        landForSale: {
          select: {
            id: true,
            name: true,
            location: true,
            price: true,
            sizeSqm: true,
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
