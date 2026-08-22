const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL ||
  (__DEV__ ? 'http://localhost:3001/api' : 'https://api.buildmyhouse.app/api');

export type PublicVendorCard = {
  id: string;
  slug: string;
  tradingName: string;
  logoUrl: string | null;
  description: string | null;
  verificationStatus: string;
  isBuildMyHouseVerified: boolean;
  businessTypes: string[];
  categories: string[];
  brands: string[];
  stateLabel: string | null;
  cityLabel: string | null;
  sellsRetail: boolean;
  sellsWholesale: boolean;
  deliveryAvailable: boolean | null;
  yearsInBusiness: number | null;
  profileCompleteness: number;
};

export type PublicVendorProfile = PublicVendorCard & {
  websiteUrl: string | null;
  preferredContactMethod: string | null;
  businessHours: string | null;
  publicPhone: string | null;
  publicWhatsApp: string | null;
  publicEmail: string | null;
  nationwideDelivery: boolean;
  pickupAvailable: boolean;
  interstateDelivery: boolean;
  installationAvailable: boolean;
  acceptsProjectQuotations: boolean;
  acceptsBulkOrders: boolean;
  paymentMethodsAccepted: string[];
  pricesNegotiable: boolean;
  priceListAvailable: boolean;
  typicalQuoteResponseHours: number | null;
  lastUpdatedAt: string;
  transparency: {
    listingLabel: string;
    verificationLabel: string;
    businessIdentity: string;
    locationEvidence: string;
    registration: string;
    pricingDisclaimer: string;
    bmhRelationship: string | null;
    checksPerformed: Array<{ key: string; status: string }>;
  };
  representative: { name: string; role: string | null } | null;
  offerings: Array<{
    familyKey: string | null;
    categoryCode: string | null;
    customCategoryLabel: string | null;
    productTypes: string[];
    brands: string[];
    sellsRetail: boolean;
    sellsWholesale: boolean;
    normalUnit: string | null;
    minimumOrderQuantity: number | null;
    minimumOrderUnit: string | null;
    stockedNormally: boolean;
    specialOrder: boolean;
    deliveryAvailable: boolean;
    installationAvailable: boolean;
    acceptsQuotations: boolean;
    pricesNegotiable: boolean;
    examplePriceAmount: string | null;
    examplePriceUnit: string | null;
    examplePriceNotes: string | null;
    examplePriceDisclaimer: string;
  }>;
  serviceAreas: Array<{
    stateLabel: string | null;
    cityLabel: string | null;
    coverageType: string;
  }>;
};

export type PublicVendorSearchParams = {
  query?: string;
  category?: string;
  familyKey?: string;
  brand?: string;
  stateKey?: string;
  verifiedOnly?: boolean;
  retail?: boolean;
  wholesale?: boolean;
  delivery?: boolean;
  page?: number;
  limit?: number;
};

export const VENDOR_CATEGORY_FILTERS: Array<{ label: string; familyKey: string }> = [
  { label: 'Cement', familyKey: 'cement' },
  { label: 'Steel', familyKey: 'reinforcement-steel' },
  { label: 'Blocks', familyKey: 'concrete-blocks' },
  { label: 'Roofing', familyKey: 'roofing' },
  { label: 'Tiles', familyKey: 'tiles' },
  { label: 'Plumbing', familyKey: 'plumbing-pipes' },
  { label: 'Electrical', familyKey: 'electrical-cables' },
  { label: 'Pumps', familyKey: 'water-pumps' },
  { label: 'Solar', familyKey: 'solar-panels' },
  { label: 'Inverters', familyKey: 'inverters' },
  { label: 'Paint', familyKey: 'paint' },
];

export const VENDOR_STATE_FILTERS: Array<{ label: string; stateKey: string }> = [
  { label: 'Lagos', stateKey: 'ng-lagos' },
  { label: 'Ogun', stateKey: 'ng-ogun' },
  { label: 'Abuja (FCT)', stateKey: 'ng-fct' },
  { label: 'Edo', stateKey: 'ng-edo' },
];

export const VENDOR_APPLY_FAMILY_OPTIONS = VENDOR_CATEGORY_FILTERS;

function toQuery(params: PublicVendorSearchParams): string {
  const sp = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return;
    sp.set(key, String(value));
  });
  const q = sp.toString();
  return q ? `?${q}` : '';
}

export async function fetchPublicVendors(params: PublicVendorSearchParams = {}): Promise<{
  vendors: PublicVendorCard[];
  meta: { page: number; limit: number; total: number; totalPages: number };
}> {
  const response = await fetch(`${API_BASE_URL}/vendors${toQuery({ limit: 24, ...params })}`);
  if (!response.ok) {
    throw new Error('Unable to load vendors right now.');
  }
  const payload = (await response.json()) as {
    data?: PublicVendorCard[];
    meta?: { page: number; limit: number; total: number; totalPages: number };
  };
  return {
    vendors: payload.data ?? [],
    meta: payload.meta ?? { page: 1, limit: 24, total: 0, totalPages: 0 },
  };
}

export async function fetchPublicVendorBySlug(slug: string): Promise<PublicVendorProfile> {
  const response = await fetch(`${API_BASE_URL}/vendors/${encodeURIComponent(slug)}`);
  if (response.status === 404) {
    throw new Error('VENDOR_NOT_FOUND');
  }
  if (!response.ok) {
    throw new Error('Unable to load this vendor right now.');
  }
  return response.json();
}

export type VendorApplyPayload = {
  tradingName: string;
  legalName?: string;
  description?: string;
  yearEstablished?: number;
  businessTypes?: string[];
  stateKey?: string;
  stateLabel?: string;
  cityLabel?: string;
  publicPhone?: string;
  publicWhatsApp?: string;
  publicEmail?: string;
  websiteUrl?: string;
  preferredContactMethod?: 'phone' | 'whatsapp' | 'email';
  acceptsBulkOrders?: boolean;
  acceptsProjectQuotations?: boolean;
  pickupAvailable?: boolean;
  interstateDelivery?: boolean;
  nationwideDelivery?: boolean;
  installationAvailable?: boolean;
  paymentMethodsAccepted?: string[];
  pricesNegotiable?: boolean;
  cacNumber?: string;
  offerings?: Array<{
    familyKey?: string;
    brands?: string[];
    sellsRetail?: boolean;
    sellsWholesale?: boolean;
    normalUnit?: string;
    minimumOrderQuantity?: number;
    deliveryAvailable?: boolean;
  }>;
  serviceAreas?: Array<{ stateKey?: string; stateLabel?: string; coverageType?: string }>;
  representative?: { name: string; role?: string; phone?: string; email?: string; showPublicly?: boolean };
  accuracyConfirmed: boolean;
  contactConsent: boolean;
  publicDisplayConsent: boolean;
  noGuaranteeAcknowledged: boolean;
};

export async function submitVendorApplication(payload: VendorApplyPayload): Promise<{
  id: string;
  applicationReference: string | null;
  listingStatus: string;
  message: string;
}> {
  const response = await fetch(`${API_BASE_URL}/vendors/apply`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    let message = 'Unable to submit your application right now.';
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

export async function submitVendorQuoteRequest(
  slug: string,
  payload: {
    product: string;
    specification?: string;
    quantity?: string;
    deliveryLocation?: string;
    buyerName: string;
    buyerEmail?: string;
    buyerPhone?: string;
    note?: string;
  },
): Promise<{ id: string; status: string }> {
  const response = await fetch(`${API_BASE_URL}/vendors/${encodeURIComponent(slug)}/quote-requests`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    let message = 'Unable to send quote request right now.';
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

export function vendorWhatsAppHref(phone: string | null | undefined): string | null {
  if (!phone) return null;
  const digits = phone.replace(/\D/g, '');
  if (digits.length < 7) return null;
  return `https://wa.me/${digits}`;
}
