/**
 * Anonymous Price Checker session identifier + checkout snapshot.
 *
 * The UUID scopes free-tier usage and ownership of in-flight research for
 * guests. The checkout snapshot survives Paystack redirect so answers, quote
 * and payment order return with the same session.
 */

import type { QuestionsPreview } from './types';

const STORAGE_KEY = 'price_checker_session_id';
const SNAPSHOT_KEY = 'price_checker_checkout_snapshot';

function generateUuid(): string {
  const g = globalThis as { crypto?: { randomUUID?: () => string } };
  if (g.crypto?.randomUUID) return g.crypto.randomUUID();
  // RFC4122-ish fallback for older runtimes.
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

let cached: string | null = null;

async function asyncStorage() {
  return require('@react-native-async-storage/async-storage').default as {
    getItem: (k: string) => Promise<string | null>;
    setItem: (k: string, v: string) => Promise<void>;
    removeItem: (k: string) => Promise<void>;
  };
}

export async function getPriceCheckerSessionId(): Promise<string> {
  if (cached) return cached;
  const store = await asyncStorage();
  let id: string | null = await store.getItem(STORAGE_KEY);
  if (!id) {
    id = generateUuid();
    await store.setItem(STORAGE_KEY, id);
  }
  cached = id;
  return id;
}

/** Persisted across Paystack redirect — keyed conceptually to the anonymous session. */
export interface PriceCheckerCheckoutSnapshot {
  version: 1;
  sessionId: string;
  product: {
    key: string;
    kind: 'product' | 'service';
    name: string;
    category: string;
  };
  answers: Record<string, string>;
  locationKey: string;
  locationLabel: string;
  query: string;
  preview: QuestionsPreview | null;
  quoteId: string | null;
  paymentOrderId: string | null;
  guestEmail: string | null;
  savedAt: string;
}

export async function saveCheckoutSnapshot(
  snapshot: Omit<PriceCheckerCheckoutSnapshot, 'version' | 'sessionId' | 'savedAt'> & {
    sessionId?: string;
  },
): Promise<void> {
  const store = await asyncStorage();
  const sessionId = snapshot.sessionId ?? (await getPriceCheckerSessionId());
  const payload: PriceCheckerCheckoutSnapshot = {
    version: 1,
    sessionId,
    product: snapshot.product,
    answers: snapshot.answers,
    locationKey: snapshot.locationKey,
    locationLabel: snapshot.locationLabel,
    query: snapshot.query,
    preview: snapshot.preview,
    quoteId: snapshot.quoteId,
    paymentOrderId: snapshot.paymentOrderId,
    guestEmail: snapshot.guestEmail,
    savedAt: new Date().toISOString(),
  };
  await store.setItem(SNAPSHOT_KEY, JSON.stringify(payload));
}

export async function loadCheckoutSnapshot(): Promise<PriceCheckerCheckoutSnapshot | null> {
  try {
    const store = await asyncStorage();
    const raw = await store.getItem(SNAPSHOT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PriceCheckerCheckoutSnapshot;
    if (parsed?.version !== 1 || !parsed.product || !parsed.locationKey) return null;
    const sessionId = await getPriceCheckerSessionId();
    if (parsed.sessionId && parsed.sessionId !== sessionId) return null;
    return parsed;
  } catch {
    return null;
  }
}

export async function clearCheckoutSnapshot(): Promise<void> {
  try {
    const store = await asyncStorage();
    await store.removeItem(SNAPSHOT_KEY);
  } catch {
    // ignore
  }
}
