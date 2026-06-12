import { useMemo } from 'react';
import { Image, Text, View } from 'react-native';
import { Clock3, Tag } from 'lucide-react-native';
import ArticleHtmlBody from '@/components/articles/ArticleHtmlBody';
import CollapsibleFaqSection from '@/components/seo/CollapsibleFaqSection';
import {
  SeoContentBackButton,
  SeoContentColumn,
  SeoContentShell,
  seoContentTypography,
} from '@/components/seo/SeoContentLayout';
import InternalLinksBlock from '@/components/seo/InternalLinksBlock';
import { SeoHeading } from '@/components/seo/SeoHeading';
import { normalizeStoredArticleContent } from '@/lib/article-content-normalize';
import { articleContentToHtml } from '@/lib/article-tiptap-html';
import { Article } from '@/lib/articles';

type SeoArticlePageProps = {
  article: Article;
};

export default function SeoArticlePage({ article }: SeoArticlePageProps) {
  const publishedLabel = useMemo(() => {
    const date = new Date(article.publishedAt);
    return date.toLocaleDateString('en-NG', { year: 'numeric', month: 'long', day: 'numeric' });
  }, [article.publishedAt]);

  const html = useMemo(() => {
    const doc = normalizeStoredArticleContent(article.content);
    return articleContentToHtml(doc);
  }, [article.content]);

  return (
    <SeoContentShell>
      <SeoContentColumn className="pt-10 pb-2 md:pt-14 md:pb-4">
        <SeoContentBackButton />

        <Text className={seoContentTypography.eyebrow} style={{ fontFamily: 'Poppins_600SemiBold' }}>
          BuildMyHouse Articles
        </Text>

        <SeoHeading
          level={1}
          className={seoContentTypography.title}
          style={{ fontFamily: 'Poppins_700Bold' }}
        >
          {article.title}
        </SeoHeading>

        <Text className={seoContentTypography.description} style={{ fontFamily: 'Poppins_400Regular' }}>
          {article.description}
        </Text>

        <View className="flex-row flex-wrap items-center gap-x-4 gap-y-2">
          <View className="flex-row items-center">
            <Clock3 size={14} color="#6b7280" />
            <Text className={`${seoContentTypography.meta} ml-1.5`} style={{ fontFamily: 'Poppins_400Regular' }}>
              {article.readingMinutes} min read
            </Text>
          </View>
          {article.tags.length > 0 ? (
            <View className="flex-row items-start flex-1 min-w-[220px]">
              <Tag size={14} color="#6b7280" />
              <View className="ml-1.5 flex-row flex-wrap gap-1.5 flex-1">
                {article.tags.map((tag) => (
                  <View key={tag} className="px-2 py-1 rounded-full bg-gray-100 border border-gray-200">
                    <Text className="text-gray-600 text-xs" style={{ fontFamily: 'Poppins_500Medium' }}>
                      {tag}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          ) : null}
          <Text className={seoContentTypography.meta} style={{ fontFamily: 'Poppins_400Regular' }}>
            Published {publishedLabel}
          </Text>
        </View>
      </SeoContentColumn>

      <SeoContentColumn className="mb-8">
        <View className="rounded-3xl overflow-hidden bg-gray-100">
          <Image
            source={{ uri: article.coverImageUrl }}
            accessibilityLabel={article.coverImageAlt}
            className="w-full"
            style={{ height: 320 }}
            resizeMode="cover"
          />
        </View>
      </SeoContentColumn>

      <SeoContentColumn narrow>
        {html ? <ArticleHtmlBody htmlFragment={html} /> : null}
      </SeoContentColumn>

      {article.faqs.length > 0 ? (
        <SeoContentColumn narrow className="mb-3 mt-6">
          <CollapsibleFaqSection items={article.faqs} />
        </SeoContentColumn>
      ) : null}

      {article.internalLinks.length > 0 ? (
        <SeoContentColumn narrow className="mt-2">
          <InternalLinksBlock title="Related resources" links={article.internalLinks} />
        </SeoContentColumn>
      ) : null}
    </SeoContentShell>
  );
}
