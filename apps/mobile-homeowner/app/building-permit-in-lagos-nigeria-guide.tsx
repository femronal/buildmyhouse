import SeoLandingPage from '@/components/seo/SeoLandingPage';
import { getSeoPageContent } from '@/lib/seo-pages';
import { useWebSeo } from '@/lib/seo';

export default function BuildingPermitLagosNigeriaGuidePage() {
  const content = getSeoPageContent('buildingPermitLagosNigeriaGuide');
  useWebSeo({
    title: content.title,
    description: content.description,
    canonicalPath: '/guides/lagos-building-permits-and-stage-inspections',
    robots: 'noindex,nofollow',
    jsonLd: content.schema,
  });

  return (
    <SeoLandingPage
      eyebrow={content.eyebrow}
      title={content.heroTitle}
      description={content.heroDescription}
      bulletPoints={content.bullets}
      preWhySections={content.preWhySections}
      processSteps={content.processSteps}
      faqs={content.faqs}
      internalLinks={content.internalLinks}
    />
  );
}
