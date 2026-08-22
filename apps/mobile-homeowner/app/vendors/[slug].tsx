import { useLocalSearchParams } from 'expo-router';
import VendorProfilePage from '@/components/vendors/VendorProfilePage';

export default function VendorSlugRoute() {
  const params = useLocalSearchParams<{ slug?: string | string[] }>();
  const raw = params.slug;
  const slug = Array.isArray(raw) ? raw[0] : raw;

  if (!slug) {
    return <VendorProfilePage slug="__missing__" />;
  }

  return <VendorProfilePage slug={String(slug)} />;
}
