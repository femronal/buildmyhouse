const ENTRY = /\/_expo\/static\/js\/web\/entry-[^"'?\s]+/;
const RELOAD_FLAG = 'bmh-web-build-reload';

function loadedEntry(): string | null {
  const scripts = Array.from(document.scripts);
  for (const script of scripts) {
    const match = (script.src || '').match(ENTRY);
    if (match) return match[0];
  }
  return null;
}

async function reloadIfBuildChanged(): Promise<void> {
  const current = loadedEntry();
  if (!current) return;
  const response = await fetch(window.location.href, {
    cache: 'no-store',
    headers: { Accept: 'text/html' },
  });
  if (!response.ok) return;
  const html = await response.text();
  const fresh = html.match(ENTRY)?.[0];
  if (!fresh || fresh === current) {
    sessionStorage.removeItem(RELOAD_FLAG);
    return;
  }
  if (sessionStorage.getItem(RELOAD_FLAG) === '1') return;
  sessionStorage.setItem(RELOAD_FLAG, '1');
  window.location.reload();
}

/** Reload an open web tab when a newly published build changes the entry script. */
export function startFreshWebBuildWatch(): () => void {
  if (typeof window === 'undefined' || typeof document === 'undefined') return () => {};

  let checking = false;
  const check = () => {
    if (checking || document.visibilityState === 'hidden') return;
    checking = true;
    reloadIfBuildChanged()
      .catch(() => undefined)
      .finally(() => {
        checking = false;
      });
  };

  document.addEventListener('visibilitychange', check);
  window.addEventListener('focus', check);
  const timer = window.setInterval(check, 60_000);
  check();
  return () => {
    document.removeEventListener('visibilitychange', check);
    window.removeEventListener('focus', check);
    window.clearInterval(timer);
  };
}
