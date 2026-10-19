'use client';

import { Suspense, type ReactNode } from 'react';

export default function AdminAccessLayout({ children }: { children: ReactNode }) {
  return <Suspense fallback={<p className="p-8 text-gray-500">Loading…</p>}>{children}</Suspense>;
}
