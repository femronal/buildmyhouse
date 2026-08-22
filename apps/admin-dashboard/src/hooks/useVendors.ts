'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

export type VendorListingStatus =
  | 'draft'
  | 'submitted'
  | 'under_review'
  | 'clarification_required'
  | 'listed'
  | 'rejected'
  | 'suspended'
  | 'internal_only';

export type VendorVerificationStatus =
  | 'unverified'
  | 'partial'
  | 'verified'
  | 'expired'
  | 'revoked';

export type VendorListItem = {
  id: string;
  slug: string;
  tradingName: string;
  legalName?: string | null;
  listingStatus: VendorListingStatus;
  verificationStatus: VendorVerificationStatus;
  claimStatus: string;
  acquisitionSource: string;
  publicPhone?: string | null;
  publicWhatsApp?: string | null;
  publicEmail?: string | null;
  stateLabel?: string | null;
  cityLabel?: string | null;
  stateKey?: string | null;
  profileCompleteness: number;
  procurementRelationship: string;
  previouslyUsedByBmh: boolean;
  applicationReference?: string | null;
  createdAt: string;
  updatedAt: string;
  offerings?: Array<{
    familyKey?: string | null;
    brands: string[];
    sellsRetail: boolean;
    sellsWholesale: boolean;
    deliveryAvailable?: boolean;
    customCategoryLabel?: string | null;
  }>;
  representatives?: Array<{ name: string; role?: string | null; phone?: string | null }>;
  _count?: { documents: number; quoteRequests: number };
};

export type VendorDetail = VendorListItem & {
  description?: string | null;
  logoUrl?: string | null;
  yearEstablished?: number | null;
  businessTypes: string[];
  clarificationMessage?: string | null;
  rejectionReason?: string | null;
  suspensionReason?: string | null;
  privateBusinessAddress?: string | null;
  publicAddress?: string | null;
  cacNumber?: string | null;
  cacRegistrationStatus?: string | null;
  taxIdentificationNumber?: string | null;
  bankAccountName?: string | null;
  websiteUrl?: string | null;
  quotationEmail?: string | null;
  salesContactName?: string | null;
  procurementContactName?: string | null;
  businessHours?: string | null;
  nationwideDelivery?: boolean;
  interstateDelivery?: boolean;
  pickupAvailable?: boolean;
  installationAvailable?: boolean;
  acceptsProjectQuotations?: boolean;
  acceptsBulkOrders?: boolean;
  paymentMethodsAccepted?: string[];
  pricesNegotiable?: boolean;
  priceListAvailable?: boolean;
  typicalQuoteResponseHours?: number | null;
  verifiedAt?: string | null;
  approvedAt?: string | null;
  listedAt?: string | null;
  submittedAt?: string | null;
  serviceAreas?: Array<{
    stateKey?: string | null;
    stateLabel?: string | null;
    cityLabel?: string | null;
    coverageType: string;
  }>;
  documents?: Array<{
    id: string;
    documentType: string;
    label?: string | null;
    fileRef: string;
    reviewStatus: string;
    createdAt: string;
  }>;
  verificationChecks?: Array<{
    id: string;
    checkKey: string;
    status: string;
    notes?: string | null;
    failureReason?: string | null;
    reviewedAt?: string | null;
  }>;
  adminNotes?: Array<{
    id: string;
    body: string;
    createdAt: string;
    authorAdminId?: string | null;
  }>;
  activities?: Array<{
    id: string;
    type: string;
    summary?: string | null;
    note?: string | null;
    createdAt: string;
  }>;
  quoteRequests?: Array<{
    id: string;
    product: string;
    buyerName: string;
    status: string;
    createdAt: string;
  }>;
  changeRequests?: Array<{
    id: string;
    fieldGroup: string;
    status: string;
    createdAt: string;
  }>;
};

export type VendorSearchParams = {
  query?: string;
  listingStatus?: VendorListingStatus | '';
  verificationStatus?: VendorVerificationStatus | '';
  procurementRelationship?: string;
  stateKey?: string;
  familyKey?: string;
  brand?: string;
  wholesale?: boolean;
  previouslyUsed?: boolean;
  page?: number;
  limit?: number;
};

function toQuery(params: VendorSearchParams): string {
  const sp = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return;
    sp.set(key, String(value));
  });
  const q = sp.toString();
  return q ? `?${q}` : '';
}

export function useVendors(params: VendorSearchParams = {}) {
  return useQuery({
    queryKey: ['admin-vendors', params],
    queryFn: () =>
      api.get<{ data: VendorListItem[]; meta: { total: number; page: number; limit: number; totalPages: number } }>(
        `/admin/vendors${toQuery(params)}`,
      ),
  });
}

export function useVendor(id: string | null) {
  return useQuery({
    queryKey: ['admin-vendor', id],
    enabled: !!id,
    queryFn: () => api.get<VendorDetail>(`/admin/vendors/${id}`),
  });
}

export function useCreateVendor() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: Record<string, unknown>) =>
      api.post<VendorDetail & { possibleDuplicates?: VendorListItem[] }>('/admin/vendors', body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-vendors'] });
    },
  });
}

export function useUpdateVendor(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: Record<string, unknown>) => api.patch<VendorDetail>(`/admin/vendors/${id}`, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-vendors'] });
      qc.invalidateQueries({ queryKey: ['admin-vendor', id] });
    },
  });
}

export function useVendorAction(id: string) {
  const qc = useQueryClient();
  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['admin-vendors'] });
    qc.invalidateQueries({ queryKey: ['admin-vendor', id] });
  };

  return {
    underReview: useMutation({
      mutationFn: () => api.post(`/admin/vendors/${id}/under-review`, {}),
      onSuccess: invalidate,
    }),
    requestClarification: useMutation({
      mutationFn: (body: { clarificationMessage: string }) =>
        api.post(`/admin/vendors/${id}/request-clarification`, body),
      onSuccess: invalidate,
    }),
    approveListing: useMutation({
      mutationFn: (body: { note?: string } = {}) =>
        api.post(`/admin/vendors/${id}/approve-listing`, body),
      onSuccess: invalidate,
    }),
    reject: useMutation({
      mutationFn: (body: { reason: string }) => api.post(`/admin/vendors/${id}/reject`, body),
      onSuccess: invalidate,
    }),
    suspend: useMutation({
      mutationFn: (body: { reason: string }) => api.post(`/admin/vendors/${id}/suspend`, body),
      onSuccess: invalidate,
    }),
    restore: useMutation({
      mutationFn: (body: { note?: string } = {}) => api.post(`/admin/vendors/${id}/restore`, body),
      onSuccess: invalidate,
    }),
    upsertChecks: useMutation({
      mutationFn: (body: {
        checks: Array<{ checkKey: string; status: string; notes?: string }>;
        markVerifiedIfReady?: boolean;
      }) => api.post(`/admin/vendors/${id}/verification-checks`, body),
      onSuccess: invalidate,
    }),
    addNote: useMutation({
      mutationFn: (body: { body: string }) => api.post(`/admin/vendors/${id}/notes`, body),
      onSuccess: invalidate,
    }),
    addActivity: useMutation({
      mutationFn: (body: { type: string; summary?: string; note?: string; projectId?: string }) =>
        api.post(`/admin/vendors/${id}/activities`, body),
      onSuccess: invalidate,
    }),
    claimInvite: useMutation({
      mutationFn: (body: { email?: string; phone?: string; expiresInDays?: number }) =>
        api.post<{ claimUrl: string; email: string; expiresAt: string }>(
          `/admin/vendors/${id}/claim-invite`,
          body,
        ),
      onSuccess: invalidate,
    }),
  };
}

export const LISTING_STATUS_LABELS: Record<VendorListingStatus, string> = {
  draft: 'Draft',
  submitted: 'Submitted',
  under_review: 'Under review',
  clarification_required: 'Needs clarification',
  listed: 'Listed',
  rejected: 'Rejected',
  suspended: 'Suspended',
  internal_only: 'Internal only',
};

export const VERIFICATION_STATUS_LABELS: Record<VendorVerificationStatus, string> = {
  unverified: 'Unverified',
  partial: 'Partial',
  verified: 'BMH Verified',
  expired: 'Expired',
  revoked: 'Revoked',
};

export const VERIFICATION_CHECK_OPTIONS = [
  { key: 'business_identity', label: 'Business identity' },
  { key: 'business_registration', label: 'Registration (CAC)' },
  { key: 'representative_identity', label: 'Representative identity' },
  { key: 'phone', label: 'Phone verified' },
  { key: 'location_evidence', label: 'Location evidence' },
  { key: 'product_categories', label: 'Product categories reviewed' },
  { key: 'supporting_evidence', label: 'Supporting evidence' },
] as const;

export const FAMILY_OPTIONS = [
  'cement',
  'reinforcement-steel',
  'concrete-blocks',
  'sand',
  'granite-aggregates',
  'roofing',
  'waterproofing',
  'doors',
  'aluminium-windows',
  'tiles',
  'paint',
  'pop-ceilings',
  'plumbing-pipes',
  'water-pumps',
  'water-tanks',
  'electrical-cables',
  'solar-panels',
  'inverters',
  'batteries',
  'generators',
  'cctv-security',
] as const;
