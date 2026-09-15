'use client';

import { FormEvent, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import {
  LISTING_STATUS_LABELS,
  OWNERSHIP_STATUS_LABELS,
  PROCUREMENT_STATUS_LABELS,
  VERIFICATION_STATUS_LABELS,
  useProfessional,
  useProfessionalAction,
  useProfessionalInbox,
  useProfessionalMeta,
  useUpdateProfessional,
} from '@/hooks/useProfessionals';

const TABS = ['Overview', 'Public profile', 'Credentials', 'Procurement', 'Engagements', 'Inbox'] as const;

function labelOf(map: Record<string, string>, value: string | undefined) {
  return (value && map[value]) || value || '—';
}

export default function ProfessionalDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const { data, isLoading, error, refetch } = useProfessional(id);
  const meta = useProfessionalMeta();
  const update = useUpdateProfessional(id);
  const actions = useProfessionalAction(id);
  const inbox = useProfessionalInbox();
  const [tab, setTab] = useState<(typeof TABS)[number]>('Overview');
  const qc = useQueryClient();

  if (isLoading) return <div className="p-8 text-gray-500">Loading professional…</div>;
  if (error || !data) return <div className="p-8 text-red-600">Unable to load this professional.</div>;

  return (
    <div className="p-8 space-y-6">
      <Link href="/professionals" className="text-sm text-blue-600">← Professionals</Link>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-poppins">{data.displayName}</h1>
          <p className="text-gray-500 mt-1">
            {data.profession?.label} · Completeness {data.completenessScore}% · {labelOf(OWNERSHIP_STATUS_LABELS, data.ownershipStatus)}
          </p>
          <p className="text-xs text-gray-400 mt-1">Listed ≠ claimed ≠ credential checked ≠ used by BMH.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {Object.keys(LISTING_STATUS_LABELS).map((status) => (
            <button
              key={status}
              onClick={() => actions.setListingStatus.mutate(status)}
              className={`px-3 py-1.5 text-xs rounded-lg border ${data.listingStatus === status ? 'bg-blue-600 text-white' : 'bg-white'}`}
            >
              {LISTING_STATUS_LABELS[status as keyof typeof LISTING_STATUS_LABELS]}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {TABS.map((item) => (
          <button key={item} onClick={() => setTab(item)} className={`px-3 py-1.5 rounded-lg text-sm ${tab === item ? 'bg-gray-900 text-white' : 'bg-white border'}`}>
            {item}
          </button>
        ))}
      </div>

      {tab === 'Overview' && <Overview data={data} update={update} />}
      {tab === 'Public profile' && <PublicProfile data={data} update={update} meta={meta.data} />}
      {tab === 'Credentials' && <Credentials data={data} actions={actions} />}
      {tab === 'Procurement' && <Procurement data={data} actions={actions} meta={meta.data} />}
      {tab === 'Engagements' && <Engagements data={data} actions={actions} meta={meta.data} />}
      {tab === 'Inbox' && <Inbox data={data} inbox={inbox} onDone={() => { qc.invalidateQueries(); refetch(); }} />}
    </div>
  );
}

function Overview({ data, update }: { data: any; update: ReturnType<typeof useUpdateProfessional> }) {
  const [usedNote, setUsedNote] = useState(data.usedByBmhNote || '');
  return (
    <div className="grid lg:grid-cols-2 gap-4">
      <section className="bg-white rounded-xl shadow p-5 space-y-2 text-sm">
        <h2 className="font-semibold text-base">Record</h2>
        <p>Type: {data.professionalType}</p>
        <p>Profession: {data.profession?.label}</p>
        <p>Location: {[data.city, data.state].filter(Boolean).join(', ') || '—'}</p>
        <p>Contact: {data.phone || data.email || '—'}</p>
        <p>Source: {data.sourceType}</p>
        <p>Listing: {labelOf(LISTING_STATUS_LABELS, data.listingStatus)}</p>
        <p>Verification: {labelOf(VERIFICATION_STATUS_LABELS, data.verificationStatus)}</p>
        <p>Procurement: {labelOf(PROCUREMENT_STATUS_LABELS, data.procurementStatus)}</p>
        <p>Created: {new Date(data.createdAt).toLocaleDateString()}</p>
      </section>
      <section className="bg-white rounded-xl shadow p-5 space-y-3">
        <h2 className="font-semibold">Used by BuildMyHouse</h2>
        <p className="text-sm text-gray-600">A completed engagement can set this automatically. Historical use needs a note.</p>
        <textarea value={usedNote} onChange={(e) => setUsedNote(e.target.value)} className="w-full border rounded-lg px-3 py-2 min-h-24" placeholder="Internal note" />
        <button
          onClick={() => update.mutate({ usedByBmh: true, usedByBmhNote: usedNote, usedByBmhSince: new Date().toISOString() })}
          className="px-3 py-2 rounded-lg bg-gray-900 text-white text-sm"
        >
          Mark used by BMH
        </button>
        {data.usedByBmh && <p className="text-sm text-emerald-700">Currently marked used by BMH.</p>}
      </section>
    </div>
  );
}

function PublicProfile({ data, update, meta }: { data: any; update: ReturnType<typeof useUpdateProfessional>; meta: any }) {
  const [form, setForm] = useState({
    displayName: data.displayName,
    bio: data.bio || '',
    city: data.city || '',
    state: data.state || '',
    publicPhone: !!data.publicPhone,
    publicEmail: !!data.publicEmail,
    publicWhatsapp: !!data.publicWhatsapp,
    publicWebsite: data.publicWebsite !== false,
    remoteConsultation: !!data.remoteConsultation,
    siteVisits: !!data.siteVisits,
    canIssueSignedReport: !!data.canIssueSignedReport,
    specialtyIds: (data.specialties || []).map((s: any) => s.id),
    serviceIds: (data.services || []).map((s: any) => s.id),
    deliverableIds: (data.deliverables || []).map((s: any) => s.id),
    projectStageIds: (data.projectStages || []).map((s: any) => s.id),
  });
  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    update.mutate(form);
  };
  return (
    <form onSubmit={onSubmit} className="bg-white rounded-xl shadow p-5 space-y-4">
      <input value={form.displayName} onChange={(e) => setForm({ ...form, displayName: e.target.value })} className="w-full border rounded-lg px-3 py-2" />
      <textarea value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} className="w-full border rounded-lg px-3 py-2 min-h-24" />
      <div className="grid md:grid-cols-2 gap-3">
        <input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} className="border rounded-lg px-3 py-2" placeholder="City" />
        <input value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} className="border rounded-lg px-3 py-2" placeholder="State" />
      </div>
      {['publicPhone', 'publicEmail', 'publicWhatsapp', 'publicWebsite', 'siteVisits', 'remoteConsultation', 'canIssueSignedReport'].map((key) => (
        <label key={key} className="flex gap-2 text-sm">
          <input type="checkbox" checked={(form as any)[key]} onChange={(e) => setForm({ ...form, [key]: e.target.checked })} />
          {key}
        </label>
      ))}
      <IdChips label="Specialties" items={meta?.specialties || []} selected={form.specialtyIds} onChange={(specialtyIds) => setForm({ ...form, specialtyIds })} />
      <IdChips label="Services" items={meta?.services || []} selected={form.serviceIds} onChange={(serviceIds) => setForm({ ...form, serviceIds })} />
      <IdChips label="Deliverables" items={meta?.deliverables || []} selected={form.deliverableIds} onChange={(deliverableIds) => setForm({ ...form, deliverableIds })} />
      <IdChips label="Stages" items={meta?.projectStages || []} selected={form.projectStageIds} onChange={(projectStageIds) => setForm({ ...form, projectStageIds })} />
      <button className="px-4 py-2 rounded-lg bg-blue-600 text-white">Save public profile</button>
    </form>
  );
}

function Credentials({ data, actions }: { data: any; actions: ReturnType<typeof useProfessionalAction> }) {
  const [reg, setReg] = useState('');
  const [source, setSource] = useState('');
  const [note, setNote] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const add = async (event: FormEvent) => {
    event.preventDefault();
    await actions.addCredential.mutateAsync({
      registrationNumber: reg,
      verificationSourceUrl: source || undefined,
      verificationNotes: note,
      markChecked: true,
      isPrimary: true,
      isPublic: true,
    });
    setReg('');
    setSource('');
    setNote('');
  };
  return (
    <div className="space-y-4">
      <form onSubmit={add} className="bg-white rounded-xl shadow p-5 space-y-3">
        <h2 className="font-semibold">Add credential</h2>
        <p className="text-sm text-gray-600">
          {data.profession?.regulatorLabel
            ? `Expected context: ${data.profession.regulatorLabel}`
            : 'No single statutory regulator. Record documents checked, not a false regulator claim.'}
        </p>
        <input value={reg} onChange={(e) => setReg(e.target.value)} placeholder="Registration number" className="w-full border rounded-lg px-3 py-2" />
        <input value={source} onChange={(e) => setSource(e.target.value)} placeholder="Verification source URL" className="w-full border rounded-lg px-3 py-2" />
        <textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Admin verification note" className="w-full border rounded-lg px-3 py-2" />
        <button className="px-4 py-2 rounded-lg bg-blue-600 text-white">Save and mark checked</button>
      </form>
      <div className="bg-white rounded-xl shadow p-5">
        <h2 className="font-semibold mb-3">Credentials</h2>
        {(data.credentials || []).length === 0 && <p className="text-sm text-gray-500">No credentials have been added yet.</p>}
        {(data.credentials || []).map((credential: any) => (
          <div key={credential.id} className="border rounded-lg p-3 mb-3 text-sm">
            <p className="font-medium">{credential.regulatorLabel || credential.credentialType} · {credential.registrationNumber || 'No number'}</p>
            <p>Status: {credential.verificationStatus} · {credential.credentialStatus}</p>
            <p>Checked: {credential.verifiedAt ? new Date(credential.verifiedAt).toLocaleDateString() : '—'}</p>
            <div className="mt-2 flex gap-2">
              <button onClick={() => actions.setVerification.mutate({ verificationStatus: 'verified', note })} className="px-2 py-1 border rounded">Use for listing check</button>
              <label className="text-xs">
                Upload private document
                <input type="file" className="block mt-1" onChange={(e) => setFile(e.target.files?.[0] || null)} />
              </label>
              <button
                type="button"
                disabled={!file}
                onClick={async () => {
                  if (!file) return;
                  const uploaded = await api.uploadFile(file, { endpoint: '/upload/document' });
                  await actions.addDocument.mutateAsync({
                    credentialId: credential.id,
                    documentType: 'supporting_evidence',
                    fileName: file.name,
                    fileRef: uploaded.url,
                  });
                  setFile(null);
                }}
                className="px-2 py-1 border rounded"
              >
                Attach
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Procurement({ data, actions, meta }: { data: any; actions: ReturnType<typeof useProfessionalAction>; meta: any }) {
  const current = data.procurement || {};
  const [form, setForm] = useState({
    availabilityStatus: current.availabilityStatus || 'unknown',
    inspectionFee: current.inspectionFee || '',
    reportFee: current.reportFee || '',
    consultationFee: current.consultationFee || '',
    typicalTurnaroundHours: current.typicalTurnaroundHours || '',
    rateNotes: current.rateNotes || '',
    internalNotes: current.internalNotes || '',
    procurementStatus: data.procurementStatus,
    capabilityTags: current.capabilityTags || [],
    acceptsBmhNegotiatedRates: !!current.acceptsBmhNegotiatedRates,
  });
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        actions.saveProcurement.mutate({
          ...form,
          inspectionFee: form.inspectionFee ? Number(form.inspectionFee) : undefined,
          reportFee: form.reportFee ? Number(form.reportFee) : undefined,
          consultationFee: form.consultationFee ? Number(form.consultationFee) : undefined,
          typicalTurnaroundHours: form.typicalTurnaroundHours ? Number(form.typicalTurnaroundHours) : undefined,
        });
      }}
      className="bg-white rounded-xl shadow p-5 space-y-3"
    >
      <p className="text-sm text-gray-600">Internal only. Never shown on the public directory.</p>
      <select value={form.procurementStatus} onChange={(e) => setForm({ ...form, procurementStatus: e.target.value })} className="border rounded-lg px-3 py-2">
        {Object.entries(PROCUREMENT_STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
      </select>
      <select value={form.availabilityStatus} onChange={(e) => setForm({ ...form, availabilityStatus: e.target.value })} className="border rounded-lg px-3 py-2">
        <option value="unknown">Availability unknown</option>
        <option value="available">Available</option>
        <option value="limited">Limited</option>
        <option value="unavailable">Unavailable</option>
      </select>
      <div className="grid md:grid-cols-3 gap-3">
        <input value={form.inspectionFee} onChange={(e) => setForm({ ...form, inspectionFee: e.target.value })} placeholder="Inspection fee (NGN)" className="border rounded-lg px-3 py-2" />
        <input value={form.reportFee} onChange={(e) => setForm({ ...form, reportFee: e.target.value })} placeholder="Report fee" className="border rounded-lg px-3 py-2" />
        <input value={form.consultationFee} onChange={(e) => setForm({ ...form, consultationFee: e.target.value })} placeholder="Consultation fee" className="border rounded-lg px-3 py-2" />
      </div>
      <input value={form.typicalTurnaroundHours} onChange={(e) => setForm({ ...form, typicalTurnaroundHours: e.target.value })} placeholder="Typical turnaround hours" className="border rounded-lg px-3 py-2 w-full" />
      <textarea value={form.rateNotes} onChange={(e) => setForm({ ...form, rateNotes: e.target.value })} placeholder="Rate notes" className="w-full border rounded-lg px-3 py-2" />
      <textarea value={form.internalNotes} onChange={(e) => setForm({ ...form, internalNotes: e.target.value })} placeholder="Internal notes" className="w-full border rounded-lg px-3 py-2" />
      <IdChips
        label="Capability tags"
        items={(meta?.capabilityTags || []).map((t: any) => ({ id: t.key, label: t.label }))}
        selected={form.capabilityTags}
        onChange={(capabilityTags) => setForm({ ...form, capabilityTags })}
      />
      <label className="flex gap-2 text-sm">
        <input type="checkbox" checked={form.acceptsBmhNegotiatedRates} onChange={(e) => setForm({ ...form, acceptsBmhNegotiatedRates: e.target.checked })} />
        Accepts negotiated BMH rates
      </label>
      <button className="px-4 py-2 rounded-lg bg-blue-600 text-white">Save procurement</button>
    </form>
  );
}

function Engagements({ data, actions, meta }: { data: any; actions: ReturnType<typeof useProfessionalAction>; meta: any }) {
  const projects = useQuery({
    queryKey: ['admin-projects-min'],
    queryFn: () => api.get<Array<{ id: string; name: string; stages?: Array<{ id: string; name: string }> }>>('/projects'),
  });
  const [projectId, setProjectId] = useState('');
  const [stageId, setStageId] = useState('');
  const [purpose, setPurpose] = useState('');
  const [fee, setFee] = useState('');
  const [dueAt, setDueAt] = useState('');
  const [deliverableId, setDeliverableId] = useState('');
  const projectDetail = useQuery({
    queryKey: ['admin-project', projectId],
    enabled: !!projectId,
    queryFn: () => api.get<{ id: string; name: string; stages?: Array<{ id: string; name: string }> }>(`/projects/${projectId}`),
  });
  const selected = projectDetail.data || (projects.data || []).find((p) => p.id === projectId);
  return (
    <div className="space-y-4">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          actions.createEngagement.mutate({
            projectId,
            stageId: stageId || undefined,
            purpose,
            fee: fee ? Number(fee) : undefined,
            dueAt: dueAt || undefined,
            requiredDeliverableId: deliverableId || undefined,
            status: 'assigned',
          });
        }}
        className="bg-white rounded-xl shadow p-5 space-y-3"
      >
        <h2 className="font-semibold">Record engagement</h2>
        <p className="text-sm text-gray-600">This does not approve a stage or move money.</p>
        <select required value={projectId} onChange={(e) => { setProjectId(e.target.value); setStageId(''); }} className="border rounded-lg px-3 py-2 w-full">
          <option value="">Project</option>
          {(projects.data || []).map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
        <select value={stageId} onChange={(e) => setStageId(e.target.value)} className="border rounded-lg px-3 py-2 w-full">
          <option value="">Stage optional</option>
          {(selected?.stages || []).map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        <textarea required value={purpose} onChange={(e) => setPurpose(e.target.value)} placeholder="Purpose" className="w-full border rounded-lg px-3 py-2" />
        <select value={deliverableId} onChange={(e) => setDeliverableId(e.target.value)} className="border rounded-lg px-3 py-2 w-full">
          <option value="">Required deliverable</option>
          {(meta?.deliverables || []).map((d: any) => <option key={d.id} value={d.id}>{d.label}</option>)}
        </select>
        <div className="grid md:grid-cols-2 gap-3">
          <input value={fee} onChange={(e) => setFee(e.target.value)} placeholder="Fee (NGN)" className="border rounded-lg px-3 py-2" />
          <input type="date" value={dueAt} onChange={(e) => setDueAt(e.target.value)} className="border rounded-lg px-3 py-2" />
        </div>
        <button className="px-4 py-2 rounded-lg bg-blue-600 text-white">Create engagement</button>
      </form>
      <div className="bg-white rounded-xl shadow p-5">
        {(data.engagements || []).length === 0 && <p className="text-sm text-gray-500">BuildMyHouse has not recorded an engagement with this professional yet.</p>}
        {(data.engagements || []).map((engagement: any) => (
          <div key={engagement.id} className="border rounded-lg p-3 mb-3 text-sm space-y-2">
            <p className="font-medium">{engagement.project?.name} {engagement.stage ? `· ${engagement.stage.name}` : ''}</p>
            <p>{engagement.purpose}</p>
            <p>Status: {engagement.status} · Fee: {engagement.fee ? `₦${engagement.fee}` : '—'}</p>
            <div className="flex flex-wrap gap-2">
              {['assigned', 'in_progress', 'delivered', 'completed', 'cancelled'].map((status) => (
                <button key={status} onClick={() => actions.updateEngagement.mutate({ engagementId: engagement.id, status })} className="px-2 py-1 border rounded text-xs">
                  {status}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Inbox({ data, inbox, onDone }: { data: any; inbox: ReturnType<typeof useProfessionalInbox>; onDone: () => void }) {
  return (
    <div className="grid lg:grid-cols-3 gap-4">
      <section className="bg-white rounded-xl shadow p-5">
        <h2 className="font-semibold mb-2">Applications</h2>
        {(inbox.applications.data || []).map((row: any) => (
          <div key={row.id} className="border rounded-lg p-3 mb-2 text-sm">
            <p className="font-medium">{row.displayName}</p>
            <p>{row.email} · {row.status}</p>
            <div className="flex gap-2 mt-2">
              <button onClick={async () => { await inbox.reviewApplication.mutateAsync({ id: row.id, status: 'approved', createListing: true }); onDone(); }} className="px-2 py-1 border rounded">Approve + create</button>
              <button onClick={async () => { await inbox.reviewApplication.mutateAsync({ id: row.id, status: 'rejected' }); onDone(); }} className="px-2 py-1 border rounded">Reject</button>
            </div>
          </div>
        ))}
      </section>
      <section className="bg-white rounded-xl shadow p-5">
        <h2 className="font-semibold mb-2">Claims</h2>
        {(inbox.claims.data || []).filter((row: any) => row.professionalListingId === data.id || row.listing?.id === data.id).map((row: any) => (
          <div key={row.id} className="border rounded-lg p-3 mb-2 text-sm">
            <p className="font-medium">{row.requesterName}</p>
            <p>{row.relationshipToPractice} · {row.email}</p>
            <div className="flex gap-2 mt-2">
              <button onClick={async () => { await inbox.reviewClaim.mutateAsync({ id: row.id, status: 'approved' }); onDone(); }} className="px-2 py-1 border rounded">Approve claim</button>
              <button onClick={async () => { await inbox.reviewClaim.mutateAsync({ id: row.id, status: 'rejected' }); onDone(); }} className="px-2 py-1 border rounded">Reject</button>
            </div>
          </div>
        ))}
      </section>
      <section className="bg-white rounded-xl shadow p-5">
        <h2 className="font-semibold mb-2">Enquiries</h2>
        {(data.enquiries || []).length === 0 && <p className="text-sm text-gray-500">No enquiries yet.</p>}
        {(data.enquiries || []).map((row: any) => (
          <div key={row.id} className="border rounded-lg p-3 mb-2 text-sm">
            <p className="font-medium">{row.requesterName}</p>
            <p>{row.whatDoYouNeed}</p>
          </div>
        ))}
      </section>
    </div>
  );
}

function IdChips({
  label,
  items,
  selected,
  onChange,
}: {
  label: string;
  items: Array<{ id: string; label: string }>;
  selected: string[];
  onChange: (next: string[]) => void;
}) {
  return (
    <div>
      <p className="text-sm text-gray-600 mb-2">{label}</p>
      <div className="flex flex-wrap gap-2">
        {items.map((item) => {
          const active = selected.includes(item.id);
          return (
            <button
              type="button"
              key={item.id}
              onClick={() => onChange(active ? selected.filter((id) => id !== item.id) : [...selected, item.id])}
              className={`px-3 py-1 rounded-full text-xs border ${active ? 'bg-black text-white' : 'bg-white'}`}
            >
              {item.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
