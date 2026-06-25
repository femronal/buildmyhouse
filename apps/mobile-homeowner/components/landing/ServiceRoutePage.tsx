import DynamicServiceExperiencePage from '@/components/service-experience/DynamicServiceExperiencePage';
import type { ServiceSeoSlug } from '@/lib/home-landing-content';

type ServiceRoutePageProps = {
  slug: ServiceSeoSlug;
};

export default function ServiceRoutePage({ slug }: ServiceRoutePageProps) {
  return <DynamicServiceExperiencePage canonicalPath={`/services/${slug}`} />;
}
