/** Same public Trustindex widget as the homeowner site, unless a contractor widget id is set. */
export const TRUSTINDEX_WIDGET_ID = '17e626a84365332f60662d4eea6';

/** Public review widget ids. Invalid values are treated as unset so nothing is injected. */
export function readReviewWidgetId(value?: string | null): string | null {
  const id = String(value || '').trim();
  return /^[A-Za-z0-9]+$/.test(id) ? id : null;
}

export function contractorTrustindexId(): string | null {
  return (
    readReviewWidgetId(process.env.EXPO_PUBLIC_TRUSTINDEX_GC_WIDGET_ID) ||
    readReviewWidgetId(process.env.EXPO_PUBLIC_TRUSTINDEX_WIDGET_ID) ||
    TRUSTINDEX_WIDGET_ID
  );
}

export const TRUSTPILOT_REVIEWS_URL = 'https://www.trustpilot.com/review/buildmyhouse.app';
