import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

export type ReportLine = {
  key: string;
  label: string;
  value: number | null;
  unit: 'count' | 'naira' | 'days';
  status: 'ok' | 'partial' | 'not_tracked';
  note?: string;
  previous?: number | null;
};

export type WeeklyReportJob = {
  projectId: string;
  name: string;
  homeownerName: string | null;
  gcName: string | null;
  status: string;
  dormant: boolean;
  stagesApproved: number;
  photosAdded: number;
  photosOnSite: number;
  photosReused: number;
  moneyIn: number;
  sentToContractor: number;
  paidToShopsForMaterials: number;
  paidToTeamMembers: number;
  invoicedNotPaid: number;
  stillWithBuildMyHouse: number;
  openDisputes: number;
};

export type WeeklyReport = {
  weekStart: string;
  weekEnd: string;
  generatedAt: string;
  sections: Array<{ key: string; title: string; lines: ReportLine[] }>;
  jobs: WeeklyReportJob[];
};

export function useWeeklyReport(week?: string) {
  return useQuery({
    queryKey: ['weekly-report', week || 'previous'],
    queryFn: () => api.get<WeeklyReport>(`/admin/reports/weekly${week ? `?week=${week}` : ''}`),
  });
}
