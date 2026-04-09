import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, CheckCircle2 } from 'lucide-react-native';
import InternalLinksBlock from '@/components/seo/InternalLinksBlock';
import { SeoRichSection } from '@/components/seo/SeoLandingPage';
import { SeoHeading } from '@/components/seo/SeoHeading';
import { trackWebEvent } from '@/lib/analytics';
import { renovationNigeriaPageContent } from '@/lib/renovation-nigeria-hub';
import { cardShadowStyle } from '@/lib/card-styles';

function ParagraphBlock({
  paragraphs,
  className = 'mb-6',
}: {
  paragraphs: readonly string[];
  className?: string;
}) {
  return (
    <View className={className}>
      {paragraphs.map((p) => (
        <Text
          key={p.slice(0, 48)}
          className="text-gray-700 text-sm leading-6 mb-3 last:mb-0"
          style={{ fontFamily: 'Poppins_400Regular' }}
        >
          {p}
        </Text>
      ))}
    </View>
  );
}

export default function RenovationNigeriaHub() {
  const router = useRouter();
  const c = renovationNigeriaPageContent;

  const quickAnswerSection = {
    heading: c.quickAnswer.title,
    variant: 'snippet' as const,
    bullets: [...c.quickAnswer.items],
  };

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
          <Text
            className="text-[10px] md:text-xs uppercase tracking-wide text-blue-700 mb-1 md:mb-2"
            style={{ fontFamily: 'Poppins_600SemiBold' }}
          >
            {c.hero.eyebrow}
          </Text>
          <SeoHeading
            level={1}
            className="text-xl leading-snug text-black mb-1.5 md:text-3xl md:leading-tight md:mb-2"
            style={{ fontFamily: 'Poppins_700Bold' }}
          >
            {c.hero.title}
          </SeoHeading>
          <Text
            className="text-gray-600 text-xs leading-5 md:text-sm md:leading-6"
            style={{ fontFamily: 'Poppins_400Regular' }}
          >
            {c.hero.description}
          </Text>
        </View>
        <SeoRichSection section={quickAnswerSection} />
        <ParagraphBlock paragraphs={c.intro.paragraphs} />

        <View className="mb-6">
          <SeoHeading level={2} className="text-black text-lg mb-3" style={{ fontFamily: 'Poppins_700Bold' }}>
            {c.story.title}
          </SeoHeading>
          <ParagraphBlock paragraphs={c.story.paragraphs} className="" />
        </View>

        <View className="mb-6">
          <SeoHeading level={2} className="text-black text-lg mb-3" style={{ fontFamily: 'Poppins_700Bold' }}>
            {c.whyItGoesWrong.title}
          </SeoHeading>
          <ParagraphBlock paragraphs={c.whyItGoesWrong.paragraphs} className="" />
        </View>

        <View className="mb-6">
          <SeoHeading level={2} className="text-black text-lg mb-3" style={{ fontFamily: 'Poppins_700Bold' }}>
            {c.reality2026.title}
          </SeoHeading>
          {c.reality2026.items.map((item) => (
            <View key={item} className="flex-row items-start mb-1.5 pl-1">
              <Text className="text-gray-700 mr-2" style={{ fontFamily: 'Poppins_400Regular' }}>
                •
              </Text>
              <Text className="text-gray-700 text-sm flex-1 leading-6" style={{ fontFamily: 'Poppins_400Regular' }}>
                {item}
              </Text>
            </View>
          ))}
        </View>

        <View className="mb-6">
          <SeoHeading level={2} className="text-black text-lg mb-3" style={{ fontFamily: 'Poppins_700Bold' }}>
            {c.scope.title}
          </SeoHeading>
          <ParagraphBlock paragraphs={c.scope.paragraphs} className="" />
        </View>

        <View className="mb-6">
          <SeoHeading level={2} className="text-black text-lg mb-3" style={{ fontFamily: 'Poppins_700Bold' }}>
            {c.permits.title}
          </SeoHeading>
          <ParagraphBlock paragraphs={c.permits.paragraphs} className="" />
        </View>

        <View className="mb-6">
          <SeoHeading level={2} className="text-black text-lg mb-3" style={{ fontFamily: 'Poppins_700Bold' }}>
            {c.familySupervision.title}
          </SeoHeading>
          <ParagraphBlock paragraphs={c.familySupervision.paragraphs} className="" />
          {c.familySupervision.items.map((item) => (
            <View key={item} className="flex-row items-start mb-1.5 pl-1">
              <Text className="text-gray-700 mr-2" style={{ fontFamily: 'Poppins_400Regular' }}>
                •
              </Text>
              <Text className="text-gray-700 text-sm flex-1 leading-6" style={{ fontFamily: 'Poppins_400Regular' }}>
                {item}
              </Text>
            </View>
          ))}
          <Text
            className="text-gray-700 text-sm leading-6 mt-3"
            style={{ fontFamily: 'Poppins_500Medium' }}
          >
            {c.familySupervision.closing}
          </Text>
        </View>

        <View className="bg-black rounded-3xl p-5 mb-6">
          <SeoHeading level={2} className="text-white text-lg mb-3" style={{ fontFamily: 'Poppins_700Bold' }}>
            {c.whyBuildMyHouse.cardTitle}
          </SeoHeading>
          {c.whyBuildMyHouse.cardItems.map((point) => (
            <View key={point} className="flex-row items-start mb-2">
              <CheckCircle2 size={16} color="#22c55e" strokeWidth={2.5} style={{ marginTop: 2 }} />
              <Text className="text-white/90 text-sm ml-2 flex-1" style={{ fontFamily: 'Poppins_400Regular' }}>
                {point}
              </Text>
            </View>
          ))}
        </View>

        <View className="mb-6">
          <SeoHeading level={2} className="text-black text-lg mb-3" style={{ fontFamily: 'Poppins_700Bold' }}>
            {c.whyBuildMyHouse.sectionTitle}
          </SeoHeading>
          <ParagraphBlock paragraphs={c.whyBuildMyHouse.paragraphs} className="" />
        </View>

        <View style={cardShadowStyle} className="bg-gray-50 border border-gray-200 rounded-2xl p-4 mb-6">
          <SeoHeading level={2} className="text-black text-base mb-3" style={{ fontFamily: 'Poppins_700Bold' }}>
            {c.howItWorks.title}
          </SeoHeading>
          {c.howItWorks.steps.map((step, index) => (
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

        <View className="mb-6">
          <SeoHeading level={2} className="text-black text-lg mb-3" style={{ fontFamily: 'Poppins_700Bold' }}>
            {c.trustBlock.title}
          </SeoHeading>
          {c.trustBlock.items.map((item) => (
            <View key={item} className="flex-row items-start mb-1.5 pl-1">
              <Text className="text-gray-700 mr-2" style={{ fontFamily: 'Poppins_400Regular' }}>
                •
              </Text>
              <Text className="text-gray-700 text-sm flex-1 leading-6" style={{ fontFamily: 'Poppins_400Regular' }}>
                {item}
              </Text>
            </View>
          ))}
        </View>

        <View className="mb-6">
          <SeoHeading level={2} className="text-black text-lg mb-3" style={{ fontFamily: 'Poppins_700Bold' }}>
            {c.emotionalPayoff.title}
          </SeoHeading>
          <ParagraphBlock paragraphs={c.emotionalPayoff.paragraphs} className="" />
        </View>

        <View className="mb-6">
          <SeoHeading level={2} className="text-black text-xl mb-3" style={{ fontFamily: 'Poppins_700Bold' }}>
            {c.faq.title}
          </SeoHeading>
          {c.faq.items.map((faq) => (
            <View key={faq.question} style={cardShadowStyle} className="bg-white border border-gray-200 rounded-2xl p-4 mb-3">
              <SeoHeading level={3} className="text-black text-sm mb-2" style={{ fontFamily: 'Poppins_600SemiBold' }}>
                {faq.question}
              </SeoHeading>
              <Text className="text-gray-600 text-sm" style={{ fontFamily: 'Poppins_400Regular' }}>
                {faq.answer}
              </Text>
            </View>
          ))}
        </View>

        <View className="bg-blue-50 border border-blue-200 rounded-2xl p-5 mb-6">
          <SeoHeading level={2} className="text-black text-lg mb-2" style={{ fontFamily: 'Poppins_700Bold' }}>
            {c.cta.title}
          </SeoHeading>
          <Text className="text-gray-700 text-sm mb-4" style={{ fontFamily: 'Poppins_400Regular' }}>
            {c.cta.description}
          </Text>
          <View className="gap-2">
            <TouchableOpacity
              onPress={() => {
                trackWebEvent('seo_renovation_hub_cta_primary', { page: 'renovation/nigeria' });
                router.push(c.cta.primary.href as any);
              }}
              className="bg-blue-600 rounded-full py-3.5 px-5"
            >
              <Text className="text-white text-center text-base" style={{ fontFamily: 'Poppins_700Bold' }}>
                {c.cta.primary.label}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => {
                trackWebEvent('seo_renovation_hub_cta_secondary', { page: 'renovation/nigeria' });
                router.push(c.cta.secondary.href as any);
              }}
              className="bg-white border border-blue-600 rounded-full py-3.5 px-5"
            >
              <Text className="text-blue-700 text-center text-base" style={{ fontFamily: 'Poppins_700Bold' }}>
                {c.cta.secondary.label}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <InternalLinksBlock title={c.internalLinks.title} links={[...c.internalLinks.links]} />

        <TouchableOpacity
          onPress={() => {
            trackWebEvent('seo_start_project_click', {
              page_title: c.hero.title,
              cta_label: c.cta.primary.label,
              cta_href: c.cta.primary.href,
            });
            router.push('/location?mode=explore' as any);
          }}
          className="bg-blue-600 rounded-full py-4 px-5 mb-3"
        >
          <Text className="text-white text-center text-base" style={{ fontFamily: 'Poppins_700Bold' }}>
            {c.cta.primary.label}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}
