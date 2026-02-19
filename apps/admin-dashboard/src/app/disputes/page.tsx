'use client';

import { useMemo, useState } from 'react';
import {
  AlertCircle,
  CheckCircle,
  ClipboardList,
  MessageSquare,
  ShieldAlert,
} from 'lucide-react';

const mockDisputes = [
  {
    id: 'disp-1',
    project: 'Home Renovation',
    homeowner: 'John Doe',
    gc: 'Mike’s Construction LLC',
    category: 'Payment',
    severity: 'high',
    status: 'open',
    openedAt: '2/1/2026',
    description: 'Milestone payment was marked complete but funds were not transferred.',
    assignedTo: 'Admin Ayo',
    slaHours: 24,
  },
  {
    id: 'disp-2',
    project: 'Kitchen Remodel',
    homeowner: 'Jane Smith',
    gc: 'Premium Construction Services',
    category: 'Quality',
    severity: 'medium',
    status: 'in_review',
    openedAt: '2/1/2026',
    description: 'Work quality does not meet expectations, requesting rework.',
    assignedTo: 'Admin Tobi',
    slaHours: 48,
  },
  {
    id: 'disp-3',
    project: 'Abuja Duplex',
    homeowner: 'Ada Pending',
    gc: 'Nigeria Builders Co.',
    category: 'Timeline',
    severity: 'low',
    status: 'resolved',
    openedAt: '1/28/2026',
    description: 'Project pause due to materials backlog.',
    assignedTo: 'Admin Ayo',
    slaHours: 72,
  },
];

export default function DisputesPage() {
  const [selectedId, setSelectedId] = useState(mockDisputes[0]?.id ?? null);
  const [statusFilter, setStatusFilter] = useState('all');

  const filtered = useMemo(() => {
    return mockDisputes.filter((dispute) => statusFilter === 'all' || dispute.status === statusFilter);
  }, [statusFilter]);

  const selected = mockDisputes.find((dispute) => dispute.id === selectedId);

  const statusStyles: Record<string, string> = {
    open: 'bg-red-100 text-red-700',
    in_review: 'bg-amber-100 text-amber-700',
    resolved: 'bg-green-100 text-green-700',
  };

  const severityStyles: Record<string, string> = {
    high: 'bg-red-50 text-red-700',
    medium: 'bg-amber-50 text-amber-700',
    low: 'bg-green-50 text-green-700',
  };

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold font-poppins">Dispute Resolution</h1>
        <p className="text-gray-500 mt-1">Track, investigate, and resolve payment and quality issues</p>
      </div>

      <div className="flex items-center gap-4">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">All Status</option>
          <option value="open">Open</option>
          <option value="in_review">In Review</option>
          <option value="resolved">Resolved</option>
        </select>
        <button className="px-4 py-2 rounded-lg bg-gray-900 text-white text-sm">Export disputes</button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 bg-white rounded-xl shadow">
          <div className="p-4 border-b flex items-center justify-between">
            <h2 className="text-lg font-semibold">Cases</h2>
            <span className="text-xs text-gray-400">{filtered.length} total</span>
          </div>
          <div className="divide-y">
            {filtered.map((dispute) => (
              <button
                key={dispute.id}
                onClick={() => setSelectedId(dispute.id)}
                className={`w-full text-left p-4 hover:bg-gray-50 ${
                  selectedId === dispute.id ? 'bg-gray-50' : ''
                }`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-semibold">{dispute.project}</p>
                    <p className="text-sm text-gray-500">
                      {dispute.category} • {dispute.homeowner} vs {dispute.gc}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">Opened {dispute.openedAt}</p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span className={`px-2 py-1 text-xs rounded-full ${statusStyles[dispute.status]}`}>
                      {dispute.status.replace('_', ' ')}
                    </span>
                    <span className={`px-2 py-1 text-xs rounded-full ${severityStyles[dispute.severity]}`}>
                      {dispute.severity} severity
                    </span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow p-6 space-y-4">
          {selected ? (
            <>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <ShieldAlert className="w-4 h-4" />
                SLA target: {selected.slaHours} hrs
              </div>
              <h3 className="text-xl font-semibold">{selected.project}</h3>
              <p className="text-sm text-gray-500">{selected.category} dispute</p>
              <p className="text-sm text-gray-700">{selected.description}</p>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-gray-500">Homeowner</p>
                  <p className="font-medium">{selected.homeowner}</p>
                </div>
                <div>
                  <p className="text-gray-500">GC</p>
                  <p className="font-medium">{selected.gc}</p>
                </div>
                <div>
                  <p className="text-gray-500">Assigned to</p>
                  <p className="font-medium">{selected.assignedTo}</p>
                </div>
                <div>
                  <p className="text-gray-500">Opened</p>
                  <p className="font-medium">{selected.openedAt}</p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <button className="px-3 py-2 text-sm border rounded-lg flex items-center gap-1">
                  <MessageSquare className="w-4 h-4" />
                  Message parties
                </button>
                <button className="px-3 py-2 text-sm border rounded-lg flex items-center gap-1">
                  <ClipboardList className="w-4 h-4" />
                  Request evidence
                </button>
              </div>

              <div className="border rounded-lg p-3">
                <p className="text-xs text-gray-500 mb-2">Resolution notes</p>
                <textarea
                  className="w-full h-24 border rounded-lg p-2 text-sm"
                  placeholder="Add resolution notes..."
                />
                <div className="flex gap-2 mt-3">
                  <button className="flex-1 px-3 py-2 bg-green-600 text-white rounded-lg flex items-center justify-center gap-2 text-sm">
                    <CheckCircle className="w-4 h-4" />
                    Resolve
                  </button>
                  <button className="flex-1 px-3 py-2 bg-amber-100 text-amber-700 rounded-lg text-sm">
                    Mark in review
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="text-center text-gray-500">
              <AlertCircle className="w-8 h-8 mx-auto mb-2" />
              Select a dispute to view details.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}



