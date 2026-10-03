import { DIAL_CODES, normalizeWhatsApp, type AnswerMap, type AnswerValue, type FlowOption, type StepKind } from '@/lib/start-project/flow';
import { NIGERIA_STATES, areaPlaceholderForState, type NigeriaState } from '@/lib/nigeria-location';
import {
  BUILDER_CARDS,
  CLEANING_CARDS,
  LAGOS_AREA_CARDS,
  MATERIAL_GROUPS,
  ORIGINAL_REPAIR_KEYS,
  PROFESSIONS,
  PROFESSION_GROUPS,
  REPAIR_GROUPS,
  SOMETHING_ELSE,
  STATE_CARDS,
  WHAT_CARDS,
  materialCards,
  tradeCard,
} from './catalog';

export { DIAL_CODES, normalizeWhatsApp };
export type { AnswerMap, AnswerValue };

export type JoinPathId = 'repairs' | 'cleaning' | 'builders' | 'professional' | 'materials';
export type JoinSection = 'work' | 'place' | 'contact' | 'proof' | 'photos' | 'review';
export type ProofKey = 'council' | 'cac' | 'id' | 'reference' | 'address' | 'shopPhoto';
export type JoinStepKind = StepKind | 'proof' | 'photos';

export type JoinStep = {
  id: string;
  kind: JoinStepKind;
  section: JoinSection;
  question: string;
  helper?: string;
  optional?: boolean;
  multi?: boolean;
  searchable?: boolean;
  reviewLabel: string;
  proofKey?: ProofKey;
  allowNotApplicable?: boolean;
  options?: FlowOption[];
  groups?: { heading: string; optionIds: string[] }[];
};

const OTHER: FlowOption = { id: SOMETHING_ELSE, title: 'Something else', description: 'Tell us in a few words.' };

const SECTION_LABEL: Record<JoinSection, string> = {
  work: 'About your work',
  place: 'Where you work',
  contact: 'How to reach you',
  proof: 'Proof (optional)',
  photos: 'Photos (optional)',
  review: 'Check and send',
};

export function sectionLabel(section: JoinSection) {
  return SECTION_LABEL[section];
}

function step(partial: JoinStep): JoinStep {
  return partial;
}

export function proofsForAnswers(pathId: JoinPathId, answers: AnswerMap): ProofKey[] {
  const trade = answers.trade;
  const specialty = typeof trade === 'string' ? trade : '';
  const proofs: ProofKey[] = [];
  if (pathId === 'builders' && specialty === 'general_contractor') proofs.push('council');
  if (pathId === 'professional' && typeof trade === 'string' && PROFESSIONS[trade]?.regulatorShort) proofs.push('council');
  proofs.push('cac');
  if (pathId !== 'materials') proofs.push('id');
  if (pathId !== 'materials') proofs.push('reference');
  if (pathId === 'repairs' || pathId === 'cleaning' || pathId === 'builders') proofs.push('address');
  if (pathId === 'materials') proofs.push('shopPhoto');
  return proofs;
}

export function allowNotApplicable(pathId: JoinPathId, key: ProofKey) {
  if (key === 'cac') return pathId === 'repairs' || pathId === 'cleaning' || pathId === 'professional';
  if (key === 'address') return pathId === 'repairs' || pathId === 'cleaning';
  return false;
}

function proofQuestion(pathId: JoinPathId, key: ProofKey, answers: AnswerMap): string {
  if (key === 'council') {
    const regulator = regulatorFor(pathId, answers);
    if (regulator?.short === 'NBA') return 'Do you have your practising status with the Nigerian Bar Association (NBA)?';
    return `Are you registered with ${regulator?.short || 'your council'}?`;
  }
  if (key === 'cac') return 'Is your business registered with CAC?';
  if (key === 'id') return 'Do you have a government ID?';
  if (key === 'reference') return 'Can someone vouch for your work?';
  if (key === 'address') return 'Do you have proof of where you work from?';
  return 'Can you send a photo of your shop?';
}

export function regulatorFor(pathId: JoinPathId, answers: AnswerMap) {
  if (pathId === 'builders' && answers.trade === 'general_contractor') {
    return { short: 'CORBON', full: 'Council of Registered Builders of Nigeria' };
  }
  if (pathId === 'professional' && typeof answers.trade === 'string') {
    const profession = PROFESSIONS[answers.trade];
    if (profession?.regulatorShort) return { short: profession.regulatorShort, full: profession.regulatorFull || profession.regulatorShort };
  }
  return null;
}

function tradeOptions(pathId: JoinPathId, answers: AnswerMap): { options: FlowOption[]; groups?: JoinStep['groups']; multi?: boolean; searchable?: boolean; question: string; helper: string } {
  if (pathId === 'repairs') {
    return {
      question: "What's your main trade?",
      helper: 'Pick the one you do most. You can tell us about your other work on WhatsApp.',
      searchable: true,
      groups: REPAIR_GROUPS,
      options: [...ORIGINAL_REPAIR_KEYS.map((key) => tradeCard(key)), OTHER],
    };
  }
  if (pathId === 'cleaning') {
    return {
      question: 'What kind of cleaning do you do?',
      helper: 'Pick all that apply.',
      multi: true,
      options: [...CLEANING_CARDS, OTHER],
    };
  }
  if (pathId === 'builders') {
    return {
      question: 'What kind of building work do you take on?',
      helper: 'Pick the one you do most.',
      options: [...BUILDER_CARDS, OTHER],
    };
  }
  if (pathId === 'professional') {
    return {
      question: "What's your profession?",
      helper: 'Pick the closest match.',
      searchable: true,
      groups: PROFESSION_GROUPS,
      options: [
        ...PROFESSION_GROUPS.flatMap((group) => group.keys).map((key) => ({
          id: key,
          title: PROFESSIONS[key]?.title || key,
          description: 'The closest match.',
        })),
        OTHER,
      ],
    };
  }
  const group = typeof answers.group === 'string' ? answers.group : MATERIAL_GROUPS[0].id;
  return {
    question: 'Which of these do you sell?',
    helper: 'Pick all that apply.',
    multi: true,
    options: [...materialCards(group), OTHER],
  };
}

export function effectiveSteps(pathId: JoinPathId, answers: AnswerMap = {}): JoinStep[] {
  const steps: JoinStep[] = [];
  if (pathId === 'materials') {
    steps.push(step({
      id: 'group',
      kind: 'single',
      section: 'work',
      question: 'What does your shop mainly sell?',
      helper: 'Pick the closest group. You can add more next.',
      reviewLabel: 'What you sell',
      options: MATERIAL_GROUPS,
    }));
  }
  const trade = tradeOptions(pathId, answers);
  steps.push(step({
    id: 'trade',
    kind: trade.multi ? 'multi' : 'single',
    section: 'work',
    question: trade.question,
    helper: trade.helper,
    multi: trade.multi,
    searchable: trade.searchable,
    groups: trade.groups,
    reviewLabel: pathId === 'builders' ? 'Specialty' : pathId === 'professional' ? 'Profession' : pathId === 'materials' ? 'What you sell' : 'Your trade',
    options: trade.options,
  }));
  if (hasOther(answers)) {
    steps.push(step({
      id: 'trade-other',
      kind: 'note',
      section: 'work',
      question: 'Tell us what you do',
      helper: 'A few words is enough, for example "gate repair" or "carpet cleaning".',
      reviewLabel: 'Your trade',
    }));
  }
  steps.push(step({
    id: 'state',
    kind: 'single',
    section: 'place',
    question: 'Which state are you based in?',
    helper: 'Pick the closest match. You can add the areas next.',
    reviewLabel: 'State',
    options: [...STATE_CARDS, { id: 'other-state', title: 'Another state', description: 'Search the rest of Nigeria.' }],
  }));
  steps.push(step({
    id: 'area',
    kind: answers.state === 'lagos' ? 'multi' : 'area',
    section: 'place',
    question: answers.state === 'lagos' ? 'Which areas do you work in?' : 'Which town or city do you work in?',
    helper: answers.state === 'lagos' ? 'Pick all that apply. You can add more on WhatsApp.' : 'One place is enough for now.',
    multi: answers.state === 'lagos',
    reviewLabel: 'Areas',
    options: answers.state === 'lagos' ? LAGOS_AREA_CARDS : undefined,
  }));
  steps.push(step({
    id: 'contact',
    kind: 'contact',
    section: 'contact',
    question: 'How should we reach you?',
    helper: 'This is the only screen where you type. Use the WhatsApp number you want us to message.',
    reviewLabel: 'Contact',
  }));
  for (const key of proofsForAnswers(pathId, answers)) {
    steps.push(step({
      id: `proof-${key === 'shopPhoto' ? 'shop-photo' : key}`,
      kind: 'proof',
      section: 'proof',
      question: proofQuestion(pathId, key, answers),
      helper: 'Adding proof helps homeowners trust you faster. You can skip any of these and add them later.',
      optional: true,
      reviewLabel: 'Proof',
      proofKey: key,
      allowNotApplicable: allowNotApplicable(pathId, key),
    }));
  }
  steps.push(step({
    id: 'photos',
    kind: 'photos',
    section: 'photos',
    question: 'Want to show some of your work?',
    helper: "Three or more clear photos help homeowners trust you faster. You'll send them on WhatsApp right after the next screen.",
    optional: true,
    reviewLabel: 'Photos',
  }));
  steps.push(step({
    id: 'review',
    kind: 'review',
    section: 'review',
    question: 'Check your details',
    helper: 'Tap Change to fix anything. Nothing is public until BuildMyHouse has looked at it.',
    reviewLabel: 'Review',
  }));
  return steps;
}

export function hasOther(answers: AnswerMap) {
  const trade = answers.trade;
  if (Array.isArray(trade)) return trade.includes(SOMETHING_ELSE);
  return trade === SOMETHING_ELSE;
}

export function firstStepId(pathId: JoinPathId) {
  return effectiveSteps(pathId)[0].id;
}

export function stepHref(pathId: JoinPathId, stepId?: string, fromReview = false) {
  const query = fromReview ? '?from=review' : '';
  if (!stepId || stepId === 'what') return '/join';
  if (stepId === firstStepId(pathId)) return `/join/${pathId}${query}`;
  return `/join/${pathId}/${stepId}${query}`;
}

export function nextStep(pathId: JoinPathId, stepId: string, answers: AnswerMap) {
  const steps = effectiveSteps(pathId, answers);
  const index = steps.findIndex((item) => item.id === stepId);
  return steps[index + 1] || null;
}

export function previousHref(pathId: JoinPathId, stepId: string, answers: AnswerMap) {
  const steps = effectiveSteps(pathId, answers);
  const index = steps.findIndex((item) => item.id === stepId);
  if (index <= 0) return '/join';
  return stepHref(pathId, steps[index - 1].id);
}

export function isAnswered(step: JoinStep, answers: AnswerMap, contact?: { name: string; whatsapp: string }) {
  if (step.kind === 'proof' || step.kind === 'photos' || step.kind === 'review') return true;
  if (step.id === 'contact') {
    return !!contact && contact.name.trim().length >= 2 && contact.whatsapp.replace(/\D/g, '').length >= 8;
  }
  if (step.id === 'trade-other') return String(answers['trade-other'] || '').trim().length >= 3;
  if (step.id === 'area' && answers.state !== 'lagos') return String(answers.area || '').trim().length >= 2;
  const value = answers[step.id];
  if (Array.isArray(value)) return value.filter((item) => item !== SOMETHING_ELSE).length > 0 || value.includes(SOMETHING_ELSE);
  return typeof value === 'string' && value.length > 0;
}

export function firstIncompleteStep(pathId: JoinPathId, answers: AnswerMap, contact?: { name: string; whatsapp: string }) {
  return effectiveSteps(pathId, answers).find((item) => !isAnswered(item, answers, contact)) || null;
}

export function guardHref(pathId: JoinPathId, stepId: string, answers: AnswerMap) {
  const steps = effectiveSteps(pathId, answers);
  if (stepId === 'sent' || steps.some((item) => item.id === stepId)) return null;
  const next = firstIncompleteStep(pathId, answers) || steps[steps.length - 1];
  return stepHref(pathId, next.id);
}

export function progressFor(pathId: JoinPathId, stepId: string, answers: AnswerMap) {
  const steps = effectiveSteps(pathId, answers);
  const index = Math.max(0, steps.findIndex((item) => item.id === stepId));
  const current = steps[index];
  return {
    label: current ? sectionLabel(current.section) : 'About your work',
    fraction: steps.length ? (index + 1) / steps.length : 0,
  };
}

export function joinStaticParams() {
  const ids = ['group', 'trade', 'trade-other', 'state', 'area', 'contact', 'proof-council', 'proof-cac', 'proof-id', 'proof-reference', 'proof-address', 'proof-shop-photo', 'photos', 'review', 'sent'];
  const paths: JoinPathId[] = ['repairs', 'cleaning', 'builders', 'professional', 'materials'];
  return paths.flatMap((path) => ids.filter((step) => step !== firstStepId(path)).map((step) => ({ path, step })));
}

export function reviewRows(pathId: JoinPathId, answers: AnswerMap, contact: { name: string; whatsapp: string }) {
  const rows: { id: string; label: string; value: string }[] = [];
  const what = WHAT_CARDS.find((card) => card.id === pathId);
  rows.push({ id: 'what', label: 'What you do', value: what?.title || pathId });
  if (answers.trade) {
    const trade = Array.isArray(answers.trade) ? answers.trade : [answers.trade];
    const labels = trade.map((id) => {
      if (id === SOMETHING_ELSE) return String(answers['trade-other'] || 'Something else');
      return CLEANING_CARDS.find((card) => card.id === id)?.title
        || BUILDER_CARDS.find((card) => card.id === id)?.title
        || PROFESSIONS[id]?.title
        || TRADE_TITLES_SAFE(id);
    });
    rows.push({ id: 'trade', label: pathId === 'professional' ? 'Profession' : pathId === 'builders' ? 'Specialty' : 'Your trade', value: labels.join(', ') });
  }
  if (answers.state) rows.push({ id: 'state', label: 'State', value: String(answers.state) });
  if (answers.area) rows.push({ id: 'area', label: 'Areas', value: Array.isArray(answers.area) ? answers.area.join(', ') : String(answers.area) });
  if (contact.name) rows.push({ id: 'contact', label: 'Name', value: contact.name });
  if (contact.whatsapp) rows.push({ id: 'contact-number', label: 'WhatsApp', value: contact.whatsapp });
  return rows;
}

function TRADE_TITLES_SAFE(id: string) {
  return tradeCard(id).title;
}

export function buildJoinWhatsAppText(input: {
  pathId: JoinPathId;
  answers: AnswerMap;
  name: string;
  reference?: string | null;
}) {
  const rows = reviewRows(input.pathId, input.answers, { name: input.name, whatsapp: '' });
  const lines = ['Hello BuildMyHouse, I\'d like to join as a service provider.', ''];
  for (const row of rows) {
    if (row.id === 'contact') lines.push(`Name: ${row.value}`);
    else if (row.label === 'What you do' || row.label === 'Your trade' || row.label === 'Specialty' || row.label === 'Profession') {
      lines.push(`${row.label}: ${row.value}`);
    } else lines.push(`${row.label}: ${row.value}`);
  }
  const proofs = proofsForAnswers(input.pathId, input.answers);
  const send: string[] = [];
  const missing: string[] = [];
  const skip: string[] = [];
  for (const key of proofs) {
    const value = input.answers[`proof-${key === 'shopPhoto' ? 'shop-photo' : key}`];
    const label = proofQuestion(input.pathId, key, input.answers);
    if (value === 'added') send.push(label);
    else if (value === 'not_have') missing.push(label);
    else if (value === 'not_applicable') skip.push(label);
  }
  if (send.length) lines.push(`I can send: ${send.join(', ')}`);
  if (missing.length) lines.push(`Don't have yet: ${missing.join(', ')}`);
  if (skip.length) lines.push(`Doesn't apply: ${skip.join(', ')}`);
  if (input.answers.photos === 'will_send') lines.push("Photos: I'll send them here");
  if (input.answers.photos === 'skip') lines.push('Photos: Skipped');
  if (input.reference) lines.push(`Ref: ${input.reference}`);
  return lines.filter((line, index, all) => line !== '' || all[index - 1] !== '').join('\n');
}

export function labeledAnswers(pathId: JoinPathId, answers: AnswerMap) {
  const cleaning = CLEANING_CARDS.filter((card) => Array.isArray(answers.trade) && answers.trade.includes(card.id));
  const tradeKeys = pathId === 'cleaning'
    ? [...new Set(cleaning.map((card) => card.tradeKey))]
    : typeof answers.trade === 'string' && answers.trade !== SOMETHING_ELSE
      ? [answers.trade]
      : [];
  return {
    version: 1,
    ids: answers,
    labels: reviewRows(pathId, answers, { name: '', whatsapp: '' }),
    proofs: Object.fromEntries(proofsForAnswers(pathId, answers).map((key) => {
      const id = `proof-${key === 'shopPhoto' ? 'shop-photo' : key}`;
      return [key, answers[id]];
    })),
    photos: answers.photos || 'skip',
    tradeKeys,
    serviceLabels: cleaning.map((card) => card.serviceLabel),
    state: answers.state || null,
    areas: Array.isArray(answers.area) ? answers.area : answers.area ? [String(answers.area)] : [],
  };
}

export function otherStates() {
  const top = new Set(['Lagos', 'FCT', 'Ogun', 'Rivers', 'Oyo']);
  return NIGERIA_STATES.filter((state) => !top.has(state));
}

export function townPlaceholder(stateId: string) {
  const match = NIGERIA_STATES.find((state) => state.toLowerCase() === stateId || (stateId === 'abuja' && state === 'FCT'));
  if (!match) return 'Town or city';
  return areaPlaceholderForState(match as NigeriaState);
}
