import { useEffect } from 'react';
import { Platform } from 'react-native';

type SeoOptions = {
  title: string;
  description: string;
  canonicalPath?: string;
  robots?: string;
  ogImage?: string;
  jsonLd?: Record<string, unknown> | Array<Record<string, unknown>>;
};

const WEB_URL = (process.env.EXPO_PUBLIC_WEB_URL || 'https://gc.buildmyhouse.app').replace(/\/+$/, '');

function upsertMetaByName(name: string, content: string) {
  if (typeof document === 'undefined') return;
  let el = document.head.querySelector(`meta[name="${name}"]`) as HTMLMetaElement | null;
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute('name', name);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

function upsertMetaByProperty(property: string, content: string) {
  if (typeof document === 'undefined') return;
  let el = document.head.querySelector(`meta[property="${property}"]`) as HTMLMetaElement | null;
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute('property', property);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

function upsertCanonical(url: string) {
  if (typeof document === 'undefined') return;
  let el = document.head.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
  if (!el) {
    el = document.createElement('link');
    el.setAttribute('rel', 'canonical');
    document.head.appendChild(el);
  }
  el.setAttribute('href', url);
}

function upsertJsonLd(schema: Record<string, unknown> | Array<Record<string, unknown>>) {
  if (typeof document === 'undefined') return;
  const id = 'buildmyhouse-gc-jsonld';
  let el = document.getElementById(id) as HTMLScriptElement | null;
  if (!el) {
    el = document.createElement('script');
    el.type = 'application/ld+json';
    el.id = id;
    document.head.appendChild(el);
  }
  el.text = JSON.stringify(
    Array.isArray(schema) ? { '@context': 'https://schema.org', '@graph': schema } : schema,
  );
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
    upsertMetaByProperty('og:type', 'article');
    upsertMetaByProperty('og:site_name', 'BuildMyHouse Technologies');
    upsertMetaByProperty('og:title', options.title);
    upsertMetaByProperty('og:description', options.description);
    upsertMetaByProperty('og:url', canonicalUrl);
    if (options.ogImage) upsertMetaByProperty('og:image', options.ogImage);
    upsertMetaByName('twitter:card', 'summary_large_image');
    upsertMetaByName('twitter:title', options.title);
    upsertMetaByName('twitter:description', options.description);
    if (options.ogImage) upsertMetaByName('twitter:image', options.ogImage);
    if (options.jsonLd) upsertJsonLd(options.jsonLd);
  }, [
    options.title,
    options.description,
    options.canonicalPath,
    options.robots,
    options.ogImage,
    JSON.stringify(options.jsonLd || null),
  ]);
}
