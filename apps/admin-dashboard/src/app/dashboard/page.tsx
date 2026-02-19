'use client';

import {
  AlertTriangle,
  Banknote,
  Building2,
  CheckCircle2,
  ClipboardList,
  FileWarning,
  ShieldCheck,
  TrendingUp,
  Users,
} from 'lucide-react';

const stats = [
  {
    title: 'Total Users',
    value: '1,284',
    subtitle: '82% verified',
    icon: Users,
    accent: 'border-l-blue-500',
  },
  {
    title: 'Active Builds',
    value: '46',
    subtitle: '12 at risk',
    icon: Building2,
    accent: 'border-l-emerald-500',
  },
  {
    title: 'Payments This Month',
    value: '$412,900',
    subtitle: '98% successful',
    icon: Banknote,
    accent: 'border-l-purple-500',
  },
  {
    title: 'Open Disputes',
    value: '5',
    subtitle: '2 urgent',
    icon: FileWarning,
    accent: 'border-l-amber-500',
  },
];

const alerts = [
  {
    title: 'Project “Lekki Villa” flagged for stalled progress',
    detail: 'No updates for 12 days • GC: Mike’s Construction',
    icon: AlertTriangle,
    tone: 'bg-amber-50 text-amber-700 border-amber-200',
  },
  {
    title: '3 payment attempts failed in the last 24h',
    detail: 'Check Stripe webhook status and retry queue',
    icon: Banknote,
    tone: 'bg-red-50 text-red-700 border-red-200',
  },
  {
    title: '2 GCs pending verification',
    detail: 'Licenses uploaded • awaiting admin review',
    icon: ShieldCheck,
    tone: 'bg-blue-50 text-blue-700 border-blue-200',
  },
];

const activity = [
  { label: 'GC verified', detail: 'Chukwuemeka O. • 32 mins ago', icon: CheckCircle2 },
  { label: 'Project activated', detail: 'Modern Family Home • 2 hrs ago', icon: TrendingUp },
  { label: 'Dispute opened', detail: 'Payment mismatch • 4 hrs ago', icon: FileWarning },
  { label: 'Project paused', detail: 'Banana Island Build • 6 hrs ago', icon: ClipboardList },
];

const quickActions = [
  { label: 'Review GC verifications', icon: ShieldCheck },
  { label: 'Resolve urgent disputes', icon: FileWarning },
  { label: 'Audit stalled projects', icon: ClipboardList },
];

export default function DashboardPage() {
  return (
    <div className="p-8 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold font-poppins">Dashboard Overview</h1>
          <p className="text-gray-500 mt-1">Operational snapshot for homeowners and GCs</p>
        </div>
        <button className="px-4 py-2 rounded-lg bg-gray-900 text-white text-sm">
          Export weekly report
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        {stats.map((stat) => {
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
            {alerts.map((alert) => {
              const Icon = alert.icon;
              return (
                <div
                  key={alert.title}
                  className={`border rounded-lg px-4 py-3 flex items-start gap-3 ${alert.tone}`}
                >
                  <Icon className="w-5 h-5 mt-0.5" />
                  <div>
                    <p className="font-medium">{alert.title}</p>
                    <p className="text-sm opacity-80">{alert.detail}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow p-6">
          <h2 className="text-xl font-semibold font-poppins mb-4">Quick Actions</h2>
          <div className="space-y-2">
            {quickActions.map((action) => {
              const Icon = action.icon;
              return (
                <button
                  key={action.label}
                  className="w-full flex items-center gap-2 px-4 py-3 rounded-lg bg-gray-50 hover:bg-gray-100 text-left"
                >
                  <Icon className="w-4 h-4 text-gray-700" />
                  <span className="text-sm font-medium">{action.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold font-poppins">Recent Activity</h2>
          <span className="text-xs text-gray-400">Updated every 15 mins</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {activity.map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.label} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <div className="w-9 h-9 rounded-full bg-white border flex items-center justify-center">
                  <Icon className="w-4 h-4 text-gray-700" />
                </div>
                <div>
                  <p className="text-sm font-medium">{item.label}</p>
                  <p className="text-xs text-gray-500">{item.detail}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}



