import { useEffect } from 'react';
import { useRouter } from 'expo-router';

/** Contractors join on this app. The public /join flow is not the contractor path. */
export default function JoinHandoff() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/email-login');
  }, [router]);
  return null;
}
