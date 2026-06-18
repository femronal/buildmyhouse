import type { ServiceExperienceContent } from '@/lib/service-experience-content';
import { buildSeoJsonLd } from '@/lib/seo-schema';

export function buildServiceExperienceJsonLd(content: ServiceExperienceContent) {
  return buildSeoJsonLd({
    path: content.canonicalPath,
    title: content.metaTitle,
    description: content.summary,
    schemaType: 'Service',
    faqs: [...content.faqs],
    breadcrumbs: [
      { name: 'Home', path: '/' },
      { name: content.headline, path: content.canonicalPath },
    ],
    image: content.images.heroMain,
    reviews: [...content.reviews],
    processSteps: [...content.processSteps],
  });
}
