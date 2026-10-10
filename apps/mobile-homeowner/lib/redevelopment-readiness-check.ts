export const REDEVELOPMENT_ARTICLE_PATH =
  '/articles/developer-joint-venture-unfinished-building-nigeria' as const;

export const REDEVELOPMENT_CHECK_ANCHOR = 'redevelopment-readiness-check';
export const REDEVELOPMENT_CHECK_STORAGE_KEY = 'bmh-redevelopment-readiness-check';

export const CURRENT_PROPERTY_OPTIONS = [
  'Empty land',
  'Land with an old building',
  'Foundation only',
  'Building under construction',
  'Building completed but needs major redevelopment',
  'Partly occupied property with additional development potential',
  'Other',
] as const;

export const PLANNED_USE_OPTIONS = [
  'Personal/family house',
  'Bungalow',
  'Duplex',
  'Apartments/flats',
  'Multi-unit residential development',
  'Mixed-use development',
  'Commercial property',
  'I am open to changing the original plan',
  'Other',
] as const;

export const LAND_SIZE_UNITS = ['square metres', 'plots', 'hectares'] as const;

export const OCCUPANCY_OPTIONS = ['Yes', 'No', 'Partly'] as const;

export const OWNER_OPTIONS = [
  'Me only',
  'Me and my spouse',
  'Family property',
  'Inherited property',
  'Company-owned',
  'Multiple owners',
  'Other',
] as const;

export const OWNER_ALIGNMENT_OPTIONS = [
  'Yes',
  'No',
  'Not yet discussed',
  'I am the sole owner',
] as const;

export const DOCUMENT_OPTIONS = [
  'Certificate of Occupancy',
  "Governor's Consent",
  'Deed of Assignment',
  'Deed of Conveyance',
  'Survey Plan',
  'Purchase receipt/agreement',
  'Allocation document',
  'Approved building plan',
  'Architectural drawings',
  'Structural drawings',
  'Building approval/permit documents',
  'Other',
  'I am not sure',
  'I currently have none available',
] as const;

export const ENCUMBRANCE_OPTIONS = [
  'Bank loan/mortgage',
  'Court case/dispute',
  'Family dispute',
  'Existing developer agreement',
  'Tenant/occupier rights',
  'Government notice',
  'None that I know of',
  'I am not sure',
  'Other',
] as const;

export const STOP_REASONS = [
  'I ran out of money',
  'Construction became too expensive',
  'Contractor problem',
  'Family disagreement',
  'Title/document problem',
  'Approval problem',
  'I moved abroad',
  'Business/income changed',
  'Developer abandoned the project',
  'Other',
] as const;

export const UNFINISHED_DURATION_OPTIONS = [
  'Less than 1 year',
  '1–3 years',
  '3–5 years',
  '5–10 years',
  'More than 10 years',
  'Not applicable',
] as const;

export const CONSTRUCTION_STAGE_OPTIONS = [
  'Foundation',
  'Blockwork',
  'Lintel',
  'Roofing',
  'First fix / MEP',
  'Plastering',
  'Finishing',
  'Some units completed',
  'I am not sure',
  'Other',
  'Not applicable',
] as const;

export const YES_NO = ['Yes', 'No'] as const;

export const REMAINING_COST_OPTIONS = [
  'Yes',
  'I have an old estimate',
  'No',
  'The project may need to be redesigned',
] as const;

export const CAPITAL_CONTRIBUTION_OPTIONS = [
  'Yes, a significant amount',
  'Yes, a limited amount',
  'Maybe',
  'No, I need the partner to provide the development capital',
] as const;

export const INCOME_OPTIONS = [
  'Yes, rent',
  'Yes, commercial income',
  'Partly',
  'No',
  'Other',
] as const;

export const OUTCOME_OPTIONS = [
  'Keep the whole property if possible',
  'Complete my personal/family home',
  'Receive completed apartments/units',
  'Receive cash',
  'Earn long-term rental income',
  'Keep ownership but allow a developer to operate the property temporarily',
  'Redevelop the land into something more valuable',
  'Sell part and develop the rest',
  'I am open to the structure that makes the most financial sense',
  'I am not sure yet',
] as const;

export const SHARE_OPTIONS = ['Yes', 'Maybe, depending on the numbers', 'No'] as const;

export const BOT_OPTIONS = ['Yes', 'Maybe', 'No', 'I need this explained first'] as const;

export const SEPARATE_ROLES_OPTIONS = ['Yes', 'Maybe', 'No', 'I need this explained first'] as const;

export const SELL_PART_OPTIONS = ['Yes', 'Maybe', 'No', 'Not applicable'] as const;

export const HELP_OPTIONS = [
  'Tell me whether a developer partnership makes sense',
  'Verify the property/documents',
  'Inspect my unfinished building',
  'Estimate what remains to be completed',
  'Assess whether the project should be redesigned',
  'Help me understand possible development options',
  'Help package the property for credible developers/investors',
  'Help screen potential developers',
  'Manage the project if an agreement is reached',
  'I am not sure; guide me',
] as const;

export const INSPECTION_OPTIONS = ['Yes', 'Maybe, explain the process first', 'No'] as const;

export const PAYMENT_OPTIONS = [
  'Yes',
  'Possibly, depending on the proposal',
  'No, I only want free developer introductions',
] as const;

export const TIMELINE_OPTIONS = [
  'Immediately',
  'Within 30 days',
  'Within 1–3 months',
  'Within 3–6 months',
  'No fixed timeline',
] as const;

export const DECISION_MAKER_OPTIONS = [
  'Me only',
  'Me and my spouse',
  'Family members',
  'Co-owners',
  'Company directors/shareholders',
  'Trustees/estate representatives',
  'Other',
] as const;

export const ALIGNMENT_DISCUSSED_OPTIONS = [
  'Yes, everyone is aligned',
  'Some have',
  'No',
  'Not applicable',
] as const;

export const PRICE_CURRENCIES = ['NGN', 'USD', 'GBP', 'EUR'] as const;

export type RedevelopmentBrief = {
  state: string;
  city: string;
  area: string;
  address: string;
  currentProperty: string;
  plannedUse: string;
  landSize: string;
  landSizeUnit: (typeof LAND_SIZE_UNITS)[number];
  landSizeUnknown: boolean;
  occupancy: string;
  owners: string;
  ownersAligned: string;
  documents: string[];
  encumbrances: string[];
  stoppedWhen: string;
  stopReasons: string[];
  unfinishedDuration: string;
  constructionStage: string;
  hasPhotos: string;
  investedAmount: string;
  investedCurrency: (typeof PRICE_CURRENCIES)[number];
  investedUndisclosed: boolean;
  remainingCostKnown: string;
  remainingAmount: string;
  remainingCurrency: (typeof PRICE_CURRENCIES)[number];
  canContribute: string;
  income: string;
  incomeAmount: string;
  outcomes: string[];
  openToSharing: string;
  openToBot: string;
  openToSeparateRoles: string;
  openToSellingPart: string;
  helpRequested: string[];
  allowInspection: string;
  payForAssessment: string;
  timeline: string;
  decisionMakers: string;
  decisionDiscussed: string;
  name: string;
  email: string;
  whatsapp: string;
  country: string;
  heardAbout: string;
};

export function emptyRedevelopmentBrief(): RedevelopmentBrief {
  return {
    state: '',
    city: '',
    area: '',
    address: '',
    currentProperty: '',
    plannedUse: '',
    landSize: '',
    landSizeUnit: 'plots',
    landSizeUnknown: false,
    occupancy: '',
    owners: '',
    ownersAligned: '',
    documents: [],
    encumbrances: [],
    stoppedWhen: '',
    stopReasons: [],
    unfinishedDuration: '',
    constructionStage: '',
    hasPhotos: '',
    investedAmount: '',
    investedCurrency: 'NGN',
    investedUndisclosed: false,
    remainingCostKnown: '',
    remainingAmount: '',
    remainingCurrency: 'NGN',
    canContribute: '',
    income: '',
    incomeAmount: '',
    outcomes: [],
    openToSharing: '',
    openToBot: '',
    openToSeparateRoles: '',
    openToSellingPart: '',
    helpRequested: [],
    allowInspection: '',
    payForAssessment: '',
    timeline: '',
    decisionMakers: '',
    decisionDiscussed: '',
    name: '',
    email: '',
    whatsapp: '',
    country: '',
    heardAbout: '',
  };
}

export function toggleExclusive(
  current: string[],
  value: string,
  exclusive: string[],
): string[] {
  const selected = current.includes(value);
  if (selected) return current.filter((item) => item !== value);
  if (exclusive.includes(value)) return [value];
  return [...current.filter((item) => !exclusive.includes(item)), value];
}

function bulletList(items: string[]) {
  const cleaned = items.map((item) => item.trim()).filter(Boolean);
  if (cleaned.length === 0) return '- None selected';
  return cleaned.map((item) => `- ${item}`).join('\n');
}

export function formatMoney(amount: string, currency: string, hidden: boolean, emptyLabel = 'Not stated') {
  if (hidden) return "I don't know / I prefer not to say yet";
  const value = amount.trim();
  if (!value) return emptyLabel;
  return `${currency} ${value}`;
}

export function landSizeLine(brief: Pick<RedevelopmentBrief, 'landSize' | 'landSizeUnit' | 'landSizeUnknown'>) {
  if (brief.landSizeUnknown) return "I don't know";
  const size = brief.landSize.trim();
  if (!size) return 'Not stated';
  return `${size} ${brief.landSizeUnit}`;
}

export function locationLine(brief: Pick<RedevelopmentBrief, 'state' | 'city' | 'area' | 'address'>) {
  const parts = [brief.area, brief.city, brief.state].map((part) => part.trim()).filter(Boolean);
  const address = brief.address.trim();
  return [parts.join(', '), address].filter(Boolean).join(' — ') || 'Not stated';
}

export function buildRedevelopmentReviewNotes(brief: RedevelopmentBrief) {
  const notes: string[] = [];
  const hasLocation = Boolean(brief.state.trim() || brief.city.trim() || brief.area.trim());
  const hasDocuments = brief.documents.some(
    (item) => item !== 'I currently have none available' && item !== 'I am not sure',
  );
  notes.push(`Property location given: ${hasLocation ? 'Yes' : 'No'}`);
  notes.push(`Named documents available: ${hasDocuments ? 'Yes' : 'No'}`);
  notes.push(`Owners aligned: ${brief.ownersAligned || 'Not stated'}`);
  notes.push(`Recent photos or videos: ${brief.hasPhotos || 'Not stated'}`);
  notes.push(`Open to sharing completed value: ${brief.openToSharing || 'Not stated'}`);
  notes.push(`Additional capital from owner: ${brief.canContribute || 'Not stated'}`);
  notes.push(`Inspection and document review: ${brief.allowInspection || 'Not stated'}`);
  notes.push(`Prepared to pay for professional assessment: ${brief.payForAssessment || 'Not stated'}`);
  notes.push(`Decision maker: ${brief.decisionMakers || 'Not stated'}`);
  notes.push(`People who must approve have discussed it: ${brief.decisionDiscussed || 'Not stated'}`);
  if (brief.ownersAligned === 'No') notes.push('Ownership alignment is not in place.');
  if (brief.encumbrances.includes('Court case/dispute') || brief.encumbrances.includes('Family dispute')) {
    notes.push('A dispute was disclosed.');
  }
  if (
    brief.openToSharing === 'No' &&
    brief.canContribute === 'No, I need the partner to provide the development capital'
  ) {
    notes.push('Owner wants a partner to fund the work and does not want to share completed value.');
  }
  if (brief.payForAssessment.startsWith('No')) notes.push('Owner asked for free developer introductions only.');
  if (brief.allowInspection === 'No') notes.push('Owner declined inspection and document review.');
  if (brief.decisionMakers && brief.decisionMakers !== 'Me only' && brief.decisionDiscussed === 'No') {
    notes.push('The person completing this check is not the only decision maker, and the others have not discussed it.');
  }
  return notes.join('\n');
}

export function buildRedevelopmentWhatsAppMessage(brief: RedevelopmentBrief) {
  const incomeDetail = brief.incomeAmount.trim();
  return [
    'Hello BuildMyHouse,',
    '',
    'I have land/an unfinished property and would like you to review whether it may be suitable for completion, redevelopment, financing or a development partnership.',
    '',
    'PROPERTY',
    `Location: ${locationLine(brief)}`,
    `Current property: ${brief.currentProperty || 'Not stated'}`,
    `Land size: ${landSizeLine(brief)}`,
    `Original use: ${brief.plannedUse || 'Not stated'}`,
    `Current use: ${brief.occupancy || 'Not stated'}`,
    '',
    'OWNERSHIP',
    `Owner(s): ${brief.owners || 'Not stated'}`,
    `All owners aligned: ${brief.ownersAligned || 'Not stated'}`,
    'Documents available:',
    bulletList(brief.documents),
    'Known disputes/encumbrances:',
    bulletList(brief.encumbrances),
    '',
    'PROJECT',
    `Construction stage: ${brief.constructionStage || 'Not stated'}`,
    `Work stopped: ${brief.stoppedWhen.trim() || 'Not stated'}`,
    `How long it has sat unfinished: ${brief.unfinishedDuration || 'Not stated'}`,
    'Why it stopped:',
    bulletList(brief.stopReasons),
    `Recent photos/videos: ${brief.hasPhotos || 'Not stated'}`,
    '',
    'FINANCIAL POSITION',
    `Approx. amount already invested: ${formatMoney(brief.investedAmount, brief.investedCurrency, brief.investedUndisclosed)}`,
    `Estimated remaining cost: ${brief.remainingCostKnown || 'Not stated'}${
      brief.remainingCostKnown === 'Yes' || brief.remainingCostKnown === 'I have an old estimate'
        ? ` (${formatMoney(brief.remainingAmount, brief.remainingCurrency, false, 'amount not stated')})`
        : ''
    }`,
    `Can I contribute additional capital: ${brief.canContribute || 'Not stated'}`,
    `Current property income: ${brief.income || 'Not stated'}${incomeDetail ? ` (${incomeDetail})` : ''}`,
    '',
    'WHAT I WANT',
    'Preferred outcome:',
    bulletList(brief.outcomes),
    `Open to sharing completed units/value with developer: ${brief.openToSharing || 'Not stated'}`,
    `Open to Build–Operate–Transfer: ${brief.openToBot || 'Not stated'}`,
    `Open to separate investor + developer: ${brief.openToSeparateRoles || 'Not stated'}`,
    `Open to selling part of property: ${brief.openToSellingPart || 'Not stated'}`,
    '',
    'BUILDMYHOUSE SUPPORT REQUESTED',
    bulletList(brief.helpRequested),
    '',
    'PROFESSIONAL ASSESSMENT',
    `Willing to allow inspection/document review: ${brief.allowInspection || 'Not stated'}`,
    `Prepared to pay for required professional assessment: ${brief.payForAssessment || 'Not stated'}`,
    '',
    'DECISION',
    `Decision maker(s): ${brief.decisionMakers || 'Not stated'}`,
    `Discussed with them: ${brief.decisionDiscussed || 'Not stated'}`,
    `Timeline: ${brief.timeline || 'Not stated'}`,
    '',
    'CONTACT',
    `Name: ${brief.name.trim() || 'Not stated'}`,
    `Email: ${brief.email.trim() || 'Not stated'}`,
    `WhatsApp: ${brief.whatsapp.trim() || 'Not stated'}`,
    `Country: ${brief.country.trim() || 'Not stated'}`,
    ...(brief.heardAbout.trim() ? [`Heard about BuildMyHouse: ${brief.heardAbout.trim()}`] : []),
    '',
    'Please review this brief and let me know whether BuildMyHouse can prepare a proposal for the next stage.',
    '',
    'REVIEW NOTES',
    buildRedevelopmentReviewNotes(brief),
  ].join('\n');
}

export const DIRECT_REDEVELOPMENT_WHATSAPP_MESSAGE =
  'Hello BuildMyHouse. I own land/an unfinished property and I am considering bringing in a developer or funding partner, but I am not yet sure which arrangement makes sense. I would like someone to explain the next step.';

export function validateRedevelopmentStep(brief: RedevelopmentBrief, step: number): string {
  if (step === 0) {
    if (!brief.state.trim() && !brief.city.trim() && !brief.area.trim()) {
      return 'Tell us the state, city or area where the property is.';
    }
    if (!brief.currentProperty) return 'Tell us what is on the property now.';
    if (!brief.plannedUse) return 'Tell us what the property was planned for.';
    if (!brief.landSizeUnknown && !brief.landSize.trim()) {
      return "Enter an approximate land size, or choose that you don't know.";
    }
    if (!brief.occupancy) return 'Tell us whether anyone uses the property now.';
  }
  if (step === 1) {
    if (!brief.owners) return 'Tell us who owns the property.';
    if (!brief.ownersAligned) return 'Tell us whether the owners agree a partner could be considered.';
    if (brief.documents.length === 0) return 'Select the documents you have, or say you are not sure.';
    if (brief.encumbrances.length === 0) return 'Select any known claims, or say none that you know of.';
  }
  if (step === 2) {
    if (brief.stopReasons.length === 0) return 'Select why work stopped, or the closest reason.';
    if (!brief.unfinishedDuration) return 'Tell us how long the property has been sitting like this.';
    if (!brief.constructionStage) return 'Tell us the construction stage, or that it is not applicable.';
    if (!brief.hasPhotos) return 'Tell us whether you have recent photos or videos.';
  }
  if (step === 3) {
    if (!brief.investedUndisclosed && !brief.investedAmount.trim()) {
      return 'Enter an approximate amount already spent, or say you prefer not to share it yet.';
    }
    if (!brief.remainingCostKnown) return 'Tell us whether you know the remaining cost.';
    if (
      (brief.remainingCostKnown === 'Yes' || brief.remainingCostKnown === 'I have an old estimate') &&
      !brief.remainingAmount.trim()
    ) {
      return 'Enter the approximate amount still required.';
    }
    if (!brief.canContribute) return 'Tell us whether you could add more of your own money.';
    if (!brief.income) return 'Tell us whether the property earns income now.';
  }
  if (step === 4) {
    if (brief.outcomes.length === 0) return 'Select what matters most at the end.';
    if (!brief.openToSharing) return 'Tell us whether you would consider sharing the completed development.';
    if (!brief.openToBot) return 'Tell us whether a build-and-operate arrangement could be considered.';
    if (!brief.openToSeparateRoles) return 'Tell us whether a separate investor and developer could be considered.';
    if (!brief.openToSellingPart) return 'Tell us whether selling part of the property could be considered.';
  }
  if (step === 5) {
    if (brief.helpRequested.length === 0) return 'Select what you want BuildMyHouse to help with.';
    if (!brief.allowInspection) return 'Tell us whether an inspection and document review can be arranged.';
    if (!brief.payForAssessment) return 'Tell us whether you are prepared to pay for a professional assessment.';
    if (!brief.timeline) return 'Tell us how soon you want to move.';
  }
  if (step === 6) {
    if (!brief.decisionMakers) return 'Tell us who must approve an arrangement.';
    if (!brief.decisionDiscussed) return 'Tell us whether those people have discussed it.';
    if (!brief.name.trim()) return 'Enter your name.';
    if (!brief.email.trim().includes('@')) return 'Enter an email address.';
    if (brief.whatsapp.replace(/\D/g, '').length < 8) return 'Enter a WhatsApp number we can reach.';
    if (!brief.country.trim()) return 'Tell us your current country of residence.';
  }
  return '';
}
