import { api } from '@/lib/api';

const BASE = '/admin/price-intelligence';
const CATALOGUE = '/admin/price-catalogue';

function qs(params: Record<string, string | number | boolean | undefined | null>): string {
  const sp = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === '') continue;
    sp.set(key, String(value));
  }
  const s = sp.toString();
  return s ? `?${s}` : '';
}

export type PiOverview = {
  queue: {
    openCases: number;
    overdueCases: number;
    criticalOpen: number;
    assignedOpen: number;
    awaitingInfo: number;
    lowConfidenceOpen: number;
  };
  sources: { disabled: number; failingOrDegraded: number };
  intake: { manualPendingReview: number; merchantPendingReview: number };
  delivery24h: { reports: number; insufficientDataItems: number };
  recentAudit: Array<{
    id: string;
    action: string;
    entityType: string;
    entityId: string | null;
    createdAt: string;
    reason: string | null;
  }>;
  generatedAt: string;
};

export type ReviewCaseRow = {
  id: string;
  caseType: string;
  priority: string;
  priorityScore: number;
  priorityReason: string;
  status: string;
  productFamilyKey: string | null;
  productLabel: string | null;
  locationKey: string | null;
  confidenceLabel: string | null;
  confidenceScore: number | null;
  reportId: string | null;
  dueAt: string | null;
  openedAt: string;
  assignedReviewerId: string | null;
  assignedReviewer?: { id: string; fullName: string; email: string } | null;
  report?: { id: string; status: string; currentVersion: number; generatedAt: string | null } | null;
};

export type Paginated<T> = {
  items: T[];
  total: number;
  take: number;
  skip: number;
};

export type ReviewQueueParams = {
  status?: string;
  priority?: string;
  caseType?: string;
  assignedReviewerId?: string;
  productFamilyKey?: string;
  q?: string;
  sort?: 'priority' | 'dueAt' | 'openedAt';
  order?: 'asc' | 'desc';
  take?: number;
  skip?: number;
  overdueOnly?: boolean;
};

export type ReviewCaseWorkspace = ReviewCaseRow & {
  allowedTransitions: string[];
  triggerCode: string;
  triggerDetails?: unknown;
  events: Array<{
    id: string;
    eventType: string;
    fromStatus: string | null;
    toStatus: string | null;
    note: string | null;
    actorAdminId: string | null;
    createdAt: string;
    metadata?: unknown;
  }>;
  report?: {
    id: string;
    status: string;
    currentVersion: number;
    payload?: unknown;
    customerUpdateNotice?: string | null;
    generatedAt?: string | null;
    items?: Array<Record<string, unknown>>;
    revisions?: Array<Record<string, unknown>>;
  } | null;
  reportItem?: Record<string, unknown> | null;
  observation?: Record<string, unknown> | null;
  source?: Record<string, unknown> | null;
  corrections?: Array<Record<string, unknown>>;
};

export type ManualEntry = {
  id: string;
  status: string;
  title: string;
  notes: string | null;
  evidenceFileRef: string | null;
  locationKey: string | null;
  createdByAdminId: string;
  reviewedByAdminId: string | null;
  reviewNote: string | null;
  createdAt: string;
  items?: ManualEntryItem[];
  createdBy?: { id: string; fullName: string; email: string };
};

export type ManualEntryItem = {
  id: string;
  familyKey: string | null;
  productLabel: string;
  brandName: string | null;
  originalWording: string;
  originalPrice: number | string;
  currencyCode: string;
  originalUnitCode: string;
  locationKey: string | null;
  status: string;
  rejectionReason: string | null;
};

export type Merchant = {
  id: string;
  businessName: string;
  tradingName: string | null;
  city: string | null;
  state: string | null;
  verificationStatus: string;
  sourceTier: number;
};

export type MerchantSubmission = {
  id: string;
  status: string;
  title: string;
  notes: string | null;
  channel: string;
  evidenceFileRef: string | null;
  merchantId: string | null;
  createdAt: string;
  submittedAt: string | null;
  merchant?: Merchant | null;
  items?: MerchantSubmissionItem[];
};

export type MerchantSubmissionItem = {
  id: string;
  familyKey: string | null;
  productLabel: string;
  brandName: string | null;
  originalWording: string;
  originalPrice: number | string;
  currencyCode: string;
  originalUnitCode: string;
  locationKey: string | null;
  status: string;
  rejectionReason: string | null;
};

export type SourceRow = {
  id: string;
  code: string;
  name: string;
  tier: number;
  healthStatus: string;
  disabledAt: string | null;
  disabledReason: string | null;
  consecutiveFailures?: number;
  healthNote?: string | null;
  disabledByAdmin?: { id: string; fullName: string; email: string } | null;
  _count?: { observations: number; healthSnapshots: number };
};

export type ReportListItem = {
  id: string;
  status: string;
  currentVersion: number;
  customerUpdateNotice: string | null;
  generatedAt: string | null;
  createdAt: string;
  request?: {
    id: string;
    type: string;
    paymentOrderId: string | null;
    requestedLocation?: { code: string; name: string } | null;
  } | null;
  items: Array<{
    id: string;
    outcome: string;
    typicalPrice: number | string | null;
    rangeLow: number | string | null;
    rangeHigh: number | string | null;
    confidence: string | null;
    sourceCount: number | null;
    unitCode: string | null;
    requestItem?: {
      rawProductName: string;
      family?: { key: string } | null;
    } | null;
  }>;
};

export type ObservationRow = {
  id: string;
  originalWording: string;
  originalPrice: number | string;
  currencyCode: string;
  originalUnitCode: string;
  normalizedPrice: number | string | null;
  normalizedUnitCode: string | null;
  status: string;
  reviewStatus: string;
  collectionMethod: string | null;
  evidenceClass: string | null;
  confidence: number | null;
  checkedDate: string;
  listingDate: string | null;
  family?: { key: string; definition: string | null } | null;
  source?: { id: string; code: string; name: string; tier: number; healthStatus: string } | null;
  seller?: { id: string; name: string } | null;
};

export type SearchDemand = {
  unmatchedQueries: Array<{ normalizedQuery: string; count: number }>;
  insufficientDataDemand: Array<{
    label: string;
    familyKey: string | null;
    count: number;
    lastSeenAt: string;
  }>;
  customRequests: Array<{
    id: string;
    rawQuery: string;
    normalizedQuery: string;
    requestCount: number;
    paidIntentCount: number;
    status: string;
    lastSeenAt: string;
  }>;
  unmatchedTerms: Array<{
    id: string;
    normalizedTerm: string;
    sampleRawQuery: string;
    requestCount: number;
    paidIntentCount: number;
    lastSeenAt: string;
    suggestedFamilyKey: string | null;
    status: string;
  }>;
  generatedAt: string;
};

export type PiSetting = {
  id: string;
  key: string;
  valueJson: unknown;
  updatedByAdminId: string | null;
  updatedAt: string;
};

export type PiReviewer = {
  id: string;
  adminUserId: string;
  active: boolean;
  categoryScope: string[] | null;
  availabilityNotes: string | null;
  maximumOpenCases: number;
  adminUser?: { id: string; fullName: string; email: string };
};

export type AuditLogRow = {
  id: string;
  action: string;
  entityType: string;
  entityId: string | null;
  actorAdminId: string | null;
  reason: string | null;
  createdAt: string;
  beforeJson?: unknown;
  afterJson?: unknown;
  metadata?: unknown;
};

export type CatalogueFamily = {
  key: string;
  name?: string;
  definition?: string | null;
  [key: string]: unknown;
};

export const priceIntelligenceApi = {
  getOverview: () => api.get<PiOverview>(`${BASE}/overview`),

  getReviewQueue: (params: ReviewQueueParams = {}) =>
    api.get<Paginated<ReviewCaseRow>>(`${BASE}/review-queue${qs(params)}`),

  getReviewCase: (id: string) => api.get<ReviewCaseWorkspace>(`${BASE}/review-cases/${id}`),

  assignCase: (id: string, body: { reviewerAdminId?: string } = {}) =>
    api.post(`${BASE}/review-cases/${id}/assign`, body),

  transitionCase: (id: string, body: { toStatus: string; note?: string }) =>
    api.post(`${BASE}/review-cases/${id}/transition`, body),

  addCaseNote: (id: string, body: { note: string }) =>
    api.post(`${BASE}/review-cases/${id}/notes`, body),

  setCasePriority: (id: string, body: { label: string; reason: string }) =>
    api.post(`${BASE}/review-cases/${id}/priority`, body),

  approveCase: (id: string, body: { note?: string } = {}) =>
    api.post(`${BASE}/review-cases/${id}/approve`, body),

  rejectCase: (id: string, body: { note: string }) =>
    api.post(`${BASE}/review-cases/${id}/reject`, body),

  correctObservation: (
    id: string,
    body: {
      originalObservationId: string;
      correctedFields: {
        originalPrice?: number;
        originalUnitCode?: string;
        originalWording?: string;
        currencyCode?: string;
      };
      reason: string;
      correctionType?: string;
    },
  ) => api.post(`${BASE}/review-cases/${id}/correct-observation`, body),

  correctStructured: (
    id: string,
    body: {
      familyKey: string;
      originalWording: string;
      originalPrice: number;
      originalUnitCode: string;
      currencyCode?: string;
      reason: string;
      approvedPrices?: number[];
    },
  ) => api.post(`${BASE}/review-cases/${id}/correct-structured`, body),

  applyReportCorrection: (
    id: string,
    body: {
      reportId: string;
      reason: string;
      approvedPrices?: number[];
      pricingOverride?: {
        typicalPrice?: number | null;
        rangeLow?: number | null;
        rangeHigh?: number | null;
        confidenceLabel?: string;
        confidenceScore?: number;
        status?: 'complete' | 'single_source' | 'insufficient_data';
      };
      customerNotice?: string;
    },
  ) => api.post(`${BASE}/review-cases/${id}/apply-report-correction`, body),

  listManualEntries: (params: { take?: number; skip?: number; status?: string } = {}) =>
    api.get<Paginated<ManualEntry>>(`${BASE}/manual-entries${qs(params)}`),

  getManualEntry: (id: string) => api.get<ManualEntry>(`${BASE}/manual-entries/${id}`),

  createManualEntry: (body: {
    title: string;
    notes?: string;
    evidenceFileRef?: string;
    locationKey?: string;
    items: Array<{
      familyKey?: string;
      productLabel: string;
      brandName?: string;
      originalWording: string;
      originalPrice: number;
      currencyCode?: string;
      originalUnitCode: string;
      locationKey?: string;
    }>;
  }) => api.post<ManualEntry>(`${BASE}/manual-entries`, body),

  submitManualEntry: (id: string) => api.post(`${BASE}/manual-entries/${id}/submit`, {}),

  reviewManualEntry: (
    id: string,
    body: {
      decision: 'approve' | 'reject';
      reviewNote?: string;
      itemDecisions?: Array<{ itemId: string; decision: 'approve' | 'reject'; reason?: string }>;
    },
  ) => api.post(`${BASE}/manual-entries/${id}/review`, body),

  listMerchants: (params: { take?: number; skip?: number } = {}) =>
    api.get<Paginated<Merchant> | { items: Merchant[] }>(`${BASE}/merchants${qs(params)}`),

  createMerchant: (body: {
    businessName: string;
    tradingName?: string;
    sellerType?: string;
    city?: string;
    state?: string;
    sourceTier?: number;
    riskNotes?: string;
    contactPhone?: string;
    contactEmail?: string;
  }) => api.post<Merchant>(`${BASE}/merchants`, body),

  listMerchantSubmissions: (params: { take?: number; skip?: number; status?: string } = {}) =>
    api.get<Paginated<MerchantSubmission>>(`${BASE}/merchant-submissions${qs(params)}`),

  getMerchantSubmission: (id: string) =>
    api.get<MerchantSubmission>(`${BASE}/merchant-submissions/${id}`),

  createMerchantSubmission: (body: {
    merchantId?: string;
    title: string;
    notes?: string;
    channel?: string;
    evidenceFileRef?: string;
    submit?: boolean;
    items: Array<{
      familyKey?: string;
      productLabel: string;
      brandName?: string;
      originalWording: string;
      originalPrice: number;
      currencyCode?: string;
      originalUnitCode: string;
      locationKey?: string;
    }>;
  }) => api.post<MerchantSubmission>(`${BASE}/merchant-submissions`, body),

  extractMerchantListFromImage: (body: { imageUrl: string; hintTitle?: string }) =>
    api.post<{
      items: Array<{
        productLabel: string;
        familyKey: string | null;
        brandName: string | null;
        originalWording: string;
        originalPrice: number;
        originalUnitCode: string;
        currencyCode: string;
        confidence: number;
        notes: string | null;
      }>;
      model: string;
      warnings: string[];
      rawItemCount: number;
    }>(`${BASE}/merchant-submissions/extract-from-image`, body),

  submitMerchantSubmission: (id: string) =>
    api.post(`${BASE}/merchant-submissions/${id}/submit`, {}),

  reviewMerchantItem: (
    submissionId: string,
    itemId: string,
    body: { decision: 'approve' | 'reject'; reason?: string },
  ) => api.post(`${BASE}/merchant-submissions/${submissionId}/items/${itemId}/review`, body),

  listSources: () => api.get<{ items: SourceRow[]; total: number }>(`${BASE}/sources`),

  disableSource: (id: string, body: { reason: string }) =>
    api.post(`${BASE}/sources/${id}/disable`, body),

  enableSource: (id: string, body: { note?: string } = {}) =>
    api.post(`${BASE}/sources/${id}/enable`, body),

  recheckSource: (
    id: string,
    body?: {
      healthStatus?: string;
      successRate?: number;
      parseSuccessRate?: number;
      avgLatencyMs?: number;
      note?: string;
    },
  ) => api.post(`${BASE}/sources/${id}/recheck`, body ?? {}),

  createAlias: (body: { familyKey: string; productKey?: string; alias: string }) =>
    api.post<{ alias: unknown; impactWarnings?: unknown }>(`${BASE}/catalogue/aliases`, body),

  deactivateAlias: (id: string, body: { reason: string }) =>
    api.post(`${BASE}/catalogue/aliases/${id}/deactivate`, body),

  createBrand: (body: { name: string; verified?: boolean }) =>
    api.post(`${BASE}/catalogue/brands`, body),

  deactivateProduct: (body: { familyKey: string; productKey: string; reason: string }) =>
    api.post(`${BASE}/catalogue/products/deactivate`, body),

  listReports: (params: { take?: number; skip?: number; outcome?: string } = {}) =>
    api.get<Paginated<ReportListItem>>(`${BASE}/reports${qs(params)}`),

  listObservations: (
    params: { take?: number; skip?: number; status?: string; reviewStatus?: string } = {},
  ) => api.get<Paginated<ObservationRow>>(`${BASE}/observations${qs(params)}`),

  getSearchDemand: (take?: number) =>
    api.get<SearchDemand>(`${BASE}/search-demand${qs({ take })}`),

  updateUnmatchedTerm: (
    id: string,
    body: { status?: string; suggestedFamilyKey?: string | null },
  ) => api.patch(`${BASE}/unmatched-terms/${id}`, body),

  getSettings: () =>
    api.get<PiSetting[] | { items: PiSetting[] } | Record<string, unknown>>(
      `${BASE}/settings`,
    ),

  upsertSetting: (body: { key: string; valueJson: unknown }) =>
    api.post<PiSetting>(`${BASE}/settings`, body),

  listReviewers: () => api.get<PiReviewer[] | { items: PiReviewer[] }>(`${BASE}/reviewers`),

  upsertReviewer: (body: {
    adminUserId: string;
    active?: boolean;
    categoryScope?: string[] | null;
    availabilityNotes?: string | null;
    maximumOpenCases?: number;
  }) => api.post<PiReviewer>(`${BASE}/reviewers`, body),

  setReviewerActive: (adminUserId: string, body: { active: boolean }) =>
    api.post(`${BASE}/reviewers/${adminUserId}/active`, body),

  getAuditLog: (params: {
    entityType?: string;
    entityId?: string;
    action?: string;
    take?: number;
    skip?: number;
  } = {}) => api.get<Paginated<AuditLogRow>>(`${BASE}/audit-log${qs(params)}`),

  getCatalogueOverview: () => api.get<unknown>(`${CATALOGUE}/overview`),

  getCatalogueFamilies: () =>
    api.get<CatalogueFamily[] | { items: CatalogueFamily[] }>(`${CATALOGUE}/families`),

  uploadEvidence: async (file: File): Promise<string> => {
    const result = await api.uploadFile(file);
    return result.url;
  },
};
