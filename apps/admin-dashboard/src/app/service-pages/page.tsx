'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ServicePagesRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/articles?tab=service-pages');
  }, [router]);

  return <div className="p-8 text-gray-500">Redirecting to Content...</div>;
}
