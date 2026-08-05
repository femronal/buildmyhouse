'use client';

import { FormEvent, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { api } from '@/lib/api';

export default function AcceptInvitePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token') || '';
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    if (!token) {
      setError('Invitation token is missing.');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }
    setBusy(true);
    try {
      await api.post('/admin/access/invitations/accept', {
        token,
        password,
        fullName: fullName.trim() || undefined,
      });
      router.push('/login');
    } catch (err: any) {
      setError(err?.message || 'Could not accept invitation.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 p-6">
      <form
        onSubmit={onSubmit}
        className="w-full max-w-md space-y-4 rounded-xl bg-white p-8 shadow"
      >
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gray-400">
            BuildMyHouse
          </p>
          <h1 className="mt-1 text-2xl font-bold text-gray-900">Set up your admin access</h1>
          <p className="mt-1 text-sm text-gray-500">
            Choose a password to activate your invitation.
          </p>
        </div>
        <input
          className="w-full rounded-lg border px-3 py-2 text-sm"
          placeholder="Full name (optional)"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
        />
        <input
          required
          type="password"
          className="w-full rounded-lg border px-3 py-2 text-sm"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <input
          required
          type="password"
          className="w-full rounded-lg border px-3 py-2 text-sm"
          placeholder="Confirm password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
        />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={busy}
          className="w-full rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          {busy ? 'Activating…' : 'Activate access'}
        </button>
      </form>
    </div>
  );
}
