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



