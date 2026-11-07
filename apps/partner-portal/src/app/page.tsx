'use client';

import dynamic from 'next/dynamic';
import { useState } from 'react';
import { api } from '@/lib/api';

const LandingArt = dynamic(() => import('@/components/LandingArt'), { ssr: false });

export default function SignInPage() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [apply, setApply] = useState({ name: '', email: '', phone: '', audience: '' });
  const [applied, setApplied] = useState('');

  return (
    <main className="mx-auto grid min-h-screen max-w-5xl items-center gap-8 px-4 py-10 lg:grid-cols-[1.1fr_0.9fr]">
      <div>
      <img src="/logo.png" alt="BuildMyHouse" className="h-24 w-auto" />
      <p className="mt-6 text-xs font-semibold uppercase tracking-wide text-gray-500">BuildMyHouse Partner Network</p>
      <h1 className="mt-2 text-3xl font-bold text-gray-900">Introduce homeowners. Earn from the projects they complete.</h1>
      <div className="mt-3 space-y-3 text-sm leading-6 text-gray-600">
        <p>
          BuildMyHouse is where someone organises a build, renovation, or repair in Nigeria, including when they are funding the work from abroad. They can check what the work should cost, agree the stages, and release money when each stage is ready.
        </p>
        <p>
          You introduce those homeowners. When a project from your introduction is completed, you earn from it, and you keep that homeowner for the projects they start later. Share the approved tools, pictures, and videos. BuildMyHouse keeps the plans, payments, and project record.
        </p>
      </div>
      <div className="mt-6 lg:hidden">
        <LandingArt />
      </div>

      <form
        className="mt-8 rounded-xl border border-gray-200 bg-white p-4"
        onSubmit={async (event) => {
          event.preventDefault();
          setMessage('');
          try {
            const result = await api.post<{ ok: boolean; devLink?: string }>('/referrals/partner-login', { email });
            setMessage(
              result.devLink
                ? `Sign-in link: ${result.devLink}`
                : 'If this email belongs to an approved affiliate, a sign-in link is on its way.',
            );
          } catch (error) {
            setMessage(error instanceof Error ? error.message : 'Could not send the link.');
          }
        }}
      >
        <h2 className="text-sm font-semibold">Sign in</h2>
        <input
          type="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="Email"
          className="mt-3 w-full rounded-lg border px-3 py-2 text-sm"
        />
        <button type="submit" className="mt-3 w-full rounded-lg bg-black px-4 py-2 text-sm text-white">
          Email me a sign-in link
        </button>
        {message ? <p className="mt-3 break-all text-sm text-gray-700">{message}</p> : null}
      </form>

      <form
        className="mt-4 rounded-xl border border-gray-200 bg-white p-4"
        onSubmit={async (event) => {
          event.preventDefault();
          setApplied('');
          try {
            await api.post('/referrals/apply', apply);
            setApplied('Application received. You can sign in after BuildMyHouse approves it.');
            setApply({ name: '', email: '', phone: '', audience: '' });
          } catch (error) {
            setApplied(error instanceof Error ? error.message : 'Could not send the application.');
          }
        }}
      >
        <h2 className="text-sm font-semibold">Apply</h2>
        <p className="mt-1 text-xs text-gray-500">An application does not create a login.</p>
        <div className="mt-3 grid gap-2">
          <input required className="rounded-lg border px-3 py-2 text-sm" placeholder="Name" value={apply.name} onChange={(event) => setApply({ ...apply, name: event.target.value })} />
          <input required type="email" className="rounded-lg border px-3 py-2 text-sm" placeholder="Email" value={apply.email} onChange={(event) => setApply({ ...apply, email: event.target.value })} />
          <input className="rounded-lg border px-3 py-2 text-sm" placeholder="Phone" value={apply.phone} onChange={(event) => setApply({ ...apply, phone: event.target.value })} />
          <input className="rounded-lg border px-3 py-2 text-sm" placeholder="Who can you reach?" value={apply.audience} onChange={(event) => setApply({ ...apply, audience: event.target.value })} />
        </div>
        <button type="submit" className="mt-3 w-full rounded-lg border px-4 py-2 text-sm">
          Apply to become an affiliate
        </button>
        {applied ? <p className="mt-3 text-sm text-gray-700">{applied}</p> : null}
      </form>
      </div>
      <div className="hidden lg:block">
        <LandingArt />
      </div>
    </main>
  );
}
