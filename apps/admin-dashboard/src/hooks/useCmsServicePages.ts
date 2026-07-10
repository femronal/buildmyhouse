import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

export type ServicePageRegion = 'lagos' | 'nigeria';

export type ServicePageImageSet = {
  heroMain: string;
  heroAccent: string;
  strip: string;
  parallaxA: string;
  parallaxB: string;
  workMask: string;
  archive: string[];
};

export type ServicePagePayload = {
  locationLabel: string;
  headline: string;
  heroLead: string;
  heroMeta: string;
  trustWords: string[];
  pillarsHeadline: string;
  archiveTitle: string;
  fieldNotesHeading: string;
  workTitle: string;
  workBody: string;
  engageIntro: string;
  contactPrompt: string;
  engageCards: Array<{
    title: string;
    subtitle: string;
    badge?: string;
    features: string[];
  }>;
  pillars: Array<{ title: string; body: string }>;
  stats: Array<{ value: string; label: string }>;
  processSteps: Array<{ label: string; title: string; body: string }>;
  fieldNotes: Array<{ number: string; title: string; body: string }>;
  reviews: Array<{ quote: string; name: string; detail: string }>;
  faqs: Array<{ question: string; answer: string }>;
  articleLinks: Array<{ label: string; href: string }>;
  images: ServicePageImageSet;
  primaryCta: { label: string; href: string };
  secondaryCta: { label: string; href: string };
};

export interface CmsServicePage {
  id: string;
  slug: string;
  region: ServicePageRegion;
  templateKind: string;
  metaTitle: string;
  summary: string;
  canonicalPath: string;
  payload: ServicePagePayload;
  isPublished: boolean;
  publishedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export type UpsertCmsServicePagePayload = {
  slug: string;
  region: ServicePageRegion;
  templateKind: string;
  metaTitle: string;
  summary: string;
  canonicalPath?: string;
  payload: ServicePagePayload;
  isPublished?: boolean;
};

export const SERVICE_PAGE_TEMPLATE_KINDS = [
  'plumbing-repair',
  'electrical-repair',
  'roof-leak-repair',
  'drainage-repair',
  'painting-services',
  'property-maintenance',
  'window-repair',
  'pumping-machine-repair',
  'fan-repair',
  'rechargeable-fan-repair',
  'bathroom-repair',
  'kitchen-renovation',
  'home-renovation',
  'general-contractors',
] as const;

export function useCmsServicePages(region?: ServicePageRegion) {
  const queryClient = useQueryClient();
  const queryKey = ['cms-service-pages', 'admin', region || 'all'];

  const query = useQuery({
    queryKey,
    queryFn: () =>
      api.get<CmsServicePage[]>(
        `/service-pages/admin/list${region ? `?region=${encodeURIComponent(region)}` : ''}`,
      ),
  });

  const createMutation = useMutation({
    mutationFn: (payload: UpsertCmsServicePagePayload) =>
      api.post<CmsServicePage>('/service-pages/admin', payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
  });

  const createFromTemplateMutation = useMutation({
    mutationFn: (payload: {
      slug: string;
      region: ServicePageRegion;
      templateKind: string;
      metaTitle?: string;
      summary?: string;
    }) => api.post<CmsServicePage>('/service-pages/admin/from-template', payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
  });

  const generateWithAiMutation = useMutation({
    mutationFn: (payload: {
      serviceName: string;
      region: ServicePageRegion;
      slug?: string;
      templateKind?: string;
    }) =>
      api.post<{
        metaTitle: string;
        summary: string;
        canonicalPath: string;
        slug: string;
        region: ServicePageRegion;
        templateKind: string;
        payload: ServicePagePayload;
        generatedByAi: boolean;
      }>('/service-pages/admin/generate', payload),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpsertCmsServicePagePayload }) =>
      api.patch<CmsServicePage>(`/service-pages/admin/${id}`, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
  });

  const publishMutation = useMutation({
    mutationFn: ({ id, isPublished }: { id: string; isPublished: boolean }) =>
      api.patch<CmsServicePage>(`/service-pages/admin/${id}/publish`, { isPublished }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/service-pages/admin/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
  });

  return {
    pages: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
    createPage: createMutation.mutateAsync,
    createPageFromTemplate: createFromTemplateMutation.mutateAsync,
    generateWithAi: generateWithAiMutation.mutateAsync,
    isGeneratingWithAi: generateWithAiMutation.isPending,
    updatePage: updateMutation.mutateAsync,
    publishPage: publishMutation.mutateAsync,
    deletePage: deleteMutation.mutateAsync,
    isDeleting: deleteMutation.isPending,
  };
}

export function useCmsServicePage(id?: string | null) {
  return useQuery({
    queryKey: ['cms-service-page', id],
    enabled: Boolean(id),
    queryFn: () => api.get<CmsServicePage>(`/service-pages/admin/${id}`),
  });
}

export function useServicePageTemplate(
  templateKind?: string,
  region?: ServicePageRegion,
  slug?: string,
) {
  return useQuery({
    queryKey: ['cms-service-page-template', templateKind, region, slug],
    enabled: Boolean(templateKind && region),
    queryFn: () =>
      api.get<{
        metaTitle: string;
        summary: string;
        canonicalPath: string;
        payload: ServicePagePayload;
      }>(
        `/service-pages/admin/template/${encodeURIComponent(templateKind || '')}?region=${encodeURIComponent(region || 'lagos')}&slug=${encodeURIComponent(slug || templateKind || '')}`,
      ),
  });
}
