import RenovationNigeriaLandingPage from '@/components/seo/RenovationNigeriaLandingPage';
import {
  getRenovationNigeriaLandingJsonLd,
  renovationNigeriaLandingPageContent as content,
} from '@/lib/renovation-nigeria-landing-content';
import { useWebSeo } from '@/lib/seo';

export default function RenovationNigeriaSeoPage() {
  useWebSeo({
    title: content.seo.title,
    description: content.seo.description,
    canonicalPath: '/renovation/nigeria',
    robots: 'index,follow',
    ogImage: content.coverImage.src,
    jsonLd: getRenovationNigeriaLandingJsonLd(),
  });

  return <RenovationNigeriaLandingPage />;
}
