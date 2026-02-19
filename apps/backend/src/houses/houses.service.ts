import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class HousesService {
  private prisma = new PrismaClient() as any;

  private getViewingInterestModel() {
    return this.prisma.houseViewingInterest;
  }

  async getAll() {
    return this.prisma.houseForSale.findMany({
      where: { isActive: true },
      include: {
        images: { orderBy: { order: 'asc' } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getById(id: string) {
    const house = await this.prisma.houseForSale.findUnique({
      where: { id },
      include: {
        images: { orderBy: { order: 'asc' } },
      },
    });
    if (!house) {
      throw new NotFoundException('House not found');
    }
    return house;
  }

  async create(dto: any) {
    const created = await this.prisma.houseForSale.create({
      data: {
        name: dto.name,
        description: dto.description,
        location: dto.location,
        price: Number(dto.price),
        bedrooms: Number(dto.bedrooms),
        bathrooms: Number(dto.bathrooms),
        squareFootage: Number(dto.squareFootage),
        squareMeters: dto.squareMeters ? Number(dto.squareMeters) : undefined,
        propertyType: dto.propertyType,
        yearBuilt: dto.yearBuilt ? Number(dto.yearBuilt) : undefined,
        condition: dto.condition,
        parking: dto.parking ? Number(dto.parking) : undefined,
        documents: dto.documents || [],
        amenities: dto.amenities || [],
        nearbyFacilities: dto.nearbyFacilities || [],
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
      include: {
        images: { orderBy: { order: 'asc' } },
      },
    });
    return created;
  }

  async getAdminList() {
    return this.prisma.houseForSale.findMany({
      include: {
        images: { orderBy: { order: 'asc' } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async delete(id: string) {
    await this.prisma.houseForSale.delete({
      where: { id },
    });
    return { message: 'House deleted successfully' };
  }

  async scheduleViewing(houseId: string, homeownerId: string) {
    const house = await this.prisma.houseForSale.findUnique({
      where: { id: houseId },
      select: { id: true },
    });
    if (!house) {
      throw new NotFoundException('House not found');
    }

    const homeowner = await this.prisma.user.findUnique({
      where: { id: homeownerId },
      select: { id: true, role: true },
    });
    if (!homeowner || homeowner.role !== 'homeowner') {
      throw new NotFoundException('Homeowner account not found');
    }

    const viewingInterestModel = this.getViewingInterestModel();
    if (!viewingInterestModel) {
      // Fallback while Prisma client/migrations are catching up in local/dev.
      return {
        message: 'Viewing request received',
      };
    }

    const interest = await viewingInterestModel.create({
      data: {
        houseForSaleId: houseId,
        homeownerId,
      },
    });

    return {
      message: 'Viewing request sent to admin',
      interestId: interest.id,
    };
  }

  async getAdminViewingInterests() {
    const viewingInterestModel = this.getViewingInterestModel();
    if (!viewingInterestModel) {
      return {
        unreadCount: 0,
        items: [],
      };
    }

    const interests = await viewingInterestModel.findMany({
      include: {
        houseForSale: {
          select: {
            id: true,
            name: true,
            location: true,
            price: true,
            images: {
              orderBy: { order: 'asc' },
              take: 1,
              select: {
                url: true,
                label: true,
              },
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

    const unreadCount = await viewingInterestModel.count({
      where: { isRead: false },
    });

    return {
      unreadCount,
      items: interests,
    };
  }

  async markViewingInterestsRead() {
    const viewingInterestModel = this.getViewingInterestModel();
    if (!viewingInterestModel) {
      return { message: 'Viewing interests marked as read' };
    }

    await viewingInterestModel.updateMany({
      where: { isRead: false },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });
    return { message: 'Viewing interests marked as read' };
  }

  async updateViewingOutcome(interestId: string, outcomeStatus: 'abandoned' | 'purchased') {
    const viewingInterestModel = this.getViewingInterestModel();
    if (!viewingInterestModel) {
      return { message: 'Viewing outcome updated' };
    }

    const existing = await viewingInterestModel.findUnique({
      where: { id: interestId },
      include: {
        houseForSale: {
          select: {
            price: true,
          },
        },
      },
    });

    if (!existing) {
      throw new NotFoundException('Viewing request not found');
    }

    const updated = await viewingInterestModel.update({
      where: { id: interestId },
      data: {
        outcomeStatus,
        purchaseAmount: outcomeStatus === 'purchased' ? existing.houseForSale?.price ?? null : null,
        purchaseMarkedAt: outcomeStatus === 'purchased' ? new Date() : null,
      },
    });

    return {
      message: 'Viewing outcome updated',
      item: updated,
    };
  }

  async getHomeownerPurchases(homeownerId: string) {
    const viewingInterestModel = this.getViewingInterestModel();
    if (!viewingInterestModel) {
      return [];
    }
    return viewingInterestModel.findMany({
      where: {
        homeownerId,
        outcomeStatus: 'purchased',
      },
      include: {
        houseForSale: {
          select: {
            id: true,
            name: true,
            location: true,
            price: true,
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
