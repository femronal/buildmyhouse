/**
 * Admin Tools hub catalogue — mirrors the consumer tools list.
 * Live tools with ops surfaces set `adminHref`; others are coming soon.
 */
export type AdminToolCategory =
  | 'before-buying'
  | 'hiring-budgeting'
  | 'remote-control'
  | 'completion-disputes'
  | 'repairs-management';

export type AdminToolStatus = 'live' | 'coming-soon';

export type AdminTool = {
  slug: string;
  title: string;
  tagline: string;
  category: AdminToolCategory;
  status: AdminToolStatus;
  featured?: boolean;
  featuredOrder?: number;
  /** When set, the Tools hub opens this admin ops route. */
  adminHref?: string;
  /** Short ops label shown for live tools. */
  opsLabel?: string;
};

export const ADMIN_TOOL_CATEGORIES: {
  key: AdminToolCategory | 'featured';
  label: string;
  description: string;
}[] = [
  { key: 'featured', label: 'Featured', description: 'Priority tools for operations and customer value.' },
  { key: 'before-buying', label: 'Before buying', description: 'Verify land, documents, approvals, and readiness before money moves.' },
  { key: 'hiring-budgeting', label: 'Hiring & budget', description: 'Compare quotes, spot red flags, and plan costs with clearer assumptions.' },
  { key: 'remote-control', label: 'Remote control', description: 'Track stages, evidence, materials, and decisions when you cannot be on site.' },
  { key: 'completion-disputes', label: 'Completion', description: 'Close out work with punch lists, warranties, handovers, and clear records.' },
  { key: 'repairs-management', label: 'Repairs', description: 'Triage issues, track maintenance, and keep multi-property work organized.' },
];

export const ADMIN_TOOLS: AdminTool[] = [

  {
    slug: 'price-checker',
    title: 'Price Checker',
    tagline: 'Current Nigerian building-material prices with confidence.',
    category: 'hiring-budgeting',
    status: 'live',
    featured: true,
    featuredOrder: 1,
    adminHref: '/price-intelligence',
    opsLabel: 'Open Price Intelligence ops',
  },
  {
    slug: 'construction-scam-red-flag-checker',
    title: 'Construction Scam Red-Flag Checker',
    tagline: 'Review a proposed arrangement for warning signs.',
    category: 'hiring-budgeting',
    status: 'coming-soon',
    featured: true,
    featuredOrder: 2,
  },
  {
    slug: 'contractor-quote-comparison',
    title: 'Contractor Quote Comparison Tool',
    tagline: 'Align competing quotations item by item.',
    category: 'hiring-budgeting',
    status: 'coming-soon',
    featured: true,
    featuredOrder: 3,
  },
  {
    slug: 'nigeria-building-cost-planner',
    title: 'Nigeria Building Cost Planner',
    tagline: 'Stage-by-stage budget ranges with dated assumptions.',
    category: 'hiring-budgeting',
    status: 'coming-soon',
    featured: true,
    featuredOrder: 4,
  },
  {
    slug: 'property-repair-triage',
    title: 'Property Repair Triage Assistant',
    tagline: 'Turn symptoms into urgency and the right trade.',
    category: 'repairs-management',
    status: 'coming-soon',
    featured: true,
    featuredOrder: 5,
  },
  {
    slug: 'land-purchase-risk-checker',
    title: 'Land Purchase Risk Checker',
    tagline: 'Structured questions that generate a land risk report.',
    category: 'before-buying',
    status: 'coming-soon',
    featured: true,
    featuredOrder: 6,
  },
  {
    slug: 'property-document-checklist',
    title: 'Property Document Checklist Generator',
    tagline: 'Location-specific document checklists.',
    category: 'before-buying',
    status: 'coming-soon',
  },
  {
    slug: 'survey-plan-review-request',
    title: 'Survey Plan Review Request Tool',
    tagline: 'Upload a plan for registered surveyor review.',
    category: 'before-buying',
    status: 'coming-soon',
  },
  {
    slug: 'building-approval-navigator',
    title: 'Building Approval Navigator',
    tagline: 'Likely documents and steps by state and project type.',
    category: 'before-buying',
    status: 'coming-soon',
  },
  {
    slug: 'pre-purchase-property-inspection',
    title: 'Pre-Purchase Property Inspection App',
    tagline: 'Guided structure, roofing, plumbing, and electrical checks.',
    category: 'before-buying',
    status: 'coming-soon',
  },
  {
    slug: 'property-document-vault',
    title: 'Property Document Vault',
    tagline: 'Titles, drawings, receipts, and agreements in one place.',
    category: 'before-buying',
    status: 'coming-soon',
  },
  {
    slug: 'project-readiness-score',
    title: 'Project Readiness Score',
    tagline: 'Score land, drawings, budget, approvals, and team.',
    category: 'before-buying',
    status: 'coming-soon',
  },
  {
    slug: 'build-buy-or-renovate-calculator',
    title: 'Build, Buy or Renovate Calculator',
    tagline: 'Compare routes using budget, timeline, and use.',
    category: 'before-buying',
    status: 'coming-soon',
  },
  {
    slug: 'plot-to-project-feasibility',
    title: 'Plot-to-Project Feasibility Brief',
    tagline: 'What is realistically buildable on your plot.',
    category: 'before-buying',
    status: 'coming-soon',
  },
  {
    slug: 'abandoned-building-recovery-checker',
    title: 'Abandoned Building Recovery Checker',
    tagline: 'Photos and stage → recommended next steps.',
    category: 'before-buying',
    status: 'coming-soon',
  },
  {
    slug: 'contractor-verification-passport',
    title: 'Contractor Verification Passport',
    tagline: 'Checked identity, company, portfolio, and interview status.',
    category: 'hiring-budgeting',
    status: 'coming-soon',
  },
  {
    slug: 'contractor-interview-scorecard',
    title: 'Contractor Interview Scorecard',
    tagline: 'Consistent questions and graded answers.',
    category: 'hiring-budgeting',
    status: 'coming-soon',
  },
  {
    slug: 'reference-check-manager',
    title: 'Reference Check Manager',
    tagline: 'Structured feedback from past clients.',
    category: 'hiring-budgeting',
    status: 'coming-soon',
  },
  {
    slug: 'scope-of-work-generator',
    title: 'Scope of Work Generator',
    tagline: 'Photos and plain language → draft scope.',
    category: 'hiring-budgeting',
    status: 'coming-soon',
  },
  {
    slug: 'boq-in-plain-english',
    title: 'BOQ in Plain English',
    tagline: 'Understandable explanations without changing quantities.',
    category: 'hiring-budgeting',
    status: 'coming-soon',
  },
  {
    slug: 'labour-versus-materials-analyser',
    title: 'Labour-versus-Materials Analyser',
    tagline: 'Separate labour, materials, transport, and fees.',
    category: 'hiring-budgeting',
    status: 'coming-soon',
  },
  {
    slug: 'budget-contingency-calculator',
    title: 'Budget Contingency Calculator',
    tagline: 'Suggest a planning reserve for uncertainty.',
    category: 'hiring-budgeting',
    status: 'coming-soon',
  },
  {
    slug: 'material-price-watchlist',
    title: 'Material Price Watchlist',
    tagline: 'Track cement, steel, blocks, roofing, and finishes.',
    category: 'hiring-budgeting',
    status: 'coming-soon',
  },
  {
    slug: 'quotation-fairness-review',
    title: 'Quotation Fairness Review Request',
    tagline: 'Independent professional review of a quote.',
    category: 'hiring-budgeting',
    status: 'coming-soon',
  },
  {
    slug: 'professional-role-finder',
    title: 'Professional Role Finder',
    tagline: 'Architect, engineer, QS, surveyor, or artisan?',
    category: 'hiring-budgeting',
    status: 'coming-soon',
  },
  {
    slug: 'project-payment-plan-builder',
    title: 'Project Payment Plan Builder',
    tagline: 'Deposits, stage payments, and retention.',
    category: 'hiring-budgeting',
    status: 'coming-soon',
  },
  {
    slug: 'contract-builder-small-repairs',
    title: 'Contract Builder for Small Repairs',
    tagline: 'Simple scope, timeline, payment, and evidence agreement.',
    category: 'hiring-budgeting',
    status: 'coming-soon',
  },
  {
    slug: 'remote-site-progress-tracker',
    title: 'Remote Site Progress Tracker',
    tagline: 'Stages, percentage status, and evidence.',
    category: 'remote-control',
    status: 'coming-soon',
  },
  {
    slug: 'timestamped-site-evidence-camera',
    title: 'Timestamped Site Evidence Camera',
    tagline: 'Date, time, project, and optional location metadata.',
    category: 'remote-control',
    status: 'coming-soon',
  },
  {
    slug: 'weekly-diaspora-project-digest',
    title: 'Weekly Diaspora Project Digest',
    tagline: 'Completed work, spending, delays, and next steps.',
    category: 'remote-control',
    status: 'coming-soon',
  },
  {
    slug: 'daily-site-diary',
    title: 'Daily Site Diary',
    tagline: 'Workers, weather, tasks, deliveries, and incidents.',
    category: 'remote-control',
    status: 'coming-soon',
  },
  {
    slug: 'contractor-attendance-tracker',
    title: 'Contractor Attendance Tracker',
    tagline: 'Planned versus actual site attendance.',
    category: 'remote-control',
    status: 'coming-soon',
  },
  {
    slug: 'project-delay-alert-system',
    title: 'Project Delay Alert System',
    tagline: 'Flag overdue tasks with recovery dates.',
    category: 'remote-control',
    status: 'coming-soon',
  },
  {
    slug: 'materials-delivery-verifier',
    title: 'Materials Delivery Verifier',
    tagline: 'Match notes, photos, and quantities to orders.',
    category: 'remote-control',
    status: 'coming-soon',
  },
  {
    slug: 'material-usage-reconciliation',
    title: 'Material Usage Reconciliation Tool',
    tagline: 'Purchased, used, remaining, and wasted materials.',
    category: 'remote-control',
    status: 'coming-soon',
  },
  {
    slug: 'site-inventory-register',
    title: 'Site Inventory Register',
    tagline: 'Tools, materials, and equipment on and off site.',
    category: 'remote-control',
    status: 'coming-soon',
  },
  {
    slug: 'receipt-and-invoice-vault',
    title: 'Receipt and Invoice Vault',
    tagline: 'Organise receipts by stage and supplier.',
    category: 'remote-control',
    status: 'coming-soon',
  },
  {
    slug: 'change-order-approval',
    title: 'Change-Order Approval App',
    tagline: 'Approve extras before work begins.',
    category: 'remote-control',
    status: 'coming-soon',
  },
  {
    slug: 'project-decision-log',
    title: 'Project Decision Log',
    tagline: 'Who approved each material, design, or scope decision.',
    category: 'remote-control',
    status: 'coming-soon',
  },
  {
    slug: 'photo-to-milestone-matcher',
    title: 'Photo-to-Milestone Matcher',
    tagline: 'Attach evidence to a specific deliverable.',
    category: 'remote-control',
    status: 'coming-soon',
  },
  {
    slug: 'remote-site-visit-report-builder',
    title: 'Remote Site Visit Report Builder',
    tagline: 'Consistent findings, media, and actions.',
    category: 'remote-control',
    status: 'coming-soon',
  },
  {
    slug: 'independent-stage-verification',
    title: 'Independent Stage Verification Booking',
    tagline: 'Request an unrelated professional before payment.',
    category: 'remote-control',
    status: 'coming-soon',
  },
  {
    slug: 'digital-snagging-punch-list',
    title: 'Digital Snagging and Punch-List App',
    tagline: 'Defects with photos, responsibility, and deadline.',
    category: 'completion-disputes',
    status: 'coming-soon',
  },
  {
    slug: 'completion-acceptance-checklist',
    title: 'Completion Acceptance Checklist',
    tagline: 'What must be inspected before “satisfied”.',
    category: 'completion-disputes',
    status: 'coming-soon',
  },
  {
    slug: 'final-account-reconciliation',
    title: 'Final Account Reconciliation Tool',
    tagline: 'Original quote, changes, payments, and balance.',
    category: 'completion-disputes',
    status: 'coming-soon',
  },
  {
    slug: 'contractor-performance-report',
    title: 'Contractor Performance Report',
    tagline: 'Score communication, timeliness, quality, and resolution.',
    category: 'completion-disputes',
    status: 'coming-soon',
  },
  {
    slug: 'warranty-and-callback-tracker',
    title: 'Warranty and Callback Tracker',
    tagline: 'Warranty periods and repair obligations.',
    category: 'completion-disputes',
    status: 'coming-soon',
  },
  {
    slug: 'dispute-timeline-builder',
    title: 'Dispute Timeline Builder',
    tagline: 'Contracts, payments, messages, and evidence in order.',
    category: 'completion-disputes',
    status: 'coming-soon',
  },
  {
    slug: 'project-handover-pack',
    title: 'Project Handover Pack Generator',
    tagline: 'One downloadable pack for drawings, warranties, and receipts.',
    category: 'completion-disputes',
    status: 'coming-soon',
  },
  {
    slug: 'tenant-maintenance-request-portal',
    title: 'Tenant Maintenance Request Portal',
    tagline: 'Photos, access details, and urgency from tenants.',
    category: 'repairs-management',
    status: 'coming-soon',
  },
  {
    slug: 'multi-property-maintenance-dashboard',
    title: 'Multi-Property Maintenance Dashboard',
    tagline: 'Open repairs, spending, warranties, and recurring issues.',
    category: 'repairs-management',
    status: 'coming-soon',
  },
];
