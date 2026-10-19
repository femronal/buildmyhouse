import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { WebSocketService } from '../websocket/websocket.service';
import { locationSlugsFromText } from '../listings/location-slugs';
import { geocodeArea } from '../listings/geocode-area';
import { UpdateHouseForSaleDto } from './dto/update-house-for-sale.dto';

@Injectable()
export class HousesService {
  private prisma = new PrismaClient() as any;

  constructor(private readonly wsService: WebSocketService) {}

  private getViewingInterestModel() {
    return this.prisma.houseViewingInterest;
  }

  private normalizeAssetUrl(url?: string | null): string {
    const raw = String(url || '').trim();
    if (!raw) return '';
    if (/^\/+https?:\/\//i.test(raw)) return raw.replace(/^\/+/, '');
    return raw;
  }

  async getAll(query?: Record<string, string | undefined>) {
    const hasListParams = Boolean(
      query && ['page', 'limit', 'q', 'state', 'lga', 'minPrice', 'maxPrice', 'beds'].some((key) => query[key]),
    );
    if (!hasListParams) {
      return this.prisma.houseForSale.findMany({
        where: { isActive: true },
        include: { images: { orderBy: { order: 'asc' } } },
        orderBy: { createdAt: 'desc' },
      });
    }
    const page = Math.max(1, Number(query?.page) || 1);
    const limit = Math.min(20, Math.max(1, Number(query?.limit) || 16));
    const where: any = { isActive: true };
    if (query?.state) where.stateSlug = query.state.toLowerCase();
    if (query?.lga) where.lgaSlug = query.lga.toLowerCase();
    if (query?.q) where.OR = [{ name: { contains: query.q, mode: 'insensitive' } }, { location: { contains: query.q, mode: 'insensitive' } }];
    if (query?.minPrice || query?.maxPrice) {
      where.price = {};
      if (query.minPrice) where.price.gte = Number(query.minPrice);
      if (query.maxPrice) where.price.lte = Number(query.maxPrice);
    }
    if (query?.beds) where.bedrooms = query.beds === '5' ? { gte: 5 } : Number(query.beds);
    const [items, total] = await Promise.all([
      this.prisma.houseForSale.findMany({
        where,
        include: { images: { orderBy: { order: 'asc' }, take: 1 } },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.houseForSale.count({ where }),
    ]);
    return { items, total, page, limit };
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
    const coords = await geocodeArea(dto.location);
    const created = await this.prisma.houseForSale.create({
      data: {
        name: dto.name,
        description: dto.description,
        opportunityCategory: dto.opportunityCategory,
        opportunityType: dto.opportunityType,
        location: dto.location,
        ...locationSlugsFromText(dto.location),
        ...(coords || {}),
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
            url: this.normalizeAssetUrl(img.url),
            thumbnailUrl: this.normalizeAssetUrl(img.thumbnailUrl) || null,
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

  async update(id: string, dto: UpdateHouseForSaleDto) {
    const existing = await this.prisma.houseForSale.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!existing) {
      throw new NotFoundException('House not found');
    }

    return this.prisma.houseForSale.update({
      where: { id },
      data: {
        ...(dto.name !== undefined ? { name: dto.name } : {}),
        ...(dto.description !== undefined ? { description: dto.description } : {}),
        ...(dto.opportunityCategory !== undefined
          ? { opportunityCategory: dto.opportunityCategory }
          : {}),
        ...(dto.opportunityType !== undefined ? { opportunityType: dto.opportunityType } : {}),
        ...(dto.location !== undefined ? { location: dto.location } : {}),
        ...(dto.price !== undefined ? { price: Number(dto.price) } : {}),
        ...(dto.bedrooms !== undefined ? { bedrooms: Number(dto.bedrooms) } : {}),
        ...(dto.bathrooms !== undefined ? { bathrooms: Number(dto.bathrooms) } : {}),
        ...(dto.squareFootage !== undefined ? { squareFootage: Number(dto.squareFootage) } : {}),
        ...(dto.squareMeters !== undefined ? { squareMeters: Number(dto.squareMeters) } : {}),
        ...(dto.propertyType !== undefined ? { propertyType: dto.propertyType } : {}),
        ...(dto.yearBuilt !== undefined ? { yearBuilt: Number(dto.yearBuilt) } : {}),
        ...(dto.condition !== undefined ? { condition: dto.condition } : {}),
        ...(dto.parking !== undefined ? { parking: Number(dto.parking) } : {}),
        ...(dto.documents !== undefined ? { documents: dto.documents } : {}),
        ...(dto.amenities !== undefined ? { amenities: dto.amenities } : {}),
        ...(dto.nearbyFacilities !== undefined ? { nearbyFacilities: dto.nearbyFacilities } : {}),
        ...(dto.contactName !== undefined ? { contactName: dto.contactName } : {}),
        ...(dto.contactPhone !== undefined ? { contactPhone: dto.contactPhone } : {}),
        ...(dto.images !== undefined
          ? {
              images: {
                deleteMany: {},
                create: (dto.images || []).map((img, i: number) => ({
                  url: this.normalizeAssetUrl(img.url),
            thumbnailUrl: this.normalizeAssetUrl(img.thumbnailUrl) || null,
                  label: img.label || `Image ${i + 1}`,
                  order: img.order ?? i,
                })),
              },
            }
          : {}),
      },
      include: { images: { orderBy: { order: 'asc' } } },
    });
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

    await this.wsService.sendNotificationToRole('admin', {
      type: 'house_viewing_request',
      title: 'New house viewing request',
      message: 'A homeowner requested to view a house for sale.',
      data: {
        houseForSaleId: houseId,
        interestId: interest.id,
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
            name: true,
            location: true,
            price: true,
            images: {
              orderBy: { order: 'asc' },
              take: 1,
              select: { url: true },
            },
          },
        },
      },
    });

    if (!existing) {
      throw new NotFoundException('Viewing request not found');
    }

    const house = existing.houseForSale;
    const snapshot =
      outcomeStatus === 'purchased' && house
        ? {
            snapshotName: house.name,
            snapshotLocation: house.location,
            snapshotPrice: house.price,
            snapshotImageUrl: house.images?.[0]?.url ?? null,
          }
        : {};

    const updated = await viewingInterestModel.update({
      where: { id: interestId },
      data: {
        outcomeStatus,
        purchaseAmount: outcomeStatus === 'purchased' ? house?.price ?? null : null,
        purchaseMarkedAt: outcomeStatus === 'purchased' ? new Date() : null,
        ...snapshot,
      },
    });

    await this.wsService.sendNotification(updated.homeownerId, {
      type: 'house_viewing_outcome',
      title: 'House viewing update',
      message:
        outcomeStatus === 'purchased'
          ? 'Congratulations! You have been marked as the successful purchaser of this house.'
          : 'Your house viewing has been marked as not proceeding.',
      data: {
        interestId: updated.id,
        houseForSaleId: updated.houseForSaleId,
        outcomeStatus: updated.outcomeStatus,
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
