'use client';

import { useMemo, useState } from 'react';
import { CheckCircle2, ShieldCheck } from 'lucide-react';
import { useUnverifiedGCs, useVerifyGC } from '@/hooks/useUnverifiedGCs';
import {
  useGoLiveDesignPlan,
  usePendingProjectDocs,
  useRejectDesignPlan,
  type PendingDesignDoc,
} from '@/hooks/useProjectDocsVerification';

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
  const [expandedDownloads, setExpandedDownloads] = useState<Record<string, boolean>>({});
  const [feedbackModal, setFeedbackModal] = useState<{
    open: boolean;
    title: string;
    message: string;
  }>({
    open: false,
    title: '',
    message: '',
  });

  const { data: gcs = [], isLoading } = useUnverifiedGCs();
  const verifyGC = useVerifyGC();
  const { data: pendingProjectDocs = [], isLoading: loadingProjectDocs } = usePendingProjectDocs();
  const goLivePlan = useGoLiveDesignPlan();
  const rejectPlan = useRejectDesignPlan();
  const [selectedDesignForGoLive, setSelectedDesignForGoLive] = useState<PendingDesignDoc | null>(null);
  const [selectedDesignForReject, setSelectedDesignForReject] = useState<PendingDesignDoc | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  const counts = useMemo(() => {
    return {
      gcs: gcs.length,
      projects: pendingProjectDocs.length,
    };
  }, [gcs.length, pendingProjectDocs.length]);

  const handleApproveGC = async (userId: string) => {
    try {
      await verifyGC.mutateAsync(userId);
      setFeedbackModal({
        open: true,
        title: 'GC Approved',
        message: 'This GC has been verified successfully.',
      });
    } catch (e: any) {
      setFeedbackModal({
        open: true,
        title: 'Verification Required',
        message: e?.message || 'Failed to approve GC',
      });
    }
  };

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
  const BACKEND_ORIGIN = API_BASE_URL.replace(/\/api\/?$/, '');
  const getAssetUrl = (path?: string | null) => {
    if (!path) return '';
    if (path.startsWith('http')) return path;
    return `${BACKEND_ORIGIN}${path.startsWith('/') ? path : `/${path}`}`;
  };

  const handleGoLive = async () => {
    if (!selectedDesignForGoLive) return;
    try {
      await goLivePlan.mutateAsync(selectedDesignForGoLive.id);
      setSelectedDesignForGoLive(null);
      setFeedbackModal({
        open: true,
        title: 'Plan Is Now Live',
        message:
          'Project document approved successfully. This plan is now live and visible to homeowners. The GC has been notified.',
      });
    } catch (e: any) {
      setFeedbackModal({
        open: true,
        title: 'Go Live Failed',
        message: e?.message || 'Could not publish this plan right now.',
      });
    }
  };

  const handleRejectPlan = async () => {
    if (!selectedDesignForReject) return;
    const reason = rejectReason.trim();
    if (reason.length < 3) {
      setFeedbackModal({
        open: true,
        title: 'Reason required',
        message: 'Please provide at least 3 characters for rejection reason.',
      });
      return;
    }
    try {
      await rejectPlan.mutateAsync({ designId: selectedDesignForReject.id, reason });
      setSelectedDesignForReject(null);
      setRejectReason('');
      setFeedbackModal({
        open: true,
        title: 'Plan Rejected',
        message: 'The plan was rejected and the GC has been notified with your reason.',
      });
    } catch (e: any) {
      setFeedbackModal({
        open: true,
        title: 'Reject Failed',
        message: e?.message || 'Could not reject this plan right now.',
      });
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
            <div className="text-center py-12 text-gray-500">Loading GC accounts…</div>
          )}
          {!isLoading && gcs.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              No GC accounts found.
            </div>
          )}
          {!isLoading &&
            gcs.map((item) => (
              <div key={item.id} className="flex items-start justify-between border rounded-lg p-4">
                <div>
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <ShieldCheck className="w-4 h-4" /> Submitted {formatSubmittedAt(item.createdAt)}
                  </div>
                  <h3 className="text-lg font-semibold mt-2">{item.name}</h3>
                  <p className="text-sm text-gray-500">{item.email ?? item.user?.email ?? '—'}</p>
                  <div className="mt-3 rounded-lg border border-gray-200 p-3 bg-gray-50">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-medium text-gray-700">
                        Verification documents ({item.uploadedRequiredDocumentCount}/{item.requiredDocumentCount})
                      </p>
                      {item.hasUploadedAllVerificationDocuments ? (
                        <span className="text-[11px] px-2 py-1 rounded-full bg-green-100 text-green-700">
                          Ready
                        </span>
                      ) : (
                        <span className="text-[11px] px-2 py-1 rounded-full bg-amber-100 text-amber-700">
                          Pending
                        </span>
                      )}
                    </div>
                    <div className="grid sm:grid-cols-2 gap-2 mt-2">
                      {item.verificationDocuments.map((doc) => (
                        <div
                          key={doc.type}
                          className={`text-xs rounded px-2 py-1 border ${doc.uploaded ? 'bg-green-50 border-green-200 text-green-700' : 'bg-white border-gray-200 text-gray-600'}`}
                        >
                          {doc.title}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  {item.verified ? (
                    <div className="px-4 py-2 bg-green-100 text-green-700 rounded-lg flex items-center gap-2 text-sm font-medium">
                      <CheckCircle2 className="w-4 h-4" />
                      Verified
                    </div>
                  ) : (
                    <button
                      onClick={() => handleApproveGC(item.userId)}
                      disabled={verifyGC.isPending}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg flex items-center gap-2 disabled:opacity-50"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      Approve GC
                    </button>
                  )}
                  <a
                    href={`mailto:${item.email ?? item.user?.email ?? ''}`}
                    className="px-4 py-2 border rounded-lg text-sm text-center"
                  >
                    Schedule interview
                  </a>
                  {item.hasUploadedAllVerificationDocuments && (
                    <button
                      onClick={() =>
                        setExpandedDownloads((prev) => ({ ...prev, [item.id]: !prev[item.id] }))
                      }
                      className="px-4 py-2 border rounded-lg text-sm text-center bg-gray-50"
                    >
                      Download verification files
                    </button>
                  )}
                  {expandedDownloads[item.id] && item.hasUploadedAllVerificationDocuments && (
                    <div className="space-y-2 pt-1">
                      {item.verificationDocuments
                        .filter((doc) => doc.uploaded && doc.fileUrl)
                        .map((doc) => (
                          <a
                            key={doc.type}
                            href={getAssetUrl(doc.fileUrl)}
                            download
                            className="block px-3 py-2 text-xs border rounded-lg text-center hover:bg-gray-50"
                          >
                            Download {doc.title}
                          </a>
                        ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
        </div>
      )}

      {activeTab === 'projects' && (
        <div className="bg-white rounded-xl shadow p-6">
          {loadingProjectDocs && (
            <div className="text-center py-12 text-gray-500">Loading project documents…</div>
          )}
          {!loadingProjectDocs && pendingProjectDocs.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              No project documents pending verification.
            </div>
          )}
          {!loadingProjectDocs && pendingProjectDocs.length > 0 && (
            <div className="space-y-4">
              {pendingProjectDocs.map((doc) => (
                <div key={doc.id} className="border rounded-xl p-4 flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-xs text-gray-500">Submitted {formatSubmittedAt(doc.createdAt)}</p>
                    <h3 className="text-lg font-semibold mt-1">{doc.name}</h3>
                    <p className="text-sm text-gray-500">{doc.createdBy?.fullName} • {doc.createdBy?.email}</p>
                    {doc.description && (
                      <p className="text-sm text-gray-600 mt-2 max-w-2xl">{doc.description}</p>
                    )}
                    <p className="text-sm text-gray-600 mt-2">
                      {doc.bedrooms} bed • {doc.bathrooms} bath • ₦{doc.estimatedCost.toLocaleString()}
                    </p>
                    {doc.images?.[0]?.url && (
                      <a
                        href={getAssetUrl(doc.images[0].url)}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-block mt-3 text-sm text-blue-600 hover:underline"
                      >
                        Open sample plan image
                      </a>
                    )}
                  </div>
                  <div className="flex flex-col gap-2 md:min-w-[180px]">
                    <button
                      onClick={() => setSelectedDesignForGoLive(doc)}
                      disabled={goLivePlan.isPending}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg disabled:opacity-50"
                    >
                      Go Live
                    </button>
                    <button
                      onClick={() => {
                        setSelectedDesignForReject(doc);
                        setRejectReason('');
                      }}
                      disabled={rejectPlan.isPending}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg disabled:opacity-50"
                    >
                      Reject Plan
                    </button>
                    <a
                      href={`mailto:${doc.createdBy?.email ?? ''}`}
                      className="px-4 py-2 border rounded-lg text-sm text-center"
                    >
                      Message GC
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {selectedDesignForGoLive && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-2xl border border-blue-900 bg-[#0A1628] p-6 shadow-2xl">
            <h3 className="text-xl font-semibold text-white">Confirm Go Live</h3>
            <p className="mt-3 text-sm leading-6 text-gray-300">
              You are about to approve and publish <span className="text-white font-medium">"{selectedDesignForGoLive.name}"</span>.
            </p>
            <p className="mt-3 text-sm leading-6 text-gray-300">
              The GC will get a success message. Please remind the GC that the project goes live only after the GC verifies the project meets required standards before it can be shown to real people.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setSelectedDesignForGoLive(null)}
                className="rounded-lg border border-gray-600 px-5 py-2 text-sm font-medium text-gray-200 hover:bg-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={handleGoLive}
                disabled={goLivePlan.isPending}
                className="rounded-lg bg-green-600 px-5 py-2 text-sm font-medium text-white hover:bg-green-500 disabled:opacity-50"
              >
                {goLivePlan.isPending ? 'Publishing…' : 'Go Live'}
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedDesignForReject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-2xl border border-blue-900 bg-[#0A1628] p-6 shadow-2xl">
            <h3 className="text-xl font-semibold text-white">Reject Plan</h3>
            <p className="mt-3 text-sm leading-6 text-gray-300">
              Tell the GC why <span className="text-white font-medium">"{selectedDesignForReject.name}"</span> is not approved yet.
            </p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Type reason for rejection..."
              className="mt-4 w-full rounded-lg border border-gray-700 bg-[#0F243F] p-3 text-sm text-white outline-none focus:border-blue-500"
              rows={4}
            />
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => {
                  setSelectedDesignForReject(null);
                  setRejectReason('');
                }}
                className="rounded-lg border border-gray-600 px-5 py-2 text-sm font-medium text-gray-200 hover:bg-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={handleRejectPlan}
                disabled={rejectPlan.isPending}
                className="rounded-lg bg-red-600 px-5 py-2 text-sm font-medium text-white hover:bg-red-500 disabled:opacity-50"
              >
                {rejectPlan.isPending ? 'Rejecting…' : 'Reject Plan'}
              </button>
            </div>
          </div>
        </div>
      )}

      {feedbackModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl border border-blue-900 bg-[#0A1628] p-6 shadow-2xl">
            <h3 className="text-xl font-semibold text-white">{feedbackModal.title}</h3>
            <p className="mt-3 text-sm leading-6 text-gray-300">{feedbackModal.message}</p>
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setFeedbackModal({ open: false, title: '', message: '' })}
                className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-medium text-white hover:bg-blue-500"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
