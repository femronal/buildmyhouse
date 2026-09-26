import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useSyncExternalStore } from 'react';
import { Platform } from 'react-native';
import { DIAL_CODES, type AnswerValue, type PathId } from '@/lib/start-project/flow';

const STORAGE_KEY = 'bmh.startRequest.v1';

export type StartDraft = {
  answersByPath: Partial<Record<PathId, Record<string, AnswerValue>>>;
  name: string;
  whatsapp: string;
  dialCode: string;
  reference: string | null;
  utm: Record<string, string>;
  referrer: string;
};

const EMPTY: StartDraft = {
  answersByPath: {},
  name: '',
  whatsapp: '',
  dialCode: DIAL_CODES[0].code,
  reference: null,
  utm: {},
  referrer: '',
};

let draft: StartDraft = EMPTY;
let hydrated = false;
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function persist(next: StartDraft) {
  draft = next;
  emit();
  const raw = JSON.stringify(next);
  if (Platform.OS === 'web') {
    if (typeof localStorage !== 'undefined') localStorage.setItem(STORAGE_KEY, raw);
    return;
  }
  void AsyncStorage.setItem(STORAGE_KEY, raw);
}

function readRaw(): string | null {
  if (Platform.OS === 'web') {
    if (typeof localStorage === 'undefined') return null;
    return localStorage.getItem(STORAGE_KEY);
  }
  return null;
}

export async function hydrateStartDraft() {
  if (hydrated) return;
  try {
    const raw =
      Platform.OS === 'web' ? readRaw() : await AsyncStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<StartDraft>;
      draft = {
        ...EMPTY,
        ...parsed,
        answersByPath: parsed.answersByPath || {},
        utm: parsed.utm || {},
        dialCode: parsed.dialCode || DIAL_CODES[0].code,
      };
    }
  } catch {
    draft = EMPTY;
  }
  hydrated = true;
  emit();
}

export function captureStartAttribution() {
  if (Platform.OS !== 'web' || typeof window === 'undefined') return;
  const params = new URLSearchParams(window.location.search);
  const utm: Record<string, string> = { ...draft.utm };
  for (const key of ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term']) {
    const value = params.get(key);
    if (value && !utm[key]) utm[key] = value.slice(0, 120);
  }
  const referrer = draft.referrer || (typeof document !== 'undefined' ? document.referrer.slice(0, 300) : '');
  if (JSON.stringify(utm) === JSON.stringify(draft.utm) && referrer === draft.referrer) return;
  persist({ ...draft, utm, referrer });
}

export function answersFor(pathId: PathId): Record<string, AnswerValue> {
  return draft.answersByPath[pathId] || {};
}

export function setStartAnswer(pathId: PathId, stepId: string, value: AnswerValue) {
  persist({
    ...draft,
    reference: null,
    answersByPath: {
      ...draft.answersByPath,
      [pathId]: { ...(draft.answersByPath[pathId] || {}), [stepId]: value },
    },
  });
}

export function setStartContact(patch: Partial<Pick<StartDraft, 'name' | 'whatsapp' | 'dialCode'>>) {
  persist({ ...draft, ...patch, reference: null });
}

export function setStartReference(reference: string | null) {
  persist({ ...draft, reference });
}

export function clearStartDraft() {
  persist({ ...EMPTY, utm: draft.utm, referrer: draft.referrer });
}

export function useStartDraft() {
  const snapshot = useSyncExternalStore(subscribe, () => draft, () => EMPTY);
  const isHydrated = useSyncExternalStore(subscribe, () => hydrated, () => false);
  useEffect(() => {
    void hydrateStartDraft().then(() => captureStartAttribution());
  }, []);
  return { draft: snapshot, hydrated: isHydrated };
}
