import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { UpsertArticleDto } from './dto/upsert-article.dto';

@Injectable()
export class ArticlesService {
  private prisma = new PrismaClient() as any;

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

  private normalizeUpsertPayload(dto: UpsertArticleDto) {
    const slug = this.normalizeSlug(dto.slug);
    if (!slug) {
      throw new BadRequestException('Slug is required');
    }

    const canonicalPath = this.normalizeCanonicalPath(dto.canonicalPath, slug);

    if (!canonicalPath.startsWith('/articles/')) {
      throw new BadRequestException('Canonical path must start with /articles/');
    }

    const rawBlocks = Array.isArray(dto.blocks) ? dto.blocks : [];
    const blocks = rawBlocks.map((block, index) => {
      if (!block || Array.isArray(block) || typeof block !== 'object') {
        throw new BadRequestException(`Block at index ${index} must be an object`);
      }
      if (typeof (block as any).type !== 'string' || !(block as any).type.trim()) {
        throw new BadRequestException(`Block at index ${index} is missing a valid "type"`);
      }
      return block;
    });

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
      canonicalPath,
      blocks,
      faqs: Array.isArray(dto.faqs) ? dto.faqs : [],
      internalLinks: Array.isArray(dto.internalLinks) ? dto.internalLinks : [],
      isPublished: Boolean(dto.isPublished),
    };
  }

  async listPublished() {
    return this.prisma.cmsArticle.findMany({
      where: { isPublished: true },
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
        canonicalPath: true,
        blocks: true,
        faqs: true,
        internalLinks: true,
        isPublished: true,
        publishedAt: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async getPublishedBySlug(slug: string) {
    const article = await this.prisma.cmsArticle.findFirst({
      where: {
        slug: this.normalizeSlug(slug),
        isPublished: true,
      },
    });

    if (!article) {
      throw new NotFoundException('Article not found');
    }

    return article;
  }

  async listAdmin() {
    return this.prisma.cmsArticle.findMany({
      orderBy: [{ updatedAt: 'desc' }],
    });
  }

  async getAdminById(id: string) {
    const article = await this.prisma.cmsArticle.findUnique({ where: { id } });
    if (!article) {
      throw new NotFoundException('Article not found');
    }
    return article;
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
