import { useMemo } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { ArrowLeft, ArrowUpRight, CheckCircle, Clock } from 'phosphor-react-native';
import { SeoHeading } from '@/components/seo/SeoHeading';
import {
  SeoContentColumn,
  SeoContentShell,
  seoContentTypography,
} from '@/components/seo/SeoContentLayout';
import {
  getPropertyToolBySlug,
  PROPERTY_TOOL_CATEGORIES,
  type PropertyTool,
} from '@/lib/property-tools-catalog';
import { useWebSeo } from '@/lib/seo';
import { buildCanonical } from '@/lib/seo-schema';

type PropertyToolDetailPageProps = {
  slug: string;
};

export default function PropertyToolDetailPage({ slug }: PropertyToolDetailPageProps) {
  const router = useRouter();
  const tool = getPropertyToolBySlug(slug);

  const category = useMemo(
    () => PROPERTY_TOOL_CATEGORIES.find((item) => item.key === tool?.category),
    [tool?.category],
  );

  const seoTitle = tool
    ? `${tool.title} | BuildMyHouse Tools`
    : 'Property Tool | BuildMyHouse';
  const seoDescription = tool?.description ?? 'BuildMyHouse property management tools for Nigeria.';

  useWebSeo({
    title: seoTitle,
    description: seoDescription,
    canonicalPath: tool?.href ?? `/tools/${slug}`,
    robots: tool ? 'index,follow' : 'noindex,follow',
    jsonLd: tool
      ? {
          '@context': 'https://schema.org',
          '@graph': [
            {
              '@type': 'WebApplication',
              name: tool.title,
              description: tool.description,
              url: buildCanonical(tool.href),
              applicationCategory: 'BusinessApplication',
              operatingSystem: 'Web',
              offers: {
                '@type': 'Offer',
                price: '0',
                priceCurrency: 'NGN',
              },
            },
            {
              '@type': 'BreadcrumbList',
              itemListElement: [
                { '@type': 'ListItem', position: 1, name: 'Home', item: buildCanonical('/') },
                { '@type': 'ListItem', position: 2, name: 'Tools', item: buildCanonical('/tools') },
                { '@type': 'ListItem', position: 3, name: tool.title, item: buildCanonical(tool.href) },
              ],
            },
          ],
        }
      : undefined,
  });

  if (!tool) {
    return (
      <SeoContentShell>
        <SeoContentColumn className="pt-10 pb-16">
          <Pressable
            onPress={() => router.push('/tools' as any)}
            className="w-9 h-9 mb-6 rounded-full border border-neutral-200 items-center justify-center"
            accessibilityLabel="Go back"
          >
            <ArrowLeft size={16} color="#171717" weight="bold" />
          </Pressable>
          <SeoHeading level={1} className={seoContentTypography.title} style={{ fontFamily: 'Poppins_700Bold' }}>
            Tool not found
          </SeoHeading>
          <Text className={seoContentTypography.body} style={{ fontFamily: 'Poppins_400Regular' }}>
            This tool is not in the BuildMyHouse catalog yet.
          </Text>
          <Link href={'/tools' as any} asChild>
            <Pressable className="mt-6 h-11 px-5 rounded-lg bg-black items-center justify-center self-start">
              <Text className="text-white text-sm" style={{ fontFamily: 'Poppins_500Medium' }}>
                Check all tools
              </Text>
            </Pressable>
          </Link>
        </SeoContentColumn>
      </SeoContentShell>
    );
  }

  return <ToolDetailBody tool={tool} categoryLabel={category?.label} />;
}

function ToolDetailBody({ tool, categoryLabel }: { tool: PropertyTool; categoryLabel?: string }) {
  const router = useRouter();
  const isLive = tool.status === 'live';

  return (
    <SeoContentShell>
      <SeoContentColumn className="pt-10 pb-16">
        <Pressable
          onPress={() => (router.canGoBack() ? router.back() : router.push('/tools' as any))}
          className="w-9 h-9 mb-6 rounded-full border border-neutral-200 items-center justify-center"
          accessibilityLabel="Go back"
        >
          <ArrowLeft size={16} color="#171717" weight="bold" />
        </Pressable>

        <Text className={seoContentTypography.eyebrow} style={{ fontFamily: 'Poppins_600SemiBold' }}>
          {categoryLabel ?? 'BuildMyHouse Tools'}
        </Text>

        <View className="flex-row items-center gap-2 mb-3">
          {isLive ? (
            <>
              <CheckCircle size={14} color="#171717" weight="fill" />
              <Text className="text-xs text-neutral-800 uppercase tracking-wide" style={{ fontFamily: 'Poppins_600SemiBold' }}>
                Live now
              </Text>
            </>
          ) : (
            <>
              <Clock size={14} color="#737373" weight="bold" />
              <Text className="text-xs text-neutral-500 uppercase tracking-wide" style={{ fontFamily: 'Poppins_600SemiBold' }}>
                Coming soon
              </Text>
            </>
          )}
        </View>

        <SeoHeading level={1} className={seoContentTypography.title} style={{ fontFamily: 'Poppins_700Bold' }}>
          {tool.title}
        </SeoHeading>

        <Text className={seoContentTypography.description} style={{ fontFamily: 'Poppins_400Regular' }}>
          {tool.description}
        </Text>

        <View className="mt-6 gap-4 border border-neutral-200 rounded-2xl p-5 bg-neutral-50">
          <View>
            <Text className="text-xs uppercase tracking-wide text-neutral-500 mb-1" style={{ fontFamily: 'Poppins_600SemiBold' }}>
              Problem it solves
            </Text>
            <Text className="text-neutral-800 text-base leading-7" style={{ fontFamily: 'Poppins_400Regular' }}>
              {tool.solves}
            </Text>
          </View>
          <View>
            <Text className="text-xs uppercase tracking-wide text-neutral-500 mb-1" style={{ fontFamily: 'Poppins_600SemiBold' }}>
              Built for
            </Text>
            <Text className="text-neutral-800 text-base leading-7" style={{ fontFamily: 'Poppins_400Regular' }}>
              {tool.audience}
            </Text>
          </View>
        </View>

        {!isLive ? (
          <View className="mt-8 rounded-2xl border border-neutral-200 p-5">
            <Text className="text-black text-lg mb-2" style={{ fontFamily: 'Poppins_600SemiBold' }}>
              This tool is on the BuildMyHouse roadmap
            </Text>
            <Text className="text-neutral-600 text-sm leading-6 mb-5" style={{ fontFamily: 'Poppins_400Regular' }}>
              We are shipping property management tools in priority order. While this one is in development, you can
              start a tracked repair or hire a verified worker with clearer scope and evidence today.
            </Text>
            <View className="flex-col sm:flex-row gap-3">
              <Link href={'/book-repair' as any} asChild>
                <Pressable className="h-11 px-5 rounded-lg bg-black items-center justify-center">
                  <Text className="text-white text-sm" style={{ fontFamily: 'Poppins_500Medium' }}>
                    Book repair online
                  </Text>
                </Pressable>
              </Link>
              <Link href={'/tools' as any} asChild>
                <Pressable className="h-11 px-5 rounded-lg border border-neutral-200 bg-white items-center justify-center flex-row gap-2">
                  <Text className="text-black text-sm" style={{ fontFamily: 'Poppins_500Medium' }}>
                    Check all tools
                  </Text>
                  <ArrowUpRight size={14} color="#171717" weight="bold" />
                </Pressable>
              </Link>
            </View>
          </View>
        ) : (
          <View className="mt-8 flex-col sm:flex-row gap-3">
            <Link href={'/tools' as any} asChild>
              <Pressable className="h-11 px-5 rounded-lg border border-neutral-200 bg-white items-center justify-center">
                <Text className="text-black text-sm" style={{ fontFamily: 'Poppins_500Medium' }}>
                  Check all tools
                </Text>
              </Pressable>
            </Link>
            <Link href={'/book-repair' as any} asChild>
              <Pressable className="h-11 px-5 rounded-lg bg-black items-center justify-center">
                <Text className="text-white text-sm" style={{ fontFamily: 'Poppins_500Medium' }}>
                  Book repair online
                </Text>
              </Pressable>
            </Link>
          </View>
        )}
      </SeoContentColumn>
    </SeoContentShell>
  );
}
