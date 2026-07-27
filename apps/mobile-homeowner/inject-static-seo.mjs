import fs from 'node:fs';
import path from 'node:path';

const WEB_URL = (process.env.EXPO_PUBLIC_WEB_URL || 'https://buildmyhouse.app').replace(/\/+$/, '');
const distDir = path.resolve(process.cwd(), 'dist');

/** Legacy paths that must not compete in Search; point crawlers to canonical URLs. */
const REDIRECTS = {
  '/login': '/',
  '/explore': '/property-projects-nigeria',
  '/rent': '/build-opportunities-nigeria',
  '/diaspora/us/build-in-nigeria': '/diaspora/build-in-nigeria-from-usa-canada',
  '/diaspora/uk/build-in-nigeria': '/diaspora/build-in-nigeria-from-uk',
  // Old year slug still appears in GSC discovery; keep a permanent redirect.
  '/articles/cost-to-build-house-in-nigeria-2024': '/articles/cost-to-build-house-in-nigeria-2026',
  // Earlier Amala Joint campaign destinations before the dedicated blog article existed.
  '/from-kitchen-to-building-site':
    '/blog/what-tracking-your-food-taught-me-about-building-in-nigeria',
  '/story': '/blog/what-tracking-your-food-taught-me-about-building-in-nigeria',
};

const API_URL = (process.env.EXPO_PUBLIC_API_URL || 'https://api.buildmyhouse.app/api').replace(
  /\/+$/,
  '',
);

const PRIVATE_ROUTE_PREFIXES = [
  '/dashboard',
  '/timeline',
  '/stage-detail',
  '/chat',
  '/profile',
  '/notifications',
  '/pending-projects',
  '/billing-payments',
  '/notification-settings',
  '/personal-information',
  '/app-settings',
  '/house-summary',
  '/upload-plan',
  '/email-login',
  '/signup',
  '/reset-password',
  '/google-callback',
  '/choose-project-type',
  '/location',
  '/onboarding-intro',
];

const SEO_PAGES = {
  '/': {
    title: 'BuildMyHouse | Find Verified Repairers, Renovators & Contractors in Lagos, Nigeria',
    description:
      'Find verified repairers, artisans, renovators, interior specialists, and contractors in Lagos, Nigeria. Manage repairs, upgrades, renovations, and property work with clearer scope, evidence, and progress updates.',
  },
  '/for-contractors': {
    title: 'For Contractors | BuildMyHouse',
    description:
      'Join BuildMyHouse as a verified artisan, repairer, renovator, or contractor and receive better project requests.',
  },
  '/privacy-security': {
    title: 'Privacy Notice | BuildMyHouse',
    description:
      'How BuildMyHouse collects, uses, and protects your personal data when you manage property projects in Nigeria.',
  },
  '/terms-conditions': {
    title: 'Terms & Conditions | BuildMyHouse',
    description:
      'BuildMyHouse Terms of Service and platform policies for homeowners, contractors, and all platform users.',
  },
  '/services/plumbing-repair-nigeria': {
    title: 'Plumber in Lagos, Nigeria | Verified & Tracked Repairs | BuildMyHouse',
    description:
      'Find verified plumbing repair support in Lagos, Nigeria with clearer scope, stage tracking, and homeowner approval checkpoints.',
  },
  '/services/electrical-repair-nigeria': {
    title: 'Electrician in Lagos, Nigeria | Safe, Verified & Tracked | BuildMyHouse',
    description:
      'Get verified electrical repair support in Lagos, Nigeria with documented updates and a safer approval flow.',
  },
  '/services/roof-leak-repair-nigeria': {
    title: 'Leaking Roof Repair in Lagos, Nigeria | Verified Roofers | BuildMyHouse',
    description:
      'Handle roof leak diagnosis, materials, and repairs in Lagos, Nigeria with staged updates and evidence.',
  },
  '/services/drainage-repair-nigeria': {
    title: 'Blocked Drain Repair in Lagos, Nigeria | Verified | BuildMyHouse',
    description:
      'Coordinate drainage fixes in Lagos, Nigeria with clearer scope and progress visibility.',
  },
  '/services/window-repair-nigeria': {
    title: 'Window & Aluminium Repair in Lagos, Nigeria | Verified | BuildMyHouse',
    description:
      'Find verified window and aluminum repair support in Lagos, Nigeria.',
  },
  '/services/pumping-machine-repair-nigeria': {
    title: 'Water Pump Repair in Lagos, Nigeria | Verified Technicians | BuildMyHouse',
    description:
      'Find verified pumping machine repair support in Lagos, Nigeria with clearer scope and progress updates.',
  },
  '/services/fan-repair-nigeria': {
    title: 'Ceiling & Standing Fan Repair in Lagos, Nigeria | BuildMyHouse',
    description:
      'Get verified fan repair support in Lagos, Nigeria for ceiling, standing, and wall fans.',
  },
  '/services/rechargeable-fan-repair-nigeria': {
    title: 'Rechargeable Fan Repair in Lagos, Nigeria | Verified Artisans | BuildMyHouse',
    description:
      'Fix rechargeable and inverter fans in Lagos, Nigeria with verified artisans and documented work.',
  },
  '/services/bathroom-repair-nigeria': {
    title: 'Bathroom Repair in Lagos, Nigeria | Tracked & Verified | BuildMyHouse',
    description:
      'Track bathroom repairs and upgrades in Lagos, Nigeria with stage-based coordination.',
  },
  '/services/painting-services-nigeria': {
    title: 'House Painters in Lagos, Nigeria | Quality-Checked Work | BuildMyHouse',
    description:
      'Coordinate painting jobs in Lagos, Nigeria with better scope definition and quality checkpoints.',
  },
  '/services/kitchen-renovation-nigeria': {
    title: 'Kitchen Renovation in Lagos, Nigeria | Tracked Stages | BuildMyHouse',
    description:
      'Plan kitchen upgrades and installation work in Lagos, Nigeria with structured stage visibility.',
  },
  '/services/home-renovation-nigeria': {
    title: 'Home Renovation in Lagos, Nigeria | Verified Contractors | BuildMyHouse',
    description:
      'Manage renovation projects in Lagos, Nigeria with documented scope, updates, and approvals.',
  },
  '/services/general-contractors-nigeria': {
    title: 'Verified General Contractors in Lagos, Nigeria | BuildMyHouse',
    description:
      'Find verified general contractor support in Lagos, Nigeria and execute with better workflow control.',
  },
  '/start-repair': {
    title: 'Start a Tracked Repair in Lagos | BuildMyHouse',
    description:
      'Start a tracked repair in Lagos with verified workers, stage updates, and evidence before payment.',
  },
  '/book-repair': {
    title: 'Book a Verified Repair in Lagos | BuildMyHouse',
    description:
      'Schedule a verified repair in Lagos online. Choose service, date, and time. BuildMyHouse service fee is free for now — pay contractor quote only.',
  },
  '/pricing/repairs': {
    title: 'Repair Pricing Guide Lagos | BuildMyHouse',
    description:
      'Directional repair pricing in Lagos (NGN). BuildMyHouse platform service fee is free for now; client pays verified contractor quote only.',
  },
  '/services/lagos/plumbing-repair': {
    title: 'Burst Pipe & Blocked Drain Repair in Lagos | Verified Plumbers | BuildMyHouse',
    description:
      'Fix burst pipes, blocked drains, and leaking fixtures in Lagos with verified plumbers, staged updates, and evidence before payment.',
  },
  '/services/lagos/electrical-repair': {
    title: 'Electrician in Lagos | Faults, Rewiring & Safe Tracked Repairs | BuildMyHouse',
    description:
      'Resolve tripping breakers, faulty wiring, and power faults in Lagos with verified electricians and documented repair stages.',
  },
  '/services/lagos/roof-leak-repair': {
    title: 'Leaking Roof Repair in Lagos | Diagnosis & Tracked Fixes | BuildMyHouse',
    description:
      'Stop roof leaks in Lagos with staged diagnosis, material approval, and verified roofers — with evidence before payment.',
  },
  '/services/lagos/drainage-repair': {
    title: 'Blocked Drain & Flooding Repair in Lagos | Verified Specialists | BuildMyHouse',
    description:
      'Fix blocked drains and flooding risks in Lagos with verified specialists, clearer scope, and stage-by-stage visibility.',
  },
  '/services/lagos/painting-services': {
    title: 'House Painters in Lagos | Interior & Exterior with Quality Checks | BuildMyHouse',
    description:
      'Coordinate interior and exterior painting in Lagos with defined scope, surface prep stages, and evidence before payment.',
  },
  '/services/lagos/property-maintenance': {
    title: 'Home Maintenance in Lagos | Tracked Repairs & Evidence Before Payment | BuildMyHouse',
    description:
      'Keep Lagos properties maintained with verified workers, recurring repair tracking, and evidence-based approvals.',
  },
  '/contractors/lagos': {
    title: 'Verified Contractors in Lagos | BuildMyHouse Directory',
    description:
      'Browse verified contractors in Lagos for plumbing, electrical, roof leak repairs, and property maintenance.',
  },
  '/contractors/lagos/plumbing-repair': {
    title: 'Plumbing Repair Contractors in Lagos | BuildMyHouse',
    description: 'Browse verified plumbers serving Lagos with ratings and review counts on BuildMyHouse.',
  },
  '/contractors/lagos/electrical-repair': {
    title: 'Electrical Repair Contractors in Lagos | BuildMyHouse',
    description: 'Browse verified electricians in Lagos for faults, rewiring, and safe staged repairs.',
  },
  '/contractors/lagos/roof-leak-repair': {
    title: 'Roof Leak Repair Contractors in Lagos | BuildMyHouse',
    description: 'Browse verified roofers in Lagos for leak diagnosis, materials, and tracked fixes.',
  },
  '/property-projects-nigeria': {
    title: 'Property Projects in Nigeria | Repairs, Renovation & Builds | BuildMyHouse',
    description:
      'Pick your project in Nigeria — browse verified repair, upgrade, renovation, and full build scopes in Lagos and nationwide. Start property work with clearer scope and verified professionals.',
  },
  '/build-opportunities-nigeria': {
    title: 'Build Opportunities in Nigeria | Land, Homes & Investment Properties | BuildMyHouse',
    description:
      'Find your next build in Nigeria. Browse verified rentals, houses for sale, land, and redevelopment opportunities in Lagos, Ogun, and across Nigeria.',
  },
  '/articles': {
    title: 'BuildMyHouse Technologies Articles | Construction, Renovation, Diaspora Guides',
    description:
      'Practical BuildMyHouse articles for homeowners in Nigeria and diaspora clients planning construction, renovation, or interior projects.',
  },
  '/articles/cost-to-build-house-in-nigeria-2026': {
    title: 'Cost to Build a House in Nigeria (2026 Guide) | BuildMyHouse',
    description:
      'A practical 2026 guide to building costs in Nigeria, with budget ranges, hidden expenses, and a safer execution workflow for local and diaspora homeowners.',
  },
  '/articles/renovation-checklist-for-homeowners-nigeria': {
    title: 'Renovation Checklist for Homeowners in Nigeria | BuildMyHouse',
    description:
      'A practical renovation checklist for homeowners in Nigeria covering scope, budgeting, contractor selection, stages, and payment discipline.',
  },
  '/articles/diaspora-guide-build-in-nigeria-from-abroad': {
    title: 'Diaspora Guide: Build in Nigeria from Abroad | BuildMyHouse',
    description:
      'A practical diaspora guide to building in Nigeria from abroad with clearer stages, contractor accountability, and remote visibility.',
  },
  '/blog': {
    title: 'BuildMyHouse Blog | Founder Stories & Property Guides',
    description:
      'Founder stories and practical guides on tracking repairs, renovations and construction projects in Nigeria from home or abroad.',
  },
  '/blog/what-tracking-your-food-taught-me-about-building-in-nigeria': {
    title: 'Track Building Projects in Nigeria from Abroad | BuildMyHouse',
    description:
      'See how BuildMyHouse helps Nigerians abroad monitor repairs, renovations and construction projects in Nigeria through clear stages, verified professionals and progress evidence.',
    ogType: 'article',
  },
  '/construction/nigeria': {
    title: 'BuildMyHouse Nigeria | Construction Services in Nigeria for Diaspora Homeowners',
    description:
      'BuildMyHouse Nigeria is a property project management platform for homeowners and diaspora users planning house construction in Nigeria, renovation, repairs, and interior upgrades with stage tracking and milestone payment discipline.',
  },
  '/construction/lagos': {
    title: 'House Construction in Lagos | BuildMyHouse',
    description:
      'Build in Lagos with clearer scope, verified contractor workflows, stage tracking, and payment discipline through BuildMyHouse.',
  },
  '/renovation/nigeria': {
    title: 'Home Renovation in Nigeria | BuildMyHouse',
    description:
      'Plan and manage renovation projects in Nigeria with clearer scope, contractor accountability, and remote visibility through BuildMyHouse.',
  },
  '/interior-design/nigeria': {
    title: 'Interior Design in Lagos, Nigeria | BuildMyHouse',
    description:
      'Manage interior design and furnishing projects in Lagos, Nigeria remotely with verified designers, staged approvals, and payment discipline.',
  },
  '/diaspora/build-in-nigeria-from-uk': {
    title: 'Build in Lagos, Nigeria from the UK | Manage Your Project Remotely | BuildMyHouse',
    description:
      'A practical guide for UK-based Nigerians who want to build in Lagos, Nigeria with more control. Plan your project, verify contractors, track stages, manage payments, and reduce remote-building risk with BuildMyHouse.',
  },
  '/diaspora/build-in-nigeria-from-usa-canada': {
    title: 'Build in Lagos, Nigeria from the USA or Canada | BuildMyHouse',
    description:
      'Build in Lagos, Nigeria from USA or Canada with clearer scope, verified contractor workflows, construction project tracking in Lagos, and milestone payment discipline through BuildMyHouse.',
  },
  '/diaspora/build-in-nigeria-from-abroad': {
    title: 'Build in Nigeria from Abroad | BuildMyHouse',
    description:
      'Manage construction and renovation projects in Nigeria from abroad with clearer stages, verified contractors, and payment discipline through BuildMyHouse.',
  },
  '/diaspora/renovate-in-nigeria-from-abroad': {
    title: 'Renovate in Nigeria from Abroad | BuildMyHouse',
    description:
      'Plan and manage renovation projects in Nigeria from abroad with clearer scope, contractor accountability, and remote visibility.',
  },
  '/diaspora/uk/renovate-parents-house': {
    title: "Renovate Your Parents' House in Nigeria from the UK | BuildMyHouse",
    description:
      "A practical guide for UK-based Nigerians who want to renovate their parents' house in Nigeria with more control, clearer stage tracking, and better payment discipline.",
  },
  '/demo/project-monitoring': {
    title: 'Remote Project Monitoring Demo | BuildMyHouse',
    description:
      'Preview how BuildMyHouse helps diaspora homeowners watch stage progress, receive notifications, and stay in control of payment flow.',
  },
  '/land-verification-in-nigeria-guide': {
    title: 'Land Verification in Nigeria Guide | BuildMyHouse',
    description:
      'Practical steps to verify land in Nigeria before you buy or build — documents, checks, and how to reduce remote purchase risk.',
  },
  '/building-permit-in-lagos-nigeria-guide': {
    title: 'Building Permit in Lagos, Nigeria Guide | BuildMyHouse',
    description:
      'Understand Lagos building permits, inspections, and when repairs vs renovations need approval — for local and diaspora homeowners.',
  },
  '/how-to-choose-a-general-contractor-in-nigeria': {
    title: 'How to Choose a General Contractor in Nigeria | BuildMyHouse',
    description:
      'A practical checklist for hiring a verified general contractor in Nigeria with clearer scope, stages, and payment discipline.',
  },
};

const PROJECT_MONITORING_VIDEO = {
  title: 'See How Project Monitoring Works',
  description:
    'Watch this quick walkthrough to understand how project tracking and updates look on BuildMyHouse.',
  youtubeUrl: 'https://youtu.be/LuIZYt1DNzw?si=n3b9RvIPkMyY10NS',
  youtubeEmbedUrl: 'https://www.youtube.com/embed/LuIZYt1DNzw',
  youtubeUploadDate: '2026-05-26',
  videoId: 'LuIZYt1DNzw',
  watchPagePath: '/demo/project-monitoring',
};

function buildProjectMonitoringVideoJsonLd() {
  const canonicalUrl = `${WEB_URL}${PROJECT_MONITORING_VIDEO.watchPagePath}`;
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'VideoObject',
        '@id': `${canonicalUrl}#project-monitoring-video`,
        name: PROJECT_MONITORING_VIDEO.title,
        description: PROJECT_MONITORING_VIDEO.description,
        embedUrl: PROJECT_MONITORING_VIDEO.youtubeEmbedUrl,
        contentUrl: PROJECT_MONITORING_VIDEO.youtubeUrl,
        uploadDate: PROJECT_MONITORING_VIDEO.youtubeUploadDate,
        thumbnailUrl: `https://img.youtube.com/vi/${PROJECT_MONITORING_VIDEO.videoId}/hqdefault.jpg`,
        mainEntityOfPage: canonicalUrl,
        publisher: {
          '@type': 'Organization',
          '@id': `${WEB_URL}/#organization`,
          name: 'BuildMyHouse Technologies',
        },
      },
    ],
  };
}

const HOME_JSON_LD = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Organization',
      '@id': `${WEB_URL}/#organization`,
      name: 'BuildMyHouse',
      url: WEB_URL,
      logo: `${WEB_URL}/favicon.png`,
    },
    {
      '@type': 'WebSite',
      '@id': `${WEB_URL}/#website`,
      name: 'BuildMyHouse',
      url: WEB_URL,
    },
    {
      '@type': 'Service',
      '@id': `${WEB_URL}/#service`,
      name: 'BuildMyHouse property workflow platform',
      serviceType: 'Property repair and project coordination in Lagos, Nigeria',
      provider: { '@id': `${WEB_URL}/#organization` },
      areaServed: {
        '@type': 'City',
        name: 'Lagos',
        containedInPlace: { '@type': 'Country', name: 'Nigeria' },
      },
    },
    {
      '@type': 'FAQPage',
      '@id': `${WEB_URL}/#faq`,
      mainEntity: [
        {
          '@type': 'Question',
          name: 'What is BuildMyHouse?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'BuildMyHouse is a trust-and-workflow platform for property work in Lagos, Nigeria.',
          },
        },
        {
          '@type': 'Question',
          name: 'Can I use BuildMyHouse if I live abroad?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Yes. BuildMyHouse supports diaspora users who need structured remote project visibility.',
          },
        },
        {
          '@type': 'Question',
          name: 'Can I find repairers on BuildMyHouse?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Yes. You can start with repairs like plumbing, electrical faults, roof leaks, and more.',
          },
        },
      ],
    },
  ],
};

function routeFromHtmlFile(filePath) {
  const rel = path.relative(distDir, filePath).replace(/\\/g, '/');
  if (rel === 'index.html') return '/';
  return `/${rel.replace(/index\.html$/, '').replace(/\.html$/, '').replace(/\/$/, '')}`;
}

function isPrivateRoute(route) {
  return PRIVATE_ROUTE_PREFIXES.some((prefix) => route === prefix || route.startsWith(`${prefix}/`));
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function writeRedirectHtml(route, targetRoute) {
  const targetUrl = `${WEB_URL}${targetRoute}`;
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Redirecting…</title>
  <meta name="robots" content="noindex,follow" />
  <link rel="canonical" href="${targetUrl}" />
  <meta http-equiv="refresh" content="0; url=${targetUrl}" />
</head>
<body>
  <p><a href="${targetUrl}">Continue to ${escapeHtml(targetRoute)}</a></p>
</body>
</html>
`;
  const filePath =
    route === '/'
      ? path.join(distDir, 'index.html')
      : path.join(distDir, `${route.slice(1)}.html`);
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, html, 'utf8');
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

function upsertLink(html, rel, href, extraAttrs = '') {
  const pattern = new RegExp(`<link\\s+[^>]*rel=["']${rel}["'][^>]*>`, 'i');
  const tag = `<link rel="${rel}" href="${escapeHtml(href)}"${extraAttrs ? ` ${extraAttrs}` : ''} />`;
  if (pattern.test(html)) return html.replace(pattern, tag);
  return html.replace('</head>', `  ${tag}\n</head>`);
}

function upsertTitle(html, title) {
  const withoutTitles = html.replace(/<title[^>]*>[\s\S]*?<\/title>/gi, '');
  return withoutTitles.replace('</head>', `  <title>${escapeHtml(title)}</title>\n</head>`);
}

function upsertJsonLd(html, id, payload) {
  const scriptPattern = new RegExp(
    `<script\\s+type="application/ld\\+json"\\s+id="${id}">[\\s\\S]*?<\\/script>`,
    'i',
  );
  const json = JSON.stringify(payload).replace(/</g, '\\u003c');
  const scriptTag = `<script type="application/ld+json" id="${id}">${json}</script>`;
  if (scriptPattern.test(html)) {
    return html.replace(scriptPattern, scriptTag);
  }
  return html.replace('</head>', `  ${scriptTag}\n</head>`);
}

const MARKDOWN_ALTERNATES = {
  '/': '/index.md',
  '/book-repair': '/book-repair.md',
  '/pricing/repairs': '/pricing/repairs.md',
};

function patchHtmlForRoute(html, route, dynamicSeoPages = SEO_PAGES) {
  const redirectTarget = REDIRECTS[route];
  if (redirectTarget) {
    writeRedirectHtml(route, redirectTarget);
    return null;
  }

  const pageMeta = dynamicSeoPages[route];
  const canonicalRoute = pageMeta?.canonicalPath || route;
  const canonicalUrl =
    canonicalRoute === '/' ? `${WEB_URL}/` : `${WEB_URL}${canonicalRoute}`;
  const robots =
    pageMeta?.robots ||
    (isPrivateRoute(route) ? 'noindex,nofollow' : 'index,follow');
  const title = pageMeta?.title || 'BuildMyHouse Technologies';
  const description =
    pageMeta?.description ||
    'BuildMyHouse Technologies helps homeowners in Nigeria and abroad plan construction, renovation, and interior projects with verified workflows and stage visibility.';
  const image =
    pageMeta?.image ||
    `${WEB_URL}/engineer-at-buildmyhouse.png`;

  let next = html;
  next = upsertTitle(next, title);
  next = upsertMeta(next, 'name', 'description', description);
  next = upsertMeta(next, 'name', 'robots', robots);
  next = upsertLink(next, 'canonical', canonicalUrl);
  next = upsertMeta(next, 'property', 'og:type', pageMeta?.ogType || 'website');
  next = upsertMeta(next, 'property', 'og:title', title);
  next = upsertMeta(next, 'property', 'og:description', description);
  next = upsertMeta(next, 'property', 'og:url', canonicalUrl);
  next = upsertMeta(next, 'property', 'og:image', image);
  next = upsertMeta(next, 'name', 'twitter:card', 'summary_large_image');
  next = upsertMeta(next, 'name', 'twitter:title', title);
  next = upsertMeta(next, 'name', 'twitter:description', description);
  next = upsertMeta(next, 'name', 'twitter:image', image);
  const markdownPath = MARKDOWN_ALTERNATES[route];
  if (markdownPath) {
    next = upsertLink(
      next,
      'alternate',
      `${WEB_URL}${markdownPath}`,
      'type="text/markdown" title="Markdown version for AI agents"',
    );
  }
  if (route === '/') {
    next = upsertJsonLd(next, 'buildmyhouse-home-jsonld', HOME_JSON_LD);
  }
  if (route === '/demo/project-monitoring') {
    const payload = buildProjectMonitoringVideoJsonLd();
    next = upsertJsonLd(next, 'buildmyhouse-demo-video-jsonld', payload);
  }
  if (pageMeta?.jsonLd) {
    next = upsertJsonLd(next, 'buildmyhouse-route-jsonld', pageMeta.jsonLd);
  }
  return next;
}

function walkHtmlFiles(dir, files = []) {
  if (!fs.existsSync(dir)) return files;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) walkHtmlFiles(fullPath, files);
    else if (entry.isFile() && entry.name.endsWith('.html')) files.push(fullPath);
  }
  return files;
}

if (!fs.existsSync(distDir)) {
  console.error('[seo] dist/ not found. Run expo export first.');
  process.exit(1);
}

const indexHtmlPath = path.join(distDir, 'index.html');
if (!fs.existsSync(indexHtmlPath)) {
  console.error('[seo] dist/index.html not found.');
  process.exit(1);
}
const spaShellHtml = fs.readFileSync(indexHtmlPath, 'utf8');

function htmlPathForRoute(route) {
  if (route === '/') return indexHtmlPath;
  return path.join(distDir, `${route.slice(1)}.html`);
}

function ensureRouteHtml(route) {
  if (route === '/') return { filePath: indexHtmlPath, created: false };
  const filePath = htmlPathForRoute(route);
  if (!fs.existsSync(filePath)) {
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, spaShellHtml, 'utf8');
    return { filePath, created: true };
  }
  return { filePath, created: false };
}

async function fetchJsonArray(pathname) {
  try {
    const response = await fetch(`${API_URL}${pathname}`);
    if (!response.ok) return [];
    const data = await response.json();
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

function buildArticleJsonLd(article) {
  const canonicalPath = String(article.canonicalPath || '').trim();
  if (!canonicalPath.startsWith('/articles/')) return null;
  const canonicalUrl = `${WEB_URL}${canonicalPath}`;
  const title = String(article.title || '').trim();
  const description = String(article.description || article.excerpt || '').trim();
  const image = String(article.coverImageUrl || '').trim();
  const datePublished = String(article.publishedAt || article.updatedAt || '').trim();
  const dateModified = String(article.updatedAt || article.publishedAt || '').trim();

  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    mainEntityOfPage: canonicalUrl,
    headline: title,
    description,
    image: image ? [image] : undefined,
    datePublished: datePublished || undefined,
    dateModified: dateModified || undefined,
    author: {
      '@type': 'Person',
      name: String(article.authorName || 'BuildMyHouse Editorial'),
    },
    publisher: {
      '@type': 'Organization',
      name: 'BuildMyHouse Technologies',
      logo: {
        '@type': 'ImageObject',
        url: `${WEB_URL}/favicon.png`,
      },
    },
  };
}

async function fetchCmsSeoPages() {
  const [articles, servicePages] = await Promise.all([
    fetchJsonArray('/articles'),
    fetchJsonArray('/service-pages'),
  ]);

  /** @type {Record<string, { title: string; description: string; image?: string; ogType?: string; jsonLd?: Record<string, unknown> }>} */
  const pages = {};

  for (const article of articles) {
    if (article?.isPublished === false) continue;
    const route = String(article?.canonicalPath || '').trim();
    if (!route.startsWith('/articles/')) continue;
    const title = String(article?.title || '').trim();
    const description = String(article?.description || article?.excerpt || '').trim();
    if (!title || !description) continue;
    pages[route] = {
      title,
      description,
      image: String(article?.coverImageUrl || '').trim() || undefined,
      ogType: 'article',
      jsonLd: buildArticleJsonLd(article) || undefined,
    };
  }

  for (const service of servicePages) {
    if (service?.isPublished === false) continue;
    const route = String(service?.canonicalPath || '').trim();
    if (!route.startsWith('/services/')) continue;
    const payload = service?.payload && typeof service.payload === 'object' ? service.payload : {};
    const title = String(service?.metaTitle || payload.metaTitle || '').trim();
    const description = String(service?.summary || payload.summary || payload.heroLead || '').trim();
    if (!title || !description) continue;
    const image =
      String(payload?.images?.heroMain || payload?.images?.archive?.[0] || '').trim() || undefined;
    pages[route] = {
      title,
      description,
      image,
      ogType: 'website',
    };
  }

  return pages;
}

function loadStaticIndexableRoutes() {
  try {
    const routesConfig = JSON.parse(
      fs.readFileSync(path.resolve(process.cwd(), 'lib/seo-indexable-routes.json'), 'utf8'),
    );
    return Array.isArray(routesConfig.exact) ? routesConfig.exact : [];
  } catch {
    return [];
  }
}

function writeNotFoundHtml() {
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Page not found | BuildMyHouse</title>
  <meta name="robots" content="noindex,follow" />
  <link rel="canonical" href="${WEB_URL}/404" />
  <style>
    body { margin: 0; font-family: Georgia, serif; background: #060706; color: #f3f0e8; }
    main { min-height: 100vh; display: grid; place-items: center; padding: 2rem; text-align: center; }
    a { color: #22c55e; }
  </style>
</head>
<body>
  <main>
    <div>
      <p>404</p>
      <h1>This page is not available.</h1>
      <p><a href="/">Back to BuildMyHouse</a></p>
    </div>
  </main>
</body>
</html>
`;
  fs.writeFileSync(path.join(distDir, '404.html'), html, 'utf8');
}

const cmsSeoPages = await fetchCmsSeoPages();
const dynamicSeoPages = { ...SEO_PAGES, ...cmsSeoPages };
const indexableRoutes = loadStaticIndexableRoutes();
const routesToEnsure = Array.from(
  new Set([
    ...Object.keys(dynamicSeoPages),
    ...indexableRoutes,
    ...Object.keys(REDIRECTS),
  ]),
).filter((route) => route && route.startsWith('/'));

let ensured = 0;
for (const route of routesToEnsure) {
  if (REDIRECTS[route]) {
    writeRedirectHtml(route, REDIRECTS[route]);
    continue;
  }
  const { created } = ensureRouteHtml(route);
  if (created) ensured += 1;
}

let patched = 0;
let redirected = 0;

for (const filePath of walkHtmlFiles(distDir)) {
  const route = routeFromHtmlFile(filePath);
  if (route === '/404') continue;
  if (REDIRECTS[route]) {
    writeRedirectHtml(route, REDIRECTS[route]);
    redirected += 1;
    continue;
  }

  const html = fs.readFileSync(filePath, 'utf8');
  const next = patchHtmlForRoute(html, route, dynamicSeoPages);
  if (next && next !== html) {
    fs.writeFileSync(filePath, next, 'utf8');
    patched += 1;
  }
}

for (const [legacyRoute, targetRoute] of Object.entries(REDIRECTS)) {
  writeRedirectHtml(legacyRoute, targetRoute);
}

writeNotFoundHtml();

const publicDir = path.resolve(process.cwd(), 'public');
const agentMarkdownFiles = ['index.md', 'book-repair.md', 'pricing/repairs.md', 'robots.txt', 'llms.txt', 'sitemap.xml'];
for (const relativePath of agentMarkdownFiles) {
  const source = path.join(publicDir, relativePath);
  if (!fs.existsSync(source)) continue;
  const target = path.join(distDir, relativePath);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.copyFileSync(source, target);
}

// Fail the build if sitemap URLs would soft-404 (missing per-route HTML).
const sitemapPath = path.join(distDir, 'sitemap.xml');
if (fs.existsSync(sitemapPath)) {
  const sitemap = fs.readFileSync(sitemapPath, 'utf8');
  const locs = [...sitemap.matchAll(/<loc>(.*?)<\/loc>/g)].map((match) => match[1]);
  const missing = [];
  for (const loc of locs) {
    const route =
      loc === WEB_URL || loc === `${WEB_URL}/`
        ? '/'
        : loc.startsWith(WEB_URL)
          ? loc.slice(WEB_URL.length)
          : '';
    if (!route) continue;
    if (REDIRECTS[route]) continue;
    if (!fs.existsSync(htmlPathForRoute(route))) {
      missing.push(route);
    }
  }
  if (missing.length) {
    console.error('[seo] Sitemap routes missing per-route HTML (would soft-404 to homepage):');
    for (const route of missing) console.error(`  - ${route}`);
    process.exit(1);
  }
}

console.log(
  `[seo] Static SEO injection complete (${patched} patched, ${ensured} ensured, ${Object.keys(cmsSeoPages).length} CMS SEO pages, ${redirected + Object.keys(REDIRECTS).length} redirects).`,
);
