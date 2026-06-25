import { BUILDMYHOUSE_CONTACT } from '@/lib/home-landing-content';

export const BUILDMYHOUSE_WHATSAPP_URL = `https://wa.me/${BUILDMYHOUSE_CONTACT.phoneTel.replace(/\D/g, '')}`;

export function buildWhatsAppServiceRequestUrl(serviceQuery?: string) {
  const trimmed = serviceQuery?.trim();
  const message = trimmed
    ? `Hi BuildMyHouse, I'm looking for ${trimmed} service. Can you help?`
    : "Hi BuildMyHouse, I'd like help finding a service.";
  return `${BUILDMYHOUSE_WHATSAPP_URL}?text=${encodeURIComponent(message)}`;
}
