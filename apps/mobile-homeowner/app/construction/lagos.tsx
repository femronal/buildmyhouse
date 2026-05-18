import ConstructionLagosLandingPage from '@/components/seo/ConstructionLagosLandingPage';
import {
  constructionLagosLandingPageContent as content,
  getConstructionLagosJsonLd,
} from '@/lib/construction-lagos-landing-content';
import { useWebSeo } from '@/lib/seo';

export default function ConstructionLagosSeoPage() {
  useWebSeo({
    title: content.seo.title,
    description: content.seo.description,
    canonicalPath: '/construction/lagos',
    robots: 'index,follow',
    ogImage: content.coverImage.src,
    jsonLd: getConstructionLagosJsonLd(),
  });

  return <ConstructionLagosLandingPage />;
}

