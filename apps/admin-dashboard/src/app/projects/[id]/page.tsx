'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, ChevronRight, Plus, Save, Trash2 } from 'lucide-react';
import { ProjectAccessLinksPanel } from '@/components/ProjectAccessLinksPanel';
import { ReferrerSelect } from '@/components/growth/ReferrerSelect';
import { adminProjectService } from '@/services/adminProjectService';
import { api } from '@/lib/api';
import { getBackendAssetUrl } from '@/lib/image';

const stageStatusStyles: Record<string, string> = {
  not_started: 'bg-gray-100 text-gray-700',
  in_progress: 'bg-blue-100 text-blue-700',
  completed: 'bg-green-100 text-green-700',
  blocked: 'bg-red-100 text-red-700',
  pending_homeowner_approval: 'bg-gray-100 text-gray-800',
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

function PaymentModelPanel({
  projectId,
  paymentModel,
  onDone,
}: {
  projectId: string;
  paymentModel?: string | null;
  onDone: () => void;
}) {
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const save = useMutation({
    mutationFn: (model: 'pay_in_full' | 'pay_by_stage') =>
      api.patch(`/projects/${projectId}/payment-model`, { paymentModel: model }),
    onSuccess: () => {
      setError('');
      setMessage('Payment choice saved.');
      onDone();
    },
    onError: (e: Error) => {
      setMessage('');
      setError(e.message || 'Could not save the payment choice.');
    },
  });
  const choices = [
    ['pay_in_full', 'Pay in full'],
    ['pay_by_stage', 'Pay stage by stage'],
  ] as const;
  return (
    <div className="border rounded-xl p-4 space-y-3">
      <div className="font-medium">Payment choice</div>
      <p className="text-sm text-gray-600">
        Pay in full expects the whole invoice before the project opens. Pay stage by stage expects each stage deposit before that stage starts. The choice locks after the first confirmed receipt.
      </p>
      <div className="flex flex-wrap gap-2">
        {choices.map(([value, label]) => (
          <button
            key={value}
            type="button"
            disabled={save.isPending}
            onClick={() => save.mutate(value)}
            className={`px-3 py-2 text-sm rounded-lg border ${paymentModel === value ? 'bg-gray-900 text-white border-gray-900' : 'bg-white'}`}
          >
            {label}
          </button>
        ))}
      </div>
      {message ? <p className="text-sm text-emerald-700">{message}</p> : null}
      {error ? <p className="text-sm text-red-700">{error}</p> : null}
    </div>
  );
}

function FundingInvoicePanel({
  projectId,
  analysis,
  onDone,
}: {
  projectId: string;
  analysis: Record<string, any>;
  onDone: () => void;
}) {
  const invoice = analysis.fundingInvoice;
  const [message, setMessage] = useState('');
  const resend = useMutation({
    mutationFn: () => api.post<{ sent?: boolean }>(`/funding/projects/${projectId}/invoice`, {}),
    onSuccess: (result) => {
      setMessage(result?.sent ? 'Invoice sent.' : 'The invoice was not sent. Save today’s account on the projects page, then try again.');
      onDone();
    },
    onError: (error: Error) => setMessage(error.message),
  });
  const receipt = getBackendAssetUrl(invoice?.receipt?.url || '');
  return (
    <div className="rounded-lg border p-3 text-sm space-y-2">
      <div className="font-medium">Funding invoice</div>
      <p className="text-gray-600">The homeowner pays from the email and replies with the receipt. Confirm payment on the projects list after the receipt arrives.</p>
      {invoice?.reference ? <div>Reference {invoice.reference}</div> : <div className="text-gray-500">No invoice sent yet.</div>}
      {invoice?.amount ? <div>Total to fund {naira(invoice.amount)}</div> : null}
      {invoice?.account ? (
        <div>{invoice.account.bankName} · {invoice.account.accountNumber} · {invoice.account.accountName}</div>
      ) : null}
      {receipt ? (
        <a href={receipt} target="_blank" rel="noreferrer" className="inline-block font-medium underline">Open the receipt</a>
      ) : (
        <div className="text-gray-500">No receipt yet.</div>
      )}
      <button type="button" className="px-3 py-2 border rounded-lg disabled:opacity-50" disabled={resend.isPending} onClick={() => resend.mutate()}>
        {invoice?.sentAt ? 'Resend invoice' : 'Send invoice'}
      </button>
      {message ? <p>{message}</p> : null}
    </div>
  );
}

function naira(value: unknown) {
  const amount = Number(value);
  if (!Number.isFinite(amount)) return '—';
  return `₦${amount.toLocaleString('en-NG')}`;
}

function readInspectionQuote(notes?: string | null) {
  try {
    const parsed = JSON.parse(String(notes || ''));
    if (parsed?.kind === 'plan_quote' || parsed?.kind === 'plan_quote_draft') return parsed;
  } catch {
    return null;
  }
  return null;
}

function QuoteCheckForm({
  request,
  design,
  analysis,
  needsDecision,
  onDone,
}: {
  request: {
    id: string;
    gcNotes?: string | null;
    quoteFileId?: string | null;
    estimatedBudget?: number | null;
    totalQuoteAmount?: number | null;
    monitoringFeeAmount?: number | null;
    coordinationFeeAmount?: number | null;
    contingencyFeeAmount?: number | null;
    bmhCheckResult?: string | null;
    bmhCheckNote?: string | null;
  };
  design?: { name?: string | null; estimatedCost?: number | null; description?: string | null } | null;
  analysis?: Record<string, any> | null;
  needsDecision: boolean;
  onDone: () => void;
}) {
  const [note, setNote] = useState('');
  const [error, setError] = useState('');
  const quote = readInspectionQuote(request.gcNotes);
  const stages = Array.isArray(quote?.stages)
    ? quote.stages
    : Array.isArray(analysis?.phases)
      ? analysis.phases
      : [];
  const fileUrl = getBackendAssetUrl(quote?.quoteFileUrl || request.quoteFileId || '');
  const check = useMutation({
    mutationFn: (result: 'fair' | 'too_high' | 'too_low') =>
      api.patch(`/contractors/requests/${request.id}/step`, { action: 'quote_check', result, note }),
    onSuccess: () => onDone(),
    onError: (e: Error) => setError(e.message),
  });
  return (
    <div className="space-y-4">
      <div>
        <div className="font-medium">Quote check</div>
        <p className="text-sm text-gray-600 mt-1">
          Compare the plan the homeowner selected with the quote the contractor uploaded and the scope prepared from it.
        </p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-lg border p-3 text-sm">
          <div className="font-medium">Selected plan</div>
          <div className="mt-1">{design?.name || '—'}</div>
          <div className="text-gray-600">Estimate {naira(design?.estimatedCost)}</div>
          {design?.description ? <p className="mt-2 text-gray-700 whitespace-pre-wrap">{design.description}</p> : null}
        </div>
        <div className="rounded-lg border p-3 text-sm">
          <div className="font-medium">Uploaded quote</div>
          <div className="mt-1">Signed total {naira(quote?.signedTotal || request.estimatedBudget)}</div>
          <div className="text-gray-600">Contractor amount {naira(quote?.contractorAmount || request.estimatedBudget)}</div>
          <div className="text-gray-600">
            Monitoring {naira(quote?.monitoringFee || request.monitoringFeeAmount)} · Coordination {naira(quote?.coordinationFee || request.coordinationFeeAmount)} · Contingency {naira(quote?.contingencyFee || request.contingencyFeeAmount)}
          </div>
          <div className="mt-1">Total to fund {naira(quote?.totalPayable || request.totalQuoteAmount)}</div>
          {fileUrl ? (
            <a href={fileUrl} target="_blank" rel="noreferrer" className="mt-2 inline-block font-medium underline">
              Open the contractor’s quote file
            </a>
          ) : (
            <p className="mt-2 text-gray-500">No quote file was uploaded.</p>
          )}
        </div>
      </div>
      {quote?.notice ? <p className="text-sm text-gray-700">{quote.notice}</p> : null}
      {stages.length > 0 ? (
        <div className="space-y-2">
          <div className="text-sm font-medium">Scope prepared from the quote</div>
          {stages.map((stage: any, index: number) => (
            <div key={`${stage?.name || 'stage'}-${index}`} className="rounded-lg border p-3 text-sm">
              <div className="font-medium">{stage?.name || `Stage ${index + 1}`}</div>
              <div>{naira(stage?.amount || stage?.estimatedCost)}</div>
              {stage?.doneWhen || stage?.description ? (
                <p className="text-gray-600 mt-1">Done when: {stage.doneWhen || stage.description}</p>
              ) : null}
            </div>
          ))}
        </div>
      ) : quote?.materials || quote?.labour || quote?.stages ? (
        <div className="rounded-lg border p-3 text-sm space-y-2">
          {quote.materials ? <p><span className="font-medium">Materials. </span>{quote.materials}</p> : null}
          {quote.labour ? <p><span className="font-medium">Labour. </span>{quote.labour}</p> : null}
          {typeof quote.stages === 'string' ? <p><span className="font-medium">Stages. </span>{quote.stages}</p> : null}
        </div>
      ) : (
        <p className="text-sm text-gray-500">The contractor has not sent a quote for this project yet.</p>
      )}
      {request.bmhCheckResult ? (
        <p className="text-sm">Last decision: {String(request.bmhCheckResult).replace(/_/g, ' ')}{request.bmhCheckNote ? `. ${request.bmhCheckNote}` : ''}</p>
      ) : null}
      {needsDecision ? (
        <>
          <textarea className="w-full border rounded-lg p-2 text-sm" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Note for both sides" />
          <div className="flex gap-2">
            <button type="button" className="px-3 py-2 rounded-lg bg-black text-white text-sm" onClick={() => check.mutate('fair')}>Fair</button>
            <button type="button" className="px-3 py-2 rounded-lg border text-sm" onClick={() => check.mutate('too_high')}>Too high</button>
            <button type="button" className="px-3 py-2 rounded-lg border text-sm" onClick={() => check.mutate('too_low')}>Too low</button>
          </div>
        </>
      ) : null}
      {error ? <div className="text-sm text-red-600">{error}</div> : null}
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

  const planProject = project as typeof project & {
    designId?: string | null;
    design?: { name?: string | null; estimatedCost?: number | null; description?: string | null } | null;
    projectRequests?: Array<{
      id: string;
      stageId?: string | null;
      gcNotes?: string | null;
      quoteFileId?: string | null;
      estimatedBudget?: number | null;
      totalQuoteAmount?: number | null;
      monitoringFeeAmount?: number | null;
      coordinationFeeAmount?: number | null;
      contingencyFeeAmount?: number | null;
      bmhCheckResult?: string | null;
      bmhCheckNote?: string | null;
    }>;
    planRequestStep?: { step: number; state: string; label: string; lateReason?: string };
  };
  const planRequest = (planProject.projectRequests || []).find((item) => !item.stageId);
  const planStep = planProject.planRequestStep;
  const quoteOnFile = planRequest ? readInspectionQuote(planRequest.gcNotes) : null;

  return (
    <div className="p-8 space-y-8 max-w-5xl">
      {planProject.designId && planRequest ? (
        <div className="border rounded-xl p-4 space-y-3">
          <div className="font-semibold">Plan request · Step {planStep?.step || 1} of 6 {planStep?.state === 'late' ? '· Late' : ''}</div>
          <div className="text-sm text-gray-600">{planStep?.label} {planStep?.lateReason || ''}</div>
          {quoteOnFile || planStep?.step === 5 ? (
            <QuoteCheckForm
              request={planRequest}
              design={planProject.design}
              analysis={analysis}
              needsDecision={planStep?.step === 5}
              onDone={() => queryClient.invalidateQueries({ queryKey: ['admin-project', projectId] })}
            />
          ) : null}
          <FundingInvoicePanel
            projectId={projectId}
            analysis={analysis}
            onDone={() => queryClient.invalidateQueries({ queryKey: ['admin-project', projectId] })}
          />
        </div>
      ) : null}
      <PaymentModelPanel
        projectId={projectId}
        paymentModel={(project as { paymentModel?: string | null }).paymentModel}
        onDone={() => queryClient.invalidateQueries({ queryKey: ['admin-project', projectId] })}
      />
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
            {project.needsExtraMonitoring && (
              <span className="px-2 py-0.5 text-xs rounded-full bg-gray-100 text-gray-800">Extra monitoring</span>
            )}
            <span className="px-2 py-0.5 text-xs rounded-full bg-gray-100 text-gray-700 capitalize">
              {project.status.replace('_', ' ')}
            </span>
          </div>
          <p className="text-gray-500 mt-1">{project.address}</p>
          {project.acceptedBy?.fullName ? (
            <p className="text-sm text-gray-600 mt-1">Accepted by {project.acceptedBy.fullName}</p>
          ) : null}
          {project.completedAt ? (
            <p className="text-sm text-gray-600">Completed at {new Date(project.completedAt).toLocaleString()}</p>
          ) : null}
        </div>
      </div>

      <ReferrerSelect
        targetType="project"
        targetId={projectId}
        currentId={project.referrerId}
        referralSource={project.referralSource}
        referredAt={project.referredAt}
        label="Referred by"
      />

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 text-sm rounded-lg px-4 py-3">{error}</div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Progress" value={`${progressPct}%`} />
        <StatCard label="Budget" value={`₦${Number(project.budget || 0).toLocaleString()}`} />
        <StatCard label="Spent" value={`₦${Number(project.spent || 0).toLocaleString()}`} />
        <StatCard label="Current stage" value={project.currentStage || '—'} />
      </div>

      <HomeownerReceiptIds
        receipts={
          project.moneySummary?.receipts?.length
            ? project.moneySummary.receipts
            : (project.payments || []).filter((payment) => payment.status === 'completed')
        }
      />

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

function HomeownerReceiptIds({
  receipts,
}: {
  receipts: Array<{ id: string; amount?: number; createdAt?: string | null }>;
}) {
  const [copied, setCopied] = useState('');
  return (
    <section className="bg-white border rounded-xl p-4 space-y-2">
      <h2 className="text-lg font-semibold">Homeowner receipts</h2>
      <p className="text-sm text-gray-500">Copy a payment id onto a payout line when you need to trace it.</p>
      {receipts.length === 0 ? (
        <p className="text-sm text-gray-500">No completed payments yet.</p>
      ) : (
        receipts.map((receipt) => (
          <div key={receipt.id} className="flex flex-wrap items-center gap-3 text-sm border rounded-lg px-3 py-2">
            <code className="break-all">{receipt.id}</code>
            <span>₦{Number(receipt.amount || 0).toLocaleString('en-NG')}</span>
            <button
              type="button"
              className="px-2 py-1 border rounded-lg"
              onClick={() => {
                navigator.clipboard?.writeText(receipt.id);
                setCopied(receipt.id);
              }}
            >
              {copied === receipt.id ? 'Copied' : 'Copy id'}
            </button>
          </div>
        ))
      )}
    </section>
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
