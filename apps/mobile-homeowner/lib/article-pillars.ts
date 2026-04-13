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
  if (blob.includes('renovation') || blob.includes('renovate') || slug.includes('renovation')) {
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

export function itemMatchesSearch(item: ArticleIndexItem, query: string): boolean {
  const raw = query.trim().toLowerCase();
  if (!raw) return true;
  const hay = `${item.title} ${item.excerpt} ${item.description} ${item.tags.join(' ')} ${item.href}`.toLowerCase();
  if (hay.includes(raw)) return true;
  const tokens = raw.split(/\s+/).filter((t) => t.length > 1);
  if (tokens.some((t) => hay.includes(t))) return true;
  if (raw.includes('renovat') && (hay.includes('renovat') || hay.includes('renovation'))) return true;
  return false;
}

export function filterByPillar<T extends ArticleIndexItem>(items: T[], filter: ArticlePillarFilter): T[] {
  if (filter === 'all') return items;
  return items.filter((i) => i.pillarKey === filter);
}

export const PILLAR_FILTER_CHIPS: { id: ArticlePillarFilter; label: string }[] = [
  { id: 'all', label: 'All' },
  ...ARTICLE_PILLAR_META.filter((p) => p.key !== 'general').map((p) => ({ id: p.key, label: p.chipLabel })),
];
