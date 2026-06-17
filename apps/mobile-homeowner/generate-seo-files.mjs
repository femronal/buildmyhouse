import fs from 'node:fs';
import path from 'node:path';

const WEB_URL = (process.env.EXPO_PUBLIC_WEB_URL || 'https://buildmyhouse.app').replace(/\/+$/, '');
const outputDir = path.resolve(process.cwd(), 'public');
const API_URL = (process.env.EXPO_PUBLIC_API_URL || 'https://api.buildmyhouse.app/api').replace(/\/+$/, '');

const routesConfig = JSON.parse(
  fs.readFileSync(path.resolve(process.cwd(), 'lib/seo-indexable-routes.json'), 'utf8'),
);
const indexableRoutes = routesConfig.exact ?? [];

async function getCmsArticleRoutes() {
  try {
    const response = await fetch(`${API_URL}/articles`);
    if (!response.ok) return [];
    const data = await response.json();
    if (!Array.isArray(data)) return [];

    return data
      .map((item) => String(item?.canonicalPath || '').trim())
      .filter((routePath) => routePath.startsWith('/articles/'));
  } catch {
    return [];
  }
}

const now = new Date().toISOString();
const cmsRoutes = await getCmsArticleRoutes();
const finalRoutes = Array.from(new Set([...indexableRoutes, ...cmsRoutes])).sort();

const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${finalRoutes
  .map(
    (route) => `  <url>
    <loc>${route === '/' ? WEB_URL : `${WEB_URL}${route}`}</loc>
    <lastmod>${now}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>${route === '/' ? '1.0' : route.startsWith('/services/lagos/') || route === '/start-repair' ? '0.9' : '0.7'}</priority>
  </url>`,
  )
  .join('\n')}
</urlset>
`;

const robotsTxt = `User-agent: *
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
Disallow: /privacy-security
Disallow: /personal-information
Disallow: /app-settings
Disallow: /house-summary
Disallow: /upload-plan
Disallow: /login
Disallow: /email-login
Disallow: /choose-project-type
Disallow: /location

Sitemap: ${WEB_URL}/sitemap.xml
`;

fs.mkdirSync(outputDir, { recursive: true });
fs.writeFileSync(path.join(outputDir, 'sitemap.xml'), sitemapXml, 'utf8');
fs.writeFileSync(path.join(outputDir, 'robots.txt'), robotsTxt, 'utf8');

console.log(`[seo] Generated public/sitemap.xml and public/robots.txt (${finalRoutes.length} routes)`);
