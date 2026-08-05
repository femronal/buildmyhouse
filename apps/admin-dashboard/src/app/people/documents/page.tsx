'use client';

import { FormEvent, useState } from 'react';
import { useHrFeedback } from '@/components/people/HrDialogs';
import { api } from '@/lib/api';
import {
  useCreateDocument,
  useHrCandidates,
  useHrDocuments,
  useHrPeople,
} from '@/hooks/usePeopleHr';

const CATEGORIES = [
  'cv',
  'id',
  'employment_contract',
  'consultancy_agreement',
  'nda',
  'offer_letter',
  'reference',
  'probation_letter',
  'performance_warning',
  'promotion_letter',
  'termination_letter',
  'other',
];

export default function DocumentsPage() {
  const { data: documents = [], isLoading } = useHrDocuments();
  const { data: people = [] } = useHrPeople();
  const { data: candidates = [] } = useHrCandidates();
  const createDoc = useCreateDocument();
  const { notify, feedbackModal } = useHrFeedback();
  const [form, setForm] = useState({
    category: 'employment_contract',
    staffProfileId: '',
    candidateId: '',
    fileUrl: '',
    fileName: '',
    expiryDate: '',
  });
  const [uploading, setUploading] = useState(false);

  const onUpload = async (file: File) => {
    setUploading(true);
    try {
      const uploaded = await api.uploadFile(file, { endpoint: '/upload/file' });
      setForm((p) => ({ ...p, fileUrl: uploaded.url, fileName: file.name }));
      notify('success', 'File uploaded', `${file.name} is ready to save.`);
    } catch (err: any) {
      notify('error', 'Upload failed', err?.message || 'Could not upload the file.');
    } finally {
      setUploading(false);
    }
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.fileUrl) {
      notify('info', 'Upload a file first', 'Choose a file and wait for the upload to finish before saving.');
      return;
    }
    try {
      await createDoc.mutateAsync({
        category: form.category,
        fileUrl: form.fileUrl,
        fileName: form.fileName || undefined,
        staffProfileId: form.staffProfileId || undefined,
        candidateId: form.candidateId || undefined,
        expiryDate: form.expiryDate || undefined,
      });
      setForm({
        category: 'employment_contract',
        staffProfileId: '',
        candidateId: '',
        fileUrl: '',
        fileName: '',
        expiryDate: '',
      });
      notify('success', 'Document saved', 'The document was added to the HR library.');
    } catch (err: any) {
      notify('error', 'Could not save document', err?.message || 'Please try again.');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Documents</h2>
        <p className="text-sm text-gray-500">Contracts and identity files stored in S3.</p>
      </div>

      <form onSubmit={onSubmit} className="grid grid-cols-1 gap-3 rounded-xl bg-white p-4 shadow md:grid-cols-2">
        <select
          className="rounded-lg border px-3 py-2 text-sm"
          value={form.category}
          onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))}
        >
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c.replace(/_/g, ' ')}
            </option>
          ))}
        </select>
        <select
          className="rounded-lg border px-3 py-2 text-sm"
          value={form.staffProfileId}
          onChange={(e) => setForm((p) => ({ ...p, staffProfileId: e.target.value }))}
        >
          <option value="">Staff (optional)</option>
          {people.map((p) => (
            <option key={p.id} value={p.id}>
              {p.fullName}
            </option>
          ))}
        </select>
        <select
          className="rounded-lg border px-3 py-2 text-sm"
          value={form.candidateId}
          onChange={(e) => setForm((p) => ({ ...p, candidateId: e.target.value }))}
        >
          <option value="">Candidate (optional)</option>
          {candidates.map((c) => (
            <option key={c.id} value={c.id}>
              {c.fullName}
            </option>
          ))}
        </select>
        <input
          type="date"
          className="rounded-lg border px-3 py-2 text-sm"
          value={form.expiryDate}
          onChange={(e) => setForm((p) => ({ ...p, expiryDate: e.target.value }))}
        />
        <input
          type="file"
          className="text-sm md:col-span-2"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void onUpload(file);
          }}
        />
        {uploading && <p className="text-xs text-gray-500 md:col-span-2">Uploading…</p>}
        {form.fileUrl && (
          <p className="text-xs text-green-700 md:col-span-2">Ready: {form.fileName || form.fileUrl}</p>
        )}
        <button type="submit" className="rounded-lg bg-blue-600 px-3 py-2 text-sm text-white md:col-span-2">
          Save document
        </button>
      </form>

      <div className="overflow-hidden rounded-xl bg-white shadow">
        {isLoading ? (
          <p className="p-4 text-gray-500">Loading…</p>
        ) : documents.length === 0 ? (
          <p className="p-8 text-center text-gray-500">No documents yet.</p>
        ) : (
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500">
              <tr>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Person</th>
                <th className="px-4 py-3">Expiry</th>
                <th className="px-4 py-3">File</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {documents.map((doc) => (
                <tr key={doc.id}>
                  <td className="px-4 py-3 capitalize">{doc.category.replace(/_/g, ' ')}</td>
                  <td className="px-4 py-3">
                    {doc.staffProfile?.fullName || doc.candidate?.fullName || '—'}
                  </td>
                  <td className="px-4 py-3">
                    {doc.expiryDate ? new Date(doc.expiryDate).toLocaleDateString() : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <a href={doc.fileUrl} target="_blank" rel="noreferrer" className="text-blue-600">
                      Open
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {feedbackModal}
    </div>
  );
}
