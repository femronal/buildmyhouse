type FaqItem = { question: string; answer: string };
type BreadcrumbItem = { name: string; path: string };
type PageSchemaType = 'Article' | 'Service' | 'HowTo' | 'SoftwareApplication';

const WEB = (process.env.EXPO_PUBLIC_WEB_URL || 'https://buildmyhouse.app').replace(/\/+$/, '');

export function buildCanonical(path: string) {
  return `${WEB}${path.startsWith('/') ? path : `/${path}`}`;
}

function organizationNode() {
  return {
    '@type': 'Organization',
    '@id': `${WEB}/#organization`,
    name: 'BuildMyHouse',
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
      areaServed: 'Nigeria',
      serviceType: title,
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

export function buildSeoJsonLd(params: {
  path: string;
  title: string;
  description: string;
  schemaType: PageSchemaType;
  faqs?: FaqItem[];
  breadcrumbs?: BreadcrumbItem[];
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
    },
    typedPrimaryNode(params.schemaType, canonicalUrl, params.title, params.description),
  ];

  if (params.faqs?.length) {
    graph.push(faqNode(canonicalUrl, params.faqs));
  }

  if (params.breadcrumbs?.length) {
    graph.push(breadcrumbNode(canonicalUrl, params.breadcrumbs));
  }

  return graph;
}

