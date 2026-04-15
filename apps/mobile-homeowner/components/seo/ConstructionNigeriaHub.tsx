import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, CheckCircle2 } from 'lucide-react-native';
import InternalLinksBlock from '@/components/seo/InternalLinksBlock';
import CollapsibleFaqSection from '@/components/seo/CollapsibleFaqSection';
import { SeoRichSection } from '@/components/seo/SeoLandingPage';
import { SeoHeading } from '@/components/seo/SeoHeading';
import { trackWebEvent } from '@/lib/analytics';
import { constructionNigeriaHubClusterLinks, type ConstructionNigeriaHubContent } from '@/lib/construction-nigeria-hub';
import { cardShadowStyle } from '@/lib/card-styles';

type Props = {
  content: ConstructionNigeriaHubContent;
};

export default function ConstructionNigeriaHub({ content }: Props) {
  const router = useRouter();
  const {
    eyebrow,
    heroTitle,
    heroDescription,
    quickAnswer,
    problemGuide,
    stepByStep,
    whyFail,
    costSection,
    lagosSection,
    ukRemoteSection,
    whySectionTitle,
    whyBullets,
    whatMakesDifferent,
    processTitle,
    processSteps,
    trustSection,
    conversionSection,
    faqs,
    internalLinks,
  } = content;

  return (
    <View className="flex-1 bg-white">
      <ScrollView className="flex-1 px-5 md:px-6" contentContainerStyle={{ paddingBottom: 40 }}>
        <View className="pt-10 pb-2 md:pt-14 md:pb-4">
          <TouchableOpacity
            onPress={() => (router.canGoBack() ? router.back() : router.push('/login'))}
            className="w-9 h-9 bg-gray-100 rounded-full items-center justify-center mb-2 md:mb-4 md:w-10 md:h-10"
          >
            <ArrowLeft size={18} color="#000000" strokeWidth={2.5} />
          </TouchableOpacity>
          {eyebrow ? (
            <Text
              className="text-[10px] md:text-xs uppercase tracking-wide text-blue-700 mb-1 md:mb-2"
              style={{ fontFamily: 'Poppins_600SemiBold' }}
            >
              {eyebrow}
            </Text>
          ) : null}
          <SeoHeading
            level={1}
            className="text-xl leading-snug text-black mb-1.5 md:text-3xl md:leading-tight md:mb-2"
            style={{ fontFamily: 'Poppins_700Bold' }}
          >
            {heroTitle}
          </SeoHeading>
          <Text
            className="text-gray-600 text-xs leading-5 md:text-sm md:leading-6"
            style={{ fontFamily: 'Poppins_400Regular' }}
          >
            {heroDescription}
          </Text>
        </View>
        <SeoRichSection section={quickAnswer} />
        <SeoRichSection section={problemGuide} />

        <View className="mb-6">
          <SeoHeading level={2} className="text-black text-lg mb-3" style={{ fontFamily: 'Poppins_700Bold' }}>
            {stepByStep.heading}
          </SeoHeading>
          {stepByStep.steps.map((step, index) => (
            <View key={step} className="flex-row items-start mb-2">
              <View className="w-6 h-6 rounded-full bg-black items-center justify-center mr-2 mt-0.5">
                <Text className="text-white text-xs" style={{ fontFamily: 'Poppins_700Bold' }}>
                  {index + 1}
                </Text>
              </View>
              <Text className="text-gray-700 text-sm flex-1 leading-6" style={{ fontFamily: 'Poppins_400Regular' }}>
                {step}
              </Text>
            </View>
          ))}
        </View>

        <SeoRichSection section={whyFail} />
        <SeoRichSection section={costSection} />
        <SeoRichSection section={lagosSection} />

        <View className="bg-black rounded-3xl p-5 mb-6">
          <SeoHeading level={2} className="text-white text-lg mb-3" style={{ fontFamily: 'Poppins_700Bold' }}>
            {whySectionTitle}
          </SeoHeading>
          {whyBullets.map((point) => (
            <View key={point} className="flex-row items-start mb-2">
              <CheckCircle2 size={16} color="#22c55e" strokeWidth={2.5} style={{ marginTop: 2 }} />
              <Text className="text-white/90 text-sm ml-2 flex-1" style={{ fontFamily: 'Poppins_400Regular' }}>
                {point}
              </Text>
            </View>
          ))}
        </View>

        <SeoRichSection section={whatMakesDifferent} />
        <SeoRichSection section={ukRemoteSection} />

        {processSteps.length > 0 && (
          <View style={cardShadowStyle} className="bg-gray-50 border border-gray-200 rounded-2xl p-4 mb-6">
            <SeoHeading level={2} className="text-black text-base mb-3" style={{ fontFamily: 'Poppins_700Bold' }}>
              {processTitle}
            </SeoHeading>
            {processSteps.map((step, index) => (
              <View key={step} className="flex-row items-start mb-2">
                <View className="w-6 h-6 rounded-full bg-black items-center justify-center mr-2 mt-0.5">
                  <Text className="text-white text-xs" style={{ fontFamily: 'Poppins_700Bold' }}>
                    {index + 1}
                  </Text>
                </View>
                <Text className="text-gray-700 text-sm flex-1" style={{ fontFamily: 'Poppins_400Regular' }}>
                  {step}
                </Text>
              </View>
            ))}
          </View>
        )}

        <SeoRichSection section={trustSection} />

        <View className="bg-blue-50 border border-blue-200 rounded-2xl p-5 mb-6">
          <SeoHeading level={2} className="text-black text-lg mb-2" style={{ fontFamily: 'Poppins_700Bold' }}>
            {conversionSection.heading}
          </SeoHeading>
          <Text className="text-gray-700 text-sm mb-3" style={{ fontFamily: 'Poppins_400Regular' }}>
            {conversionSection.intro}
          </Text>
          <Text className="text-gray-900 text-sm mb-2" style={{ fontFamily: 'Poppins_600SemiBold' }}>
            {conversionSection.lead}
          </Text>
          {conversionSection.bullets.map((b) => (
            <View key={b} className="flex-row items-start mb-1.5">
              <Text className="text-blue-700 mr-2" style={{ fontFamily: 'Poppins_400Regular' }}>
                →
              </Text>
              <Text className="text-gray-800 text-sm flex-1" style={{ fontFamily: 'Poppins_400Regular' }}>
                {b}
              </Text>
            </View>
          ))}
          <View className="mt-4 gap-2">
            <TouchableOpacity
              onPress={() => {
                trackWebEvent('seo_hub_conversion_primary', { page: 'construction/nigeria' });
                router.push(conversionSection.primaryCtaHref as any);
              }}
              className="bg-blue-600 rounded-full py-3.5 px-5"
            >
              <Text className="text-white text-center text-base" style={{ fontFamily: 'Poppins_700Bold' }}>
                {conversionSection.primaryCtaLabel}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => {
                trackWebEvent('seo_hub_conversion_secondary', { page: 'construction/nigeria' });
                router.push(conversionSection.secondaryCtaHref as any);
              }}
              className="bg-white border border-blue-600 rounded-full py-3.5 px-5"
            >
              <Text className="text-blue-700 text-center text-base" style={{ fontFamily: 'Poppins_700Bold' }}>
                {conversionSection.secondaryCtaLabel}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <InternalLinksBlock title="Learn more about building in Nigeria" links={constructionNigeriaHubClusterLinks} />

        {faqs.length > 0 ? <CollapsibleFaqSection items={faqs} /> : null}

        {internalLinks.length > 0 ? <InternalLinksBlock links={internalLinks} /> : null}

        <TouchableOpacity
          onPress={() => {
            trackWebEvent('seo_start_project_click', {
              page_title: heroTitle,
              cta_label: 'Start your project',
              cta_href: '/location?mode=explore',
            });
            router.push('/location?mode=explore' as any);
          }}
          className="bg-blue-600 rounded-full py-4 px-5 mb-3"
        >
          <Text className="text-white text-center text-base" style={{ fontFamily: 'Poppins_700Bold' }}>
            Start your project
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}
