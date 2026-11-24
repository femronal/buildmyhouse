'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useState } from 'react';
import FollowUpDrawer from '@/components/partnerships/FollowUpDrawer';
import { usePartnershipMutations, usePartnershipSummary, usePartnershipToday } from '@/hooks/usePartnerships';
import { CATEGORY_LABEL, STAGE_LABEL, STATUS_LABEL, formatLagosDayDate, formatLagosTime, statusChipClass } from '@/lib/partnerships';

export default function PartnershipsTodayPage() {
  const params = useSearchParams();
  const filters = { ownerId: params.get('ownerId') || undefined, category: params.get('category') || undefined };
  const summary = usePartnershipSummary(filters);
  const today = usePartnershipToday(filters);
  const { updateMeeting } = usePartnershipMutations();
  const [logging, setLogging] = useState<any>(null);
  const counts = summary.data;
  const board = today.data;

  return (
    <div>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <Card eyebrow="Action required" value={counts?.actionRequired} detail={counts ? `${counts.overdue} overdue, ${counts.dueToday} today` : ''} href="/growth/partnerships/leads?status=action" />
        <Card eyebrow="Pilot candidates" value={counts?.pilotCandidates} detail={counts ? (counts.pilotsNeedingMeeting === 1 ? '1 needs a meeting' : `${counts.pilotsNeedingMeeting} need a meeting`) : ''} href="/growth/partnerships/leads?stage=pilot_candidate" />
        <Card eyebrow="Dormant and closed" value={counts?.dormant} extra={counts ? String(counts.closed) : ''} detail={counts ? `${counts.dormant} dormant, ${counts.closed} closed. Nurture checks: ${counts.nurtureChecks}` : ''} href="/growth/partnerships/leads?status=dormant_or_closed" />
        <Card eyebrow="Master pipeline" value={counts?.pipeline} detail={counts ? `${counts.open} open, ${counts.dormant} dormant, ${counts.closed} closed, ${counts.partner} partner` : ''} href="/growth/partnerships/leads" linkLabel="See all leads →" />
      </div>
      <p className="mt-4 flex flex-wrap items-center gap-3 text-sm text-gray-700">
        <span>{counts?.outreachLeft ?? 0} of 2 new outreach left today</span>
        <span className="h-2 w-24 overflow-hidden rounded-full bg-gray-200"><span className="block h-full bg-gray-900" style={{ width: `${Math.min(100, ((counts?.outreachUsed || 0) / 2) * 100)}%` }} /></span>
        <span>Counts first outreach logged today (Lagos). A 3rd needs a Partnerships Admin.</span>
      </p>
      {today.isError ? <p className="mt-4 text-sm text-red-700">The board could not be loaded.</p> : null}
      <Section title="Due today" meta={board ? `${board.dueToday.length} leads` : ''}>
        {board?.dueToday?.length ? board.dueToday.map((lead: any) => <LeadRow key={lead.id} lead={lead} onLog={() => setLogging(lead)} />) : <p className="text-sm text-gray-600">Nothing due today. Pick a lead from Ready to contact.</p>}
      </Section>
      <Section title="Overdue" meta={board ? `${board.overdue.length} leads, oldest first` : ''}>
        {board?.overdue?.map((lead: any) => <LeadRow key={lead.id} lead={lead} onLog={() => setLogging(lead)} />)}
      </Section>
      <Section title="Meetings today" meta={board ? `${board.meetingsToday.length} meeting` : ''}>
        {board?.meetingsToday?.map((meeting: any) => (
          <article key={meeting.id} className="border-b border-gray-100 py-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-sm text-gray-600">{formatLagosTime(meeting.startsAt)}{meeting.endsAt ? ` to ${formatLagosTime(meeting.endsAt)}` : ''}{meeting.meetLink ? ', Google Meet' : ''}</p>
                <Link href={`/growth/partnerships/leads/${meeting.leadId}`} className="font-semibold text-gray-950">{meeting.companyName}</Link>
                <p className="text-sm text-gray-600">{meeting.primaryContact?.fullName}</p>
              </div>
              {meeting.canEdit && meeting.status === 'booked' ? (
                <div className="flex gap-2">
                  <button type="button" className="min-h-11 rounded-full border px-3 text-sm" onClick={() => updateMeeting.mutate({ id: meeting.id, body: { status: 'held' } })}>Done</button>
                  <button type="button" className="min-h-11 rounded-full border px-3 text-sm" onClick={() => updateMeeting.mutate({ id: meeting.id, body: { status: 'no_show' } })}>No-show</button>
                  <button type="button" className="min-h-11 rounded-full border px-3 text-sm" onClick={() => updateMeeting.mutate({ id: meeting.id, body: { status: 'cancelled' } })}>Cancelled</button>
                </div>
              ) : null}
            </div>
          </article>
        ))}
      </Section>
      <Section title="Ready to contact" meta={board ? `${board.readyToContact.length} leads, oldest first` : ''}>
        {board?.readyToContact?.map((lead: any) => <LeadRow key={lead.id} lead={lead} onLog={() => setLogging(lead)} />)}
      </Section>
      {logging ? <FollowUpDrawer lead={logging} onClose={() => setLogging(null)} /> : null}
    </div>
  );
}

function Card({ eyebrow, value, extra, detail, href, linkLabel = 'See these leads →' }: { eyebrow: string; value?: number; extra?: string; detail: string; href: string; linkLabel?: string }) {
  return (
    <Link href={href} className="rounded-xl border border-gray-200 bg-white p-4">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">{eyebrow}</p>
      <p className="mt-2 text-3xl font-semibold text-gray-950">{value ?? '-'} {extra ? <span className="text-xl text-gray-400">{extra}</span> : null}</p>
      <p className="mt-1 text-sm text-gray-600">{detail}</p>
      <p className="mt-3 text-sm font-medium text-gray-950">{linkLabel}</p>
    </Link>
  );
}

function Section({ title, meta, children }: { title: string; meta: string; children: React.ReactNode }) {
  return (
    <section className="mt-6 rounded-xl border border-gray-200 bg-white px-4">
      <div className="flex items-center justify-between border-b py-3">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-gray-500">{title}</h2>
        <p className="text-xs text-gray-500">{meta}</p>
      </div>
      {children}
    </section>
  );
}

function LeadRow({ lead, onLog }: { lead: any; onLog: () => void }) {
  const contact = lead.contacts?.find((item: any) => item.isPrimary) || lead.contacts?.[0];
  return (
    <article className="border-b border-gray-100 py-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link href={`/growth/partnerships/leads/${lead.id}`} className="font-semibold text-gray-950">{lead.companyName} <span className="font-normal text-gray-500">{CATEGORY_LABEL[lead.category] || lead.category}</span></Link>
          {lead.groupName ? <p className="text-sm text-gray-600">Group: {lead.groupName}</p> : null}
          {contact ? <p className="text-sm text-gray-700">{contact.fullName}{contact.position ? `, ${contact.position}` : ''}</p> : null}
          <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-gray-600">
            <span className="rounded-full bg-gray-100 px-2 py-0.5">{STAGE_LABEL[lead.stage] || lead.stage}</span>
            <span className={`rounded-full px-2 py-0.5 ${statusChipClass(lead.followUpStatus)}`}>{STATUS_LABEL[lead.followUpStatus] || lead.followUpStatus}</span>
            <span>{lead.daysSinceLastContact == null ? 'Never contacted' : `Last contact ${lead.daysSinceLastContact} days ago`}</span>
            <span>{lead.effectiveDueIso ? `Due ${formatLagosDayDate(`${lead.effectiveDueIso}T12:00:00+01:00`)}` : 'No date set'}</span>
          </div>
        </div>
        {lead.canEdit ? <button type="button" onClick={onLog} className="min-h-11 rounded-full bg-gray-950 px-4 text-sm text-white">Log follow-up</button> : null}
      </div>
      <p className="mt-3 rounded-xl border px-3 py-3 text-sm text-gray-800">Next: {lead.nextStepText}</p>
    </article>
  );
}
