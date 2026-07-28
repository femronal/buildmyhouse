import { useMemo, useState } from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, ArrowUpRight, CheckCircle, Clock, Wrench } from 'phosphor-react-native';
import ProjectTypeTabs from '@/components/ProjectTypeTabs';
import { SeoHeading } from '@/components/seo/SeoHeading';
import {
  FEATURED_PROPERTY_TOOLS,
  PROPERTY_TOOL_CATEGORIES,
  PROPERTY_TOOLS,
  type PropertyTool,
  type PropertyToolCategory,
} from '@/lib/property-tools-catalog';
import { PLANNING_TOOLS } from '@/lib/resources-catalog';
import { useWebSeo } from '@/lib/seo';
import { buildCanonical } from '@/lib/seo-schema';

type ToolsTabKey = 'featured' | PropertyToolCategory | 'planning';

const TOOLS_TABS: { key: ToolsTabKey; label: string }[] = [
  { key: 'featured', label: 'Featured' },
  ...PROPERTY_TOOL_CATEGORIES.map((category) => ({
    key: category.key as ToolsTabKey,
    label: category.shortLabel,
  })),
  { key: 'planning', label: 'Planning' },
];

function ToolStatusBadge({ status }: { status: PropertyTool['status'] }) {
  if (status === 'live') {
    return (
      <View className="flex-row items-center gap-1.5">
        <CheckCircle size={12} color="#171717" weight="fill" />
        <Text className="text-[10px] uppercase text-neutral-800" style={{ fontFamily: 'Poppins_600SemiBold' }}>
          Live
        </Text>
      </View>
    );
  }

  return (
    <View className="flex-row items-center gap-1.5">
      <Clock size={12} color="#a3a3a3" weight="bold" />
      <Text className="text-[10px] uppercase text-neutral-400" style={{ fontFamily: 'Poppins_600SemiBold' }}>
        Coming soon
      </Text>
    </View>
  );
}

function PropertyToolCard({ tool }: { tool: PropertyTool }) {
  const router = useRouter();

  return (
    <TouchableOpacity
      onPress={() => router.push(tool.href as any)}
      className="border border-neutral-200 rounded-2xl p-5 bg-white"
      activeOpacity={0.92}
      accessibilityRole="link"
      accessibilityLabel={tool.title}
    >
      <View className="flex-row items-center justify-between mb-3">
        <View className="flex-row items-center gap-2">
          <Wrench size={14} color="#737373" weight="bold" />
          <Text className="text-[10px] uppercase text-neutral-500" style={{ fontFamily: 'Poppins_600SemiBold' }}>
            {PROPERTY_TOOL_CATEGORIES.find((c) => c.key === tool.category)?.shortLabel}
          </Text>
        </View>
        <ToolStatusBadge status={tool.status} />
      </View>
      <Text className="text-black text-lg mb-2" style={{ fontFamily: 'Poppins_700Bold' }}>
        {tool.title}
      </Text>
      <Text className="text-neutral-600 text-sm mb-4 leading-6" style={{ fontFamily: 'Poppins_400Regular' }}>
        {tool.tagline}
      </Text>
      <View className="flex-row items-center gap-1.5">
        <Text className="text-neutral-500 text-xs" style={{ fontFamily: 'Poppins_500Medium' }}>
          {tool.status === 'live' ? 'Open tool' : 'View roadmap details'}
        </Text>
        <ArrowUpRight size={14} color="#737373" />
      </View>
    </TouchableOpacity>
  );
}

export default function ToolsIndexPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<ToolsTabKey>('featured');

  const seoTitle = 'Property Management Tools for Nigeria | BuildMyHouse';
  const seoDescription =
    'Explore BuildMyHouse tools for land risk checks, quote comparison, repair triage, budgets, remote oversight, and more — built for Nigeria property work.';

  const visibleTools = useMemo(() => {
    if (activeTab === 'featured') return FEATURED_PROPERTY_TOOLS;
    if (activeTab === 'planning') return [];
    return PROPERTY_TOOLS.filter((tool) => tool.category === activeTab);
  }, [activeTab]);

  const activeCategory = PROPERTY_TOOL_CATEGORIES.find((category) => category.key === activeTab);

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
          name: 'BuildMyHouse property tools',
          numberOfItems: PROPERTY_TOOLS.length + PLANNING_TOOLS.length,
          itemListElement: [
            ...PROPERTY_TOOLS.map((tool, index) => ({
              '@type': 'ListItem',
              position: index + 1,
              name: tool.title,
              url: buildCanonical(tool.href),
            })),
            ...PLANNING_TOOLS.map((tool, index) => ({
              '@type': 'ListItem',
              position: PROPERTY_TOOLS.length + index + 1,
              name: tool.title,
              url: buildCanonical(tool.href),
            })),
          ],
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Home', item: buildCanonical('/') },
            { '@type': 'ListItem', position: 2, name: 'Tools', item: buildCanonical('/tools') },
          ],
        },
      ],
    },
  });

  return (
    <View className="flex-1 bg-white">
      <ScrollView contentContainerStyle={{ paddingBottom: 48 }} keyboardShouldPersistTaps="handled">
        <View className="pt-10 px-5 pb-2 md:pt-14 md:px-6 md:pb-4 max-w-4xl mx-auto w-full">
          <TouchableOpacity
            onPress={() => (router.canGoBack() ? router.back() : router.push('/' as any))}
            className="w-9 h-9 bg-neutral-100 border border-neutral-200 rounded-full items-center justify-center mb-3 md:w-10 md:h-10"
            accessibilityLabel="Go back"
          >
            <ArrowLeft size={18} color="#171717" weight="bold" />
          </TouchableOpacity>

          <Text
            className="text-[10px] md:text-xs uppercase tracking-wide text-neutral-500 mb-1 md:mb-2"
            style={{ fontFamily: 'Poppins_600SemiBold' }}
          >
            BuildMyHouse Tools
          </Text>
          <SeoHeading
            level={1}
            className="text-xl leading-snug text-black mb-1.5 md:text-3xl md:leading-tight md:mb-2"
            style={{ fontFamily: 'Poppins_700Bold' }}
          >
            Check all tools
          </SeoHeading>
          <Text
            className="text-neutral-600 text-xs leading-5 md:text-sm md:leading-6 mb-6"
            style={{ fontFamily: 'Poppins_400Regular' }}
          >
            Software for land risk, quote fairness, repair triage, budgets, remote oversight, and property management —
            built around the real complaints Nigerian owners and diaspora families keep repeating.
          </Text>

          <View className="mb-6">
            <ProjectTypeTabs tabs={TOOLS_TABS} activeTab={activeTab} onSelect={setActiveTab} scrollable />
          </View>

          {activeCategory ? (
            <Text className="text-neutral-500 text-sm mb-4 leading-6" style={{ fontFamily: 'Poppins_400Regular' }}>
              {activeCategory.description}
            </Text>
          ) : null}

          {activeTab === 'featured' ? (
            <Text className="text-neutral-500 text-sm mb-4 leading-6" style={{ fontFamily: 'Poppins_400Regular' }}>
              The six tools we are prioritising first — starting with Price Checker, which is live today.
            </Text>
          ) : null}

          {activeTab === 'planning' ? (
            <View className="gap-4">
              {PLANNING_TOOLS.map((tool) => (
                <TouchableOpacity
                  key={tool.key}
                  onPress={() => router.push(tool.href as any)}
                  className="overflow-hidden border border-neutral-200 rounded-2xl bg-white"
                  activeOpacity={0.92}
                  accessibilityRole="link"
                  accessibilityLabel={tool.title}
                >
                  <View className="p-5">
                    <View className="flex-row items-center gap-2 mb-2">
                      <Wrench size={14} color="#737373" weight="bold" />
                      <Text className="text-[10px] uppercase text-neutral-500" style={{ fontFamily: 'Poppins_600SemiBold' }}>
                        {tool.tags[0]}
                      </Text>
                    </View>
                    <Text className="text-black text-lg mb-2" style={{ fontFamily: 'Poppins_700Bold' }}>
                      {tool.title}
                    </Text>
                    <Text className="text-neutral-600 text-sm mb-4" style={{ fontFamily: 'Poppins_400Regular' }}>
                      {tool.excerpt}
                    </Text>
                    <View className="flex-row items-center gap-1.5">
                      <Text className="text-neutral-500 text-xs" style={{ fontFamily: 'Poppins_500Medium' }}>
                        Open tool
                      </Text>
                      <ArrowUpRight size={14} color="#737373" />
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            <View className="gap-4">
              {visibleTools.map((tool) => (
                <PropertyToolCard key={tool.slug} tool={tool} />
              ))}
            </View>
          )}

          <TouchableOpacity
            onPress={() => router.push('/book-repair' as any)}
            className="mt-8 self-start flex-row items-center gap-2 rounded-lg bg-black px-4 py-2.5"
          >
            <Text className="text-white text-xs" style={{ fontFamily: 'Poppins_600SemiBold' }}>
              Book a tracked repair
            </Text>
            <ArrowUpRight size={14} color="#ffffff" />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}
