/**
 * Marketing asset URLs for pillar heroes (must match list thumbnails on /articles).
 * Merge layer combines CMS `/articles/*` with long-form in-app guides.
 */
import type { Article } from '@/lib/articles';
import { articleToIndexItem, type ArticleIndexItem, type ArticlePillarKey } from '@/lib/article-pillars';
import { diasporaBuildNigeriaFromAbroadPageContent as buildPillar } from '@/lib/diaspora-build-nigeria-from-abroad-pillar';
import { diasporaRenovateNigeriaFromAbroadPageContent as renovatePillar } from '@/lib/diaspora-renovate-nigeria-from-abroad-content';
import { lagosBuildingPermitsAndStageInspectionsPageContent as lagosGuide } from '@/lib/lagos-building-permits-and-stage-inspections-content';
import { getSeoPageContent } from '@/lib/seo-pages';

const webBase = () => (process.env.EXPO_PUBLIC_WEB_URL || 'https://buildmyhouse.app').replace(/\/+$/, '');

export function marketingImageAsset(fileName: string): string {
  return `${webBase()}/assets/images/${fileName}`;
}

export const HOMEPAGE_PUBLISHED_COVERS = {
  buildAbroad: marketingImageAsset('cover-image-for-blog-1.png'),
  renovateAbroad: marketingImageAsset('renovate-in-nigeria-from-abroad.png'),
  lagosPermits: marketingImageAsset('lagos-building-permits-image.png'),
} as const;

/** Landing guides without a bundled hero — list + page use the same URI. */
export const SEO_LANDING_COVERS = {
  mistakes:
    'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=1200&q=80',
  contractor:
    'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=1200&q=80',
  land: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=1200&q=80',
} as const;

export type PublishedIndexItem = ArticleIndexItem & { publishedAt: string };

const RESERVED_LONG_FORM_HREFS = new Set<string>([
  '/diaspora/build-in-nigeria-from-abroad',
  '/diaspora/renovate-in-nigeria-from-abroad',
  '/guides/lagos-building-permits-and-stage-inspections',
]);

function guideRow(
  key: string,
  slug: string,
  pillarKey: ArticlePillarKey,
  href: string,
  title: string,
  excerpt: string,
  description: string,
  coverImageUrl: string,
  coverImageAlt: string,
  readingMinutes: number,
  tags: string[],
  publishedAt: string,
): PublishedIndexItem {
  return {
    key,
    slug,
    pillarKey,
    href,
    title,
    excerpt,
    description,
    coverImageUrl,
    coverImageAlt,
    readingMinutes,
    tags,
    publishedAt,
    isCuratedGuide: href.startsWith('/guides/') || href.startsWith('/diaspora/'),
  };
}

export function getStaticPublishedCatalogItems(): PublishedIndexItem[] {
  const mistakes = getSeoPageContent('mistakesNigeriansDiasporaBuilding');
  const contractor = getSeoPageContent('howToChooseGeneralContractorNigeria');
  const land = getSeoPageContent('landVerificationNigeriaGuide');

  return [
    guideRow(
      'pillar-build-abroad',
      'pillar-build-abroad',
      'build-abroad',
      '/diaspora/build-in-nigeria-from-abroad',
      buildPillar.hero.title,
      buildPillar.hero.description,
      buildPillar.seo.description,
      HOMEPAGE_PUBLISHED_COVERS.buildAbroad,
      buildPillar.hero.title,
      14,
      [buildPillar.hero.eyebrow],
      '2026-04-01',
    ),
    guideRow(
      'pillar-renovate-abroad',
      'pillar-renovate-abroad',
      'renovate-abroad',
      '/diaspora/renovate-in-nigeria-from-abroad',
      renovatePillar.hero.title,
      renovatePillar.hero.description,
      renovatePillar.seo.description,
      HOMEPAGE_PUBLISHED_COVERS.renovateAbroad,
      renovatePillar.hero.title,
      13,
      [renovatePillar.hero.eyebrow],
      '2026-04-02',
    ),
    guideRow(
      'guide-lagos-permits',
      'guide-lagos-permits',
      'lagos-compliance',
      '/guides/lagos-building-permits-and-stage-inspections',
      lagosGuide.hero.title,
      lagosGuide.hero.description,
      lagosGuide.seo.description,
      HOMEPAGE_PUBLISHED_COVERS.lagosPermits,
      lagosGuide.hero.title,
      12,
      [lagosGuide.hero.eyebrow],
      '2026-04-03',
    ),
    guideRow(
      'seo-mistakes-diaspora',
      'seo-mistakes-diaspora',
      'build-abroad',
      mistakes.canonicalPath,
      mistakes.heroTitle,
      mistakes.heroDescription,
      mistakes.description,
      SEO_LANDING_COVERS.mistakes,
      mistakes.heroTitle,
      9,
      [mistakes.eyebrow],
      '2026-03-20',
    ),
    guideRow(
      'seo-contractor-nigeria',
      'seo-contractor-nigeria',
      'build-abroad',
      contractor.canonicalPath,
      contractor.heroTitle,
      contractor.heroDescription,
      contractor.description,
      SEO_LANDING_COVERS.contractor,
      contractor.heroTitle,
      8,
      [contractor.eyebrow],
      '2026-03-18',
    ),
    guideRow(
      'seo-land-verification',
      'seo-land-verification',
      'general',
      land.canonicalPath,
      land.heroTitle,
      land.heroDescription,
      land.description,
      SEO_LANDING_COVERS.land,
      land.heroTitle,
      10,
      [land.eyebrow],
      '2026-03-15',
    ),
  ];
}

/** Full `/articles` dataset: CMS articles plus flagship guides (deduped by `href`). */
export function mergePublishedIndexItems(articles: Article[]): PublishedIndexItem[] {
  const byHref = new Map<string, PublishedIndexItem>();

  for (const article of articles) {
    const row = articleToIndexItem(article);
    const href = row.href;
    if (RESERVED_LONG_FORM_HREFS.has(href)) {
      continue;
    }
    byHref.set(href, { ...row, publishedAt: article.publishedAt });
  }

  for (const staticRow of getStaticPublishedCatalogItems()) {
    byHref.set(staticRow.href, staticRow);
  }

  return Array.from(byHref.values()).sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
}
