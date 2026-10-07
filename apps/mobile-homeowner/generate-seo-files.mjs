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
  return { articles, servicePages };
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

const now = new Date().toISOString();
const cmsRoutes = cmsSnapshot.articles
  .map((item) => String(item?.canonicalPath || '').trim())
  .filter((routePath) => routePath.startsWith('/articles/'));
const cmsServiceRoutes = cmsSnapshot.servicePages
  .map((item) => String(item?.canonicalPath || '').trim())
  .filter((routePath) => routePath.startsWith('/services/'));
const finalRoutes = Array.from(new Set([...indexableRoutes, ...cmsRoutes, ...cmsServiceRoutes])).sort();

const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${finalRoutes
  .map(
    (route) => `  <url>
    <loc>${route === '/' ? WEB_URL : `${WEB_URL}${route}`}</loc>
    <lastmod>${now}</lastmod>
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
