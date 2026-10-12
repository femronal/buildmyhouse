import fs from 'node:fs';
import path from 'node:path';

const WEB_URL = (process.env.EXPO_PUBLIC_WEB_URL || 'https://buildmyhouse.app').replace(/\/+$/, '');
const outputDir = path.resolve(process.cwd(), 'public');
const API_URL = (process.env.EXPO_PUBLIC_API_URL || 'https://api.buildmyhouse.app/api').replace(/\/+$/, '');

const routesConfig = JSON.parse(
  fs.readFileSync(path.resolve(process.cwd(), 'lib/seo-indexable-routes.json'), 'utf8'),
);
const indexableRoutes = routesConfig.exact ?? [];

async function fetchJson(url) {
  let response;
  try {
    response = await fetch(url);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`[seo] ${url} failed: ${message}`);
  }
  if (!response.ok) {
    throw new Error(`[seo] ${url} returned ${response.status}`);
  }
  return response.json();
}

async function loadCmsSnapshot() {
  const [articleList, serviceList] = await Promise.all([
    fetchJson(`${API_URL}/articles?audience=homeowner`),
    fetchJson(`${API_URL}/service-pages`),
  ]);
  if (!Array.isArray(articleList)) {
    throw new Error('[seo] GET /articles?audience=homeowner did not return an array');
  }
  if (!Array.isArray(serviceList)) {
    throw new Error('[seo] GET /service-pages did not return an array');
  }

  const publishedArticles = articleList.filter((item) => item?.isPublished !== false && item?.slug);
  const articles = await Promise.all(
    publishedArticles.map(async (item) => {
      const slug = encodeURIComponent(String(item.slug));
      const detail = await fetchJson(`${API_URL}/articles/${slug}?audience=homeowner`);
      if (!detail || typeof detail !== 'object' || Array.isArray(detail)) {
        throw new Error(`[seo] Article ${item.slug} detail was empty`);
      }
      return detail;
    }),
  );

  const servicePages = serviceList.filter((item) => item?.isPublished !== false);
  return rewriteCmsSnapshot({ articles, servicePages });
}

// CMS still stores a few redirect and 404 targets. Rewrite them here so the
// bundled snapshot and static HTML point at live sitemap URLs. The /start-repair
// redirect route itself is unchanged.
const INTERNAL_LINK_REWRITES = {
  '/start-repair': { href: '/start/repair' },
  '/articles/benefits-of-regular-gutter-cleaning': {
    href: '/services/roof-repair-nigeria',
    label: 'Roof repair in Nigeria',
  },
  '/articles/understanding-gutter-maintenance': {
    href: '/services/lagos/roof-repair',
    label: 'Roof repair in Lagos',
  },
  '/articles/how-to-build-in-nigeria-from-abroad-without-getting-burnt': {
    href: '/articles/diaspora-guide-build-in-nigeria-from-abroad',
    label: 'Diaspora Guide: How to Build in Nigeria from Abroad',
  },
  '/services/property-maintenance-nigeria': {
    href: '/services/lagos/property-maintenance',
    label: 'Property maintenance in Lagos',
  },
  '/services/structural-inspection-assessment-nigeria': {
    href: '/services/lagos/structural-inspection-assessment',
    label: 'Structural inspection and technical assessment in Lagos',
  },
  '/services/tv-mounting-installation-nigeria': null,
};

function rewriteCmsValue(value) {
  if (Array.isArray(value)) {
    const next = [];
    for (const item of value) {
      const rewritten = rewriteCmsValue(item);
      if (rewritten !== undefined) next.push(rewritten);
    }
    return next;
  }
  if (!value || typeof value !== 'object') return value;
  if (typeof value.href === 'string' && Object.prototype.hasOwnProperty.call(INTERNAL_LINK_REWRITES, value.href)) {
    const replacement = INTERNAL_LINK_REWRITES[value.href];
    if (replacement == null) return undefined;
    const rewritten = rewriteCmsObject(value);
    rewritten.href = replacement.href;
    if (replacement.label && typeof value.label === 'string') rewritten.label = replacement.label;
    return rewritten;
  }
  return rewriteCmsObject(value);
}

function rewriteCmsObject(record) {
  const next = {};
  for (const [key, child] of Object.entries(record)) {
    const rewritten = rewriteCmsValue(child);
    if (rewritten !== undefined) next[key] = rewritten;
  }
  return next;
}

function rewriteCmsSnapshot(snapshot) {
  return {
    articles: rewriteCmsValue(snapshot.articles),
    servicePages: rewriteCmsValue(snapshot.servicePages),
  };
}

let cmsSnapshot;
try {
  cmsSnapshot = await loadCmsSnapshot();
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  console.error('[seo] Refusing to continue with an empty CMS snapshot.');
  process.exit(1);
}

const snapshotPath = path.resolve(process.cwd(), 'lib/cms-snapshot.generated.json');
fs.writeFileSync(snapshotPath, `${JSON.stringify(cmsSnapshot, null, 2)}\n`, 'utf8');

const pdfDir = path.join(outputDir, 'pdfs');
const pdfs = fs.existsSync(pdfDir)
  ? fs
      .readdirSync(pdfDir)
      .filter((name) => name.toLowerCase().endsWith('.pdf'))
      .sort()
  : [];
fs.writeFileSync(
  path.resolve(process.cwd(), 'lib/available-public-pdfs.json'),
  `${JSON.stringify(pdfs, null, 2)}\n`,
  'utf8',
);
console.log(
  `[seo] Wrote CMS snapshot (${cmsSnapshot.articles.length} articles, ${cmsSnapshot.servicePages.length} service pages) and ${pdfs.length} public PDFs`,
);

function articleSitemapRoute(item) {
  const canonical = String(item?.canonicalPath || '').trim();
  if (canonical.startsWith('/articles/')) return canonical;
  const slug = String(item?.slug || '').trim();
  if (!canonical && slug) return `/articles/${slug}`;
  return '';
}

const now = new Date().toISOString();
const ARTICLE_TOPICS = ['build-abroad', 'renovate-abroad', 'lagos-compliance', 'general'];
const ARTICLES_PAGE_SIZE = 9;

function articleLastMod(item) {
  const value = String(item?.updatedAt || item?.publishedAt || '').trim();
  const date = value ? new Date(value) : null;
  return date && !Number.isNaN(date.getTime()) ? date.toISOString() : now;
}

function articleTopic(item) {
  const pillar = String(item?.articlePillar || '').trim();
  return ARTICLE_TOPICS.includes(pillar) ? pillar : 'general';
}

const STATIC_ARTICLES = [
  { route: '/articles/cost-to-build-house-in-nigeria-2026', topic: 'build-abroad', lastmod: '2026-03-24T00:00:00.000Z' },
  { route: '/articles/renovation-checklist-for-homeowners-nigeria', topic: 'renovate-abroad', lastmod: '2026-03-24T00:00:00.000Z' },
  { route: '/articles/diaspora-guide-build-in-nigeria-from-abroad', topic: 'build-abroad', lastmod: '2026-03-24T00:00:00.000Z' },
  { route: '/articles/aluminium-window-repair-egbeda-lagos-buildmyhouse-case-study', topic: 'renovate-abroad', lastmod: '2026-05-22T00:00:00.000Z' },
  { route: '/articles/buying-property-lagos-from-abroad-due-diligence', topic: 'lagos-compliance', lastmod: '2026-10-06T00:00:00.000Z' },
  { route: '/articles/developer-joint-venture-unfinished-building-nigeria', topic: 'general', lastmod: '2026-10-09T00:00:00.000Z' },
];

const cmsRoutes = cmsSnapshot.articles.map(articleSitemapRoute).filter(Boolean);
const cmsRouteSet = new Set(cmsRoutes);
const staticOnly = STATIC_ARTICLES.filter((item) => !cmsRouteSet.has(item.route));
const allArticleRoutes = [...cmsRoutes, ...staticOnly.map((item) => item.route)];
const topicRoutes = ARTICLE_TOPICS.map((slug) => `/articles/topic/${slug}`);
const articleCount = Math.max(allArticleRoutes.length, 1);
const articlePageCount = Math.ceil(articleCount / ARTICLES_PAGE_SIZE);
const articlePageRoutes = Array.from({ length: Math.max(0, articlePageCount - 1) }, (_, index) => `/articles/page/${index + 2}`);
const topicPageRoutes = ARTICLE_TOPICS.flatMap((slug) => {
  const count =
    cmsSnapshot.articles.filter((item) => articleTopic(item) === slug).length +
    staticOnly.filter((item) => item.topic === slug).length;
  const pages = Math.ceil(count / ARTICLES_PAGE_SIZE);
  return Array.from({ length: Math.max(0, pages - 1) }, (_, index) => `/articles/topic/${slug}/page/${index + 2}`);
});
const cmsServiceRoutes = cmsSnapshot.servicePages
  .map((item) => String(item?.canonicalPath || '').trim())
  .filter((routePath) => routePath.startsWith('/services/'));
const finalRoutes = Array.from(
  new Set([...indexableRoutes, ...cmsRoutes, ...topicRoutes, ...articlePageRoutes, ...topicPageRoutes, ...cmsServiceRoutes]),
).sort();

const lastModByRoute = new Map();
for (const item of cmsSnapshot.articles) {
  const route = articleSitemapRoute(item);
  if (route) lastModByRoute.set(route, articleLastMod(item));
}
for (const item of staticOnly) {
  lastModByRoute.set(item.route, item.lastmod);
}
for (const slug of ARTICLE_TOPICS) {
  const dated = [
    ...cmsSnapshot.articles.filter((item) => articleTopic(item) === slug).map(articleLastMod),
    ...staticOnly.filter((item) => item.topic === slug).map((item) => item.lastmod),
  ].sort();
  if (dated.length) lastModByRoute.set(`/articles/topic/${slug}`, dated[dated.length - 1]);
}
const articleDates = [
  ...cmsSnapshot.articles.map(articleLastMod),
  ...staticOnly.map((item) => item.lastmod),
].sort();
if (articleDates.length) lastModByRoute.set('/articles', articleDates[articleDates.length - 1]);

const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${finalRoutes
  .map(
    (route) => `  <url>
    <loc>${route === '/' ? WEB_URL : `${WEB_URL}${route}`}</loc>
    <lastmod>${lastModByRoute.get(route) || now}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>${route === '/' ? '1.0' : route.startsWith('/services/lagos/') || route === '/start' || route.startsWith('/start/') ? '0.9' : '0.7'}</priority>
  </url>`,
  )
  .join('\n')}
</urlset>
`;

const robotsTxt = `# BuildMyHouse — robots.txt
# Human crawlers
User-agent: *
Allow: /

# Private app routes
Disallow: /dashboard
Disallow: /timeline
Disallow: /stage-detail
Disallow: /chat
Disallow: /profile
Disallow: /notifications
Disallow: /pending-projects
Disallow: /billing-payments
Disallow: /notification-settings
Disallow: /personal-information
Disallow: /app-settings
Disallow: /house-summary
Disallow: /upload-plan
Disallow: /email-login
Disallow: /choose-project-type
Disallow: /location

# AI agent crawlers — allowed; prefer markdown twins and llms.txt
User-agent: GPTBot
Allow: /
Allow: /index.md
Allow: /start.md
Allow: /start/repair.md
Allow: /start/upgrade.md
Allow: /start/build.md
Allow: /start/interiors.md
Allow: /pricing/repairs.md
Allow: /llms.txt

User-agent: ClaudeBot
Allow: /
Allow: /index.md
Allow: /start.md
Allow: /start/repair.md
Allow: /start/upgrade.md
Allow: /start/build.md
Allow: /start/interiors.md
Allow: /pricing/repairs.md
Allow: /llms.txt

User-agent: Google-Extended
Allow: /
Allow: /index.md
Allow: /start.md
Allow: /start/repair.md
Allow: /start/upgrade.md
Allow: /start/build.md
Allow: /start/interiors.md
Allow: /pricing/repairs.md
Allow: /llms.txt

User-agent: PerplexityBot
Allow: /
Allow: /index.md
Allow: /start.md
Allow: /start/repair.md
Allow: /start/upgrade.md
Allow: /start/build.md
Allow: /start/interiors.md
Allow: /pricing/repairs.md
Allow: /llms.txt

# Agent discovery
# Markdown twins: /index.md, /start.md, /start/repair.md, /pricing/repairs.md (also link rel=alternate type=text/markdown)
# Policy summary: ${WEB_URL}/llms.txt

Sitemap: ${WEB_URL}/sitemap.xml
`;

fs.mkdirSync(outputDir, { recursive: true });
fs.writeFileSync(path.join(outputDir, 'sitemap.xml'), sitemapXml, 'utf8');
fs.writeFileSync(path.join(outputDir, 'robots.txt'), robotsTxt, 'utf8');

console.log(`[seo] Generated public/sitemap.xml and public/robots.txt (${finalRoutes.length} routes)`);
