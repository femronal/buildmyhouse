export const BRAND_FIELD_HINT =
  'Product brands you sell, e.g. Dangote, Berger, Schneider. Not your trade or service.';

export type ManagedOfferingDraft = {
  familyKey: string;
  brands: string;
  sellsRetail: boolean;
  sellsWholesale: boolean;
  normalUnit: string;
  minimumOrderQuantity: string;
  deliveryAvailable: boolean;
};

type StoredOffering = {
  familyKey?: string | null;
  brands?: string[] | null;
  sellsRetail?: boolean | null;
  sellsWholesale?: boolean | null;
  normalUnit?: string | null;
  minimumOrderQuantity?: number | null;
  deliveryAvailable?: boolean | null;
};

export function emptyOfferingDraft(): ManagedOfferingDraft {
  return {
    familyKey: '',
    brands: '',
    sellsRetail: true,
    sellsWholesale: false,
    normalUnit: '',
    minimumOrderQuantity: '',
    deliveryAvailable: true,
  };
}

export function offeringDraftFromProfile(offerings?: StoredOffering[] | null): ManagedOfferingDraft {
  const primary = offerings?.[0];
  if (!primary || !String(primary.familyKey || '').trim()) return emptyOfferingDraft();
  return {
    familyKey: String(primary.familyKey).trim(),
    brands: (primary.brands || []).join(', '),
    sellsRetail: primary.sellsRetail !== false,
    sellsWholesale: !!primary.sellsWholesale,
    normalUnit: primary.normalUnit || '',
    minimumOrderQuantity:
      primary.minimumOrderQuantity != null ? String(primary.minimumOrderQuantity) : '',
    deliveryAvailable: primary.deliveryAvailable !== false,
  };
}

function normalize(draft: ManagedOfferingDraft) {
  return {
    familyKey: draft.familyKey.trim(),
    brands: draft.brands.split(',').map((item) => item.trim()).filter(Boolean),
    sellsRetail: draft.sellsRetail,
    sellsWholesale: draft.sellsWholesale,
    normalUnit: draft.normalUnit.trim(),
    minimumOrderQuantity: draft.minimumOrderQuantity.trim(),
    deliveryAvailable: draft.deliveryAvailable,
  };
}

/** Omit offerings unless the owner picked a category and changed this block. */
export function managedOfferingsForSave(initial: ManagedOfferingDraft, current: ManagedOfferingDraft) {
  const next = normalize(current);
  if (!next.familyKey) return undefined;
  if (JSON.stringify(normalize(initial)) === JSON.stringify(next)) return undefined;
  return [
    {
      familyKey: next.familyKey,
      brands: next.brands,
      sellsRetail: next.sellsRetail,
      sellsWholesale: next.sellsWholesale,
      normalUnit: next.normalUnit || undefined,
      minimumOrderQuantity: next.minimumOrderQuantity ? Number(next.minimumOrderQuantity) : undefined,
      deliveryAvailable: next.deliveryAvailable,
    },
  ];
}
