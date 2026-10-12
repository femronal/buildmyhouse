import { Image, Platform, Text, View } from 'react-native';
import { Link } from 'expo-router';
import { Clock3 } from 'lucide-react-native';
import { SeoHeading } from '@/components/seo/SeoHeading';
import {
  formatArticleDate,
  relatedBlogCards,
  topicHref,
  usePublishedBlogCards,
  type BlogCard,
} from '@/lib/articles-hub';

const LogoPng = require('@/assets/images/logo.png');
const LOCKUP_WIDTH = 168;
const LOCKUP_HEIGHT = Math.round(LOCKUP_WIDTH * (348 / 798));

export function BlogTopBar() {
  const logo = (
    <Image
      source={LogoPng}
      accessibilityLabel="BuildMyHouse"
      style={{ width: LOCKUP_WIDTH, height: LOCKUP_HEIGHT }}
      resizeMode="cover"
    />
  );
  return (
    <View className="bg-white border-b border-neutral-100">
      <View className="max-w-6xl w-full self-center px-5 md:px-8 py-3 flex-row items-center justify-between">
        {Platform.OS === 'web' ? (
          <Link href={'/' as never} accessibilityRole="link" accessibilityLabel="BuildMyHouse home">
            {logo}
          </Link>
        ) : (
          logo
        )}
        <Link href={'/articles' as never} accessibilityRole="link">
          <Text className="text-sm text-black" style={{ fontFamily: 'Poppins_600SemiBold' }}>
            Articles
          </Text>
        </Link>
      </View>
    </View>
  );
}

const font = {
  regular: 'Poppins_400Regular',
  medium: 'Poppins_500Medium',
  semibold: 'Poppins_600SemiBold',
  bold: 'Poppins_700Bold',
} as const;

export function ArticleBreadcrumb({ topicSlug, topicLabel }: { topicSlug: string; topicLabel: string }) {
  return (
    <View className="flex-row flex-wrap items-center gap-x-2 mb-3">
      <Link href={'/' as never} accessibilityRole="link">
        <Text className="text-sm text-neutral-500" style={{ fontFamily: font.regular }}>
          Home
        </Text>
      </Link>
      <Text className="text-sm text-neutral-400">/</Text>
      <Link href={'/articles' as never} accessibilityRole="link">
        <Text className="text-sm text-neutral-500" style={{ fontFamily: font.regular }}>
          Articles
        </Text>
      </Link>
      <Text className="text-sm text-neutral-400">/</Text>
      <Link href={topicHref(topicSlug) as never} accessibilityRole="link">
        <Text className="text-sm text-[#16A34A]" style={{ fontFamily: font.medium }}>
          {topicLabel}
        </Text>
      </Link>
    </View>
  );
}

export function ArticleByline({
  authorName,
  publishedAt,
  updatedAt,
  readingMinutes,
}: {
  authorName: string;
  publishedAt: string;
  updatedAt?: string;
  readingMinutes: number;
}) {
  const publishedLabel = formatArticleDate(publishedAt);
  const updatedLabel = formatArticleDate(updatedAt || publishedAt);
  return (
    <View className="flex-row flex-wrap items-center gap-x-4 gap-y-2 mb-4">
      <Text className="text-sm text-neutral-700" style={{ fontFamily: font.medium }}>
        {authorName || 'BuildMyHouse Editorial'}
      </Text>
      <Text className="text-sm text-neutral-500" style={{ fontFamily: font.regular }}>
        Published {publishedLabel}
      </Text>
      <Text className="text-sm text-neutral-500" style={{ fontFamily: font.regular }}>
        Updated {updatedLabel}
      </Text>
      <View className="flex-row items-center">
        <Clock3 size={14} color="#6b7280" />
        <Text className="text-sm text-neutral-500 ml-1.5" style={{ fontFamily: font.regular }}>
          {readingMinutes} min read
        </Text>
      </View>
    </View>
  );
}

export function RelatedArticles({ currentHref }: { currentHref: string }) {
  const cards = usePublishedBlogCards();
  const current = cards.find((card) => card.href === currentHref);
  const related = current
    ? relatedBlogCards(cards, current)
    : cards.filter((card) => card.href !== currentHref).slice(0, 3);
  if (related.length === 0) return null;
  return (
    <View>
      <SeoHeading level={2} className="text-2xl text-black mb-4" style={{ fontFamily: font.bold }}>
        Related articles
      </SeoHeading>
      {related.map((item) => (
        <RelatedRow key={item.href} item={item} />
      ))}
    </View>
  );
}

function RelatedRow({ item }: { item: BlogCard }) {
  return (
    <Link
      href={item.href as never}
      accessibilityRole="link"
      className="mb-4"
      style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}
    >
      <Text className="text-xs text-[#16A34A]" style={{ fontFamily: font.medium }}>
        {item.topicLabel}
      </Text>
      <Text className="text-lg text-black" style={{ fontFamily: font.semibold }}>
        {item.title}
      </Text>
      <Text className="text-sm text-neutral-500" style={{ fontFamily: font.regular }}>
        {formatArticleDate(item.publishedAt)} · {item.readingMinutes} min read
      </Text>
    </Link>
  );
}
