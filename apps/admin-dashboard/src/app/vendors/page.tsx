'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Eye, Phone, Plus, Search, Store } from 'lucide-react';
import { AddVendorModal } from '@/components/AddVendorModal';
import {
  FAMILY_OPTIONS,
  LISTING_STATUS_LABELS,
  VERIFICATION_STATUS_LABELS,
  VendorListingStatus,
  VendorVerificationStatus,
  useVendors,
} from '@/hooks/useVendors';

function listingBadge(status: VendorListingStatus) {
  const styles: Record<VendorListingStatus, string> = {
    listed: 'bg-green-100 text-green-700',
    submitted: 'bg-blue-100 text-blue-700',
    under_review: 'bg-indigo-100 text-indigo-700',
    clarification_required: 'bg-amber-100 text-amber-800',
    draft: 'bg-gray-100 text-gray-700',
    internal_only: 'bg-slate-100 text-slate-700',
    rejected: 'bg-red-100 text-red-700',
    suspended: 'bg-red-100 text-red-800',
  };
  return styles[status] || 'bg-gray-100 text-gray-700';
}

function verificationBadge(status: VendorVerificationStatus) {
  if (status === 'verified') return 'bg-emerald-100 text-emerald-800';
  if (status === 'partial') return 'bg-amber-100 text-amber-800';
  return 'bg-gray-100 text-gray-600';
}

export default function VendorsPage() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [listingStatus, setListingStatus] = useState<VendorListingStatus | ''>('');
  const [verificationStatus, setVerificationStatus] = useState<VendorVerificationStatus | ''>('');
  const [familyKey, setFamilyKey] = useState('');
  const [wholesale, setWholesale] = useState(false);
  const [previouslyUsed, setPreviouslyUsed] = useState(false);
  const [addOpen, setAddOpen] = useState(false);

  const params = useMemo(
    () => ({
      query: query.trim() || undefined,
      listingStatus: listingStatus || undefined,
      verificationStatus: verificationStatus || undefined,
      familyKey: familyKey || undefined,
      wholesale: wholesale || undefined,
      previouslyUsed: previouslyUsed || undefined,
      limit: 50,
    }),
    [familyKey, listingStatus, previouslyUsed, query, verificationStatus, wholesale],
  );

  const { data, isLoading, error } = useVendors(params);
  const vendors = data?.data || [];
  const total = data?.meta?.total ?? 0;

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold font-poppins">Vendors</h1>
          <p className="text-gray-500 mt-1">
            Supplier directory, applications, and BuildMyHouse procurement CRM
          </p>
        </div>
        <button
          type="button"
          onClick={() => setAddOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
        >
          <Plus className="w-4 h-4" />
          Add vendor
        </button>
      </div>

      <div className="bg-white rounded-xl shadow p-4">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-6">
          <div className="relative md:col-span-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search name, phone, email, reference…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <select
            value={listingStatus}
            onChange={(e) => setListingStatus(e.target.value as VendorListingStatus | '')}
            className="w-full px-3 py-2 border rounded-lg bg-white"
          >
            <option value="">All listing statuses</option>
            {(Object.keys(LISTING_STATUS_LABELS) as VendorListingStatus[]).map((key) => (
              <option key={key} value={key}>
                {LISTING_STATUS_LABELS[key]}
              </option>
            ))}
          </select>

          <select
            value={verificationStatus}
            onChange={(e) => setVerificationStatus(e.target.value as VendorVerificationStatus | '')}
            className="w-full px-3 py-2 border rounded-lg bg-white"
          >
            <option value="">All verification</option>
            {(Object.keys(VERIFICATION_STATUS_LABELS) as VendorVerificationStatus[]).map((key) => (
              <option key={key} value={key}>
                {VERIFICATION_STATUS_LABELS[key]}
              </option>
            ))}
          </select>

          <select
            value={familyKey}
            onChange={(e) => setFamilyKey(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg bg-white"
          >
            <option value="">All categories</option>
            {FAMILY_OPTIONS.map((f) => (
              <option key={f} value={f}>
                {f}
              </option>
            ))}
          </select>

          <div className="flex items-center gap-4 px-1">
            <label className="inline-flex items-center gap-2 text-sm text-gray-700">
              <input type="checkbox" checked={wholesale} onChange={(e) => setWholesale(e.target.checked)} />
              Wholesale
            </label>
            <label className="inline-flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={previouslyUsed}
                onChange={(e) => setPreviouslyUsed(e.target.checked)}
              />
              Used by BMH
            </label>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow overflow-hidden">
        <div className="px-4 py-3 border-b flex items-center justify-between">
          <p className="text-sm text-gray-600">
            {isLoading ? 'Loading…' : `${total} vendor${total === 1 ? '' : 's'}`}
          </p>
        </div>

        {error && (
          <div className="p-8 text-center text-red-600">
            Failed to load vendors. {(error as Error).message}
          </div>
        )}

        {!error && !isLoading && vendors.length === 0 && (
          <div className="p-12 text-center text-gray-500">
            <Store className="w-10 h-10 mx-auto mb-3 text-gray-300" />
            <p className="font-medium text-gray-700">No vendors match this search</p>
            <p className="text-sm mt-1">Add an internal lead or wait for applications.</p>
          </div>
        )}

        {vendors.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-left text-gray-500">
                <tr>
                  <th className="px-4 py-3 font-medium">Vendor</th>
                  <th className="px-4 py-3 font-medium">Location</th>
                  <th className="px-4 py-3 font-medium">Sells</th>
                  <th className="px-4 py-3 font-medium">Listing</th>
                  <th className="px-4 py-3 font-medium">Verification</th>
                  <th className="px-4 py-3 font-medium">Contact</th>
                  <th className="px-4 py-3 font-medium">Complete</th>
                  <th className="px-4 py-3 font-medium" />
                </tr>
              </thead>
              <tbody className="divide-y">
                {vendors.map((vendor) => {
                  const categories = (vendor.offerings || [])
                    .map((o) => o.customCategoryLabel || o.familyKey)
                    .filter(Boolean)
                    .slice(0, 3);
                  const phone = vendor.publicWhatsApp || vendor.publicPhone;
                  return (
                    <tr key={vendor.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-900">{vendor.tradingName}</div>
                        <div className="text-xs text-gray-500">
                          {vendor.applicationReference || vendor.slug}
                          {vendor.previouslyUsedByBmh ? ' · Used by BMH' : ''}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-700">
                        {[vendor.cityLabel, vendor.stateLabel].filter(Boolean).join(', ') || '—'}
                      </td>
                      <td className="px-4 py-3 text-gray-700">
                        {categories.length ? categories.join(', ') : '—'}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex px-2 py-0.5 text-[10px] rounded-full font-medium ${listingBadge(
                            vendor.listingStatus,
                          )}`}
                        >
                          {LISTING_STATUS_LABELS[vendor.listingStatus]}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex px-2 py-0.5 text-[10px] rounded-full font-medium ${verificationBadge(
                            vendor.verificationStatus,
                          )}`}
                        >
                          {VERIFICATION_STATUS_LABELS[vendor.verificationStatus]}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {phone ? (
                          <a
                            href={`tel:${phone}`}
                            className="inline-flex items-center gap-1 text-blue-600 hover:underline"
                          >
                            <Phone className="w-3.5 h-3.5" />
                            {phone}
                          </a>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td className="px-4 py-3 text-gray-600">{vendor.profileCompleteness}%</td>
                      <td className="px-4 py-3 text-right">
                        <Link
                          href={`/vendors/${vendor.id}`}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border hover:bg-white"
                        >
                          <Eye className="w-4 h-4" />
                          Open
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <AddVendorModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onCreated={(id) => router.push(`/vendors/${id}`)}
      />
    </div>
  );
}
