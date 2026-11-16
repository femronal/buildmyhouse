'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { ExternalLink, X } from 'lucide-react';
import { ProjectAccessLinksPanel } from '@/components/ProjectAccessLinksPanel';
import { getBackendAssetUrl } from '@/lib/image';
import type { ProjectView } from './types';
import {
  canActivateProject,
  canDeactivateProject,
  displayWhenSet,
  formatDateShort,
  mailtoFor,
  moneyText,
  outstandingOf,
  paymentTone,
  PAYMENT_LABELS,
  stagesDone,
} from './project-list-rules';
import { ProjectReasonList } from './ProjectsTable';
import { ProjectRowMenu } from './ProjectRowMenu';

const stageStatusStyles: Record<string, string> = {
  not_started: 'bg-gray-100 text-gray-700',
  in_progress: 'bg-blue-100 text-blue-700',
  pending_homeowner_approval: 'bg-amber-100 text-amber-800',
  completed: 'bg-green-100 text-green-800',
  blocked: 'bg-red-100 text-red-700',
};

export function ProjectDrawer({
  project,
  section,
  confirmAmount,
  confirmPending,
  onClose,
  onChangeRisk,
  onPaymentLink,
  onConfirmPayment,
  onConfirmAmount,
  onActivate,
  onDeactivate,
  onArchive,
  onUnarchive,
  onDelete,
}: {
  project: ProjectView | null;
  section: 'stages' | 'tracking' | null;
  confirmAmount: string;
  confirmPending: boolean;
  onClose: () => void;
  onChangeRisk: (project: ProjectView) => void;
  onPaymentLink: (project: ProjectView) => void;
  onConfirmPayment: (project: ProjectView) => void;
  onConfirmAmount: (value: string) => void;
  onActivate: (project: ProjectView) => void;
  onDeactivate: (project: ProjectView) => void;
  onArchive: (project: ProjectView) => void;
  onUnarchive: (project: ProjectView) => void;
  onDelete: (project: ProjectView) => void;
}) {
  useEffect(() => {
    if (!project) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [project, onClose]);

  useEffect(() => {
    if (!project || !section) return;
    document.getElementById(section === 'stages' ? 'project-stages' : 'project-tracking')?.scrollIntoView({ block: 'start' });
  }, [project, section]);

  if (!project) return null;
  const outstanding = outstandingOf(project.budget, project.spent);
  const counts = stagesDone(project);
  const stages = [...(project.stages || [])].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  const startRef = project.name.match(/BMH-U-[A-Z0-9-]+/i)?.[0] || '';
  const homeownerMail = mailtoFor(project.homeownerEmail, project.name);
  const gcMail = mailtoFor(project.gcEmail, project.name);
  const showConfirm = project.paymentConfirmationStatus === 'declared';

  return (
    <div className="fixed inset-0 z-50">
      <button type="button" className="absolute inset-0 bg-black/40" aria-label="Close project" onClick={onClose} />
      <aside role="dialog" aria-label="Project details" className="absolute inset-0 flex flex-col bg-white md:inset-y-0 md:left-auto md:right-0 md:w-[500px] md:border-l md:border-gray-200">
        <div className="flex items-start justify-between gap-3 border-b border-gray-200 p-4">
          <div className="min-w-0">
            <h2 className="text-lg font-semibold text-gray-950">{project.name}</h2>
            <p className="text-xs text-gray-500">{[startRef, project.paymentRef, project.location, project.projectType?.replace(/_/g, ' ')].filter(Boolean).join(' · ')}</p>
            <div className="mt-2 flex flex-wrap items-center gap-1">
              <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-700">{project.archivedAt ? 'archived' : project.rawStatus.replace(/_/g, ' ')}</span>
              <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs capitalize text-gray-700">{project.risk} risk</span>
              <ProjectReasonList project={project} />
            </div>
          </div>
          <button type="button" aria-label="Close" className="flex h-11 w-11 items-center justify-center" onClick={onClose}>
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="flex flex-wrap items-center gap-2 border-b border-gray-100 p-4">
          <Link href={`/projects/${project.id}`} className="inline-flex min-h-11 items-center rounded-full bg-gray-950 px-4 text-sm font-medium text-white">Open full project</Link>
          {homeownerMail ? <a href={homeownerMail} className="inline-flex min-h-11 items-center rounded-full border border-gray-200 px-3 text-sm">Message homeowner</a> : <button type="button" disabled title="Homeowner email not available" className="inline-flex min-h-11 items-center rounded-full border border-gray-200 px-3 text-sm text-gray-400">Message homeowner</button>}
          {gcMail ? <a href={gcMail} className="inline-flex min-h-11 items-center rounded-full border border-gray-200 px-3 text-sm">Message GC</a> : <button type="button" disabled title="GC email not available" className="inline-flex min-h-11 items-center rounded-full border border-gray-200 px-3 text-sm text-gray-400">Message GC</button>}
          <ProjectRowMenu
            project={project}
            onViewTimeline={() => document.getElementById('project-stages')?.scrollIntoView({ block: 'start' })}
            onTrackingLinks={() => document.getElementById('project-tracking')?.scrollIntoView({ block: 'start' })}
            onPaymentLink={() => onPaymentLink(project)}
            onChangeRisk={() => onChangeRisk(project)}
            onActivate={() => onActivate(project)}
            onDeactivate={() => onDeactivate(project)}
            onArchive={() => onArchive(project)}
            onUnarchive={() => onUnarchive(project)}
            onDelete={() => onDelete(project)}
          />
        </div>
        <div className="flex-1 space-y-6 overflow-y-auto p-4">
          <section>
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Summary</p>
            <dl className="mt-2 space-y-2 text-sm">
              <div className="flex justify-between gap-3"><dt className="text-gray-500">Homeowner</dt><dd>{project.homeowner || 'Not set'}</dd></div>
              <div className="flex justify-between gap-3">
                <dt className="text-gray-500">GC</dt>
                <dd>
                  {project.generalContractorId ? project.gc || 'Not set' : 'Not matched'}
                  {project.generalContractorId ? (
                    <span className={`ml-2 rounded-full px-2 py-0.5 text-xs ${project.gcVerified ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'}`}>
                      {project.gcVerified ? 'verified' : 'not verified'}
                    </span>
                  ) : null}
                </dd>
              </div>
              <div className="flex justify-between gap-3"><dt className="text-gray-500">Progress</dt><dd>{counts.done} of {counts.total} stages done</dd></div>
              <div className="h-1.5 overflow-hidden rounded-full bg-gray-100"><div className="h-full bg-green-600" style={{ width: `${Math.max(0, Math.min(100, project.progress))}%` }} /></div>
              <div className="flex justify-between gap-3"><dt className="text-gray-500">Next milestone</dt><dd>{displayWhenSet(project.nextMilestone)}</dd></div>
              <div className="flex justify-between gap-3"><dt className="text-gray-500">Last update</dt><dd>{displayWhenSet(project.lastUpdate)}</dd></div>
              <div className="flex justify-between gap-3">
                <dt className="text-gray-500">Risk</dt>
                <dd className="capitalize">{project.risk} <button type="button" className="ml-2 text-sm underline" onClick={() => onChangeRisk(project)}>Change</button></dd>
              </div>
            </dl>
          </section>

          <section>
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Money</p>
            <div className="mt-2 grid grid-cols-3 gap-2">
              <div className="rounded-xl border border-gray-200 p-3"><p className="text-xs text-gray-500">Budget</p><p className="font-semibold">{moneyText(project.budget)}</p></div>
              <div className="rounded-xl border border-gray-200 p-3"><p className="text-xs text-gray-500">Spent</p><p className="font-semibold">{moneyText(project.spent)}</p></div>
              <div className="rounded-xl border border-gray-200 p-3"><p className="text-xs text-gray-500">Outstanding</p><p className="font-semibold">{moneyText(outstanding)}</p></div>
            </div>
          </section>

          <section className="space-y-2 rounded-xl border border-gray-200 p-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-gray-900">Manual payment</p>
                <p className="mt-0.5 text-xs text-gray-500">
                  {project.paymentConfirmationStatus === 'confirmed'
                    ? 'Payment is complete.'
                    : project.paymentConfirmationStatus === 'declared'
                      ? 'A receipt reply has arrived. Enter the amount on the receipt to record that payment.'
                      : 'Payment status: not declared'}
                </p>
                <span className={`mt-2 inline-flex rounded-full px-2 py-0.5 text-xs ${paymentTone(project.paymentConfirmationStatus)}`}>
                  {PAYMENT_LABELS[project.paymentConfirmationStatus || 'not_declared'] || 'Not declared'}
                </span>
              </div>
              <button type="button" className="min-h-11 rounded-lg border px-3 text-sm" onClick={() => onPaymentLink(project)}>
                {project.externalPaymentLink ? 'Update payment link' : 'Request manual payment'}
              </button>
            </div>
            {showConfirm ? (
              <div className="flex flex-wrap items-center gap-2">
                <input
                  type="number"
                  min="1"
                  step="0.01"
                  inputMode="decimal"
                  placeholder="Amount received"
                  value={confirmAmount}
                  onChange={(event) => onConfirmAmount(event.target.value)}
                  className="w-36 rounded-lg border px-3 py-2 text-sm"
                />
                <button type="button" disabled={confirmPending} className="rounded-lg bg-emerald-600 px-3 py-2 text-sm text-white disabled:opacity-50" onClick={() => onConfirmPayment(project)}>
                  Confirm payment
                </button>
              </div>
            ) : null}
            {project.fundingReceiptUrl ? (
              <a href={getBackendAssetUrl(project.fundingReceiptUrl) || project.fundingReceiptUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700">
                <ExternalLink className="h-4 w-4" />
                Open receipt {project.fundingReference ? `(${project.fundingReference})` : ''}
              </a>
            ) : project.externalPaymentLink ? (
              <a href={project.externalPaymentLink} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700">
                <ExternalLink className="h-4 w-4" />
                View payment instructions
              </a>
            ) : (
              <p className="text-xs text-gray-500">No receipt yet. The invoice email collects it.</p>
            )}
          </section>

          <section id="project-stages">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Stages</p>
            {stages.length === 0 ? (
              <p className="mt-2 text-sm text-gray-500">No stages found for this project.</p>
            ) : (
              <div className="mt-2 divide-y rounded-xl border border-gray-200">
                {stages.map((stage) => (
                  <div key={stage.id} className="flex items-start justify-between gap-3 px-3 py-3">
                    <div>
                      <p className="text-sm font-medium">{stage.order + 1}. {stage.name}</p>
                      <div className="mt-1 flex flex-wrap gap-x-3 text-xs text-gray-500">
                        {stage.estimatedDuration ? <span>Est. {stage.estimatedDuration}</span> : null}
                        {stage.startDate ? <span>Start: {formatDateShort(stage.startDate) || 'Not set'}</span> : null}
                        {stage.completionDate ? <span>Done: {formatDateShort(stage.completionDate) || 'Not set'}</span> : null}
                      </div>
                    </div>
                    <span className={`rounded-full px-2 py-1 text-xs ${stageStatusStyles[stage.status] || 'bg-gray-100 text-gray-700'}`}>{stage.status.replace(/_/g, ' ')}</span>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section id="project-tracking">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Tracking links</p>
            {project.homeownerEmail ? (
              <div className="mt-2">
                <ProjectAccessLinksPanel projectId={project.id} projectName={project.name} hasGc={Boolean(project.generalContractorId)} />
              </div>
            ) : (
              <p className="mt-2 text-sm text-gray-500">Not set</p>
            )}
          </section>
        </div>
        <div className="flex flex-wrap items-center gap-2 border-t border-gray-200 p-4">
          {canActivateProject(project) ? <button type="button" className="min-h-11 rounded-lg bg-emerald-600 px-3 text-sm text-white" onClick={() => onActivate(project)}>Activate</button> : null}
          {canDeactivateProject(project) ? <button type="button" className="min-h-11 rounded-lg bg-amber-600 px-3 text-sm text-white" onClick={() => onDeactivate(project)}>Deactivate</button> : null}
          {project.archivedAt ? (
            <button type="button" className="min-h-11 rounded-lg border border-gray-300 px-3 text-sm" onClick={() => onUnarchive(project)}>Unarchive</button>
          ) : (
            <button type="button" className="min-h-11 rounded-lg border border-gray-300 px-3 text-sm" onClick={() => onArchive(project)}>Archive</button>
          )}
          <button type="button" className="ml-auto min-h-11 rounded-lg border border-red-300 px-3 text-sm text-red-600" onClick={() => onDelete(project)}>Delete...</button>
        </div>
      </aside>
    </div>
  );
}
