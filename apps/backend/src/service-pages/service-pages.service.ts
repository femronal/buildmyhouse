import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { OpenAIService } from '../openai/openai.service';
import { UpsertServicePageDto } from './dto/upsert-service-page.dto';
import { GenerateServicePageDto } from './dto/generate-service-page.dto';
import {
  buildServicePageTemplate,
  isValidServicePagePayload,
  mergeServicePageResponse,
  type ServicePagePayload,
  type ServicePageRegion,
} from './service-page-content';
import {
  buildServicePageCanonicalPath,
  normalizeServicePageCanonicalPath,
  normalizeServicePageSlug,
} from './service-page-paths';

@Injectable()
export class ServicePagesService {
  private prisma = new PrismaClient() as any;

  constructor(private readonly openAIService: OpenAIService) {}

  private normalizeSlug(slug: string) {
    return normalizeServicePageSlug(slug);
  }

  private normalizeRegion(region?: string): ServicePageRegion {
    const raw = String(region || 'lagos').trim().toLowerCase();
    return raw === 'nigeria' ? 'nigeria' : 'lagos';
  }

  private normalizeCanonicalPath(_path: string, region: ServicePageRegion, slug: string) {
    return buildServicePageCanonicalPath(region, slug);
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
    const canonicalPath = normalizeServicePageCanonicalPath(String(path || '').trim() || '/');
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

  /**
   * AI-generate service page copy for admin review before publish.
   * Keeps default images and CTA hrefs from the deterministic template.
   */
  async generateWithAi(dto: GenerateServicePageDto) {
    const serviceName = String(dto.serviceName || '').trim();
    if (serviceName.length < 2) {
      throw new BadRequestException('Enter a service name (at least 2 characters).');
    }

    if (!this.openAIService.isConfigured()) {
      throw new BadRequestException(
        'OpenAI is not configured. Set OPENAI_API_KEY on the backend to generate service pages.',
      );
    }

    const region = this.normalizeRegion(dto.region);
    const generated = await this.openAIService.generateServicePageCopy({
      serviceName,
      region,
      slug: dto.slug,
      templateKind: dto.templateKind,
    });

    if (!generated) {
      throw new BadRequestException(
        'AI could not generate this service page. Try again in a moment, or fill the form manually.',
      );
    }

    const slug = this.normalizeSlug(generated.slug || serviceName);
    const templateKind = this.normalizeSlug(generated.templateKind || slug);
    const fallback = buildServicePageTemplate(templateKind, region, slug);
    const aiPayload = generated.payload as Record<string, any>;

    const payload: ServicePagePayload = {
      ...fallback.payload,
      locationLabel: region === 'lagos' ? 'Lagos, Nigeria' : 'Nigeria',
      headline: String(aiPayload.headline || fallback.payload.headline),
      heroLead: String(aiPayload.heroLead || fallback.payload.heroLead),
      heroMeta: String(aiPayload.heroMeta || fallback.payload.heroMeta),
      trustWords: Array.isArray(aiPayload.trustWords)
        ? aiPayload.trustWords.map(String)
        : fallback.payload.trustWords,
      pillarsHeadline: String(aiPayload.pillarsHeadline || fallback.payload.pillarsHeadline),
      archiveTitle: String(aiPayload.archiveTitle || fallback.payload.archiveTitle),
      fieldNotesHeading: String(aiPayload.fieldNotesHeading || fallback.payload.fieldNotesHeading),
      workTitle: String(aiPayload.workTitle || fallback.payload.workTitle),
      workBody: String(aiPayload.workBody || fallback.payload.workBody),
      engageIntro: String(aiPayload.engageIntro || fallback.payload.engageIntro),
      contactPrompt: String(aiPayload.contactPrompt || fallback.payload.contactPrompt),
      pillars: Array.isArray(aiPayload.pillars) && aiPayload.pillars.length
        ? aiPayload.pillars
        : fallback.payload.pillars,
      stats: Array.isArray(aiPayload.stats) && aiPayload.stats.length
        ? aiPayload.stats
        : fallback.payload.stats,
      processSteps: Array.isArray(aiPayload.processSteps) && aiPayload.processSteps.length
        ? aiPayload.processSteps
        : fallback.payload.processSteps,
      fieldNotes: Array.isArray(aiPayload.fieldNotes) && aiPayload.fieldNotes.length
        ? aiPayload.fieldNotes
        : fallback.payload.fieldNotes,
      reviews: Array.isArray(aiPayload.reviews) && aiPayload.reviews.length
        ? aiPayload.reviews
        : fallback.payload.reviews,
      faqs: Array.isArray(aiPayload.faqs) && aiPayload.faqs.length
        ? aiPayload.faqs
        : fallback.payload.faqs,
      engageCards: Array.isArray(aiPayload.engageCards) && aiPayload.engageCards.length
        ? aiPayload.engageCards.map((card: any, index: number) => ({
            title: String(card?.title || ''),
            subtitle: String(card?.subtitle || ''),
            badge: String(card?.badge || (index === 0 ? 'Most popular' : '')),
            features: Array.isArray(card?.features) ? card.features.map(String) : [],
          }))
        : fallback.payload.engageCards,
      articleLinks: Array.isArray(aiPayload.articleLinks) && aiPayload.articleLinks.length
        ? aiPayload.articleLinks
        : fallback.payload.articleLinks,
      images: fallback.payload.images,
      primaryCta: {
        label: String(aiPayload.primaryCtaLabel || fallback.payload.primaryCta.label),
        href: fallback.payload.primaryCta.href,
      },
      secondaryCta: {
        label: String(aiPayload.secondaryCtaLabel || fallback.payload.secondaryCta.label),
        href: fallback.payload.secondaryCta.href,
      },
    };

    return {
      metaTitle: generated.metaTitle || fallback.metaTitle,
      summary: generated.summary || fallback.summary,
      canonicalPath: buildServicePageCanonicalPath(region, slug),
      slug,
      region,
      templateKind,
      payload,
      generatedByAi: true,
    };
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
