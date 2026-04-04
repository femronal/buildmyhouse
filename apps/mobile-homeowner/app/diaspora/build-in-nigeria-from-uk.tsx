import DiasporaUkBuildNigeriaHub from '@/components/seo/DiasporaUkBuildNigeriaHub';
import { diasporaUkBuildNigeriaPageContent, getDiasporaUkBuildNigeriaJsonLd } from '@/lib/diaspora-uk-build-nigeria-hub';
import { useWebSeo } from '@/lib/seo';

export default function BuildInNigeriaFromUkSeoPage() {
  const { seo, faq } = diasporaUkBuildNigeriaPageContent;
  useWebSeo({
    title: seo.title,
    description: seo.description,
    canonicalPath: '/diaspora/build-in-nigeria-from-uk',
    robots: 'index,follow',
    jsonLd: getDiasporaUkBuildNigeriaJsonLd(
      faq.items.map((item) => ({ question: item.question, answer: item.answer })),
      seo.title,
      seo.description,
    ),
  });

  return <DiasporaUkBuildNigeriaHub />;
}

