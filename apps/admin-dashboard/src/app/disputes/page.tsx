'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useState } from 'react';
import { Scale, AlertCircle, CheckCircle, XCircle, MessageSquare } from 'lucide-react';

export default function DisputesPage() {
  const queryClient = useQueryClient();
  const [selectedDispute, setSelectedDispute] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['disputes'],
    queryFn: async () => {
      // TODO: Replace with actual disputes endpoint when implemented
      // For now, return mock data structure
      return {
        data: [
          {
            id: '1',
            type: 'payment',
            projectId: 'project-1',
            projectName: 'Home Renovation',
            reportedBy: 'John Doe',
            reportedAt: new Date().toISOString(),
            description: 'Payment was not processed correctly',
            status: 'open',
          },
          {
            id: '2',
            type: 'quality',
            projectId: 'project-2',
            projectName: 'Kitchen Remodel',
            reportedBy: 'Jane Smith',
            reportedAt: new Date().toISOString(),
            description: 'Work quality does not meet expectations',
            status: 'in_review',
          },
        ],
      };
    },
  });

  const resolveDispute = useMutation({
    mutationFn: ({ disputeId, resolution }: { disputeId: string; resolution: string }) =>
      api.patch(`/disputes/${disputeId}/resolve`, { resolution }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['disputes'] });
      setSelectedDispute(null);
    },
  });

  if (isLoading) {
    return <div className="p-8">Loading disputes...</div>;
  }

  const disputes = data?.data || [];

  const statusColors: Record<string, { bg: string; text: string; icon: any }> = {
    open: { bg: 'bg-red-100', text: 'text-red-800', icon: AlertCircle },
    in_review: { bg: 'bg-yellow-100', text: 'text-yellow-800', icon: MessageSquare },
    resolved: { bg: 'bg-green-100', text: 'text-green-800', icon: CheckCircle },
    closed: { bg: 'bg-gray-100', text: 'text-gray-800', icon: XCircle },
  };

  return (
    <div className="p-8">
      <div className="flex items-center gap-2 mb-8">
        <Scale className="w-8 h-8 text-gray-700" />
        <h1 className="text-3xl font-bold font-poppins">Dispute Resolution</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow">
            <div className="p-4 border-b">
              <h2 className="text-xl font-semibold font-poppins">Active Disputes</h2>
            </div>
            <div className="divide-y">
              {disputes.map((dispute: any) => {
                const statusInfo = statusColors[dispute.status] || statusColors.open;
                const StatusIcon = statusInfo.icon;
                return (
                  <div
                    key={dispute.id}
                    className="p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                    onClick={() => setSelectedDispute(dispute.id)}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold">{dispute.projectName}</h3>
                        <p className="text-sm text-gray-600 mt-1">{dispute.description}</p>
                        <p className="text-xs text-gray-500 mt-2">
                          Reported by {dispute.reportedBy} • {new Date(dispute.reportedAt).toLocaleDateString()}
                        </p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${statusInfo.bg} ${statusInfo.text}`}>
                        <StatusIcon className="w-3 h-3" />
                        {dispute.status}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="lg:col-span-1">
          {selectedDispute ? (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4 font-poppins">Resolution</h2>
              <textarea
                placeholder="Enter resolution details..."
                className="w-full h-32 p-3 border rounded-lg mb-4 focus:ring-2 focus:ring-blue-500"
              />
              <div className="space-y-2">
                <button
                  onClick={() => {
                    const resolution = (document.querySelector('textarea') as HTMLTextAreaElement)?.value;
                    if (resolution) {
                      resolveDispute.mutate({ disputeId: selectedDispute, resolution });
                    }
                  }}
                  className="w-full px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 flex items-center justify-center gap-2"
                >
                  <CheckCircle className="w-4 h-4" />
                  Resolve Dispute
                </button>
                <button
                  onClick={() => setSelectedDispute(null)}
                  className="w-full px-4 py-2 border rounded hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4 font-poppins">Dispute Stats</h2>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-600">Open Disputes</p>
                  <p className="text-2xl font-bold font-poppins">
                    {disputes.filter((d: any) => d.status === 'open').length}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">In Review</p>
                  <p className="text-2xl font-bold font-poppins">
                    {disputes.filter((d: any) => d.status === 'in_review').length}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Resolved</p>
                  <p className="text-2xl font-bold font-poppins">
                    {disputes.filter((d: any) => d.status === 'resolved').length}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

