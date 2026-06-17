const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL ||
  (__DEV__ ? 'http://localhost:3001/api' : 'https://api.buildmyhouse.app/api');

export type PublicContractorListing = {
  id: string;
  name: string;
  specialty: string | null;
  type: string | null;
  rating: number | null;
  verified: boolean;
  reviewCount: number;
};

type ContractorsApiResponse = {
  data?: Array<{
    id: string;
    name: string;
    specialty?: string | null;
    type?: string | null;
    rating?: number | null;
    verified?: boolean;
    _count?: { contractorReviews?: number };
    user?: { email?: string; phone?: string };
  }>;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

function sanitizeContractor(row: NonNullable<ContractorsApiResponse['data']>[number]): PublicContractorListing {
  return {
    id: row.id,
    name: row.name,
    specialty: row.specialty ?? null,
    type: row.type ?? null,
    rating: typeof row.rating === 'number' ? row.rating : null,
    verified: Boolean(row.verified),
    reviewCount: row._count?.contractorReviews ?? 0,
  };
}

export async function fetchPublicContractors(params?: {
  query?: string;
  page?: number;
  limit?: number;
}): Promise<{ contractors: PublicContractorListing[]; pagination: ContractorsApiResponse['pagination'] }> {
  const search = new URLSearchParams();
  if (params?.query) search.set('query', params.query);
  if (params?.page) search.set('page', String(params.page));
  if (params?.limit) search.set('limit', String(params.limit));

  const qs = search.toString();
  const response = await fetch(`${API_BASE_URL}/marketplace/contractors${qs ? `?${qs}` : ''}`);

  if (!response.ok) {
    throw new Error('Unable to load contractors right now.');
  }

  const payload = (await response.json()) as ContractorsApiResponse;
  return {
    contractors: (payload.data ?? []).map(sanitizeContractor),
    pagination: payload.pagination,
  };
}

export type ContractorDirectorySpecialtySlug = 'plumbing-repair' | 'electrical-repair' | 'roof-leak-repair';

export type ContractorDirectorySpecialty = {
  slug: ContractorDirectorySpecialtySlug;
  title: string;
  summary: string;
  marketplaceQuery: string;
  servicePath: string;
};

export const CONTRACTOR_DIRECTORY_SPECIALTIES: Record<
  ContractorDirectorySpecialtySlug,
  ContractorDirectorySpecialty
> = {
  'plumbing-repair': {
    slug: 'plumbing-repair',
    title: 'Plumbing Repair Contractors in Lagos',
    summary: 'Browse verified plumbers serving Lagos with ratings and review counts on BuildMyHouse.',
    marketplaceQuery: 'plumbing',
    servicePath: '/services/lagos/plumbing-repair',
  },
  'electrical-repair': {
    slug: 'electrical-repair',
    title: 'Electrical Repair Contractors in Lagos',
    summary: 'Browse verified electricians in Lagos for faults, rewiring, and safe staged repairs.',
    marketplaceQuery: 'electrical',
    servicePath: '/services/lagos/electrical-repair',
  },
  'roof-leak-repair': {
    slug: 'roof-leak-repair',
    title: 'Roof Leak Repair Contractors in Lagos',
    summary: 'Browse verified roofers in Lagos for leak diagnosis, materials, and tracked fixes.',
    marketplaceQuery: 'roof',
    servicePath: '/services/lagos/roof-leak-repair',
  },
};

export const CONTRACTOR_DIRECTORY_SPECIALTY_SLUGS = Object.keys(
  CONTRACTOR_DIRECTORY_SPECIALTIES,
) as ContractorDirectorySpecialtySlug[];

export function isContractorDirectorySpecialtySlug(value: string): value is ContractorDirectorySpecialtySlug {
  return value in CONTRACTOR_DIRECTORY_SPECIALTIES;
}

export function contractorDirectoryPath(specialty?: ContractorDirectorySpecialtySlug) {
  return specialty ? `/contractors/lagos/${specialty}` : '/contractors/lagos';
}
