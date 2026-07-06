'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, Archive, ArchiveRestore, Building2, ExternalLink, Filter, Plus, Search, ShieldAlert, Trash2 } from 'lucide-react';
import { api } from '@/lib/api';
import { CreateManagedProjectModal } from '@/components/CreateManagedProjectModal';
import { ProjectAccessLinksPanel } from '@/components/ProjectAccessLinksPanel';

type StageView = {
  id: string;
  name: string;
  status: string;
  order: number;
  estimatedCost?: number | null;
  actualCost?: number | null;
  estimatedDuration?: string | null;
  startDate?: string | null;
  completionDate?: string | null;
};

type ApiProject = {
  id: string;
  name: string;
  address: string;
  status: string;
  riskLevel?: 'low' | 'medium' | 'high';
  progress: number;
  budget: number;
  spent: number;
  updatedAt?: string;
  currentStage?: string | null;
  projectType?: string | null;
  externalPaymentLink?: string | null;
  paymentConfirmationStatus?: 'not_declared' | 'declared' | 'confirmed' | 'rejected' | string;
  archivedAt?: string | null;
  managedByAdmin?: boolean;
  homeowner?: { fullName?: string | null; email?: string | null } | null;
  generalContractor?: { fullName?: string | null; email?: string | null } | null;
  stages?: StageView[] | null;
};

type ProjectView = {
  id: string;
  name: string;
  address: string;
  homeowner: string;
  homeownerEmail?: string | null;
  gc: string;
  gcEmail?: string | null;
  status: string;
  risk: 'low' | 'medium' | 'high';
  progress: number;
  budget: number;
  spent: number;
  lastUpdate: string;
  nextMilestone: string;
  projectType?: string | null;
  externalPaymentLink?: string | null;
  paymentConfirmationStatus?: string | null;
  archivedAt?: string | null;
  managedByAdmin?: boolean;
  stages?: StageView[] | null;
};

function formatUpdatedAt(updatedAt?: string) {
  if (!updatedAt) return '—';
  const d = new Date(updatedAt);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString();
}

function formatDateShort(value?: string | null) {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString();
}

function computeNextMilestone(project: ApiProject) {
  if (project.currentStage) return project.currentStage;
  const stages = project.stages || [];
  const next = [...stages]
    .sort((a, b) => a.order - b.order)
    .find((s) => s.status !== 'completed');
  return next?.name || '—';
}

function computeDisplayStatus(project: ApiProject): string {
  if (project.status === 'completed' || Number(project.progress || 0) >= 100) {
    return 'completed';
  }
  return project.status;
}

function computeRisk(project: ApiProject): ProjectView['risk'] {
  if (project.riskLevel === 'low' || project.riskLevel === 'medium' || project.riskLevel === 'high') {
    return project.riskLevel;
  }
  if (project.paymentConfirmationStatus === 'declared' || project.status === 'pending_payment') return 'high';
  if (project.status === 'paused') return 'medium';
  return 'low';
}

function cycleRisk(current: ProjectView['risk']): ProjectView['risk'] {
  if (current === 'low') return 'medium';
  if (current === 'medium') return 'high';
  return 'low';
}

export default function ProjectsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [riskFilter, setRiskFilter] = useState('all');
  const [sortBy, setSortBy] = useState('updated');
  const [paymentLinkProjectId, setPaymentLinkProjectId] = useState<string | null>(null);
  const [paymentLinkValue, setPaymentLinkValue] = useState('');
  const [timelineProjectId, setTimelineProjectId] = useState<string | null>(null);
  const [activateProjectTarget, setActivateProjectTarget] = useState<{ id: string; name: string } | null>(null);
  const [deactivateProjectTarget, setDeactivateProjectTarget] = useState<{ id: string; name: string } | null>(null);
  const [deleteProjectTarget, setDeleteProjectTarget] = useState<{ id: string; name: string } | null>(null);
  const [archiveProjectTarget, setArchiveProjectTarget] = useState<{ id: string; name: string } | null>(null);
  const [bulkArchiveTarget, setBulkArchiveTarget] = useState(false);
  const [pausedProjectName, setPausedProjectName] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string>('');
  const [createManagedOpen, setCreateManagedOpen] = useState(false);

  const queryClient = useQueryClient();

  const projectsQuery = useQuery({
    queryKey: ['admin-projects', statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (statusFilter === 'archived') {
        params.set('status', 'archived');
      } else if (statusFilter !== 'all') {
        params.set('status', statusFilter);
      }
      const suffix = params.toString() ? `?${params.toString()}` : '';
      const res = await api.get<ApiProject[]>(`/projects${suffix}`);
      return res;
    },
    retry: 1,
  });

  const invalidateProjectQueries = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['admin-projects'] }),
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard'] }),
    ]);
  };

  const projects: ProjectView[] = useMemo(() => {
    if (!projectsQuery.data) return [];
    return projectsQuery.data.map((p) => ({
      id: p.id,
      name: p.name,
      address: p.address,
      homeowner: p.homeowner?.fullName || '—',
      homeownerEmail: p.homeowner?.email ?? null,
      gc: p.generalContractor?.fullName || '—',
      gcEmail: p.generalContractor?.email ?? null,
      status: computeDisplayStatus(p),
      risk: computeRisk(p),
      progress: p.progress ?? 0,
      budget: p.budget ?? 0,
      spent: p.spent ?? 0,
      lastUpdate: formatUpdatedAt(p.updatedAt),
      nextMilestone: computeNextMilestone(p),
      projectType: p.projectType ?? null,
      externalPaymentLink: p.externalPaymentLink ?? null,
      paymentConfirmationStatus: p.paymentConfirmationStatus ?? null,
      archivedAt: p.archivedAt ?? null,
      managedByAdmin: p.managedByAdmin ?? false,
      stages: p.stages ?? null,
    }));
  }, [projectsQuery.data]);

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
    mutationFn: async (projectId: string) => {
      return api.patch(`/projects/${projectId}/payment/confirm`, {});
    },
    onSuccess: async () => {
      await invalidateProjectQueries();
    },
  });

  const activateProjectMutation = useMutation({
    mutationFn: async (projectId: string) => {
      return api.patch(`/projects/${projectId}/activate`, {});
    },
    onSuccess: async () => {
      await invalidateProjectQueries();
      setActivateProjectTarget(null);
    },
  });

  const deactivateProjectMutation = useMutation({
    mutationFn: async (projectId: string) => {
      return api.patch(`/projects/${projectId}/deactivate`, {});
    },
    onSuccess: async (_data, projectId) => {
      await invalidateProjectQueries();
      const project = projects.find((p) => p.id === projectId);
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
    mutationFn: async () =>
      api.post<{ archivedCount: number; projectIds: string[] }>('/projects/admin/archive-stale-tests', {}),
    onSuccess: async () => {
      await invalidateProjectQueries();
      setBulkArchiveTarget(false);
    },
  });

  const deleteProjectMutation = useMutation({
    mutationFn: async (projectId: string) => {
      return api.delete(`/projects/${projectId}`);
    },
    onSuccess: async () => {
      await invalidateProjectQueries();
      setDeleteProjectTarget(null);
    },
  });

  const filteredProjects = useMemo(() => {
    const filtered = projects.filter((project) => {
      const matchesSearch =
        !searchQuery ||
        project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        project.homeowner.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === 'all' || project.status === statusFilter;
      const matchesRisk = riskFilter === 'all' || project.risk === riskFilter;
      return matchesSearch && matchesStatus && matchesRisk;
    });

    return [...filtered].sort((a, b) => {
      if (sortBy === 'progress') return b.progress - a.progress;
      if (sortBy === 'budget') return b.budget - a.budget;
      return 0;
    });
  }, [projects, riskFilter, searchQuery, sortBy, statusFilter]);

  const statusStyles: Record<string, string> = {
    draft: 'bg-gray-100 text-gray-700',
    active: 'bg-emerald-100 text-emerald-700',
    pending_admin_review: 'bg-indigo-100 text-indigo-700',
    pending_payment: 'bg-amber-100 text-amber-700',
    paused: 'bg-amber-100 text-amber-700',
    completed: 'bg-blue-100 text-blue-700',
    cancelled: 'bg-red-100 text-red-700',
    archived: 'bg-slate-200 text-slate-700',
  };

  const riskStyles: Record<string, string> = {
    low: 'bg-green-50 text-green-700',
    medium: 'bg-amber-50 text-amber-700',
    high: 'bg-red-50 text-red-700',
  };

  const selectedTimelineProject = useMemo(() => {
    if (!timelineProjectId) return null;
    return projects.find((p) => p.id === timelineProjectId) || null;
  }, [projects, timelineProjectId]);

  const selectedStages = useMemo(() => {
    const stages = selectedTimelineProject?.stages || [];
    return [...stages].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  }, [selectedTimelineProject]);

  const stageStatusStyles: Record<string, string> = {
    not_started: 'bg-gray-100 text-gray-700',
    in_progress: 'bg-blue-100 text-blue-700',
    completed: 'bg-emerald-100 text-emerald-700',
    blocked: 'bg-red-100 text-red-700',
  };

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold font-poppins">Project Monitoring</h1>
          <p className="text-gray-500 mt-1">Track project health, milestones, and budget usage</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm inline-flex items-center gap-2 hover:bg-indigo-700"
            onClick={() => setCreateManagedOpen(true)}
          >
            <Plus className="w-4 h-4" />
            Create managed project
          </button>
          <button
            type="button"
            className="px-4 py-2 rounded-lg border border-amber-300 text-amber-800 text-sm inline-flex items-center gap-2 hover:bg-amber-50 disabled:opacity-50"
            disabled={archiveStaleTestsMutation.isPending}
            onClick={() => setBulkArchiveTarget(true)}
          >
            <Archive className="w-4 h-4" />
            Archive stale tests
          </button>
          <button className="px-4 py-2 rounded-lg bg-gray-900 text-white text-sm">Export project report</button>
        </div>
      </div>

      {actionError && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
          {actionError}
        </div>
      )}

      {projectsQuery.isError && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
          Failed to load projects from the database. Please make sure the backend is running and you’re logged in as an
          admin, then refresh.
        </div>
      )}

      <div className="bg-white rounded-xl shadow p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search by project or homeowner..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 appearance-none"
            >
              <option value="all">All Status</option>
              <option value="draft">Draft</option>
              <option value="active">Active</option>
              <option value="paused">Paused</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
              <option value="archived">Archived</option>
            </select>
          </div>

          <select
            value={riskFilter}
            onChange={(e) => setRiskFilter(e.target.value)}
            className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Risk Levels</option>
            <option value="low">Low Risk</option>
            <option value="medium">Medium Risk</option>
            <option value="high">High Risk</option>
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="updated">Sort by Latest</option>
            <option value="progress">Sort by Progress</option>
            <option value="budget">Sort by Budget</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {projectsQuery.isLoading && (
          <div className="bg-white rounded-xl shadow p-8 text-center text-gray-500 xl:col-span-2">
            Loading projects…
          </div>
        )}
        {filteredProjects.map((project) => {
          const progressWidth = `${project.progress}%`;
          const outstanding = Math.max(project.budget - project.spent, 0);
          const showConfirm = project.paymentConfirmationStatus === 'declared';
          const canActivate = !project.archivedAt && (project.status === 'pending_payment' || project.status === 'paused');
          const canDeactivate = !project.archivedAt && project.status === 'active';
          const isArchived = Boolean(project.archivedAt);
          const displayStatus = isArchived ? 'archived' : project.status;
          const canDeleteProject = true;
          const isStaleTestCandidate =
            !isArchived &&
            ((project.status === 'draft' && project.gc === '—') ||
              (project.spent === 0 &&
                project.paymentConfirmationStatus !== 'confirmed' &&
                project.status !== 'completed'));
          const gcMailto = project.gcEmail ? `mailto:${project.gcEmail}?subject=${encodeURIComponent(`BuildMyHouse: ${project.name}`)}` : null;
          const homeownerMailto = project.homeownerEmail
            ? `mailto:${project.homeownerEmail}?subject=${encodeURIComponent(`BuildMyHouse: ${project.name}`)}`
            : null;

          return (
            <div key={project.id} className="bg-white rounded-xl shadow p-6 space-y-4">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                    <Building2 className="w-5 h-5 text-gray-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">{project.name}</h3>
                    <p className="text-sm text-gray-500">{project.address}</p>
                    {project.projectType && (
                      <p className="text-xs text-gray-400 mt-1">Type: {project.projectType.replace('_', ' ')}</p>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  {project.managedByAdmin && (
                    <span className="px-2 py-1 text-xs rounded-full bg-indigo-100 text-indigo-700">
                      managed
                    </span>
                  )}
                  {isStaleTestCandidate && (
                    <span className="px-2 py-1 text-xs rounded-full bg-amber-100 text-amber-800">
                      stale test
                    </span>
                  )}
                  {project.gc === '—' && !isArchived && (
                    <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-700">
                      unmatched
                    </span>
                  )}
                  <span
                    className={`px-2 py-1 text-xs rounded-full ${
                      statusStyles[displayStatus] || 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    {displayStatus}
                  </span>
                  <button
                    type="button"
                    className={`px-2 py-1 text-xs rounded-full ${riskStyles[project.risk]} hover:opacity-90 disabled:opacity-60`}
                    disabled={setRiskLevelMutation.isPending}
                    title="Click to cycle risk level"
                    onClick={async () => {
                      setActionError('');
                      try {
                        await setRiskLevelMutation.mutateAsync({
                          projectId: project.id,
                          riskLevel: cycleRisk(project.risk),
                        });
                      } catch (e: any) {
                        setActionError(e?.message || 'Failed to update risk level');
                      }
                    }}
                  >
                    {project.risk} risk
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-gray-500">Budget</p>
                  <p className="font-semibold">₦{project.budget.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-gray-500">Spent</p>
                  <p className="font-semibold">₦{project.spent.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-gray-500">Outstanding</p>
                  <p className="font-semibold">₦{outstanding.toLocaleString()}</p>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-gray-500">Progress</span>
                  <span className="font-semibold">{project.progress}%</span>
                </div>
                <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-600" style={{ width: progressWidth }} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm text-gray-500">
                <div>
                  <p>Homeowner</p>
                  <p className="font-medium text-gray-900">{project.homeowner}</p>
                </div>
                <div>
                  <p>GC</p>
                  <p className="font-medium text-gray-900">{project.gc}</p>
                </div>
                <div>
                  <p>Last update</p>
                  <p className="font-medium text-gray-900">{project.lastUpdate}</p>
                </div>
                <div>
                  <p>Next milestone</p>
                  <p className="font-medium text-gray-900">{project.nextMilestone}</p>
                </div>
              </div>

              <div className="border rounded-lg p-3 space-y-2">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-gray-900">Manual payment</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Payment status:{' '}
                      <span className="font-medium text-gray-700">
                        {project.paymentConfirmationStatus || 'not_declared'}
                      </span>
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      className="px-3 py-2 text-sm border rounded-lg"
                      onClick={() => {
                        setActionError('');
                        setPaymentLinkProjectId(project.id);
                        setPaymentLinkValue(project.externalPaymentLink || '');
                      }}
                    >
                      {project.externalPaymentLink ? 'Update payment link' : 'Request manual payment'}
                    </button>
                    {showConfirm && (
                      <button
                        disabled={confirmManualPaymentMutation.isPending}
                        className="px-3 py-2 text-sm bg-emerald-600 text-white rounded-lg disabled:opacity-50"
                        onClick={async () => {
                          setActionError('');
                          try {
                            await confirmManualPaymentMutation.mutateAsync(project.id);
                          } catch (e: any) {
                            setActionError(e?.message || 'Failed to confirm payment');
                          }
                        }}
                      >
                        Confirm payment
                      </button>
                    )}
                  </div>
                </div>

                {project.externalPaymentLink ? (
                  <a
                    href={project.externalPaymentLink}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700"
                  >
                    <ExternalLink className="w-4 h-4" />
                    View payment instructions
                  </a>
                ) : (
                  <p className="text-xs text-gray-500">No external payment link set yet.</p>
                )}
              </div>

              {project.homeownerEmail && (
                <ProjectAccessLinksPanel
                  projectId={project.id}
                  projectName={project.name}
                  hasGc={project.gc !== '—'}
                />
              )}

              {project.risk === 'high' && (
                <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                  <ShieldAlert className="w-4 h-4" />
                  Payment or progress issue flagged for review
                </div>
              )}

              <div className="flex flex-wrap gap-2">
                <Link
                  href={`/projects/${project.id}`}
                  className="px-3 py-2 text-sm bg-gray-900 text-white rounded-lg"
                >
                  Manage project
                </Link>
                <button
                  className="px-3 py-2 text-sm border rounded-lg"
                  onClick={() => setTimelineProjectId(project.id)}
                >
                  View timeline
                </button>
                {(canActivate || canDeactivate) && (
                  <button
                    className={`px-3 py-2 text-sm rounded-lg disabled:opacity-50 ${
                      canDeactivate ? 'bg-amber-600 text-white' : 'bg-emerald-600 text-white'
                    }`}
                    disabled={activateProjectMutation.isPending || deactivateProjectMutation.isPending}
                    onClick={async () => {
                      setActionError('');
                      try {
                        if (canDeactivate) {
                          setDeactivateProjectTarget({ id: project.id, name: project.name });
                        } else {
                          setActivateProjectTarget({ id: project.id, name: project.name });
                        }
                      } catch (e: any) {
                        setActionError(e?.message || (canDeactivate ? 'Failed to deactivate project' : 'Failed to activate project'));
                      }
                    }}
                  >
                    {canDeactivate ? 'Deactivate project' : 'Activate project'}
                  </button>
                )}
                {canDeleteProject && (
                  <button
                    className="px-3 py-2 text-sm rounded-lg bg-red-600 text-white disabled:opacity-50 inline-flex items-center gap-2"
                    disabled={deleteProjectMutation.isPending}
                    onClick={() => {
                      setActionError('');
                      setDeleteProjectTarget({ id: project.id, name: project.name });
                    }}
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </button>
                )}
                {isArchived ? (
                  <button
                    className="px-3 py-2 text-sm rounded-lg border border-slate-300 disabled:opacity-50 inline-flex items-center gap-2"
                    disabled={unarchiveProjectMutation.isPending}
                    onClick={async () => {
                      setActionError('');
                      try {
                        await unarchiveProjectMutation.mutateAsync(project.id);
                      } catch (e: any) {
                        setActionError(e?.message || 'Failed to unarchive project');
                      }
                    }}
                  >
                    <ArchiveRestore className="w-4 h-4" />
                    Unarchive
                  </button>
                ) : (
                  <button
                    className="px-3 py-2 text-sm rounded-lg border border-slate-300 disabled:opacity-50 inline-flex items-center gap-2"
                    disabled={archiveProjectMutation.isPending}
                    onClick={() => {
                      setActionError('');
                      setArchiveProjectTarget({ id: project.id, name: project.name });
                    }}
                  >
                    <Archive className="w-4 h-4" />
                    Archive
                  </button>
                )}
                {gcMailto ? (
                  <a className="px-3 py-2 text-sm border rounded-lg" href={gcMailto}>
                    Message GC
                  </a>
                ) : (
                  <button
                    className="px-3 py-2 text-sm border rounded-lg opacity-50 cursor-not-allowed"
                    disabled
                    title="GC email not available"
                  >
                    Message GC
                  </button>
                )}
                {homeownerMailto ? (
                  <a className="px-3 py-2 text-sm border rounded-lg" href={homeownerMailto}>
                    Message Homeowner
                  </a>
                ) : (
                  <button
                    className="px-3 py-2 text-sm border rounded-lg opacity-50 cursor-not-allowed"
                    disabled
                    title="Homeowner email not available"
                  >
                    Message Homeowner
                  </button>
                )}
              </div>
            </div>
          );
        })}
        {!projectsQuery.isLoading && filteredProjects.length === 0 && (
          <div className="bg-white rounded-xl shadow p-8 text-center text-gray-500">
            No projects match the current filters.
          </div>
        )}
      </div>

      {activateProjectTarget && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-lg bg-white rounded-xl shadow-lg p-6 space-y-4">
            <div className="flex items-start gap-3">
              <ShieldAlert className="w-5 h-5 text-emerald-600 mt-0.5" />
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Activate Project?</h2>
                <p className="text-sm text-gray-600 mt-1">
                  Activating <span className="font-medium text-gray-900">{activateProjectTarget.name}</span> will open
                  project execution and timeline tracking for the homeowner and GC.
                </p>
              </div>
            </div>

            <div className="bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2 text-sm text-emerald-800">
              Proceed only after payment verification and readiness checks are complete. This confirms the project is ready
              to start.
            </div>

            <div className="flex justify-end gap-2">
              <button
                className="px-4 py-2 border rounded-lg"
                onClick={() => setActivateProjectTarget(null)}
                disabled={activateProjectMutation.isPending}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 rounded-lg bg-emerald-600 text-white disabled:opacity-50"
                disabled={activateProjectMutation.isPending}
                onClick={async () => {
                  setActionError('');
                  try {
                    await activateProjectMutation.mutateAsync(activateProjectTarget.id);
                  } catch (e: any) {
                    setActionError(e?.message || 'Failed to activate project');
                  }
                }}
              >
                {activateProjectMutation.isPending ? 'Activating…' : 'Proceed and Activate'}
              </button>
            </div>
          </div>
        </div>
      )}

      {deactivateProjectTarget && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-lg bg-white rounded-xl shadow-lg p-6 space-y-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5" />
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Deactivate Project?</h2>
                <p className="text-sm text-gray-600 mt-1">
                  Deactivating <span className="font-medium text-gray-900">{deactivateProjectTarget.name}</span> will
                  pause the project for both the homeowner and the GC. They will be notified that work is temporarily
                  paused.
                </p>
              </div>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 text-sm text-amber-800">
              Only proceed if this pause is required for review, dispute resolution, or payment issues.
            </div>

            <div className="flex justify-end gap-2">
              <button
                className="px-4 py-2 border rounded-lg"
                onClick={() => setDeactivateProjectTarget(null)}
                disabled={deactivateProjectMutation.isPending}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 rounded-lg bg-amber-600 text-white disabled:opacity-50"
                disabled={deactivateProjectMutation.isPending}
                onClick={async () => {
                  setActionError('');
                  try {
                    await deactivateProjectMutation.mutateAsync(deactivateProjectTarget.id);
                  } catch (e: any) {
                    setActionError(e?.message || 'Failed to deactivate project');
                  }
                }}
              >
                {deactivateProjectMutation.isPending ? 'Pausing…' : 'Proceed and Pause'}
              </button>
            </div>
          </div>
        </div>
      )}

      {archiveProjectTarget && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-lg bg-white rounded-xl shadow-lg p-6 space-y-4">
            <div className="flex items-start gap-3">
              <Archive className="w-5 h-5 text-slate-600 mt-0.5" />
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Archive Project?</h2>
                <p className="text-sm text-gray-600 mt-1">
                  Archiving <span className="font-medium text-gray-900">{archiveProjectTarget.name}</span> hides it from
                  project monitoring, stalled alerts, and homeowner/GC app lists. Data is kept for records.
                </p>
              </div>
            </div>
            <div className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700">
              Use this for test projects, unmatched requests, or jobs that were never paid and should stop appearing as
              stalled.
            </div>
            <div className="flex justify-end gap-2">
              <button
                className="px-4 py-2 border rounded-lg"
                onClick={() => setArchiveProjectTarget(null)}
                disabled={archiveProjectMutation.isPending}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 rounded-lg bg-gray-900 text-white disabled:opacity-50"
                disabled={archiveProjectMutation.isPending}
                onClick={async () => {
                  setActionError('');
                  try {
                    await archiveProjectMutation.mutateAsync(archiveProjectTarget.id);
                  } catch (e: any) {
                    setActionError(e?.message || 'Failed to archive project');
                  }
                }}
              >
                {archiveProjectMutation.isPending ? 'Archiving…' : 'Archive project'}
              </button>
            </div>
          </div>
        </div>
      )}

      {bulkArchiveTarget && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-lg bg-white rounded-xl shadow-lg p-6 space-y-4">
            <div className="flex items-start gap-3">
              <Archive className="w-5 h-5 text-amber-600 mt-0.5" />
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Archive stale test projects?</h2>
                <p className="text-sm text-gray-600 mt-1">
                  This archives unmatched draft requests and unpaid projects with no activity for 28+ days. They will
                  disappear from stalled alerts and the default project list.
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button
                className="px-4 py-2 border rounded-lg"
                onClick={() => setBulkArchiveTarget(false)}
                disabled={archiveStaleTestsMutation.isPending}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 rounded-lg bg-amber-600 text-white disabled:opacity-50"
                disabled={archiveStaleTestsMutation.isPending}
                onClick={async () => {
                  setActionError('');
                  try {
                    const result = await archiveStaleTestsMutation.mutateAsync();
                    if (result.archivedCount === 0) {
                      setActionError('No eligible stale test projects found to archive.');
                    }
                  } catch (e: any) {
                    setActionError(e?.message || 'Failed to archive stale projects');
                  }
                }}
              >
                {archiveStaleTestsMutation.isPending ? 'Archiving…' : 'Archive eligible projects'}
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteProjectTarget && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-lg bg-white rounded-xl shadow-lg p-6 space-y-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5" />
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Delete Project Permanently?</h2>
                <p className="text-sm text-gray-600 mt-1">
                  Deleting <span className="font-medium text-gray-900">{deleteProjectTarget.name}</span> removes it from
                  the database. Payment records are preserved but detached from this project.
                </p>
              </div>
            </div>

            <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-sm text-red-800">
              This cannot be undone. Prefer <strong>Archive</strong> if you only want to hide test or stalled projects
              from alerts and monitoring.
            </div>

            <div className="flex justify-end gap-2">
              <button
                className="px-4 py-2 border rounded-lg"
                onClick={() => setDeleteProjectTarget(null)}
                disabled={deleteProjectMutation.isPending}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 rounded-lg bg-red-600 text-white disabled:opacity-50"
                disabled={deleteProjectMutation.isPending}
                onClick={async () => {
                  setActionError('');
                  try {
                    await deleteProjectMutation.mutateAsync(deleteProjectTarget.id);
                  } catch (e: any) {
                    setActionError(e?.message || 'Failed to delete project');
                  }
                }}
              >
                {deleteProjectMutation.isPending ? 'Deleting…' : 'Proceed and Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {pausedProjectName && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-md bg-white rounded-xl shadow-lg p-6 space-y-4">
            <div className="flex items-start gap-3">
              <ShieldAlert className="w-5 h-5 text-emerald-600 mt-0.5" />
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Project Paused</h2>
                <p className="text-sm text-gray-600 mt-1">
                  <span className="font-medium text-gray-900">{pausedProjectName}</span> has been paused successfully.
                </p>
              </div>
            </div>
            <div className="flex justify-end">
              <button className="px-4 py-2 rounded-lg bg-gray-900 text-white" onClick={() => setPausedProjectName(null)}>
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {paymentLinkProjectId && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-white rounded-xl shadow-lg p-6 space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold">Set external payment link</h2>
                <p className="text-sm text-gray-500 mt-1">
                  Paste the bank transfer / invoice URL (Wise, bank instructions, etc). This is shown to the homeowner.
                </p>
              </div>
              <button
                className="text-sm text-gray-500 hover:text-gray-700"
                onClick={() => {
                  setPaymentLinkProjectId(null);
                  setPaymentLinkValue('');
                }}
              >
                Close
              </button>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">External payment link</label>
              <input
                type="url"
                placeholder="https://..."
                value={paymentLinkValue}
                onChange={(e) => setPaymentLinkValue(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-400 mt-2">
                Project ID: <span className="font-mono">{paymentLinkProjectId}</span>
              </p>
            </div>

            <div className="flex gap-2 justify-end">
              <button
                className="px-4 py-2 border rounded-lg"
                onClick={() => {
                  setPaymentLinkProjectId(null);
                  setPaymentLinkValue('');
                }}
              >
                Cancel
              </button>
              <button
                disabled={setExternalPaymentLinkMutation.isPending || !paymentLinkValue.trim()}
                className="px-4 py-2 rounded-lg bg-gray-900 text-white disabled:opacity-50"
                onClick={async () => {
                  setActionError('');
                  try {
                    await setExternalPaymentLinkMutation.mutateAsync({
                      projectId: paymentLinkProjectId,
                      externalPaymentLink: paymentLinkValue.trim(),
                    });
                  } catch (e: any) {
                    setActionError(e?.message || 'Failed to set payment link');
                  }
                }}
              >
                {setExternalPaymentLinkMutation.isPending ? 'Saving…' : 'Save link'}
              </button>
            </div>
          </div>
        </div>
      )}

      {timelineProjectId && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4">
          <div className="w-full max-w-2xl bg-white rounded-xl shadow-lg p-6 space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold">Project timeline</h2>
                <p className="text-sm text-gray-500 mt-1">
                  {selectedTimelineProject ? (
                    <>
                      <span className="font-medium text-gray-900">{selectedTimelineProject.name}</span>
                      <span className="text-gray-400"> • </span>
                      <span className="text-gray-600">{selectedTimelineProject.address}</span>
                    </>
                  ) : (
                    'Loading…'
                  )}
                </p>
              </div>
              <button
                className="text-sm text-gray-500 hover:text-gray-700"
                onClick={() => setTimelineProjectId(null)}
              >
                Close
              </button>
            </div>

            {selectedTimelineProject && (
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-gray-500">Homeowner</p>
                  <p className="font-medium text-gray-900">{selectedTimelineProject.homeowner}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-gray-500">GC</p>
                  <p className="font-medium text-gray-900">{selectedTimelineProject.gc}</p>
                </div>
              </div>
            )}

            <div className="border rounded-lg overflow-hidden">
              <div className="bg-gray-50 px-4 py-3 flex items-center justify-between">
                <p className="text-sm font-medium text-gray-900">Stages</p>
                <p className="text-xs text-gray-500">{selectedStages.length} total</p>
              </div>
              {selectedStages.length === 0 ? (
                <div className="px-4 py-8 text-center text-gray-500 text-sm">No stages found for this project.</div>
              ) : (
                <div className="divide-y">
                  {selectedStages.map((stage) => (
                    <div key={stage.id} className="px-4 py-3 flex items-start justify-between gap-4">
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {stage.order + 1}. {stage.name}
                        </p>
                        <div className="text-xs text-gray-500 mt-1 flex flex-wrap gap-x-3 gap-y-1">
                          {stage.estimatedDuration ? <span>Est. {stage.estimatedDuration}</span> : null}
                          {stage.startDate ? <span>Start: {formatDateShort(stage.startDate) || '—'}</span> : null}
                          {stage.completionDate ? (
                            <span>Done: {formatDateShort(stage.completionDate) || '—'}</span>
                          ) : null}
                        </div>
                      </div>
                      <span
                        className={`px-2 py-1 text-xs rounded-full ${
                          stageStatusStyles[stage.status] || 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {stage.status.replace('_', ' ')}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-end">
              <button className="px-4 py-2 border rounded-lg" onClick={() => setTimelineProjectId(null)}>
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      <CreateManagedProjectModal
        open={createManagedOpen}
        onClose={() => setCreateManagedOpen(false)}
        onCreated={invalidateProjectQueries}
      />
    </div>
  );
}



