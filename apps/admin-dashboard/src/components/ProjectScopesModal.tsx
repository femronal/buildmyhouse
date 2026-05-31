'use client';

import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, Eye, PencilLine, Rocket, Trash2, X } from 'lucide-react';
import {
  type AdminProjectScope,
  useAdminDeleteProjectScope,
  useAdminProjectScopes,
  useAdminPublishProjectScope,
  useAdminUpdateProjectScope,
} from '@/hooks/useAdminProjectScopes';
import { getBackendAssetUrl } from '@/lib/image';

type Props = {
  contractor: {
    userId: string;
    name: string;
    email?: string;
  } | null;
  onClose: () => void;
};

type ScopeForm = {
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

function buildScopeForm(scope: AdminProjectScope): ScopeForm {
  const projectTypeTag = (() => {
    const normalized = `${scope.projectTypeTag || ''}`.toLowerCase();
    if (normalized === 'repair' || normalized === 'upgrades' || normalized === 'renovation' || normalized === 'full_builds') {
      return normalized;
    }
    if (scope.planType === 'interior_design') return 'upgrades';
    if (scope.planType === 'homebuilding') return 'full_builds';
    return 'renovation';
  })();

  return {
    name: scope.name || '',
    description: scope.description || '',
    planType: scope.planType || 'renovation',
    projectTypeTag,
    projectTypeFilter: scope.projectTypeFilter || '',
    bedrooms: String(scope.bedrooms ?? ''),
    bathrooms: String(scope.bathrooms ?? ''),
    squareFootage: String(scope.squareFootage ?? ''),
    estimatedCost: String(scope.estimatedCost ?? ''),
    floors: scope.floors == null ? '' : String(scope.floors),
    estimatedDuration: scope.estimatedDuration || '',
    rooms: Array.isArray(scope.rooms) ? scope.rooms.join(', ') : '',
    materials: Array.isArray(scope.materials) ? scope.materials.join(', ') : '',
    features: Array.isArray(scope.features) ? scope.features.join(', ') : '',
    constructionPhases:
      scope.constructionPhases == null
        ? ''
        : typeof scope.constructionPhases === 'string'
          ? scope.constructionPhases
          : JSON.stringify(scope.constructionPhases, null, 2),
  };
}

function statusBadgeClass(status: AdminProjectScope['adminApprovalStatus']) {
  if (status === 'approved') return 'bg-green-100 text-green-700 border-green-200';
  if (status === 'rejected') return 'bg-red-100 text-red-700 border-red-200';
  return 'bg-amber-100 text-amber-700 border-amber-200';
}

export function ProjectScopesModal({ contractor, onClose }: Props) {
  const contractorUserId = contractor?.userId || null;
  const { data: scopes = [], isLoading, refetch } = useAdminProjectScopes(contractorUserId, !!contractorUserId);
  const updateScope = useAdminUpdateProjectScope(contractorUserId);
  const publishScope = useAdminPublishProjectScope(contractorUserId);
  const deleteScope = useAdminDeleteProjectScope(contractorUserId);

  const [selectedScopeId, setSelectedScopeId] = useState<string | null>(null);
  const [scopeForm, setScopeForm] = useState<ScopeForm | null>(null);
  const [feedback, setFeedback] = useState<{ title: string; message: string } | null>(null);
  const [confirmAction, setConfirmAction] = useState<{ type: 'publish' | 'delete'; scope: AdminProjectScope } | null>(null);

  const selectedScope = useMemo(
    () => scopes.find((item) => item.id === selectedScopeId) || null,
    [scopes, selectedScopeId],
  );

  useEffect(() => {
    if (!scopes.length) {
      setSelectedScopeId(null);
      setScopeForm(null);
      return;
    }
    const stillExists = selectedScopeId && scopes.some((item) => item.id === selectedScopeId);
    const nextScope = stillExists ? scopes.find((item) => item.id === selectedScopeId) : scopes[0];
    if (!nextScope) return;
    setSelectedScopeId(nextScope.id);
    setScopeForm(buildScopeForm(nextScope));
  }, [scopes, selectedScopeId]);

  if (!contractor) return null;

  const patchForm = <K extends keyof ScopeForm>(key: K, value: ScopeForm[K]) => {
    setScopeForm((prev) => (prev ? { ...prev, [key]: value } : prev));
  };

  const handleSaveEdits = async () => {
    if (!selectedScope || !scopeForm) return;
    const toNumber = (value: string) => {
      const n = Number(value);
      return Number.isFinite(n) ? n : NaN;
    };

    const bedrooms = toNumber(scopeForm.bedrooms);
    const bathrooms = toNumber(scopeForm.bathrooms);
    const squareFootage = toNumber(scopeForm.squareFootage);
    const estimatedCost = toNumber(scopeForm.estimatedCost);
    const floors = scopeForm.floors.trim() ? toNumber(scopeForm.floors) : null;

    if (!scopeForm.name.trim()) {
      setFeedback({ title: 'Validation', message: 'Scope name is required.' });
      return;
    }
    if (!scopeForm.projectTypeFilter.trim()) {
      setFeedback({ title: 'Validation', message: 'Project filter is required.' });
      return;
    }
    if (bedrooms <= 0 || bathrooms <= 0 || squareFootage <= 0 || estimatedCost < 0) {
      setFeedback({
        title: 'Validation',
        message: 'Bedrooms, bathrooms, square footage, and estimated cost must be valid numbers.',
      });
      return;
    }
    if (floors !== null && floors <= 0) {
      setFeedback({ title: 'Validation', message: 'Floors must be greater than 0.' });
      return;
    }

    try {
      await updateScope.mutateAsync({
        scopeId: selectedScope.id,
        data: {
          name: scopeForm.name.trim(),
          description: scopeForm.description.trim(),
          planType: scopeForm.planType,
          projectTypeTag: scopeForm.projectTypeTag,
          projectTypeFilter: scopeForm.projectTypeFilter.trim(),
          bedrooms,
          bathrooms,
          squareFootage,
          estimatedCost,
          floors,
          estimatedDuration: scopeForm.estimatedDuration.trim() || null,
          rooms: scopeForm.rooms.trim(),
          materials: scopeForm.materials.trim(),
          features: scopeForm.features.trim(),
          constructionPhases: scopeForm.constructionPhases.trim(),
        },
      });
      setFeedback({
        title: 'Scope Updated',
        message: 'Project scope edits were saved successfully.',
      });
      await refetch();
    } catch (error: any) {
      setFeedback({
        title: 'Update Failed',
        message: error?.message || 'Could not save scope edits right now.',
      });
    }
  };

  const handleConfirmPublishOrDelete = async () => {
    if (!confirmAction) return;
    try {
      if (confirmAction.type === 'publish') {
        await publishScope.mutateAsync(confirmAction.scope.id);
        setFeedback({
          title: 'Scope Published',
          message: `"${confirmAction.scope.name}" is now live for homeowners.`,
        });
      } else {
        await deleteScope.mutateAsync(confirmAction.scope.id);
        setFeedback({
          title: 'Scope Deleted',
          message: `"${confirmAction.scope.name}" was deleted permanently.`,
        });
      }
      setConfirmAction(null);
      await refetch();
    } catch (error: any) {
      setFeedback({
        title: confirmAction.type === 'publish' ? 'Publish Failed' : 'Delete Failed',
        message: error?.message || 'Action could not be completed right now.',
      });
    }
  };

  return (
    <div className="fixed inset-0 z-[80] bg-black/60 p-0 sm:p-4 overflow-y-auto">
      <div className="mx-auto flex min-h-screen w-full flex-col bg-white shadow-2xl sm:my-6 sm:min-h-0 sm:max-w-6xl sm:rounded-2xl sm:border sm:border-gray-200">
        <div className="sticky top-0 z-10 border-b bg-white px-4 py-4 sm:px-6 sm:rounded-t-2xl flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="text-lg font-semibold text-gray-900 sm:text-xl">Project Scopes • {contractor.name}</h3>
            <p className="text-sm text-gray-500 mt-1">
              Admin can review, edit, publish, or delete scopes uploaded by this verified GC.
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-full border border-gray-300 p-2 text-gray-500 hover:bg-gray-50"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="grid flex-1 gap-0 lg:grid-cols-[320px,1fr]">
          <div className="border-r border-gray-200 p-4 sm:p-5 bg-gray-50">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs uppercase tracking-wide text-gray-500 font-semibold">Uploaded scopes</p>
              <span className="text-xs rounded-full bg-gray-200 px-2 py-0.5 text-gray-700">{scopes.length}</span>
            </div>
            {isLoading ? (
              <p className="text-sm text-gray-500 py-10 text-center">Loading scopes...</p>
            ) : scopes.length === 0 ? (
              <p className="text-sm text-gray-500 py-10 text-center">
                No project scopes uploaded by this GC yet.
              </p>
            ) : (
              <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-1">
                {scopes.map((scope) => (
                  <button
                    key={scope.id}
                    onClick={() => {
                      setSelectedScopeId(scope.id);
                      setScopeForm(buildScopeForm(scope));
                    }}
                    className={`w-full text-left rounded-xl border p-3 transition ${
                      selectedScopeId === scope.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}
                  >
                    <p className="text-sm font-semibold text-gray-900 truncate">{scope.name}</p>
                    <div className="mt-2 flex items-center justify-between gap-2">
                      <span className={`inline-flex rounded-full border px-2 py-0.5 text-[11px] ${statusBadgeClass(scope.adminApprovalStatus)}`}>
                        {scope.adminApprovalStatus}
                      </span>
                      <span className="text-[11px] text-gray-500">
                        {new Date(scope.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="p-4 sm:p-6 space-y-5 overflow-y-auto">
            {!selectedScope || !scopeForm ? (
              <div className="h-full min-h-[240px] flex items-center justify-center text-gray-500 text-sm">
                Select a scope to review and edit.
              </div>
            ) : (
              <>
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs ${statusBadgeClass(selectedScope.adminApprovalStatus)}`}>
                    {selectedScope.adminApprovalStatus}
                  </span>
                  {selectedScope.adminApprovalStatus === 'approved' ? (
                    <span className="inline-flex rounded-full border border-green-200 bg-green-50 px-2.5 py-1 text-xs text-green-700">
                      Live to homeowners
                    </span>
                  ) : null}
                  {selectedScope.adminReviewReason ? (
                    <span className="text-xs text-red-600">Reason: {selectedScope.adminReviewReason}</span>
                  ) : null}
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <label className="text-xs font-medium text-gray-600">Scope Name</label>
                    <input
                      value={scopeForm.name}
                      onChange={(e) => patchForm('name', e.target.value)}
                      className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="text-xs font-medium text-gray-600">Description</label>
                    <textarea
                      rows={3}
                      value={scopeForm.description}
                      onChange={(e) => patchForm('description', e.target.value)}
                      className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-600">Legacy Plan Type</label>
                    <select
                      value={scopeForm.planType}
                      onChange={(e) => patchForm('planType', e.target.value as ScopeForm['planType'])}
                      className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm bg-white"
                    >
                      <option value="renovation">renovation</option>
                      <option value="interior_design">interior_design</option>
                      <option value="homebuilding">homebuilding</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-600">Project Type Tag</label>
                    <select
                      value={scopeForm.projectTypeTag}
                      onChange={(e) => patchForm('projectTypeTag', e.target.value as ScopeForm['projectTypeTag'])}
                      className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm bg-white"
                    >
                      <option value="repair">repair</option>
                      <option value="upgrades">upgrades</option>
                      <option value="renovation">renovation</option>
                      <option value="full_builds">full_builds</option>
                    </select>
                  </div>
                  <div className="sm:col-span-2">
                    <label className="text-xs font-medium text-gray-600">Project Filter</label>
                    <input
                      value={scopeForm.projectTypeFilter}
                      onChange={(e) => patchForm('projectTypeFilter', e.target.value)}
                      className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-600">Bedrooms</label>
                    <input
                      type="number"
                      min={1}
                      value={scopeForm.bedrooms}
                      onChange={(e) => patchForm('bedrooms', e.target.value)}
                      className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-600">Bathrooms</label>
                    <input
                      type="number"
                      min={1}
                      value={scopeForm.bathrooms}
                      onChange={(e) => patchForm('bathrooms', e.target.value)}
                      className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-600">Square Footage</label>
                    <input
                      type="number"
                      min={1}
                      value={scopeForm.squareFootage}
                      onChange={(e) => patchForm('squareFootage', e.target.value)}
                      className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-600">Estimated Cost (NGN)</label>
                    <input
                      type="number"
                      min={0}
                      value={scopeForm.estimatedCost}
                      onChange={(e) => patchForm('estimatedCost', e.target.value)}
                      className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-600">Floors</label>
                    <input
                      type="number"
                      min={1}
                      value={scopeForm.floors}
                      onChange={(e) => patchForm('floors', e.target.value)}
                      className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-600">Estimated Duration</label>
                    <input
                      value={scopeForm.estimatedDuration}
                      onChange={(e) => patchForm('estimatedDuration', e.target.value)}
                      className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="text-xs font-medium text-gray-600">Rooms (comma-separated)</label>
                    <textarea
                      rows={2}
                      value={scopeForm.rooms}
                      onChange={(e) => patchForm('rooms', e.target.value)}
                      className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="text-xs font-medium text-gray-600">Materials (comma-separated)</label>
                    <textarea
                      rows={2}
                      value={scopeForm.materials}
                      onChange={(e) => patchForm('materials', e.target.value)}
                      className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="text-xs font-medium text-gray-600">Features (comma-separated)</label>
                    <textarea
                      rows={2}
                      value={scopeForm.features}
                      onChange={(e) => patchForm('features', e.target.value)}
                      className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="text-xs font-medium text-gray-600">Construction Phases (JSON/Text)</label>
                    <textarea
                      rows={8}
                      value={scopeForm.constructionPhases}
                      onChange={(e) => patchForm('constructionPhases', e.target.value)}
                      className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-xs font-mono"
                    />
                  </div>
                </div>

                {!!selectedScope.images?.length && (
                  <div>
                    <p className="text-xs font-medium text-gray-600 mb-2">Scope Images</p>
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                      {selectedScope.images.map((image, index) => (
                        <div key={image.id} className="rounded-xl border border-gray-200 p-2">
                          <img
                            src={getBackendAssetUrl(image.url) || image.url}
                            alt={image.label || `Scope image ${index + 1}`}
                            className="h-28 w-full rounded-lg object-cover"
                          />
                          <p className="mt-2 text-xs text-gray-700 truncate">{image.label || `Image ${index + 1}`}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex flex-wrap justify-end gap-2 border-t pt-4">
                  <button
                    onClick={handleSaveEdits}
                    disabled={updateScope.isPending}
                    className="inline-flex items-center gap-1 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
                  >
                    <PencilLine className="w-4 h-4" />
                    {updateScope.isPending ? 'Saving…' : 'Save Edits'}
                  </button>
                  {selectedScope.adminApprovalStatus !== 'approved' && (
                    <button
                      onClick={() => setConfirmAction({ type: 'publish', scope: selectedScope })}
                      disabled={publishScope.isPending}
                      className="inline-flex items-center gap-1 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
                    >
                      <Rocket className="w-4 h-4" />
                      Publish Scope
                    </button>
                  )}
                  <button
                    onClick={() => setConfirmAction({ type: 'delete', scope: selectedScope })}
                    disabled={deleteScope.isPending}
                    className="inline-flex items-center gap-1 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete Scope
                  </button>
                  <a
                    href={`mailto:${contractor.email || ''}`}
                    className="inline-flex items-center gap-1 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700"
                  >
                    <Eye className="w-4 h-4" />
                    Message GC
                  </a>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {confirmAction && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-2xl border border-blue-900 bg-[#0A1628] p-6 shadow-2xl">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 rounded-full bg-amber-500/20 p-2 text-amber-300">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <h3 className="text-xl font-semibold text-white">
                  {confirmAction.type === 'publish' ? 'Publish Project Scope' : 'Delete Project Scope'}
                </h3>
                <p className="mt-3 text-sm leading-6 text-gray-300">
                  {confirmAction.type === 'publish' ? (
                    <>
                      You are about to publish <span className="font-medium text-white">"{confirmAction.scope.name}"</span> for homeowners.
                      Make sure edits are final and scope details are complete.
                    </>
                  ) : (
                    <>
                      You are about to permanently delete <span className="font-medium text-white">"{confirmAction.scope.name}"</span>.
                      This action is irreversible and removes the scope from BuildMyHouse.
                    </>
                  )}
                </p>
                <p className="mt-3 text-xs text-gray-400">
                  BuildMyHouse Admin Guardrail: Confirm only after checking scope quality and platform impact.
                </p>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setConfirmAction(null)}
                className="rounded-lg border border-gray-600 px-5 py-2 text-sm font-medium text-gray-200 hover:bg-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmPublishOrDelete}
                disabled={publishScope.isPending || deleteScope.isPending}
                className={`rounded-lg px-5 py-2 text-sm font-medium text-white disabled:opacity-50 ${
                  confirmAction.type === 'publish' ? 'bg-green-600 hover:bg-green-500' : 'bg-red-600 hover:bg-red-500'
                }`}
              >
                {confirmAction.type === 'publish'
                  ? publishScope.isPending
                    ? 'Publishing…'
                    : 'Yes, Publish'
                  : deleteScope.isPending
                    ? 'Deleting…'
                    : 'Yes, Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {feedback && (
        <div className="fixed inset-0 z-[95] flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl border border-blue-900 bg-[#0A1628] p-6 shadow-2xl">
            <h3 className="text-xl font-semibold text-white">{feedback.title}</h3>
            <p className="mt-3 text-sm leading-6 text-gray-300">{feedback.message}</p>
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setFeedback(null)}
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
