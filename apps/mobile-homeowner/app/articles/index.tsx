import { useEffect, useMemo, useState } from 'react';
import {
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  ArrowLeft,
  ArrowUpRight,
  Books,
  Clock,
  ListBullets,
  MagnifyingGlass,
} from 'phosphor-react-native';
import { SeoHeading } from '@/components/seo/SeoHeading';
import { articles as fallbackArticles, fetchPublishedArticles, type Article } from '@/lib/articles';
import {
  buildArticlesHubJsonLd,
  filterByResourceTopic,
  itemMatchesResourceSearch,
  mergeAllResourceItems,
  publishedIndexCoverSource,
  resourceTypeLabel,
  type ResourceIndexItem,
  type ResourceSidebarTopic,
  type ResourceTopicFilter,
} from '@/lib/resources-catalog';
import { fetchResourceSections, resolveSidebarTopics } from '@/lib/resource-sections';
import { useWebSeo } from '@/lib/seo';

const CARD_COVER_HEIGHT = 160;

const coverStyles = StyleSheet.create({
  featuredImage: {
    ...StyleSheet.absoluteFillObject,
  },
  card: {
    width: '100%',
    height: CARD_COVER_HEIGHT,
  },
});

function ResourceMeta({ item }: { item: ResourceIndexItem }) {
  const label = resourceTypeLabel(item);
  const showMinutes = item.contentType === 'article' || item.contentType === 'guide' || item.contentType === 'seo-guide';

  return (
    <View className="flex-row items-center flex-wrap gap-x-2">
      {showMinutes ? (
        <>
          <Clock size={14} color="rgba(255,255,255,0.5)" />
          <Text className="text-white/50 text-xs" style={{ fontFamily: 'Poppins_400Regular' }}>
            {item.readingMinutes} min read
          </Text>
          <Text className="text-white/35 text-xs">•</Text>
        </>
      ) : null}
      <Text className="text-white/50 text-xs" style={{ fontFamily: 'Poppins_500Medium' }}>
        {label}
      </Text>
    </View>
  );
}

function FeaturedResourceCard({
  item,
  onPress,
}: {
  item: ResourceIndexItem;
  onPress: () => void;
}) {
  const tagLabel = (item.tags[0] || resourceTypeLabel(item)).toUpperCase();

  return (
    <TouchableOpacity
      onPress={onPress}
      className="bmh-articles-hub-feature overflow-hidden border border-white/10 rounded-2xl"
      activeOpacity={0.92}
      accessibilityRole="link"
      accessibilityLabel={`Featured: ${item.title}`}
    >
      <View className="lg:flex-row lg:items-stretch">
        <View className="w-full lg:w-1/2 overflow-hidden bmh-articles-hub-feature-media relative min-h-[220px]">
          <Image
            source={publishedIndexCoverSource(item)}
            accessibilityLabel={item.coverImageAlt}
            style={coverStyles.featuredImage}
            resizeMode="cover"
          />
        </View>
        <View className="w-full lg:w-1/2 p-5 md:p-8 bg-white/[0.04]">
          <Text
            className="text-[10px] uppercase text-white/60 mb-2"
            style={{ fontFamily: 'Poppins_600SemiBold' }}
          >
            {tagLabel}
          </Text>
          <SeoHeading
            level={2}
            className="text-white text-xl md:text-2xl leading-snug mb-3"
            style={{ fontFamily: 'Poppins_700Bold' }}
          >
            {item.title}
          </SeoHeading>
          <Text className="text-white/70 text-sm leading-6 mb-4" style={{ fontFamily: 'Poppins_400Regular' }}>
            {item.excerpt}
          </Text>
          {item.tags.length > 0 ? (
            <View className="flex-row flex-wrap gap-2 mb-4">
              {item.tags.slice(0, 3).map((tag) => (
                <View key={tag} className="rounded-full bg-white/10 px-3 py-1">
                  <Text className="text-white/70 text-[11px]" style={{ fontFamily: 'Poppins_500Medium' }}>
                    {tag}
                  </Text>
                </View>
              ))}
            </View>
          ) : null}
          <ResourceMeta item={item} />
        </View>
      </View>
    </TouchableOpacity>
  );
}

function ResourceGridCard({ item, onPress }: { item: ResourceIndexItem; onPress: () => void }) {
  const tagLabel = (item.tags[0] || resourceTypeLabel(item)).toUpperCase();

  return (
    <TouchableOpacity
      onPress={onPress}
      className="bmh-articles-hub-card overflow-hidden border border-white/10 rounded-2xl mb-4 md:mb-0"
      activeOpacity={0.92}
      accessibilityRole="link"
      accessibilityLabel={item.title}
    >
      <View className="overflow-hidden">
        <Image
          source={publishedIndexCoverSource(item)}
          accessibilityLabel={item.coverImageAlt}
          style={coverStyles.card}
          resizeMode="cover"
        />
      </View>
      <View className="p-4 bg-white/[0.03]">
        <Text
          className="text-[10px] uppercase text-white/55 mb-1.5"
          style={{ fontFamily: 'Poppins_600SemiBold' }}
        >
          {tagLabel}
        </Text>
        <Text className="text-white text-base mb-1.5" style={{ fontFamily: 'Poppins_700Bold' }} numberOfLines={2}>
          {item.title}
        </Text>
        <Text className="text-white/65 text-sm mb-3" style={{ fontFamily: 'Poppins_400Regular' }} numberOfLines={3}>
          {item.excerpt}
        </Text>
        <ResourceMeta item={item} />
      </View>
    </TouchableOpacity>
  );
}

export default function ArticlesIndexPage() {
  const router = useRouter();
  const [remoteArticles, setRemoteArticles] = useState<Article[] | null>(null);
  const [sidebarTopics, setSidebarTopics] = useState<ResourceSidebarTopic[]>(() =>
    resolveSidebarTopics(null),
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [topicFilter, setTopicFilter] = useState<ResourceTopicFilter>('all');

  useEffect(() => {
    let active = true;
    fetchPublishedArticles()
      .then((items) => {
        if (!active) return;
        if (items.length > 0) {
          setRemoteArticles(items);
        }
      })
      .catch(() => {});

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;
    fetchResourceSections()
      .then((sections) => {
        if (!active) return;
        setSidebarTopics(resolveSidebarTopics(sections));
      })
      .catch(() => {});

    return () => {
      active = false;
    };
  }, []);

  const list = remoteArticles && remoteArticles.length > 0 ? remoteArticles : fallbackArticles;
  const indexItems = useMemo(() => mergeAllResourceItems(list), [list]);

  const filteredItems = useMemo(() => {
    const byTopic = filterByResourceTopic(indexItems, topicFilter);
    return byTopic.filter((item) => itemMatchesResourceSearch(item, searchQuery));
  }, [indexItems, topicFilter, searchQuery]);

  const featuredItem = filteredItems[0] ?? null;
  const gridItems = featuredItem ? filteredItems.slice(1) : [];

  const openItem = (item: ResourceIndexItem) => {
    router.push(item.href as any);
  };

  const seoDescription =
    'Browse BuildMyHouse articles, diaspora guides, Lagos compliance playbooks, free planning tools, and downloadable checklists for construction and renovation in Nigeria.';

  useWebSeo({
    title: 'Articles, Guides, Tools & Downloads | BuildMyHouse Nigeria Resources',
    description: seoDescription,
    canonicalPath: '/articles',
    robots: 'index,follow',
    jsonLd: buildArticlesHubJsonLd(indexItems),
  });

  const activeTopicMeta =
    topicFilter === 'all' ? null : sidebarTopics.find((topic) => topic.key === topicFilter) ?? null;

  return (
    <View className="flex-1 bmh-dark-page">
      <ScrollView contentContainerStyle={{ paddingBottom: 48 }} keyboardShouldPersistTaps="handled">
        <View className="pt-10 px-5 pb-2 md:pt-14 md:px-6 md:pb-4 max-w-7xl mx-auto w-full">
          <TouchableOpacity
            onPress={() => (router.canGoBack() ? router.back() : router.push('/login'))}
            className="w-9 h-9 bg-white/10 border border-white/10 rounded-full items-center justify-center mb-3 md:mb-4 md:w-10 md:h-10"
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
            Articles, Guides & Tools
          </SeoHeading>
          <Text
            className="text-white/70 text-xs leading-5 md:text-sm md:leading-6 mb-4 md:mb-5 max-w-3xl"
            style={{ fontFamily: 'Poppins_400Regular' }}
          >
            Persuasive and practical resources to help you plan, fund, and execute better projects in Nigeria. Search by
            keyword or browse by topic — articles, guides, free tools, and downloads in one place.
          </Text>

          <View className="flex-row items-center bg-white/[0.06] border border-white/10 rounded-2xl px-3 py-2 mb-6">
            <MagnifyingGlass size={18} color="rgba(255,255,255,0.55)" weight="bold" />
            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search articles, tools, topics, or keywords…"
              placeholderTextColor="rgba(255,255,255,0.35)"
              className="flex-1 ml-2 text-white text-sm py-1.5"
              style={{ fontFamily: 'Poppins_400Regular' }}
              returnKeyType="search"
              accessibilityLabel="Search resources"
            />
            {searchQuery.length > 0 ? (
              <TouchableOpacity onPress={() => setSearchQuery('')} accessibilityLabel="Clear search">
                <Text className="text-white/80 text-xs px-1" style={{ fontFamily: 'Poppins_600SemiBold' }}>
                  Clear
                </Text>
              </TouchableOpacity>
            ) : null}
          </View>

          <View className="lg:flex-row lg:gap-6">
            <View
              className="bmh-articles-hub-sidebar border border-white/10 rounded-2xl p-4 mb-6 lg:mb-0 lg:w-72 lg:shrink-0 bg-white/[0.04]"
              accessibilityRole="none"
            >
              <View className="flex-row items-center gap-2 mb-3">
                <Books size={16} color="rgba(255,255,255,0.65)" weight="bold" />
                <Text className="text-sm text-white/70" style={{ fontFamily: 'Poppins_600SemiBold' }}>
                  Topics
                </Text>
              </View>

              <View className="gap-2" accessibilityRole="tablist">
                {sidebarTopics.map((topic) => {
                  const selected = topicFilter === topic.key;
                  return (
                    <TouchableOpacity
                      key={topic.key}
                      onPress={() => setTopicFilter(topic.key)}
                      className={`bmh-articles-hub-topic rounded-xl px-3 py-2.5 border ${
                        selected ? 'bg-white/10 border-white/20' : 'bg-transparent border-white/10'
                      }`}
                      accessibilityRole="tab"
                      accessibilityState={{ selected }}
                      accessibilityLabel={topic.label}
                    >
                      <Text
                        className={`text-sm ${selected ? 'text-white' : 'text-white/60'}`}
                        style={{ fontFamily: 'Poppins_600SemiBold' }}
                      >
                        {topic.label}
                      </Text>
                      <Text
                        className={`text-[11px] mt-0.5 ${selected ? 'text-white/65' : 'text-white/40'}`}
                        style={{ fontFamily: 'Poppins_400Regular' }}
                        numberOfLines={2}
                      >
                        {topic.hint}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <TouchableOpacity
                onPress={() => setTopicFilter('all')}
                className="mt-4 self-start flex-row items-center gap-2 rounded-full border border-white/10 px-3 py-2"
                accessibilityLabel="View all topics"
              >
                <ListBullets size={14} color="rgba(255,255,255,0.65)" weight="bold" />
                <Text className="text-white/70 text-xs" style={{ fontFamily: 'Poppins_600SemiBold' }}>
                  View all
                </Text>
              </TouchableOpacity>

              {topicFilter === 'tools' ? (
                <TouchableOpacity
                  onPress={() => router.push('/tools' as any)}
                  className="mt-2 self-start flex-row items-center gap-1.5 rounded-full border border-white/10 px-3 py-2"
                >
                  <Text className="text-white/70 text-xs" style={{ fontFamily: 'Poppins_600SemiBold' }}>
                    Open tools hub
                  </Text>
                  <ArrowUpRight size={12} color="rgba(255,255,255,0.75)" />
                </TouchableOpacity>
              ) : null}
            </View>

            <View className="flex-1 min-w-0">
              <View className="mb-4">
                <Text className="text-white/50 text-xs mb-1" style={{ fontFamily: 'Poppins_400Regular' }}>
                  {filteredItems.length} result{filteredItems.length === 1 ? '' : 's'}
                  {searchQuery.trim() ? ` for “${searchQuery.trim()}”` : ''}
                  {activeTopicMeta ? ` in ${activeTopicMeta.label}` : ''}
                </Text>
                {activeTopicMeta ? (
                  <Text className="text-white/40 text-[11px]" style={{ fontFamily: 'Poppins_400Regular' }}>
                    {activeTopicMeta.hint}
                  </Text>
                ) : null}
              </View>

              {filteredItems.length === 0 ? (
                <View className="border border-white/10 rounded-2xl p-5 bg-white/[0.03]">
                  <Text className="text-white text-base mb-1" style={{ fontFamily: 'Poppins_600SemiBold' }}>
                    No matches
                  </Text>
                  <Text className="text-white/65 text-sm" style={{ fontFamily: 'Poppins_400Regular' }}>
                    Try a different keyword, choose “View all”, or pick another topic from the sidebar.
                  </Text>
                </View>
              ) : (
                <>
                  {featuredItem ? (
                    <View className="mb-6">
                      <Text
                        className="text-white/55 text-xs uppercase tracking-wide mb-3"
                        style={{ fontFamily: 'Poppins_600SemiBold' }}
                      >
                        Featured read
                      </Text>
                      <FeaturedResourceCard item={featuredItem} onPress={() => openItem(featuredItem)} />
                    </View>
                  ) : null}

                  {gridItems.length > 0 ? (
                    <View>
                      <Text
                        className="text-white/55 text-xs uppercase tracking-wide mb-3"
                        style={{ fontFamily: 'Poppins_600SemiBold' }}
                      >
                        More resources
                      </Text>
                      <View className="md:grid md:grid-cols-2 md:gap-4">
                        {gridItems.map((item) => (
                          <ResourceGridCard key={item.key} item={item} onPress={() => openItem(item)} />
                        ))}
                      </View>
                    </View>
                  ) : null}
                </>
              )}
            </View>
          </View>

          {Platform.OS === 'web' ? (
            <View className="sr-only" accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
              <Text>
                BuildMyHouse resource library includes construction guides, diaspora building and renovation playbooks,
                Lagos permit compliance, contractor vetting, milestone payment tools, renovation budget planners, PDF
                checklists, and interactive project monitoring demos for Nigerian homeowners abroad.
              </Text>
            </View>
          ) : null}
        </View>
      </ScrollView>
    </View>
  );
}
