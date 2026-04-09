import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, CheckCircle2 } from 'lucide-react-native';
import InternalLinksBlock, { InternalLinkItem } from '@/components/seo/InternalLinksBlock';
import { SeoHeading } from '@/components/seo/SeoHeading';
import { trackWebEvent } from '@/lib/analytics';
import type { SeoContentSection } from '@/lib/seo-pages';
import { cardShadowStyle } from '@/lib/card-styles';

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
  preWhySections?: SeoContentSection[];
  whySectionTitle?: string;
  afterWhySections?: SeoContentSection[];
  postProcessSections?: SeoContentSection[];
};

export function SeoRichSection({ section }: { section: SeoContentSection }) {
  const isSnippet = section.variant === 'snippet';
  const wrapClass = isSnippet
    ? 'border border-blue-200 bg-blue-50 rounded-2xl p-4 mb-6'
    : 'mb-6';

  return (
    <View className={wrapClass}>
      <SeoHeading level={2} className="text-black text-lg mb-2" style={{ fontFamily: 'Poppins_700Bold' }}>
        {section.heading}
      </SeoHeading>
      {section.paragraphs?.map((p) => (
        <Text
          key={p.slice(0, 48)}
          className="text-gray-700 text-sm leading-6 mb-2"
          style={{ fontFamily: 'Poppins_400Regular' }}
        >
          {p}
        </Text>
      ))}
      {section.bullets?.map((b) => (
        <View key={b} className="flex-row items-start mb-1.5 pl-1">
          <Text className="text-gray-700 mr-2" style={{ fontFamily: 'Poppins_400Regular' }}>
            •
          </Text>
          <Text className="text-gray-700 text-sm flex-1 leading-6" style={{ fontFamily: 'Poppins_400Regular' }}>
            {b}
          </Text>
        </View>
      ))}
      {section.paragraphsAfterBullets?.map((p) => (
        <Text
          key={p.slice(0, 48)}
          className="text-gray-700 text-sm leading-6 mb-2 mt-1"
          style={{ fontFamily: 'Poppins_400Regular' }}
        >
          {p}
        </Text>
      ))}
      {section.secondaryBullets?.map((b) => (
        <View key={b} className="flex-row items-start mb-1.5 pl-1">
          <Text className="text-gray-700 mr-2" style={{ fontFamily: 'Poppins_400Regular' }}>
            •
          </Text>
          <Text className="text-gray-700 text-sm flex-1 leading-6" style={{ fontFamily: 'Poppins_400Regular' }}>
            {b}
          </Text>
        </View>
      ))}
      {section.closingParagraph ? (
        <Text className="text-gray-700 text-sm leading-6 mt-2" style={{ fontFamily: 'Poppins_400Regular' }}>
          {section.closingParagraph}
        </Text>
      ) : null}
    </View>
  );
}

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
  preWhySections = [],
  whySectionTitle = 'Why people choose BuildMyHouse',
  afterWhySections = [],
  postProcessSections = [],
}: SeoLandingPageProps) {
  const router = useRouter();

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
            {title}
          </SeoHeading>
          <Text
            className="text-gray-600 text-xs leading-5 md:text-sm md:leading-6"
            style={{ fontFamily: 'Poppins_400Regular' }}
          >
            {description}
          </Text>
        </View>
        {preWhySections.map((section) => (
          <SeoRichSection key={section.heading} section={section} />
        ))}

        <View className="bg-black rounded-3xl p-5 mb-6">
          <SeoHeading level={2} className="text-white text-lg mb-3" style={{ fontFamily: 'Poppins_700Bold' }}>
            {whySectionTitle}
          </SeoHeading>
          {bulletPoints.map((point) => (
            <View key={point} className="flex-row items-start mb-2">
              <CheckCircle2 size={16} color="#22c55e" strokeWidth={2.5} style={{ marginTop: 2 }} />
              <Text className="text-white/90 text-sm ml-2 flex-1" style={{ fontFamily: 'Poppins_400Regular' }}>
                {point}
              </Text>
            </View>
          ))}
        </View>

        {afterWhySections.map((section) => (
          <SeoRichSection key={section.heading} section={section} />
        ))}

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

        {postProcessSections.map((section) => (
          <SeoRichSection key={section.heading} section={section} />
        ))}

        {faqs.length > 0 && (
          <View className="mb-6">
            <SeoHeading level={2} className="text-black text-xl mb-3" style={{ fontFamily: 'Poppins_700Bold' }}>
              Frequently asked questions
            </SeoHeading>
            {faqs.map((faq) => (
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
