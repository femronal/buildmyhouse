import { Platform } from 'react-native';
import { createElement } from 'react';
import { GC_HOMEPAGE_META, GC_OG_IMAGE } from '@/lib/gc-landing-content';

const WEB_URL = (process.env.EXPO_PUBLIC_WEB_URL || 'https://gc.buildmyhouse.app').replace(/\/+$/, '');

export default function GcSeoJsonLd() {
  if (Platform.OS !== 'web') return null;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        name: 'BuildMyHouse Technologies',
        url: WEB_URL,
        logo: `${WEB_URL}/engineer-at-buildmyhouse.png`,
        sameAs: [
          'https://www.instagram.com/buildmyhousetech/',
          'https://linkedin.com/company/buildmyhouse',
          'https://www.youtube.com/@BuildMyHouse',
        ],
      },
      {
        '@type': 'WebSite',
        name: 'BuildMyHouse for General Contractors',
        url: WEB_URL,
        description: GC_HOMEPAGE_META.description,
        potentialAction: {
          '@type': 'RegisterAction',
          target: `${WEB_URL}/email-login`,
        },
      },
      {
        '@type': 'SoftwareApplication',
        name: 'BuildMyHouse Contractor App',
        applicationCategory: 'BusinessApplication',
        operatingSystem: 'Web, iOS, Android',
        offers: {
          '@type': 'Offer',
          price: '0',
          priceCurrency: 'NGN',
        },
        image: GC_OG_IMAGE,
      },
    ],
  };

  return createElement('script', {
    type: 'application/ld+json',
    dangerouslySetInnerHTML: { __html: JSON.stringify(jsonLd) },
  });
}
