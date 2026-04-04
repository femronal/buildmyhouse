import ConstructionNigeriaHub from '@/components/seo/ConstructionNigeriaHub';
import { getConstructionNigeriaHubContent, getConstructionNigeriaJsonLd } from '@/lib/construction-nigeria-hub';
import { useWebSeo } from '@/lib/seo';

export default function ConstructionNigeriaSeoPage() {
  const content = getConstructionNigeriaHubContent();
  useWebSeo({
    title: content.title,
    description: content.description,
    canonicalPath: content.canonicalPath,
    robots: 'index,follow',
    jsonLd: getConstructionNigeriaJsonLd(content.faqs, content.title, content.description),
  });

  return <ConstructionNigeriaHub content={content} />;
}

