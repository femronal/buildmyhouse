'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { usePartnershipMutations, type PartnershipError } from '@/hooks/usePartnerships';
import { CATEGORY_LABEL, SOURCE_LABEL } from '@/lib/partnerships';

export default function AddLeadDialog({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const { createLead } = usePartnershipMutations();
  const [form, setForm] = useState({ companyName: '', category: 'quantity_surveyor', groupName: '', website: '', city: '', state: '', fullName: '', email: '', phone: '', sourceType: 'admin', sourceDetail: '' });
  const [reason, setReason] = useState('');
  const [error, setError] = useState<PartnershipError | null>(null);

  const submit = async (createAnyway = false) => {
    setError(null);
    try {
      const created = await createLead.mutateAsync({
        companyName: form.companyName,
        category: form.category,
        groupName: form.groupName || undefined,
        website: form.website || undefined,
        city: form.city || undefined,
        state: form.state || undefined,
        sourceType: form.sourceType,
        sourceDetail: form.sourceDetail || undefined,
        createAnyway,
        reason: createAnyway ? reason : undefined,
        contact: form.fullName || form.email || form.phone ? { fullName: form.fullName || form.companyName, email: form.email || undefined, phone: form.phone || undefined, isPrimary: true } : undefined,
      });
      router.push(`/growth/partnerships/leads/${created.id}`);
      onClose();
    } catch (caught) {
      setError(caught as PartnershipError);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center">
      <form className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-t-2xl bg-white p-5 sm:rounded-2xl" onSubmit={(event) => { event.preventDefault(); submit(false); }}>
        <h2 className="text-xl font-semibold text-gray-950">Add lead</h2>
        <div className="mt-4 grid gap-3">
          <label className="text-sm">Company name, or the leader&apos;s name<input required value={form.companyName} onChange={(event) => setForm({ ...form, companyName: event.target.value })} className="mt-1 w-full rounded-lg border px-3 py-2" /></label>
          <label className="text-sm">Category
            <select value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })} className="mt-1 w-full rounded-lg border px-3 py-2">
              {Object.entries(CATEGORY_LABEL).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
          </label>
          {form.category === 'diaspora_group' ? <label className="text-sm">Group name<input value={form.groupName} onChange={(event) => setForm({ ...form, groupName: event.target.value })} className="mt-1 w-full rounded-lg border px-3 py-2" /></label> : null}
          <label className="text-sm">Website<input value={form.website} onChange={(event) => setForm({ ...form, website: event.target.value })} className="mt-1 w-full rounded-lg border px-3 py-2" /></label>
          <div className="grid grid-cols-2 gap-3">
            <label className="text-sm">City<input value={form.city} onChange={(event) => setForm({ ...form, city: event.target.value })} className="mt-1 w-full rounded-lg border px-3 py-2" /></label>
            <label className="text-sm">State<input value={form.state} onChange={(event) => setForm({ ...form, state: event.target.value })} className="mt-1 w-full rounded-lg border px-3 py-2" /></label>
          </div>
          <label className="text-sm">Primary contact<input value={form.fullName} onChange={(event) => setForm({ ...form, fullName: event.target.value })} className="mt-1 w-full rounded-lg border px-3 py-2" /></label>
          <label className="text-sm">Email<input value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} className="mt-1 w-full rounded-lg border px-3 py-2" /></label>
          <label className="text-sm">Phone<input value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} className="mt-1 w-full rounded-lg border px-3 py-2" /></label>
          <label className="text-sm">Source
            <select value={form.sourceType} onChange={(event) => setForm({ ...form, sourceType: event.target.value })} className="mt-1 w-full rounded-lg border px-3 py-2">
              {Object.entries(SOURCE_LABEL).filter(([value]) => value !== 'sheet_import').map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
          </label>
          <label className="text-sm">Source detail<input value={form.sourceDetail} onChange={(event) => setForm({ ...form, sourceDetail: event.target.value })} className="mt-1 w-full rounded-lg border px-3 py-2" /></label>
        </div>
        {error ? (
          <div className="mt-3 text-sm text-red-700">
            <p>{error.message}</p>
            {error.body?.leadId ? <Link className="underline" href={`/growth/partnerships/leads/${error.body.leadId}`}>Open {error.body.leadRef}</Link> : null}
            {error.body?.warning ? (
              <label className="mt-2 block">Reason
                <input value={reason} onChange={(event) => setReason(event.target.value)} className="mt-1 w-full rounded-lg border px-3 py-2" />
                <button type="button" className="mt-2 underline" onClick={() => submit(true)}>Create anyway</button>
              </label>
            ) : null}
          </div>
        ) : null}
        <div className="mt-4 flex justify-end gap-2">
          <button type="button" onClick={onClose} className="min-h-11 rounded-full border px-4 text-sm">Cancel</button>
          <button type="submit" className="min-h-11 rounded-full bg-gray-950 px-4 text-sm text-white">Save lead</button>
        </div>
      </form>
    </div>
  );
}
