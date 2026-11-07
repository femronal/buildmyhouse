'use client';

import { useEffect, useState } from 'react';
import Shell from '@/components/Shell';
import { api } from '@/lib/api';

type Settings = {
  name: string;
  email: string | null;
  phone: string | null;
  whatsapp: string | null;
  agreementVersion: string | null;
  payout: {
    accountName: string | null;
    bankName: string | null;
    accountNumber: string | null;
    currency: string;
    taxId: string | null;
    notifyEarnings: boolean;
  };
};

export default function SettingsPage() {
  const [form, setForm] = useState<Settings | null>(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    api.get<Settings>('/partner/settings').then(setForm).catch((err: Error) => setError(err.message));
  }, []);

  if (!form) {
    return (
      <Shell>
        <p className="p-6 text-sm text-gray-500">{error || 'Loading…'}</p>
      </Shell>
    );
  }

  const setPayout = (key: keyof Settings['payout'], value: string | boolean) => {
    setForm({ ...form, payout: { ...form.payout, [key]: value } });
  };

  return (
    <Shell>
      <main className="p-4 sm:p-6">
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="mt-2 text-sm text-gray-600">
          Agreement {form.agreementVersion || 'not on file'}. Tax and identity details are stored for review. This page does not file tax or verify an identity.
        </p>
        <form
          className="mt-4 grid max-w-lg gap-3 rounded-xl border border-gray-200 bg-white p-4"
          onSubmit={async (event) => {
            event.preventDefault();
            setMessage('');
            try {
              const saved = await api.patch<Settings>('/partner/settings', {
                name: form.name,
                phone: form.phone || '',
                whatsapp: form.whatsapp || '',
                ...form.payout,
              });
              setForm(saved);
              setMessage('Saved.');
            } catch (error) {
              setMessage(error instanceof Error ? error.message : 'Could not save.');
            }
          }}
        >
          <label className="text-sm">Name
            <input className="mt-1 w-full rounded-lg border px-3 py-2" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
          </label>
          <label className="text-sm">Email
            <input className="mt-1 w-full rounded-lg border bg-gray-50 px-3 py-2" value={form.email || ''} readOnly />
          </label>
          <label className="text-sm">Phone
            <input className="mt-1 w-full rounded-lg border px-3 py-2" value={form.phone || ''} onChange={(event) => setForm({ ...form, phone: event.target.value })} />
          </label>
          <label className="text-sm">WhatsApp
            <input className="mt-1 w-full rounded-lg border px-3 py-2" value={form.whatsapp || ''} onChange={(event) => setForm({ ...form, whatsapp: event.target.value })} />
          </label>
          <label className="text-sm">Account name
            <input className="mt-1 w-full rounded-lg border px-3 py-2" value={form.payout.accountName || ''} onChange={(event) => setPayout('accountName', event.target.value)} />
          </label>
          <label className="text-sm">Bank
            <input className="mt-1 w-full rounded-lg border px-3 py-2" value={form.payout.bankName || ''} onChange={(event) => setPayout('bankName', event.target.value)} />
          </label>
          <label className="text-sm">Account number
            <input className="mt-1 w-full rounded-lg border px-3 py-2" value={form.payout.accountNumber || ''} onChange={(event) => setPayout('accountNumber', event.target.value)} />
          </label>
          <label className="text-sm">Currency
            <input className="mt-1 w-full rounded-lg border px-3 py-2" value={form.payout.currency || 'NGN'} onChange={(event) => setPayout('currency', event.target.value)} />
          </label>
          <label className="text-sm">Tax identification
            <input className="mt-1 w-full rounded-lg border px-3 py-2" value={form.payout.taxId || ''} onChange={(event) => setPayout('taxId', event.target.value)} />
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.payout.notifyEarnings} onChange={(event) => setPayout('notifyEarnings', event.target.checked)} />
            Email me when a commission is approved
          </label>
          <button type="submit" className="rounded-lg bg-black px-4 py-2 text-sm text-white">Save</button>
          {message ? <p className="text-sm text-gray-700">{message}</p> : null}
        </form>
      </main>
    </Shell>
  );
}
