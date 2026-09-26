'use client';

import { useMemo, useState, type ReactNode } from 'react';
import {
  LAGOS_VENDOR_AREAS,
  VENDOR_BUSINESS_TYPES,
  VENDOR_CATEGORIES,
  VENDOR_CATEGORY_GROUPS,
} from '@buildmyhouse/shared-types';

export type VendorEditorProduct = { name: string; spec?: string; unit?: string; brand?: string };

export type VendorEditorValue = {
  tradingName: string;
  legalName: string;
  description: string;
  yearEstablished: string;
  businessTypes: string[];
  websiteUrl: string;
  stateLabel: string;
  cityLabel: string;
  localAreaKey: string;
  localAreaLabel: string;
  publicAddress: string;
  landmark: string;
  privateBusinessAddress: string;
  latitude: string;
  longitude: string;
  deliveryStatus: 'not_confirmed' | 'delivers' | 'pickup_only';
  serviceAreaLabels: string[];
  sellsRetail: boolean;
  sellsWholesale: boolean;
  brands: string;
  publicPhone: string;
  publicWhatsApp: string;
  publicEmail: string;
  quotationEmail: string;
  salesContactName: string;
  representativeName: string;
  primaryFamilyKey: string;
  secondaryFamilyKeys: string[];
  products: VendorEditorProduct[];
  cacNumber: string;
  cacRegisteredName: string;
  cacRegistryStatus: '' | 'active' | 'inactive' | 'unknown';
  cacRegisteredOn: string;
  cacCheckedVia: string;
  cacCheckedAt: string;
  internalNote: string;
  saveAsInternalOnly: boolean;
};

export const emptyVendorEditorValue = (): VendorEditorValue => ({
  tradingName: '',
  legalName: '',
  description: '',
  yearEstablished: '',
  businessTypes: [],
  websiteUrl: '',
  stateLabel: 'Lagos',
  cityLabel: '',
  localAreaKey: '',
  localAreaLabel: '',
  publicAddress: '',
  landmark: '',
  privateBusinessAddress: '',
  latitude: '',
  longitude: '',
  deliveryStatus: 'not_confirmed',
  serviceAreaLabels: [],
  sellsRetail: true,
  sellsWholesale: false,
  brands: '',
  publicPhone: '',
  publicWhatsApp: '',
  publicEmail: '',
  quotationEmail: '',
  salesContactName: '',
  representativeName: '',
  primaryFamilyKey: '',
  secondaryFamilyKeys: [],
  products: [],
  cacNumber: '',
  cacRegisteredName: '',
  cacRegistryStatus: '',
  cacRegisteredOn: '',
  cacCheckedVia: '',
  cacCheckedAt: '',
  internalNote: '',
  saveAsInternalOnly: true,
});

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block text-sm">
      <span className="text-gray-600">{label}</span>
      <div className="mt-1">{children}</div>
    </label>
  );
}

const inputClass = 'w-full px-3 py-2 border rounded-lg';

export function VendorEditor({
  mode,
  value,
  onChange,
  onSubmit,
  submitting,
  error,
}: {
  mode: 'create' | 'edit';
  value: VendorEditorValue;
  onChange: (next: VendorEditorValue) => void;
  onSubmit: () => void;
  submitting?: boolean;
  error?: string | null;
}) {
  const [productDraft, setProductDraft] = useState<VendorEditorProduct>({ name: '' });
  const set = (patch: Partial<VendorEditorValue>) => onChange({ ...value, ...patch });
  const categoriesByGroup = useMemo(
    () =>
      VENDOR_CATEGORY_GROUPS.map((group) => ({
        group,
        items: VENDOR_CATEGORIES.filter((category) => category.group === group),
      })),
    [],
  );

  const toggle = (list: string[], item: string, max?: number) => {
    if (list.includes(item)) return list.filter((entry) => entry !== item);
    if (max && list.length >= max) return list;
    return [...list, item];
  };

  return (
    <form
      className="space-y-6"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit();
      }}
    >
      <section className="bg-white rounded-xl shadow p-5 grid gap-4 md:grid-cols-2">
        <h2 className="md:col-span-2 text-sm font-semibold uppercase tracking-wide text-gray-500">Identity</h2>
        <Field label="Trading name">
          <input className={inputClass} value={value.tradingName} onChange={(e) => set({ tradingName: e.target.value })} required />
        </Field>
        <Field label="Legal name">
          <input className={inputClass} value={value.legalName} onChange={(e) => set({ legalName: e.target.value })} />
        </Field>
        <Field label="Description">
          <textarea
            className={`${inputClass} md:col-span-2`}
            maxLength={1000}
            rows={4}
            value={value.description}
            onChange={(e) => set({ description: e.target.value })}
          />
        </Field>
        <Field label="Year established">
          <input className={inputClass} inputMode="numeric" value={value.yearEstablished} onChange={(e) => set({ yearEstablished: e.target.value })} />
        </Field>
        <Field label="Website">
          <input className={inputClass} placeholder="https://" value={value.websiteUrl} onChange={(e) => set({ websiteUrl: e.target.value })} />
        </Field>
        <div className="md:col-span-2">
          <p className="text-sm text-gray-600 mb-2">Business types</p>
          <div className="flex flex-wrap gap-2">
            {VENDOR_BUSINESS_TYPES.map((type) => (
              <label key={type} className="inline-flex items-center gap-2 text-sm border rounded-full px-3 py-1">
                <input
                  type="checkbox"
                  checked={value.businessTypes.includes(type)}
                  onChange={() => set({ businessTypes: toggle(value.businessTypes, type) })}
                />
                {type}
              </label>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white rounded-xl shadow p-5 grid gap-4 md:grid-cols-2">
        <h2 className="md:col-span-2 text-sm font-semibold uppercase tracking-wide text-gray-500">Location and delivery</h2>
        <Field label="Public area">
          <select
            className={inputClass}
            value={value.localAreaKey}
            onChange={(e) => {
              const area = LAGOS_VENDOR_AREAS.find((item) => item.key === e.target.value);
              set({ localAreaKey: e.target.value, localAreaLabel: area?.label || '' });
            }}
          >
            <option value="">Not set</option>
            {LAGOS_VENDOR_AREAS.map((area) => (
              <option key={area.key} value={area.key}>{area.label}</option>
            ))}
          </select>
        </Field>
        <Field label="City">
          <input className={inputClass} value={value.cityLabel} onChange={(e) => set({ cityLabel: e.target.value })} />
        </Field>
        <Field label="State">
          <input className={inputClass} value={value.stateLabel} onChange={(e) => set({ stateLabel: e.target.value })} />
        </Field>
        <Field label="Public street address">
          <input className={inputClass} value={value.publicAddress} onChange={(e) => set({ publicAddress: e.target.value })} />
        </Field>
        <Field label="Landmark">
          <input className={inputClass} value={value.landmark} onChange={(e) => set({ landmark: e.target.value })} />
        </Field>
        <Field label="Private business address">
          <input className={inputClass} value={value.privateBusinessAddress} onChange={(e) => set({ privateBusinessAddress: e.target.value })} />
        </Field>
        <Field label="Latitude">
          <input className={inputClass} value={value.latitude} onChange={(e) => set({ latitude: e.target.value })} />
        </Field>
        <Field label="Longitude">
          <input className={inputClass} value={value.longitude} onChange={(e) => set({ longitude: e.target.value })} />
        </Field>
        <Field label="Delivery status">
          <select className={inputClass} value={value.deliveryStatus} onChange={(e) => set({ deliveryStatus: e.target.value as VendorEditorValue['deliveryStatus'] })}>
            <option value="not_confirmed">Not confirmed</option>
            <option value="delivers">Delivers</option>
            <option value="pickup_only">Pickup only</option>
          </select>
        </Field>
        <div className="md:col-span-2">
          <p className="text-sm text-gray-600 mb-2">Delivery areas</p>
          <div className="flex flex-wrap gap-2">
            {LAGOS_VENDOR_AREAS.map((area) => (
              <label key={area.key} className="inline-flex items-center gap-2 text-sm border rounded-full px-3 py-1">
                <input
                  type="checkbox"
                  checked={value.serviceAreaLabels.includes(area.label)}
                  onChange={() => set({ serviceAreaLabels: toggle(value.serviceAreaLabels, area.label) })}
                />
                {area.label}
              </label>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white rounded-xl shadow p-5 grid gap-4 md:grid-cols-2">
        <h2 className="md:col-span-2 text-sm font-semibold uppercase tracking-wide text-gray-500">What they sell</h2>
        <Field label="Primary category">
          <select className={inputClass} value={value.primaryFamilyKey} onChange={(e) => set({ primaryFamilyKey: e.target.value, secondaryFamilyKeys: value.secondaryFamilyKeys.filter((slug) => slug !== e.target.value) })}>
            <option value="">Choose a category</option>
            {categoriesByGroup.map((group) => (
              <optgroup key={group.group} label={group.group}>
                {group.items.map((category) => (
                  <option key={category.slug} value={category.slug}>{category.label}</option>
                ))}
              </optgroup>
            ))}
          </select>
        </Field>
        <div>
          <p className="text-sm text-gray-600 mb-2">Secondary categories (up to 5)</p>
          <div className="flex flex-wrap gap-2 max-h-40 overflow-auto">
            {VENDOR_CATEGORIES.filter((category) => category.slug !== value.primaryFamilyKey).map((category) => (
              <label key={category.slug} className="inline-flex items-center gap-2 text-sm border rounded-full px-3 py-1">
                <input
                  type="checkbox"
                  checked={value.secondaryFamilyKeys.includes(category.slug)}
                  onChange={() => set({ secondaryFamilyKeys: toggle(value.secondaryFamilyKeys, category.slug, 5) })}
                />
                {category.label}
              </label>
            ))}
          </div>
        </div>
        <label className="inline-flex items-center gap-2 text-sm">
          <input type="checkbox" checked={value.sellsRetail} onChange={(e) => set({ sellsRetail: e.target.checked })} />
          Retail
        </label>
        <label className="inline-flex items-center gap-2 text-sm">
          <input type="checkbox" checked={value.sellsWholesale} onChange={(e) => set({ sellsWholesale: e.target.checked })} />
          Wholesale
        </label>
        <Field label="Brands">
          <input className={inputClass} value={value.brands} onChange={(e) => set({ brands: e.target.value })} placeholder="Comma separated" />
        </Field>
        <div className="md:col-span-2 space-y-2">
          <p className="text-sm text-gray-600">Products</p>
          {value.products.map((product, index) => (
            <div key={`${product.name}-${index}`} className="flex items-center justify-between border rounded-lg px-3 py-2 text-sm">
              <span>{[product.name, product.spec, product.unit, product.brand].filter(Boolean).join(' · ')}</span>
              <button type="button" className="text-red-600" onClick={() => set({ products: value.products.filter((_, i) => i !== index) })}>
                Remove
              </button>
            </div>
          ))}
          <div className="grid gap-2 md:grid-cols-5">
            <input className={inputClass} placeholder="Name" value={productDraft.name} onChange={(e) => setProductDraft({ ...productDraft, name: e.target.value })} />
            <input className={inputClass} placeholder="Spec or size" value={productDraft.spec || ''} onChange={(e) => setProductDraft({ ...productDraft, spec: e.target.value })} />
            <input className={inputClass} placeholder="Unit" value={productDraft.unit || ''} onChange={(e) => setProductDraft({ ...productDraft, unit: e.target.value })} />
            <input className={inputClass} placeholder="Brand" value={productDraft.brand || ''} onChange={(e) => setProductDraft({ ...productDraft, brand: e.target.value })} />
            <button
              type="button"
              className="px-3 py-2 rounded-lg border"
              onClick={() => {
                if (!productDraft.name.trim()) return;
                set({ products: [...value.products, { ...productDraft, name: productDraft.name.trim() }] });
                setProductDraft({ name: '' });
              }}
            >
              Add product
            </button>
          </div>
        </div>
      </section>

      <section className="bg-white rounded-xl shadow p-5 grid gap-4 md:grid-cols-2">
        <h2 className="md:col-span-2 text-sm font-semibold uppercase tracking-wide text-gray-500">Contact</h2>
        <Field label="Phone"><input className={inputClass} value={value.publicPhone} onChange={(e) => set({ publicPhone: e.target.value })} /></Field>
        <Field label="WhatsApp"><input className={inputClass} value={value.publicWhatsApp} onChange={(e) => set({ publicWhatsApp: e.target.value })} /></Field>
        <Field label="Email"><input className={inputClass} value={value.publicEmail} onChange={(e) => set({ publicEmail: e.target.value })} /></Field>
        <Field label="Quotation email"><input className={inputClass} value={value.quotationEmail} onChange={(e) => set({ quotationEmail: e.target.value })} /></Field>
        <Field label="Sales contact"><input className={inputClass} value={value.salesContactName} onChange={(e) => set({ salesContactName: e.target.value })} /></Field>
        <Field label="Representative"><input className={inputClass} value={value.representativeName} onChange={(e) => set({ representativeName: e.target.value })} /></Field>
      </section>

      <section className="bg-white rounded-xl shadow p-5 grid gap-4 md:grid-cols-2">
        <h2 className="md:col-span-2 text-sm font-semibold uppercase tracking-wide text-gray-500">Company registration</h2>
        <Field label="RC or BN number"><input className={inputClass} value={value.cacNumber} onChange={(e) => set({ cacNumber: e.target.value })} /></Field>
        <Field label="Registered name"><input className={inputClass} value={value.cacRegisteredName} onChange={(e) => set({ cacRegisteredName: e.target.value })} /></Field>
        <Field label="Registry status">
          <select className={inputClass} value={value.cacRegistryStatus} onChange={(e) => set({ cacRegistryStatus: e.target.value as VendorEditorValue['cacRegistryStatus'] })}>
            <option value="">Not set</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="unknown">Unknown</option>
          </select>
        </Field>
        <Field label="Registration date"><input className={inputClass} type="date" value={value.cacRegisteredOn} onChange={(e) => set({ cacRegisteredOn: e.target.value })} /></Field>
        <Field label="Where it was checked"><input className={inputClass} value={value.cacCheckedVia} onChange={(e) => set({ cacCheckedVia: e.target.value })} placeholder="CAC ICRP public search" /></Field>
        <Field label="Check date"><input className={inputClass} type="date" value={value.cacCheckedAt} onChange={(e) => set({ cacCheckedAt: e.target.value })} /></Field>
      </section>

      {mode === 'create' ? (
        <section className="bg-white rounded-xl shadow p-5 space-y-3">
          <Field label="Private note">
            <textarea className={inputClass} rows={3} value={value.internalNote} onChange={(e) => set({ internalNote: e.target.value })} />
          </Field>
          <label className="inline-flex items-center gap-2 text-sm">
            <input type="checkbox" checked={value.saveAsInternalOnly} onChange={(e) => set({ saveAsInternalOnly: e.target.checked })} />
            Save as internal only
          </label>
        </section>
      ) : null}

      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      <button type="submit" disabled={submitting} className="px-4 py-2 rounded-lg bg-gray-900 text-white disabled:opacity-50">
        {submitting ? 'Saving…' : mode === 'create' ? 'Create vendor' : 'Save changes'}
      </button>
    </form>
  );
}

export function vendorEditorPayload(value: VendorEditorValue, mode: 'create' | 'edit') {
  const brands = value.brands.split(',').map((item) => item.trim()).filter(Boolean);
  const year = Number(value.yearEstablished);
  const latitude = Number(value.latitude);
  const longitude = Number(value.longitude);
  return {
    tradingName: value.tradingName.trim(),
    legalName: value.legalName.trim() || undefined,
    description: value.description.trim(),
    yearEstablished: Number.isFinite(year) && year > 1800 ? year : undefined,
    businessTypes: value.businessTypes,
    websiteUrl: value.websiteUrl.trim(),
    stateLabel: value.stateLabel.trim() || undefined,
    stateKey: value.stateLabel.trim().toLowerCase() === 'lagos' ? 'ng-lagos' : undefined,
    cityLabel: value.cityLabel.trim() || undefined,
    localAreaKey: value.localAreaKey || undefined,
    localAreaLabel: value.localAreaLabel || undefined,
    publicAddress: value.publicAddress.trim(),
    landmark: value.landmark.trim(),
    privateBusinessAddress: value.privateBusinessAddress.trim(),
    latitude: Number.isFinite(latitude) && value.latitude.trim() ? latitude : undefined,
    longitude: Number.isFinite(longitude) && value.longitude.trim() ? longitude : undefined,
    deliveryStatus: value.deliveryStatus,
    serviceAreas: value.serviceAreaLabels.map((label) => ({ stateLabel: 'Lagos', stateKey: 'ng-lagos', cityLabel: label, coverageType: 'delivery' })),
    sellsRetail: value.sellsRetail,
    sellsWholesale: value.sellsWholesale,
    primaryFamilyKey: value.primaryFamilyKey || undefined,
    secondaryFamilyKeys: value.secondaryFamilyKeys,
    products: value.products,
    publicPhone: value.publicPhone.trim() || undefined,
    publicWhatsApp: value.publicWhatsApp.trim() || undefined,
    publicEmail: value.publicEmail.trim() || undefined,
    quotationEmail: value.quotationEmail.trim() || undefined,
    salesContactName: value.salesContactName.trim() || undefined,
    representative: value.representativeName.trim()
      ? { name: value.representativeName.trim(), isPrimary: true }
      : undefined,
    cacNumber: value.cacNumber.trim() || undefined,
    cacRegisteredName: value.cacRegisteredName.trim() || undefined,
    cacRegistryStatus: value.cacRegistryStatus || undefined,
    cacRegisteredOn: value.cacRegisteredOn || undefined,
    cacCheckedVia: value.cacCheckedVia.trim() || undefined,
    cacCheckedAt: value.cacCheckedAt || undefined,
    offerings: value.primaryFamilyKey
      ? [{ familyKey: value.primaryFamilyKey, brands, sellsRetail: value.sellsRetail, sellsWholesale: value.sellsWholesale }]
      : undefined,
    ...(mode === 'create'
      ? { internalNote: value.internalNote.trim() || undefined, saveAsInternalOnly: value.saveAsInternalOnly }
      : {}),
  };
}
