const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL ||
  (__DEV__ ? 'http://localhost:3001/api' : 'https://api.buildmyhouse.app/api');

export type ArtisanCard = {
  id: string;
  slug: string;
  displayName: string;
  businessName?: string | null;
  trade: { key: string; label: string } | null;
  city: string | null;
  state: string | null;
  services: string[];
  problems: string[];
  trustScore: number;
  trustExplanation: string;
  claimStatus: string;
  verificationStatus: string;
  usedByBmh: boolean;
  logoUrl: string | null;
  hasWorkshopPhoto: boolean;
};

export type ArtisanProblem = {
  key: string;
  label: string;
  tradeKey: string;
  tradeLabel: string;
  professionalNote?: string | null;
  professionalHref?: string | null;
};

export async function fetchArtisans(params: Record<string, string | number | boolean | undefined>) {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === '' || value === false) return;
    search.set(key, String(value));
  });
  const response = await fetch(`${API_BASE_URL}/artisans?${search.toString()}`);
  if (!response.ok) throw new Error('Unable to load artisans.');
  return response.json() as Promise<{ data: ArtisanCard[]; total: number; page: number }>;
}

export async function fetchArtisanMeta() {
  const response = await fetch(`${API_BASE_URL}/artisans/meta`);
  if (!response.ok) throw new Error('Unable to load artisan filters.');
  return response.json() as Promise<{
    trades: Array<{ key: string; label: string; listingCount?: number }>;
    problems: ArtisanProblem[];
    trustExplanation: string;
  }>;
}

export async function fetchArtisan(slug: string) {
  const response = await fetch(`${API_BASE_URL}/artisans/${encodeURIComponent(slug)}`);
  if (response.status === 404) return null;
  if (!response.ok) throw new Error('Unable to load this artisan.');
  return response.json();
}

export const GC_CLAIM_ORIGIN = 'https://gc.buildmyhouse.app';
