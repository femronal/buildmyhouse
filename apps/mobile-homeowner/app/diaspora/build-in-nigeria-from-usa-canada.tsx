import DiasporaUsaCanadaLandingPage from '@/components/seo/DiasporaUsaCanadaLandingPage';
import {
  diasporaUsaCanadaLandingPageContent as content,
  getDiasporaUsaCanadaLandingJsonLd,
} from '@/lib/diaspora-usa-canada-landing-content';
import { useWebSeo } from '@/lib/seo';

export default function BuildInNigeriaFromUsCanadaSeoPage() {
  useWebSeo({
    title: content.seo.title,
    description: content.seo.description,
    canonicalPath: '/diaspora/build-in-nigeria-from-usa-canada',
    robots: 'index,follow',
    ogImage: content.coverImage.src,
    jsonLd: getDiasporaUsaCanadaLandingJsonLd(),
  });

  return <DiasporaUsaCanadaLandingPage />;
}

