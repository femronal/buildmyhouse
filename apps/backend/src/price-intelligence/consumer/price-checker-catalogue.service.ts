/**
 * Stage 6 — consumer catalogue surface over the Stage 2 taxonomy.
 *
 * Pure adapters: product search, product-specific clarifying questions and the
 * location picker all come from the deterministic Stage 2 data. No AI decides
 * which questions are asked.
 */
import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import {
  matchQueryToFamilies,
  normalizeQuery,
  getFamilyByKey,
  getServiceByKey,
  selectVisibleQuestions,
  missingRequiredQuestions,
  findContradictions,
  LOCATIONS,
  getLocation,
  ClarifyingQuestion,
  ProductFamily,
  ServiceFamily,
  Answers,
  UNKNOWN_ANSWER,
  resolveUnknownOutcome,
} from '../taxonomy';
import { PlanTarget } from '../research/planner';
import {
  CatalogueSearchResult,
  ConsumerQuestion,
  QuestionsPreview,
  ConsumerLocation,
} from './price-checker.types';
import { PrismaService } from '../../prisma/prisma.service';

const CATEGORY_LABELS: Record<string, string> = {
  structural: 'Structural materials',
  envelope: 'Roofing, doors & windows',
  finishes: 'Finishes',
  mep: 'Electrical & plumbing',
  energy: 'Power & energy',
  security: 'Security',
};

function toConsumerQuestion(q: ClarifyingQuestion): ConsumerQuestion {
  return {
    id: q.id,
    prompt: q.prompt,
    type: q.type as ConsumerQuestion['type'],
    required: q.requirement !== 'optional',
    options: q.options ? [...q.options] : [],
    whyItMatters: q.whyItMatters ?? null,
    allowUnknown: q.allowUnknown,
  };
}

function unknownNotesFor(questions: ClarifyingQuestion[], answers: Answers): string[] {
  const notes: string[] = [];
  const unknownCount = Object.values(answers).filter((v) => v === UNKNOWN_ANSWER).length;
  for (const q of questions) {
    if (answers[q.id] !== UNKNOWN_ANSWER) continue;
    const outcome = resolveUnknownOutcome(q, { hasPhoto: false, hasQuotation: false, unknownCount });
    if (outcome === 'insufficient_specification') {
      notes.push(
        `We need “${q.prompt.replace(/\?$/, '')}” before comparing prices — different options are genuinely different products.`,
      );
    } else if (outcome === 'broadened_low_confidence_research') {
      notes.push(
        `You can continue without answering “${q.prompt.replace(/\?$/, '')}”. We will compare compatible options, but the final price range may be wider.`,
      );
    } else {
      notes.push(
        `“${q.prompt.replace(/\?$/, '')}” is marked as not sure yet. This may widen the price range or lower confidence.`,
      );
    }
  }
  return notes;
}

/**
 * Service families have no declared question list; questions are derived
 * deterministically from the service definition (scope factors + quantity).
 */
function serviceQuestions(service: ServiceFamily): ClarifyingQuestion[] {
  const scoped: ClarifyingQuestion[] = service.scopeFactors.map((factor, i) => ({
    id: `scope_${i}`,
    prompt: `What is the ${factor}?`,
    type: 'free_text',
    requirement: 'always',
    whyItMatters: 'Labour rates change with the scope of work, so scope must match before prices are compared.',
    allowUnknown: true,
  }));
  scoped.push({
    id: 'quantity',
    prompt: `How much work do you need priced (${service.pricingUnits.join(' or ')})?`,
    type: 'quantity_unit',
    requirement: 'always',
    whyItMatters: 'Rates are usually quoted per unit of work.',
    allowUnknown: true,
  });
  return scoped;
}

@Injectable()
export class PriceCheckerCatalogueService {
  constructor(private readonly prisma: PrismaService) {}

  async search(rawQuery: string): Promise<CatalogueSearchResult[]> {
    const query = (rawQuery ?? '').trim();
    if (!query) return [];
    if (query.length > 200) throw new BadRequestException('Search query too long');

    const fromTaxonomy = matchQueryToFamilies(query).map((match) => {
      const names =
        match.kind === 'product'
          ? (getFamilyByKey(match.key)?.marketNames ?? [])
          : (getServiceByKey(match.key)?.marketNames ?? []);
      const category =
        match.kind === 'product'
          ? (CATEGORY_LABELS[getFamilyByKey(match.key)?.parentCategory ?? ''] ?? 'Building materials')
          : 'Labour & services';
      return {
        kind: match.kind,
        key: match.key,
        name: match.name,
        category,
        matchConfidence: match.confidence,
        matchedAlias: match.matchedAlias,
        marketNames: names.slice(0, 4),
      } satisfies CatalogueSearchResult;
    });

    // Stage 8 — overlay admin-written DB aliases without rewriting taxonomy matching
    const normalized = normalizeQuery(query);
    const dbAliases = normalized
      ? await this.prisma.priceAlias.findMany({
          where: {
            deletedAt: null,
            OR: [
              { normalizedAlias: normalized },
              { normalizedAlias: { contains: normalized } },
            ],
          },
          include: { family: { select: { key: true, name: true, definition: true } } },
          take: 10,
        })
      : [];

    const seen = new Set(fromTaxonomy.map((r) => `${r.kind}:${r.key}`));
    const fromDb: CatalogueSearchResult[] = [];
    for (const alias of dbAliases) {
      const key = alias.family.key;
      const dedupe = `product:${key}`;
      if (seen.has(dedupe)) continue;
      const family = getFamilyByKey(key);
      const parentCategory =
        family?.parentCategory ??
        (typeof alias.family.definition === 'object' &&
        alias.family.definition &&
        'parentCategory' in (alias.family.definition as object)
          ? String((alias.family.definition as { parentCategory?: string }).parentCategory ?? '')
          : '');
      fromDb.push({
        kind: 'product',
        key,
        name: family?.name ?? alias.family.name,
        category: CATEGORY_LABELS[parentCategory] ?? 'Building materials',
        matchConfidence:
          alias.normalizedAlias === normalized ? 'exact_alias' : 'partial_alias',
        matchedAlias: alias.alias,
        marketNames: (family?.marketNames ?? []).slice(0, 4),
      });
      seen.add(dedupe);
    }

    return [...fromTaxonomy, ...fromDb].slice(0, 6);
  }

  questionsPreview(familyKey: string, kind: 'product' | 'service', answers: Answers): QuestionsPreview {
    if (kind === 'service') {
      const service = getServiceByKey(familyKey);
      if (!service) throw new NotFoundException(`Unknown service '${familyKey}'`);
      const questions = serviceQuestions(service);
      const missing = questions.filter((q) => {
        const v = answers[q.id];
        return v === undefined || v === '';
      });
      return {
        familyKey,
        familyName: service.name,
        kind,
        questions: questions.map(toConsumerQuestion),
        missingRequiredIds: missing.map((q) => q.id),
        contradictions: [],
        answeredCount: questions.length - missing.length,
        estimatedRemaining: missing.length,
        unknownNotes: unknownNotesFor(questions, answers),
      };
    }

    const family = this.requireFamily(familyKey);
    const visible = selectVisibleQuestions(family, answers);
    const missing = missingRequiredQuestions(family, answers);
    const answeredCount = visible.filter((q) => {
      const v = answers[q.id];
      return v !== undefined && v !== '';
    }).length;
    return {
      familyKey,
      familyName: family.name,
      kind,
      questions: visible.map(toConsumerQuestion),
      missingRequiredIds: missing.map((q) => q.id),
      contradictions: findContradictions(family, answers),
      answeredCount,
      estimatedRemaining: visible.length - answeredCount,
      unknownNotes: unknownNotesFor(visible, answers),
    };
  }

  locations(): ConsumerLocation[] {
    return LOCATIONS.filter((l) => l.type === 'state' || l.type === 'city' || l.type === 'local_area').map((l) => ({
      key: l.key,
      label: l.label,
      type: l.type,
      parentKey: l.parentKey ?? null,
    }));
  }

  requireFamily(familyKey: string): ProductFamily {
    const family = getFamilyByKey(familyKey);
    if (!family) throw new NotFoundException(`Unknown product family '${familyKey}'`);
    return family;
  }

  requireLocation(locationKey: string) {
    const location = getLocation(locationKey);
    if (!location) throw new BadRequestException(`Unknown location '${locationKey}'`);
    return location;
  }

  /**
   * Deterministic Stage 4 research target from the catalogue definition and
   * the user's structured answers. No AI builds this.
   */
  buildPlanTarget(input: {
    requestItemId: string;
    researchRunId: string;
    familyKey: string;
    kind: 'product' | 'service';
    answers: Answers;
    locationKey: string;
  }): PlanTarget & {
    requestedLocationCode: string;
    matchedFamilyId: string | null;
    preferredComparisonUnit: string | null;
    requiredAttributes: string[];
    researchRunId: string;
  } {
    const location = this.requireLocation(input.locationKey);
    const knownAnswers: Record<string, string> = {};
    for (const [key, value] of Object.entries(input.answers)) {
      if (value !== undefined && value !== '' && value !== UNKNOWN_ANSWER) knownAnswers[key] = value;
    }

    if (input.kind === 'service') {
      const service = getServiceByKey(input.familyKey);
      if (!service) throw new NotFoundException(`Unknown service '${input.familyKey}'`);
      return {
        requestItemId: input.requestItemId,
        researchRunId: input.researchRunId,
        canonicalProductName: service.name,
        aliases: [...service.marketNames],
        brand: null,
        model: null,
        specification: knownAnswers,
        locationLabel: location.label,
        requestedLocationCode: location.key,
        matchedFamilyId: service.key,
        preferredComparisonUnit: service.pricingUnits[0] ?? null,
        requiredAttributes: [],
        isService: true,
        currentYear: new Date().getFullYear(),
      };
    }

    const family = this.requireFamily(input.familyKey);
    const brand = knownAnswers['brand'] ?? null;
    const priceChangingKeys = family.attributes.filter((a) => a.priceChanging).map((a) => a.key);
    const requiredAttributes = priceChangingKeys.filter((k) => knownAnswers[k] !== undefined);
    const specParts = priceChangingKeys
      .map((k) => knownAnswers[k])
      .filter((v): v is string => Boolean(v));
    const canonicalProductName = [brand, family.name, ...specParts].filter(Boolean).join(' ');

    return {
      requestItemId: input.requestItemId,
      researchRunId: input.researchRunId,
      canonicalProductName: canonicalProductName || family.name,
      aliases: [...family.marketNames],
      brand,
      model: knownAnswers['model'] ?? null,
      specification: knownAnswers,
      locationLabel: location.label,
      requestedLocationCode: location.key,
      matchedFamilyId: family.key,
      preferredComparisonUnit: family.normalizedUnit,
      requiredAttributes,
      isService: false,
      currentYear: new Date().getFullYear(),
    };
  }
}
