'use client';

import { useMemo, useState } from 'react';
import { CheckCircle2, Download, Search, ShieldCheck, X } from 'lucide-react';
import { useUnverifiedGCs, useVerifyGC } from '@/hooks/useUnverifiedGCs';
import {
  useGoLiveDesignPlan,
  usePendingProjectDocs,
  useRejectDesignPlan,
  useUpdateDesignPlan,
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

const DESIGN_TAG_OPTIONS = [
  { value: 'repair', label: 'Repair' },
  { value: 'upgrades', label: 'Upgrades' },
  { value: 'renovation', label: 'Renovation' },
  { value: 'full_builds', label: 'Full Builds' },
] as const;

const DESIGN_FILTER_PRESETS: Record<(typeof DESIGN_TAG_OPTIONS)[number]['value'], string[]> = {
  repair: [
    'Electricals',
    'Plumbing Fixes',
    'Roof Leak Repair',
    'Drainage Fix',
    'Bathroom Repair',
    'Gate/Fence Repair',
  ],
  upgrades: [
    'Kitchen Upgrade',
    'Bedroom Upgrade',
    'Security Gate Upgrade',
    'Door Upgrade',
    'Bathroom Upgrade',
    'Lighting Upgrade',
  ],
  renovation: ['Room-by-Room', 'Occupied Home', 'Family Home Rehab', 'Rental Prep', 'Interior Refresh'],
  full_builds: ['Bungalow Build', 'Duplex Build', 'Blockwork + Roofing', 'Shell to Finish', 'Turnkey Build'],
};

type EditableDesignForm = {
  name: string;
  description: string;
  planType: 'homebuilding' | 'renovation' | 'interior_design';
  projectTypeTag: 'repair' | 'upgrades' | 'renovation' | 'full_builds';
  projectTypeFilter: string;
  bedrooms: string;
  bathrooms: string;
  squareFootage: string;
  estimatedCost: string;
  floors: string;
  estimatedDuration: string;
  rooms: string;
  materials: string;
  features: string;
  constructionPhases: string;
};

function buildEditableDesignForm(doc: PendingDesignDoc): EditableDesignForm {
  const normalizedTag = (() => {
    const saved = `${doc.projectTypeTag || ''}`.toLowerCase();
    if (saved === 'repair' || saved === 'upgrades' || saved === 'renovation' || saved === 'full_builds') {
      return saved;
    }
    if (doc.planType === 'interior_design') return 'upgrades';
    if (doc.planType === 'homebuilding') return 'full_builds';
    return 'renovation';
  })();

  return {
    name: doc.name || '',
    description: doc.description || '',
    planType: doc.planType || 'renovation',
    projectTypeTag: normalizedTag,
    projectTypeFilter: doc.projectTypeFilter || '',
    bedrooms: String(doc.bedrooms ?? ''),
    bathrooms: String(doc.bathrooms ?? ''),
    squareFootage: String(doc.squareFootage ?? ''),
    estimatedCost: String(doc.estimatedCost ?? ''),
    floors: doc.floors == null ? '' : String(doc.floors),
    estimatedDuration: doc.estimatedDuration || '',
    rooms: Array.isArray(doc.rooms) ? doc.rooms.join(', ') : '',
    materials: Array.isArray(doc.materials) ? doc.materials.join(', ') : '',
    features: Array.isArray(doc.features) ? doc.features.join(', ') : '',
    constructionPhases:
      doc.constructionPhases == null
        ? ''
        : typeof doc.constructionPhases === 'string'
          ? doc.constructionPhases
          : JSON.stringify(doc.constructionPhases, null, 2),
  };
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
  const updatePlan = useUpdateDesignPlan();
  const [selectedDesignForGoLive, setSelectedDesignForGoLive] = useState<PendingDesignDoc | null>(null);
  const [selectedDesignForReject, setSelectedDesignForReject] = useState<PendingDesignDoc | null>(null);
  const [selectedDesignForReview, setSelectedDesignForReview] = useState<PendingDesignDoc | null>(null);
  const [editForm, setEditForm] = useState<EditableDesignForm | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [gcSearch, setGcSearch] = useState('');
  const [gcVerificationFilter, setGcVerificationFilter] = useState<'all' | 'verified' | 'pending'>('all');

  const filteredGCs = useMemo(() => {
    let list = gcs;
    if (gcSearch.trim()) {
      const q = gcSearch.toLowerCase().trim();
      list = list.filter(
        (item) =>
          (item.name ?? '').toLowerCase().includes(q) ||
          (item.email ?? '').toLowerCase().includes(q) ||
          (item.user?.fullName ?? '').toLowerCase().includes(q)
      );
    }
    if (gcVerificationFilter === 'verified') {
      list = list.filter((item) => item.verified);
    } else if (gcVerificationFilter === 'pending') {
      list = list.filter((item) => !item.verified);
    }
    return list;
  }, [gcs, gcSearch, gcVerificationFilter]);

  const counts = useMemo(() => {
    return {
      gcs: gcs.length,
      projects: pendingProjectDocs.length,
    };
  }, [gcs.length, pendingProjectDocs.length]);

  const handleToggleGCVerification = async (item: (typeof gcs)[number]) => {
    const nextVerified = !item.verified;
    if (
      nextVerified &&
      !item.hasUploadedAllVerificationDocuments
    ) {
      const shouldProceed = window.confirm(
        `This GC has not uploaded all required verification documents.\n\nMissing: ${item.missingRequiredDocuments.join(', ') || 'Some required documents'}\n\nDo you still want to verify this GC now?`,
      );
      if (!shouldProceed) return;
    }

    try {
      await verifyGC.mutateAsync({
        userId: item.userId,
        verified: nextVerified,
        force: nextVerified && !item.hasUploadedAllVerificationDocuments,
      });
      setFeedbackModal({
        open: true,
        title: nextVerified ? 'GC Approved' : 'GC Disapproved',
        message: nextVerified
          ? 'This GC has been verified successfully.'
          : 'This GC has been marked as not verified.',
      });
    } catch (e: any) {
      setFeedbackModal({
        open: true,
        title: 'Update Failed',
        message: e?.message || 'Failed to update GC verification status',
      });
    }
  };

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
  const BACKEND_ORIGIN = API_BASE_URL.replace(/\/api\/?$/, '');
  const getAssetUrl = (path?: string | null) => {
    if (!path) return '';
    if (/^\/+https?:\/\//i.test(path)) return path.replace(/^\/+/, '');
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

  const openReviewModal = (doc: PendingDesignDoc) => {
    setSelectedDesignForReview(doc);
    setEditForm(buildEditableDesignForm(doc));
  };

  const closeReviewModal = () => {
    setSelectedDesignForReview(null);
    setEditForm(null);
  };

  const handleEditField = <K extends keyof EditableDesignForm>(field: K, value: EditableDesignForm[K]) => {
    setEditForm((prev) => (prev ? { ...prev, [field]: value } : prev));
  };

  const handleSaveDesignEdits = async () => {
    if (!selectedDesignForReview || !editForm) return;

    const toNumber = (value: string) => {
      const n = Number(value);
      return Number.isFinite(n) ? n : NaN;
    };

    const bedrooms = toNumber(editForm.bedrooms);
    const bathrooms = toNumber(editForm.bathrooms);
    const squareFootage = toNumber(editForm.squareFootage);
    const estimatedCost = toNumber(editForm.estimatedCost);
    const floors = editForm.floors.trim() ? toNumber(editForm.floors) : null;

    if (!editForm.name.trim()) {
      setFeedbackModal({ open: true, title: 'Validation', message: 'Design name is required.' });
      return;
    }
    if (!editForm.projectTypeFilter.trim()) {
      setFeedbackModal({ open: true, title: 'Validation', message: 'Project filter is required.' });
      return;
    }
    if (bedrooms <= 0 || bathrooms <= 0 || squareFootage <= 0 || estimatedCost < 0) {
      setFeedbackModal({
        open: true,
        title: 'Validation',
        message: 'Bedrooms, bathrooms, square footage, and estimated cost must be valid numbers.',
      });
      return;
    }
    if (floors !== null && floors <= 0) {
      setFeedbackModal({ open: true, title: 'Validation', message: 'Floors must be greater than 0.' });
      return;
    }

    try {
      await updatePlan.mutateAsync({
        designId: selectedDesignForReview.id,
        data: {
          name: editForm.name.trim(),
          description: editForm.description.trim(),
          planType: editForm.planType,
          projectTypeTag: editForm.projectTypeTag,
          projectTypeFilter: editForm.projectTypeFilter.trim(),
          bedrooms,
          bathrooms,
          squareFootage,
          estimatedCost,
          floors,
          estimatedDuration: editForm.estimatedDuration.trim() || null,
          rooms: editForm.rooms.trim(),
          materials: editForm.materials.trim(),
          features: editForm.features.trim(),
          constructionPhases: editForm.constructionPhases.trim(),
        },
      });
      setFeedbackModal({
        open: true,
        title: 'Plan updated',
        message: 'Design plan changes were saved. Review and then publish when ready.',
      });
      closeReviewModal();
    } catch (e: any) {
      setFeedbackModal({
        open: true,
        title: 'Update failed',
        message: e?.message || 'Could not save plan edits right now.',
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
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by GC name or email..."
                value={gcSearch}
                onChange={(e) => setGcSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div className="flex gap-2 flex-shrink-0">
              {(['all', 'pending', 'verified'] as const).map((filter) => (
                <button
                  key={filter}
                  onClick={() => setGcVerificationFilter(filter)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium ${
                    gcVerificationFilter === filter
                      ? 'bg-gray-900 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {filter === 'all' ? 'All' : filter === 'verified' ? 'Verified' : 'Pending'}
                </button>
              ))}
            </div>
          </div>
          {isLoading && (
            <div className="text-center py-12 text-gray-500">Loading GC accounts…</div>
          )}
          {!isLoading && gcs.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              No GC accounts found.
            </div>
          )}
          {!isLoading && gcs.length > 0 && filteredGCs.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              No GCs match your search. Try a different name, email, or filter.
            </div>
          )}
          {!isLoading &&
            filteredGCs.map((item) => (
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
                          className={`text-xs rounded px-2 py-1 border flex items-center justify-between gap-2 ${
                            doc.uploaded
                              ? 'bg-green-50 border-green-200 text-green-700'
                              : 'bg-white border-gray-200 text-gray-600'
                          }`}
                        >
                          <span className="truncate">{doc.title}</span>
                          {doc.uploaded && doc.fileUrl ? (
                            <a
                              href={getAssetUrl(doc.fileUrl)}
                              download
                              title={`Download ${doc.title}`}
                              className="inline-flex items-center gap-1 rounded-md bg-white/80 border border-green-200 px-2 py-0.5 text-[11px] font-medium text-green-700 hover:bg-white"
                            >
                              <Download className="w-3 h-3" />
                              Download
                            </a>
                          ) : null}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  {item.verified ? (
                    <button
                      onClick={() => handleToggleGCVerification(item)}
                      disabled={verifyGC.isPending}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg flex items-center gap-2 disabled:opacity-50"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      Disapprove GC
                    </button>
                  ) : (
                    <button
                      onClick={() => handleToggleGCVerification(item)}
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
                    <div className="mt-3 flex flex-wrap gap-2">
                      {doc.projectTypeTag && (
                        <span className="px-2 py-1 rounded-full text-xs bg-gray-900 text-white">
                          {doc.projectTypeTag.replace('_', ' ')}
                        </span>
                      )}
                      {doc.projectTypeFilter && (
                        <span className="px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                          {doc.projectTypeFilter}
                        </span>
                      )}
                    </div>
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
                      onClick={() => openReviewModal(doc)}
                      className="px-4 py-2 bg-gray-900 text-white rounded-lg"
                    >
                      Review & Edit
                    </button>
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

      {selectedDesignForReview && editForm && (
        <div className="fixed inset-0 z-50 bg-black/60 p-4 overflow-y-auto">
          <div className="mx-auto my-6 w-full max-w-5xl rounded-2xl border border-gray-200 bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b px-6 py-4">
              <div>
                <h3 className="text-xl font-semibold text-gray-900">Review & Edit Design Plan</h3>
                <p className="text-sm text-gray-500 mt-1">
                  Review details, edit metadata, and then approve the plan to go live.
                </p>
              </div>
              <button
                onClick={closeReviewModal}
                className="rounded-full border border-gray-300 p-2 text-gray-500 hover:bg-gray-50"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid lg:grid-cols-2 gap-6 p-6">
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-medium text-gray-600">Design Name</label>
                  <input
                    value={editForm.name}
                    onChange={(e) => handleEditField('name', e.target.value)}
                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-gray-600">Description</label>
                  <textarea
                    value={editForm.description}
                    onChange={(e) => handleEditField('description', e.target.value)}
                    rows={4}
                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                  />
                </div>

                <div className="grid sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-gray-600">Bedrooms</label>
                    <input
                      type="number"
                      min={1}
                      value={editForm.bedrooms}
                      onChange={(e) => handleEditField('bedrooms', e.target.value)}
                      className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-600">Bathrooms</label>
                    <input
                      type="number"
                      min={1}
                      value={editForm.bathrooms}
                      onChange={(e) => handleEditField('bathrooms', e.target.value)}
                      className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-600">Square Footage</label>
                    <input
                      type="number"
                      min={1}
                      value={editForm.squareFootage}
                      onChange={(e) => handleEditField('squareFootage', e.target.value)}
                      className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-600">Estimated Cost (NGN)</label>
                    <input
                      type="number"
                      min={0}
                      value={editForm.estimatedCost}
                      onChange={(e) => handleEditField('estimatedCost', e.target.value)}
                      className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-600">Floors</label>
                    <input
                      type="number"
                      min={1}
                      value={editForm.floors}
                      onChange={(e) => handleEditField('floors', e.target.value)}
                      className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-600">Estimated Duration</label>
                    <input
                      value={editForm.estimatedDuration}
                      onChange={(e) => handleEditField('estimatedDuration', e.target.value)}
                      className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-medium text-gray-600">Legacy Plan Type</label>
                  <select
                    value={editForm.planType}
                    onChange={(e) => handleEditField('planType', e.target.value as EditableDesignForm['planType'])}
                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm bg-white"
                  >
                    <option value="renovation">renovation</option>
                    <option value="interior_design">interior_design</option>
                    <option value="homebuilding">homebuilding</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-medium text-gray-600">Project Type Tag</label>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {DESIGN_TAG_OPTIONS.map((option) => (
                      <button
                        key={option.value}
                        onClick={() => handleEditField('projectTypeTag', option.value)}
                        className={`px-3 py-1.5 rounded-full text-xs border ${
                          editForm.projectTypeTag === option.value
                            ? 'bg-gray-900 text-white border-gray-900'
                            : 'bg-white text-gray-700 border-gray-300'
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-medium text-gray-600">Project Filter</label>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {(DESIGN_FILTER_PRESETS[editForm.projectTypeTag] || []).map((preset) => (
                      <button
                        key={preset}
                        onClick={() => handleEditField('projectTypeFilter', preset)}
                        className={`px-3 py-1.5 rounded-full text-xs border ${
                          editForm.projectTypeFilter.toLowerCase() === preset.toLowerCase()
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'bg-blue-50 text-blue-700 border-blue-200'
                        }`}
                      >
                        {preset}
                      </button>
                    ))}
                  </div>
                  <input
                    value={editForm.projectTypeFilter}
                    onChange={(e) => handleEditField('projectTypeFilter', e.target.value)}
                    placeholder="Use a preset or type custom filter..."
                    className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-xs font-medium text-gray-600">Rooms (comma-separated)</label>
                  <textarea
                    rows={2}
                    value={editForm.rooms}
                    onChange={(e) => handleEditField('rooms', e.target.value)}
                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600">Materials (comma-separated)</label>
                  <textarea
                    rows={2}
                    value={editForm.materials}
                    onChange={(e) => handleEditField('materials', e.target.value)}
                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600">Features (comma-separated)</label>
                  <textarea
                    rows={2}
                    value={editForm.features}
                    onChange={(e) => handleEditField('features', e.target.value)}
                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600">Construction Phases (JSON/Text)</label>
                  <textarea
                    rows={8}
                    value={editForm.constructionPhases}
                    onChange={(e) => handleEditField('constructionPhases', e.target.value)}
                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-xs font-mono"
                  />
                </div>

                <div>
                  <p className="text-xs font-medium text-gray-600 mb-2">Plan Images</p>
                  <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                    {selectedDesignForReview.images?.length ? (
                      selectedDesignForReview.images.map((image) => (
                        <a
                          key={image.id}
                          href={getAssetUrl(image.url)}
                          target="_blank"
                          rel="noreferrer"
                          className="block rounded-lg border border-gray-200 p-2 hover:bg-gray-50"
                        >
                          <p className="text-sm font-medium text-gray-900">{image.label || 'Image'}</p>
                          <p className="text-xs text-blue-600 truncate">{getAssetUrl(image.url)}</p>
                        </a>
                      ))
                    ) : (
                      <p className="text-sm text-gray-500">No images uploaded.</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 border-t px-6 py-4">
              <button
                onClick={closeReviewModal}
                className="rounded-lg border border-gray-300 px-5 py-2 text-sm font-medium text-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveDesignEdits}
                disabled={updatePlan.isPending}
                className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-medium text-white disabled:opacity-50"
              >
                {updatePlan.isPending ? 'Saving…' : 'Save Edits'}
              </button>
              <button
                onClick={() => {
                  closeReviewModal();
                  setSelectedDesignForGoLive(selectedDesignForReview);
                }}
                className="rounded-lg bg-green-600 px-5 py-2 text-sm font-medium text-white"
              >
                Continue to Go Live
              </button>
            </div>
          </div>
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
