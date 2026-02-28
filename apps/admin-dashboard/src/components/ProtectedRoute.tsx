'use client';

import { useEffect } from 'react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { auth } from '@/lib/api';

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && !auth.isAuthenticated()) {
      router.push('/login');
    }
  }, [mounted, router]);

  // Keep server and first client render identical to avoid hydration mismatch.
  if (!mounted) {
    return null;
  }

  if (!auth.isAuthenticated()) {
    return null;
  }

  return <>{children}</>;
}



