'use client';

import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, Building2, ExternalLink, Filter, Search, ShieldAlert } from 'lucide-react';
import { api } from '@/lib/api';

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
  const [actionError, setActionError] = useState<string>('');

  const queryClient = useQueryClient();

  const projectsQuery = useQuery({
    queryKey: ['admin-projects'],
    queryFn: async () => {
      const res = await api.get<ApiProject[]>('/projects');
      return res;
    },
    retry: 1,
  });

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
      status: p.status,
      risk: computeRisk(p),
      progress: p.progress ?? 0,
      budget: p.budget ?? 0,
      spent: p.spent ?? 0,
      lastUpdate: formatUpdatedAt(p.updatedAt),
      nextMilestone: computeNextMilestone(p),
      projectType: p.projectType ?? null,
      externalPaymentLink: p.externalPaymentLink ?? null,
      paymentConfirmationStatus: p.paymentConfirmationStatus ?? null,
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
      await queryClient.invalidateQueries({ queryKey: ['admin-projects'] });
      setPaymentLinkProjectId(null);
      setPaymentLinkValue('');
    },
  });

  const confirmManualPaymentMutation = useMutation({
    mutationFn: async (projectId: string) => {
      return api.patch(`/projects/${projectId}/payment/confirm`, {});
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin-projects'] });
    },
  });

  const activateProjectMutation = useMutation({
    mutationFn: async (projectId: string) => {
      return api.patch(`/projects/${projectId}/activate`, {});
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin-projects'] });
    },
  });

  const deactivateProjectMutation = useMutation({
    mutationFn: async (projectId: string) => {
      return api.patch(`/projects/${projectId}/deactivate`, {});
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin-projects'] });
    },
  });

  const setRiskLevelMutation = useMutation({
    mutationFn: async (params: { projectId: string; riskLevel: ProjectView['risk'] }) => {
      return api.patch(`/projects/${params.projectId}/risk-level`, { riskLevel: params.riskLevel });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin-projects'] });
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
        <button className="px-4 py-2 rounded-lg bg-gray-900 text-white text-sm">Export project report</button>
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
              <option value="active">Active</option>
              <option value="paused">Paused</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
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
          const isHomebuilding = project.projectType === 'homebuilding';
          const showConfirm = isHomebuilding && project.paymentConfirmationStatus === 'declared';
          const canActivate = project.status === 'pending_payment' || project.status === 'paused';
          const canDeactivate = project.status === 'active';
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
                  <span
                    className={`px-2 py-1 text-xs rounded-full ${
                      statusStyles[project.status] || 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    {project.status}
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
                  <p className="font-semibold">${project.budget.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-gray-500">Spent</p>
                  <p className="font-semibold">${project.spent.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-gray-500">Outstanding</p>
                  <p className="font-semibold">${outstanding.toLocaleString()}</p>
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

              {isHomebuilding && (
                <div className="border rounded-lg p-3 space-y-2">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium text-gray-900">Manual payment (homebuilding)</p>
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
              )}

              {project.risk === 'high' && (
                <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                  <ShieldAlert className="w-4 h-4" />
                  Payment or progress issue flagged for review
                </div>
              )}

              <div className="flex flex-wrap gap-2">
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
                          await deactivateProjectMutation.mutateAsync(project.id);
                        } else {
                          await activateProjectMutation.mutateAsync(project.id);
                        }
                      } catch (e: any) {
                        setActionError(e?.message || (canDeactivate ? 'Failed to deactivate project' : 'Failed to activate project'));
                      }
                    }}
                  >
                    {canDeactivate ? 'Deactivate project' : 'Activate project'}
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
    </div>
  );
}



