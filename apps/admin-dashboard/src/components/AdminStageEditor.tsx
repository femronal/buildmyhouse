'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  FileText,
  Image as ImageIcon,
  Package,
  Plus,
  Save,
  Trash2,
  Upload,
  Users,
} from 'lucide-react';
import { api } from '@/lib/api';
import { getBackendAssetUrl } from '@/lib/image';
import {
  adminProjectService,
  stageDocumentationService,
  type AdminProject,
  type AdminProjectStage,
  type CreateDocumentData,
  type CreateMaterialData,
  type CreateMediaData,
  type CreateTeamMemberData,
} from '@/services/adminProjectService';

type Tab = 'info' | 'materials' | 'team' | 'photos' | 'documents';

const STAGE_STATUSES = ['not_started', 'in_progress', 'completed', 'blocked'] as const;

function getPhaseDescription(project: AdminProject | undefined, stage: AdminProjectStage | undefined) {
  if (!project || !stage) return '';
  const phases = (project.aiAnalysis as any)?.phases;
  if (!Array.isArray(phases)) return '';
  return String(phases[stage.order]?.description || '');
}

type Props = {
  projectId: string;
  stageId: string;
  project: AdminProject;
  stage: AdminProjectStage;
};

export function AdminStageEditor({ projectId, stageId, project, stage }: Props) {
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<Tab>('info');
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);

  const [infoForm, setInfoForm] = useState(() => ({
    name: stage.name,
    description: getPhaseDescription(project, stage),
    status: stage.status,
    estimatedCost: String(stage.estimatedCost ?? 0),
    actualCost: stage.actualCost != null ? String(stage.actualCost) : '',
    estimatedDuration: stage.estimatedDuration || '',
    startDate: stage.startDate ? stage.startDate.slice(0, 10) : '',
    completionDate: stage.completionDate ? stage.completionDate.slice(0, 10) : '',
  }));

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ['admin-project', projectId] });

  const saveInfoMutation = useMutation({
    mutationFn: async () => {
      if (infoForm.status !== stage.status) {
        await adminProjectService.updateStageStatus(
          projectId,
          stageId,
          infoForm.status as (typeof STAGE_STATUSES)[number],
        );
      }
      await adminProjectService.updateStageDetails(projectId, stageId, {
        name: infoForm.name.trim(),
        description: infoForm.description.trim(),
        estimatedCost: Number(infoForm.estimatedCost) || 0,
        actualCost: infoForm.actualCost ? Number(infoForm.actualCost) : undefined,
        estimatedDuration: infoForm.estimatedDuration.trim(),
        startDate: infoForm.startDate || null,
        completionDate: infoForm.completionDate || null,
      });
    },
    onSuccess: async () => {
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      await invalidate();
    },
    onError: (e: Error) => setError(e.message),
  });

  const materials = stage.materials || [];
  const teamMembers = stage.teamMembers || [];
  const media = stage.media || [];
  const documents = stage.documents || [];

  const tabs: { id: Tab; label: string; icon: typeof Package }[] = [
    { id: 'info', label: 'Stage info', icon: FileText },
    { id: 'materials', label: 'Materials', icon: Package },
    { id: 'team', label: 'Artisans', icon: Users },
    { id: 'photos', label: 'Photos', icon: ImageIcon },
    { id: 'documents', label: 'Documents', icon: FileText },
  ];

  return (
    <div className="p-8 space-y-6 max-w-5xl">
      <div className="flex items-start gap-4">
        <Link
          href={`/projects/${projectId}`}
          className="mt-1 p-2 border rounded-lg hover:bg-gray-50"
          aria-label="Back to project"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <p className="text-sm text-gray-500">{project.name}</p>
          <h1 className="text-2xl font-bold font-poppins">
            Stage {stage.order + 1}: {stage.name}
          </h1>
          <p className="text-sm text-gray-500 mt-1 capitalize">{stage.status.replace('_', ' ')}</p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 text-sm rounded-lg px-4 py-3">
          {error}
        </div>
      )}

      <div className="flex flex-wrap gap-2 border-b pb-2">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={`inline-flex items-center gap-2 px-3 py-2 text-sm rounded-lg ${
              tab === id ? 'bg-gray-900 text-white' : 'bg-white border hover:bg-gray-50'
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {tab === 'info' && (
        <InfoTab
          form={infoForm}
          setForm={setInfoForm}
          onSave={() => {
            setError('');
            saveInfoMutation.mutate();
          }}
          saving={saveInfoMutation.isPending}
          saved={saved}
        />
      )}

      {tab === 'materials' && (
        <MaterialsTab
          projectId={projectId}
          stageId={stageId}
          materials={materials}
          onChanged={invalidate}
          onError={setError}
        />
      )}

      {tab === 'team' && (
        <TeamTab
          projectId={projectId}
          stageId={stageId}
          teamMembers={teamMembers}
          onChanged={invalidate}
          onError={setError}
        />
      )}

      {tab === 'photos' && (
        <PhotosTab
          projectId={projectId}
          stageId={stageId}
          media={media}
          onChanged={invalidate}
          onError={setError}
        />
      )}

      {tab === 'documents' && (
        <DocumentsTab
          projectId={projectId}
          stageId={stageId}
          documents={documents}
          onChanged={invalidate}
          onError={setError}
        />
      )}
    </div>
  );
}

function InfoTab({
  form,
  setForm,
  onSave,
  saving,
  saved,
}: {
  form: {
    name: string;
    description: string;
    status: string;
    estimatedCost: string;
    actualCost: string;
    estimatedDuration: string;
    startDate: string;
    completionDate: string;
  };
  setForm: React.Dispatch<React.SetStateAction<typeof form>>;
  onSave: () => void;
  saving: boolean;
  saved: boolean;
}) {
  return (
    <div className="bg-white rounded-xl border p-6 space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label="Stage name">
          <input
            className="w-full px-3 py-2 border rounded-lg"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          />
        </Field>
        <Field label="Status">
          <select
            className="w-full px-3 py-2 border rounded-lg"
            value={form.status}
            onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
          >
            {STAGE_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s.replace('_', ' ')}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Estimated cost (₦)">
          <input
            type="number"
            min={0}
            className="w-full px-3 py-2 border rounded-lg"
            value={form.estimatedCost}
            onChange={(e) => setForm((f) => ({ ...f, estimatedCost: e.target.value }))}
          />
        </Field>
        <Field label="Actual cost (₦)">
          <input
            type="number"
            min={0}
            className="w-full px-3 py-2 border rounded-lg"
            value={form.actualCost}
            onChange={(e) => setForm((f) => ({ ...f, actualCost: e.target.value }))}
          />
        </Field>
        <Field label="Estimated duration">
          <input
            className="w-full px-3 py-2 border rounded-lg"
            value={form.estimatedDuration}
            onChange={(e) => setForm((f) => ({ ...f, estimatedDuration: e.target.value }))}
          />
        </Field>
        <Field label="Start date">
          <input
            type="date"
            className="w-full px-3 py-2 border rounded-lg"
            value={form.startDate}
            onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))}
          />
        </Field>
        <Field label="Completion date">
          <input
            type="date"
            className="w-full px-3 py-2 border rounded-lg"
            value={form.completionDate}
            onChange={(e) => setForm((f) => ({ ...f, completionDate: e.target.value }))}
          />
        </Field>
      </div>
      <Field label="Description">
        <textarea
          rows={5}
          className="w-full px-3 py-2 border rounded-lg"
          value={form.description}
          onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
          placeholder="What this stage covers…"
        />
      </Field>
      <div className="flex justify-end gap-2">
        {saved && <span className="text-sm text-green-600 self-center">Saved</span>}
        <button
          type="button"
          disabled={saving}
          onClick={onSave}
          className="inline-flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          {saving ? 'Saving…' : 'Save stage info'}
        </button>
      </div>
    </div>
  );
}

function MaterialsTab({
  projectId,
  stageId,
  materials,
  onChanged,
  onError,
}: {
  projectId: string;
  stageId: string;
  materials: AdminProjectStage['materials'];
  onChanged: () => Promise<void>;
  onError: (msg: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    name: '',
    brand: '',
    quantity: '1',
    unit: 'units',
    unitPrice: '',
    supplier: '',
    notes: '',
  });
  const [uploading, setUploading] = useState(false);
  const [photoUrl, setPhotoUrl] = useState('');
  const [receiptUrl, setReceiptUrl] = useState('');

  const reset = () => {
    setForm({ name: '', brand: '', quantity: '1', unit: 'units', unitPrice: '', supplier: '', notes: '' });
    setPhotoUrl('');
    setReceiptUrl('');
  };

  const add = async () => {
    if (!form.name.trim()) {
      onError('Material name is required');
      return;
    }
    onError('');
    const data: CreateMaterialData = {
      name: form.name.trim(),
      brand: form.brand.trim() || undefined,
      quantity: Number(form.quantity) || 1,
      unit: form.unit.trim() || 'units',
      unitPrice: Number(form.unitPrice) || 0,
      supplier: form.supplier.trim() || undefined,
      notes: form.notes.trim() || undefined,
      photoUrl: photoUrl || undefined,
      receiptUrl: receiptUrl || undefined,
    };
    await stageDocumentationService.addMaterial(projectId, stageId, data);
    reset();
    setOpen(false);
    await onChanged();
  };

  const remove = async (id: string) => {
    if (!window.confirm('Delete this material?')) return;
    await stageDocumentationService.deleteMaterial(id);
    await onChanged();
  };

  const upload = async (file: File, setter: (url: string) => void) => {
    setUploading(true);
    try {
      const { url } = await api.uploadFile(file);
      setter(url);
    } catch (e: any) {
      onError(e?.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-gray-500">{materials?.length || 0} materials</p>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="inline-flex items-center gap-2 px-3 py-2 text-sm bg-gray-900 text-white rounded-lg"
        >
          <Plus className="w-4 h-4" />
          Add material
        </button>
      </div>
      {(materials || []).length === 0 ? (
        <EmptyState message="No materials yet." />
      ) : (
        <div className="space-y-3">
          {(materials || []).map((m) => (
            <div key={m.id} className="bg-white border rounded-xl p-4 flex justify-between gap-4">
              <div>
                <p className="font-medium">{m.name}</p>
                <p className="text-sm text-gray-500">
                  {m.quantity} {m.unit} · ₦{m.unitPrice.toLocaleString()} each · Total ₦
                  {m.totalPrice.toLocaleString()}
                </p>
                {m.supplier && <p className="text-xs text-gray-400 mt-1">Supplier: {m.supplier}</p>}
              </div>
              <button type="button" onClick={() => remove(m.id)} className="text-red-600 hover:text-red-700">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {open && (
        <Modal title="Add material" onClose={() => setOpen(false)}>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Name">
              <input className="w-full px-3 py-2 border rounded-lg" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
            </Field>
            <Field label="Brand">
              <input className="w-full px-3 py-2 border rounded-lg" value={form.brand} onChange={(e) => setForm((f) => ({ ...f, brand: e.target.value }))} />
            </Field>
            <Field label="Quantity">
              <input type="number" className="w-full px-3 py-2 border rounded-lg" value={form.quantity} onChange={(e) => setForm((f) => ({ ...f, quantity: e.target.value }))} />
            </Field>
            <Field label="Unit">
              <input className="w-full px-3 py-2 border rounded-lg" value={form.unit} onChange={(e) => setForm((f) => ({ ...f, unit: e.target.value }))} />
            </Field>
            <Field label="Unit price (₦)">
              <input type="number" className="w-full px-3 py-2 border rounded-lg" value={form.unitPrice} onChange={(e) => setForm((f) => ({ ...f, unitPrice: e.target.value }))} />
            </Field>
            <Field label="Supplier">
              <input className="w-full px-3 py-2 border rounded-lg" value={form.supplier} onChange={(e) => setForm((f) => ({ ...f, supplier: e.target.value }))} />
            </Field>
          </div>
          <Field label="Notes">
            <textarea rows={2} className="w-full px-3 py-2 border rounded-lg" value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} />
          </Field>
          <div className="flex flex-wrap gap-3">
            <UploadButton label="Photo" uploading={uploading} onFile={(f) => upload(f, setPhotoUrl)} />
            <UploadButton label="Receipt" uploading={uploading} onFile={(f) => upload(f, setReceiptUrl)} />
          </div>
          <ModalActions onCancel={() => setOpen(false)} onConfirm={add} confirmLabel="Add material" />
        </Modal>
      )}
    </div>
  );
}

function TeamTab({
  projectId,
  stageId,
  teamMembers,
  onChanged,
  onError,
}: {
  projectId: string;
  stageId: string;
  teamMembers: AdminProjectStage['teamMembers'];
  onChanged: () => Promise<void>;
  onError: (msg: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: '', role: '', phone: '', email: '', dailyRate: '', notes: '' });
  const [uploading, setUploading] = useState(false);
  const [photoUrl, setPhotoUrl] = useState('');
  const [invoiceUrl, setInvoiceUrl] = useState('');

  const add = async () => {
    if (!form.name.trim() || !form.role.trim()) {
      onError('Name and role are required');
      return;
    }
    onError('');
    const data: CreateTeamMemberData = {
      name: form.name.trim(),
      role: form.role.trim(),
      phone: form.phone.trim() || undefined,
      email: form.email.trim() || undefined,
      dailyRate: form.dailyRate ? Number(form.dailyRate) : undefined,
      notes: form.notes.trim() || undefined,
      photoUrl: photoUrl || undefined,
      invoiceUrl: invoiceUrl || undefined,
    };
    await stageDocumentationService.addTeamMember(projectId, stageId, data);
    setOpen(false);
    setForm({ name: '', role: '', phone: '', email: '', dailyRate: '', notes: '' });
    setPhotoUrl('');
    setInvoiceUrl('');
    await onChanged();
  };

  const remove = async (id: string) => {
    if (!window.confirm('Remove this team member?')) return;
    await stageDocumentationService.deleteTeamMember(id);
    await onChanged();
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-gray-500">{teamMembers?.length || 0} artisans</p>
        <button type="button" onClick={() => setOpen(true)} className="inline-flex items-center gap-2 px-3 py-2 text-sm bg-gray-900 text-white rounded-lg">
          <Plus className="w-4 h-4" />
          Add artisan
        </button>
      </div>
      {(teamMembers || []).length === 0 ? (
        <EmptyState message="No artisans assigned yet." />
      ) : (
        <div className="space-y-3">
          {(teamMembers || []).map((m) => (
            <div key={m.id} className="bg-white border rounded-xl p-4 flex justify-between gap-4">
              <div>
                <p className="font-medium">{m.name}</p>
                <p className="text-sm text-gray-500">{m.role}</p>
                {m.phone && <p className="text-xs text-gray-400">{m.phone}</p>}
              </div>
              <button type="button" onClick={() => remove(m.id)} className="text-red-600">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
      {open && (
        <Modal title="Add artisan" onClose={() => setOpen(false)}>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Name">
              <input className="w-full px-3 py-2 border rounded-lg" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
            </Field>
            <Field label="Role">
              <input className="w-full px-3 py-2 border rounded-lg" value={form.role} onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))} />
            </Field>
            <Field label="Phone">
              <input className="w-full px-3 py-2 border rounded-lg" value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} />
            </Field>
            <Field label="Email">
              <input className="w-full px-3 py-2 border rounded-lg" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} />
            </Field>
            <Field label="Daily rate (₦)">
              <input type="number" className="w-full px-3 py-2 border rounded-lg" value={form.dailyRate} onChange={(e) => setForm((f) => ({ ...f, dailyRate: e.target.value }))} />
            </Field>
          </div>
          <Field label="Notes">
            <textarea rows={2} className="w-full px-3 py-2 border rounded-lg" value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} />
          </Field>
          <div className="flex flex-wrap gap-3">
            <UploadButton label="Photo" uploading={uploading} onFile={async (f) => { setUploading(true); try { setPhotoUrl((await api.uploadFile(f)).url); } finally { setUploading(false); } }} />
            <UploadButton label="Invoice" uploading={uploading} onFile={async (f) => { setUploading(true); try { setInvoiceUrl((await api.uploadFile(f)).url); } finally { setUploading(false); } }} />
          </div>
          <ModalActions onCancel={() => setOpen(false)} onConfirm={add} confirmLabel="Add artisan" />
        </Modal>
      )}
    </div>
  );
}

function PhotosTab({
  projectId,
  stageId,
  media,
  onChanged,
  onError,
}: {
  projectId: string;
  stageId: string;
  media: AdminProjectStage['media'];
  onChanged: () => Promise<void>;
  onError: (msg: string) => void;
}) {
  const [uploading, setUploading] = useState(false);
  const [caption, setCaption] = useState('');

  const upload = async (file: File, type: 'photo' | 'video') => {
    setUploading(true);
    onError('');
    try {
      const { url } = await api.uploadFile(file);
      const data: CreateMediaData = { type, url, caption: caption.trim() || undefined, order: (media?.length || 0) };
      await stageDocumentationService.addMedia(projectId, stageId, data);
      setCaption('');
      await onChanged();
    } catch (e: any) {
      onError(e?.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const remove = async (id: string) => {
    if (!window.confirm('Delete this photo?')) return;
    await stageDocumentationService.deleteMedia(id);
    await onChanged();
  };

  return (
    <div className="space-y-4">
      <div className="bg-white border rounded-xl p-4 space-y-3">
        <Field label="Caption (optional)">
          <input className="w-full px-3 py-2 border rounded-lg" value={caption} onChange={(e) => setCaption(e.target.value)} />
        </Field>
        <UploadButton label={uploading ? 'Uploading…' : 'Upload photo'} uploading={uploading} onFile={(f) => upload(f, 'photo')} />
      </div>
      {(media || []).length === 0 ? (
        <EmptyState message="No photos uploaded yet." />
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {(media || []).map((m) => {
            const src = getBackendAssetUrl(m.url);
            return (
              <div key={m.id} className="bg-white border rounded-xl overflow-hidden">
                {src && m.type === 'photo' ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={src} alt={m.caption || 'Stage photo'} className="w-full h-40 object-cover" />
                ) : (
                  <div className="h-40 bg-gray-100 flex items-center justify-center text-sm text-gray-500">{m.type}</div>
                )}
                <div className="p-3 flex justify-between items-start gap-2">
                  <p className="text-xs text-gray-600 truncate">{m.caption || 'No caption'}</p>
                  <button type="button" onClick={() => remove(m.id)} className="text-red-600 shrink-0">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function DocumentsTab({
  projectId,
  stageId,
  documents,
  onChanged,
  onError,
}: {
  projectId: string;
  stageId: string;
  documents: AdminProjectStage['documents'];
  onChanged: () => Promise<void>;
  onError: (msg: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: '', type: 'other' as CreateDocumentData['type'], notes: '' });
  const [fileUrl, setFileUrl] = useState('');
  const [uploading, setUploading] = useState(false);

  const add = async () => {
    if (!form.name.trim() || !fileUrl) {
      onError('Document name and file are required');
      return;
    }
    onError('');
    await stageDocumentationService.addDocument(projectId, stageId, {
      name: form.name.trim(),
      type: form.type,
      url: fileUrl,
      notes: form.notes.trim() || undefined,
    });
    setOpen(false);
    setForm({ name: '', type: 'other', notes: '' });
    setFileUrl('');
    await onChanged();
  };

  const remove = async (id: string) => {
    if (!window.confirm('Delete this document?')) return;
    await stageDocumentationService.deleteDocument(id);
    await onChanged();
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-gray-500">{documents?.length || 0} documents</p>
        <button type="button" onClick={() => setOpen(true)} className="inline-flex items-center gap-2 px-3 py-2 text-sm bg-gray-900 text-white rounded-lg">
          <Plus className="w-4 h-4" />
          Add document
        </button>
      </div>
      {(documents || []).length === 0 ? (
        <EmptyState message="No documents yet." />
      ) : (
        <div className="space-y-3">
          {(documents || []).map((d) => (
            <div key={d.id} className="bg-white border rounded-xl p-4 flex justify-between gap-4">
              <div>
                <p className="font-medium">{d.name}</p>
                <p className="text-sm text-gray-500 capitalize">{d.type}</p>
                {d.url && (
                  <a href={getBackendAssetUrl(d.url) || d.url} target="_blank" rel="noreferrer" className="text-xs text-blue-600">
                    Open file
                  </a>
                )}
              </div>
              <button type="button" onClick={() => remove(d.id)} className="text-red-600">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
      {open && (
        <Modal title="Add document" onClose={() => setOpen(false)}>
          <Field label="Name">
            <input className="w-full px-3 py-2 border rounded-lg" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
          </Field>
          <Field label="Type">
            <select className="w-full px-3 py-2 border rounded-lg" value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as CreateDocumentData['type'] }))}>
              <option value="receipt">Receipt</option>
              <option value="invoice">Invoice</option>
              <option value="contract">Contract</option>
              <option value="other">Other</option>
            </select>
          </Field>
          <UploadButton
            label={fileUrl ? 'File uploaded' : 'Upload file'}
            uploading={uploading}
            onFile={async (f) => {
              setUploading(true);
              try {
                setFileUrl((await api.uploadFile(f)).url);
              } catch (e: any) {
                onError(e?.message || 'Upload failed');
              } finally {
                setUploading(false);
              }
            }}
          />
          <Field label="Notes">
            <textarea rows={2} className="w-full px-3 py-2 border rounded-lg" value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} />
          </Field>
          <ModalActions onCancel={() => setOpen(false)} onConfirm={add} confirmLabel="Add document" />
        </Modal>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-1">
      <span className="text-sm font-medium text-gray-700">{label}</span>
      {children}
    </label>
  );
}

function EmptyState({ message }: { message: string }) {
  return <div className="bg-white border rounded-xl px-4 py-10 text-center text-sm text-gray-500">{message}</div>;
}

function Modal({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
      <div className="w-full max-w-lg bg-white rounded-xl shadow-lg p-6 space-y-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold">{title}</h3>
          <button type="button" onClick={onClose} className="text-sm text-gray-500">
            Close
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function ModalActions({
  onCancel,
  onConfirm,
  confirmLabel,
}: {
  onCancel: () => void;
  onConfirm: () => void;
  confirmLabel: string;
}) {
  return (
    <div className="flex justify-end gap-2 pt-2">
      <button type="button" onClick={onCancel} className="px-4 py-2 border rounded-lg">
        Cancel
      </button>
      <button type="button" onClick={onConfirm} className="px-4 py-2 bg-gray-900 text-white rounded-lg">
        {confirmLabel}
      </button>
    </div>
  );
}

function UploadButton({
  label,
  uploading,
  onFile,
}: {
  label: string;
  uploading: boolean;
  onFile: (file: File) => void;
}) {
  return (
    <label className="inline-flex items-center gap-2 px-3 py-2 text-sm border rounded-lg cursor-pointer hover:bg-gray-50">
      <Upload className="w-4 h-4" />
      {label}
      <input
        type="file"
        className="hidden"
        disabled={uploading}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onFile(file);
          e.target.value = '';
        }}
      />
    </label>
  );
}
