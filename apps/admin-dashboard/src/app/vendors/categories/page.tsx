'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function VendorCategoriesRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/vendors?categories=1');
  }, [router]);

  return null;
}
