'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

type JoinRequest = {
  id: string;
  reference: string;
  path: string;
  name: string;
  whatsapp: string;
  status: string;
  proofs: Record<string, string>;
  adminNotes?: string | null;
};

const PILL: Record<string, string> = {
  added: 'Says they have it · Not received',
  not_have: "Doesn't have it yet",
  not_applicable: "Doesn't apply",
};

export default function JoinRequestsPage() {
  const [path, setPath] = useState('');
  const [status, setStatus] = useState('');
  const [selected, setSelected] = useState<JoinRequest | null>(null);
  const query = useQuery({
    queryKey: ['join-requests', path, status],
    queryFn: () => api.get(`/admin/join-requests?path=${path}&status=${status}`),
  });
  const items = (query.data?.items || []) as JoinRequest[];

  return (
    <div className="p-6 text-black">
      <h1 className="text-2xl font-semibold mb-4">Join requests</h1>
      <div className="flex gap-3 mb-4">
        <select value={path} onChange={(event) => setPath(event.target.value)} className="border rounded px-2 py-2">
          <option value="">All paths</option>
          {['repairs', 'cleaning', 'builders', 'professional', 'materials'].map((item) => <option key={item}>{item}</option>)}
        </select>
        <select value={status} onChange={(event) => setStatus(event.target.value)} className="border rounded px-2 py-2">
          <option value="">All statuses</option>
          {['new', 'contacted', 'approved', 'declined', 'spam'].map((item) => <option key={item}>{item}</option>)}
        </select>
      </div>
      <div className="grid md:grid-cols-2 gap-4">
        <div>
          {items.map((item) => (
            <button key={item.id} type="button" onClick={() => setSelected(item)} className="block w-full text-left border rounded p-3 mb-2">
              <strong>{item.reference}</strong>
              <div>{item.name} · {item.path} · {item.status}</div>
            </button>
          ))}
          {!items.length ? <p>No join requests yet.</p> : null}
        </div>
        {selected ? (
          <div className="border rounded p-4">
            <h2 className="text-xl font-semibold">{selected.reference}</h2>
            <p>{selected.name}</p>
            <a href={`https://wa.me/${selected.whatsapp.replace(/\D/g, '')}`}>{selected.whatsapp}</a>
            <h3 className="mt-4 font-semibold">Proof</h3>
            {Object.entries(selected.proofs || {}).map(([key, value]) => (
              <div key={key} className="mt-2">
                <span className="mr-2">{key}</span>
                <span className="inline-block rounded-full bg-gray-200 px-2 py-1 text-sm">{PILL[value] || 'Not asked'}</span>
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}
