'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useState } from 'react';
import FollowUpDrawer from '@/components/partnerships/FollowUpDrawer';
import { useMyPermissions } from '@/hooks/useMyPermissions';
import { usePartnershipLead, usePartnershipMutations } from '@/hooks/usePartnerships';
import { CATEGORY_LABEL, CHANNEL_LABEL, DIRECTION_LABEL, MEETING_LABEL, PARTNER_TERMS_TEXT, STAGE_LABEL, STATUS_LABEL, commissionLabel, formatLagosDayDate, formatLagosTime, meetingChipClass, statusChipClass } from '@/lib/partnerships';

export default function PartnershipLeadPage() {
  const params = useParams<{ id: string }>();
  const leadQuery = usePartnershipLead(params.id);
  const { hasPermission } = useMyPermissions();
  const { changeStage, addContact, updateContact, addMeeting, updateMeeting } = usePartnershipMutations(params.id);
  const [tab, setTab] = useState<'timeline' | 'meetings' | 'history'>('timeline');
  const [logging, setLogging] = useState<null | { kind?: string; summary?: string }>(null);
  const [stageError, setStageError] = useState('');
  const [reason, setReason] = useState('');
  const [contactForm, setContactForm] = useState({ fullName: '', email: '', phone: '', position: '' });
  const [meetingAt, setMeetingAt] = useState('');
  const lead = leadQuery.data;

  if (leadQuery.isLoading) return <p className="text-sm text-gray-600">Loading this lead.</p>;
  if (!lead) return <p className="text-sm text-gray-600">This lead was not found.</p>;

  const timeline = [
    ...(lead.touches || []).map((item: any) => ({ id: item.id, at: item.occurredAt, kind: 'touch', item })),
    ...(lead.meetings || []).map((item: any) => ({ id: item.id, at: item.startsAt, kind: 'meeting', item })),
  ].sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());

  return (
    <div>
      <p className="text-sm text-gray-500">Partnerships / Leads / {lead.leadRef}</p>
      <div className="mt-2 flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h2 className="text-3xl font-semibold text-gray-950">{lead.companyName}</h2>
          <p className="mt-1 text-sm text-gray-600">{lead.leadRef} | {CATEGORY_LABEL[lead.category] || lead.category} | {lead.city || 'City not set'}, {lead.state || 'State not set'} | Owner: {lead.owner?.fullName || 'Not set'}</p>
          {lead.groupName ? <p className="text-sm text-gray-600">Group: {lead.groupName}</p> : null}
        </div>
        {lead.canEdit ? (
          <div className="flex flex-wrap gap-2">
            <select aria-label="Change stage" className="min-h-11 rounded-full border bg-white px-3 text-sm" value="" onChange={async (event) => {
              if (!event.target.value) return;
              setStageError('');
              try {
                await changeStage.mutateAsync({ id: lead.id, body: { toStage: event.target.value, reason } });
              } catch (caught) {
                setStageError((caught as Error).message);
              }
            }}>
              <option value="">Change stage</option>
              {(lead.allowedMoves || []).map((stage: string) => <option key={stage} value={stage}>{STAGE_LABEL[stage] || stage}</option>)}
            </select>
            <input aria-label="Reason for stage change" value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Reason, when one is required" className="min-h-11 rounded-full border px-3 text-sm" />
            <button type="button" className="min-h-11 rounded-full border bg-white px-4 text-sm" onClick={() => setLogging({ kind: 'partner_invite', summary: 'https://partner.buildmyhouse.app' })}>Invite to partner program</button>
            <button type="button" className="min-h-11 rounded-full bg-gray-950 px-4 text-sm text-white" onClick={() => setLogging({})}>Log follow-up</button>
            <button type="button" className="min-h-11 rounded-full border bg-white px-4 text-sm" onClick={() => setLogging({})}>Mark contacted today</button>
          </div>
        ) : <p className="text-sm text-gray-700">{lead.readOnlyReason}</p>}
      </div>
      {stageError ? <p className="mt-2 text-sm text-red-700">{stageError}</p> : null}
      <div className="mt-5 grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-4">
          <section className="rounded-2xl border border-gray-200 bg-white p-4">
            <div className="grid gap-4 sm:grid-cols-4">
              <Field label="Stage" value={STAGE_LABEL[lead.stage] || lead.stage} />
              <div><p className="text-[11px] uppercase tracking-wide text-gray-500">Status</p><span className={`mt-1 inline-flex rounded-full px-2 py-0.5 text-xs ${statusChipClass(lead.followUpStatus)}`}>{STATUS_LABEL[lead.followUpStatus]}</span></div>
              <div><p className="text-[11px] uppercase tracking-wide text-gray-500">Due date</p><p className="font-semibold text-gray-950">{lead.effectiveDueIso ? formatLagosDayDate(`${lead.effectiveDueIso}T12:00:00+01:00`) : 'No date set'}</p><p className="text-xs text-gray-500">{lead.daysSinceLastContact == null ? 'Never contacted' : `Last contact ${lead.daysSinceLastContact} days ago`}</p></div>
              <div><p className="text-[11px] uppercase tracking-wide text-gray-500">Partner</p><span className="mt-1 inline-flex rounded-full bg-gray-100 px-2 py-0.5 text-xs">{lead.partner?.status || 'Not invited'}</span></div>
            </div>
            <p className="mt-4 rounded-xl border px-3 py-3 text-sm text-gray-800">Next: {lead.nextStepText}</p>
            {lead.exactNextAction ? <p className="mt-3 rounded-xl border px-3 py-3 text-sm text-gray-800">Exact next action: {lead.exactNextAction}</p> : null}
          </section>
          <section className="rounded-2xl border border-gray-200 bg-white p-4">
            <div className="flex gap-4 border-b text-sm">
              <TabButton active={tab === 'timeline'} onClick={() => setTab('timeline')}>Timeline</TabButton>
              <TabButton active={tab === 'meetings'} onClick={() => setTab('meetings')}>Meetings ({lead.meetings?.length || 0})</TabButton>
              <TabButton active={tab === 'history'} onClick={() => setTab('history')}>History</TabButton>
            </div>
            <div className="mt-4 space-y-4">
              {tab === 'timeline' && timeline.length === 0 ? <p className="text-sm text-gray-500">No follow-ups logged yet.</p> : null}
              {tab === 'timeline' ? timeline.map((entry) => entry.kind === 'touch' ? (
                <article key={entry.id} className="grid gap-3 border-b border-gray-100 pb-4 sm:grid-cols-[160px_1fr]">
                  <p className="text-sm text-gray-500">{formatLagosDayDate(entry.item.occurredAt)}<br />{formatLagosTime(entry.item.occurredAt)}</p>
                  <div>
                    <p className="font-semibold text-gray-950">{CHANNEL_LABEL[entry.item.channel] || entry.item.channel}, {DIRECTION_LABEL[entry.item.direction] || entry.item.direction}</p>
                    <p className="mt-1 text-sm text-gray-700">{entry.item.summary}</p>
                  </div>
                </article>
              ) : (
                <article key={entry.id} className="grid gap-3 border-b border-gray-100 pb-4 sm:grid-cols-[160px_1fr]">
                  <p className="text-sm text-gray-500">{formatLagosDayDate(entry.item.startsAt)}<br />{formatLagosTime(entry.item.startsAt)}</p>
                  <p className="font-semibold text-gray-950">Meeting <span className={`ml-2 rounded-full px-2 py-0.5 text-xs font-medium ${meetingChipClass(entry.item.status)}`}>{MEETING_LABEL[entry.item.status] || entry.item.status}</span></p>
                </article>
              )) : null}
              {tab === 'meetings' ? (
                <div>
                  {(lead.meetings || []).map((meeting: any) => (
                    <div key={meeting.id} className="flex flex-wrap items-center justify-between gap-2 border-b py-3 text-sm">
                      <span>{formatLagosDayDate(meeting.startsAt)} {formatLagosTime(meeting.startsAt)} · {MEETING_LABEL[meeting.status]}</span>
                      {lead.canEdit && meeting.status === 'booked' ? (
                        <span className="flex gap-2">
                          <button type="button" className="rounded-full border px-3 py-1" onClick={() => updateMeeting.mutate({ id: meeting.id, body: { status: 'held' } })}>Done</button>
                          <button type="button" className="rounded-full border px-3 py-1" onClick={() => updateMeeting.mutate({ id: meeting.id, body: { status: 'no_show' } })}>No-show</button>
                          <button type="button" className="rounded-full border px-3 py-1" onClick={() => updateMeeting.mutate({ id: meeting.id, body: { status: 'cancelled' } })}>Cancelled</button>
                        </span>
                      ) : null}
                    </div>
                  ))}
                  {lead.canEdit ? (
                    <form className="mt-3 flex flex-wrap gap-2" onSubmit={(event) => { event.preventDefault(); addMeeting.mutate({ id: lead.id, body: { startsAt: `${meetingAt}:00+01:00` } }); }}>
                      <input type="datetime-local" value={meetingAt} onChange={(event) => setMeetingAt(event.target.value)} className="rounded-lg border px-3 py-2 text-sm" required />
                      <button className="rounded-full bg-gray-950 px-4 text-sm text-white">Add meeting</button>
                    </form>
                  ) : null}
                </div>
              ) : null}
              {tab === 'history' ? (
                <div className="space-y-3 text-sm text-gray-700">
                  {(lead.stageChanges || []).map((change: any) => <p key={change.id}>{formatLagosDayDate(change.changedAt)}: {STAGE_LABEL[change.fromStage] || 'New'} to {STAGE_LABEL[change.toStage] || change.toStage}. {change.reason || ''} {change.changedById ? '' : '(system)'}</p>)}
                  {(lead.audits || []).map((row: any) => <p key={row.id}>{formatLagosDayDate(row.at)}: {row.action}</p>)}
                </div>
              ) : null}
            </div>
          </section>
        </div>
        <aside className="space-y-4">
          <section className="rounded-2xl border border-gray-200 bg-white p-4">
            <h3 className="font-semibold text-gray-950">Contacts</h3>
            {(lead.contacts || []).map((contact: any) => (
              <div key={contact.id} className="mt-3 border-b border-gray-100 pb-3">
                <p className="font-medium text-gray-950">{contact.fullName} {contact.isPrimary ? <span className="rounded-full bg-gray-100 px-2 text-xs">Primary</span> : null} {contact.isDecisionMaker ? <span className="rounded-full bg-gray-100 px-2 text-xs">Decision-maker</span> : null}</p>
                <p className="text-sm text-gray-500">{contact.position}</p>
                {contact.email ? <p className="text-sm">{contact.email}</p> : null}
                {contact.phone ? <p className="text-sm">{contact.phone}</p> : null}
                {contact.doNotContact ? <p className="text-sm text-gray-700">Do not contact</p> : null}
                {lead.canEdit ? <button type="button" className="mt-1 text-xs underline" onClick={() => updateContact.mutate({ id: contact.id, body: { doNotContact: !contact.doNotContact, doNotContactReason: contact.doNotContact ? '' : 'Asked not to be contacted' } })}>{contact.doNotContact ? 'Allow contact' : 'Mark do not contact'}</button> : null}
              </div>
            ))}
            {lead.canEdit ? (
              <form className="mt-3 grid gap-2" onSubmit={(event) => { event.preventDefault(); addContact.mutate({ id: lead.id, body: { ...contactForm, isPrimary: !(lead.contacts || []).length } }); setContactForm({ fullName: '', email: '', phone: '', position: '' }); }}>
                <input placeholder="Name" value={contactForm.fullName} onChange={(event) => setContactForm({ ...contactForm, fullName: event.target.value })} className="rounded-lg border px-3 py-2 text-sm" required />
                <input placeholder="Email" value={contactForm.email} onChange={(event) => setContactForm({ ...contactForm, email: event.target.value })} className="rounded-lg border px-3 py-2 text-sm" />
                <input placeholder="Phone" value={contactForm.phone} onChange={(event) => setContactForm({ ...contactForm, phone: event.target.value })} className="rounded-lg border px-3 py-2 text-sm" />
                <button className="rounded-full border px-3 py-2 text-sm">Add contact</button>
              </form>
            ) : null}
          </section>
          <section className="rounded-2xl border border-gray-200 bg-white p-4">
            <div className="flex items-center justify-between"><h3 className="font-semibold text-gray-950">Partner program</h3><span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs">{lead.partner?.status || 'Not invited'}</span></div>
            <div className="mt-3 rounded-xl bg-gray-50 p-3 text-sm text-gray-700">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">How partners earn</p>
              <p className="mt-1">{PARTNER_TERMS_TEXT}</p>
            </div>
            {lead.partner?.linked ? (
              <dl className="mt-3 space-y-2 text-sm">
                <Row label="Partner code" value={lead.partner.code || 'Not set'} />
                <Row label="Approved" value={lead.partner.approvedAt ? formatLagosDayDate(lead.partner.approvedAt) : 'Not set'} />
                <Row label="Rate" value={lead.partner.rateLabel || 'Not set'} />
                <Row label="Link clicks, last 30 days" value={String(lead.partner.clicks30 || 0)} />
                <Row label="Referred homeowners" value={String(lead.partner.referredHomeowners || 0)} />
                <Row label="Referred projects" value={String((lead.partner.referredProjects || []).reduce((sum: number, item: any) => sum + item.count, 0))} />
                <Row label="Jobs that earned a commission" value={String(lead.partner.commissionJobs || 0)} />
                {(lead.partner.commissionsByStatus || []).map((item: any) => <Row key={item.status} label={commissionLabel(item.status)} value={String(item.count)} />)}
              </dl>
            ) : null}
            {lead.partner?.matchNeeded ? <p className="mt-3 text-sm text-gray-700">More than one partner matches this email. A Partnerships Admin needs to choose the link.</p> : null}
            {lead.partner?.referrerId && hasPermission('referrals.view') ? <Link href={`/growth/referrals/${lead.partner.referrerId}`} className="mt-3 inline-block text-sm underline">Open in Partner program</Link> : null}
            <p className="mt-3 text-xs text-gray-500">Read only. Approvals and payouts happen in Partner program.</p>
          </section>
        </aside>
      </div>
      {logging ? <FollowUpDrawer lead={lead} preset={logging} onClose={() => setLogging(null)} /> : null}
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return <div><p className="text-[11px] uppercase tracking-wide text-gray-500">{label}</p><p className="font-medium text-gray-950">{value}</p></div>;
}

function Row({ label, value }: { label: string; value: string }) {
  return <div className="flex items-center justify-between gap-3 border-b border-gray-100 py-1"><dt className="text-gray-600">{label}</dt><dd className="font-medium text-gray-950">{value}</dd></div>;
}

function TabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return <button type="button" className={active ? 'border-b-2 border-gray-950 pb-2 font-semibold' : 'pb-2 text-gray-500'} onClick={onClick}>{children}</button>;
}
