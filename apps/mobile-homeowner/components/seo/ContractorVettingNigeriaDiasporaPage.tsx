import { Image, Linking, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, BadgeCheck, FileCheck2, IdCard } from 'lucide-react-native';
import { SeoHeading } from '@/components/seo/SeoHeading';
import InternalLinksBlock from '@/components/seo/InternalLinksBlock';
import CollapsibleFaqSection from '@/components/seo/CollapsibleFaqSection';
import { cardShadowStyle } from '@/lib/card-styles';
import { useWebSeo } from '@/lib/seo';
import { trackWebEvent } from '@/lib/analytics';
import { contractorVettingNigeriaDiasporaPageContent as content } from '@/lib/contractor-vetting-nigeria-diaspora-content';

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

function verificationDocumentIcon(name: string) {
  if (name.includes('ID')) return IdCard;
  if (name.includes('Certificate')) return BadgeCheck;
  return FileCheck2;
}

export default function ContractorVettingNigeriaDiasporaPage() {
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
          <Text className="text-gray-700 text-base leading-7 mb-4 md:text-lg" style={{ fontFamily: 'Poppins_400Regular' }}>
            {content.hero.description}
          </Text>
          <View className="w-full rounded-2xl overflow-hidden border border-gray-200 mb-5" style={{ height: 210 }}>
            <Image
              source={{ uri: content.coverImage.src }}
              accessibilityLabel={content.coverImage.alt}
              resizeMode="cover"
              style={{ width: '100%', height: '100%' }}
            />
          </View>
        </View>

        <View style={cardShadowStyle} className="bg-black rounded-2xl p-5 mb-6">
          <SeoHeading level={2} className="text-white text-xl mb-2" style={{ fontFamily: 'Poppins_700Bold' }}>
            {content.hook.title}
          </SeoHeading>
          {content.hook.paragraphs.map((paragraph) => (
            <Text key={paragraph} className="text-white/90 text-sm leading-7 mb-2" style={{ fontFamily: 'Poppins_400Regular' }}>
              {paragraph}
            </Text>
          ))}
        </View>

        <View className="flex-col md:flex-row gap-3 mb-6">
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

        <View style={cardShadowStyle} className="bg-gray-50 border border-gray-200 rounded-2xl p-5 mb-6">
          <SeoHeading level={2} className="text-black text-xl mb-3" style={{ fontFamily: 'Poppins_700Bold' }}>
            {content.quickAnswer.title}
          </SeoHeading>
          {content.quickAnswer.items.map((item) => (
            <Text key={item} className="text-gray-700 text-sm leading-6 mb-2" style={{ fontFamily: 'Poppins_400Regular' }}>
              • {item}
            </Text>
          ))}
        </View>

        <View className="mb-6">
          {content.intro.paragraphs.map((paragraph) => (
            <Text key={paragraph} className="text-gray-700 text-sm leading-7 mb-3" style={{ fontFamily: 'Poppins_400Regular' }}>
              {paragraph}
            </Text>
          ))}
        </View>

        <View className="mb-6">
          <SeoHeading level={2} className="text-black text-2xl mb-3" style={{ fontFamily: 'Poppins_700Bold' }}>
            {content.story.title}
          </SeoHeading>
          {content.story.paragraphs.map((paragraph) => (
            <Text key={paragraph} className="text-gray-700 text-sm leading-7 mb-3" style={{ fontFamily: 'Poppins_400Regular' }}>
              {paragraph}
            </Text>
          ))}
        </View>

        <View className="mb-6">
          <SeoHeading level={2} className="text-black text-2xl mb-3" style={{ fontFamily: 'Poppins_700Bold' }}>
            {content.whyVettingMatters.title}
          </SeoHeading>
          {content.whyVettingMatters.paragraphs.map((paragraph) => (
            <Text key={paragraph} className="text-gray-700 text-sm leading-7 mb-3" style={{ fontFamily: 'Poppins_400Regular' }}>
              {paragraph}
            </Text>
          ))}
        </View>

        <View className="mb-6">
          <SeoHeading level={2} className="text-black text-2xl mb-3" style={{ fontFamily: 'Poppins_700Bold' }}>
            {content.whatToCheck.title}
          </SeoHeading>
          {content.whatToCheck.sections.map((section) => (
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

        <View style={cardShadowStyle} className="bg-white border border-gray-200 rounded-2xl p-5 mb-6">
          <SeoHeading level={2} className="text-black text-xl mb-3" style={{ fontFamily: 'Poppins_700Bold' }}>
            {content.redFlags.title}
          </SeoHeading>
          {content.redFlags.items.map((item) => (
            <Text key={item} className="text-gray-700 text-sm leading-6 mb-2" style={{ fontFamily: 'Poppins_400Regular' }}>
              • {item}
            </Text>
          ))}
        </View>

        <View style={cardShadowStyle} className="bg-black rounded-3xl p-6 mb-7">
          <SeoHeading level={2} className="text-white text-2xl mb-3" style={{ fontFamily: 'Poppins_700Bold' }}>
            {content.proofOfProcess.title}
          </SeoHeading>
          {content.proofOfProcess.paragraphs.map((paragraph) => (
            <Text key={paragraph} className="text-white/90 text-sm leading-7 mb-2" style={{ fontFamily: 'Poppins_400Regular' }}>
              {paragraph}
            </Text>
          ))}

          <SeoHeading level={3} className="text-white text-lg mt-3 mb-2" style={{ fontFamily: 'Poppins_700Bold' }}>
            {content.proofOfProcess.introTitle}
          </SeoHeading>
          {content.proofOfProcess.introParagraphs.map((paragraph) => (
            <Text key={paragraph} className="text-white/90 text-sm leading-7 mb-2" style={{ fontFamily: 'Poppins_400Regular' }}>
              {paragraph}
            </Text>
          ))}

          <SeoHeading level={3} className="text-white text-lg mt-4 mb-3" style={{ fontFamily: 'Poppins_700Bold' }}>
            {content.proofOfProcess.verificationTitle}
          </SeoHeading>
          {content.proofOfProcess.documents.map((document) => {
            const Icon = verificationDocumentIcon(document.name);
            return (
              <View key={document.name} className="bg-white/5 border border-white/15 rounded-2xl p-4 mb-3">
                <View className="flex-row items-center mb-2">
                  <Icon size={16} color="#e5e7eb" />
                  <Text className="text-white text-base ml-2 flex-1" style={{ fontFamily: 'Poppins_700Bold' }}>
                    {document.name}
                  </Text>
                </View>
                <Text className="text-white/90 text-xs mb-1.5" style={{ fontFamily: 'Poppins_700Bold' }}>
                  Why it matters
                </Text>
                <Text className="text-white/90 text-sm leading-6 mb-2" style={{ fontFamily: 'Poppins_400Regular' }}>
                  {document.whyItMatters}
                </Text>
                <Text className="text-white/90 text-xs mb-1.5" style={{ fontFamily: 'Poppins_700Bold' }}>
                  How it helps later if something goes wrong
                </Text>
                <Text className="text-white/90 text-sm leading-6" style={{ fontFamily: 'Poppins_400Regular' }}>
                  {document.howItHelpsLater}
                </Text>
              </View>
            );
          })}

          <SeoHeading level={3} className="text-white text-lg mt-3 mb-2" style={{ fontFamily: 'Poppins_700Bold' }}>
            {content.proofOfProcess.whyThisMattersTitle}
          </SeoHeading>
          {content.proofOfProcess.whyThisMattersParagraphs.map((paragraph) => (
            <Text key={paragraph} className="text-white/90 text-sm leading-7 mb-2" style={{ fontFamily: 'Poppins_400Regular' }}>
              {paragraph}
            </Text>
          ))}

          <SeoHeading level={3} className="text-white text-lg mt-3 mb-2" style={{ fontFamily: 'Poppins_700Bold' }}>
            {content.proofOfProcess.summaryTitle}
          </SeoHeading>
          {content.proofOfProcess.summaryPoints.map((point) => (
            <Text key={point} className="text-white/90 text-sm leading-6 mb-1.5" style={{ fontFamily: 'Poppins_400Regular' }}>
              • {point}
            </Text>
          ))}

          <Text className="text-white text-sm leading-7 mt-2" style={{ fontFamily: 'Poppins_600SemiBold' }}>
            {content.proofOfProcess.closingParagraph}
          </Text>
        </View>

        <View style={cardShadowStyle} className="bg-white border border-gray-200 rounded-2xl p-5 mb-6">
          <SeoHeading level={2} className="text-black text-xl mb-3" style={{ fontFamily: 'Poppins_700Bold' }}>
            {content.questionsToAsk.title}
          </SeoHeading>
          {content.questionsToAsk.items.map((item) => (
            <Text key={item} className="text-gray-700 text-sm leading-6 mb-2" style={{ fontFamily: 'Poppins_400Regular' }}>
              • {item}
            </Text>
          ))}
        </View>

        <View className="mb-6">
          <SeoHeading level={2} className="text-black text-2xl mb-3" style={{ fontFamily: 'Poppins_700Bold' }}>
            {content.paymentsAndControl.title}
          </SeoHeading>
          {content.paymentsAndControl.paragraphs.map((paragraph) => (
            <Text key={paragraph} className="text-gray-700 text-sm leading-7 mb-3" style={{ fontFamily: 'Poppins_400Regular' }}>
              {paragraph}
            </Text>
          ))}
        </View>

        <View style={cardShadowStyle} className="bg-gray-100 border border-gray-300 rounded-2xl p-5 mb-6">
          <SeoHeading level={2} className="text-black text-xl mb-3" style={{ fontFamily: 'Poppins_700Bold' }}>
            {content.buildMyHouseAngle.cardTitle}
          </SeoHeading>
          {content.buildMyHouseAngle.cardItems.map((item) => (
            <Text key={item} className="text-gray-700 text-sm leading-6 mb-2" style={{ fontFamily: 'Poppins_400Regular' }}>
              • {item}
            </Text>
          ))}
          <SeoHeading level={3} className="text-black text-base mt-2 mb-2" style={{ fontFamily: 'Poppins_700Bold' }}>
            {content.buildMyHouseAngle.sectionTitle}
          </SeoHeading>
          {content.buildMyHouseAngle.paragraphs.map((paragraph) => (
            <Text key={paragraph} className="text-gray-700 text-sm leading-7 mb-2" style={{ fontFamily: 'Poppins_400Regular' }}>
              {paragraph}
            </Text>
          ))}
        </View>

        <View style={cardShadowStyle} className="bg-white border border-gray-200 rounded-2xl p-5 mb-6">
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

        <View style={cardShadowStyle} className="bg-white border border-gray-200 rounded-2xl p-5 mb-6">
          <SeoHeading level={2} className="text-black text-xl mb-3" style={{ fontFamily: 'Poppins_700Bold' }}>
            {content.mistakes.title}
          </SeoHeading>
          {content.mistakes.items.map((item) => (
            <Text key={item} className="text-gray-700 text-sm leading-6 mb-2" style={{ fontFamily: 'Poppins_400Regular' }}>
              • {item}
            </Text>
          ))}
        </View>

        <CollapsibleFaqSection title={content.faq.title} items={content.faq.items} className="mb-7" />

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
                trackWebEvent('contractor_vetting_primary_cta_click', { href: content.cta.primary.href });
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
                trackWebEvent('contractor_vetting_secondary_cta_click', { href: content.cta.secondary.href });
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
