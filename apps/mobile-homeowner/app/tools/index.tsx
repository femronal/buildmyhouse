import { Image, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, ArrowUpRight, Calculator, Wrench } from 'phosphor-react-native';
import { SeoHeading } from '@/components/seo/SeoHeading';
import { PLANNING_TOOLS, publishedIndexCoverSource } from '@/lib/resources-catalog';
import { useWebSeo } from '@/lib/seo';
import { buildCanonical } from '@/lib/seo-schema';

const TOOL_CARD_HEIGHT = 176;

export default function ToolsIndexPage() {
  const router = useRouter();

  const seoTitle = 'Free Planning Tools for Building & Renovation in Nigeria | BuildMyHouse';
  const seoDescription =
    'Use BuildMyHouse free tools to plan milestone payments and estimate renovation budgets before you send money for a project in Nigeria.';

  useWebSeo({
    title: seoTitle,
    description: seoDescription,
    canonicalPath: '/tools',
    robots: 'index,follow',
    jsonLd: {
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'CollectionPage',
          name: seoTitle,
          description: seoDescription,
          url: buildCanonical('/tools'),
        },
        {
          '@type': 'ItemList',
          name: 'BuildMyHouse planning tools',
          numberOfItems: PLANNING_TOOLS.length,
          itemListElement: PLANNING_TOOLS.map((tool, index) => ({
            '@type': 'ListItem',
            position: index + 1,
            name: tool.title,
            url: buildCanonical(tool.href),
          })),
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Home', item: buildCanonical('/') },
            { '@type': 'ListItem', position: 2, name: 'Articles & Guides', item: buildCanonical('/articles') },
            { '@type': 'ListItem', position: 3, name: 'Planning Tools', item: buildCanonical('/tools') },
          ],
        },
      ],
    },
  });

  return (
    <View className="flex-1 bmh-dark-page">
      <ScrollView contentContainerStyle={{ paddingBottom: 48 }} keyboardShouldPersistTaps="handled">
        <View className="pt-10 px-5 pb-2 md:pt-14 md:px-6 md:pb-4 max-w-4xl mx-auto w-full">
          <TouchableOpacity
            onPress={() => (router.canGoBack() ? router.back() : router.push('/articles'))}
            className="w-9 h-9 bg-white/10 border border-white/10 rounded-full items-center justify-center mb-3 md:w-10 md:h-10"
            accessibilityLabel="Go back"
          >
            <ArrowLeft size={18} color="#ffffff" weight="bold" />
          </TouchableOpacity>

          <Text
            className="text-[10px] md:text-xs uppercase tracking-wide text-white/60 mb-1 md:mb-2"
            style={{ fontFamily: 'Poppins_600SemiBold' }}
          >
            BuildMyHouse Resources
          </Text>
          <SeoHeading
            level={1}
            className="text-xl leading-snug text-white mb-1.5 md:text-3xl md:leading-tight md:mb-2"
            style={{ fontFamily: 'Poppins_700Bold' }}
          >
            Planning Tools
          </SeoHeading>
          <Text
            className="text-white/70 text-xs leading-5 md:text-sm md:leading-6 mb-6"
            style={{ fontFamily: 'Poppins_400Regular' }}
          >
            Free interactive tools to plan payments and renovation budgets before money starts moving on your Nigeria
            project.
          </Text>

          <View className="gap-4">
            {PLANNING_TOOLS.map((tool) => (
              <TouchableOpacity
                key={tool.key}
                onPress={() => router.push(tool.href as any)}
                className="bmh-articles-hub-card overflow-hidden border border-white/10 rounded-2xl"
                activeOpacity={0.92}
                accessibilityRole="link"
                accessibilityLabel={tool.title}
              >
                <View className="md:flex-row">
                  <View className="w-full md:w-2/5 overflow-hidden" style={{ height: TOOL_CARD_HEIGHT }}>
                    <Image
                      source={publishedIndexCoverSource(tool)}
                      accessibilityLabel={tool.coverImageAlt}
                      style={{ width: '100%', height: TOOL_CARD_HEIGHT }}
                      resizeMode="cover"
                    />
                  </View>
                  <View className="flex-1 p-5 bg-white/[0.04]">
                    <View className="flex-row items-center gap-2 mb-2">
                      <Wrench size={14} color="rgba(255,255,255,0.7)" weight="bold" />
                      <Text
                        className="text-[10px] uppercase text-white/60"
                        style={{ fontFamily: 'Poppins_600SemiBold' }}
                      >
                        {tool.tags[0]}
                      </Text>
                    </View>
                    <Text className="text-white text-lg mb-2" style={{ fontFamily: 'Poppins_700Bold' }}>
                      {tool.title}
                    </Text>
                    <Text className="text-white/70 text-sm mb-4" style={{ fontFamily: 'Poppins_400Regular' }}>
                      {tool.excerpt}
                    </Text>
                    <View className="flex-row items-center gap-1.5">
                      <Calculator size={14} color="rgba(255,255,255,0.55)" />
                      <Text className="text-white/55 text-xs" style={{ fontFamily: 'Poppins_500Medium' }}>
                        Open tool
                      </Text>
                      <ArrowUpRight size={14} color="rgba(255,255,255,0.55)" />
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity
            onPress={() => router.push('/articles' as any)}
            className="mt-8 self-start flex-row items-center gap-2 rounded-full border border-white/15 px-4 py-2.5"
          >
            <Text className="text-white/75 text-xs" style={{ fontFamily: 'Poppins_600SemiBold' }}>
              Browse all articles & guides
            </Text>
            <ArrowUpRight size={14} color="rgba(255,255,255,0.75)" />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}
