import { Image, Platform, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { CheckCircle2, Hammer } from 'lucide-react-native';
import CollapsibleFaqSection from '@/components/seo/CollapsibleFaqSection';
import InternalLinksBlock from '@/components/seo/InternalLinksBlock';
import RenovationBudgetCalculator from '@/components/seo/RenovationBudgetCalculator';
import { SeoHeading } from '@/components/seo/SeoHeading';
import { SeoContentBackButton, SeoContentColumn, SeoContentShell, seoContentTypography } from '@/components/seo/SeoContentLayout';
import { cardShadowStyle } from '@/lib/card-styles';
import { renovationBudgetPlannerPageContent as content } from '@/lib/renovation-budget-planner-content';
import { useWebSeo } from '@/lib/seo';

export default function RenovationBudgetPlannerPage() {
  const router = useRouter();
  const canonicalPath = content.seo.canonical.replace('https://buildmyhouse.app', '');
  const normalizedRobots = content.seo.robots.replace(/\s+/g, '') as 'index,follow' | 'noindex,nofollow';

  useWebSeo({
    title: content.seo.title,
    description: content.seo.description,
    canonicalPath,
    robots: normalizedRobots,
    jsonLd: content.faqSchema,
  });

  const openLink = (href: string) => {
    if (href.startsWith('#')) {
      if (Platform.OS === 'web') {
        document.getElementById('planner')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
      return;
    }
    router.push(href as never);
  };

  return (
    <SeoContentShell contentContainerStyle={{ paddingBottom: 40 }}>
      <SeoContentColumn>
        <View className="pt-10 pb-2 md:pt-14 md:pb-4">
          <SeoContentBackButton fallbackHref="/" />
          <Text className="text-[11px] uppercase tracking-wide text-gray-500 mb-2" style={{ fontFamily: 'Poppins_600SemiBold' }}>
            {content.hero.eyebrow}
          </Text>
          <SeoHeading level={1} className={seoContentTypography.title} style={{ fontFamily: 'Poppins_700Bold' }}>
            {content.hero.title}
          </SeoHeading>
          <Text className={seoContentTypography.description} style={{ fontFamily: 'Poppins_400Regular' }}>
            {content.hero.description}
          </Text>
          <View className="hidden md:flex w-full rounded-2xl overflow-hidden border border-gray-200 mb-4" style={{ height: 210 }}>
            <Image
              source={{ uri: content.coverImage.src }}
              accessibilityLabel={content.coverImage.alt}
              resizeMode="cover"
              style={{ width: '100%', height: '100%' }}
            />
          </View>
          <View className="flex-col md:flex-row gap-3 mb-4">
            <TouchableOpacity onPress={() => openLink(content.hero.primaryCta.href)} className="rounded-full bg-black px-5 py-3">
              <Text className="text-white text-sm text-center" style={{ fontFamily: 'Poppins_700Bold' }}>
                {content.hero.primaryCta.label}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => openLink('/start/upgrade')} className="rounded-full border border-gray-300 px-5 py-3">
              <Text className="text-gray-900 text-sm text-center" style={{ fontFamily: 'Poppins_600SemiBold' }}>
                {content.hero.secondaryCta.label}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {content.intro.paragraphs.map((paragraph) => (
          <Text key={paragraph} className="text-gray-700 text-sm leading-7 mb-3" style={{ fontFamily: 'Poppins_400Regular' }}>
            {paragraph}
          </Text>
        ))}

        <RenovationBudgetCalculator />

        <View style={cardShadowStyle} className="bg-white border border-gray-200 rounded-2xl p-4 mb-5">
          <SeoHeading level={2} className="text-black text-lg mb-3" style={{ fontFamily: 'Poppins_700Bold' }}>
            {content.whatThisToolDoes.title}
          </SeoHeading>
          {content.whatThisToolDoes.items.map((item) => (
            <View key={item} className="flex-row items-start mb-2">
              <CheckCircle2 size={16} color="#4b5563" strokeWidth={2.1} style={{ marginTop: 2 }} />
              <Text className="text-gray-700 text-sm leading-6 ml-2 flex-1" style={{ fontFamily: 'Poppins_400Regular' }}>
                {item}
              </Text>
            </View>
          ))}
        </View>

        <View style={cardShadowStyle} className="bg-gray-100 border border-gray-300 rounded-2xl p-4 mb-5">
          <SeoHeading level={2} className="text-black text-lg mb-2" style={{ fontFamily: 'Poppins_700Bold' }}>
            {content.simpleExplanation.title}
          </SeoHeading>
          {content.simpleExplanation.paragraphs.map((paragraph) => (
            <Text key={paragraph} className="text-gray-700 text-sm leading-7 mb-2" style={{ fontFamily: 'Poppins_400Regular' }}>
              {paragraph}
            </Text>
          ))}
        </View>

        <View style={cardShadowStyle} className="bg-black rounded-2xl p-4 mb-6">
          <SeoHeading level={2} className="text-white text-lg mb-2" style={{ fontFamily: 'Poppins_700Bold' }}>
            {content.smartWarnings.title}
          </SeoHeading>
          {content.smartWarnings.items.map((item) => (
            <Text key={item} className="text-white/90 text-sm leading-6 mb-1.5" style={{ fontFamily: 'Poppins_400Regular' }}>
              • {item}
            </Text>
          ))}
        </View>

        <View style={cardShadowStyle} className="bg-white border border-gray-200 rounded-2xl p-4 mb-6">
          <SeoHeading level={2} className="text-black text-lg mb-2" style={{ fontFamily: 'Poppins_700Bold' }}>
            {content.suggestedGuidance.title}
          </SeoHeading>
          {content.suggestedGuidance.items.map((item) => (
            <View key={item} className="flex-row items-start mb-2">
              <Hammer size={16} color="#4b5563" style={{ marginTop: 2 }} />
              <Text className="text-gray-700 text-sm leading-6 ml-2 flex-1" style={{ fontFamily: 'Poppins_400Regular' }}>
                {item}
              </Text>
            </View>
          ))}
        </View>

        <View style={cardShadowStyle} className="bg-white border border-gray-200 rounded-2xl p-4 mb-6">
          <SeoHeading level={2} className="text-black text-lg mb-2" style={{ fontFamily: 'Poppins_700Bold' }}>
            {content.whyItMatters.title}
          </SeoHeading>
          {content.whyItMatters.paragraphs.map((paragraph) => (
            <Text key={paragraph} className="text-gray-700 text-sm leading-7 mb-2" style={{ fontFamily: 'Poppins_400Regular' }}>
              {paragraph}
            </Text>
          ))}
        </View>

        <View style={cardShadowStyle} className="bg-white border border-gray-200 rounded-2xl p-4 mb-6">
          <SeoHeading level={2} className="text-black text-lg mb-2" style={{ fontFamily: 'Poppins_700Bold' }}>
            {content.buildMyHouseFit.title}
          </SeoHeading>
          {content.buildMyHouseFit.paragraphs.map((paragraph) => (
            <Text key={paragraph} className="text-gray-700 text-sm leading-7 mb-2" style={{ fontFamily: 'Poppins_400Regular' }}>
              {paragraph}
            </Text>
          ))}
        </View>

        <InternalLinksBlock title={content.relatedResources.title} links={[...content.relatedResources.links]} />

        <View style={cardShadowStyle} className="bg-gray-100 border border-gray-300 rounded-2xl p-5 mb-6">
          <SeoHeading level={2} className="text-black text-xl mb-2" style={{ fontFamily: 'Poppins_700Bold' }}>
            {content.cta.title}
          </SeoHeading>
          <Text className="text-gray-700 text-sm leading-7 mb-4" style={{ fontFamily: 'Poppins_400Regular' }}>
            {content.cta.description}
          </Text>
          <View className="flex-col md:flex-row gap-3">
            <TouchableOpacity onPress={() => openLink('/start/upgrade')} className="rounded-full bg-black px-5 py-3">
              <Text className="text-white text-sm text-center" style={{ fontFamily: 'Poppins_700Bold' }}>
                {content.cta.primary.label}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => openLink(content.cta.secondary.href)} className="rounded-full border border-gray-300 px-5 py-3">
              <Text className="text-gray-900 text-sm text-center" style={{ fontFamily: 'Poppins_600SemiBold' }}>
                {content.cta.secondary.label}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <CollapsibleFaqSection title={content.faq.title} items={content.faq.items} />
      </SeoContentColumn>
    </SeoContentShell>
  );
}
