import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useSyncExternalStore } from 'react';
import { Platform } from 'react-native';
import { DIAL_CODES, type AnswerMap } from '@/lib/join/flow';
import { START_DRAFT_TTL_MS, draftIsExpired } from '@/lib/start-project/store';

const STORAGE_KEY = 'bmh.join.v1';
const RETRY_KEY = 'bmh.join.retry';

export type JoinChecklistItem = { key: string; label: string };

export type JoinDraft = {
  version: 1;
  savedAt?: number;
  path: string;
  answers: AnswerMap;
  name: string;
  whatsapp: string;
  dialCode: string;
  reference: string | null;
  checklist: JoinChecklistItem[];
  saveFailed: boolean;
  utm: Record<string, string>;
  referrer: string;
};

const EMPTY: JoinDraft = {
  version: 1,
  path: '',
  answers: {},
  name: '',
  whatsapp: '',
  dialCode: DIAL_CODES[0].code,
  reference: null,
  checklist: [],
  saveFailed: false,
  utm: {},
  referrer: '',
};

let draft: JoinDraft = EMPTY;
let hydrated = false;
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((listener) => listener());
}

function persist(next: Partial<JoinDraft>) {
  draft = { ...draft, ...next, version: 1, savedAt: Date.now() };
  emit();
  const raw = JSON.stringify(draft);
  if (Platform.OS === 'web') {
    if (typeof localStorage !== 'undefined') localStorage.setItem(STORAGE_KEY, raw);
    return;
  }
  void AsyncStorage.setItem(STORAGE_KEY, raw);
}

export function readJoinDraft() {
  return draft;
}

export function updateJoinDraft(next: Partial<JoinDraft>) {
  persist(next);
}

export function clearJoinPii() {
  persist({
    name: '',
    whatsapp: '',
    answers: {
      ...draft.answers,
      'trade-other': '',
      area: Array.isArray(draft.answers.area) ? draft.answers.area : '',
    },
  });
}

export function clearJoinDraft() {
  const utm = draft.utm;
  const referrer = draft.referrer;
  draft = { ...EMPTY, utm, referrer };
  emit();
  if (Platform.OS === 'web' && typeof localStorage !== 'undefined') localStorage.removeItem(STORAGE_KEY);
  else void AsyncStorage.removeItem(STORAGE_KEY);
}

export function rememberJoinRetry(url: string) {
  if (Platform.OS === 'web' && typeof sessionStorage !== 'undefined') sessionStorage.setItem(RETRY_KEY, url);
}

export function joinRetryUrl() {
  if (Platform.OS === 'web' && typeof sessionStorage !== 'undefined') return sessionStorage.getItem(RETRY_KEY);
  return null;
}

export async function hydrateJoinDraft() {
  if (hydrated) return;
  hydrated = true;
  try {
    const raw = Platform.OS === 'web'
      ? (typeof localStorage === 'undefined' ? null : localStorage.getItem(STORAGE_KEY))
      : await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw) as JoinDraft;
    if (parsed.version !== 1 || draftIsExpired(parsed.savedAt)) {
      clearJoinDraft();
      return;
    }
    draft = { ...EMPTY, ...parsed, version: 1 };
    emit();
  } catch {
    clearJoinDraft();
  }
}

export function useJoinDraft() {
  const snapshot = useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    () => draft,
    () => draft,
  );
  useEffect(() => {
    void hydrateJoinDraft();
  }, []);
  return snapshot;
}

export { START_DRAFT_TTL_MS, draftIsExpired };
