/** Official 36 states + FCT — required for nationwide project coverage. */
export const NIGERIA_STATES = [
  'Abia',
  'Adamawa',
  'Akwa Ibom',
  'Anambra',
  'Bauchi',
  'Bayelsa',
  'Benue',
  'Borno',
  'Cross River',
  'Delta',
  'Ebonyi',
  'Edo',
  'Ekiti',
  'Enugu',
  'FCT',
  'Gombe',
  'Imo',
  'Jigawa',
  'Kaduna',
  'Kano',
  'Katsina',
  'Kebbi',
  'Kogi',
  'Kwara',
  'Lagos',
  'Nasarawa',
  'Niger',
  'Ogun',
  'Ondo',
  'Osun',
  'Oyo',
  'Plateau',
  'Rivers',
  'Sokoto',
  'Taraba',
  'Yobe',
  'Zamfara',
] as const;

export type NigeriaState = (typeof NIGERIA_STATES)[number];

export const DEFAULT_NIGERIA_STATE: NigeriaState = 'Lagos';

/** Approximate state capital / primary coords for globe preview before area confirm. */
export const NIGERIA_STATE_COORDS: Record<NigeriaState, { lat: number; lon: number }> = {
  Abia: { lat: 5.4527, lon: 7.5248 },
  Adamawa: { lat: 9.3265, lon: 12.3984 },
  'Akwa Ibom': { lat: 5.0377, lon: 7.9128 },
  Anambra: { lat: 6.2101, lon: 7.0741 },
  Bauchi: { lat: 10.3158, lon: 9.8442 },
  Bayelsa: { lat: 4.7719, lon: 6.0699 },
  Benue: { lat: 7.3369, lon: 8.7404 },
  Borno: { lat: 11.8333, lon: 13.15 },
  'Cross River': { lat: 4.9757, lon: 8.3417 },
  Delta: { lat: 5.704, lon: 5.9339 },
  Ebonyi: { lat: 6.2649, lon: 8.0137 },
  Edo: { lat: 6.335, lon: 5.6037 },
  Ekiti: { lat: 7.6233, lon: 5.2209 },
  Enugu: { lat: 6.4584, lon: 7.5464 },
  FCT: { lat: 9.0765, lon: 7.3986 },
  Gombe: { lat: 10.2897, lon: 11.171 },
  Imo: { lat: 5.485, lon: 7.035 },
  Jigawa: { lat: 12.4478, lon: 9.3385 },
  Kaduna: { lat: 10.5222, lon: 7.4384 },
  Kano: { lat: 12.0022, lon: 8.592 },
  Katsina: { lat: 12.9908, lon: 7.6018 },
  Kebbi: { lat: 12.4539, lon: 4.1975 },
  Kogi: { lat: 7.8, lon: 6.7333 },
  Kwara: { lat: 8.4966, lon: 4.5421 },
  Lagos: { lat: 6.5244, lon: 3.3792 },
  Nasarawa: { lat: 8.5378, lon: 8.2924 },
  Niger: { lat: 9.9309, lon: 5.5983 },
  Ogun: { lat: 7.1608, lon: 3.3483 },
  Ondo: { lat: 7.2571, lon: 5.2058 },
  Osun: { lat: 7.5629, lon: 4.52 },
  Oyo: { lat: 7.3775, lon: 3.947 },
  Plateau: { lat: 9.8965, lon: 8.8583 },
  Rivers: { lat: 4.8156, lon: 7.0498 },
  Sokoto: { lat: 13.0059, lon: 5.2476 },
  Taraba: { lat: 8.8932, lon: 11.377 },
  Yobe: { lat: 11.746, lon: 11.966 },
  Zamfara: { lat: 12.1704, lon: 6.2376 },
};

const STATE_ALIASES: Record<string, NigeriaState> = {
  lagos: 'Lagos',
  'lagos state': 'Lagos',
  abuja: 'FCT',
  fct: 'FCT',
  'federal capital territory': 'FCT',
  'abuja fct': 'FCT',
  'akwa ibom': 'Akwa Ibom',
  'akwa-ibom': 'Akwa Ibom',
  'cross river': 'Cross River',
  'cross-river': 'Cross River',
};

export function normalizeNigeriaStateName(raw?: string | null): NigeriaState | null {
  const value = String(raw || '')
    .trim()
    .toLowerCase()
    .replace(/\s+state$/i, '')
    .replace(/\s+/g, ' ');
  if (!value) return null;

  if (STATE_ALIASES[value]) return STATE_ALIASES[value];

  const exact = NIGERIA_STATES.find((state) => state.toLowerCase() === value);
  if (exact) return exact;

  const partial = NIGERIA_STATES.find(
    (state) => value.includes(state.toLowerCase()) || state.toLowerCase().includes(value),
  );
  return partial || null;
}

export function isNigeriaCountry(countryOrCode?: string | null): boolean {
  const value = String(countryOrCode || '')
    .trim()
    .toLowerCase();
  if (!value) return false;
  return value === 'ng' || value === 'nga' || value.includes('nigeria');
}

export function matchNigeriaStateFromText(...parts: Array<string | null | undefined>): NigeriaState | null {
  for (const part of parts) {
    const matched = normalizeNigeriaStateName(part);
    if (matched) return matched;
  }
  // Fall back to scanning full combined string for any known state name
  const haystack = parts
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
  if (!haystack) return null;
  for (const state of NIGERIA_STATES) {
    if (haystack.includes(state.toLowerCase())) return state;
  }
  if (haystack.includes('abuja') || haystack.includes('federal capital')) return 'FCT';
  return null;
}

export function formatNigeriaLocationLabel(area: string, state: NigeriaState): string {
  const cleaned = area.trim();
  if (!cleaned) return `${state}, Nigeria`;
  if (cleaned.toLowerCase() === state.toLowerCase() || cleaned.toLowerCase() === 'nigeria') {
    return `${state}, Nigeria`;
  }
  return `${cleaned}, ${state}`;
}

export function formatNigeriaAddress(area: string, state: NigeriaState): string {
  const cleaned = area.trim();
  if (!cleaned || cleaned.toLowerCase() === state.toLowerCase()) {
    return `${state}, Nigeria`;
  }
  return `${cleaned}, ${state}, Nigeria`;
}

export function areaPlaceholderForState(state: NigeriaState): string {
  const examples: Partial<Record<NigeriaState, string>> = {
    Lagos: 'Surulere',
    FCT: 'Wuse',
    Rivers: 'PH City',
    Oyo: 'Bodija',
    Kano: 'Nassarawa',
    Ogun: 'Abeokuta',
    Enugu: 'New Haven',
    Anambra: 'Awka',
    Delta: 'Asaba',
  };
  // Keep short so it fits beside the state chip on narrow screens.
  return `e.g. ${examples[state] || 'area / LGA'}`;
}
