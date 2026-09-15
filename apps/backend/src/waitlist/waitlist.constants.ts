export const WAITLIST_PURPOSES = [
  'tool',
  'webinar',
  'podcast',
  'book',
  'meeting',
  'other',
] as const;

export type WaitlistPurpose = (typeof WAITLIST_PURPOSES)[number];

export const WAITLIST_PURPOSE_LABELS: Record<WaitlistPurpose, string> = {
  tool: 'Tool',
  webinar: 'Webinar',
  podcast: 'Podcast',
  book: 'Book',
  meeting: 'In-person meeting',
  other: 'Other',
};

export function slugifyWaitlistKey(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}
