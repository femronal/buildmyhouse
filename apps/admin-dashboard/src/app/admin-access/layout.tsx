'use client';

import { Suspense } from 'react';

export default function AdminAccessLayout({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<p className="p-8 text-gray-500">Loading…</p>}>{children}</Suspense>;
}
