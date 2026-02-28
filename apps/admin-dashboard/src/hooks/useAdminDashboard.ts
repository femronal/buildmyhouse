import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

export type DashboardStats = {
  totalUsers: number;
  verifiedPercent: number;
  activeBuilds: number;
  atRiskCount: number;
  paymentsThisMonth: number;
  paymentsSuccessPercent: number;
  openDisputes: number;
  urgentDisputes: number;
};

export type CriticalAlert = {
  type: 'stalled_project' | 'failed_payments' | 'gcs_pending_verification';
  title: string;
  detail: string;
  tone: 'amber' | 'red' | 'blue';
  link?: string;
  data?: Record<string, unknown>;
};

export type RecentActivityItem = {
  type: string;
  label: string;
  detail: string;
  createdAt: string;
  link?: string;
  data?: Record<string, unknown>;
};

export type DashboardResponse = {
  stats: DashboardStats;
  criticalAlerts: CriticalAlert[];
  recentActivity: RecentActivityItem[];
};

export function useAdminDashboard() {
  return useQuery({
    queryKey: ['admin-dashboard'],
    queryFn: () => api.get<DashboardResponse>('/admin/dashboard'),
    refetchInterval: 60_000, // Refetch every minute
    refetchOnWindowFocus: true,
  });
}
