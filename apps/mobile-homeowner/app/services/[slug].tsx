import { useLocalSearchParams } from 'expo-router';
import DynamicServiceExperiencePage from '@/components/service-experience/DynamicServiceExperiencePage';

export default function ServiceRoutePage() {
  const params = useLocalSearchParams<{ slug?: string }>();
  const slug = typeof params.slug === 'string' ? params.slug : '';

  if (!slug) {
    return null;
  }

  return <DynamicServiceExperiencePage canonicalPath={`/services/${slug}`} />;
}
