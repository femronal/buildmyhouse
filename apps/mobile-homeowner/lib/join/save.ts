import { API_BASE_URL } from '@/lib/api';
import { trackWebEvent } from '@/lib/analytics';
import { BUILDMYHOUSE_CONTACT } from '@/lib/home-landing-content';
import { buildJoinWhatsAppText, labeledAnswers, type AnswerMap, type JoinPathId } from '@/lib/join/flow';

export const JOIN_WHATSAPP_NUMBER = BUILDMYHOUSE_CONTACT.phoneTel;

export function joinWhatsAppUrl(text: string) {
  const phone = JOIN_WHATSAPP_NUMBER.replace(/\D/g, '');
  return `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
}

export async function saveJoinRequest(input: {
  pathId: JoinPathId;
  answers: AnswerMap;
  name: string;
  whatsapp: string;
  utm: Record<string, string>;
  referrer: string;
}): Promise<{ reference: string | null; checklist: { key: string; label: string }[]; saved: boolean }> {
  const labeled = labeledAnswers(input.pathId, input.answers);
  const body = {
    path: input.pathId,
    answersJson: JSON.stringify(labeled),
    name: input.name.trim(),
    whatsapp: input.whatsapp.trim(),
    termsAcknowledged: true,
    termsVersion: '2026-09',
    source: 'join',
    referrer: input.referrer || undefined,
    utmJson: Object.keys(input.utm).length ? JSON.stringify(input.utm) : undefined,
    companyFax: '',
  };
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 2500);
  try {
    const response = await fetch(`${API_BASE_URL}/join-requests`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    if (!response.ok) return { reference: null, checklist: [], saved: false };
    const data = (await response.json()) as { reference?: string; checklist?: { key: string; label: string }[] };
    return { reference: data.reference || null, checklist: data.checklist || [], saved: true };
  } catch {
    return { reference: null, checklist: [], saved: false };
  } finally {
    clearTimeout(timer);
  }
}

export function messageForJoin(pathId: JoinPathId, answers: AnswerMap, name: string, reference?: string | null) {
  return buildJoinWhatsAppText({ pathId, answers, name, reference });
}

export function trackJoin(event: string, params: Record<string, string | number | boolean>) {
  trackWebEvent(event, params);
}
