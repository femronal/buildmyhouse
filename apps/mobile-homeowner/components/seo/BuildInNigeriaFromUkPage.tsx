import { Linking, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import { SeoHeading } from '@/components/seo/SeoHeading';
import { SeoContentBackButton, SeoContentColumn, SeoContentShell, seoContentTypography } from '@/components/seo/SeoContentLayout';
import InternalLinksBlock from '@/components/seo/InternalLinksBlock';
import CollapsibleFaqSection from '@/components/seo/CollapsibleFaqSection';
import TrustBlocks from '@/components/seo/TrustBlocks';
import SeoCoverImage from '@/components/seo/SeoCoverImage';
import { cardShadowStyle } from '@/lib/card-styles';
import { useWebSeo } from '@/lib/seo';
import { trackWebEvent } from '@/lib/analytics';
import { buildInNigeriaFromUkPageContent as content } from '@/lib/build-in-nigeria-from-uk-content';

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

export default function BuildInNigeriaFromUkPage() {
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
    <SeoContentShell contentContainerStyle={{ paddingBottom: 40 }}>
      <SeoContentColumn>
        <View className="pt-10 pb-2 md:pt-14 md:pb-4">
          <SeoContentBackButton fallbackHref="/login" />
          <Text className="text-[11px] uppercase tracking-wide text-gray-500 mb-2" style={{ fontFamily: 'Poppins_600SemiBold' }}>
            {content.hero.eyebrow}
          </Text>
          <SeoHeading level={1} className={seoContentTypography.title} style={{ fontFamily: 'Poppins_700Bold' }}>
            {content.hero.title}
          </SeoHeading>
          <Text className={seoContentTypography.description} style={{ fontFamily: 'Poppins_400Regular' }}>
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
              {cleanCitationTokens(paragraph)}
            </Text>
          ))}
        </View>

        <View className="mb-7">
          <SeoHeading level={2} className="text-black text-2xl mb-3" style={{ fontFamily: 'Poppins_700Bold' }}>
            {content.ukReality.title}
          </SeoHeading>
          {content.ukReality.paragraphs.map((paragraph) => (
            <Text key={paragraph} className="text-gray-700 text-sm leading-7 mb-3" style={{ fontFamily: 'Poppins_400Regular' }}>
              {paragraph}
            </Text>
          ))}
        </View>

        <View style={cardShadowStyle} className="bg-white border border-gray-200 rounded-2xl p-5 mb-7">
          <SeoHeading level={2} className="text-black text-xl mb-3" style={{ fontFamily: 'Poppins_700Bold' }}>
            {content.whatCanGoWrong.title}
          </SeoHeading>
          {content.whatCanGoWrong.items.map((item) => (
            <Text key={item} className="text-gray-700 text-sm leading-6 mb-1.5" style={{ fontFamily: 'Poppins_400Regular' }}>
              • {item}
            </Text>
          ))}
          <Text className="text-gray-700 text-sm leading-7 mt-3" style={{ fontFamily: 'Poppins_500Medium' }}>
            {content.whatCanGoWrong.closing}
          </Text>
        </View>

        <View className="mb-7">
          <SeoHeading level={2} className="text-black text-2xl mb-3" style={{ fontFamily: 'Poppins_700Bold' }}>
            {content.whatBuildMyHouseIs.title}
          </SeoHeading>
          {content.whatBuildMyHouseIs.paragraphs.map((paragraph) => (
            <Text key={paragraph} className="text-gray-700 text-sm leading-7 mb-3" style={{ fontFamily: 'Poppins_400Regular' }}>
              {cleanCitationTokens(paragraph)}
            </Text>
          ))}
        </View>

        <View style={cardShadowStyle} className="bg-black rounded-2xl p-5 mb-7">
          <SeoHeading level={2} className="text-white text-xl mb-3" style={{ fontFamily: 'Poppins_700Bold' }}>
            {content.howBmhHelps.title}
          </SeoHeading>
          {content.howBmhHelps.steps.map((step) => (
            <View key={step.heading} className="mb-3 last:mb-0">
              <SeoHeading level={3} className="text-white text-base mb-1" style={{ fontFamily: 'Poppins_700Bold' }}>
                {step.heading}
              </SeoHeading>
              <Text className="text-white/90 text-sm leading-7" style={{ fontFamily: 'Poppins_400Regular' }}>
                {cleanCitationTokens(step.text)}
              </Text>
            </View>
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
            {
              key: 'common_mistakes',
              title: content.mistakesToAvoid.title,
              bullets: [...content.mistakesToAvoid.items],
            },
          ]}
        />

        <View style={cardShadowStyle} className="bg-gray-100 border border-gray-300 rounded-2xl p-5 mb-7">
          <SeoHeading level={2} className="text-black text-xl mb-3" style={{ fontFamily: 'Poppins_700Bold' }}>
            {content.helpfulForUkUsers.title}
          </SeoHeading>
          {content.helpfulForUkUsers.paragraphs.map((paragraph) => (
            <Text key={paragraph} className="text-gray-700 text-sm leading-7 mb-3" style={{ fontFamily: 'Poppins_400Regular' }}>
              {paragraph}
            </Text>
          ))}
        </View>

        <CollapsibleFaqSection title={content.faq.title} items={cleanedFaqItems} className="mb-7" />

        <View style={cardShadowStyle} className="bg-black rounded-3xl p-6 mb-7">
          <SeoHeading level={2} className="text-white text-2xl mb-2" style={{ fontFamily: 'Poppins_700Bold' }}>
            {content.finalCta.title}
          </SeoHeading>
          <Text className="text-white/85 text-sm leading-7 mb-4" style={{ fontFamily: 'Poppins_400Regular' }}>
            {content.finalCta.description}
          </Text>
          <View className="flex-col md:flex-row gap-3">
            <TouchableOpacity
              onPress={() => {
                trackWebEvent('uk_build_primary_cta_click', { href: content.finalCta.primary.href });
                openLink(content.finalCta.primary.href, router);
              }}
              className="rounded-full bg-white px-5 py-3"
            >
              <Text className="text-black text-sm text-center" style={{ fontFamily: 'Poppins_700Bold' }}>
                {content.finalCta.primary.label}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => {
                trackWebEvent('uk_build_secondary_cta_click', { href: content.finalCta.secondary.href });
                openLink(content.finalCta.secondary.href, router);
              }}
              className="rounded-full border border-white/40 px-5 py-3"
            >
              <Text className="text-white text-sm text-center" style={{ fontFamily: 'Poppins_600SemiBold' }}>
                {content.finalCta.secondary.label}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <InternalLinksBlock title={content.relatedResources.title} links={[...content.relatedResources.links]} />
      </SeoContentColumn>
    </SeoContentShell>
  );
}

