import InteriorDesignNigeriaLandingPage from '@/components/seo/InteriorDesignNigeriaLandingPage';
import {
  getInteriorDesignNigeriaLandingJsonLd,
  interiorDesignNigeriaLandingPageContent as content,
} from '@/lib/interior-design-nigeria-landing-content';
import { useWebSeo } from '@/lib/seo';

export default function InteriorDesignNigeriaSeoPage() {
  useWebSeo({
    title: content.seo.title,
    description: content.seo.description,
    canonicalPath: '/interior-design/nigeria',
    robots: 'index,follow',
    ogImage: content.coverImage.src,
    jsonLd: getInteriorDesignNigeriaLandingJsonLd(),
  });

  return <InteriorDesignNigeriaLandingPage />;
}

