import { useEffect, useMemo } from 'react';
import { Linking, Platform, Text, TouchableOpacity, View } from 'react-native';
import { Clock3 } from 'lucide-react-native';
import ArticleHtmlBody from '@/components/articles/ArticleHtmlBody';
import BlogReadingChrome, { BlogReadingAids } from '@/components/blog/BlogReadingChrome';
import InternalLinksBlock from '@/components/seo/InternalLinksBlock';
import BrandedLottieCover from '@/components/seo/BrandedLottieCover';
import RedevelopmentReadinessCheck, { scrollToRedevelopmentCheck } from '@/components/seo/RedevelopmentReadinessCheck';
import { SeoContentBackButton, SeoContentColumn, seoContentTypography } from '@/components/seo/SeoContentLayout';
import { SeoHeading } from '@/components/seo/SeoHeading';
import { trackWebEvent } from '@/lib/analytics';
import { buildArticleReadingAids, injectHeadingIdsIntoHtml } from '@/lib/blog-reading-chrome';
import { getRedevelopmentReadinessSchema, redevelopmentReadinessContent as content } from '@/lib/redevelopment-readiness-content';
import { DIRECT_REDEVELOPMENT_WHATSAPP_MESSAGE, REDEVELOPMENT_ARTICLE_PATH } from '@/lib/redevelopment-readiness-check';
import { useWebSeo } from '@/lib/seo';
import { BUILDMYHOUSE_WHATSAPP_URL } from '@/lib/whatsapp-support';

export default function RedevelopmentReadinessPage() {
  const readingAids = useMemo(
    () =>
      buildArticleReadingAids({
        keyTakeaways: [...content.keyTakeaways],
        content: null,
        excerpt: content.excerpt,
        description: content.seo.description,
        faqs: [...content.faq.items],
        htmlFallback: `${content.htmlBeforeTool}${content.htmlAfterTool}${content.htmlFaq}`,
      }),
    [],
  );

  const [beforeHtml, afterHtml, faqHtml] = useMemo(() => {
    const marker = '<!--bmh-redevelopment-split-->';
    const combined = injectHeadingIdsIntoHtml(
      `${content.htmlBeforeTool}${marker}${content.htmlAfterTool}${marker}${content.htmlFaq}`,
      readingAids.toc,
    );
    const [before = '', after = '', faq = ''] = combined.split(marker);
    return [before, after, faq];
  }, [readingAids.toc]);

  const updatedLabel = useMemo(() => {
    const date = new Date(content.updatedAt);
    return date.toLocaleDateString('en-NG', { year: 'numeric', month: 'long', day: 'numeric' });
  }, []);

  useWebSeo({
    title: content.seo.title,
    description: content.seo.description,
    canonicalPath: REDEVELOPMENT_ARTICLE_PATH,
    robots: 'index,follow',
    ogImage: content.coverImage.src,
    jsonLd: getRedevelopmentReadinessSchema(),
  });

  useEffect(() => {
    if (Platform.OS !== 'web' || typeof document === 'undefined') return;
    const root = document.getElementById('redevelopment-readiness-article');
    if (!root) return;
    const onClick = (event: Event) => {
      const target = event.target as HTMLElement | null;
      const anchor = target?.closest?.('a');
      const href = anchor?.getAttribute('href') || '';
      if (!href.startsWith('/') || href.startsWith('//')) return;
      trackWebEvent('article_redevelopment_internal_link_clicked', { href });
    };
    root.addEventListener('click', onClick);
    return () => root.removeEventListener('click', onClick);
  }, []);

  const talkFirst = () => {
    trackWebEvent('redevelopment_check_direct_whatsapp_clicked', { placement: 'conclusion' });
    const url = `${BUILDMYHOUSE_WHATSAPP_URL}?text=${encodeURIComponent(DIRECT_REDEVELOPMENT_WHATSAPP_MESSAGE)}`;
    void Linking.openURL(url);
  };

  return (
    <BlogReadingChrome>
      <View nativeID="redevelopment-readiness-article">
        <SeoContentColumn className="pt-10 pb-2 md:pt-14 md:pb-4">
          <SeoContentBackButton fallbackHref="/articles" />
          <Text className={seoContentTypography.eyebrow} style={{ fontFamily: 'Poppins_600SemiBold' }}>
            {content.hero.eyebrow}
          </Text>
          <SeoHeading level={1} className={seoContentTypography.title} style={{ fontFamily: 'Poppins_700Bold' }}>
            {content.hero.title}
          </SeoHeading>
          <Text className={seoContentTypography.description} style={{ fontFamily: 'Poppins_400Regular' }}>
            {content.hero.description}
          </Text>
          <View className="flex-row flex-wrap items-center gap-x-4 gap-y-2 mb-4">
            <View className="flex-row items-center">
              <Clock3 size={14} color="#6b7280" />
              <Text className={`${seoContentTypography.meta} ml-1.5`} style={{ fontFamily: 'Poppins_400Regular' }}>
                {content.readingMinutes} min read
              </Text>
            </View>
            <Text className={seoContentTypography.meta} style={{ fontFamily: 'Poppins_400Regular' }}>
              Updated {updatedLabel}
            </Text>
            <Text className={seoContentTypography.meta} style={{ fontFamily: 'Poppins_400Regular' }}>
              BuildMyHouse Editorial
            </Text>
          </View>
          <BlogReadingAids takeaways={readingAids.takeaways} toc={readingAids.toc} />
        </SeoContentColumn>

        <SeoContentColumn className="mb-8">
          <BrandedLottieCover
            animationUrl="/lottie/construction-worker-building-wall.json"
            label="Construction worker building a wall"
            placeholder="house"
            className="mb-0"
            height={320}
          />
        </SeoContentColumn>

        <SeoContentColumn narrow className="mb-8">
          {beforeHtml ? <ArticleHtmlBody htmlFragment={beforeHtml} /> : null}
        </SeoContentColumn>

        <SeoContentColumn narrow className="mb-4">
          <SeoHeading level={2} className="text-black text-2xl mb-3" style={{ fontFamily: 'Poppins_700Bold' }}>
            Before you start calling developers, find out what kind of opportunity you actually have.
          </SeoHeading>
          <Text className="text-gray-700 text-base leading-7 mb-4" style={{ fontFamily: 'Poppins_400Regular' }}>
            Complete the Redevelopment Readiness Check. Tell BuildMyHouse what you own, what has already been built and what you want to achieve. We’ll use your answers to determine what information or professional assessment is needed before we can recommend the right next step.
          </Text>
        </SeoContentColumn>

        <SeoContentColumn narrow className="mb-10">
          <RedevelopmentReadinessCheck />
        </SeoContentColumn>

        <SeoContentColumn narrow className="mb-8">
          {afterHtml ? <ArticleHtmlBody htmlFragment={afterHtml} /> : null}
        </SeoContentColumn>

        <SeoContentColumn narrow className="mb-8">
          <SeoHeading level={2} className="text-black text-2xl mb-3" style={{ fontFamily: 'Poppins_700Bold' }}>
            Have land or an unfinished property?
          </SeoHeading>
          <Text className="text-gray-700 text-base leading-7 mb-4" style={{ fontFamily: 'Poppins_400Regular' }}>
            Tell us what you own, what has already been built, why work stopped and what outcome you want. Completing the check does not mean a developer or investor will take the project.
          </Text>
          <View className="flex-col md:flex-row gap-3">
            <TouchableOpacity accessibilityRole="button" onPress={() => scrollToRedevelopmentCheck()} className="rounded-full bg-black px-5 py-3">
              <Text className="text-white text-sm text-center" style={{ fontFamily: 'Poppins_700Bold' }}>
                Start the Redevelopment Readiness Check
              </Text>
            </TouchableOpacity>
            <TouchableOpacity accessibilityRole="button" onPress={talkFirst} className="rounded-full border border-gray-300 px-5 py-3">
              <Text className="text-gray-900 text-sm text-center" style={{ fontFamily: 'Poppins_600SemiBold' }}>
                I need someone to explain my options first
              </Text>
            </TouchableOpacity>
          </View>
          <Text className="text-gray-500 text-sm leading-6 mt-4" style={{ fontFamily: 'Poppins_400Regular' }}>
            Property and investment arrangements can create significant legal, financial, tax and regulatory consequences. BuildMyHouse coordinates property and project processes but does not replace independent legal, financial, surveying, valuation, tax or investment advice appropriate to a specific transaction.
          </Text>
        </SeoContentColumn>

        <SeoContentColumn narrow className="mb-6">
          {faqHtml ? <ArticleHtmlBody htmlFragment={faqHtml} /> : null}
        </SeoContentColumn>

        <SeoContentColumn narrow className="mt-2 mb-10">
          <InternalLinksBlock
            title={content.internalLinks.title}
            links={[...content.internalLinks.links]}
            onPressLink={(href) => trackWebEvent('article_redevelopment_internal_link_clicked', { href, placement: 'related' })}
          />
        </SeoContentColumn>
      </View>
    </BlogReadingChrome>
  );
}
