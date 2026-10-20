/**
 * Re-export shared Nigeria LGA map for homeowner app imports.
 * Lagos LGA list stays aligned with historical lagos-lgas exports.
 */
export {
  NIGERIA_STATES,
  NIGERIA_STATE_LGAS,
  POPULAR_AREA_ALIASES,
  areasForState,
  resolvePopularAreaToLga,
  isValidStateLga,
  composeLocationLabel,
  parseLocationToStateLga,
  normalizeLocationText,
} from '@buildmyhouse/shared-utils';

export { LAGOS_LGAS, ALL_LOCATIONS_FILTER, resolveLagosLga, locationMatchesLgaFilter } from './lagos-lgas';
