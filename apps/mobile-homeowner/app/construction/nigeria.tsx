import ConstructionNigeriaHub from '@/components/seo/ConstructionNigeriaHub';
import { getConstructionNigeriaHubContent, getConstructionNigeriaJsonLd } from '@/lib/construction-nigeria-hub';
import { useWebSeo } from '@/lib/seo';

export default function ConstructionNigeriaSeoPage() {
  const content = getConstructionNigeriaHubContent();

  useWebSeo({
    title: content.seoTitle,
    description: content.seoDescription,
    canonicalPath: content.canonicalPath,
    robots: 'index,follow',
    jsonLd: getConstructionNigeriaJsonLd(content),
  });

  return <ConstructionNigeriaHub content={content} />;
}
