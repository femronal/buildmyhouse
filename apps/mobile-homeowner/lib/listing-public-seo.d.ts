declare module '@/lib/listing-public-seo.mjs' {
  export const SITEMAP_URL_LIMIT: number;

  export function cleanText(value: unknown): string;
  export function hasRoutePlaceholder(route: string): boolean;
  export function canonicalRouteWithoutPlaceholder(route: string): string;

  export type ListingSegment = 'artisans' | 'vendors' | 'professionals';

  export type ListingReviewInput = {
    summary?: { average?: number | null; count?: number } | null;
    reviews?: Array<{
      rating?: number;
      title?: string | null;
      comment?: string | null;
      reviewerName?: string | null;
      publishedAt?: string | null;
    }>;
  };

  export type ListingHeadInput = {
    segment: ListingSegment;
    name: string;
    slug: string;
    trade?: string | null;
    city?: string | null;
    state?: string | null;
    services?: string[];
    businessTypes?: string[];
    origin?: string;
    reviews?: ListingReviewInput | null;
  };

  export function listingDocumentTitle(input: {
    name?: string | null;
    trade?: string | null;
    city?: string | null;
    state?: string | null;
  }): string;

  export function listingMetaDescription(input: {
    name?: string | null;
    trade?: string | null;
    city?: string | null;
    state?: string | null;
    services?: string[];
  }): string;

  export function listingSchemaType(segment: ListingSegment, businessTypes?: string[]): string;

  export function listingHead(input: ListingHeadInput): {
    title: string;
    description: string;
    canonical: string;
    canonicalPath: string;
    jsonLd: Record<string, unknown>;
  };

  export function listingTradeText(listing: Record<string, any> | null | undefined): string;

  export type HubMatch = { cities: string[]; trades: string[] };

  export function hubMatchForPath(route: string): HubMatch | null;

  export function listingMatchesHub(
    listing: { city?: string | null; state?: string | null; tradeText?: string | null },
    hub: HubMatch | null,
  ): boolean;

  export function chunkList<T>(items: T[], size?: number): T[][];
  export function sitemapFileNames(segment: string, count: number): string[];
  export function buildUrlSet(entries: Array<{ loc: string; lastmod?: string | null }>): string;
  export function buildSitemapIndex(locs: string[]): string;
  export function isoTimestamp(value: unknown): string | null;
}
