import { Linking, Platform, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import { SeoHeading } from '@/components/seo/SeoHeading';
import { SeoContentBackButton, SeoContentColumn, SeoContentShell, seoContentTypography } from '@/components/seo/SeoContentLayout';
import CollapsibleFaqSection from '@/components/seo/CollapsibleFaqSection';
import InternalLinksBlock from '@/components/seo/InternalLinksBlock';
import SeoCoverImage from '@/components/seo/SeoCoverImage';
import { cardShadowStyle } from '@/lib/card-styles';
import { trackWebEvent } from '@/lib/analytics';
import { constructionLagosLandingPageContent as content } from '@/lib/construction-lagos-landing-content';

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

function Section({
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

function CtaButton({
  label,
  href,
  variant = 'primary',
  eventName,
}: {
  label: string;
  href: string;
  variant?: 'primary' | 'secondary' | 'darkSecondary';
  eventName?: string;
}) {
  const router = useRouter();
  const className =
    variant === 'primary'
      ? 'rounded-full bg-black px-5 py-3'
      : variant === 'darkSecondary'
        ? 'rounded-full border border-white/40 px-5 py-3'
        : 'rounded-full border border-gray-300 px-5 py-3';
  const textClassName =
    variant === 'primary'
      ? 'text-white text-sm text-center'
      : variant === 'darkSecondary'
        ? 'text-white text-sm text-center'
        : 'text-gray-900 text-sm text-center';

  return (
    <TouchableOpacity
      onPress={() => {
        if (eventName) {
          trackWebEvent(eventName, { href, cta_label: label });
        }
        openLink(href, router);
      }}
      className={className}
    >
      <Text className={textClassName} style={{ fontFamily: variant === 'primary' ? 'Poppins_700Bold' : 'Poppins_600SemiBold' }}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

function BulletCard({
  title,
  items,
  dark = false,
}: {
  title: string;
  items: readonly string[];
  dark?: boolean;
}) {
  return (
    <View
      style={cardShadowStyle}
      className={`${dark ? 'bg-black' : 'bg-white border border-gray-200'} rounded-2xl p-5 mb-7`}
    >
      <SeoHeading level={2} className={`${dark ? 'text-white' : 'text-black'} text-xl mb-3`} style={{ fontFamily: 'Poppins_700Bold' }}>
        {title}
      </SeoHeading>
      {items.map((item) => (
        <View key={item} className="flex-row items-start mb-2">
          <Text className={`${dark ? 'text-white/90' : 'text-gray-700'} mr-2`} style={{ fontFamily: 'Poppins_400Regular' }}>
            •
          </Text>
          <Text className={`${dark ? 'text-white/90' : 'text-gray-700'} text-sm leading-6 flex-1`} style={{ fontFamily: 'Poppins_400Regular' }}>
            {item}
          </Text>
        </View>
      ))}
    </View>
  );
}

export default function ConstructionLagosLandingPage() {
  const router = useRouter();
  const showStickyMobileCta = Platform.OS === 'web';

  return (
    <SeoContentShell contentContainerStyle={{ paddingBottom: showStickyMobileCta ? 120 : 40 }}
      footer={showStickyMobileCta ? (
        <View className="absolute bottom-0 left-0 right-0 md:hidden px-4 pb-4 pt-3 bg-white border-t border-gray-200">
          <Text className="text-gray-500 text-xs text-center mb-2" style={{ fontFamily: 'Poppins_400Regular' }}>
            No commitment required - start with project intake.
          </Text>
          <TouchableOpacity
            onPress={() => {
              trackWebEvent('construction_lagos_sticky_mobile_cta_click', {
                href: content.finalCta.primaryCta.href,
                cta_label: 'Start your Lagos project',
              });
              openLink(content.finalCta.primaryCta.href, router);
            }}
            className="bg-black rounded-full py-4 px-5"
          >
            <Text className="text-white text-center text-base" style={{ fontFamily: 'Poppins_700Bold' }}>
              Start your Lagos project
            </Text>
          </TouchableOpacity>
        </View>
      ) : null}>
      <SeoContentColumn>
        <View className="pt-10 pb-2 md:pt-14 md:pb-4">
          <SeoContentBackButton fallbackHref="/login" />

          <Text className="text-[11px] uppercase tracking-wide text-gray-500 mb-2" style={{ fontFamily: 'Poppins_600SemiBold' }}>
            {content.hero.eyebrow}
          </Text>
          <SeoHeading level={1} className={seoContentTypography.title} style={{ fontFamily: 'Poppins_700Bold' }}>
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
            <CtaButton label={content.hero.primaryCta.label} href={content.hero.primaryCta.href} eventName="construction_lagos_hero_primary_click" />
            <CtaButton label={content.hero.secondaryCta.label} href={content.hero.secondaryCta.href} variant="secondary" eventName="construction_lagos_hero_secondary_click" />
          </View>
        </View>

        <Section title={content.hook.title} paragraphs={content.hook.paragraphs} />
        <BulletCard title={content.bestFor.title} items={content.bestFor.items} />
        <BulletCard title={content.whatYouGet.title} items={content.whatYouGet.items} />
        <BulletCard title={content.quickAnswer.title} items={content.quickAnswer.items} dark />
        <Section title={content.lagosReality.title} paragraphs={content.lagosReality.paragraphs} />
        <Section title={content.whatBuildMyHouseDoes.title} paragraphs={content.whatBuildMyHouseDoes.paragraphs} />

        <View style={cardShadowStyle} className="bg-gray-50 border border-gray-200 rounded-2xl p-5 mb-7">
          <SeoHeading level={2} className="text-black text-xl mb-3" style={{ fontFamily: 'Poppins_700Bold' }}>
            {content.howItHelps.title}
          </SeoHeading>
          {content.howItHelps.steps.map((step, index) => (
            <View key={step} className="flex-row items-start mb-3">
              <View className="w-7 h-7 rounded-full bg-black items-center justify-center mr-3 mt-0.5">
                <Text className="text-white text-xs" style={{ fontFamily: 'Poppins_700Bold' }}>
                  {index + 1}
                </Text>
              </View>
              <Text className="text-gray-700 text-sm leading-6 flex-1" style={{ fontFamily: 'Poppins_400Regular' }}>
                {step}
              </Text>
            </View>
          ))}
        </View>

        <View className="mb-7">
          <SeoHeading level={2} className="text-black text-2xl mb-3" style={{ fontFamily: 'Poppins_700Bold' }}>
            {content.stages.title}
          </SeoHeading>
          {content.stages.items.map((stage) => (
            <View key={stage.title} style={cardShadowStyle} className="bg-white border border-gray-200 rounded-2xl p-4 mb-3">
              <SeoHeading level={3} className="text-black text-base mb-2" style={{ fontFamily: 'Poppins_700Bold' }}>
                {stage.title}
              </SeoHeading>
              <Text className="text-gray-700 text-sm leading-6 mb-2" style={{ fontFamily: 'Poppins_400Regular' }}>
                <Text style={{ fontFamily: 'Poppins_700Bold' }}>What happens: </Text>
                {stage.happens}
              </Text>
              <Text className="text-gray-700 text-sm leading-6 mb-2" style={{ fontFamily: 'Poppins_400Regular' }}>
                <Text style={{ fontFamily: 'Poppins_700Bold' }}>Proof to expect: </Text>
                {stage.proof}
              </Text>
              <Text className="text-gray-700 text-sm leading-6" style={{ fontFamily: 'Poppins_400Regular' }}>
                <Text style={{ fontFamily: 'Poppins_700Bold' }}>Mistake to avoid: </Text>
                {stage.mistake}
              </Text>
            </View>
          ))}
        </View>

        <BulletCard title={content.whatGoesWrong.title} items={content.whatGoesWrong.items} />
        <BulletCard title={content.trust.title} items={content.trust.items} dark />

        <View style={cardShadowStyle} className="bg-white border border-gray-200 rounded-2xl p-5 mb-7">
          <SeoHeading level={2} className="text-black text-xl mb-3" style={{ fontFamily: 'Poppins_700Bold' }}>
            {content.paymentDiscipline.title}
          </SeoHeading>
          {content.paymentDiscipline.paragraphs.map((paragraph) => (
            <BodyText key={paragraph}>{paragraph}</BodyText>
          ))}
          <CtaButton label={content.paymentDiscipline.cta.label} href={content.paymentDiscipline.cta.href} eventName="construction_lagos_payment_schedule_click" />
        </View>

        <View className="mb-7">
          <SeoHeading level={2} className="text-black text-2xl mb-3" style={{ fontFamily: 'Poppins_700Bold' }}>
            {content.diaspora.title}
          </SeoHeading>
          {content.diaspora.paragraphs.map((paragraph) => (
            <BodyText key={paragraph}>{paragraph}</BodyText>
          ))}
          <View className="flex-row flex-wrap gap-2 mt-1">
            {content.diaspora.links.map((link) => (
              <TouchableOpacity key={link.href} onPress={() => openLink(link.href, router)} className="bg-gray-100 rounded-full px-3 py-2">
                <Text className="text-gray-900 text-xs" style={{ fontFamily: 'Poppins_600SemiBold' }}>
                  {link.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={cardShadowStyle} className="bg-gray-50 border border-gray-200 rounded-2xl p-5 mb-7">
          <SeoHeading level={2} className="text-black text-xl mb-3" style={{ fontFamily: 'Poppins_700Bold' }}>
            {content.permits.title}
          </SeoHeading>
          {content.permits.paragraphs.map((paragraph) => (
            <BodyText key={paragraph}>{paragraph}</BodyText>
          ))}
          <CtaButton label={content.permits.cta.label} href={content.permits.cta.href} eventName="construction_lagos_permits_click" />
        </View>

        <View className="mb-7">
          <SeoHeading level={2} className="text-black text-2xl mb-3" style={{ fontFamily: 'Poppins_700Bold' }}>
            {content.tools.title}
          </SeoHeading>
          {content.tools.cards.map((tool) => (
            <TouchableOpacity
              key={tool.href}
              onPress={() => openLink(tool.href, router)}
              style={cardShadowStyle}
              className="bg-white border border-gray-200 rounded-2xl p-4 mb-3"
            >
              <SeoHeading level={3} className="text-black text-base mb-1" style={{ fontFamily: 'Poppins_700Bold' }}>
                {tool.title}
              </SeoHeading>
              <Text className="text-gray-700 text-sm leading-6" style={{ fontFamily: 'Poppins_400Regular' }}>
                {tool.description}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={cardShadowStyle} className="bg-gray-50 border border-gray-200 rounded-2xl p-5 mb-7">
          <SeoHeading level={2} className="text-black text-xl mb-3" style={{ fontFamily: 'Poppins_700Bold' }}>
            {content.notReadyYet.title}
          </SeoHeading>
          <View className="flex-col gap-2">
            {content.notReadyYet.links.map((link) => (
              <TouchableOpacity key={link.href} onPress={() => openLink(link.href, router)} className="rounded-xl border border-gray-200 bg-white px-3 py-3">
                <Text className="text-gray-900 text-sm" style={{ fontFamily: 'Poppins_600SemiBold' }}>
                  {link.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <CollapsibleFaqSection title={content.faq.title} items={content.faq.items} className="mb-7" />
        <InternalLinksBlock title={content.internalLinks.title} links={[...content.internalLinks.links]} />

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
                trackWebEvent('construction_lagos_final_primary_click', { href: content.finalCta.primaryCta.href });
                openLink(content.finalCta.primaryCta.href, router);
              }}
              className="rounded-full bg-white px-5 py-3"
            >
              <Text className="text-black text-sm text-center" style={{ fontFamily: 'Poppins_700Bold' }}>
                {content.finalCta.primaryCta.label}
              </Text>
            </TouchableOpacity>
            <CtaButton
              label={content.finalCta.secondaryCta.label}
              href={content.finalCta.secondaryCta.href}
              variant="darkSecondary"
              eventName="construction_lagos_final_secondary_click"
            />
          </View>
        </View>
      </SeoContentColumn>
    </SeoContentShell>
  );
}
