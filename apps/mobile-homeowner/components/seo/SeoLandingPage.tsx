import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, CheckCircle2 } from 'lucide-react-native';
import InternalLinksBlock, { InternalLinkItem } from '@/components/seo/InternalLinksBlock';
import { trackWebEvent } from '@/lib/analytics';

type FaqItem = {
  question: string;
  answer: string;
};

type SeoLandingPageProps = {
  eyebrow?: string;
  title: string;
  description: string;
  bulletPoints: string[];
  processTitle?: string;
  processSteps?: string[];
  faqs?: FaqItem[];
  internalLinks?: InternalLinkItem[];
  ctaLabel?: string;
  ctaHref?: string;
};

export default function SeoLandingPage({
  eyebrow,
  title,
  description,
  bulletPoints,
  processTitle = 'How BuildMyHouse helps',
  processSteps = [],
  faqs = [],
  internalLinks = [],
  ctaLabel = 'Start your project',
  ctaHref = '/location?mode=explore',
}: SeoLandingPageProps) {
  const router = useRouter();

  return (
    <View className="flex-1 bg-white">
      <View className="pt-14 px-6 pb-4">
        <TouchableOpacity
          onPress={() => router.canGoBack() ? router.back() : router.push('/login')}
          className="w-10 h-10 bg-gray-100 rounded-full items-center justify-center mb-4"
        >
          <ArrowLeft size={20} color="#000000" strokeWidth={2.5} />
        </TouchableOpacity>
        {eyebrow ? (
          <Text className="text-xs uppercase tracking-wide text-blue-700 mb-2" style={{ fontFamily: 'Poppins_600SemiBold' }}>
            {eyebrow}
          </Text>
        ) : null}
        <Text className="text-3xl text-black mb-2" style={{ fontFamily: 'Poppins_700Bold' }}>
          {title}
        </Text>
        <Text className="text-gray-600 text-sm leading-6" style={{ fontFamily: 'Poppins_400Regular' }}>
          {description}
        </Text>
      </View>

      <ScrollView className="flex-1 px-6" contentContainerStyle={{ paddingBottom: 40 }}>
        <View className="bg-black rounded-3xl p-5 mb-6">
          <Text className="text-white text-lg mb-3" style={{ fontFamily: 'Poppins_700Bold' }}>
            Why people choose BuildMyHouse
          </Text>
          {bulletPoints.map((point) => (
            <View key={point} className="flex-row items-start mb-2">
              <CheckCircle2 size={16} color="#22c55e" strokeWidth={2.5} style={{ marginTop: 2 }} />
              <Text className="text-white/90 text-sm ml-2 flex-1" style={{ fontFamily: 'Poppins_400Regular' }}>
                {point}
              </Text>
            </View>
          ))}
        </View>

        {processSteps.length > 0 && (
          <View className="bg-gray-50 border border-gray-200 rounded-2xl p-4 mb-6">
            <Text className="text-black text-base mb-3" style={{ fontFamily: 'Poppins_700Bold' }}>
              {processTitle}
            </Text>
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

        {faqs.length > 0 && (
          <View className="mb-6">
            <Text className="text-black text-xl mb-3" style={{ fontFamily: 'Poppins_700Bold' }}>
              Frequently asked questions
            </Text>
            {faqs.map((faq) => (
              <View key={faq.question} className="bg-white border border-gray-200 rounded-2xl p-4 mb-3">
                <Text className="text-black text-sm mb-2" style={{ fontFamily: 'Poppins_600SemiBold' }}>
                  {faq.question}
                </Text>
                <Text className="text-gray-600 text-sm" style={{ fontFamily: 'Poppins_400Regular' }}>
                  {faq.answer}
                </Text>
              </View>
            ))}
          </View>
        )}

        {internalLinks.length > 0 ? <InternalLinksBlock links={internalLinks} /> : null}

        <TouchableOpacity
          onPress={() => {
            trackWebEvent('seo_start_project_click', {
              page_title: title,
              cta_label: ctaLabel,
              cta_href: ctaHref,
            });
            router.push(ctaHref as any);
          }}
          className="bg-blue-600 rounded-full py-4 px-5 mb-3"
        >
          <Text className="text-white text-center text-base" style={{ fontFamily: 'Poppins_700Bold' }}>
            {ctaLabel}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

