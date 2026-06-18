type FaqItem = { question: string; answer: string };
type BreadcrumbItem = { name: string; path: string };
type ReviewItem = { quote: string; name: string; detail: string };
type ProcessStepItem = { label: string; title: string; body: string };
type PageSchemaType = 'Article' | 'Service' | 'HowTo' | 'SoftwareApplication';

const WEB = (process.env.EXPO_PUBLIC_WEB_URL || 'https://buildmyhouse.app').replace(/\/+$/, '');

export function buildCanonical(path: string) {
  return `${WEB}${path.startsWith('/') ? path : `/${path}`}`;
}

function organizationNode() {
  return {
    '@type': 'Organization',
    '@id': `${WEB}/#organization`,
    name: 'BuildMyHouse Technologies',
    url: WEB,
  };
}

function faqNode(canonicalUrl: string, faqs: FaqItem[]) {
  return {
    '@type': 'FAQPage',
    '@id': `${canonicalUrl}#faq`,
    mainEntity: faqs.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer,
      },
    })),
  };
}

function breadcrumbNode(canonicalUrl: string, items: BreadcrumbItem[]) {
  return {
    '@type': 'BreadcrumbList',
    '@id': `${canonicalUrl}#breadcrumbs`,
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: buildCanonical(item.path),
    })),
  };
}

function typedPrimaryNode(
  type: PageSchemaType,
  canonicalUrl: string,
  title: string,
  description: string,
  image?: string,
) {
  const base = {
    '@type': type,
    '@id': `${canonicalUrl}#primary`,
    name: title,
    headline: title,
    description,
    url: canonicalUrl,
    mainEntityOfPage: { '@id': `${canonicalUrl}#webpage` },
    provider: { '@id': `${WEB}/#organization` },
    publisher: { '@id': `${WEB}/#organization` },
    ...(image ? { image: [image] } : {}),
  };

  if (type === 'SoftwareApplication') {
    return {
      ...base,
      applicationCategory: 'BusinessApplication',
      operatingSystem: 'Web',
    };
  }

  if (type === 'Service') {
    return {
      ...base,
      areaServed: [
        {
          '@type': 'City',
          name: 'Lagos',
          containedInPlace: { '@type': 'Country', name: 'Nigeria' },
        },
        { '@type': 'Country', name: 'Nigeria' },
      ],
      serviceType: title,
      category: title,
      offers: {
        '@type': 'Offer',
        url: `${WEB}/start-repair`,
        availability: 'https://schema.org/InStock',
        price: '0',
        priceCurrency: 'NGN',
        description: 'Free intake to match verified repairers with staged evidence before payment.',
      },
    };
  }

  if (type === 'HowTo') {
    return {
      ...base,
      step: [],
    };
  }

  return base;
}

/** Normalize to ISO 8601 date (YYYY-MM-DD) for schema.org date fields. */
export function normalizeSchemaDate(input?: string | null, fallback = '2026-01-01'): string {
  const raw = String(input || '').trim();
  if (!raw) return fallback;
  const parsed = Date.parse(raw);
  if (Number.isNaN(parsed)) return fallback;
  return new Date(parsed).toISOString().slice(0, 10);
}

export function buildVideoObjectNode(params: {
  id?: string;
  name: string;
  description: string;
  embedUrl: string;
  uploadDate: string;
  thumbnailUrl: string;
  contentUrl?: string;
  mainEntityOfPage?: string;
  publisher?: Record<string, unknown>;
}) {
  return {
    '@type': 'VideoObject',
    ...(params.id ? { '@id': params.id } : {}),
    name: params.name,
    description: params.description,
    embedUrl: params.embedUrl,
    uploadDate: normalizeSchemaDate(params.uploadDate),
    thumbnailUrl: params.thumbnailUrl,
    ...(params.contentUrl ? { contentUrl: params.contentUrl } : {}),
    ...(params.mainEntityOfPage ? { mainEntityOfPage: params.mainEntityOfPage } : {}),
    ...(params.publisher ? { publisher: params.publisher } : {}),
  };
}

function reviewNodes(canonicalUrl: string, reviews: ReviewItem[]) {
  return reviews.map((review, index) => ({
    '@type': 'Review',
    '@id': `${canonicalUrl}#review-${index + 1}`,
    reviewBody: review.quote,
    author: {
      '@type': 'Person',
      name: review.name,
    },
    itemReviewed: { '@id': `${canonicalUrl}#primary` },
  }));
}

function howToNode(canonicalUrl: string, steps: ProcessStepItem[]) {
  return {
    '@type': 'HowTo',
    '@id': `${canonicalUrl}#howto`,
    name: 'BuildMyHouse tracked repair workflow',
    description: 'How homeowners start a verified repair with evidence before payment on BuildMyHouse.',
    step: steps.map((step, index) => ({
      '@type': 'HowToStep',
      position: index + 1,
      name: step.title,
      text: step.body,
    })),
  };
}

export function buildSeoJsonLd(params: {
  path: string;
  title: string;
  description: string;
  schemaType: PageSchemaType;
  faqs?: FaqItem[];
  breadcrumbs?: BreadcrumbItem[];
  image?: string;
  reviews?: ReviewItem[];
  processSteps?: ProcessStepItem[];
}) {
  const canonicalUrl = buildCanonical(params.path);
  const graph: Record<string, unknown>[] = [
    organizationNode(),
    {
      '@type': 'WebPage',
      '@id': `${canonicalUrl}#webpage`,
      url: canonicalUrl,
      name: params.title,
      description: params.description,
      isPartOf: { '@id': `${WEB}/#organization` },
      about: { '@id': `${canonicalUrl}#primary` },
      ...(params.image ? { primaryImageOfPage: { '@type': 'ImageObject', url: params.image } } : {}),
    },
    typedPrimaryNode(params.schemaType, canonicalUrl, params.title, params.description, params.image),
  ];

  if (params.faqs?.length) {
    graph.push(faqNode(canonicalUrl, params.faqs));
  }

  if (params.breadcrumbs?.length) {
    graph.push(breadcrumbNode(canonicalUrl, params.breadcrumbs));
  }

  if (params.reviews?.length) {
    graph.push(...reviewNodes(canonicalUrl, params.reviews));
  }

  if (params.processSteps?.length) {
    graph.push(howToNode(canonicalUrl, params.processSteps));
  }

  return graph;
}

