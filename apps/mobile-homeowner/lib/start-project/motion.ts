import { getPath } from '@/lib/start-project/flow';

export type StartMotion = 'forward' | 'back' | 'none';

/** Hub is 0. Each later question is further along, including review and the sent screen. */
export function startRouteRank(pathname: string): number {
  const parts = pathname.split('?')[0].split('/').filter(Boolean);
  if (parts[0] !== 'start' || parts.length < 2) return 0;
  const path = getPath(parts[1]);
  if (!path) return 0;
  if (parts.length < 3) return 1;
  if (parts[2] === 'sent') return path.steps.length + 2;
  const index = path.steps.findIndex((step) => step.id === parts[2]);
  return index < 0 ? 1 : index + 1;
}

let lastPath = '';
let lastRank = 0;
let lastMotion: StartMotion = 'none';

/** Idempotent for the same path, so a second render keeps the same direction. */
export function takeStartDirection(pathname: string): StartMotion {
  if (pathname === lastPath) return lastMotion;
  const next = startRouteRank(pathname);
  const motion: StartMotion = lastPath === '' ? 'none' : next >= lastRank ? 'forward' : 'back';
  lastPath = pathname;
  lastRank = next;
  lastMotion = motion;
  return motion;
}
