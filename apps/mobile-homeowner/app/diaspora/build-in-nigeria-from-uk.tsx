import SeoLandingPage from '@/components/seo/SeoLandingPage';
import { getSeoPageContent } from '@/lib/seo-pages';
import { useWebSeo } from '@/lib/seo';

export default function BuildInNigeriaFromUkSeoPage() {
  const content = getSeoPageContent('diasporaUk');
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
      processSteps={content.processSteps}
      faqs={content.faqs}
      internalLinks={content.internalLinks}
      ctaLabel="Start your Nigeria project"
    />
  );
}

