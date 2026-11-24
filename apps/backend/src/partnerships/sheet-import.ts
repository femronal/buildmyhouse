import { normaliseCompanyName, normaliseDomain, normaliseEmail, sheetsSerialToDate, toE164Nigeria } from './partnership-math';

export const REQUIRED_SHEET_HEADERS = [
  'Company Name',
  'Company Type',
  'Website',
  'City / State',
  'Contact Name',
  'Contact Position',
  'Phone / WhatsApp',
  'Email',
  'Current Relationship Stage',
  'Last Contact Date',
  'Last Contact Channel',
  'Last Contact Outcome',
  'Next Follow-Up Date',
  'Follow-Up Stage',
];

const IGNORED_HEADERS = new Set([
  'Lead ID',
  'Owner',
  'Days Since Last Contact',
  'Follow-Up Status',
  'Playbook Due Date',
  'Effective Follow-Up Date',
  'Next Playbook Message',
]);

const MAPPED_HEADERS = new Set([
  ...REQUIRED_SHEET_HEADERS,
  'Decision-Maker Confirmed?',
  'LinkedIn / Social Profile',
  'Relationship Temperature',
  'Exact Next Action',
  'Why This Company Matters',
  'What We Know About Them',
  'Suspected Relevant Problem',
  'Meeting Date',
  'Meeting Outcome',
  'Objection / Reaction',
]);

export type SheetContact = {
  fullName: string;
  position: string | null;
  email: string | null;
  phone: string | null;
  whatsapp: string | null;
  linkedinUrl: string | null;
  isDecisionMaker: boolean;
};

export type SheetTouch = {
  dateIso: string;
  channel: string;
  outcome: string;
  summary: string;
};

export type SheetMeeting = {
  dateIso: string;
  outcome: string | null;
  status: 'held' | 'booked';
};

export type MappedSheetRow = {
  rowNumber: number;
  companyName: string;
  companyNameNormalised: string;
  category: string;
  website: string | null;
  websiteDomain: string | null;
  city: string | null;
  state: string | null;
  stage: string;
  followUpStep: string;
  temperature: string | null;
  exactNextAction: string | null;
  whyTheyMatter: string | null;
  whatWeKnow: string | null;
  suspectedProblem: string | null;
  nextFollowUpOverride: string | null;
  contact: SheetContact | null;
  touch: SheetTouch | null;
  meeting: SheetMeeting | null;
  noteLines: { label: string; value: string }[];
  warnings: string[];
  importKey: string;
};

export function parseCsv(text: string): string[][] {
  const src = text.replace(/^\uFEFF/, '');
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = '';
  let quoted = false;
  for (let i = 0; i < src.length; i += 1) {
    const char = src[i];
    if (quoted) {
      if (char === '"') {
        if (src[i + 1] === '"') {
          cell += '"';
          i += 1;
        } else {
          quoted = false;
        }
      } else {
        cell += char;
      }
      continue;
    }
    if (char === '"') {
      quoted = true;
      continue;
    }
    if (char === ',') {
      row.push(cell);
      cell = '';
      continue;
    }
    if (char === '\n') {
      row.push(cell);
      rows.push(row);
      row = [];
      cell = '';
      continue;
    }
    if (char !== '\r') cell += char;
  }
  if (cell.length || row.length) {
    row.push(cell);
    rows.push(row);
  }
  return rows;
}

function cell(record: Record<string, string>, header: string): string {
  return (record[header] || '').trim();
}

function mapCategory(raw: string): { category: string; warning?: string } {
  const text = raw.trim().toLowerCase();
  const table: Record<string, string> = {
    'quantity surveyor': 'quantity_surveyor',
    'law firm': 'property_lawyer',
    architect: 'architect',
    'property manager': 'estate_manager',
    'estate surveyor': 'estate_manager',
    developer: 'small_developer',
    'real estate company': 'property_investor_adviser',
    consultant: 'property_investor_adviser',
    'diaspora organisation': 'diaspora_group',
    'diaspora organization': 'diaspora_group',
  };
  if (table[text]) return { category: table[text] };
  return { category: 'other', warning: `Company type "${raw.trim() || 'blank'}" was saved as Other.` };
}

function mapStage(raw: string): { stage: string; warnings: string[] } {
  const text = raw.trim().toLowerCase();
  const table: Record<string, string> = {
    researching: 'researching',
    'initial outreach': 'initial_outreach',
    gatekeeper: 'gatekeeper',
    'decision-maker identified': 'decision_maker_identified',
    'conversation attempted': 'conversation_attempted',
    'conversation booked': 'conversation_booked',
    'evaluation completed': 'evaluation_completed',
    'authority nurture': 'authority_nurture',
    'pilot candidate': 'pilot_candidate',
    'pilot active': 'pilot_active',
    'partnership discussion': 'partnership_discussion',
    'active partner': 'active_partner',
    dormant: 'dormant',
    'closed - not interested': 'closed_not_interested',
    'closed - poor fit': 'closed_poor_fit',
  };
  if (text === 'outreach sent') {
    return { stage: 'initial_outreach', warnings: ['Stage "Outreach sent" was saved as Initial outreach.'] };
  }
  if (table[text]) return { stage: table[text], warnings: [] };
  return { stage: 'researching', warnings: [`Stage "${raw.trim() || 'blank'}" was saved as Researching.`] };
}

function mapStep(raw: string): string {
  const text = raw.trim().toLowerCase();
  const table: Record<string, string> = {
    'day 0 - initial outreach': 'day_0',
    'day 4 - authority proof': 'day_4',
    'day 10 - utility': 'day_10',
    'day 21 - close the loop': 'day_21',
    'day 60 - nurture': 'day_60',
    'day 90 - long-term nurture': 'day_90',
    'pilot / evaluation': 'pilot_evaluation',
  };
  return table[text] || 'day_0';
}

function mapTemperature(raw: string): string | null {
  const text = raw.trim().toLowerCase();
  const table: Record<string, string> = {
    cold: 'cold',
    'aware of buildmyhouse': 'aware',
    warm: 'warm',
    engaged: 'engaged',
    strong: 'strong',
    dormant: 'dormant',
  };
  return table[text] || null;
}

function mapChannel(raw: string): { channel: string; extra: string } {
  const text = raw.trim().toLowerCase().replace(/\s+/g, ' ');
  if (text === 'whatsapp/ telephone' || text === 'whatsapp / telephone') {
    return { channel: 'whatsapp', extra: 'also by phone' };
  }
  if (text === 'email') return { channel: 'email', extra: '' };
  if (text === 'telephone') return { channel: 'phone', extra: '' };
  if (text === 'whatsapp') return { channel: 'whatsapp', extra: '' };
  if (text === 'google meet') return { channel: 'google_meet', extra: '' };
  return { channel: 'other', extra: raw.trim() };
}

function mapOutcome(raw: string): string {
  const text = raw.trim().toLowerCase();
  if (!text) return 'other';
  const pairs: [string, string][] = [
    ['opted out', 'opted_out'],
    ['invalid', 'invalid_number'],
    ['not on whatsapp', 'not_on_whatsapp'],
    ['decision-maker', 'decision_maker_reached'],
    ['decision maker', 'decision_maker_reached'],
    ['gatekeeper', 'gatekeeper_reached'],
    ['proposal', 'asked_for_proposal'],
    ['meeting booked', 'meeting_booked'],
    ['booked', 'meeting_booked'],
    ['meeting proposed', 'meeting_proposed'],
    ['positive', 'replied_positive'],
    ['neutral', 'replied_neutral'],
    ['negative', 'replied_negative'],
    ['dismissed', 'dismissed'],
    ['delivered', 'delivered'],
    ['no answer', 'no_answer'],
  ];
  for (const [needle, value] of pairs) {
    if (text.includes(needle)) return value;
  }
  return 'other';
}

export function parseSheetDate(raw: string): string | null {
  const text = raw.trim();
  if (!text) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) return text;
  const slash = text.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (slash) {
    const day = slash[1].padStart(2, '0');
    const month = slash[2].padStart(2, '0');
    return `${slash[3]}-${month}-${day}`;
  }
  if (/^\d+(\.\d+)?$/.test(text)) return sheetsSerialToDate(Math.floor(Number(text)));
  return null;
}

function splitCityState(raw: string): { city: string | null; state: string | null } {
  const text = raw.trim();
  if (!text) return { city: null, state: null };
  const parts = text.split(/\s*[,/]\s*/).map((part) => part.trim()).filter(Boolean);
  if (parts.length >= 2) return { city: parts[0], state: parts.slice(1).join(', ') };
  return { city: text, state: null };
}

export function mapSheet(text: string, importDayIso: string): { rows: MappedSheetRow[]; error?: string } {
  const table = parseCsv(text);
  if (!table.length) return { rows: [], error: 'The file has no header row.' };
  const headers = table[0].map((header) => header.trim());
  const missing = REQUIRED_SHEET_HEADERS.filter((header) => !headers.includes(header));
  if (missing.length) return { rows: [], error: `The file is missing: ${missing.join(', ')}.` };
  const rows: MappedSheetRow[] = [];
  table.slice(1).forEach((values, index) => {
    if (values.every((value) => !value.trim())) return;
    const record: Record<string, string> = {};
    headers.forEach((header, headerIndex) => {
      record[header] = values[headerIndex] || '';
    });
    const companyName = cell(record, 'Company Name');
    if (!companyName) return;
    const warnings: string[] = [];
    const category = mapCategory(cell(record, 'Company Type'));
    if (category.warning) warnings.push(category.warning);
    const stage = mapStage(cell(record, 'Current Relationship Stage'));
    warnings.push(...stage.warnings);
    const websiteText = cell(record, 'Website');
    const website = websiteText ? (/^https?:\/\//i.test(websiteText) ? websiteText : `https://${websiteText}`) : null;
    const place = splitCityState(cell(record, 'City / State'));
    const phones = cell(record, 'Phone / WhatsApp').split(/[/;]/).map((part) => part.trim()).filter(Boolean);
    const parsedPhones = phones.map((phone) => ({ raw: phone, e164: toE164Nigeria(phone) }));
    parsedPhones.filter((phone) => !phone.e164).forEach((phone) => {
      warnings.push(`Phone "${phone.raw}" could not be read and was kept in the import note.`);
    });
    const emails = cell(record, 'Email').split(/[;,]/).map((part) => part.trim()).filter(Boolean);
    const email = normaliseEmail(emails[0]);
    const name = cell(record, 'Contact Name');
    const contact = name || email || parsedPhones.some((phone) => phone.e164)
      ? {
          fullName: name || email || parsedPhones.find((phone) => phone.e164)?.e164 || companyName,
          position: cell(record, 'Contact Position') || null,
          email,
          phone: parsedPhones.find((phone) => phone.e164)?.e164 || null,
          whatsapp: parsedPhones.filter((phone) => phone.e164)[1]?.e164 || null,
          linkedinUrl: cell(record, 'LinkedIn / Social Profile') || null,
          isDecisionMaker: cell(record, 'Decision-Maker Confirmed?').toUpperCase().startsWith('YES'),
        }
      : null;
    const lastDate = parseSheetDate(cell(record, 'Last Contact Date'));
    const channel = mapChannel(cell(record, 'Last Contact Channel'));
    const outcomeRaw = cell(record, 'Last Contact Outcome');
    const objection = cell(record, 'Objection / Reaction');
    const summaryParts = [outcomeRaw, objection, channel.extra].filter(Boolean);
    const touch = lastDate
      ? { dateIso: lastDate, channel: channel.channel, outcome: mapOutcome(outcomeRaw), summary: summaryParts.join('. ') }
      : null;
    const meetingDate = parseSheetDate(cell(record, 'Meeting Date'));
    const meetingOutcome = cell(record, 'Meeting Outcome') || null;
    if (stage.stage === 'conversation_booked' && !meetingDate) warnings.push('Conversation booked has no meeting date.');
    const meeting = meetingDate
      ? { dateIso: meetingDate, outcome: meetingOutcome, status: meetingDate < importDayIso && meetingOutcome ? 'held' as const : 'booked' as const }
      : null;
    const noteLines: { label: string; value: string }[] = [];
    headers.forEach((header) => {
      if (IGNORED_HEADERS.has(header) || MAPPED_HEADERS.has(header)) return;
      const value = cell(record, header);
      if (value) noteLines.push({ label: header, value });
    });
    emails.slice(1).forEach((extra) => noteLines.push({ label: 'Extra email', value: extra }));
    parsedPhones.filter((phone) => !phone.e164 && phone.raw).forEach((phone) => noteLines.push({ label: 'Unread phone', value: phone.raw }));
    const normalised = normaliseCompanyName(companyName);
    rows.push({
      rowNumber: index + 2,
      companyName,
      companyNameNormalised: normalised,
      category: category.category,
      website,
      websiteDomain: normaliseDomain(website),
      city: place.city,
      state: place.state,
      stage: stage.stage,
      followUpStep: mapStep(cell(record, 'Follow-Up Stage')),
      temperature: mapTemperature(cell(record, 'Relationship Temperature')),
      exactNextAction: cell(record, 'Exact Next Action') || null,
      whyTheyMatter: cell(record, 'Why This Company Matters') || null,
      whatWeKnow: cell(record, 'What We Know About Them') || null,
      suspectedProblem: cell(record, 'Suspected Relevant Problem') || null,
      nextFollowUpOverride: parseSheetDate(cell(record, 'Next Follow-Up Date')),
      contact,
      touch,
      meeting,
      noteLines,
      warnings,
      importKey: `pde-sheet:${normalised}`,
    });
  });
  return { rows };
}
