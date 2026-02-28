'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  CheckCircle,
  Mail,
  ShieldAlert,
} from 'lucide-react';
import { useDisputes, type DisputeStatus } from '@/hooks/useDisputes';

export default function DisputesPage() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<'all' | DisputeStatus>('all');
  const [resolutionNotes, setResolutionNotes] = useState('');
  const { disputes, isLoading, updateDisputeStatus, isUpdatingStatus } = useDisputes(statusFilter);

  useEffect(() => {
    if (!selectedId && disputes.length > 0) {
      setSelectedId(disputes[0].id);
    }
    if (selectedId && !disputes.some((dispute) => dispute.id === selectedId)) {
      setSelectedId(disputes[0]?.id ?? null);
    }
  }, [disputes, selectedId]);

  const selected = useMemo(
    () => disputes.find((dispute) => dispute.id === selectedId) ?? null,
    [disputes, selectedId],
  );

  useEffect(() => {
    setResolutionNotes(selected?.resolutionNotes || '');
  }, [selected?.id, selected?.resolutionNotes]);

  const statusStyles: Record<string, string> = {
    open: 'bg-red-100 text-red-700',
    in_review: 'bg-amber-100 text-amber-700',
    resolved: 'bg-green-100 text-green-700',
  };

  const statusOptions: Array<'all' | DisputeStatus> = ['all', 'open', 'in_review', 'resolved'];

  const sendEmail = (email?: string | null) => {
    if (!email) return;
    if (typeof window !== 'undefined') {
      window.location.href = `mailto:${email}`;
    }
  };

  const handleStatusUpdate = async (status: DisputeStatus) => {
    if (!selected) return;
    await updateDisputeStatus({
      disputeId: selected.id,
      status,
      resolutionNotes: resolutionNotes.trim() || undefined,
    });
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
          onChange={(e) => setStatusFilter(e.target.value as 'all' | DisputeStatus)}
          className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
        >
          {statusOptions.map((status) => (
            <option key={status} value={status}>
              {status === 'all' ? 'All Status' : status.replace('_', ' ')}
            </option>
          ))}
        </select>
        <button className="px-4 py-2 rounded-lg bg-gray-900 text-white text-sm">Export disputes</button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 bg-white rounded-xl shadow">
          <div className="p-4 border-b flex items-center justify-between">
            <h2 className="text-lg font-semibold">Cases</h2>
            <span className="text-xs text-gray-400">{disputes.length} total</span>
          </div>
          {isLoading ? (
            <div className="p-8 text-center text-gray-500">Loading disputes...</div>
          ) : disputes.length === 0 ? (
            <div className="p-8 text-center text-gray-500">No disputes reported yet.</div>
          ) : (
            <div className="divide-y">
              {disputes.map((dispute) => (
                <button
                  key={dispute.id}
                  onClick={() => setSelectedId(dispute.id)}
                  className={`w-full text-left p-4 hover:bg-gray-50 ${
                    selectedId === dispute.id ? 'bg-gray-50' : ''
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-semibold">{dispute.project.name}</p>
                      <p className="text-sm text-gray-500">
                        Stage: {dispute.stage.name} • {dispute.homeowner.fullName} vs{' '}
                        {dispute.generalContractor?.fullName || 'Unassigned GC'}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        Opened {new Date(dispute.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <span className={`px-2 py-1 text-xs rounded-full ${statusStyles[dispute.status]}`}>
                        {dispute.status.replace('_', ' ')}
                      </span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl shadow p-6 space-y-4">
          {selected ? (
            <>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <ShieldAlert className="w-4 h-4" />
                Case ID: {selected.id.slice(0, 8)}
              </div>
              <h3 className="text-xl font-semibold">{selected.project.name}</h3>
              <p className="text-sm text-gray-500">Stage: {selected.stage.name}</p>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-gray-500">Homeowner</p>
                  <p className="font-medium">{selected.homeowner.fullName}</p>
                </div>
                <div>
                  <p className="text-gray-500">GC</p>
                  <p className="font-medium">{selected.generalContractor?.fullName || 'Unassigned'}</p>
                </div>
                <div>
                  <p className="text-gray-500">Project Stage</p>
                  <p className="font-medium">{selected.stage.name}</p>
                </div>
                <div>
                  <p className="text-gray-500">Opened</p>
                  <p className="font-medium">{new Date(selected.createdAt).toLocaleDateString()}</p>
                </div>
              </div>

              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">Reported reasons</p>
                <ul className="list-disc pl-5 text-sm text-gray-700 space-y-1">
                  {selected.reasons.map((reason) => (
                    <li key={reason}>{reason}</li>
                  ))}
                  {selected.otherReason ? <li>Other: {selected.otherReason}</li> : null}
                </ul>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => sendEmail(selected.generalContractor?.email)}
                  className="px-3 py-2 text-sm border rounded-lg flex items-center gap-1"
                >
                  <Mail className="w-4 h-4" />
                  Message GC
                </button>
                <button
                  onClick={() => sendEmail(selected.homeowner.email)}
                  className="px-3 py-2 text-sm border rounded-lg flex items-center gap-1"
                >
                  <Mail className="w-4 h-4" />
                  Message Homeowner
                </button>
              </div>

              <div className="border rounded-lg p-3">
                <p className="text-xs text-gray-500 mb-2">Resolution notes</p>
                <textarea
                  value={resolutionNotes}
                  onChange={(e) => setResolutionNotes(e.target.value)}
                  className="w-full h-24 border rounded-lg p-2 text-sm"
                  placeholder="Add resolution notes..."
                />
                <div className="flex gap-2 mt-3">
                  <button
                    disabled={isUpdatingStatus}
                    onClick={() => void handleStatusUpdate('resolved')}
                    className="flex-1 px-3 py-2 bg-green-600 text-white rounded-lg flex items-center justify-center gap-2 text-sm disabled:opacity-50"
                  >
                    <CheckCircle className="w-4 h-4" />
                    Resolve
                  </button>
                  <button
                    disabled={isUpdatingStatus}
                    onClick={() => void handleStatusUpdate('in_review')}
                    className="flex-1 px-3 py-2 bg-amber-100 text-amber-700 rounded-lg text-sm disabled:opacity-50"
                  >
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



