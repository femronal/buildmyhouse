export type BuildOpportunityCategoryKey =
  | 'residential'
  | 'commercial'
  | 'heavy_civil_construction'
  | 'industrial_construction'
  | 'environmental_construction';

export const BUILD_OPPORTUNITY_CATEGORIES: Array<{
  key: BuildOpportunityCategoryKey;
  label: string;
}> = [
  { key: 'residential', label: 'Residential' },
  { key: 'commercial', label: 'Commercial' },
  { key: 'heavy_civil_construction', label: 'Heavy Civil Construction' },
  { key: 'industrial_construction', label: 'Industrial Construction' },
  { key: 'environmental_construction', label: 'Environmental Construction' },
];

export const BUILD_OPPORTUNITY_FILTERS: Record<BuildOpportunityCategoryKey, string[]> = {
  residential: ['bungalow', 'apartment_block', 'duplex', 'terrace', 'mini_estate', 'student_housing'],
  commercial: [
    'bank_branch',
    'school_campus',
    'hotel',
    'shopping_mall',
    'religious_facility',
    'event_theatre',
    'university_facility',
    'football_stadium',
    'amusement_park',
    'office_complex',
  ],
  heavy_civil_construction: ['roadway', 'bridge', 'drainage_channel', 'culvert', 'estate_access_road', 'retaining_wall', 'small_dam'],
  industrial_construction: [
    'manufacturing_plant',
    'oil_refinery',
    'power_generation_facility',
    'pipeline_infrastructure',
    'steel_mill',
    'chemical_processing_plant',
    'cold_storage_facility',
  ],
  environmental_construction: [
    'clean_water_system',
    'sanitary_sewer_system',
    'waste_management_system',
    'flood_control',
    'stormwater_network',
    'water_treatment_plant',
  ],
};

export function formatBuildOpportunityKey(value?: string | null): string {
  const cleaned = String(value || '').trim();
  if (!cleaned) return 'Unspecified';
  return cleaned
    .replace(/_/g, ' ')
    .split(' ')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

