import { InternalLinkItem } from '@/components/seo/InternalLinksBlock';
import { api } from '@/lib/api';

export type ArticleBlock =
  | { type: 'heading'; text: string }
  | { type: 'paragraph'; text: string }
  | { type: 'bullets'; items: string[] }
  | { type: 'quote'; text: string; author?: string }
  | { type: 'image'; src: string; alt: string; caption?: string }
  | { type: 'youtube'; videoId: string; title: string; caption?: string }
  | { type: 'cta'; label: string; href: string; note?: string };

export type ArticleFaqItem = {
  question: string;
  answer: string;
};

export type Article = {
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
  faqs: ArticleFaqItem[];
  internalLinks: InternalLinkItem[];
  blocks: ArticleBlock[];
};

type RemoteArticle = {
  id: string;
  slug: string;
  title: string;
  description: string;
  excerpt: string;
  coverImageUrl: string;
  coverImageAlt: string;
  publishedAt?: string | null;
  updatedAt?: string | null;
  readingMinutes?: number;
  tags?: string[];
  canonicalPath?: string;
  authorName?: string;
  faqs?: Array<{ question: string; answer: string }>;
  internalLinks?: InternalLinkItem[];
  blocks?: ArticleBlock[];
};

const WEB_URL = (process.env.EXPO_PUBLIC_WEB_URL || 'https://buildmyhouse.app').replace(/\/+$/, '');

const organizationSchema = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'BuildMyHouse',
  url: WEB_URL,
};

export const articles: Article[] = [
  {
    slug: 'cost-to-build-house-in-nigeria-2026',
    title: 'Cost to Build a House in Nigeria (2026 Guide)',
    description:
      'A practical 2026 guide to building costs in Nigeria, with budget ranges, hidden expenses, and a safer execution workflow for local and diaspora homeowners.',
    excerpt:
      'Understand realistic budget ranges, common cost traps, and how to stage your project safely from planning to finishing.',
    coverImageUrl: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?q=80&w=1800&auto=format&fit=crop',
    coverImageAlt: 'Construction workers and a partially completed house',
    publishedAt: '2026-03-24',
    updatedAt: '2026-03-24',
    readingMinutes: 8,
    tags: ['construction', 'cost guide', 'nigeria'],
    canonicalPath: '/articles/cost-to-build-house-in-nigeria-2026',
    authorName: 'BuildMyHouse Editorial',
    faqs: [
      {
        question: 'Can I build in phases to reduce risk?',
        answer:
          'Yes. A phased plan with milestone approvals helps reduce cashflow pressure and lowers execution risk.',
      },
      {
        question: 'Do costs differ by city?',
        answer:
          'Yes. Land context, labor pricing, and logistics differ across Lagos, Abuja, Port Harcourt, and other markets.',
      },
    ],
    internalLinks: [
      { label: 'House Construction in Nigeria', href: '/construction/nigeria' },
      { label: 'House Construction in Lagos', href: '/construction/lagos' },
      { label: 'Start a New Project', href: '/location?mode=explore' },
    ],
    blocks: [
      {
        type: 'paragraph',
        text: 'Building a home in Nigeria can be rewarding, but many homeowners underestimate costs and overestimate delivery speed. A clear budget framework helps you avoid expensive surprises.',
      },
      { type: 'heading', text: 'Typical cost drivers' },
      {
        type: 'bullets',
        items: [
          'Location-specific labor and logistics costs',
          'Foundation and structural complexity',
          'Material quality choices (basic, mid-range, premium)',
          'Power, water, fencing, and finishing scope',
          'Professional fees, approvals, and contingency',
        ],
      },
      {
        type: 'image',
        src: 'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?q=80&w=1600&auto=format&fit=crop',
        alt: 'House construction structure with concrete columns',
        caption: 'Plan a realistic budget before mobilization to avoid stoppages.',
      },
      { type: 'heading', text: 'How to stay in control' },
      {
        type: 'bullets',
        items: [
          'Approve a clear scope before contractor engagement',
          'Release funds by milestone, not by pressure',
          'Track material usage, labor progress, and stage evidence',
          'Keep a contingency reserve for unavoidable changes',
        ],
      },
      {
        type: 'youtube',
        videoId: 'rM5MfQY8v7Q',
        title: 'How to estimate house construction costs',
        caption: 'Use video explainers to simplify technical decisions for your family.',
      },
      {
        type: 'quote',
        text: 'A good construction budget is not just about affordability. It is about sequencing risk and keeping control until completion.',
        author: 'BuildMyHouse Team',
      },
      {
        type: 'cta',
        label: 'Start your project budget plan',
        href: '/location?mode=explore',
        note: 'Share your location and project intent to get started.',
      },
    ],
  },
  {
    slug: 'renovation-checklist-for-homeowners-nigeria',
    title: 'Renovation Checklist for Homeowners in Nigeria',
    description:
      'A homeowner-friendly renovation checklist for Nigeria covering planning, contractor vetting, materials, and progress tracking.',
    excerpt:
      'Use this checklist to structure your renovation from scope definition to handover and avoid rework.',
    coverImageUrl: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?q=80&w=1800&auto=format&fit=crop',
    coverImageAlt: 'Interior renovation with tools and fresh paint',
    publishedAt: '2026-03-24',
    updatedAt: '2026-03-24',
    readingMinutes: 7,
    tags: ['renovation', 'homeowner guide', 'nigeria'],
    canonicalPath: '/articles/renovation-checklist-for-homeowners-nigeria',
    authorName: 'BuildMyHouse Editorial',
    faqs: [
      {
        question: 'Should I move out during renovation?',
        answer:
          'It depends on project scope. For full-home or heavy structural work, temporary relocation is usually safer.',
      },
      {
        question: 'How do I avoid renovation cost overruns?',
        answer:
          'Lock major scope items early, buy priority materials on time, and enforce stage-based approvals.',
      },
    ],
    internalLinks: [
      { label: 'Renovation in Nigeria', href: '/renovation/nigeria' },
      { label: 'Interior Design in Nigeria', href: '/interior-design/nigeria' },
      { label: 'Talk to BuildMyHouse', href: '/location?mode=explore' },
    ],
    blocks: [
      {
        type: 'paragraph',
        text: 'Renovation projects fail mostly from unclear scope, weak coordination, and delayed decisions. A checklist-driven process helps you avoid chaos.',
      },
      { type: 'heading', text: 'Before work starts' },
      {
        type: 'bullets',
        items: [
          'Define what must change vs what is optional',
          'Set your budget ceiling and contingency',
          'Confirm measurement, material specs, and finish standards',
          'Agree realistic milestones and delivery dates',
        ],
      },
      {
        type: 'image',
        src: 'https://images.unsplash.com/photo-1616594039964-3e4f8f7db8f5?q=80&w=1600&auto=format&fit=crop',
        alt: 'Home renovation layout planning on a tablet',
        caption: 'Early planning decisions prevent expensive rework.',
      },
      { type: 'heading', text: 'During execution' },
      {
        type: 'bullets',
        items: [
          'Track stage deliverables and quality checks',
          'Approve changes in writing before execution',
          'Keep photo/video records of hidden works',
          'Review budget impact before any variation',
        ],
      },
      {
        type: 'youtube',
        videoId: '8v3lRzC_2mY',
        title: 'Renovation planning walkthrough',
        caption: 'A visual walkthrough can help your family align expectations faster.',
      },
      {
        type: 'cta',
        label: 'Start your renovation project',
        href: '/location?mode=explore',
      },
    ],
  },
  {
    slug: 'diaspora-guide-build-in-nigeria-from-abroad',
    title: 'Diaspora Guide: How to Build in Nigeria from Abroad',
    description:
      'A practical guide for diaspora homeowners in the UK, USA/Canada, and UAE to build safely in Nigeria with better visibility and control.',
    excerpt:
      'Learn how to reduce remote-project risk using milestone approvals, documentation, and structured communication.',
    coverImageUrl: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=1800&auto=format&fit=crop',
    coverImageAlt: 'City skyline and modern residential buildings',
    publishedAt: '2026-03-24',
    updatedAt: '2026-03-24',
    readingMinutes: 9,
    tags: ['diaspora', 'construction', 'remote project'],
    canonicalPath: '/articles/diaspora-guide-build-in-nigeria-from-abroad',
    authorName: 'BuildMyHouse Editorial',
    faqs: [
      {
        question: 'Can I manage my project without frequent flights?',
        answer:
          'Yes. With stage-level documentation and milestone approvals, you can retain strong control remotely.',
      },
      {
        question: 'What is the biggest risk for diaspora projects?',
        answer:
          'Unstructured fund release and weak progress evidence are common risks. Use milestone-based governance.',
      },
    ],
    internalLinks: [
      { label: 'Build in Nigeria from the UK', href: '/diaspora/build-in-nigeria-from-uk' },
      { label: 'Build in Nigeria from USA/Canada', href: '/diaspora/build-in-nigeria-from-usa-canada' },
      { label: 'Build in Nigeria from UAE', href: '/diaspora/build-in-nigeria-from-uae' },
    ],
    blocks: [
      {
        type: 'paragraph',
        text: 'Remote projects are possible, but trust alone is not a process. You need clear milestones, verifiable updates, and disciplined payment controls.',
      },
      { type: 'heading', text: 'Remote-control framework' },
      {
        type: 'bullets',
        items: [
          'Define project scope and expected outcomes upfront',
          'Use milestone-based approvals before releasing funds',
          'Require visual evidence and structured progress notes',
          'Escalate early when quality or timeline drifts',
        ],
      },
      {
        type: 'image',
        src: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?q=80&w=1600&auto=format&fit=crop',
        alt: 'Remote project management meeting',
        caption: 'Remote visibility is strongest when updates are structured and periodic.',
      },
      {
        type: 'youtube',
        videoId: 'S6xEwQg7m3Q',
        title: 'Managing construction projects remotely',
      },
      {
        type: 'quote',
        text: 'Remote construction success is built on process discipline, not luck.',
      },
      {
        type: 'cta',
        label: 'Start a diaspora project in Nigeria',
        href: '/location?mode=explore',
      },
    ],
  },
];

function normalizeRemoteArticle(input: RemoteArticle): Article {
  const slug = String(input.slug || '').trim();
  return {
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
    faqs: Array.isArray(input.faqs) ? input.faqs : [],
    internalLinks: Array.isArray(input.internalLinks) ? input.internalLinks : [],
    blocks: Array.isArray(input.blocks) ? input.blocks : [],
  };
}

export function getArticleBySlug(slug?: string) {
  if (!slug) return undefined;
  return articles.find((article) => article.slug === slug);
}

export async function fetchPublishedArticles() {
  const remote = await api.get('/articles');
  if (!Array.isArray(remote)) return [];
  return remote.map((item) => normalizeRemoteArticle(item as RemoteArticle));
}

export async function fetchPublishedArticleBySlug(slug: string) {
  const remote = await api.get(`/articles/${encodeURIComponent(slug)}`);
  if (!remote) return undefined;
  return normalizeRemoteArticle(remote as RemoteArticle);
}

export function getAllArticleSlugs() {
  return articles.map((article) => article.slug);
}

export function getArticlePaths() {
  return articles.map((article) => article.canonicalPath);
}

export function getArticleSchema(article: Article) {
  const articleUrl = `${WEB_URL}${article.canonicalPath}`;
  const videoBlocks = article.blocks.filter((block) => block.type === 'youtube');

  const schema: Record<string, any>[] = [
    organizationSchema,
    {
      '@context': 'https://schema.org',
      '@type': 'BlogPosting',
      mainEntityOfPage: articleUrl,
      headline: article.title,
      description: article.description,
      image: [article.coverImageUrl],
      datePublished: article.publishedAt,
      dateModified: article.updatedAt,
      author: {
        '@type': 'Organization',
        name: article.authorName,
      },
      publisher: {
        '@type': 'Organization',
        name: 'BuildMyHouse',
        logo: {
          '@type': 'ImageObject',
          url: `${WEB_URL}/assets/images/icon.png`,
        },
      },
    },
    {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: article.faqs.map((item) => ({
        '@type': 'Question',
        name: item.question,
        acceptedAnswer: {
          '@type': 'Answer',
          text: item.answer,
        },
      })),
    },
  ];

  for (const block of videoBlocks) {
    schema.push({
      '@context': 'https://schema.org',
      '@type': 'VideoObject',
      name: block.title,
      description: block.caption || article.description,
      embedUrl: `https://www.youtube.com/embed/${block.videoId}`,
      uploadDate: article.updatedAt,
      thumbnailUrl: `https://i.ytimg.com/vi/${block.videoId}/hqdefault.jpg`,
    });
  }

  return schema;
}
