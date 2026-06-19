import { Platform } from 'react-native';

declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
    rdt?: (...args: any[]) => void;
  }
}

export function trackWebEvent(eventName: string, params?: Record<string, any>) {
  if (Platform.OS !== 'web') return;
  if (typeof window === 'undefined' || typeof window.gtag !== 'function') return;
  window.gtag('event', eventName, params || {});
}

export function injectRedditPixel(pixelId?: string) {
  if (typeof document === 'undefined' || !pixelId) return;

  const existing = document.getElementById('reddit-pixel-loader');
  if (existing) return;

  const inline = document.createElement('script');
  inline.id = 'reddit-pixel-loader';
  inline.text = [
    '!function(w,d){if(!w.rdt){var p=w.rdt=function(){p.sendEvent?p.sendEvent.apply(p,arguments):p.callQueue.push(arguments)};p.callQueue=[];var t=d.createElement("script");t.src="https://www.redditstatic.com/ads/pixel.js",t.async=!0;var s=d.getElementsByTagName("script")[0];s.parentNode.insertBefore(t,s)}}(window,document);',
    `rdt('init','${pixelId}');`,
    "rdt('track', 'PageVisit');",
  ].join('\n');
  document.head.appendChild(inline);
}

/** Reddit conversion: homeowner submitted a project request to a GC. */
export function trackRedditProjectRequestSubmitted(
  projectId: string,
  params?: Record<string, string | number | boolean>,
) {
  if (Platform.OS !== 'web') return;
  if (typeof window === 'undefined' || typeof window.rdt !== 'function') return;
  if (!projectId) return;

  window.rdt('track', 'Lead', {
    conversionId: projectId,
    ...params,
  });
}

