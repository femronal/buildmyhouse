import { parsePhoneNumberFromString, type CountryCode } from 'libphonenumber-js';

export const REPAIR_FEE_LINE = 'Platform service fee: ₦0 for repairs (free for now).';
export const READY_MADE_PLANS_HREF = '/design-library';
export const NOTE_MIN_LENGTH = 5;
export const START_REASSURANCE =
  'A BuildMyHouse agent will reply on WhatsApp to plan the next step. Nothing is paid until you agree the scope.';
export const NOTE_REQUIRED_HELPER = 'Tell us briefly what needs doing.';

export const DIAL_CODES = [
  { code: '+234', label: 'Nigeria' },
  { code: '+44', label: 'UK' },
  { code: '+1', label: 'US / Canada' },
  { code: '+971', label: 'UAE' },
] as const;

export type PathId = 'repair' | 'upgrade' | 'build' | 'interiors';
export type StepKind = 'single' | 'multi' | 'area' | 'note' | 'contact' | 'review';

export type FlowOption = {
  id: string;
  title: string;
  description: string;
  /** Shorter line used in the WhatsApp summary when it should differ from the card title. */
  message?: string;
};

export type FlowStep = {
  id: string;
  kind: StepKind;
  question: string;
  helper?: string;
  optional?: boolean;
  options?: FlowOption[];
  reviewLabel?: string;
};

export type StartPath = {
  id: PathId;
  title: string;
  cardDescription: string;
  letter: 'R' | 'U' | 'B' | 'I';
  seoTitle: string;
  seoDescription: string;
  intro: string;
  steps: FlowStep[];
};

const STATES: FlowOption[] = [
  { id: 'lagos', title: 'Lagos', description: 'The property is in Lagos.' },
  { id: 'abuja', title: 'Abuja FCT', description: 'The property is in Abuja.' },
  { id: 'ogun', title: 'Ogun', description: 'The property is in Ogun State.' },
  { id: 'rivers', title: 'Rivers', description: 'The property is in Rivers State.' },
  { id: 'oyo', title: 'Oyo', description: 'The property is in Oyo State.' },
  { id: 'other', title: 'Other', description: 'A different state. You can name it next.' },
];

const TIMING: FlowOption[] = [
  { id: 'asap', title: 'ASAP', description: 'You want to start as soon as the scope is clear.' },
  { id: '1-3-months', title: 'In 1–3 months', description: 'You are planning the next few months.' },
  { id: 'later', title: 'Later', description: 'There is no rush to start.' },
  { id: 'planning', title: 'Just planning', description: 'You are still working out what you want.' },
];

const UPGRADE_BUDGET: FlowOption[] = [
  { id: 'under-500k', title: 'Under ₦500,000', description: 'A smaller job.' },
  { id: '500k-2m', title: '₦500,000 – ₦2 million', description: 'A room or a focused upgrade.' },
  { id: '2m-10m', title: '₦2 million – ₦10 million', description: 'A larger renovation.' },
  { id: 'over-10m', title: 'Over ₦10 million', description: 'A whole-home or high-spec job.' },
  { id: 'not-sure', title: 'Not sure', description: 'A rough range is enough for now.' },
];

const BUILD_BUDGET: FlowOption[] = [
  { id: 'under-20m', title: 'Under ₦20 million', description: 'A smaller build.' },
  { id: '20-50m', title: '₦20 million – ₦50 million', description: 'A family home on a modest plot.' },
  { id: '50-150m', title: '₦50 million – ₦150 million', description: 'A larger home or a small block.' },
  { id: 'over-150m', title: 'Over ₦150 million', description: 'A big build or a commercial project.' },
  { id: 'not-sure', title: 'Not sure', description: 'We can talk through a range.' },
];

function stateStep(question = 'Which state is the property in?'): FlowStep {
  return {
    id: 'state',
    kind: 'single',
    question,
    helper: 'Pick the closest match. You can add the area next.',
    reviewLabel: 'State',
    options: STATES,
  };
}

function areaStep(): FlowStep {
  return {
    id: 'area',
    kind: 'area',
    question: 'Which area?',
    helper: 'A neighbourhood or LGA is enough. Skip this if you are not sure.',
    optional: true,
    reviewLabel: 'Area',
  };
}

function noteStep(): FlowStep {
  return {
    id: 'note',
    kind: 'note',
    question: 'Anything else we should know?',
    helper: 'You can send photos on WhatsApp.',
    optional: true,
    reviewLabel: 'Note',
  };
}

function contactStep(): FlowStep {
  return {
    id: 'contact',
    kind: 'contact',
    question: 'How should we reach you?',
    helper: 'Your name and the WhatsApp number you want us to message.',
  };
}

function reviewStep(): FlowStep {
  return {
    id: 'review',
    kind: 'review',
    question: 'Check your request',
    helper: START_REASSURANCE,
  };
}

function timingStep(): FlowStep {
  return {
    id: 'timing',
    kind: 'single',
    question: 'When do you want to start?',
    reviewLabel: 'Start',
    options: TIMING,
  };
}

export const HUB = {
  seoTitle: 'Start a project in Nigeria | BuildMyHouse',
  seoDescription:
    'Start a repair, upgrade, full build, or interior project in Nigeria. Answer a few short questions and send the request to a BuildMyHouse agent on WhatsApp.',
  question: 'What do you want to do?',
  intro:
    'Tell us what you want done, one question at a time. A BuildMyHouse agent picks it up on WhatsApp and plans the work with you, in stages you approve.',
} as const;

export const START_PATHS: Record<PathId, StartPath> = {
  repair: {
    id: 'repair',
    title: 'Repair',
    cardDescription: "Fix something that's broken or leaking.",
    letter: 'R',
    seoTitle: 'Start a home repair in Nigeria | BuildMyHouse',
    seoDescription:
      'Tell us what needs fixing, where the property is, and when a visit works. A BuildMyHouse agent plans the repair with you on WhatsApp, in stages you approve.',
    intro:
      "Tell us what's wrong, where the property is, and when works. A BuildMyHouse agent picks it up on WhatsApp and plans the repair with you, in stages you approve.",
    steps: [
      {
        id: 'type',
        kind: 'single',
        question: 'What needs fixing?',
        helper: 'Pick the closest match. You can add detail later.',
        reviewLabel: 'What needs fixing',
        options: [
          { id: 'plumbing', title: 'Plumbing', description: 'Leaks, blockages, taps, and pipes.' },
          { id: 'electrical', title: 'Electrical', description: 'Power cuts, fittings, and wiring faults.' },
          { id: 'roofing', title: 'Roofing', description: 'Leaks, missing sheets, and storm damage.' },
          { id: 'leaks', title: 'Leaks and damp', description: 'Damp walls, ceiling stains, and seepage.' },
          { id: 'doors', title: 'Doors and windows', description: 'Frames, locks, glass, and seals.' },
          { id: 'painting', title: 'Painting and walls', description: 'Cracks, peeling paint, and damp patches.' },
          { id: 'ac', title: 'AC or generator', description: 'Cooling, servicing, and backup power.' },
          { id: 'other', title: 'Something else', description: 'We will ask you to describe it in a note.' },
        ],
      },
      {
        id: 'urgency',
        kind: 'single',
        question: 'How urgent is it?',
        reviewLabel: 'Urgency',
        options: [
          { id: 'today', title: 'Today', description: 'It needs someone as soon as possible.' },
          { id: 'this-week', title: 'This week', description: 'A visit in the next few days is fine.' },
          { id: 'this-month', title: 'Within a month', description: 'It can wait a little.' },
          { id: 'not-sure', title: 'Not sure', description: 'We can help you decide.' },
        ],
      },
      stateStep(),
      areaStep(),
      {
        id: 'access',
        kind: 'single',
        question: 'Is someone at the property who can let the technician in?',
        reviewLabel: 'Access',
        options: [
          { id: 'me', title: 'Yes, me', description: 'I can let the technician in.', message: 'I will be at the property' },
          {
            id: 'family',
            title: 'Family or caretaker',
            description: 'Someone else is there.',
            message: 'Family or caretaker at the property',
          },
          { id: 'abroad', title: "No, I'm abroad", description: 'Nobody is there right now.', message: 'Nobody is at the property' },
          { id: 'not-sure', title: 'Not sure', description: 'We can sort this out on WhatsApp.' },
        ],
      },
      {
        id: 'visit-time',
        kind: 'single',
        question: 'When is a good time for a visit?',
        reviewLabel: 'Visit time',
        options: [
          { id: 'morning', title: 'Morning', description: 'Before midday.' },
          { id: 'afternoon', title: 'Afternoon', description: 'After midday.' },
          { id: 'evening', title: 'Evening', description: 'Later in the day.' },
          { id: 'any', title: 'Any time', description: 'Whatever works for the technician.' },
        ],
      },
      {
        id: 'visit-day',
        kind: 'single',
        question: 'Which day works?',
        helper: 'A rough day is enough.',
        reviewLabel: 'Visit day',
        options: [
          { id: 'today', title: 'Today', description: 'If someone can come today.' },
          { id: 'tomorrow', title: 'Tomorrow', description: 'The next day is fine.' },
          { id: 'this-week', title: 'This week', description: 'Any day in the next few days.' },
          { id: 'not-sure', title: 'Not sure', description: 'The agent can suggest a time.' },
        ],
      },
      noteStep(),
      contactStep(),
      reviewStep(),
    ],
  },
  upgrade: {
    id: 'upgrade',
    title: 'Upgrade or renovation',
    cardDescription: 'Improve a room, a floor, or the whole house.',
    letter: 'U',
    seoTitle: 'Start an upgrade or renovation in Nigeria | BuildMyHouse',
    seoDescription:
      'Tell us which part of the house you want to improve, where it is, and a rough budget. A BuildMyHouse agent plans the work with you on WhatsApp.',
    intro:
      'Tell us which part of the house you want to improve, where it is, and a rough budget. A BuildMyHouse agent replies on WhatsApp and plans the work in stages you approve.',
    steps: [
      {
        id: 'what',
        kind: 'multi',
        question: 'What do you want to upgrade?',
        helper: 'Choose every area that applies.',
        reviewLabel: 'Upgrade',
        options: [
          { id: 'kitchen', title: 'Kitchen', description: 'Cabinets, worktops, fittings, and layout.' },
          { id: 'bathroom', title: 'Bathroom', description: 'Fixtures, tiling, and plumbing fittings.' },
          { id: 'flooring', title: 'Flooring and tiling', description: 'Floors, tiles, and finishes.' },
          { id: 'painting', title: 'Painting', description: 'Interior or exterior repainting.' },
          { id: 'roofing', title: 'Roofing', description: 'A roof replacement or upgrade.' },
          { id: 'whole-house', title: 'Whole house', description: 'More than one room, or the full home.' },
          { id: 'other', title: 'Something else', description: 'Describe it in the note.' },
        ],
      },
      {
        id: 'occupied',
        kind: 'single',
        question: 'Is the property lived in?',
        reviewLabel: 'Lived in',
        options: [
          { id: 'family', title: 'Family lives there', description: 'People will be in the house during the work.' },
          { id: 'tenants', title: 'Tenants', description: 'Someone else is living there.' },
          { id: 'empty', title: 'Empty', description: 'The property is vacant.' },
          { id: 'not-sure', title: 'Not sure', description: 'We can sort this out on WhatsApp.' },
        ],
      },
      stateStep(),
      areaStep(),
      {
        id: 'budget',
        kind: 'single',
        question: 'What is your rough budget?',
        helper: 'A range is enough. You are not committing to a price.',
        reviewLabel: 'Budget',
        options: UPGRADE_BUDGET,
      },
      timingStep(),
      noteStep(),
      contactStep(),
      reviewStep(),
    ],
  },
  build: {
    id: 'build',
    title: 'Full build',
    cardDescription: 'Build from land to keys.',
    letter: 'B',
    seoTitle: 'Start a full build in Nigeria | BuildMyHouse',
    seoDescription:
      'Tell us about the land, whether you have plans, and what you want to build. A BuildMyHouse agent walks the project with you on WhatsApp.',
    intro:
      'Tell us about the land, the plans, and what you want to build. A BuildMyHouse agent replies on WhatsApp and walks the project with you, in stages you approve.',
    steps: [
      {
        id: 'land',
        kind: 'single',
        question: 'Do you have land?',
        reviewLabel: 'Land',
        options: [
          { id: 'documents', title: 'Yes, with documents', description: 'The land papers are in hand.' },
          { id: 'in-progress', title: 'Documents in progress', description: 'The land is yours, papers are still moving.' },
          { id: 'not-yet', title: 'Not yet', description: 'You are still looking for land.' },
        ],
      },
      stateStep('Where is the land?'),
      areaStep(),
      {
        id: 'plans',
        kind: 'single',
        question: 'Do you have building plans?',
        reviewLabel: 'Plans',
        options: [
          { id: 'approved', title: 'Yes, approved plans', description: 'The drawings are already approved.' },
          { id: 'not-approved', title: 'Yes, not approved', description: 'You have drawings, not yet approved.' },
          {
            id: 'ready-made',
            title: 'Show me ready-made plans',
            description: 'You want to start from plans we already have.',
          },
          { id: 'not-sure', title: 'Not sure', description: 'You are still deciding.' },
        ],
      },
      {
        id: 'building',
        kind: 'single',
        question: 'What are you building?',
        reviewLabel: 'Building',
        options: [
          { id: 'bungalow', title: 'Bungalow', description: 'A single-storey home.' },
          { id: 'duplex', title: 'Duplex', description: 'A two-storey home.' },
          { id: 'flats', title: 'Block of flats', description: 'More than one apartment.' },
          { id: 'commercial', title: 'Commercial', description: 'A shop, office, or other business building.' },
          { id: 'not-sure', title: 'Not sure yet', description: 'You are still deciding the type.' },
        ],
      },
      {
        id: 'budget',
        kind: 'single',
        question: 'What is your rough budget?',
        helper: 'A range is enough. You are not committing to a price.',
        reviewLabel: 'Budget',
        options: BUILD_BUDGET,
      },
      timingStep(),
      noteStep(),
      contactStep(),
      reviewStep(),
    ],
  },
  interiors: {
    id: 'interiors',
    title: 'Interior design',
    cardDescription: 'Furnish or redesign the inside.',
    letter: 'I',
    seoTitle: 'Start an interior project in Nigeria | BuildMyHouse',
    seoDescription:
      'Tell us which space you want furnished or redesigned, where it is, and a rough budget. A BuildMyHouse agent plans it with you on WhatsApp.',
    intro:
      'Tell us which space you want furnished or redesigned. A BuildMyHouse agent replies on WhatsApp and plans the work with you, in stages you approve.',
    steps: [
      {
        id: 'space',
        kind: 'single',
        question: 'Which space?',
        reviewLabel: 'Space',
        options: [
          { id: 'living', title: 'Living room', description: 'The main sitting space.' },
          { id: 'bedroom', title: 'Bedroom', description: 'One bedroom, or a few.' },
          { id: 'kitchen', title: 'Kitchen', description: 'The kitchen and how it is used.' },
          { id: 'whole-home', title: 'Whole house', description: 'More than one room.' },
          { id: 'office', title: 'Office or shop', description: 'A workspace or a shop interior.' },
          { id: 'not-sure', title: 'Not sure', description: 'We can help you choose the space.' },
        ],
      },
      {
        id: 'need',
        kind: 'single',
        question: 'What do you need?',
        reviewLabel: 'Need',
        options: [
          { id: 'design', title: 'Design only', description: 'Drawings and a plan, without buying furniture.' },
          { id: 'design-furnish', title: 'Design and furnishing', description: 'A plan, plus the furniture and finishes.' },
          { id: 'furnishing', title: 'Furnishing only', description: 'You already know the look. You need the pieces.' },
          { id: 'not-sure', title: 'Not sure', description: 'We can help you choose.' },
        ],
      },
      stateStep(),
      areaStep(),
      {
        id: 'budget',
        kind: 'single',
        question: 'What is your rough budget?',
        helper: 'A range is enough. You are not committing to a price.',
        reviewLabel: 'Budget',
        options: UPGRADE_BUDGET,
      },
      timingStep(),
      noteStep(),
      contactStep(),
      reviewStep(),
    ],
  },
};

export const START_PATH_IDS = Object.keys(START_PATHS) as PathId[];

export type AnswerValue = string | string[];
export type AnswerMap = Record<string, AnswerValue>;

export function isPathId(value: string | undefined | null): value is PathId {
  return !!value && value in START_PATHS;
}

export function getPath(pathId: string | undefined | null): StartPath | null {
  return isPathId(pathId) ? START_PATHS[pathId] : null;
}

export function stepById(path: StartPath, stepId: string | undefined | null): FlowStep | null {
  if (!stepId) return path.steps[0] ?? null;
  return path.steps.find((step) => step.id === stepId) ?? null;
}

export function stepHref(pathId: string, stepId: string, fromReview = false): string {
  const path = getPath(pathId);
  if (!path) return '/start';
  const base = stepId === path.steps[0]?.id ? `/start/${pathId}` : `/start/${pathId}/${stepId}`;
  return fromReview ? `${base}?from=review` : base;
}

export function nextStep(path: StartPath, stepId: string): FlowStep | null {
  const index = path.steps.findIndex((step) => step.id === stepId);
  if (index < 0) return null;
  return path.steps[index + 1] ?? null;
}

export function previousHref(path: StartPath | null, stepId: string | null): string {
  if (!path || !stepId) return '/';
  const index = path.steps.findIndex((step) => step.id === stepId);
  if (index <= 0) return '/start';
  const previous = path.steps[index - 1];
  return stepHref(path.id, previous.id);
}

export function hrefAfterAnswer(path: StartPath, stepId: string, fromReview: boolean): string {
  if (fromReview || stepId === 'contact') return stepHref(path.id, 'review');
  const upcoming = nextStep(path, stepId);
  return upcoming ? stepHref(path.id, upcoming.id) : stepHref(path.id, 'review');
}

/** State chooses the area list. "Something else" makes the later note required. */
export function hrefAfterChoice(
  path: StartPath,
  stepId: string,
  previous: AnswerValue | undefined,
  next: AnswerValue,
  fromReview: boolean,
  answers: AnswerMap,
): { href: string; clearArea: boolean } {
  const clearArea = stepId === 'state' && previous !== next;
  const nextAnswers: AnswerMap = { ...answers, [stepId]: next };
  if (clearArea) nextAnswers.area = '';
  if (fromReview && clearArea) return { href: stepHref(path.id, 'area', true), clearArea };
  if (fromReview && noteIsRequired(path, nextAnswers)) {
    const note = typeof nextAnswers.note === 'string' ? nextAnswers.note.trim() : '';
    if (note.length < NOTE_MIN_LENGTH) return { href: stepHref(path.id, 'note', true), clearArea };
  }
  return { href: hrefAfterAnswer(path, stepId, fromReview), clearArea };
}

function countedSteps(path: StartPath): FlowStep[] {
  return path.steps.filter((step) => step.kind !== 'review');
}

export function progressFor(path: StartPath | null, stepId: string | null): {
  current: number;
  total: number;
  fraction: number;
  label: string;
} {
  if (!path || !stepId) {
    return { current: 0, total: 0, fraction: 0, label: '' };
  }
  const steps = countedSteps(path);
  const total = steps.length;
  if (stepId === 'review') {
    return { current: total, total, fraction: 1, label: 'Last step: check your request' };
  }
  if (stepId === 'sent') {
    return { current: total, total, fraction: 1, label: '' };
  }
  const index = steps.findIndex((step) => step.id === stepId);
  const current = index < 0 ? 1 : index + 1;
  return {
    current,
    total,
    fraction: total ? current / total : 0,
    label: `Step ${current} of ${total}`,
  };
}

export function optionById(step: FlowStep, id: string): FlowOption | undefined {
  return step.options?.find((option) => option.id === id);
}

export function optionLabel(step: FlowStep, id: string, forMessage = false): string {
  const option = optionById(step, id);
  if (!option) return id;
  return forMessage ? option.message || option.title : option.title;
}

export function noteIsRequired(path: StartPath, answers: AnswerMap): boolean {
  if (path.id === 'repair') return answers.type === 'other';
  if (path.id === 'upgrade') {
    const what = answers.what;
    return Array.isArray(what) && what.includes('other');
  }
  return false;
}

export function isAnswered(
  step: FlowStep,
  value: AnswerValue | undefined,
  contact?: { name: string; whatsapp: string },
  context?: { path: StartPath; answers: AnswerMap },
): boolean {
  if (step.kind === 'review') return true;
  if (step.kind === 'contact') return !!contact?.name.trim() && !!contact.whatsapp.trim();
  if (step.kind === 'note' && context && noteIsRequired(context.path, context.answers)) {
    return typeof value === 'string' && value.trim().length >= NOTE_MIN_LENGTH;
  }
  if (step.optional) return true;
  if (Array.isArray(value)) return value.length > 0;
  return typeof value === 'string' && value.trim().length > 0;
}

export function firstIncompleteStep(
  path: StartPath,
  answers: AnswerMap,
  contact: { name: string; whatsapp: string },
): FlowStep | null {
  for (const step of path.steps) {
    if (!isAnswered(step, answers[step.id], contact, { path, answers })) return step;
  }
  return null;
}

/** Send the person to the earliest required step they have not answered yet. */
export function guardHref(
  path: StartPath,
  stepId: string,
  answers: AnswerMap,
  contact: { name: string; whatsapp: string },
): string | null {
  const incomplete = firstIncompleteStep(path, answers, contact);
  if (!incomplete) return null;
  const currentIndex = path.steps.findIndex((step) => step.id === stepId);
  const incompleteIndex = path.steps.findIndex((step) => step.id === incomplete.id);
  if (currentIndex > incompleteIndex) return stepHref(path.id, incomplete.id);
  return null;
}

export function pathStaticParams(): { path: PathId }[] {
  return START_PATH_IDS.map((path) => ({ path }));
}

export function stepStaticParams(): { path: PathId; step: string }[] {
  const rows: { path: PathId; step: string }[] = [];
  for (const path of Object.values(START_PATHS)) {
    for (const step of path.steps.slice(1)) rows.push({ path: path.id, step: step.id });
    rows.push({ path: path.id, step: 'sent' });
  }
  return rows;
}

export type ReviewRow = {
  stepId: string;
  label: string;
  value: string;
};

export function reviewRows(
  path: StartPath,
  answers: AnswerMap,
  contact: { name: string; whatsapp: string },
): ReviewRow[] {
  const rows: ReviewRow[] = [];
  for (const step of path.steps) {
    if (step.kind === 'review' || step.kind === 'contact') continue;
    const value = answers[step.id];
    if (step.kind === 'area' || step.kind === 'note') {
      const text = typeof value === 'string' ? value.trim() : '';
      if (!text) continue;
      rows.push({ stepId: step.id, label: step.reviewLabel || step.question, value: text });
      continue;
    }
    if (step.kind === 'multi' && Array.isArray(value)) {
      const labels = value.map((id) => optionLabel(step, id)).filter(Boolean);
      if (!labels.length) continue;
      rows.push({ stepId: step.id, label: step.reviewLabel || step.question, value: labels.join(', ') });
      continue;
    }
    if (typeof value === 'string' && value) {
      rows.push({
        stepId: step.id,
        label: step.reviewLabel || step.question,
        value: optionLabel(step, value),
      });
    }
  }
  if (contact.name.trim()) rows.push({ stepId: 'contact', label: 'Name', value: contact.name.trim() });
  if (contact.whatsapp.trim()) rows.push({ stepId: 'contact', label: 'WhatsApp', value: contact.whatsapp.trim() });
  return rows;
}

function answerText(path: StartPath, stepId: string, answers: AnswerMap, forMessage = true): string {
  const step = stepById(path, stepId);
  const value = answers[stepId];
  if (!step || value == null) return '';
  if (Array.isArray(value)) return value.map((id) => optionLabel(step, id, forMessage)).join(', ');
  if (step.kind === 'area' || step.kind === 'note') return value.trim();
  return optionLabel(step, value, forMessage);
}

function locationLine(path: StartPath, answers: AnswerMap): string {
  const state = answerText(path, 'state', answers);
  const area = answerText(path, 'area', answers);
  return [state, area].filter(Boolean).join(', ');
}

export function buildWhatsAppText(
  pathId: PathId,
  answers: AnswerMap,
  contact: { name: string },
  reference?: string | null,
): string {
  const path = START_PATHS[pathId];
  const lines = ["Hello BuildMyHouse, I'd like to start a project.", ''];

  const push = (label: string, value: string) => {
    if (value.trim()) lines.push(`${label}: ${value.trim()}`);
  };

  if (pathId === 'repair') {
    push('Type', `${path.title} – ${answerText(path, 'type', answers)}`);
    push('Urgency', answerText(path, 'urgency', answers));
    push('Location', locationLine(path, answers));
    push('Access', answerText(path, 'access', answers));
    const visit = [answerText(path, 'visit-time', answers), answerText(path, 'visit-day', answers)]
      .filter(Boolean)
      .join(', ');
    push('Visit', visit);
  } else if (pathId === 'upgrade') {
    push('Type', `${path.title} – ${answerText(path, 'what', answers)}`);
    push('Lived in', answerText(path, 'occupied', answers));
    push('Location', locationLine(path, answers));
    push('Budget', answerText(path, 'budget', answers));
    push('Start', answerText(path, 'timing', answers));
  } else if (pathId === 'build') {
    push('Type', `${path.title} – ${answerText(path, 'building', answers)}`);
    push('Land', answerText(path, 'land', answers));
    push('Location', locationLine(path, answers));
    push('Plans', answerText(path, 'plans', answers));
    push('Budget', answerText(path, 'budget', answers));
    push('Start', answerText(path, 'timing', answers));
  } else {
    push('Type', `${path.title} – ${answerText(path, 'space', answers)}`);
    push('Need', answerText(path, 'need', answers));
    push('Location', locationLine(path, answers));
    push('Budget', answerText(path, 'budget', answers));
    push('Start', answerText(path, 'timing', answers));
  }

  push('Note', answerText(path, 'note', answers));
  push('Name', contact.name.trim());
  if (reference) push('Ref', reference);
  return lines.join('\n');
}

export function labeledAnswers(path: StartPath, answers: AnswerMap): Record<string, string> {
  const labeled: Record<string, string> = {};
  for (const step of path.steps) {
    if (step.kind === 'review' || step.kind === 'contact') continue;
    const text = answerText(path, step.id, answers, false);
    if (text) labeled[step.id] = text;
  }
  return labeled;
}

const DIAL_COUNTRIES: Record<string, CountryCode | CountryCode[]> = {
  '+234': 'NG',
  '+44': 'GB',
  '+1': ['US', 'CA'],
  '+971': 'AE',
};

function parsedNational(input: string, dialCode: string) {
  const country = DIAL_COUNTRIES[dialCode];
  const countries = Array.isArray(country) ? country : country ? [country] : [];
  for (const code of countries) {
    const parsed = parsePhoneNumberFromString(input, code);
    if (parsed?.isValid() && `+${parsed.countryCallingCode}` === dialCode) return parsed;
  }
  return null;
}

/** Turn a typed or pasted number into E.164 for the selected country. */
export function normalizeWhatsApp(dialCode: string, raw: string): string | null {
  let input = raw.trim();
  if (!input) return null;
  if (input.startsWith('00')) input = `+${input.slice(2)}`;
  if (input.startsWith('+')) {
    const parsed = parsePhoneNumberFromString(input);
    return parsed?.isValid() ? parsed.number : null;
  }
  const countryDigits = dialCode.replace(/\D/g, '');
  let national = input.replace(/[^\d]/g, '');
  if (!national || !countryDigits) return null;
  if (national.startsWith(countryDigits) && national.length > countryDigits.length + 6) {
    national = national.slice(countryDigits.length);
  }
  return parsedNational(national, dialCode)?.number ?? null;
}

const PATH_DOCUMENT_LABEL: Record<PathId, string> = {
  repair: 'Start a repair',
  upgrade: 'Start an upgrade',
  build: 'Start a full build',
  interiors: 'Start an interior project',
};

export function followUpDocumentTitle(path: StartPath, stepId: string): string {
  const label = PATH_DOCUMENT_LABEL[path.id];
  if (stepId === 'sent') return `Request ready on WhatsApp | ${label} | BuildMyHouse`;
  const step = path.steps.find((item) => item.id === stepId);
  const question = step?.question || 'Start a project';
  return `${question} | ${label} | BuildMyHouse`;
}

const START_SITE = (process.env.EXPO_PUBLIC_WEB_URL || 'https://buildmyhouse.app').replace(/\/+$/, '');

export function startStructuredData(pathname: string): Record<string, unknown>[] | null {
  const seo = seoForPathname(pathname);
  if (!seo || seo.robots !== 'index,follow') return null;
  const path = pathname.split('?')[0].replace(/\/+$/, '') || '/';
  if (path !== '/start' && !/^\/start\/(repair|upgrade|build|interiors)$/.test(path)) return null;
  const url = `${START_SITE}${path}`;
  const crumbs: Record<string, unknown>[] = [
    { '@type': 'ListItem', position: 1, name: 'Home', item: `${START_SITE}/` },
    { '@type': 'ListItem', position: 2, name: 'Start a project', item: `${START_SITE}/start` },
  ];
  if (path !== '/start') {
    const pathId = path.split('/')[2] as PathId;
    crumbs.push({
      '@type': 'ListItem',
      position: 3,
      name: START_PATHS[pathId].title,
      item: url,
    });
  }
  return [
    {
      '@type': 'Service',
      name: seo.title,
      description: seo.description,
      url,
      provider: { '@type': 'Organization', name: 'BuildMyHouse', url: START_SITE },
      areaServed: { '@type': 'Country', name: 'Nigeria' },
    },
    { '@type': 'BreadcrumbList', itemListElement: crumbs },
  ];
}

export function seoForPathname(pathname: string): {
  title: string;
  description: string;
  canonicalPath: string;
  robots: 'index,follow' | 'noindex,follow';
} | null {
  const path = pathname.split('?')[0].replace(/\/+$/, '') || '/';
  if (path === '/start') {
    return {
      title: HUB.seoTitle,
      description: HUB.seoDescription,
      canonicalPath: '/start',
      robots: 'index,follow',
    };
  }
  const match = path.match(/^\/start\/(repair|upgrade|build|interiors)(\/([^/]+))?$/);
  if (!match) return null;
  const pathId = match[1] as PathId;
  const stepId = match[3];
  const startPath = START_PATHS[pathId];
  if (!stepId) {
    return {
      title: startPath.seoTitle,
      description: startPath.seoDescription,
      canonicalPath: `/start/${pathId}`,
      robots: 'index,follow',
    };
  }
  return {
    title: followUpDocumentTitle(startPath, stepId),
    description: startPath.seoDescription,
    canonicalPath: `/start/${pathId}/${stepId}`,
    robots: 'noindex,follow',
  };
}
