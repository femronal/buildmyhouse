import { useMemo } from 'react';
import { Image, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, Clock3, Tag } from 'lucide-react-native';
import ArticleHtmlBody from '@/components/articles/ArticleHtmlBody';
import InlineCTA from '@/components/articles/InlineCTA';
import TestimonialBlock from '@/components/articles/TestimonialBlock';
import TrustStrip from '@/components/articles/TrustStrip';
import InternalLinksBlock from '@/components/seo/InternalLinksBlock';
import { SeoHeading } from '@/components/seo/SeoHeading';
import {
  normalizeStoredArticleContent,
  splitTipTapDocIntoThirds,
  type TipTapDoc,
} from '@/lib/article-content-normalize';
import { articleContentToHtml } from '@/lib/article-tiptap-html';
import { Article } from '@/lib/articles';
import { cardShadowStyle } from '@/lib/card-styles';

type SeoArticlePageProps = {
  article: Article;
};

const INLINE_CTAS = [
  {
    title: 'Start your building project remotely',
    description:
      'Share your location and goals, then work with verified contractors while you track milestones from anywhere in the world.',
    buttonText: 'Start your project',
    href: '/location?mode=explore',
  },
  {
    title: 'Get a verified contractor in Nigeria',
    description:
      'Reduce execution risk with vetted general contractors and clearer accountability than informal referrals.',
    buttonText: 'Explore contractors',
    href: '/location?mode=explore',
  },
  {
    title: 'See real construction costs',
    description:
      'Move from guesswork to a structured plan—so your family can budget phases and protect each transfer.',
    buttonText: 'Get started',
    href: '/location?mode=explore',
  },
];

export default function SeoArticlePage({ article }: SeoArticlePageProps) {
  const router = useRouter();

  const publishedLabel = useMemo(() => {
    const date = new Date(article.publishedAt);
    return date.toLocaleDateString('en-NG', { year: 'numeric', month: 'long', day: 'numeric' });
  }, [article.publishedAt]);

  const { html1, html2, html3 } = useMemo(() => {
    const doc = normalizeStoredArticleContent(article.content) as TipTapDoc;
    const [a, b, c] = splitTipTapDocIntoThirds(doc);
    return {
      html1: articleContentToHtml(a),
      html2: articleContentToHtml(b),
      html3: articleContentToHtml(c),
    };
  }, [article.content]);

  return (
    <View className="flex-1 bg-white">
      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 48 }}>
        <View className="px-5 pt-10 pb-2 md:px-6 md:pt-14 md:pb-4 max-w-[680px] w-full self-center">
          <TouchableOpacity
            onPress={() => (router.canGoBack() ? router.back() : router.push('/articles' as any))}
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

        <View className="px-5 mb-5 md:px-6 max-w-[720px] w-full self-center">
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

        <View className="px-5 md:px-6 w-full max-w-[720px] self-center">
          <TrustStrip />

          {html1 ? (
            <>
              <ArticleHtmlBody htmlFragment={html1} />
              <InlineCTA {...INLINE_CTAS[0]} slug={article.slug} />
            </>
          ) : null}

          {html2 ? (
            <>
              <ArticleHtmlBody htmlFragment={html2} />
              <InlineCTA {...INLINE_CTAS[1]} slug={article.slug} />
            </>
          ) : null}

          {html3 ? (
            <>
              <ArticleHtmlBody htmlFragment={html3} />
              <InlineCTA {...INLINE_CTAS[2]} slug={article.slug} />
            </>
          ) : null}

          <TestimonialBlock />
        </View>

        {article.faqs.length > 0 ? (
          <View className="px-5 mb-3 md:px-6 max-w-[680px] w-full self-center">
            <Text className="text-black text-xl mb-3" style={{ fontFamily: 'Poppins_700Bold' }}>
              Frequently asked questions
            </Text>
            {article.faqs.map((faq) => (
              <View key={faq.question} style={cardShadowStyle} className="bg-white border border-gray-200 rounded-2xl p-4 mb-3">
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
          <View className="px-5 md:px-6 max-w-[680px] w-full self-center">
            <InternalLinksBlock title="Related resources" links={article.internalLinks} />
          </View>
        ) : null}
      </ScrollView>
    </View>
  );
}
