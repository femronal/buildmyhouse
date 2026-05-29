import { Image, Linking, Platform, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, ChevronRight, MapPin } from 'lucide-react-native';
import { SeoHeading } from '@/components/seo/SeoHeading';
import CollapsibleFaqSection from '@/components/seo/CollapsibleFaqSection';
import InternalLinksBlock from '@/components/seo/InternalLinksBlock';
import SeoCoverImage from '@/components/seo/SeoCoverImage';
import { cardShadowStyle } from '@/lib/card-styles';
import { trackWebEvent } from '@/lib/analytics';
import { interiorDesignNigeriaLandingPageContent as content } from '@/lib/interior-design-nigeria-landing-content';

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

export default function InteriorDesignNigeriaLandingPage() {
  const router = useRouter();
  const showStickyMobileCta = Platform.OS === 'web';

  return (
    <View className="flex-1 bg-white">
      <ScrollView className="flex-1 px-5 md:px-6" contentContainerStyle={{ paddingBottom: showStickyMobileCta ? 170 : 48 }}>
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
            source={require('@/assets/images/blog-3.png')}
            alt={content.coverImage.alt}
            aspectRatio={16 / 9}
            className="mb-5"
          />
          <View className="flex-col md:flex-row gap-3">
            <CtaButton label={content.hero.primaryCta.label} href={content.hero.primaryCta.href} eventName="interior_nigeria_hero_primary_click" />
            <CtaButton label={content.hero.secondaryCta.label} href={content.hero.secondaryCta.href} variant="secondary" eventName="interior_nigeria_hero_secondary_click" />
          </View>
        </View>

        <View className="mb-6">
          <SeoHeading level={2} className="text-black text-2xl mb-3" style={{ fontFamily: 'Poppins_700Bold' }}>
            {content.intro.title}
          </SeoHeading>
          {content.intro.paragraphs.map((paragraph) => (
            <BodyText key={paragraph}>{paragraph}</BodyText>
          ))}
        </View>

        <View style={cardShadowStyle} className="bg-gray-50 border border-gray-200 rounded-2xl p-5 mb-6">
          <SeoHeading level={2} className="text-black text-xl mb-3" style={{ fontFamily: 'Poppins_700Bold' }}>
            {content.whatBuildMyHouseDoes.title}
          </SeoHeading>
          {content.whatBuildMyHouseDoes.paragraphs.map((paragraph) => (
            <BodyText key={paragraph}>{paragraph}</BodyText>
          ))}
          <SectionCtaRow
            primaryLabel="Start your interior project"
            primaryHref={content.hero.primaryCta.href}
            secondaryLabel="See project monitoring demo"
            secondaryHref="/demo/project-monitoring"
            eventPrefix="interior_nigeria_what_bmh"
          />
        </View>

        <View className="mb-6">
          <SeoHeading level={2} className="text-black text-2xl mb-3" style={{ fontFamily: 'Poppins_700Bold' }}>
            {content.hook.title}
          </SeoHeading>
          {content.hook.paragraphs.map((paragraph) => (
            <BodyText key={paragraph}>{paragraph}</BodyText>
          ))}
        </View>

        <BulletCard title={content.quickAnswer.title} items={content.quickAnswer.items} />

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
                <Text style={{ fontFamily: 'Poppins_700Bold' }}>Common request: </Text>
                {card.commonRequest}
              </Text>
              <Text className="text-gray-700 text-sm leading-6 mb-2" style={{ fontFamily: 'Poppins_400Regular' }}>
                <Text style={{ fontFamily: 'Poppins_700Bold' }}>What can go wrong: </Text>
                {card.canGoWrong}
              </Text>
              <Text className="text-gray-700 text-sm leading-6" style={{ fontFamily: 'Poppins_400Regular' }}>
                <Text style={{ fontFamily: 'Poppins_700Bold' }}>What BMH helps track: </Text>
                {card.bmhTrack}
              </Text>
            </View>
          ))}
        </View>

        <View className="mb-7">
          <SeoHeading level={2} className="text-black text-2xl mb-3" style={{ fontFamily: 'Poppins_700Bold' }}>
            {content.diaspora.title}
          </SeoHeading>
          {content.diaspora.paragraphs.map((paragraph) => (
            <BodyText key={paragraph}>{paragraph}</BodyText>
          ))}
          <LinkPills links={content.diaspora.links} />
          <SectionCtaRow
            primaryLabel={content.diaspora.cta.label}
            primaryHref={content.diaspora.cta.href}
            secondaryLabel={content.diaspora.secondaryCta.label}
            secondaryHref={content.diaspora.secondaryCta.href}
            eventPrefix="interior_nigeria_diaspora"
          />
        </View>

        <View style={cardShadowStyle} className="bg-gray-50 border border-gray-200 rounded-2xl p-5 mb-7">
          <SeoHeading level={2} className="text-black text-xl mb-3" style={{ fontFamily: 'Poppins_700Bold' }}>
            {content.eventDecorators.title}
          </SeoHeading>
          {content.eventDecorators.paragraphs.map((paragraph) => (
            <BodyText key={paragraph}>{paragraph}</BodyText>
          ))}
          <View className="mb-2">
            {content.eventDecorators.useCases.map((item) => (
              <View key={item} className="flex-row items-start mb-1.5">
                <Text className="text-gray-700 mr-2" style={{ fontFamily: 'Poppins_400Regular' }}>
                  •
                </Text>
                <Text className="text-gray-700 text-sm flex-1 leading-6" style={{ fontFamily: 'Poppins_400Regular' }}>
                  {item}
                </Text>
              </View>
            ))}
          </View>
          <SectionCtaRow
            primaryLabel={content.eventDecorators.cta.label}
            primaryHref={content.eventDecorators.cta.href}
            secondaryLabel={content.eventDecorators.secondaryCta.label}
            secondaryHref={content.eventDecorators.secondaryCta.href}
            eventPrefix="interior_nigeria_event_decor"
          />
        </View>

        <View style={cardShadowStyle} className="bg-gray-50 border border-gray-200 rounded-2xl p-5 mb-7">
          <SeoHeading level={2} className="text-black text-xl mb-3" style={{ fontFamily: 'Poppins_700Bold' }}>
            {content.cosmeticRenovation.title}
          </SeoHeading>
          {content.cosmeticRenovation.paragraphs.map((paragraph) => (
            <BodyText key={paragraph}>{paragraph}</BodyText>
          ))}
          <LinkPills links={content.cosmeticRenovation.links} />
          <SectionCtaRow
            primaryLabel={content.cosmeticRenovation.cta.label}
            primaryHref={content.cosmeticRenovation.cta.href}
            secondaryLabel={content.cosmeticRenovation.secondaryCta.label}
            secondaryHref={content.cosmeticRenovation.secondaryCta.href}
            eventPrefix="interior_nigeria_cosmetic"
          />
        </View>

        <View className="mb-7">
          <SeoHeading level={2} className="text-black text-2xl mb-3" style={{ fontFamily: 'Poppins_700Bold' }}>
            {content.process.title}
          </SeoHeading>
          {content.process.items.map((item) => (
            <View key={item.title} style={cardShadowStyle} className="bg-white border border-gray-200 rounded-2xl p-4 mb-3">
              <SeoHeading level={3} className="text-black text-base mb-2" style={{ fontFamily: 'Poppins_700Bold' }}>
                {item.title}
              </SeoHeading>
              <Text className="text-gray-700 text-sm leading-6 mb-2" style={{ fontFamily: 'Poppins_400Regular' }}>
                <Text style={{ fontFamily: 'Poppins_700Bold' }}>What happens: </Text>
                {item.happens}
              </Text>
              <Text className="text-gray-700 text-sm leading-6 mb-2" style={{ fontFamily: 'Poppins_400Regular' }}>
                <Text style={{ fontFamily: 'Poppins_700Bold' }}>Proof to expect: </Text>
                {item.proof}
              </Text>
              <Text className="text-gray-700 text-sm leading-6" style={{ fontFamily: 'Poppins_400Regular' }}>
                <Text style={{ fontFamily: 'Poppins_700Bold' }}>Mistake to avoid: </Text>
                {item.mistake}
              </Text>
            </View>
          ))}
        </View>

        <BulletCard title={content.trust.title} items={content.trust.items} dark />
        <BulletCard title={content.mistakes.title} items={content.mistakes.items} />

        <View style={cardShadowStyle} className="bg-white border border-gray-200 rounded-2xl p-5 mb-7">
          <SeoHeading level={2} className="text-black text-xl mb-3" style={{ fontFamily: 'Poppins_700Bold' }}>
            {content.budget.title}
          </SeoHeading>
          {content.budget.paragraphs.map((paragraph) => (
            <BodyText key={paragraph}>{paragraph}</BodyText>
          ))}
          <SectionCtaRow
            primaryLabel={content.budget.secondaryCta.label}
            primaryHref={content.budget.secondaryCta.href}
            secondaryLabel={content.budget.cta.label}
            secondaryHref={content.budget.cta.href}
            eventPrefix="interior_nigeria_budget"
          />
        </View>

        <BulletCard title={content.proof.title} items={content.proof.items} />

        <View className="mb-7">
          <SeoHeading level={2} className="text-black text-2xl mb-3" style={{ fontFamily: 'Poppins_700Bold' }}>
            {content.ideas.title}
          </SeoHeading>
          {content.ideas.paragraphs.map((paragraph) => (
            <BodyText key={paragraph}>{paragraph}</BodyText>
          ))}
          <CtaButton label={content.ideas.cta.label} href={content.ideas.cta.href} eventName="interior_nigeria_ideas_cta_click" />
        </View>

        <View className="mb-7">
          <SeoHeading level={2} className="text-black text-2xl mb-3" style={{ fontFamily: 'Poppins_700Bold' }}>
            {content.bestFor.title}
          </SeoHeading>
          <View className="flex-col gap-3">
            {content.bestFor.cards.map((card) => (
              <View key={card} style={cardShadowStyle} className="bg-white border border-gray-200 rounded-2xl p-4">
                <Text className="text-gray-800 text-sm leading-6" style={{ fontFamily: 'Poppins_500Medium' }}>
                  {card}
                </Text>
              </View>
            ))}
          </View>
        </View>

        <View className="mb-7">
          <SeoHeading level={2} className="text-black text-2xl mb-3" style={{ fontFamily: 'Poppins_700Bold' }}>
            {content.resources.title}
          </SeoHeading>
          {content.resources.cards.map((tool) => (
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

        <View className="mb-7">
          <SeoHeading level={2} className="text-black text-2xl mb-3" style={{ fontFamily: 'Poppins_700Bold' }}>
            Project Monitoring Demo
          </SeoHeading>
          <View style={cardShadowStyle} className="bg-black rounded-[30px] p-2.5">
            <View className="bg-white rounded-[24px] overflow-hidden">
              <View className="items-center pt-3 pb-1">
                <View className="w-24 h-1.5 rounded-full bg-gray-300" />
              </View>
              <View className="px-4 pb-4">
                <Text className="text-black text-[34px] leading-[40px] mb-3" style={{ fontFamily: 'Poppins_700Bold' }}>
                  Your Projects
                </Text>
                <View style={cardShadowStyle} className="bg-gray-50 rounded-3xl border border-gray-200 overflow-hidden">
                  <Image
                    source={{ uri: 'https://images.unsplash.com/photo-1541976590-713941681591?auto=format&fit=crop&w=1200&q=80' }}
                    className="w-full h-36"
                    resizeMode="cover"
                  />
                  <View className="p-4">
                    <View className="flex-row justify-between items-start mb-2">
                      <View className="flex-1 min-w-0 mr-2">
                        <Text className="text-black text-xl mb-1" style={{ fontFamily: 'Poppins_700Bold' }} numberOfLines={1}>
                          Daddy Obinna ...
                        </Text>
                        <View className="flex-row items-center">
                          <MapPin size={14} color="#737373" strokeWidth={2} />
                          <Text className="text-gray-500 text-sm ml-1 flex-1" style={{ fontFamily: 'Poppins_400Regular' }} numberOfLines={2}>
                            University of Lagos Cricket Oval, Ransome Kuti Road, ...
                          </Text>
                        </View>
                      </View>
                      <View className="flex-row items-center">
                        <View className="rounded-full px-2.5 py-1 bg-blue-100 mr-1">
                          <Text className="text-xs text-blue-700" style={{ fontFamily: 'Poppins_600SemiBold' }}>
                            Active
                          </Text>
                        </View>
                        <ChevronRight size={20} color="#000000" strokeWidth={2} />
                      </View>
                    </View>
                    <View className="mb-3">
                      <View className="flex-row justify-between mb-2">
                        <Text className="text-black text-sm" style={{ fontFamily: 'Poppins_600SemiBold' }}>
                          Site Preparation & Foundation
                        </Text>
                        <Text className="text-black text-sm" style={{ fontFamily: 'JetBrainsMono_500Medium' }}>
                          17%
                        </Text>
                      </View>
                      <View className="h-2 bg-gray-200 rounded-full overflow-hidden">
                        <View className="h-full bg-black rounded-full" style={{ width: '17%' }} />
                      </View>
                    </View>
                    <View className="flex-row justify-between pt-3 border-t border-gray-200">
                      <View>
                        <Text className="text-gray-500 text-xs mb-1" style={{ fontFamily: 'Poppins_400Regular' }}>
                          Budget
                        </Text>
                        <Text className="text-black text-sm" style={{ fontFamily: 'JetBrainsMono_500Medium' }}>
                          ₦2,240,000
                        </Text>
                      </View>
                      <View>
                        <Text className="text-gray-500 text-xs mb-1" style={{ fontFamily: 'Poppins_400Regular' }}>
                          Spent
                        </Text>
                        <Text className="text-black text-sm" style={{ fontFamily: 'JetBrainsMono_500Medium' }}>
                          ₦330,000
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>
                <Text className="text-xs text-gray-500 mt-3 text-center" style={{ fontFamily: 'Poppins_400Regular' }}>
                  Demo only — tap the project to explore the in-app layout.
                </Text>
              </View>
            </View>
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
                trackWebEvent('interior_nigeria_final_primary_click', { href: content.finalCta.primaryCta.href });
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
              eventName="interior_nigeria_final_secondary_click"
            />
          </View>
        </View>
      </ScrollView>

      {showStickyMobileCta ? (
        <View className="absolute bottom-0 left-0 right-0 md:hidden px-4 pb-6 pt-3 bg-white/95 border-t border-gray-200">
          <Text className="text-gray-500 text-xs text-center mb-2" style={{ fontFamily: 'Poppins_400Regular' }}>
            Plan first. Style with control.
          </Text>
          <TouchableOpacity
            onPress={() => {
              trackWebEvent('interior_nigeria_sticky_mobile_cta_click', {
                href: content.finalCta.primaryCta.href,
                cta_label: 'Start your interior project',
              });
              openLink(content.finalCta.primaryCta.href, router);
            }}
            className="bg-black rounded-full py-4 px-5"
          >
            <Text className="text-white text-center text-base" style={{ fontFamily: 'Poppins_700Bold' }}>
              Start your interior project
            </Text>
          </TouchableOpacity>
        </View>
      ) : null}
    </View>
  );
}
