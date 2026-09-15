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

export type AdminWaitlist = {
  id: string;
  key: string;
  name: string;
  purpose: WaitlistPurpose | string;
  description: string | null;
  pagePath: string | null;
  isActive: boolean;
  signupCount: number;
  createdAt: string;
};

export type WaitlistSignup = {
  id: string;
  productKey: string;
  email: string;
  fullName: string | null;
  sourcePath: string | null;
  createdAt: string;
  waitlistName: string;
  purpose: string;
  pagePath: string | null;
};

export type WaitlistPerson = {
  email: string;
  fullName: string | null;
  joinedAt: string;
  purposes: {
    waitlistName: string;
    purpose: string;
    productKey: string;
    pagePath: string | null;
    createdAt: string;
  }[];
};

export function purposeLabel(purpose: string) {
  return WAITLIST_PURPOSE_LABELS[purpose as WaitlistPurpose] || purpose;
}

export function formatWaitlistDate(value: string) {
  return new Date(value).toLocaleString('en-NG', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}
