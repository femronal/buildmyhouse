/**
 * Price Checker Stage 2 — taxonomy types.
 * These are design-time structures (no database coupling). Stage 3 will map them
 * to Prisma models per docs/price-checker/LOGICAL_DATA_MODEL.md.
 */

export type FunnelRole = 'free_traffic' | 'paid_research' | 'both';

export type ReviewerType =
  | 'quantity_surveyor'
  | 'structural_engineer'
  | 'electrical_engineer'
  | 'building_services'
  | 'architect_interior'
  | 'security_low_voltage';

export type ProductCondition = 'new' | 'used' | 'refurbished' | 'rental';

export type UnitDimension =
  | 'count'
  | 'mass'
  | 'area'
  | 'volume'
  | 'length'
  | 'electric_capacity'
  | 'energy'
  | 'power'
  | 'package'
  | 'service';

export interface UnitDefinition {
  /** Canonical machine code, e.g. 'bag_50kg'. Free-text units are prohibited. */
  code: string;
  label: string;
  aliases: readonly string[];
  dimension: UnitDimension;
}

export type ConversionFactorSource =
  | 'fixed' // physically constant (tonne -> kg)
  | 'manufacturer_spec' // e.g. rebar kg-per-length tables, panel wattage
  | 'product_spec' // per-product value (m² per tile carton)
  | 'seller_stated'; // seller explicitly states the factor in the listing

export interface ConversionRule {
  fromUnit: string;
  toUnit: string;
  factorSource: ConversionFactorSource;
  /** Present only when factorSource === 'fixed'. */
  fixedFactor?: number;
  /** Human explanation of what factor is required and where it must come from. */
  requiredInput: string;
  note?: string;
}

export type QuestionRequirement =
  | 'always'
  | 'conditional'
  | 'optional'
  | 'admin_only'
  | 'professional_review';

export type QuestionType =
  | 'single_select'
  | 'multi_select'
  | 'number'
  | 'quantity_unit'
  | 'free_text'
  | 'brand_search'
  | 'model_search'
  | 'location'
  | 'yes_no'
  | 'image_upload'
  | 'document_upload';

export interface QuestionCondition {
  questionId: string;
  valueIn: readonly string[];
}

export interface ClarifyingQuestion {
  id: string;
  prompt: string;
  type: QuestionType;
  requirement: QuestionRequirement;
  /** Only for requirement === 'conditional'. */
  dependsOn?: QuestionCondition;
  options?: readonly string[];
  whyItMatters?: string;
  allowUnknown: boolean;
}

export interface AttributeDefinition {
  key: string;
  label: string;
  /** Whether this attribute materially changes price and must gate comparisons. */
  priceChanging: boolean;
  values?: readonly string[];
}

export type RiskFlag =
  | 'used_item'
  | 'accessory_only'
  | 'deposit_only'
  | 'contact_for_price'
  | 'placeholder_price'
  | 'smaller_spec'
  | 'wholesale_only'
  | 'damaged_stock'
  | 'discontinued'
  | 'rental_not_sale'
  | 'incomplete_bundle';

export type InclusionCheck =
  | 'delivery'
  | 'vat'
  | 'installation'
  | 'accessories'
  | 'warranty'
  | 'labour'
  | 'transportation'
  | 'loading_offloading'
  | 'minimum_quantity'
  | 'negotiable';

export interface MatchingRules {
  /** Attribute keys that must all match for two observations to be exact matches. */
  exactMatchKeys: readonly string[];
  /** Attribute keys that must match for a close match (subset of exact). */
  closeMatchKeys: readonly string[];
  /** Attribute keys across which comparison is PROHIBITED when values differ (e.g. battery chemistry). */
  neverComparableAcross: readonly string[];
}

export type EvidenceClass =
  | 'manufacturer_distributor'
  | 'established_ecommerce'
  | 'classified_listing'
  | 'supplier_quotation'
  | 'supplier_price_list'
  | 'receipt_invoice'
  | 'user_submitted'
  | 'merchant_confirmed'
  | 'weak_secondary';

/**
 * Structure-testing sample. `illustrativeOnly: true` is a literal type so no
 * sample can ever be passed where a real observation is required.
 */
export interface IllustrativeObservation {
  description: string;
  priceNgn: number;
  unit: string;
  sourceType: EvidenceClass;
  note: string;
  illustrativeOnly: true;
}

export interface SubProduct {
  key: string;
  label: string;
  aliases?: readonly string[];
}

/**
 * Escalation ownership: which professional discipline handles OPTIONAL
 * escalation reviews for this family. Not a mandatory sign-off — see
 * docs/price-checker/MATRIX_VALIDATION_AND_ESCALATION_POLICY.md.
 */
export interface ReviewerAssignment {
  primary: ReviewerType;
  secondary?: ReviewerType;
  reason: string;
}

export interface ProductFamily {
  key: string;
  name: string;
  /** Nigerian market names, aliases and common misspellings (lowercase). */
  marketNames: readonly string[];
  parentCategory:
    | 'structural'
    | 'envelope'
    | 'finishes'
    | 'mep'
    | 'energy'
    | 'security';
  kind: 'product' | 'system' | 'accessory_set';
  applicableConditions: readonly ProductCondition[];
  funnelRole: FunnelRole;
  subProducts: readonly SubProduct[];
  attributes: readonly AttributeDefinition[];
  /** Canonical unit codes sellers actually quote in. */
  sellerUnits: readonly string[];
  normalizedUnit: string;
  normalizedUnitRationale: string;
  questions: readonly ClarifyingQuestion[];
  matching: MatchingRules;
  inclusionChecks: readonly InclusionCheck[];
  riskFlags: readonly RiskFlag[];
  reviewers: ReviewerAssignment;
  samples: readonly IllustrativeObservation[];
}

/** Level 2 backlog entry — no full matrix yet, but must fit the taxonomy. */
export interface ExpansionFamily {
  key: string;
  name: string;
  whyValuable: string;
  paidReportPotential: 'low' | 'medium' | 'high';
  likelyReviewer: ReviewerType;
  likelySourceAvailability: 'good' | 'moderate' | 'poor';
  proposedPriority: 1 | 2 | 3; // 1 = next wave
}

// ---------------------------------------------------------------------------
// Services / labour taxonomy
// ---------------------------------------------------------------------------

export type ServicePricingBasis = 'labour_only' | 'labour_and_material' | 'either';

export interface ServiceFamily {
  key: string;
  name: string;
  marketNames: readonly string[];
  pricingBasis: ServicePricingBasis;
  pricingUnits: readonly string[]; // canonical unit codes ('sqm', 'point', 'job', ...)
  hasMinimumJobCharge: boolean;
  scopeFactors: readonly string[]; // conditions that must match before comparison
  reviewers: ReviewerAssignment;
  notes?: string;
}

// ---------------------------------------------------------------------------
// Professional review records
// ---------------------------------------------------------------------------

export type ReviewOutcome = 'approved' | 'approved_with_changes' | 'changes_requested';

export interface ProfessionalReviewRecord {
  matrixKey: string; // family or service key
  matrixVersion: number;
  category: string;
  reviewerName: string;
  reviewerProfession: ReviewerType;
  relevantQualification: string;
  reviewScope: string;
  reviewDate: string; // ISO date
  outcome: ReviewOutcome;
  notes: string;
  evidenceAttachmentRef?: string;
  adminApprover: string;
  nextReviewDate?: string;
}

// ---------------------------------------------------------------------------
// Custom research
// ---------------------------------------------------------------------------

export type CustomRequestOutcome =
  | 'matched_confident'
  | 'matched_needs_clarification'
  | 'temporary_research_item'
  | 'admin_review'
  | 'unsupported'
  | 'insufficiently_specified'
  | 'proposed_new_catalogue_product';

export interface CustomResearchRequestInput {
  productName: string;
  description?: string;
  intendedUse?: string;
  location?: string;
  quantity?: string;
  knownBrand?: string;
  knownSpecification?: string;
  photoRefs?: readonly string[];
  quotationUploadRef?: string;
  sellerLink?: string;
  deadline?: string;
  deliveryRequired?: boolean;
  installationRequired?: boolean;
}
