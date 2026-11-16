'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { MoreHorizontal } from 'lucide-react';
import type { ProjectView } from './types';
import { canActivateProject, canDeactivateProject, mailtoFor } from './project-list-rules';

export function ProjectRowMenu({
  project,
  onViewTimeline,
  onTrackingLinks,
  onPaymentLink,
  onChangeRisk,
  onActivate,
  onDeactivate,
  onArchive,
  onUnarchive,
  onDelete,
}: {
  project: ProjectView;
  onViewTimeline: () => void;
  onTrackingLinks: () => void;
  onPaymentLink: () => void;
  onChangeRisk: () => void;
  onActivate: () => void;
  onDeactivate: () => void;
  onArchive: () => void;
  onUnarchive: () => void;
  onDelete: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState({ top: 0, right: 0 });
  const rootRef = useRef<HTMLDivElement>(null);
  const homeownerMail = mailtoFor(project.homeownerEmail, project.name);
  const gcMail = mailtoFor(project.gcEmail, project.name);

  useEffect(() => {
    if (!open) return;
    const close = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', close);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', close);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  function choose(action: () => void) {
    setOpen(false);
    action();
  }

  const itemClass = 'flex min-h-11 w-full items-center justify-between px-3 text-left text-sm text-gray-800 hover:bg-gray-50';

  return (
    <div ref={rootRef} className="relative" onClick={(event) => event.stopPropagation()}>
      <button
        type="button"
        aria-label="Project actions"
        aria-haspopup="menu"
        aria-expanded={open}
        className="flex h-11 w-11 items-center justify-center rounded-lg border border-gray-200 bg-white"
        onClick={(event) => {
          const rect = event.currentTarget.getBoundingClientRect();
          const menuHeight = 460;
          const below = rect.bottom + 4;
          const top = below + menuHeight > window.innerHeight ? Math.max(8, rect.top - menuHeight - 4) : below;
          setPosition({ top, right: Math.max(8, window.innerWidth - rect.right) });
          setOpen((value) => !value);
        }}
      >
        <MoreHorizontal className="h-4 w-4" />
      </button>
      {open ? (
        <div role="menu" className="fixed z-[70] w-56 rounded-xl border border-gray-200 bg-white py-1 shadow-lg" style={{ top: position.top, right: position.right }}>
          <Link role="menuitem" href={`/projects/${project.id}`} className={itemClass} onClick={() => setOpen(false)}>Open project</Link>
          <button type="button" role="menuitem" className={itemClass} onClick={() => choose(onViewTimeline)}>View timeline</button>
          <button type="button" role="menuitem" className={itemClass} onClick={() => choose(onTrackingLinks)}>Tracking links</button>
          <div className="my-1 border-t border-gray-100" />
          {homeownerMail ? (
            <a role="menuitem" href={homeownerMail} className={itemClass} onClick={() => setOpen(false)}>Message homeowner</a>
          ) : (
            <button type="button" role="menuitem" className={`${itemClass} cursor-not-allowed text-gray-400`} disabled title="Homeowner email not available">Message homeowner</button>
          )}
          {gcMail ? (
            <a role="menuitem" href={gcMail} className={itemClass} onClick={() => setOpen(false)}>Message GC</a>
          ) : (
            <button type="button" role="menuitem" className={`${itemClass} cursor-not-allowed text-gray-400`} disabled title="GC email not available">Message GC</button>
          )}
          <div className="my-1 border-t border-gray-100" />
          <button type="button" role="menuitem" className={itemClass} onClick={() => choose(onPaymentLink)}>
            {project.externalPaymentLink ? 'Update payment link' : 'Request manual payment'}
          </button>
          <button type="button" role="menuitem" className={itemClass} onClick={() => choose(onChangeRisk)}>
            <span>Change risk</span>
            <span className="text-xs capitalize text-gray-500">{project.risk}</span>
          </button>
          {canDeactivateProject(project) ? (
            <button type="button" role="menuitem" className={itemClass} onClick={() => choose(onDeactivate)}>Deactivate project</button>
          ) : null}
          {canActivateProject(project) ? (
            <button type="button" role="menuitem" className={itemClass} onClick={() => choose(onActivate)}>Activate project</button>
          ) : null}
          {project.archivedAt ? (
            <button type="button" role="menuitem" className={itemClass} onClick={() => choose(onUnarchive)}>Unarchive</button>
          ) : (
            <button type="button" role="menuitem" className={itemClass} onClick={() => choose(onArchive)}>Archive</button>
          )}
          <div className="my-1 border-t border-gray-100" />
          <button type="button" role="menuitem" className={`${itemClass} text-red-600`} onClick={() => choose(onDelete)}>Delete project...</button>
        </div>
      ) : null}
    </div>
  );
}
