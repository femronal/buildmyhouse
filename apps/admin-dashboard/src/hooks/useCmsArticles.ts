import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

export type CmsArticleFaq = { question: string; answer: string };
export type CmsArticleInternalLink = { label: string; href: string };

export interface CmsArticle {
  id: string;
  slug: string;
  title: string;
  description: string;
  excerpt: string;
  coverImageUrl: string;
  coverImageAlt: string;
  readingMinutes: number;
  tags: string[];
  authorName: string;
  canonicalPath: string;
  /** TipTap / ProseMirror JSON document */
  content: Record<string, unknown>;
  faqs: CmsArticleFaq[];
  internalLinks: CmsArticleInternalLink[];
  isPublished: boolean;
  publishedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export type UpsertCmsArticlePayload = Omit<CmsArticle, 'id' | 'createdAt' | 'updatedAt' | 'publishedAt'> & {
  isPublished?: boolean;
};

export function useCmsArticles() {
  const queryClient = useQueryClient();
  const queryKey = ['cms-articles', 'admin'];

  const query = useQuery({
    queryKey,
    queryFn: () => api.get<CmsArticle[]>('/articles/admin/list'),
  });

  const createMutation = useMutation({
    mutationFn: (payload: UpsertCmsArticlePayload) => api.post<CmsArticle>('/articles/admin', payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpsertCmsArticlePayload }) =>
      api.patch<CmsArticle>(`/articles/admin/${id}`, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
  });

  const publishMutation = useMutation({
    mutationFn: ({ id, isPublished }: { id: string; isPublished: boolean }) =>
      api.patch<CmsArticle>(`/articles/admin/${id}/publish`, { isPublished }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/articles/admin/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
  });

  return {
    articles: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
    createArticle: createMutation.mutateAsync,
    updateArticle: updateMutation.mutateAsync,
    publishArticle: publishMutation.mutateAsync,
    deleteArticle: deleteMutation.mutateAsync,
    isSaving: createMutation.isPending || updateMutation.isPending,
    isPublishing: publishMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}
