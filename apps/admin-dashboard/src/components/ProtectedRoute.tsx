'use client';

import { useState } from 'react';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { auth } from '@/lib/api';
import { getCurrentUser, logout } from '@/lib/auth';

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [isCheckingAccess, setIsCheckingAccess] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const verifyAdminAccess = async () => {
      if (!auth.isAuthenticated()) {
        if (!cancelled) {
          setHasAccess(false);
          setIsCheckingAccess(false);
        }
        router.push('/login');
        return;
      }

      try {
        const currentUser = await getCurrentUser();
        const isAdmin = currentUser?.role === 'admin';
        if (!isAdmin) {
          logout();
          return;
        }
        if (!cancelled) {
          setHasAccess(true);
          setIsCheckingAccess(false);
        }
      } catch {
        if (!cancelled) {
          setHasAccess(false);
          setIsCheckingAccess(false);
        }
        router.push('/login');
      }
    };

    verifyAdminAccess();
    return () => {
      cancelled = true;
    };
  }, [router]);

  if (isCheckingAccess) {
    return null;
  }

  if (!hasAccess) {
    return null;
  }

  return <>{children}</>;
}



