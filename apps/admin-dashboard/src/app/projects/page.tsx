'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, Archive, Plus, ShieldAlert } from 'lucide-react';
import { api } from '@/lib/api';
import { CreateManagedProjectModal } from '@/components/CreateManagedProjectModal';
import { InvoiceBankAccountModal } from '@/components/projects/InvoiceBankAccountModal';
import { ProjectBulkBar } from '@/components/projects/ProjectBulkBar';
import { ProjectDrawer } from '@/components/projects/ProjectDrawer';
import { ProjectFilterBar } from '@/components/projects/ProjectFilterBar';
import { ProjectStatusTabs } from '@/components/projects/ProjectStatusTabs';
import { ProjectsTable } from '@/components/projects/ProjectsTable';
import {
  TAB_ORDER,
  cycleRisk,
  downloadTextFile,
  inTab,
  projectMatches,
  sortProjects,
  toCsv,
  toProjectView,
  type ProjectFilters,
  type ProjectTab,
} from '@/components/projects/project-list-rules';
import type { ApiProject, ProjectView } from '@/components/projects/types';

function readTab(value: string | null): ProjectTab {
  return TAB_ORDER.includes(value as ProjectTab) ? (value as ProjectTab) : 'needs_attention';
}

function ProjectsPage() {
  const router = useRouter();
  const pathname = usePathname();
  const search = useSearchParams();
  const tab = readTab(search.get('tab'));
  const sortBy = search.get('sort') || 'needs_first';
  const filters = useMemo<ProjectFilters>(() => ({
    q: search.get('q') || '',
    risk: search.get('risk') || '',
    gc: search.get('gc') || '',
    pay: search.get('pay') || '',
    show: search.get('show') || '',
  }), [search]);
  const openProjectId = search.get('project');
  const drawerSection = search.get('section') === 'stages' || search.get('section') === 'tracking' ? search.get('section') as 'stages' | 'tracking' : null;

  const [paymentLinkProjectId, setPaymentLinkProjectId] = useState<string | null>(null);
  const [paymentLinkValue, setPaymentLinkValue] = useState('');
  const [activateProjectTarget, setActivateProjectTarget] = useState<{ id: string; name: string } | null>(null);
  const [deactivateProjectTarget, setDeactivateProjectTarget] = useState<{ id: string; name: string } | null>(null);
  const [deleteProjectTarget, setDeleteProjectTarget] = useState<{ id: string; name: string } | null>(null);
  const [deleteConfirmName, setDeleteConfirmName] = useState('');
  const [archiveProjectTarget, setArchiveProjectTarget] = useState<{ id: string; name: string } | null>(null);
  const [archiveManyIds, setArchiveManyIds] = useState<string[] | null>(null);
  const [bulkArchiveTarget, setBulkArchiveTarget] = useState(false);
  const [pausedProjectName, setPausedProjectName] = useState<string | null>(null);
  const [actionError, setActionError] = useState('');
  const [createManagedOpen, setCreateManagedOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [confirmAmounts, setConfirmAmounts] = useState<Record<string, string>>({});
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const queryClient = useQueryClient();

  function setParams(updates: Record<string, string | null>) {
    const next = new URLSearchParams(search.toString());
    for (const [key, value] of Object.entries(updates)) {
      if (!value) next.delete(key);
      else next.set(key, value);
    }
    const query = next.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }

  const projectsQuery = useQuery({
    queryKey: ['admin-projects', 'all'],
    queryFn: () => api.get<ApiProject[]>('/projects?includeArchived=true'),
    retry: 1,
  });

  const invalidateProjectQueries = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['admin-projects'] }),
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard'] }),
    ]);
  };

  const projects = useMemo(() => (projectsQuery.data || []).map((project) => toProjectView(project)), [projectsQuery.data]);
  const gcNames = useMemo(
    () => Array.from(new Set(projects.map((project) => project.gc).filter(Boolean))).sort((a, b) => a.localeCompare(b)),
    [projects],
  );
  const counts = useMemo(() => {
    const result = {} as Record<ProjectTab, number>;
    for (const key of TAB_ORDER) result[key] = projects.filter((project) => inTab(project, key)).length;
    return result;
  }, [projects]);
  const visible = useMemo(
    () => sortProjects(projects.filter((project) => inTab(project, tab) && projectMatches(project, filters)), sortBy),
    [projects, tab, filters, sortBy],
  );
  const selectedVisible = visible.filter((project) => selectedIds.includes(project.id));
  const openProject = projects.find((project) => project.id === openProjectId) || null;

  useEffect(() => {
    if (!deleteProjectTarget) setDeleteConfirmName('');
  }, [deleteProjectTarget]);

  const setExternalPaymentLinkMutation = useMutation({
    mutationFn: async (params: { projectId: string; externalPaymentLink: string }) => {
      return api.patch(`/projects/${params.projectId}/external-payment-link`, {
        externalPaymentLink: params.externalPaymentLink,
      });
    },
    onSuccess: async () => {
      await invalidateProjectQueries();
      setPaymentLinkProjectId(null);
      setPaymentLinkValue('');
    },
  });

  const confirmManualPaymentMutation = useMutation({
    mutationFn: async (params: { projectId: string; amount: number }) => {
      return api.patch(`/projects/${params.projectId}/payment/confirm`, { amount: params.amount });
    },
    onSuccess: async () => {
      await invalidateProjectQueries();
    },
  });

  const activateProjectMutation = useMutation({
    mutationFn: async (projectId: string) => api.patch(`/projects/${projectId}/activate`, {}),
    onSuccess: async () => {
      await invalidateProjectQueries();
      setActivateProjectTarget(null);
    },
  });

  const deactivateProjectMutation = useMutation({
    mutationFn: async (projectId: string) => api.patch(`/projects/${projectId}/deactivate`, {}),
    onSuccess: async (_data, projectId) => {
      await invalidateProjectQueries();
      const project = projects.find((item) => item.id === projectId);
      setPausedProjectName(project?.name || 'This project');
      setDeactivateProjectTarget(null);
    },
  });

  const setRiskLevelMutation = useMutation({
    mutationFn: async (params: { projectId: string; riskLevel: ProjectView['risk'] }) => {
      return api.patch(`/projects/${params.projectId}/risk-level`, { riskLevel: params.riskLevel });
    },
    onSuccess: async () => {
      await invalidateProjectQueries();
    },
  });

  const archiveProjectMutation = useMutation({
    mutationFn: async (projectId: string) => api.patch(`/projects/${projectId}/archive`, {}),
    onSuccess: async () => {
      await invalidateProjectQueries();
      setArchiveProjectTarget(null);
    },
  });

  const unarchiveProjectMutation = useMutation({
    mutationFn: async (projectId: string) => api.patch(`/projects/${projectId}/unarchive`, {}),
    onSuccess: async () => {
      await invalidateProjectQueries();
    },
  });

  const archiveStaleTestsMutation = useMutation({
    mutationFn: async () => api.post<{ archivedCount: number; projectIds: string[] }>('/projects/admin/archive-stale-tests', {}),
    onSuccess: async () => {
      await invalidateProjectQueries();
      setBulkArchiveTarget(false);
    },
  });

  const deleteProjectMutation = useMutation({
    mutationFn: async (projectId: string) => api.delete(`/projects/${projectId}`),
    onSuccess: async () => {
      await invalidateProjectQueries();
      setDeleteProjectTarget(null);
      if (openProjectId) setParams({ project: null, section: null });
    },
  });

  function openDrawer(project: ProjectView, section?: 'stages' | 'tracking') {
    setParams({ project: project.id, section: section || null });
  }

  async function changeRisk(project: ProjectView) {
    setActionError('');
    try {
      await setRiskLevelMutation.mutateAsync({ projectId: project.id, riskLevel: cycleRisk(project.risk) });
    } catch (error: any) {
      setActionError(error?.message || 'Failed to update risk level');
    }
  }

  async function confirmPayment(project: ProjectView) {
    setActionError('');
    const amount = Number(confirmAmounts[project.id]);
    if (!Number.isFinite(amount) || amount <= 0) {
      setActionError('Enter the amount on the receipt.');
      return;
    }
    try {
      await confirmManualPaymentMutation.mutateAsync({ projectId: project.id, amount });
    } catch (error: any) {
      setActionError(error?.message || 'Failed to confirm payment');
    }
  }

  const needsAttentionCount = counts.needs_attention || 0;

  return (
    <div className="space-y-4 bg-gray-50 p-4 md:p-8">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-gray-950 md:text-3xl">Project Monitoring</h1>
          <p className="mt-1 hidden text-sm text-gray-500 md:block">Every job in one list. Start with the ones that need you.</p>
          <p className="mt-1 text-sm text-gray-500 md:hidden">{needsAttentionCount} need you</p>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-3">
          <button type="button" className="hidden text-sm text-gray-950 underline md:inline" onClick={() => setAccountOpen(true)}>Invoice bank account</button>
          <button
            type="button"
            className="hidden min-h-11 rounded-lg border border-gray-300 bg-white px-4 text-sm md:inline-flex md:items-center"
            onClick={() => downloadTextFile('bmh-projects.csv', toCsv(visible))}
          >
            Export CSV
          </button>
          <button type="button" className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-gray-950 px-4 text-sm font-medium text-white md:hidden" onClick={() => setCreateManagedOpen(true)}>
            <Plus className="h-4 w-4" />
            New
          </button>
          <button type="button" className="hidden min-h-11 items-center gap-2 rounded-lg bg-gray-950 px-4 text-sm font-medium text-white md:inline-flex" onClick={() => setCreateManagedOpen(true)}>
            <Plus className="h-4 w-4" />
            Create managed project
          </button>
        </div>
      </div>

      {actionError ? <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{actionError}</div> : null}
      {projectsQuery.isError ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          Failed to load projects from the database. Please make sure the backend is running and you are logged in as an admin, then refresh.
        </div>
      ) : null}

      <ProjectStatusTabs tab={tab} counts={counts} onChange={(next) => setParams({ tab: next === 'needs_attention' ? null : next })} />
      <ProjectBulkBar
        count={selectedVisible.length}
        onExport={() => downloadTextFile('bmh-projects.csv', toCsv(selectedVisible))}
        onArchive={() => setArchiveManyIds(selectedVisible.map((project) => project.id))}
        onClear={() => setSelectedIds([])}
      />

      <div className="rounded-xl border border-[#E5E7EB] bg-white">
        <div className="border-b border-gray-100 p-4">
          {tab === 'drafts_and_tests' ? (
            <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-gray-600">Dormant: no confirmed money, and no update for 28 days or no GC matched.</p>
              <button
                type="button"
                className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-amber-300 px-3 text-sm text-amber-800 disabled:opacity-50"
                disabled={archiveStaleTestsMutation.isPending}
                onClick={() => setBulkArchiveTarget(true)}
              >
                <Archive className="h-4 w-4" />
                Archive stale tests
              </button>
            </div>
          ) : null}
          <ProjectFilterBar
            tab={tab}
            filters={filters}
            sortBy={sortBy}
            gcNames={gcNames}
            onChange={(patch) => setParams({
              q: patch.q === undefined ? filters.q : patch.q || null,
              risk: patch.risk === undefined ? filters.risk : patch.risk || null,
              gc: patch.gc === undefined ? filters.gc : patch.gc || null,
              pay: patch.pay === undefined ? filters.pay : patch.pay || null,
              show: patch.show === undefined ? filters.show : patch.show || null,
            })}
            onSort={(next) => setParams({ sort: next === 'needs_first' ? null : next })}
            onClear={() => setParams({ q: null, risk: null, gc: null, pay: null, show: null })}
            onLeaveDraftsHidden={() => setParams({ tab: 'all' })}
          />
        </div>
        {projectsQuery.isLoading ? <p className="px-4 py-8 text-center text-sm text-gray-500">Loading projects.</p> : (
        <ProjectsTable
          projects={projectsQuery.isLoading ? [] : visible}
          hiddenDraftCount={counts.drafts_and_tests || 0}
          showHiddenNote={!projectsQuery.isLoading && tab !== 'drafts_and_tests' && tab !== 'archived' && tab !== 'all'}
          selected={new Set(selectedIds)}
          onToggle={(id) => setSelectedIds((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id])}
          onToggleAll={() => {
            const ids = visible.map((project) => project.id);
            const allOn = ids.every((id) => selectedIds.includes(id));
            setSelectedIds(allOn ? selectedIds.filter((id) => !ids.includes(id)) : Array.from(new Set([...selectedIds, ...ids])));
          }}
          onOpen={(project) => openDrawer(project)}
          onViewTimeline={(project) => openDrawer(project, 'stages')}
          onTrackingLinks={(project) => openDrawer(project, 'tracking')}
          onPaymentLink={(project) => {
            setActionError('');
            setPaymentLinkProjectId(project.id);
            setPaymentLinkValue(project.externalPaymentLink || '');
          }}
          onChangeRisk={changeRisk}
          onActivate={(project) => setActivateProjectTarget({ id: project.id, name: project.name })}
          onDeactivate={(project) => setDeactivateProjectTarget({ id: project.id, name: project.name })}
          onArchive={(project) => setArchiveProjectTarget({ id: project.id, name: project.name })}
          onUnarchive={async (project) => {
            setActionError('');
            try {
              await unarchiveProjectMutation.mutateAsync(project.id);
            } catch (error: any) {
              setActionError(error?.message || 'Failed to unarchive project');
            }
          }}
          onDelete={(project) => {
            setActionError('');
            setDeleteProjectTarget({ id: project.id, name: project.name });
          }}
          onShowDrafts={() => setParams({ tab: 'drafts_and_tests' })}
        />
        )}
      </div>

      <ProjectDrawer
        project={openProject}
        section={drawerSection}
        confirmAmount={openProject ? confirmAmounts[openProject.id] || '' : ''}
        confirmPending={confirmManualPaymentMutation.isPending}
        onClose={() => setParams({ project: null, section: null })}
        onChangeRisk={changeRisk}
        onPaymentLink={(project) => {
          setPaymentLinkProjectId(project.id);
          setPaymentLinkValue(project.externalPaymentLink || '');
        }}
        onConfirmPayment={confirmPayment}
        onConfirmAmount={(value) => {
          if (!openProject) return;
          setConfirmAmounts((current) => ({ ...current, [openProject.id]: value }));
        }}
        onActivate={(project) => setActivateProjectTarget({ id: project.id, name: project.name })}
        onDeactivate={(project) => setDeactivateProjectTarget({ id: project.id, name: project.name })}
        onArchive={(project) => setArchiveProjectTarget({ id: project.id, name: project.name })}
        onUnarchive={async (project) => {
          try {
            await unarchiveProjectMutation.mutateAsync(project.id);
          } catch (error: any) {
            setActionError(error?.message || 'Failed to unarchive project');
          }
        }}
        onDelete={(project) => setDeleteProjectTarget({ id: project.id, name: project.name })}
      />
      <InvoiceBankAccountModal open={accountOpen} onClose={() => setAccountOpen(false)} />

      {activateProjectTarget && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg space-y-4 rounded-xl bg-white p-6 shadow-lg">
            <div className="flex items-start gap-3">
              <ShieldAlert className="mt-0.5 h-5 w-5 text-emerald-600" />
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Activate Project?</h2>
                <p className="mt-1 text-sm text-gray-600">
                  Activating <span className="font-medium text-gray-900">{activateProjectTarget.name}</span> will open project execution and timeline tracking for the homeowner and GC.
                </p>
              </div>
            </div>
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
              Proceed only after payment verification and readiness checks are complete. This confirms the project is ready to start.
            </div>
            <div className="flex justify-end gap-2">
              <button className="rounded-lg border px-4 py-2" onClick={() => setActivateProjectTarget(null)} disabled={activateProjectMutation.isPending}>Cancel</button>
              <button
                className="rounded-lg bg-emerald-600 px-4 py-2 text-white disabled:opacity-50"
                disabled={activateProjectMutation.isPending}
                onClick={async () => {
                  setActionError('');
                  try {
                    await activateProjectMutation.mutateAsync(activateProjectTarget.id);
                  } catch (error: any) {
                    setActionError(error?.message || 'Failed to activate project');
                  }
                }}
              >
                {activateProjectMutation.isPending ? 'Activating...' : 'Proceed and Activate'}
              </button>
            </div>
          </div>
        </div>
      )}

      {deactivateProjectTarget && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg space-y-4 rounded-xl bg-white p-6 shadow-lg">
            <div className="flex items-start gap-3">
              <AlertTriangle className="mt-0.5 h-5 w-5 text-amber-600" />
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Deactivate Project?</h2>
                <p className="mt-1 text-sm text-gray-600">
                  Deactivating <span className="font-medium text-gray-900">{deactivateProjectTarget.name}</span> will pause the project for both the homeowner and the GC. They will be notified that work is temporarily paused.
                </p>
              </div>
            </div>
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
              Only proceed if this pause is required for review, dispute resolution, or payment issues.
            </div>
            <div className="flex justify-end gap-2">
              <button className="rounded-lg border px-4 py-2" onClick={() => setDeactivateProjectTarget(null)} disabled={deactivateProjectMutation.isPending}>Cancel</button>
              <button
                className="rounded-lg bg-amber-600 px-4 py-2 text-white disabled:opacity-50"
                disabled={deactivateProjectMutation.isPending}
                onClick={async () => {
                  setActionError('');
                  try {
                    await deactivateProjectMutation.mutateAsync(deactivateProjectTarget.id);
                  } catch (error: any) {
                    setActionError(error?.message || 'Failed to deactivate project');
                  }
                }}
              >
                {deactivateProjectMutation.isPending ? 'Pausing...' : 'Proceed and Pause'}
              </button>
            </div>
          </div>
        </div>
      )}

      {archiveProjectTarget && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg space-y-4 rounded-xl bg-white p-6 shadow-lg">
            <div className="flex items-start gap-3">
              <Archive className="mt-0.5 h-5 w-5 text-slate-600" />
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Archive Project?</h2>
                <p className="mt-1 text-sm text-gray-600">
                  Archiving <span className="font-medium text-gray-900">{archiveProjectTarget.name}</span> hides it from project monitoring, stalled alerts, and homeowner/GC app lists. Data is kept for records.
                </p>
              </div>
            </div>
            <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
              Use this for test projects, unmatched requests, or jobs that were never paid and should stop appearing as stalled.
            </div>
            <div className="flex justify-end gap-2">
              <button className="rounded-lg border px-4 py-2" onClick={() => setArchiveProjectTarget(null)} disabled={archiveProjectMutation.isPending}>Cancel</button>
              <button
                className="rounded-lg bg-gray-900 px-4 py-2 text-white disabled:opacity-50"
                disabled={archiveProjectMutation.isPending}
                onClick={async () => {
                  setActionError('');
                  try {
                    await archiveProjectMutation.mutateAsync(archiveProjectTarget.id);
                  } catch (error: any) {
                    setActionError(error?.message || 'Failed to archive project');
                  }
                }}
              >
                {archiveProjectMutation.isPending ? 'Archiving...' : 'Archive project'}
              </button>
            </div>
          </div>
        </div>
      )}

      {archiveManyIds && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg space-y-4 rounded-xl bg-white p-6 shadow-lg">
            <h2 className="text-lg font-semibold text-gray-900">Archive {archiveManyIds.length} projects?</h2>
            <p className="text-sm text-gray-600">Each selected project is archived one after another. Data is kept for records.</p>
            <div className="flex justify-end gap-2">
              <button className="rounded-lg border px-4 py-2" onClick={() => setArchiveManyIds(null)} disabled={archiveProjectMutation.isPending}>Cancel</button>
              <button
                className="rounded-lg bg-gray-900 px-4 py-2 text-white disabled:opacity-50"
                disabled={archiveProjectMutation.isPending}
                onClick={async () => {
                  setActionError('');
                  try {
                    for (const id of archiveManyIds) {
                      await archiveProjectMutation.mutateAsync(id);
                    }
                    setSelectedIds((current) => current.filter((id) => !archiveManyIds.includes(id)));
                    setArchiveManyIds(null);
                  } catch (error: any) {
                    setActionError(error?.message || 'Failed to archive project');
                  }
                }}
              >
                {archiveProjectMutation.isPending ? 'Archiving...' : 'Archive'}
              </button>
            </div>
          </div>
        </div>
      )}

      {bulkArchiveTarget && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg space-y-4 rounded-xl bg-white p-6 shadow-lg">
            <div className="flex items-start gap-3">
              <Archive className="mt-0.5 h-5 w-5 text-amber-600" />
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Archive stale test projects?</h2>
                <p className="mt-1 text-sm text-gray-600">
                  This archives unmatched draft requests and unpaid projects with no activity for 28+ days. They will disappear from stalled alerts and the default project list.
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button className="rounded-lg border px-4 py-2" onClick={() => setBulkArchiveTarget(false)} disabled={archiveStaleTestsMutation.isPending}>Cancel</button>
              <button
                className="rounded-lg bg-amber-600 px-4 py-2 text-white disabled:opacity-50"
                disabled={archiveStaleTestsMutation.isPending}
                onClick={async () => {
                  setActionError('');
                  try {
                    const result = await archiveStaleTestsMutation.mutateAsync();
                    if (result.archivedCount === 0) setActionError('No eligible stale test projects found to archive.');
                  } catch (error: any) {
                    setActionError(error?.message || 'Failed to archive stale projects');
                  }
                }}
              >
                {archiveStaleTestsMutation.isPending ? 'Archiving...' : 'Archive eligible projects'}
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteProjectTarget && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg space-y-4 rounded-xl bg-white p-6 shadow-lg">
            <div className="flex items-start gap-3">
              <AlertTriangle className="mt-0.5 h-5 w-5 text-red-600" />
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Delete Project Permanently?</h2>
                <p className="mt-1 text-sm text-gray-600">
                  Deleting <span className="font-medium text-gray-900">{deleteProjectTarget.name}</span> removes it from the database. Payment records are preserved but detached from this project.
                </p>
              </div>
            </div>
            <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
              This cannot be undone. Prefer <strong>Archive</strong> if you only want to hide test or stalled projects from alerts and monitoring.
            </div>
            <label className="block text-sm text-gray-700">
              Type the project name to confirm
              <input className="mt-1 w-full rounded-lg border px-3 py-2" value={deleteConfirmName} onChange={(event) => setDeleteConfirmName(event.target.value)} />
            </label>
            <div className="flex justify-end gap-2">
              <button className="rounded-lg border px-4 py-2" onClick={() => setDeleteProjectTarget(null)} disabled={deleteProjectMutation.isPending}>Cancel</button>
              <button
                className="rounded-lg bg-red-600 px-4 py-2 text-white disabled:opacity-50"
                disabled={deleteProjectMutation.isPending || deleteConfirmName.trim() !== deleteProjectTarget.name.trim()}
                onClick={async () => {
                  setActionError('');
                  try {
                    await deleteProjectMutation.mutateAsync(deleteProjectTarget.id);
                  } catch (error: any) {
                    setActionError(error?.message || 'Failed to delete project');
                  }
                }}
              >
                {deleteProjectMutation.isPending ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {pausedProjectName && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md space-y-4 rounded-xl bg-white p-6 shadow-lg">
            <div className="flex items-start gap-3">
              <ShieldAlert className="mt-0.5 h-5 w-5 text-emerald-600" />
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Project Paused</h2>
                <p className="mt-1 text-sm text-gray-600">
                  <span className="font-medium text-gray-900">{pausedProjectName}</span> has been paused successfully.
                </p>
              </div>
            </div>
            <div className="flex justify-end">
              <button className="rounded-lg bg-gray-900 px-4 py-2 text-white" onClick={() => setPausedProjectName(null)}>Done</button>
            </div>
          </div>
        </div>
      )}

      {paymentLinkProjectId && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg space-y-4 rounded-xl bg-white p-6 shadow-lg">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold">Set external payment link</h2>
                <p className="mt-1 text-sm text-gray-500">Paste the bank transfer / invoice URL (Wise, bank instructions, etc). This is shown to the homeowner.</p>
              </div>
              <button className="text-sm text-gray-500 hover:text-gray-700" onClick={() => { setPaymentLinkProjectId(null); setPaymentLinkValue(''); }}>Close</button>
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">External payment link</label>
              <input type="url" placeholder="https://..." value={paymentLinkValue} onChange={(event) => setPaymentLinkValue(event.target.value)} className="w-full rounded-lg border px-4 py-2" />
              <p className="mt-2 text-xs text-gray-400">Project ID: <span className="font-mono">{paymentLinkProjectId}</span></p>
            </div>
            <div className="flex justify-end gap-2">
              <button className="rounded-lg border px-4 py-2" onClick={() => { setPaymentLinkProjectId(null); setPaymentLinkValue(''); }}>Cancel</button>
              <button
                disabled={setExternalPaymentLinkMutation.isPending || !paymentLinkValue.trim()}
                className="rounded-lg bg-gray-900 px-4 py-2 text-white disabled:opacity-50"
                onClick={async () => {
                  setActionError('');
                  try {
                    await setExternalPaymentLinkMutation.mutateAsync({ projectId: paymentLinkProjectId, externalPaymentLink: paymentLinkValue.trim() });
                  } catch (error: any) {
                    setActionError(error?.message || 'Failed to set payment link');
                  }
                }}
              >
                {setExternalPaymentLinkMutation.isPending ? 'Saving...' : 'Save link'}
              </button>
            </div>
          </div>
        </div>
      )}

      <CreateManagedProjectModal open={createManagedOpen} onClose={() => setCreateManagedOpen(false)} onCreated={invalidateProjectQueries} />
    </div>
  );
}

export default function ProjectsPageRoute() {
  return (
    <Suspense fallback={<div className="p-4 text-sm text-gray-500 md:p-8">Loading projects.</div>}>
      <ProjectsPage />
    </Suspense>
  );
}
