'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  priceIntelligenceApi,
  type ReviewQueueParams,
} from '@/lib/price-intelligence-api';

const KEYS = {
  overview: ['pi', 'overview'] as const,
  queue: (params: ReviewQueueParams) => ['pi', 'review-queue', params] as const,
  case: (id: string) => ['pi', 'review-case', id] as const,
  reports: (params: object) => ['pi', 'reports', params] as const,
  observations: (params: object) => ['pi', 'observations', params] as const,
  manualEntries: (params: object) => ['pi', 'manual-entries', params] as const,
  merchants: ['pi', 'merchants'] as const,
  merchantSubs: (params: object) => ['pi', 'merchant-submissions', params] as const,
  merchantSub: (id: string) => ['pi', 'merchant-submission', id] as const,
  sources: ['pi', 'sources'] as const,
  searchDemand: ['pi', 'search-demand'] as const,
  settings: ['pi', 'settings'] as const,
  reviewers: ['pi', 'reviewers'] as const,
  audit: (params: object) => ['pi', 'audit', params] as const,
  catalogueFamilies: ['pi', 'catalogue-families'] as const,
  catalogueOverview: ['pi', 'catalogue-overview'] as const,
};

export function usePiOverview() {
  return useQuery({
    queryKey: KEYS.overview,
    queryFn: () => priceIntelligenceApi.getOverview(),
    refetchInterval: 30_000,
  });
}

export function usePiReviewQueue(params: ReviewQueueParams) {
  return useQuery({
    queryKey: KEYS.queue(params),
    queryFn: () => priceIntelligenceApi.getReviewQueue(params),
  });
}

export function usePiReviewCase(id: string) {
  return useQuery({
    queryKey: KEYS.case(id),
    queryFn: () => priceIntelligenceApi.getReviewCase(id),
    enabled: !!id,
  });
}

export function usePiCaseMutations(caseId: string) {
  const qc = useQueryClient();
  const invalidate = () => {
    void qc.invalidateQueries({ queryKey: ['pi', 'review-case', caseId] });
    void qc.invalidateQueries({ queryKey: ['pi', 'review-queue'] });
    void qc.invalidateQueries({ queryKey: KEYS.overview });
  };

  return {
    assign: useMutation({
      mutationFn: () => priceIntelligenceApi.assignCase(caseId),
      onSuccess: invalidate,
    }),
    transition: useMutation({
      mutationFn: (body: { toStatus: string; note?: string }) =>
        priceIntelligenceApi.transitionCase(caseId, body),
      onSuccess: invalidate,
    }),
    addNote: useMutation({
      mutationFn: (note: string) => priceIntelligenceApi.addCaseNote(caseId, { note }),
      onSuccess: invalidate,
    }),
    approve: useMutation({
      mutationFn: (note?: string) => priceIntelligenceApi.approveCase(caseId, { note }),
      onSuccess: invalidate,
    }),
    reject: useMutation({
      mutationFn: (note: string) => priceIntelligenceApi.rejectCase(caseId, { note }),
      onSuccess: invalidate,
    }),
    correctStructured: useMutation({
      mutationFn: (body: Parameters<typeof priceIntelligenceApi.correctStructured>[1]) =>
        priceIntelligenceApi.correctStructured(caseId, body),
      onSuccess: invalidate,
    }),
    applyReportCorrection: useMutation({
      mutationFn: (body: Parameters<typeof priceIntelligenceApi.applyReportCorrection>[1]) =>
        priceIntelligenceApi.applyReportCorrection(caseId, body),
      onSuccess: invalidate,
    }),
  };
}

export function usePiReports(params: { take?: number; skip?: number; outcome?: string }) {
  return useQuery({
    queryKey: KEYS.reports(params),
    queryFn: () => priceIntelligenceApi.listReports(params),
  });
}

export function usePiObservations(params: {
  take?: number;
  skip?: number;
  status?: string;
  reviewStatus?: string;
}) {
  return useQuery({
    queryKey: KEYS.observations(params),
    queryFn: () => priceIntelligenceApi.listObservations(params),
  });
}

export function usePiManualEntries(params: { take?: number; skip?: number; status?: string }) {
  return useQuery({
    queryKey: KEYS.manualEntries(params),
    queryFn: () => priceIntelligenceApi.listManualEntries(params),
  });
}

export function usePiMerchants() {
  return useQuery({
    queryKey: KEYS.merchants,
    queryFn: async () => {
      const res = await priceIntelligenceApi.listMerchants({ take: 100 });
      return Array.isArray(res) ? res : 'items' in res ? res.items : [];
    },
  });
}

export function usePiMerchantSubmissions(params: {
  take?: number;
  skip?: number;
  status?: string;
}) {
  return useQuery({
    queryKey: KEYS.merchantSubs(params),
    queryFn: () => priceIntelligenceApi.listMerchantSubmissions(params),
  });
}

export function usePiMerchantSubmission(id: string | null) {
  return useQuery({
    queryKey: KEYS.merchantSub(id ?? ''),
    queryFn: () => priceIntelligenceApi.getMerchantSubmission(id!),
    enabled: !!id,
  });
}

export function usePiSources() {
  return useQuery({
    queryKey: KEYS.sources,
    queryFn: () => priceIntelligenceApi.listSources(),
  });
}

export function usePiSearchDemand() {
  return useQuery({
    queryKey: KEYS.searchDemand,
    queryFn: () => priceIntelligenceApi.getSearchDemand(100),
  });
}

export function usePiSettings() {
  return useQuery({
    queryKey: KEYS.settings,
    queryFn: async () => {
      const res = await priceIntelligenceApi.getSettings();
      // Backend returns Record<string, unknown> (merged defaults + DB rows)
      if (Array.isArray(res)) return res;
      if (res && typeof res === 'object' && 'items' in res) {
        return (res as { items: Array<{ key: string; valueJson: unknown }> }).items;
      }
      return Object.entries(res as Record<string, unknown>).map(([key, valueJson]) => ({
        id: key,
        key,
        valueJson,
        updatedByAdminId: null as string | null,
        updatedAt: '',
      }));
    },
  });
}

export function usePiReviewers() {
  return useQuery({
    queryKey: KEYS.reviewers,
    queryFn: async () => {
      const res = await priceIntelligenceApi.listReviewers();
      return Array.isArray(res) ? res : 'items' in res ? res.items : [];
    },
  });
}

export function usePiAuditLog(params: {
  entityType?: string;
  entityId?: string;
  action?: string;
  take?: number;
  skip?: number;
}) {
  return useQuery({
    queryKey: KEYS.audit(params),
    queryFn: () => priceIntelligenceApi.getAuditLog(params),
  });
}

export function usePiCatalogueFamilies() {
  return useQuery({
    queryKey: KEYS.catalogueFamilies,
    queryFn: async () => {
      const res = await priceIntelligenceApi.getCatalogueFamilies();
      return Array.isArray(res) ? res : 'items' in res ? res.items : [];
    },
  });
}

export function usePiCatalogueOverview() {
  return useQuery({
    queryKey: KEYS.catalogueOverview,
    queryFn: () => priceIntelligenceApi.getCatalogueOverview(),
  });
}

export function invalidatePi(qc: ReturnType<typeof useQueryClient>, ...keys: string[]) {
  for (const key of keys) {
    void qc.invalidateQueries({ queryKey: ['pi', key] });
  }
}
