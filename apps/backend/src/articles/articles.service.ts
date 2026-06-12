import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { isTipTapDoc, normalizeStoredArticleContent } from './article-content';
import { UpsertArticleDto } from './dto/upsert-article.dto';
import { ResourceSectionsService } from '../resource-sections/resource-sections.service';

@Injectable()
export class ArticlesService {
  private prisma = new PrismaClient() as any;
  private readonly validAudiences = new Set(['homeowner', 'gc']);
  private readonly validPillars = new Set(['build-abroad', 'renovate-abroad', 'lagos-compliance', 'general']);

  constructor(private readonly resourceSectionsService: ResourceSectionsService) {}

  private normalizeSlug(slug: string) {
    const clean = String(slug || '')
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
    return clean;
  }

  private normalizeCanonicalPath(path: string, slug: string) {
    const raw = String(path || '').trim();
    if (!raw) return `/articles/${slug}`;
    const prefixed = raw.startsWith('/') ? raw : `/${raw}`;
    return prefixed.replace(/\/+$/, '') || `/articles/${slug}`;
  }

  private normalizeAudience(audience?: string): 'homeowner' | 'gc' {
    const raw = String(audience || 'homeowner').trim().toLowerCase();
    if (!this.validAudiences.has(raw)) return 'homeowner';
    return raw as 'homeowner' | 'gc';
  }

  private normalizeArticlePillar(value?: string) {
    const raw = String(value || '').trim();
    if (!raw) return null;
    if (!this.validPillars.has(raw)) {
      throw new BadRequestException('articlePillar must be build-abroad, renovate-abroad, lagos-compliance, or general');
    }
    return raw;
  }

  private async normalizeUpsertPayload(dto: UpsertArticleDto) {
    const slug = this.normalizeSlug(dto.slug);
    if (!slug) {
      throw new BadRequestException('Slug is required');
    }

    const canonicalPath = this.normalizeCanonicalPath(dto.canonicalPath, slug);

    if (!canonicalPath.startsWith('/articles/')) {
      throw new BadRequestException('Canonical path must start with /articles/');
    }

    const content = dto.content;
    if (!isTipTapDoc(content)) {
      throw new BadRequestException('content must be a TipTap document with type "doc"');
    }
    const inner = (content as { content?: unknown }).content;
    if (!Array.isArray(inner)) {
      throw new BadRequestException('content.content must be an array');
    }

    const isPublished = Boolean(dto.isPublished);
    const audience = this.normalizeAudience(dto.audience);
    let resourceSectionKeys = Array.isArray(dto.resourceSectionKeys)
      ? dto.resourceSectionKeys.map((key) => String(key || '').trim()).filter(Boolean)
      : [];

    if (resourceSectionKeys.length > 0) {
      resourceSectionKeys = await this.resourceSectionsService.validateSectionKeys(resourceSectionKeys);
    } else if (isPublished && audience === 'homeowner') {
      throw new BadRequestException(
        'Choose at least one articles landing page section before publishing a homeowner article',
      );
    }

    return {
      slug,
      title: String(dto.title || '').trim(),
      description: String(dto.description || '').trim(),
      excerpt: String(dto.excerpt || '').trim(),
      coverImageUrl: String(dto.coverImageUrl || '').trim(),
      coverImageAlt: String(dto.coverImageAlt || '').trim(),
      readingMinutes: Number(dto.readingMinutes || 5),
      tags: Array.isArray(dto.tags) ? dto.tags.map((tag) => String(tag || '').trim()).filter(Boolean) : [],
      authorName: String(dto.authorName || '').trim() || 'BuildMyHouse Editorial',
      audience,
      canonicalPath,
      content: dto.content as object,
      faqs: Array.isArray(dto.faqs) ? dto.faqs : [],
      internalLinks: Array.isArray(dto.internalLinks) ? dto.internalLinks : [],
      resourceSectionKeys,
      articlePillar: this.normalizeArticlePillar(dto.articlePillar),
      isPublished,
    };
  }

  private withNormalizedContent<T extends { content: unknown }>(row: T) {
    return {
      ...row,
      content: normalizeStoredArticleContent(row.content),
    };
  }

  private articleSelectFields = {
    id: true,
    slug: true,
    title: true,
    description: true,
    excerpt: true,
    coverImageUrl: true,
    coverImageAlt: true,
    readingMinutes: true,
    tags: true,
    authorName: true,
    audience: true,
    canonicalPath: true,
    content: true,
    faqs: true,
    internalLinks: true,
    resourceSectionKeys: true,
    articlePillar: true,
    isPublished: true,
    publishedAt: true,
    createdAt: true,
    updatedAt: true,
  };

  async listPublished(audience?: string) {
    const normalizedAudience = this.normalizeAudience(audience);
    const rows = await this.prisma.cmsArticle.findMany({
      where: { isPublished: true, audience: normalizedAudience },
      orderBy: [{ publishedAt: 'desc' }, { updatedAt: 'desc' }],
      select: this.articleSelectFields,
    });
    return rows.map((r) => this.withNormalizedContent(r));
  }

  async getPublishedBySlug(slug: string, audience?: string) {
    const normalizedAudience = this.normalizeAudience(audience);
    const article = await this.prisma.cmsArticle.findFirst({
      where: {
        slug: this.normalizeSlug(slug),
        isPublished: true,
        audience: normalizedAudience,
      },
    });

    if (!article) {
      throw new NotFoundException('Article not found');
    }

    return this.withNormalizedContent(article);
  }

  async listAdmin(audience?: string) {
    const normalizedAudience = audience ? this.normalizeAudience(audience) : undefined;
    const rows = await this.prisma.cmsArticle.findMany({
      where: normalizedAudience ? { audience: normalizedAudience } : undefined,
      orderBy: [{ updatedAt: 'desc' }],
    });
    return rows.map((r) => this.withNormalizedContent(r));
  }

  async getAdminById(id: string) {
    const article = await this.prisma.cmsArticle.findUnique({ where: { id } });
    if (!article) {
      throw new NotFoundException('Article not found');
    }
    return this.withNormalizedContent(article);
  }

  async createAdmin(dto: UpsertArticleDto) {
    const payload = await this.normalizeUpsertPayload(dto);
    const now = new Date();

    return this.prisma.cmsArticle.create({
      data: {
        ...payload,
        publishedAt: payload.isPublished ? now : null,
      },
    });
  }

  async updateAdmin(id: string, dto: UpsertArticleDto) {
    await this.getAdminById(id);
    const payload = await this.normalizeUpsertPayload(dto);
    const now = new Date();

    return this.prisma.cmsArticle.update({
      where: { id },
      data: {
        ...payload,
        publishedAt: payload.isPublished ? now : null,
      },
    });
  }

  async updatePublishStatus(id: string, isPublished: boolean) {
    const existing = await this.getAdminById(id);
    if (isPublished) {
      const keys = Array.isArray(existing.resourceSectionKeys) ? existing.resourceSectionKeys : [];
      if (existing.audience === 'homeowner' && keys.length === 0) {
        throw new BadRequestException(
          'Assign at least one articles landing page section before publishing this homeowner article',
        );
      }
    }

    return this.prisma.cmsArticle.update({
      where: { id },
      data: {
        isPublished,
        publishedAt: isPublished ? new Date() : null,
      },
    });
  }

  async deleteAdmin(id: string) {
    await this.getAdminById(id);
    await this.prisma.cmsArticle.delete({ where: { id } });
    return { message: 'Article deleted successfully' };
  }
}
