import SeoLandingPage from '@/components/seo/SeoLandingPage';
import { useWebSeo } from '@/lib/seo';
import { getArchitectureJsonLd, getArchitecturePage } from '@/lib/diaspora-seo-architecture';

type Props = {
  pageKey: Parameters<typeof getArchitecturePage>[0];
};

export default function ArchitectureSeoPage({ pageKey }: Props) {
  const page = getArchitecturePage(pageKey);
  useWebSeo({
    title: page.title,
    description: page.description,
    canonicalPath: page.path,
    robots: page.robots,
    jsonLd: getArchitectureJsonLd(page),
  });

  return (
    <SeoLandingPage
      eyebrow={page.eyebrow}
      title={page.heroTitle}
      description={page.heroDescription}
      bulletPoints={page.bullets}
      processSteps={page.processSteps}
      trustBlocks={page.trustBlocks}
      proofOfProcessDemo={page.proofOfProcessDemo}
      relatedLinkSections={page.relatedLinkSections}
      faqs={page.faqs}
      internalLinks={page.internalLinks}
      ctaLabel={page.ctaLabel || 'Start your project'}
      ctaHref={page.ctaHref || '/location?mode=explore'}
    />
  );
}

