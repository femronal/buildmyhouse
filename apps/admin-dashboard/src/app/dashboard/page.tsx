'use client';

import { useDashboard } from '@/hooks/useDashboard';
import { Users, Building2, DollarSign, Package, TrendingUp, Clock, CheckCircle2 } from 'lucide-react';

export default function DashboardPage() {
  const { data, isLoading, error } = useDashboard();

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="text-center">Loading dashboard...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="text-red-500">Error loading dashboard</div>
      </div>
    );
  }

  const stats = [
    {
      title: 'Total Users',
      value: data?.users?.total || 0,
      subtitle: `${data?.users?.verified || 0} verified`,
      color: 'blue',
      icon: Users,
    },
    {
      title: 'Active Projects',
      value: data?.projects?.total || 0,
      subtitle: `${data?.projects?.active || 0} in progress`,
      color: 'green',
      icon: Building2,
    },
    {
      title: 'Total Payments',
      value: `$${data?.payments?.total?.toLocaleString() || 0}`,
      subtitle: `${data?.payments?.completed || 0} completed`,
      color: 'purple',
      icon: DollarSign,
    },
    {
      title: 'Marketplace Items',
      value: data?.materials?.total || 0,
      subtitle: 'Materials & Contractors',
      color: 'orange',
      icon: Package,
    },
  ];

  const colorClasses = {
    blue: 'border-l-blue-500 bg-blue-50',
    green: 'border-l-green-500 bg-green-50',
    purple: 'border-l-purple-500 bg-purple-50',
    orange: 'border-l-orange-500 bg-orange-50',
  };

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-8 font-poppins">Dashboard Overview</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div
              key={index}
              className={`bg-white rounded-lg shadow p-6 border-l-4 ${colorClasses[stat.color as keyof typeof colorClasses]}`}
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-gray-600 text-sm font-medium">{stat.title}</h3>
                <Icon className={`w-5 h-5 text-${stat.color}-500`} />
              </div>
              <p className="text-3xl font-bold mb-1 font-poppins">{stat.value}</p>
              <p className="text-gray-500 text-sm">{stat.subtitle}</p>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4 font-poppins">Recent Activity</h2>
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded">
              <TrendingUp className="w-5 h-5 text-green-500" />
              <div className="flex-1">
                <p className="text-sm font-medium">New project created</p>
                <p className="text-xs text-gray-500">2 hours ago</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded">
              <CheckCircle2 className="w-5 h-5 text-blue-500" />
              <div className="flex-1">
                <p className="text-sm font-medium">User verified</p>
                <p className="text-xs text-gray-500">5 hours ago</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded">
              <DollarSign className="w-5 h-5 text-purple-500" />
              <div className="flex-1">
                <p className="text-sm font-medium">Payment processed</p>
                <p className="text-xs text-gray-500">1 day ago</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4 font-poppins">Quick Actions</h2>
          <div className="space-y-2">
            <button className="w-full text-left px-4 py-3 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              Verify Pending Users
            </button>
            <button className="w-full text-left px-4 py-3 bg-green-50 hover:bg-green-100 rounded-lg transition-colors flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Review Disputes
            </button>
            <button className="w-full text-left px-4 py-3 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors flex items-center gap-2">
              <Building2 className="w-4 h-4" />
              Monitor Active Projects
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

