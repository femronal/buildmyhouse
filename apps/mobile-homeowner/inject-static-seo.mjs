import fs from 'node:fs';
import path from 'node:path';

const WEB_URL = (process.env.EXPO_PUBLIC_WEB_URL || 'https://buildmyhouse.app').replace(/\/+$/, '');
const distDir = path.resolve(process.cwd(), 'dist');

/** Legacy paths that must not compete in Search; point crawlers to canonical URLs. */
const REDIRECTS = {
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
    title: 'BuildMyHouse Technologies Nigeria | Construction, Renovation, Interior Design',
    description:
      'BuildMyHouse Technologies helps homeowners and diaspora clients in Nigeria plan projects clearly, track stage progress, verify updates, and make smarter payment decisions.',
  },
  '/login': {
    title: 'Login | BuildMyHouse Technologies',
    description: 'Sign in to BuildMyHouse to manage construction, renovation, and interior projects in Nigeria.',
  },
  '/explore': {
    title: 'Explore House Designs, Homes & Land in Nigeria | BuildMyHouse Technologies',
    description:
      'Discover house designs, homes for sale, and land opportunities in Nigeria. Start your construction, renovation, or interior design project with verified professionals.',
  },
  '/rent': {
    title: 'Homes for Rent in Nigeria (Owner-Listed) | BuildMyHouse Technologies',
    description:
      'Find owner-listed rental homes in Nigeria with transparent fees and verified listings. Browse options in Lagos, Abuja, and other key cities.',
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
    title: 'Interior Design in Nigeria | BuildMyHouse',
    description:
      'Manage interior design and furnishing projects in Nigeria remotely with verified designers, staged approvals, and payment discipline.',
  },
  '/diaspora/build-in-nigeria-from-uk': {
    title: 'Build in Nigeria from the UK | Manage Your Project Remotely | BuildMyHouse',
    description:
      'A practical guide for UK-based Nigerians who want to build in Nigeria with more control. Plan your project, verify contractors, track stages, manage payments, and reduce remote-building risk with BuildMyHouse.',
  },
  '/diaspora/build-in-nigeria-from-usa-canada': {
    title: 'Build in Nigeria from the USA or Canada | BuildMyHouse',
    description:
      'Build in Nigeria from USA or Canada with clearer scope, verified contractor workflows, construction project tracking in Nigeria, and milestone payment discipline through BuildMyHouse.',
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
  const pattern = /<title[^>]*>[\s\S]*?<\/title>/i;
  const tag = `<title>${escapeHtml(title)}</title>`;
  if (pattern.test(html)) return html.replace(pattern, tag);
  return html.replace('</head>', `  ${tag}\n</head>`);
}

function patchHtmlForRoute(html, route) {
  const redirectTarget = REDIRECTS[route];
  if (redirectTarget) {
    writeRedirectHtml(route, redirectTarget);
    return null;
  }

  const canonicalUrl = route === '/' ? `${WEB_URL}/` : `${WEB_URL}${route}`;
  const pageMeta = SEO_PAGES[route];
  const robots = isPrivateRoute(route) ? 'noindex,nofollow' : 'index,follow';
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
