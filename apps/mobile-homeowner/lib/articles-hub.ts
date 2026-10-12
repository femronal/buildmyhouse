import { useEffect, useState } from 'react';
import { articles as bundledArticles, fetchPublishedArticles, type Article } from '@/lib/articles';
import { inferArticlePillar, ARTICLE_PILLAR_META } from '@/lib/article-pillars';

export const ARTICLES_PAGE_SIZE = 9;

export type BlogTopic = {
  slug: string;
  label: string;
  description: string;
};

export const BLOG_TOPICS: BlogTopic[] = ARTICLE_PILLAR_META.map((topic) => ({
  slug: topic.key,
  label: topic.chipLabel,
  description: topic.description,
}));

export type BlogCard = {
  slug: string;
  title: string;
  excerpt: string;
  description: string;
  href: string;
  coverImageUrl: string;
  coverImageAlt: string;
  publishedAt: string;
  updatedAt: string;
  readingMinutes: number;
  authorName: string;
  topicSlug: string;
  topicLabel: string;
};

export function topicBySlug(slug?: string) {
  return BLOG_TOPICS.find((topic) => topic.slug === slug);
}

export function topicHref(slug: string) {
  return `/articles/topic/${slug}`;
}

export function articlesPageHref(page: number) {
  return page <= 1 ? '/articles' : `/articles/page/${page}`;
}

export function topicPageHref(slug: string, page: number) {
  if (page <= 1) return topicHref(slug);
  return `/articles/topic/${slug}/page/${page}`;
}

export function articleToBlogCard(article: Article): BlogCard {
  const topicSlug = article.articlePillar ?? inferArticlePillar(article);
  const topic = topicBySlug(topicSlug);
  const href = article.canonicalPath.startsWith('/')
    ? article.canonicalPath
    : `/articles/${article.slug}`;
  return {
    slug: article.slug,
    title: article.title,
    excerpt: article.excerpt,
    description: article.description,
    href,
    coverImageUrl: article.coverImageUrl,
    coverImageAlt: article.coverImageAlt || article.title,
    publishedAt: article.publishedAt,
    updatedAt: article.updatedAt || article.publishedAt,
    readingMinutes: article.readingMinutes,
    authorName: article.authorName || 'BuildMyHouse Editorial',
    topicSlug,
    topicLabel: topic?.label || 'Guides',
  };
}

export function sortBlogCards(cards: BlogCard[]) {
  return [...cards].sort((left, right) => right.publishedAt.localeCompare(left.publishedAt));
}

export function filterBlogCards(cards: BlogCard[], topicSlug?: string, query = '') {
  const topicFiltered = topicSlug ? cards.filter((card) => card.topicSlug === topicSlug) : cards;
  const raw = query.trim().toLowerCase();
  if (!raw) return topicFiltered;
  return topicFiltered.filter((card) => {
    const hay = `${card.title} ${card.excerpt} ${card.description} ${card.topicLabel}`.toLowerCase();
    return hay.includes(raw);
  });
}

export function paginateBlogCards(cards: BlogCard[], page: number, pageSize = ARTICLES_PAGE_SIZE) {
  const totalPages = Math.max(1, Math.ceil(cards.length / pageSize));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const start = (safePage - 1) * pageSize;
  return {
    page: safePage,
    totalPages,
    items: cards.slice(start, start + pageSize),
  };
}

export function relatedBlogCards(cards: BlogCard[], current: BlogCard, limit = 3) {
  const sameTopic = cards.filter((card) => card.slug !== current.slug && card.topicSlug === current.topicSlug);
  const rest = cards.filter((card) => card.slug !== current.slug && card.topicSlug !== current.topicSlug);
  return [...sameTopic, ...rest].slice(0, limit);
}

export function formatArticleDate(value?: string) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value.slice(0, 10);
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

/** Long-form guides that live at article URLs but are not CMS records. */
export const STATIC_GUIDE_CARDS: BlogCard[] = [
  {
    slug: 'buying-property-lagos-from-abroad-due-diligence',
    title: "The Building Is There. That Doesn't Mean You Should Buy It.",
    excerpt:
      'Buying property in Lagos from abroad requires more than checking the title. This guide explains how to investigate ownership, approvals, building condition, flooding, hidden repair costs and transaction readiness before committing your money.',
    description:
      'Buying a house or unfinished building in Lagos from abroad? Learn how to verify ownership, approvals, structural condition, drainage and hidden risks before you commit.',
    href: '/articles/buying-property-lagos-from-abroad-due-diligence',
    coverImageUrl: 'https://buildmyhouse.app/engineer-at-buildmyhouse.png',
    coverImageAlt: 'Illustration of a property purchase being reviewed and approved',
    publishedAt: '2026-10-06',
    updatedAt: '2026-10-06',
    readingMinutes: 16,
    authorName: 'BuildMyHouse Editorial',
    topicSlug: 'lagos-compliance',
    topicLabel: 'Lagos permits',
  },
  {
    slug: 'developer-joint-venture-unfinished-building-nigeria',
    title: 'Your Building Stopped Because the Money Stopped. That Does Not Mean You Should Give It Away.',
    excerpt:
      'Land or an unfinished building is not automatically a development deal. This guide explains financing, phased completion, sharing a project with a developer, and how to check the property before you sign anything away.',
    description:
      'Have land or an unfinished building but not enough money to complete it? Understand developer partnerships, Joint Ventures, Build–Operate–Transfer, financing and how to protect your property before signing a deal.',
    href: '/articles/developer-joint-venture-unfinished-building-nigeria',
    coverImageUrl: 'https://buildmyhouse.app/engineer-at-buildmyhouse.png',
    coverImageAlt: 'Illustration of an unfinished building being reviewed before a development decision',
    publishedAt: '2026-10-09',
    updatedAt: '2026-10-09',
    readingMinutes: 18,
    authorName: 'BuildMyHouse Editorial',
    topicSlug: 'general',
    topicLabel: 'More topics',
  },
];

export function mergeBlogCards(remote?: Article[] | null) {
  const byHref = new Map<string, BlogCard>();
  for (const card of [...STATIC_GUIDE_CARDS, ...bundledArticles.map(articleToBlogCard)]) {
    byHref.set(card.href, card);
  }
  for (const article of remote || []) {
    if (article.audience === 'gc') continue;
    const card = articleToBlogCard(article);
    if (!card.href.startsWith('/articles/')) continue;
    byHref.set(card.href, card);
  }
  return sortBlogCards([...byHref.values()]);
}

export function usePublishedBlogCards() {
  const [remote, setRemote] = useState<Article[] | null>(null);

  useEffect(() => {
    let active = true;
    fetchPublishedArticles()
      .then((items) => {
        if (active && items.length > 0) setRemote(items);
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, []);

  return mergeBlogCards(remote);
}

export function blogListJsonLd(cards: BlogCard[], canonicalPath: string, name: string, description: string) {
  const webBase = (process.env.EXPO_PUBLIC_WEB_URL || 'https://buildmyhouse.app').replace(/\/+$/, '');
  const url = `${webBase}${canonicalPath}`;
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Blog',
        '@id': `${url}#blog`,
        name,
        description,
        url,
        publisher: { '@type': 'Organization', name: 'BuildMyHouse', url: webBase },
      },
      {
        '@type': 'ItemList',
        itemListElement: cards.map((card, index) => ({
          '@type': 'ListItem',
          position: index + 1,
          url: `${webBase}${card.href}`,
          name: card.title,
        })),
      },
    ],
  };
}
