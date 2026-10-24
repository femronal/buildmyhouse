import { createElement, useCallback, useEffect, useRef, useState } from 'react';
import { Platform, View } from 'react-native';
import { readReviewWidgetId } from '@/lib/review-widgets';

export type TrustindexStatus = 'loading' | 'ready' | 'failed' | 'off';

type TrustindexReviewsProps = {
  widgetId?: string | null;
  onStatusChange?: (status: TrustindexStatus) => void;
};

const LOAD_TIMEOUT_MS = 8000;

function painted(container: HTMLElement) {
  return Boolean(container.querySelector('iframe'));
}

function rejected(container: HTMLElement) {
  return /widget not found/i.test(container.textContent || '');
}

export default function TrustindexReviews({ widgetId, onStatusChange }: TrustindexReviewsProps) {
  const id = readReviewWidgetId(widgetId);
  const [hidden, setHidden] = useState(Platform.OS !== 'web' || !id);
  const [container, setContainer] = useState<HTMLDivElement | null>(null);
  const onStatusChangeRef = useRef(onStatusChange);
  onStatusChangeRef.current = onStatusChange;
  const setContainerNode = useCallback((node: HTMLDivElement | null) => {
    setContainer((current) => (current === node ? current : node));
  }, []);

  useEffect(() => {
    if (Platform.OS !== 'web') {
      onStatusChangeRef.current?.('off');
      setHidden(true);
      return;
    }
    if (!id) {
      onStatusChangeRef.current?.('off');
      setHidden(true);
      return;
    }
    if (!container) return;
    if (container.querySelector('script[data-bmh-trustindex="1"]')) return;

    onStatusChangeRef.current?.('loading');
    setHidden(false);

    let settled = false;
    let timer = 0;
    const finish = (status: 'ready' | 'failed') => {
      if (settled) return;
      settled = true;
      window.clearTimeout(timer);
      observer.disconnect();
      onStatusChangeRef.current?.(status);
      if (status === 'failed') setHidden(true);
    };

    const observer = new MutationObserver(() => {
      if (rejected(container)) finish('failed');
      else if (painted(container)) finish('ready');
    });
    observer.observe(container, { childList: true, subtree: true });

    timer = window.setTimeout(() => {
      if (!painted(container)) finish('failed');
    }, LOAD_TIMEOUT_MS);

    const script = document.createElement('script');
    script.async = true;
    script.defer = true;
    script.src = `https://cdn.trustindex.io/loader.js?${id}`;
    script.setAttribute('data-bmh-trustindex', '1');
    script.onerror = () => finish('failed');
    script.onload = () => {
      if (rejected(container)) finish('failed');
      else if (painted(container)) finish('ready');
    };
    container.appendChild(script);

    return () => {
      settled = true;
      window.clearTimeout(timer);
      observer.disconnect();
      container.replaceChildren();
    };
  }, [id, container]);

  if (Platform.OS !== 'web' || !id || hidden) return null;

  return (
    <View style={{ width: '100%', maxWidth: 1200, alignSelf: 'center' }}>
      {createElement('div', {
        ref: setContainerNode,
        style: { width: '100%', backgroundColor: '#ffffff', borderRadius: 16, overflow: 'hidden' },
      })}
    </View>
  );
}
