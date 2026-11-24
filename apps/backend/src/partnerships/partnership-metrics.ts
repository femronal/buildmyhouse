import {
  effectiveDueIso,
  followUpStatus,
  lagosDateIso,
  lagosTodayIso,
  nurtureCheckDue,
  playbookDueIso,
} from './partnership-math';

export type CountMeeting = { status: string; startsAt: Date };

export type CountLead = {
  archivedAt: Date | null;
  stage: string;
  followUpStep: string;
  lastContactAt: Date | null;
  nextFollowUpOverride: Date | null;
  temperature: string | null;
  meetings: CountMeeting[];
};

export type PartnershipCounts = {
  actionRequired: number;
  overdue: number;
  dueToday: number;
  pilotCandidates: number;
  pilotsNeedingMeeting: number;
  dormant: number;
  closed: number;
  nurtureChecks: number;
  pipeline: number;
  open: number;
  partner: number;
  today: {
    dueToday: number;
    overdue: number;
    conversationsBooked: number;
    warmOrBetter: number;
    pilotCandidates: number;
  };
};

export function buildPartnershipCounts(leads: CountLead[], now: Date): PartnershipCounts {
  const today = lagosTodayIso(now);
  const active = leads.filter((lead) => !lead.archivedAt);
  const rows = active.map((lead) => {
    const due = effectiveDueIso(
      lead.nextFollowUpOverride ? lagosDateIso(lead.nextFollowUpOverride) : null,
      playbookDueIso(lead.lastContactAt, lead.followUpStep),
    );
    return {
      ...lead,
      status: followUpStatus(lead.stage, due, today),
      nurture: nurtureCheckDue(lead.stage, due, today),
    };
  });
  const overdue = rows.filter((lead) => lead.status === 'overdue');
  const dueToday = rows.filter((lead) => lead.status === 'due_today');
  const dormant = rows.filter((lead) => lead.stage === 'dormant');
  const closed = rows.filter((lead) => lead.stage.startsWith('closed_'));
  const partner = rows.filter((lead) => lead.stage === 'active_partner');
  const open = rows.filter((lead) => lead.stage !== 'dormant' && lead.stage !== 'active_partner' && !lead.stage.startsWith('closed_'));
  const pilots = rows.filter((lead) => lead.stage === 'pilot_candidate');
  const pilotsNeedingMeeting = pilots.filter((lead) => !lead.meetings.some((meeting) => meeting.status === 'booked' && meeting.startsAt > now));
  const pipeline = rows.length;
  if (open.length + dormant.length + closed.length + partner.length !== pipeline) {
    throw new Error('Partnership counts do not add up.');
  }
  return {
    actionRequired: overdue.length + dueToday.length,
    overdue: overdue.length,
    dueToday: dueToday.length,
    pilotCandidates: pilots.length,
    pilotsNeedingMeeting: pilotsNeedingMeeting.length,
    dormant: dormant.length,
    closed: closed.length,
    nurtureChecks: rows.filter((lead) => lead.nurture).length,
    pipeline,
    open: open.length,
    partner: partner.length,
    today: {
      dueToday: dueToday.length,
      overdue: overdue.length,
      conversationsBooked: rows.filter((lead) => lead.stage === 'conversation_booked').length,
      warmOrBetter: rows.filter((lead) => ['warm', 'engaged', 'strong'].includes(lead.temperature || '')).length,
      pilotCandidates: pilots.length,
    },
  };
}
