import { Image, Linking, Platform, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, CheckCircle2, ChevronRight, MapPin } from 'lucide-react-native';
import CollapsibleFaqSection from '@/components/seo/CollapsibleFaqSection';
import SeoCoverImage from '@/components/seo/SeoCoverImage';
import { SeoHeading } from '@/components/seo/SeoHeading';
import { SeoContentBackButton, SeoContentColumn, SeoContentShell, seoContentTypography } from '@/components/seo/SeoContentLayout';
import { trackWebEvent } from '@/lib/analytics';
import type { ConstructionNigeriaHubContent } from '@/lib/construction-nigeria-hub';
import { cardShadowStyle } from '@/lib/card-styles';

type Props = {
  content: ConstructionNigeriaHubContent;
};

export default function ConstructionNigeriaHub({ content }: Props) {
  const router = useRouter();
  const showStickyMobileCta = Platform.OS === 'web';
  const { eyebrow } = content;

  const openLink = (href: string) => {
    if (href.startsWith('http://') || href.startsWith('https://')) {
      Linking.openURL(href);
      return;
    }
    router.push(href as any);
  };

  const LinkPills = ({ links }: { links?: Array<{ label: string; href: string }> }) => {
    if (!links?.length) return null;
    return (
      <View className="flex-row flex-wrap gap-2 mt-3">
        {links.map((link) => (
          <TouchableOpacity
            key={link.href}
            onPress={() => openLink(link.href)}
            className="bg-gray-100 rounded-full px-3 py-2"
          >
            <Text className="text-gray-900 text-xs" style={{ fontFamily: 'Poppins_600SemiBold' }}>
              {link.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  const Section = ({
    title,
    paragraphs,
    bullets,
    links,
    variant = 'plain',
  }: {
    title: string;
    paragraphs: string[];
    bullets?: string[];
    links?: Array<{ label: string; href: string }>;
    variant?: 'plain' | 'card';
  }) => (
    <View
      style={variant === 'card' ? cardShadowStyle : undefined}
      className={variant === 'card' ? 'bg-white border border-gray-200 rounded-2xl p-5 mb-6' : 'mb-6'}
    >
      <SeoHeading level={2} className="text-black text-xl mb-3" style={{ fontFamily: 'Poppins_700Bold' }}>
        {title}
      </SeoHeading>
      {paragraphs.map((paragraph) => (
        <Text
          key={paragraph}
          className="text-gray-700 text-sm leading-7 mb-2.5"
          style={{ fontFamily: 'Poppins_400Regular' }}
        >
          {paragraph}
        </Text>
      ))}
      {bullets?.map((bullet) => (
        <View key={bullet} className="flex-row items-start mb-1.5">
          <Text className="text-gray-700 mr-2" style={{ fontFamily: 'Poppins_400Regular' }}>
            •
          </Text>
          <Text className="text-gray-700 text-sm leading-6 flex-1" style={{ fontFamily: 'Poppins_400Regular' }}>
            {bullet}
          </Text>
        </View>
      ))}
      <LinkPills links={links} />
    </View>
  );

  return (
    <SeoContentShell contentContainerStyle={{ paddingBottom: showStickyMobileCta ? 165 : 44 }}
      footer={showStickyMobileCta ? (
        <View className="absolute bottom-0 left-0 right-0 md:hidden px-4 pb-5 pt-3 bg-white/95 border-t border-gray-200">
          <TouchableOpacity
            onPress={() => {
              trackWebEvent('construction_nigeria_sticky_mobile_cta_click', {
                href: content.finalCta.primaryCta.href,
              });
              openLink(content.finalCta.primaryCta.href);
            }}
            className="bg-black rounded-full py-4 px-5"
          >
            <Text className="text-white text-center text-base" style={{ fontFamily: 'Poppins_700Bold' }}>
              Start your project
            </Text>
          </TouchableOpacity>
        </View>
      ) : null}>
      <SeoContentColumn>
        <View className="pt-10 pb-2 md:pt-14 md:pb-4">
          <SeoContentBackButton fallbackHref="/login" />
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
            className={seoContentTypography.title}
            style={{ fontFamily: 'Poppins_700Bold' }}
          >
            {content.heroTitle}
          </SeoHeading>
          <Text
            className={seoContentTypography.description}
            style={{ fontFamily: 'Poppins_400Regular' }}
          >
            {content.heroDescription}
          </Text>
          <SeoCoverImage
            source={require('@/assets/images/blog-1 image.png')}
            alt={content.coverImage.alt}
            aspectRatio={16 / 9}
            className="my-4"
          />
          <View className="flex-col md:flex-row gap-3">
            <TouchableOpacity
              onPress={() => {
                trackWebEvent('construction_nigeria_hero_primary_click', {
                  href: content.heroPrimaryCta.href,
                });
                openLink(content.heroPrimaryCta.href);
              }}
              className="rounded-full bg-black px-5 py-3"
            >
              <Text className="text-white text-sm text-center" style={{ fontFamily: 'Poppins_700Bold' }}>
                {content.heroPrimaryCta.label}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => {
                trackWebEvent('construction_nigeria_hero_secondary_click', {
                  href: content.heroSecondaryCta.href,
                });
                openLink(content.heroSecondaryCta.href);
              }}
              className="rounded-full border border-gray-300 px-5 py-3"
            >
              <Text className="text-gray-900 text-sm text-center" style={{ fontFamily: 'Poppins_600SemiBold' }}>
                {content.heroSecondaryCta.label}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <Section title={content.brandClarity.title} paragraphs={content.brandClarity.paragraphs} variant="card" />
        <View style={cardShadowStyle} className="bg-white border border-gray-200 rounded-2xl p-5 mb-6">
          <SeoHeading level={2} className="text-black text-lg mb-3" style={{ fontFamily: 'Poppins_700Bold' }}>
            {content.bestForSection.title}
          </SeoHeading>
          {content.bestForSection.bullets.map((item) => (
            <View key={item} className="flex-row items-start mb-2">
              <CheckCircle2 size={16} color="#111827" strokeWidth={2.2} style={{ marginTop: 2 }} />
              <Text className="text-gray-700 text-sm leading-6 ml-2 flex-1" style={{ fontFamily: 'Poppins_400Regular' }}>
                {item}
              </Text>
            </View>
          ))}
        </View>

        <View className="mb-6">
          <View style={cardShadowStyle} className="bg-gray-50 border border-gray-200 rounded-2xl p-5 mb-3">
            <SeoHeading level={2} className="text-black text-lg mb-3" style={{ fontFamily: 'Poppins_700Bold' }}>
              {content.whatItIsNotSection.title}
            </SeoHeading>
            {content.whatItIsNotSection.bullets.map((item) => (
              <View key={item} className="flex-row items-start mb-2">
                <Text className="text-gray-700 mr-2" style={{ fontFamily: 'Poppins_400Regular' }}>
                  •
                </Text>
                <Text className="text-gray-700 text-sm leading-6 flex-1" style={{ fontFamily: 'Poppins_400Regular' }}>
                  {item}
                </Text>
              </View>
            ))}
          </View>

          <View style={cardShadowStyle} className="bg-gray-50 border border-gray-200 rounded-2xl p-5">
            <SeoHeading level={2} className="text-black text-lg mb-3" style={{ fontFamily: 'Poppins_700Bold' }}>
              {content.whatItGivesYouSection.title}
            </SeoHeading>
            {content.whatItGivesYouSection.bullets.map((item) => (
              <View key={item} className="flex-row items-start mb-2">
                <Text className="text-gray-700 mr-2" style={{ fontFamily: 'Poppins_400Regular' }}>
                  •
                </Text>
                <Text className="text-gray-700 text-sm leading-6 flex-1" style={{ fontFamily: 'Poppins_400Regular' }}>
                  {item}
                </Text>
              </View>
            ))}
          </View>
        </View>

        <Section
          title={content.strongHook.title}
          paragraphs={content.strongHook.paragraphs}
          bullets={content.strongHook.bullets}
          variant="card"
        />

        <View style={cardShadowStyle} className="bg-gray-50 border border-gray-200 rounded-2xl p-5 mb-6">
          <SeoHeading level={2} className="text-black text-xl mb-3" style={{ fontFamily: 'Poppins_700Bold' }}>
            {content.quickAnswer.title}
          </SeoHeading>
          {content.quickAnswer.bullets.map((bullet) => (
            <View key={bullet} className="flex-row items-start mb-2">
              <CheckCircle2 size={16} color="#111827" strokeWidth={2.2} style={{ marginTop: 2 }} />
              <Text className="text-gray-700 text-sm leading-6 ml-2 flex-1" style={{ fontFamily: 'Poppins_400Regular' }}>
                {bullet}
              </Text>
            </View>
          ))}
        </View>

        <View className="mb-6">
          <SeoHeading level={2} className="text-black text-xl mb-3" style={{ fontFamily: 'Poppins_700Bold' }}>
            {content.productLadder.title}
          </SeoHeading>
          <Text className="text-gray-700 text-sm leading-7 mb-3" style={{ fontFamily: 'Poppins_400Regular' }}>
            {content.productLadder.intro}
          </Text>
          {content.productLadder.cards.map((card) => (
            <View key={card.title} style={cardShadowStyle} className="bg-white border border-gray-200 rounded-2xl p-4 mb-3">
              <SeoHeading level={3} className="text-black text-base mb-2" style={{ fontFamily: 'Poppins_700Bold' }}>
                {card.title}
              </SeoHeading>
              <Text className="text-gray-700 text-sm leading-6" style={{ fontFamily: 'Poppins_400Regular' }}>
                {card.points.join(', ')}
              </Text>
            </View>
          ))}
          <Text className="text-gray-700 text-sm leading-7 mt-2" style={{ fontFamily: 'Poppins_400Regular' }}>
            {content.productLadder.outro}
          </Text>
        </View>

        <Section
          title={content.diasporaSection.title}
          paragraphs={content.diasporaSection.paragraphs}
          bullets={content.diasporaSection.bullets}
          links={content.diasporaSection.links}
          variant="card"
        />

        <View style={cardShadowStyle} className="bg-white border border-gray-200 rounded-2xl p-5 mb-6">
          <SeoHeading level={2} className="text-black text-xl mb-3" style={{ fontFamily: 'Poppins_700Bold' }}>
            {content.howItWorks.title}
          </SeoHeading>
          {content.howItWorks.steps.map((step, index) => (
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

        <View className="bg-black rounded-3xl p-5 mb-6">
          <SeoHeading level={2} className="text-white text-xl mb-3" style={{ fontFamily: 'Poppins_700Bold' }}>
            {content.trustBlackSection.title}
          </SeoHeading>
          {content.trustBlackSection.bullets.map((point) => (
            <View key={point} className="flex-row items-start mb-2">
              <CheckCircle2 size={16} color="#22c55e" strokeWidth={2.5} style={{ marginTop: 2 }} />
              <Text className="text-white/90 text-sm ml-2 flex-1" style={{ fontFamily: 'Poppins_400Regular' }}>
                {point}
              </Text>
            </View>
          ))}
        </View>

        <Section
          title={content.visibilitySection.title}
          paragraphs={content.visibilitySection.paragraphs}
          bullets={content.visibilitySection.bullets}
          variant="card"
        />

        <View className="mb-6">
          <SeoHeading level={2} className="text-black text-xl mb-3" style={{ fontFamily: 'Poppins_700Bold' }}>
            {content.monitoringVideoSection.title}
          </SeoHeading>
          <Text className="text-gray-700 text-sm leading-7 mb-3" style={{ fontFamily: 'Poppins_400Regular' }}>
            {content.monitoringVideoSection.description}
          </Text>
          <View style={cardShadowStyle} className="bg-white border border-gray-200 rounded-2xl p-3">
            {Platform.OS === 'web' ? (
              <View style={{ width: '100%', aspectRatio: 16 / 9, borderRadius: 14, overflow: 'hidden' }}>
                {(() => {
                  const Iframe = 'iframe' as any;
                  return (
                    <Iframe
                      title="BuildMyHouse project monitoring video"
                      src={content.monitoringVideoSection.youtubeEmbedUrl}
                      width="100%"
                      height="100%"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                      allowFullScreen
                    />
                  );
                })()}
              </View>
            ) : (
              <TouchableOpacity
                onPress={() => openLink(content.monitoringVideoSection.youtubeUrl)}
                className="bg-black rounded-xl px-4 py-4"
              >
                <Text className="text-white text-center text-sm" style={{ fontFamily: 'Poppins_600SemiBold' }}>
                  Watch project monitoring video
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        <Section
          title={content.constructionServicesSection.title}
          paragraphs={content.constructionServicesSection.paragraphs}
          links={content.constructionServicesSection.links}
          variant="card"
        />
        <Section
          title={content.renovationServicesSection.title}
          paragraphs={content.renovationServicesSection.paragraphs}
          links={content.renovationServicesSection.links}
          variant="card"
        />
        <Section
          title={content.interiorDesignSection.title}
          paragraphs={content.interiorDesignSection.paragraphs}
          links={content.interiorDesignSection.links}
          variant="card"
        />
        <Section
          title={content.contractorTrustSection.title}
          paragraphs={content.contractorTrustSection.paragraphs}
          links={content.contractorTrustSection.links}
          variant="card"
        />

        <View style={cardShadowStyle} className="bg-gray-50 border border-gray-200 rounded-2xl p-5 mb-6">
          <SeoHeading level={2} className="text-black text-xl mb-3" style={{ fontFamily: 'Poppins_700Bold' }}>
            {content.paymentDisciplineSection.title}
          </SeoHeading>
          {content.paymentDisciplineSection.paragraphs.map((paragraph) => (
            <Text
              key={paragraph}
              className="text-gray-700 text-sm leading-7 mb-2"
              style={{ fontFamily: 'Poppins_400Regular' }}
            >
              {paragraph}
            </Text>
          ))}
          <TouchableOpacity
            onPress={() => openLink(content.paymentDisciplineSection.cta.href)}
            className="self-start mt-3 rounded-full border border-gray-300 px-4 py-2.5"
          >
            <Text className="text-gray-900 text-sm" style={{ fontFamily: 'Poppins_600SemiBold' }}>
              {content.paymentDisciplineSection.cta.label}
            </Text>
          </TouchableOpacity>
        </View>

        <View className="mb-6">
          <SeoHeading level={2} className="text-black text-xl mb-3" style={{ fontFamily: 'Poppins_700Bold' }}>
            {content.popularSearchesSection.title}
          </SeoHeading>
          {content.popularSearchesSection.cards.map((card) => (
            <TouchableOpacity
              key={card.href}
              onPress={() => openLink(card.href)}
              style={cardShadowStyle}
              className="bg-white border border-gray-200 rounded-2xl p-4 mb-3"
            >
              <SeoHeading level={3} className="text-black text-base mb-1.5" style={{ fontFamily: 'Poppins_700Bold' }}>
                {card.title}
              </SeoHeading>
              <Text className="text-gray-700 text-sm leading-6" style={{ fontFamily: 'Poppins_400Regular' }}>
                {card.description}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {content.faqs.length > 0 ? <CollapsibleFaqSection title="Frequently Asked Questions" items={content.faqs} className="mb-6" /> : null}

        <View style={cardShadowStyle} className="bg-black rounded-3xl p-6 mb-4">
          <SeoHeading level={2} className="text-white text-2xl mb-2" style={{ fontFamily: 'Poppins_700Bold' }}>
            {content.finalCta.title}
          </SeoHeading>
          <Text className="text-white/85 text-sm leading-7 mb-4" style={{ fontFamily: 'Poppins_400Regular' }}>
            {content.finalCta.description}
          </Text>
          <View className="flex-col md:flex-row gap-3">
            <TouchableOpacity
              onPress={() => {
                trackWebEvent('construction_nigeria_final_primary_click', {
                  href: content.finalCta.primaryCta.href,
                });
                openLink(content.finalCta.primaryCta.href);
              }}
              className="rounded-full bg-white px-5 py-3"
            >
              <Text className="text-black text-sm text-center" style={{ fontFamily: 'Poppins_700Bold' }}>
                {content.finalCta.primaryCta.label}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => {
                trackWebEvent('construction_nigeria_final_secondary_click', {
                  href: content.finalCta.secondaryCta.href,
                });
                openLink(content.finalCta.secondaryCta.href);
              }}
              className="rounded-full border border-white/40 px-5 py-3"
            >
              <Text className="text-white text-sm text-center" style={{ fontFamily: 'Poppins_600SemiBold' }}>
                {content.finalCta.secondaryCta.label}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </SeoContentColumn>
    </SeoContentShell>
  );
}
