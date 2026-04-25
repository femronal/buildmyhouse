import { Linking, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import { SeoHeading } from '@/components/seo/SeoHeading';
import InternalLinksBlock from '@/components/seo/InternalLinksBlock';
import CollapsibleFaqSection from '@/components/seo/CollapsibleFaqSection';
import SeoCoverImage from '@/components/seo/SeoCoverImage';
import TrustBlocks from '@/components/seo/TrustBlocks';
import { cardShadowStyle } from '@/lib/card-styles';
import { useWebSeo } from '@/lib/seo';
import { trackWebEvent } from '@/lib/analytics';
import { finishAbandonedHouseNigeriaFromAbroadPageContent as content } from '@/lib/finish-abandoned-house-nigeria-from-abroad-content';

function resolveInternalHref(href: string) {
  if (href.startsWith('/projects/new')) {
    return '/location?mode=explore';
  }
  return href;
}

function openLink(href: string, router: ReturnType<typeof useRouter>) {
  if (href.startsWith('http://') || href.startsWith('https://')) {
    Linking.openURL(href);
    return;
  }
  router.push(resolveInternalHref(href) as any);
}

function cleanReferenceText(text: string) {
  return text.replace(/\s*:contentReference\[[^\]]+\]\{[^}]+\}/g, '');
}

function cleanFaqSchema(schema: typeof content.faqSchema) {
  return {
    ...schema,
    mainEntity: schema.mainEntity.map((item) => ({
      ...item,
      acceptedAnswer: {
        ...item.acceptedAnswer,
        text: cleanReferenceText(item.acceptedAnswer.text),
      },
    })),
  };
}

function BodyText({ children }: { children: string }) {
  return (
    <Text className="text-gray-700 text-sm leading-7 mb-3" style={{ fontFamily: 'Poppins_400Regular' }}>
      {cleanReferenceText(children)}
    </Text>
  );
}

function ParagraphSection({
  title,
  paragraphs,
}: {
  title: string;
  paragraphs: readonly string[];
}) {
  return (
    <View className="mb-7">
      <SeoHeading level={2} className="text-black text-2xl mb-3" style={{ fontFamily: 'Poppins_700Bold' }}>
        {title}
      </SeoHeading>
      {paragraphs.map((paragraph) => (
        <BodyText key={paragraph}>{paragraph}</BodyText>
      ))}
    </View>
  );
}

function BulletListCard({
  title,
  items,
  tone = 'light',
}: {
  title: string;
  items: readonly string[];
  tone?: 'light' | 'dark';
}) {
  const isDark = tone === 'dark';

  return (
    <View
      style={cardShadowStyle}
      className={`${isDark ? 'bg-black' : 'bg-white border border-gray-200'} rounded-2xl p-5 mb-7`}
    >
      <SeoHeading
        level={2}
        className={`${isDark ? 'text-white' : 'text-black'} text-xl mb-3`}
        style={{ fontFamily: 'Poppins_700Bold' }}
      >
        {title}
      </SeoHeading>
      {items.map((item) => (
        <View key={item} className="flex-row items-start mb-2">
          <Text
            className={`${isDark ? 'text-white/90' : 'text-gray-700'} mr-2`}
            style={{ fontFamily: 'Poppins_400Regular' }}
          >
            •
          </Text>
          <Text
            className={`${isDark ? 'text-white/90' : 'text-gray-700'} text-sm leading-6 flex-1`}
            style={{ fontFamily: 'Poppins_400Regular' }}
          >
            {item}
          </Text>
        </View>
      ))}
    </View>
  );
}

function InlineAction({
  label,
  href,
}: {
  label: string;
  href: string;
}) {
  const router = useRouter();

  return (
    <TouchableOpacity onPress={() => openLink(href, router)} className="self-start rounded-full bg-black px-5 py-3 mt-1">
      <Text className="text-white text-sm text-center" style={{ fontFamily: 'Poppins_700Bold' }}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

function LeadMagnetCard() {
  const router = useRouter();

  return (
    <View style={cardShadowStyle} className="bg-black rounded-3xl p-6 mb-7">
      <SeoHeading level={2} className="text-white text-2xl mb-2" style={{ fontFamily: 'Poppins_700Bold' }}>
        {content.leadMagnet.title}
      </SeoHeading>
      <Text className="text-white/85 text-sm leading-7 mb-4" style={{ fontFamily: 'Poppins_400Regular' }}>
        {content.leadMagnet.description}
      </Text>
      <View className="flex-col md:flex-row gap-3">
        <TouchableOpacity
          onPress={() => openLink(content.leadMagnet.primaryCta.href, router)}
          className="rounded-full bg-white px-5 py-3"
        >
          <Text className="text-black text-sm text-center" style={{ fontFamily: 'Poppins_700Bold' }}>
            {content.leadMagnet.primaryCta.label}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => openLink(content.leadMagnet.secondaryCta.href, router)}
          className="rounded-full border border-white/40 px-5 py-3"
        >
          <Text className="text-white text-sm text-center" style={{ fontFamily: 'Poppins_600SemiBold' }}>
            {content.leadMagnet.secondaryCta.label}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function FinishAbandonedHouseNigeriaFromAbroadPage() {
  const router = useRouter();
  const canonicalPath = content.seo.canonical.replace('https://buildmyhouse.app', '');
  const robots = content.seo.robots.replace(/\s+/g, '') as 'index,follow' | 'noindex,nofollow';
  const faqItems = content.faq.items.map((item) => ({
    ...item,
    answer: cleanReferenceText(item.answer),
  }));

  useWebSeo({
    title: content.seo.title,
    description: content.seo.description,
    canonicalPath,
    robots,
    ogImage: content.coverImage.src,
    jsonLd: cleanFaqSchema(content.faqSchema),
  });

  return (
    <View className="flex-1 bg-white">
      <ScrollView className="flex-1 px-5 md:px-6" contentContainerStyle={{ paddingBottom: 40 }}>
        <View className="pt-10 pb-4 md:pt-14">
          <TouchableOpacity
            onPress={() => (router.canGoBack() ? router.back() : router.push('/login'))}
            className="w-10 h-10 rounded-full bg-gray-100 items-center justify-center mb-4"
          >
            <ArrowLeft size={18} color="#111827" strokeWidth={2.2} />
          </TouchableOpacity>

          <Text className="text-[11px] uppercase tracking-wide text-gray-500 mb-2" style={{ fontFamily: 'Poppins_600SemiBold' }}>
            {content.hero.eyebrow}
          </Text>
          <SeoHeading level={1} className="text-black text-3xl leading-tight mb-3 md:text-4xl" style={{ fontFamily: 'Poppins_700Bold' }}>
            {content.hero.title}
          </SeoHeading>
          <Text className="text-gray-700 text-base leading-7 mb-5 md:text-lg" style={{ fontFamily: 'Poppins_400Regular' }}>
            {content.hero.description}
          </Text>
          <SeoCoverImage
            source={{ uri: content.coverImage.src }}
            alt={content.coverImage.alt}
            aspectRatio={16 / 9}
            className="mb-5"
          />
          <View className="flex-col md:flex-row gap-3">
            <TouchableOpacity onPress={() => openLink(content.hero.primaryCta.href, router)} className="rounded-full bg-black px-5 py-3">
              <Text className="text-white text-sm text-center" style={{ fontFamily: 'Poppins_700Bold' }}>
                {content.hero.primaryCta.label}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => openLink(content.hero.secondaryCta.href, router)} className="rounded-full border border-gray-300 px-5 py-3">
              <Text className="text-gray-900 text-sm text-center" style={{ fontFamily: 'Poppins_600SemiBold' }}>
                {content.hero.secondaryCta.label}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={cardShadowStyle} className="bg-gray-50 border border-gray-200 rounded-2xl p-5 mb-7">
          <SeoHeading level={2} className="text-black text-xl mb-3" style={{ fontFamily: 'Poppins_700Bold' }}>
            {content.hook.title}
          </SeoHeading>
          {content.hook.paragraphs.map((paragraph) => (
            <BodyText key={paragraph}>{paragraph}</BodyText>
          ))}
        </View>

        <BulletListCard title={content.quickAnswer.title} items={content.quickAnswer.items} tone="dark" />

        <View className="mb-7">
          {content.intro.paragraphs.map((paragraph) => (
            <BodyText key={paragraph}>{paragraph}</BodyText>
          ))}
        </View>

        <ParagraphSection title={content.story.title} paragraphs={content.story.paragraphs} />
        <ParagraphSection title={content.whyThisGoesWrong.title} paragraphs={content.whyThisGoesWrong.paragraphs} />
        <ParagraphSection title={content.firstStep.title} paragraphs={content.firstStep.paragraphs} />

        <BulletListCard title={content.whatToAssess.title} items={content.whatToAssess.items} />

        <View className="mb-7">
          <SeoHeading level={2} className="text-black text-2xl mb-3" style={{ fontFamily: 'Poppins_700Bold' }}>
            {content.salvageVsRestart.title}
          </SeoHeading>
          {content.salvageVsRestart.paragraphs.map((paragraph) => (
            <BodyText key={paragraph}>{paragraph}</BodyText>
          ))}
          {content.salvageVsRestart.buckets.map((bucket) => (
            <View key={bucket.title} style={cardShadowStyle} className="bg-white border border-gray-200 rounded-2xl p-4 mb-3">
              <SeoHeading level={3} className="text-black text-base mb-2" style={{ fontFamily: 'Poppins_700Bold' }}>
                {bucket.title}
              </SeoHeading>
              <Text className="text-gray-700 text-sm leading-7" style={{ fontFamily: 'Poppins_400Regular' }}>
                {bucket.description}
              </Text>
            </View>
          ))}
        </View>

        <ParagraphSection title={content.resetScope.title} paragraphs={content.resetScope.paragraphs} />

        <View className="mb-7">
          <ParagraphSection title={content.resetBudget.title} paragraphs={content.resetBudget.paragraphs} />
          <InlineAction label={content.resetBudget.primaryLink.label} href={content.resetBudget.primaryLink.href} />
        </View>

        <View className="mb-7">
          <ParagraphSection title={content.stagesAndPayments.title} paragraphs={content.stagesAndPayments.paragraphs} />
          <InlineAction label={content.stagesAndPayments.secondaryLink.label} href={content.stagesAndPayments.secondaryLink.href} />
        </View>

        <ParagraphSection title={content.familyPressure.title} paragraphs={content.familyPressure.paragraphs} />

        <View className="mb-7">
          <ParagraphSection title={content.contractorAngle.title} paragraphs={content.contractorAngle.paragraphs} />
          <InlineAction label={content.contractorAngle.primaryLink.label} href={content.contractorAngle.primaryLink.href} />
        </View>

        <View style={cardShadowStyle} className="bg-gray-100 border border-gray-300 rounded-2xl p-5 mb-7">
          <SeoHeading level={2} className="text-black text-xl mb-3" style={{ fontFamily: 'Poppins_700Bold' }}>
            {content.buildMyHouseAngle.cardTitle}
          </SeoHeading>
          {content.buildMyHouseAngle.cardItems.map((item) => (
            <Text key={item} className="text-gray-700 text-sm leading-6 mb-2" style={{ fontFamily: 'Poppins_400Regular' }}>
              • {item}
            </Text>
          ))}
          <SeoHeading level={3} className="text-black text-base mt-2 mb-2" style={{ fontFamily: 'Poppins_700Bold' }}>
            {content.buildMyHouseAngle.sectionTitle}
          </SeoHeading>
          {content.buildMyHouseAngle.paragraphs.map((paragraph) => (
            <BodyText key={paragraph}>{paragraph}</BodyText>
          ))}
        </View>

        <LeadMagnetCard />

        <View style={cardShadowStyle} className="bg-white border border-gray-200 rounded-2xl p-5 mb-7">
          <SeoHeading level={2} className="text-black text-xl mb-3" style={{ fontFamily: 'Poppins_700Bold' }}>
            {content.publicDemoTeaser.title}
          </SeoHeading>
          {content.publicDemoTeaser.paragraphs.map((paragraph) => (
            <BodyText key={paragraph}>{paragraph}</BodyText>
          ))}
          <View className="flex-col md:flex-row gap-3 mt-1">
            <TouchableOpacity onPress={() => openLink(content.publicDemoTeaser.primaryCta.href, router)} className="rounded-full bg-black px-5 py-3">
              <Text className="text-white text-sm text-center" style={{ fontFamily: 'Poppins_700Bold' }}>
                {content.publicDemoTeaser.primaryCta.label}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => openLink(content.publicDemoTeaser.secondaryCta.href, router)} className="rounded-full border border-gray-300 px-5 py-3">
              <Text className="text-gray-900 text-sm text-center" style={{ fontFamily: 'Poppins_600SemiBold' }}>
                {content.publicDemoTeaser.secondaryCta.label}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <TrustBlocks
          blocks={[
            {
              key: 'common_mistakes',
              title: content.mistakes.title,
              bullets: [...content.mistakes.items],
            },
          ]}
        />

        <CollapsibleFaqSection title={content.faq.title} items={faqItems} className="mb-7" />

        <InternalLinksBlock title={content.internalLinks.title} links={[...content.internalLinks.links]} />

        <View style={cardShadowStyle} className="bg-black rounded-3xl p-6 mb-4">
          <SeoHeading level={2} className="text-white text-2xl mb-2" style={{ fontFamily: 'Poppins_700Bold' }}>
            {content.cta.title}
          </SeoHeading>
          <Text className="text-white/85 text-sm leading-7 mb-4" style={{ fontFamily: 'Poppins_400Regular' }}>
            {content.cta.description}
          </Text>
          <View className="flex-col md:flex-row gap-3">
            <TouchableOpacity
              onPress={() => {
                trackWebEvent('abandoned_house_restart_primary_cta_click', { href: content.cta.primary.href });
                openLink(content.cta.primary.href, router);
              }}
              className="rounded-full bg-white px-5 py-3"
            >
              <Text className="text-black text-sm text-center" style={{ fontFamily: 'Poppins_700Bold' }}>
                {content.cta.primary.label}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => {
                trackWebEvent('abandoned_house_restart_secondary_cta_click', { href: content.cta.secondary.href });
                openLink(content.cta.secondary.href, router);
              }}
              className="rounded-full border border-white/40 px-5 py-3"
            >
              <Text className="text-white text-sm text-center" style={{ fontFamily: 'Poppins_600SemiBold' }}>
                {content.cta.secondary.label}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
