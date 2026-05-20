import { Linking, Platform, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import { SeoHeading } from '@/components/seo/SeoHeading';
import CollapsibleFaqSection from '@/components/seo/CollapsibleFaqSection';
import InternalLinksBlock from '@/components/seo/InternalLinksBlock';
import SeoCoverImage from '@/components/seo/SeoCoverImage';
import StageEvidenceGallery from '@/components/seo/StageEvidenceGallery';
import ContractorVerificationSummary from '@/components/seo/ContractorVerificationSummary';
import DocumentationSampleBlock from '@/components/seo/DocumentationSampleBlock';
import ChatUpdateTimelineDemo from '@/components/seo/ChatUpdateTimelineDemo';
import MilestonePaymentBreakdown from '@/components/seo/MilestonePaymentBreakdown';
import ProjectOverviewCard from '@/components/seo/ProjectOverviewCard';
import { cardShadowStyle } from '@/lib/card-styles';
import { trackWebEvent } from '@/lib/analytics';
import { renovationNigeriaLandingPageContent as content } from '@/lib/renovation-nigeria-landing-content';

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

export default function RenovationNigeriaLandingPage() {
  const router = useRouter();
  const showStickyMobileCta = Platform.OS === 'web';

  return (
    <View className="flex-1 bg-white">
      <ScrollView className="flex-1 px-5 md:px-6" contentContainerStyle={{ paddingBottom: showStickyMobileCta ? 120 : 40 }}>
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
            <CtaButton label={content.hero.primaryCta.label} href={content.hero.primaryCta.href} eventName="renovation_nigeria_hero_primary_click" />
            <CtaButton label={content.hero.secondaryCta.label} href={content.hero.secondaryCta.href} variant="secondary" eventName="renovation_nigeria_hero_secondary_click" />
          </View>
        </View>

        <View className="mb-7">
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
            {content.whatBuildMyHouseDoes.title}
          </SeoHeading>
          {content.whatBuildMyHouseDoes.paragraphs.map((paragraph) => (
            <BodyText key={paragraph}>{paragraph}</BodyText>
          ))}
        </View>

        <View className="mb-7">
          <SeoHeading level={2} className="text-black text-2xl mb-3" style={{ fontFamily: 'Poppins_700Bold' }}>
            {content.renovationTypes.title}
          </SeoHeading>
          {content.renovationTypes.cards.map((card) => (
            <View key={card.title} style={cardShadowStyle} className="bg-white border border-gray-200 rounded-2xl p-4 mb-3">
              <SeoHeading level={3} className="text-black text-base mb-2" style={{ fontFamily: 'Poppins_700Bold' }}>
                {card.title}
              </SeoHeading>
              <Text className="text-gray-700 text-sm leading-6 mb-2" style={{ fontFamily: 'Poppins_400Regular' }}>
                <Text style={{ fontFamily: 'Poppins_700Bold' }}>What usually happens: </Text>
                {card.usuallyHappens}
              </Text>
              <Text className="text-gray-700 text-sm leading-6 mb-2" style={{ fontFamily: 'Poppins_400Regular' }}>
                <Text style={{ fontFamily: 'Poppins_700Bold' }}>What can go wrong: </Text>
                {card.canGoWrong}
              </Text>
              <Text className="text-gray-700 text-sm leading-6" style={{ fontFamily: 'Poppins_400Regular' }}>
                <Text style={{ fontFamily: 'Poppins_700Bold' }}>Proof to request: </Text>
                {card.proof}
              </Text>
            </View>
          ))}
        </View>

        <View style={cardShadowStyle} className="bg-gray-50 border border-gray-200 rounded-2xl p-5 mb-7">
          <SeoHeading level={2} className="text-black text-xl mb-3" style={{ fontFamily: 'Poppins_700Bold' }}>
            {content.repairsVsUpgrades.title}
          </SeoHeading>
          {content.repairsVsUpgrades.paragraphs.map((paragraph) => (
            <BodyText key={paragraph}>{paragraph}</BodyText>
          ))}
          <CtaButton
            label={content.repairsVsUpgrades.cta.label}
            href={content.repairsVsUpgrades.cta.href}
            eventName="renovation_nigeria_repairs_vs_upgrades_click"
          />
        </View>

        <View className="mb-7">
          <SeoHeading level={2} className="text-black text-2xl mb-3" style={{ fontFamily: 'Poppins_700Bold' }}>
            {content.parentsHome.title}
          </SeoHeading>
          {content.parentsHome.paragraphs.map((paragraph) => (
            <BodyText key={paragraph}>{paragraph}</BodyText>
          ))}
          <LinkPills links={content.parentsHome.links} />
        </View>

        <View className="mb-7">
          <SeoHeading level={2} className="text-black text-2xl mb-3" style={{ fontFamily: 'Poppins_700Bold' }}>
            {content.diaspora.title}
          </SeoHeading>
          {content.diaspora.paragraphs.map((paragraph) => (
            <BodyText key={paragraph}>{paragraph}</BodyText>
          ))}
          <LinkPills links={content.diaspora.links} />
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
          <CtaButton label={content.budget.cta.label} href={content.budget.cta.href} eventName="renovation_nigeria_budget_tool_click" />
        </View>

        <View style={cardShadowStyle} className="bg-gray-50 border border-gray-200 rounded-2xl p-5 mb-7">
          <SeoHeading level={2} className="text-black text-xl mb-3" style={{ fontFamily: 'Poppins_700Bold' }}>
            {content.paymentDiscipline.title}
          </SeoHeading>
          {content.paymentDiscipline.paragraphs.map((paragraph) => (
            <BodyText key={paragraph}>{paragraph}</BodyText>
          ))}
          <CtaButton
            label={content.paymentDiscipline.cta.label}
            href={content.paymentDiscipline.cta.href}
            eventName="renovation_nigeria_payment_schedule_click"
          />
        </View>

        <BulletCard title={content.proof.title} items={content.proof.items} />

        <View style={cardShadowStyle} className="bg-gray-50 border border-gray-200 rounded-2xl p-5 mb-7">
          <SeoHeading level={2} className="text-black text-xl mb-3" style={{ fontFamily: 'Poppins_700Bold' }}>
            {content.lagosCaution.title}
          </SeoHeading>
          {content.lagosCaution.paragraphs.map((paragraph) => (
            <BodyText key={paragraph}>{paragraph}</BodyText>
          ))}
          <LinkPills links={content.lagosCaution.links} />
        </View>

        <View className="mb-7">
          <SeoHeading level={2} className="text-black text-2xl mb-3" style={{ fontFamily: 'Poppins_700Bold' }}>
            {content.evidenceDemo.title}
          </SeoHeading>

          <ProjectOverviewCard
            overview={{
              projectName: 'Festac Family House Renovation',
              location: 'Festac, Lagos',
              type: 'Remote renovation in Nigeria',
              currentStage: 'Plumbing and bathroom correction',
              completion: 46,
              budgetBand: 'Renovation budget range: staged release with proof checks',
              lastUpdate: 'Last update: 2 days ago',
            }}
          />
          <StageEvidenceGallery
            items={[
              {
                id: 'renovation-demo-1',
                stageLabel: 'Bathroom renovation',
                date: 'May 2026',
                explanation: 'Before and after of tile removal, waterproofing, and relaying.',
                imageUrl: 'https://images.unsplash.com/photo-1584622781564-1d987f7333c1?auto=format&fit=crop&w=900&q=80',
              },
              {
                id: 'renovation-demo-2',
                stageLabel: 'Roof repair',
                date: 'May 2026',
                explanation: 'Leak source corrected and ceiling patch progress documented.',
                imageUrl: 'https://images.unsplash.com/photo-1632882765546-11a3d7de8965?auto=format&fit=crop&w=900&q=80',
              },
              {
                id: 'renovation-demo-3',
                stageLabel: 'Kitchen upgrade',
                date: 'May 2026',
                explanation: 'Cabinet installation and plumbing point alignment checks.',
                imageUrl: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?auto=format&fit=crop&w=900&q=80',
              },
            ]}
          />
          <ContractorVerificationSummary
            data={{
              contractorLabel: 'Renovation contractor workflow check',
              checks: [
                { label: 'Identity and business details', status: 'verified', note: 'Matched with submitted records.' },
                { label: 'Scope understanding and stage reporting standard', status: 'verified' },
                { label: 'Latest extra request (plumbing reroute)', status: 'in_review', note: 'Evidence under admin review.' },
              ],
              note: 'This section is demo content showing how operational oversight can appear.',
            }}
          />
          <DocumentationSampleBlock
            items={[
              {
                title: 'Material list sample',
                caption: 'Plumbing and bathroom scope',
                description: 'PVC pipes, connectors, waterproofing compound, adhesive, and tile quantities.',
              },
              {
                title: 'Issue report sample',
                caption: 'Unplanned defect found',
                description: 'Original pipe route failed pressure test; scope updated with proof before next payment.',
              },
            ]}
          />
          <MilestonePaymentBreakdown
            items={[
              {
                stageName: 'Bathroom correction',
                completionDefinition: 'Waterproofing completed and tile layout confirmed',
                requiredEvidence: ['Before and after photos', 'Water test video', 'Material receipts'],
                paymentTrigger: 'Homeowner confirms stage proof',
              },
              {
                stageName: 'Kitchen upgrade',
                completionDefinition: 'Cabinet install and plumbing fit-outs complete',
                requiredEvidence: ['Material list', 'Install photos', 'Snag closure note'],
                paymentTrigger: 'Admin + homeowner proof review complete',
              },
            ]}
          />
          <ChatUpdateTimelineDemo
            items={[
              {
                at: 'Mon 9:14 AM',
                actor: 'contractor',
                message: 'Uploaded bathroom waterproofing video and today’s material receipts.',
                type: 'evidence',
              },
              {
                at: 'Mon 10:02 AM',
                actor: 'homeowner',
                message: 'Seen. Please confirm if this includes the second bathroom wall crack repair.',
                type: 'question',
              },
              {
                at: 'Mon 11:20 AM',
                actor: 'buildmyhouse',
                message: 'Issue logged and linked to current stage. Contractor response requested before next payment.',
                type: 'update',
              },
            ]}
          />

          <CtaButton
            label={content.evidenceDemo.cta.label}
            href={content.evidenceDemo.cta.href}
            eventName="renovation_nigeria_demo_cta_click"
          />
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
                trackWebEvent('renovation_nigeria_final_primary_click', { href: content.finalCta.primaryCta.href });
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
              eventName="renovation_nigeria_final_secondary_click"
            />
          </View>
        </View>
      </ScrollView>

      {showStickyMobileCta ? (
        <View className="absolute bottom-0 left-0 right-0 md:hidden px-4 pb-4 pt-3 bg-white border-t border-gray-200">
          <TouchableOpacity
            onPress={() => {
              trackWebEvent('renovation_nigeria_sticky_mobile_cta_click', {
                href: content.finalCta.primaryCta.href,
                cta_label: 'Start your renovation project',
              });
              openLink(content.finalCta.primaryCta.href, router);
            }}
            className="bg-black rounded-full py-4 px-5"
          >
            <Text className="text-white text-center text-base" style={{ fontFamily: 'Poppins_700Bold' }}>
              Start your renovation project
            </Text>
          </TouchableOpacity>
        </View>
      ) : null}
    </View>
  );
}
