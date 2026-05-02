export type BuildOpportunityCategoryKey =
  | 'residential'
  | 'commercial'
  | 'heavy_civil_construction'
  | 'industrial_construction'
  | 'environmental_construction';

export type BuildOpportunityTypeOption = {
  value: string;
  label: string;
};

export const BUILD_OPPORTUNITY_CATEGORY_OPTIONS: Array<{
  value: BuildOpportunityCategoryKey;
  label: string;
}> = [
  { value: 'residential', label: 'Residential' },
  { value: 'commercial', label: 'Commercial' },
  { value: 'heavy_civil_construction', label: 'Heavy Civil Construction' },
  { value: 'industrial_construction', label: 'Industrial Construction' },
  { value: 'environmental_construction', label: 'Environmental Construction' },
];

export const BUILD_OPPORTUNITY_TYPE_OPTIONS: Record<
  BuildOpportunityCategoryKey,
  BuildOpportunityTypeOption[]
> = {
  residential: [
    { value: 'bungalow', label: 'Bungalow' },
    { value: 'apartment_block', label: 'Apartment Block' },
    { value: 'duplex', label: 'Duplex' },
    { value: 'terrace', label: 'Terrace' },
    { value: 'mini_estate', label: 'Mini Estate' },
    { value: 'student_housing', label: 'Student Housing' },
  ],
  commercial: [
    { value: 'bank_branch', label: 'Bank Branch' },
    { value: 'school_campus', label: 'School Campus' },
    { value: 'hotel', label: 'Hotel' },
    { value: 'shopping_mall', label: 'Shopping Mall' },
    { value: 'religious_facility', label: 'Religious Facility' },
    { value: 'event_theatre', label: 'Theatre/Event Centre' },
    { value: 'university_facility', label: 'University Facility' },
    { value: 'football_stadium', label: 'Football Stadium' },
    { value: 'amusement_park', label: 'Amusement Park' },
    { value: 'office_complex', label: 'Office Complex' },
  ],
  heavy_civil_construction: [
    { value: 'roadway', label: 'Roadway' },
    { value: 'bridge', label: 'Bridge' },
    { value: 'drainage_channel', label: 'Drainage Channel' },
    { value: 'culvert', label: 'Culvert' },
    { value: 'estate_access_road', label: 'Estate Access Road' },
    { value: 'retaining_wall', label: 'Retaining Wall' },
    { value: 'small_dam', label: 'Small Dam' },
  ],
  industrial_construction: [
    { value: 'manufacturing_plant', label: 'Manufacturing Plant' },
    { value: 'oil_refinery', label: 'Oil Refinery' },
    { value: 'power_generation_facility', label: 'Power Generation Facility' },
    { value: 'pipeline_infrastructure', label: 'Pipeline Infrastructure' },
    { value: 'steel_mill', label: 'Steel Mill' },
    { value: 'chemical_processing_plant', label: 'Chemical Processing Plant' },
    { value: 'cold_storage_facility', label: 'Cold Storage Facility' },
  ],
  environmental_construction: [
    { value: 'clean_water_system', label: 'Clean Water System' },
    { value: 'sanitary_sewer_system', label: 'Sanitary Sewer System' },
    { value: 'waste_management_system', label: 'Waste Management System' },
    { value: 'flood_control', label: 'Flood Control' },
    { value: 'stormwater_network', label: 'Stormwater Network' },
    { value: 'water_treatment_plant', label: 'Water Treatment Plant' },
  ],
};

export function slugifyBuildOpportunityType(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

