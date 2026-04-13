import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import { SeoHeading } from '@/components/seo/SeoHeading';
import InternalLinksBlock from '@/components/seo/InternalLinksBlock';
import TrustBlocks from '@/components/seo/TrustBlocks';
import SeoCoverImage from '@/components/seo/SeoCoverImage';
import { useWebSeo } from '@/lib/seo';
import { trackWebEvent } from '@/lib/analytics';
import { cardShadowStyle } from '@/lib/card-styles';
import { diasporaBuildNigeriaFromAbroadPageContent as content } from '@/lib/diaspora-build-nigeria-from-abroad-pillar';
import { PILLAR_COVER_SOURCES } from '@/lib/published-content-catalog';

const sectionBodyClass = 'text-gray-700 text-sm leading-7 mb-3';

function ParagraphBlock({ paragraphs }: { paragraphs: readonly string[] }) {
  return (
    <>
      {paragraphs.map((paragraph) => (
        <Text key={paragraph} className={sectionBodyClass} style={{ fontFamily: 'Poppins_400Regular' }}>
          {paragraph}
        </Text>
      ))}
    </>
  );
}

export default function DiasporaBuildNigeriaFromAbroadPage() {
  const router = useRouter();
  const canonicalPath = content.seo.canonical.replace('https://buildmyhouse.app', '');
  const robots = content.seo.robots.replace(/\s+/g, '') as 'index,follow' | 'noindex,nofollow';

  useWebSeo({
    title: content.seo.title,
    description: content.seo.description,
    canonicalPath,
    robots,
    jsonLd: content.faqSchema,
  });

  return (
    <View className="flex-1 bg-white">
      <ScrollView className="flex-1 px-5 md:px-6" contentContainerStyle={{ paddingBottom: 44 }}>
        <View className="pt-10 pb-3 md:pt-14">
          <TouchableOpacity
            onPress={() => (router.canGoBack() ? router.back() : router.push('/login'))}
            className="w-10 h-10 rounded-full bg-gray-100 items-center justify-center mb-4"
          >
            <ArrowLeft size={18} color="#111827" strokeWidth={2.2} />
          </TouchableOpacity>
          <Text className="text-[11px] tracking-wide uppercase text-gray-500 mb-2" style={{ fontFamily: 'Poppins_600SemiBold' }}>
            {content.hero.eyebrow}
          </Text>
          <SeoHeading
            level={1}
            className="text-black text-3xl leading-tight mb-3 md:text-4xl"
            style={{ fontFamily: 'Poppins_700Bold', maxWidth: 920 }}
          >
            {content.hero.title}
          </SeoHeading>
          <SeoCoverImage source={PILLAR_COVER_SOURCES.buildAbroad} alt={content.hero.title} />
          <Text
            className="text-gray-600 text-base leading-7 mb-5 md:text-lg"
            style={{ fontFamily: 'Poppins_400Regular', maxWidth: 920 }}
          >
            {content.hero.description}
          </Text>
          <View className="flex-col md:flex-row gap-3 mb-2">
            <TouchableOpacity
              onPress={() => {
                trackWebEvent('diaspora_pillar_primary_cta_click', { href: content.hero.primaryCta.href });
                router.push(content.hero.primaryCta.href as any);
              }}
              className="rounded-full bg-black px-6 py-3.5"
            >
              <Text className="text-white text-sm md:text-base text-center" style={{ fontFamily: 'Poppins_700Bold' }}>
                {content.hero.primaryCta.label}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => {
                trackWebEvent('diaspora_pillar_secondary_cta_click', { href: content.hero.secondaryCta.href });
                router.push(content.hero.secondaryCta.href as any);
              }}
              className="rounded-full border border-gray-300 px-6 py-3.5"
            >
              <Text className="text-gray-900 text-sm md:text-base text-center" style={{ fontFamily: 'Poppins_600SemiBold' }}>
                {content.hero.secondaryCta.label}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={cardShadowStyle} className="bg-gray-50 border border-gray-200 rounded-2xl p-5 mb-8">
          <SeoHeading level={2} className="text-black text-xl mb-3" style={{ fontFamily: 'Poppins_700Bold' }}>
            {content.quickAnswer.title}
          </SeoHeading>
          {content.quickAnswer.items.map((item) => (
            <View key={item} className="flex-row items-start mb-2">
              <Text className="text-gray-700 mr-2" style={{ fontFamily: 'Poppins_500Medium' }}>
                •
              </Text>
              <Text className="text-gray-700 text-sm leading-6 flex-1" style={{ fontFamily: 'Poppins_400Regular' }}>
                {item}
              </Text>
            </View>
          ))}
        </View>

        <View className="mb-8">
          <ParagraphBlock paragraphs={content.intro.paragraphs} />
        </View>

        <View className="mb-8">
          <SeoHeading level={2} className="text-black text-2xl mb-3" style={{ fontFamily: 'Poppins_700Bold' }}>
            {content.story.title}
          </SeoHeading>
          <ParagraphBlock paragraphs={content.story.paragraphs} />
        </View>

        <View className="mb-8">
          <SeoHeading level={2} className="text-black text-2xl mb-3" style={{ fontFamily: 'Poppins_700Bold' }}>
            {content.whyItGoesWrong.title}
          </SeoHeading>
          <ParagraphBlock paragraphs={content.whyItGoesWrong.paragraphs} />
        </View>

        <View className="mb-8">
          <SeoHeading level={2} className="text-black text-2xl mb-3" style={{ fontFamily: 'Poppins_700Bold' }}>
            {content.systemShift.title}
          </SeoHeading>
          <ParagraphBlock paragraphs={content.systemShift.paragraphs} />
        </View>

        <View className="mb-8">
          <SeoHeading level={2} className="text-black text-2xl mb-3" style={{ fontFamily: 'Poppins_700Bold' }}>
            {content.landAndDocuments.title}
          </SeoHeading>
          <ParagraphBlock paragraphs={content.landAndDocuments.paragraphs} />
        </View>

        <View className="mb-8">
          <SeoHeading level={2} className="text-black text-2xl mb-3" style={{ fontFamily: 'Poppins_700Bold' }}>
            {content.scopeAndBudget.title}
          </SeoHeading>
          <ParagraphBlock paragraphs={content.scopeAndBudget.paragraphs} />
        </View>

        <View className="mb-8">
          <SeoHeading level={2} className="text-black text-2xl mb-3" style={{ fontFamily: 'Poppins_700Bold' }}>
            {content.payments.title}
          </SeoHeading>
          <ParagraphBlock paragraphs={content.payments.paragraphs} />
        </View>

        <View className="mb-8">
          <SeoHeading level={2} className="text-black text-2xl mb-3" style={{ fontFamily: 'Poppins_700Bold' }}>
            {content.permits.title}
          </SeoHeading>
          <ParagraphBlock paragraphs={content.permits.paragraphs} />
          <TouchableOpacity
            onPress={() => router.push(content.permits.primaryLink.href as any)}
            className="rounded-full border border-gray-300 bg-gray-100 px-4 py-2.5 self-start mt-1"
          >
            <Text className="text-gray-900 text-sm" style={{ fontFamily: 'Poppins_600SemiBold' }}>
              {content.permits.primaryLink.label}
            </Text>
          </TouchableOpacity>
        </View>

        <View className="mb-8">
          <SeoHeading level={2} className="text-black text-2xl mb-3" style={{ fontFamily: 'Poppins_700Bold' }}>
            {content.familySupervision.title}
          </SeoHeading>
          <ParagraphBlock paragraphs={content.familySupervision.paragraphs} />
        </View>

        <View className="mb-8">
          <View style={cardShadowStyle} className="bg-black rounded-2xl p-5 mb-4">
            <SeoHeading level={2} className="text-white text-xl mb-3" style={{ fontFamily: 'Poppins_700Bold' }}>
              {content.whyBuildMyHouse.cardTitle}
            </SeoHeading>
            {content.whyBuildMyHouse.cardItems.map((item) => (
              <View key={item} className="flex-row items-start mb-2">
                <Text className="text-gray-300 mr-2" style={{ fontFamily: 'Poppins_500Medium' }}>
                  •
                </Text>
                <Text className="text-white text-sm leading-6 flex-1" style={{ fontFamily: 'Poppins_400Regular' }}>
                  {item}
                </Text>
              </View>
            ))}
          </View>
          <SeoHeading level={2} className="text-black text-2xl mb-3" style={{ fontFamily: 'Poppins_700Bold' }}>
            {content.whyBuildMyHouse.sectionTitle}
          </SeoHeading>
          <ParagraphBlock paragraphs={content.whyBuildMyHouse.paragraphs} />
        </View>

        <TrustBlocks
          blocks={[
            {
              key: 'proof_of_process',
              title: content.proofOfProcess.title,
              description: content.proofOfProcess.paragraphs.join(' '),
              bullets: [...content.proofOfProcess.items],
            },
            {
              key: 'common_mistakes',
              title: content.mistakes.title,
              bullets: [...content.mistakes.items],
            },
            {
              key: 'cta',
              title: content.howItWorks.title,
              bullets: [...content.howItWorks.steps],
            },
          ]}
        />

        <View style={cardShadowStyle} className="bg-gray-100 border border-gray-300 rounded-2xl p-5 mb-8">
          <SeoHeading level={2} className="text-black text-2xl mb-3" style={{ fontFamily: 'Poppins_700Bold' }}>
            {content.publicDemoTeaser.title}
          </SeoHeading>
          <ParagraphBlock paragraphs={content.publicDemoTeaser.paragraphs} />
          <View className="flex-col md:flex-row gap-3 mt-2">
            <TouchableOpacity
              onPress={() => router.push(content.publicDemoTeaser.primaryCta.href as any)}
              className="rounded-full bg-black px-5 py-3"
            >
              <Text className="text-white text-sm md:text-base text-center" style={{ fontFamily: 'Poppins_700Bold' }}>
                {content.publicDemoTeaser.primaryCta.label}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => router.push(content.publicDemoTeaser.secondaryCta.href as any)}
              className="rounded-full border border-gray-300 px-5 py-3"
            >
              <Text className="text-gray-900 text-sm md:text-base text-center" style={{ fontFamily: 'Poppins_600SemiBold' }}>
                {content.publicDemoTeaser.secondaryCta.label}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <InternalLinksBlock title={content.internalLinks.title} links={[...content.internalLinks.links]} />

        <View className="mb-8">
          <SeoHeading level={2} className="text-black text-2xl mb-4" style={{ fontFamily: 'Poppins_700Bold' }}>
            {content.faq.title}
          </SeoHeading>
          {content.faq.items.map((faq) => (
            <View key={faq.question} style={cardShadowStyle} className="bg-white border border-gray-200 rounded-2xl p-4 mb-3">
              <SeoHeading level={3} className="text-black text-base mb-2" style={{ fontFamily: 'Poppins_600SemiBold' }}>
                {faq.question}
              </SeoHeading>
              <Text className="text-gray-700 text-sm leading-6" style={{ fontFamily: 'Poppins_400Regular' }}>
                {faq.answer}
              </Text>
            </View>
          ))}
        </View>

        <View style={cardShadowStyle} className="bg-black rounded-3xl p-6 mb-5">
          <SeoHeading level={2} className="text-white text-2xl mb-2" style={{ fontFamily: 'Poppins_700Bold' }}>
            {content.cta.title}
          </SeoHeading>
          <Text className="text-white/85 text-sm leading-7 mb-4" style={{ fontFamily: 'Poppins_400Regular' }}>
            {content.cta.description}
          </Text>
          <View className="flex-col md:flex-row gap-3">
            <TouchableOpacity
              onPress={() => router.push(content.cta.primary.href as any)}
              className="rounded-full bg-white px-5 py-3"
            >
              <Text className="text-black text-sm md:text-base text-center" style={{ fontFamily: 'Poppins_700Bold' }}>
                {content.cta.primary.label}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => router.push(content.cta.secondary.href as any)}
              className="rounded-full border border-white/40 px-5 py-3"
            >
              <Text className="text-white text-sm md:text-base text-center" style={{ fontFamily: 'Poppins_600SemiBold' }}>
                {content.cta.secondary.label}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

