/** All 20 Local Government Areas in Lagos State, Nigeria. */
export const LAGOS_LGAS = [
  'Agege',
  'Ajeromi-Ifelodun',
  'Alimosho',
  'Amuwo-Odofin',
  'Apapa',
  'Badagry',
  'Epe',
  'Eti-Osa',
  'Ibeju-Lekki',
  'Ifako-Ijaiye',
  'Ikeja',
  'Ikorodu',
  'Kosofe',
  'Lagos Island',
  'Lagos Mainland',
  'Mushin',
  'Ojo',
  'Oshodi-Isolo',
  'Shomolu',
  'Surulere',
] as const;

export type LagosLga = (typeof LAGOS_LGAS)[number];

export const ALL_LOCATIONS_FILTER = 'All Locations';

/** Common Lagos area names mapped to their LGA for matching free-text contractor locations. */
const LAGOS_AREA_TO_LGA: ReadonlyArray<readonly [string, LagosLga]> = [
  ['unilag', 'Kosofe'],
  ['university of lagos', 'Kosofe'],
  ['akoka', 'Kosofe'],
  ['yaba', 'Lagos Mainland'],
  ['surulere', 'Surulere'],
  ['ikeja', 'Ikeja'],
  ['victoria island', 'Eti-Osa'],
  ['vi', 'Eti-Osa'],
  ['lekki', 'Eti-Osa'],
  ['ajah', 'Eti-Osa'],
  ['ikoyi', 'Lagos Island'],
  ['marina', 'Lagos Island'],
  ['island', 'Lagos Island'],
  ['mainland', 'Lagos Mainland'],
  ['ikeja gra', 'Ikeja'],
  ['magodo', 'Kosofe'],
  ['ogba', 'Ikeja'],
  ['alausa', 'Ikeja'],
  ['gbagada', 'Kosofe'],
  ['maryland', 'Kosofe'],
  ['anthony', 'Kosofe'],
  ['ilupeju', 'Mushin'],
  ['oshodi', 'Oshodi-Isolo'],
  ['isolo', 'Oshodi-Isolo'],
  ['mushin', 'Mushin'],
  ['apapa', 'Apapa'],
  ['festac', 'Amuwo-Odofin'],
  ['amuwo', 'Amuwo-Odofin'],
  ['satellite town', 'Amuwo-Odofin'],
  ['badagry', 'Badagry'],
  ['epe', 'Epe'],
  ['ibeju', 'Ibeju-Lekki'],
  ['ikorodu', 'Ikorodu'],
  ['agege', 'Agege'],
  ['alimosho', 'Alimosho'],
  ['egbeda', 'Alimosho'],
  ['iyana ipaja', 'Alimosho'],
  ['ojo', 'Ojo'],
  ['ajeromi', 'Ajeromi-Ifelodun'],
  ['ifako', 'Ifako-Ijaiye'],
  ['shomolu', 'Shomolu'],
  ['bariga', 'Shomolu'],
];

export function normalizeLocationText(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function resolveLagosLga(location: string): LagosLga | null {
  const normalized = normalizeLocationText(location);
  if (!normalized) return null;

  for (const lga of LAGOS_LGAS) {
    if (normalized.includes(normalizeLocationText(lga))) {
      return lga;
    }
  }

  for (const [area, lga] of LAGOS_AREA_TO_LGA) {
    const normalizedArea = normalizeLocationText(area);
    if (normalized === normalizedArea || normalized.includes(normalizedArea)) {
      return lga;
    }
  }

  return null;
}

export function locationMatchesLgaFilter(location: string, lgaFilter: string): boolean {
  if (lgaFilter === ALL_LOCATIONS_FILTER) return true;

  const normalizedLocation = normalizeLocationText(location);
  const normalizedFilter = normalizeLocationText(lgaFilter);
  if (!normalizedLocation) return false;

  if (normalizedLocation.includes(normalizedFilter)) return true;

  const resolved = resolveLagosLga(location);
  return resolved === lgaFilter;
}
