import { commissionStatusLabel } from '@/lib/referrals';

export const PARTNER_TERMS_TEXT = "2.5% of the contractor amount, paid once per project after the final stage is approved and BuildMyHouse has confirmed the homeowner's payment.";

export const CATEGORY_LABEL: Record<string, string> = {
  quantity_surveyor: 'Quantity surveyor',
  property_lawyer: 'Property lawyer',
  architect: 'Architect',
  estate_manager: 'Estate manager',
  small_developer: 'Small developer',
  property_investor_adviser: 'Property investor or adviser',
  diaspora_group: 'Diaspora group',
  other: 'Other',
};

export const STAGE_LABEL: Record<string, string> = {
  researching: 'Researching',
  initial_outreach: 'Initial outreach',
  gatekeeper: 'Gatekeeper',
  decision_maker_identified: 'Decision-maker identified',
  conversation_attempted: 'Conversation attempted',
  conversation_booked: 'Conversation booked',
  evaluation_completed: 'Evaluation completed',
  authority_nurture: 'Authority nurture',
  pilot_candidate: 'Pilot candidate',
  pilot_active: 'Pilot active',
  partnership_discussion: 'Partnership discussion',
  active_partner: 'Active partner',
  dormant: 'Dormant',
  closed_not_interested: 'Closed not interested',
  closed_poor_fit: 'Closed poor fit',
};

export const STATUS_LABEL: Record<string, string> = {
  overdue: 'Overdue',
  due_today: 'Due today',
  upcoming: 'Upcoming',
  no_date: 'No date set',
  dormant: 'Dormant',
  closed: 'Closed',
  partner: 'Partner',
};

export const STEP_LABEL: Record<string, string> = {
  day_0: 'Day 0 - First outreach',
  day_4: 'Day 4 - Authority Proof',
  day_10: 'Day 10 - Utility',
  day_21: 'Day 21 - Close the loop',
  day_60: 'Day 60 - Nurture',
  day_90: 'Day 90 - Long-term nurture',
  pilot_evaluation: 'Pilot / Evaluation',
};

export const CHANNEL_LABEL: Record<string, string> = {
  email: 'Email',
  phone: 'Phone',
  whatsapp: 'WhatsApp',
  google_meet: 'Google Meet',
  in_person: 'In person',
  linkedin: 'LinkedIn',
  other: 'Other',
};

export const DIRECTION_LABEL: Record<string, string> = {
  outbound: 'Outbound',
  inbound: 'Inbound',
  internal_note: 'Internal note',
};

export const KIND_LABEL: Record<string, string> = {
  first_outreach: 'First outreach',
  authority_proof: 'Authority proof',
  utility: 'Utility',
  close_the_loop: 'Close the loop',
  nurture: 'Nurture',
  reply: 'Reply',
  meeting_request: 'Meeting request',
  call_attempt: 'Call attempt',
  call_connected: 'Call connected',
  partner_invite: 'Partner invite',
  note: 'Note',
  other: 'Other',
};

export const OUTCOME_LABEL: Record<string, string> = {
  no_answer: 'No answer',
  invalid_number: 'Invalid number',
  not_on_whatsapp: 'Not on WhatsApp',
  gatekeeper_reached: 'Gatekeeper reached',
  decision_maker_reached: 'Decision-maker reached',
  replied_positive: 'Replied positive',
  replied_neutral: 'Replied neutral',
  replied_negative: 'Replied negative',
  asked_for_proposal: 'Asked for a proposal',
  meeting_proposed: 'Meeting proposed',
  meeting_booked: 'Meeting booked',
  dismissed: 'Dismissed',
  opted_out: 'Opted out',
  delivered: 'Delivered',
  other: 'Other',
};

export const SOURCE_LABEL: Record<string, string> = {
  research_team: 'Research team',
  bot: 'Bot',
  referral: 'Referral',
  inbound: 'Inbound',
  event: 'Event',
  admin: 'Admin',
  sheet_import: 'Sheet import',
};

export const MEETING_LABEL: Record<string, string> = {
  booked: 'Booked',
  held: 'Done',
  no_show: 'No-show',
  cancelled: 'Cancelled',
};

export function statusChipClass(status?: string) {
  if (status === 'overdue') return 'bg-red-50 text-red-700';
  if (status === 'due_today') return 'bg-amber-100 text-amber-800';
  if (status === 'upcoming') return 'bg-gray-100 text-gray-700';
  if (status === 'no_date') return 'bg-gray-100 text-gray-600';
  if (status === 'dormant') return 'bg-slate-100 text-slate-700';
  if (status === 'closed') return 'bg-gray-100 text-gray-500 line-through';
  if (status === 'partner') return 'bg-green-100 text-green-700';
  return 'bg-gray-100 text-gray-700';
}

export function meetingChipClass(status?: string) {
  if (status === 'held') return 'bg-green-50 text-green-700';
  if (status === 'no_show') return 'bg-red-50 text-red-700';
  return 'bg-gray-100 text-gray-700';
}

export function formatLagosDayDate(value?: string | Date | null) {
  if (!value) return 'No date set';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'No date set';
  const parts = new Intl.DateTimeFormat('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'Africa/Lagos',
  }).formatToParts(date);
  const get = (type: string) => parts.find((part) => part.type === type)?.value || '';
  return `${get('weekday')} ${get('day')} ${get('month')} ${get('year')}`;
}

export function formatLagosTime(value?: string | Date | null) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const text = new Intl.DateTimeFormat('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
    timeZone: 'Africa/Lagos',
  }).format(date);
  return `${text} Lagos`;
}

export function lagosDateTimeLocal(date = new Date()) {
  const shifted = new Date(date.getTime() + 60 * 60 * 1000);
  return shifted.toISOString().slice(0, 16);
}

export function commissionLabel(status?: string | null) {
  if (!status) return 'Not set';
  if (['awaiting_checks', 'needs_review', 'approved', 'paid', 'reversed'].includes(status)) return commissionStatusLabel(status);
  return status;
}
