export const ACCENT_GREEN = '#16A34A';

export const renovationBudgetConfig = {
  storageKey: 'bmh_renovation_budget_planner_v2',
  legacyStorageKey: 'bmh_renovation_budget_planner_v1',
  toolUrl: 'https://buildmyhouse.app/tools/renovation-budget-planner',
  startProjectHref: '/start/upgrade',
  contingency: { options: [0, 5, 10, 15], default: 10, otherMax: 30 },
  // These are the planning figures already used on the page. BMH can adjust them here.
  costs: {
    'Living room': 2_200_000,
    Kitchen: 5_500_000,
    Bathrooms: 3_800_000,
    Bedrooms: 2_000_000,
    'Roofing/Ceiling': 4_800_000,
    Electrical: 3_600_000,
    Plumbing: 3_400_000,
    'Windows/Doors': 2_600_000,
    Exterior: 3_000_000,
    'Compound/Landscaping': 2_400_000,
  },
  locationMultiplier: { Lagos: 1.18, Abuja: 1.12, 'Other Nigeria': 1 },
  sizeMultiplier: { Small: 0.85, Medium: 1, Large: 1.3 },
  finishMultiplier: { Basic: 0.85, 'Mid-range': 1, Premium: 1.35 },
  workMultiplier: { Repairs: 0.65, Upgrade: 1, 'Full redo': 1.45 },
  propertyTypes: [
    { id: 'Bungalow', title: 'Bungalow', helper: 'A single-storey house.' },
    { id: 'Duplex', title: 'Duplex', helper: 'Two floors, one home.' },
    { id: 'Flat/Apartment', title: 'Flat or apartment', helper: 'A unit in a larger building.' },
    { id: 'Family house', title: 'Family house', helper: 'A home shared by the family.' },
    { id: 'Rental property', title: 'Rental property', helper: 'A place you rent out.' },
  ],
  locations: [
    { id: 'Lagos', title: 'Lagos', helper: 'Often the highest costs.' },
    { id: 'Abuja', title: 'Abuja', helper: 'Usually higher than most states.' },
    { id: 'Other Nigeria', title: 'Somewhere else in Nigeria', helper: 'Use this for every other state.' },
  ],
  sizes: [
    { id: 'Small', title: 'Small', helper: 'A compact home.' },
    { id: 'Medium', title: 'Medium', helper: 'A typical family size.' },
    { id: 'Large', title: 'Large', helper: 'A bigger house, or more rooms.' },
  ],
  finishes: [
    { id: 'Basic', title: 'Basic', helper: 'Simple and practical.' },
    { id: 'Mid-range', title: 'Mid-range', helper: 'A solid everyday finish.', suggested: true },
    { id: 'Premium', title: 'Premium', helper: 'Higher materials and fittings.' },
  ],
  spaces: [
    { id: 'Living room', title: 'Living room', helper: 'Floors, walls, and the main sitting area.' },
    { id: 'Kitchen', title: 'Kitchen', helper: 'Usually one of the bigger costs.' },
    { id: 'Bathrooms', title: 'Bathrooms', helper: 'Tiling, fittings, and waterproofing.' },
    { id: 'Bedrooms', title: 'Bedrooms', helper: 'Floors, walls, and wardrobes.' },
    { id: 'Roofing/Ceiling', title: 'Roof and ceiling', helper: 'Leaks, sheets, and ceiling boards.' },
    { id: 'Electrical', title: 'Electrical', helper: 'Wiring, sockets, and lights.' },
    { id: 'Plumbing', title: 'Plumbing', helper: 'Pipes, tanks, and leaks.' },
    { id: 'Windows/Doors', title: 'Windows and doors', helper: 'Frames, glass, and security.' },
    { id: 'Exterior', title: 'Outside of the house', helper: 'Walls, paint, and the structure.' },
    { id: 'Compound/Landscaping', title: 'Compound', helper: 'The yard, gate, and outside space.' },
  ],
  workTypes: [
    { id: 'Repairs', title: 'Repairs', helper: 'Fix what is already bad.' },
    { id: 'Upgrade', title: 'Upgrade', helper: 'Improve what is already there.' },
    { id: 'Full redo', title: 'Full redo', helper: 'Deeper work, almost from scratch.' },
  ],
  copy: {
    startTitle: 'See a rough budget before the work starts growing.',
    startSub: 'It takes about a minute. No sign-up needed.',
    startButton: 'Start my estimate',
    welcomeTitle: 'Welcome back. Pick up where you left off?',
    continueButton: 'Continue',
    startOverButton: 'Start over',
    back: 'Back',
    next: 'Next',
    backToEstimate: 'Back to my estimate',
    seeEstimate: 'See my estimate',
    stepOf: (step: number, total: number) => `Step ${step} of ${total}`,
    resultStep: 'Step 8 of 8 · Your estimate',
    propertyHeading: 'What kind of property is it?',
    propertyHelper: 'Pick one. You can change it later.',
    locationHeading: 'Where is the property?',
    locationHelper: "We'll adjust the estimate for this place.",
    sizeHeading: 'How big is it?',
    sizeHelper: 'A rough size is enough.',
    finishHeading: 'What finish level do you want?',
    finishHelper: 'This changes materials and fittings.',
    spacesHeading: 'Which areas do you want to renovate?',
    spacesHelper: 'Pick every area you are planning. You can add or remove them later.',
    spacesEmpty: 'Pick at least one area.',
    workHeading: 'What kind of work is it in each area?',
    workHelper: 'Repairs means fixing what is bad. Upgrade means improving what is there. Full redo means starting that area almost afresh.',
    contingencyHeading: 'How much should we keep aside for surprises?',
    contingencyHelper: 'For hidden problems, price changes, or extra work. You only use it if you really need it.',
    suggested: 'Suggested',
    noneNote: 'Most renovations meet at least one surprise.',
    contingencyLive: (kept: string, work: string) => `That's ${kept} kept aside. ${work} is for the work itself.`,
    contingencyNone: (work: string) => `Nothing kept aside. The full ${work} is for the work itself.`,
    other: 'Other',
    none: 'None',
    planTitle: 'Your renovation estimate',
    keptAside: (amount: string, pct: number) => `Kept aside for surprises: ${amount} (${pct}%)`,
    forTheWork: (amount: string) => `For the work: ${amount}`,
    keptAsideStop: (amount: string) => `Kept aside for surprises: ${amount}`,
    keptAsideNote: 'Only use this if something unexpected really comes up.',
    disclaimer: 'This is a rough planning guide, not a final contractor quote.',
    highCost: 'Areas that can push the cost up',
    remindersToggle: 'Read the 5 reminders',
    downloadPdf: 'Download PDF',
    saveImage: 'Save as image',
    shareWhatsapp: 'Share on WhatsApp',
    preparing: 'Preparing…',
    exportFailed: "Sorry, that didn't work. Please try again.",
    startProject: 'Start your renovation project',
    edit: 'Edit',
    liveSummary: (total: string, kept: string) => `${total} in total · ${kept} kept aside`,
    startOverConfirm: 'Start over? Your answers on this device will be cleared.',
    startOverYes: 'Yes, start over',
    cancel: 'Cancel',
  },
};

export type PropertyTypeId = (typeof renovationBudgetConfig.propertyTypes)[number]['id'];
export type LocationId = (typeof renovationBudgetConfig.locations)[number]['id'];
export type SizeId = (typeof renovationBudgetConfig.sizes)[number]['id'];
export type FinishId = (typeof renovationBudgetConfig.finishes)[number]['id'];
export type SpaceId = (typeof renovationBudgetConfig.spaces)[number]['id'];
export type WorkTypeId = (typeof renovationBudgetConfig.workTypes)[number]['id'];

const propertyIds = new Set(renovationBudgetConfig.propertyTypes.map((item) => item.id));
const locationIds = new Set(renovationBudgetConfig.locations.map((item) => item.id));
const sizeIds = new Set(renovationBudgetConfig.sizes.map((item) => item.id));
const finishIds = new Set(renovationBudgetConfig.finishes.map((item) => item.id));
const spaceIds = new Set(renovationBudgetConfig.spaces.map((item) => item.id));
const workIds = new Set(renovationBudgetConfig.workTypes.map((item) => item.id));

export function isPropertyType(value: unknown): value is PropertyTypeId {
  return typeof value === 'string' && propertyIds.has(value as PropertyTypeId);
}
export function isLocation(value: unknown): value is LocationId {
  return typeof value === 'string' && locationIds.has(value as LocationId);
}
export function isSize(value: unknown): value is SizeId {
  return typeof value === 'string' && sizeIds.has(value as SizeId);
}
export function isFinish(value: unknown): value is FinishId {
  return typeof value === 'string' && finishIds.has(value as FinishId);
}
export function isSpace(value: unknown): value is SpaceId {
  return typeof value === 'string' && spaceIds.has(value as SpaceId);
}
export function isWorkType(value: unknown): value is WorkTypeId {
  return typeof value === 'string' && workIds.has(value as WorkTypeId);
}
