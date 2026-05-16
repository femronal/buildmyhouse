import { Linking, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import { SeoHeading } from '@/components/seo/SeoHeading';
import InternalLinksBlock from '@/components/seo/InternalLinksBlock';
import CollapsibleFaqSection from '@/components/seo/CollapsibleFaqSection';
import TrustBlocks from '@/components/seo/TrustBlocks';
import SeoCoverImage from '@/components/seo/SeoCoverImage';
import { cardShadowStyle } from '@/lib/card-styles';
import { useWebSeo } from '@/lib/seo';
import { trackWebEvent } from '@/lib/analytics';
import { ukRenovateParentsHousePageContent as content } from '@/lib/diaspora-uk-renovate-parents-house-content';

function cleanCitationTokens(text: string) {
  return text.replace(/\s*:contentReference\[[^\]]+\]\{[^}]+\}/g, '').trim();
}

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

function LeadMagnetCard() {
  const router = useRouter();
  return (
    <View style={cardShadowStyle} className="bg-black rounded-2xl p-5 mb-7">
      <SeoHeading level={2} className="text-white text-xl mb-2" style={{ fontFamily: 'Poppins_700Bold' }}>
        {content.leadMagnet.title}
      </SeoHeading>
      <Text className="text-white/85 text-sm leading-6 mb-3" style={{ fontFamily: 'Poppins_400Regular' }}>
        {content.leadMagnet.description}
      </Text>
      <View className="flex-col md:flex-row gap-3">
        <TouchableOpacity onPress={() => openLink(content.leadMagnet.primaryCta.href, router)} className="rounded-full bg-white px-5 py-3">
          <Text className="text-black text-sm text-center" style={{ fontFamily: 'Poppins_700Bold' }}>
            {content.leadMagnet.primaryCta.label}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => openLink(content.leadMagnet.secondaryCta.href, router)} className="rounded-full border border-white/40 px-5 py-3">
          <Text className="text-white text-sm text-center" style={{ fontFamily: 'Poppins_600SemiBold' }}>
            {content.leadMagnet.secondaryCta.label}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function DiasporaUkRenovateParentsHousePage() {
  const router = useRouter();
  const canonicalPath = content.seo.canonical.replace('https://buildmyhouse.app', '');
  const robots = content.seo.robots.replace(/\s+/g, '') as 'index,follow' | 'noindex,nofollow';
  const cleanedFaqItems = content.faq.items.map((item) => ({
    ...item,
    answer: cleanCitationTokens(item.answer),
  }));

  useWebSeo({
    title: content.seo.title,
    description: content.seo.description,
    canonicalPath,
    robots,
    jsonLd: content.faqSchema,
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
          <Text className="text-gray-700 text-base leading-7 mb-4 md:text-lg" style={{ fontFamily: 'Poppins_400Regular' }}>
            {content.hero.description}
          </Text>
          <SeoCoverImage source={{ uri: content.coverImage.src }} alt={content.coverImage.alt} className="mb-5" aspectRatio={16 / 9} />
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
            {content.quickAnswer.title}
          </SeoHeading>
          {content.quickAnswer.items.map((item) => (
            <Text key={item} className="text-gray-700 text-sm leading-6 mb-2" style={{ fontFamily: 'Poppins_400Regular' }}>
              • {item}
            </Text>
          ))}
        </View>

        <View className="mb-7">
          <SeoHeading level={2} className="text-black text-2xl mb-3" style={{ fontFamily: 'Poppins_700Bold' }}>
            {content.hook.title}
          </SeoHeading>
          {content.hook.paragraphs.map((paragraph) => (
            <Text key={paragraph} className="text-gray-700 text-sm leading-7 mb-3" style={{ fontFamily: 'Poppins_400Regular' }}>
              {paragraph}
            </Text>
          ))}
        </View>

        <View className="mb-7">
          {content.intro.paragraphs.map((paragraph) => (
            <Text key={paragraph} className="text-gray-700 text-sm leading-7 mb-3" style={{ fontFamily: 'Poppins_400Regular' }}>
              {paragraph}
            </Text>
          ))}
        </View>

        <View className="mb-7">
          <SeoHeading level={2} className="text-black text-2xl mb-3" style={{ fontFamily: 'Poppins_700Bold' }}>
            {content.story.title}
          </SeoHeading>
          {content.story.paragraphs.map((paragraph) => (
            <Text key={paragraph} className="text-gray-700 text-sm leading-7 mb-3" style={{ fontFamily: 'Poppins_400Regular' }}>
              {paragraph}
            </Text>
          ))}
        </View>

        <View className="mb-7">
          <SeoHeading level={2} className="text-black text-2xl mb-3" style={{ fontFamily: 'Poppins_700Bold' }}>
            {content.whyThisGoesWrong.title}
          </SeoHeading>
          {content.whyThisGoesWrong.paragraphs.map((paragraph) => (
            <Text key={paragraph} className="text-gray-700 text-sm leading-7 mb-3" style={{ fontFamily: 'Poppins_400Regular' }}>
              {paragraph}
            </Text>
          ))}
        </View>

        <View className="mb-7">
          <SeoHeading level={2} className="text-black text-2xl mb-3" style={{ fontFamily: 'Poppins_700Bold' }}>
            {content.parentsHomeReality.title}
          </SeoHeading>
          {content.parentsHomeReality.paragraphs.map((paragraph) => (
            <Text key={paragraph} className="text-gray-700 text-sm leading-7 mb-3" style={{ fontFamily: 'Poppins_400Regular' }}>
              {paragraph}
            </Text>
          ))}
        </View>

        <View style={cardShadowStyle} className="bg-white border border-gray-200 rounded-2xl p-5 mb-7">
          <SeoHeading level={2} className="text-black text-xl mb-3" style={{ fontFamily: 'Poppins_700Bold' }}>
            {content.whatToPlan.title}
          </SeoHeading>
          {content.whatToPlan.items.map((item) => (
            <Text key={item} className="text-gray-700 text-sm leading-6 mb-1.5" style={{ fontFamily: 'Poppins_400Regular' }}>
              • {item}
            </Text>
          ))}
        </View>

        <View className="mb-7">
          <SeoHeading level={2} className="text-black text-2xl mb-3" style={{ fontFamily: 'Poppins_700Bold' }}>
            {content.repairsVsUpgrades.title}
          </SeoHeading>
          {content.repairsVsUpgrades.paragraphs.map((paragraph) => (
            <Text key={paragraph} className="text-gray-700 text-sm leading-7 mb-3" style={{ fontFamily: 'Poppins_400Regular' }}>
              {paragraph}
            </Text>
          ))}
          <TouchableOpacity onPress={() => openLink(content.repairsVsUpgrades.primaryLink.href, router)} className="rounded-full border border-gray-300 bg-gray-100 px-4 py-2.5 self-start mt-1">
            <Text className="text-gray-900 text-sm" style={{ fontFamily: 'Poppins_600SemiBold' }}>
              {content.repairsVsUpgrades.primaryLink.label}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={cardShadowStyle} className="bg-black rounded-2xl p-5 mb-7">
          <SeoHeading level={2} className="text-white text-xl mb-2" style={{ fontFamily: 'Poppins_700Bold' }}>
            {content.stageControl.title}
          </SeoHeading>
          {content.stageControl.paragraphs.map((paragraph) => (
            <Text key={paragraph} className="text-white/90 text-sm leading-7 mb-2" style={{ fontFamily: 'Poppins_400Regular' }}>
              {paragraph}
            </Text>
          ))}
          <TouchableOpacity onPress={() => openLink(content.stageControl.secondaryLink.href, router)} className="rounded-full border border-white/40 px-4 py-2.5 self-start mt-2">
            <Text className="text-white text-sm" style={{ fontFamily: 'Poppins_600SemiBold' }}>
              {content.stageControl.secondaryLink.label}
            </Text>
          </TouchableOpacity>
        </View>

        <View className="mb-7">
          <SeoHeading level={2} className="text-black text-2xl mb-3" style={{ fontFamily: 'Poppins_700Bold' }}>
            {content.familyDynamics.title}
          </SeoHeading>
          {content.familyDynamics.paragraphs.map((paragraph) => (
            <Text key={paragraph} className="text-gray-700 text-sm leading-7 mb-3" style={{ fontFamily: 'Poppins_400Regular' }}>
              {paragraph}
            </Text>
          ))}
        </View>

        <View className="mb-7">
          <SeoHeading level={2} className="text-black text-2xl mb-3" style={{ fontFamily: 'Poppins_700Bold' }}>
            {content.ukSpecificAngle.title}
          </SeoHeading>
          {content.ukSpecificAngle.paragraphs.map((paragraph) => (
            <Text key={paragraph} className="text-gray-700 text-sm leading-7 mb-3" style={{ fontFamily: 'Poppins_400Regular' }}>
              {paragraph}
            </Text>
          ))}
        </View>

        <View className="mb-7">
          <View style={cardShadowStyle} className="bg-black rounded-2xl p-5 mb-4">
            <SeoHeading level={2} className="text-white text-xl mb-3" style={{ fontFamily: 'Poppins_700Bold' }}>
              {content.buildMyHouseAngle.cardTitle}
            </SeoHeading>
            {content.buildMyHouseAngle.cardItems.map((item) => (
              <Text key={item} className="text-white text-sm leading-6 mb-1.5" style={{ fontFamily: 'Poppins_400Regular' }}>
                • {item}
              </Text>
            ))}
          </View>
          <SeoHeading level={2} className="text-black text-2xl mb-3" style={{ fontFamily: 'Poppins_700Bold' }}>
            {content.buildMyHouseAngle.sectionTitle}
          </SeoHeading>
          {content.buildMyHouseAngle.paragraphs.map((paragraph) => (
            <Text key={paragraph} className="text-gray-700 text-sm leading-7 mb-3" style={{ fontFamily: 'Poppins_400Regular' }}>
              {cleanCitationTokens(paragraph)}
            </Text>
          ))}
        </View>

        <TrustBlocks
          blocks={[
            {
              key: 'proof_of_process',
              title: content.proofOfProcess.title,
              description: content.proofOfProcess.paragraphs.map(cleanCitationTokens).join(' '),
              bullets: [...content.proofOfProcess.items],
            },
          ]}
        />

        <View style={cardShadowStyle} className="bg-gray-100 border border-gray-300 rounded-2xl p-5 mb-7">
          <SeoHeading level={2} className="text-black text-xl mb-3" style={{ fontFamily: 'Poppins_700Bold' }}>
            {content.publicDemoTeaser.title}
          </SeoHeading>
          {content.publicDemoTeaser.paragraphs.map((paragraph) => (
            <Text key={paragraph} className="text-gray-700 text-sm leading-7 mb-3" style={{ fontFamily: 'Poppins_400Regular' }}>
              {paragraph}
            </Text>
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

        <CollapsibleFaqSection title={content.faq.title} items={cleanedFaqItems} className="mb-7" />

        <LeadMagnetCard />

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
                trackWebEvent('uk_renovate_parents_primary_cta_click', { href: content.cta.primary.href });
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
                trackWebEvent('uk_renovate_parents_secondary_cta_click', { href: content.cta.secondary.href });
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

