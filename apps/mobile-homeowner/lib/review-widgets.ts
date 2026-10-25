/** Public Trustindex widget. The id is the part after loader.js? in the embed code. */
export const TRUSTINDEX_WIDGET_ID = '17e626a84365332f60662d4eea6';

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
