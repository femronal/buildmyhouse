import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

export type AttentionReason =
  | 'no_update'
  | 'high_risk'
  | 'open_dispute'
  | 'approval_overdue'
  | 'flagged_photo'
  | 'extra_monitoring';

export type QueueItem = {
  id: string;
  group: 'money' | 'jobs' | 'trust';
  kind: string;
  title: string;
  detail: string;
  count: number;
  projectId?: string;
  projectName?: string;
  homeownerName?: string;
  stageId?: string;
  stageName?: string;
  amount?: number;
  since: string | null;
  href: string;
  jobHref?: string;
  actionLabel: string;
};

export type LiveJob = {
  id: string;
  name: string;
  homeownerName: string | null;
  gcName: string | null;
  stageNumber: number | null;
  stageCount: number;
  stageName: string | null;
  stageStatus: string | null;
  attention: AttentionReason[];
  moneyMoved: number;
  fullJobPrice: number;
  lastActivityAt: string;
  photos: { onSite: number; fromGallery: number; notChecked: number; reused: number };
  href: string;
};

export type RecentActivityItem = {
  id: string;
  type: string;
  label: string;
  detail: string;
  createdAt: string;
  link?: string;
  data?: Record<string, unknown>;
};

export type DashboardResponse = {
  generatedAt: string;
  strip: {
    needsYou: { total: number; jobs: number; money: number; trust: number };
    liveJobs: { count: number; needAttention: number };
    moneyIn: { label: string; amount: number; count: number };
    openDisputes: { count: number; oldestDays: number | null };
  };
  queue: { money: QueueItem[]; jobs: QueueItem[] };
  dormant: { count: number; examples: Array<{ id: string; name: string; homeownerName: string | null }> };
  liveJobs: LiveJob[];
  moneyThisWeek: { weekStart: string; weekEnd: string; lines: Array<{ key: string; label: string; amount: number }> };
  trust: QueueItem[];
  activity: RecentActivityItem[];
};

export function useAdminDashboard() {
  return useQuery({
    queryKey: ['admin-dashboard'],
    queryFn: () => api.get<DashboardResponse>('/admin/dashboard'),
    refetchInterval: 60_000,
    refetchOnWindowFocus: true,
  });
}
