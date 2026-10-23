import { NIGERIA_STATES } from '@/lib/nigeria-lgas';

const FCT_KEYS = new Set([
  'fct',
  'ng-fct',
  'abuja',
  'ng-abuja',
  'abuja / fct',
  'abuja (fct)',
  'abuja fct',
  'abuja-fct',
  'federal capital territory',
]);

/** "ng-lagos", "lagos", and "Lagos" all become "Lagos". Unknown text stays as written. */
export function directoryStateName(input?: string | null): string {
  const trimmed = String(input || '').trim();
  if (!trimmed || trimmed.toLowerCase() === 'all') return 'All';
  const key = trimmed.toLowerCase().replace(/^ng-/, '').replace(/-/g, ' ').replace(/\s+/g, ' ');
  if (FCT_KEYS.has(trimmed.toLowerCase().replace(/\s+/g, ' ')) || FCT_KEYS.has(key)) return 'FCT';
  return NIGERIA_STATES.find((state) => state.toLowerCase() === key) || trimmed;
}

export function directoryStateLabel(input?: string | null): string | undefined {
  const name = directoryStateName(input);
  if (name === 'All') return undefined;
  if (name === 'FCT') return 'Abuja / FCT';
  return name;
}

export function professionalStateParam(stateName: string): string {
  if (!stateName || stateName === 'All') return '';
  if (stateName === 'FCT') return 'fct';
  return stateName.toLowerCase().replace(/\s+/g, '-');
}

export function vendorStateParam(stateName: string): string {
  if (!stateName || stateName === 'All') return '';
  if (stateName === 'FCT') return 'ng-fct';
  return `ng-${stateName.toLowerCase().replace(/\s+/g, '-')}`;
}
