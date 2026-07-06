'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, ChevronRight, Plus, Save, Trash2 } from 'lucide-react';
import { ProjectAccessLinksPanel } from '@/components/ProjectAccessLinksPanel';
import { adminProjectService } from '@/services/adminProjectService';
import { api } from '@/lib/api';
import { getBackendAssetUrl } from '@/lib/image';

const stageStatusStyles: Record<string, string> = {
  not_started: 'bg-gray-100 text-gray-700',
  in_progress: 'bg-blue-100 text-blue-700',
  completed: 'bg-green-100 text-green-700',
  blocked: 'bg-red-100 text-red-700',
};

function TagListEditor({
  label,
  items,
  onChange,
}: {
  label: string;
  items: string[];
  onChange: (items: string[]) => void;
}) {
  const [draft, setDraft] = useState('');

  const add = () => {
    const value = draft.trim();
    if (!value || items.includes(value)) return;
    onChange([...items, value]);
    setDraft('');
  };

  return (
    <div className="space-y-2">
      <span className="text-sm font-medium text-gray-700">{label}</span>
      <div className="flex flex-wrap gap-2">
        {items.map((item) => (
          <span key={item} className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 rounded-full text-sm">
            {item}
            <button type="button" onClick={() => onChange(items.filter((i) => i !== item))} className="text-gray-500 hover:text-red-600">
              <Trash2 className="w-3 h-3" />
            </button>
          </span>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          className="flex-1 px-3 py-2 border rounded-lg text-sm"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), add())}
          placeholder={`Add ${label.toLowerCase()}…`}
        />
        <button type="button" onClick={add} className="px-3 py-2 border rounded-lg text-sm">
          <Plus className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

export default function AdminProjectDetailPage() {
  const params = useParams();
  const projectId = String(params.id || '');
  const queryClient = useQueryClient();
  const [error, setError] = useState('');
  const [scopeSaved, setScopeSaved] = useState(false);

  const projectQuery = useQuery({
    queryKey: ['admin-project', projectId],
    queryFn: () => adminProjectService.getProject(projectId),
    enabled: !!projectId,
  });

  const project = projectQuery.data;
  const analysis = (project?.aiAnalysis || {}) as Record<string, any>;

  const [scopeForm, setScopeForm] = useState<{
    description: string;
    scopeSummary: string;
    rooms: string[];
    features: string[];
    materials: string[];
    projectImageUrls: string[];
  } | null>(null);

  const effectiveScope = scopeForm ?? {
    description: String(analysis.description || ''),
    scopeSummary: String(analysis.summary || analysis.notes || ''),
    rooms: Array.isArray(analysis.rooms) ? analysis.rooms : [],
    features: Array.isArray(analysis.features) ? analysis.features : [],
    materials: Array.isArray(analysis.materials) ? analysis.materials : [],
    projectImageUrls: Array.isArray(analysis.projectImageUrls)
      ? analysis.projectImageUrls
      : analysis.projectImageUrl
        ? [analysis.projectImageUrl]
        : [],
  };

  const stages = useMemo(
    () => [...(project?.stages || [])].sort((a, b) => a.order - b.order),
    [project?.stages],
  );

  const completedCount = stages.filter((s) => s.status === 'completed').length;
  const progressPct = stages.length ? Math.round((completedCount / stages.length) * 100) : project?.progress || 0;

  const saveScopeMutation = useMutation({
    mutationFn: () =>
      adminProjectService.updateScope(projectId, {
        description: effectiveScope.description,
        scopeSummary: effectiveScope.scopeSummary,
        rooms: effectiveScope.rooms,
        features: effectiveScope.features,
        materials: effectiveScope.materials,
        projectImageUrls: effectiveScope.projectImageUrls,
        bedrooms: analysis.bedrooms,
        bathrooms: analysis.bathrooms,
        squareFootage: analysis.squareFootage,
        floors: analysis.floors,
        estimatedDuration: analysis.estimatedDuration,
      }),
    onSuccess: async () => {
      setScopeSaved(true);
      setTimeout(() => setScopeSaved(false), 2000);
      setScopeForm(null);
      await queryClient.invalidateQueries({ queryKey: ['admin-project', projectId] });
    },
    onError: (e: Error) => setError(e.message),
  });

  const uploadProjectImage = async (file: File) => {
    setError('');
    const { url } = await api.uploadFile(file);
    setScopeForm({
      ...effectiveScope,
      projectImageUrls: [...effectiveScope.projectImageUrls, url],
    });
  };

  if (projectQuery.isLoading) {
    return <div className="p-8 text-gray-500">Loading project…</div>;
  }

  if (!project) {
    return <div className="p-8 text-red-600">Project not found.</div>;
  }

  return (
    <div className="p-8 space-y-8 max-w-5xl">
      <div className="flex items-start gap-4">
        <Link href="/projects" className="mt-1 p-2 border rounded-lg hover:bg-gray-50" aria-label="Back">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-bold font-poppins">{project.name}</h1>
            {project.managedByAdmin && (
              <span className="px-2 py-0.5 text-xs rounded-full bg-blue-100 text-blue-700">managed</span>
            )}
            <span className="px-2 py-0.5 text-xs rounded-full bg-gray-100 text-gray-700 capitalize">
              {project.status.replace('_', ' ')}
            </span>
          </div>
          <p className="text-gray-500 mt-1">{project.address}</p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 text-sm rounded-lg px-4 py-3">{error}</div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Progress" value={`${progressPct}%`} />
        <StatCard label="Budget" value={`₦${Number(project.budget || 0).toLocaleString()}`} />
        <StatCard label="Spent" value={`₦${Number(project.spent || 0).toLocaleString()}`} />
        <StatCard label="Current stage" value={project.currentStage || '—'} />
      </div>

      <div className="w-full bg-gray-200 rounded-full h-2">
        <div className="bg-emerald-500 h-2 rounded-full transition-all" style={{ width: `${Math.min(progressPct, 100)}%` }} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
        <div className="bg-white border rounded-xl p-4">
          <p className="text-gray-500">Homeowner</p>
          <p className="font-medium">{project.homeowner?.fullName || '—'}</p>
          <p className="text-gray-400 text-xs">{project.homeowner?.email}</p>
        </div>
        <div className="bg-white border rounded-xl p-4">
          <p className="text-gray-500">General contractor</p>
          <p className="font-medium">{project.generalContractor?.fullName || '—'}</p>
          <p className="text-gray-400 text-xs">{project.generalContractor?.email}</p>
        </div>
      </div>

      {project.homeowner?.email && (
        <ProjectAccessLinksPanel
          projectId={project.id}
          projectName={project.name}
          hasGc={!!project.generalContractor?.email}
        />
      )}

      <section className="bg-white border rounded-xl p-6 space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold">Project scope</h2>
            <p className="text-sm text-gray-500">Rooms, features, materials, and descriptions</p>
          </div>
          <div className="flex items-center gap-2">
            {scopeSaved && <span className="text-sm text-green-600">Saved</span>}
            <button
              type="button"
              disabled={saveScopeMutation.isPending}
              onClick={() => {
                setError('');
                saveScopeMutation.mutate();
              }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg text-sm disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              Save scope
            </button>
          </div>
        </div>

        <label className="block space-y-1">
          <span className="text-sm font-medium text-gray-700">Description</span>
          <textarea
            rows={3}
            className="w-full px-3 py-2 border rounded-lg text-sm"
            value={effectiveScope.description}
            onChange={(e) => setScopeForm({ ...effectiveScope, description: e.target.value })}
          />
        </label>
        <label className="block space-y-1">
          <span className="text-sm font-medium text-gray-700">Scope summary</span>
          <textarea
            rows={2}
            className="w-full px-3 py-2 border rounded-lg text-sm"
            value={effectiveScope.scopeSummary}
            onChange={(e) => setScopeForm({ ...effectiveScope, scopeSummary: e.target.value })}
          />
        </label>

        <TagListEditor
          label="Rooms"
          items={effectiveScope.rooms}
          onChange={(rooms) => setScopeForm({ ...effectiveScope, rooms })}
        />
        <TagListEditor
          label="Features"
          items={effectiveScope.features}
          onChange={(features) => setScopeForm({ ...effectiveScope, features })}
        />
        <TagListEditor
          label="Materials (scope)"
          items={effectiveScope.materials}
          onChange={(materials) => setScopeForm({ ...effectiveScope, materials })}
        />

        <div className="space-y-2">
          <span className="text-sm font-medium text-gray-700">Project photos</span>
          <div className="flex flex-wrap gap-3">
            {effectiveScope.projectImageUrls.map((url, i) => {
              const src = getBackendAssetUrl(url);
              return (
                <div key={`${url}-${i}`} className="relative">
                  {src && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={src} alt="" className="w-24 h-24 object-cover rounded-lg border" />
                  )}
                  <button
                    type="button"
                    className="absolute -top-2 -right-2 bg-white border rounded-full p-1 text-red-600"
                    onClick={() =>
                      setScopeForm({
                        ...effectiveScope,
                        projectImageUrls: effectiveScope.projectImageUrls.filter((_, idx) => idx !== i),
                      })
                    }
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              );
            })}
          </div>
          <label className="inline-flex items-center gap-2 px-3 py-2 text-sm border rounded-lg cursor-pointer hover:bg-gray-50">
            <Plus className="w-4 h-4" />
            Add photo
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) uploadProjectImage(file);
                e.target.value = '';
              }}
            />
          </label>
        </div>
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold">Stages</h2>
          <p className="text-sm text-gray-500">Click a stage to edit details, materials, artisans, photos, and documents</p>
        </div>
        <div className="border rounded-xl overflow-hidden bg-white divide-y">
          {stages.length === 0 ? (
            <div className="px-4 py-10 text-center text-sm text-gray-500">No stages on this project.</div>
          ) : (
            stages.map((stage) => {
              const phaseDesc = Array.isArray(analysis.phases)
                ? String(analysis.phases[stage.order]?.description || '')
                : '';
              return (
                <Link
                  key={stage.id}
                  href={`/projects/${projectId}/stages/${stage.id}`}
                  className="flex items-center justify-between gap-4 px-4 py-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="min-w-0">
                    <p className="font-medium text-gray-900">
                      {stage.order + 1}. {stage.name}
                    </p>
                    {phaseDesc && <p className="text-sm text-gray-500 mt-0.5 line-clamp-2">{phaseDesc}</p>}
                    <p className="text-xs text-gray-400 mt-1">
                      Est. {stage.estimatedDuration} · ₦{Number(stage.estimatedCost || 0).toLocaleString()}
                      {(stage.materials?.length || 0) > 0 && ` · ${stage.materials!.length} materials`}
                      {(stage.teamMembers?.length || 0) > 0 && ` · ${stage.teamMembers!.length} artisans`}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className={`px-2 py-1 text-xs rounded-full capitalize ${stageStatusStyles[stage.status] || 'bg-gray-100'}`}>
                      {stage.status.replace('_', ' ')}
                    </span>
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  </div>
                </Link>
              );
            })
          )}
        </div>
      </section>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white border rounded-xl p-4">
      <p className="text-xs text-gray-500">{label}</p>
      <p className="text-lg font-semibold mt-1 truncate">{value}</p>
    </div>
  );
}
