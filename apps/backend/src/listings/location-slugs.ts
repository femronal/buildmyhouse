const STATES = [
  'abia', 'adamawa', 'akwa ibom', 'anambra', 'bauchi', 'bayelsa', 'benue', 'borno',
  'cross river', 'delta', 'ebonyi', 'edo', 'ekiti', 'enugu', 'fct', 'gombe', 'imo',
  'jigawa', 'kaduna', 'kano', 'katsina', 'kebbi', 'kogi', 'kwara', 'lagos', 'nasarawa',
  'niger', 'ogun', 'ondo', 'osun', 'oyo', 'plateau', 'rivers', 'sokoto', 'taraba', 'yobe', 'zamfara',
];

const AREAS: Record<string, { state: string; lga: string }> = {
  mowe: { state: 'ogun', lga: 'obafemi-owode' },
  ibafo: { state: 'ogun', lga: 'obafemi-owode' },
  lekki: { state: 'lagos', lga: 'eti-osa' },
  ajah: { state: 'lagos', lga: 'eti-osa' },
  ikoyi: { state: 'lagos', lga: 'eti-osa' },
  yaba: { state: 'lagos', lga: 'lagos-mainland' },
  gwarinpa: { state: 'fct', lga: 'abuja-municipal' },
  lugbe: { state: 'fct', lga: 'abuja-municipal' },
  kubwa: { state: 'fct', lga: 'bwari' },
  maitama: { state: 'fct', lga: 'abuja-municipal' },
  wuse: { state: 'fct', lga: 'abuja-municipal' },
};

export function locationSlugsFromText(raw?: string | null) {
  const text = String(raw || '').toLowerCase().replace(/[.,]/g, ' ');
  let stateSlug: string | null = null;
  if (text.includes('abuja') || text.includes('federal capital')) stateSlug = 'fct';
  for (const state of STATES) {
    if (text.includes(state)) stateSlug = state.replace(/\s+/g, '-');
  }
  let lgaSlug: string | null = null;
  let areaSlug: string | null = null;
  for (const [area, parent] of Object.entries(AREAS)) {
    if (text.includes(area)) {
      areaSlug = area;
      lgaSlug = parent.lga;
      stateSlug = parent.state;
    }
  }
  return { stateSlug, lgaSlug, areaSlug };
}
