const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL ||
  (__DEV__ ? 'http://localhost:3001/api' : 'https://api.buildmyhouse.app/api');

export type PublicProfessionalCard = {
  id: string;
  slug: string;
  displayName: string;
  professionalType: 'individual' | 'firm';
  profession: { key: string; label: string } | null;
  specialties: Array<{ key: string; label: string }>;
  services: Array<{ key: string; label: string }>;
  deliverables: Array<{ key: string; label: string }>;
  projectStages: Array<{ key: string; label: string }>;
  city: string | null;
  state: string | null;
  serviceStates: string[];
  remoteConsultation: boolean;
  siteVisits: boolean;
  canIssueSignedReport: boolean;
  yearsExperience: number | null;
  ownershipStatus: string;
  verificationStatus: string;
  usedByBmh: boolean;
  completenessScore: number;
  trust: {
    listingLabel: string;
    claimedLabel: string | null;
    credentialLabel: string | null;
    credentialDetail: string | null;
    checkedOn: string | null;
    usedByBmh: boolean;
    usedByBmhLabel: string | null;
    disclaimer: string;
  };
};

export type PublicProfessionalProfile = PublicProfessionalCard & {
  bio: string | null;
  website: string | null;
  lastUpdatedAt: string;
  contact: {
    phone: string | null;
    email: string | null;
    whatsapp: string | null;
    website: string | null;
  };
};

export type ProfessionalSearchParams = {
  q?: string;
  profession?: string;
  specialty?: string;
  service?: string;
  need?: string;
  state?: string;
  credentialChecked?: boolean;
  usedByBmh?: boolean;
  remoteConsultation?: boolean;
  siteVisits?: boolean;
  signedReport?: boolean;
  professionalType?: 'individual' | 'firm';
  sort?: 'best' | 'name';
  page?: number;
  limit?: number;
};

function toQuery(params: Record<string, string | number | boolean | undefined>) {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === '' || value === false) return;
    search.set(key, String(value));
  });
  const qs = search.toString();
  return qs ? `?${qs}` : '';
}

export async function fetchProfessionalMeta() {
  const response = await fetch(`${API_BASE_URL}/professionals/meta`);
  if (!response.ok) throw new Error('Unable to load professional filters.');
  return response.json();
}

export async function fetchPublicProfessionals(params: ProfessionalSearchParams = {}) {
  const response = await fetch(`${API_BASE_URL}/professionals${toQuery({ limit: 30, ...params })}`);
  if (!response.ok) throw new Error('Unable to load professionals right now.');
  const payload = await response.json();
  return {
    professionals: (payload.data ?? []) as PublicProfessionalCard[],
    meta: payload.meta ?? { page: 1, limit: 30, total: 0, totalPages: 1 },
    appliedNeed: payload.appliedNeed ?? null,
  };
}

export async function fetchPublicProfessional(slug: string) {
  const response = await fetch(`${API_BASE_URL}/professionals/${encodeURIComponent(slug)}`);
  if (response.status === 404) return null;
  if (!response.ok) throw new Error('Unable to load this professional.');
  return (await response.json()) as PublicProfessionalProfile;
}

export async function submitProfessionalApplication(body: Record<string, unknown>) {
  const response = await fetch(`${API_BASE_URL}/professionals/applications`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!response.ok) throw new Error('Unable to submit the application.');
  return response.json();
}

export async function submitProfessionalClaim(body: Record<string, unknown>) {
  const response = await fetch(`${API_BASE_URL}/professionals/claims`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!response.ok) throw new Error('Unable to submit the claim request.');
  return response.json();
}

export async function submitProfessionalEnquiry(body: Record<string, unknown>) {
  const response = await fetch(`${API_BASE_URL}/professionals/enquiries`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!response.ok) throw new Error('Unable to send this request.');
  return response.json();
}

export function professionalWhatsAppHref(phone: string) {
  const digits = phone.replace(/\D/g, '');
  return `https://wa.me/${digits}`;
}
