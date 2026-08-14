import { useEffect } from 'react';
import { Platform } from 'react-native';
import { injectRedditPixel } from '@/lib/analytics';
import { isStaticIndexablePath } from '@/lib/seo-indexable-routes';

type RobotsValue = 'index,follow' | 'noindex,nofollow' | 'noindex,follow';

type SeoOptions = {
  title: string;
  description: string;
  canonicalPath?: string;
  robots?: RobotsValue;
  ogImage?: string;
  jsonLd?: Record<string, any> | Array<Record<string, any>>;
  gscVerificationToken?: string;
  /** Static markdown twin for AI agents (link rel="alternate" type="text/markdown"). */
  markdownAlternatePath?: string;
};

const WEB_URL = (
  process.env.EXPO_PUBLIC_WEB_URL ||
  'https://buildmyhouse.app'
).replace(/\/+$/, '');
const BRAND_NAME = 'BuildMyHouse Technologies';

const DEFAULT_OG_IMAGE = `${WEB_URL}/engineer-at-buildmyhouse.png`;

function upsertMetaByName(name: string, content: string) {
  if (typeof document === 'undefined') return;
  let el = document.head.querySelector(`meta[name="${name}"]`) as any;
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute('name', name);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

function upsertMetaByProperty(property: string, content: string) {
  if (typeof document === 'undefined') return;
  let el = document.head.querySelector(`meta[property="${property}"]`) as any;
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute('property', property);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

function upsertCanonical(url: string) {
  if (typeof document === 'undefined') return;
  let el = document.head.querySelector('link[rel="canonical"]') as any;
  if (!el) {
    el = document.createElement('link');
    el.setAttribute('rel', 'canonical');
    document.head.appendChild(el);
  }
  el.setAttribute('href', url);
}

function upsertMarkdownAlternate(markdownPath?: string) {
  if (typeof document === 'undefined') return;
  const id = 'buildmyhouse-markdown-alternate';
  let el = document.getElementById(id) as HTMLLinkElement | null;

  if (!markdownPath) {
    el?.remove();
    return;
  }

  const href = markdownPath.startsWith('http')
    ? markdownPath
    : `${WEB_URL}${markdownPath.startsWith('/') ? markdownPath : `/${markdownPath}`}`;

  if (!el) {
    el = document.createElement('link');
    el.id = id;
    el.rel = 'alternate';
    document.head.appendChild(el);
  }

  el.type = 'text/markdown';
  el.href = href;
  el.title = 'Markdown version for AI agents';
}

function upsertJsonLd(schema: Record<string, any> | Array<Record<string, any>>) {
  if (typeof document === 'undefined') return;
  const id = 'buildmyhouse-jsonld';
  let el = document.getElementById(id) as any;
  if (!el) {
    el = document.createElement('script');
    el.type = 'application/ld+json';
    el.id = id;
    document.head.appendChild(el);
  }
  const payload = Array.isArray(schema)
    ? { '@context': 'https://schema.org', '@graph': schema }
    : schema;
  el.text = JSON.stringify(payload);
}

function injectAnalytics(gaMeasurementId?: string) {
  if (typeof document === 'undefined' || !gaMeasurementId) return;

  const existingScript = document.getElementById('ga-script-loader');
  if (!existingScript) {
    const gtagScript = document.createElement('script');
    gtagScript.id = 'ga-script-loader';
    gtagScript.async = true;
    gtagScript.src = `https://www.googletagmanager.com/gtag/js?id=${gaMeasurementId}`;
    document.head.appendChild(gtagScript);
  }

  const existingInline = document.getElementById('ga-inline-config') as any;
  if (!existingInline) {
    const inline = document.createElement('script');
    inline.id = 'ga-inline-config';
    inline.text = [
      'window.dataLayer = window.dataLayer || [];',
      'function gtag(){dataLayer.push(arguments);}',
      "gtag('js', new Date());",
      `gtag('config', '${gaMeasurementId}', { anonymize_ip: true });`,
    ].join('\n');
    document.head.appendChild(inline);
  }
}

export function normalizePathname(pathname?: string) {
  if (!pathname) return '/';
  const clean = pathname.replace('/(tabs)', '').replace(/\/+$/, '');
  return clean || '/';
}

export function buildCanonicalUrl(pathname?: string) {
  const normalized = normalizePathname(pathname);
  return normalized === '/' ? WEB_URL : `${WEB_URL}${normalized}`;
}

export function isIndexablePath(pathname?: string) {
  const path = normalizePathname(pathname);
  return isStaticIndexablePath(path);
}

export function useWebSeo(options: SeoOptions) {
  useEffect(() => {
    if (Platform.OS !== 'web') return;

    const canonicalUrl = options.canonicalPath
      ? `${WEB_URL}${options.canonicalPath.startsWith('/') ? options.canonicalPath : `/${options.canonicalPath}`}`
      : WEB_URL;

    document.title = options.title;
    upsertMetaByName('description', options.description);
    upsertMetaByName('robots', options.robots || 'index,follow');
    upsertCanonical(canonicalUrl);

    upsertMetaByProperty('og:type', 'website');
    upsertMetaByProperty('og:site_name', BRAND_NAME);
    upsertMetaByProperty('og:title', options.title);
    upsertMetaByProperty('og:description', options.description);
    upsertMetaByProperty('og:url', canonicalUrl);
    upsertMetaByProperty('og:image', options.ogImage || DEFAULT_OG_IMAGE);

    upsertMetaByName('twitter:card', 'summary_large_image');
    upsertMetaByName('twitter:title', options.title);
    upsertMetaByName('twitter:description', options.description);
    upsertMetaByName('twitter:image', options.ogImage || DEFAULT_OG_IMAGE);

    if (options.gscVerificationToken) {
      upsertMetaByName('google-site-verification', options.gscVerificationToken);
    }

    if (options.jsonLd) {
      upsertJsonLd(options.jsonLd);
    }

    upsertMarkdownAlternate(options.markdownAlternatePath);

    injectAnalytics(process.env.EXPO_PUBLIC_GA_MEASUREMENT_ID);
    injectRedditPixel(process.env.EXPO_PUBLIC_REDDIT_PIXEL_ID);
  }, [
    options.title,
    options.description,
    options.canonicalPath,
    options.robots,
    options.ogImage,
    options.gscVerificationToken,
    JSON.stringify(options.jsonLd || null),
    options.markdownAlternatePath,
  ]);
}

export function getDefaultSeoForPath(pathname?: string): SeoOptions {
  const normalized = normalizePathname(pathname);
  const indexable = isIndexablePath(normalized);
  const canonicalPath = normalized;

  if (normalized === '/property-projects-nigeria') {
    return {
      title: 'Property Projects in Nigeria | Repairs, Renovation & Builds | BuildMyHouse',
      description:
        'Pick your project in Nigeria — browse verified repair, upgrade, renovation, and full build scopes in Lagos and nationwide. Start property work with clearer scope and verified professionals.',
      canonicalPath,
      robots: 'index,follow',
    };
  }

  if (normalized === '/build-opportunities-nigeria') {
    return {
      title: 'Build Opportunities in Nigeria | Land, Homes & Investment Properties | BuildMyHouse',
      description:
        'Find your next build in Nigeria. Browse verified rentals, houses for sale, land, and redevelopment opportunities in Lagos, Ogun, and across Nigeria.',
      canonicalPath,
      robots: 'index,follow',
    };
  }

  if (normalized === '/explore') {
    return {
      title: 'Property Projects in Nigeria | BuildMyHouse',
      description: 'Redirecting to property projects in Nigeria.',
      canonicalPath: '/property-projects-nigeria',
      robots: 'noindex,follow',
    };
  }

  if (normalized === '/rent') {
    return {
      title: 'Build Opportunities in Nigeria | BuildMyHouse',
      description: 'Redirecting to build opportunities in Nigeria.',
      canonicalPath: '/build-opportunities-nigeria',
      robots: 'noindex,follow',
    };
  }

  if (normalized === '/login') {
    return {
      title: 'BuildMyHouse Technologies',
      description:
        'BuildMyHouse Technologies helps homeowners and diaspora clients in Nigeria plan projects clearly, track stage progress, verify updates, and make smarter payment decisions.',
      canonicalPath: '/',
      robots: 'noindex,follow',
    };
  }

  if (normalized === '/privacy-security') {
    return {
      title: 'Privacy Notice | BuildMyHouse',
      description:
        'How BuildMyHouse collects, uses, and protects your personal data when you manage repairs, renovations, and construction projects in Nigeria.',
      canonicalPath,
      robots: 'index,follow',
    };
  }

  if (normalized === '/terms-conditions') {
    return {
      title: 'Terms & Conditions | BuildMyHouse',
      description:
        'BuildMyHouse Terms of Service and platform policies for homeowners, contractors, and all users of the project management platform.',
      canonicalPath,
      robots: 'index,follow',
    };
  }

  if (normalized === '/') {
    return {
      title: 'BuildMyHouse | Manage Property Work in Nigeria From Abroad',
      description:
        'Manage repairs, renovations, and property work in Nigeria from abroad with verified workers, clearer scope, stage evidence, and more control over when work and money move forward.',
      canonicalPath,
      robots: 'index,follow',
    };
  }

  if (normalized === '/for-contractors') {
    return {
      title: 'For Contractors | BuildMyHouse',
      description:
        'Join BuildMyHouse as a verified artisan, repairer, renovator, interior specialist, or general contractor.',
      canonicalPath,
      robots: 'index,follow',
    };
  }

  if (normalized === '/start-repair') {
    return {
      title: 'Start a Tracked Repair in Lagos | BuildMyHouse',
      description:
        'Start a tracked repair in Lagos with verified workers, stage updates, and evidence before payment. Plumbing, electrical, roof leaks, drainage, painting, and maintenance.',
      canonicalPath,
      robots: 'index,follow',
    };
  }

  if (normalized === '/book-repair') {
    return {
      title: 'Book a Verified Repair in Lagos | BuildMyHouse',
      description:
        'Schedule a verified repair in Lagos online. Choose service, date, and time. BuildMyHouse service fee is free for now — pay contractor quote only.',
      canonicalPath,
      robots: 'index,follow',
    };
  }

  if (normalized === '/pricing/repairs') {
    return {
      title: 'Repair Pricing Guide Lagos | BuildMyHouse',
      description:
        'Directional repair pricing in Lagos (NGN). BuildMyHouse platform service fee is free for now; client pays verified contractor quote only.',
      canonicalPath,
      robots: 'index,follow',
    };
  }

  if (normalized === '/contractors/lagos') {
    return {
      title: 'Verified Contractors in Lagos | BuildMyHouse Directory',
      description:
        'Browse verified contractors in Lagos for plumbing, electrical, roof leak repairs, and property maintenance with tracked repair workflows.',
      canonicalPath,
      robots: 'index,follow',
    };
  }

  if (normalized.startsWith('/contractors/lagos/')) {
    return {
      title: 'Verified Contractors in Lagos | BuildMyHouse',
      description:
        'Find verified contractors in Lagos and start tracked repairs with evidence before payment on BuildMyHouse.',
      canonicalPath,
      robots: 'index,follow',
    };
  }

  if (normalized.startsWith('/services/lagos/')) {
    return {
      title: 'Repair Services in Lagos | BuildMyHouse',
      description:
        'Verified repair services in Lagos with tracked stages, photo evidence, and safer payment approvals.',
      canonicalPath,
      robots: 'index,follow',
    };
  }

  if (normalized.startsWith('/services/')) {
    return {
      title: 'Verified Repair Services in Nigeria | BuildMyHouse',
      description:
        'Find verified repairers in Lagos and Nigeria for plumbing, electrical, roof leaks, drainage, painting, and property maintenance with staged evidence before payment.',
      canonicalPath,
      robots: 'index,follow',
    };
  }

  if (normalized === '/articles' || normalized.startsWith('/articles/')) {
    return {
      title: 'BuildMyHouse Technologies Articles | Construction, Renovation, Diaspora Guides',
      description:
        'Practical BuildMyHouse articles for homeowners in Nigeria and diaspora clients planning construction, renovation, or interior projects.',
      canonicalPath,
      robots: 'index,follow',
    };
  }

  if (
    normalized === '/blog/what-tracking-your-food-taught-me-about-building-in-nigeria'
  ) {
    return {
      title: 'Why I Built BuildMyHouse | Femi Okunola Founder Story',
      description:
        'Okunola Femi shares why he built BuildMyHouse: from a cold night in Istanbul to Amala Joint, and a system for Nigerians abroad to manage property work in Nigeria with evidence, stages and control.',
      canonicalPath,
      robots: 'index,follow',
    };
  }

  if (normalized === '/blog' || normalized.startsWith('/blog/')) {
    return {
      title: 'BuildMyHouse Blog | Founder Stories & Property Guides',
      description:
        'Founder stories and practical guides on tracking repairs, renovations and construction projects in Nigeria from home or abroad.',
      canonicalPath,
      robots: 'index,follow',
    };
  }

  return {
    title: 'BuildMyHouse Technologies',
    description:
      'BuildMyHouse Technologies helps homeowners in Nigeria and abroad plan construction, renovation, and interior projects with verified workflows and stage visibility.',
    canonicalPath,
    robots: indexable ? 'index,follow' : 'noindex,nofollow',
  };
}

