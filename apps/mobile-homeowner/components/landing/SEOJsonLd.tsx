import { useMemo } from 'react';
import { HOMEPAGE_META } from '@/lib/home-landing-content';
import { buildHomepageJsonLd } from '@/lib/agent-jsonld';
import { useWebSeo } from '@/lib/seo';

export default function SEOJsonLd() {
  const jsonLd = useMemo(() => buildHomepageJsonLd(), []);

  useWebSeo({
    title: HOMEPAGE_META.title,
    description: HOMEPAGE_META.description,
    canonicalPath: HOMEPAGE_META.canonicalPath,
    robots: 'index,follow',
    markdownAlternatePath: '/index.md',
    jsonLd,
  });

  return null;
}
