import { useMemo, useState } from 'react';
import { Pressable, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Check, Clock3 } from 'lucide-react-native';
import ArticleHtmlBody from '@/components/articles/ArticleHtmlBody';
import BlogReadingChrome, { BlogReadingAids } from '@/components/blog/BlogReadingChrome';
import CollapsibleFaqSection from '@/components/seo/CollapsibleFaqSection';
import InternalLinksBlock from '@/components/seo/InternalLinksBlock';
import SeoCoverImage from '@/components/seo/SeoCoverImage';
import {
  SeoContentBackButton,
  SeoContentColumn,
  seoContentTypography,
} from '@/components/seo/SeoContentLayout';
import { SeoHeading } from '@/components/seo/SeoHeading';
import { trackWebEvent } from '@/lib/analytics';
import { buildArticleReadingAids, injectHeadingIdsIntoHtml } from '@/lib/blog-reading-chrome';
import {
  diasporaBuildNigeriaFromAbroadPageContent as content,
  getDiasporaBuildAbroadArticleSchema,
  getDiasporaBuildAbroadBreadcrumbSchema,
} from '@/lib/diaspora-build-nigeria-from-abroad-pillar';
import { PILLAR_COVER_SOURCES } from '@/lib/published-content-catalog';
import { useWebSeo } from '@/lib/seo';

function openInternal(href: string, router: ReturnType<typeof useRouter>) {
  router.push(href as any);
}

export default function DiasporaBuildNigeriaFromAbroadPage() {
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
    const date = new Date(`${content.updatedAt}T00:00:00`);
    return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  }, []);

  useWebSeo({
    title: content.seo.title,
    description: content.seo.description,
    canonicalPath,
    robots,
    jsonLd: [getDiasporaBuildAbroadArticleSchema(), getDiasporaBuildAbroadBreadcrumbSchema()],
  });

  return (
    <BlogReadingChrome>
      <SeoContentColumn className="pt-10 pb-2 md:pt-14 md:pb-4">
        <SeoContentBackButton fallbackHref="/" />
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
          <Text className={seoContentTypography.meta} style={{ fontFamily: 'Poppins_500Medium' }}>
            {content.hero.byline}
          </Text>
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

      <SeoContentColumn className="mb-6">
        <SeoCoverImage source={PILLAR_COVER_SOURCES.buildAbroad} alt="House construction planning for a project in Nigeria" />
      </SeoContentColumn>

      <SeoContentColumn narrow className="mb-4">
        <View className="flex-col md:flex-row gap-3 mb-6">
          <TouchableOpacity
            onPress={() => {
              trackWebEvent('diaspora_pillar_primary_cta_click', { href: content.hero.primaryCta.href });
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
              trackWebEvent('diaspora_pillar_secondary_cta_click', { href: content.hero.secondaryCta.href });
              openInternal(content.hero.secondaryCta.href, router);
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

      <SeoContentColumn narrow className="mb-8">
        <PreConstructionChecklist />
      </SeoContentColumn>

      <SeoContentColumn narrow className="mb-3">
        <CollapsibleFaqSection title={content.faq.title} items={[...content.faq.items]} />
      </SeoContentColumn>

      <SeoContentColumn narrow className="mt-2 mb-6">
        <InternalLinksBlock title={content.internalLinks.title} links={[...content.internalLinks.links]} />
      </SeoContentColumn>

      <SeoContentColumn narrow className="mb-12">
        <View className="bg-black rounded-3xl p-6">
          <SeoHeading level={2} className="text-white text-2xl mb-2" style={{ fontFamily: 'Poppins_700Bold' }}>
            {content.cta.title}
          </SeoHeading>
          <Text className="text-white/85 text-sm leading-7 mb-4" style={{ fontFamily: 'Poppins_400Regular' }}>
            {content.cta.description}
          </Text>
          <View className="flex-col md:flex-row gap-3">
            <TouchableOpacity
              onPress={() => {
                trackWebEvent('diaspora_pillar_primary_cta_click', { href: content.cta.primary.href, placement: 'footer' });
                openInternal(content.cta.primary.href, router);
              }}
              className="rounded-full bg-white px-5 py-3"
            >
              <Text className="text-black text-sm text-center" style={{ fontFamily: 'Poppins_700Bold' }}>
                {content.cta.primary.label}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => openInternal(content.cta.secondary.href, router)}
              className="rounded-full border border-white/40 px-5 py-3"
            >
              <Text className="text-white text-sm text-center" style={{ fontFamily: 'Poppins_600SemiBold' }}>
                {content.cta.secondary.label}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </SeoContentColumn>
    </BlogReadingChrome>
  );
}

function PreConstructionChecklist() {
  const items = content.checklist.items;
  const [checked, setChecked] = useState<Record<number, boolean>>({});
  const done = items.filter((_, index) => checked[index]).length;

  return (
    <View className="border border-gray-200 rounded-2xl p-5 bg-gray-50">
      <SeoHeading
        level={2}
        id="pre-construction-checklist"
        className="text-black text-2xl mb-2"
        style={{ fontFamily: 'Poppins_700Bold' }}
      >
        {content.checklist.title}
      </SeoHeading>
      <Text className="text-gray-600 text-sm leading-6 mb-3" style={{ fontFamily: 'Poppins_400Regular' }}>
        {content.checklist.intro}
      </Text>
      <Text className="text-black text-sm mb-4" style={{ fontFamily: 'Poppins_600SemiBold' }}>
        Your readiness: {done} of {items.length}
      </Text>
      {items.map((item, index) => {
        const on = !!checked[index];
        return (
          <Pressable
            key={item}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: on }}
            onPress={() => setChecked((current) => ({ ...current, [index]: !current[index] }))}
            className="flex-row items-start mb-3"
          >
            <View
              className={`w-5 h-5 rounded border mr-3 mt-0.5 items-center justify-center ${on ? 'bg-black border-black' : 'bg-white border-gray-400'}`}
            >
              {on ? <Check size={14} color="#fff" /> : null}
            </View>
            <Text className="text-gray-800 text-sm leading-6 flex-1" style={{ fontFamily: 'Poppins_400Regular' }}>
              {item}
            </Text>
          </Pressable>
        );
      })}
      <Text className="text-gray-600 text-sm leading-6 mt-1" style={{ fontFamily: 'Poppins_400Regular' }}>
        {content.checklist.closing}
      </Text>
    </View>
  );
}
