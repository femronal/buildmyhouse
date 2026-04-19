import fs from 'node:fs';
import path from 'node:path';

const WEB_URL = (process.env.EXPO_PUBLIC_WEB_URL || 'https://buildmyhouse.app').replace(/\/+$/, '');
const outputDir = path.resolve(process.cwd(), 'public');
const API_URL = (process.env.EXPO_PUBLIC_API_URL || 'https://api.buildmyhouse.app/api').replace(/\/+$/, '');

const indexableRoutes = [
  '/',
  '/login',
  '/explore',
  '/rent',
  '/articles',
  '/articles/cost-to-build-house-in-nigeria-2026',
  '/articles/renovation-checklist-for-homeowners-nigeria',
  '/articles/diaspora-guide-build-in-nigeria-from-abroad',
  '/construction/nigeria',
  '/construction/lagos',
  '/construction/abuja',
  '/construction/port-harcourt',
  '/renovation/nigeria',
  '/interior-design/nigeria',
  '/homes-for-rent/nigeria',
  '/houses-for-sale/nigeria',
  '/land-for-sale/nigeria',
  '/diaspora/build-in-nigeria-from-uk',
  '/diaspora/build-in-nigeria-from-usa-canada',
  '/diaspora/build-in-nigeria-from-uae',
  '/mistakes-nigerians-in-diaspora-make-when-building',
  '/how-to-choose-a-general-contractor-in-nigeria',
  '/land-verification-in-nigeria-guide',
  '/building-permit-in-lagos-nigeria-guide',
  '/guides/contractor-vetting-nigeria-diaspora',
  '/downloads/remote-renovation-scope-worksheet',
  '/downloads/lagos-permit-starter-checklist',
  '/tools/milestone-payment-schedule',
  '/tools/renovation-budget-planner',
];

async function getCmsArticleRoutes() {
  try {
    const response = await fetch(`${API_URL}/articles`);
    if (!response.ok) return [];
    const data = await response.json();
    if (!Array.isArray(data)) return [];

    return data
      .map((item) => String(item?.canonicalPath || '').trim())
      .filter((path) => path.startsWith('/articles/'));
  } catch {
    return [];
  }
}

const now = new Date().toISOString();
const cmsRoutes = await getCmsArticleRoutes();
const finalRoutes = Array.from(new Set([...indexableRoutes, ...cmsRoutes]));

const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${finalRoutes
  .map(
    (route) => `  <url>
    <loc>${route === '/' ? WEB_URL : `${WEB_URL}${route}`}</loc>
    <lastmod>${now}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>${route === '/' ? '1.0' : '0.7'}</priority>
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

Sitemap: ${WEB_URL}/sitemap.xml
`;

fs.mkdirSync(outputDir, { recursive: true });
fs.writeFileSync(path.join(outputDir, 'sitemap.xml'), sitemapXml, 'utf8');
fs.writeFileSync(path.join(outputDir, 'robots.txt'), robotsTxt, 'utf8');

console.log('[seo] Generated public/sitemap.xml and public/robots.txt');

