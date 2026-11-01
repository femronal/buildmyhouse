/** Public Trustindex widget. The id is the part after loader.js? in the embed code. */
export const TRUSTINDEX_WIDGET_ID = '17e626a84365332f60662d4eea6';

/**
 * Trustindex caches widget HTML as immutable for 12 hours.
 * Bump this when a paid widget replaces a cached trial page.
 */
export const TRUSTINDEX_WIDGET_VERSION = '20261101';

export function trustindexLoaderSrc(widgetId: string): string {
  return `https://cdn.trustindex.io/loader.js?${widgetId}`;
}

export function installTrustindexContentCacheBust(version = TRUSTINDEX_WIDGET_VERSION) {
  if (typeof window === 'undefined' || typeof XMLHttpRequest === 'undefined') return;
  const marker = window as Window & { __bmhTrustindexBust?: string };
  if (marker.__bmhTrustindexBust === version) return;
  marker.__bmhTrustindexBust = version;
  const proto = XMLHttpRequest.prototype as XMLHttpRequest & { open: (...args: any[]) => void };
  const original = proto.open;
  proto.open = function (this: XMLHttpRequest, ...args: any[]) {
    const raw = String(args[1] ?? '');
    if (
      raw.includes('cdn.trustindex.io/widgets/') &&
      raw.includes('content.html') &&
      !raw.includes('bmh=')
    ) {
      args[1] = `${raw}${raw.includes('?') ? '&' : '?'}bmh=${version}`;
    }
    return original.apply(this, args);
  };
}

/** Public review widget ids. Invalid values are treated as unset so nothing is injected. */
export function readReviewWidgetId(value?: string | null): string | null {
  const id = String(value || '').trim();
  return /^[A-Za-z0-9]+$/.test(id) ? id : null;
}

export function homeownerTrustindexId(): string | null {
  return readReviewWidgetId(process.env.EXPO_PUBLIC_TRUSTINDEX_WIDGET_ID) || TRUSTINDEX_WIDGET_ID;
}

export function trustpilotBusinessUnitId(): string | null {
  return readReviewWidgetId(process.env.EXPO_PUBLIC_TRUSTPILOT_BUSINESS_UNIT_ID);
}

export const TRUSTPILOT_REVIEWS_URL = 'https://www.trustpilot.com/review/buildmyhouse.app';

/** Trustpilot's free Review Collector TrustBox template. */
export const TRUSTPILOT_REVIEW_COLLECTOR_TEMPLATE = '56278e9abfbbba0bdcd568bc';
