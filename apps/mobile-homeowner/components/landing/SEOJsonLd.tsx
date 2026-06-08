import { useMemo } from 'react';
import { FAQ_ITEMS, HOMEPAGE_META, BUILDMYHOUSE_CONTACT, BUILDMYHOUSE_SOCIALS } from '@/lib/home-landing-content';
import { useWebSeo } from '@/lib/seo';

const WEB_URL = (process.env.EXPO_PUBLIC_WEB_URL || 'https://buildmyhouse.app').replace(/\/+$/, '');

export default function SEOJsonLd() {
  const jsonLd = useMemo(() => {
    const faqMainEntity = FAQ_ITEMS.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer,
      },
    }));

    return [
      {
        '@context': 'https://schema.org',
        '@type': 'Organization',
        '@id': `${WEB_URL}/#organization`,
        name: 'BuildMyHouse',
        url: WEB_URL,
        logo: `${WEB_URL}/favicon.png`,
        telephone: BUILDMYHOUSE_CONTACT.phoneTel,
        address: {
          '@type': 'PostalAddress',
          streetAddress: '7 Ransome Kuti Rd, Akoka',
          addressLocality: 'Lagos',
          postalCode: '100001',
          addressRegion: 'Lagos',
          addressCountry: 'NG',
        },
        sameAs: BUILDMYHOUSE_SOCIALS.map((social) => social.href),
      },
      {
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        '@id': `${WEB_URL}/#website`,
        name: 'BuildMyHouse',
        url: WEB_URL,
        potentialAction: {
          '@type': 'SearchAction',
          target: `${WEB_URL}/services/{search_term_string}`,
          'query-input': 'required name=search_term_string',
        },
      },
      {
        '@context': 'https://schema.org',
        '@type': 'Service',
        '@id': `${WEB_URL}/#service`,
        name: 'BuildMyHouse property workflow platform',
        serviceType: 'Property repair, renovation, and project coordination in Lagos, Nigeria',
        provider: { '@id': `${WEB_URL}/#organization` },
        areaServed: {
          '@type': 'City',
          name: 'Lagos',
          containedInPlace: { '@type': 'Country', name: 'Nigeria' },
        },
        audience: [
          { '@type': 'Audience', audienceType: 'Homeowners in Lagos, Nigeria' },
          { '@type': 'Audience', audienceType: 'Nigerians in diaspora' },
        ],
      },
      {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        '@id': `${WEB_URL}/#faq`,
        mainEntity: faqMainEntity,
      },
    ];
  }, []);

  useWebSeo({
    title: HOMEPAGE_META.title,
    description: HOMEPAGE_META.description,
    canonicalPath: HOMEPAGE_META.canonicalPath,
    robots: 'index,follow',
    jsonLd,
  });

  return null;
}
