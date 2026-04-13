import type { Article, ArticlePillarKey } from '@/lib/articles';

export type { ArticlePillarKey } from '@/lib/articles';

export type ArticlePillarFilter = 'all' | ArticlePillarKey;

export type ArticleIndexItem = {
  key: string;
  pillarKey: ArticlePillarKey;
  slug: string;
  title: string;
  excerpt: string;
  description: string;
  coverImageUrl: string;
  coverImageAlt: string;
  readingMinutes: number;
  tags: string[];
  /** Route path for expo-router */
  href: string;
  isCuratedGuide?: boolean;
};

export const ARTICLE_PILLAR_META: {
  key: ArticlePillarKey;
  label: string;
  chipLabel: string;
  eyebrow: string;
  description: string;
  pillarPath: string;
}[] = [
  {
    key: 'build-abroad',
    label: 'Build in Nigeria from abroad',
    chipLabel: 'Build from abroad',
    eyebrow: 'Diaspora new build',
    description:
      'Plan funding, choose contractors, and run a new build remotely with milestones, evidence, and clearer accountability.',
    pillarPath: '/diaspora/build-in-nigeria-from-abroad',
  },
  {
    key: 'renovate-abroad',
    label: 'Renovate in Nigeria from abroad',
    chipLabel: 'Renovate from abroad',
    eyebrow: 'Diaspora renovation',
    description:
      'Scope upgrades, control spend, and track renovation progress from overseas without losing visibility on site.',
    pillarPath: '/diaspora/renovate-in-nigeria-from-abroad',
  },
  {
    key: 'lagos-compliance',
    label: 'Lagos permits & compliance',
    chipLabel: 'Lagos permits',
    eyebrow: 'Compliance & inspections',
    description:
      'Understand permit expectations, stage inspections, and how compliance reduces stop-work risk in Lagos.',
    pillarPath: '/guides/lagos-building-permits-and-stage-inspections',
  },
  {
    key: 'general',
    label: 'More guides',
    chipLabel: 'More topics',
    eyebrow: 'Resources',
    description: 'Additional articles and tips that support your project planning.',
    pillarPath: '/articles',
  },
];

const PILLAR_ORDER: ArticlePillarKey[] = ['build-abroad', 'renovate-abroad', 'lagos-compliance', 'general'];

export function inferArticlePillar(article: Article): ArticlePillarKey {
  if (article.articlePillar) return article.articlePillar;

  const slug = article.slug.toLowerCase();
  const blob = `${slug} ${article.title} ${article.description} ${article.excerpt} ${article.tags.join(' ')}`.toLowerCase();

  if (
    blob.includes('lagos') &&
    (blob.includes('permit') || blob.includes('compliance') || blob.includes('inspection'))
  ) {
    return 'lagos-compliance';
  }
  if (blob.includes('renovation') || blob.includes('renovate')) {
    return 'renovate-abroad';
  }
  if (blob.includes('diaspora') || blob.includes('from abroad') || blob.includes('remote')) {
    return 'build-abroad';
  }
  if (blob.includes('cost to build') || blob.includes('build a house') || blob.includes('construction')) {
    return 'build-abroad';
  }

  return 'general';
}

const CURATED_LAGOS_GUIDE: ArticleIndexItem = {
  key: 'curated-lagos-building-permits',
  pillarKey: 'lagos-compliance',
  slug: 'curated-lagos-building-permits',
  title: 'Lagos Building Permits & Stage Inspections',
  excerpt:
    'A practical guide to Lagos approvals, what to expect at stage inspections, and how to reduce compliance risk on your project.',
  description:
    'Lagos-focused permit and inspection guidance for homeowners and diaspora clients planning builds or major renovations.',
  coverImageUrl:
    'https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&w=1200&q=80',
  coverImageAlt: 'Architectural plans and building documentation on a desk',
  readingMinutes: 12,
  tags: ['lagos', 'permits', 'compliance'],
  href: '/guides/lagos-building-permits-and-stage-inspections',
  isCuratedGuide: true,
};

export function articleToIndexItem(article: Article): ArticleIndexItem {
  const pillarKey = inferArticlePillar(article);
  return {
    key: article.slug,
    pillarKey,
    slug: article.slug,
    title: article.title,
    excerpt: article.excerpt,
    description: article.description,
    coverImageUrl: article.coverImageUrl,
    coverImageAlt: article.coverImageAlt,
    readingMinutes: article.readingMinutes,
    tags: article.tags,
    href: article.canonicalPath.startsWith('/') ? article.canonicalPath : `/articles/${article.slug}`,
  };
}

/** Articles as index rows plus the flagship Lagos guide (hosted as a guide route, not /articles/). */
export function buildArticleIndexItems(articles: Article[]): ArticleIndexItem[] {
  const fromArticles = articles.map(articleToIndexItem);
  const hasLagosSlug = fromArticles.some(
    (i) =>
      i.href.includes('lagos-building-permits') ||
      i.title.toLowerCase().includes('lagos') && i.title.toLowerCase().includes('permit'),
  );
  if (hasLagosSlug) {
    return fromArticles;
  }
  return [...fromArticles, CURATED_LAGOS_GUIDE];
}

export function itemMatchesSearch(item: ArticleIndexItem, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  const hay = `${item.title} ${item.excerpt} ${item.description} ${item.tags.join(' ')}`.toLowerCase();
  return hay.includes(q);
}

export function filterByPillar(items: ArticleIndexItem[], filter: ArticlePillarFilter): ArticleIndexItem[] {
  if (filter === 'all') return items;
  return items.filter((i) => i.pillarKey === filter);
}

export function groupItemsByPillar(items: ArticleIndexItem[]): Map<ArticlePillarKey, ArticleIndexItem[]> {
  const map = new Map<ArticlePillarKey, ArticleIndexItem[]>();
  for (const key of PILLAR_ORDER) {
    map.set(key, []);
  }
  for (const item of items) {
    const list = map.get(item.pillarKey) ?? map.get('general')!;
    list.push(item);
  }
  return map;
}

export const PILLAR_FILTER_CHIPS: { id: ArticlePillarFilter; label: string }[] = [
  { id: 'all', label: 'All' },
  ...ARTICLE_PILLAR_META.filter((p) => p.key !== 'general').map((p) => ({ id: p.key, label: p.chipLabel })),
];
