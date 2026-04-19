import { createElement } from 'react';
import { Image, Linking, Platform, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import {
  ArrowLeft,
  BookText,
  Building2,
  CheckCircle2,
  ClipboardCheck,
  Download,
  FileText,
  Gavel,
  Hammer,
  Home,
  HousePlus,
  Layers,
  ListChecks,
  MapPinned,
  ScanSearch,
  ShieldCheck,
  SquareLibrary,
  Users,
  Wrench,
} from 'lucide-react-native';
import CollapsibleFaqSection from '@/components/seo/CollapsibleFaqSection';
import { SeoHeading } from '@/components/seo/SeoHeading';
import SeoCoverImage from '@/components/seo/SeoCoverImage';
import InternalLinksBlock, { type InternalLinkItem } from '@/components/seo/InternalLinksBlock';
import { cardShadowStyle } from '@/lib/card-styles';
import { trackWebEvent } from '@/lib/analytics';
import { useWebSeo } from '@/lib/seo';

type CtaConfig = {
  label: string;
  href: string;
  download?: boolean;
};

type LeadMagnetDownloadPageContent = {
  seo: {
    title: string;
    description: string;
    canonical: string;
    robots: string;
  };
  hero: {
    eyebrow: string;
    title: string;
    description: string;
    primaryCta: CtaConfig;
    secondaryCta: CtaConfig;
  };
  coverImage?: {
    src: string;
    alt: string;
  };
  trustNote: {
    title: string;
    paragraphs: string[];
  };
  intro: {
    paragraphs: string[];
  };
  whoItsFor: {
    title: string;
    items: string[];
  };
  whatItHelpsWith: {
    title: string;
    items: string[];
  };
  whatsInside: {
    title: string;
    sections: Array<{ heading: string; text: string }>;
  };
  whyThisMatters: {
    title: string;
    paragraphs: string[];
  };
  buildMyHouseFit: {
    title: string;
    paragraphs: string[];
  };
  previewCallout: {
    title: string;
    quote: string;
  };
  relatedResources: {
    title: string;
    links: InternalLinkItem[];
  };
  finalCta: {
    title: string;
    description: string;
    primary: CtaConfig;
    secondary: CtaConfig;
  };
  faq: {
    title: string;
    items: Array<{ question: string; answer: string }>;
  };
  faqSchema: Record<string, any>;
};

function normalizeRobots(robots: string): 'index,follow' | 'noindex,nofollow' {
  return robots.replace(/\s+/g, '') === 'index,follow' ? 'index,follow' : 'noindex,nofollow';
}

function resolveInternalHref(href: string) {
  if (href.startsWith('/projects/new')) {
    return '/location?mode=explore';
  }
  return href;
}

function openCtaLink(href: string, router: ReturnType<typeof useRouter>) {
  if (href.startsWith('http://') || href.startsWith('https://')) {
    Linking.openURL(href);
    return;
  }
  router.push(resolveInternalHref(href) as any);
}

function CtaButton({
  cta,
  kind,
  onPress,
  router,
}: {
  cta: CtaConfig;
  kind: 'primary' | 'secondary';
  onPress: () => void;
  router: ReturnType<typeof useRouter>;
}) {
  if (Platform.OS === 'web' && cta.download) {
    return createElement(
      'a',
      {
        href: cta.href,
        download: true,
        onClick: onPress,
        className:
          kind === 'primary'
            ? 'inline-flex items-center justify-center rounded-full bg-black px-5 py-3'
            : 'inline-flex items-center justify-center rounded-full border border-gray-300 px-5 py-3',
        style: { textDecoration: 'none' },
      },
      <>
        {kind === 'primary' ? <Download size={16} color="#ffffff" strokeWidth={2.2} style={{ marginRight: 8 }} /> : null}
        <Text
          className={kind === 'primary' ? 'text-white text-sm text-center' : 'text-gray-900 text-sm text-center'}
          style={{ fontFamily: kind === 'primary' ? 'Poppins_700Bold' : 'Poppins_600SemiBold' }}
        >
          {cta.label}
        </Text>
      </>,
    );
  }

  return (
    <TouchableOpacity
      onPress={() => {
        onPress();
        if (cta.download && Platform.OS !== 'web') {
          Linking.openURL(cta.href);
          return;
        }
        openCtaLink(cta.href, router);
      }}
      className={kind === 'primary' ? 'rounded-full bg-black px-5 py-3' : 'rounded-full border border-gray-300 px-5 py-3'}
    >
      <View className="flex-row items-center justify-center">
        {kind === 'primary' ? <Download size={16} color="#ffffff" strokeWidth={2.2} style={{ marginRight: 8 }} /> : null}
        <Text
          className={kind === 'primary' ? 'text-white text-sm text-center' : 'text-gray-900 text-sm text-center'}
          style={{ fontFamily: kind === 'primary' ? 'Poppins_700Bold' : 'Poppins_600SemiBold' }}
        >
          {cta.label}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

function ParagraphStack({ paragraphs }: { paragraphs: string[] }) {
  return (
    <View className="mb-6">
      {paragraphs.map((paragraph) => (
        <Text
          key={paragraph.slice(0, 48)}
          className="text-gray-700 text-sm leading-7 mb-2"
          style={{ fontFamily: 'Poppins_400Regular' }}
        >
          {paragraph}
        </Text>
      ))}
    </View>
  );
}

function BulletSection({ title, items }: { title: string; items: string[] }) {
  return (
    <View style={cardShadowStyle} className="bg-white border border-gray-200 rounded-2xl p-4 mb-5">
      <View className="flex-row items-center mb-3">
        <SquareLibrary size={18} color="#374151" />
        <SeoHeading level={2} className="text-black text-lg ml-2" style={{ fontFamily: 'Poppins_700Bold' }}>
          {title}
        </SeoHeading>
      </View>
      {items.map((item) => (
        <View key={item} className="flex-row items-start mb-2">
          <CheckCircle2 size={16} color="#4b5563" strokeWidth={2.2} style={{ marginTop: 2 }} />
          <Text className="text-gray-700 text-sm leading-6 ml-2 flex-1" style={{ fontFamily: 'Poppins_400Regular' }}>
            {item}
          </Text>
        </View>
      ))}
    </View>
  );
}

function getWorksheetSectionIcon(heading: string) {
  const key = heading.toLowerCase();
  if (key.includes('property overview')) return Home;
  if (key.includes('renovation goal')) return ClipboardCheck;
  if (key.includes('repairs vs upgrades')) return Wrench;
  if (key.includes('room-by-room scope')) return HousePlus;
  if (key.includes('live-in family')) return Users;
  if (key.includes('structural') || key.includes('compliance')) return Hammer;
  if (key.includes('lagos permit')) return MapPinned;
  if (key.includes('stage breakdown')) return Layers;
  if (key.includes('final pre-progression')) return ListChecks;
  return FileText;
}

export default function LeadMagnetDownloadPage({ content }: { content: LeadMagnetDownloadPageContent }) {
  const router = useRouter();
  const canonicalPath = content.seo.canonical.replace('https://buildmyhouse.app', '');

  useWebSeo({
    title: content.seo.title,
    description: content.seo.description,
    canonicalPath,
    robots: normalizeRobots(content.seo.robots),
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
          {content.coverImage ? (
            <View className="w-full rounded-2xl overflow-hidden border border-gray-200 mb-5" style={{ height: 210 }}>
              <Image
                source={{ uri: content.coverImage.src }}
                accessibilityLabel={content.coverImage.alt}
                resizeMode="cover"
                style={{ width: '100%', height: '100%' }}
              />
            </View>
          ) : (
            <SeoCoverImage
              source={require('@/assets/images/worksheet-renovation-cover-image.png')}
              alt={content.hero.title}
              className="mb-5"
              aspectRatio={1.55}
            />
          )}
        </View>

        <View style={cardShadowStyle} className="bg-gray-50 border border-gray-200 rounded-2xl p-5 mb-6">
          <View className="flex-row items-center mb-2">
            <ShieldCheck size={18} color="#374151" />
            <SeoHeading level={2} className="text-black text-lg ml-2" style={{ fontFamily: 'Poppins_700Bold' }}>
              {content.trustNote.title}
            </SeoHeading>
          </View>
          <ParagraphStack paragraphs={content.trustNote.paragraphs} />
        </View>

        <ParagraphStack paragraphs={content.intro.paragraphs} />
        <BulletSection title={content.whoItsFor.title} items={content.whoItsFor.items} />
        <BulletSection title={content.whatItHelpsWith.title} items={content.whatItHelpsWith.items} />

        <View style={cardShadowStyle} className="bg-white border border-gray-200 rounded-2xl p-5 mb-6">
          <View className="flex-row items-center mb-3">
            <BookText size={18} color="#374151" />
            <SeoHeading level={2} className="text-black text-lg ml-2" style={{ fontFamily: 'Poppins_700Bold' }}>
              {content.whatsInside.title}
            </SeoHeading>
          </View>
          {content.whatsInside.sections.map((section) => (
            <View key={section.heading} className="mb-3 flex-row items-start">
              <View className="w-8 h-8 rounded-full bg-gray-100 border border-gray-200 items-center justify-center mr-2 mt-0.5">
                {(() => {
                  const Icon = getWorksheetSectionIcon(section.heading);
                  return <Icon size={15} color="#4b5563" strokeWidth={2.1} />;
                })()}
              </View>
              <View className="flex-1">
                <SeoHeading level={3} className="text-black text-sm mb-1" style={{ fontFamily: 'Poppins_600SemiBold' }}>
                  {section.heading}
                </SeoHeading>
                <Text className="text-gray-700 text-sm leading-6" style={{ fontFamily: 'Poppins_400Regular' }}>
                  {section.text}
                </Text>
              </View>
            </View>
          ))}
        </View>

        <View style={cardShadowStyle} className="bg-black rounded-2xl p-5 mb-6">
          <View className="flex-row items-center mb-2">
            <Gavel size={18} color="#e5e7eb" />
            <SeoHeading level={2} className="text-white text-lg ml-2" style={{ fontFamily: 'Poppins_700Bold' }}>
              {content.previewCallout.title}
            </SeoHeading>
          </View>
          <Text className="text-white text-base leading-7 italic" style={{ fontFamily: 'Poppins_500Medium' }}>
            "{content.previewCallout.quote}"
          </Text>
        </View>

        <View style={cardShadowStyle} className="bg-white border border-gray-200 rounded-2xl p-5 mb-6">
          <View className="flex-row items-center mb-2">
            <ScanSearch size={18} color="#374151" />
            <SeoHeading level={2} className="text-black text-lg ml-2" style={{ fontFamily: 'Poppins_700Bold' }}>
              {content.whyThisMatters.title}
            </SeoHeading>
          </View>
          <ParagraphStack paragraphs={content.whyThisMatters.paragraphs} />
        </View>

        <View style={cardShadowStyle} className="bg-white border border-gray-200 rounded-2xl p-5 mb-6">
          <View className="flex-row items-center mb-2">
            <Building2 size={18} color="#374151" />
            <SeoHeading level={2} className="text-black text-lg ml-2" style={{ fontFamily: 'Poppins_700Bold' }}>
              {content.buildMyHouseFit.title}
            </SeoHeading>
          </View>
          <ParagraphStack paragraphs={content.buildMyHouseFit.paragraphs} />
        </View>

        <InternalLinksBlock title={content.relatedResources.title} links={[...content.relatedResources.links]} />

        <View style={cardShadowStyle} className="bg-gray-100 border border-gray-300 rounded-2xl p-5 mb-6">
          <View className="flex-row items-center mb-2">
            <Building2 size={18} color="#374151" />
            <SeoHeading level={2} className="text-black text-xl ml-2" style={{ fontFamily: 'Poppins_700Bold' }}>
              {content.finalCta.title}
            </SeoHeading>
          </View>
          <Text className="text-gray-700 text-sm leading-7 mb-4" style={{ fontFamily: 'Poppins_400Regular' }}>
            {content.finalCta.description}
          </Text>
          <View className="flex-col gap-3">
            <CtaButton
              cta={content.finalCta.primary}
              kind="primary"
              router={router}
              onPress={() =>
                trackWebEvent('lead_magnet_download_click', {
                  canonical_path: canonicalPath,
                  cta_label: content.finalCta.primary.label,
                  cta_href: content.finalCta.primary.href,
                  cta_download: Boolean(content.finalCta.primary.download),
                })
              }
            />
            <CtaButton
              cta={content.finalCta.secondary}
              kind="secondary"
              router={router}
              onPress={() =>
                trackWebEvent('lead_magnet_secondary_click', {
                  canonical_path: canonicalPath,
                  cta_label: content.finalCta.secondary.label,
                  cta_href: content.finalCta.secondary.href,
                })
              }
            />
          </View>
        </View>

        <CollapsibleFaqSection title={content.faq.title} items={content.faq.items} />
      </ScrollView>
    </View>
  );
}
