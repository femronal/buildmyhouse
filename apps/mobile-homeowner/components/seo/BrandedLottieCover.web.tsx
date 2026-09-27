import { useEffect, useRef, useState } from 'react';
import { View } from 'react-native';

type LottieHandle = { destroy: () => void };
type LottiePlayer = {
  loadAnimation: (options: {
    container: HTMLElement;
    renderer: 'svg';
    loop: boolean;
    autoplay: boolean;
    animationData: unknown;
    rendererSettings?: { preserveAspectRatio: string };
  }) => LottieHandle;
};

declare global {
  interface Window {
    lottie?: LottiePlayer;
  }
}

let playerPromise: Promise<LottiePlayer> | null = null;
const jsonCache = new Map<string, Promise<unknown>>();

function loadPlayer() {
  if (window.lottie) return Promise.resolve(window.lottie);
  if (!playerPromise) {
    playerPromise = new Promise((resolve, reject) => {
      const existing = document.querySelector('script[data-bmh-lottie="1"]');
      if (existing) {
        existing.addEventListener('load', () => (window.lottie ? resolve(window.lottie) : reject(new Error('lottie'))));
        existing.addEventListener('error', () => reject(new Error('lottie')));
        return;
      }
      const script = document.createElement('script');
      script.src = '/vendor/lottie_light.min.js';
      script.async = true;
      script.dataset.bmhLottie = '1';
      script.onload = () => (window.lottie ? resolve(window.lottie) : reject(new Error('lottie')));
      script.onerror = () => {
        playerPromise = null;
        reject(new Error('lottie'));
      };
      document.head.appendChild(script);
    });
  }
  return playerPromise;
}

function loadJson(url: string) {
  const cached = jsonCache.get(url);
  if (cached) return cached;
  const pending = fetch(url, { priority: 'low' } as RequestInit).then((response) => {
    if (!response.ok) throw new Error('lottie json');
    return response.json();
  });
  jsonCache.set(url, pending);
  pending.catch(() => jsonCache.delete(url));
  return pending;
}

function shouldSkipAnimation() {
  const connection = (navigator as Navigator & {
    connection?: { saveData?: boolean; effectiveType?: string };
  }).connection;
  if (!connection) return false;
  if (connection.saveData) return true;
  return connection.effectiveType === 'slow-2g' || connection.effectiveType === '2g';
}

function CoverMark({ kind }: { kind: 'house' | 'schedule' }) {
  if (kind === 'schedule') {
    return (
      <svg viewBox="0 0 120 88" width="148" height="108" aria-hidden="true">
        <rect x="28" y="14" width="64" height="64" rx="6" fill="#fff" stroke="#111" strokeWidth="3" />
        <rect x="28" y="14" width="64" height="16" rx="6" fill="#111" />
        <rect x="28" y="24" width="64" height="6" fill="#111" />
        <rect x="40" y="42" width="40" height="4" rx="2" fill="#E5E5E5" />
        <rect x="40" y="52" width="28" height="4" rx="2" fill="#E5E5E5" />
        <rect x="40" y="62" width="18" height="6" rx="2" fill="#16A34A" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 120 88" width="148" height="108" aria-hidden="true">
      <path d="M18 42 L60 14 L102 42" fill="none" stroke="#111" strokeWidth="3" />
      <rect x="30" y="40" width="60" height="36" fill="#fff" stroke="#111" strokeWidth="3" />
      <rect x="52" y="54" width="16" height="22" fill="#16A34A" />
    </svg>
  );
}

export default function BrandedLottieCover({
  className = 'mb-4',
  height = 220,
  animationUrl,
  label,
  placeholder = 'house',
}: {
  className?: string;
  height?: number;
  animationUrl: string;
  label: string;
  placeholder?: 'house' | 'schedule';
}) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    const media = window.matchMedia?.('(prefers-reduced-motion: reduce)');
    if (media?.matches || shouldSkipAnimation()) return;

    let cancelled = false;
    let started = false;
    let visible = false;
    let idle = false;
    let animation: LottieHandle | null = null;

    const start = () => {
      if (cancelled || started || !visible || !idle || !hostRef.current) return;
      started = true;
      Promise.all([loadPlayer(), loadJson(animationUrl)])
        .then(([player, animationData]) => {
          if (cancelled || !hostRef.current) return;
          animation = player.loadAnimation({
            container: hostRef.current,
            renderer: 'svg',
            loop: true,
            autoplay: true,
            animationData,
            rendererSettings: { preserveAspectRatio: 'xMidYMid meet' },
          });
          setReady(true);
        })
        .catch(() => {
          started = false;
        });
    };

    const observer = new IntersectionObserver(
      (entries) => {
        visible = entries.some((entry) => entry.isIntersecting);
        start();
      },
      { rootMargin: '160px' },
    );
    observer.observe(host);

    let timer = 0;
    const idleId = window.requestIdleCallback?.(
      () => {
        idle = true;
        start();
      },
      { timeout: 1800 },
    );
    if (idleId == null) {
      timer = window.setTimeout(() => {
        idle = true;
        start();
      }, 700);
    }

    return () => {
      cancelled = true;
      observer.disconnect();
      if (idleId != null) window.cancelIdleCallback?.(idleId);
      if (timer) window.clearTimeout(timer);
      animation?.destroy();
    };
  }, [animationUrl]);

  return (
    <View
      className={`w-full overflow-hidden rounded-2xl border border-black bg-white ${className}`.trim()}
      style={{ height, position: 'relative' }}
      accessibilityLabel={label}
      accessibilityRole="image"
    >
      <div ref={hostRef} style={{ width: '100%', height: '100%' }} />
      {ready ? null : (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <CoverMark kind={placeholder} />
        </div>
      )}
    </View>
  );
}
