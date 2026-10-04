import { ARTISAN_TRUST_EXPLANATION } from './artisan-trust';

const PRIVATE_KEYS = [
  'recruitmentStatus',
  'internalNotes',
  'sourceNotes',
  'sourceUrls',
  'researchConfidence',
  'suppressedFromRelist',
  'suppressionReason',
  'normalizedName',
  'normalizedPhone',
  'normalizedWhatsapp',
  'normalizedEmail',
  'websiteDomain',
  'availabilityNotes',
  'callOutFeeNotes',
  'inspectionFeeNotes',
  'workmanshipNotes',
  'transportNotes',
  'linkedUserId',
  'linkedContractorId',
  'createdByAdminId',
  'tokenHash',
  'evidenceFileRef',
  'usedByBmhNote',
] as const;

export function assertNoArtisanPrivateKeys(payload: unknown): string[] {
  const leaked: string[] = [];
  const walk = (value: unknown, path: string) => {
    if (!value || typeof value !== 'object') return;
    if (Array.isArray(value)) {
      value.forEach((item, index) => walk(item, `${path}[${index}]`));
      return;
    }
    for (const [key, nested] of Object.entries(value as Record<string, unknown>)) {
      if ((PRIVATE_KEYS as readonly string[]).includes(key)) leaked.push(path ? `${path}.${key}` : key);
      walk(nested, path ? `${path}.${key}` : key);
    }
  };
  walk(payload, '');
  return leaked;
}

type Capability = {
  id: string;
  kind: string;
  key: string;
  label: string;
  professionalNote?: string | null;
  professionalHref?: string | null;
  isActive?: boolean;
};

type Media = {
  id: string;
  mediaType: string;
  fileRef: string;
  label?: string | null;
  reviewStatus: string;
  isPublic: boolean;
  sortOrder: number;
};

export type ArtisanPublicSource = {
  id: string;
  slug: string;
  displayName: string;
  businessName?: string | null;
  bio?: string | null;
  phone?: string | null;
  email?: string | null;
  whatsapp?: string | null;
  website?: string | null;
  instagramUrl?: string | null;
  facebookUrl?: string | null;
  publicPhone: boolean;
  publicEmail: boolean;
  publicWhatsapp: boolean;
  publicWebsite: boolean;
  workingHours?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  serviceStates: string[];
  serviceCities: string[];
  listingStatus: string;
  claimStatus: string;
  verificationStatus: string;
  usedByBmh: boolean;
  trustScore: number;
  updatedAt: Date;
  primaryTrade?: { key: string; label: string; capabilities?: Capability[] } | null;
  capabilities?: Array<{ capability: Capability }>;
  media?: Media[];
  checks?: Array<{ checkKey: string; status: string }>;
  recruitmentStatus?: string;
  internalNotes?: string | null;
  sourceNotes?: string | null;
};

function visibleMedia(listing: ArtisanPublicSource) {
  return (listing.media || []).filter((item) => item.isPublic && item.reviewStatus !== 'rejected');
}

function caps(listing: ArtisanPublicSource, kind: string) {
  return (listing.capabilities || [])
    .map((row) => row.capability)
    .filter((item) => item.kind === kind && item.isActive !== false)
    .map((item) => ({
      key: item.key,
      label: item.label,
      professionalNote: item.professionalNote || null,
      professionalHref: item.professionalHref || null,
    }));
}

/** Linked problems win. A listing with none still belongs to the problems on its trade. */
export function artisanProblemCaps(listing: ArtisanPublicSource) {
  const linked = caps(listing, 'problem');
  if (linked.length) return linked;
  return (listing.primaryTrade?.capabilities || [])
    .filter((item) => item.kind === 'problem' && item.isActive !== false)
    .map((item) => ({
      key: item.key,
      label: item.label,
      professionalNote: item.professionalNote || null,
      professionalHref: item.professionalHref || null,
    }));
}

export function toPublicArtisanCard(listing: ArtisanPublicSource) {
  const media = visibleMedia(listing);
  const logo = media.find((item) => item.mediaType === 'logo') || null;
  return {
    id: listing.id,
    slug: listing.slug,
    displayName: listing.displayName,
    businessName: listing.businessName || null,
    trade: listing.primaryTrade ? { key: listing.primaryTrade.key, label: listing.primaryTrade.label } : null,
    city: listing.city || null,
    state: listing.state || null,
    services: caps(listing, 'service').slice(0, 4).map((item) => item.label),
    problems: artisanProblemCaps(listing).slice(0, 4).map((item) => item.label),
    trustScore: listing.trustScore,
    trustExplanation: ARTISAN_TRUST_EXPLANATION,
    listingStatus: 'listed' as const,
    claimStatus: listing.claimStatus,
    verificationStatus: listing.verificationStatus,
    usedByBmh: listing.usedByBmh,
    logoUrl: logo?.fileRef || null,
    hasWorkshopPhoto: media.some((item) => item.mediaType === 'workshop_cover'),
  };
}

export function toPublicArtisanProfile(listing: ArtisanPublicSource) {
  const card = toPublicArtisanCard(listing);
  const media = visibleMedia(listing);
  const passed = (listing.checks || []).filter((check) => check.status === 'passed').map((check) => check.checkKey);
  return {
    ...card,
    bio: listing.bio || null,
    workingHours: listing.workingHours || null,
    address: listing.address || null,
    country: listing.country || 'Nigeria',
    serviceStates: listing.serviceStates || [],
    serviceCities: listing.serviceCities || [],
    specialties: caps(listing, 'specialty'),
    repairServices: caps(listing, 'service'),
    problemsHandled: artisanProblemCaps(listing),
    coverUrl: media.find((item) => item.mediaType === 'workshop_cover')?.fileRef || null,
    gallery: media
      .filter((item) => item.mediaType !== 'logo')
      .map((item) => ({ id: item.id, type: item.mediaType, url: item.fileRef, label: item.label || null })),
    contact: {
      phone: listing.publicPhone ? listing.phone || null : null,
      email: listing.publicEmail ? listing.email || null : null,
      whatsapp: listing.publicWhatsapp ? listing.whatsapp || null : null,
      website: listing.publicWebsite ? listing.website || null : null,
      instagram: listing.instagramUrl || null,
      facebook: listing.facebookUrl || null,
    },
    trustIndicators: {
      listed: true,
      claimed: listing.claimStatus === 'claimed',
      identityChecked: passed.includes('identity_checked'),
      workBaseChecked: passed.includes('work_base_checked'),
      tradeEvidenceChecked: passed.includes('trade_evidence_checked'),
      verifiedForRepairWork: listing.verificationStatus === 'verified',
      usedByBmh: listing.usedByBmh,
    },
    trustExplanation: ARTISAN_TRUST_EXPLANATION,
    lastUpdatedAt: listing.updatedAt.toISOString(),
  };
}
