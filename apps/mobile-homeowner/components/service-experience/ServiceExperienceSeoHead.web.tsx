import Head from 'expo-router/head';
import type { ServiceExperienceContent } from '@/lib/service-experience-content';
import { buildCanonical } from '@/lib/seo-schema';

const WEB_URL = (process.env.EXPO_PUBLIC_WEB_URL || 'https://buildmyhouse.app').replace(/\/+$/, '');
const DEFAULT_OG_IMAGE = `${WEB_URL}/engineer-at-buildmyhouse.png`;

type ServiceExperienceSeoHeadProps = {
  content: ServiceExperienceContent;
  jsonLd: Record<string, unknown>[];
};

export default function ServiceExperienceSeoHead({ content, jsonLd }: ServiceExperienceSeoHeadProps) {
  const canonicalUrl = buildCanonical(content.canonicalPath);
  const ogImage = content.images.heroMain || DEFAULT_OG_IMAGE;
  const jsonLdPayload = JSON.stringify({ '@context': 'https://schema.org', '@graph': jsonLd });

  return (
    <Head>
      <title>{content.metaTitle}</title>
      <meta name="description" content={content.summary} />
      <meta name="robots" content="index,follow" />
      <link rel="canonical" href={canonicalUrl} />
      <meta property="og:type" content="website" />
      <meta property="og:site_name" content="BuildMyHouse Technologies" />
      <meta property="og:title" content={content.metaTitle} />
      <meta property="og:description" content={content.summary} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:image" content={ogImage} />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={content.metaTitle} />
      <meta name="twitter:description" content={content.summary} />
      <meta name="twitter:image" content={ogImage} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdPayload }} />
    </Head>
  );
}
