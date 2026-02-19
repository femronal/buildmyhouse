import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class LandsService {
  private prisma = new PrismaClient() as any;

  private getLandModel() {
    return this.prisma.landForSale;
  }

  private getLandViewingModel() {
    return this.prisma.landViewingInterest;
  }

  async getAll() {
    const landModel = this.getLandModel();
    if (!landModel) return [];
    return landModel.findMany({
      where: { isActive: true },
      include: { images: { orderBy: { order: 'asc' } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getById(id: string) {
    const landModel = this.getLandModel();
    if (!landModel) throw new NotFoundException('Land not found');
    const land = await landModel.findUnique({
      where: { id },
      include: { images: { orderBy: { order: 'asc' } } },
    });
    if (!land) throw new NotFoundException('Land not found');
    return land;
  }

  async getAdminList() {
    const landModel = this.getLandModel();
    if (!landModel) return [];
    return landModel.findMany({
      include: { images: { orderBy: { order: 'asc' } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(dto: any) {
    const landModel = this.getLandModel();
    if (!landModel) throw new NotFoundException('Land module not ready');
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
          create: (dto.images || []).map((img: any, i: number) => ({
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
    if (!landModel) return { message: 'Land deleted successfully' };
    await landModel.delete({ where: { id } });
    return { message: 'Land deleted successfully' };
  }

  async scheduleViewing(landId: string, homeownerId: string) {
    const landModel = this.getLandModel();
    const viewingModel = this.getLandViewingModel();
    if (!landModel || !viewingModel) {
      return { message: 'Viewing request received' };
    }

    const land = await landModel.findUnique({
      where: { id: landId },
      select: { id: true },
    });
    if (!land) throw new NotFoundException('Land not found');

    const homeowner = await this.prisma.user.findUnique({
      where: { id: homeownerId },
      select: { id: true, role: true },
    });
    if (!homeowner || homeowner.role !== 'homeowner') {
      throw new NotFoundException('Homeowner account not found');
    }

    const interest = await viewingModel.create({
      data: {
        landForSaleId: landId,
        homeownerId,
      },
    });

    return {
      message: 'Land viewing request sent to admin',
      interestId: interest.id,
    };
  }

  async getAdminViewingInterests() {
    const viewingModel = this.getLandViewingModel();
    if (!viewingModel) {
      return { unreadCount: 0, items: [] };
    }

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
    if (!viewingModel) {
      return { message: 'Land viewing interests marked as read' };
    }
    await viewingModel.updateMany({
      where: { isRead: false },
      data: { isRead: true, readAt: new Date() },
    });
    return { message: 'Land viewing interests marked as read' };
  }

  async updateViewingOutcome(interestId: string, outcomeStatus: 'abandoned' | 'purchased') {
    const viewingModel = this.getLandViewingModel();
    if (!viewingModel) {
      return { message: 'Land viewing outcome updated' };
    }

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

    return {
      message: 'Land viewing outcome updated',
      item: updated,
    };
  }

  async getHomeownerPurchases(homeownerId: string) {
    const viewingModel = this.getLandViewingModel();
    if (!viewingModel) {
      return [];
    }
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
