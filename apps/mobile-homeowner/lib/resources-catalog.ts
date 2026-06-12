import type { Article } from '@/lib/articles';
import { itemMatchesSearch } from '@/lib/article-pillars';
import { buildInNigeriaFromUkPageContent as ukBuild } from '@/lib/build-in-nigeria-from-uk-content';
import { contractorVettingNigeriaDiasporaPageContent as contractorGuide } from '@/lib/contractor-vetting-nigeria-diaspora-content';
import { diasporaUsaCanadaLandingPageContent as usaCanadaBuild } from '@/lib/diaspora-usa-canada-landing-content';
import { ukRenovateParentsHousePageContent as ukRenovateParents } from '@/lib/diaspora-uk-renovate-parents-house-content';
import { finishAbandonedHouseNigeriaFromAbroadPageContent as finishAbandoned } from '@/lib/finish-abandoned-house-nigeria-from-abroad-content';
import { lagosPermitStarterChecklistDownloadPageContent as lagosChecklist } from '@/lib/lagos-permit-starter-checklist-download-content';
import { milestonePaymentScheduleBuilderPageContent as milestoneTool } from '@/lib/milestone-payment-schedule-builder-content';
import {
  mergePublishedIndexItems,
  publishedIndexCoverSource,
  type PublishedIndexItem,
} from '@/lib/published-content-catalog';
import { remoteRenovationScopeWorksheetDownloadPageContent as renovationWorksheet } from '@/lib/remote-renovation-scope-worksheet-download-content';
import { renovationBudgetPlannerPageContent as renovationTool } from '@/lib/renovation-budget-planner-content';
import { renovationPermitLagosRepairVsRenovationPageContent as lagosRepairGuide } from '@/lib/renovation-permit-lagos-repair-vs-renovation-content';
import { buildCanonical } from '@/lib/seo-schema';
import { getSeoPageContent } from '@/lib/seo-pages';
import { weeklySiteUpdatesStandardPageContent as weeklyUpdates } from '@/lib/weekly-site-updates-standard-content';

export type ResourceContentType =
  | 'pillar'
  | 'guide'
  | 'seo-guide'
  | 'article'
  | 'tool'
  | 'download'
  | 'diaspora'
  | 'demo';

export type ResourceTopicKey = string;

export type ResourceIndexItem = PublishedIndexItem & {
  contentType: ResourceContentType;
  topicKeys: ResourceTopicKey[];
  badgeLabel?: string;
};

export type ResourceTopicFilter = string;

export type ResourceSidebarTopic = {
  key: string;
  label: string;
  hint: string;
};

export const RESOURCE_SIDEBAR_TOPICS: ResourceSidebarTopic[] = [
  {
    key: 'start-here',
    label: 'Start here',
    hint: 'Flagship guides for diaspora homeowners',
  },
  {
    key: 'build-abroad',
    label: 'Build from abroad',
    hint: 'New builds, land checks, and remote execution',
  },
  {
    key: 'renovate-abroad',
    label: 'Renovate from abroad',
    hint: 'Scope, budget, and renovation control',
  },
  {
    key: 'lagos-compliance',
    label: 'Lagos permits',
    hint: 'Approvals, inspections, and compliance',
  },
  {
    key: 'guides',
    label: 'Guides & deep reads',
    hint: 'Long-form playbooks under /guides',
  },
  {
    key: 'articles',
    label: 'Articles',
    hint: 'Published reads from the BuildMyHouse desk',
  },
  {
    key: 'tools',
    label: 'Planning tools',
    hint: 'Interactive calculators and planners',
  },
  {
    key: 'downloads',
    label: 'Free downloads',
    hint: 'Checklists and worksheets (PDF)',
  },
  {
    key: 'diaspora-country',
    label: 'By diaspora country',
    hint: 'UK, USA/Canada, UAE, and regional hubs',
  },
  {
    key: 'trust',
    label: 'Contractors & trust',
    hint: 'Vetting, updates, and accountability',
  },
  {
    key: 'product',
    label: 'See the product',
    hint: 'Demos and how tracking works',
  },
];

const TOOL_COVER =
  'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=1200&q=80';

function pathFromCanonical(canonical: string): string {
  if (canonical.startsWith('/')) return canonical;
  try {
    return new URL(canonical).pathname;
  } catch {
    return canonical;
  }
}

function resourceRow(
  key: string,
  slug: string,
  pillarKey: PublishedIndexItem['pillarKey'],
  href: string,
  title: string,
  excerpt: string,
  description: string,
  coverImageUrl: string,
  coverImageAlt: string,
  readingMinutes: number,
  tags: string[],
  publishedAt: string,
  contentType: ResourceContentType,
  topicKeys: ResourceTopicKey[],
  badgeLabel?: string,
): ResourceIndexItem {
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
    isCuratedGuide:
      contentType === 'guide' ||
      contentType === 'pillar' ||
      contentType === 'diaspora' ||
      href.startsWith('/guides/') ||
      href.startsWith('/diaspora/'),
    contentType,
    topicKeys: ['all', ...topicKeys.filter((t) => t !== 'all')],
    badgeLabel,
  };
}

function inferTopicsForPublishedItem(item: PublishedIndexItem): ResourceTopicKey[] {
  const topics: ResourceTopicKey[] = [];

  if (
    item.key.startsWith('pillar-') ||
    item.href === '/diaspora/build-in-nigeria-from-abroad' ||
    item.href === '/diaspora/renovate-in-nigeria-from-abroad' ||
    item.href === '/guides/lagos-building-permits-and-stage-inspections'
  ) {
    topics.push('start-here');
  }

  if (item.pillarKey === 'build-abroad') topics.push('build-abroad');
  if (item.pillarKey === 'renovate-abroad') topics.push('renovate-abroad');
  if (item.pillarKey === 'lagos-compliance') topics.push('lagos-compliance');

  if (item.href.startsWith('/articles/')) {
    topics.push('articles');
  } else if (item.href.startsWith('/guides/')) {
    topics.push('guides');
  } else if (
    item.href.startsWith('/mistakes-') ||
    item.href.startsWith('/how-to-') ||
    item.href.startsWith('/land-') ||
    item.href.startsWith('/building-permit-')
  ) {
    topics.push('guides');
    if (item.href.includes('contractor')) topics.push('trust');
    if (item.href.includes('permit') || item.href.includes('lagos')) topics.push('lagos-compliance');
  }

  if (item.href.includes('contractor') || item.href.includes('weekly-site')) {
    topics.push('trust');
  }

  return topics;
}

function toResourceItem(item: PublishedIndexItem): ResourceIndexItem {
  const adminKeys = (item.resourceSectionKeys || []).filter(Boolean);
  const inferred = inferTopicsForPublishedItem(item);
  const topicKeys =
    adminKeys.length > 0 ? (['all', ...adminKeys] as ResourceTopicKey[]) : (['all', ...inferred] as ResourceTopicKey[]);
  const contentType: ResourceContentType = item.href.startsWith('/articles/')
    ? 'article'
    : item.key.startsWith('pillar-')
      ? 'pillar'
      : item.href.startsWith('/guides/')
        ? 'guide'
        : 'seo-guide';

  return {
    ...item,
    contentType,
    topicKeys,
  };
}

/** Static rows not already included in `getStaticPublishedCatalogItems()`. */
export function getExtendedResourceCatalogItems(): ResourceIndexItem[] {
  const buildingPermit = getSeoPageContent('buildingPermitLagosNigeriaGuide');
  const diasporaUae = getSeoPageContent('diasporaUae');

  return [
    resourceRow(
      'guide-contractor-vetting',
      'contractor-vetting-nigeria-diaspora',
      'build-abroad',
      '/guides/contractor-vetting-nigeria-diaspora',
      contractorGuide.hero.title,
      contractorGuide.hero.description,
      contractorGuide.seo.description,
      contractorGuide.coverImage.src,
      contractorGuide.coverImage.alt,
      11,
      [contractorGuide.hero.eyebrow],
      '2026-04-04',
      'guide',
      ['trust', 'build-abroad', 'guides'],
    ),
    resourceRow(
      'guide-weekly-updates',
      'weekly-site-updates-standard',
      'build-abroad',
      '/guides/weekly-site-updates-standard',
      weeklyUpdates.hero.title,
      weeklyUpdates.hero.description,
      weeklyUpdates.seo.description,
      weeklyUpdates.coverImage.src,
      weeklyUpdates.coverImage.alt,
      10,
      [weeklyUpdates.hero.eyebrow],
      '2026-04-05',
      'guide',
      ['trust', 'build-abroad', 'guides'],
    ),
    resourceRow(
      'guide-finish-abandoned',
      'how-to-finish-an-abandoned-house-in-nigeria-from-abroad',
      'build-abroad',
      '/guides/how-to-finish-an-abandoned-house-in-nigeria-from-abroad',
      finishAbandoned.hero.title,
      finishAbandoned.hero.description,
      finishAbandoned.seo.description,
      finishAbandoned.coverImage.src,
      finishAbandoned.coverImage.alt,
      12,
      [finishAbandoned.hero.eyebrow],
      '2026-04-06',
      'guide',
      ['build-abroad', 'guides'],
    ),
    resourceRow(
      'guide-lagos-repair-vs-renovation',
      'renovation-permit-lagos-repair-vs-renovation',
      'lagos-compliance',
      '/guides/renovation-permit-lagos-repair-vs-renovation',
      lagosRepairGuide.hero.title,
      lagosRepairGuide.hero.description,
      lagosRepairGuide.seo.description,
      lagosRepairGuide.coverImage.src,
      lagosRepairGuide.coverImage.alt,
      9,
      [lagosRepairGuide.hero.eyebrow],
      '2026-04-07',
      'guide',
      ['lagos-compliance', 'renovate-abroad', 'guides'],
    ),
    resourceRow(
      'seo-building-permit-lagos',
      'building-permit-in-lagos-nigeria-guide',
      'lagos-compliance',
      buildingPermit.canonicalPath,
      buildingPermit.heroTitle,
      buildingPermit.heroDescription,
      buildingPermit.description,
      'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1200&q=80',
      buildingPermit.heroTitle,
      8,
      [buildingPermit.eyebrow],
      '2026-03-22',
      'seo-guide',
      ['lagos-compliance', 'guides'],
    ),
    resourceRow(
      'tool-milestone-schedule',
      'milestone-payment-schedule',
      'general',
      '/tools/milestone-payment-schedule',
      milestoneTool.hero.title,
      milestoneTool.hero.description,
      milestoneTool.seo.description,
      milestoneTool.hero.coverImage.url,
      milestoneTool.hero.coverImage.alt,
      5,
      [milestoneTool.hero.eyebrow],
      '2026-04-08',
      'tool',
      ['tools', 'build-abroad', 'renovate-abroad'],
      'Free tool',
    ),
    resourceRow(
      'tool-renovation-budget',
      'renovation-budget-planner',
      'renovate-abroad',
      '/tools/renovation-budget-planner',
      renovationTool.hero.title,
      renovationTool.hero.description,
      renovationTool.seo.description,
      renovationTool.coverImage.src,
      renovationTool.coverImage.alt,
      5,
      [renovationTool.hero.eyebrow],
      '2026-04-09',
      'tool',
      ['tools', 'renovate-abroad'],
      'Free tool',
    ),
    resourceRow(
      'download-lagos-checklist',
      'lagos-permit-starter-checklist',
      'lagos-compliance',
      '/downloads/lagos-permit-starter-checklist',
      lagosChecklist.hero.title,
      lagosChecklist.hero.description,
      lagosChecklist.seo.description,
      lagosChecklist.coverImage.src,
      lagosChecklist.coverImage.alt,
      3,
      [lagosChecklist.hero.eyebrow],
      '2026-04-10',
      'download',
      ['downloads', 'lagos-compliance'],
      'PDF download',
    ),
    resourceRow(
      'download-renovation-worksheet',
      'remote-renovation-scope-worksheet',
      'renovate-abroad',
      '/downloads/remote-renovation-scope-worksheet',
      renovationWorksheet.hero.title,
      renovationWorksheet.hero.description,
      renovationWorksheet.seo.description,
      'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1200&q=80',
      renovationWorksheet.hero.title,
      3,
      [renovationWorksheet.hero.eyebrow],
      '2026-04-11',
      'download',
      ['downloads', 'renovate-abroad'],
      'PDF download',
    ),
    resourceRow(
      'diaspora-uk-build',
      'build-in-nigeria-from-uk',
      'build-abroad',
      pathFromCanonical(ukBuild.seo.canonical),
      ukBuild.hero.title,
      ukBuild.hero.description,
      ukBuild.seo.description,
      ukBuild.coverImage.src,
      ukBuild.coverImage.alt,
      11,
      [ukBuild.hero.eyebrow],
      '2026-04-12',
      'diaspora',
      ['diaspora-country', 'build-abroad'],
    ),
    resourceRow(
      'diaspora-usa-canada-build',
      'build-in-nigeria-from-usa-canada',
      'build-abroad',
      pathFromCanonical(usaCanadaBuild.seo.canonical),
      usaCanadaBuild.hero.title,
      usaCanadaBuild.hero.description,
      usaCanadaBuild.seo.description,
      usaCanadaBuild.coverImage.src,
      usaCanadaBuild.coverImage.alt,
      11,
      [usaCanadaBuild.hero.eyebrow],
      '2026-04-13',
      'diaspora',
      ['diaspora-country', 'build-abroad'],
    ),
    resourceRow(
      'diaspora-uae-build',
      'build-in-nigeria-from-uae',
      'build-abroad',
      diasporaUae.canonicalPath,
      diasporaUae.heroTitle,
      diasporaUae.heroDescription,
      diasporaUae.description,
      'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=1200&q=80',
      diasporaUae.heroTitle,
      9,
      [diasporaUae.eyebrow],
      '2026-04-14',
      'diaspora',
      ['diaspora-country', 'build-abroad'],
    ),
    resourceRow(
      'diaspora-uk-renovate-parents',
      'uk-renovate-parents-house',
      'renovate-abroad',
      pathFromCanonical(ukRenovateParents.seo.canonical),
      ukRenovateParents.hero.title,
      ukRenovateParents.hero.description,
      ukRenovateParents.seo.description,
      ukRenovateParents.coverImage.src,
      ukRenovateParents.coverImage.alt,
      10,
      [ukRenovateParents.hero.eyebrow],
      '2026-04-15',
      'diaspora',
      ['diaspora-country', 'renovate-abroad'],
    ),
    resourceRow(
      'demo-project-monitoring',
      'project-monitoring',
      'general',
      '/demo/project-monitoring',
      'Remote Project Monitoring Demo',
      'Preview how BuildMyHouse helps diaspora homeowners watch stage progress, receive notifications, and stay in control of payment flow.',
      'Preview how BuildMyHouse helps diaspora homeowners watch stage progress, receive notifications, and stay in control of payment flow while the GC drives project execution.',
      'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?auto=format&fit=crop&w=1200&q=80',
      'BuildMyHouse project monitoring demo on a phone',
      4,
      ['PRODUCT DEMO'],
      '2026-04-16',
      'demo',
      ['product'],
      'Interactive demo',
    ),
  ];
}

export const PLANNING_TOOLS: ResourceIndexItem[] = [
  resourceRow(
    'tool-milestone-schedule',
    'milestone-payment-schedule',
    'general',
    '/tools/milestone-payment-schedule',
    milestoneTool.hero.title,
    milestoneTool.hero.description,
    milestoneTool.seo.description,
    milestoneTool.hero.coverImage.url,
    milestoneTool.hero.coverImage.alt,
    5,
    [milestoneTool.hero.eyebrow],
    '2026-04-08',
    'tool',
    ['tools'],
    'Free tool',
  ),
  resourceRow(
    'tool-renovation-budget',
    'renovation-budget-planner',
    'renovate-abroad',
    '/tools/renovation-budget-planner',
    renovationTool.hero.title,
    renovationTool.hero.description,
    renovationTool.seo.description,
    renovationTool.coverImage.src,
    renovationTool.coverImage.alt,
    5,
    [renovationTool.hero.eyebrow],
    '2026-04-09',
    'tool',
    ['tools'],
    'Free tool',
  ),
];

/** Full resources hub dataset: CMS articles + flagship guides + extended catalog (deduped by href). */
export function mergeAllResourceItems(articles: Article[]): ResourceIndexItem[] {
  const byHref = new Map<string, ResourceIndexItem>();

  for (const item of mergePublishedIndexItems(articles)) {
    byHref.set(item.href, toResourceItem(item));
  }

  for (const row of getExtendedResourceCatalogItems()) {
    if (!byHref.has(row.href)) {
      byHref.set(row.href, row);
    }
  }

  return Array.from(byHref.values()).sort((a, b) => {
    const byDate = b.publishedAt.localeCompare(a.publishedAt);
    if (byDate !== 0) return byDate;
    return a.key.localeCompare(b.key);
  });
}

export function filterByResourceTopic(items: ResourceIndexItem[], filter: ResourceTopicFilter): ResourceIndexItem[] {
  if (!filter || filter === 'all') return items;
  return items.filter((item) => item.topicKeys.includes(filter));
}

export function itemMatchesResourceSearch(item: ResourceIndexItem, query: string): boolean {
  if (itemMatchesSearch(item, query)) return true;
  const raw = query.trim().toLowerCase();
  if (!raw) return true;
  const topicLabels = RESOURCE_SIDEBAR_TOPICS.filter((topic) => item.topicKeys.includes(topic.key))
    .map((topic) => `${topic.label} ${topic.hint}`)
    .join(' ');
  const hay = `${item.contentType} ${item.badgeLabel || ''} ${topicLabels}`.toLowerCase();
  return hay.includes(raw);
}

export function resourceTypeLabel(item: ResourceIndexItem): string {
  if (item.badgeLabel) return item.badgeLabel;
  switch (item.contentType) {
    case 'tool':
      return 'Free tool';
    case 'download':
      return 'PDF download';
    case 'demo':
      return 'Interactive demo';
    case 'diaspora':
      return 'Diaspora guide';
    case 'pillar':
      return 'Flagship guide';
    case 'guide':
    case 'seo-guide':
      return 'Guide';
    default:
      return 'Article';
  }
}

export function buildArticlesHubJsonLd(items: ResourceIndexItem[]) {
  const canonicalUrl = buildCanonical('/articles');
  const webBase = (process.env.EXPO_PUBLIC_WEB_URL || 'https://buildmyhouse.app').replace(/\/+$/, '');

  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        '@id': `${webBase}/#organization`,
        name: 'BuildMyHouse',
        url: webBase,
      },
      {
        '@type': 'WebSite',
        '@id': `${webBase}/#website`,
        name: 'BuildMyHouse',
        url: webBase,
        publisher: { '@id': `${webBase}/#organization` },
      },
      {
        '@type': 'CollectionPage',
        '@id': `${canonicalUrl}#collection`,
        name: 'BuildMyHouse Articles, Guides, Tools & Downloads',
        description:
          'Educational resources for Nigerian homeowners and diaspora clients: construction guides, renovation playbooks, Lagos compliance, free planning tools, and downloadable checklists.',
        url: canonicalUrl,
        isPartOf: { '@id': `${webBase}/#website` },
        about: [
          { '@type': 'Thing', name: 'Construction in Nigeria' },
          { '@type': 'Thing', name: 'Diaspora home building' },
          { '@type': 'Thing', name: 'Renovation planning' },
          { '@type': 'Thing', name: 'Lagos building permits' },
        ],
        hasPart: items.slice(0, 40).map((item) => ({
          '@type':
            item.contentType === 'tool'
              ? 'SoftwareApplication'
              : item.contentType === 'download'
                ? 'DigitalDocument'
                : 'Article',
          name: item.title,
          description: item.description,
          url: buildCanonical(item.href),
        })),
      },
      {
        '@type': 'ItemList',
        '@id': `${canonicalUrl}#itemlist`,
        name: 'BuildMyHouse resource library',
        numberOfItems: items.length,
        itemListElement: items.map((item, index) => ({
          '@type': 'ListItem',
          position: index + 1,
          name: item.title,
          description: item.excerpt,
          url: buildCanonical(item.href),
        })),
      },
      {
        '@type': 'BreadcrumbList',
        '@id': `${canonicalUrl}#breadcrumbs`,
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: webBase },
          { '@type': 'ListItem', position: 2, name: 'Articles & Guides', item: canonicalUrl },
        ],
      },
    ],
  };
}

export { publishedIndexCoverSource, TOOL_COVER };
