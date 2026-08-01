/**
 * Service & labour price taxonomy — SEPARATE from product observations.
 * Doc: docs/price-checker/SERVICE_LABOUR_TAXONOMY.md
 *
 * Service observations may only be compared when scopeFactors match; reports
 * must state scope differences explicitly.
 */
import { ServiceFamily } from './types';

/** Scope factors shared by most services. */
const BASE_SCOPE = [
  'labour_only_vs_labour_and_material',
  'location',
  'project_scale',
  'access_conditions',
  'transportation',
  'call_out_fee',
] as const;

export const SERVICE_FAMILIES: readonly ServiceFamily[] = [
  {
    key: 'tiling', name: 'Tiling', marketNames: ['tiler', 'tiling work', 'laying tiles'], pricingBasis: 'either',
    pricingUnits: ['sqm'], hasMinimumJobCharge: true,
    scopeFactors: [...BASE_SCOPE, 'tile_size', 'floor_vs_wall', 'screeding_required', 'demolition_of_old_tiles', 'disposal'],
    reviewers: { primary: 'quantity_surveyor', secondary: 'architect_interior', reason: 'm² rate conventions are QS domain; finish quality is interior.' },
  },
  {
    key: 'painting', name: 'Painting', marketNames: ['painter', 'painting work'], pricingBasis: 'either',
    pricingUnits: ['sqm', 'room', 'job'], hasMinimumJobCharge: true,
    scopeFactors: [...BASE_SCOPE, 'coats', 'surface_preparation', 'paint_type', 'height_scaffolding', 'interior_vs_exterior'],
    reviewers: { primary: 'quantity_surveyor', secondary: 'architect_interior', reason: 'Coverage and coat norms are QS/finishing domain.' },
  },
  {
    key: 'screeding', name: 'Screeding', marketNames: ['screeding work', 'wall screeding'], pricingBasis: 'either',
    pricingUnits: ['sqm'], hasMinimumJobCharge: true,
    scopeFactors: [...BASE_SCOPE, 'wall_vs_ceiling', 'surface_condition', 'coats'],
    reviewers: { primary: 'quantity_surveyor', reason: 'Rate build-up per m².' },
  },
  {
    key: 'pop-installation', name: 'POP installation', marketNames: ['pop man', 'pop work'], pricingBasis: 'either',
    pricingUnits: ['sqm'], hasMinimumJobCharge: true,
    scopeFactors: [...BASE_SCOPE, 'design_complexity', 'ceiling_height', 'wet_pop_vs_board'],
    reviewers: { primary: 'architect_interior', secondary: 'quantity_surveyor', reason: 'Design complexity drives labour.' },
  },
  {
    key: 'gypsum-ceiling-installation', name: 'Gypsum ceiling installation', marketNames: ['gypsum ceiling work'], pricingBasis: 'either',
    pricingUnits: ['sqm'], hasMinimumJobCharge: true,
    scopeFactors: [...BASE_SCOPE, 'design_complexity', 'ceiling_height', 'lighting_troughs'],
    reviewers: { primary: 'architect_interior', reason: 'Suspended-system specs are finishing domain.' },
  },
  {
    key: 'electrical-point-installation', name: 'Electrical point installation', marketNames: ['electrician per point', 'wiring per point'], pricingBasis: 'either',
    pricingUnits: ['point'], hasMinimumJobCharge: true,
    scopeFactors: [...BASE_SCOPE, 'conduiting_vs_surface', 'new_wiring_vs_rewiring', 'chasing_required', 'materials_included', 'testing_commissioning'],
    reviewers: { primary: 'electrical_engineer', secondary: 'quantity_surveyor', reason: 'Point definitions and safety standards are electrical domain.' },
  },
  {
    key: 'plumbing-point-installation', name: 'Plumbing point installation', marketNames: ['plumber per point'], pricingBasis: 'either',
    pricingUnits: ['point'], hasMinimumJobCharge: true,
    scopeFactors: [...BASE_SCOPE, 'hot_and_cold', 'concealed_vs_surface', 'materials_included', 'pressure_testing'],
    reviewers: { primary: 'building_services', secondary: 'quantity_surveyor', reason: 'Point scope definitions are wet-services domain.' },
  },
  {
    key: 'roofing-labour', name: 'Roofing labour', marketNames: ['carpenter roofing', 'roof installation'], pricingBasis: 'labour_only',
    pricingUnits: ['sqm', 'job'], hasMinimumJobCharge: true,
    scopeFactors: [...BASE_SCOPE, 'truss_type', 'roof_pitch_complexity', 'sheet_type', 'height'],
    reviewers: { primary: 'structural_engineer', secondary: 'quantity_surveyor', reason: 'Truss/pitch complexity is structural.' },
  },
  {
    key: 'window-fabrication-installation', name: 'Window fabrication & installation', marketNames: ['aluminium fabricator'], pricingBasis: 'labour_and_material',
    pricingUnits: ['sqm', 'piece'], hasMinimumJobCharge: true,
    scopeFactors: [...BASE_SCOPE, 'profile_gauge', 'glass_type', 'floor_level', 'net_burglary_addons'],
    reviewers: { primary: 'architect_interior', reason: 'Fabrication specs are architectural.' },
  },
  {
    key: 'door-installation', name: 'Door installation', marketNames: ['carpenter door hanging'], pricingBasis: 'labour_only',
    pricingUnits: ['piece'], hasMinimumJobCharge: true,
    scopeFactors: [...BASE_SCOPE, 'door_type', 'frame_work_required', 'lockset_fitting'],
    reviewers: { primary: 'architect_interior', reason: 'Door schedules are architectural.' },
  },
  {
    key: 'solar-installation', name: 'Solar installation', marketNames: ['solar installer'], pricingBasis: 'either',
    pricingUnits: ['job', 'kva'], hasMinimumJobCharge: true,
    scopeFactors: [...BASE_SCOPE, 'system_size_kva', 'roof_vs_ground_mount', 'panel_count', 'wiring_distance', 'earthing', 'testing_commissioning', 'warranty'],
    reviewers: { primary: 'electrical_engineer', reason: 'System design and safety are electrical domain.' },
  },
  {
    key: 'cctv-installation', name: 'CCTV installation', marketNames: ['cctv installer'], pricingBasis: 'either',
    pricingUnits: ['job', 'point'], hasMinimumJobCharge: true,
    scopeFactors: [...BASE_SCOPE, 'camera_count', 'cable_runs', 'height_access', 'remote_viewing_setup', 'testing_commissioning'],
    reviewers: { primary: 'security_low_voltage', reason: 'Low-voltage system scope.' },
  },
  {
    key: 'inverter-installation', name: 'Inverter installation', marketNames: ['inverter installer'], pricingBasis: 'either',
    pricingUnits: ['job'], hasMinimumJobCharge: true,
    scopeFactors: [...BASE_SCOPE, 'capacity_kva', 'battery_bank_size', 'changeover_wiring', 'load_separation', 'testing_commissioning'],
    reviewers: { primary: 'electrical_engineer', reason: 'Load separation and changeover safety are electrical.' },
  },
  {
    key: 'ac-installation', name: 'Air-conditioner installation', marketNames: ['ac installer'], pricingBasis: 'either',
    pricingUnits: ['piece'], hasMinimumJobCharge: true,
    scopeFactors: [...BASE_SCOPE, 'unit_type_split_window', 'piping_distance', 'wall_drilling', 'bracket', 'gas_topup'],
    reviewers: { primary: 'building_services', reason: 'Refrigeration piping scope is mechanical.' },
  },
  {
    key: 'drainage-construction', name: 'Drainage construction', marketNames: ['drainage work', 'gutter construction'], pricingBasis: 'either',
    pricingUnits: ['linear_metre', 'job'], hasMinimumJobCharge: true,
    scopeFactors: [...BASE_SCOPE, 'drain_size_profile', 'excavation_depth', 'blockwork_vs_cast', 'covers_included', 'disposal'],
    reviewers: { primary: 'structural_engineer', secondary: 'quantity_surveyor', reason: 'Drainage sections and reinforcement are structural.' },
  },
  {
    key: 'borehole-drilling', name: 'Borehole drilling', marketNames: ['borehole man', 'drilling'], pricingBasis: 'either',
    pricingUnits: ['job'], hasMinimumJobCharge: true,
    scopeFactors: [...BASE_SCOPE, 'depth_expected', 'terrain_geology', 'casing_type', 'pump_included', 'tank_stand_included', 'water_treatment_included', 'geophysical_survey'],
    reviewers: { primary: 'building_services', reason: 'Drilling scope and casing specs are services/geotechnical domain.' },
    notes: 'Extreme regional variance (depth/geology). Never compare across terrain classes.',
  },
  {
    key: 'waterproofing-application', name: 'Waterproofing application', marketNames: ['waterproofing work'], pricingBasis: 'either',
    pricingUnits: ['sqm'], hasMinimumJobCharge: true,
    scopeFactors: [...BASE_SCOPE, 'system_type', 'surface_condition', 'coats_layers', 'warranty'],
    reviewers: { primary: 'building_services', reason: 'Application standards are services domain.' },
  },
  {
    key: 'german-floor-installation', name: 'German-floor installation', marketNames: ['german floor work', 'interlocking laying'], pricingBasis: 'either',
    pricingUnits: ['sqm'], hasMinimumJobCharge: true,
    scopeFactors: [...BASE_SCOPE, 'sub_base_preparation', 'paver_vs_cast', 'thickness', 'compaction_equipment'],
    reviewers: { primary: 'quantity_surveyor', reason: 'm² rate build-up with material/labour split.' },
  },
  {
    key: 'kitchen-fabrication-installation', name: 'Kitchen-cabinet fabrication & installation', marketNames: ['kitchen carpenter', 'cabinet maker'], pricingBasis: 'labour_and_material',
    pricingUnits: ['linear_metre', 'job'], hasMinimumJobCharge: true,
    scopeFactors: [...BASE_SCOPE, 'carcass_material', 'door_finish', 'worktop_material', 'hardware_grade', 'design_complexity'],
    reviewers: { primary: 'architect_interior', secondary: 'quantity_surveyor', reason: 'Interior fabrication specification.' },
  },
  {
    key: 'equipment-rental', name: 'Scaffolding / equipment rental', marketNames: ['scaffold hire', 'equipment hire'], pricingBasis: 'labour_only',
    pricingUnits: ['day', 'job'], hasMinimumJobCharge: true,
    scopeFactors: [...BASE_SCOPE, 'equipment_type', 'rental_duration', 'operator_included', 'delivery_return', 'deposit_required'],
    reviewers: { primary: 'quantity_surveyor', reason: 'Rental rate conventions are QS domain.' },
    notes: 'Rental pricing — never mixes with purchase observations.',
  },
] as const;

const SERVICE_INDEX = new Map(SERVICE_FAMILIES.map((s) => [s.key, s]));

export function getServiceByKey(key: string): ServiceFamily | undefined {
  return SERVICE_INDEX.get(key);
}
