/**
 * Shared builders for product-family matrices. Keeps family data files
 * declarative and consistent.
 */
import {
  ClarifyingQuestion,
  IllustrativeObservation,
  InclusionCheck,
  QuestionRequirement,
  QuestionType,
  RiskFlag,
} from '../types';

export function q(
  id: string,
  prompt: string,
  type: QuestionType,
  requirement: QuestionRequirement,
  extra: Partial<Pick<ClarifyingQuestion, 'options' | 'dependsOn' | 'whyItMatters' | 'allowUnknown'>> = {},
): ClarifyingQuestion {
  return {
    id,
    prompt,
    type,
    requirement,
    options: extra.options,
    dependsOn: extra.dependsOn,
    whyItMatters: extra.whyItMatters,
    allowUnknown: extra.allowUnknown ?? true,
  };
}

/** Questions common to nearly every family. */
export const COMMON_QUESTIONS: readonly ClarifyingQuestion[] = [
  q('quantity', 'How much do you need?', 'quantity_unit', 'always', {
    whyItMatters: 'Bulk quantities often unlock wholesale pricing.',
    allowUnknown: false,
  }),
  q('delivery_needed', 'Do you need it delivered to your site?', 'yes_no', 'always', {
    whyItMatters: 'Most listed prices exclude delivery; transport can change the total significantly.',
    allowUnknown: false,
  }),
];

export const ALL_INCLUSION_CHECKS: readonly InclusionCheck[] = [
  'delivery',
  'vat',
  'installation',
  'accessories',
  'warranty',
  'labour',
  'transportation',
  'loading_offloading',
  'minimum_quantity',
  'negotiable',
];

export const COMMODITY_RISK_FLAGS: readonly RiskFlag[] = [
  'deposit_only',
  'contact_for_price',
  'placeholder_price',
  'smaller_spec',
  'wholesale_only',
];

export const EQUIPMENT_RISK_FLAGS: readonly RiskFlag[] = [
  'used_item',
  'accessory_only',
  'deposit_only',
  'contact_for_price',
  'placeholder_price',
  'smaller_spec',
  'damaged_stock',
  'discontinued',
  'rental_not_sale',
  'incomplete_bundle',
];

export function sample(
  description: string,
  priceNgn: number,
  unit: string,
  sourceType: IllustrativeObservation['sourceType'],
  note: string,
): IllustrativeObservation {
  return {
    description,
    priceNgn,
    unit,
    sourceType,
    note: `ILLUSTRATIVE ONLY — not current market data, never user-facing. ${note}`,
    illustrativeOnly: true,
  };
}
