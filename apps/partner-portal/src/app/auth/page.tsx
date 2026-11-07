'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import { api, auth } from '@/lib/api';

function Consume() {
  const params = useSearchParams();
  const router = useRouter();
  const [message, setMessage] = useState('Signing you in…');

  useEffect(() => {
    const token = params.get('token') || '';
    if (!token) {
      setMessage('This sign-in link is missing.');
      return;
    }
    api
      .post<{ token: string }>('/referrals/partner-login/consume', { token })
      .then((result) => {
        auth.setToken(result.token);
        router.replace('/overview');
      })
      .catch((error: Error) => setMessage(error.message || 'This sign-in link is invalid or has expired.'));
  }, [params, router]);

  return <p className="text-sm text-gray-700">{message}</p>;
}

export default function AuthPage() {
  return (
    <main className="mx-auto max-w-lg px-4 py-16">
      <Suspense fallback={<p className="text-sm text-gray-500">Signing you in…</p>}>
        <Consume />
      </Suspense>
    </main>
  );
}
