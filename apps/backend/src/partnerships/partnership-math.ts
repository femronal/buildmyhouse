import { addIsoDays } from '../admin/lagos-week';

const LAGOS_OFFSET_MS = 60 * 60 * 1000;

export const STEP_OFFSET_DAYS = {
  day_0: 4,
  day_4: 6,
  day_10: 11,
  day_21: 45,
  day_60: 30,
  day_90: 90,
  pilot_evaluation: null,
} as const;

export const NEXT_STEP_TEXT: Record<string, string> = {
  day_0: 'Day 4: send ONE authority asset (search evidence or case study). Ask for nothing.',
  day_4: 'Day 10: send ONE utility tool or resource matched to their business. Do not demand a meeting.',
  day_10: 'Day 21: send ONE short close-the-loop message, then set stage to Dormant.',
  day_21: 'Set stage to Dormant. Day 60 nurture only if BMH has a new reason.',
  day_60: 'Next: 90-day review - contact only with a new reason.',
  day_90: '90-day review - contact only if there is a genuine trigger.',
  pilot_evaluation: 'Pilot/evaluation - agree a small next step (tool access, one real case, feedback). No formal partnership ask yet.',
  dormant: 'Dormant - contact ONLY with a genuine new reason, and open with that reason.',
  closed: 'Closed - do not contact.',
};

export const DAILY_FIRST_OUTREACH_CAP = 2;

export const PARTNERSHIP_STAGES = [
  'researching',
  'initial_outreach',
  'gatekeeper',
  'decision_maker_identified',
  'conversation_attempted',
  'conversation_booked',
  'evaluation_completed',
  'authority_nurture',
  'pilot_candidate',
  'pilot_active',
  'partnership_discussion',
  'active_partner',
  'dormant',
  'closed_not_interested',
  'closed_poor_fit',
] as const;

const EARLY = ['initial_outreach', 'gatekeeper', 'decision_maker_identified', 'conversation_attempted'];
const CLOSED = ['closed_not_interested', 'closed_poor_fit'];
const OPEN = PARTNERSHIP_STAGES.filter((stage) => stage !== 'dormant' && !stage.startsWith('closed_'));
const STEP_ORDER = ['day_0', 'day_4', 'day_10', 'day_21', 'day_60', 'day_90'];
const MAIN_PATH = ['researching', 'initial_outreach', 'gatekeeper', 'decision_maker_identified', 'conversation_attempted', 'conversation_booked'];

export type FollowUpStatus = 'closed' | 'partner' | 'dormant' | 'no_date' | 'overdue' | 'due_today' | 'upcoming';

export type MoveFacts = {
  viaFirstOutreach?: boolean;
  hasMeeting?: boolean;
  hasHeldMeeting?: boolean;
  hasLinkedPartner?: boolean;
  hasManage?: boolean;
  reason?: string;
};

export function lagosDateIso(date: Date): string {
  const shifted = new Date(date.getTime() + LAGOS_OFFSET_MS);
  const year = shifted.getUTCFullYear();
  const month = String(shifted.getUTCMonth() + 1).padStart(2, '0');
  const day = String(shifted.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function lagosTodayIso(now: Date): string {
  return lagosDateIso(now);
}

export function lagosWeekday(now: Date): number {
  return new Date(now.getTime() + LAGOS_OFFSET_MS).getUTCDay();
}

export function playbookDueIso(lastContactAt: Date | null | undefined, step: string): string | null {
  if (!lastContactAt) return null;
  const offset = STEP_OFFSET_DAYS[step as keyof typeof STEP_OFFSET_DAYS];
  if (offset == null) return null;
  return addIsoDays(lagosDateIso(lastContactAt), offset);
}

export function effectiveDueIso(overrideIso: string | null | undefined, playbookIso: string | null): string | null {
  return overrideIso || playbookIso || null;
}

export function followUpStatus(stage: string, dueIso: string | null, todayIso: string): FollowUpStatus {
  if (stage.startsWith('closed_')) return 'closed';
  if (stage === 'active_partner') return 'partner';
  if (stage === 'dormant') return 'dormant';
  if (!dueIso) return 'no_date';
  if (dueIso < todayIso) return 'overdue';
  if (dueIso === todayIso) return 'due_today';
  return 'upcoming';
}

export function nurtureCheckDue(stage: string, dueIso: string | null, todayIso: string): boolean {
  return stage === 'dormant' && !!dueIso && dueIso <= todayIso;
}

export function daysSinceLastContact(lastContactAt: Date | null | undefined, todayIso: string): number | null {
  if (!lastContactAt) return null;
  const thenIso = lagosDateIso(lastContactAt);
  if (thenIso > todayIso) return 0;
  const [year, month, day] = thenIso.split('-').map(Number);
  const [todayYear, todayMonth, todayDay] = todayIso.split('-').map(Number);
  const then = Date.UTC(year, month - 1, day);
  const today = Date.UTC(todayYear, todayMonth - 1, todayDay);
  return Math.max(0, Math.round((today - then) / 86400000));
}

export function nextStep(step: string): string {
  if (step === 'day_90' || step === 'pilot_evaluation') return step;
  const index = STEP_ORDER.indexOf(step);
  if (index < 0 || index === STEP_ORDER.length - 1) return step;
  return STEP_ORDER[index + 1];
}

export function nextStepText(stage: string, step: string): string {
  if (stage.startsWith('closed_')) return NEXT_STEP_TEXT.closed;
  if (stage === 'dormant') return NEXT_STEP_TEXT.dormant;
  return NEXT_STEP_TEXT[step] || NEXT_STEP_TEXT.day_0;
}

export function isBeforeConversationBooked(stage: string): boolean {
  const index = MAIN_PATH.indexOf(stage);
  return index >= 0 && index < MAIN_PATH.indexOf('conversation_booked');
}

export function allowedStageMoves(from: string): string[] {
  if (from === 'researching') return ['initial_outreach', 'closed_poor_fit'];
  if (EARLY.includes(from)) return [...EARLY.filter((stage) => stage !== from), 'conversation_booked', 'authority_nurture', 'dormant', ...CLOSED];
  if (from === 'conversation_booked') return ['evaluation_completed', 'conversation_attempted', 'dormant', ...CLOSED];
  if (from === 'evaluation_completed') return ['authority_nurture', 'pilot_candidate', 'dormant', ...CLOSED];
  if (from === 'authority_nurture') return ['pilot_candidate', 'conversation_booked', 'dormant', ...CLOSED];
  if (from === 'pilot_candidate') return ['pilot_active', 'partnership_discussion', 'authority_nurture', 'dormant', ...CLOSED];
  if (from === 'pilot_active') return ['partnership_discussion', 'active_partner', 'dormant', ...CLOSED];
  if (from === 'partnership_discussion') return ['active_partner', 'pilot_active', 'dormant', ...CLOSED];
  if (from === 'active_partner') return ['dormant'];
  if (from === 'dormant') return [...OPEN];
  if (from.startsWith('closed_')) return ['dormant'];
  return [];
}

export function canMoveStage(from: string, to: string, facts: MoveFacts = {}): { ok: boolean; message: string } {
  if (!allowedStageMoves(from).includes(to)) {
    return { ok: false, message: 'That stage move is not allowed.' };
  }
  const reason = (facts.reason || '').trim();
  if (from === 'researching' && to === 'initial_outreach' && !facts.viaFirstOutreach) {
    return { ok: false, message: 'Log a first outreach to move this lead to Initial outreach.' };
  }
  if (to === 'conversation_booked' && !facts.hasMeeting) {
    return { ok: false, message: 'Book a meeting before you move this lead to Conversation booked.' };
  }
  if (from === 'conversation_booked' && to === 'evaluation_completed' && !facts.hasHeldMeeting) {
    return { ok: false, message: 'Mark a meeting Done before you move this lead to Evaluation completed.' };
  }
  if (to === 'active_partner' && !facts.hasLinkedPartner && !(facts.hasManage && reason)) {
    return { ok: false, message: 'Link a partner, or a Partnerships Admin must write a reason.' };
  }
  if (from === 'active_partner' && to === 'dormant' && !reason) {
    return { ok: false, message: 'Write why this partner is now dormant.' };
  }
  if (from === 'dormant' && !reason) {
    return { ok: false, message: 'Write the new reason for contacting this lead.' };
  }
  if (from.startsWith('closed_')) {
    if (!facts.hasManage) return { ok: false, message: 'Only a Partnerships Admin can reopen a closed lead.' };
    if (!reason) return { ok: false, message: 'Write why this closed lead is moving to Dormant.' };
  }
  return { ok: true, message: '' };
}

export function normaliseEmail(value?: string | null): string | null {
  const text = (value || '').trim().toLowerCase();
  return text || null;
}

export function normaliseDomain(value?: string | null): string | null {
  let text = (value || '').trim().toLowerCase();
  if (!text) return null;
  text = text.replace(/^[a-z][a-z0-9+.-]*:\/\//, '');
  text = text.split('/')[0].split('?')[0].split('#')[0];
  text = text.replace(/^www\./, '');
  return text || null;
}

export function normaliseCompanyName(value?: string | null): string {
  return (value || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\b(ltd|limited|plc|nig|nigeria)\b/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function toE164Nigeria(value?: string | null): string | null {
  if (!value) return null;
  let text = value.trim().replace(/^['=]+/, '').replace(/[\s-]/g, '');
  if (!text) return null;
  if (text.startsWith('+')) {
    const digits = text.slice(1).replace(/\D/g, '');
    return digits.length >= 10 && digits.length <= 15 ? `+${digits}` : null;
  }
  const digits = text.replace(/\D/g, '');
  if (/^0\d{10}$/.test(digits)) return `+234${digits.slice(1)}`;
  if (/^234\d{10}$/.test(digits)) return `+${digits}`;
  return null;
}

export function sheetsSerialToDate(serial: number): string {
  const date = new Date(Date.UTC(1899, 11, 30) + serial * 86400000);
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function dateOnlyIso(value?: Date | null): string | null {
  if (!value) return null;
  return lagosDateIso(value);
}

export type DuplicateKind = 'email' | 'domain' | 'name';

export type DuplicateHit = { kind: DuplicateKind; leadId: string; leadRef: string };

export function findDuplicate(
  input: { email?: string | null; domain?: string | null; companyName?: string | null; ignoreLeadId?: string | null },
  existing: { id: string; leadRef: string; companyNameNormalised: string; websiteDomain: string | null; emails: string[] }[],
): DuplicateHit | null {
  const email = normaliseEmail(input.email);
  const domain = normaliseDomain(input.domain);
  const name = normaliseCompanyName(input.companyName);
  const rows = existing.filter((row) => row.id !== input.ignoreLeadId);
  if (email) {
    const match = rows.find((row) => row.emails.includes(email));
    if (match) return { kind: 'email', leadId: match.id, leadRef: match.leadRef };
  }
  if (domain) {
    const match = rows.find((row) => row.websiteDomain === domain);
    if (match) return { kind: 'domain', leadId: match.id, leadRef: match.leadRef };
  }
  if (name) {
    const match = rows.find((row) => row.companyNameNormalised === name);
    if (match) return { kind: 'name', leadId: match.id, leadRef: match.leadRef };
  }
  return null;
}
