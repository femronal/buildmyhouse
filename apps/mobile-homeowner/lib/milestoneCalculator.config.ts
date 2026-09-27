/**
 * Copy, defaults, and limits for the milestone payment calculator.
 * Components read this file instead of hard-coding user-facing text.
 */

export const ACCENT_GREEN = '#16A34A';

export type ProjectTypeId = 'new-build' | 'renovation' | 'interior';
export type CurrencyCode = 'NGN' | 'USD' | 'GBP' | 'CAD' | 'EUR';

export type StageTemplate = {
  key: string;
  name: string;
  pct: number;
  proof: string[];
};

export type CurrencyOption = {
  code: CurrencyCode;
  label: string;
  symbol: string;
  /** TODO(BMH): confirm */
  minBudget: number;
  /** TODO(BMH): confirm */
  quickAmounts: number[];
};

export const milestoneCalculatorConfig = {
  storageKey: 'bmh_milestone_payment_schedule_v2',
  legacyStorageKey: 'bmh_milestone_payment_schedule_v1',
  stageCount: { min: 3, max: 8 },
  stagePercent: { min: 1, max: 90, step: 1 },
  contingency: {
    options: [0, 5, 10, 15] as const,
    default: 10,
    otherMax: 30,
  },
  noteMax: 280,
  nameMax: 40,
  budgetDigits: 15,
  shareTextMax: 1500,
  toolUrl: 'https://buildmyhouse.app/tools/milestone-payment-schedule',
  /** TODO(BMH): confirm */
  addedStageProof: ['Photos/Videos', 'Progress update'],
  proofOptions: [
    { key: 'Photos/Videos', label: 'Photos or videos' },
    { key: 'Material list', label: 'List of materials' },
    { key: 'Stage explanation', label: 'Explanation of the work done' },
    { key: 'Progress update', label: 'Progress update' },
    { key: 'Homeowner satisfaction confirmed', label: "You're happy with the work" },
    { key: 'Receipts/Invoices', label: 'Receipts or invoices' },
    { key: 'Artisan lists', label: 'List of workers on site' },
  ],
  currencies: [
    {
      code: 'NGN',
      label: 'Naira (₦)',
      symbol: '₦',
      minBudget: 100_000,
      quickAmounts: [5_000_000, 10_000_000, 25_000_000, 50_000_000],
    },
    {
      code: 'USD',
      label: 'US dollar ($)',
      symbol: '$',
      minBudget: 500,
      quickAmounts: [10_000, 25_000, 50_000, 100_000],
    },
    {
      code: 'GBP',
      label: 'British pound (£)',
      symbol: '£',
      minBudget: 500,
      quickAmounts: [10_000, 25_000, 50_000, 100_000],
    },
    {
      code: 'CAD',
      label: 'Canadian dollar (CA$)',
      symbol: 'CA$',
      minBudget: 500,
      quickAmounts: [10_000, 25_000, 50_000, 100_000],
    },
    {
      code: 'EUR',
      label: 'Euro (€)',
      symbol: '€',
      minBudget: 500,
      quickAmounts: [10_000, 25_000, 50_000, 100_000],
    },
  ] satisfies CurrencyOption[],
  projectTypes: [
    {
      id: 'new-build' as const,
      title: 'Building a new house',
      helper: 'From the ground up.',
      resultLabel: 'New build',
      legacyLabel: 'New build',
      stages: [
        { key: 'Site Preparation & Foundation', name: 'Site preparation & foundation', pct: 30, proof: ['Photos/Videos', 'Material list', 'Stage explanation'] },
        { key: 'Framing & Structural', name: 'Framing & structure', pct: 25, proof: ['Photos/Videos', 'Progress update', 'Artisan lists'] },
        { key: 'Rough-in (MEP)', name: 'Pipes, wiring & plumbing (rough-in)', pct: 12, proof: ['Photos/Videos', 'Stage explanation', 'Receipts/Invoices'] },
        { key: 'Wall/Ceiling Preparation', name: 'Walls & ceilings preparation', pct: 12, proof: ['Photos/Videos', 'Progress update', 'Receipts/Invoices'] },
        { key: 'Interior Finishes', name: 'Interior finishes', pct: 15, proof: ['Photos/Videos', 'Material list', 'Receipts/Invoices'] },
        { key: 'Exterior & Landscaping', name: 'Outside works & landscaping', pct: 6, proof: ['Photos/Videos', 'Homeowner satisfaction confirmed', 'Receipts/Invoices'] },
      ],
    },
    {
      id: 'renovation' as const,
      title: 'Renovating or fixing up',
      helper: 'Improving a house that already exists.',
      resultLabel: 'Renovation',
      legacyLabel: 'Renovation',
      stages: [
        { key: 'Inspection & Strip-out', name: 'Inspection & strip-out', pct: 12, proof: ['Photos/Videos', 'Stage explanation', 'Material list'] },
        { key: 'Repairs & Corrections', name: 'Repairs & corrections', pct: 25, proof: ['Photos/Videos', 'Progress update', 'Receipts/Invoices'] },
        { key: 'Systems Work', name: 'Plumbing, wiring & systems', pct: 15, proof: ['Photos/Videos', 'Stage explanation', 'Artisan lists'] },
        { key: 'Surface Preparation', name: 'Surface preparation', pct: 12, proof: ['Photos/Videos', 'Progress update'] },
        { key: 'Finishes & Fittings', name: 'Finishes & fittings', pct: 28, proof: ['Photos/Videos', 'Material list', 'Receipts/Invoices'] },
        { key: 'Final Checks & Handover', name: 'Final checks & handover', pct: 8, proof: ['Photos/Videos', 'Homeowner satisfaction confirmed'] },
      ],
    },
    {
      id: 'interior' as const,
      title: 'Interior design',
      helper: 'Furnishing and finishing the inside.',
      resultLabel: 'Interior design',
      legacyLabel: 'Interior design',
      stages: [
        { key: 'Planning & Measurement', name: 'Planning & measurement', pct: 8, proof: ['Stage explanation', 'Material list'] },
        { key: 'Procurement', name: 'Buying items (procurement)', pct: 42, proof: ['Receipts/Invoices', 'Material list', 'Photos/Videos'] },
        { key: 'Preparation Works', name: 'Preparation works', pct: 12, proof: ['Photos/Videos', 'Progress update'] },
        { key: 'Installation', name: 'Installation', pct: 30, proof: ['Photos/Videos', 'Artisan lists', 'Progress update'] },
        { key: 'Styling & Finishing', name: 'Styling & finishing', pct: 8, proof: ['Photos/Videos', 'Homeowner satisfaction confirmed'] },
      ],
    },
  ],
  copy: {
    startTitle: 'Plan when to pay, how much, and what to see first.',
    startSub: 'It takes about a minute. No sign-up needed.',
    startButton: 'Start my plan',
    welcomeTitle: 'Welcome back. Pick up where you left off?',
    continueButton: 'Continue',
    startOverButton: 'Start over',
    back: 'Back',
    startOverConfirm: 'Start over? Your answers on this device will be cleared.',
    startOverYes: 'Yes, start over',
    cancel: 'Cancel',
    stepOf: (current: number, total: number) => `Step ${current} of ${total}`,
    resultStep: 'Step 7 of 7 · Your plan',
    projectHeading: 'What are you working on?',
    projectHelper: 'Pick one. You can change it later.',
    resetStagesTitle: (typeLabel: string) =>
      `Changing this will reset your stages to the suggested plan for ${typeLabel}. Continue?`,
    resetStagesYes: 'Yes, reset stages',
    keepStages: 'Keep my stages',
    currencyHeading: 'Which money will you plan in?',
    currencyHelper: 'We\'ll show every amount in this currency.',
    budgetHeading: "What's your total budget?",
    budgetHelper: 'The full amount for this project, including money for surprises.',
    budgetNotConverted: 'Amounts are not converted.',
    next: 'Next',
    minBudgetError: (formatted: string) => `Please enter at least ${formatted}.`,
    contingencyHeading: 'How much should we keep aside for surprises?',
    contingencyHelper: 'For hidden problems, price changes or extra work. You only release it if you really need it.',
    none: 'None',
    other: 'Other',
    suggested: 'Suggested',
    keptAsideLine: (aside: string, stages: string) => `That's ${aside} kept aside. ${stages} goes to the stages.`,
    nothingAsideLine: (total: string) => `Nothing kept aside. The full ${total} goes to the stages.`,
    noneNote: 'Most projects meet at least one surprise.',
    splitHeading: "Here's a common way to split it.",
    splitHelper: "Tap – or + to adjust. We'll keep the total at 100%.",
    recommended: (typeLabel: string, count: number, amount: string) => `${typeLabel} · ${count} stages · ${amount}`,
    addsUp: 'Adds up to 100% ✓',
    overWarning: (total: number, extra: number) =>
      `Your stages add up to ${total}%. Take ${extra}% off somewhere, or tap Fix it for me.`,
    underWarning: (total: number, missing: number) =>
      `Your stages add up to ${total}%. Add ${missing}% somewhere, or tap Fix it for me.`,
    fixIt: 'Fix it for me',
    splitEvenly: 'Split evenly',
    resetSuggested: 'Reset to suggested',
    renameStage: 'Rename stage',
    remove: 'Remove',
    more: 'More actions',
    addStage: '+ Add a stage',
    newStageName: 'New stage',
    proofHeading: 'What should you see before each payment?',
    proofHelper: "We've ticked the usual ones. Tap a stage to change them.",
    edit: 'Edit',
    proofTip: 'Tip: ask for at least one thing before you pay.',
    addNote: '+ Add a note',
    noteLabel: 'Note for this stage (optional)',
    notePlaceholder: "Example: Don't pay until the roof is fully covered.",
    seePlan: 'See my plan',
    skipProof: 'Skip, use the suggested ones',
    backToPlan: 'Back to my plan',
    planTitle: 'Your payment plan',
    keptAsideLabel: (amount: string, pct: number) => `Kept aside for surprises: ${amount} (${pct}%)`,
    forStagesLabel: (amount: string) => `For the stages: ${amount}`,
    projectRow: 'Project',
    currencyRow: 'Currency',
    budgetRow: 'Budget',
    keptRow: 'Kept aside',
    stagesRow: 'Stages & split',
    proofRow: 'What to see before paying',
    seeBefore: 'See this before you pay:',
    paidSoFar: (amount: string) => `Paid so far: ${amount}`,
    stillInControl: (amount: string) => `Still in your control: ${amount}`,
    whyThisMatters: 'Why this matters',
    keptAsideStop: (amount: string) => `Kept aside for surprises: ${amount}`,
    keptAsideNote: 'Only release this if something unexpected really comes up.',
    readReminders: 'Read the 5 reminders',
    disclaimer: 'This is a planning tool, not a legal contract.',
    downloadPdf: 'Download PDF',
    saveImage: 'Save as image',
    shareWhatsapp: 'Share on WhatsApp',
    startTracked: 'Start a tracked project',
    preparing: 'Preparing…',
    exportFailed: "Sorry, that didn't work. Please try again.",
    decrease: (name: string) => `Decrease ${name} by 1%`,
    increase: (name: string) => `Increase ${name} by 1%`,
    keypadBackspace: 'Delete last digit',
    liveSummary: (forStages: string, count: number, aside: string) =>
      `${forStages} across ${count} stages · ${aside} kept aside`,
    pdfTitle: 'Milestone payment plan',
    pdfBrand: 'BuildMyHouse',
  },
};

export function currencyByCode(code: CurrencyCode) {
  return milestoneCalculatorConfig.currencies.find((item) => item.code === code) ?? milestoneCalculatorConfig.currencies[0];
}

export function projectById(id: ProjectTypeId) {
  return milestoneCalculatorConfig.projectTypes.find((item) => item.id === id) ?? milestoneCalculatorConfig.projectTypes[0];
}

export function proofLabel(key: string) {
  return milestoneCalculatorConfig.proofOptions.find((item) => item.key === key)?.label ?? key;
}
