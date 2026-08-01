import { BUILDMYHOUSE_CONTACT } from '@/lib/home-landing-content';

export const BUILDMYHOUSE_WHATSAPP_URL = `https://wa.me/${BUILDMYHOUSE_CONTACT.phoneTel.replace(/\D/g, '')}`;

export function buildWhatsAppServiceRequestUrl(serviceQuery?: string) {
  const trimmed = serviceQuery?.trim();
  const message = trimmed
    ? `Hi BuildMyHouse, I'm looking for ${trimmed} service. Can you help?`
    : "Hi BuildMyHouse, I'd like help finding a service.";
  return `${BUILDMYHOUSE_WHATSAPP_URL}?text=${encodeURIComponent(message)}`;
}

export interface ManualMarketCheckDetails {
  productName: string;
  brand?: string | null;
  specification?: Record<string, string | number | boolean>;
  unit?: string | null;
  location?: string | null;
  reportRef?: string | null;
}

/**
 * Prefilled WhatsApp message for the insufficient-data escalation: the user's
 * check consumed their credit, so instead of a refund they qualify for a
 * real-life agent to verify prices in the market.
 */
export function buildManualMarketCheckWhatsAppUrl(details: ManualMarketCheckDetails) {
  const lines: string[] = [
    `Hi Ayomide, I just checked the price of ${details.productName} on the BuildMyHouse Price Checker and a reliable price range could not be confirmed.`,
    'I understand this qualifies me for a real-life agent to help me check current market prices. Here is what I checked:',
    '',
    `- Product: ${details.productName}`,
  ];
  if (details.brand) lines.push(`- Brand: ${details.brand}`);
  for (const [key, value] of Object.entries(details.specification ?? {})) {
    lines.push(`- ${key}: ${String(value)}`);
  }
  if (details.unit) lines.push(`- Unit: ${details.unit}`);
  if (details.location) lines.push(`- Location: ${details.location}`);
  if (details.reportRef) {
    lines.push('', `Report ref: ${details.reportRef}`);
  }
  return `${BUILDMYHOUSE_WHATSAPP_URL}?text=${encodeURIComponent(lines.join('\n'))}`;
}
