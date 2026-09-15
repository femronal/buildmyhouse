import {
  ProfessionalCredentialStatus,
  ProfessionalCredentialVerification,
  ProfessionalListingStatus,
  ProfessionalOwnershipStatus,
  ProfessionalType,
  ProfessionalVerificationStatus,
  type ProfessionCatalog,
  type ProfessionDeliverable,
  type ProfessionService,
  type ProfessionSpecialty,
  type ProfessionalCredential,
  type ProfessionalListing,
  type ProfessionalProjectStage,
} from '@prisma/client';

export function normalizeProfessionalSlug(input: string): string {
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

export function normalizeDisplayName(value?: string | null): string | null {
  if (!value) return null;
  return (
    String(value)
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim() || null
  );
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

export function normalizeRegKey(regulatorKey?: string | null, registrationNumber?: string | null): string | null {
  if (!regulatorKey || !registrationNumber) return null;
  const reg = String(registrationNumber).replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
  const regulator = String(regulatorKey).trim().toLowerCase();
  if (!reg || !regulator) return null;
  return `${regulator}:${reg}`;
}

export function isPubliclyListed(status: ProfessionalListingStatus): boolean {
  return status === ProfessionalListingStatus.listed;
}

export function credentialCurrencyStatus(expiresAt?: Date | null, now = new Date()): ProfessionalCredentialStatus {
  if (!expiresAt) return ProfessionalCredentialStatus.unknown;
  const ms = expiresAt.getTime() - now.getTime();
  const days = ms / (1000 * 60 * 60 * 24);
  if (days < 0) return ProfessionalCredentialStatus.expired;
  if (days <= 60) return ProfessionalCredentialStatus.expiring_soon;
  return ProfessionalCredentialStatus.current;
}

export type CompletenessInput = {
  displayName?: string | null;
  professionalType?: ProfessionalType | null;
  primaryProfessionId?: string | null;
  phone?: string | null;
  email?: string | null;
  website?: string | null;
  whatsapp?: string | null;
  city?: string | null;
  state?: string | null;
  serviceStatesCount?: number;
  specialtiesCount?: number;
  servicesCount?: number;
  deliverablesCount?: number;
  stagesCount?: number;
  bio?: string | null;
  yearsExperience?: number | null;
  credentialsCount?: number;
  remoteConsultation?: boolean;
  siteVisits?: boolean;
};

/** Deterministic 0–100. Not verification and not a trust score. */
export function computeCompleteness(input: CompletenessInput): number {
  const identity =
    (input.displayName ? 5 : 0) +
    (input.professionalType ? 5 : 0) +
    (input.primaryProfessionId ? 5 : 0);
  const contact =
    (input.phone ? 6 : 0) +
    (input.email ? 5 : 0) +
    (input.website || input.whatsapp ? 4 : 0);
  const location =
    (input.city ? 5 : 0) +
    (input.state ? 5 : 0) +
    ((input.serviceStatesCount || 0) > 0 ? 5 : 0);
  const capability =
    ((input.specialtiesCount || 0) > 0 ? 7 : 0) +
    ((input.servicesCount || 0) > 0 ? 7 : 0) +
    ((input.deliverablesCount || 0) > 0 ? 6 : 0) +
    ((input.stagesCount || 0) > 0 ? 5 : 0);
  const profile = (input.bio && String(input.bio).length >= 40 ? 6 : 0) + (input.yearsExperience != null ? 4 : 0);
  const credential = (input.credentialsCount || 0) > 0 ? 15 : 0;
  const availability = input.remoteConsultation || input.siteVisits ? 5 : 0;
  return Math.min(100, Math.max(0, identity + contact + location + capability + profile + credential + availability));
}

export function computeSearchRank(input: {
  usedByBmh?: boolean;
  verificationStatus?: ProfessionalVerificationStatus;
  ownershipStatus?: ProfessionalOwnershipStatus;
  completenessScore?: number;
}): number {
  return (
    (input.usedByBmh ? 400 : 0) +
    (input.verificationStatus === ProfessionalVerificationStatus.verified ? 200 : 0) +
    (input.ownershipStatus === ProfessionalOwnershipStatus.claimed ? 50 : 0) +
    (input.completenessScore || 0)
  );
}

export function aggregateVerification(credentials: Array<{
  isPrimary: boolean;
  verificationStatus: ProfessionalCredentialVerification;
  credentialStatus: ProfessionalCredentialStatus;
  expiresAt?: Date | null;
}>): ProfessionalVerificationStatus {
  if (!credentials.length) return ProfessionalVerificationStatus.unverified;
  const relevant = credentials.filter((c) => c.isPrimary) ;
  const pool = relevant.length ? relevant : credentials;
  const live = pool.map((c) => ({
    ...c,
    credentialStatus: credentialCurrencyStatus(c.expiresAt),
  }));
  if (live.some((c) => c.verificationStatus === ProfessionalCredentialVerification.checked && c.credentialStatus === ProfessionalCredentialStatus.expired)) {
    return ProfessionalVerificationStatus.expired;
  }
  if (live.some((c) => c.verificationStatus === ProfessionalCredentialVerification.checked)) {
    return ProfessionalVerificationStatus.verified;
  }
  if (live.some((c) => c.verificationStatus === ProfessionalCredentialVerification.pending)) {
    return ProfessionalVerificationStatus.pending;
  }
  if (live.some((c) => c.verificationStatus === ProfessionalCredentialVerification.rejected)) {
    return ProfessionalVerificationStatus.rejected;
  }
  return ProfessionalVerificationStatus.unverified;
}

export const PUBLIC_DTO_FORBIDDEN_KEYS = [
  'address',
  'sourceNotes',
  'sourceUrls',
  'usedByBmhNote',
  'procurementStatus',
  'internalNotes',
  'inspectionFee',
  'reportFee',
  'consultationFee',
  'rateNotes',
  'travelFeeNotes',
  'fileRef',
  'verificationNotes',
  'adminNotes',
  'normalizedName',
  'normalizedPhone',
  'normalizedEmail',
  'linkedUserId',
  'createdByAdminId',
  'proofNotes',
  'internalDecisionNotes',
  'professionalRecommendation',
] as const;

export type ListingWithPublicRelations = ProfessionalListing & {
  primaryProfession?: ProfessionCatalog | null;
  specialties?: Array<{ specialty: ProfessionSpecialty }>;
  services?: Array<{ service: ProfessionService }>;
  deliverables?: Array<{ deliverable: ProfessionDeliverable }>;
  projectStages?: Array<{ projectStage: ProfessionalProjectStage }>;
  credentials?: ProfessionalCredential[];
};

export type PublicTrust = {
  listingLabel: string;
  claimedLabel: string | null;
  credentialLabel: string | null;
  credentialDetail: string | null;
  checkedOn: string | null;
  usedByBmh: boolean;
  usedByBmhLabel: string | null;
  disclaimer: string;
};

function publicCredentialLabel(listing: ListingWithPublicRelations): {
  label: string | null;
  detail: string | null;
  checkedOn: string | null;
} {
  if (listing.verificationStatus !== ProfessionalVerificationStatus.verified) {
    return { label: null, detail: null, checkedOn: null };
  }
  const publicCreds = (listing.credentials || []).filter(
    (c) =>
      c.isPublic &&
      c.verificationStatus === ProfessionalCredentialVerification.checked &&
      credentialCurrencyStatus(c.expiresAt) !== ProfessionalCredentialStatus.expired,
  );
  const primary = publicCreds.find((c) => c.isPrimary) || publicCreds[0];
  if (!primary) {
    return {
      label: 'Professional documents checked by BuildMyHouse',
      detail: null,
      checkedOn: null,
    };
  }
  const regulator = primary.regulatorLabel || primary.regulatorKey;
  return {
    label: regulator ? `${regulator} credential checked` : 'Professional documents checked by BuildMyHouse',
    detail: primary.registrationNumber || null,
    checkedOn: primary.verifiedAt ? primary.verifiedAt.toISOString() : null,
  };
}

export function toPublicTrust(listing: ListingWithPublicRelations): PublicTrust {
  const cred = publicCredentialLabel(listing);
  return {
    listingLabel: 'Listed',
    claimedLabel: listing.ownershipStatus === ProfessionalOwnershipStatus.claimed ? 'Claimed' : null,
    credentialLabel: cred.label,
    credentialDetail: cred.detail,
    checkedOn: cred.checkedOn,
    usedByBmh: listing.usedByBmh,
    usedByBmhLabel: listing.usedByBmh ? 'Used by BuildMyHouse' : null,
    disclaimer:
      'BuildMyHouse checked the credential information shown on this profile on the date indicated. This does not guarantee future performance or suitability for every project. Listing is not the same as verification.',
  };
}

export type PublicProfessionalCard = {
  id: string;
  slug: string;
  displayName: string;
  professionalType: ProfessionalType;
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
  listingStatus: 'listed';
  ownershipStatus: ProfessionalOwnershipStatus;
  verificationStatus: ProfessionalVerificationStatus;
  usedByBmh: boolean;
  completenessScore: number;
  trust: PublicTrust;
};

export type PublicProfessionalProfile = PublicProfessionalCard & {
  bio: string | null;
  website: string | null;
  publicPhone: string | null;
  publicEmail: string | null;
  publicWhatsapp: string | null;
  lastUpdatedAt: string;
  contact: {
    phone: string | null;
    email: string | null;
    whatsapp: string | null;
    website: string | null;
  };
};

function mapNamed<T extends { key: string; label: string }>(rows: T[] | undefined) {
  return (rows || []).map((row) => ({ key: row.key, label: row.label }));
}

export function toPublicProfessionalCard(listing: ListingWithPublicRelations): PublicProfessionalCard {
  const profession = listing.primaryProfession
    ? { key: listing.primaryProfession.key, label: listing.primaryProfession.label }
    : null;
  return {
    id: listing.id,
    slug: listing.slug,
    displayName: listing.displayName,
    professionalType: listing.professionalType,
    profession,
    specialties: mapNamed((listing.specialties || []).map((row) => row.specialty)),
    services: mapNamed((listing.services || []).map((row) => row.service)),
    deliverables: mapNamed((listing.deliverables || []).map((row) => row.deliverable)).slice(0, 8),
    projectStages: mapNamed((listing.projectStages || []).map((row) => row.projectStage)).slice(0, 6),
    city: listing.city,
    state: listing.state,
    serviceStates: listing.serviceStates,
    remoteConsultation: listing.remoteConsultation,
    siteVisits: listing.siteVisits,
    canIssueSignedReport: listing.canIssueSignedReport,
    yearsExperience: listing.yearsExperience,
    listingStatus: 'listed',
    ownershipStatus: listing.ownershipStatus,
    verificationStatus: listing.verificationStatus,
    usedByBmh: listing.usedByBmh,
    completenessScore: listing.completenessScore,
    trust: toPublicTrust(listing),
  };
}

export function toPublicProfessionalProfile(listing: ListingWithPublicRelations): PublicProfessionalProfile {
  const card = toPublicProfessionalCard(listing);
  return {
    ...card,
    bio: listing.bio,
    website: listing.publicWebsite ? listing.website : null,
    publicPhone: listing.publicPhone ? listing.phone : null,
    publicEmail: listing.publicEmail ? listing.email : null,
    publicWhatsapp: listing.publicWhatsapp ? listing.whatsapp : null,
    lastUpdatedAt: listing.updatedAt.toISOString(),
    contact: {
      phone: listing.publicPhone ? listing.phone : null,
      email: listing.publicEmail ? listing.email : null,
      whatsapp: listing.publicWhatsapp ? listing.whatsapp : null,
      website: listing.publicWebsite ? listing.website : null,
    },
  };
}

export function assertNoForbiddenPublicKeys(payload: unknown): string[] {
  const leaked: string[] = [];
  const walk = (value: unknown, path: string) => {
    if (!value || typeof value !== 'object') return;
    if (Array.isArray(value)) {
      value.forEach((item, i) => walk(item, `${path}[${i}]`));
      return;
    }
    for (const [key, nested] of Object.entries(value as Record<string, unknown>)) {
      if ((PUBLIC_DTO_FORBIDDEN_KEYS as readonly string[]).includes(key)) {
        leaked.push(path ? `${path}.${key}` : key);
      }
      walk(nested, path ? `${path}.${key}` : key);
    }
  };
  walk(payload, '');
  return leaked;
}
