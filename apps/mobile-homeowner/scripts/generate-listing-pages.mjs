/**
 * Publish one static HTML file per public artisan, vendor, and professional,
 * plus a sitemap index that lists them. Fails the build if the public API
 * cannot be read, so we never ship a sitemap with zero listings.
 */
import fs from 'node:fs';
import path from 'node:path';
import {
  buildSitemapIndex,
  buildUrlSet,
  chunkList,
  hubMatchForPath,
  isoTimestamp,
  listingHead,
  listingMatchesHub,
  listingTradeText,
  sitemapFileNames,
} from '../lib/listing-public-seo.mjs';

const WEB_URL = (process.env.EXPO_PUBLIC_WEB_URL || 'https://buildmyhouse.app').replace(/\/+$/, '');
const API_URL = (process.env.EXPO_PUBLIC_API_URL || 'https://api.buildmyhouse.app/api').replace(/\/+$/, '');
const distDir = path.resolve(process.cwd(), 'dist');
const publicDir = path.resolve(process.cwd(), 'public');
const PAGE_SIZE = 50;

const SEGMENTS = [
  { segment: 'artisans', kind: 'artisan', reserved: ['apply', 'claim', 'meta', 'my-listings', 'applications', 'claims'] },
  { segment: 'vendors', kind: 'vendor', reserved: ['apply', 'claim', 'manage', 'categories', 'me'] },
  { segment: 'professionals', kind: 'professional', reserved: ['apply', 'claim', 'manage', 'meta', 'me'] },
];

function fail(message) {
  console.error(`[listings] ${message}`);
  process.exit(1);
}

async function fetchJson(url, attempt = 0) {
  let response;
  try {
    response = await fetch(url, { signal: AbortSignal.timeout(30000) });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (attempt < 4) {
      await new Promise((resolve) => setTimeout(resolve, 1000 * (attempt + 1)));
      return fetchJson(url, attempt + 1);
    }
    fail(`${url} failed: ${message}`);
  }
  if ((response.status === 429 || response.status === 503) && attempt < 5) {
    await new Promise((resolve) => setTimeout(resolve, 1500 * (attempt + 1)));
    return fetchJson(url, attempt + 1);
  }
  if (!response.ok) fail(`${url} returned ${response.status}`);
  try {
    return await response.json();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    fail(`${url} was not JSON: ${message}`);
  }
  return null;
}

async function fetchAllListings(segment) {
  const rows = [];
  let total = null;
  for (let page = 1; page < 500; page += 1) {
    const body = await fetchJson(`${API_URL}/${segment}?limit=${PAGE_SIZE}&page=${page}`);
    const data = body && Array.isArray(body.data) ? body.data : null;
    if (!data) fail(`${segment} page ${page} did not return a data array`);
    const reported = Number(body.total ?? body.meta?.total);
    if (!Number.isFinite(reported)) fail(`${segment} page ${page} did not return a total`);
    if (total == null) total = reported;
    if (reported !== total) fail(`${segment} total changed from ${total} to ${reported}`);
    rows.push(...data);
    if (rows.length >= total) break;
    if (!data.length) fail(`${segment} returned an empty page before ${total} listings`);
  }
  if (rows.length !== total) fail(`${segment} returned ${rows.length} listings, expected ${total}`);
  if (!total) fail(`${segment} returned zero public listings`);
  console.log(`[listings] ${segment}: ${rows.length} public listings`);
  return rows;
}

async function fetchApprovedReviews(kind) {
  const url = `${API_URL}/listing-feedback/approved-reviews?kind=${encodeURIComponent(kind)}`;
  let response;
  try {
    response = await fetch(url, { signal: AbortSignal.timeout(30000) });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    fail(`${url} failed: ${message}`);
  }
  if (response.status === 404 && process.env.LISTING_REVIEWS_ALLOW_MISSING === '1') {
    console.warn('[listings] Approved review index is not on this API. Listing pages will omit ratings.');
    return new Map();
  }
  if (!response.ok) fail(`${url} returned ${response.status}`);
  const body = await response.json();
  const data = Array.isArray(body?.data) ? body.data : null;
  if (!data) fail(`${url} did not return a data array`);
  const bySlug = new Map();
  for (const row of data) {
    const slug = String(row?.slug || '').trim();
    if (!slug || !row?.summary || Number(row.summary.count) < 1) continue;
    bySlug.set(slug, row);
  }
  console.log(`[listings] ${kind}: ${bySlug.size} listings with approved reviews`);
  return bySlug;
}

function assertSafeSlug(segment, slug) {
  // Real slugs are lowercase words. A few end with a hyphen. Reject anything
  // that could escape the listing directory.
  if (!/^[a-z0-9][a-z0-9_-]*$/i.test(slug) || slug.includes('..')) {
    fail(`${segment} slug is not safe to publish as a path: ${slug}`);
  }
}

function listingName(segment, row) {
  if (segment === 'vendors') return clean(row.tradingName) || clean(row.businessName) || clean(row.displayName);
  return clean(row.businessName) || clean(row.displayName) || clean(row.tradingName);
}

function clean(value) {
  return String(value ?? '').replace(/\s+/g, ' ').trim();
}

function serviceLabels(segment, row) {
  if (segment === 'professionals') {
    return (row.services || []).map((item) => clean(item?.label)).filter(Boolean);
  }
  if (segment === 'artisans') {
    return (row.services || []).map((item) => clean(item)).filter(Boolean);
  }
  return [];
}

function normalize(segment, row, reserved) {
  const slug = clean(row?.slug);
  assertSafeSlug(segment, slug);
  if (reserved.has(slug.toLowerCase())) {
    fail(`${segment} slug "${slug}" collides with a static route`);
  }
  const name = listingName(segment, row);
  if (!name) fail(`${segment}/${slug} has no public name`);
  const city = segment === 'vendors' ? row.cityLabel : row.city;
  const state = segment === 'vendors' ? row.stateLabel : row.state;
  const trade =
    segment === 'vendors' ? row.primaryCategoryLabel : segment === 'professionals' ? row.profession?.label : row.trade?.label;
  return {
    segment,
    slug,
    name,
    trade: clean(trade) || null,
    city: clean(city) || null,
    state: clean(state) || null,
    services: serviceLabels(segment, row),
    businessTypes: Array.isArray(row.businessTypes) ? row.businessTypes : [],
    updatedAt: row.updatedAt || row.lastUpdatedAt || null,
    tradeText: listingTradeText(row),
    href: `/${segment}/${slug}`,
  };
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function upsertMeta(html, attr, key, value) {
  const pattern =
    attr === 'name'
      ? new RegExp(`<meta\\s+name="${key}"\\s+content="[^"]*"\\s*/?>`, 'i')
      : new RegExp(`<meta\\s+property="${key}"\\s+content="[^"]*"\\s*/?>`, 'i');
  const tag =
    attr === 'name'
      ? `<meta name="${key}" content="${escapeHtml(value)}" />`
      : `<meta property="${key}" content="${escapeHtml(value)}" />`;
  if (pattern.test(html)) return html.replace(pattern, tag);
  return html.replace('</head>', `  ${tag}\n</head>`);
}

function upsertLink(html, href) {
  const tag = `<link rel="canonical" href="${escapeHtml(href)}" />`;
  const without = html.replace(/<link\s+[^>]*rel=["']canonical["'][^>]*>/gi, '');
  return without.replace('</head>', `  ${tag}\n</head>`);
}

function upsertTitle(html, title) {
  const withoutTitles = html.replace(/<title[^>]*>[\s\S]*?<\/title>/gi, '');
  return withoutTitles.replace('</head>', `  <title>${escapeHtml(title)}</title>\n</head>`);
}

function upsertJsonLd(html, payload) {
  const json = JSON.stringify(payload).replace(/</g, '\\u003c');
  const scriptTag = `<script type="application/ld+json" id="buildmyhouse-jsonld">${json}</script>`;
  const pattern = /<script\s+type="application\/ld\+json"\s+id="buildmyhouse-jsonld">[\s\S]*?<\/script>/i;
  if (pattern.test(html)) return html.replace(pattern, scriptTag);
  return html.replace('</head>', `  ${scriptTag}\n</head>`);
}

function applyHead(html, head) {
  let next = upsertTitle(html, head.title);
  next = upsertMeta(next, 'name', 'description', head.description);
  next = upsertMeta(next, 'name', 'robots', 'index,follow');
  next = upsertLink(next, head.canonical);
  next = upsertMeta(next, 'property', 'og:type', 'website');
  next = upsertMeta(next, 'property', 'og:title', head.title);
  next = upsertMeta(next, 'property', 'og:description', head.description);
  next = upsertMeta(next, 'property', 'og:url', head.canonical);
  next = upsertMeta(next, 'name', 'twitter:title', head.title);
  next = upsertMeta(next, 'name', 'twitter:description', head.description);
  next = upsertJsonLd(next, head.jsonLd);
  return next;
}

function templateHtml(segment) {
  const candidates = [
    path.join(distDir, segment, '[slug]', 'index.html'),
    path.join(distDir, segment, '[slug].html'),
  ];
  const filePath = candidates.find((candidate) => fs.existsSync(candidate));
  if (!filePath) fail(`Missing exported template for /${segment}/[slug]. Run expo export and inject-static-seo first.`);
  return fs.readFileSync(filePath, 'utf8');
}

function writeListingPage(listing, template, reviews) {
  const head = listingHead({
    segment: listing.segment,
    name: listing.name,
    slug: listing.slug,
    trade: listing.trade,
    city: listing.city,
    state: listing.state,
    services: listing.services,
    businessTypes: listing.businessTypes,
    origin: WEB_URL,
    reviews: reviews.get(listing.slug) || null,
  });
  const html = applyHead(template, head);
  const indexPath = path.join(distDir, listing.segment, listing.slug, 'index.html');
  fs.mkdirSync(path.dirname(indexPath), { recursive: true });
  fs.writeFileSync(indexPath, html, 'utf8');
  return head;
}

function routeFromRelative(rel) {
  if (rel.endsWith('/index.html')) return `/${rel.slice(0, -'/index.html'.length)}`;
  if (rel.endsWith('.html')) return `/${rel.slice(0, -'.html'.length)}`;
  return '';
}

function walkHtml(dir, files = []) {
  if (!fs.existsSync(dir)) return files;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walkHtml(full, files);
    else if (entry.name.endsWith('.html')) files.push(full);
  }
  return files;
}

function hubFiles() {
  const found = new Map();
  for (const file of walkHtml(distDir)) {
    const rel = path.relative(distDir, file).replace(/\\/g, '/');
    if (rel.endsWith('/query.html') || rel.endsWith('query.html')) continue;
    if (!rel.startsWith('services/') && !rel.startsWith('contractors/')) continue;
    const route = routeFromRelative(rel);
    if (!route || route.includes('[')) continue;
    const current = found.get(route);
    if (!current || rel.endsWith('/index.html')) found.set(route, file);
  }
  return found;
}

function listingNav(heading, links) {
  const items = links
    .map((link) => `<li><a href="${escapeHtml(link.href)}">${escapeHtml(link.name)}</a></li>`)
    .join('');
  return `<nav data-bmh-listing-links="1" style="position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0"><p>${escapeHtml(heading)}</p><ul>${items}</ul></nav>`;
}

function injectLinks(filePath, heading, links) {
  if (!filePath || !links.length) return false;
  const html = fs.readFileSync(filePath, 'utf8');
  if (html.includes('http-equiv="refresh"') || html.includes('data-bmh-listing-links="1"')) return false;
  const block = listingNav(heading, links);
  const end = html.lastIndexOf('</body>');
  const next = end === -1 ? `${html}${block}` : `${html.slice(0, end)}${block}${html.slice(end)}`;
  fs.writeFileSync(filePath, next, 'utf8');
  return true;
}

function directoryFile(route) {
  const rel = route.replace(/^\//, '');
  const indexPath = path.join(distDir, rel, 'index.html');
  if (fs.existsSync(indexPath)) return indexPath;
  const flatPath = path.join(distDir, `${rel}.html`);
  return fs.existsSync(flatPath) ? flatPath : null;
}

function writeSitemaps(groups) {
  const staticPath = path.join(publicDir, 'sitemap.xml');
  if (!fs.existsSync(staticPath)) fail('public/sitemap.xml is missing. Run generate-seo-files first.');
  const staticXml = fs.readFileSync(staticPath, 'utf8');
  if (!staticXml.includes('<urlset')) fail('public/sitemap.xml is not a urlset of static pages');
  const staticCount = (staticXml.match(/<loc>/g) || []).length;
  if (!staticCount) fail('public/sitemap.xml has no URLs');
  fs.writeFileSync(path.join(distDir, 'sitemap-static.xml'), staticXml, 'utf8');

  const childLocs = [`${WEB_URL}/sitemap-static.xml`];
  for (const group of groups) {
    const entries = group.listings.map((listing) => {
      const lastmod = isoTimestamp(listing.updatedAt);
      return { loc: `${WEB_URL}${listing.href}`, ...(lastmod ? { lastmod } : {}) };
    });
    const names = sitemapFileNames(group.segment, entries.length);
    const chunks = chunkList(entries);
    if (names.length !== chunks.length) fail(`Sitemap split mismatch for ${group.segment}`);
    chunks.forEach((chunk, index) => {
      const name = names[index];
      fs.writeFileSync(path.join(distDir, name), buildUrlSet(chunk), 'utf8');
      childLocs.push(`${WEB_URL}/${name}`);
    });
  }

  fs.writeFileSync(path.join(distDir, 'sitemap.xml'), buildSitemapIndex(childLocs), 'utf8');
  console.log(`[listings] Sitemap index lists ${childLocs.length} files. Static URLs: ${staticCount}.`);
}

function spotCheck(listing, head) {
  const filePath = path.join(distDir, listing.segment, listing.slug, 'index.html');
  const html = fs.readFileSync(filePath, 'utf8');
  if (!html.includes(`<title>${escapeHtml(head.title)}</title>`)) {
    fail(`Title was not written for ${listing.href}`);
  }
  if (!html.includes(`rel="canonical" href="${escapeHtml(head.canonical)}"`)) {
    fail(`Canonical was not written for ${listing.href}`);
  }
  if (/\[[^\]]+\]/.test(html.match(/<link\s+[^>]*rel=["']canonical["'][^>]*>/i)?.[0] || '')) {
    fail(`Placeholder canonical written for ${listing.href}`);
  }
  const jsonLd = html.match(/<script type="application\/ld\+json" id="buildmyhouse-jsonld">([\s\S]*?)<\/script>/i)?.[1] || '';
  if (!jsonLd.includes('"@type":"HomeAndConstructionBusiness"') && !jsonLd.includes('"@type":"ProfessionalService"') && !jsonLd.includes('"@type":"Store"') && !jsonLd.includes('"@type":"LocalBusiness"')) {
    fail(`JSON-LD was not written for ${listing.href}`);
  }
  if (jsonLd.includes('trustScore')) fail(`Listing JSON-LD for ${listing.href} includes trustScore`);
}

if (!fs.existsSync(distDir)) fail('dist/ is missing. Run expo export first.');

const groups = [];
for (const config of SEGMENTS) {
  const rows = await fetchAllListings(config.segment);
  const reviews = await fetchApprovedReviews(config.kind);
  const reserved = new Set(config.reserved);
  const seen = new Set();
  const listings = rows.map((row) => normalize(config.segment, row, reserved));
  for (const listing of listings) {
    const key = listing.slug.toLowerCase();
    if (seen.has(key)) fail(`Duplicate ${config.segment} slug: ${listing.slug}`);
    seen.add(key);
  }
  const template = templateHtml(config.segment);
  let checked = false;
  for (const listing of listings) {
    const head = writeListingPage(listing, template, reviews);
    if (!checked) {
      spotCheck(listing, head);
      checked = true;
    }
  }
  groups.push({ segment: config.segment, listings });
}

const directories = [
  ['/artisans', 'Artisan listings', groups[0].listings],
  ['/vendors', 'Vendor listings', groups[1].listings],
  ['/professionals', 'Professional listings', groups[2].listings],
];
let linkedPages = 0;
for (const [route, heading, listings] of directories) {
  const filePath = directoryFile(route);
  if (!filePath) fail(`Missing HTML for ${route}`);
  if (injectLinks(filePath, heading, listings)) linkedPages += 1;
}

const all = groups.flatMap((group) => group.listings);
for (const [route, filePath] of hubFiles()) {
  const hub = hubMatchForPath(route);
  if (!hub) continue;
  const matches = all.filter((listing) => listingMatchesHub(listing, hub));
  if (!matches.length) continue;
  if (injectLinks(filePath, 'Listings in this area', matches)) linkedPages += 1;
}

writeSitemaps(groups);
console.log(`[listings] Wrote ${all.length} listing pages and linked ${linkedPages} directory or hub pages.`);
