import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class UsersService {
  private prisma = new PrismaClient();

  async findAll(params: {
    page?: number;
    limit?: number;
    search?: string;
    role?: string;
    status?: string;
  }) {
    const page = Math.max(1, params.page ?? 1);
    const limit = Math.min(100, Math.max(1, params.limit ?? 20));
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};

    if (params.role) {
      where.role = params.role;
    }

    if (params.status && params.status !== 'all') {
      if (params.status === 'active') where.verified = true;
      else if (params.status === 'pending') where.verified = false;
      // 'suspended' not in schema yet - no filter applied
    }

    if (params.search?.trim()) {
      const search = params.search.trim().toLowerCase();
      where.OR = [
        { fullName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    const homeownerBaseWhere = { role: 'homeowner' as const };

    const [users, total, activeCount, pendingCount] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { updatedAt: 'desc' },
        select: {
          id: true,
          fullName: true,
          email: true,
          role: true,
          verified: true,
          updatedAt: true,
          _count: {
            select: { homeownerProjects: true },
          },
          homeownerProjects: {
            take: 1,
            orderBy: { updatedAt: 'desc' },
            select: {
              address: true,
              city: true,
              state: true,
              country: true,
            },
          },
        },
      }),
      this.prisma.user.count({ where }),
      params.role === 'homeowner' || !params.role
        ? this.prisma.user.count({ where: { ...homeownerBaseWhere, verified: true } })
        : 0,
      params.role === 'homeowner' || !params.role
        ? this.prisma.user.count({ where: { ...homeownerBaseWhere, verified: false } })
        : 0,
    ]);

    const suspendedCount = 0;

    const data = users.map((u) => {
      const project = u.homeownerProjects?.[0];
      const location =
        project?.city && project?.country
          ? `${project.city}, ${project.country}`
          : project?.address || project?.state || null;

      return {
        id: u.id,
        fullName: u.fullName,
        email: u.email,
        role: u.role,
        verified: u.verified,
        projects: u._count.homeownerProjects,
        lastActive: this.formatRelativeTime(u.updatedAt),
        location,
        status: u.verified ? 'active' : 'pending',
      };
    });

    return {
      data,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
      summary:
        params.role === 'homeowner' || !params.role
          ? {
              total: activeCount + pendingCount + suspendedCount,
              active: activeCount,
              pending: pendingCount,
              suspended: suspendedCount,
            }
          : undefined,
    };
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        fullName: true,
        email: true,
        phone: true,
        pictureUrl: true,
        role: true,
        verified: true,
        createdAt: true,
        updatedAt: true,
        _count: { select: { homeownerProjects: true } },
        homeownerProjects: {
          take: 1,
          orderBy: { updatedAt: 'desc' },
          select: {
            address: true,
            city: true,
            state: true,
            country: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const project = user.homeownerProjects?.[0];
    const addressParts = project?.address?.split(',').map((p) => p.trim()).filter(Boolean) ?? [];
    const city = project?.city ?? (addressParts.length >= 2 ? addressParts[addressParts.length - 2] : null);
    const country = project?.country ?? (addressParts.length >= 1 ? addressParts[addressParts.length - 1] : null);

    return {
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      phone: user.phone,
      pictureUrl: user.pictureUrl,
      role: user.role,
      verified: user.verified,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      projects: user._count.homeownerProjects,
      lastActive: this.formatRelativeTime(user.updatedAt),
      address: project?.address ?? null,
      city,
      state: project?.state ?? null,
      country,
      status: user.verified ? 'active' : 'pending',
    };
  }

  private formatRelativeTime(date: Date): string {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins} min${diffMins !== 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
    return date.toLocaleDateString();
  }
}
