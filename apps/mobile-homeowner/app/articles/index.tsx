import { useEffect, useMemo, useState } from 'react';
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, Clock3, Search } from 'lucide-react-native';
import { SeoHeading } from '@/components/seo/SeoHeading';
import {
  PILLAR_FILTER_CHIPS,
  filterByPillar,
  itemMatchesSearch,
  type ArticlePillarFilter,
} from '@/lib/article-pillars';
import { articles as fallbackArticles, fetchPublishedArticles, type Article } from '@/lib/articles';
import {
  mergePublishedIndexItems,
  publishedIndexCoverSource,
  type PublishedIndexItem,
} from '@/lib/published-content-catalog';
import { useWebSeo } from '@/lib/seo';
import { cardShadowStyle } from '@/lib/card-styles';

/** Matches Tailwind `h-44` (11rem). RN Web often skips height on `Image` for `require()` sources unless boxed. */
const ARTICLE_CARD_COVER_HEIGHT = 176;

const articleCardStyles = StyleSheet.create({
  coverSlot: {
    width: '100%',
    height: ARTICLE_CARD_COVER_HEIGHT,
    overflow: 'hidden',
    backgroundColor: '#f3f4f6',
  },
  coverImage: {
    width: '100%',
    height: '100%',
  },
});

function ArticleCard({ item, onPress }: { item: PublishedIndexItem; onPress: () => void }) {
  const tagLabel = (item.tags[0] || 'Guide').toUpperCase();
  const isArticleRoute = item.href.startsWith('/articles/');

  return (
    <TouchableOpacity
      style={cardShadowStyle}
      className="border border-gray-200 rounded-3xl mb-5 bg-white"
      onPress={onPress}
      activeOpacity={0.92}
    >
      <View className="overflow-hidden rounded-3xl">
        <View style={articleCardStyles.coverSlot}>
          <Image
            source={publishedIndexCoverSource(item)}
            accessibilityLabel={item.coverImageAlt}
            style={articleCardStyles.coverImage}
            resizeMode="cover"
          />
        </View>
        <View className="p-4">
          <Text className="text-xs text-blue-700 uppercase mb-1" style={{ fontFamily: 'Poppins_600SemiBold' }}>
            {tagLabel}
          </Text>
          <Text className="text-black text-lg mb-1" style={{ fontFamily: 'Poppins_700Bold' }}>
            {item.title}
          </Text>
          <Text className="text-gray-600 text-sm mb-3" style={{ fontFamily: 'Poppins_400Regular' }}>
            {item.excerpt}
          </Text>
          <View className="flex-row items-center flex-wrap">
            <Clock3 size={14} color="#6b7280" />
            <Text className="text-gray-500 text-xs ml-1.5" style={{ fontFamily: 'Poppins_400Regular' }}>
              {item.readingMinutes} min read
            </Text>
            {!isArticleRoute ? (
              <Text className="text-gray-400 text-xs ml-2" style={{ fontFamily: 'Poppins_500Medium' }}>
                • Guide
              </Text>
            ) : null}
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

export default function ArticlesIndexPage() {
  const router = useRouter();
  const [remoteArticles, setRemoteArticles] = useState<Article[] | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [pillarFilter, setPillarFilter] = useState<ArticlePillarFilter>('all');

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

  const list = remoteArticles && remoteArticles.length > 0 ? remoteArticles : fallbackArticles;

  const indexItems = useMemo(() => mergePublishedIndexItems(list), [list]);

  const filteredItems = useMemo(() => {
    const byPillar = filterByPillar(indexItems, pillarFilter);
    return byPillar.filter((item) => itemMatchesSearch(item, searchQuery));
  }, [indexItems, pillarFilter, searchQuery]);

  const openItem = (item: PublishedIndexItem) => {
    router.push(item.href as any);
  };

  useWebSeo({
    title: 'BuildMyHouse Articles | Construction, Renovation, Diaspora Guides',
    description:
      'Read practical BuildMyHouse articles on construction, renovation, interior design, and diaspora project execution in Nigeria.',
    canonicalPath: '/articles',
    robots: 'index,follow',
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      name: 'BuildMyHouse Articles',
      description:
        'Educational resources for Nigerian homeowners and diaspora clients covering construction, renovation, and interior design.',
      url: `${(process.env.EXPO_PUBLIC_WEB_URL || 'https://buildmyhouse.app').replace(/\/+$/, '')}/articles`,
    },
  });

  return (
    <View className="flex-1 bg-white">
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
        <View className="pt-10 px-5 pb-2 md:pt-14 md:px-6 md:pb-4">
          <TouchableOpacity
            onPress={() => (router.canGoBack() ? router.back() : router.push('/login'))}
            className="w-9 h-9 bg-gray-100 rounded-full items-center justify-center mb-2 md:mb-4 md:w-10 md:h-10"
          >
            <ArrowLeft size={18} color="#000000" strokeWidth={2.5} />
          </TouchableOpacity>
          <Text
            className="text-[10px] md:text-xs uppercase tracking-wide text-blue-700 mb-1 md:mb-2"
            style={{ fontFamily: 'Poppins_600SemiBold' }}
          >
            BuildMyHouse Resources
          </Text>
          <SeoHeading
            level={1}
            className="text-xl leading-snug text-black mb-1.5 md:text-3xl md:leading-tight md:mb-2"
            style={{ fontFamily: 'Poppins_700Bold' }}
          >
            Articles and Guides
          </SeoHeading>
          <Text
            className="text-gray-600 text-xs leading-5 md:text-sm md:leading-6 mb-4"
            style={{ fontFamily: 'Poppins_400Regular' }}
          >
            Persuasive and practical guides to help you plan, fund, and execute better projects in Nigeria. Search by
            keyword or filter by topic.
          </Text>

          <View className="flex-row items-center bg-gray-100 border border-gray-200 rounded-2xl px-3 py-2 mb-3">
            <Search size={18} color="#6b7280" strokeWidth={2} />
            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search articles, topics, or keywords…"
              placeholderTextColor="#9ca3af"
              className="flex-1 ml-2 text-black text-sm py-1.5"
              style={{ fontFamily: 'Poppins_400Regular' }}
              returnKeyType="search"
              accessibilityLabel="Search articles"
            />
            {searchQuery.length > 0 ? (
              <TouchableOpacity onPress={() => setSearchQuery('')} accessibilityLabel="Clear search">
                <Text className="text-blue-700 text-xs px-1" style={{ fontFamily: 'Poppins_600SemiBold' }}>
                  Clear
                </Text>
              </TouchableOpacity>
            ) : null}
          </View>

          <Text className="text-[11px] text-gray-500 mb-1.5" style={{ fontFamily: 'Poppins_500Medium' }}>
            Filter by pillar
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingRight: 12, flexDirection: 'row', alignItems: 'center' }}
            className="mb-1"
          >
            {PILLAR_FILTER_CHIPS.map((chip) => {
              const selected = pillarFilter === chip.id;
              return (
                <TouchableOpacity
                  key={chip.id}
                  onPress={() => setPillarFilter(chip.id)}
                  className={`rounded-full px-4 py-2 border mr-2 ${
                    selected ? 'bg-black border-black' : 'bg-white border-gray-300'
                  }`}
                >
                  <Text
                    className={`text-xs ${selected ? 'text-white' : 'text-gray-800'}`}
                    style={{ fontFamily: 'Poppins_600SemiBold' }}
                  >
                    {chip.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        <View className="px-5 md:px-6">
          <Text className="text-gray-500 text-xs mb-3" style={{ fontFamily: 'Poppins_400Regular' }}>
            {filteredItems.length} result{filteredItems.length === 1 ? '' : 's'}
            {searchQuery.trim() ? ` for “${searchQuery.trim()}”` : ''}
          </Text>
          {filteredItems.length === 0 ? (
            <View className="bg-gray-50 border border-gray-200 rounded-2xl p-5 mb-4">
              <Text className="text-black text-base mb-1" style={{ fontFamily: 'Poppins_600SemiBold' }}>
                No matches
              </Text>
              <Text className="text-gray-600 text-sm" style={{ fontFamily: 'Poppins_400Regular' }}>
                Try a different keyword, choose “All”, or pick another pillar filter.
              </Text>
            </View>
          ) : (
            filteredItems.map((item) => (
              <ArticleCard key={item.key} item={item} onPress={() => openItem(item)} />
            ))
          )}
        </View>
      </ScrollView>
    </View>
  );
}
