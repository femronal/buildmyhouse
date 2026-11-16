'use client';

import Link from 'next/link';
import type { ProjectView } from './types';
import { displayWhenSet, moneyText, outstandingOf, paymentTone, PAYMENT_LABELS, reasonLabel, reasonTone } from './project-list-rules';
import { ProjectRowMenu } from './ProjectRowMenu';

export function ProjectReasonList({ project }: { project: ProjectView }) {
  return (
    <div className="flex flex-wrap gap-1">
      {project.reasons.map((code) => (
        <span key={code} className={`rounded-full px-2 py-0.5 text-xs ${reasonTone(code)}`}>{reasonLabel(code, project)}</span>
      ))}
    </div>
  );
}

function LastUpdate({ project }: { project: ProjectView }) {
  const stale = project.quietDays >= 14 ? 'text-[#B91C1C]' : project.quietDays >= 7 ? 'text-[#92400E]' : 'text-gray-700';
  return (
    <div className={`text-sm ${stale}`}>
      <p>{displayWhenSet(project.lastUpdate)}</p>
      {project.quietDays >= 7 ? <p>{project.quietDays} days ago</p> : null}
    </div>
  );
}

function MoneyLines({ project }: { project: ProjectView }) {
  const outstanding = outstandingOf(project.budget, project.spent);
  return (
    <div className="text-sm leading-5">
      <p><span className="text-gray-500">Budget </span><span className="font-medium">{moneyText(project.budget)}</span></p>
      <p><span className="text-gray-500">Spent </span><span className="font-medium">{moneyText(project.spent)}</span></p>
      <p><span className="text-gray-500">Outstanding </span><span className="font-medium">{moneyText(outstanding)}</span></p>
    </div>
  );
}

export function ProjectsTable({
  projects,
  hiddenDraftCount,
  showHiddenNote,
  selected,
  onToggle,
  onToggleAll,
  onOpen,
  onViewTimeline,
  onTrackingLinks,
  onPaymentLink,
  onChangeRisk,
  onActivate,
  onDeactivate,
  onArchive,
  onUnarchive,
  onDelete,
  onShowDrafts,
}: {
  projects: ProjectView[];
  hiddenDraftCount: number;
  showHiddenNote: boolean;
  selected: Set<string>;
  onToggle: (id: string) => void;
  onToggleAll: () => void;
  onOpen: (project: ProjectView) => void;
  onViewTimeline: (project: ProjectView) => void;
  onTrackingLinks: (project: ProjectView) => void;
  onPaymentLink: (project: ProjectView) => void;
  onChangeRisk: (project: ProjectView) => void;
  onActivate: (project: ProjectView) => void;
  onDeactivate: (project: ProjectView) => void;
  onArchive: (project: ProjectView) => void;
  onUnarchive: (project: ProjectView) => void;
  onDelete: (project: ProjectView) => void;
  onShowDrafts: () => void;
}) {
  const allChecked = projects.length > 0 && projects.every((project) => selected.has(project.id));
  const menuProps = (project: ProjectView) => ({
    project,
    onViewTimeline: () => onViewTimeline(project),
    onTrackingLinks: () => onTrackingLinks(project),
    onPaymentLink: () => onPaymentLink(project),
    onChangeRisk: () => onChangeRisk(project),
    onActivate: () => onActivate(project),
    onDeactivate: () => onDeactivate(project),
    onArchive: () => onArchive(project),
    onUnarchive: () => onUnarchive(project),
    onDelete: () => onDelete(project),
  });

  return (
    <div>
      <div className="hidden md:block overflow-x-auto">
        <table className="min-w-[1100px] w-full text-left text-sm">
          <thead className="text-[11px] uppercase tracking-wide text-gray-500">
            <tr className="border-b border-gray-200">
              <th className="w-10 px-3 py-3">
                <label className="inline-flex min-h-11 min-w-11 items-center justify-center">
                  <input type="checkbox" aria-label="Select all projects" className="h-4 w-4" checked={allChecked} onChange={onToggleAll} />
                </label>
              </th>
              <th className="px-3 py-3">Project</th>
              <th className="px-3 py-3">Homeowner / GC</th>
              <th className="px-3 py-3">Progress</th>
              <th className="px-3 py-3">Money</th>
              <th className="px-3 py-3">Payment</th>
              <th className="px-3 py-3">Last update</th>
              <th className="px-3 py-3">Needs you</th>
              <th className="px-3 py-3" />
            </tr>
          </thead>
          <tbody>
            {projects.map((project) => (
              <tr
                key={project.id}
                data-testid="project-row"
                className="cursor-pointer border-b border-gray-100 align-top hover:bg-gray-50"
                onClick={() => onOpen(project)}
              >
                <td className="px-3 py-3" onClick={(event) => event.stopPropagation()}>
                  <label className="inline-flex min-h-11 min-w-11 items-center justify-center">
                    <input type="checkbox" aria-label={`Select ${project.name}`} className="h-4 w-4" checked={selected.has(project.id)} onChange={() => onToggle(project.id)} />
                  </label>
                </td>
                <td className="px-3 py-3">
                  <p className="font-medium text-gray-950">{project.name}</p>
                  <p className="text-xs text-gray-500">{[project.paymentRef, project.location].filter(Boolean).join(' · ')}</p>
                </td>
                <td className="px-3 py-3">
                  <p>{project.homeowner || 'Not set'}</p>
                  {project.generalContractorId ? (
                    <p className="text-gray-600">
                      GC: {project.gc || 'Not set'}
                      {!project.gcVerified ? <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-800">not verified</span> : null}
                    </p>
                  ) : (
                    <p className="font-medium text-red-600">Not matched</p>
                  )}
                </td>
                <td className="px-3 py-3">
                  <p className="font-medium">{project.progress}%{displayWhenSet(project.nextMilestone) !== 'Not set' ? ` · ${project.nextMilestone}` : ''}</p>
                  <div className="mt-2 h-1.5 w-28 overflow-hidden rounded-full bg-gray-100">
                    <div className="h-full bg-green-600" style={{ width: `${Math.max(0, Math.min(100, project.progress))}%` }} />
                  </div>
                </td>
                <td className="px-3 py-3"><MoneyLines project={project} /></td>
                <td className="px-3 py-3">
                  <span className={`rounded-full px-2 py-0.5 text-xs ${paymentTone(project.paymentConfirmationStatus)}`}>
                    {PAYMENT_LABELS[project.paymentConfirmationStatus || 'not_declared'] || 'Not declared'}
                  </span>
                </td>
                <td className="px-3 py-3"><LastUpdate project={project} /></td>
                <td className="px-3 py-3">
                  <p className="mb-1 text-gray-700">{project.archivedAt ? 'archived' : project.rawStatus.replace(/_/g, ' ')}</p>
                  <ProjectReasonList project={project} />
                </td>
                <td className="px-3 py-3" onClick={(event) => event.stopPropagation()}>
                  <div className="flex items-center justify-end gap-2">
                    <Link href={`/projects/${project.id}`} className="inline-flex min-h-11 items-center rounded-lg border border-gray-200 px-3 text-sm font-medium">Open</Link>
                    <ProjectRowMenu {...menuProps(project)} />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="space-y-3 md:hidden">
        {projects.map((project) => (
          <article key={project.id} data-testid="project-row" className="rounded-xl border border-gray-200 p-3">
            <div className="flex items-start gap-2">
              <label className="inline-flex min-h-11 min-w-11 items-center justify-center">
                <input type="checkbox" aria-label={`Select ${project.name}`} className="h-4 w-4" checked={selected.has(project.id)} onChange={() => onToggle(project.id)} />
              </label>
              <button type="button" className="min-w-0 flex-1 text-left" onClick={() => onOpen(project)}>
                <p className="font-semibold text-gray-950">{project.name}</p>
                <p className="text-sm text-gray-500">
                  {project.homeowner || 'Not set'}
                  {' · '}
                  {project.generalContractorId ? `GC: ${project.gc || 'Not set'}` : <span className="font-medium text-red-600">GC not matched</span>}
                </p>
              </button>
              <ProjectRowMenu {...menuProps(project)} />
            </div>
            <button type="button" className="mt-2 w-full text-left" onClick={() => onOpen(project)}>
              <ProjectReasonList project={project} />
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-gray-100">
                <div className="h-full bg-green-600" style={{ width: `${Math.max(0, Math.min(100, project.progress))}%` }} />
              </div>
              <div className="mt-2 flex items-start justify-between gap-3 text-sm">
                <p>{project.progress}% · Budget {moneyText(project.budget)} · Spent {moneyText(project.spent)}</p>
                <LastUpdate project={project} />
              </div>
            </button>
          </article>
        ))}
      </div>

      {projects.length === 0 ? <p className="px-3 py-8 text-center text-sm text-gray-500">No projects match the current filters.</p> : null}
      {showHiddenNote && hiddenDraftCount > 0 ? (
        <p className="px-3 py-3 text-sm text-gray-600">
          {hiddenDraftCount} drafts and tests are hidden from this list.{' '}
          <button type="button" className="inline-flex min-h-11 items-center font-medium text-gray-950 underline" onClick={onShowDrafts}>See Drafts and tests</button>
        </p>
      ) : null}
    </div>
  );
}
