import { createElement, useCallback, useEffect, useState } from 'react';
import { Platform, View } from 'react-native';
import {
  TRUSTPILOT_REVIEW_COLLECTOR_TEMPLATE,
  TRUSTPILOT_REVIEWS_URL,
  trustpilotBusinessUnitId,
} from '@/lib/review-widgets';

export default function TrustpilotCollector() {
  const businessUnitId = trustpilotBusinessUnitId();
  const [container, setContainer] = useState<HTMLDivElement | null>(null);
  const setContainerNode = useCallback((node: HTMLDivElement | null) => {
    setContainer((current) => (current === node ? current : node));
  }, []);

  useEffect(() => {
    if (Platform.OS !== 'web' || !businessUnitId || !container) return;
    if (container.querySelector('script[data-bmh-trustpilot="1"]')) return;

    const widget = document.createElement('div');
    widget.className = 'trustpilot-widget';
    widget.setAttribute('data-locale', 'en-US');
    widget.setAttribute('data-template-id', TRUSTPILOT_REVIEW_COLLECTOR_TEMPLATE);
    widget.setAttribute('data-businessunit-id', businessUnitId);
    widget.setAttribute('data-style-height', '52px');
    widget.setAttribute('data-style-width', '100%');

    const link = document.createElement('a');
    link.href = TRUSTPILOT_REVIEWS_URL;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.textContent = 'Trustpilot';
    widget.appendChild(link);
    container.appendChild(widget);

    const script = document.createElement('script');
    script.async = true;
    script.src = 'https://widget.trustpilot.com/bootstrap/v5/tp.widget.bootstrap.min.js';
    script.setAttribute('data-bmh-trustpilot', '1');
    container.appendChild(script);

    return () => {
      container.replaceChildren();
    };
  }, [businessUnitId, container]);

  if (Platform.OS !== 'web' || !businessUnitId) return null;

  return (
    <View style={{ minHeight: 52, width: '100%', maxWidth: 280 }}>
      {createElement('div', { ref: setContainerNode })}
    </View>
  );
}
