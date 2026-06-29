import { BUILDMYHOUSE_CONTACT, BUILDMYHOUSE_SOCIALS, FAQ_ITEMS } from '@/lib/home-landing-content';
import {
  BUILDMYHOUSE_OPENING_HOURS,
  PLATFORM_SERVICE_FEE_OFFER,
  REPAIR_PRICING_GUIDE,
} from '@/lib/agent-seo-content';

const WEB_URL = (process.env.EXPO_PUBLIC_WEB_URL || 'https://buildmyhouse.app').replace(/\/+$/, '');

export function buildHomepageJsonLd() {
  const faqMainEntity = FAQ_ITEMS.map((item) => ({
    '@type': 'Question',
    name: item.question,
    acceptedAnswer: {
      '@type': 'Answer',
      text: item.answer,
    },
  }));

  const openingHoursSpecification = BUILDMYHOUSE_OPENING_HOURS.map((slot) => ({
    '@type': 'OpeningHoursSpecification',
    dayOfWeek: slot.dayOfWeek,
    opens: slot.opens,
    closes: slot.closes,
  }));

  const pricingOffers = REPAIR_PRICING_GUIDE.map((item) => ({
    '@type': 'Offer',
    name: `${item.service} — contractor quote range`,
    priceSpecification: {
      '@type': 'PriceSpecification',
      priceCurrency: 'NGN',
      minPrice: item.lowNgn,
      maxPrice: item.highNgn,
      unitText: item.unit,
      description: item.note,
    },
    url: `${WEB_URL}/services/${item.slug}`,
    availability: 'https://schema.org/InStock',
    seller: { '@id': `${WEB_URL}/#organization` },
  }));

  return [
    {
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
      '@type': 'LocalBusiness',
      '@id': `${WEB_URL}/#localbusiness`,
      name: 'BuildMyHouse',
      url: WEB_URL,
      image: `${WEB_URL}/engineer-at-buildmyhouse.png`,
      telephone: BUILDMYHOUSE_CONTACT.phoneTel,
      priceRange: '₦₦',
      address: {
        '@type': 'PostalAddress',
        streetAddress: '7 Ransome Kuti Rd, Akoka',
        addressLocality: 'Lagos',
        postalCode: '100001',
        addressRegion: 'Lagos',
        addressCountry: 'NG',
      },
      openingHoursSpecification,
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: '4.6',
        bestRating: '5',
        worstRating: '1',
        ratingCount: '12',
        reviewCount: '12',
      },
      makesOffer: [
        {
          '@type': 'Offer',
          name: PLATFORM_SERVICE_FEE_OFFER.name,
          price: PLATFORM_SERVICE_FEE_OFFER.price,
          priceCurrency: PLATFORM_SERVICE_FEE_OFFER.priceCurrency,
          description: PLATFORM_SERVICE_FEE_OFFER.description,
          url: PLATFORM_SERVICE_FEE_OFFER.url,
          availability: 'https://schema.org/InStock',
          eligibleRegion: { '@type': 'Country', name: 'Nigeria' },
        },
        ...pricingOffers,
      ],
      parentOrganization: { '@id': `${WEB_URL}/#organization` },
    },
    {
      '@type': 'WebSite',
      '@id': `${WEB_URL}/#website`,
      name: 'BuildMyHouse',
      url: WEB_URL,
      potentialAction: {
        '@type': 'SearchAction',
        target: `${WEB_URL}/book-repair?service={search_term_string}`,
        'query-input': 'required name=search_term_string',
      },
    },
    {
      '@type': 'Service',
      '@id': `${WEB_URL}/#service`,
      name: 'BuildMyHouse verified repair coordination',
      serviceType: 'Property repair coordination in Lagos, Nigeria',
      provider: { '@id': `${WEB_URL}/#localbusiness` },
      offers: {
        '@type': 'Offer',
        name: PLATFORM_SERVICE_FEE_OFFER.name,
        price: 0,
        priceCurrency: 'NGN',
        url: `${WEB_URL}/book-repair`,
        description: PLATFORM_SERVICE_FEE_OFFER.description,
      },
      areaServed: {
        '@type': 'City',
        name: 'Lagos',
        containedInPlace: { '@type': 'Country', name: 'Nigeria' },
      },
    },
    {
      '@type': 'FAQPage',
      '@id': `${WEB_URL}/#faq`,
      mainEntity: faqMainEntity,
    },
  ];
}

export function buildBookRepairJsonLd() {
  return [
    ...buildHomepageJsonLd(),
    {
      '@type': 'WebPage',
      '@id': `${WEB_URL}/book-repair#webpage`,
      name: 'Book a verified repair | BuildMyHouse',
      url: `${WEB_URL}/book-repair`,
      isPartOf: { '@id': `${WEB_URL}/#website` },
      potentialAction: {
        '@type': 'ReserveAction',
        target: `${WEB_URL}/book-repair`,
        name: 'Schedule repair intake',
      },
    },
  ];
}

export function buildRepairPricingJsonLd() {
  return [
    ...buildHomepageJsonLd(),
    {
      '@type': 'WebPage',
      '@id': `${WEB_URL}/pricing/repairs#webpage`,
      name: 'Repair pricing guide | BuildMyHouse',
      url: `${WEB_URL}/pricing/repairs`,
      isPartOf: { '@id': `${WEB_URL}/#website` },
    },
  ];
}
