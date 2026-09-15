import fs from 'node:fs';
import path from 'node:path';

const WEB_URL = (process.env.EXPO_PUBLIC_WEB_URL || 'https://gc.buildmyhouse.app').replace(/\/+$/, '');
const distDir = path.resolve(process.cwd(), 'dist');
const publicDir = path.resolve(process.cwd(), 'public');
const OG_IMAGE = `${WEB_URL}/engineer-at-buildmyhouse.png`;
const PILLAR_COVER = `${WEB_URL}/gc-pillar-contractor-nigeria.jpg`;

const PILLAR_FAQS = [
  {
    question: 'Does BuildMyHouse charge general contractors to register?',
    answer: 'No. Contractor registration, verification and onboarding are currently free.',
  },
  {
    question: 'Is there a contractor subscription?',
    answer: 'There is currently no mandatory subscription simply to join BuildMyHouse.',
  },
  {
    question: 'Does BuildMyHouse take commission from my contract?',
    answer:
      'Under the current contractor model, BuildMyHouse does not deduct a percentage platform commission or transaction fee from the contractor’s agreed project amount.',
  },
  {
    question: 'Do I have to finance the homeowner’s construction project?',
    answer:
      'No. Approved project stages can include mobilisation for materials, labour, logistics and other agreed commencement requirements.',
  },
  {
    question: 'How much mobilisation does a contractor receive?',
    answer:
      'There is no single amount for every construction stage. Under the current model, roughly 30–40% may be released as stage mobilisation depending on that stage’s requirements, with the remaining amount tied to completion, required verification and homeowner approval.',
  },
  {
    question: 'Can I reject a BuildMyHouse project?',
    answer: 'Yes. Nothing should become your contractor obligation merely because an opportunity was shown to you.',
  },
  {
    question: 'Can I negotiate the proposed scope or budget?',
    answer:
      'Yes. Contractors can review the proposed scope, budget, methodology and milestones and propose changes before agreeing to the project.',
  },
  {
    question: 'Does BuildMyHouse guarantee projects?',
    answer:
      'No. Project availability depends on homeowner demand, location, contractor suitability and current pipeline.',
  },
  {
    question: 'Are Abuja contractors accepted?',
    answer: 'Yes. BuildMyHouse onboards contractors across Nigeria, including Abuja/FCT.',
  },
  {
    question: 'How quickly is the stage balance released?',
    answer:
      'After the stage has satisfied the agreed verification requirements and the homeowner approves it, the outstanding payment is released subject to ordinary banking/payment processing.',
  },
  {
    question: 'Who determines whether my work is complete?',
    answer:
      'This depends on the stage. Contractor evidence may be reviewed, and technical stages may require independent professional inspection or testing before the homeowner approves progression.',
  },
  {
    question: 'Does BuildMyHouse replace the general contractor?',
    answer:
      'No. You execute the construction. BuildMyHouse helps manage the structure around the homeowner, project stages, evidence, communication and payment progression.',
  },
];

const PILLAR_JSON_LD = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Article',
      headline:
        'BuildMyHouse for General Contractors in Nigeria: How to Win Serious Diaspora Construction Projects',
      description:
        'How Nigerian general contractors can win serious diaspora construction projects with clearer scope, stage mobilisation, independent evidence and homeowner approval — without financing the job.',
      datePublished: '2026-09-14',
      dateModified: '2026-09-14',
      author: { '@type': 'Organization', name: 'BuildMyHouse Editorial' },
      publisher: { '@type': 'Organization', name: 'BuildMyHouse Technologies', url: WEB_URL },
      mainEntityOfPage: `${WEB_URL}/articles/buildmyhouse-for-general-contractors-nigeria`,
      image: PILLAR_COVER,
      articleSection: 'General contractors',
    },
    {
      '@type': 'FAQPage',
      mainEntity: PILLAR_FAQS.map((item) => ({
        '@type': 'Question',
        name: item.question,
        acceptedAnswer: { '@type': 'Answer', text: item.answer },
      })),
    },
  ],
};

const SEO_PAGES = {
  '/': {
    title: 'BuildMyHouse for General Contractors | Verified Projects, Stage Evidence & Milestone Pay',
    description:
      'Join BuildMyHouse as a verified general contractor or skilled trade professional in Nigeria. Receive clearer briefs, document stage evidence, keep clients updated, and get paid through milestones — not scattered WhatsApp promises.',
    ogType: 'website',
  },
  '/articles/buildmyhouse-for-general-contractors-nigeria': {
    title: 'BuildMyHouse for General Contractors in Nigeria | Win Diaspora Projects',
    description:
      'How Nigerian general contractors can win serious diaspora construction projects with clearer scope, stage mobilisation, independent evidence and homeowner approval — without financing the job.',
    ogType: 'article',
    image: PILLAR_COVER,
    jsonLd: PILLAR_JSON_LD,
  },
  '/articles': {
    title: 'Articles for General Contractors in Nigeria | BuildMyHouse',
    description:
      'Practical resources for Nigerian general contractors: how to win diaspora clients, structure mobilisation, document stages, and operate inside a clearer project-and-payment workflow.',
    ogType: 'website',
    image: PILLAR_COVER,
  },
  '/terms-conditions': {
    title: 'Contractor Terms & Conditions | BuildMyHouse',
    description:
      'BuildMyHouse contractor terms: registration, verification, project acceptance, stage mobilisation, evidence and payment progression for general contractors in Nigeria.',
    ogType: 'website',
  },
};

function upsertTitle(html, title) {
  if (/<title>[\s\S]*?<\/title>/i.test(html)) {
    return html.replace(/<title>[\s\S]*?<\/title>/i, `<title>${escapeHtml(title)}</title>`);
  }
  return html.replace('</head>', `  <title>${escapeHtml(title)}</title>\n</head>`);
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;');
}

function upsertMeta(html, attr, key, content) {
  const pattern = new RegExp(`<meta[^>]+${attr}=["']${key}["'][^>]*>`, 'i');
  const tag = `<meta ${attr}="${key}" content="${String(content).replaceAll('"', '&quot;')}" />`;
  if (pattern.test(html)) return html.replace(pattern, tag);
  return html.replace('</head>', `  ${tag}\n</head>`);
}

function upsertLink(html, rel, href) {
  const pattern = new RegExp(`<link[^>]+rel=["']${rel}["'][^>]*>`, 'i');
  const tag = `<link rel="${rel}" href="${href}" />`;
  if (pattern.test(html)) return html.replace(pattern, tag);
  return html.replace('</head>', `  ${tag}\n</head>`);
}

function upsertJsonLd(html, id, payload) {
  const pattern = new RegExp(`<script id="${id}"[^>]*>[\\s\\S]*?<\\/script>`, 'i');
  const tag = `<script id="${id}" type="application/ld+json">${JSON.stringify(payload)}</script>`;
  if (pattern.test(html)) return html.replace(pattern, tag);
  return html.replace('</head>', `  ${tag}\n</head>`);
}

function htmlPathForRoute(route) {
  if (route === '/') return path.join(distDir, 'index.html');
  const flat = path.join(distDir, `${route.slice(1)}.html`);
  const nested = path.join(distDir, route.slice(1), 'index.html');
  if (fs.existsSync(flat)) return flat;
  if (fs.existsSync(nested)) return nested;
  return flat;
}

function patchHtml(html, route) {
  const page = SEO_PAGES[route];
  if (!page) return html;
  const canonicalUrl = route === '/' ? `${WEB_URL}/` : `${WEB_URL}${route}`;
  let next = html;
  next = upsertTitle(next, page.title);
  next = upsertMeta(next, 'name', 'description', page.description);
  next = upsertMeta(next, 'name', 'robots', 'index,follow');
  next = upsertMeta(next, 'name', 'google-site-verification', 'xtG6LheAyTmsA3z_UgdSE82LRapfNuop9FRsJL_N3Xw');
  next = upsertLink(next, 'canonical', canonicalUrl);
  next = upsertMeta(next, 'property', 'og:type', page.ogType || 'website');
  next = upsertMeta(next, 'property', 'og:site_name', 'BuildMyHouse Technologies');
  next = upsertMeta(next, 'property', 'og:title', page.title);
  next = upsertMeta(next, 'property', 'og:description', page.description);
  next = upsertMeta(next, 'property', 'og:url', canonicalUrl);
  next = upsertMeta(next, 'property', 'og:image', page.image || OG_IMAGE);
  next = upsertMeta(next, 'name', 'twitter:card', 'summary_large_image');
  next = upsertMeta(next, 'name', 'twitter:title', page.title);
  next = upsertMeta(next, 'name', 'twitter:description', page.description);
  next = upsertMeta(next, 'name', 'twitter:image', page.image || OG_IMAGE);
  if (page.jsonLd) next = upsertJsonLd(next, 'buildmyhouse-gc-jsonld', page.jsonLd);
  return next;
}

if (!fs.existsSync(distDir)) {
  console.error('[gc-seo] dist/ not found. Run expo export first.');
  process.exit(1);
}

const indexHtmlPath = path.join(distDir, 'index.html');
if (!fs.existsSync(indexHtmlPath)) {
  console.error('[gc-seo] dist/index.html not found.');
  process.exit(1);
}

const spaShell = fs.readFileSync(indexHtmlPath, 'utf8');

for (const route of Object.keys(SEO_PAGES)) {
  const filePath = htmlPathForRoute(route);
  if (!fs.existsSync(filePath)) {
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, spaShell, 'utf8');
    console.log(`[gc-seo] created ${path.relative(distDir, filePath)}`);
  }
  const patched = patchHtml(fs.readFileSync(filePath, 'utf8'), route);
  fs.writeFileSync(filePath, patched, 'utf8');
  console.log(`[gc-seo] patched ${route}`);
}

for (const fileName of ['robots.txt', 'sitemap.xml', 'gc-pillar-contractor-nigeria.jpg']) {
  const source = path.join(publicDir, fileName);
  if (!fs.existsSync(source)) continue;
  fs.copyFileSync(source, path.join(distDir, fileName));
  console.log(`[gc-seo] copied ${fileName}`);
}
