import { Linking, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import { SeoHeading } from '@/components/seo/SeoHeading';
import InternalLinksBlock from '@/components/seo/InternalLinksBlock';
import CollapsibleFaqSection from '@/components/seo/CollapsibleFaqSection';
import SeoCoverImage from '@/components/seo/SeoCoverImage';
import TrustBlocks from '@/components/seo/TrustBlocks';
import { cardShadowStyle } from '@/lib/card-styles';
import { useWebSeo } from '@/lib/seo';
import { trackWebEvent } from '@/lib/analytics';
import { renovationPermitLagosRepairVsRenovationPageContent as content } from '@/lib/renovation-permit-lagos-repair-vs-renovation-content';

function resolveInternalHref(href: string) {
  if (href.startsWith('/projects/new')) {
    const query = href.includes('?') ? `&${href.split('?')[1]}` : '';
    return `/location?mode=explore${query}`;
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

function BodyText({ children }: { children: string }) {
  return (
    <Text className="text-gray-700 text-sm leading-7 mb-3" style={{ fontFamily: 'Poppins_400Regular' }}>
      {children}
    </Text>
  );
}

function ParagraphSection({
  title,
  paragraphs,
}: {
  title: string;
  paragraphs: readonly string[];
}) {
  return (
    <View className="mb-7">
      <SeoHeading level={2} className="text-black text-2xl mb-3" style={{ fontFamily: 'Poppins_700Bold' }}>
        {title}
      </SeoHeading>
      {paragraphs.map((paragraph) => (
        <BodyText key={paragraph}>{paragraph}</BodyText>
      ))}
    </View>
  );
}

function BulletListCard({
  title,
  items,
  closing,
  tone = 'light',
}: {
  title: string;
  items: readonly string[];
  closing?: string;
  tone?: 'light' | 'dark';
}) {
  const isDark = tone === 'dark';

  return (
    <View
      style={cardShadowStyle}
      className={`${isDark ? 'bg-black' : 'bg-white border border-gray-200'} rounded-2xl p-5 mb-7`}
    >
      <SeoHeading
        level={2}
        className={`${isDark ? 'text-white' : 'text-black'} text-xl mb-3`}
        style={{ fontFamily: 'Poppins_700Bold' }}
      >
        {title}
      </SeoHeading>
      {items.map((item) => (
        <View key={item} className="flex-row items-start mb-2">
          <Text className={`${isDark ? 'text-white/90' : 'text-gray-700'} mr-2`} style={{ fontFamily: 'Poppins_400Regular' }}>
            •
          </Text>
          <Text className={`${isDark ? 'text-white/90' : 'text-gray-700'} text-sm leading-6 flex-1`} style={{ fontFamily: 'Poppins_400Regular' }}>
            {item}
          </Text>
        </View>
      ))}
      {closing ? (
        <Text className={`${isDark ? 'text-white' : 'text-gray-800'} text-sm leading-7 mt-2`} style={{ fontFamily: 'Poppins_600SemiBold' }}>
          {closing}
        </Text>
      ) : null}
    </View>
  );
}

function LeadMagnetCard() {
  const router = useRouter();

  return (
    <View style={cardShadowStyle} className="bg-black rounded-3xl p-6 mb-7">
      <SeoHeading level={2} className="text-white text-2xl mb-2" style={{ fontFamily: 'Poppins_700Bold' }}>
        {content.leadMagnet.title}
      </SeoHeading>
      <Text className="text-white/85 text-sm leading-7 mb-4" style={{ fontFamily: 'Poppins_400Regular' }}>
        {content.leadMagnet.description}
      </Text>
      <View className="flex-col md:flex-row gap-3">
        <TouchableOpacity onPress={() => openLink(content.leadMagnet.primaryCta.href, router)} className="rounded-full bg-white px-5 py-3">
          <Text className="text-black text-sm text-center" style={{ fontFamily: 'Poppins_700Bold' }}>
            {content.leadMagnet.primaryCta.label}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => openLink(content.leadMagnet.secondaryCta.href, router)} className="rounded-full border border-white/40 px-5 py-3">
          <Text className="text-white text-sm text-center" style={{ fontFamily: 'Poppins_600SemiBold' }}>
            {content.leadMagnet.secondaryCta.label}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function RenovationPermitLagosRepairVsRenovationPage() {
  const router = useRouter();
  const canonicalPath = content.seo.canonical.replace('https://buildmyhouse.app', '');
  const robots = content.seo.robots.replace(/\s+/g, '') as 'index,follow' | 'noindex,nofollow';

  useWebSeo({
    title: content.seo.title,
    description: content.seo.description,
    canonicalPath,
    robots,
    ogImage: content.coverImage.src,
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
          <Text className="text-gray-700 text-base leading-7 mb-5 md:text-lg" style={{ fontFamily: 'Poppins_400Regular' }}>
            {content.hero.description}
          </Text>
          <SeoCoverImage
            source={{ uri: content.coverImage.src }}
            alt={content.coverImage.alt}
            aspectRatio={16 / 9}
            className="mb-5"
          />
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
            {content.hook.title}
          </SeoHeading>
          {content.hook.paragraphs.map((paragraph) => (
            <BodyText key={paragraph}>{paragraph}</BodyText>
          ))}
        </View>

        <BulletListCard title={content.quickAnswer.title} items={content.quickAnswer.items} tone="dark" />

        <View className="mb-7">
          {content.intro.paragraphs.map((paragraph) => (
            <BodyText key={paragraph}>{paragraph}</BodyText>
          ))}
        </View>

        <ParagraphSection title={content.officialMeaning.title} paragraphs={content.officialMeaning.paragraphs} />

        <BulletListCard title={content.simpleExamples.title} items={content.simpleExamples.items} closing={content.simpleExamples.closing} />
        <BulletListCard title={content.cautionExamples.title} items={content.cautionExamples.items} closing={content.cautionExamples.closing} />

        <ParagraphSection title={content.diasporaProblem.title} paragraphs={content.diasporaProblem.paragraphs} />

        <View className="mb-7">
          <SeoHeading level={2} className="text-black text-2xl mb-3" style={{ fontFamily: 'Poppins_700Bold' }}>
            {content.practicalTest.title}
          </SeoHeading>
          {content.practicalTest.paragraphs.map((paragraph) => (
            <BodyText key={paragraph}>{paragraph}</BodyText>
          ))}
          {content.practicalTest.items.map((item) => (
            <Text key={item} className="text-gray-700 text-sm leading-6 mb-2" style={{ fontFamily: 'Poppins_400Regular' }}>
              • {item}
            </Text>
          ))}
          <Text className="text-black text-sm leading-7 mt-2" style={{ fontFamily: 'Poppins_600SemiBold' }}>
            {content.practicalTest.closing}
          </Text>
        </View>

        <ParagraphSection title={content.stageControl.title} paragraphs={content.stageControl.paragraphs} />

        <View className="mb-7">
          <SeoHeading level={2} className="text-black text-2xl mb-3" style={{ fontFamily: 'Poppins_700Bold' }}>
            {content.lagosActionGuide.title}
          </SeoHeading>
          {content.lagosActionGuide.steps.map((step) => (
            <View key={step.heading} style={cardShadowStyle} className="bg-white border border-gray-200 rounded-2xl p-4 mb-3">
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

        <View style={cardShadowStyle} className="bg-white border border-gray-200 rounded-2xl p-5 mb-7">
          <SeoHeading level={2} className="text-black text-xl mb-3" style={{ fontFamily: 'Poppins_700Bold' }}>
            {content.governmentLinks.title}
          </SeoHeading>
          {content.governmentLinks.links.map((link) => (
            <TouchableOpacity key={link.href} onPress={() => openLink(link.href, router)} className="border border-gray-200 rounded-xl px-3 py-2.5 mb-2 bg-gray-50">
              <Text className="text-gray-900 text-sm" style={{ fontFamily: 'Poppins_600SemiBold' }}>
                {link.label}
              </Text>
              <Text className="text-gray-500 text-xs mt-1" style={{ fontFamily: 'Poppins_400Regular' }}>
                {link.href}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={cardShadowStyle} className="bg-gray-100 border border-gray-300 rounded-2xl p-5 mb-7">
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
            <BodyText key={paragraph}>{paragraph}</BodyText>
          ))}
        </View>

        <LeadMagnetCard />

        <View style={cardShadowStyle} className="bg-white border border-gray-200 rounded-2xl p-5 mb-7">
          <SeoHeading level={2} className="text-black text-xl mb-3" style={{ fontFamily: 'Poppins_700Bold' }}>
            {content.publicDemoTeaser.title}
          </SeoHeading>
          {content.publicDemoTeaser.paragraphs.map((paragraph) => (
            <BodyText key={paragraph}>{paragraph}</BodyText>
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

        <TrustBlocks
          blocks={[
            {
              key: 'common_mistakes',
              title: content.mistakes.title,
              bullets: [...content.mistakes.items],
            },
          ]}
        />

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
                trackWebEvent('lagos_repair_vs_renovation_primary_cta_click', { href: content.cta.primary.href });
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
                trackWebEvent('lagos_repair_vs_renovation_secondary_cta_click', { href: content.cta.secondary.href });
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
