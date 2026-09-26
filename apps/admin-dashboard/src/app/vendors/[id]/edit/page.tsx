'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { VendorEditor, emptyVendorEditorValue, vendorEditorPayload, type VendorEditorValue } from '@/components/VendorEditor';
import { useUpdateVendor, useVendor } from '@/hooks/useVendors';

function dateInput(value?: string | null) {
  if (!value) return '';
  return String(value).slice(0, 10);
}

export default function EditVendorPage() {
  const params = useParams();
  const id = String(params?.id || '');
  const router = useRouter();
  const { data: vendor, isLoading } = useVendor(id || null);
  const updateVendor = useUpdateVendor(id);
  const [value, setValue] = useState<VendorEditorValue>(emptyVendorEditorValue());
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!vendor || ready) return;
    const primary = vendor.representatives?.[0];
    setValue({
      ...emptyVendorEditorValue(),
      tradingName: vendor.tradingName || '',
      legalName: vendor.legalName || '',
      description: vendor.description || '',
      yearEstablished: vendor.yearEstablished ? String(vendor.yearEstablished) : '',
      businessTypes: vendor.businessTypes || [],
      websiteUrl: vendor.websiteUrl || '',
      stateLabel: vendor.stateLabel || '',
      cityLabel: vendor.cityLabel || '',
      localAreaKey: (vendor as { localAreaKey?: string }).localAreaKey || '',
      localAreaLabel: (vendor as { localAreaLabel?: string }).localAreaLabel || '',
      publicAddress: vendor.publicAddress || '',
      landmark: (vendor as { landmark?: string }).landmark || '',
      privateBusinessAddress: vendor.privateBusinessAddress || '',
      latitude: (vendor as { latitude?: number }).latitude != null ? String((vendor as { latitude?: number }).latitude) : '',
      longitude: (vendor as { longitude?: number }).longitude != null ? String((vendor as { longitude?: number }).longitude) : '',
      deliveryStatus: ((vendor as { deliveryStatus?: VendorEditorValue['deliveryStatus'] }).deliveryStatus || 'not_confirmed'),
      serviceAreaLabels: (vendor.serviceAreas || []).map((area) => area.cityLabel || area.stateLabel || '').filter(Boolean) as string[],
      sellsRetail: vendor.offerings?.some((offering) => offering.sellsRetail) ?? true,
      sellsWholesale: vendor.offerings?.some((offering) => offering.sellsWholesale) ?? false,
      brands: Array.from(new Set((vendor.offerings || []).flatMap((offering) => offering.brands || []))).join(', '),
      publicPhone: vendor.publicPhone || '',
      publicWhatsApp: vendor.publicWhatsApp || '',
      publicEmail: vendor.publicEmail || '',
      quotationEmail: vendor.quotationEmail || '',
      salesContactName: vendor.salesContactName || '',
      representativeName: primary?.name || '',
      primaryFamilyKey: (vendor as { primaryFamilyKey?: string }).primaryFamilyKey || vendor.offerings?.[0]?.familyKey || '',
      secondaryFamilyKeys: (vendor as { secondaryFamilyKeys?: string[] }).secondaryFamilyKeys || [],
      products: ((vendor as { products?: VendorEditorValue['products'] }).products || []).map((product) => ({
        name: product.name,
        spec: product.spec,
        unit: product.unit,
        brand: product.brand,
      })),
      cacNumber: vendor.cacNumber || '',
      cacRegisteredName: (vendor as { cacRegisteredName?: string }).cacRegisteredName || '',
      cacRegistryStatus: ((vendor as { cacRegistryStatus?: VendorEditorValue['cacRegistryStatus'] }).cacRegistryStatus || ''),
      cacRegisteredOn: dateInput((vendor as { cacRegisteredOn?: string }).cacRegisteredOn),
      cacCheckedVia: (vendor as { cacCheckedVia?: string }).cacCheckedVia || '',
      cacCheckedAt: dateInput((vendor as { cacCheckedAt?: string }).cacCheckedAt),
      saveAsInternalOnly: false,
    });
    setReady(true);
  }, [ready, vendor]);

  if (isLoading || !ready) return <div className="p-8 text-gray-500">Loading vendor…</div>;

  return (
    <div className="p-8 max-w-5xl space-y-4">
      <Link href={`/vendors/${id}`} className="text-sm text-gray-500">Back to vendor</Link>
      <h1 className="text-2xl font-bold">Edit {vendor?.tradingName}</h1>
      <VendorEditor
        mode="edit"
        value={value}
        onChange={setValue}
        submitting={updateVendor.isPending}
        error={error}
        onSubmit={async () => {
          setError(null);
          try {
            await updateVendor.mutateAsync(vendorEditorPayload(value, 'edit'));
            router.push(`/vendors/${id}`);
          } catch (err) {
            setError((err as Error).message || 'Could not save this vendor.');
          }
        }}
      />
    </div>
  );
}
