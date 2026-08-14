import { useEffect, useMemo, useState } from 'react';
import {
  Platform,
  Text,
  TouchableOpacity,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import { Link } from 'expo-router';
import { Clock3 } from 'lucide-react-native';
import BlogReadingChrome, { BlogReadingAids } from '@/components/blog/BlogReadingChrome';
import InternalLinksBlock from '@/components/seo/InternalLinksBlock';
import { SeoHeading } from '@/components/seo/SeoHeading';
import {
  SeoContentBackButton,
  SeoContentColumn,
  seoContentTypography,
} from '@/components/seo/SeoContentLayout';
import {
  amalaJointTrackingStoryBlocks,
  amalaJointTrackingStoryCtas,
  amalaJointTrackingStoryFaqs,
  amalaJointTrackingStoryHero,
  amalaJointTrackingStoryInternalLinks,
  amalaJointTrackingStorySeo,
  parseAmalaUtmParams,
  withPreservedCampaignParams,
  type AmalaUtmParams,
  type StoryBlock,
} from '@/lib/amala-joint-tracking-story';
import {
  createAmalaStoryScrollTracker,
  trackAmalaStoryEventOnce,
} from '@/lib/amala-joint-tracking-story-analytics';
import { buildStoryReadingAids } from '@/lib/blog-reading-chrome';

function Paragraph({ children }: { children: string }) {
  return (
    <Text
      className="text-gray-800 text-[17px] leading-8 mb-5 md:text-lg md:leading-9"
      style={{ fontFamily: 'Poppins_400Regular' }}
    >
      {children}
    </Text>
  );
}

function PullQuote({ text }: { text: string }) {
  return (
    <View className="my-7 border-l-4 border-[#059669] pl-4 py-1">
      <Text
        className="text-gray-900 text-lg leading-8 md:text-xl md:leading-9"
        style={{ fontFamily: 'Poppins_600SemiBold' }}
      >
        {text}
      </Text>
    </View>
  );
}

function ClosingParagraph({
  before,
  linkText,
  href,
  onLinkPress,
}: {
  before: string;
  linkText: string;
  href: string;
  onLinkPress: () => void;
}) {
  return (
    <Text
      className="text-gray-800 text-[17px] leading-8 mb-5 md:text-lg md:leading-9"
      style={{ fontFamily: 'Poppins_400Regular' }}
    >
      {before}
      <Link href={href as any} asChild>
        <Text
          onPress={onLinkPress}
          className="text-[#059669] underline"
          style={{ fontFamily: 'Poppins_700Bold' }}
          accessibilityRole="link"
        >
          {linkText}
        </Text>
      </Link>
      .
    </Text>
  );
}

function AlwaysVisibleFaq() {
  return (
    <View className="mb-6 mt-10">
      <SeoHeading level={2} className="text-black text-xl mb-4" style={{ fontFamily: 'Poppins_700Bold' }}>
        Frequently asked questions
      </SeoHeading>
      {amalaJointTrackingStoryFaqs.map((item) => (
        <View key={item.question} className="bg-white border border-gray-200 rounded-2xl mb-3 p-4">
          <SeoHeading level={3} className="text-black text-sm mb-2" style={{ fontFamily: 'Poppins_600SemiBold' }}>
            {item.question}
          </SeoHeading>
          <Text className="text-gray-600 text-sm leading-6" style={{ fontFamily: 'Poppins_400Regular' }}>
            {item.answer}
          </Text>
        </View>
      ))}
    </View>
  );
}

function renderBlock(
  block: StoryBlock,
  index: number,
  onClosingLink: () => void,
) {
  switch (block.type) {
    case 'p':
      return <Paragraph key={`p-${index}`}>{block.text}</Paragraph>;
    case 'h2':
      return (
        <SeoHeading
          key={`h2-${index}`}
          id={block.id}
          level={2}
          className="text-black text-2xl md:text-3xl mb-4 mt-12 leading-tight"
          style={{ fontFamily: 'Poppins_700Bold' }}
        >
          {block.text}
        </SeoHeading>
      );
    case 'h3':
      return (
        <SeoHeading
          key={`h3-${index}`}
          level={3}
          className="text-black text-lg mb-3 mt-6"
          style={{ fontFamily: 'Poppins_600SemiBold' }}
        >
          {block.text}
        </SeoHeading>
      );
    case 'pull':
      return <PullQuote key={`pull-${index}`} text={block.text} />;
    case 'closing':
      return (
        <ClosingParagraph
          key={`close-${index}`}
          before={block.before}
          linkText={block.linkText}
          href={block.href}
          onLinkPress={onClosingLink}
        />
      );
    default:
      return null;
  }
}

function readUtmFromWindow(): AmalaUtmParams {
  if (Platform.OS !== 'web' || typeof window === 'undefined') return {};
  return parseAmalaUtmParams(window.location.search || '');
}

export default function AmalaJointTrackingStoryPage() {
  const [utm, setUtm] = useState<AmalaUtmParams>({});
  const scrollTracker = useMemo(() => createAmalaStoryScrollTracker(utm), [utm]);
  const readingAids = useMemo(() => buildStoryReadingAids(amalaJointTrackingStoryBlocks), []);

  useEffect(() => {
    const next = readUtmFromWindow();
    setUtm(next);
    trackAmalaStoryEventOnce('amala_joint_story_viewed', next);
  }, []);

  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return undefined;
    const handler = () => {
      const doc = document.documentElement;
      scrollTracker(window.scrollY || doc.scrollTop, doc.scrollHeight, window.innerHeight);
    };
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, [scrollTracker]);

  const primaryHref = withPreservedCampaignParams(amalaJointTrackingStoryCtas.primaryHref, utm);
  const homeHref = withPreservedCampaignParams('/', utm);

  const onScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
    scrollTracker(contentOffset.y, contentSize.height, layoutMeasurement.height);
  };

  const scrollToStory = () => {
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      document.getElementById('amala-story-start')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <BlogReadingChrome contentContainerStyle={{ paddingBottom: 72 }} onScroll={onScroll}>
      <SeoContentColumn className="pt-10 pb-2 md:pt-14 md:pb-4">
        <SeoContentBackButton fallbackHref="/blog" />

        <Text className={seoContentTypography.eyebrow} style={{ fontFamily: 'Poppins_600SemiBold' }}>
          {amalaJointTrackingStoryHero.organicLabel}
        </Text>

        <SeoHeading level={1} className={seoContentTypography.title} style={{ fontFamily: 'Poppins_700Bold' }}>
          {amalaJointTrackingStoryHero.h1}
        </SeoHeading>

        <Text
          className="text-gray-600 text-base leading-7 mb-5 md:text-lg md:leading-8"
          style={{ fontFamily: 'Poppins_400Regular' }}
        >
          {amalaJointTrackingStoryHero.introduction}
        </Text>

        <Text className="text-gray-800 text-base mb-1" style={{ fontFamily: 'Poppins_600SemiBold' }}>
          {amalaJointTrackingStoryHero.authorName}
        </Text>
        <Text className="text-gray-500 text-sm mb-4" style={{ fontFamily: 'Poppins_400Regular' }}>
          {amalaJointTrackingStoryHero.authorDescription}
        </Text>

        <View className="flex-row flex-wrap items-center gap-x-4 gap-y-2 mb-6">
          <View className="flex-row items-center">
            <Clock3 size={14} color="#6b7280" />
            <Text className={`${seoContentTypography.meta} ml-1.5`} style={{ fontFamily: 'Poppins_400Regular' }}>
              {amalaJointTrackingStorySeo.readingMinutes} min read
            </Text>
          </View>
          <Text className={seoContentTypography.meta} style={{ fontFamily: 'Poppins_400Regular' }}>
            Updated {amalaJointTrackingStorySeo.updatedAt}
          </Text>
        </View>

        <BlogReadingAids takeaways={readingAids.takeaways} toc={readingAids.toc} />

        <TouchableOpacity
          onPress={scrollToStory}
          className="self-start rounded-xl bg-black px-5 py-3.5 items-center mb-2"
          accessibilityRole="button"
          accessibilityLabel={amalaJointTrackingStoryHero.primaryCta}
        >
          <Text className="text-white text-sm" style={{ fontFamily: 'Poppins_600SemiBold' }}>
            {amalaJointTrackingStoryHero.primaryCta}
          </Text>
        </TouchableOpacity>
      </SeoContentColumn>

      <SeoContentColumn narrow>
        <View nativeID="amala-story-start" />
        <View className="pt-4">
          {amalaJointTrackingStoryBlocks.map((block, index) =>
            renderBlock(block, index, () =>
              trackAmalaStoryEventOnce('amala_joint_story_primary_cta_clicked', utm, {
                destination_type: 'homepage_closing_link',
              }),
            ),
          )}
        </View>

        <View className="mt-8 mb-2 border-t border-gray-100 pt-6">
          <Text className="text-gray-800 text-base leading-7 mb-1" style={{ fontFamily: 'Poppins_500Medium' }}>
            {amalaJointTrackingStoryHero.authorName}
          </Text>
          <Text className="text-gray-500 text-sm" style={{ fontFamily: 'Poppins_400Regular' }}>
            Founder, Amala Joint and BuildMyHouse
          </Text>
        </View>
      </SeoContentColumn>

      <SeoContentColumn narrow className="mt-10">
        <View className="rounded-3xl border border-gray-200 bg-black p-6 md:p-8 mb-8">
          <SeoHeading level={2} className="text-white text-2xl mb-3" style={{ fontFamily: 'Poppins_700Bold' }}>
            {amalaJointTrackingStoryCtas.ctaHeading}
          </SeoHeading>
          <Text className="text-gray-300 text-base leading-7 mb-5" style={{ fontFamily: 'Poppins_400Regular' }}>
            {amalaJointTrackingStoryCtas.ctaBody}
          </Text>
          <View className="flex-col gap-3">
            <Link href={primaryHref as any} asChild>
              <TouchableOpacity
                className="rounded-xl bg-white px-5 py-3.5 items-center"
                accessibilityRole="button"
                onPress={() =>
                  trackAmalaStoryEventOnce('amala_joint_story_primary_cta_clicked', utm, {
                    destination_type: 'project_intake',
                  })
                }
              >
                <Text className="text-black text-sm" style={{ fontFamily: 'Poppins_700Bold' }}>
                  {amalaJointTrackingStoryCtas.primaryLabel}
                </Text>
              </TouchableOpacity>
            </Link>
            <Link href={homeHref as any} asChild>
              <TouchableOpacity
                className="rounded-xl border border-white/25 px-5 py-3.5 items-center"
                accessibilityRole="button"
                onPress={() =>
                  trackAmalaStoryEventOnce('amala_joint_story_secondary_cta_clicked', utm, {
                    destination_type: 'homepage',
                  })
                }
              >
                <Text className="text-white text-sm" style={{ fontFamily: 'Poppins_600SemiBold' }}>
                  Visit BuildMyHouse
                </Text>
              </TouchableOpacity>
            </Link>
          </View>
        </View>

        <AlwaysVisibleFaq />

        <InternalLinksBlock title="Keep exploring" links={[...amalaJointTrackingStoryInternalLinks]} />
      </SeoContentColumn>
    </BlogReadingChrome>
  );
}
