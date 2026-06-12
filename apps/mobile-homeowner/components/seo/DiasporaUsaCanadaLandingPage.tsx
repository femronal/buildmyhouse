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
import { diasporaUsaCanadaLandingPageContent as content } from '@/lib/diaspora-usa-canada-landing-content';

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

function BodyText({ children }: { children: string }) {
  return (
    <Text className="text-gray-700 text-sm leading-7 mb-3" style={{ fontFamily: 'Poppins_400Regular' }}>
      {children}
    </Text>
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
        if (eventName) trackWebEvent(eventName, { href, cta_label: label });
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

function BulletCard({ title, items, dark = false }: { title: string; items: readonly string[]; dark?: boolean }) {
  return (
    <View style={cardShadowStyle} className={`${dark ? 'bg-black' : 'bg-white border border-gray-200'} rounded-2xl p-5 mb-7`}>
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

function LinkPills({ links }: { links: readonly { label: string; href: string }[] }) {
  const router = useRouter();
  return (
    <View className="flex-row flex-wrap gap-2 mt-1">
      {links.map((link) => (
        <TouchableOpacity key={link.href} onPress={() => openLink(link.href, router)} className="bg-gray-100 rounded-full px-3 py-2">
          <Text className="text-gray-900 text-xs" style={{ fontFamily: 'Poppins_600SemiBold' }}>
            {link.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

function SectionCtaRow({
  primaryLabel,
  primaryHref,
  secondaryLabel,
  secondaryHref,
  eventPrefix,
}: {
  primaryLabel: string;
  primaryHref: string;
  secondaryLabel: string;
  secondaryHref: string;
  eventPrefix: string;
}) {
  return (
    <View className="flex-col md:flex-row gap-3 mt-3">
      <CtaButton label={primaryLabel} href={primaryHref} eventName={`${eventPrefix}_primary_click`} />
      <CtaButton label={secondaryLabel} href={secondaryHref} variant="secondary" eventName={`${eventPrefix}_secondary_click`} />
    </View>
  );
}

export default function DiasporaUsaCanadaLandingPage() {
  const router = useRouter();
  const showStickyMobileCta = Platform.OS === 'web';

  return (
    <SeoContentShell contentContainerStyle={{ paddingBottom: showStickyMobileCta ? 160 : 44 }}
      footer={showStickyMobileCta ? (
        <View className="absolute bottom-0 left-0 right-0 md:hidden px-4 pb-5 pt-3 bg-white/95 border-t border-gray-200">
          <TouchableOpacity
            onPress={() => {
              trackWebEvent('diaspora_us_canada_sticky_mobile_cta_click', { href: content.finalCta.primaryCta.href });
              openLink(content.finalCta.primaryCta.href, router);
            }}
            className="bg-black rounded-full py-4 px-5"
          >
            <Text className="text-white text-center text-base" style={{ fontFamily: 'Poppins_700Bold' }}>
              Start your Nigeria project
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
          <SeoCoverImage source={require('@/assets/images/blog-2.png')} alt={content.coverImage.alt} aspectRatio={16 / 9} className="mb-5" />
          <View className="flex-col md:flex-row gap-3">
            <CtaButton label={content.hero.primaryCta.label} href={content.hero.primaryCta.href} eventName="diaspora_us_canada_hero_primary_click" />
            <CtaButton label={content.hero.secondaryCta.label} href={content.hero.secondaryCta.href} variant="secondary" eventName="diaspora_us_canada_hero_secondary_click" />
          </View>
        </View>

        <View className="mb-7">
          <SeoHeading level={2} className="text-black text-2xl mb-3" style={{ fontFamily: 'Poppins_700Bold' }}>
            {content.hook.title}
          </SeoHeading>
          {content.hook.paragraphs.map((p) => (
            <BodyText key={p}>{p}</BodyText>
          ))}
        </View>

        <View style={cardShadowStyle} className="bg-gray-50 border border-gray-200 rounded-2xl p-5 mb-7">
          <SeoHeading level={2} className="text-black text-xl mb-3" style={{ fontFamily: 'Poppins_700Bold' }}>
            {content.whatBmhIs.title}
          </SeoHeading>
          {content.whatBmhIs.paragraphs.map((p) => (
            <BodyText key={p}>{p}</BodyText>
          ))}
          <SectionCtaRow
            primaryLabel="Start Your Nigeria Project"
            primaryHref="/projects/new"
            secondaryLabel="See How Project Tracking Works"
            secondaryHref="/demo/project-monitoring"
            eventPrefix="diaspora_us_canada_what_bmh"
          />
        </View>

        <BulletCard title={content.quickAnswer.title} items={content.quickAnswer.items} />

        <View className="mb-7">
          <SeoHeading level={2} className="text-black text-2xl mb-3" style={{ fontFamily: 'Poppins_700Bold' }}>
            {content.usaCanadaReality.title}
          </SeoHeading>
          {content.usaCanadaReality.paragraphs.map((p) => (
            <BodyText key={p}>{p}</BodyText>
          ))}
        </View>

        <View style={cardShadowStyle} className="bg-white border border-gray-200 rounded-2xl p-5 mb-7">
          <SeoHeading level={2} className="text-black text-xl mb-3" style={{ fontFamily: 'Poppins_700Bold' }}>
            {content.scamFear.title}
          </SeoHeading>
          {content.scamFear.paragraphs.map((p) => (
            <BodyText key={p}>{p}</BodyText>
          ))}
          <SectionCtaRow
            primaryLabel={content.scamFear.secondaryCta.label}
            primaryHref={content.scamFear.secondaryCta.href}
            secondaryLabel={content.scamFear.cta.label}
            secondaryHref={content.scamFear.cta.href}
            eventPrefix="diaspora_us_canada_scam_fear"
          />
        </View>

        <BulletCard title={content.mistakes.title} items={content.mistakes.items} />

        <View style={cardShadowStyle} className="bg-gray-50 border border-gray-200 rounded-2xl p-5 mb-7">
          <SeoHeading level={2} className="text-black text-xl mb-3" style={{ fontFamily: 'Poppins_700Bold' }}>
            {content.howBmhHelps.title}
          </SeoHeading>
          {content.howBmhHelps.steps.map((step, i) => (
            <View key={step} className="flex-row items-start mb-2">
              <View className="w-6 h-6 rounded-full bg-black items-center justify-center mr-2 mt-0.5">
                <Text className="text-white text-xs" style={{ fontFamily: 'Poppins_700Bold' }}>
                  {i + 1}
                </Text>
              </View>
              <Text className="text-gray-700 text-sm leading-6 flex-1" style={{ fontFamily: 'Poppins_400Regular' }}>
                {step}
              </Text>
            </View>
          ))}
        </View>

        <BulletCard title={content.trust.title} items={content.trust.items} dark />

        <View style={cardShadowStyle} className="bg-white border border-gray-200 rounded-2xl p-5 mb-7">
          <SeoHeading level={2} className="text-black text-xl mb-3" style={{ fontFamily: 'Poppins_700Bold' }}>
            {content.payment.title}
          </SeoHeading>
          {content.payment.paragraphs.map((p) => (
            <BodyText key={p}>{p}</BodyText>
          ))}
          <SectionCtaRow
            primaryLabel={content.payment.secondaryCta.label}
            primaryHref={content.payment.secondaryCta.href}
            secondaryLabel={content.payment.cta.label}
            secondaryHref={content.payment.cta.href}
            eventPrefix="diaspora_us_canada_payment"
          />
        </View>

        <View className="mb-7">
          <SeoHeading level={2} className="text-black text-2xl mb-3" style={{ fontFamily: 'Poppins_700Bold' }}>
            {content.family.title}
          </SeoHeading>
          {content.family.paragraphs.map((p) => (
            <BodyText key={p}>{p}</BodyText>
          ))}
          <SectionCtaRow
            primaryLabel={content.family.secondaryCta.label}
            primaryHref={content.family.secondaryCta.href}
            secondaryLabel={content.family.cta.label}
            secondaryHref={content.family.cta.href}
            eventPrefix="diaspora_us_canada_family"
          />
        </View>

        <View className="mb-7">
          <SeoHeading level={2} className="text-black text-2xl mb-3" style={{ fontFamily: 'Poppins_700Bold' }}>
            {content.timezone.title}
          </SeoHeading>
          {content.timezone.paragraphs.map((p) => (
            <BodyText key={p}>{p}</BodyText>
          ))}
        </View>

        <View className="mb-7">
          <SeoHeading level={2} className="text-black text-2xl mb-3" style={{ fontFamily: 'Poppins_700Bold' }}>
            {content.projectTypes.title}
          </SeoHeading>
          {content.projectTypes.cards.map((card) => (
            <View key={card.title} style={cardShadowStyle} className="bg-white border border-gray-200 rounded-2xl p-4 mb-3">
              <SeoHeading level={3} className="text-black text-base mb-2" style={{ fontFamily: 'Poppins_700Bold' }}>
                {card.title}
              </SeoHeading>
              <Text className="text-gray-700 text-sm leading-6 mb-2" style={{ fontFamily: 'Poppins_400Regular' }}>
                <Text style={{ fontFamily: 'Poppins_700Bold' }}>Description: </Text>
                {card.description}
              </Text>
              <Text className="text-gray-700 text-sm leading-6 mb-2" style={{ fontFamily: 'Poppins_400Regular' }}>
                <Text style={{ fontFamily: 'Poppins_700Bold' }}>Without structure, what can go wrong: </Text>
                {card.risk}
              </Text>
              <Text className="text-gray-700 text-sm leading-6" style={{ fontFamily: 'Poppins_400Regular' }}>
                <Text style={{ fontFamily: 'Poppins_700Bold' }}>What BuildMyHouse helps track: </Text>
                {card.track}
              </Text>
            </View>
          ))}
        </View>

        <BulletCard title={content.proof.title} items={content.proof.items} />

        <View style={cardShadowStyle} className="bg-gray-50 border border-gray-200 rounded-2xl p-5 mb-7">
          <SeoHeading level={2} className="text-black text-xl mb-3" style={{ fontFamily: 'Poppins_700Bold' }}>
            {content.cityCompliance.title}
          </SeoHeading>
          {content.cityCompliance.paragraphs.map((p) => (
            <BodyText key={p}>{p}</BodyText>
          ))}
          <LinkPills links={content.cityCompliance.links} />
        </View>

        <View className="mb-7">
          <SeoHeading level={2} className="text-black text-2xl mb-3" style={{ fontFamily: 'Poppins_700Bold' }}>
            {content.comparison.title}
          </SeoHeading>
          <View style={cardShadowStyle} className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
            <View className="flex-row bg-gray-50 border-b border-gray-200">
              <View className="flex-1 p-3 border-r border-gray-200">
                <Text className="text-gray-900 text-sm" style={{ fontFamily: 'Poppins_700Bold' }}>
                  {content.comparison.leftTitle}
                </Text>
              </View>
              <View className="flex-1 p-3">
                <Text className="text-gray-900 text-sm" style={{ fontFamily: 'Poppins_700Bold' }}>
                  {content.comparison.rightTitle}
                </Text>
              </View>
            </View>
            {content.comparison.rows.map((row) => (
              <View key={row.left} className="flex-row border-b last:border-b-0 border-gray-100">
                <View className="flex-1 p-3 border-r border-gray-100">
                  <Text className="text-gray-600 text-xs leading-5" style={{ fontFamily: 'Poppins_500Medium' }}>
                    {row.left}
                  </Text>
                </View>
                <View className="flex-1 p-3">
                  <Text className="text-gray-800 text-xs leading-5" style={{ fontFamily: 'Poppins_600SemiBold' }}>
                    {row.right}
                  </Text>
                </View>
              </View>
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
                trackWebEvent('diaspora_us_canada_final_primary_click', { href: content.finalCta.primaryCta.href });
                openLink(content.finalCta.primaryCta.href, router);
              }}
              className="rounded-full bg-white px-5 py-3"
            >
              <Text className="text-black text-sm text-center" style={{ fontFamily: 'Poppins_700Bold' }}>
                {content.finalCta.primaryCta.label}
              </Text>
            </TouchableOpacity>
            <CtaButton label={content.finalCta.secondaryCta.label} href={content.finalCta.secondaryCta.href} variant="darkSecondary" eventName="diaspora_us_canada_final_secondary_click" />
          </View>
          <View className="mt-3">
            <Text className="text-white/70 text-xs" style={{ fontFamily: 'Poppins_400Regular' }}>
              Start now or preview the tracking demo first.
            </Text>
          </View>
        </View>
      </SeoContentColumn>
    </SeoContentShell>
  );
}
