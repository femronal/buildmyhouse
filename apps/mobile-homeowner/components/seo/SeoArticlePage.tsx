import { useMemo } from 'react';
import { Image, Platform, Text, View } from 'react-native';
import ArticleHtmlBody from '@/components/articles/ArticleHtmlBody';
import { ArticleBreadcrumb, ArticleByline, BlogTopBar, RelatedArticles } from '@/components/articles/ArticleChrome';
import BlogReadingChrome, { BlogReadingAids } from '@/components/blog/BlogReadingChrome';
import EgbedaWindowProcessTimeline from '@/components/blog/EgbedaWindowProcessTimeline';
import CollapsibleFaqSection from '@/components/seo/CollapsibleFaqSection';
import HouseRenovationLottieCover from '@/components/seo/HouseRenovationLottieCover';
import {
  SeoContentBackButton,
  SeoContentColumn,
  seoContentTypography,
} from '@/components/seo/SeoContentLayout';
import InternalLinksBlock from '@/components/seo/InternalLinksBlock';
import { SeoHeading } from '@/components/seo/SeoHeading';
import { EGBEDA_WINDOW_CASE_STUDY_SLUG } from '@/lib/aluminium-window-repair-egbeda-case-study';
import { isGenericConstructionCover } from '@/lib/generic-construction-cover';
import { normalizeStoredArticleContent } from '@/lib/article-content-normalize';
import { articleContentToHtml } from '@/lib/article-tiptap-html';
import { type Article } from '@/lib/articles';
import { articleToBlogCard } from '@/lib/articles-hub';
import {
  buildArticleReadingAids,
  injectHeadingIdsIntoHtml,
} from '@/lib/blog-reading-chrome';

type SeoArticlePageProps = {
  article: Article;
};

export default function SeoArticlePage({ article }: SeoArticlePageProps) {
  const card = useMemo(() => articleToBlogCard(article), [article]);
  const deck = article.subtitle || article.description;
  const showEgbedaTimeline = article.slug === EGBEDA_WINDOW_CASE_STUDY_SLUG;

  const readingAids = useMemo(
    () =>
      buildArticleReadingAids({
        keyTakeaways: article.keyTakeaways,
        content: article.content,
        excerpt: article.excerpt,
        description: article.description,
        faqs: article.faqs,
      }),
    [article],
  );

  const html = useMemo(() => {
    const doc = normalizeStoredArticleContent(article.content);
    const raw = articleContentToHtml(doc);
    return injectHeadingIdsIntoHtml(raw, readingAids.toc);
  }, [article.content, readingAids.toc]);

  return (
    <BlogReadingChrome>
      <BlogTopBar />
      <SeoContentColumn className="pt-10 pb-2 md:pt-14 md:pb-4">
        <SeoContentBackButton />

        <ArticleBreadcrumb topicSlug={card.topicSlug} topicLabel={card.topicLabel} />

        <SeoHeading
          level={1}
          className={seoContentTypography.title}
          style={{ fontFamily: 'Poppins_700Bold' }}
        >
          {article.title}
        </SeoHeading>

        <Text className={seoContentTypography.description} style={{ fontFamily: 'Poppins_400Regular' }}>
          {deck}
        </Text>

        <ArticleByline
          authorName={article.authorName}
          publishedAt={article.publishedAt}
          updatedAt={article.updatedAt}
          readingMinutes={article.readingMinutes}
        />

        <BlogReadingAids takeaways={readingAids.takeaways} toc={readingAids.toc} />
      </SeoContentColumn>

      <SeoContentColumn className="mb-8">
        {isGenericConstructionCover(article.coverImageUrl) ? (
          <HouseRenovationLottieCover className="mb-0" height={280} />
        ) : (
          <View className="rounded-3xl overflow-hidden bg-gray-100">
            {Platform.OS === 'web' ? (
              <img
                src={article.coverImageUrl}
                alt={article.coverImageAlt || article.title}
                width={1200}
                height={675}
                style={{ width: '100%', height: 320, objectFit: 'cover', display: 'block' }}
              />
            ) : (
              <Image
                source={{ uri: article.coverImageUrl }}
                accessibilityLabel={article.coverImageAlt}
                className="w-full"
                style={{ height: 320 }}
                resizeMode="cover"
              />
            )}
          </View>
        )}
      </SeoContentColumn>

      <SeoContentColumn narrow>
        {html ? <ArticleHtmlBody htmlFragment={html} /> : null}
        {showEgbedaTimeline ? <EgbedaWindowProcessTimeline /> : null}
      </SeoContentColumn>

      {article.faqs.length > 0 ? (
        <SeoContentColumn narrow className="mb-3 mt-6">
          <CollapsibleFaqSection items={article.faqs} />
        </SeoContentColumn>
      ) : null}

      <SeoContentColumn narrow className="mt-8">
        <RelatedArticles currentHref={card.href} />
      </SeoContentColumn>

      {article.internalLinks.length > 0 ? (
        <SeoContentColumn narrow className="mt-2">
          <InternalLinksBlock title="Related resources" links={article.internalLinks} />
        </SeoContentColumn>
      ) : null}
    </BlogReadingChrome>
  );
}
