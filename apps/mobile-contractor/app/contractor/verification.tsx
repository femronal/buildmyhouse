import { useEffect } from 'react';
import { useRouter } from 'expo-router';

export default function VerificationScreen() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/contractor/gc-profile');
  }, [router]);
  return null;
}
