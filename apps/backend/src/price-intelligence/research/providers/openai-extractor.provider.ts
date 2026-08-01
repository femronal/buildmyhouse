/**
 * Stage 4 STEP 5 — OpenAIPriceObservationExtractor (GPT-5.6 Sol).
 *
 * Extracts structured observations from ONE already-retrieved page. The model
 * receives ONLY the retrieved evidence (readable text + structured data) and
 * the matrix summary. It runs with NO tools, so it cannot fetch or invent
 * pages: it may only report what the supplied evidence supports. The founder's
 * "must not infer" rules are in the prompt AND re-checked deterministically by
 * extraction-schema.validateExtractedObservation.
 */
import OpenAI from 'openai';
import {
  ObservationExtractor,
  ExtractionContext,
  ExtractionProviderResult,
  RetrievedPage,
} from './types';
import { ResearchConfig } from '../research.config';
import { EXTRACTION_SCHEMA_VERSION } from '../extraction-schema';
import { normalizeUsage, parseJsonFromText } from './openai-client';

export class OpenAIPriceObservationExtractor implements ObservationExtractor {
  readonly name = 'openai_gpt56_extractor';
  constructor(
    private readonly client: OpenAI,
    private readonly config: ResearchConfig,
  ) {}

  private buildPrompt(page: RetrievedPage, context: ExtractionContext): string {
    const structured = JSON.stringify(page.structured).slice(0, 8000);
    const text = page.readableText.slice(0, 12000);
    return [
      'You extract ONE Nigerian marketplace/product page into structured price observations.',
      'You are given the ACTUAL retrieved page evidence. Use ONLY this evidence.',
      '',
      `Retrieved URL: ${page.finalUrl}`,
      `Date checked (authoritative): ${page.fetchedAt}`,
      `Product being researched: ${context.matrixSummary.canonicalProductName}`,
      `Matched family: ${context.matrixSummary.matchedFamilyId ?? 'custom/unknown'}`,
      `Required price-changing attributes: ${context.matrixSummary.requiredAttributes.join(', ') || '(none listed)'}`,
      `Preferred comparison unit: ${context.matrixSummary.preferredComparisonUnit ?? 'unknown'}`,
      `This is a ${context.matrixSummary.isService ? 'SERVICE/labour' : 'physical product'} request.`,
      '',
      'STRUCTURED DATA (JSON-LD / OpenGraph / microdata):',
      structured,
      '',
      'READABLE PAGE TEXT:',
      text,
      '',
      'Return STRICT JSON ONLY: an array of observation objects. Usually one object.',
      `Each object MUST include "schemaVersion": ${EXTRACTION_SCHEMA_VERSION}, "sourceUrl": "${page.finalUrl}",`,
      `"dateChecked": "${page.fetchedAt}", and these fields:`,
      'sourceDomain(string), pageTitle(string|null), sellerName(string|null), sellerType(one of manufacturer|authorised_distributor|retailer|marketplace_seller|contractor|unknown),',
      'sellerLocation(string|null), rawProductTitle(string), rawDescription(string|null),',
      'canonicalProductMatch(string|null — the product name it matches, as PLAIN STRING), productFamilyMatch(string|null — family key as PLAIN STRING),',
      'brand(string|null), model(string|null),',
      'extractedAttributes(object of string values), missingAttributes(string[]), originalPrice(number|null), currency(string|null),',
      'originalQuantity(number|null), originalUnit(string|null, e.g. "bag_50kg"), minimumOrderQuantity(number|null),',
      'priceKind(full_purchase_price|installment|deposit|contact_for_price|unknown),',
      'retailOrWholesale(retail|wholesale|unknown), condition(new|used|refurbished|rental|unknown), availabilityStatement,',
      'negotiable(yes|no|unknown), deliveryState, installationState, vatState, accessoriesState (each included|excluded|unknown|not_applicable),',
      'warrantyInfo, listingDate, sourceUpdateDate, productOnlyOrBundle(product_only|bundle|unknown), bundleContents(string[]),',
      'accessoryOnly(boolean), rental(boolean), depositPrice(boolean), mismatchFlags(string[]), extractionConfidence(0..1),',
      'supportingTextSpans(string[] — VERBATIM quotes from the evidence above that contain the price/spec), unresolvedQuestions(string[]).',
      '',
      'HARD RULES (violating any = wrong):',
      '- Do NOT infer a price that is not visibly shown. If none, originalPrice=null and priceKind reflects why.',
      '- Do NOT turn "contact for price" into a number.',
      '- Do NOT infer delivery/installation/VAT/accessories from silence — use "unknown".',
      '- Do NOT infer availability just because the page exists.',
      '- A monthly instalment is priceKind="installment"; a deposit is priceKind="deposit" with depositPrice=true — never a full price.',
      '- Do NOT treat used as new; do NOT treat an accessory as the full product; do NOT invent missing specs.',
      '- Every numeric price MUST be quoted verbatim in supportingTextSpans exactly as it appears on the page.',
      '- Return null/unknown wherever the evidence is silent.',
      ...(context.feedback && context.feedback.length
        ? [
            '',
            'YOUR PREVIOUS ATTEMPT WAS REJECTED by the deterministic validator for these reasons — fix them exactly:',
            ...context.feedback.map((f) => `- ${f}`),
          ]
        : []),
    ].join('\n');
  }

  async extract(
    page: RetrievedPage,
    context: ExtractionContext,
    signal?: AbortSignal,
  ): Promise<ExtractionProviderResult> {
    // Nothing to extract from a page we could not read.
    if (page.readableText.length === 0 && page.structured.jsonLd.length === 0 && Object.keys(page.structured.openGraph).length === 0) {
      return {
        provider: this.name,
        model: this.config.extractionModel,
        responseId: null,
        rawObservations: [],
        usage: null,
        error: 'no usable page content',
      };
    }

    let response: any;
    try {
      response = await (this.client as any).responses.create(
        {
          model: this.config.extractionModel,
          input: this.buildPrompt(page, context),
          max_output_tokens: 6000,
        },
        signal ? { signal } : undefined,
      );
    } catch (err) {
      return {
        provider: this.name,
        model: this.config.extractionModel,
        responseId: null,
        rawObservations: [],
        usage: null,
        error: err instanceof Error ? err.message : String(err),
      };
    }

    const parsed = parseJsonFromText(response.output_text ?? '');
    const rawObservations = Array.isArray(parsed) ? parsed : parsed ? [parsed] : [];
    return {
      provider: this.name,
      model: this.config.extractionModel,
      responseId: response.id ?? null,
      rawObservations,
      usage: normalizeUsage(this.config.extractionModel, response.usage),
    };
  }
}
