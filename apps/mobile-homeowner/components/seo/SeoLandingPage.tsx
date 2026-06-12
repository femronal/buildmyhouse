import { View, Text, TouchableOpacity, type ImageSourcePropType } from 'react-native';
import { useRouter } from 'expo-router';
import { CheckCircle2 } from 'lucide-react-native';
import InternalLinksBlock, { InternalLinkItem } from '@/components/seo/InternalLinksBlock';
import CollapsibleFaqSection from '@/components/seo/CollapsibleFaqSection';
import RelatedLinkSections, { type RelatedLinkSection } from '@/components/seo/RelatedLinkSections';
import TrustBlocks, { type TrustBlock } from '@/components/seo/TrustBlocks';
import SeoCoverImage from '@/components/seo/SeoCoverImage';
import ProofOfProcessDemoSection from '@/components/seo/ProofOfProcessDemoSection';
import type { ProofOfProcessDemoContent } from '@/components/seo/proof-of-process-types';
import {
  SeoContentBackButton,
  SeoContentColumn,
  SeoContentShell,
  seoContentTypography,
} from '@/components/seo/SeoContentLayout';
import { SeoHeading } from '@/components/seo/SeoHeading';
import { trackWebEvent } from '@/lib/analytics';
import type { SeoContentSection } from '@/lib/seo-pages';
import { cardShadowStyle } from '@/lib/card-styles';

type FaqItem = {
  question: string;
  answer: string;
};

type SeoLandingPageProps = {
  eyebrow?: string;
  title: string;
  description: string;
  bulletPoints: string[];
  processTitle?: string;
  processSteps?: string[];
  trustBlocks?: TrustBlock[];
  proofOfProcessDemo?: ProofOfProcessDemoContent;
  faqs?: FaqItem[];
  internalLinks?: InternalLinkItem[];
  relatedLinkSections?: RelatedLinkSection[];
  ctaLabel?: string;
  ctaHref?: string;
  coverImageSource?: ImageSourcePropType;
  coverImageAlt?: string;
  coverImageAspectRatio?: number;
  preWhySections?: SeoContentSection[];
  whySectionTitle?: string;
  afterWhySections?: SeoContentSection[];
  postProcessSections?: SeoContentSection[];
};

export function SeoRichSection({ section }: { section: SeoContentSection }) {
  const isSnippet = section.variant === 'snippet';
  const wrapClass = isSnippet
    ? 'border border-blue-200 bg-blue-50 rounded-2xl p-4 mb-6'
    : 'mb-6';

  return (
    <View className={wrapClass}>
      <SeoHeading
        level={2}
        className={seoContentTypography.sectionHeading}
        style={{ fontFamily: 'Poppins_700Bold' }}
      >
        {section.heading}
      </SeoHeading>
      {section.paragraphs?.map((p) => (
        <Text
          key={p.slice(0, 48)}
          className={seoContentTypography.bodyParagraph}
          style={{ fontFamily: 'Poppins_400Regular' }}
        >
          {p}
        </Text>
      ))}
      {section.bullets?.map((b) => (
        <View key={b} className="flex-row items-start mb-1.5 pl-1">
          <Text className="text-gray-700 mr-2" style={{ fontFamily: 'Poppins_400Regular' }}>
            •
          </Text>
          <Text className={`${seoContentTypography.bodyParagraph} flex-1`} style={{ fontFamily: 'Poppins_400Regular' }}>
            {b}
          </Text>
        </View>
      ))}
      {section.paragraphsAfterBullets?.map((p) => (
        <Text
          key={p.slice(0, 48)}
          className={`${seoContentTypography.bodyParagraph} mt-1`}
          style={{ fontFamily: 'Poppins_400Regular' }}
        >
          {p}
        </Text>
      ))}
      {section.secondaryBullets?.map((b) => (
        <View key={b} className="flex-row items-start mb-1.5 pl-1">
          <Text className="text-gray-700 mr-2" style={{ fontFamily: 'Poppins_400Regular' }}>
            •
          </Text>
          <Text className={`${seoContentTypography.bodyParagraph} flex-1`} style={{ fontFamily: 'Poppins_400Regular' }}>
            {b}
          </Text>
        </View>
      ))}
      {section.closingParagraph ? (
        <Text className={`${seoContentTypography.bodyParagraph} mt-2`} style={{ fontFamily: 'Poppins_400Regular' }}>
          {section.closingParagraph}
        </Text>
      ) : null}
    </View>
  );
}

export default function SeoLandingPage({
  eyebrow,
  title,
  description,
  bulletPoints,
  processTitle = 'How BuildMyHouse helps',
  processSteps = [],
  trustBlocks = [],
  proofOfProcessDemo,
  faqs = [],
  internalLinks = [],
  relatedLinkSections = [],
  ctaLabel = 'Start your project',
  ctaHref = '/location?mode=explore',
  coverImageSource,
  coverImageAlt = '',
  coverImageAspectRatio = 4 / 3,
  preWhySections = [],
  whySectionTitle = 'Why people choose BuildMyHouse',
  afterWhySections = [],
  postProcessSections = [],
}: SeoLandingPageProps) {
  const router = useRouter();

  return (
    <SeoContentShell contentContainerStyle={{ paddingBottom: 40 }}>
      <SeoContentColumn className="pt-10 pb-2 md:pt-14 md:pb-4">
        <SeoContentBackButton fallbackHref="/" />
        {eyebrow ? (
          <Text className={seoContentTypography.eyebrow} style={{ fontFamily: 'Poppins_600SemiBold' }}>
            {eyebrow}
          </Text>
        ) : null}
        <SeoHeading level={1} className={seoContentTypography.title} style={{ fontFamily: 'Poppins_700Bold' }}>
          {title}
        </SeoHeading>
        <Text className={seoContentTypography.description} style={{ fontFamily: 'Poppins_400Regular' }}>
          {description}
        </Text>
      </SeoContentColumn>

      {coverImageSource ? (
        <SeoContentColumn className="mb-8">
          <SeoCoverImage
            source={coverImageSource}
            alt={coverImageAlt || title}
            aspectRatio={coverImageAspectRatio}
          />
        </SeoContentColumn>
      ) : null}

      <SeoContentColumn>
        {preWhySections.map((section) => (
          <SeoRichSection key={section.heading} section={section} />
        ))}

        <View className="bg-black rounded-3xl p-5 mb-6">
          <SeoHeading level={2} className="text-white text-lg mb-3" style={{ fontFamily: 'Poppins_700Bold' }}>
            {whySectionTitle}
          </SeoHeading>
          {bulletPoints.map((point) => (
            <View key={point} className="flex-row items-start mb-2">
              <CheckCircle2 size={16} color="#22c55e" strokeWidth={2.5} style={{ marginTop: 2 }} />
              <Text className="text-white/90 text-sm ml-2 flex-1" style={{ fontFamily: 'Poppins_400Regular' }}>
                {point}
              </Text>
            </View>
          ))}
        </View>

        {afterWhySections.map((section) => (
          <SeoRichSection key={section.heading} section={section} />
        ))}

        {processSteps.length > 0 && (
          <View style={cardShadowStyle} className="bg-gray-50 border border-gray-200 rounded-2xl p-4 mb-6">
            <SeoHeading level={2} className="text-black text-base mb-3" style={{ fontFamily: 'Poppins_700Bold' }}>
              {processTitle}
            </SeoHeading>
            {processSteps.map((step, index) => (
              <View key={step} className="flex-row items-start mb-2">
                <View className="w-6 h-6 rounded-full bg-black items-center justify-center mr-2 mt-0.5">
                  <Text className="text-white text-xs" style={{ fontFamily: 'Poppins_700Bold' }}>
                    {index + 1}
                  </Text>
                </View>
                <Text className="text-gray-700 text-base leading-7 flex-1" style={{ fontFamily: 'Poppins_400Regular' }}>
                  {step}
                </Text>
              </View>
            ))}
          </View>
        )}

        {postProcessSections.map((section) => (
          <SeoRichSection key={section.heading} section={section} />
        ))}

        {trustBlocks.length > 0 ? <TrustBlocks blocks={trustBlocks} /> : null}
        {proofOfProcessDemo ? <ProofOfProcessDemoSection content={proofOfProcessDemo} /> : null}

        {faqs.length > 0 ? <CollapsibleFaqSection items={faqs} /> : null}

        {relatedLinkSections.length > 0 ? <RelatedLinkSections sections={relatedLinkSections} /> : null}

        {internalLinks.length > 0 ? <InternalLinksBlock links={internalLinks} /> : null}

        <TouchableOpacity
          onPress={() => {
            trackWebEvent('seo_start_project_click', {
              page_title: title,
              cta_label: ctaLabel,
              cta_href: ctaHref,
            });
            router.push(ctaHref as any);
          }}
          className="bg-black rounded-full py-4 px-5 mb-3"
        >
          <Text className="text-white text-center text-base" style={{ fontFamily: 'Poppins_700Bold' }}>
            {ctaLabel}
          </Text>
        </TouchableOpacity>
      </SeoContentColumn>
    </SeoContentShell>
  );
}
