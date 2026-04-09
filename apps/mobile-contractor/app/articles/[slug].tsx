import { useEffect, useMemo, useState } from 'react';
import { Image, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, Clock3, Tag } from 'lucide-react-native';
import ArticleHtmlBody from '@/components/articles/ArticleHtmlBody';
import { normalizeStoredArticleContent } from '@/lib/article-content-normalize';
import { articleContentToHtml } from '@/lib/article-tiptap-html';
import { fetchPublishedArticleBySlug, type Article } from '@/lib/articles';
import { cardShadowStyle } from '@/lib/card-styles';

export default function GCArticleDetailPage() {
  const router = useRouter();
  const params = useLocalSearchParams<{ slug?: string | string[] }>();
  const slug = Array.isArray(params.slug) ? params.slug[0] : params.slug;
  const [article, setArticle] = useState<Article | null>(null);
  const [lookupComplete, setLookupComplete] = useState(false);

  useEffect(() => {
    let active = true;
    if (!slug) {
      setLookupComplete(true);
      return;
    }
    fetchPublishedArticleBySlug(slug)
      .then((item) => {
        if (!active) return;
        setArticle(item || null);
        setLookupComplete(true);
      })
      .catch(() => {
        if (!active) return;
        setLookupComplete(true);
      });
    return () => {
      active = false;
    };
  }, [slug]);

  const html = useMemo(() => {
    if (!article) return '';
    const doc = normalizeStoredArticleContent(article.content);
    return articleContentToHtml(doc);
  }, [article]);

  if (!article && !lookupComplete) {
    return (
      <View className="flex-1 bg-white items-center justify-center px-8">
        <Text className="text-gray-600 text-center" style={{ fontFamily: 'Poppins_400Regular' }}>
          Loading article...
        </Text>
      </View>
    );
  }

  if (!article) {
    return (
      <View className="flex-1 bg-white items-center justify-center px-8">
        <Text className="text-black text-xl mb-2" style={{ fontFamily: 'Poppins_700Bold' }}>
          Article not found
        </Text>
        <Text className="text-gray-600 text-center" style={{ fontFamily: 'Poppins_400Regular' }}>
          This article link may be outdated. Please return to the articles page.
        </Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-white">
      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 48 }}>
        <View className="px-5 pt-10 pb-2 md:px-6 md:pt-14 md:pb-4 max-w-[760px] w-full self-center">
          <TouchableOpacity
            onPress={() => router.replace('/articles' as any)}
            className="w-9 h-9 bg-gray-100 rounded-full items-center justify-center mb-3 md:mb-5 md:w-10 md:h-10"
          >
            <ArrowLeft size={18} color="#000000" strokeWidth={2.5} />
          </TouchableOpacity>

          <Text className="text-[11px] md:text-xs uppercase tracking-wide text-gray-500 mb-2" style={{ fontFamily: 'Poppins_600SemiBold' }}>
            GC Articles
          </Text>
          <Text className="text-3xl leading-tight text-black mb-3 md:text-5xl md:leading-[1.08] md:mb-4" style={{ fontFamily: 'Poppins_700Bold' }}>
            {article.title}
          </Text>
          <Text className="text-gray-600 text-base leading-7 mb-3 md:text-xl md:leading-8 md:mb-4" style={{ fontFamily: 'Poppins_400Regular' }}>
            {article.description}
          </Text>
          <View className="flex-row flex-wrap items-center gap-x-4 gap-y-2">
            <View className="flex-row items-center">
              <Clock3 size={14} color="#6b7280" />
              <Text className="text-gray-500 text-sm ml-1.5" style={{ fontFamily: 'Poppins_400Regular' }}>
                {article.readingMinutes} min read
              </Text>
            </View>
            <View className="flex-row items-center">
              <Tag size={14} color="#6b7280" />
              <Text className="text-gray-500 text-sm ml-1.5" style={{ fontFamily: 'Poppins_400Regular' }}>
                {article.tags.join(' | ')}
              </Text>
            </View>
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
            <Text className="text-black text-xl mb-3" style={{ fontFamily: 'Poppins_700Bold' }}>
              Frequently asked questions
            </Text>
            {article.faqs.map((faq) => (
              <View
                key={faq.question}
                style={cardShadowStyle}
                className="bg-white border border-gray-200 rounded-2xl p-4 mb-3"
              >
                <Text className="text-black text-sm mb-2" style={{ fontFamily: 'Poppins_600SemiBold' }}>
                  {faq.question}
                </Text>
                <Text className="text-gray-600 text-sm" style={{ fontFamily: 'Poppins_400Regular' }}>
                  {faq.answer}
                </Text>
              </View>
            ))}
          </View>
        ) : null}
      </ScrollView>
    </View>
  );
}
