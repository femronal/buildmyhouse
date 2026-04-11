import { Linking, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import { SeoHeading } from '@/components/seo/SeoHeading';
import InternalLinksBlock from '@/components/seo/InternalLinksBlock';
import TrustBlocks from '@/components/seo/TrustBlocks';
import SeoCoverImage from '@/components/seo/SeoCoverImage';
import { cardShadowStyle } from '@/lib/card-styles';
import { useWebSeo } from '@/lib/seo';
import { trackWebEvent } from '@/lib/analytics';
import { lagosBuildingPermitsAndStageInspectionsPageContent as content } from '@/lib/lagos-building-permits-and-stage-inspections-content';

const lagosGuideCoverImage = require('@/assets/images/lagos-building-permits-image.png');

function resolveInternalHref(href: string) {
  return href === '/projects/new' ? '/location?mode=explore' : href;
}

function openLink(href: string, router: ReturnType<typeof useRouter>) {
  if (href.startsWith('http://') || href.startsWith('https://')) {
    Linking.openURL(href);
    return;
  }
  router.push(resolveInternalHref(href) as any);
}

function LeadMagnetCard({ compact = false }: { compact?: boolean }) {
  const router = useRouter();

  return (
    <View style={cardShadowStyle} className={`bg-black rounded-2xl ${compact ? 'p-4 mb-6' : 'p-5 mb-8'}`}>
      <SeoHeading level={2} className="text-white text-xl mb-2" style={{ fontFamily: 'Poppins_700Bold' }}>
        {content.pdfLeadMagnet.title}
      </SeoHeading>
      <Text className="text-white/85 text-sm leading-6 mb-3" style={{ fontFamily: 'Poppins_400Regular' }}>
        {content.pdfLeadMagnet.description}
      </Text>
      <View className="flex-col md:flex-row gap-3">
        <TouchableOpacity
          onPress={() => openLink(content.pdfLeadMagnet.primaryCta.href, router)}
          className="rounded-full bg-white px-5 py-3"
        >
          <Text className="text-black text-sm text-center" style={{ fontFamily: 'Poppins_700Bold' }}>
            {content.pdfLeadMagnet.primaryCta.label}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => openLink(content.pdfLeadMagnet.secondaryCta.href, router)}
          className="rounded-full border border-white/40 px-5 py-3"
        >
          <Text className="text-white text-sm text-center" style={{ fontFamily: 'Poppins_600SemiBold' }}>
            {content.pdfLeadMagnet.secondaryCta.label}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function LagosBuildingPermitsGuidePage() {
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
          <SeoCoverImage source={lagosGuideCoverImage} alt={content.hero.title} />
          <Text className="text-gray-700 text-base leading-7 mb-5 md:text-lg" style={{ fontFamily: 'Poppins_400Regular' }}>
            {content.hero.description}
          </Text>
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

        <View style={cardShadowStyle} className="bg-black rounded-2xl p-5 mb-7">
          <SeoHeading level={2} className="text-white text-xl mb-2" style={{ fontFamily: 'Poppins_700Bold' }}>
            {content.ruleOfThumb.title}
          </SeoHeading>
          {content.ruleOfThumb.paragraphs.map((paragraph) => (
            <Text key={paragraph} className="text-white/90 text-sm leading-7 mb-2" style={{ fontFamily: 'Poppins_400Regular' }}>
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
            {content.whyThisMatters.title}
          </SeoHeading>
          {content.whyThisMatters.paragraphs.map((paragraph) => (
            <Text key={paragraph} className="text-gray-700 text-sm leading-7 mb-3" style={{ fontFamily: 'Poppins_400Regular' }}>
              {paragraph}
            </Text>
          ))}
        </View>

        <View className="mb-7">
          <SeoHeading level={2} className="text-black text-2xl mb-3" style={{ fontFamily: 'Poppins_700Bold' }}>
            {content.permitsExplained.title}
          </SeoHeading>
          {content.permitsExplained.sections.map((section) => (
            <View key={section.heading} style={cardShadowStyle} className="bg-white border border-gray-200 rounded-2xl p-4 mb-3">
              <SeoHeading level={3} className="text-black text-base mb-2" style={{ fontFamily: 'Poppins_700Bold' }}>
                {section.heading}
              </SeoHeading>
              <Text className="text-gray-700 text-sm leading-7" style={{ fontFamily: 'Poppins_400Regular' }}>
                {section.text}
              </Text>
            </View>
          ))}
        </View>

        <View className="mb-7">
          <SeoHeading level={2} className="text-black text-2xl mb-3" style={{ fontFamily: 'Poppins_700Bold' }}>
            {content.diasporaActionGuide.title}
          </SeoHeading>
          {content.diasporaActionGuide.steps.map((step) => (
            <View key={step.heading} className="mb-4">
              <SeoHeading level={3} className="text-black text-base mb-2" style={{ fontFamily: 'Poppins_700Bold' }}>
                {step.heading}
              </SeoHeading>
              {step.items.map((item) => (
                <Text key={item} className="text-gray-700 text-sm leading-6 mb-1.5" style={{ fontFamily: 'Poppins_400Regular' }}>
                  • {item}
                </Text>
              ))}
            </View>
          ))}
        </View>

        <View className="mb-7">
          <SeoHeading level={2} className="text-black text-2xl mb-3" style={{ fontFamily: 'Poppins_700Bold' }}>
            {content.stageControl.title}
          </SeoHeading>
          {content.stageControl.paragraphs.map((paragraph) => (
            <Text key={paragraph} className="text-gray-700 text-sm leading-7 mb-3" style={{ fontFamily: 'Poppins_400Regular' }}>
              {paragraph}
            </Text>
          ))}
          <Text className="text-black text-sm leading-7" style={{ fontFamily: 'Poppins_600SemiBold' }}>
            Action principle: do not proceed to the next stage if the current stage is not genuinely complete.
          </Text>
        </View>

        <TrustBlocks
          blocks={[
            {
              key: 'common_mistakes',
              title: content.commonMistakes.title,
              bullets: [...content.commonMistakes.items],
            },
            {
              key: 'proof_of_process',
              title: content.buildMyHouseAngle.title,
              description: content.buildMyHouseAngle.paragraphs.join(' '),
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

        <View style={cardShadowStyle} className="bg-white border border-gray-200 rounded-2xl p-5 mb-7">
          <SeoHeading level={2} className="text-black text-xl mb-3" style={{ fontFamily: 'Poppins_700Bold' }}>
            {content.learnMoreLinks.title}
          </SeoHeading>
          {content.learnMoreLinks.links.map((link) => (
            <TouchableOpacity key={link.href} onPress={() => openLink(link.href, router)} className="border border-gray-200 rounded-xl px-3 py-2.5 mb-2 bg-gray-50">
              <Text className="text-gray-900 text-sm" style={{ fontFamily: 'Poppins_600SemiBold' }}>
                {link.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View className="mb-7">
          <SeoHeading level={2} className="text-black text-2xl mb-4" style={{ fontFamily: 'Poppins_700Bold' }}>
            {content.faq.title}
          </SeoHeading>
          {content.faq.items.map((faq) => (
            <View key={faq.question} style={cardShadowStyle} className="bg-white border border-gray-200 rounded-2xl p-4 mb-3">
              <SeoHeading level={3} className="text-black text-base mb-2" style={{ fontFamily: 'Poppins_600SemiBold' }}>
                {faq.question}
              </SeoHeading>
              <Text className="text-gray-700 text-sm leading-7" style={{ fontFamily: 'Poppins_400Regular' }}>
                {faq.answer}
              </Text>
            </View>
          ))}
        </View>

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
                trackWebEvent('lagos_guide_primary_cta_click', { href: content.cta.primary.href });
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
                trackWebEvent('lagos_guide_secondary_cta_click', { href: content.cta.secondary.href });
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

