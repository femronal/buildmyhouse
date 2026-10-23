import { NIGERIA_STATES, POPULAR_AREA_ALIASES, normalizeLocationText, resolvePopularAreaToLga } from './nigeria-lgas';

const FCT_VALUES = [
  'FCT',
  'fct',
  'ng-fct',
  'Abuja',
  'abuja',
  'ng-abuja',
  'Abuja / FCT',
  'Abuja (FCT)',
  'Abuja FCT',
  'Federal Capital Territory',
];

function isFct(key: string): boolean {
  return (
    key === 'fct' ||
    key === 'ng-fct' ||
    key === 'abuja' ||
    key === 'ng-abuja' ||
    key === 'abuja / fct' ||
    key === 'abuja (fct)' ||
    key === 'abuja fct' ||
    key === 'abuja-fct' ||
    key === 'federal capital territory' ||
    key === 'ng-fct-abuja'
  );
}

/** Values a directory filter should accept for one selected state. */
export function directoryLocationValues(input: string): string[] {
  const trimmed = input.trim();
  if (!trimmed) return [];
  const key = trimmed.toLowerCase().replace(/\s+/g, ' ');
  const values = new Set<string>([trimmed]);
  if (isFct(key)) {
    FCT_VALUES.forEach((value) => values.add(value));
  }
  const bare = key.replace(/^ng-/, '').replace(/-/g, ' ');
  if (bare && bare !== key) {
    values.add(bare);
    values.add(bare.replace(/\b[a-z]/g, (char) => char.toUpperCase()));
  }
  return [...values];
}

/** Display name used by the state and LGA lists: "ng-lagos" and "lagos" both become "Lagos". */
export function canonicalDirectoryState(input?: string | null): string | null {
  const trimmed = String(input || '').trim();
  if (!trimmed) return null;
  const key = trimmed.toLowerCase().replace(/^ng-/, '').replace(/-/g, ' ').replace(/\s+/g, ' ');
  if (isFct(key) || isFct(trimmed.toLowerCase().replace(/\s+/g, ' '))) return 'FCT';
  return NIGERIA_STATES.find((state) => state.toLowerCase() === key) || null;
}

/**
 * Names that should match one selected area.
 * A popular name such as Lekki also matches its LGA, and choosing that LGA matches the popular names stored on listings.
 */
export function directoryAreaValues(stateInput: string | undefined, area: string): string[] {
  const trimmed = area.trim();
  if (!trimmed) return [];
  const values = new Set<string>([trimmed]);
  const state = canonicalDirectoryState(stateInput);
  if (!state) return [...values];
  const parent = resolvePopularAreaToLga(state, trimmed);
  if (parent) values.add(parent);
  const selected = normalizeLocationText(trimmed);
  for (const item of POPULAR_AREA_ALIASES[state] || []) {
    if (normalizeLocationText(item.area) === selected || normalizeLocationText(item.lga) === selected) {
      values.add(item.area);
      values.add(item.lga);
    }
  }
  return [...values];
}
