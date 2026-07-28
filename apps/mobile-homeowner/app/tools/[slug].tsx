import { useLocalSearchParams } from 'expo-router';
import PropertyToolDetailPage from '@/components/tools/PropertyToolDetailPage';

export default function PropertyToolSlugRoute() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const resolved = Array.isArray(slug) ? slug[0] : slug;

  return <PropertyToolDetailPage slug={resolved ?? ''} />;
}
