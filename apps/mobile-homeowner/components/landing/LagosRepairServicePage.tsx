import ServiceExperiencePage from '@/components/service-experience/ServiceExperiencePage';
import { getServiceExperienceContent } from '@/lib/service-experience-content';
import type { LagosRepairSlug } from '@/lib/lagos-repair-services';

type LagosRepairServicePageProps = {
  slug: LagosRepairSlug;
};

export default function LagosRepairServicePage({ slug }: LagosRepairServicePageProps) {
  const content = getServiceExperienceContent(`/services/lagos/${slug}`);
  if (!content) return null;
  return <ServiceExperiencePage content={content} />;
}
