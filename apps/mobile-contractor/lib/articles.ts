import { api } from '@/lib/api';
import { normalizeStoredArticleContent } from '@/lib/article-content-normalize';

export type Article = {
  id: string;
  slug: string;
  title: string;
  description: string;
  excerpt: string;
  coverImageUrl: string;
  coverImageAlt: string;
  publishedAt: string;
  updatedAt: string;
  readingMinutes: number;
  tags: string[];
  canonicalPath: string;
  authorName: string;
  audience: 'homeowner' | 'gc';
  faqs: { question: string; answer: string }[];
  internalLinks: { label: string; href: string }[];
  content: Record<string, unknown>;
};

type RemoteArticle = Partial<Article> & { id: string; slug: string; title: string };

function normalizeRemoteArticle(input: RemoteArticle): Article {
  const slug = String(input.slug || '').trim();
  return {
    id: String(input.id || ''),
    slug,
    title: String(input.title || '').trim(),
    description: String(input.description || '').trim(),
    excerpt: String(input.excerpt || '').trim(),
    coverImageUrl: String(input.coverImageUrl || '').trim(),
    coverImageAlt: String(input.coverImageAlt || '').trim() || 'BuildMyHouse article image',
    publishedAt: String(input.publishedAt || input.updatedAt || new Date().toISOString()),
    updatedAt: String(input.updatedAt || input.publishedAt || new Date().toISOString()),
    readingMinutes: Math.max(1, Number(input.readingMinutes || 6)),
    tags: Array.isArray(input.tags) ? input.tags : [],
    canonicalPath: String(input.canonicalPath || `/articles/${slug}`),
    authorName: String(input.authorName || 'BuildMyHouse Editorial'),
    audience: input.audience === 'gc' ? 'gc' : 'homeowner',
    faqs: Array.isArray(input.faqs) ? input.faqs : [],
    internalLinks: Array.isArray(input.internalLinks) ? input.internalLinks : [],
    content: normalizeStoredArticleContent(input.content),
  };
}

export async function fetchPublishedArticles() {
  const remote = await api.get('/articles?audience=gc');
  if (!Array.isArray(remote)) return [];
  return remote.map((item) => normalizeRemoteArticle(item as RemoteArticle));
}

export async function fetchPublishedArticleBySlug(slug: string) {
  const remote = await api.get(`/articles/${encodeURIComponent(slug)}?audience=gc`);
  if (!remote) return undefined;
  return normalizeRemoteArticle(remote as RemoteArticle);
}
