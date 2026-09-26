import { API_BASE_URL } from '@/lib/api';
import { trackWebEvent } from '@/lib/analytics';
import {
  buildWhatsAppText,
  getPath,
  labeledAnswers,
  type AnswerMap,
  type PathId,
} from '@/lib/start-project/flow';
import { BUILDMYHOUSE_CONTACT } from '@/lib/home-landing-content';

export function startWhatsAppUrl(text: string): string {
  const phone = BUILDMYHOUSE_CONTACT.phoneTel.replace(/\D/g, '');
  return `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
}

export async function saveStartRequest(input: {
  pathId: PathId;
  answers: AnswerMap;
  name: string;
  whatsapp: string;
  utm: Record<string, string>;
  referrer: string;
}): Promise<string | null> {
  const path = getPath(input.pathId);
  if (!path) return null;
  const body = {
    path: input.pathId,
    answersJson: JSON.stringify({
      ids: input.answers,
      labels: labeledAnswers(path, input.answers),
    }),
    name: input.name.trim(),
    whatsapp: input.whatsapp.trim(),
    source: input.pathId,
    referrer: input.referrer || undefined,
    utmJson: Object.keys(input.utm).length ? JSON.stringify(input.utm) : undefined,
  };

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 2500);
  try {
    const response = await fetch(`${API_BASE_URL}/start-requests`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    if (!response.ok) return null;
    const data = (await response.json()) as { reference?: string };
    return data.reference || null;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

export function messageForDraft(
  pathId: PathId,
  answers: AnswerMap,
  name: string,
  reference?: string | null,
): string {
  return buildWhatsAppText(pathId, answers, { name }, reference);
}

export function trackStart(event: string, params: Record<string, string | number | boolean>) {
  trackWebEvent(event, params);
}
