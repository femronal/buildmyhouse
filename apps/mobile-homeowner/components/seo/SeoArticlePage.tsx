import { useMemo } from 'react';
import { Image, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, Clock3, Tag } from 'lucide-react-native';
import ArticleHtmlBody from '@/components/articles/ArticleHtmlBody';
import CollapsibleFaqSection from '@/components/seo/CollapsibleFaqSection';
import InternalLinksBlock from '@/components/seo/InternalLinksBlock';
import { SeoHeading } from '@/components/seo/SeoHeading';
import { normalizeStoredArticleContent } from '@/lib/article-content-normalize';
import { articleContentToHtml } from '@/lib/article-tiptap-html';
import { Article } from '@/lib/articles';

type SeoArticlePageProps = {
  article: Article;
};

export default function SeoArticlePage({ article }: SeoArticlePageProps) {
  const router = useRouter();

  const publishedLabel = useMemo(() => {
    const date = new Date(article.publishedAt);
    return date.toLocaleDateString('en-NG', { year: 'numeric', month: 'long', day: 'numeric' });
  }, [article.publishedAt]);

  const html = useMemo(() => {
    const doc = normalizeStoredArticleContent(article.content);
    return articleContentToHtml(doc);
  }, [article.content]);

  return (
    <View className="flex-1 bg-white">
      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 48 }}>
        <View className="px-5 pt-10 pb-2 md:px-6 md:pt-14 md:pb-4 max-w-[760px] w-full self-center">
          <TouchableOpacity
            onPress={() => (router.canGoBack() ? router.back() : router.push('/articles' as any))}
            className="w-9 h-9 bg-gray-100 rounded-full items-center justify-center mb-3 md:mb-5 md:w-10 md:h-10"
          >
            <ArrowLeft size={18} color="#000000" strokeWidth={2.5} />
          </TouchableOpacity>

          <Text
            className="text-[11px] md:text-xs uppercase tracking-wide text-gray-500 mb-2"
            style={{ fontFamily: 'Poppins_600SemiBold' }}
          >
            BuildMyHouse Articles
          </Text>

          <SeoHeading
            level={1}
            className="text-3xl leading-tight text-black mb-3 md:text-5xl md:leading-[1.08] md:mb-4"
            style={{ fontFamily: 'Poppins_700Bold' }}
          >
            {article.title}
          </SeoHeading>

          <Text
            className="text-gray-600 text-base leading-7 mb-3 md:text-xl md:leading-8 md:mb-4"
            style={{ fontFamily: 'Poppins_400Regular' }}
          >
            {article.description}
          </Text>

          <View className="flex-row flex-wrap items-center gap-x-4 gap-y-2">
            <View className="flex-row items-center">
              <Clock3 size={14} color="#6b7280" />
              <Text className="text-gray-500 text-sm ml-1.5" style={{ fontFamily: 'Poppins_400Regular' }}>
                {article.readingMinutes} min read
              </Text>
            </View>
            {article.tags.length > 0 ? (
              <View className="flex-row items-center">
                <Tag size={14} color="#6b7280" />
                <Text className="text-gray-500 text-sm ml-1.5" style={{ fontFamily: 'Poppins_400Regular' }}>
                  {article.tags.join(' | ')}
                </Text>
              </View>
            ) : null}
            <Text className="text-gray-500 text-sm" style={{ fontFamily: 'Poppins_400Regular' }}>
              Published {publishedLabel}
            </Text>
          </View>
        </View>

        <View className="px-5 mb-8 md:px-6 max-w-[760px] w-full self-center">
          <View className="rounded-3xl overflow-hidden bg-gray-100">
            <Image
              source={{ uri: article.coverImageUrl }}
              accessibilityLabel={article.coverImageAlt}
              className="w-full"
              style={{ height: 320 }}
              resizeMode="cover"
            />
          </View>
        </View>

        <View className="px-5 md:px-6 w-full max-w-[760px] self-center">
          {html ? <ArticleHtmlBody htmlFragment={html} /> : null}
        </View>

        {article.faqs.length > 0 ? (
          <View className="px-5 mb-3 mt-6 md:px-6 max-w-[680px] w-full self-center">
            <CollapsibleFaqSection items={article.faqs} />
          </View>
        ) : null}

        {article.internalLinks.length > 0 ? (
          <View className="px-5 md:px-6 max-w-[680px] w-full self-center mt-2">
            <InternalLinksBlock title="Related resources" links={article.internalLinks} />
          </View>
        ) : null}
      </ScrollView>
    </View>
  );
}
