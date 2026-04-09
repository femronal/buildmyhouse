import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { isTipTapDoc, normalizeStoredArticleContent } from './article-content';
import { UpsertArticleDto } from './dto/upsert-article.dto';

@Injectable()
export class ArticlesService {
  private prisma = new PrismaClient() as any;
  private readonly validAudiences = new Set(['homeowner', 'gc']);

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

  private normalizeUpsertPayload(dto: UpsertArticleDto) {
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
      audience: this.normalizeAudience(dto.audience),
      canonicalPath,
      content: dto.content as object,
      faqs: Array.isArray(dto.faqs) ? dto.faqs : [],
      internalLinks: Array.isArray(dto.internalLinks) ? dto.internalLinks : [],
      isPublished: Boolean(dto.isPublished),
    };
  }

  private withNormalizedContent<T extends { content: unknown }>(row: T) {
    return {
      ...row,
      content: normalizeStoredArticleContent(row.content),
    };
  }

  async listPublished(audience?: string) {
    const normalizedAudience = this.normalizeAudience(audience);
    const rows = await this.prisma.cmsArticle.findMany({
      where: { isPublished: true, audience: normalizedAudience },
      orderBy: [{ publishedAt: 'desc' }, { updatedAt: 'desc' }],
      select: {
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
        isPublished: true,
        publishedAt: true,
        createdAt: true,
        updatedAt: true,
      },
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
    const payload = this.normalizeUpsertPayload(dto);
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
    const payload = this.normalizeUpsertPayload(dto);
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
    await this.getAdminById(id);
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
