'use client';

import { useMemo, useState } from 'react';
import { CheckCircle2, ShieldCheck } from 'lucide-react';
import { useUnverifiedGCs, useVerifyGC } from '@/hooks/useUnverifiedGCs';

function formatSubmittedAt(dateStr: string) {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return '1 day ago';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  return date.toLocaleDateString();
}

export default function VerificationPage() {
  const [activeTab, setActiveTab] = useState<'gcs' | 'projects'>('gcs');

  const { data: unverifiedGCs = [], isLoading } = useUnverifiedGCs();
  const verifyGC = useVerifyGC();

  const counts = useMemo(() => {
    return {
      gcs: unverifiedGCs.length,
      projects: 0,
    };
  }, [unverifiedGCs.length]);

  const handleApproveGC = async (userId: string) => {
    try {
      await verifyGC.mutateAsync(userId);
    } catch (e: any) {
      alert(e?.message || 'Failed to approve GC');
    }
  };

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold font-poppins">Verification Center</h1>
        <p className="text-gray-500 mt-1">Approve GC identity checks and project plans/documents</p>
      </div>

      <div className="flex gap-3">
        {[
          { key: 'gcs', label: `GCs (${counts.gcs})` },
          { key: 'projects', label: `Project Docs (${counts.projects})` },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as 'gcs' | 'projects')}
            className={`px-4 py-2 rounded-lg text-sm ${
              activeTab === tab.key ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'gcs' && (
        <div className="bg-white rounded-xl shadow p-6 space-y-4">
          {isLoading && (
            <div className="text-center py-12 text-gray-500">Loading unverified GCs…</div>
          )}
          {!isLoading && unverifiedGCs.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              No unverified GCs. All contractors who have opened an account have been verified.
            </div>
          )}
          {!isLoading &&
            unverifiedGCs.map((item) => (
              <div key={item.id} className="flex items-start justify-between border rounded-lg p-4">
                <div>
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <ShieldCheck className="w-4 h-4" /> Submitted {formatSubmittedAt(item.createdAt)}
                  </div>
                  <h3 className="text-lg font-semibold mt-2">{item.name}</h3>
                  <p className="text-sm text-gray-500">{item.email ?? item.user?.email ?? '—'}</p>
                  {item.documents && item.documents.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-3">
                      {item.documents.map((doc) => (
                        <span key={doc} className="px-2 py-1 bg-gray-100 rounded text-xs">
                          {doc}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex flex-col gap-2">
                  <button
                    onClick={() => handleApproveGC(item.userId)}
                    disabled={verifyGC.isPending}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg flex items-center gap-2 disabled:opacity-50"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    Approve GC
                  </button>
                  <a
                    href={`mailto:${item.email ?? item.user?.email ?? ''}`}
                    className="px-4 py-2 border rounded-lg text-sm text-center"
                  >
                    Schedule interview
                  </a>
                </div>
              </div>
            ))}
        </div>
      )}

      {activeTab === 'projects' && (
        <div className="bg-white rounded-xl shadow p-6">
          <div className="text-center py-12 text-gray-500">
            No project documents pending verification.
          </div>
        </div>
      )}
    </div>
  );
}
