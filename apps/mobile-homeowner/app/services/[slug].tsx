import { useLocalSearchParams } from 'expo-router';
import DynamicServiceExperiencePage from '@/components/service-experience/DynamicServiceExperiencePage';
import { getSnapshotServiceCanonicalPaths } from '@/lib/cms-snapshot';
import { getAllServiceExperiencePaths } from '@/lib/service-experience-content';

/** These slugs have their own route files, so they must not also be dynamic params. */
const DEDICATED_SERVICE_SLUGS = new Set([
  'bathroom-repair-nigeria',
  'drainage-repair-nigeria',
  'electrical-repair-nigeria',
  'fan-repair-nigeria',
  'general-contractors-nigeria',
  'home-renovation-nigeria',
  'kitchen-renovation-nigeria',
  'painting-services-nigeria',
  'plumbing-repair-nigeria',
  'pumping-machine-repair-nigeria',
  'rechargeable-fan-repair-nigeria',
  'roof-leak-repair-nigeria',
  'window-repair-nigeria',
]);

function nigeriaServiceSlugs() {
  const slugs = new Set<string>();
  for (const path of [...getAllServiceExperiencePaths(), ...getSnapshotServiceCanonicalPaths()]) {
    if (!path.startsWith('/services/') || path.startsWith('/services/lagos/')) continue;
    const slug = path.slice('/services/'.length);
    if (!slug || slug.includes('/') || DEDICATED_SERVICE_SLUGS.has(slug)) continue;
    slugs.add(slug);
  }
  return [...slugs];
}

export function generateStaticParams() {
  return nigeriaServiceSlugs().map((slug) => ({ slug }));
}

export default function ServiceRoutePage() {
  const params = useLocalSearchParams<{ slug?: string }>();
  const slug = typeof params.slug === 'string' ? params.slug : '';

  if (!slug) {
    return null;
  }

  return <DynamicServiceExperiencePage canonicalPath={`/services/${slug}`} />;
}
