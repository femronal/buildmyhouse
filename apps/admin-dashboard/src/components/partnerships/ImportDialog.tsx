'use client';

import { useState } from 'react';
import { usePartnershipOwners, uploadPartnershipSheet } from '@/hooks/usePartnerships';
import { CATEGORY_LABEL, STAGE_LABEL } from '@/lib/partnerships';

export default function ImportDialog({ onClose }: { onClose: () => void }) {
  const owners = usePartnershipOwners();
  const [ownerId, setOwnerId] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [rows, setRows] = useState<any[]>([]);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');

  const preview = async () => {
    if (!file) return;
    setError('');
    try {
      setRows(await uploadPartnershipSheet('preview', file));
    } catch (caught) {
      setError((caught as Error).message);
    }
  };

  const commit = async () => {
    if (!file || !ownerId) {
      setError('Pick the owner for this import.');
      return;
    }
    setError('');
    try {
      const payload = {
        ownerId,
        rows: rows.map((row) => ({ importKey: row.importKey, category: row.category, importAnyway: Boolean(row.importAnyway) })),
      };
      setResult(await uploadPartnershipSheet('commit', file, payload));
    } catch (caught) {
      setError((caught as Error).message);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/40 p-4">
      <div className="mx-auto max-w-5xl rounded-2xl bg-white p-5">
        <div className="flex items-start justify-between">
          <h2 className="text-xl font-semibold text-gray-950">Import from sheet</h2>
          <button type="button" onClick={onClose} className="min-h-11 px-2 text-xl" aria-label="Close">×</button>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <input type="file" accept=".csv,text/csv" onChange={(event) => setFile(event.target.files?.[0] || null)} />
          <button type="button" onClick={preview} className="min-h-11 rounded-full border px-4 text-sm">Preview</button>
          <select aria-label="Owner" value={ownerId} onChange={(event) => setOwnerId(event.target.value)} className="min-h-11 rounded-full border px-3 text-sm">
            <option value="">Pick an owner</option>
            {(owners.data || []).map((owner) => <option key={owner.id} value={owner.id}>{owner.fullName}</option>)}
          </select>
          <button type="button" onClick={commit} className="min-h-11 rounded-full bg-gray-950 px-4 text-sm text-white">Commit</button>
        </div>
        {error ? <p className="mt-3 text-sm text-red-700">{error}</p> : null}
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead><tr className="border-b text-xs uppercase text-gray-500"><th className="py-2">Company</th><th>Category</th><th>Stage</th><th>Contact</th><th>Warnings</th><th>Action</th></tr></thead>
            <tbody>
              {rows.map((row, index) => (
                <tr key={row.importKey} className="border-b align-top">
                  <td className="py-2 pr-3">{row.companyName}</td>
                  <td>
                    <select value={row.category} onChange={(event) => setRows(rows.map((item, itemIndex) => itemIndex === index ? { ...item, category: event.target.value } : item))} className="rounded border px-2 py-1">
                      {Object.entries(CATEGORY_LABEL).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                    </select>
                  </td>
                  <td>{STAGE_LABEL[row.stage] || row.stage}</td>
                  <td>{row.contact?.fullName || 'None'}</td>
                  <td className="max-w-xs text-gray-600">{(row.warnings || []).join(' ')}</td>
                  <td>
                    {row.message}
                    {row.action === 'name_warning' ? <label className="mt-1 block"><input type="checkbox" checked={Boolean(row.importAnyway)} onChange={(event) => setRows(rows.map((item, itemIndex) => itemIndex === index ? { ...item, importAnyway: event.target.checked } : item))} /> Import anyway</label> : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {result ? (
          <div className="mt-4 text-sm text-gray-800">
            <p>Created: {result.created?.length || 0}</p>
            {(result.skipped || []).map((row: any) => <p key={`${row.companyName}-skip`}>{row.companyName}: {row.reason}</p>)}
            {(result.failed || []).map((row: any) => <p key={`${row.companyName}-fail`}>{row.companyName}: {row.reason}</p>)}
          </div>
        ) : null}
      </div>
    </div>
  );
}
