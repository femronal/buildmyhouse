import { Platform } from 'react-native';

declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
  }
}

export function trackWebEvent(eventName: string, params?: Record<string, any>) {
  if (Platform.OS !== 'web') return;
  if (typeof window === 'undefined' || typeof window.gtag !== 'function') return;
  window.gtag('event', eventName, params || {});
}

