import { api } from '@/lib/api';
import type { ServiceExperienceContent } from '@/lib/service-experience-content';

export type CmsServicePageRecord = {
  id: string;
  slug: string;
  region: 'lagos' | 'nigeria';
  templateKind: string;
  metaTitle: string;
  summary: string;
  canonicalPath: string;
  payload: Omit<
    ServiceExperienceContent,
    'canonicalPath' | 'metaTitle' | 'summary'
  >;
  isPublished: boolean;
  publishedAt?: string | null;
  updatedAt: string;
};

export function mapCmsServicePageToExperience(page: CmsServicePageRecord): ServiceExperienceContent {
  return {
    canonicalPath: page.canonicalPath,
    metaTitle: page.metaTitle.includes('| BuildMyHouse')
      ? page.metaTitle
      : `${page.metaTitle} | BuildMyHouse`,
    summary: page.summary,
    ...page.payload,
    images: {
      ...page.payload.images,
      archive: [...(page.payload.images.archive || [])],
    },
    trustWords: [...(page.payload.trustWords || [])],
    engageCards: [...(page.payload.engageCards || [])],
    pillars: [...(page.payload.pillars || [])],
    stats: [...(page.payload.stats || [])],
    processSteps: [...(page.payload.processSteps || [])],
    fieldNotes: [...(page.payload.fieldNotes || [])],
    reviews: [...(page.payload.reviews || [])],
    faqs: [...(page.payload.faqs || [])],
    articleLinks: [...(page.payload.articleLinks || [])],
  };
}

export async function fetchPublishedServicePageByPath(path: string): Promise<CmsServicePageRecord | null> {
  try {
    const normalized = path.startsWith('/') ? path : `/${path}`;
    return await api.get<CmsServicePageRecord>(
      `/service-pages/by-path?path=${encodeURIComponent(normalized)}`,
    );
  } catch {
    return null;
  }
}

export async function fetchPublishedServicePages(): Promise<CmsServicePageRecord[]> {
  try {
    return await api.get<CmsServicePageRecord[]>('/service-pages');
  } catch {
    return [];
  }
}
