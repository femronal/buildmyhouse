import type { Router } from 'expo-router';
import type { HomeownerUserLike } from '@/lib/onboarding';

const POST_AUTH_RETURN_PATH_KEY = 'bmh_post_auth_return_path';

async function getStorage() {
  const AsyncStorage = require('@react-native-async-storage/async-storage').default;
  return AsyncStorage;
}

/** Only same-origin app paths. Reject protocol-relative and absolute URLs. */
export function normalizePostAuthReturnPath(path?: string | null): string | null {
  if (!path) return null;
  const trimmed = String(path).trim();
  if (!trimmed.startsWith('/')) return null;
  if (trimmed.startsWith('//')) return null;
  if (trimmed.includes('://')) return null;
  if (trimmed.includes('\\')) return null;
  return trimmed;
}

export async function setPostAuthReturnPath(path: string) {
  const normalized = normalizePostAuthReturnPath(path);
  if (!normalized) return;
  const storage = await getStorage();
  await storage.setItem(POST_AUTH_RETURN_PATH_KEY, normalized);
}

export async function getPostAuthReturnPath(): Promise<string | null> {
  const storage = await getStorage();
  const value = await storage.getItem(POST_AUTH_RETURN_PATH_KEY);
  return normalizePostAuthReturnPath(value);
}

export async function clearPostAuthReturnPath() {
  const storage = await getStorage();
  await storage.removeItem(POST_AUTH_RETURN_PATH_KEY);
}

export async function navigateAfterAuth(router: Router, _user: HomeownerUserLike) {
  const returnPath = await getPostAuthReturnPath();
  await clearPostAuthReturnPath();

  if (returnPath) {
    router.replace(returnPath as any);
    return;
  }

  router.replace('/(tabs)/home');
}

export async function navigateAfterOnboarding(router: Router) {
  const returnPath = await getPostAuthReturnPath();
  await clearPostAuthReturnPath();

  if (returnPath) {
    router.replace(returnPath as any);
    return;
  }

  router.replace('/(tabs)/home');
}
