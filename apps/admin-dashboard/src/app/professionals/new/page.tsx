'use client';

import { FormEvent, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCreateProfessional, useProfessionalMeta } from '@/hooks/useProfessionals';

export default function NewProfessionalPage() {
  const router = useRouter();
  const meta = useProfessionalMeta();
  const create = useCreateProfessional();
  const [form, setForm] = useState({
    displayName: '',
    professionalType: 'individual',
    primaryProfessionId: '',
    bio: '',
    yearsExperience: '',
    phone: '',
    email: '',
    whatsapp: '',
    website: '',
    city: '',
    state: '',
    serviceStates: [] as string[],
    remoteConsultation: false,
    siteVisits: false,
    canIssueSignedReport: false,
    listingStatus: 'draft',
    usedByBmh: false,
    usedByBmhNote: '',
    sourceNotes: '',
    specialtyIds: [] as string[],
    serviceIds: [] as string[],
    deliverableIds: [] as string[],
    projectStageIds: [] as string[],
  });
  const specialties = useMemo(
    () => (meta.data?.specialties || []).filter((s: any) => s.professionId === form.primaryProfessionId),
    [form.primaryProfessionId, meta.data?.specialties],
  );

  const toggle = (key: 'specialtyIds' | 'serviceIds' | 'deliverableIds' | 'projectStageIds' | 'serviceStates', id: string) => {
    setForm((prev) => ({
      ...prev,
      [key]: prev[key].includes(id) ? prev[key].filter((x) => x !== id) : [...prev[key], id],
    }));
  };

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const created = await create.mutateAsync({
      ...form,
      yearsExperience: form.yearsExperience ? Number(form.yearsExperience) : undefined,
      usedByBmhNote: form.usedByBmh ? form.usedByBmhNote : undefined,
    });
    router.push(`/professionals/${created.id}`);
  };

  return (
    <div className="p-8 max-w-5xl">
      <Link href="/professionals" className="text-sm text-blue-600">← Professionals</Link>
      <h1 className="text-3xl font-bold font-poppins mt-3">Add professional</h1>
      <p className="text-gray-500 mt-1">Admin-researched listings do not need a BuildMyHouse account. Listing is not verification.</p>
      <form onSubmit={onSubmit} className="mt-6 space-y-8">
        <section className="bg-white rounded-xl shadow p-5 space-y-3">
          <h2 className="font-semibold">Identity</h2>
          <input required value={form.displayName} onChange={(e) => setForm({ ...form, displayName: e.target.value })} placeholder="Display name" className="w-full border rounded-lg px-3 py-2" />
          <div className="grid md:grid-cols-2 gap-3">
            <select value={form.professionalType} onChange={(e) => setForm({ ...form, professionalType: e.target.value })} className="border rounded-lg px-3 py-2">
              <option value="individual">Individual</option>
              <option value="firm">Firm</option>
            </select>
            <select required value={form.primaryProfessionId} onChange={(e) => setForm({ ...form, primaryProfessionId: e.target.value, specialtyIds: [] })} className="border rounded-lg px-3 py-2">
              <option value="">Profession</option>
              {(meta.data?.professions || []).map((p: any) => <option key={p.id} value={p.id}>{p.label}</option>)}
            </select>
          </div>
          <textarea value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} placeholder="Short bio" className="w-full border rounded-lg px-3 py-2 min-h-24" />
          <input type="number" value={form.yearsExperience} onChange={(e) => setForm({ ...form, yearsExperience: e.target.value })} placeholder="Years of experience" className="w-full border rounded-lg px-3 py-2" />
        </section>

        <section className="bg-white rounded-xl shadow p-5 space-y-3">
          <h2 className="font-semibold">Capability</h2>
          <ChipGroup label="Specialties" items={specialties} selected={form.specialtyIds} onToggle={(id) => toggle('specialtyIds', id)} />
          <ChipGroup label="Services" items={meta.data?.services || []} selected={form.serviceIds} onToggle={(id) => toggle('serviceIds', id)} />
          <ChipGroup label="Deliverables" items={meta.data?.deliverables || []} selected={form.deliverableIds} onToggle={(id) => toggle('deliverableIds', id)} />
          <ChipGroup label="Project stages" items={meta.data?.projectStages || []} selected={form.projectStageIds} onToggle={(id) => toggle('projectStageIds', id)} />
        </section>

        <section className="bg-white rounded-xl shadow p-5 space-y-3">
          <h2 className="font-semibold">Location and contact</h2>
          <div className="grid md:grid-cols-2 gap-3">
            <input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} placeholder="City" className="border rounded-lg px-3 py-2" />
            <select value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} className="border rounded-lg px-3 py-2">
              <option value="">State</option>
              {(meta.data?.states || []).map((s: any) => <option key={s.key} value={s.label}>{s.label}</option>)}
            </select>
          </div>
          <ChipGroup label="States served" items={(meta.data?.states || []).map((s: any) => ({ id: s.label, label: s.label }))} selected={form.serviceStates} onToggle={(id) => toggle('serviceStates', id)} />
          <div className="grid md:grid-cols-2 gap-3">
            <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="Phone (private unless marked public later)" className="border rounded-lg px-3 py-2" />
            <input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="Email" className="border rounded-lg px-3 py-2" />
            <input value={form.whatsapp} onChange={(e) => setForm({ ...form, whatsapp: e.target.value })} placeholder="WhatsApp" className="border rounded-lg px-3 py-2" />
            <input value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} placeholder="Website" className="border rounded-lg px-3 py-2" />
          </div>
          <label className="flex gap-2 text-sm"><input type="checkbox" checked={form.siteVisits} onChange={(e) => setForm({ ...form, siteVisits: e.target.checked })} /> Site visits</label>
          <label className="flex gap-2 text-sm"><input type="checkbox" checked={form.remoteConsultation} onChange={(e) => setForm({ ...form, remoteConsultation: e.target.checked })} /> Remote consultation</label>
          <label className="flex gap-2 text-sm"><input type="checkbox" checked={form.canIssueSignedReport} onChange={(e) => setForm({ ...form, canIssueSignedReport: e.target.checked })} /> Can issue signed reports</label>
        </section>

        <section className="bg-white rounded-xl shadow p-5 space-y-3">
          <h2 className="font-semibold">Publication</h2>
          <select value={form.listingStatus} onChange={(e) => setForm({ ...form, listingStatus: e.target.value })} className="border rounded-lg px-3 py-2">
            <option value="draft">Save as draft</option>
            <option value="listed">List publicly</option>
            <option value="hidden">Hidden</option>
          </select>
          <textarea value={form.sourceNotes} onChange={(e) => setForm({ ...form, sourceNotes: e.target.value })} placeholder="Internal source notes" className="w-full border rounded-lg px-3 py-2" />
          <label className="flex gap-2 text-sm"><input type="checkbox" checked={form.usedByBmh} onChange={(e) => setForm({ ...form, usedByBmh: e.target.checked })} /> Used by BuildMyHouse (historical)</label>
          {form.usedByBmh && (
            <textarea required value={form.usedByBmhNote} onChange={(e) => setForm({ ...form, usedByBmhNote: e.target.value })} placeholder="Required note for historical BMH use" className="w-full border rounded-lg px-3 py-2" />
          )}
        </section>

        {create.isError && <p className="text-red-600 text-sm">{(create.error as Error).message}</p>}
        <button disabled={create.isPending} className="px-4 py-2 rounded-lg bg-blue-600 text-white disabled:opacity-50">
          {create.isPending ? 'Saving…' : 'Create professional'}
        </button>
      </form>
    </div>
  );
}

function ChipGroup({
  label,
  items,
  selected,
  onToggle,
}: {
  label: string;
  items: Array<{ id: string; label: string }>;
  selected: string[];
  onToggle: (id: string) => void;
}) {
  return (
    <div>
      <p className="text-sm text-gray-600 mb-2">{label}</p>
      <div className="flex flex-wrap gap-2">
        {items.map((item) => (
          <button
            type="button"
            key={item.id}
            onClick={() => onToggle(item.id)}
            className={`px-3 py-1 rounded-full text-xs border ${selected.includes(item.id) ? 'bg-black text-white' : 'bg-white'}`}
          >
            {item.label}
          </button>
        ))}
      </div>
    </div>
  );
}
