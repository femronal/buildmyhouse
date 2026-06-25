import { buildServicePageCanonicalPath, normalizeServicePageCanonicalPath } from './service-page-paths';

export type ServicePageRegion = 'lagos' | 'nigeria';

export type ServicePageCatalogEntry = {
  slug: string;
  region: ServicePageRegion;
  templateKind: string;
  canonicalPath: string;
  label: string;
  summary: string;
};

export type LandingServiceLink = {
  label: string;
  href: string;
};

export type CmsServicePageHeadlineSource = {
  canonicalPath: string;
  region: ServicePageRegion;
  isPublished: boolean;
  metaTitle?: string;
  payload?: { headline?: string };
};

const LAGOS_ENTRIES: Omit<ServicePageCatalogEntry, 'region' | 'canonicalPath'>[] = [
  {
    slug: 'plumbing-repair',
    templateKind: 'plumbing-repair',
    label: 'Plumbing Repair',
    summary: 'Burst pipes, blocked drains, and leaking fixtures in Lagos with verified plumbers and staged evidence.',
  },
  {
    slug: 'electrical-repair',
    templateKind: 'electrical-repair',
    label: 'Electrical Repair',
    summary: 'Tripping breakers, faulty wiring, and power faults in Lagos with verified electricians.',
  },
  {
    slug: 'roof-leak-repair',
    templateKind: 'roof-leak-repair',
    label: 'Roof Leak Repair',
    summary: 'Roof leak diagnosis, materials, and repairs in Lagos with photo evidence before payment.',
  },
  {
    slug: 'drainage-repair',
    templateKind: 'drainage-repair',
    label: 'Drainage Repair',
    summary: 'Blocked drains and drainage faults in Lagos with clearer scope and progress visibility.',
  },
  {
    slug: 'painting-services',
    templateKind: 'painting-services',
    label: 'Painting Services',
    summary: 'Interior and exterior painting in Lagos with quality checkpoints and staged updates.',
  },
  {
    slug: 'property-maintenance',
    templateKind: 'property-maintenance',
    label: 'Property Maintenance',
    summary: 'Ongoing property maintenance in Lagos with verified workers and tracked repair stages.',
  },
];

const NIGERIA_ENTRIES: Omit<ServicePageCatalogEntry, 'region' | 'canonicalPath'>[] = [
  {
    slug: 'plumbing-repair-nigeria',
    templateKind: 'plumbing-repair',
    label: 'Plumbing Repair',
    summary: 'Verified plumbing repair support in Nigeria with clearer scope and stage tracking.',
  },
  {
    slug: 'electrical-repair-nigeria',
    templateKind: 'electrical-repair',
    label: 'Electrical Repair',
    summary: 'Verified electrical repair support in Nigeria with documented updates and safer approvals.',
  },
  {
    slug: 'roof-leak-repair-nigeria',
    templateKind: 'roof-leak-repair',
    label: 'Roof Leak Repair',
    summary: 'Roof leak diagnosis, materials, and repairs in Nigeria with staged evidence.',
  },
  {
    slug: 'drainage-repair-nigeria',
    templateKind: 'drainage-repair',
    label: 'Drainage Repair',
    summary: 'Drainage fixes in Nigeria with clearer scope and progress visibility.',
  },
  {
    slug: 'window-repair-nigeria',
    templateKind: 'window-repair',
    label: 'Window Repair',
    summary: 'Window and aluminium repair support in Nigeria with verified workers.',
  },
  {
    slug: 'pumping-machine-repair-nigeria',
    templateKind: 'pumping-machine-repair',
    label: 'Pumping Machine Repair',
    summary: 'Water pump and pumping machine repair in Nigeria with verified technicians.',
  },
  {
    slug: 'fan-repair-nigeria',
    templateKind: 'fan-repair',
    label: 'Fan Repair',
    summary: 'Ceiling, standing, and wall fan repair in Nigeria with verified artisans.',
  },
  {
    slug: 'rechargeable-fan-repair-nigeria',
    templateKind: 'rechargeable-fan-repair',
    label: 'Rechargeable Fan Repair',
    summary: 'Rechargeable and inverter fan repair in Nigeria with documented work stages.',
  },
  {
    slug: 'bathroom-repair-nigeria',
    templateKind: 'bathroom-repair',
    label: 'Bathroom Repair',
    summary: 'Bathroom repairs and upgrades in Nigeria with stage-based coordination.',
  },
  {
    slug: 'painting-services-nigeria',
    templateKind: 'painting-services',
    label: 'Painting Services',
    summary: 'Painting jobs in Nigeria with better scope definition and quality checkpoints.',
  },
  {
    slug: 'kitchen-renovation-nigeria',
    templateKind: 'kitchen-renovation',
    label: 'Kitchen Renovation',
    summary: 'Kitchen upgrades and installation work in Nigeria with structured stage visibility.',
  },
  {
    slug: 'home-renovation-nigeria',
    templateKind: 'home-renovation',
    label: 'Home Renovation',
    summary: 'Renovation projects in Nigeria with documented scope, updates, and approvals.',
  },
  {
    slug: 'general-contractors-nigeria',
    templateKind: 'general-contractors',
    label: 'General Contractors',
    summary: 'Verified general contractor support in Nigeria with workflow control and evidence.',
  },
];

export const SERVICE_PAGE_CATALOG: ServicePageCatalogEntry[] = [
  ...LAGOS_ENTRIES.map((entry) => ({
    ...entry,
    region: 'lagos' as const,
    canonicalPath: buildServicePageCanonicalPath('lagos', entry.slug),
  })),
  ...NIGERIA_ENTRIES.map((entry) => ({
    ...entry,
    region: 'nigeria' as const,
    canonicalPath: buildServicePageCanonicalPath('nigeria', entry.slug),
  })),
];

export function getServicePageCatalog(region: ServicePageRegion) {
  return SERVICE_PAGE_CATALOG.filter((entry) => entry.region === region);
}

function stripMetaTitleSuffix(metaTitle: string) {
  return metaTitle.replace(/\s*\|\s*BuildMyHouse.*$/i, '').trim();
}

function resolveServiceLabel(
  entry: Pick<ServicePageCatalogEntry, 'label'>,
  cms?: CmsServicePageHeadlineSource,
) {
  if (cms?.isPublished && cms.payload?.headline?.trim()) {
    return cms.payload.headline.trim();
  }
  if (cms?.isPublished && cms.metaTitle?.trim()) {
    return stripMetaTitleSuffix(cms.metaTitle);
  }
  return entry.label;
}

function landingLinkLabel(baseLabel: string, region: ServicePageRegion) {
  return region === 'lagos' ? `${baseLabel} in Lagos` : `${baseLabel} in Lagos, Nigeria`;
}

function resolveCustomPageLabel(page: CmsServicePageHeadlineSource) {
  return (
    page.payload?.headline?.trim() ||
    (page.metaTitle ? stripMetaTitleSuffix(page.metaTitle) : '') ||
    page.canonicalPath
  );
}

export function buildLandingServiceLinks(
  cmsPages: CmsServicePageHeadlineSource[] = [],
): LandingServiceLink[] {
  const cmsByPath = new Map(
    cmsPages.map((page) => [normalizeServicePageCanonicalPath(page.canonicalPath), page]),
  );
  const catalogPaths = new Set(
    SERVICE_PAGE_CATALOG.map((entry) => normalizeServicePageCanonicalPath(entry.canonicalPath)),
  );

  const links: LandingServiceLink[] = SERVICE_PAGE_CATALOG.map((entry) => ({
    label: landingLinkLabel(
      resolveServiceLabel(entry, cmsByPath.get(normalizeServicePageCanonicalPath(entry.canonicalPath))),
      entry.region,
    ),
    href: normalizeServicePageCanonicalPath(entry.canonicalPath),
  }));

  for (const page of cmsPages) {
    const href = normalizeServicePageCanonicalPath(page.canonicalPath);
    if (catalogPaths.has(href) || !page.isPublished) continue;
    links.push({
      label: landingLinkLabel(resolveCustomPageLabel(page), page.region),
      href,
    });
  }

  const deduped = new Map<string, LandingServiceLink>();
  for (const link of links) {
    if (!deduped.has(link.href)) {
      deduped.set(link.href, link);
    }
  }

  return [...deduped.values()].sort((a, b) => a.label.localeCompare(b.label));
}

export function buildPopularServiceChips(
  cmsPages: CmsServicePageHeadlineSource[] = [],
): LandingServiceLink[] {
  const cmsByPath = new Map(
    cmsPages.map((page) => [normalizeServicePageCanonicalPath(page.canonicalPath), page]),
  );
  const catalogPaths = new Set(
    getServicePageCatalog('nigeria').map((entry) =>
      normalizeServicePageCanonicalPath(entry.canonicalPath),
    ),
  );

  const chips: LandingServiceLink[] = getServicePageCatalog('nigeria').map((entry) => ({
    label: resolveServiceLabel(
      entry,
      cmsByPath.get(normalizeServicePageCanonicalPath(entry.canonicalPath)),
    ),
    href: normalizeServicePageCanonicalPath(entry.canonicalPath),
  }));

  for (const page of cmsPages) {
    const href = normalizeServicePageCanonicalPath(page.canonicalPath);
    if (page.region !== 'nigeria' || catalogPaths.has(href) || !page.isPublished) continue;
    chips.push({
      label: resolveCustomPageLabel(page),
      href,
    });
  }

  return chips;
}
