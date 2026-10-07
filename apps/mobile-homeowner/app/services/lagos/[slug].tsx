import { useLocalSearchParams } from 'expo-router';
import DynamicServiceExperiencePage from '@/components/service-experience/DynamicServiceExperiencePage';
import UnknownLagosServicePage from '@/components/service-experience/UnknownLagosServicePage';
import { getSnapshotServiceCanonicalPaths } from '@/lib/cms-snapshot';
import { getAllServiceExperiencePaths } from '@/lib/service-experience-content';

function lagosServiceSlugs() {
  const slugs = new Set<string>();
  for (const path of [...getAllServiceExperiencePaths(), ...getSnapshotServiceCanonicalPaths()]) {
    if (!path.startsWith('/services/lagos/')) continue;
    const slug = path.slice('/services/lagos/'.length);
    if (!slug || slug.includes('/')) continue;
    slugs.add(slug);
  }
  return [...slugs];
}

export function generateStaticParams() {
  return lagosServiceSlugs().map((slug) => ({ slug }));
}

export default function LagosRepairServiceRoute() {
  const params = useLocalSearchParams<{ slug?: string }>();
  const slug = typeof params.slug === 'string' ? params.slug : '';

  if (!slug) {
    return <UnknownLagosServicePage />;
  }

  return <DynamicServiceExperiencePage canonicalPath={`/services/lagos/${slug}`} />;
}
