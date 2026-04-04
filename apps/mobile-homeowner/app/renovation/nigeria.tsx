import RenovationNigeriaHub from '@/components/seo/RenovationNigeriaHub';
import { getRenovationNigeriaJsonLd, renovationNigeriaPageContent } from '@/lib/renovation-nigeria-hub';
import { useWebSeo } from '@/lib/seo';

export default function RenovationNigeriaSeoPage() {
  const { seo, faq } = renovationNigeriaPageContent;
  useWebSeo({
    title: seo.title,
    description: seo.description,
    canonicalPath: '/renovation/nigeria',
    robots: 'index,follow',
    jsonLd: getRenovationNigeriaJsonLd(
      [...faq.items.map((item) => ({ question: item.question, answer: item.answer }))],
      seo.title,
      seo.description,
    ),
  });

  return <RenovationNigeriaHub />;
}

