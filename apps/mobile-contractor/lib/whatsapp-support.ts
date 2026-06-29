import { GC_CONTACT } from '@/lib/gc-landing-content';

export const GC_WHATSAPP_URL = `https://wa.me/${GC_CONTACT.phoneTel.replace(/\D/g, '')}`;

export function buildGcWhatsAppSupportUrl(message?: string) {
  const trimmed = message?.trim();
  const text =
    trimmed ||
    "Hi BuildMyHouse, I'm a contractor and would like help getting started on the platform.";
  return `${GC_WHATSAPP_URL}?text=${encodeURIComponent(text)}`;
}
