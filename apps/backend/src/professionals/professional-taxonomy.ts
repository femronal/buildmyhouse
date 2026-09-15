/** Database-backed catalog seed. Idempotent upsert by stable id/key. */

export type ProfessionSeed = {
  id: string;
  key: string;
  label: string;
  description: string;
  regulatorKey?: string;
  regulatorLabel?: string;
  verificationMode: 'regulator' | 'documents';
  sortOrder: number;
};

export type SpecialtySeed = {
  id: string;
  key: string;
  professionId: string;
  label: string;
  sortOrder: number;
};

export type NamedSeed = {
  id: string;
  key: string;
  label: string;
  sortOrder: number;
};

export type NeedSeed = {
  id: string;
  key: string;
  label: string;
  description: string;
  primaryProfessionId: string;
  serviceId?: string;
  sortOrder: number;
};

export const PROFESSIONS: ProfessionSeed[] = [
  { id: 'profession_architect', key: 'architect', label: 'Architect', description: 'Architectural design, drawings and planning support.', regulatorKey: 'arcon', regulatorLabel: 'ARCON', verificationMode: 'regulator', sortOrder: 10 },
  { id: 'profession_structural_engineer', key: 'structural-engineer', label: 'Structural Engineer', description: 'Structural design, integrity assessment and foundation review.', regulatorKey: 'coren', regulatorLabel: 'COREN', verificationMode: 'regulator', sortOrder: 20 },
  { id: 'profession_civil_engineer', key: 'civil-engineer', label: 'Civil Engineer', description: 'Civil works, drainage, roads and site development.', regulatorKey: 'coren', regulatorLabel: 'COREN', verificationMode: 'regulator', sortOrder: 30 },
  { id: 'profession_quantity_surveyor', key: 'quantity-surveyor', label: 'Quantity Surveyor', description: 'Cost planning, BOQ, valuations and variation control.', regulatorKey: 'qsrbn', regulatorLabel: 'QSRBN', verificationMode: 'regulator', sortOrder: 40 },
  { id: 'profession_land_surveyor', key: 'land-surveyor', label: 'Land Surveyor', description: 'Boundary, topographic and setting-out surveys.', regulatorKey: 'surcon', regulatorLabel: 'SURCON', verificationMode: 'regulator', sortOrder: 50 },
  { id: 'profession_property_lawyer', key: 'property-lawyer', label: 'Property Lawyer', description: 'Title due diligence, conveyancing and property agreements.', regulatorKey: 'nba', regulatorLabel: 'NBA / practising status', verificationMode: 'documents', sortOrder: 60 },
  { id: 'profession_electrical_engineer', key: 'electrical-engineer', label: 'Electrical Engineer', description: 'Electrical design review and installation inspection.', regulatorKey: 'coren', regulatorLabel: 'COREN', verificationMode: 'regulator', sortOrder: 70 },
  { id: 'profession_mechanical_engineer', key: 'mechanical-building-services-engineer', label: 'Mechanical / Building Services Engineer', description: 'Mechanical, plumbing and HVAC design or installation review.', regulatorKey: 'coren', regulatorLabel: 'COREN', verificationMode: 'regulator', sortOrder: 80 },
  { id: 'profession_geotechnical_engineer', key: 'geotechnical-engineer', label: 'Geotechnical Engineer', description: 'Soil investigation and foundation condition assessment.', regulatorKey: 'coren', regulatorLabel: 'COREN', verificationMode: 'regulator', sortOrder: 90 },
  { id: 'profession_registered_builder', key: 'registered-builder', label: 'Registered Builder', description: 'Construction methodology, site production and build quality.', regulatorKey: 'corbon', regulatorLabel: 'CORBON', verificationMode: 'regulator', sortOrder: 100 },
  { id: 'profession_town_planner', key: 'town-planner', label: 'Town Planner', description: 'Planning applications and statutory approval support.', regulatorKey: 'toprec', regulatorLabel: 'TOPREC', verificationMode: 'regulator', sortOrder: 110 },
  { id: 'profession_estate_surveyor', key: 'estate-surveyor-valuer', label: 'Estate Surveyor & Valuer', description: 'Property valuation and estate surveying.', regulatorKey: 'esvarbon', regulatorLabel: 'ESVARBON', verificationMode: 'regulator', sortOrder: 120 },
  { id: 'profession_project_manager', key: 'project-manager', label: 'Project Manager', description: 'Programme, coordination and delivery oversight.', verificationMode: 'documents', sortOrder: 130 },
  { id: 'profession_hse', key: 'health-safety-professional', label: 'Health & Safety Professional', description: 'Site safety audits and method-statement review.', verificationMode: 'documents', sortOrder: 140 },
  { id: 'profession_environmental', key: 'environmental-consultant', label: 'Environmental Consultant', description: 'Environmental assessment and compliance reporting.', verificationMode: 'documents', sortOrder: 150 },
  { id: 'profession_interior_designer', key: 'interior-designer', label: 'Interior Designer', description: 'Interior design and finishes specification.', verificationMode: 'documents', sortOrder: 160 },
  { id: 'profession_facilities_manager', key: 'facilities-manager', label: 'Facilities Manager', description: 'Operations, maintenance and handover of occupied buildings.', verificationMode: 'documents', sortOrder: 170 },
];

export const SPECIALTIES: SpecialtySeed[] = [
  { id: 'spec_arch_residential', key: 'residential-architecture', professionId: 'profession_architect', label: 'Residential Architecture', sortOrder: 10 },
  { id: 'spec_arch_renovation', key: 'renovation-architecture', professionId: 'profession_architect', label: 'Renovation', sortOrder: 20 },
  { id: 'spec_arch_commercial', key: 'commercial-architecture', professionId: 'profession_architect', label: 'Commercial Architecture', sortOrder: 30 },
  { id: 'spec_arch_interior', key: 'interior-architecture', professionId: 'profession_architect', label: 'Interior Architecture', sortOrder: 40 },
  { id: 'spec_arch_conservation', key: 'conservation-architecture', professionId: 'profession_architect', label: 'Conservation', sortOrder: 50 },
  { id: 'spec_arch_planning', key: 'planning-approval-support', professionId: 'profession_architect', label: 'Planning / Approval Support', sortOrder: 60 },
  { id: 'spec_se_rc', key: 'reinforced-concrete', professionId: 'profession_structural_engineer', label: 'Reinforced Concrete', sortOrder: 10 },
  { id: 'spec_se_steel', key: 'steel-structures', professionId: 'profession_structural_engineer', label: 'Steel Structures', sortOrder: 20 },
  { id: 'spec_se_foundation', key: 'foundation-engineering', professionId: 'profession_structural_engineer', label: 'Foundation Engineering', sortOrder: 30 },
  { id: 'spec_se_assessment', key: 'structural-assessment', professionId: 'profession_structural_engineer', label: 'Structural Assessment', sortOrder: 40 },
  { id: 'spec_se_remedial', key: 'remedial-rehabilitation', professionId: 'profession_structural_engineer', label: 'Remedial / Rehabilitation', sortOrder: 50 },
  { id: 'spec_se_existing', key: 'existing-buildings', professionId: 'profession_structural_engineer', label: 'Existing Buildings', sortOrder: 60 },
  { id: 'spec_ce_drainage', key: 'drainage', professionId: 'profession_civil_engineer', label: 'Drainage', sortOrder: 10 },
  { id: 'spec_ce_roads', key: 'roads', professionId: 'profession_civil_engineer', label: 'Roads', sortOrder: 20 },
  { id: 'spec_ce_external', key: 'external-works', professionId: 'profession_civil_engineer', label: 'External Works', sortOrder: 30 },
  { id: 'spec_ce_water', key: 'water-infrastructure', professionId: 'profession_civil_engineer', label: 'Water Infrastructure', sortOrder: 40 },
  { id: 'spec_ce_site', key: 'site-development', professionId: 'profession_civil_engineer', label: 'Site Development', sortOrder: 50 },
  { id: 'spec_qs_boq', key: 'boq-preparation', professionId: 'profession_quantity_surveyor', label: 'BOQ Preparation', sortOrder: 10 },
  { id: 'spec_qs_cost', key: 'cost-planning', professionId: 'profession_quantity_surveyor', label: 'Cost Planning', sortOrder: 20 },
  { id: 'spec_qs_tender', key: 'tender-analysis', professionId: 'profession_quantity_surveyor', label: 'Tender Analysis', sortOrder: 30 },
  { id: 'spec_qs_valuation', key: 'stage-valuation', professionId: 'profession_quantity_surveyor', label: 'Stage Valuation', sortOrder: 40 },
  { id: 'spec_qs_variation', key: 'variation-control', professionId: 'profession_quantity_surveyor', label: 'Variation Control', sortOrder: 50 },
  { id: 'spec_qs_final', key: 'final-accounts', professionId: 'profession_quantity_surveyor', label: 'Final Accounts', sortOrder: 60 },
  { id: 'spec_qs_procurement', key: 'procurement-cost-review', professionId: 'profession_quantity_surveyor', label: 'Procurement Cost Review', sortOrder: 70 },
  { id: 'spec_ls_boundary', key: 'boundary-cadastral-survey', professionId: 'profession_land_surveyor', label: 'Boundary / Cadastral Survey', sortOrder: 10 },
  { id: 'spec_ls_topo', key: 'topographical-survey', professionId: 'profession_land_surveyor', label: 'Topographical Survey', sortOrder: 20 },
  { id: 'spec_ls_setout', key: 'setting-out', professionId: 'profession_land_surveyor', label: 'Setting Out', sortOrder: 30 },
  { id: 'spec_ls_asbuilt', key: 'as-built-survey', professionId: 'profession_land_surveyor', label: 'As-Built Survey', sortOrder: 40 },
  { id: 'spec_pl_title', key: 'title-due-diligence', professionId: 'profession_property_lawyer', label: 'Title Due Diligence', sortOrder: 10 },
  { id: 'spec_pl_convey', key: 'conveyancing', professionId: 'profession_property_lawyer', label: 'Conveyancing', sortOrder: 20 },
  { id: 'spec_pl_contracts', key: 'construction-contracts', professionId: 'profession_property_lawyer', label: 'Construction Contracts', sortOrder: 30 },
  { id: 'spec_pl_agreements', key: 'property-agreements', professionId: 'profession_property_lawyer', label: 'Property Agreements', sortOrder: 40 },
  { id: 'spec_pl_disputes', key: 'property-disputes', professionId: 'profession_property_lawyer', label: 'Disputes', sortOrder: 50 },
  { id: 'spec_pl_lease', key: 'lease-review', professionId: 'profession_property_lawyer', label: 'Lease Review', sortOrder: 60 },
];

export const SERVICES: NamedSeed[] = [
  { id: 'service_prepare_boq', key: 'prepare-bill-of-quantities', label: 'Prepare Bill of Quantities', sortOrder: 10 },
  { id: 'service_review_quotation', key: 'review-contractor-quotation', label: 'Review contractor quotation', sortOrder: 20 },
  { id: 'service_review_variation', key: 'review-variation-request', label: "Review variation request", sortOrder: 30 },
  { id: 'service_structural_inspection', key: 'structural-inspection', label: 'Carry out structural inspection', sortOrder: 40 },
  { id: 'service_assess_cracks', key: 'assess-structural-cracks', label: 'Assess structural cracks', sortOrder: 50 },
  { id: 'service_review_structural_drawings', key: 'review-structural-drawings', label: 'Review structural drawings', sortOrder: 60 },
  { id: 'service_prepare_arch_drawings', key: 'prepare-architectural-drawings', label: 'Prepare architectural drawings', sortOrder: 70 },
  { id: 'service_review_arch_drawings', key: 'review-architectural-drawings', label: 'Review architectural drawings', sortOrder: 80 },
  { id: 'service_land_survey', key: 'conduct-land-survey', label: 'Conduct land survey', sortOrder: 90 },
  { id: 'service_topo_survey', key: 'conduct-topographical-survey', label: 'Conduct topographical survey', sortOrder: 100 },
  { id: 'service_set_out', key: 'set-out-building', label: 'Set out building', sortOrder: 110 },
  { id: 'service_review_title', key: 'review-property-title', label: 'Review property title', sortOrder: 120 },
  { id: 'service_legal_opinion', key: 'prepare-legal-opinion', label: 'Prepare legal opinion', sortOrder: 130 },
  { id: 'service_valuation', key: 'provide-property-valuation', label: 'Provide property valuation', sortOrder: 140 },
  { id: 'service_review_electrical', key: 'review-electrical-installation', label: 'Review electrical installation', sortOrder: 150 },
  { id: 'service_review_mep', key: 'review-mechanical-plumbing-installation', label: 'Review mechanical/plumbing installation', sortOrder: 160 },
  { id: 'service_review_foundation', key: 'review-foundation', label: 'Review foundation', sortOrder: 170 },
  { id: 'service_cost_estimate', key: 'prepare-cost-estimate', label: 'Prepare cost estimate', sortOrder: 180 },
  { id: 'service_stage_valuation', key: 'stage-valuation', label: 'Stage valuation', sortOrder: 190 },
  { id: 'service_planning_approval', key: 'planning-approval-assistance', label: 'Planning approval assistance', sortOrder: 200 },
  { id: 'service_condition_assessment', key: 'building-condition-assessment', label: 'Building-condition assessment', sortOrder: 210 },
  { id: 'service_handover_inspection', key: 'handover-inspection', label: 'Handover inspection', sortOrder: 220 },
  { id: 'service_snagging', key: 'snagging-inspection', label: 'Snagging inspection', sortOrder: 230 },
  { id: 'service_hse_audit', key: 'health-safety-audit', label: 'Health & safety audit', sortOrder: 240 },
  { id: 'service_soil_check', key: 'check-soil-foundation-conditions', label: 'Check soil/foundation conditions', sortOrder: 250 },
];

export const DELIVERABLES: NamedSeed[] = [
  { id: 'del_arch_drawings', key: 'architectural-drawings', label: 'Architectural drawings', sortOrder: 10 },
  { id: 'del_working_drawings', key: 'working-drawings', label: 'Working drawings', sortOrder: 20 },
  { id: 'del_planning_docs', key: 'planning-submission-documents', label: 'Planning submission documents', sortOrder: 30 },
  { id: 'del_structural_drawings', key: 'structural-drawings', label: 'Structural drawings', sortOrder: 40 },
  { id: 'del_structural_report', key: 'structural-assessment-report', label: 'Structural assessment report', sortOrder: 50 },
  { id: 'del_inspection_report', key: 'inspection-report', label: 'Inspection report', sortOrder: 60 },
  { id: 'del_soil_report', key: 'soil-geotechnical-report', label: 'Soil / geotechnical report', sortOrder: 70 },
  { id: 'del_boq', key: 'bill-of-quantities', label: 'Bill of Quantities', sortOrder: 80 },
  { id: 'del_cost_plan', key: 'cost-plan', label: 'Cost plan', sortOrder: 90 },
  { id: 'del_tender_analysis', key: 'tender-analysis', label: 'Tender analysis', sortOrder: 100 },
  { id: 'del_stage_valuation', key: 'stage-valuation-report', label: 'Stage valuation report', sortOrder: 110 },
  { id: 'del_variation', key: 'variation-assessment', label: 'Variation assessment', sortOrder: 120 },
  { id: 'del_final_account', key: 'final-account', label: 'Final account', sortOrder: 130 },
  { id: 'del_survey_plan', key: 'survey-plan', label: 'Survey plan', sortOrder: 140 },
  { id: 'del_topo', key: 'topographical-survey', label: 'Topographical survey', sortOrder: 150 },
  { id: 'del_setout', key: 'setting-out-report', label: 'Setting-out report', sortOrder: 160 },
  { id: 'del_legal_opinion', key: 'title-search-legal-opinion', label: 'Title search / legal opinion', sortOrder: 170 },
  { id: 'del_contract_review', key: 'contract-review', label: 'Contract review', sortOrder: 180 },
  { id: 'del_valuation', key: 'property-valuation-report', label: 'Property valuation report', sortOrder: 190 },
  { id: 'del_electrical', key: 'electrical-inspection-report', label: 'Electrical inspection report', sortOrder: 200 },
  { id: 'del_mechanical', key: 'mechanical-services-report', label: 'Mechanical services report', sortOrder: 210 },
  { id: 'del_snag', key: 'snag-list', label: 'Snag list', sortOrder: 220 },
  { id: 'del_hse', key: 'health-safety-report', label: 'Health & safety report', sortOrder: 230 },
  { id: 'del_programme', key: 'construction-programme', label: 'Construction programme', sortOrder: 240 },
  { id: 'del_qmp', key: 'quality-management-plan', label: 'Quality-management plan', sortOrder: 250 },
  { id: 'del_method', key: 'method-statement', label: 'Method statement', sortOrder: 260 },
  { id: 'del_env', key: 'environmental-assessment-report', label: 'Environmental assessment/report', sortOrder: 270 },
  { id: 'del_asbuilt', key: 'as-built-drawings', label: 'As-built drawings', sortOrder: 280 },
  { id: 'del_handover', key: 'handover-report', label: 'Handover report', sortOrder: 290 },
];

export const PROJECT_STAGES: NamedSeed[] = [
  { id: 'pstage_pre_acquisition', key: 'pre-acquisition', label: 'Pre-acquisition', sortOrder: 10 },
  { id: 'pstage_site_dd', key: 'site-due-diligence', label: 'Site due diligence', sortOrder: 20 },
  { id: 'pstage_concept', key: 'concept-design', label: 'Concept design', sortOrder: 30 },
  { id: 'pstage_detailed', key: 'detailed-design', label: 'Detailed design', sortOrder: 40 },
  { id: 'pstage_planning', key: 'planning-approvals', label: 'Planning / approvals', sortOrder: 50 },
  { id: 'pstage_precon', key: 'pre-construction', label: 'Pre-construction', sortOrder: 60 },
  { id: 'pstage_procurement', key: 'procurement', label: 'Procurement', sortOrder: 70 },
  { id: 'pstage_site_prep', key: 'site-preparation', label: 'Site preparation', sortOrder: 80 },
  { id: 'pstage_foundation', key: 'foundation', label: 'Foundation', sortOrder: 90 },
  { id: 'pstage_substructure', key: 'substructure', label: 'Substructure', sortOrder: 100 },
  { id: 'pstage_superstructure', key: 'superstructure', label: 'Superstructure', sortOrder: 110 },
  { id: 'pstage_roofing', key: 'roofing', label: 'Roofing', sortOrder: 120 },
  { id: 'pstage_mep', key: 'mep-first-fix', label: 'MEP first fix', sortOrder: 130 },
  { id: 'pstage_finishes', key: 'finishes', label: 'Finishes', sortOrder: 140 },
  { id: 'pstage_external', key: 'external-works', label: 'External works', sortOrder: 150 },
  { id: 'pstage_existing', key: 'existing-building-assessment', label: 'Existing-building assessment', sortOrder: 160 },
  { id: 'pstage_renovation', key: 'renovation', label: 'Renovation', sortOrder: 170 },
  { id: 'pstage_commissioning', key: 'commissioning', label: 'Commissioning', sortOrder: 180 },
  { id: 'pstage_handover', key: 'handover', label: 'Handover', sortOrder: 190 },
  { id: 'pstage_post', key: 'post-completion', label: 'Post-completion', sortOrder: 200 },
  { id: 'pstage_dispute', key: 'dispute-forensic-review', label: 'Dispute / forensic review', sortOrder: 210 },
];

export const NEEDS: NeedSeed[] = [
  { id: 'need_boq', key: 'i-need-a-boq', label: 'I need a BOQ', description: 'Professionals commonly relevant when you need a Bill of Quantities prepared.', primaryProfessionId: 'profession_quantity_surveyor', serviceId: 'service_prepare_boq', sortOrder: 10 },
  { id: 'need_foundation_inspect', key: 'inspect-foundation-before-i-pay', label: 'Inspect my foundation before I pay', description: 'Professionals commonly relevant for an independent foundation check before a payment.', primaryProfessionId: 'profession_structural_engineer', serviceId: 'service_review_foundation', sortOrder: 20 },
  { id: 'need_structurally_safe', key: 'check-if-building-structurally-safe', label: 'Check if this building is structurally safe', description: 'Professionals commonly relevant for structural safety questions. This is not a diagnosis.', primaryProfessionId: 'profession_structural_engineer', serviceId: 'service_structural_inspection', sortOrder: 30 },
  { id: 'need_survey_land', key: 'survey-my-land', label: 'Survey my land', description: 'Professionals commonly relevant for boundary or topographic survey work.', primaryProfessionId: 'profession_land_surveyor', serviceId: 'service_land_survey', sortOrder: 40 },
  { id: 'need_title', key: 'check-title-documents', label: 'Check my title documents', description: 'Professionals commonly relevant for title and legal due diligence.', primaryProfessionId: 'profession_property_lawyer', serviceId: 'service_review_title', sortOrder: 50 },
  { id: 'need_arch_drawings', key: 'prepare-architectural-drawings', label: 'Prepare architectural drawings', description: 'Professionals commonly relevant for design and drawing production.', primaryProfessionId: 'profession_architect', serviceId: 'service_prepare_arch_drawings', sortOrder: 60 },
  { id: 'need_electrical', key: 'check-electrical-work', label: 'Check electrical work', description: 'Professionals commonly relevant for electrical installation review.', primaryProfessionId: 'profession_electrical_engineer', serviceId: 'service_review_electrical', sortOrder: 70 },
  { id: 'need_planning', key: 'help-with-planning-approval', label: 'Help with planning approval', description: 'Town planners or architects are commonly relevant, depending on the approval needed.', primaryProfessionId: 'profession_town_planner', serviceId: 'service_planning_approval', sortOrder: 80 },
  { id: 'need_value', key: 'value-a-property', label: 'Value a property', description: 'Professionals commonly relevant for a formal property valuation.', primaryProfessionId: 'profession_estate_surveyor', serviceId: 'service_valuation', sortOrder: 90 },
  { id: 'need_variation', key: 'review-contractor-variation', label: "Review a contractor's variation", description: 'Professionals commonly relevant when a contractor asks for extra money or scope.', primaryProfessionId: 'profession_quantity_surveyor', serviceId: 'service_review_variation', sortOrder: 100 },
  { id: 'need_soil', key: 'check-soil-foundation-conditions', label: 'Check soil/foundation conditions', description: 'Professionals commonly relevant for soil investigation before or during foundation work.', primaryProfessionId: 'profession_geotechnical_engineer', serviceId: 'service_soil_check', sortOrder: 110 },
  { id: 'need_mep', key: 'inspect-plumbing-hvac-work', label: 'Inspect plumbing/HVAC work', description: 'Professionals commonly relevant for mechanical and plumbing installation review.', primaryProfessionId: 'profession_mechanical_engineer', serviceId: 'service_review_mep', sortOrder: 120 },
];

export const PROCUREMENT_CAPABILITY_TAGS = [
  { key: 'one_off_inspection', label: 'One-off inspection' },
  { key: 'signed_report', label: 'Signed report' },
  { key: 'drawing_review', label: 'Drawing review' },
  { key: 'boq', label: 'BOQ' },
  { key: 'stage_valuation', label: 'Stage valuation' },
  { key: 'variation_review', label: 'Variation review' },
  { key: 'ongoing_supervision', label: 'Ongoing supervision' },
  { key: 'urgent_attendance', label: '24-hour attendance' },
  { key: 'remote_consultation', label: 'Remote consultation' },
  { key: 'occupied_homes', label: 'Occupied homes' },
  { key: 'renovations', label: 'Renovations' },
  { key: 'full_builds', label: 'Full builds' },
  { key: 'accepts_negotiated_rates', label: 'Accepts negotiated BMH rates' },
  { key: 'expert_court_report', label: 'Expert/court report' },
] as const;

export const NIGERIAN_STATES = [
  { key: 'abia', label: 'Abia' },
  { key: 'adamawa', label: 'Adamawa' },
  { key: 'akwa-ibom', label: 'Akwa Ibom' },
  { key: 'anambra', label: 'Anambra' },
  { key: 'bauchi', label: 'Bauchi' },
  { key: 'bayelsa', label: 'Bayelsa' },
  { key: 'benue', label: 'Benue' },
  { key: 'borno', label: 'Borno' },
  { key: 'cross-river', label: 'Cross River' },
  { key: 'delta', label: 'Delta' },
  { key: 'ebonyi', label: 'Ebonyi' },
  { key: 'edo', label: 'Edo' },
  { key: 'ekiti', label: 'Ekiti' },
  { key: 'enugu', label: 'Enugu' },
  { key: 'fct', label: 'Abuja / FCT' },
  { key: 'gombe', label: 'Gombe' },
  { key: 'imo', label: 'Imo' },
  { key: 'jigawa', label: 'Jigawa' },
  { key: 'kaduna', label: 'Kaduna' },
  { key: 'kano', label: 'Kano' },
  { key: 'katsina', label: 'Katsina' },
  { key: 'kebbi', label: 'Kebbi' },
  { key: 'kogi', label: 'Kogi' },
  { key: 'kwara', label: 'Kwara' },
  { key: 'lagos', label: 'Lagos' },
  { key: 'nasarawa', label: 'Nasarawa' },
  { key: 'niger', label: 'Niger' },
  { key: 'ogun', label: 'Ogun' },
  { key: 'ondo', label: 'Ondo' },
  { key: 'osun', label: 'Osun' },
  { key: 'oyo', label: 'Oyo' },
  { key: 'plateau', label: 'Plateau' },
  { key: 'rivers', label: 'Rivers' },
  { key: 'sokoto', label: 'Sokoto' },
  { key: 'taraba', label: 'Taraba' },
  { key: 'yobe', label: 'Yobe' },
  { key: 'zamfara', label: 'Zamfara' },
] as const;
