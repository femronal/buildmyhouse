import type { BuildOpportunityCategoryKey } from './build-opportunity-taxonomy';

export type OpportunityEntity = 'house' | 'land' | 'rental';

export type OpportunityFieldKind =
  | 'text'
  | 'textarea'
  | 'number'
  | 'currency'
  | 'percent'
  | 'comma-list';

export type OpportunityFieldDef = {
  key: string;
  label: string;
  kind: OpportunityFieldKind;
  required?: boolean;
  placeholder?: string;
  helpText?: string;
  gridSpan?: 1 | 2 | 3 | 4;
  min?: number;
};

export type OpportunityCheckRowDef = {
  fieldKey: string;
  label: string;
  icon: string;
  fallback?: string;
  format?: 'text' | 'currency' | 'number' | 'sqm' | 'percent';
};

export type OpportunityProfileSection = {
  id: string;
  title: string;
  subtitle?: string;
  icon?: string;
  fields: OpportunityFieldDef[];
};

export type OpportunityProfile = {
  entity: OpportunityEntity;
  category: BuildOpportunityCategoryKey;
  entityLabel: string;
  formIntro: string;
  snapshotIntro: string;
  checksTitle: string;
  verificationTitle: string;
  verificationDocField: string;
  verificationExtraField?: string;
  verificationDocLabel: string;
  verificationExtraLabel?: string;
  sections: OpportunityProfileSection[];
  checkRows: OpportunityCheckRowDef[];
  snapshotRows: OpportunityCheckRowDef[];
};

const ALL_CATEGORIES: BuildOpportunityCategoryKey[] = [
  'residential',
  'commercial',
  'heavy_civil_construction',
  'industrial_construction',
  'environmental_construction',
];

const HOUSE_BASE: OpportunityFieldDef[] = [
  {
    key: 'name',
    label: 'Listing name',
    kind: 'text',
    required: true,
    placeholder: 'e.g. 4-Bedroom Semi-Detached Duplex in Surulere',
    gridSpan: 2,
  },
  {
    key: 'description',
    label: 'Investment narrative',
    kind: 'textarea',
    placeholder: 'Explain why this property is worth inspecting — location upside, income potential, finish level.',
    gridSpan: 2,
  },
  {
    key: 'location',
    label: 'Location',
    kind: 'text',
    required: true,
    placeholder: 'e.g. Surulere, Lagos',
    gridSpan: 2,
  },
  {
    key: 'price',
    label: 'Asking price (₦)',
    kind: 'currency',
    required: true,
    placeholder: '290000000',
  },
];

const LAND_BASE: OpportunityFieldDef[] = [
  {
    key: 'name',
    label: 'Plot name',
    kind: 'text',
    required: true,
    placeholder: 'e.g. Corner plot on Bode Thomas',
    gridSpan: 2,
  },
  {
    key: 'description',
    label: 'Land opportunity brief',
    kind: 'textarea',
    placeholder: 'Describe development potential, access, and why this parcel stands out.',
    gridSpan: 2,
  },
  {
    key: 'location',
    label: 'Location',
    kind: 'text',
    required: true,
    placeholder: 'e.g. Ikeja GRA, Lagos',
    gridSpan: 2,
  },
  {
    key: 'price',
    label: 'Asking price (₦)',
    kind: 'currency',
    required: true,
    placeholder: '85000000',
  },
  {
    key: 'sizeSqm',
    label: 'Plot size (sqm)',
    kind: 'number',
    required: true,
    placeholder: '600',
    min: 1,
  },
];

const RENTAL_BASE: OpportunityFieldDef[] = [
  {
    key: 'title',
    label: 'Listing title',
    kind: 'text',
    required: true,
    placeholder: 'e.g. Serviced 3-bed apartment in Lekki Phase 1',
    gridSpan: 2,
  },
  {
    key: 'description',
    label: 'Lease overview',
    kind: 'textarea',
    placeholder: 'Summarize fit-out, tenant profile, and why this lease is investable.',
    gridSpan: 2,
  },
  {
    key: 'location',
    label: 'Location',
    kind: 'text',
    required: true,
    placeholder: 'e.g. Lekki Phase 1, Lagos',
    gridSpan: 2,
  },
  {
    key: 'propertyType',
    label: 'Property type',
    kind: 'text',
    required: true,
    placeholder: 'e.g. Apartment, Office suite, Warehouse',
  },
];

const CONTACT_FIELDS: OpportunityFieldDef[] = [
  {
    key: 'contactName',
    label: 'Seller contact name',
    kind: 'text',
    placeholder: 'e.g. Femi Okunola',
  },
  {
    key: 'contactPhone',
    label: 'Seller contact phone',
    kind: 'text',
    placeholder: 'e.g. +2348139036559',
  },
];

function houseResidentialFields(): OpportunityFieldDef[] {
  return [
    { key: 'bedrooms', label: 'Bedrooms', kind: 'number', required: true, min: 1 },
    { key: 'bathrooms', label: 'Bathrooms', kind: 'number', required: true, min: 1 },
    { key: 'squareFootage', label: 'Sq ft', kind: 'number', required: true, min: 1 },
    { key: 'squareMeters', label: 'Sq m', kind: 'number', min: 0 },
    { key: 'condition', label: 'Condition', kind: 'text', placeholder: 'Move-in ready / Needs light finishing' },
    { key: 'propertyType', label: 'Property style', kind: 'text', placeholder: 'Semi-detached duplex' },
    { key: 'yearBuilt', label: 'Year built', kind: 'number', min: 1900 },
    { key: 'parking', label: 'Parking spaces', kind: 'number', min: 0 },
    {
      key: 'documents',
      label: 'Title & compliance docs',
      kind: 'comma-list',
      placeholder: 'Land Certificate, Survey Plan, Building Approval',
      gridSpan: 2,
    },
    {
      key: 'amenities',
      label: 'Interior & lifestyle features',
      kind: 'comma-list',
      placeholder: 'Gated community, BQ, fitted kitchen, walk-in closets',
      gridSpan: 2,
    },
    {
      key: 'nearbyFacilities',
      label: 'Nearby landmarks',
      kind: 'comma-list',
      placeholder: 'National Stadium, Yaba access, Lagos Island routes',
      gridSpan: 2,
    },
  ];
}

function houseCommercialFields(): OpportunityFieldDef[] {
  return [
    { key: 'squareMeters', label: 'Lettable area (sqm)', kind: 'number', required: true, min: 1 },
    { key: 'squareFootage', label: 'Lettable area (sq ft)', kind: 'number', min: 1 },
    { key: 'bedrooms', label: 'Units / floors', kind: 'number', min: 0, placeholder: 'Optional' },
    { key: 'bathrooms', label: 'WCs / cores', kind: 'number', min: 0, placeholder: 'Optional' },
    { key: 'condition', label: 'Building status', kind: 'text', placeholder: 'Shell & core / Fully fitted' },
    { key: 'propertyType', label: 'Asset class', kind: 'text', placeholder: 'Office block, retail plaza' },
    { key: 'yearBuilt', label: 'Year completed', kind: 'number', min: 1900 },
    { key: 'parking', label: 'Parking bays', kind: 'number', min: 0 },
    {
      key: 'documents',
      label: 'Compliance & title docs',
      kind: 'comma-list',
      placeholder: 'C of O, Occupancy cert, Tenancy roll',
      gridSpan: 2,
    },
    {
      key: 'amenities',
      label: 'Building features',
      kind: 'comma-list',
      placeholder: 'Generator plant, lift bank, fire suppression',
      gridSpan: 2,
    },
    {
      key: 'nearbyFacilities',
      label: 'Catchment & footfall',
      kind: 'comma-list',
      placeholder: 'CBD proximity, anchor tenants nearby',
      gridSpan: 2,
    },
  ];
}

function houseInfrastructureFields(category: BuildOpportunityCategoryKey): OpportunityFieldDef[] {
  const scopeLabel =
    category === 'heavy_civil_construction'
      ? 'Project footprint (sqm)'
      : category === 'industrial_construction'
        ? 'Site area (sqm)'
        : 'Program area (sqm)';

  return [
    { key: 'squareMeters', label: scopeLabel, kind: 'number', required: true, min: 1 },
    { key: 'squareFootage', label: 'Equivalent sq ft', kind: 'number', min: 1 },
    {
      key: 'condition',
      label: 'Delivery status',
      kind: 'text',
      placeholder: 'Greenfield / Partially complete / Turnkey',
    },
    {
      key: 'propertyType',
      label: 'Asset subtype',
      kind: 'text',
      placeholder: 'Road corridor, treatment plant, plant hall',
    },
    { key: 'yearBuilt', label: 'Expected completion year', kind: 'number', min: 2020 },
    { key: 'parking', label: 'Staging / laydown area', kind: 'text', placeholder: 'On-site / Adjacent' },
    {
      key: 'documents',
      label: 'Permits & approvals',
      kind: 'comma-list',
      placeholder: 'EIA, building permit, engineering drawings',
      gridSpan: 2,
    },
    {
      key: 'amenities',
      label: 'Scope deliverables',
      kind: 'comma-list',
      placeholder: 'Civil works, MEP packages, commissioning',
      gridSpan: 2,
    },
    {
      key: 'nearbyFacilities',
      label: 'Site context',
      kind: 'comma-list',
      placeholder: 'Utility tie-ins, logistics routes, community interfaces',
      gridSpan: 2,
    },
  ];
}

function landResidentialFields(): OpportunityFieldDef[] {
  return [
    { key: 'titleDocument', label: 'Title document', kind: 'text', placeholder: 'C of O / Deed of Assignment' },
    { key: 'zoningType', label: 'Zoning / land use', kind: 'text', placeholder: 'Residential / Mixed use' },
    { key: 'topography', label: 'Topography', kind: 'text', placeholder: 'Flat / Gentle slope' },
    { key: 'roadAccess', label: 'Road access', kind: 'text', placeholder: 'Tarred dual carriageway' },
    { key: 'ownershipType', label: 'Ownership type', kind: 'text', placeholder: 'Freehold / Leasehold' },
    {
      key: 'documents',
      label: 'Verification documents',
      kind: 'comma-list',
      placeholder: 'Survey plan, Governor’s consent, tax receipt',
      gridSpan: 2,
    },
    {
      key: 'nearbyLandmarks',
      label: 'Nearby landmarks',
      kind: 'comma-list',
      placeholder: 'Shopping mall, school district, expressway',
      gridSpan: 2,
    },
    {
      key: 'restrictions',
      label: 'Use restrictions',
      kind: 'comma-list',
      placeholder: 'Setback rules, max floors, estate covenants',
      gridSpan: 2,
    },
  ];
}

function landCommercialFields(): OpportunityFieldDef[] {
  return [
    { key: 'titleDocument', label: 'Title document', kind: 'text', placeholder: 'C of O / Registered deed' },
    { key: 'zoningType', label: 'Permitted commercial use', kind: 'text', placeholder: 'Retail / Office / Mixed' },
    { key: 'topography', label: 'Grade & drainage', kind: 'text', placeholder: 'Level pad / Requires cut & fill' },
    { key: 'roadAccess', label: 'Frontage & access', kind: 'text', placeholder: 'Dual frontage on arterial road' },
    { key: 'ownershipType', label: 'Tenure', kind: 'text', placeholder: 'Freehold / 99-year lease' },
    {
      key: 'documents',
      label: 'Due diligence pack',
      kind: 'comma-list',
      placeholder: 'Survey, zoning letter, infrastructure levy receipt',
      gridSpan: 2,
    },
    {
      key: 'nearbyLandmarks',
      label: 'Trade area anchors',
      kind: 'comma-list',
      placeholder: 'Bank branches, hotels, transit nodes',
      gridSpan: 2,
    },
    {
      key: 'restrictions',
      label: 'Development constraints',
      kind: 'comma-list',
      placeholder: 'Height cap, parking ratio, setback',
      gridSpan: 2,
    },
  ];
}

function landInfrastructureFields(category: BuildOpportunityCategoryKey): OpportunityFieldDef[] {
  const zoningLabel =
    category === 'environmental_construction'
      ? 'Environmental designation'
      : category === 'industrial_construction'
        ? 'Industrial zoning'
        : 'Infrastructure corridor';

  return [
    { key: 'titleDocument', label: 'Land title', kind: 'text', placeholder: 'C of O / Gazette / Right of way' },
    { key: 'zoningType', label: zoningLabel, kind: 'text', placeholder: 'Utility corridor / Industrial estate' },
    { key: 'topography', label: 'Terrain profile', kind: 'text', placeholder: 'Low-lying / Elevated bench' },
    { key: 'roadAccess', label: 'Access for heavy plant', kind: 'text', placeholder: 'Haul road / Dual carriageway' },
    { key: 'ownershipType', label: 'Tenure & encumbrances', kind: 'text', placeholder: 'State lease / Community consent' },
    {
      key: 'documents',
      label: 'Permits & surveys',
      kind: 'comma-list',
      placeholder: 'EIA, geotechnical report, cadastral survey',
      gridSpan: 2,
    },
    {
      key: 'nearbyLandmarks',
      label: 'Utility tie-ins',
      kind: 'comma-list',
      placeholder: 'Transmission line, treatment plant, port access',
      gridSpan: 2,
    },
    {
      key: 'restrictions',
      label: 'Environmental & social safeguards',
      kind: 'comma-list',
      placeholder: 'Setback from watercourse, community MOU',
      gridSpan: 2,
    },
  ];
}

function rentalResidentialFields(): OpportunityFieldDef[] {
  return [
    { key: 'annualRent', label: 'Annual rent (₦)', kind: 'currency', required: true },
    { key: 'serviceCharge', label: 'Service charge (₦)', kind: 'currency', required: true },
    { key: 'cautionDeposit', label: 'Caution deposit (₦)', kind: 'currency', required: true },
    { key: 'legalFeePercent', label: 'Legal fee (%)', kind: 'percent', required: true },
    { key: 'agencyFeePercent', label: 'BuildMyHouse fee (%)', kind: 'percent', required: true },
    { key: 'bedrooms', label: 'Bedrooms', kind: 'number', required: true, min: 1 },
    { key: 'bathrooms', label: 'Bathrooms', kind: 'number', required: true, min: 1 },
    { key: 'sizeSqm', label: 'Interior size (sqm)', kind: 'number', required: true, min: 1 },
    { key: 'furnishing', label: 'Furnishing', kind: 'text', placeholder: 'Fully fitted / Semi / Shell' },
    { key: 'paymentPattern', label: 'Payment pattern', kind: 'text', placeholder: 'Annual upfront / Bi-annual' },
    { key: 'power', label: 'Power supply', kind: 'text', placeholder: 'PHCN + inverter / Dedicated transformer' },
    { key: 'water', label: 'Water supply', kind: 'text', placeholder: 'Borehole + treatment / Mains' },
    { key: 'internet', label: 'Internet', kind: 'text', placeholder: 'Fiber ready / 4G backup' },
    { key: 'parking', label: 'Parking', kind: 'text', placeholder: '2 covered bays' },
    { key: 'security', label: 'Security', kind: 'text', placeholder: 'Estate gate + CCTV' },
    { key: 'rules', label: 'House rules', kind: 'text', placeholder: 'No short-let sublease' },
    { key: 'inspectionWindow', label: 'Inspection window', kind: 'text', placeholder: 'By arrangement / Weekends only' },
    {
      key: 'proximity',
      label: 'Proximity highlights',
      kind: 'comma-list',
      placeholder: 'Schools, malls, expressway',
      gridSpan: 2,
    },
    {
      key: 'verificationDocs',
      label: 'Verification checks',
      kind: 'comma-list',
      placeholder: 'Tenant history, landlord ID, utility receipts',
      gridSpan: 2,
    },
  ];
}

function rentalCommercialFields(): OpportunityFieldDef[] {
  return [
    { key: 'annualRent', label: 'Annual rent (₦)', kind: 'currency', required: true },
    { key: 'serviceCharge', label: 'Service charge (₦)', kind: 'currency', required: true },
    { key: 'cautionDeposit', label: 'Refundable deposit (₦)', kind: 'currency', required: true },
    { key: 'legalFeePercent', label: 'Legal fee (%)', kind: 'percent', required: true },
    { key: 'agencyFeePercent', label: 'BuildMyHouse fee (%)', kind: 'percent', required: true },
    { key: 'sizeSqm', label: 'Lettable area (sqm)', kind: 'number', required: true, min: 1 },
    { key: 'bedrooms', label: 'Office units / floors', kind: 'number', min: 0 },
    { key: 'bathrooms', label: 'WCs / cores', kind: 'number', min: 0 },
    { key: 'furnishing', label: 'Fit-out level', kind: 'text', placeholder: 'Shell / Category A / Fully fitted' },
    { key: 'paymentPattern', label: 'Lease payment terms', kind: 'text', placeholder: 'Annual / Quarterly + escalation' },
    { key: 'power', label: 'Power & backup', kind: 'text', placeholder: 'Dedicated transformer + genset' },
    { key: 'water', label: 'Water & sanitation', kind: 'text', placeholder: 'Mains + storage tanks' },
    { key: 'internet', label: 'Connectivity', kind: 'text', placeholder: 'Fiber trunk / redundant links' },
    { key: 'parking', label: 'Parking allocation', kind: 'text', placeholder: 'Basement + surface bays' },
    { key: 'security', label: 'Access control', kind: 'text', placeholder: '24/7 manned + CCTV' },
    { key: 'rules', label: 'Lease restrictions', kind: 'text', placeholder: 'No hazardous materials' },
    { key: 'inspectionWindow', label: 'Inspection window', kind: 'text', placeholder: 'Business hours / By appointment' },
    {
      key: 'proximity',
      label: 'Catchment drivers',
      kind: 'comma-list',
      placeholder: 'CBD, hotels, transit hub',
      gridSpan: 2,
    },
    {
      key: 'verificationDocs',
      label: 'Verification checks',
      kind: 'comma-list',
      placeholder: 'Tenancy schedule, landlord corporate docs',
      gridSpan: 2,
    },
  ];
}

function rentalInfrastructureFields(category: BuildOpportunityCategoryKey): OpportunityFieldDef[] {
  const rentLabel =
    category === 'heavy_civil_construction'
      ? 'Annual site fee (₦)'
      : category === 'industrial_construction'
        ? 'Annual lease (₦)'
        : 'Annual program rent (₦)';

  return [
    { key: 'annualRent', label: rentLabel, kind: 'currency', required: true },
    { key: 'serviceCharge', label: 'O&M charge (₦)', kind: 'currency', required: true },
    { key: 'cautionDeposit', label: 'Performance deposit (₦)', kind: 'currency', required: true },
    { key: 'legalFeePercent', label: 'Legal fee (%)', kind: 'percent', required: true },
    { key: 'agencyFeePercent', label: 'BuildMyHouse fee (%)', kind: 'percent', required: true },
    { key: 'sizeSqm', label: 'Leased footprint (sqm)', kind: 'number', required: true, min: 1 },
    { key: 'furnishing', label: 'Built asset status', kind: 'text', placeholder: 'Existing plant / Greenfield pad' },
    { key: 'paymentPattern', label: 'Payment cadence', kind: 'text', placeholder: 'Annual / Milestone-linked' },
    { key: 'power', label: 'Power infrastructure', kind: 'text', placeholder: 'Dedicated feeder / On-site substation' },
    { key: 'water', label: 'Water & effluent', kind: 'text', placeholder: 'Industrial supply / Treatment on site' },
    { key: 'internet', label: 'Telemetry / comms', kind: 'text', placeholder: 'Fiber SCADA link' },
    { key: 'parking', label: 'Laydown & staging', kind: 'text', placeholder: 'Heavy vehicle access' },
    { key: 'security', label: 'Perimeter security', kind: 'text', placeholder: 'Fence + patrol' },
    { key: 'rules', label: 'Operational covenants', kind: 'text', placeholder: 'Noise / emissions limits' },
    { key: 'inspectionWindow', label: 'Inspection window', kind: 'text', placeholder: 'By arrangement with operator' },
    {
      key: 'proximity',
      label: 'Logistics context',
      kind: 'comma-list',
      placeholder: 'Port, pipeline corridor, utility node',
      gridSpan: 2,
    },
    {
      key: 'verificationDocs',
      label: 'Verification checks',
      kind: 'comma-list',
      placeholder: 'Operator license, environmental permit',
      gridSpan: 2,
    },
  ];
}

function houseCheckRows(category: BuildOpportunityCategoryKey): OpportunityCheckRowDef[] {
  if (category === 'residential') {
    return [
      { fieldKey: 'condition', label: 'Condition', icon: 'HouseLine', fallback: 'Inspect on site' },
      { fieldKey: 'parking', label: 'Parking', icon: 'Car', fallback: 'Confirm on visit' },
      { fieldKey: 'yearBuilt', label: 'Year built', icon: 'CalendarBlank', fallback: 'Not specified' },
      { fieldKey: 'squareMeters', label: 'Area', icon: 'Ruler', fallback: 'See listing', format: 'sqm' },
      { fieldKey: 'propertyType', label: 'Property style', icon: 'Buildings', fallback: 'See filter tag' },
      { fieldKey: 'inspectionWindow', label: 'Inspection window', icon: 'Clock', fallback: 'By arrangement' },
    ];
  }

  if (category === 'commercial') {
    return [
      { fieldKey: 'condition', label: 'Building status', icon: 'Warehouse', fallback: 'Confirm on visit' },
      { fieldKey: 'squareMeters', label: 'Lettable area', icon: 'Ruler', fallback: 'See listing', format: 'sqm' },
      { fieldKey: 'parking', label: 'Parking bays', icon: 'Car', fallback: 'Confirm on visit' },
      { fieldKey: 'propertyType', label: 'Asset class', icon: 'Storefront', fallback: 'See filter tag' },
      { fieldKey: 'yearBuilt', label: 'Year completed', icon: 'CalendarBlank', fallback: 'Not specified' },
      { fieldKey: 'inspectionWindow', label: 'Inspection window', icon: 'Clock', fallback: 'By arrangement' },
    ];
  }

  return [
    { fieldKey: 'condition', label: 'Delivery status', icon: 'HardHat', fallback: 'Confirm on visit' },
    { fieldKey: 'squareMeters', label: 'Project footprint', icon: 'Ruler', fallback: 'See listing', format: 'sqm' },
    { fieldKey: 'propertyType', label: 'Asset subtype', icon: 'Factory', fallback: 'See filter tag' },
    { fieldKey: 'yearBuilt', label: 'Completion target', icon: 'CalendarBlank', fallback: 'Not specified' },
    { fieldKey: 'roadAccess', label: 'Site access', icon: 'RoadHorizon', fallback: 'Confirm logistics' },
    { fieldKey: 'inspectionWindow', label: 'Inspection window', icon: 'Clock', fallback: 'By arrangement' },
  ];
}

function landCheckRows(category: BuildOpportunityCategoryKey): OpportunityCheckRowDef[] {
  return [
    { fieldKey: 'titleDocument', label: 'Title document', icon: 'Scroll', fallback: 'Request copy' },
    { fieldKey: 'zoningType', label: 'Zoning', icon: 'MapPinArea', fallback: 'Confirm with planner' },
    { fieldKey: 'roadAccess', label: 'Road access', icon: 'RoadHorizon', fallback: 'Survey on site' },
    { fieldKey: 'topography', label: 'Topography', icon: 'Mountains', fallback: 'Survey on site' },
    { fieldKey: 'ownershipType', label: 'Ownership', icon: 'Key', fallback: 'Legal review required' },
    { fieldKey: 'inspectionWindow', label: 'Inspection window', icon: 'Clock', fallback: 'By arrangement' },
  ];
}

function rentalCheckRows(category: BuildOpportunityCategoryKey): OpportunityCheckRowDef[] {
  const rows: OpportunityCheckRowDef[] = [
    { fieldKey: 'power', label: 'Power', icon: 'Lightning', fallback: 'Confirm with landlord' },
    { fieldKey: 'water', label: 'Water', icon: 'Drop', fallback: 'Confirm with landlord' },
    { fieldKey: 'security', label: 'Security', icon: 'Shield', fallback: 'Confirm on visit' },
    { fieldKey: 'internet', label: 'Internet', icon: 'WifiHigh', fallback: 'Confirm with landlord' },
    { fieldKey: 'parking', label: 'Parking', icon: 'Car', fallback: 'Confirm allocation' },
    { fieldKey: 'rules', label: 'Lease rules', icon: 'Lock', fallback: 'Review lease draft' },
    { fieldKey: 'inspectionWindow', label: 'Inspection window', icon: 'Clock', fallback: 'By arrangement' },
  ];

  if (category === 'residential') {
    rows.unshift(
      { fieldKey: 'furnishing', label: 'Furnishing', icon: 'Armchair', fallback: 'Confirm fit-out' },
      { fieldKey: 'paymentPattern', label: 'Payment pattern', icon: 'Receipt', fallback: 'Annual typical' },
    );
  } else if (category === 'commercial') {
    rows.unshift(
      { fieldKey: 'furnishing', label: 'Fit-out level', icon: 'OfficeChair', fallback: 'Confirm spec' },
      { fieldKey: 'paymentPattern', label: 'Lease terms', icon: 'Receipt', fallback: 'Review schedule' },
    );
  } else {
    rows.unshift(
      { fieldKey: 'furnishing', label: 'Built asset status', icon: 'Crane', fallback: 'Confirm scope' },
      { fieldKey: 'paymentPattern', label: 'Payment cadence', icon: 'Receipt', fallback: 'Review schedule' },
    );
  }

  return rows;
}

function houseSnapshotRows(): OpportunityCheckRowDef[] {
  return [{ fieldKey: 'price', label: 'Price', icon: 'CurrencyNgn', format: 'currency' }];
}

function rentalSnapshotRows(): OpportunityCheckRowDef[] {
  return [
    { fieldKey: 'annualRent', label: 'Annual rent', icon: 'CurrencyNgn', format: 'currency' },
    { fieldKey: 'serviceCharge', label: 'Service charge', icon: 'Coins', format: 'currency' },
    { fieldKey: 'cautionDeposit', label: 'Caution deposit', icon: 'Vault', format: 'currency' },
    { fieldKey: 'legalFeePercent', label: 'Legal fee', icon: 'Scales', format: 'percent' },
    { fieldKey: 'agencyFeePercent', label: 'BuildMyHouse fee', icon: 'Handshake', format: 'percent' },
  ];
}

function landSnapshotRows(): OpportunityCheckRowDef[] {
  return [
    { fieldKey: 'price', label: 'Price', icon: 'CurrencyNgn', format: 'currency' },
    { fieldKey: 'sizeSqm', label: 'Plot size', icon: 'Ruler', format: 'sqm' },
  ];
}

function categoryIntro(entity: OpportunityEntity, category: BuildOpportunityCategoryKey): string {
  const entityWord = entity === 'house' ? 'house' : entity === 'land' ? 'land parcel' : 'lease';
  const categoryWord =
    category === 'residential'
      ? 'residential'
      : category === 'commercial'
        ? 'commercial'
        : category === 'heavy_civil_construction'
          ? 'heavy civil'
          : category === 'industrial_construction'
            ? 'industrial'
            : 'environmental';

  return `Shape a ${categoryWord} ${entityWord} listing that mirrors what homeowners will review before requesting an inspection.`;
}

function buildHouseProfile(category: BuildOpportunityCategoryKey): OpportunityProfile {
  const detailFields =
    category === 'residential'
      ? houseResidentialFields()
      : category === 'commercial'
        ? houseCommercialFields()
        : houseInfrastructureFields(category);

  return {
    entity: 'house',
    category,
    entityLabel: 'House for sale',
    formIntro: categoryIntro('house', category),
    snapshotIntro: 'Review pricing and scope before committing to an inspection.',
    checksTitle: 'Confirm key checks before proceeding.',
    verificationTitle: 'BuildMyHouse Verification Checks',
    verificationDocField: 'documents',
    verificationExtraField: 'amenities',
    verificationDocLabel: 'Title & compliance docs',
    verificationExtraLabel:
      category === 'residential' ? 'Interior & lifestyle features' : 'Scope deliverables',
    sections: [
      {
        id: 'core',
        title: 'Listing essentials',
        icon: 'HouseLine',
        fields: [...HOUSE_BASE, ...detailFields],
      },
      {
        id: 'contact',
        title: 'Seller contact',
        icon: 'Phone',
        fields: CONTACT_FIELDS,
      },
    ],
    checkRows: houseCheckRows(category),
    snapshotRows: houseSnapshotRows(),
  };
}

function buildLandProfile(category: BuildOpportunityCategoryKey): OpportunityProfile {
  const detailFields =
    category === 'residential'
      ? landResidentialFields()
      : category === 'commercial'
        ? landCommercialFields()
        : landInfrastructureFields(category);

  return {
    entity: 'land',
    category,
    entityLabel: 'Land for sale',
    formIntro: categoryIntro('land', category),
    snapshotIntro: 'Validate title, access, and development fit before site visits.',
    checksTitle: 'Land due diligence checks',
    verificationTitle: 'BuildMyHouse Verification Checks',
    verificationDocField: 'documents',
    verificationExtraField: 'restrictions',
    verificationDocLabel: 'Verification documents',
    verificationExtraLabel: 'Use restrictions & covenants',
    sections: [
      {
        id: 'core',
        title: 'Plot essentials',
        icon: 'MapTrifold',
        fields: [...LAND_BASE, ...detailFields],
      },
      {
        id: 'contact',
        title: 'Seller contact',
        icon: 'Phone',
        fields: CONTACT_FIELDS,
      },
    ],
    checkRows: landCheckRows(category),
    snapshotRows: landSnapshotRows(),
  };
}

function buildRentalProfile(category: BuildOpportunityCategoryKey): OpportunityProfile {
  const detailFields =
    category === 'residential'
      ? rentalResidentialFields()
      : category === 'commercial'
        ? rentalCommercialFields()
        : rentalInfrastructureFields(category);

  return {
    entity: 'rental',
    category,
    entityLabel: 'Rental listing',
    formIntro: categoryIntro('rental', category),
    snapshotIntro: 'Compare rent, fees, and operating checks before requesting a walkthrough.',
    checksTitle: 'Confirm lease operating checks',
    verificationTitle: 'BuildMyHouse Verification Checks',
    verificationDocField: 'verificationDocs',
    verificationDocLabel: 'Verification checks',
    sections: [
      {
        id: 'core',
        title: 'Lease essentials',
        icon: 'Key',
        fields: [...RENTAL_BASE, ...detailFields],
      },
    ],
    checkRows: rentalCheckRows(category),
    snapshotRows: rentalSnapshotRows(),
  };
}

const PROFILE_CACHE = new Map<string, OpportunityProfile>();

function profileCacheKey(entity: OpportunityEntity, category: BuildOpportunityCategoryKey): string {
  return `${entity}:${category}`;
}

export function getOpportunityProfile(
  entity: OpportunityEntity,
  category: BuildOpportunityCategoryKey,
): OpportunityProfile {
  const key = profileCacheKey(entity, category);
  const cached = PROFILE_CACHE.get(key);
  if (cached) return cached;

  let profile: OpportunityProfile;
  if (entity === 'house') profile = buildHouseProfile(category);
  else if (entity === 'land') profile = buildLandProfile(category);
  else profile = buildRentalProfile(category);

  PROFILE_CACHE.set(key, profile);
  return profile;
}

export function getAllOpportunityProfiles(entity: OpportunityEntity): OpportunityProfile[] {
  return ALL_CATEGORIES.map((category) => getOpportunityProfile(entity, category));
}

export function getOpportunityFieldKeys(profile: OpportunityProfile): string[] {
  const keys = new Set<string>([
    'opportunityCategory',
    'opportunityType',
    'opportunityTypeCustom',
  ]);
  profile.sections.forEach((section) => {
    section.fields.forEach((field) => keys.add(field.key));
  });
  return Array.from(keys);
}

export function formatOpportunityCheckValue(
  row: OpportunityCheckRowDef,
  data: Record<string, unknown>,
): string {
  const raw = data[row.fieldKey];
  if (raw === null || raw === undefined || raw === '') {
    return row.fallback ?? 'N/A';
  }

  if (row.format === 'currency') {
    const amount = Number(raw);
    if (Number.isFinite(amount)) return `₦${amount.toLocaleString()}`;
  }

  if (row.format === 'percent') {
    const amount = Number(raw);
    if (Number.isFinite(amount)) return `${amount}%`;
  }

  if (row.format === 'sqm') {
    const amount = Number(raw);
    if (Number.isFinite(amount)) return `${amount} m²`;
  }

  if (row.format === 'number') {
    const amount = Number(raw);
    if (Number.isFinite(amount)) return String(amount);
  }

  return String(raw);
}

export function splitCommaList(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim()).filter(Boolean);
  }
  return String(value || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

export function joinCommaList(value: unknown): string {
  if (Array.isArray(value)) return value.join(', ');
  return String(value || '');
}

export function buildOpportunityDisplayData(
  entity: OpportunityEntity,
  record: Record<string, unknown>,
): Record<string, unknown> {
  const data: Record<string, unknown> = { ...record, inspectionWindow: record.inspectionWindow ?? 'By arrangement' };

  if (entity === 'house') {
    if (!data.squareMeters && data.squareFootage) {
      data.squareMeters = Math.round(Number(data.squareFootage) * 0.092903);
    }
  }

  if (entity === 'rental' && data.agencyFeePercent === undefined) {
    data.agencyFeePercent = 2;
  }

  return data;
}
