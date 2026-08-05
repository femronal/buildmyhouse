'use client';

import Link from 'next/link';

export default function AccessRestricted({
  message = 'You do not have permission to access this area of BuildMyHouse.',
}: {
  message?: string;
}) {
  return (
    <div className="flex min-h-[50vh] items-center justify-center p-8">
      <div className="max-w-md rounded-xl bg-white p-8 text-center shadow">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gray-400">
          Admin Access
        </p>
        <h1 className="mt-2 text-2xl font-bold text-gray-900">Access Restricted</h1>
        <p className="mt-3 text-sm leading-6 text-gray-600">{message}</p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link
            href="/dashboard"
            className="rounded-lg border px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
          >
            Go to Dashboard
          </Link>
          <Link
            href="/admin-access?tab=requests"
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            Request Access
          </Link>
        </div>
      </div>
    </div>
  );
}
