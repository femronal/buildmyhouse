export const PROPERTY_PURCHASE_ARTICLE_PATH =
  '/articles/buying-property-lagos-from-abroad-due-diligence' as const;

export const PROPERTY_PURCHASE_CHECK_ANCHOR = 'property-purchase-safety-check';

export const PROPERTY_TYPES = [
  'Completed house',
  'Unfinished building',
  'Apartment',
  'Duplex',
  'Bungalow',
  'Multi-unit property',
  'Land with existing structure',
  'Other',
] as const;

export const HOW_FOUND_OPTIONS = [
  'Agent',
  'Developer',
  'Family/friend',
  'Property owner',
  'Online listing',
  'Other',
] as const;

export const PURCHASE_STAGES = [
  'Just considering it',
  'I have spoken with the seller/agent',
  'I am negotiating',
  'I have made an offer',
  'I have paid a reservation/deposit',
  'I am ready to pay',
  'Other',
] as const;

export const DECISION_TIMELINES = [
  'Immediately',
  'Within 7 days',
  'Within 30 days',
  '1–3 months',
  'No fixed date',
] as const;

export const PURCHASE_CONCERNS = [
  'Whether the title is genuine',
  'Whether the seller has authority to sell',
  'Survey/boundary issues',
  'Government acquisition',
  'Litigation/disputes',
  'Building approvals',
  'Unauthorized construction or extension',
  'Structural condition',
  'Roof/leakage',
  'Electrical system',
  'Plumbing',
  'Drainage',
  'Flooding',
  'Damp/water damage',
  'Hidden repair costs',
  'Cost to complete an unfinished building',
  'Whether the asking price still makes sense after defects',
  'I do not know what I should be checking',
  'Other',
] as const;

export const DOCUMENT_OPTIONS = [
  'Title document',
  'Survey plan',
  'Approved architectural drawings',
  'Structural drawings',
  'Building approval documents',
  'Photos',
  'Videos',
  'Seller/agent proposal',
  'Previous inspection report',
  'Valuation',
  'None yet',
  'Other',
] as const;

export const SERVICE_READINESS_OPTIONS = [
  'Yes',
  'Maybe, I need to understand the process first',
  'No, I only need general information',
] as const;

export const PAYMENT_READINESS_OPTIONS = [
  'Yes',
  'Possibly, depending on the proposal',
  'No, I only want free checks',
] as const;

export const DECISION_MAKER_OPTIONS = [
  'Me',
  'Me and my spouse',
  'Me and family members',
  'Business/investment partners',
  'Someone else',
] as const;

export const PRICE_CURRENCIES = ['NGN', 'USD', 'GBP', 'EUR'] as const;

export type PropertyPurchaseBrief = {
  location: string;
  propertyType: string;
  priceAmount: string;
  priceCurrency: (typeof PRICE_CURRENCIES)[number];
  priceUndisclosed: boolean;
  inNigeria: 'Yes' | 'No' | '';
  currentBase: string;
  foundVia: string;
  stage: string;
  timeline: string;
  concerns: string[];
  otherConcern: string;
  documents: string[];
  serviceReadiness: string;
  payForChecks: string;
  decisionMaker: string;
  name: string;
  email: string;
  whatsapp: string;
};

export function emptyPropertyPurchaseBrief(): PropertyPurchaseBrief {
  return {
    location: '',
    propertyType: '',
    priceAmount: '',
    priceCurrency: 'NGN',
    priceUndisclosed: false,
    inNigeria: '',
    currentBase: '',
    foundVia: '',
    stage: '',
    timeline: '',
    concerns: [],
    otherConcern: '',
    documents: [],
    serviceReadiness: '',
    payForChecks: '',
    decisionMaker: '',
    name: '',
    email: '',
    whatsapp: '',
  };
}

export function formatAskingPrice(brief: Pick<PropertyPurchaseBrief, 'priceAmount' | 'priceCurrency' | 'priceUndisclosed'>) {
  if (brief.priceUndisclosed) return 'I prefer not to say yet';
  const amount = brief.priceAmount.trim();
  if (!amount) return 'Not stated';
  return `${brief.priceCurrency} ${amount}`;
}

export function currentCountryLine(brief: Pick<PropertyPurchaseBrief, 'inNigeria' | 'currentBase'>) {
  if (brief.inNigeria === 'Yes') return 'Nigeria';
  const base = brief.currentBase.trim();
  return base || 'Abroad — location not stated';
}

function bulletList(items: string[]) {
  const cleaned = items.map((item) => item.trim()).filter(Boolean);
  if (cleaned.length === 0) return '- None selected';
  return cleaned.map((item) => `- ${item}`).join('\n');
}

export function buildIntakeNotes(brief: PropertyPurchaseBrief) {
  const hasLocation = Boolean(brief.location.trim());
  const hasDocuments = brief.documents.some((item) => item !== 'None yet');
  return [
    `Property identified: ${hasLocation ? 'Yes' : 'No'}`,
    `Documents shared in the brief: ${hasDocuments ? 'Yes' : 'None yet'}`,
    `Decision timeline: ${brief.timeline || 'Not stated'}`,
    `Purchase stage: ${brief.stage || 'Not stated'}`,
    `Willing to pay for professional checks: ${brief.payForChecks || 'Not stated'}`,
    `Decision maker: ${brief.decisionMaker || 'Not stated'}`,
    `Buyer in Nigeria now: ${brief.inNigeria || 'Not stated'}`,
    `Asked BuildMyHouse to coordinate checks: ${brief.serviceReadiness || 'Not stated'}`,
  ].join('\n');
}

export function buildPropertyPurchaseWhatsAppMessage(brief: PropertyPurchaseBrief) {
  const concerns = [...brief.concerns];
  const extra = brief.otherConcern.trim();
  const concernBlock = [bulletList(concerns), extra ? `Also: ${extra}` : ''].filter(Boolean).join('\n');

  return [
    'Hello BuildMyHouse,',
    '',
    'I am considering purchasing a property in Lagos and would like a proposal for property verification and inspection.',
    '',
    'PROPERTY',
    `Location: ${brief.location.trim() || 'Not stated'}`,
    `Property type: ${brief.propertyType || 'Not stated'}`,
    `Asking price: ${formatAskingPrice(brief)}`,
    `Current country: ${currentCountryLine(brief)}`,
    `Found through: ${brief.foundVia || 'Not stated'}`,
    '',
    'PURCHASE STAGE',
    `Stage: ${brief.stage || 'Not stated'}`,
    `Decision timeline: ${brief.timeline || 'Not stated'}`,
    '',
    'MY MAIN CONCERNS',
    concernBlock,
    '',
    'DOCUMENTS I HAVE',
    bulletList(brief.documents),
    '',
    'SERVICE READINESS',
    `Looking for coordinated verification before purchase: ${brief.serviceReadiness || 'Not stated'}`,
    `Prepared to pay for required professional work: ${brief.payForChecks || 'Not stated'}`,
    '',
    'DECISION MAKER',
    brief.decisionMaker || 'Not stated',
    '',
    'NAME',
    brief.name.trim() || 'Not stated',
    `Email: ${brief.email.trim() || 'Not stated'}`,
    `WhatsApp: ${brief.whatsapp.trim() || 'Not stated'}`,
    '',
    'Please review this information and let me know what checks you recommend before I proceed.',
    '',
    'INTAKE NOTES',
    buildIntakeNotes(brief),
  ].join('\n');
}

export const DIRECT_PROPERTY_PURCHASE_WHATSAPP_MESSAGE =
  'Hello BuildMyHouse. I am considering buying a property in Lagos and would like someone to guide me through what should be checked before I proceed.';
