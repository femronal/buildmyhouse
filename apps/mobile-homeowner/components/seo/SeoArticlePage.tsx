import { useMemo } from 'react';
import { Image, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, Clock3, Tag } from 'lucide-react-native';
import InternalLinksBlock from '@/components/seo/InternalLinksBlock';
import { SeoHeading } from '@/components/seo/SeoHeading';
import YouTubeEmbed from '@/components/seo/YouTubeEmbed';
import { Article } from '@/lib/articles';
import { trackWebEvent } from '@/lib/analytics';

type SeoArticlePageProps = {
  article: Article;
};

export default function SeoArticlePage({ article }: SeoArticlePageProps) {
  const router = useRouter();

  const publishedLabel = useMemo(() => {
    const date = new Date(article.publishedAt);
    return date.toLocaleDateString('en-NG', { year: 'numeric', month: 'long', day: 'numeric' });
  }, [article.publishedAt]);

  return (
    <View className="flex-1 bg-white">
      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 48 }}>
        <View className="px-5 pt-10 pb-2 md:px-6 md:pt-14 md:pb-4">
          <TouchableOpacity
            onPress={() => (router.canGoBack() ? router.back() : router.push('/articles'))}
            className="w-9 h-9 bg-gray-100 rounded-full items-center justify-center mb-2 md:mb-4 md:w-10 md:h-10"
          >
            <ArrowLeft size={18} color="#000000" strokeWidth={2.5} />
          </TouchableOpacity>

          <Text
            className="text-[10px] md:text-xs uppercase tracking-wide text-blue-700 mb-1 md:mb-2"
            style={{ fontFamily: 'Poppins_600SemiBold' }}
          >
            BuildMyHouse Articles
          </Text>
          <SeoHeading
            level={1}
            className="text-xl leading-snug text-black mb-1.5 md:text-3xl md:leading-tight md:mb-3"
            style={{ fontFamily: 'Poppins_700Bold' }}
          >
            {article.title}
          </SeoHeading>
          <Text
            className="text-gray-600 text-xs leading-5 mb-2 md:text-sm md:leading-6 md:mb-3"
            style={{ fontFamily: 'Poppins_400Regular' }}
          >
            {article.description}
          </Text>

          <View className="flex-row flex-wrap items-center">
            <View className="flex-row items-center mr-4 mb-2">
              <Clock3 size={14} color="#6b7280" />
              <Text className="text-gray-500 text-xs ml-1.5" style={{ fontFamily: 'Poppins_400Regular' }}>
                {article.readingMinutes} min read
              </Text>
            </View>
            <View className="flex-row items-center mr-4 mb-2">
              <Tag size={14} color="#6b7280" />
              <Text className="text-gray-500 text-xs ml-1.5" style={{ fontFamily: 'Poppins_400Regular' }}>
                {article.tags.join(' | ')}
              </Text>
            </View>
            <Text className="text-gray-500 text-xs mb-2" style={{ fontFamily: 'Poppins_400Regular' }}>
              Published {publishedLabel}
            </Text>
          </View>
        </View>

        <View className="px-5 mb-5 md:px-6">
          <View className="rounded-3xl overflow-hidden bg-gray-100">
            <Image
              source={{ uri: article.coverImageUrl }}
              accessibilityLabel={article.coverImageAlt}
              className="w-full"
              style={{ height: 220 }}
              resizeMode="cover"
            />
          </View>
        </View>

        <View className="px-5 md:px-6">
          {article.blocks.map((block, idx) => {
            const key = `${block.type}-${idx}`;

            if (block.type === 'heading') {
              return (
                <Text key={key} className="text-black text-xl mt-2 mb-3" style={{ fontFamily: 'Poppins_700Bold' }}>
                  {block.text}
                </Text>
              );
            }

            if (block.type === 'paragraph') {
              return (
                <Text
                  key={key}
                  className="text-gray-700 text-[15px] leading-7 mb-4"
                  style={{ fontFamily: 'Poppins_400Regular' }}
                >
                  {block.text}
                </Text>
              );
            }

            if (block.type === 'bullets') {
              return (
                <View key={key} className="mb-4">
                  {block.items.map((item) => (
                    <View key={item} className="flex-row items-start mb-2">
                      <Text className="text-blue-600 mr-2 mt-0.5" style={{ fontFamily: 'Poppins_700Bold' }}>
                        -
                      </Text>
                      <Text className="text-gray-700 text-[15px] leading-6 flex-1" style={{ fontFamily: 'Poppins_400Regular' }}>
                        {item}
                      </Text>
                    </View>
                  ))}
                </View>
              );
            }

            if (block.type === 'quote') {
              return (
                <View key={key} className="bg-gray-50 border border-gray-200 rounded-2xl p-4 mb-4">
                  <Text className="text-gray-800 text-[15px] leading-6 mb-2" style={{ fontFamily: 'Poppins_500Medium' }}>
                    "{block.text}"
                  </Text>
                  {block.author ? (
                    <Text className="text-gray-500 text-xs" style={{ fontFamily: 'Poppins_400Regular' }}>
                      - {block.author}
                    </Text>
                  ) : null}
                </View>
              );
            }

            if (block.type === 'image') {
              return (
                <View key={key} className="mb-5">
                  <View className="rounded-2xl overflow-hidden bg-gray-100">
                    <Image
                      source={{ uri: block.src }}
                      accessibilityLabel={block.alt}
                      className="w-full"
                      style={{ height: 220 }}
                      resizeMode="cover"
                    />
                  </View>
                  {block.caption ? (
                    <Text className="text-gray-500 text-xs mt-2" style={{ fontFamily: 'Poppins_400Regular' }}>
                      {block.caption}
                    </Text>
                  ) : null}
                </View>
              );
            }

            if (block.type === 'youtube') {
              return <YouTubeEmbed key={key} videoId={block.videoId} title={block.title} caption={block.caption} />;
            }

            if (block.type === 'cta') {
              return (
                <View key={key} className="bg-black rounded-2xl p-5 mb-5">
                  <TouchableOpacity
                    className="bg-blue-600 rounded-full py-3 px-4"
                    onPress={() => {
                      trackWebEvent('seo_article_cta_click', {
                        article_slug: article.slug,
                        article_title: article.title,
                        cta_label: block.label,
                        cta_href: block.href,
                      });
                      router.push(block.href as any);
                    }}
                  >
                    <Text className="text-white text-center text-sm" style={{ fontFamily: 'Poppins_700Bold' }}>
                      {block.label}
                    </Text>
                  </TouchableOpacity>
                  {block.note ? (
                    <Text className="text-white/80 text-xs mt-2 text-center" style={{ fontFamily: 'Poppins_400Regular' }}>
                      {block.note}
                    </Text>
                  ) : null}
                </View>
              );
            }

            return null;
          })}
        </View>

        {article.faqs.length > 0 ? (
          <View className="px-5 mb-3 md:px-6">
            <Text className="text-black text-xl mb-3" style={{ fontFamily: 'Poppins_700Bold' }}>
              Frequently asked questions
            </Text>
            {article.faqs.map((faq) => (
              <View key={faq.question} className="bg-white border border-gray-200 rounded-2xl p-4 mb-3">
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

        {article.internalLinks.length > 0 ? (
          <View className="px-5 md:px-6">
            <InternalLinksBlock title="Related resources" links={article.internalLinks} />
          </View>
        ) : null}
      </ScrollView>
    </View>
  );
}
