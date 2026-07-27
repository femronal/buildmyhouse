import { useEffect, useMemo, useRef, useState } from 'react';
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
import TrackingPrincipleComparison from '@/components/blog/TrackingPrincipleComparison';
import MoweCaseStudyCard from '@/components/blog/MoweCaseStudyCard';
import InternalLinksBlock from '@/components/seo/InternalLinksBlock';
import { SeoHeading } from '@/components/seo/SeoHeading';
import {
  SeoContentBackButton,
  SeoContentColumn,
  SeoContentShell,
  seoContentTypography,
} from '@/components/seo/SeoContentLayout';
import {
  amalaJointTrackingStoryAmalaNote,
  amalaJointTrackingStoryBlocks,
  amalaJointTrackingStoryCtas,
  amalaJointTrackingStoryFaqs,
  amalaJointTrackingStoryFounder,
  amalaJointTrackingStoryHero,
  amalaJointTrackingStoryInternalLinks,
  amalaJointTrackingStorySeo,
  howBuildMyHouseWorksSteps,
  isAmalaJointVisitor,
  parseAmalaUtmParams,
  withPreservedCampaignParams,
  type AmalaUtmParams,
  type StoryBlock,
} from '@/lib/amala-joint-tracking-story';
import {
  createAmalaStoryScrollTracker,
  trackAmalaStoryEventOnce,
} from '@/lib/amala-joint-tracking-story-analytics';

function Paragraph({ children }: { children: string }) {
  return (
    <Text className={seoContentTypography.bodyParagraph} style={{ fontFamily: 'Poppins_400Regular' }}>
      {children}
    </Text>
  );
}

function PullQuote({ text }: { text: string }) {
  return (
    <View className="my-5 border-l-4 border-[#059669] pl-4 py-1">
      <Text className="text-gray-900 text-lg leading-8 md:text-xl" style={{ fontFamily: 'Poppins_500Medium' }}>
        {text}
      </Text>
    </View>
  );
}

function BulletList({ items }: { items: readonly string[] }) {
  return (
    <View className="mb-4 gap-2">
      {items.map((item) => (
        <View key={item} className="flex-row gap-2">
          <Text className="text-gray-700" style={{ fontFamily: 'Poppins_700Bold' }}>
            •
          </Text>
          <Text className="flex-1 text-gray-700 text-base leading-7" style={{ fontFamily: 'Poppins_400Regular' }}>
            {item}
          </Text>
        </View>
      ))}
    </View>
  );
}

function NumberedList({ items }: { items: readonly string[] }) {
  return (
    <View className="mb-4 gap-2">
      {items.map((item, index) => (
        <View key={item} className="flex-row gap-2">
          <Text className="text-gray-700 w-6" style={{ fontFamily: 'Poppins_700Bold' }}>
            {index + 1}.
          </Text>
          <Text className="flex-1 text-gray-700 text-base leading-7" style={{ fontFamily: 'Poppins_400Regular' }}>
            {item}
          </Text>
        </View>
      ))}
    </View>
  );
}

function CaseStudyBlock({ onView }: { onView: () => void }) {
  const viewed = useRef(false);
  return (
    <View
      onLayout={() => {
        if (viewed.current) return;
        viewed.current = true;
        onView();
      }}
    >
      <MoweCaseStudyCard />
    </View>
  );
}

function ProcessSection({ onView }: { onView: () => void }) {
  const viewed = useRef(false);
  return (
    <View
      className="my-4"
      onLayout={() => {
        if (viewed.current) return;
        viewed.current = true;
        onView();
      }}
    >
      <View className="gap-3">
        {howBuildMyHouseWorksSteps.map((step, index) => (
          <View key={step.title} className="rounded-2xl border border-gray-200 bg-[#fafaf8] p-4">
            <Text className="text-[#059669] text-xs mb-1" style={{ fontFamily: 'Poppins_700Bold' }}>
              Step {index + 1}
            </Text>
            <Text className="text-black text-base mb-1" style={{ fontFamily: 'Poppins_600SemiBold' }}>
              {step.title}
            </Text>
            <Text className="text-gray-600 text-sm leading-6" style={{ fontFamily: 'Poppins_400Regular' }}>
              {step.body}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

function AlwaysVisibleFaq() {
  return (
    <View className="mb-6">
      <SeoHeading level={2} className="text-black text-xl mb-3" style={{ fontFamily: 'Poppins_700Bold' }}>
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
  handlers: {
    onCaseStudyView: () => void;
    onProcessView: () => void;
  },
) {
  switch (block.type) {
    case 'p':
      return <Paragraph key={`p-${index}`}>{block.text}</Paragraph>;
    case 'h2':
      return (
        <SeoHeading
          key={`h2-${index}`}
          level={2}
          className={`${seoContentTypography.sectionHeading} mt-8`}
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
          className="text-black text-lg mb-2 mt-4"
          style={{ fontFamily: 'Poppins_600SemiBold' }}
        >
          {block.text}
        </SeoHeading>
      );
    case 'pull':
      return <PullQuote key={`pull-${index}`} text={block.text} />;
    case 'list':
      return <BulletList key={`list-${index}`} items={block.items} />;
    case 'numbered':
      return <NumberedList key={`num-${index}`} items={block.items} />;
    case 'comparison':
      return <TrackingPrincipleComparison key={`cmp-${index}`} />;
    case 'case-study':
      return <CaseStudyBlock key={`case-${index}`} onView={handlers.onCaseStudyView} />;
    case 'process':
      return <ProcessSection key={`proc-${index}`} onView={handlers.onProcessView} />;
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
  const fromAmala = isAmalaJointVisitor(utm);

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
  const secondaryHref = withPreservedCampaignParams(amalaJointTrackingStoryCtas.secondaryHref, utm);
  const servicesHref = withPreservedCampaignParams(amalaJointTrackingStoryCtas.servicesHref, utm);

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
    <SeoContentShell contentContainerStyle={{ paddingBottom: 64 }} onScroll={onScroll}>
      <SeoContentColumn className="pt-10 pb-2 md:pt-14 md:pb-4">
        <SeoContentBackButton fallbackHref="/blog" />

        <Text className={seoContentTypography.eyebrow} style={{ fontFamily: 'Poppins_600SemiBold' }}>
          {fromAmala ? amalaJointTrackingStoryHero.amalaLabel : amalaJointTrackingStoryHero.organicLabel}
        </Text>

        {fromAmala ? (
          <View className="mb-4 rounded-2xl border border-[#059669]/30 bg-[#ecfdf5] px-4 py-3">
            <Text className="text-[#065f46] text-sm leading-6" style={{ fontFamily: 'Poppins_500Medium' }}>
              {amalaJointTrackingStoryAmalaNote}
            </Text>
          </View>
        ) : null}

        <SeoHeading level={1} className={seoContentTypography.title} style={{ fontFamily: 'Poppins_700Bold' }}>
          {amalaJointTrackingStoryHero.h1}
        </SeoHeading>

        <Text className={seoContentTypography.description} style={{ fontFamily: 'Poppins_400Regular' }}>
          {amalaJointTrackingStoryHero.introduction}
        </Text>

        <Text className="text-gray-700 text-base mb-1" style={{ fontFamily: 'Poppins_600SemiBold' }}>
          {amalaJointTrackingStoryHero.authorName}
        </Text>
        <Text className="text-gray-500 text-sm mb-3" style={{ fontFamily: 'Poppins_400Regular' }}>
          {amalaJointTrackingStoryHero.authorDescription}
        </Text>
        <Text className="text-gray-600 text-sm mb-4" style={{ fontFamily: 'Poppins_400Regular' }}>
          {amalaJointTrackingStoryHero.supportingLine}
        </Text>

        <View className="flex-row flex-wrap items-center gap-x-4 gap-y-2 mb-5">
          <View className="flex-row items-center">
            <Clock3 size={14} color="#6b7280" />
            <Text className={`${seoContentTypography.meta} ml-1.5`} style={{ fontFamily: 'Poppins_400Regular' }}>
              {amalaJointTrackingStorySeo.readingMinutes} min read
            </Text>
          </View>
          <Text className={seoContentTypography.meta} style={{ fontFamily: 'Poppins_400Regular' }}>
            Published {amalaJointTrackingStorySeo.publishedAt}
          </Text>
        </View>

        <View className="flex-col gap-3 md:flex-row md:items-center mb-2">
          <TouchableOpacity
            onPress={scrollToStory}
            className="rounded-xl bg-[#059669] px-5 py-3.5 items-center"
            accessibilityRole="button"
            accessibilityLabel={amalaJointTrackingStoryHero.primaryCta}
          >
            <Text className="text-white text-sm" style={{ fontFamily: 'Poppins_600SemiBold' }}>
              {amalaJointTrackingStoryHero.primaryCta}
            </Text>
          </TouchableOpacity>
          <Link href={'/demo/project-monitoring' as any} asChild>
            <TouchableOpacity
              className="rounded-xl border border-gray-300 px-5 py-3.5 items-center"
              accessibilityRole="button"
              accessibilityLabel={amalaJointTrackingStoryHero.secondaryCta}
              onPress={() =>
                trackAmalaStoryEventOnce('amala_joint_story_secondary_cta_clicked', utm, {
                  destination_type: 'how_it_works_hero',
                })
              }
            >
              <Text className="text-gray-900 text-sm" style={{ fontFamily: 'Poppins_600SemiBold' }}>
                {amalaJointTrackingStoryHero.secondaryCta}
              </Text>
            </TouchableOpacity>
          </Link>
        </View>
      </SeoContentColumn>

      <SeoContentColumn narrow>
        <View nativeID="amala-story-start" />
        {amalaJointTrackingStoryBlocks.map((block, index) =>
          renderBlock(block, index, {
            onCaseStudyView: () => trackAmalaStoryEventOnce('amala_joint_story_case_study_viewed', utm),
            onProcessView: () => trackAmalaStoryEventOnce('amala_joint_story_process_viewed', utm),
          }),
        )}

        <View className="mt-4 mb-2 border-t border-gray-100 pt-6">
          <Text className="text-gray-800 text-base leading-7 mb-1" style={{ fontFamily: 'Poppins_500Medium' }}>
            — {amalaJointTrackingStoryHero.authorName}
          </Text>
          <Text className="text-gray-500 text-sm" style={{ fontFamily: 'Poppins_400Regular' }}>
            Founder, Amala Joint and BuildMyHouse
          </Text>
        </View>
      </SeoContentColumn>

      <SeoContentColumn narrow className="mt-8">
        <View className="rounded-3xl border border-gray-200 bg-[#0b1220] p-6 md:p-8 mb-8">
          <SeoHeading level={2} className="text-white text-2xl mb-3" style={{ fontFamily: 'Poppins_700Bold' }}>
            {amalaJointTrackingStoryCtas.ctaHeading}
          </SeoHeading>
          <Text className="text-gray-300 text-base leading-7 mb-5" style={{ fontFamily: 'Poppins_400Regular' }}>
            {amalaJointTrackingStoryCtas.ctaBody}
          </Text>
          <View className="flex-col gap-3">
            <Link href={primaryHref as any} asChild>
              <TouchableOpacity
                className="rounded-xl bg-[#22c55e] px-5 py-3.5 items-center"
                accessibilityRole="button"
                onPress={() =>
                  trackAmalaStoryEventOnce('amala_joint_story_primary_cta_clicked', utm, {
                    destination_type: 'project_intake',
                  })
                }
              >
                <Text className="text-[#052e16] text-sm" style={{ fontFamily: 'Poppins_700Bold' }}>
                  {amalaJointTrackingStoryCtas.primaryLabel}
                </Text>
              </TouchableOpacity>
            </Link>
            <Link href={secondaryHref as any} asChild>
              <TouchableOpacity
                className="rounded-xl border border-white/25 px-5 py-3.5 items-center"
                accessibilityRole="button"
                onPress={() =>
                  trackAmalaStoryEventOnce('amala_joint_story_secondary_cta_clicked', utm, {
                    destination_type: 'how_it_works',
                  })
                }
              >
                <Text className="text-white text-sm" style={{ fontFamily: 'Poppins_600SemiBold' }}>
                  {amalaJointTrackingStoryCtas.secondaryLabel}
                </Text>
              </TouchableOpacity>
            </Link>
            <Link href={servicesHref as any} asChild>
              <TouchableOpacity className="py-2 items-center" accessibilityRole="link">
                <Text className="text-[#86efac] text-sm underline" style={{ fontFamily: 'Poppins_500Medium' }}>
                  {amalaJointTrackingStoryCtas.servicesLabel}
                </Text>
              </TouchableOpacity>
            </Link>
          </View>
        </View>

        <AlwaysVisibleFaq />

        <View className="mb-8 rounded-3xl border border-gray-200 bg-white p-5">
          <SeoHeading level={2} className="text-black text-xl mb-2" style={{ fontFamily: 'Poppins_700Bold' }}>
            {amalaJointTrackingStoryFounder.heading}
          </SeoHeading>
          <Text className="text-gray-700 text-base leading-7" style={{ fontFamily: 'Poppins_400Regular' }}>
            {amalaJointTrackingStoryFounder.body}
          </Text>
        </View>

        <InternalLinksBlock title="Related BuildMyHouse resources" links={[...amalaJointTrackingStoryInternalLinks]} />
      </SeoContentColumn>
    </SeoContentShell>
  );
}
