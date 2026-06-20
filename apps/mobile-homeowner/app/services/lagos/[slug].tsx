import { useLocalSearchParams } from 'expo-router';
import DynamicServiceExperiencePage from '@/components/service-experience/DynamicServiceExperiencePage';
import UnknownLagosServicePage from '@/components/service-experience/UnknownLagosServicePage';

export default function LagosRepairServiceRoute() {
  const params = useLocalSearchParams<{ slug?: string }>();
  const slug = typeof params.slug === 'string' ? params.slug : '';

  if (!slug) {
    return <UnknownLagosServicePage />;
  }

  return <DynamicServiceExperiencePage canonicalPath={`/services/lagos/${slug}`} />;
}
