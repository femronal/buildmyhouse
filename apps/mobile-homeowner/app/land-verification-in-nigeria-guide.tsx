import SeoLandingPage from '@/components/seo/SeoLandingPage';
import { SEO_LANDING_COVERS } from '@/lib/published-content-catalog';
import { getSeoPageContent } from '@/lib/seo-pages';
import { useWebSeo } from '@/lib/seo';

export default function LandVerificationNigeriaGuidePage() {
  const content = getSeoPageContent('landVerificationNigeriaGuide');
  useWebSeo({
    title: content.title,
    description: content.description,
    canonicalPath: content.canonicalPath,
    robots: 'index,follow',
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
      coverImageSource={{ uri: SEO_LANDING_COVERS.land }}
      coverImageAlt={content.heroTitle}
    />
  );
}
