import { useEffect, useMemo } from 'react';
import { Linking, Platform, Text, TouchableOpacity, View } from 'react-native';
import { Clock3 } from 'lucide-react-native';
import ArticleHtmlBody from '@/components/articles/ArticleHtmlBody';
import BlogReadingChrome, { BlogReadingAids } from '@/components/blog/BlogReadingChrome';
import InternalLinksBlock from '@/components/seo/InternalLinksBlock';
import PropertyPurchaseLottieCover from '@/components/seo/PropertyPurchaseLottieCover';
import PropertyPurchaseSafetyCheck, {
  scrollToPropertyPurchaseCheck,
} from '@/components/seo/PropertyPurchaseSafetyCheck';
import {
  SeoContentBackButton,
  SeoContentColumn,
  seoContentTypography,
} from '@/components/seo/SeoContentLayout';
import { SeoHeading } from '@/components/seo/SeoHeading';
import { trackWebEvent } from '@/lib/analytics';
import { buildArticleReadingAids, injectHeadingIdsIntoHtml } from '@/lib/blog-reading-chrome';
import {
  getPropertyPurchaseLagosSchema,
  propertyPurchaseLagosDueDiligenceContent as content,
} from '@/lib/property-purchase-lagos-due-diligence-content';
import { PROPERTY_PURCHASE_ARTICLE_PATH, DIRECT_PROPERTY_PURCHASE_WHATSAPP_MESSAGE } from '@/lib/property-purchase-safety-check';
import { useWebSeo } from '@/lib/seo';
import { BUILDMYHOUSE_WHATSAPP_URL } from '@/lib/whatsapp-support';

export default function PropertyPurchaseLagosDueDiligencePage() {
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
    const marker = '<!--bmh-purchase-split-->';
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
    canonicalPath: PROPERTY_PURCHASE_ARTICLE_PATH,
    robots: 'index,follow',
    ogImage: content.coverImage.src,
    jsonLd: getPropertyPurchaseLagosSchema(),
  });

  useEffect(() => {
    if (Platform.OS !== 'web' || typeof document === 'undefined') return;
    const root = document.getElementById('property-purchase-article');
    if (!root) return;
    const onClick = (event: Event) => {
      const target = event.target as HTMLElement | null;
      const anchor = target?.closest?.('a');
      const href = anchor?.getAttribute('href') || '';
      if (!href.startsWith('/') || href.startsWith('//')) return;
      trackWebEvent('article_property_purchase_internal_link_clicked', { href });
    };
    root.addEventListener('click', onClick);
    return () => root.removeEventListener('click', onClick);
  }, []);

  const talkFirst = () => {
    trackWebEvent('article_property_purchase_direct_whatsapp_clicked', { placement: 'conclusion' });
    const url = `${BUILDMYHOUSE_WHATSAPP_URL}?text=${encodeURIComponent(DIRECT_PROPERTY_PURCHASE_WHATSAPP_MESSAGE)}`;
    void Linking.openURL(url);
  };

  return (
    <BlogReadingChrome>
      <View nativeID="property-purchase-article">
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
          </View>
          <BlogReadingAids takeaways={readingAids.takeaways} toc={readingAids.toc} />
        </SeoContentColumn>

        <SeoContentColumn className="mb-8">
          <PropertyPurchaseLottieCover className="mb-0" height={320} />
        </SeoContentColumn>

        <SeoContentColumn narrow className="mb-8">
          {beforeHtml ? <ArticleHtmlBody htmlFragment={beforeHtml} /> : null}
        </SeoContentColumn>

        <SeoContentColumn narrow className="mb-10">
          <PropertyPurchaseSafetyCheck />
        </SeoContentColumn>

        <SeoContentColumn narrow className="mb-8">
          {afterHtml ? <ArticleHtmlBody htmlFragment={afterHtml} /> : null}
        </SeoContentColumn>

        <SeoContentColumn narrow className="mb-8">
          <SeoHeading level={2} className="text-black text-2xl mb-3" style={{ fontFamily: 'Poppins_700Bold' }}>
            Already looking at a property?
          </SeoHeading>
          <Text className="text-gray-700 text-base leading-7 mb-4" style={{ fontFamily: 'Poppins_400Regular' }}>
            If you already have a house or unfinished building in mind, send BuildMyHouse the details before you commit. We’ll review your brief and prepare a proposal showing the verification and inspection steps we recommend for that specific property.
          </Text>
          <View className="flex-col md:flex-row gap-3">
            <TouchableOpacity
              onPress={() => scrollToPropertyPurchaseCheck()}
              className="rounded-full bg-black px-5 py-3"
            >
              <Text className="text-white text-sm text-center" style={{ fontFamily: 'Poppins_700Bold' }}>
                Start Property Purchase Safety Check
              </Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={talkFirst} className="rounded-full border border-gray-300 px-5 py-3">
              <Text className="text-gray-900 text-sm text-center" style={{ fontFamily: 'Poppins_600SemiBold' }}>
                Talk to BuildMyHouse on WhatsApp
              </Text>
            </TouchableOpacity>
          </View>
        </SeoContentColumn>

        <SeoContentColumn narrow className="mb-6">
          {faqHtml ? <ArticleHtmlBody htmlFragment={faqHtml} /> : null}
        </SeoContentColumn>

        <SeoContentColumn narrow className="mt-2 mb-10">
          <InternalLinksBlock
            title={content.internalLinks.title}
            links={[...content.internalLinks.links]}
            onPressLink={(href) => trackWebEvent('article_property_purchase_internal_link_clicked', { href, placement: 'related' })}
          />
        </SeoContentColumn>
      </View>
    </BlogReadingChrome>
  );
}
