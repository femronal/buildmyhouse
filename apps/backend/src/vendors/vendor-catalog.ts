export type VendorCategoryGroup =
  | 'Structure'
  | 'Finishes'
  | 'Doors & windows'
  | 'Plumbing & sanitary'
  | 'Electrical & power'
  | 'Wood & furniture'
  | 'Outdoor';

export type VendorCategory = {
  slug: string;
  label: string;
  group: VendorCategoryGroup;
  /** Older slugs that should still match this category. */
  aliases?: string[];
};

export const VENDOR_CATEGORY_GROUPS: VendorCategoryGroup[] = [
  'Structure',
  'Finishes',
  'Doors & windows',
  'Plumbing & sanitary',
  'Electrical & power',
  'Wood & furniture',
  'Outdoor',
];

export const VENDOR_CATEGORIES: VendorCategory[] = [
  { slug: 'cement', label: 'Cement', group: 'Structure' },
  { slug: 'reinforcement-steel', label: 'Steel', group: 'Structure' },
  { slug: 'concrete-blocks', label: 'Blocks', group: 'Structure' },
  { slug: 'sand', label: 'Sand', group: 'Structure' },
  { slug: 'granite-aggregates', label: 'Granite & aggregates', group: 'Structure' },
  { slug: 'formwork-scaffolding', label: 'Formwork & scaffolding', group: 'Structure' },
  { slug: 'roofing', label: 'Roofing', group: 'Structure' },
  { slug: 'waterproofing', label: 'Waterproofing', group: 'Structure' },
  { slug: 'tiles', label: 'Tiles', group: 'Finishes' },
  { slug: 'paint', label: 'Paint', group: 'Finishes' },
  { slug: 'ceilings', label: 'Ceilings', group: 'Finishes', aliases: ['pop-ceilings'] },
  { slug: 'flooring', label: 'Flooring', group: 'Finishes' },
  { slug: 'sealants-adhesives-chemicals', label: 'Sealants, adhesives & chemicals', group: 'Finishes' },
  { slug: 'doors', label: 'Doors', group: 'Doors & windows' },
  { slug: 'aluminium-windows', label: 'Aluminium windows', group: 'Doors & windows' },
  { slug: 'glass-glazing', label: 'Glass & glazing', group: 'Doors & windows' },
  { slug: 'aluminium-profiles-cladding', label: 'Aluminium profiles & cladding', group: 'Doors & windows' },
  { slug: 'hardware-ironmongery', label: 'Hardware & ironmongery', group: 'Doors & windows' },
  { slug: 'plumbing-pipes', label: 'Plumbing', group: 'Plumbing & sanitary' },
  { slug: 'sanitary-ware', label: 'Sanitary ware', group: 'Plumbing & sanitary' },
  { slug: 'water-pumps', label: 'Pumps', group: 'Plumbing & sanitary' },
  { slug: 'water-tanks', label: 'Water tanks', group: 'Plumbing & sanitary' },
  { slug: 'electrical-cables', label: 'Electrical cables', group: 'Electrical & power' },
  { slug: 'lighting-electrical-fittings', label: 'Lighting & electrical fittings', group: 'Electrical & power' },
  { slug: 'solar-panels', label: 'Solar', group: 'Electrical & power' },
  { slug: 'inverters', label: 'Inverters', group: 'Electrical & power' },
  { slug: 'batteries', label: 'Batteries', group: 'Electrical & power' },
  { slug: 'generators', label: 'Generators', group: 'Electrical & power' },
  { slug: 'air-conditioning-ventilation', label: 'Air conditioning & ventilation', group: 'Electrical & power' },
  { slug: 'cctv-security', label: 'CCTV & security', group: 'Electrical & power' },
  { slug: 'timber-wood-panels', label: 'Timber & wood panels', group: 'Wood & furniture' },
  { slug: 'furniture-joinery', label: 'Furniture & joinery', group: 'Wood & furniture' },
  { slug: 'gates-fencing-steelwork', label: 'Gates, fencing & steelwork', group: 'Outdoor' },
  { slug: 'paving-interlocking', label: 'Paving & interlocking', group: 'Outdoor' },
];

export const VENDOR_BUSINESS_TYPES = [
  'manufacturer',
  'importer',
  'wholesaler',
  'retailer',
  'distributor',
] as const;

export const VENDOR_DELIVERY_STATUSES = ['not_confirmed', 'delivers', 'pickup_only'] as const;
export type VendorDeliveryStatusValue = (typeof VENDOR_DELIVERY_STATUSES)[number];

export const VENDOR_REGISTRY_STATUSES = ['active', 'inactive', 'unknown'] as const;

export const LAGOS_VENDOR_AREAS = [
  { key: 'lekki-ajah', label: 'Lekki/Ajah' },
  { key: 'vi-ikoyi', label: 'Victoria Island/Ikoyi' },
  { key: 'ikeja', label: 'Ikeja' },
  { key: 'agege-ogba', label: 'Agege/Ogba' },
  { key: 'surulere', label: 'Surulere' },
  { key: 'yaba', label: 'Yaba' },
  { key: 'apapa-orile', label: 'Apapa/Orile' },
  { key: 'festac-amuwo', label: 'Festac/Amuwo' },
  { key: 'ikorodu', label: 'Ikorodu' },
  { key: 'ojo-alaba', label: 'Ojo/Alaba' },
  { key: 'badagry', label: 'Badagry' },
  { key: 'epe', label: 'Epe' },
] as const;

const bySlug = new Map<string, VendorCategory>();
for (const category of VENDOR_CATEGORIES) {
  bySlug.set(category.slug, category);
  for (const alias of category.aliases || []) bySlug.set(alias, category);
}

export function resolveVendorCategory(slug?: string | null): VendorCategory | null {
  if (!slug) return null;
  return bySlug.get(slug) || null;
}

export function canonicalVendorCategorySlug(slug?: string | null): string | null {
  const match = resolveVendorCategory(slug);
  return match?.slug || (slug ? slug : null);
}

export function vendorCategoryLabel(slug?: string | null): string {
  if (!slug) return '';
  return resolveVendorCategory(slug)?.label || slug.replace(/[-_]/g, ' ');
}

export function categoryMatchSlugs(slug?: string | null): string[] {
  const match = resolveVendorCategory(slug);
  if (!match) return slug ? [slug] : [];
  return [match.slug, ...(match.aliases || [])];
}

export function publicDeliverySummary(input: {
  deliveryStatus?: string | null;
  areaLabels?: string[];
}): string {
  const areas = (input.areaLabels || []).map((label) => label.trim()).filter(Boolean);
  if (input.deliveryStatus === 'delivers' && areas.length) {
    return `Delivers to: ${areas.join(', ')}`;
  }
  if (input.deliveryStatus === 'pickup_only') return 'Pickup only';
  return 'Delivery: not confirmed';
}

export function publicVerificationCheckLabel(status?: string | null): 'Passed' | 'Not yet checked' {
  return status === 'passed' ? 'Passed' : 'Not yet checked';
}

// Canonical copy also lives in packages/shared-types/src/vendor-catalog.ts.
// vendor-catalog.consistency.spec.ts fails if the slug lists diverge.
