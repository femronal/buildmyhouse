import { useMemo, useState } from 'react';
import { ScrollView, Text, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, ArrowUpRight, Wrench } from 'phosphor-react-native';
import { LEGAL_OPERATOR_LINE } from '@buildmyhouse/shared-utils';
import ProjectTypeTabs from '@/components/ProjectTypeTabs';
import { SeoHeading } from '@/components/seo/SeoHeading';
import {
  FEATURED_PROPERTY_TOOLS,
  PROPERTY_TOOL_CATEGORIES,
  PROPERTY_TOOLS,
  type PropertyTool,
  type PropertyToolCategory,
} from '@/lib/property-tools-catalog';
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
  const live = status === 'live';
  return (
    <View
      style={{
        borderRadius: 999,
        paddingHorizontal: 8,
        paddingVertical: 4,
        backgroundColor: live ? '#DCFCE7' : '#FEF3C7',
      }}
    >
      <Text style={{ fontFamily: 'JetBrainsMono_500Medium', fontSize: 11, color: live ? '#166534' : '#92400E' }}>
        {live ? '● LIVE' : '◷ COMING SOON'}
      </Text>
    </View>
  );
}

function PropertyToolCard({ tool, width }: { tool: PropertyTool; width: string }) {
  const router = useRouter();
  const destination = tool.status === 'live' ? tool.href : `${tool.href}#waitlist`;

  return (
    <TouchableOpacity
      onPress={() => router.push(destination as any)}
      className="border border-neutral-200 rounded-2xl p-5 bg-white"
      style={{ width: width as `${number}%`, minHeight: 180 }}
      activeOpacity={0.92}
      accessibilityRole="link"
      accessibilityLabel={tool.title}
    >
      <View className="flex-row items-center justify-between mb-3">
        <View className="flex-row items-center gap-2 flex-1 pr-2">
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
      <Text className="text-neutral-600 text-sm mb-3 leading-6" style={{ fontFamily: 'Poppins_400Regular' }}>
        {tool.tagline}
      </Text>
      {tool.cardAudience ? (
        <Text className="text-neutral-500 text-xs mb-3" style={{ fontFamily: 'Poppins_500Medium' }}>
          {tool.cardAudience}
        </Text>
      ) : null}
      <View className="flex-row items-center gap-1.5 mt-auto">
        <Text className="text-neutral-800 text-xs" style={{ fontFamily: 'Poppins_600SemiBold' }}>
          {tool.status === 'live' ? 'Use tool' : 'Join waitlist'}
        </Text>
        <ArrowUpRight size={14} color="#171717" />
      </View>
    </TouchableOpacity>
  );
}

export default function ToolsIndexPage() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const [activeTab, setActiveTab] = useState<ToolsTabKey>('featured');
  const cardWidth = width >= 1100 ? '31.5%' : width >= 768 ? '48%' : '100%';
  const liveTools = PROPERTY_TOOLS.filter((tool) => tool.status === 'live');

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
          numberOfItems: PROPERTY_TOOLS.length,
          itemListElement: PROPERTY_TOOLS.map((tool, index) => ({
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

          <Text className="text-neutral-900 text-sm mb-3" style={{ fontFamily: 'Poppins_600SemiBold' }}>
            Live now
          </Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 24 }}>
            {liveTools.map((tool) => (
              <PropertyToolCard key={tool.slug} tool={tool} width={cardWidth} />
            ))}
          </View>

          {activeTab === 'featured' ? (
            <Text className="text-neutral-500 text-sm mb-4 leading-6" style={{ fontFamily: 'Poppins_400Regular' }}>
              The tools we are prioritising first. Three of them are ready to use today.
            </Text>
          ) : null}

          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
            {(activeTab === 'planning'
              ? PROPERTY_TOOLS.filter((tool) =>
                  tool.slug === 'milestone-payment-schedule' || tool.slug === 'renovation-budget-planner',
                )
              : visibleTools
            ).map((tool) => (
              <PropertyToolCard key={tool.slug} tool={tool} width={cardWidth} />
            ))}
          </View>

          <TouchableOpacity
            onPress={() => router.push('/start/repair' as any)}
            className="mt-8 self-start flex-row items-center gap-2 rounded-lg bg-black px-4 py-2.5"
            style={{ minHeight: 44 }}
          >
            <Text className="text-white text-xs" style={{ fontFamily: 'Poppins_600SemiBold' }}>
              Book a tracked repair
            </Text>
            <ArrowUpRight size={14} color="#ffffff" />
          </TouchableOpacity>
        </View>
        <View style={{ backgroundColor: '#060706', paddingHorizontal: 20, paddingVertical: 28 }}>
          <Text style={{ fontFamily: 'Poppins_400Regular', fontSize: 13, color: 'rgba(255,255,255,0.7)' }}>
            {LEGAL_OPERATOR_LINE}
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}
