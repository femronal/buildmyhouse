import { API_BASE_URL, api } from './api';

export type ManagedProfessionalCredential = {
  id: string;
  regulatorLabel?: string | null;
  registrationNumber?: string | null;
  verificationStatus?: string | null;
  isPrimary?: boolean;
};

export type ManagedProfessionalDocument = {
  id: string;
  documentType: string;
  label?: string | null;
  reviewStatus: string;
  rejectionReason?: string | null;
  createdAt: string;
};

export type ManagedProfessionalProfile = {
  id: string;
  slug: string;
  displayName: string;
  photoUrl?: string | null;
  logoUrl?: string | null;
  bio?: string | null;
  phone?: string | null;
  whatsapp?: string | null;
  website?: string | null;
  email?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  serviceStates: string[];
  serviceCities: string[];
  services: Array<{ id: string; label: string }>;
  credentials: ManagedProfessionalCredential[];
  documents: ManagedProfessionalDocument[];
  claimedAt?: string | null;
  verificationStatus?: string | null;
  listingStatus?: string | null;
  usedByBmh?: boolean;
};

export type ProfessionalClaimPreview = {
  displayName: string;
  slug: string;
  email?: string | null;
  expiresAt: string;
};

function claimErrorMessage(payload: any, fallback: string) {
  const raw = Array.isArray(payload?.message) ? payload.message.join(' ') : payload?.message;
  if (typeof raw === 'string' && raw.trim() && !raw.startsWith('Cannot ')) return raw;
  return fallback;
}

export async function previewProfessionalClaim(token: string): Promise<ProfessionalClaimPreview> {
  const response = await fetch(`${API_BASE_URL}/professionals/claim/${encodeURIComponent(token)}`);
  if (!response.ok) {
    let message = 'This claim link is invalid, expired, or already used.';
    try {
      message = claimErrorMessage(await response.json(), message);
    } catch {
      // ignore
    }
    throw new Error(message);
  }
  return response.json();
}

export async function acceptProfessionalClaim(token: string): Promise<ManagedProfessionalProfile> {
  return api.post(`/professionals/claim/${encodeURIComponent(token)}`, {});
}

export async function fetchManagedProfessionalProfile(): Promise<ManagedProfessionalProfile> {
  return api.get('/professionals/me');
}

export async function updateManagedProfessionalProfile(
  payload: Record<string, unknown>,
): Promise<ManagedProfessionalProfile> {
  return api.post('/professionals/me', payload);
}

export async function updateManagedProfessionalCredential(
  credentialId: string,
  registrationNumber: string,
): Promise<ManagedProfessionalProfile> {
  return api.post(`/professionals/me/credentials/${credentialId}`, { registrationNumber });
}

export async function addManagedProfessionalDocument(payload: {
  documentType: 'licence' | 'cac' | 'other';
  fileRef: string;
  label?: string;
  mimeType?: string;
  fileSizeBytes?: number;
}): Promise<ManagedProfessionalDocument> {
  return api.post('/professionals/me/documents', payload);
}
