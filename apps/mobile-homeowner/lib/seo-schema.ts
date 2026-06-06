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

