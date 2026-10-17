import { Injectable, Logger, NotFoundException, BadRequestException, ForbiddenException, Optional } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { CreateDesignDto } from './dto/create-design.dto';
import { WebSocketService } from '../websocket/websocket.service';
import { EmailService } from '../email/email.service';

const HOMEOWNER_EMAIL_PAUSE_MS = 250;

@Injectable()
export class DesignsService {
  private readonly logger = new Logger(DesignsService.name);
  private readonly prisma: PrismaClient;
  constructor(
    private readonly wsService: WebSocketService,
    private readonly emailService: EmailService,
    @Optional() prismaClient?: PrismaClient,
  ) {
    this.prisma = prismaClient ?? new PrismaClient();
  }

  async getAllDesigns() {
    const designs = await this.prisma.design.findMany({
      where: { isActive: true, adminApprovalStatus: 'approved' },
      include: {
        images: { orderBy: { order: 'asc' } },
        createdBy: {
          select: {
            id: true,
            fullName: true,
            email: true,
            pictureUrl: true,
            contractorProfile: {
              select: {
                id: true,
                name: true,
                specialty: true,
                description: true,
                location: true,
                rating: true,
                reviews: true,
                projects: true,
                verified: true,
                imageUrl: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return designs;
  }

  async listDesignCards(query: {
    page?: number;
    limit?: number;
    tab?: string;
    q?: string;
    location?: string;
    tag?: string;
  }) {
    const limit = Math.min(20, Math.max(1, Number(query.limit) || 16));
    const page = Math.max(1, Number(query.page) || 1);
    const designs = await this.prisma.design.findMany({
      where: { isActive: true, adminApprovalStatus: 'approved' },
      select: {
        id: true,
        name: true,
        description: true,
        planType: true,
        projectTypeTag: true,
        projectTypeFilter: true,
        bedrooms: true,
        bathrooms: true,
        squareFootage: true,
        squareMeters: true,
        estimatedCost: true,
        rating: true,
        reviews: true,
        createdAt: true,
        images: {
          orderBy: { order: 'asc' },
          take: 1,
          select: { id: true, url: true, thumbnailUrl: true, order: true },
        },
        createdBy: {
          select: {
            fullName: true,
            contractorProfile: {
              select: { name: true, location: true, verified: true, rating: true, reviews: true },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const filtered = designs.filter((design: any) => matchesDesignCard(design, query));
    const start = (page - 1) * limit;
    const items = filtered.slice(start, start + limit).map(toDesignCard);
    return {
      items,
      page,
      limit,
      total: filtered.length,
      hasMore: start + limit < filtered.length,
    };
  }

  async getDesignById(id: string) {
    const design = await this.prisma.design.findUnique({
      where: { id },
      include: {
        images: { orderBy: { order: 'asc' } },
        createdBy: {
          select: {
            id: true,
            fullName: true,
            email: true,
            pictureUrl: true,
            contractorProfile: {
              select: {
                id: true,
                name: true,
                specialty: true,
                description: true,
                location: true,
                rating: true,
                reviews: true,
                projects: true,
                verified: true,
                imageUrl: true,
              },
            },
          },
        },
      },
    });

    if (!design) {
      throw new NotFoundException('Design not found');
    }

    return design;
  }

  async getMyDesigns(userId: string) {
    if (!userId) {
      throw new BadRequestException('User not found');
    }
    return this.prisma.design.findMany({
      where: { createdById: userId },
      include: {
        images: { orderBy: { order: 'asc' } },
        createdBy: {
          select: {
            id: true,
            fullName: true,
            email: true,
            pictureUrl: true,
            contractorProfile: {
              select: {
                id: true,
                name: true,
                specialty: true,
                description: true,
                location: true,
                rating: true,
                reviews: true,
                projects: true,
                verified: true,
                imageUrl: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createDesignOnBehalfOfContractor(params: {
    actorRole: string;
    adminUserId: string;
    contractorUserId: string;
    dto: CreateDesignDto;
  }) {
    if (params.actorRole !== 'admin') {
      throw new ForbiddenException('Only admins can upload a scope for a contractor');
    }
    const contractorUserId = String(params.contractorUserId || '').trim();
    if (!contractorUserId) {
      throw new BadRequestException('Contractor user ID is required');
    }

    const contractorUser = await this.prisma.user.findUnique({
      where: { id: contractorUserId },
      select: { id: true, role: true, fullName: true },
    });
    if (!contractorUser || contractorUser.role !== 'general_contractor') {
      throw new BadRequestException('That account is not a general contractor');
    }

    const contractor = await this.prisma.contractor.findUnique({
      where: { userId: contractorUserId },
      select: { verified: true, name: true },
    });
    if (!contractor?.verified) {
      throw new ForbiddenException('Scopes can only be uploaded for a verified general contractor');
    }

    const contractorName = String(contractor.name || contractorUser.fullName || 'Your general contractor').trim();
    this.logger.log(
      `createDesignOnBehalfOfContractor start adminId=${params.adminUserId} contractorId=${contractorUserId} imageCount=${params.dto.images?.length || 0}`,
    );
    const created = await this.createDesign(contractorUserId, params.dto, {
      publishImmediately: true,
      reviewedById: params.adminUserId,
      homeownerNoticeName: contractorName,
    });
    return created;
  }

  async createDesign(
    userId: string,
    dto: CreateDesignDto,
    options?: {
      publishImmediately?: boolean;
      reviewedById?: string;
      homeownerNoticeName?: string;
    },
  ) {
    if (!userId) {
      throw new BadRequestException('User not found');
    }

    const actor = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true },
    });
    if (!actor) {
      throw new NotFoundException('User not found');
    }

    // Product rule: only verified GCs can publish plan uploads.
    if (actor.role === 'general_contractor') {
      const contractor = await this.prisma.contractor.findUnique({
        where: { userId },
        select: { verified: true },
      });
      if (!contractor?.verified) {
        throw new ForbiddenException(
          "Your account hasn't been approved yet. BuildMyHouse will let you know once we've checked your details.",
        );
      }
    }

    // DTO currently models some list fields as strings (for easy admin input). Convert to arrays if provided.
    const rooms =
      typeof dto.rooms === 'string' && dto.rooms.trim()
        ? dto.rooms
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean)
        : undefined;
    const materials =
      typeof dto.materials === 'string' && dto.materials.trim()
        ? dto.materials
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean)
        : undefined;
    const features =
      typeof dto.features === 'string' && dto.features.trim()
        ? dto.features
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean)
        : undefined;

    // constructionPhases is stored as JSONB in DB; accept either JSON string or plain text.
    let constructionPhases: any = undefined;
    if (typeof dto.constructionPhases === 'string' && dto.constructionPhases.trim()) {
      const raw = dto.constructionPhases.trim();
      try {
        constructionPhases = JSON.parse(raw);
      } catch {
        constructionPhases = raw;
      }
    }

    const startedAt = Date.now();
    this.logger.log(
      `createDesign start adminId=${options?.reviewedById || 'none'} contractorId=${userId} imageCount=${dto.images?.length || 0}`,
    );
    const created = await this.prisma.design.create({
      data: {
        name: dto.name,
        description: dto.description,
        planType: dto.planType || 'homebuilding',
        projectTypeTag: dto.projectTypeTag || null,
        projectTypeFilter:
          typeof dto.projectTypeFilter === 'string' && dto.projectTypeFilter.trim()
            ? dto.projectTypeFilter.trim()
            : null,
        createdById: userId,
        bedrooms: optionalDesignSpec(dto.bedrooms),
        bathrooms: optionalDesignSpec(dto.bathrooms),
        squareFootage: optionalDesignSpec(dto.squareFootage),
        estimatedCost: dto.estimatedCost,
        floors: optionalDesignSpec(dto.floors),
        estimatedDuration: dto.estimatedDuration,
        rooms,
        materials,
        features,
        constructionPhases,
        isActive: !!options?.publishImmediately,
        adminApprovalStatus: options?.publishImmediately ? 'approved' : 'pending',
        adminReviewReason: null,
        adminReviewedAt: options?.publishImmediately ? new Date() : null,
        adminReviewedById: options?.publishImmediately ? options.reviewedById || null : null,
        images: {
          create: (dto.images || []).map((img) => ({
            url: img.url,
            thumbnailUrl: img.thumbnailUrl || null,
            label: img.label,
            order: img.order ?? 0,
          })),
        },
      },
      include: {
        images: { orderBy: { order: 'asc' } },
        createdBy: {
          select: {
            id: true,
            fullName: true,
            email: true,
            pictureUrl: true,
            contractorProfile: {
              select: {
                id: true,
                name: true,
                specialty: true,
                description: true,
                location: true,
                rating: true,
                reviews: true,
                projects: true,
                verified: true,
                imageUrl: true,
              },
            },
          },
        },
      },
    });

    this.logger.log(`createDesign created designId=${created.id} ms=${Date.now() - startedAt}`);
    const contractorName =
      options?.homeownerNoticeName ||
      created.createdBy?.contractorProfile?.name ||
      created.createdBy?.fullName ||
      'A general contractor';
    this.logger.log(`createDesign post-create email queued designId=${created.id}`);
    void this.emailHomeownersAboutNewProjectPlan({
      designId: created.id,
      contractorName,
      scopeName: created.name,
      projectTypeTag: created.projectTypeTag,
      planType: created.planType,
      isLive: !!options?.publishImmediately,
    })
      .then(() => {
        this.logger.log(`createDesign post-create email finished designId=${created.id}`);
      })
      .catch((error) => {
        this.logger.error(
          `createDesign post-create email failed designId=${created.id} message=${errorMessage(error)}`,
        );
      });

    if (!options?.publishImmediately) {
      const section = this.catalogSectionLabel(created.projectTypeTag, created.planType);
      await this.wsService.sendNotificationToRole('admin', {
        type: 'design_plan_pending_verification',
        title: 'New project plan to review',
        message: `${contractorName} added a new project plan, "${created.name}". Homeowners can use this plan on future projects with similar issues. Review it in Verification Center and publish it so it appears under ${section} in Projects.`,
        data: {
          designId: created.id,
          createdById: created.createdById,
        },
      });
    }

    return created;
  }

  private catalogSectionLabel(projectTypeTag?: string | null, planType?: string | null) {
    const tag = `${projectTypeTag || ''}`.toLowerCase();
    if (tag === 'repair') return 'Repairs';
    if (tag === 'upgrades') return 'Upgrades';
    if (tag === 'renovation') return 'Renovation';
    if (tag === 'full_builds') return 'Full Builds';

    const plan = `${planType || ''}`.toLowerCase();
    if (plan === 'interior_design') return 'Upgrades';
    if (plan === 'homebuilding') return 'Full Builds';
    if (plan === 'renovation') return 'Renovation';
    return 'Projects';
  }

  private async emailHomeownersAboutNewProjectPlan(params: {
    designId: string;
    contractorName: string;
    scopeName: string;
    projectTypeTag?: string | null;
    planType?: string | null;
    isLive: boolean;
  }) {
    try {
      if (process.env.HOMEOWNER_NEW_PLAN_EMAILS_ENABLED !== 'true') {
        this.logger.log(`skipped (flag off) designId=${params.designId}`);
        return;
      }

      const homeowners = await this.prisma.user.findMany({
        where: {
          role: 'homeowner',
          email: { not: '' },
        },
        select: { email: true },
      });
      const section = this.catalogSectionLabel(params.projectTypeTag, params.planType);
      const projectsUrl = 'https://buildmyhouse.app/property-projects-nigeria';
      const subject = `${params.contractorName} added a new project plan`;
      const instruction = params.isLive
        ? `Open Projects on BuildMyHouse and choose ${section}. Use this plan as the starting point when you have a future project with a similar issue.`
        : `BuildMyHouse is reviewing this plan. After it is published, open Projects and choose ${section}, then use it as the starting point for a future project with a similar issue.`;
      const text = [
        `${params.contractorName} added a new project plan, "${params.scopeName}".`,
        'This is a project plan you can use on future projects with similar issues.',
        instruction,
        projectsUrl,
      ].join('\n\n');
      const html = [
        `<p><strong>${this.escapeHtml(params.contractorName)}</strong> added a new project plan, <strong>${this.escapeHtml(params.scopeName)}</strong>.</p>`,
        '<p>This is a project plan you can use on future projects with similar issues.</p>',
        `<p>${this.escapeHtml(instruction)}</p>`,
        `<p><a href="${projectsUrl}">Open Projects</a></p>`,
      ].join('');

      let sent = 0;
      let failed = 0;
      let skipped = 0;
      for (let index = 0; index < homeowners.length; index += 1) {
        const to = String(homeowners[index]?.email || '').trim();
        if (!to) {
          skipped += 1;
        } else {
          try {
            await this.emailService.send({ to, subject, html, text });
            sent += 1;
          } catch (error) {
            failed += 1;
            this.logger.error(
              `homeowner plan email failed designId=${params.designId} step=send message=${errorMessage(error)}`,
            );
          }
        }
        if (index < homeowners.length - 1) {
          await delay(HOMEOWNER_EMAIL_PAUSE_MS);
        }
      }
      this.logger.log(
        `homeowner plan email summary designId=${params.designId} sent=${sent} failed=${failed} skipped=${skipped}`,
      );
    } catch (error) {
      this.logger.error(
        `homeowner plan email failed designId=${params.designId} step=load-homeowners message=${errorMessage(error)}`,
      );
      throw error;
    }
  }

  private escapeHtml(value: string) {
    return value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  async getPendingDesignsForAdmin(params: { actorRole: string }) {
    if (params.actorRole !== 'admin') {
      throw new ForbiddenException('Only admins can view pending design plans');
    }

    return this.prisma.design.findMany({
      where: { adminApprovalStatus: 'pending' },
      include: {
        images: { orderBy: { order: 'asc' } },
        createdBy: { select: { id: true, fullName: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getAdminDesignsByContractor(params: {
    actorRole: string;
    contractorUserId: string;
  }) {
    if (params.actorRole !== 'admin') {
      throw new ForbiddenException('Only admins can view contractor design plans');
    }

    const contractorUserId = String(params.contractorUserId || '').trim();
    if (!contractorUserId) {
      throw new BadRequestException('Contractor user ID is required');
    }

    return this.prisma.design.findMany({
      where: { createdById: contractorUserId },
      include: {
        images: { orderBy: { order: 'asc' } },
        createdBy: {
          select: {
            id: true,
            fullName: true,
            email: true,
            contractorProfile: {
              select: {
                id: true,
                name: true,
                specialty: true,
                specialtyCategory: true,
                specialtyTags: true,
                verified: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async approveDesignGoLive(params: {
    designId: string;
    adminUserId: string;
    actorRole: string;
  }) {
    if (params.actorRole !== 'admin') {
      throw new ForbiddenException('Only admins can approve design plans');
    }

    const existing = await this.prisma.design.findUnique({
      where: { id: params.designId },
      include: {
        createdBy: { select: { id: true, fullName: true } },
      },
    });
    if (!existing) {
      throw new NotFoundException('Design not found');
    }

    const alreadyLive = existing.isActive === true && existing.adminApprovalStatus === 'approved';

    const updated = await this.prisma.design.update({
      where: { id: params.designId },
      data: {
        isActive: true,
        adminApprovalStatus: 'approved',
        adminReviewReason: null,
        adminReviewedAt: new Date(),
        adminReviewedById: params.adminUserId,
      },
      include: {
        images: { orderBy: { order: 'asc' } },
        createdBy: { select: { id: true, fullName: true, email: true } },
      },
    });

    await this.wsService.sendNotification(updated.createdById, {
      type: 'design_plan_went_live',
      title: 'Design plan is live',
      message: `Great news! Your design plan "${updated.name}" has been approved and is now visible to homeowners.`,
      data: {
        designId: updated.id,
      },
    });

    const contractor = await this.prisma.contractor.findUnique({
      where: { userId: updated.createdById },
      select: { name: true },
    });
    const contractorName = String(
      contractor?.name || updated.createdBy?.fullName || 'A general contractor',
    ).trim();
    if (!alreadyLive) {
      this.logger.log(`approveDesignGoLive post-create email queued designId=${updated.id}`);
      void this.emailHomeownersAboutNewProjectPlan({
        designId: updated.id,
        contractorName,
        scopeName: updated.name,
        projectTypeTag: updated.projectTypeTag,
        planType: updated.planType,
        isLive: true,
      })
        .then(() => {
          this.logger.log(`approveDesignGoLive post-create email finished designId=${updated.id}`);
        })
        .catch((error) => {
          this.logger.error(
            `approveDesignGoLive post-create email failed designId=${updated.id} message=${errorMessage(error)}`,
          );
        });
    }

    return updated;
  }

  async rejectDesignPlan(params: {
    designId: string;
    adminUserId: string;
    actorRole: string;
    reason: string;
  }) {
    if (params.actorRole !== 'admin') {
      throw new ForbiddenException('Only admins can reject design plans');
    }
    const reason = String(params.reason || '').trim();
    if (!reason) {
      throw new BadRequestException('Rejection reason is required');
    }

    const existing = await this.prisma.design.findUnique({
      where: { id: params.designId },
      include: {
        createdBy: { select: { id: true, fullName: true } },
      },
    });
    if (!existing) {
      throw new NotFoundException('Design not found');
    }

    const updated = await this.prisma.design.update({
      where: { id: params.designId },
      data: {
        isActive: false,
        adminApprovalStatus: 'rejected',
        adminReviewReason: reason,
        adminReviewedAt: new Date(),
        adminReviewedById: params.adminUserId,
      },
      include: {
        images: { orderBy: { order: 'asc' } },
        createdBy: { select: { id: true, fullName: true, email: true } },
      },
    });

    await this.wsService.sendNotification(updated.createdById, {
      type: 'design_plan_rejected',
      title: 'Design plan requires updates',
      message: `Your design plan "${updated.name}" was not approved yet. Reason: ${reason}`,
      data: {
        designId: updated.id,
        reason,
      },
    });

    return updated;
  }

  async updateDesign(params: { designId: string; actorUserId: string; actorRole: string; data: any }) {
    if (!params.actorUserId) {
      throw new BadRequestException('User not found');
    }

    const existing = await this.prisma.design.findUnique({
      where: { id: params.designId },
      include: { images: true },
    });
    if (!existing) {
      throw new NotFoundException('Design not found');
    }
    if (params.actorRole !== 'admin' && existing.createdById !== params.actorUserId) {
      throw new ForbiddenException('You do not have permission to update this design');
    }

    const parseCsvToArray = (value: unknown): string[] | undefined => {
      if (typeof value !== 'string') return undefined;
      return value
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
    };

    // Only allow updating safe scalar fields via this endpoint.
    const allowed: Record<string, any> = {};
    const fields = [
      'name',
      'description',
      'bedrooms',
      'bathrooms',
      'squareFootage',
      'estimatedCost',
      'floors',
      'estimatedDuration',
      'rooms',
      'materials',
      'features',
      'constructionPhases',
      'planType',
      'projectTypeTag',
      'projectTypeFilter',
      'isActive',
    ];
    for (const key of fields) {
      if (params.data?.[key] !== undefined) {
        allowed[key] = params.data[key];
      }
    }
    for (const key of ['bedrooms', 'bathrooms', 'squareFootage', 'floors']) {
      if (allowed[key] !== undefined) {
        allowed[key] = optionalDesignSpec(allowed[key]);
      }
    }

    // Keep update payload compatible with DB types (frontend sends CSV strings)
    if (typeof allowed.rooms === 'string') {
      allowed.rooms = parseCsvToArray(allowed.rooms);
    }
    if (typeof allowed.materials === 'string') {
      allowed.materials = parseCsvToArray(allowed.materials);
    }
    if (typeof allowed.features === 'string') {
      allowed.features = parseCsvToArray(allowed.features);
    }
    if (typeof allowed.constructionPhases === 'string') {
      const raw = allowed.constructionPhases.trim();
      try {
        allowed.constructionPhases = JSON.parse(raw);
      } catch {
        // If not valid JSON, keep raw string for backward compatibility.
        allowed.constructionPhases = raw;
      }
    }
    if (typeof allowed.projectTypeFilter === 'string') {
      const trimmed = allowed.projectTypeFilter.trim();
      allowed.projectTypeFilter = trimmed || null;
    }

    const imageUpdates = Array.isArray(params.data?.images) ? params.data.images : undefined;
    const nextImages =
      imageUpdates === undefined
        ? undefined
        : imageUpdates
            .map((image: any, index: number) => ({
              url: String(image?.url || '').trim(),
              thumbnailUrl:
                typeof image?.thumbnailUrl === 'string' && image.thumbnailUrl.trim()
                  ? image.thumbnailUrl.trim()
                  : null,
              label:
                typeof image?.label === 'string' && image.label.trim()
                  ? image.label.trim()
                  : `Image ${index + 1}`,
              order: Number.isFinite(Number(image?.order)) ? Number(image.order) : index,
            }))
            .filter((image) => image.url);

    if (imageUpdates !== undefined && (!nextImages || nextImages.length === 0)) {
      throw new BadRequestException('At least one design image is required');
    }

    if (params.actorRole === 'general_contractor' && existing.adminApprovalStatus === 'rejected') {
      allowed.adminApprovalStatus = 'pending';
      allowed.adminReviewReason = null;
      allowed.adminReviewedAt = null;
      allowed.adminReviewedById = null;
      allowed.isActive = false;
    }

    const updated = await this.prisma.design.update({
      where: { id: params.designId },
      data: {
        ...allowed,
        ...(nextImages
          ? {
              images: {
                deleteMany: {},
                create: nextImages,
              },
            }
          : {}),
      },
      include: {
        images: { orderBy: { order: 'asc' } },
        createdBy: { select: { id: true, fullName: true, email: true } },
      },
    });
    return updated;
  }

  async deleteDesign(params: { designId: string; actorUserId: string; actorRole: string }) {
    if (!params.actorUserId) {
      throw new BadRequestException('User not found');
    }

    const existing = await this.prisma.design.findUnique({
      where: { id: params.designId },
      select: { id: true, createdById: true },
    });
    if (!existing) {
      throw new NotFoundException('Design not found');
    }
    if (params.actorRole !== 'admin' && existing.createdById !== params.actorUserId) {
      throw new ForbiddenException('You do not have permission to delete this design');
    }

    // Images are onDelete: Cascade via relation; this is safe.
    await this.prisma.design.delete({ where: { id: params.designId } });
    return { message: 'Design deleted successfully' };
  }
}

function errorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  return String(error);
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function optionalDesignSpec(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null;
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) {
    throw new BadRequestException('Property details must be zero or a positive number.');
  }
  return parsed;
}

function designTab(design: any): 'repairs' | 'upgrades' | 'renovation' | 'full_builds' {
  const explicitTag = `${design?.projectTypeTag || ''}`.toLowerCase();
  if (explicitTag === 'repair') return 'repairs';
  if (explicitTag === 'upgrades') return 'upgrades';
  if (explicitTag === 'renovation') return 'renovation';
  if (explicitTag === 'full_builds') return 'full_builds';
  const apiPlanType = `${design?.planType || ''}`.toLowerCase();
  if (apiPlanType === 'interior_design') return 'upgrades';
  if (apiPlanType === 'homebuilding') return 'full_builds';
  const searchable = `${design?.name || ''} ${design?.description || ''}`.toLowerCase();
  const likelyRepair = ['repair', 'fix', 'electrical', 'plumbing', 'roof', 'drainage'].some((keyword) =>
    searchable.includes(keyword),
  );
  return likelyRepair ? 'repairs' : 'renovation';
}

function matchesDesignCard(
  design: any,
  query: { tab?: string; q?: string; location?: string; tag?: string },
) {
  if (query.tab && designTab(design) !== query.tab) return false;
  const location = `${query.location || ''}`.trim();
  if (location && location.toLowerCase() !== 'all locations') {
    const label = `${design?.createdBy?.contractorProfile?.location || ''}`.toLowerCase();
    if (!label.includes(location.toLowerCase())) return false;
  }
  const tag = `${query.tag || ''}`.trim();
  if (tag && tag.toLowerCase() !== 'all') {
    const haystack = `${design?.projectTypeFilter || ''} ${design?.name || ''} ${design?.description || ''}`.toLowerCase();
    if (!haystack.includes(tag.toLowerCase())) return false;
  }
  const tokens = `${query.q || ''}`
    .toLowerCase()
    .split(/[^a-z0-9]+/i)
    .map((token) => token.trim())
    .filter((token) => token.length >= 2);
  if (!tokens.length) return true;
  const corpus = [
    design?.name,
    design?.description,
    design?.projectTypeFilter,
    design?.projectTypeTag,
    design?.createdBy?.fullName,
    design?.createdBy?.contractorProfile?.name,
    design?.createdBy?.contractorProfile?.location,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
  return tokens.every((token) => corpus.includes(token));
}

function toDesignCard(design: any) {
  const { description: _description, ...card } = design;
  return card;
}
