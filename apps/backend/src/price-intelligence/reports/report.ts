/**
 * Stage 5 — consumer report generator.
 *
 * Builds the typed PriceCheckerReport from scored observations. Everything in
 * the report maps to stored data: sources, dates, prices, inclusion states,
 * reasons and cautions all come from the deterministic assessment — no free
 * AI-generated claims. Rendering to text is a separate pure function; no UI
 * code lives here.
 */
import {
  ScoringObservation,
  ConfidenceAssessment,
  assessConfidence,
  AssessmentContext,
  canonicalJson,
  sha256Hex,
  InclusionState,
} from './confidence';
import { ConfidencePolicy, ACTIVE_CONFIDENCE_POLICY } from './confidence-policy';

export const REPORT_GENERATOR_VERSION = 'price-report-v1';

export interface ReportRequest {
  reportId: string;
  productName: string;
  brand?: string | null;
  specification: Record<string, string | number | boolean>;
  requestedUnit: string | null;
  requestedLocationLabel: string;
  requestedCondition: 'new' | 'used' | 'any';
  /** Injectable timestamp so report generation is reproducible. */
  generatedAtIso: string;
}

export interface ReportSource {
  observationId: string;
  sellerName: string | null;
  sourceTier: number;
  displayedPrice: number;
  currency: string;
  normalizedPrice: number | null;
  originalUnit: string | null;
  normalizedUnit: string | null;
  sellerLocationClass: string;
  sourceUrl: string;
  listingDate: string | null;
  dateChecked: string;
}

export interface PriceCheckerReport {
  reportId: string;
  status: 'complete' | 'single_source' | 'insufficient_data';
  generatedAt: string;
  generatorVersion: string;
  product: {
    name: string;
    brand: string | null;
    specification: Record<string, string | number | boolean>;
    requestedUnit: string | null;
  };
  location: {
    requested: string;
    limitations: string[];
  };
  pricing: {
    currency: string | null;
    observedLow: number | null;
    observedHigh: number | null;
    typicalPrice: number | null;
    normalisedUnit: string | null;
    acceptedObservationCount: number;
    independentSourceCount: number;
    /** Only present for single-source results — never called a range. */
    singleSourcePrice: number | null;
  };
  inclusions: string[];
  exclusions: string[];
  unknowns: string[];
  sources: ReportSource[];
  confidence: ConfidenceAssessment;
  cautions: string[];
  insufficientData: {
    explanation: string;
    sourcesChecked: number;
    missingData: string[];
    nextSteps: string[];
  } | null;
  buildMyHouseNextStep: {
    label: string;
    destination: string;
  };
  reproducibility: {
    scoringVersion: string;
    generatorVersion: string;
    observationIds: string[];
    excludedObservationIds: string[];
    reportInputHash: string;
  };
}

// ---------------------------------------------------------------------------
// Inclusion aggregation — silence stays "not stated", never "excluded"
// ---------------------------------------------------------------------------

function aggregateInclusion(
  states: InclusionState[],
  labels: { included: string; excluded: string; unknown: string },
): { bucket: 'inclusions' | 'exclusions' | 'unknowns' | 'skip'; text: string } {
  const relevant = states.filter((s) => s !== 'not_applicable');
  if (relevant.length === 0) return { bucket: 'skip', text: '' };
  if (relevant.every((s) => s === 'included')) return { bucket: 'inclusions', text: labels.included };
  if (relevant.every((s) => s === 'excluded')) return { bucket: 'exclusions', text: labels.excluded };
  return { bucket: 'unknowns', text: labels.unknown };
}

function buildInclusionSummary(included: ScoringObservation[]): {
  inclusions: string[];
  exclusions: string[];
  unknowns: string[];
} {
  const inclusions: string[] = [];
  const exclusions: string[] = [];
  const unknowns: string[] = [];
  const put = (r: { bucket: string; text: string }) => {
    if (r.bucket === 'inclusions') inclusions.push(r.text);
    if (r.bucket === 'exclusions') exclusions.push(r.text);
    if (r.bucket === 'unknowns') unknowns.push(r.text);
  };
  if (included.length === 0) return { inclusions, exclusions, unknowns };

  put(
    aggregateInclusion(included.map((o) => o.deliveryState), {
      included: 'Delivery included',
      excluded: 'Delivery excluded',
      unknown: 'Delivery not stated in some or all listings',
    }),
  );
  put(
    aggregateInclusion(included.map((o) => o.installationState), {
      included: 'Installation included',
      excluded: 'Installation excluded',
      unknown: 'Installation not stated in some or all listings',
    }),
  );
  put(
    aggregateInclusion(included.map((o) => o.vatState), {
      included: 'VAT included',
      excluded: 'VAT excluded',
      unknown: 'VAT treatment not stated',
    }),
  );

  const retail = included.filter((o) => o.retailOrWholesale === 'retail').length;
  const wholesale = included.filter((o) => o.retailOrWholesale === 'wholesale').length;
  if (retail > 0 && wholesale === 0) inclusions.push('Retail prices');
  else if (wholesale > 0 && retail === 0) inclusions.push('Wholesale prices');
  else if (retail > 0 && wholesale > 0) unknowns.push('Mix of retail and wholesale prices');

  const conditions = new Set(included.map((o) => o.condition).filter((c) => c !== 'unknown'));
  if (conditions.size === 1) inclusions.push(`Condition: ${[...conditions][0]}`);
  else if (conditions.size > 1) unknowns.push('Mixed product conditions across listings');

  if (included.some((o) => o.negotiable === 'yes')) unknowns.push('Some sellers indicate the price is negotiable');

  inclusions.unshift('Product only unless a listing states otherwise');
  return { inclusions, exclusions, unknowns };
}

// ---------------------------------------------------------------------------
// Cautions — deterministic, fact-driven templates
// ---------------------------------------------------------------------------

function buildCautions(included: ScoringObservation[], assessment: ConfidenceAssessment): string[] {
  const cautions: string[] = [
    'Advertised prices in Nigerian markets are frequently negotiable; treat this as a research baseline, not a quotation.',
  ];
  if (included.some((o) => o.deliveryState === 'unknown')) {
    cautions.push('Delivery was not stated on some listings — confirm delivery cost to your site before budgeting.');
  }
  if (included.some((o) => o.installationState === 'unknown')) {
    cautions.push('Installation was not stated on some listings — confirm whether installation is included.');
  }
  if (assessment.pricing.relativeMad !== null && assessment.pricing.relativeMad > 0.15) {
    cautions.push('Prices varied noticeably between sellers; your final price depends on seller, quantity and timing.');
  }
  const locWeak = included.length > 0 && included.every((o) => o.locationMatch !== 'exact_city');
  if (locWeak) {
    cautions.push('No accepted listing was confirmed in the exact requested city; local transport can change the delivered cost.');
  }
  const anyListingDateMissing = included.some((o) => !o.listingDateIso);
  if (anyListingDateMissing) {
    cautions.push('Some sources do not display a listing date; the "date checked" is when we verified the page, not proof the seller updated it that day.');
  }
  cautions.push('Prices of building materials can move quickly; re-check before committing large purchases.');
  return cautions;
}

// ---------------------------------------------------------------------------
// Next step — relevant only, no unrelated sales language
// ---------------------------------------------------------------------------

function chooseNextStep(status: PriceCheckerReport['status']): { label: string; destination: string } {
  if (status === 'insufficient_data') {
    return { label: 'Request a verified local market check', destination: '/tools/price-checker/manual-check' };
  }
  if (status === 'single_source') {
    return { label: 'Request procurement support to confirm this price', destination: '/tools/price-checker/procurement' };
  }
  return { label: 'Add this material to a project budget', destination: '/tools/price-checker/add-to-budget' };
}

// ---------------------------------------------------------------------------
// Generator
// ---------------------------------------------------------------------------

export function generateReport(
  request: ReportRequest,
  observations: readonly ScoringObservation[],
  policy: ConfidencePolicy = ACTIVE_CONFIDENCE_POLICY,
): PriceCheckerReport {
  const context: AssessmentContext = {
    nowIso: request.generatedAtIso,
    requestedCondition: request.requestedCondition,
  };
  const assessment = assessConfidence(observations, context, policy);

  const includedSet = new Set(assessment.includedObservationIds);
  const included = observations.filter((o) => includedSet.has(o.observationId));

  const status: PriceCheckerReport['status'] =
    assessment.resultKind === 'market_range'
      ? 'complete'
      : assessment.resultKind === 'single_source_observation'
        ? 'single_source'
        : 'insufficient_data';

  const { inclusions, exclusions, unknowns } = buildInclusionSummary(included);

  const locationLimitations: string[] = [];
  if (included.length > 0) {
    const outside = included.filter((o) => !['exact_city'].includes(o.locationMatch)).length;
    if (outside === included.length) {
      locationLimitations.push('No accepted price was confirmed in the exact requested city; wider-area evidence was used.');
    } else if (outside > 0) {
      locationLimitations.push(`${outside} of ${included.length} accepted prices came from outside the exact requested city.`);
    }
    if (included.some((o) => o.locationMatch === 'unknown')) {
      locationLimitations.push('Some seller locations could not be confirmed.');
    }
  }

  const sources: ReportSource[] = included.map((o) => ({
    observationId: o.observationId,
    sellerName: o.sellerName,
    sourceTier: o.sourceTier,
    displayedPrice: o.originalPrice,
    currency: o.currency,
    normalizedPrice: o.normalizedPrice,
    originalUnit: o.originalUnit,
    normalizedUnit: o.normalizedUnit,
    sellerLocationClass: o.locationMatch,
    sourceUrl: o.sourceUrl,
    listingDate: o.listingDateIso,
    dateChecked: o.checkedAtIso,
  }));

  const singleSource = status === 'single_source';
  const pricing = {
    currency: assessment.pricing.currency,
    observedLow: singleSource ? null : assessment.pricing.observedLow,
    observedHigh: singleSource ? null : assessment.pricing.observedHigh,
    typicalPrice: singleSource ? null : assessment.pricing.typicalPrice,
    normalisedUnit: assessment.pricing.unit,
    acceptedObservationCount: assessment.pricing.acceptedObservationCount,
    independentSourceCount: assessment.pricing.independentSourceCount,
    singleSourcePrice: singleSource ? assessment.pricing.median : null,
  };

  let insufficientData: PriceCheckerReport['insufficientData'] = null;
  if (status === 'insufficient_data') {
    const missing: string[] = [];
    const rules = new Set(assessment.excludedObservations.map((e) => e.rule));
    if (rules.has('not_comparable_full_price')) missing.push('Comparable full purchase prices for this exact specification.');
    if (rules.has('specification_mismatch') || rules.has('specification_ambiguous')) {
      missing.push('Listings that clearly state the requested specification.');
    }
    if (rules.has('stale_observation')) missing.push('Sufficiently recent price evidence.');
    if (missing.length === 0) missing.push('Publicly verifiable price listings for this exact request.');
    insufficientData = {
      explanation:
        `Insufficient reliable data was available to produce a defensible market price range for ` +
        `"${request.productName}" in ${request.requestedLocationLabel}. ` +
        `${observations.length} candidate observation(s) were checked and ${assessment.excludedObservations.length} were excluded after validation.`,
      sourcesChecked: observations.length,
      missingData: missing,
      nextSteps: [
        'Expand the location to a wider area.',
        'Select a related, more commonly stocked specification.',
        'Request a manual local market check.',
        'Request BuildMyHouse procurement assistance.',
      ],
    };
  }

  // --- Reproducibility: hash of canonical structured inputs only ---
  const hashInput = {
    scoringVersion: assessment.scoringVersion,
    generatorVersion: REPORT_GENERATOR_VERSION,
    request: {
      productName: request.productName,
      brand: request.brand ?? null,
      specification: request.specification,
      requestedUnit: request.requestedUnit,
      requestedLocationLabel: request.requestedLocationLabel,
      requestedCondition: request.requestedCondition,
    },
    observations: [...observations]
      .sort((a, b) => a.observationId.localeCompare(b.observationId))
      .map((o) => ({
        id: o.observationId,
        url: o.sourceUrl,
        tier: o.sourceTier,
        group: o.independentGroupId,
        price: o.originalPrice,
        currency: o.currency,
        normalizedPrice: o.normalizedPrice,
        normalizedUnit: o.normalizedUnit,
        checkedAt: o.checkedAtIso,
        listingDate: o.listingDateIso,
        spec: o.specMatch,
        location: o.locationMatch,
        condition: o.condition,
        comparable: o.comparable,
      })),
  };

  return {
    reportId: request.reportId,
    status,
    generatedAt: request.generatedAtIso,
    generatorVersion: REPORT_GENERATOR_VERSION,
    product: {
      name: request.productName,
      brand: request.brand ?? null,
      specification: request.specification,
      requestedUnit: request.requestedUnit,
    },
    location: {
      requested: request.requestedLocationLabel,
      limitations: locationLimitations,
    },
    pricing,
    inclusions,
    exclusions,
    unknowns,
    sources,
    confidence: assessment,
    cautions: buildCautions(included, assessment),
    insufficientData,
    buildMyHouseNextStep: chooseNextStep(status),
    reproducibility: {
      scoringVersion: assessment.scoringVersion,
      generatorVersion: REPORT_GENERATOR_VERSION,
      observationIds: assessment.includedObservationIds,
      excludedObservationIds: assessment.excludedObservations.map((e) => e.observationId),
      reportInputHash: sha256Hex(canonicalJson(hashInput)),
    },
  };
}

// ---------------------------------------------------------------------------
// Plain-text renderer (exact BuildMyHouse Price Checker structure)
// ---------------------------------------------------------------------------

export function renderReportText(report: PriceCheckerReport): string {
  const lines: string[] = [];
  const money = (v: number | null) =>
    v === null ? '—' : `${report.pricing.currency ?? ''} ${v.toLocaleString('en-NG')}`.trim();

  lines.push('PRODUCT');
  const specText = Object.entries(report.product.specification)
    .map(([k, v]) => `${k}: ${v}`)
    .join(', ');
  lines.push(`${report.product.name}${report.product.brand ? ` (${report.product.brand})` : ''}${specText ? ` — ${specText}` : ''}`);
  lines.push('');
  lines.push('LOCATION');
  lines.push(report.location.requested);
  for (const lim of report.location.limitations) lines.push(`Note: ${lim}`);
  lines.push('');

  if (report.status === 'insufficient_data' && report.insufficientData) {
    lines.push('RESULT');
    lines.push('Insufficient reliable data');
    lines.push(report.insufficientData.explanation);
    lines.push('');
    lines.push('WHAT WAS MISSING');
    for (const m of report.insufficientData.missingData) lines.push(`- ${m}`);
    lines.push('');
    lines.push('WHAT YOU CAN DO NEXT');
    for (const s of report.insufficientData.nextSteps) lines.push(`- ${s}`);
  } else if (report.status === 'single_source') {
    lines.push('SINGLE-SOURCE OBSERVED PRICE');
    lines.push(`${money(report.pricing.singleSourcePrice)} per ${report.pricing.normalisedUnit ?? 'unit'}`);
    lines.push('This is one observed price from a single independent source. It is not a market range and should not be treated as a typical market price.');
  } else {
    lines.push('LATEST OBSERVED RANGE');
    lines.push(`${money(report.pricing.observedLow)} – ${money(report.pricing.observedHigh)} per ${report.pricing.normalisedUnit ?? 'unit'}`);
    lines.push('');
    lines.push('TYPICAL OBSERVED PRICE');
    lines.push(`${money(report.pricing.typicalPrice)} per ${report.pricing.normalisedUnit ?? 'unit'} (median of accepted observations)`);
  }
  lines.push('');

  if (report.status !== 'insufficient_data') {
    lines.push('WHAT THE PRICE APPEARS TO INCLUDE');
    for (const i of report.inclusions) lines.push(`- ${i}`);
    for (const e of report.exclusions) lines.push(`- ${e}`);
    for (const u of report.unknowns) lines.push(`- ${u}`);
    lines.push('');
  }

  lines.push('SOURCES CHECKED');
  if (report.sources.length === 0) {
    lines.push(`- ${report.confidence.excludedObservations.length + report.sources.length} candidate source(s) were checked; none passed validation.`);
  }
  for (const s of report.sources) {
    lines.push(
      `- ${s.sellerName ?? 'Unnamed seller'} (Tier ${s.sourceTier}) — ${s.currency} ${s.displayedPrice.toLocaleString('en-NG')}` +
        `${s.originalUnit ? ` per ${s.originalUnit}` : ''}` +
        `${s.normalizedPrice !== null && s.normalizedUnit !== s.originalUnit ? ` (≈ ${s.currency} ${s.normalizedPrice.toLocaleString('en-NG')} per ${s.normalizedUnit})` : ''}` +
        ` — ${s.sourceUrl} — checked ${s.dateChecked.slice(0, 10)}${s.listingDate ? `, listed ${s.listingDate.slice(0, 10)}` : ''}`,
    );
  }
  lines.push('');

  lines.push('CONFIDENCE');
  lines.push(`${report.confidence.label.toUpperCase().replace('_', ' ')} (${report.confidence.score}/100, policy ${report.confidence.scoringVersion})`);
  for (const r of report.confidence.positiveReasons) lines.push(`+ ${r}`);
  for (const r of report.confidence.limitingReasons) lines.push(`− ${r}`);
  lines.push('');

  lines.push('IMPORTANT CAUTION');
  for (const c of report.cautions) lines.push(`- ${c}`);
  lines.push('');

  lines.push('BUILDMYHOUSE NEXT STEP');
  lines.push(`${report.buildMyHouseNextStep.label} → ${report.buildMyHouseNextStep.destination}`);

  return lines.join('\n');
}
