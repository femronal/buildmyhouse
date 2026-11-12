/**
 * Titles, descriptions, JSON-LD, and hub matching for public listings.
 * Used by the static export and by the profile pages so the raw HTML and
 * the hydrated page describe the same listing.
 */

export const SITEMAP_URL_LIMIT = 45000;
const DEFAULT_ORIGIN = 'https://buildmyhouse.app';

const STOP_TOKENS = new Set([
  'repair',
  'repairs',
  'service',
  'services',
  'nigeria',
  'the',
  'and',
  'for',
  'with',
  'from',
  'your',
  'our',
  'page',
  'guide',
  'contractor',
  'contractors',
  'general',
  'home',
  'house',
  'property',
  'installation',
  'install',
  'tracked',
  'safe',
  'quality',
]);

const TRADE_ALIASES = {
  plumbing: ['plumb'],
  electrical: ['electric'],
  electric: ['electric'],
  roof: ['roof'],
  roofing: ['roof'],
  drainage: ['drain'],
  drain: ['drain'],
  window: ['window', 'aluminium', 'aluminum', 'glaz'],
  aluminium: ['aluminium', 'aluminum', 'window'],
  aluminum: ['aluminium', 'aluminum', 'window'],
  pumping: ['pump'],
  pump: ['pump'],
  fan: ['fan'],
  bathroom: ['bathroom'],
  painting: ['paint'],
  paint: ['paint'],
  kitchen: ['kitchen'],
  renovation: ['renovat'],
  maintenance: ['maintenance'],
  solar: ['solar'],
  generator: ['generator'],
  carpenter: ['carpent'],
  carpentry: ['carpent'],
  welding: ['weld'],
  welder: ['weld'],
  architect: ['architect'],
  interior: ['interior'],
  tiling: ['til'],
  flooring: ['floor'],
  gutter: ['gutter'],
  borehole: ['borehole'],
  pest: ['pest'],
  hvac: ['hvac', 'air condition'],
};

const CITY_SLUGS = [
  'port-harcourt',
  'benin-city',
  'ado-ekiti',
  'birnin-kebbi',
  'cross-river',
  'akwa-ibom',
  'lagos',
  'abuja',
  'fct',
  'rivers',
  'ibadan',
  'oyo',
  'kano',
  'enugu',
  'owerri',
  'imo',
  'warri',
  'delta',
  'calabar',
  'uyo',
  'abeokuta',
  'ogun',
  'kaduna',
  'jos',
  'plateau',
  'onitsha',
  'anambra',
  'aba',
  'abia',
  'ilorin',
  'kwara',
  'maiduguri',
  'borno',
  'sokoto',
  'yola',
  'adamawa',
  'minna',
  'niger',
  'akure',
  'ondo',
  'osogbo',
  'osun',
  'bauchi',
  'gombe',
  'jalingo',
  'taraba',
  'lafia',
  'nasarawa',
  'makurdi',
  'benue',
  'asaba',
  'yenagoa',
  'bayelsa',
  'awka',
  'umuahia',
  'katsina',
  'kebbi',
  'yobe',
  'zamfara',
  'kogi',
  'ekiti',
  'ebonyi',
  'jigawa',
].sort((a, b) => b.split('-').length - a.split('-').length || b.length - a.length);

const CITY_PHRASES = {
  abuja: ['abuja', 'fct'],
  fct: ['abuja', 'fct'],
};

export function cleanText(value) {
  return String(value ?? '')
    .replace(/\s+/g, ' ')
    .trim();
}

export function hasRoutePlaceholder(route) {
  return /\[[^\]/]+\]/.test(String(route || ''));
}

export function canonicalRouteWithoutPlaceholder(route) {
  const parts = String(route || '')
    .split('/')
    .filter((part) => part && !/^\[[^\]/]+\]$/.test(part));
  return parts.length ? `/${parts.join('/')}` : '/';
}

function uniqueStrings(values) {
  const seen = new Set();
  const next = [];
  for (const value of values || []) {
    const text = cleanText(value);
    const key = text.toLowerCase();
    if (!text || seen.has(key)) continue;
    seen.add(key);
    next.push(text);
  }
  return next;
}

function placeLine(city, state) {
  const locality = cleanText(city);
  const region = cleanText(state);
  if (locality && region && locality.toLowerCase() !== region.toLowerCase()) {
    return `${locality}, ${region}`;
  }
  return locality || region || '';
}

export function listingDocumentTitle({ name, trade, city, state }) {
  const who = cleanText(name);
  const what = cleanText(trade);
  const where = cleanText(city) || cleanText(state);
  if (!who) return 'BuildMyHouse';
  if (what && where) return `${who} | ${what} in ${where} | BuildMyHouse`;
  if (what) return `${who} | ${what} | BuildMyHouse`;
  if (where) return `${who} | ${where} | BuildMyHouse`;
  return `${who} | BuildMyHouse`;
}

export function listingMetaDescription({ name, trade, city, state, services }) {
  const who = cleanText(name);
  const what = cleanText(trade);
  const place = placeLine(city, state);
  const offered = uniqueStrings(services).slice(0, 3);
  const head = [who, what, place].filter(Boolean).join(', ');
  if (!offered.length) return head || 'BuildMyHouse';
  const withServices = head ? `${head}. ${offered.join(', ')}` : offered.join(', ');
  if (withServices.length <= 320) return withServices;
  return head || offered[0];
}

export function listingSchemaType(segment, businessTypes) {
  if (segment === 'professionals') return 'ProfessionalService';
  if (segment === 'artisans') return 'HomeAndConstructionBusiness';
  const types = (businessTypes || []).map((item) => String(item || '').toLowerCase());
  if (types.includes('retailer') || types.includes('wholesaler') || types.includes('manufacturer')) {
    return 'Store';
  }
  return 'LocalBusiness';
}

function reviewBlock(bundle) {
  const count = Number(bundle?.summary?.count || 0);
  const average = Number(bundle?.summary?.average);
  const reviews = (bundle?.reviews || []).filter((review) => Number.isFinite(Number(review?.rating)));
  if (count < 1 || !Number.isFinite(average) || !reviews.length) return null;
  return {
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: average,
      reviewCount: count,
      bestRating: 5,
      worstRating: 1,
    },
    review: reviews.slice(0, 10).map((review) => {
      const node = {
        '@type': 'Review',
        reviewRating: {
          '@type': 'Rating',
          ratingValue: Number(review.rating),
          bestRating: 5,
          worstRating: 1,
        },
      };
      const author = cleanText(review.reviewerName);
      if (author) node.author = { '@type': 'Person', name: author };
      const published = cleanText(review.publishedAt);
      if (published) node.datePublished = published;
      const body = cleanText(review.comment);
      if (body) node.reviewBody = body;
      const title = cleanText(review.title);
      if (title && !/verified/i.test(title)) node.name = title;
      return node;
    }),
  };
}

export function listingHead(input) {
  const origin = cleanText(input.origin || DEFAULT_ORIGIN).replace(/\/+$/, '') || DEFAULT_ORIGIN;
  const slug = cleanText(input.slug);
  const canonicalPath = `/${input.segment}/${slug}`;
  const canonical = `${origin}${canonicalPath}`;
  const services = uniqueStrings(input.services);
  const title = listingDocumentTitle(input);
  const description = listingMetaDescription({ ...input, services });
  const trade = cleanText(input.trade);
  const city = cleanText(input.city);
  const state = cleanText(input.state);
  const name = cleanText(input.name);
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': listingSchemaType(input.segment, input.businessTypes),
    name,
    url: canonical,
  };
  if (trade) jsonLd.description = trade;
  const knowsAbout = uniqueStrings([trade, ...services.slice(0, 3)]);
  if (knowsAbout.length) jsonLd.knowsAbout = knowsAbout;
  if (city || state) {
    jsonLd.address = { '@type': 'PostalAddress' };
    if (city) jsonLd.address.addressLocality = city;
    if (state) jsonLd.address.addressRegion = state;
  }
  const ratings = reviewBlock(input.reviews);
  if (ratings) {
    jsonLd.aggregateRating = ratings.aggregateRating;
    jsonLd.review = ratings.review;
  }
  return { title, description, canonical, canonicalPath, jsonLd };
}

function pushNamed(bits, value) {
  if (!value) return;
  if (typeof value === 'string') {
    bits.push(value);
    return;
  }
  if (typeof value === 'object') {
    if (value.key) bits.push(value.key);
    if (value.label) bits.push(value.label);
  }
}

export function listingTradeText(listing) {
  const bits = [];
  pushNamed(bits, listing?.trade);
  pushNamed(bits, listing?.profession);
  pushNamed(bits, listing?.primaryCategoryLabel);
  pushNamed(bits, listing?.primaryCategory);
  for (const item of listing?.services || []) pushNamed(bits, item);
  for (const item of listing?.specialties || []) pushNamed(bits, item);
  for (const item of listing?.categories || []) pushNamed(bits, item);
  return bits.filter(Boolean).join(' ');
}

function normTokens(value) {
  return cleanText(value)
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .split(' ')
    .filter(Boolean);
}

function hasPhrase(value, phrase) {
  const tokens = normTokens(value);
  const want = normTokens(phrase);
  if (!want.length || tokens.length < want.length) return false;
  for (let index = 0; index <= tokens.length - want.length; index += 1) {
    if (want.every((part, offset) => tokens[index + offset] === part)) return true;
  }
  return false;
}

function phrasesForCity(slug) {
  return CITY_PHRASES[slug] || [slug.replace(/-/g, ' ')];
}

function pullCities(tokens) {
  const rest = tokens.slice();
  const cities = [];
  for (const slug of CITY_SLUGS) {
    const parts = slug.split('-');
    for (let index = 0; index <= rest.length - parts.length; index += 1) {
      if (!parts.every((part, offset) => rest[index + offset] === part)) continue;
      cities.push(slug);
      rest.splice(index, parts.length);
      break;
    }
  }
  return { cities, rest };
}

function tradeNeedles(route, tokens) {
  const needles = [];
  for (const token of tokens) {
    if (STOP_TOKENS.has(token)) continue;
    if (TRADE_ALIASES[token]) needles.push(...TRADE_ALIASES[token]);
    else if (token.length >= 4) needles.push(token);
    else if (token === 'fan') needles.push('fan');
  }
  if (String(route).includes('general-contractor')) needles.push('general contractor', 'builder');
  if (String(route).includes('property-maintenance') || String(route).includes('home-maintenance')) {
    needles.push('maintenance');
  }
  return [...new Set(needles)];
}

export function hubMatchForPath(route) {
  const path = String(route || '');
  if (!path.startsWith('/services/') && !path.startsWith('/contractors/')) return null;
  if (hasRoutePlaceholder(path)) return null;
  const tokens = path
    .split('/')
    .filter(Boolean)
    .slice(1)
    .flatMap((part) => part.split('-'))
    .filter(Boolean);
  const { cities, rest } = pullCities(tokens);
  const trades = tradeNeedles(path, rest);
  if (!cities.length && !trades.length) return null;
  return { cities, trades };
}

export function listingMatchesHub(listing, hub) {
  if (!hub || (!hub.cities?.length && !hub.trades?.length)) return false;
  if (hub.cities?.length) {
    const matched = hub.cities.some((slug) =>
      phrasesForCity(slug).some(
        (phrase) => hasPhrase(listing?.city, phrase) || hasPhrase(listing?.state, phrase),
      ),
    );
    if (!matched) return false;
  }
  if (hub.trades?.length) {
    const hay = String(listing?.tradeText || '').toLowerCase();
    if (!hub.trades.some((needle) => hay.includes(String(needle).toLowerCase()))) return false;
  }
  return true;
}

function xmlEscape(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

export function chunkList(items, size = SITEMAP_URL_LIMIT) {
  const chunks = [];
  for (let index = 0; index < items.length; index += size) chunks.push(items.slice(index, index + size));
  return chunks;
}

export function sitemapFileNames(segment, count) {
  const chunks = Math.max(1, Math.ceil(count / SITEMAP_URL_LIMIT));
  if (chunks === 1) return [`sitemap-${segment}.xml`];
  return Array.from({ length: chunks }, (_, index) => `sitemap-${segment}-${index + 1}.xml`);
}

export function buildUrlSet(entries) {
  const body = entries
    .map((entry) => {
      const lastmod = entry.lastmod ? `\n    <lastmod>${xmlEscape(entry.lastmod)}</lastmod>` : '';
      return `  <url>\n    <loc>${xmlEscape(entry.loc)}</loc>${lastmod}\n  </url>`;
    })
    .join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>\n`;
}

export function buildSitemapIndex(locs) {
  const body = locs
    .map((loc) => `  <sitemap>\n    <loc>${xmlEscape(loc)}</loc>\n  </sitemap>`)
    .join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</sitemapindex>\n`;
}

export function isoTimestamp(value) {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString();
}
