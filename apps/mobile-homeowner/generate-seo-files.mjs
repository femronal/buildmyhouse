import fs from 'node:fs';
import path from 'node:path';

const WEB_URL = (process.env.EXPO_PUBLIC_WEB_URL || 'https://buildmyhouse.app').replace(/\/+$/, '');
const outputDir = path.resolve(process.cwd(), 'public');

const indexableRoutes = [
  '/',
  '/login',
  '/explore',
  '/rent',
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
];

const now = new Date().toISOString();

const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${indexableRoutes
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

