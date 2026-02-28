'use client';

import Link from 'next/link';
import {
  AlertTriangle,
  Banknote,
  Building2,
  ClipboardList,
  FileWarning,
  Loader2,
  ShieldCheck,
  Users,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import NotificationBell from '@/components/NotificationBell';
import { useAdminDashboard, type CriticalAlert } from '@/hooks/useAdminDashboard';

function getAlertIcon(type: CriticalAlert['type']) {
  switch (type) {
    case 'stalled_project':
      return AlertTriangle;
    case 'failed_payments':
      return Banknote;
    case 'gcs_pending_verification':
      return ShieldCheck;
    default:
      return AlertTriangle;
  }
}

function getAlertTone(tone: CriticalAlert['tone']) {
  switch (tone) {
    case 'amber':
      return 'bg-amber-50 text-amber-700 border-amber-200';
    case 'red':
      return 'bg-red-50 text-red-700 border-red-200';
    case 'blue':
      return 'bg-blue-50 text-blue-700 border-blue-200';
    default:
      return 'bg-gray-50 text-gray-700 border-gray-200';
  }
}

function getActivityIcon(type: string) {
  if (type.includes('dispute')) return FileWarning;
  if (type.includes('payment') || type.includes('manual')) return Banknote;
  if (type.includes('verification') || type.includes('gc')) return ShieldCheck;
  if (type.includes('stage') || type.includes('project')) return Building2;
  return ClipboardList;
}

const quickActions = [
  { label: 'Review GC verifications', icon: ShieldCheck, href: '/verification' },
  { label: 'Resolve urgent disputes', icon: FileWarning, href: '/disputes' },
  { label: 'Audit stalled projects', icon: ClipboardList, href: '/projects' },
];

export default function DashboardPage() {
  const { data, isLoading, error } = useAdminDashboard();

  if (isLoading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-10 h-10 animate-spin text-gray-400" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          Failed to load dashboard. Please try again.
        </div>
      </div>
    );
  }

  const stats = data?.stats ?? {
    totalUsers: 0,
    verifiedPercent: 0,
    activeBuilds: 0,
    atRiskCount: 0,
    paymentsThisMonth: 0,
    paymentsSuccessPercent: 100,
    openDisputes: 0,
    urgentDisputes: 0,
  };
  const criticalAlerts = data?.criticalAlerts ?? [];
  const recentActivity = data?.recentActivity ?? [];

  const statCards = [
    {
      title: 'Total Users',
      value: stats.totalUsers.toLocaleString(),
      subtitle: `${stats.verifiedPercent}% verified`,
      icon: Users,
      accent: 'border-l-blue-500',
    },
    {
      title: 'Active Builds',
      value: stats.activeBuilds.toString(),
      subtitle: stats.atRiskCount > 0 ? `${stats.atRiskCount} at risk` : 'All on track',
      icon: Building2,
      accent: 'border-l-emerald-500',
    },
    {
      title: 'Payments This Month',
      value: `₦${stats.paymentsThisMonth.toLocaleString()}`,
      subtitle: `${stats.paymentsSuccessPercent}% successful`,
      icon: Banknote,
      accent: 'border-l-purple-500',
    },
    {
      title: 'Open Disputes',
      value: stats.openDisputes.toString(),
      subtitle: stats.urgentDisputes > 0 ? `${stats.urgentDisputes} urgent` : 'None urgent',
      icon: FileWarning,
      accent: 'border-l-amber-500',
    },
  ];

  return (
    <div className="p-8 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold font-poppins">Dashboard Overview</h1>
          <p className="text-gray-500 mt-1">Operational snapshot for homeowners and GCs</p>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          <NotificationBell />
          <button className="px-4 py-2 rounded-lg bg-gray-900 text-white text-sm">
            Export weekly report
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.title} className={`bg-white rounded-xl shadow p-6 border-l-4 ${stat.accent}`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm">{stat.title}</p>
                  <p className="text-2xl font-bold mt-2 font-poppins">{stat.value}</p>
                  <p className="text-xs text-gray-500 mt-1">{stat.subtitle}</p>
                </div>
                <div className="w-11 h-11 rounded-full bg-gray-100 flex items-center justify-center">
                  <Icon className="w-5 h-5 text-gray-700" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 bg-white rounded-xl shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold font-poppins">Critical Alerts</h2>
            <span className="text-xs text-gray-400">Last 24 hours</span>
          </div>
          <div className="space-y-3">
            {criticalAlerts.length === 0 ? (
              <div className="py-8 text-center text-gray-500 text-sm">
                No critical alerts at the moment
              </div>
            ) : (
              criticalAlerts.map((alert) => {
                const Icon = getAlertIcon(alert.type);
                const tone = getAlertTone(alert.tone);
                const content = (
                  <div
                    key={alert.title}
                    className={`border rounded-lg px-4 py-3 flex items-start gap-3 ${tone}`}
                  >
                    <Icon className="w-5 h-5 mt-0.5 shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="font-medium">{alert.title}</p>
                      <p className="text-sm opacity-80">{alert.detail}</p>
                    </div>
                  </div>
                );
                return alert.link ? (
                  <Link key={alert.title} href={alert.link}>
                    {content}
                  </Link>
                ) : (
                  <div key={alert.title}>{content}</div>
                );
              })
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow p-6">
          <h2 className="text-xl font-semibold font-poppins mb-4">Quick Actions</h2>
          <div className="space-y-2">
            {quickActions.map((action) => {
              const Icon = action.icon;
              return (
                <Link
                  key={action.label}
                  href={action.href}
                  className="w-full flex items-center gap-2 px-4 py-3 rounded-lg bg-gray-50 hover:bg-gray-100 text-left transition-colors"
                >
                  <Icon className="w-4 h-4 text-gray-700" />
                  <span className="text-sm font-medium">{action.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold font-poppins">Recent Activity</h2>
          <span className="text-xs text-gray-400">Updated every minute</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {recentActivity.length === 0 ? (
            <div className="col-span-2 py-8 text-center text-gray-500 text-sm">
              No recent activity
            </div>
          ) : (
            recentActivity.map((item) => {
              const Icon = getActivityIcon(item.type);
              const timeAgo = formatDistanceToNow(new Date(item.createdAt), { addSuffix: true });
              const content = (
                <div key={`${item.type}-${item.createdAt}`} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="w-9 h-9 rounded-full bg-white border flex items-center justify-center shrink-0">
                    <Icon className="w-4 h-4 text-gray-700" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">{item.label}</p>
                    <p className="text-xs text-gray-500 line-clamp-2">{item.detail}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{timeAgo}</p>
                  </div>
                </div>
              );
              return item.link ? (
                <Link key={`${item.type}-${item.createdAt}`} href={item.link}>
                  {content}
                </Link>
              ) : (
                <div key={`${item.type}-${item.createdAt}`}>{content}</div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
