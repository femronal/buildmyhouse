import {
  BUILD_OPPORTUNITY_CATEGORY_OPTIONS,
  BUILD_OPPORTUNITY_FILTERS,
  formatBuildOpportunityKey,
  type BuildOpportunityCategoryKey,
} from '@buildmyhouse/shared-types';

export type { BuildOpportunityCategoryKey };
export { BUILD_OPPORTUNITY_FILTERS, formatBuildOpportunityKey };

export const BUILD_OPPORTUNITY_CATEGORIES = BUILD_OPPORTUNITY_CATEGORY_OPTIONS.map((option) => ({
  key: option.value,
  label: option.label,
}));
