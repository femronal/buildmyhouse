import { Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Clock3 } from 'lucide-react-native';
import ArticleHtmlBody from '@/components/articles/ArticleHtmlBody';
import BlogReadingChrome, { BlogReadingAids } from '@/components/blog/BlogReadingChrome';
import CollapsibleFaqSection from '@/components/seo/CollapsibleFaqSection';
import InternalLinksBlock from '@/components/seo/InternalLinksBlock';
import LandCheckerWaitlistForm, {
  scrollToLandCheckerWaitlist,
} from '@/components/seo/LandCheckerWaitlistForm';
import LandVerificationLottieCover from '@/components/seo/LandVerificationLottieCover';
import {
  SeoContentBackButton,
  SeoContentColumn,
  seoContentTypography,
} from '@/components/seo/SeoContentLayout';
import { SeoHeading } from '@/components/seo/SeoHeading';
import { trackWebEvent } from '@/lib/analytics';
import {
  getLandVerificationGuideArticleSchema,
  getLandVerificationGuideFaqSchema,
  landVerificationInNigeriaGuideContent as content,
} from '@/lib/land-verification-in-nigeria-guide-content';
import { useWebSeo } from '@/lib/seo';
import {
  buildArticleReadingAids,
  injectHeadingIdsIntoHtml,
} from '@/lib/blog-reading-chrome';
import { useMemo } from 'react';

function openInternal(href: string, router: ReturnType<typeof useRouter>) {
  router.push(href as any);
}

export default function LandVerificationNigeriaGuidePage() {
  const router = useRouter();
  const canonicalPath = content.seo.canonical.replace('https://buildmyhouse.app', '');
  const robots = content.seo.robots.replace(/\s+/g, '') as 'index,follow' | 'noindex,nofollow';

  const readingAids = useMemo(
    () =>
      buildArticleReadingAids({
        keyTakeaways: [...content.keyTakeaways],
        content: null,
        excerpt: content.hero.description,
        description: content.seo.description,
        faqs: [...content.faq.items],
        htmlFallback: content.htmlBody,
      }),
    [],
  );

  const html = useMemo(
    () => injectHeadingIdsIntoHtml(content.htmlBody, readingAids.toc),
    [readingAids.toc],
  );

  const updatedLabel = useMemo(() => {
    const date = new Date(content.updatedAt);
    return date.toLocaleDateString('en-NG', { year: 'numeric', month: 'long', day: 'numeric' });
  }, []);

  useWebSeo({
    title: content.seo.title,
    description: content.seo.description,
    canonicalPath,
    robots,
    ogImage: content.coverImage.src,
    jsonLd: [getLandVerificationGuideArticleSchema(), getLandVerificationGuideFaqSchema()],
  });

  return (
    <BlogReadingChrome>
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
        <LandVerificationLottieCover className="mb-2" />
      </SeoContentColumn>

      <SeoContentColumn narrow className="mb-8">
        <View className="flex-col md:flex-row gap-3 mb-6">
          <TouchableOpacity
            onPress={() => {
              trackWebEvent('land_verification_guide_primary_cta_click', {
                href: content.hero.primaryCta.href,
              });
              openInternal(content.hero.primaryCta.href, router);
            }}
            className="rounded-full bg-black px-5 py-3"
          >
            <Text className="text-white text-sm text-center" style={{ fontFamily: 'Poppins_700Bold' }}>
              {content.hero.primaryCta.label}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => {
              trackWebEvent('land_verification_guide_waitlist_cta_click', {
                placement: 'hero',
              });
              scrollToLandCheckerWaitlist();
            }}
            className="rounded-full border border-gray-300 px-5 py-3"
          >
            <Text className="text-gray-900 text-sm text-center" style={{ fontFamily: 'Poppins_600SemiBold' }}>
              {content.hero.secondaryCta.label}
            </Text>
          </TouchableOpacity>
        </View>

        {html ? <ArticleHtmlBody htmlFragment={html} /> : null}
      </SeoContentColumn>

      <SeoContentColumn narrow className="mb-7">
        <LandCheckerWaitlistForm
          title={content.waitlist.title}
          description={content.waitlist.description}
          secondaryCta={content.waitlist.secondaryCta}
        />
      </SeoContentColumn>

      <SeoContentColumn narrow className="mb-3">
        <CollapsibleFaqSection title={content.faq.title} items={[...content.faq.items]} />
      </SeoContentColumn>

      <SeoContentColumn narrow className="mt-2 mb-10">
        <InternalLinksBlock title={content.internalLinks.title} links={[...content.internalLinks.links]} />
      </SeoContentColumn>
    </BlogReadingChrome>
  );
}
