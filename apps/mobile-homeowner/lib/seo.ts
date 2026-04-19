import { useEffect } from 'react';
import { Platform } from 'react-native';

type RobotsValue = 'index,follow' | 'noindex,nofollow';

type SeoOptions = {
  title: string;
  description: string;
  canonicalPath?: string;
  robots?: RobotsValue;
  ogImage?: string;
  jsonLd?: Record<string, any> | Array<Record<string, any>>;
  gscVerificationToken?: string;
};

const WEB_URL = (
  process.env.EXPO_PUBLIC_WEB_URL ||
  'https://buildmyhouse.app'
).replace(/\/+$/, '');

const DEFAULT_OG_IMAGE = `${WEB_URL}/assets/og/buildmyhouse-default.png`;

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

  if (path === '/articles' || path.startsWith('/articles/')) {
    return true;
  }

  const exactIndexable = new Set([
    '/',
    '/login',
    '/explore',
    '/rent',
    '/construction/nigeria',
    '/construction/lagos',
    '/construction/abuja',
    '/construction/port-harcourt',
    '/renovation/nigeria',
    '/diaspora/build-in-nigeria-from-abroad',
    '/diaspora/renovate-in-nigeria-from-abroad',
    '/diaspora/uk/build-in-nigeria',
    '/diaspora/uk/renovate-parents-house',
    '/guides/lagos-building-permits-and-stage-inspections',
    '/downloads/remote-renovation-scope-worksheet',
    '/downloads/lagos-permit-starter-checklist',
    '/tools/milestone-payment-schedule',
    '/tools/renovation-budget-planner',
    '/demo/project-monitoring',
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
  ]);

  return exactIndexable.has(path);
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
    upsertMetaByProperty('og:site_name', 'BuildMyHouse');
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

    injectAnalytics(process.env.EXPO_PUBLIC_GA_MEASUREMENT_ID);
  }, [
    options.title,
    options.description,
    options.canonicalPath,
    options.robots,
    options.ogImage,
    options.gscVerificationToken,
    JSON.stringify(options.jsonLd || null),
  ]);
}

export function getDefaultSeoForPath(pathname?: string): SeoOptions {
  const normalized = normalizePathname(pathname);
  const indexable = isIndexablePath(normalized);
  const canonicalPath = normalized;

  if (normalized === '/explore') {
    return {
      title: 'Explore House Designs, Homes & Land in Nigeria | BuildMyHouse',
      description:
        'Discover house designs, homes for sale, and land opportunities in Nigeria. Start your construction, renovation, or interior design project with verified professionals.',
      canonicalPath,
      robots: 'index,follow',
    };
  }

  if (normalized === '/rent') {
    return {
      title: 'Homes for Rent in Nigeria (Owner-Listed) | BuildMyHouse',
      description:
        'Find owner-listed rental homes in Nigeria with transparent fees and verified listings. Browse options in Lagos, Abuja, and other key cities.',
      canonicalPath,
      robots: 'index,follow',
    };
  }

  if (normalized === '/login' || normalized === '/') {
    return {
      title: 'BuildMyHouse Nigeria | Construction, Renovation, Interior Design',
      description:
        'Build, renovate, or redesign your home in Nigeria with vetted general contractors and milestone tracking. Also discover homes and land opportunities.',
      canonicalPath,
      robots: 'index,follow',
    };
  }

  if (normalized === '/articles' || normalized.startsWith('/articles/')) {
    return {
      title: 'BuildMyHouse Articles | Construction, Renovation, Diaspora Guides',
      description:
        'Practical BuildMyHouse articles for homeowners in Nigeria and diaspora clients planning construction, renovation, or interior projects.',
      canonicalPath,
      robots: 'index,follow',
    };
  }

  return {
    title: 'BuildMyHouse',
    description:
      'BuildMyHouse helps homeowners in Nigeria plan construction, renovation, interior design, and property decisions with verified experts.',
    canonicalPath,
    robots: indexable ? 'index,follow' : 'noindex,nofollow',
  };
}

