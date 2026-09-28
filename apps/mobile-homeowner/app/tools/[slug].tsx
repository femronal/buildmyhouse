import { useLocalSearchParams } from 'expo-router';
import PropertyToolDetailPage from '@/components/tools/PropertyToolDetailPage';
import ToolPage from '@/components/tools/tool-page/ToolPage';
import { PROPERTY_TOOLS } from '@/lib/property-tools-catalog';
import { DEDICATED_TOOL_ROUTES, getBatch1Page } from '@/lib/tools/batch-1-pages';

export function generateStaticParams() {
  return PROPERTY_TOOLS.filter((tool) => !DEDICATED_TOOL_ROUTES.has(tool.slug)).map((tool) => ({
    slug: tool.slug,
  }));
}

export default function PropertyToolSlugRoute() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const resolved = Array.isArray(slug) ? slug[0] : slug;
  const value = resolved ?? '';

  if (getBatch1Page(value)) {
    return <ToolPage slug={value} />;
  }

  return <PropertyToolDetailPage slug={value} />;
}
