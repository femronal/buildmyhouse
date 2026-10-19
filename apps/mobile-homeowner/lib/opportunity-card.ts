const HOUSE_TYPES = ['bungalow', 'duplex', 'apartment', 'terrace', 'semi-detached', 'semi detached', 'flat', 'mini estate'];

export function locationMatchesState(location: string, state: string) {
  if (state === 'All') return true;
  const text = location.toLowerCase();
  if (state === 'FCT') return text.includes('fct') || text.includes('abuja') || text.includes('federal capital');
  return text.includes(state.toLowerCase());
}

export function sourceLabel(source: 'rental' | 'house' | 'land') {
  if (source === 'rental') return 'Rental';
  if (source === 'house') return 'For sale';
  return 'Land';
}

export function secondaryListingLabel(params: {
  source: 'rental' | 'house' | 'land';
  title: string;
  propertyType?: string | null;
  zoningType?: string | null;
  opportunityType?: string | null;
}) {
  const stored = params.source === 'land' ? params.zoningType || params.opportunityType : params.propertyType;
  const value = String(stored || '').trim();
  if (!value) return '';
  const lower = value.toLowerCase();
  const title = params.title.toLowerCase();
  const contradicts =
    (params.source === 'land' && HOUSE_TYPES.some((type) => lower.includes(type))) ||
    (params.source === 'rental' && lower.includes('apartment') && title.includes('commercial'));
  if (contradicts) {
    if (typeof console !== 'undefined' && process.env.NODE_ENV !== 'production') {
      console.warn('[opportunity label]', {
        source: params.source,
        title: params.title,
        field: params.source === 'land' ? 'opportunityType/zoningType' : 'propertyType',
        value,
      });
    }
    return '';
  }
  return value;
}

export function specsLine(params: {
  source: 'rental' | 'house' | 'land';
  bedrooms?: number | null;
  bathrooms?: number | null;
  size?: number | null;
  sizeUnit: 'm²' | 'sqm';
}) {
  const parts: string[] = [];
  if (params.source !== 'land' && Number(params.bedrooms) > 0) parts.push(`${params.bedrooms} bed`);
  if (params.source !== 'land' && Number(params.bathrooms) > 0) parts.push(`${params.bathrooms} bath`);
  if (Number(params.size) > 0) parts.push(`${params.size}${params.sizeUnit === 'sqm' ? ' sqm' : 'm²'}`);
  return parts.join(' · ');
}
