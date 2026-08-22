import {
  VendorListingStatus,
  VendorVerificationCheckStatus,
  VendorVerificationStatus,
  type VendorOffering,
  type VendorProfile,
  type VendorRepresentative,
  type VendorServiceArea,
  type VendorVerificationCheck,
} from '@prisma/client';

export function normalizeVendorSlug(input: string): string {
  return String(input || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80);
}

export function normalizePhone(value?: string | null): string | null {
  if (!value) return null;
  const digits = String(value).replace(/\D/g, '');
  return digits.length >= 7 ? digits : null;
}

export function normalizeEmail(value?: string | null): string | null {
  if (!value) return null;
  const email = String(value).trim().toLowerCase();
  return email.includes('@') ? email : null;
}

export function normalizeTradingName(value?: string | null): string | null {
  if (!value) return null;
  return String(value)
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim() || null;
}

export function websiteDomain(value?: string | null): string | null {
  if (!value) return null;
  try {
    const withProtocol = /^https?:\/\//i.test(value) ? value : `https://${value}`;
    const host = new URL(withProtocol).hostname.toLowerCase().replace(/^www\./, '');
    return host || null;
  } catch {
    return null;
  }
}

export function buildApplicationReference(now = new Date()): string {
  const y = now.getUTCFullYear();
  const m = String(now.getUTCMonth() + 1).padStart(2, '0');
  const d = String(now.getUTCDate()).padStart(2, '0');
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `VND-${y}${m}${d}-${rand}`;
}

export type CompletenessInput = {
  tradingName?: string | null;
  description?: string | null;
  logoUrl?: string | null;
  stateKey?: string | null;
  stateLabel?: string | null;
  cityLabel?: string | null;
  publicPhone?: string | null;
  publicWhatsApp?: string | null;
  publicEmail?: string | null;
  websiteUrl?: string | null;
  businessTypes?: string[];
  offeringsCount?: number;
  brandsCount?: number;
  serviceAreasCount?: number;
  hasDeliveryInfo?: boolean;
  documentsCount?: number;
  hasRepresentative?: boolean;
  hasPricingInfo?: boolean;
};

/** Deterministic 0–100 score. Not a trust/verification signal. */
export function computeProfileCompleteness(input: CompletenessInput): number {
  const checks: Array<[boolean, number]> = [
    [!!input.tradingName, 10],
    [!!input.description && String(input.description).length >= 40, 10],
    [!!input.logoUrl, 8],
    [!!(input.stateKey || input.stateLabel), 8],
    [!!input.cityLabel, 5],
    [!!(input.publicPhone || input.publicWhatsApp), 10],
    [!!input.publicEmail, 5],
    [!!input.websiteUrl, 4],
    [(input.businessTypes?.length || 0) > 0, 8],
    [(input.offeringsCount || 0) > 0, 12],
    [(input.brandsCount || 0) > 0, 6],
    [(input.serviceAreasCount || 0) > 0 || !!input.hasDeliveryInfo, 6],
    [!!input.hasRepresentative, 4],
    [(input.documentsCount || 0) > 0, 2],
    [!!input.hasPricingInfo, 2],
  ];
  const score = checks.reduce((sum, [ok, weight]) => sum + (ok ? weight : 0), 0);
  return Math.min(100, Math.max(0, score));
}

export function isPubliclyListed(listingStatus: VendorListingStatus): boolean {
  return listingStatus === VendorListingStatus.listed;
}

export type PublicVendorCard = {
  id: string;
  slug: string;
  tradingName: string;
  logoUrl: string | null;
  description: string | null;
  listingStatus: 'listed';
  verificationStatus: VendorVerificationStatus;
  isBuildMyHouseVerified: boolean;
  businessTypes: string[];
  categories: string[];
  brands: string[];
  stateLabel: string | null;
  cityLabel: string | null;
  sellsRetail: boolean;
  sellsWholesale: boolean;
  deliveryAvailable: boolean | null;
  yearEstablished: number | null;
  yearsInBusiness: number | null;
  profileCompleteness: number;
};

export type PublicVendorProfile = PublicVendorCard & {
  websiteUrl: string | null;
  socialLinks: unknown;
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
    locationKey: string | null;
    stateKey: string | null;
    stateLabel: string | null;
    cityKey: string | null;
    cityLabel: string | null;
    coverageType: string;
  }>;
};

type ProfileWithRelations = VendorProfile & {
  offerings?: VendorOffering[];
  serviceAreas?: VendorServiceArea[];
  representatives?: VendorRepresentative[];
  verificationChecks?: VendorVerificationCheck[];
};

function yearsInBusiness(yearEstablished?: number | null): number | null {
  if (!yearEstablished || yearEstablished < 1900) return null;
  const years = new Date().getFullYear() - yearEstablished;
  return years >= 0 ? years : null;
}

function checkStatusLabel(
  checks: VendorVerificationCheck[] | undefined,
  key: string,
): string {
  const row = checks?.find((c) => c.checkKey === key);
  if (!row) return 'Not checked';
  switch (row.status) {
    case VendorVerificationCheckStatus.passed:
      return 'Checked';
    case VendorVerificationCheckStatus.not_applicable:
      return 'Not applicable';
    case VendorVerificationCheckStatus.pending:
      return 'Pending';
    case VendorVerificationCheckStatus.failed:
      return 'Not verified';
    case VendorVerificationCheckStatus.expired:
      return 'Expired';
    default:
      return 'Not checked';
  }
}

export function toPublicVendorCard(profile: ProfileWithRelations): PublicVendorCard {
  const offerings = profile.offerings || [];
  const categories = Array.from(
    new Set(
      offerings
        .map((o) => o.customCategoryLabel || o.familyKey || o.categoryCode)
        .filter(Boolean) as string[],
    ),
  ).slice(0, 8);
  const brands = Array.from(new Set(offerings.flatMap((o) => o.brands || []))).slice(0, 8);
  const sellsRetail = offerings.some((o) => o.sellsRetail) || profile.businessTypes.includes('retailer');
  const sellsWholesale =
    offerings.some((o) => o.sellsWholesale) ||
    profile.businessTypes.some((t) => ['wholesaler', 'distributor'].includes(t));
  const deliveryFlags = offerings.map((o) => o.deliveryAvailable);
  const deliveryAvailable =
    deliveryFlags.length === 0
      ? profile.nationwideDelivery || profile.interstateDelivery
        ? true
        : null
      : deliveryFlags.some(Boolean);

  return {
    id: profile.id,
    slug: profile.slug,
    tradingName: profile.tradingName,
    logoUrl: profile.logoUrl,
    description: profile.description,
    listingStatus: 'listed',
    verificationStatus: profile.verificationStatus,
    isBuildMyHouseVerified: profile.verificationStatus === VendorVerificationStatus.verified,
    businessTypes: profile.businessTypes,
    categories,
    brands,
    stateLabel: profile.stateLabel,
    cityLabel: profile.cityLabel,
    sellsRetail,
    sellsWholesale,
    deliveryAvailable,
    yearEstablished: profile.yearEstablished,
    yearsInBusiness: yearsInBusiness(profile.yearEstablished),
    profileCompleteness: profile.profileCompleteness,
  };
}

export function toPublicVendorProfile(profile: ProfileWithRelations): PublicVendorProfile {
  const card = toPublicVendorCard(profile);
  const checks = profile.verificationChecks || [];
  const publicRep = (profile.representatives || []).find((r) => r.showPublicly);

  return {
    ...card,
    websiteUrl: profile.websiteUrl,
    socialLinks: profile.socialLinks,
    preferredContactMethod: profile.preferredContactMethod,
    businessHours: profile.businessHours,
    publicPhone: profile.showPublicPhone ? profile.publicPhone : null,
    publicWhatsApp: profile.showPublicWhatsApp ? profile.publicWhatsApp : null,
    publicEmail: profile.showPublicEmail ? profile.publicEmail : null,
    nationwideDelivery: profile.nationwideDelivery,
    pickupAvailable: profile.pickupAvailable,
    interstateDelivery: profile.interstateDelivery,
    installationAvailable: profile.installationAvailable,
    acceptsProjectQuotations: profile.acceptsProjectQuotations,
    acceptsBulkOrders: profile.acceptsBulkOrders,
    paymentMethodsAccepted: profile.paymentMethodsAccepted,
    pricesNegotiable: profile.pricesNegotiable,
    priceListAvailable: profile.priceListAvailable,
    typicalQuoteResponseHours: profile.typicalQuoteResponseHours,
    lastUpdatedAt: profile.updatedAt.toISOString(),
    transparency: {
      listingLabel: 'Listed on BuildMyHouse',
      verificationLabel: card.isBuildMyHouseVerified
        ? 'BuildMyHouse Verified'
        : 'Listed — not BuildMyHouse Verified',
      businessIdentity: checkStatusLabel(checks, 'business_identity'),
      locationEvidence: checkStatusLabel(checks, 'location_evidence'),
      registration: checkStatusLabel(checks, 'business_registration'),
      pricingDisclaimer:
        'Any prices shown are vendor-supplied claims and may change. They are not BuildMyHouse market-price estimates.',
      bmhRelationship: profile.previouslyUsedByBmh
        ? 'Previously supplied a BuildMyHouse-managed project'
        : 'Not yet used by BuildMyHouse',
      checksPerformed: checks
        .filter((c) =>
          [
            VendorVerificationCheckStatus.passed,
            VendorVerificationCheckStatus.not_applicable,
          ].includes(c.status as any),
        )
        .map((c) => ({ key: c.checkKey, status: c.status })),
    },
    representative: publicRep
      ? { name: publicRep.name, role: publicRep.role }
      : null,
    offerings: (profile.offerings || []).map((o) => ({
      familyKey: o.familyKey,
      categoryCode: o.categoryCode,
      customCategoryLabel: o.customCategoryLabel,
      productTypes: o.productTypes,
      brands: o.brands,
      sellsRetail: o.sellsRetail,
      sellsWholesale: o.sellsWholesale,
      normalUnit: o.normalUnit,
      minimumOrderQuantity: o.minimumOrderQuantity,
      minimumOrderUnit: o.minimumOrderUnit,
      stockedNormally: o.stockedNormally,
      specialOrder: o.specialOrder,
      deliveryAvailable: o.deliveryAvailable,
      installationAvailable: o.installationAvailable,
      acceptsQuotations: o.acceptsQuotations,
      pricesNegotiable: o.pricesNegotiable,
      examplePriceAmount: o.examplePriceAmount != null ? String(o.examplePriceAmount) : null,
      examplePriceUnit: o.examplePriceUnit,
      examplePriceNotes: o.examplePriceNotes,
      examplePriceDisclaimer: 'Vendor-supplied illustrative price — not a BuildMyHouse market estimate.',
    })),
    serviceAreas: (profile.serviceAreas || []).map((a) => ({
      locationKey: a.locationKey,
      stateKey: a.stateKey,
      stateLabel: a.stateLabel,
      cityKey: a.cityKey,
      cityLabel: a.cityLabel,
      coverageType: a.coverageType,
    })),
  };
}

export const SENSITIVE_CHANGE_GROUPS = new Set([
  'identity',
  'registration',
  'representative',
  'location',
  'documents',
]);

export const VERIFICATION_CHECK_KEYS = [
  'business_identity',
  'business_registration',
  'representative_identity',
  'phone',
  'location_evidence',
  'product_categories',
  'supporting_evidence',
] as const;
