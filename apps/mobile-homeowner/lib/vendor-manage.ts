import { api } from '@/lib/api';
import { API_BASE_URL } from '@/lib/api';

export type VendorClaimPreview = {
  tradingName: string;
  slug: string;
  email: string | null;
  expiresAt: string;
};

export type ManagedVendorOffering = {
  id?: string;
  familyKey?: string | null;
  categoryCode?: string | null;
  customCategoryLabel?: string | null;
  productTypes?: string[];
  brands?: string[];
  sellsRetail?: boolean;
  sellsWholesale?: boolean;
  normalUnit?: string | null;
  minimumOrderQuantity?: number | null;
  minimumOrderUnit?: string | null;
  deliveryAvailable?: boolean;
  installationAvailable?: boolean;
  acceptsQuotations?: boolean;
  pricesNegotiable?: boolean;
};

export type ManagedVendorServiceArea = {
  id?: string;
  locationKey?: string | null;
  stateKey?: string | null;
  stateLabel?: string | null;
  cityKey?: string | null;
  cityLabel?: string | null;
  coverageType?: string | null;
};

export type ManagedVendorDocument = {
  id: string;
  documentType: string;
  label: string | null;
  reviewStatus: string;
  createdAt: string;
  rejectionReason: string | null;
};

export type ManagedVendorChangeRequest = {
  id: string;
  fieldGroup: string;
  status: string;
  createdAt: string;
  proposedPayload: Record<string, unknown>;
};

export type ManagedVendorProfile = {
  id: string;
  slug: string;
  tradingName: string;
  legalName: string | null;
  description: string | null;
  listingStatus: string;
  verificationStatus: string;
  claimStatus: string;
  profileCompleteness: number;
  applicationReference: string | null;
  clarificationMessage: string | null;
  rejectionReason: string | null;
  suspensionReason: string | null;
  businessHours: string | null;
  publicPhone: string | null;
  publicWhatsApp: string | null;
  publicEmail: string | null;
  showPublicPhone: boolean;
  showPublicWhatsApp: boolean;
  showPublicEmail: boolean;
  websiteUrl: string | null;
  logoUrl: string | null;
  paymentMethodsAccepted: string[];
  pricesNegotiable: boolean;
  pickupAvailable: boolean;
  interstateDelivery: boolean;
  nationwideDelivery: boolean;
  installationAvailable: boolean;
  stateKey: string | null;
  stateLabel: string | null;
  cityLabel: string | null;
  offerings: ManagedVendorOffering[];
  serviceAreas: ManagedVendorServiceArea[];
  documents: ManagedVendorDocument[];
  changeRequests: ManagedVendorChangeRequest[];
};

export type VendorManageUpdatePayload = {
  description?: string;
  businessHours?: string;
  publicPhone?: string;
  publicWhatsApp?: string;
  publicEmail?: string;
  showPublicPhone?: boolean;
  showPublicWhatsApp?: boolean;
  showPublicEmail?: boolean;
  websiteUrl?: string;
  logoUrl?: string;
  paymentMethodsAccepted?: string[];
  pricesNegotiable?: boolean;
  pickupAvailable?: boolean;
  interstateDelivery?: boolean;
  nationwideDelivery?: boolean;
  installationAvailable?: boolean;
  offerings?: Array<{
    familyKey?: string;
    brands?: string[];
    sellsRetail?: boolean;
    sellsWholesale?: boolean;
    normalUnit?: string;
    minimumOrderQuantity?: number;
    deliveryAvailable?: boolean;
  }>;
  serviceAreas?: Array<{
    stateKey?: string;
    stateLabel?: string;
    coverageType?: string;
  }>;
};

export const VENDOR_DOCUMENT_TYPES: Array<{ value: string; label: string }> = [
  { value: 'cac_certificate', label: 'CAC certificate' },
  { value: 'government_id', label: 'Government ID' },
  { value: 'proof_of_address', label: 'Proof of address' },
  { value: 'storefront_photo', label: 'Storefront photo' },
  { value: 'warehouse_photo', label: 'Warehouse photo' },
  { value: 'price_list', label: 'Price list' },
  { value: 'tax_id', label: 'Tax ID' },
  { value: 'bank_account_proof', label: 'Bank account proof' },
  { value: 'logo', label: 'Logo' },
  { value: 'other', label: 'Other' },
];

export async function previewVendorClaim(token: string): Promise<VendorClaimPreview> {
  const response = await fetch(`${API_BASE_URL}/vendors/claim/${encodeURIComponent(token)}`);
  if (!response.ok) {
    let message = 'This claim link is invalid or has expired.';
    try {
      const err = await response.json();
      if (typeof err?.message === 'string') message = err.message;
    } catch {
      // ignore
    }
    throw new Error(message);
  }
  return response.json();
}

export async function acceptVendorClaim(token: string): Promise<ManagedVendorProfile> {
  return api.post(`/vendors/claim/${encodeURIComponent(token)}`, {});
}

export async function fetchManagedVendorProfile(): Promise<ManagedVendorProfile> {
  return api.get('/vendors/me');
}

export async function updateManagedVendorProfile(
  payload: VendorManageUpdatePayload,
): Promise<ManagedVendorProfile> {
  return api.post('/vendors/me', payload);
}

export async function submitVendorSensitiveChange(payload: {
  fieldGroup: string;
  proposedPayload: Record<string, unknown>;
}): Promise<{ id: string; status: string }> {
  return api.post('/vendors/me/change-requests', payload);
}

export async function addManagedVendorDocument(payload: {
  documentType: string;
  fileRef: string;
  label?: string;
  mimeType?: string;
  fileSizeBytes?: number;
}): Promise<ManagedVendorDocument> {
  return api.post('/vendors/me/documents', payload);
}

export function formatListingStatus(status: string): string {
  return status.replace(/_/g, ' ');
}
