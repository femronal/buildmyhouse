'use client';

import { Suspense, type ReactNode } from 'react';

export default function AcceptInviteLayout({ children }: { children: ReactNode }) {
  return <Suspense fallback={<p className="p-8 text-center text-gray-500">Loading…</p>}>{children}</Suspense>;
}
