import { Platform, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Brush, CheckCircle2, FileText, Hammer, HardHat, Sofa, Trees, Wrench } from 'lucide-react-native';
import BrandedLottieCover from '@/components/seo/BrandedLottieCover';
import CollapsibleFaqSection from '@/components/seo/CollapsibleFaqSection';
import InternalLinksBlock from '@/components/seo/InternalLinksBlock';
import MilestoneCalculator from '@/components/seo/MilestoneCalculator';
import { SeoHeading } from '@/components/seo/SeoHeading';
import { SeoContentBackButton, SeoContentColumn, SeoContentShell, seoContentTypography } from '@/components/seo/SeoContentLayout';
import { cardShadowStyle } from '@/lib/card-styles';
import { milestonePaymentScheduleBuilderPageContent as content } from '@/lib/milestone-payment-schedule-builder-content';
import { useWebSeo } from '@/lib/seo';

function stageIconFor(name: string) {
  const normalized = name.toLowerCase();
  if (normalized.includes('foundation') || normalized.includes('site preparation')) return HardHat;
  if (normalized.includes('structural') || normalized.includes('repairs') || normalized.includes('systems')) return Hammer;
  if (normalized.includes('wall') || normalized.includes('surface') || normalized.includes('strip-out')) return Wrench;
  if (normalized.includes('interior') || normalized.includes('finishes') || normalized.includes('styling')) return Sofa;
  if (normalized.includes('exterior') || normalized.includes('landscaping')) return Trees;
  if (normalized.includes('planning') || normalized.includes('measurement') || normalized.includes('procurement')) return FileText;
  return Brush;
}

function guidanceRange(projectType: string, index: number) {
  const ranges: Record<string, string[]> = {
    'New build': ['usually 25% to 35%', 'usually 20% to 30%', 'usually 10% to 15%', 'usually 10% to 15%', 'usually 15% to 25%', 'usually 5% to 10%'],
    Renovation: ['usually 10% to 15%', 'usually 20% to 30%', 'usually 10% to 20%', 'usually 10% to 15%', 'usually 20% to 30%', 'usually 5% to 10%'],
    'Interior design': ['usually 5% to 10%', 'usually 35% to 50%', 'usually 10% to 15%', 'usually 20% to 30%', 'usually 5% to 10%'],
  };
  return ranges[projectType]?.[index] || 'use your project reality';
}

export default function MilestonePaymentScheduleBuilderPage() {
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
        document.getElementById('builder')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        return;
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
          <BrandedLottieCover
            animationUrl="/lottie/mortgage-schedule.json"
            label="Payment schedule illustration"
            placeholder="schedule"
            className="mb-4"
            height={220}
          />
          <View className="flex-col md:flex-row gap-3 mb-4">
            <TouchableOpacity onPress={() => openLink(content.hero.primaryCta.href)} className="rounded-full bg-black px-5 py-3">
              <Text className="text-white text-sm text-center" style={{ fontFamily: 'Poppins_700Bold' }}>
                Start
              </Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => openLink('/start')} className="rounded-full border border-gray-300 px-5 py-3">
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

        <MilestoneCalculator />

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
          <SeoHeading level={2} className="text-black text-lg mb-3" style={{ fontFamily: 'Poppins_700Bold' }}>
            {content.suggestedDefaults.title}
          </SeoHeading>
          <View className="flex-col md:flex-row md:flex-wrap md:justify-between">
            {Object.entries(content.suggestedDefaults.byProjectType).map(([type, defaults]) => (
              <View key={type} className="mb-3 md:w-[48%] border border-gray-200 rounded-xl p-3 bg-gray-50">
                <Text className="text-gray-900 text-sm mb-2" style={{ fontFamily: 'Poppins_600SemiBold' }}>
                  {type}
                </Text>
                {defaults.map((stageName, index) => {
                  const Icon = stageIconFor(stageName);
                  return (
                    <View key={`${type}-${stageName}`} className="flex-row items-start mb-2">
                      <Icon size={16} color="#4b5563" style={{ marginTop: 2 }} />
                      <Text className="text-gray-700 text-sm leading-6 ml-2 flex-1" style={{ fontFamily: 'Poppins_400Regular' }}>
                        {stageName} - {guidanceRange(type, index)}
                      </Text>
                    </View>
                  );
                })}
              </View>
            ))}
          </View>
          <Text className="text-xs text-gray-500 mt-1" style={{ fontFamily: 'Poppins_400Regular' }}>
            These are guidance examples only, not fixed rules. Adjust based on your project scope and site reality.
          </Text>
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
            <TouchableOpacity onPress={() => openLink(content.cta.primary.href)} className="rounded-full bg-black px-5 py-3">
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
