'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

export type ScamReportStatus = 'new' | 'investigating' | 'upheld' | 'dismissed';

export type AdminScamReportRow = {
  id: string;
  status: ScamReportStatus;
  listingKind: string;
  listingName: string;
  listingPath: string;
  amountNaira: number | null;
  incidentDate: string | null;
  createdAt: string;
  reporterName: string;
};

export type AdminScamReport = {
  id: string;
  status: ScamReportStatus;
  listingKind: string;
  listingId: string;
  listingName: string;
  listingPath: string;
  whatHappened: string;
  amountNaira: number | null;
  incidentDate: string | null;
  evidenceUrls: string[];
  contactConsent: boolean;
  contactPhone: string | null;
  reporter: { name: string; email: string; phone: string };
  adminNotes: string | null;
  publicNotice: string | null;
  assignedAdminId: string | null;
  resolvedAt: string | null;
  createdAt: string;
  otherReports: Array<{ id: string; status: ScamReportStatus; createdAt: string; amountNaira: number | null; whatHappened: string }>;
};

export function useScamReports(params: { status?: string; kind?: string; page?: number }) {
  const search = new URLSearchParams();
  if (params.status) search.set('status', params.status);
  if (params.kind) search.set('kind', params.kind);
  if (params.page) search.set('page', String(params.page));
  return useQuery({
    queryKey: ['admin-scam-reports', search.toString()],
    queryFn: () => api.get<{ data: AdminScamReportRow[]; meta: { page: number; total: number } }>(`/admin/scam-reports?${search.toString()}`),
  });
}

export function useScamReport(id: string) {
  return useQuery({
    queryKey: ['admin-scam-report', id],
    queryFn: () => api.get<AdminScamReport>(`/admin/scam-reports/${id}`),
    enabled: !!id,
  });
}

export function useUpdateScamReport(id: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (body: Record<string, unknown>) => api.patch(`/admin/scam-reports/${id}`, body),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ['admin-scam-report', id] });
      client.invalidateQueries({ queryKey: ['admin-scam-reports'] });
      client.invalidateQueries({ queryKey: ['admin-feedback-counts'] });
    },
  });
}
