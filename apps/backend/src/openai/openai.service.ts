import { Injectable, Logger } from '@nestjs/common';
import OpenAI from 'openai';

export interface PlanAnalysis {
  projectType: string; // 'repair' | 'upgrades' | 'renovation' | 'full_builds'
  estimatedBudget: number;
  estimatedDuration: string; // e.g., "6-8 months"
  squareFootage: number;
  floors: number;
  bedrooms: number;
  bathrooms: number;

  // Extracted details
  rooms: string[]; // List of rooms mentioned
  materials: string[]; // Building materials identified
  features: string[]; // Special features (pool, garage, etc.)

  // Construction phases
  phases: {
    name: string;
    description: string;
    estimatedDuration: string;
    estimatedCost: number;
  }[];
  
  // AI confidence and notes
  confidence: number; // 0-100
  notes: string;
  processingDate: string;
}

export interface AnalyzePlanInput {
  projectName: string;
  userBudget: number;
  projectTypeTag?: string;
  projectTypeFilter?: string;
  projectDescription?: string;
  successCriteria?: string;
  address?: string;
  pdfText?: string;
  imageUrls?: string[];
  hasPdf?: boolean;
}

export interface RerankContractorInput {
  id: string;
  name?: string | null;
  specialty?: string | null;
  specialtyCategory?: string | null;
  specialtyTags?: string[];
  location?: string | null;
  rating?: number | null;
  reviews?: number | null;
  projects?: number | null;
  experienceYears?: number | null;
  verified?: boolean | null;
  matchScore?: number | null;
  matchReasons?: string[];
  requestStats?: {
    responseRate?: number;
    acceptanceRate?: number;
    avgResponseHours?: number | null;
  } | null;
  disputeStats?: {
    open?: number;
    inReview?: number;
    resolved?: number;
  } | null;
}

export interface RerankProjectInput {
  id: string;
  name?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  budget?: number | null;
  projectType?: string | null;
  aiAnalysis?: any;
}

export interface RerankContractorMatchesResult {
  orderedContractorIds: string[];
  reasonsById: Record<string, string[]>;
}

@Injectable()
export class OpenAIService {
  private openai: OpenAI;
  private readonly logger = new Logger(OpenAIService.name);
  private readonly model: string;
  private readonly hasApiKey: boolean;

  constructor() {
    const apiKey = process.env.OPENAI_API_KEY;
    this.hasApiKey = !!apiKey;
    this.model = process.env.OPENAI_MODEL?.trim() || 'gpt-4o';

    if (!this.hasApiKey) {
      this.logger.warn('OPENAI_API_KEY not set - analysis will use heuristic fallback');
    }

    this.openai = new OpenAI({
      apiKey: apiKey || 'sk-mock-key',
    });
  }

  isConfigured(): boolean {
    return this.hasApiKey;
  }

  /**
   * Generate BuildMyHouse service-page copy from a service name.
   * Returns SEO fields + text payload (images/CTA hrefs filled by caller).
   */
  async generateServicePageCopy(params: {
    serviceName: string;
    region: 'lagos' | 'nigeria';
    templateKind?: string;
    slug?: string;
  }): Promise<{
    metaTitle: string;
    summary: string;
    slug: string;
    templateKind: string;
    payload: Record<string, unknown>;
  } | null> {
    if (!this.hasApiKey) {
      return null;
    }

    const serviceName = this.asTrimmedString(params.serviceName);
    if (!serviceName) {
      return null;
    }

    const region = params.region === 'nigeria' ? 'nigeria' : 'lagos';
    const locationLabel = region === 'lagos' ? 'Lagos, Nigeria' : 'Nigeria';
    const locationShort = region === 'lagos' ? 'Lagos' : 'Nigeria';

    const systemPrompt = [
      'You write SEO landing pages for BuildMyHouse, a Nigerian property project platform.',
      'Tone: clear, trustworthy, conversion-focused. Emphasize verified workers, scoped work, stage tracking, photo evidence, and payment after approval.',
      'Never invent fake company stats or guarantees. Use directional stats like "04 tracked stages".',
      'Write for homeowners in Nigeria and diaspora clients managing work remotely.',
      'Return strict JSON only matching the schema.',
    ].join(' ');

    const userPrompt = JSON.stringify(
      {
        instructions: [
          `Write a full service page for: "${serviceName}".`,
          `Region focus: ${locationLabel}.`,
          'headline should be a short hero word/phrase (1-3 words), e.g. "Plumbing" or "AC Repair".',
          'metaTitle format: "{Service} in {Lagos|Nigeria} | Verified & Tracked | BuildMyHouse"',
          'summary: 1-2 sentences, under 160 characters, for Google meta description.',
          'slug: kebab-case URL slug without region prefix (e.g. "ac-repair", "plumbing-repair").',
          'templateKind: closest match from known kinds, or the slug if none fit.',
          'Known template kinds: plumbing-repair, electrical-repair, roof-leak-repair, drainage-repair, painting-services, property-maintenance, window-repair, pumping-machine-repair, fan-repair, rechargeable-fan-repair, bathroom-repair, kitchen-renovation, home-renovation, general-contractors.',
          'locationLabel must be exactly the region location string provided.',
          'Include exactly 4 pillars, 4 stats, 4 processSteps, 3 fieldNotes, 2 reviews, 3 faqs, 2 engageCards, 2 articleLinks, 4 trustWords.',
          'engageCards[0] should be Tracked Repair style; engageCards[1] Verified Project style.',
          'articleLinks hrefs must be real BuildMyHouse paths starting with /.',
          'primaryCtaLabel / secondaryCtaLabel: short button labels.',
          'Keep Nigerian English spelling where natural (e.g. labour).',
        ],
        region,
        locationLabel,
        locationShort,
        serviceName,
        preferredSlug: params.slug || null,
        preferredTemplateKind: params.templateKind || null,
        exampleStyle: {
          metaTitle: `Plumbing in ${locationShort} | Verified & Tracked | BuildMyHouse`,
          summary: `Find verified plumbing support in ${locationLabel} with clearer scope, stage tracking, and evidence before payment.`,
          heroLead: `Plumbing repairs in ${locationLabel} with verified workers, staged updates, and evidence before you approve payment.`,
          heroMeta: 'Scoped plumbing work with photo checkpoints — not open-ended handyman referrals.',
        },
      },
      null,
      2,
    );

    const stringArray = { type: 'array' as const, items: { type: 'string' as const } };
    const titleBody = {
      type: 'object' as const,
      additionalProperties: false,
      properties: {
        title: { type: 'string' as const },
        body: { type: 'string' as const },
      },
      required: ['title', 'body'],
    };

    try {
      const completion = await this.openai.chat.completions.create({
        model: process.env.SERVICE_PAGE_AI_MODEL?.trim() || this.model || 'gpt-4o',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.4,
        max_tokens: 4500,
        response_format: {
          type: 'json_schema',
          json_schema: {
            name: 'service_page_copy',
            strict: true,
            schema: {
              type: 'object',
              additionalProperties: false,
              properties: {
                metaTitle: { type: 'string' },
                summary: { type: 'string' },
                slug: { type: 'string' },
                templateKind: { type: 'string' },
                headline: { type: 'string' },
                locationLabel: { type: 'string' },
                heroLead: { type: 'string' },
                heroMeta: { type: 'string' },
                trustWords: { ...stringArray, minItems: 4, maxItems: 4 },
                pillarsHeadline: { type: 'string' },
                archiveTitle: { type: 'string' },
                fieldNotesHeading: { type: 'string' },
                workTitle: { type: 'string' },
                workBody: { type: 'string' },
                engageIntro: { type: 'string' },
                contactPrompt: { type: 'string' },
                pillars: { type: 'array', items: titleBody, minItems: 4, maxItems: 4 },
                stats: {
                  type: 'array',
                  minItems: 4,
                  maxItems: 4,
                  items: {
                    type: 'object',
                    additionalProperties: false,
                    properties: {
                      value: { type: 'string' },
                      label: { type: 'string' },
                    },
                    required: ['value', 'label'],
                  },
                },
                processSteps: {
                  type: 'array',
                  minItems: 4,
                  maxItems: 4,
                  items: {
                    type: 'object',
                    additionalProperties: false,
                    properties: {
                      label: { type: 'string' },
                      title: { type: 'string' },
                      body: { type: 'string' },
                    },
                    required: ['label', 'title', 'body'],
                  },
                },
                fieldNotes: {
                  type: 'array',
                  minItems: 3,
                  maxItems: 3,
                  items: {
                    type: 'object',
                    additionalProperties: false,
                    properties: {
                      number: { type: 'string' },
                      title: { type: 'string' },
                      body: { type: 'string' },
                    },
                    required: ['number', 'title', 'body'],
                  },
                },
                reviews: {
                  type: 'array',
                  minItems: 2,
                  maxItems: 2,
                  items: {
                    type: 'object',
                    additionalProperties: false,
                    properties: {
                      quote: { type: 'string' },
                      name: { type: 'string' },
                      detail: { type: 'string' },
                    },
                    required: ['quote', 'name', 'detail'],
                  },
                },
                faqs: {
                  type: 'array',
                  minItems: 3,
                  maxItems: 3,
                  items: {
                    type: 'object',
                    additionalProperties: false,
                    properties: {
                      question: { type: 'string' },
                      answer: { type: 'string' },
                    },
                    required: ['question', 'answer'],
                  },
                },
                engageCards: {
                  type: 'array',
                  minItems: 2,
                  maxItems: 2,
                  items: {
                    type: 'object',
                    additionalProperties: false,
                    properties: {
                      title: { type: 'string' },
                      subtitle: { type: 'string' },
                      badge: { type: 'string' },
                      features: { ...stringArray, minItems: 3, maxItems: 5 },
                    },
                    required: ['title', 'subtitle', 'badge', 'features'],
                  },
                },
                articleLinks: {
                  type: 'array',
                  minItems: 2,
                  maxItems: 2,
                  items: {
                    type: 'object',
                    additionalProperties: false,
                    properties: {
                      label: { type: 'string' },
                      href: { type: 'string' },
                    },
                    required: ['label', 'href'],
                  },
                },
                primaryCtaLabel: { type: 'string' },
                secondaryCtaLabel: { type: 'string' },
              },
              required: [
                'metaTitle',
                'summary',
                'slug',
                'templateKind',
                'headline',
                'locationLabel',
                'heroLead',
                'heroMeta',
                'trustWords',
                'pillarsHeadline',
                'archiveTitle',
                'fieldNotesHeading',
                'workTitle',
                'workBody',
                'engageIntro',
                'contactPrompt',
                'pillars',
                'stats',
                'processSteps',
                'fieldNotes',
                'reviews',
                'faqs',
                'engageCards',
                'articleLinks',
                'primaryCtaLabel',
                'secondaryCtaLabel',
              ],
            },
          },
        },
      });

      const raw = completion.choices?.[0]?.message?.content || '{}';
      const parsed = this.safeJsonParse(raw);
      if (!parsed?.headline || !parsed?.metaTitle) {
        this.logger.warn('Service page AI returned incomplete JSON');
        return null;
      }

      const slug =
        this.asTrimmedString(params.slug) ||
        this.asTrimmedString(parsed.slug).toLowerCase().replace(/[^a-z0-9-]/g, '-') ||
        serviceName
          .toLowerCase()
          .replace(/[^a-z0-9\s-]/g, '')
          .replace(/\s+/g, '-')
          .replace(/-+/g, '-')
          .replace(/^-|-$/g, '');

      const templateKind =
        this.asTrimmedString(params.templateKind) ||
        this.asTrimmedString(parsed.templateKind) ||
        slug;

      const engageCards = Array.isArray(parsed.engageCards)
        ? parsed.engageCards.map((card: any, index: number) => ({
            title: this.asTrimmedString(card?.title) || (index === 0 ? 'Tracked Repair' : 'Verified Project'),
            subtitle: this.asTrimmedString(card?.subtitle),
            badge: this.asTrimmedString(card?.badge) || (index === 0 ? 'Most popular' : ''),
            features: this.asStringArray(card?.features, [
              'Guided intake with photos',
              'Verified worker matching',
              'Stage updates before payment',
            ]),
          }))
        : [];

      return {
        metaTitle: this.asTrimmedString(parsed.metaTitle),
        summary: this.asTrimmedString(parsed.summary),
        slug,
        templateKind,
        payload: {
          locationLabel: locationLabel,
          headline: this.asTrimmedString(parsed.headline) || serviceName,
          heroLead: this.asTrimmedString(parsed.heroLead),
          heroMeta: this.asTrimmedString(parsed.heroMeta),
          trustWords: this.asStringArray(parsed.trustWords, ['verify', 'scope', 'track', 'approve']).slice(0, 4),
          pillarsHeadline: this.asTrimmedString(parsed.pillarsHeadline),
          archiveTitle: this.asTrimmedString(parsed.archiveTitle),
          fieldNotesHeading: this.asTrimmedString(parsed.fieldNotesHeading),
          workTitle: this.asTrimmedString(parsed.workTitle) || '04 tracked stages',
          workBody: this.asTrimmedString(parsed.workBody),
          engageIntro: this.asTrimmedString(parsed.engageIntro),
          contactPrompt: this.asTrimmedString(parsed.contactPrompt),
          pillars: Array.isArray(parsed.pillars)
            ? parsed.pillars.map((p: any) => ({
                title: this.asTrimmedString(p?.title),
                body: this.asTrimmedString(p?.body),
              }))
            : [],
          stats: Array.isArray(parsed.stats)
            ? parsed.stats.map((s: any) => ({
                value: this.asTrimmedString(s?.value),
                label: this.asTrimmedString(s?.label),
              }))
            : [],
          processSteps: Array.isArray(parsed.processSteps)
            ? parsed.processSteps.map((s: any) => ({
                label: this.asTrimmedString(s?.label),
                title: this.asTrimmedString(s?.title),
                body: this.asTrimmedString(s?.body),
              }))
            : [],
          fieldNotes: Array.isArray(parsed.fieldNotes)
            ? parsed.fieldNotes.map((n: any) => ({
                number: this.asTrimmedString(n?.number),
                title: this.asTrimmedString(n?.title),
                body: this.asTrimmedString(n?.body),
              }))
            : [],
          reviews: Array.isArray(parsed.reviews)
            ? parsed.reviews.map((r: any) => ({
                quote: this.asTrimmedString(r?.quote),
                name: this.asTrimmedString(r?.name),
                detail: this.asTrimmedString(r?.detail),
              }))
            : [],
          faqs: Array.isArray(parsed.faqs)
            ? parsed.faqs.map((f: any) => ({
                question: this.asTrimmedString(f?.question),
                answer: this.asTrimmedString(f?.answer),
              }))
            : [],
          engageCards,
          articleLinks: Array.isArray(parsed.articleLinks)
            ? parsed.articleLinks.map((l: any) => ({
                label: this.asTrimmedString(l?.label),
                href: this.asTrimmedString(l?.href).startsWith('/')
                  ? this.asTrimmedString(l?.href)
                  : '/articles',
              }))
            : [
                {
                  label: 'Renovation checklist for homeowners',
                  href: '/articles/renovation-checklist-for-homeowners-nigeria',
                },
                {
                  label: 'How to choose a contractor in Nigeria',
                  href: '/how-to-choose-a-general-contractor-in-nigeria',
                },
              ],
          primaryCtaLabel: this.asTrimmedString(parsed.primaryCtaLabel) || 'Start a Tracked Repair',
          secondaryCtaLabel: this.asTrimmedString(parsed.secondaryCtaLabel) || 'Browse Verified Plans',
        },
      };
    } catch (error) {
      this.logger.error(
        `Service page AI generation failed: ${error instanceof Error ? error.message : String(error)}`,
      );
      return null;
    }
  }

  async rerankContractorMatches(params: {
    project: RerankProjectInput;
    candidates: RerankContractorInput[];
    limit: number;
    model?: string;
  }): Promise<RerankContractorMatchesResult | null> {
    if (!this.hasApiKey) {
      return null;
    }

    const candidates = (params.candidates || []).filter((candidate) => !!candidate?.id);
    const limit = Math.max(1, Math.min(Number(params.limit || 3), candidates.length));
    if (candidates.length === 0 || limit <= 0) {
      return null;
    }

    const compactProject = {
      id: params.project.id,
      name: params.project.name || '',
      city: params.project.city || '',
      state: params.project.state || '',
      address: params.project.address || '',
      budget: Number(params.project.budget || 0),
      projectType: params.project.projectType || '',
      aiSummary: String(params.project.aiAnalysis?.summary || '').slice(0, 400),
      aiProjectTypeTag: String(params.project.aiAnalysis?.projectTypeTag || ''),
      aiProjectTypeFilter: String(params.project.aiAnalysis?.projectTypeFilter || ''),
      aiRooms: Array.isArray(params.project.aiAnalysis?.rooms)
        ? params.project.aiAnalysis.rooms.slice(0, 12)
        : [],
      aiMaterials: Array.isArray(params.project.aiAnalysis?.materials)
        ? params.project.aiAnalysis.materials.slice(0, 12)
        : [],
      aiFeatures: Array.isArray(params.project.aiAnalysis?.features)
        ? params.project.aiAnalysis.features.slice(0, 12)
        : [],
    };

    const compactCandidates = candidates.map((candidate) => ({
      id: candidate.id,
      name: candidate.name || '',
      specialty: candidate.specialty || '',
      specialtyCategory: candidate.specialtyCategory || '',
      specialtyTags: (candidate.specialtyTags || []).slice(0, 8),
      location: candidate.location || '',
      rating: Number(candidate.rating || 0),
      reviews: Number(candidate.reviews || 0),
      projects: Number(candidate.projects || 0),
      experienceYears: Number(candidate.experienceYears || 0),
      verified: !!candidate.verified,
      matchScore: Number(candidate.matchScore || 0),
      matchReasons: (candidate.matchReasons || []).slice(0, 4),
      responseRate: Number(candidate.requestStats?.responseRate || 0),
      acceptanceRate: Number(candidate.requestStats?.acceptanceRate || 0),
      avgResponseHours:
        candidate.requestStats?.avgResponseHours == null
          ? null
          : Number(candidate.requestStats.avgResponseHours),
      openDisputes: Number(candidate.disputeStats?.open || 0),
      inReviewDisputes: Number(candidate.disputeStats?.inReview || 0),
      resolvedDisputes: Number(candidate.disputeStats?.resolved || 0),
    }));

    try {
      const completion = await this.openai.chat.completions.create({
        model: params.model || process.env.GC_MATCHING_AI_MODEL?.trim() || 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: [
              'You rank verified contractors for a Nigerian property project.',
              'Prioritize relevance to project scope, location practicality, reliability, and realistic execution confidence.',
              'Never invent contractor IDs. Choose only from provided candidates.',
              'Return strict JSON only.',
            ].join(' '),
          },
          {
            role: 'user',
            content: JSON.stringify(
              {
                instructions: [
                  'Rank the best contractors for this project.',
                  `Return exactly top ${limit} IDs in order.`,
                  'For each selected contractor, include up to 2 short reasons.',
                ],
                project: compactProject,
                candidates: compactCandidates,
              },
              null,
              2,
            ),
          },
        ],
        temperature: 0.2,
        max_tokens: 900,
        response_format: {
          type: 'json_schema',
          json_schema: {
            name: 'contractor_rerank',
            strict: true,
            schema: {
              type: 'object',
              additionalProperties: false,
              properties: {
                orderedContractorIds: {
                  type: 'array',
                  items: { type: 'string' },
                  minItems: 1,
                },
                reasonsById: {
                  type: 'object',
                  additionalProperties: {
                    type: 'array',
                    items: { type: 'string' },
                  },
                },
              },
              required: ['orderedContractorIds', 'reasonsById'],
            },
          },
        },
      });

      const raw = completion.choices?.[0]?.message?.content || '{}';
      const parsed = this.safeJsonParse(raw);
      const allowedIds = new Set(compactCandidates.map((candidate) => candidate.id));
      const orderedIds = Array.isArray(parsed?.orderedContractorIds)
        ? parsed.orderedContractorIds
            .map((id: any) => String(id || '').trim())
            .filter((id: string) => !!id && allowedIds.has(id))
        : [];
      if (orderedIds.length === 0) {
        return null;
      }

      const uniqueOrderedIds = Array.from(new Set(orderedIds)).slice(0, limit);
      const reasonsRaw =
        parsed?.reasonsById && typeof parsed.reasonsById === 'object' ? parsed.reasonsById : {};
      const reasonsById: Record<string, string[]> = {};

      for (const id of uniqueOrderedIds) {
        const reasons = Array.isArray(reasonsRaw[id])
          ? reasonsRaw[id]
              .map((reason: any) => this.asTrimmedString(reason))
              .filter(Boolean)
              .slice(0, 2)
          : [];
        reasonsById[id] = reasons;
      }

      return {
        orderedContractorIds: uniqueOrderedIds,
        reasonsById,
      };
    } catch (error) {
      this.logger.warn(
        `AI rerank failed, falling back to deterministic ranking: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
      return null;
    }
  }

  async analyzePlan(input: AnalyzePlanInput): Promise<PlanAnalysis> {
    try {
      if (!this.hasApiKey) {
        return this.getHeuristicAnalysis(input);
      }

      const imageUrls = (input.imageUrls || []).filter(Boolean).slice(0, 5);
      const pdfSnippet = `${input.pdfText || ''}`.trim().slice(0, 20000);

      const userPrompt = [
        'Analyze this BuildMyHouse project submission and return a complete construction summary JSON.',
        '',
        `Project name: ${input.projectName}`,
        `User budget (NGN): ${input.userBudget}`,
        `Project type tag: ${input.projectTypeTag || 'unspecified'}`,
        `Project sub-filter: ${input.projectTypeFilter || 'unspecified'}`,
        `Address: ${input.address || 'unspecified'}`,
        `Project description: ${input.projectDescription || 'unspecified'}`,
        `Success criteria: ${input.successCriteria || 'unspecified'}`,
        `PDF included: ${input.hasPdf ? 'yes' : 'no'}`,
        '',
        'PDF extracted text (may be partial):',
        pdfSnippet || 'No PDF text provided.',
      ].join('\n');

      const userContent: Array<
        | { type: 'text'; text: string }
        | { type: 'image_url'; image_url: { url: string; detail?: 'auto' | 'low' | 'high' } }
      > = [{ type: 'text', text: userPrompt }];

      for (const url of imageUrls) {
        userContent.push({
          type: 'image_url',
          image_url: { url, detail: 'auto' },
        });
      }

      const completion = await this.openai.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: 'system',
            content: [
              'You are an expert construction estimator and project scope analyst for the Nigerian market.',
              'Use the homeowner form details, uploaded pictures, and PDF text to infer realistic scope, costs, and phases.',
              'If information is missing, infer conservatively and explain uncertainty in notes.',
              'Return strict JSON only that matches the required schema.',
            ].join(' '),
          },
          {
            role: 'user',
            content: userContent,
          },
        ],
        temperature: 0.3,
        max_tokens: 2200,
        response_format: {
          type: 'json_schema',
          json_schema: {
            name: 'buildmyhouse_plan_analysis',
            strict: true,
            schema: {
              type: 'object',
              additionalProperties: false,
              properties: {
                projectType: { type: 'string' },
                estimatedBudget: { type: 'number' },
                estimatedDuration: { type: 'string' },
                squareFootage: { type: 'number' },
                floors: { type: 'number' },
                bedrooms: { type: 'number' },
                bathrooms: { type: 'number' },
                rooms: { type: 'array', items: { type: 'string' } },
                materials: { type: 'array', items: { type: 'string' } },
                features: { type: 'array', items: { type: 'string' } },
                phases: {
                  type: 'array',
                  items: {
                    type: 'object',
                    additionalProperties: false,
                    properties: {
                      name: { type: 'string' },
                      description: { type: 'string' },
                      estimatedDuration: { type: 'string' },
                      estimatedCost: { type: 'number' },
                    },
                    required: ['name', 'description', 'estimatedDuration', 'estimatedCost'],
                  },
                },
                confidence: { type: 'number' },
                notes: { type: 'string' },
              },
              required: [
                'projectType',
                'estimatedBudget',
                'estimatedDuration',
                'squareFootage',
                'floors',
                'bedrooms',
                'bathrooms',
                'rooms',
                'materials',
                'features',
                'phases',
                'confidence',
                'notes',
              ],
            },
          },
        },
      });

      const responseText = completion.choices?.[0]?.message?.content || '{}';
      return this.normalizeAnalysis(responseText, input);
    } catch (error) {
      this.logger.error(
        `OpenAI analysis error: ${error instanceof Error ? error.message : String(error)}`,
      );
      return this.getHeuristicAnalysis(input);
    }
  }

  private normalizeAnalysis(responseText: string, input: AnalyzePlanInput): PlanAnalysis {
    const parsed = this.safeJsonParse(responseText);
    const fallback = this.getHeuristicAnalysis(input);

    const phases = Array.isArray(parsed?.phases)
      ? parsed.phases
          .map((phase: any, index: number) => ({
            name: this.asTrimmedString(phase?.name) || `Phase ${index + 1}`,
            description: this.asTrimmedString(phase?.description) || 'Detailed task execution',
            estimatedDuration: this.asTrimmedString(phase?.estimatedDuration) || '2-4 weeks',
            estimatedCost: this.asPositiveNumber(phase?.estimatedCost, 0),
          }))
          .filter((phase: { estimatedCost: number }) => phase.estimatedCost > 0)
      : [];
    const normalizedPhases = this.ensureMinimumPhases(phases, fallback.phases);

    return {
      projectType:
        this.asTrimmedString(parsed?.projectType) ||
        this.asTrimmedString(input.projectTypeTag) ||
        fallback.projectType,
      estimatedBudget: this.asPositiveNumber(parsed?.estimatedBudget, fallback.estimatedBudget),
      estimatedDuration:
        this.asTrimmedString(parsed?.estimatedDuration) || fallback.estimatedDuration,
      squareFootage: this.asPositiveNumber(parsed?.squareFootage, fallback.squareFootage),
      floors: this.asPositiveNumber(parsed?.floors, fallback.floors),
      bedrooms: this.asPositiveNumber(parsed?.bedrooms, fallback.bedrooms),
      bathrooms: this.asPositiveNumber(parsed?.bathrooms, fallback.bathrooms),
      rooms: this.asStringArray(parsed?.rooms, fallback.rooms),
      materials: this.asStringArray(parsed?.materials, fallback.materials),
      features: this.asStringArray(parsed?.features, fallback.features),
      phases: normalizedPhases,
      confidence: this.asPositiveNumber(parsed?.confidence, fallback.confidence),
      notes: this.asTrimmedString(parsed?.notes) || fallback.notes,
      processingDate: new Date().toISOString(),
    };
  }

  private safeJsonParse(input: string): Record<string, any> | null {
    try {
      const cleaned = String(input || '')
        .replace(/^```json/i, '')
        .replace(/^```/i, '')
        .replace(/```$/i, '')
        .trim();
      return cleaned ? JSON.parse(cleaned) : null;
    } catch {
      return null;
    }
  }

  private asTrimmedString(value: unknown): string {
    return typeof value === 'string' ? value.trim() : '';
  }

  private asPositiveNumber(value: unknown, fallback: number): number {
    const numeric = Number(value);
    if (Number.isFinite(numeric) && numeric >= 0) return numeric;
    return fallback;
  }

  private asStringArray(value: unknown, fallback: string[]): string[] {
    if (!Array.isArray(value)) return fallback;
    const sanitized = value
      .map((item) => this.asTrimmedString(item))
      .filter(Boolean)
      .slice(0, 20);
    return sanitized.length ? sanitized : fallback;
  }

  private ensureMinimumPhases(
    phases: Array<{ name: string; description: string; estimatedDuration: string; estimatedCost: number }>,
    fallbackPhases: Array<{ name: string; description: string; estimatedDuration: string; estimatedCost: number }>,
  ) {
    const normalized = [...(phases || [])];
    if (normalized.length >= 3) return normalized;

    const existingNames = new Set(
      normalized.map((phase) => `${phase?.name || ''}`.trim().toLowerCase()).filter(Boolean),
    );
    for (const fallbackPhase of fallbackPhases || []) {
      if (normalized.length >= 3) break;
      const normalizedName = `${fallbackPhase?.name || ''}`.trim().toLowerCase();
      if (normalizedName && existingNames.has(normalizedName)) continue;
      normalized.push(fallbackPhase);
      if (normalizedName) existingNames.add(normalizedName);
    }

    while (normalized.length < 3) {
      normalized.push({
        name: `Execution Milestone ${normalized.length + 1}`,
        description: 'Additional milestone to keep scope tracking practical and reviewable.',
        estimatedDuration: '3-7 days',
        estimatedCost: 50000,
      });
    }

    return normalized;
  }

  private getHeuristicAnalysis(input: AnalyzePlanInput): PlanAnalysis {
    const projectType = this.normalizeProjectType(input.projectTypeTag);
    const baselineBudget = Math.max(100000, Math.round(input.userBudget || 0));
    const adjustedBudget = Math.round(baselineBudget * (projectType === 'repair' ? 1.0 : 1.15));

    const fallbackPhases =
      projectType === 'repair'
        ? [
            {
              name: 'Inspection & Diagnosis',
              description: 'Inspect affected areas, identify root cause, and define repair method',
              estimatedDuration: '2-4 days',
              estimatedCost: Math.round(adjustedBudget * 0.15),
            },
            {
              name: 'Targeted Repair Work',
              description: 'Execute core repair tasks and replace failed components',
              estimatedDuration: '1-2 weeks',
              estimatedCost: Math.round(adjustedBudget * 0.55),
            },
            {
              name: 'Testing & Final Touches',
              description: 'Test performance, close up finishes, and confirm issue resolution',
              estimatedDuration: '3-5 days',
              estimatedCost: Math.round(adjustedBudget * 0.3),
            },
          ]
        : [
            {
              name: 'Planning & Mobilization',
              description: 'Finalize scope, material schedule, and execution sequencing',
              estimatedDuration: '1-2 weeks',
              estimatedCost: Math.round(adjustedBudget * 0.15),
            },
            {
              name: 'Core Construction Work',
              description: 'Execute major structural/interior scope according to approved plan',
              estimatedDuration: '4-12 weeks',
              estimatedCost: Math.round(adjustedBudget * 0.6),
            },
            {
              name: 'Finishing & Handover',
              description: 'Complete final finishes, quality checks, and client handover',
              estimatedDuration: '2-4 weeks',
              estimatedCost: Math.round(adjustedBudget * 0.25),
            },
          ];

    return {
      projectType,
      estimatedBudget: adjustedBudget,
      estimatedDuration: projectType === 'repair' ? '2-4 weeks' : '2-6 months',
      squareFootage: projectType === 'repair' ? 450 : 1800,
      floors: projectType === 'repair' ? 1 : 2,
      bedrooms: projectType === 'repair' ? 0 : 3,
      bathrooms: projectType === 'repair' ? 0 : 2,
      rooms: ['Living Room', 'Kitchen', 'Bedroom', 'Bathroom'],
      materials: ['Cement', 'Electrical fittings', 'Plumbing fittings', 'Paint'],
      features: [
        input.projectTypeFilter || 'Custom project focus',
        input.successCriteria || 'Outcome-driven execution',
      ].filter(Boolean),
      phases: fallbackPhases,
      confidence: this.hasApiKey ? 60 : 45,
      notes: input.projectDescription
        ? `Generated from homeowner brief: ${input.projectDescription.slice(0, 180)}`
        : 'Generated from submitted project details. Add API key for full multimodal analysis.',
      processingDate: new Date().toISOString(),
    };
  }

  private normalizeProjectType(projectTypeTag?: string): string {
    const normalized = `${projectTypeTag || ''}`.trim().toLowerCase();
    if (normalized === 'repair') return 'repair';
    if (normalized === 'upgrades') return 'upgrades';
    if (normalized === 'full_builds') return 'full_builds';
    if (normalized === 'renovation') return 'renovation';
    return 'renovation';
  }

  async extractTextFromPdf(pdfBuffer: Buffer): Promise<string> {
    try {
      // Lazy-load pdf parser to avoid hard startup failures in runtimes
      // where the package may rely on unsupported globals.
      const moduleRef: any = await import('pdf-parse');
      const parserFactory = moduleRef?.default || moduleRef;
      if (typeof parserFactory !== 'function') {
        this.logger.warn('PDF parser is unavailable in current runtime, skipping PDF text extraction');
        return '';
      }

      const result = await parserFactory(pdfBuffer);
      const text = `${result?.text || ''}`.replace(/\s+/g, ' ').trim();
      return text.slice(0, 25000);
    } catch (error) {
      this.logger.warn(
        `PDF extraction unavailable, continuing without PDF text: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
      return '';
    }
  }
}



