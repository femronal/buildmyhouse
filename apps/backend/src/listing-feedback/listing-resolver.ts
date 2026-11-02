import { NotFoundException } from '@nestjs/common';
import {
  ArtisanListingStatus,
  ListingKind,
  ProfessionalListingStatus,
  VendorListingStatus,
  type PrismaClient,
} from '@prisma/client';
import { normalizeVendorSlug } from '../vendors/vendor-helpers';

const ARTISAN_RESERVED = new Set(['meta', 'claim', 'my-listings', 'applications', 'claims']);

export type ResolvedListing = {
  kind: ListingKind;
  id: string;
  slug: string;
  displayName: string;
  ownerUserIds: string[];
  contractorIds: string[];
  contractorUserIds: string[];
  isPublic: boolean;
};

type PrismaLike = Pick<
  PrismaClient,
  'professionalListing' | 'vendorProfile' | 'artisanListing' | 'contractor'
>;

export function parseListingKind(value: string): ListingKind {
  if (value === ListingKind.professional || value === ListingKind.vendor || value === ListingKind.artisan) {
    return value;
  }
  throw new NotFoundException('Listing not found');
}

export function listingPublicPath(kind: ListingKind, slug: string): string {
  const segment =
    kind === ListingKind.professional ? 'professionals' : kind === ListingKind.vendor ? 'vendors' : 'artisans';
  return `/${segment}/${slug}`;
}

export async function resolveListing(prisma: PrismaLike, kind: ListingKind, slug: string): Promise<ResolvedListing> {
  const cleanSlug = String(slug || '').trim();
  if (!cleanSlug) throw new NotFoundException('Listing not found');

  if (kind === ListingKind.professional) {
    const listing = await prisma.professionalListing.findFirst({
      where: { slug: cleanSlug, listingStatus: ProfessionalListingStatus.listed, archivedAt: null },
      select: { id: true, slug: true, displayName: true, claimedByUserId: true, linkedUserId: true },
    });
    if (!listing) throw new NotFoundException('Listing not found');
    return finish(prisma, {
      kind,
      id: listing.id,
      slug: listing.slug,
      displayName: listing.displayName,
      ownerUserIds: unique([listing.claimedByUserId, listing.linkedUserId]),
      extraContractorIds: [],
    });
  }

  if (kind === ListingKind.vendor) {
    const listing = await prisma.vendorProfile.findFirst({
      where: {
        slug: normalizeVendorSlug(cleanSlug),
        listingStatus: VendorListingStatus.listed,
        deletedAt: null,
      },
      select: { id: true, slug: true, tradingName: true, userId: true },
    });
    if (!listing) throw new NotFoundException('Listing not found');
    return finish(prisma, {
      kind,
      id: listing.id,
      slug: listing.slug,
      displayName: listing.tradingName,
      ownerUserIds: unique([listing.userId]),
      extraContractorIds: [],
    });
  }

  if (ARTISAN_RESERVED.has(cleanSlug)) throw new NotFoundException('Listing not found');
  const listing = await prisma.artisanListing.findFirst({
    where: { slug: cleanSlug, listingStatus: ArtisanListingStatus.listed, archivedAt: null },
    select: {
      id: true,
      slug: true,
      displayName: true,
      linkedUserId: true,
      linkedContractorId: true,
    },
  });
  if (!listing) throw new NotFoundException('Listing not found');
  return finish(prisma, {
    kind,
    id: listing.id,
    slug: listing.slug,
    displayName: listing.displayName,
    ownerUserIds: unique([listing.linkedUserId]),
    extraContractorIds: unique([listing.linkedContractorId]),
  });
}

async function finish(
  prisma: PrismaLike,
  input: {
    kind: ListingKind;
    id: string;
    slug: string;
    displayName: string;
    ownerUserIds: string[];
    extraContractorIds: string[];
  },
): Promise<ResolvedListing> {
  const or: Array<{ userId?: { in: string[] }; id?: { in: string[] } }> = [];
  if (input.ownerUserIds.length) or.push({ userId: { in: input.ownerUserIds } });
  if (input.extraContractorIds.length) or.push({ id: { in: input.extraContractorIds } });
  const contractors = or.length
    ? await prisma.contractor.findMany({
        where: { OR: or },
        select: { id: true, userId: true },
      })
    : [];
  return {
    kind: input.kind,
    id: input.id,
    slug: input.slug,
    displayName: input.displayName,
    ownerUserIds: input.ownerUserIds,
    contractorIds: unique(contractors.map((row) => row.id).concat(input.extraContractorIds)),
    contractorUserIds: unique(contractors.map((row) => row.userId)),
    isPublic: true,
  };
}

function unique(values: Array<string | null | undefined>): string[] {
  return [...new Set(values.map((value) => String(value || '').trim()).filter(Boolean))];
}
