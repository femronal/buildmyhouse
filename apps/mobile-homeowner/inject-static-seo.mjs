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
};

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
  '/privacy-security',
  '/personal-information',
  '/app-settings',
  '/house-summary',
  '/upload-plan',
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
  '/services/plumbing-repair-nigeria': {
    title: 'Plumbing Repair in Lagos, Nigeria | BuildMyHouse',
    description:
      'Find verified plumbing repair support in Lagos, Nigeria with clearer scope, stage tracking, and homeowner approval checkpoints.',
  },
  '/services/electrical-repair-nigeria': {
    title: 'Electrical Repair in Lagos, Nigeria | BuildMyHouse',
    description:
      'Get verified electrical repair support in Lagos, Nigeria with documented updates and a safer approval flow.',
  },
  '/services/roof-leak-repair-nigeria': {
    title: 'Roof Leak Repair in Lagos, Nigeria | BuildMyHouse',
    description:
      'Handle roof leak diagnosis, materials, and repairs in Lagos, Nigeria with staged updates and evidence.',
  },
  '/services/drainage-repair-nigeria': {
    title: 'Drainage Repair in Lagos, Nigeria | BuildMyHouse',
    description:
      'Coordinate drainage fixes in Lagos, Nigeria with clearer scope and progress visibility.',
  },
  '/services/window-repair-nigeria': {
    title: 'Window Repair in Lagos, Nigeria | BuildMyHouse',
    description:
      'Find verified window and aluminum repair support in Lagos, Nigeria.',
  },
  '/services/pumping-machine-repair-nigeria': {
    title: 'Pumping Machine Repair in Lagos, Nigeria | BuildMyHouse',
    description:
      'Find verified pumping machine repair support in Lagos, Nigeria with clearer scope and progress updates.',
  },
  '/services/fan-repair-nigeria': {
    title: 'Fan Repair in Lagos, Nigeria | BuildMyHouse',
    description:
      'Get verified fan repair support in Lagos, Nigeria for ceiling, standing, and wall fans.',
  },
  '/services/rechargeable-fan-repair-nigeria': {
    title: 'Rechargeable Fan Repair in Lagos, Nigeria | BuildMyHouse',
    description:
      'Fix rechargeable and inverter fans in Lagos, Nigeria with verified artisans and documented work.',
  },
  '/services/bathroom-repair-nigeria': {
    title: 'Bathroom Repair in Lagos, Nigeria | BuildMyHouse',
    description:
      'Track bathroom repairs and upgrades in Lagos, Nigeria with stage-based coordination.',
  },
  '/services/painting-services-nigeria': {
    title: 'Painting Services in Lagos, Nigeria | BuildMyHouse',
    description:
      'Coordinate painting jobs in Lagos, Nigeria with better scope definition and quality checkpoints.',
  },
  '/services/kitchen-renovation-nigeria': {
    title: 'Kitchen Renovation in Lagos, Nigeria | BuildMyHouse',
    description:
      'Plan kitchen upgrades and installation work in Lagos, Nigeria with structured stage visibility.',
  },
  '/services/home-renovation-nigeria': {
    title: 'Home Renovation in Lagos, Nigeria | BuildMyHouse',
    description:
      'Manage renovation projects in Lagos, Nigeria with documented scope, updates, and approvals.',
  },
  '/services/general-contractors-nigeria': {
    title: 'General Contractors in Lagos, Nigeria | BuildMyHouse',
    description:
      'Find verified general contractor support in Lagos, Nigeria and execute with better workflow control.',
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
};

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
  <meta name="robots" content="noindex, follow" />
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

function upsertLink(html, rel, href) {
  const pattern = new RegExp(`<link\\s+rel="${rel}"\\s+href="[^"]*"\\s*/?>`, 'i');
  const tag = `<link rel="${rel}" href="${escapeHtml(href)}" />`;
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

function patchHtmlForRoute(html, route) {
  const redirectTarget = REDIRECTS[route];
  if (redirectTarget) {
    writeRedirectHtml(route, redirectTarget);
    return null;
  }

  const pageMeta = SEO_PAGES[route];
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

  let next = html;
  next = upsertTitle(next, title);
  next = upsertMeta(next, 'name', 'description', description);
  next = upsertMeta(next, 'name', 'robots', robots);
  next = upsertLink(next, 'canonical', canonicalUrl);
  next = upsertMeta(next, 'property', 'og:title', title);
  next = upsertMeta(next, 'property', 'og:description', description);
  next = upsertMeta(next, 'property', 'og:url', canonicalUrl);
  next = upsertMeta(next, 'name', 'twitter:title', title);
  next = upsertMeta(next, 'name', 'twitter:description', description);
  if (route === '/') {
    next = upsertJsonLd(next, 'buildmyhouse-home-jsonld', HOME_JSON_LD);
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

let patched = 0;
let redirected = 0;

for (const filePath of walkHtmlFiles(distDir)) {
  const route = routeFromHtmlFile(filePath);
  if (REDIRECTS[route]) {
    writeRedirectHtml(route, REDIRECTS[route]);
    redirected += 1;
    continue;
  }

  const html = fs.readFileSync(filePath, 'utf8');
  const next = patchHtmlForRoute(html, route);
  if (next && next !== html) {
    fs.writeFileSync(filePath, next, 'utf8');
    patched += 1;
  }
}

for (const [legacyRoute, targetRoute] of Object.entries(REDIRECTS)) {
  writeRedirectHtml(legacyRoute, targetRoute);
}

console.log(`[seo] Static SEO injection complete (${patched} patched, ${redirected + Object.keys(REDIRECTS).length} redirects).`);
