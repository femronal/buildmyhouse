/**
 * Dynamic AI-generated specification matrix — schema, strict validation,
 * confidence states, research-readiness and optional escalation.
 * Policy doc: docs/price-checker/DYNAMIC_MATRIX_POLICY.md
 *
 * Founder decision (2026-07-28): matrices are generated dynamically by the
 * configured OpenAI reasoning model (env `PRICE_CHECKER_MATRIX_MODEL`) before
 * live research, validated deterministically here. Human professional review
 * is OPTIONAL ESCALATION ONLY — never a gate for ordinary searches.
 *
 * Deterministic code (this module) owns: schema validation, unit/conversion
 * whitelisting, readiness/confidence-state assignment, escalation triggers,
 * refusal when evidence is insufficient. AI must never invent conversion
 * factors, dimensions, coverage, weights, capacities, delivery charges,
 * prices, availability, or professional approval.
 */
import { getFamilyByKey } from './families';
import { QuestionType } from './types';
import { CONVERSION_RULES } from './units';

export const MATRIX_SCHEMA_VERSION = 1;

export type MatrixProductType = 'product' | 'system' | 'accessory' | 'bundle' | 'service' | 'unknown';

export type MatrixConfidenceState =
  | 'research_ready_high_confidence'
  | 'research_ready_moderate_confidence'
  | 'clarification_required'
  | 'evidence_required'
  | 'optional_specialist_escalation'
  | 'unsupported_product'
  | 'insufficient_specification';

export interface MatrixClarificationQuestion {
  id: string;
  question: string;
  plainLanguageExplanation: string;
  attributeKey: string;
  questionType: QuestionType;
  required: boolean;
  reasonItAffectsPrice: string;
  options?: readonly string[];
  allowsUnknown: boolean;
  allowsUpload: boolean;
  displayOrder: number;
}

export interface MatrixProposedConversion {
  fromUnit: string;
  toUnit: string;
  /** Where the factor would come from. AI may only cite registered sources. */
  factorSource: 'fixed' | 'manufacturer_spec' | 'product_spec' | 'seller_stated';
  factorValue?: number;
}

export interface TemporaryMatrix {
  requestId: string;
  rawProductName: string;
  canonicalProductName: string;
  matchedFamilyId: string | null;
  matchConfidence: number; // 0..1
  productType: MatrixProductType;
  aliasesDetected: readonly string[];
  intendedUse: string | null;
  requiredAttributes: readonly string[];
  knownAttributes: Readonly<Record<string, string>>;
  missingAttributes: readonly string[];
  clarificationQuestions: readonly MatrixClarificationQuestion[];
  originalUnit: string | null;
  preferredComparisonUnit: string | null;
  possibleConversions: readonly MatrixProposedConversion[];
  prohibitedConversions: readonly string[];
  inclusionQuestions: readonly string[];
  deliveryRequired: boolean | null;
  installationRequired: boolean | null;
  condition: 'new' | 'used' | 'refurbished' | 'rental' | 'unknown';
  location: string | null;
  riskFlags: readonly string[];
  evidenceProvided: readonly string[];
  minimumResearchReadiness: number; // 0..1 threshold this request must meet
  researchReady: boolean;
  confidence: number; // 0..1
  uncertaintyReasons: readonly string[];
  escalationRecommended: boolean;
  generatedByModel: string;
  generatedAt: string; // ISO datetime
  schemaVersion: number;
}

// ---------------------------------------------------------------------------
// Strict deterministic validation of AI output
// ---------------------------------------------------------------------------

export interface MatrixValidationResult {
  valid: boolean;
  errors: readonly string[];
}

const REQUIRED_STRING_FIELDS: readonly (keyof TemporaryMatrix)[] = [
  'requestId',
  'rawProductName',
  'canonicalProductName',
  'generatedByModel',
  'generatedAt',
];

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((v) => typeof v === 'string');
}

function isFraction(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= 1;
}

const QUESTION_TYPES: readonly QuestionType[] = [
  'single_select', 'multi_select', 'number', 'quantity_unit', 'free_text', 'brand_search',
  'model_search', 'location', 'yes_no', 'image_upload', 'document_upload',
];

function validateQuestion(q: unknown, index: number, errors: string[]): void {
  if (!q || typeof q !== 'object') {
    errors.push(`clarificationQuestions[${index}] is not an object`);
    return;
  }
  const question = q as Record<string, unknown>;
  for (const field of ['id', 'question', 'plainLanguageExplanation', 'attributeKey', 'reasonItAffectsPrice']) {
    if (typeof question[field] !== 'string' || (question[field] as string).trim() === '') {
      errors.push(`clarificationQuestions[${index}].${field} missing or empty`);
    }
  }
  if (!QUESTION_TYPES.includes(question.questionType as QuestionType)) {
    errors.push(`clarificationQuestions[${index}].questionType invalid: ${String(question.questionType)}`);
  }
  for (const field of ['required', 'allowsUnknown', 'allowsUpload']) {
    if (typeof question[field] !== 'boolean') {
      errors.push(`clarificationQuestions[${index}].${field} must be boolean`);
    }
  }
  if (typeof question.displayOrder !== 'number') {
    errors.push(`clarificationQuestions[${index}].displayOrder must be a number`);
  }
}

/**
 * Validates an untrusted (AI-produced) object against the temporary-matrix
 * schema. Returns every violation; never mutates or repairs silently.
 */
export function validateTemporaryMatrix(raw: unknown): MatrixValidationResult {
  const errors: string[] = [];
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return { valid: false, errors: ['matrix is not an object'] };
  }
  const m = raw as Record<string, unknown>;

  for (const field of REQUIRED_STRING_FIELDS) {
    if (typeof m[field] !== 'string' || (m[field] as string).trim() === '') {
      errors.push(`${String(field)} missing or empty`);
    }
  }
  if (m.matchedFamilyId !== null && typeof m.matchedFamilyId !== 'string') {
    errors.push('matchedFamilyId must be string or null');
  }
  if (typeof m.matchedFamilyId === 'string' && !getFamilyByKey(m.matchedFamilyId)) {
    errors.push(`matchedFamilyId '${m.matchedFamilyId}' is not a known family`);
  }
  if (!isFraction(m.matchConfidence)) errors.push('matchConfidence must be 0..1');
  if (!isFraction(m.confidence)) errors.push('confidence must be 0..1');
  if (!isFraction(m.minimumResearchReadiness)) errors.push('minimumResearchReadiness must be 0..1');
  if (typeof m.researchReady !== 'boolean') errors.push('researchReady must be boolean');
  if (typeof m.escalationRecommended !== 'boolean') errors.push('escalationRecommended must be boolean');
  if (!['product', 'system', 'accessory', 'bundle', 'service', 'unknown'].includes(m.productType as string)) {
    errors.push(`productType invalid: ${String(m.productType)}`);
  }
  if (!['new', 'used', 'refurbished', 'rental', 'unknown'].includes(m.condition as string)) {
    errors.push(`condition invalid: ${String(m.condition)}`);
  }
  for (const field of ['aliasesDetected', 'requiredAttributes', 'missingAttributes', 'prohibitedConversions', 'inclusionQuestions', 'riskFlags', 'evidenceProvided', 'uncertaintyReasons']) {
    if (!isStringArray(m[field])) errors.push(`${field} must be a string array`);
  }
  if (!m.knownAttributes || typeof m.knownAttributes !== 'object' || Array.isArray(m.knownAttributes)) {
    errors.push('knownAttributes must be an object map');
  }
  if (!Array.isArray(m.clarificationQuestions)) {
    errors.push('clarificationQuestions must be an array');
  } else {
    m.clarificationQuestions.forEach((q, i) => validateQuestion(q, i, errors));
  }
  if (m.schemaVersion !== MATRIX_SCHEMA_VERSION) {
    errors.push(`schemaVersion must be ${MATRIX_SCHEMA_VERSION}`);
  }

  errors.push(...validateProposedConversions(m.possibleConversions));

  return { valid: errors.length === 0, errors };
}

/**
 * AI must never invent conversion factors. Every proposed conversion must
 * correspond to a registered CONVERSION_RULES entry with a matching factor
 * source, and may only carry a numeric factor when the registered source
 * permits an externally supplied value.
 */
export function validateProposedConversions(value: unknown): string[] {
  const errors: string[] = [];
  if (value === undefined || value === null) return ['possibleConversions must be an array'];
  if (!Array.isArray(value)) return ['possibleConversions must be an array'];
  value.forEach((entry, i) => {
    if (!entry || typeof entry !== 'object') {
      errors.push(`possibleConversions[${i}] is not an object`);
      return;
    }
    const conv = entry as Record<string, unknown>;
    const rule = CONVERSION_RULES.find((r) => r.fromUnit === conv.fromUnit && r.toUnit === conv.toUnit);
    if (!rule) {
      errors.push(`possibleConversions[${i}]: no registered rule ${String(conv.fromUnit)} → ${String(conv.toUnit)} (AI may not invent conversions)`);
      return;
    }
    if (conv.factorSource !== rule.factorSource) {
      errors.push(`possibleConversions[${i}]: factorSource must be '${rule.factorSource}'`);
    }
    if (rule.factorSource === 'fixed' && conv.factorValue !== undefined && conv.factorValue !== rule.fixedFactor) {
      errors.push(`possibleConversions[${i}]: fixed factor is ${rule.fixedFactor}, AI-supplied value rejected`);
    }
  });
  return errors;
}

// ---------------------------------------------------------------------------
// Deterministic enrichment from the reusable family template
// ---------------------------------------------------------------------------

/**
 * Combine an AI matrix with the family baseline template: required attributes,
 * preferred comparison unit and known prohibitions come from the catalogue,
 * never from AI alone. Returns a corrected copy.
 */
export function enrichMatrixFromFamily(matrix: TemporaryMatrix): TemporaryMatrix {
  if (!matrix.matchedFamilyId) return matrix;
  const family = getFamilyByKey(matrix.matchedFamilyId);
  if (!family) return matrix;

  const priceChanging = family.attributes.filter((a) => a.priceChanging).map((a) => a.key);
  const required = Array.from(new Set([...priceChanging, ...matrix.requiredAttributes]));
  const known = Object.keys(matrix.knownAttributes);
  const missing = required.filter((key) => !known.includes(key));

  return {
    ...matrix,
    requiredAttributes: required,
    missingAttributes: missing,
    preferredComparisonUnit: family.normalizedUnit,
  };
}

// ---------------------------------------------------------------------------
// Confidence-state assignment and research readiness (deterministic)
// ---------------------------------------------------------------------------

export const DEFAULT_MIN_READINESS = 0.6;
export const HIGH_CONFIDENCE_THRESHOLD = 0.8;

export interface ReadinessDecision {
  state: MatrixConfidenceState;
  /** Live (paid) research may proceed. Never true for uncertain matrices. */
  mayProceed: boolean;
  reasons: readonly string[];
}

/**
 * Deterministic state assignment. Paid research never silently proceeds when
 * the matrix is too uncertain, and no state ever REQUIRES human review.
 */
export function decideReadiness(matrix: TemporaryMatrix): ReadinessDecision {
  const reasons: string[] = [...matrix.uncertaintyReasons];

  if (matrix.matchedFamilyId === null && matrix.productType === 'unknown' && matrix.confidence < 0.2) {
    return { state: 'unsupported_product', mayProceed: false, reasons: ['Product could not be identified.', ...reasons] };
  }

  const requiredMissing = matrix.missingAttributes.filter((key) =>
    matrix.clarificationQuestions.some((q) => q.attributeKey === key && q.required),
  );

  const unansweredRequired = requiredMissing.length > 0;
  const threshold = matrix.minimumResearchReadiness || DEFAULT_MIN_READINESS;

  if (matrix.confidence < 0.3 && matrix.evidenceProvided.length === 0 && unansweredRequired) {
    return {
      state: 'insufficient_specification',
      mayProceed: false,
      reasons: ['Specification too incomplete to research honestly.', ...reasons],
    };
  }

  if (unansweredRequired) {
    return {
      state: 'clarification_required',
      mayProceed: false,
      reasons: [`Missing required details: ${requiredMissing.join(', ')}`, ...reasons],
    };
  }

  if (matrix.confidence < threshold && matrix.evidenceProvided.length === 0) {
    return {
      state: 'evidence_required',
      mayProceed: false,
      reasons: ['Confidence below threshold; a photo, seller link or quotation would help.', ...reasons],
    };
  }

  if (matrix.escalationRecommended) {
    // Escalation is OPTIONAL: research may still proceed; a specialist look is offered.
    return {
      state: 'optional_specialist_escalation',
      mayProceed: true,
      reasons: ['Specialist review offered (optional); research can proceed.', ...reasons],
    };
  }

  if (matrix.confidence >= HIGH_CONFIDENCE_THRESHOLD) {
    return { state: 'research_ready_high_confidence', mayProceed: true, reasons };
  }
  return { state: 'research_ready_moderate_confidence', mayProceed: true, reasons };
}

// ---------------------------------------------------------------------------
// Optional escalation (never mandatory)
// ---------------------------------------------------------------------------

export interface EscalationSignals {
  structuralOrSafetySensitive?: boolean;
  unusualIndustrialEquipment?: boolean;
  conflictingSpecifications?: boolean;
  extremelyHighValue?: boolean;
  unclearSellerDescriptions?: boolean;
  misidentificationSafetyRisk?: boolean;
  userRequestedHumanVerification?: boolean;
  aiReportsIndefensibleComparison?: boolean;
}

export interface EscalationAssessment {
  recommended: boolean;
  /** Human review is never a hard requirement for ordinary searches. */
  required: false;
  reasons: readonly string[];
}

export function assessEscalation(signals: EscalationSignals): EscalationAssessment {
  const labels: Record<keyof EscalationSignals, string> = {
    structuralOrSafetySensitive: 'Structural or safety-sensitive decision',
    unusualIndustrialEquipment: 'Unusual industrial equipment',
    conflictingSpecifications: 'Conflicting technical specifications',
    extremelyHighValue: 'Extremely high-value purchase',
    unclearSellerDescriptions: 'Unclear or contradictory seller descriptions',
    misidentificationSafetyRisk: 'Incorrect identification could create safety risks',
    userRequestedHumanVerification: 'User requested human verification',
    aiReportsIndefensibleComparison: 'AI reports it cannot produce a defensible comparison',
  };
  const reasons = (Object.keys(labels) as (keyof EscalationSignals)[])
    .filter((key) => signals[key])
    .map((key) => labels[key]);
  return { recommended: reasons.length > 0, required: false, reasons };
}

/** Families whose reports carry the safety wording (informational only). */
export const SAFETY_SENSITIVE_FAMILIES: readonly string[] = [
  'cement',
  'reinforcement-steel',
  'concrete-blocks',
  'electrical-cables',
  'electrical-protection',
  'inverters',
  'batteries',
  'generators',
];

export const SAFETY_DISCLAIMER =
  'Price research only. Product suitability and installation requirements should be confirmed by an appropriately qualified professional.';

/**
 * Stage 2 closure logic: human professional review is NOT a requirement.
 * Ordinary catalogue searches, ordinary custom searches and ordinary matrix
 * generation never require human review.
 */
export function isHumanReviewRequired(): false {
  return false;
}
