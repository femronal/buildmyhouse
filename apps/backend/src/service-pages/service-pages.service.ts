import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { UpsertServicePageDto } from './dto/upsert-service-page.dto';
import {
  buildServicePageTemplate,
  isValidServicePagePayload,
  mergeServicePageResponse,
  type ServicePageRegion,
} from './service-page-content';

@Injectable()
export class ServicePagesService {
  private prisma = new PrismaClient() as any;

  private normalizeSlug(slug: string) {
    return String(slug || '')
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  }

  private normalizeRegion(region?: string): ServicePageRegion {
    const raw = String(region || 'lagos').trim().toLowerCase();
    return raw === 'nigeria' ? 'nigeria' : 'lagos';
  }

  private normalizeCanonicalPath(path: string, region: ServicePageRegion, slug: string) {
    const raw = String(path || '').trim();
    if (!raw) {
      return region === 'lagos' ? `/services/lagos/${slug}` : `/services/${slug}-nigeria`;
    }
    const prefixed = raw.startsWith('/') ? raw : `/${raw}`;
    return prefixed.replace(/\/+$/, '');
  }

  private validatePayload(payload: unknown) {
    if (!isValidServicePagePayload(payload)) {
      throw new BadRequestException('payload is missing required service page fields');
    }
    return payload;
  }

  private normalizeUpsert(dto: UpsertServicePageDto) {
    const slug = this.normalizeSlug(dto.slug);
    if (!slug) throw new BadRequestException('Slug is required');

    const region = this.normalizeRegion(dto.region);
    const templateKind = this.normalizeSlug(dto.templateKind || slug);
    const canonicalPath = this.normalizeCanonicalPath(dto.canonicalPath || '', region, slug);

    if (region === 'lagos' && !canonicalPath.startsWith('/services/lagos/')) {
      throw new BadRequestException('Lagos service pages must use /services/lagos/{slug}');
    }
    if (region === 'nigeria' && !canonicalPath.startsWith('/services/')) {
      throw new BadRequestException('Nigeria service pages must use /services/{slug}');
    }

    const payload = this.validatePayload(dto.payload);
    payload.images.archive = payload.images.archive.filter((url) => String(url || '').trim().length > 0);

    return {
      slug,
      region,
      templateKind,
      metaTitle: String(dto.metaTitle || '').trim(),
      summary: String(dto.summary || '').trim(),
      canonicalPath,
      payload,
      isPublished: Boolean(dto.isPublished),
    };
  }

  listPublished(region?: string) {
    const normalizedRegion = region ? this.normalizeRegion(region) : undefined;
    return this.prisma.cmsServicePage
      .findMany({
        where: {
          isPublished: true,
          ...(normalizedRegion ? { region: normalizedRegion } : {}),
        },
        orderBy: [{ publishedAt: 'desc' }, { updatedAt: 'desc' }],
      })
      .then((rows: any[]) => rows.map(mergeServicePageResponse));
  }

  async getPublishedByPath(path: string) {
    const canonicalPath = String(path || '').trim().replace(/\/+$/, '') || '/';
    const row = await this.prisma.cmsServicePage.findFirst({
      where: { canonicalPath, isPublished: true },
    });
    if (!row) throw new NotFoundException('Service page not found');
    return mergeServicePageResponse(row);
  }

  async getPublishedByRegionSlug(region: string, slug: string) {
    const normalizedRegion = this.normalizeRegion(region);
    const normalizedSlug = this.normalizeSlug(slug);
    const row = await this.prisma.cmsServicePage.findFirst({
      where: { region: normalizedRegion, slug: normalizedSlug, isPublished: true },
    });
    if (!row) throw new NotFoundException('Service page not found');
    return mergeServicePageResponse(row);
  }

  listAdmin(region?: string) {
    const normalizedRegion = region ? this.normalizeRegion(region) : undefined;
    return this.prisma.cmsServicePage
      .findMany({
        where: normalizedRegion ? { region: normalizedRegion } : {},
        orderBy: [{ updatedAt: 'desc' }],
      })
      .then((rows: any[]) => rows.map(mergeServicePageResponse));
  }

  async getAdminById(id: string) {
    const row = await this.prisma.cmsServicePage.findUnique({ where: { id } });
    if (!row) throw new NotFoundException('Service page not found');
    return mergeServicePageResponse(row);
  }

  getTemplate(templateKind: string, region?: string, slug?: string) {
    const normalizedRegion = this.normalizeRegion(region);
    const normalizedSlug = this.normalizeSlug(slug || templateKind);
    const normalizedKind = this.normalizeSlug(templateKind);
    return buildServicePageTemplate(normalizedKind, normalizedRegion, normalizedSlug);
  }

  async createAdmin(dto: UpsertServicePageDto) {
    const data = this.normalizeUpsert(dto);
    const row = await this.prisma.cmsServicePage.create({
      data: {
        ...data,
        publishedAt: data.isPublished ? new Date() : null,
      },
    });
    return mergeServicePageResponse(row);
  }

  async createFromTemplate(input: {
    slug: string;
    region: ServicePageRegion;
    templateKind: string;
    metaTitle?: string;
    summary?: string;
  }) {
    const slug = this.normalizeSlug(input.slug);
    const region = this.normalizeRegion(input.region);
    const templateKind = this.normalizeSlug(input.templateKind);
    const built = buildServicePageTemplate(templateKind, region, slug, input.metaTitle, input.summary);
    return this.createAdmin({
      slug,
      region,
      templateKind,
      metaTitle: built.metaTitle,
      summary: built.summary,
      canonicalPath: built.canonicalPath,
      payload: built.payload,
      isPublished: false,
    });
  }

  async updateAdmin(id: string, dto: UpsertServicePageDto) {
    const existing = await this.prisma.cmsServicePage.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Service page not found');

    const data = this.normalizeUpsert(dto);
    const row = await this.prisma.cmsServicePage.update({
      where: { id },
      data: {
        ...data,
        publishedAt: data.isPublished ? existing.publishedAt || new Date() : null,
      },
    });
    return mergeServicePageResponse(row);
  }

  async updatePublishStatus(id: string, isPublished: boolean) {
    const existing = await this.prisma.cmsServicePage.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Service page not found');

    const row = await this.prisma.cmsServicePage.update({
      where: { id },
      data: {
        isPublished,
        publishedAt: isPublished ? existing.publishedAt || new Date() : null,
      },
    });
    return mergeServicePageResponse(row);
  }

  async deleteAdmin(id: string) {
    const existing = await this.prisma.cmsServicePage.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Service page not found');
    await this.prisma.cmsServicePage.delete({ where: { id } });
    return { success: true };
  }
}
