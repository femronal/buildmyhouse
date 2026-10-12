import { useMemo, useState, type ReactNode } from 'react';
import { Image, Platform, ScrollView, Text, TextInput, View, useWindowDimensions, type StyleProp, type ViewStyle } from 'react-native';
import { Link } from 'expo-router';
import { BlogTopBar } from '@/components/articles/ArticleChrome';
import {
  BLOG_TOPICS,
  articlesPageHref,
  blogListJsonLd,
  filterBlogCards,
  formatArticleDate,
  paginateBlogCards,
  topicBySlug,
  topicHref,
  topicPageHref,
  usePublishedBlogCards,
  type BlogCard,
} from '@/lib/articles-hub';
import { SeoHeading } from '@/components/seo/SeoHeading';
import { useWebSeo } from '@/lib/seo';

type ArticlesHubProps = {
  page?: number;
  topicSlug?: string;
};

const font = {
  regular: 'Poppins_400Regular',
  medium: 'Poppins_500Medium',
  semibold: 'Poppins_600SemiBold',
  bold: 'Poppins_700Bold',
} as const;

function ArticleAnchor({
  href,
  label,
  children,
  className,
  style,
}: {
  href: string;
  label: string;
  children: ReactNode;
  className?: string;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <View style={style}>
      <Link
        href={href as never}
        accessibilityRole="link"
        accessibilityLabel={label}
        className={className}
        style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', width: '100%' }}
      >
        {children}
      </Link>
    </View>
  );
}

function Cover({ card, eager }: { card: BlogCard; eager?: boolean }) {
  if (Platform.OS === 'web') {
    return (
      <img
        src={card.coverImageUrl}
        alt={card.coverImageAlt}
        width={1200}
        height={675}
        loading={eager ? 'eager' : 'lazy'}
        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
      />
    );
  }
  return (
    <Image
      source={{ uri: card.coverImageUrl }}
      accessibilityLabel={card.coverImageAlt}
      style={{ width: '100%', height: '100%' }}
      resizeMode="cover"
    />
  );
}

function MetaLine({ card }: { card: BlogCard }) {
  return (
    <Text className="text-xs text-neutral-500" style={{ fontFamily: font.regular }}>
      {card.topicLabel} · {formatArticleDate(card.publishedAt)} · {card.readingMinutes} min read
    </Text>
  );
}

export default function ArticlesHub({ page = 1, topicSlug }: ArticlesHubProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const { width } = useWindowDimensions();
  const wide = width >= 960;
  const topic = topicBySlug(topicSlug);
  const cards = usePublishedBlogCards();

  const searching = searchQuery.trim().length > 0;
  const filtered = useMemo(
    () => filterBlogCards(cards, topicSlug, searchQuery),
    [cards, topicSlug, searchQuery],
  );
  const paged = paginateBlogCards(searching ? filtered : filterBlogCards(cards, topicSlug), searching ? 1 : page);
  const pageItems = searching ? filtered : paged.items;
  const featured = !searching && paged.page === 1 ? pageItems[0] : null;
  const latest = featured ? pageItems.slice(1, 5) : [];
  const grid = featured ? pageItems.slice(5) : pageItems;
  const pageCountSource = filterBlogCards(cards, topicSlug);
  const totalPages = paginateBlogCards(pageCountSource, 1).totalPages;

  const canonicalPath = topicSlug ? topicPageHref(topicSlug, page) : articlesPageHref(page);
  const pageName = topic
    ? `${topic.label} articles`
    : page > 1
      ? `Articles, page ${page}`
      : 'Articles';
  const description = topic
    ? topic.description
    : 'BuildMyHouse articles for homeowners in Nigeria and abroad: building costs, renovation, permits, and how to stay in control of a project.';

  useWebSeo({
    title: `${pageName} | BuildMyHouse`,
    description,
    canonicalPath,
    robots: 'index,follow',
    jsonLd: blogListJsonLd(pageItems, canonicalPath, pageName, description),
  });

  const pageHref = (nextPage: number) => (topicSlug ? topicPageHref(topicSlug, nextPage) : articlesPageHref(nextPage));

  const heading = topic ? topic.label : 'Blog';
  const h1 = page > 1 ? `${heading}, page ${page}` : heading;

  return (
    <View className="flex-1 bg-white">
      <BlogTopBar />
      <ScrollView contentContainerStyle={{ paddingBottom: 64 }}>
        <View className="px-5 pt-8 pb-10 md:px-8 md:pt-12 max-w-6xl mx-auto w-full">
          <SeoHeading level={1} className="text-4xl text-black mb-2" style={{ fontFamily: font.bold }}>
            {h1}
          </SeoHeading>
          <Text className="text-neutral-600 text-base mb-6 max-w-2xl" style={{ fontFamily: font.regular }}>
            {description}
          </Text>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-5">
            <View className="flex-row gap-2">
              <ArticleAnchor href="/articles" label="All articles">
                <Text
                  className={`px-3 py-2 rounded-full border text-sm ${!topicSlug ? 'bg-black text-white border-black' : 'bg-white text-black border-neutral-200'}`}
                  style={{ fontFamily: font.medium }}
                >
                  All
                </Text>
              </ArticleAnchor>
              {BLOG_TOPICS.map((item) => {
                const selected = item.slug === topicSlug;
                return (
                  <ArticleAnchor key={item.slug} href={topicHref(item.slug)} label={item.label}>
                    <Text
                      className={`px-3 py-2 rounded-full border text-sm ${selected ? 'bg-black text-white border-black' : 'bg-white text-black border-neutral-200'}`}
                      style={{ fontFamily: font.medium }}
                    >
                      {item.label}
                    </Text>
                  </ArticleAnchor>
                );
              })}
            </View>
          </ScrollView>

          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search articles"
            placeholderTextColor="#737373"
            className="border border-neutral-200 rounded-xl px-4 py-3 text-black mb-3"
            style={{ fontFamily: font.regular, fontSize: 16 }}
            accessibilityLabel="Search articles"
          />
          <Text className="text-sm text-neutral-500 mb-6" style={{ fontFamily: font.regular }}>
            {searching
              ? `${filtered.length} result${filtered.length === 1 ? '' : 's'} for “${searchQuery.trim()}”`
              : `${filtered.length} article${filtered.length === 1 ? '' : 's'}`}
          </Text>

          {pageItems.length === 0 ? (
            <Text className="text-black" style={{ fontFamily: font.medium }}>
              No articles match that search.
            </Text>
          ) : (
            <View style={wide && featured && latest.length > 0 ? { flexDirection: 'row', gap: 40, alignItems: 'flex-start' } : undefined}>
              {featured ? (
                <ArticleAnchor
                  href={featured.href}
                  label={featured.title}
                  className="mb-8"
                  style={wide && latest.length > 0 ? { flex: 1 } : undefined}
                >
                  <View className="bg-neutral-100 overflow-hidden rounded-2xl mb-4" style={{ aspectRatio: 16 / 10 }}>
                    <Cover card={featured} eager />
                  </View>
                  <Text className="text-xs uppercase text-[#16A34A] mb-2" style={{ fontFamily: font.semibold }}>
                    Featured
                  </Text>
                  <SeoHeading level={2} className="text-2xl md:text-4xl text-black mb-2" style={{ fontFamily: font.bold }}>
                    {featured.title}
                  </SeoHeading>
                  <Text className="text-neutral-600 mb-3" style={{ fontFamily: font.regular }}>
                    {featured.excerpt}
                  </Text>
                  <MetaLine card={featured} />
                </ArticleAnchor>
              ) : null}

              {latest.length > 0 ? (
                <View style={wide ? { width: 320 } : undefined}>
                  <SeoHeading level={2} className="text-xl text-black mb-3" style={{ fontFamily: font.bold }}>
                    Latest
                  </SeoHeading>
                  {latest.map((card) => (
                    <ArticleAnchor key={card.href} href={card.href} label={card.title} className="border-t border-neutral-200 py-3">
                      <Text className="text-xs text-[#16A34A] mb-1" style={{ fontFamily: font.medium }}>
                        {card.topicLabel}
                      </Text>
                      <Text className="text-base text-black" style={{ fontFamily: font.semibold }}>
                        {card.title}
                      </Text>
                      <Text className="text-xs text-neutral-500 mt-1" style={{ fontFamily: font.regular }}>
                        {formatArticleDate(card.publishedAt)} · {card.readingMinutes} min read
                      </Text>
                    </ArticleAnchor>
                  ))}
                </View>
              ) : null}
            </View>
          )}

          {grid.length > 0 ? (
            <View className="mt-10" style={wide ? { flexDirection: 'row', flexWrap: 'wrap', gap: 20 } : undefined}>
              {grid.map((card) => (
                <ArticleAnchor
                  key={card.href}
                  href={card.href}
                  label={card.title}
                  className="mb-6"
                  style={wide ? { width: '31%' } : undefined}
                >
                  <View className="bg-neutral-100 rounded-xl overflow-hidden mb-3" style={{ height: 160 }}>
                    <Cover card={card} />
                  </View>
                  <MetaLine card={card} />
                  <Text className="text-lg text-black mt-1" style={{ fontFamily: font.bold }}>
                    {card.title}
                  </Text>
                  <Text className="text-sm text-neutral-600 mt-1" style={{ fontFamily: font.regular }} numberOfLines={3}>
                    {card.excerpt}
                  </Text>
                </ArticleAnchor>
              ))}
            </View>
          ) : null}

          {!searching && totalPages > 1 ? (
            <View className="flex-row flex-wrap gap-3 mt-8">
              {Array.from({ length: totalPages }, (_, index) => {
                const number = index + 1;
                const current = number === paged.page;
                return (
                  <ArticleAnchor key={number} href={pageHref(number)} label={`Articles page ${number}`}>
                    <Text
                      className={`px-3 py-2 rounded-full border ${current ? 'bg-[#16A34A] text-white border-[#16A34A]' : 'text-black border-neutral-300'}`}
                      style={{ fontFamily: font.semibold }}
                    >
                      {number}
                    </Text>
                  </ArticleAnchor>
                );
              })}
            </View>
          ) : null}
        </View>
      </ScrollView>
    </View>
  );
}
