/**
 * Nigeria-first location taxonomy with deterministic fallback rules.
 * Policy doc: docs/price-checker/LOCATION_TAXONOMY.md
 *
 * The model distinguishes seller location from delivery destination; both use
 * the same node structure. Local areas/markets are DATA, never business-logic
 * branches, so new areas can be added without code changes.
 */

export interface LocationNode {
  key: string;
  label: string;
  type: 'country' | 'state' | 'city' | 'local_area' | 'market';
  parentKey?: string;
  /** Launch-priority states get scheduled cache refreshes first. */
  launchPriority?: boolean;
}

export const LOCATIONS: readonly LocationNode[] = [
  { key: 'ng', label: 'Nigeria', type: 'country' },

  // Launch states
  { key: 'ng-lagos', label: 'Lagos', type: 'state', parentKey: 'ng', launchPriority: true },
  { key: 'ng-ogun', label: 'Ogun', type: 'state', parentKey: 'ng', launchPriority: true },
  { key: 'ng-fct', label: 'Abuja (FCT)', type: 'state', parentKey: 'ng', launchPriority: true },
  { key: 'ng-edo', label: 'Edo', type: 'state', parentKey: 'ng', launchPriority: true },

  // Other states (expandable to all 36 + FCT; add rows, not code)
  { key: 'ng-oyo', label: 'Oyo', type: 'state', parentKey: 'ng' },
  { key: 'ng-rivers', label: 'Rivers', type: 'state', parentKey: 'ng' },
  { key: 'ng-anambra', label: 'Anambra', type: 'state', parentKey: 'ng' },
  { key: 'ng-enugu', label: 'Enugu', type: 'state', parentKey: 'ng' },
  { key: 'ng-kano', label: 'Kano', type: 'state', parentKey: 'ng' },
  { key: 'ng-kaduna', label: 'Kaduna', type: 'state', parentKey: 'ng' },
  { key: 'ng-delta', label: 'Delta', type: 'state', parentKey: 'ng' },
  { key: 'ng-ondo', label: 'Ondo', type: 'state', parentKey: 'ng' },
  { key: 'ng-osun', label: 'Osun', type: 'state', parentKey: 'ng' },
  { key: 'ng-ekiti', label: 'Ekiti', type: 'state', parentKey: 'ng' },

  // Lagos cities / areas / markets
  { key: 'ng-lagos-mainland', label: 'Lagos Mainland', type: 'city', parentKey: 'ng-lagos' },
  { key: 'ng-lagos-island', label: 'Lagos Island / Lekki axis', type: 'city', parentKey: 'ng-lagos' },
  { key: 'ng-lagos-ikeja', label: 'Ikeja', type: 'local_area', parentKey: 'ng-lagos-mainland' },
  { key: 'ng-lagos-yaba', label: 'Yaba', type: 'local_area', parentKey: 'ng-lagos-mainland' },
  { key: 'ng-lagos-ajah', label: 'Ajah', type: 'local_area', parentKey: 'ng-lagos-island' },
  { key: 'mkt-orile-coker', label: 'Orile/Coker building materials market', type: 'market', parentKey: 'ng-lagos-mainland' },
  { key: 'mkt-mile12-owode', label: 'Owode Onirin iron market', type: 'market', parentKey: 'ng-lagos-mainland' },
  { key: 'mkt-dosunmu-idumota', label: 'Idumota/Dosunmu electrical market', type: 'market', parentKey: 'ng-lagos-island' },

  // Ogun cities / markets
  { key: 'ng-ogun-abeokuta', label: 'Abeokuta', type: 'city', parentKey: 'ng-ogun' },
  { key: 'ng-ogun-mowe-ibafo', label: 'Mowe / Ibafo axis', type: 'city', parentKey: 'ng-ogun' },
  { key: 'ng-ogun-sango-otta', label: 'Sango Otta', type: 'city', parentKey: 'ng-ogun' },

  // FCT
  { key: 'ng-fct-abuja', label: 'Abuja city', type: 'city', parentKey: 'ng-fct' },
  { key: 'mkt-deidei', label: 'Dei-Dei building materials market', type: 'market', parentKey: 'ng-fct-abuja' },

  // Edo
  { key: 'ng-edo-benin', label: 'Benin City', type: 'city', parentKey: 'ng-edo' },
] as const;

const LOCATION_INDEX = new Map(LOCATIONS.map((l) => [l.key, l]));

export function getLocation(key: string): LocationNode | undefined {
  return LOCATION_INDEX.get(key);
}

export function stateOf(key: string): LocationNode | undefined {
  let node = LOCATION_INDEX.get(key);
  while (node && node.type !== 'state') {
    node = node.parentKey ? LOCATION_INDEX.get(node.parentKey) : undefined;
  }
  return node;
}

/** Regional neighbours used for the nearby-state fallback (launch scope only). */
const NEARBY_STATES: Record<string, readonly string[]> = {
  'ng-lagos': ['ng-ogun'],
  'ng-ogun': ['ng-lagos', 'ng-oyo'],
  'ng-fct': ['ng-kaduna'],
  'ng-edo': ['ng-delta'],
};

export type LocationMatchLevel =
  | 'exact_local_area'
  | 'same_city'
  | 'same_state'
  | 'nearby_state'
  | 'national'
  | 'insufficient';

export interface LocationMatch {
  level: LocationMatchLevel;
  /** Message the report must show when a substitute location is used. */
  substitutionNotice?: string;
}

/**
 * Deterministic fallback ladder:
 * exact local area → same city → same state → nearby state → national → insufficient.
 */
export function matchLocation(requestedKey: string, observationKey: string, nationalDelivery = false): LocationMatch {
  const requested = LOCATION_INDEX.get(requestedKey);
  const observed = LOCATION_INDEX.get(observationKey);
  if (!requested || !observed) {
    return { level: 'insufficient', substitutionNotice: 'Location could not be resolved.' };
  }

  if (requested.key === observed.key) return { level: 'exact_local_area' };

  // same city: shared city ancestor (or one is the city of the other)
  const cityOf = (node: LocationNode): LocationNode | undefined => {
    let cur: LocationNode | undefined = node;
    while (cur && cur.type !== 'city') cur = cur.parentKey ? LOCATION_INDEX.get(cur.parentKey) : undefined;
    return cur;
  };
  const reqCity = cityOf(requested);
  const obsCity = cityOf(observed);
  if (reqCity && obsCity && reqCity.key === obsCity.key) {
    return { level: 'same_city' };
  }

  const reqState = stateOf(requested.key);
  const obsState = stateOf(observed.key);
  if (reqState && obsState && reqState.key === obsState.key) {
    return {
      level: 'same_state',
      substitutionNotice: `Price observed elsewhere in ${reqState.label}; local transport may change the delivered cost.`,
    };
  }

  if (reqState && obsState && (NEARBY_STATES[reqState.key] ?? []).includes(obsState.key)) {
    return {
      level: 'nearby_state',
      substitutionNotice: `No sufficiently recent listing in ${reqState.label}. Range based on nearby ${obsState.label} sellers and may exclude transportation.`,
    };
  }

  if (nationalDelivery) {
    return {
      level: 'national',
      substitutionNotice:
        'Based on national sellers that deliver to your area. Delivery cost is usually excluded from the listed price.',
    };
  }

  return {
    level: 'insufficient',
    substitutionNotice:
      'No sufficiently recent listing was found for the selected area, and no national-delivery seller was observed.',
  };
}
