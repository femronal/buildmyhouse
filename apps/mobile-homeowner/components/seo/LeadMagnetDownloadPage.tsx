import { createElement } from 'react';
import { Linking, Platform, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, CheckCircle2, Download } from 'lucide-react-native';
import { SeoHeading } from '@/components/seo/SeoHeading';
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
  return href === '/projects/new' ? '/location?mode=explore' : href;
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
      <SeoHeading level={2} className="text-black text-lg mb-3" style={{ fontFamily: 'Poppins_700Bold' }}>
        {title}
      </SeoHeading>
      {items.map((item) => (
        <View key={item} className="flex-row items-start mb-2">
          <CheckCircle2 size={16} color="#2563eb" strokeWidth={2.2} style={{ marginTop: 2 }} />
          <Text className="text-gray-700 text-sm leading-6 ml-2 flex-1" style={{ fontFamily: 'Poppins_400Regular' }}>
            {item}
          </Text>
        </View>
      ))}
    </View>
  );
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
          <Text className="text-[11px] uppercase tracking-wide text-blue-700 mb-2" style={{ fontFamily: 'Poppins_600SemiBold' }}>
            {content.hero.eyebrow}
          </Text>
          <SeoHeading level={1} className="text-black text-3xl leading-tight mb-3 md:text-4xl" style={{ fontFamily: 'Poppins_700Bold' }}>
            {content.hero.title}
          </SeoHeading>
          <Text className="text-gray-700 text-base leading-7 mb-4 md:text-lg" style={{ fontFamily: 'Poppins_400Regular' }}>
            {content.hero.description}
          </Text>

          <View className="flex-col gap-3 mb-5">
            <CtaButton
              cta={content.hero.primaryCta}
              kind="primary"
              router={router}
              onPress={() =>
                trackWebEvent('lead_magnet_download_click', {
                  canonical_path: canonicalPath,
                  cta_label: content.hero.primaryCta.label,
                  cta_href: content.hero.primaryCta.href,
                  cta_download: Boolean(content.hero.primaryCta.download),
                })
              }
            />
            <CtaButton
              cta={content.hero.secondaryCta}
              kind="secondary"
              router={router}
              onPress={() =>
                trackWebEvent('lead_magnet_secondary_click', {
                  canonical_path: canonicalPath,
                  cta_label: content.hero.secondaryCta.label,
                  cta_href: content.hero.secondaryCta.href,
                })
              }
            />
          </View>
        </View>

        <View style={cardShadowStyle} className="bg-gray-50 border border-gray-200 rounded-2xl p-5 mb-6">
          <SeoHeading level={2} className="text-black text-lg mb-2" style={{ fontFamily: 'Poppins_700Bold' }}>
            {content.trustNote.title}
          </SeoHeading>
          <ParagraphStack paragraphs={content.trustNote.paragraphs} />
        </View>

        <ParagraphStack paragraphs={content.intro.paragraphs} />
        <BulletSection title={content.whoItsFor.title} items={content.whoItsFor.items} />
        <BulletSection title={content.whatItHelpsWith.title} items={content.whatItHelpsWith.items} />

        <View style={cardShadowStyle} className="bg-white border border-gray-200 rounded-2xl p-5 mb-6">
          <SeoHeading level={2} className="text-black text-lg mb-3" style={{ fontFamily: 'Poppins_700Bold' }}>
            {content.whatsInside.title}
          </SeoHeading>
          {content.whatsInside.sections.map((section) => (
            <View key={section.heading} className="mb-3">
              <SeoHeading level={3} className="text-black text-sm mb-1" style={{ fontFamily: 'Poppins_600SemiBold' }}>
                {section.heading}
              </SeoHeading>
              <Text className="text-gray-700 text-sm leading-6" style={{ fontFamily: 'Poppins_400Regular' }}>
                {section.text}
              </Text>
            </View>
          ))}
        </View>

        <View style={cardShadowStyle} className="bg-black rounded-2xl p-5 mb-6">
          <SeoHeading level={2} className="text-white text-lg mb-2" style={{ fontFamily: 'Poppins_700Bold' }}>
            {content.previewCallout.title}
          </SeoHeading>
          <Text className="text-white text-base leading-7 italic" style={{ fontFamily: 'Poppins_500Medium' }}>
            "{content.previewCallout.quote}"
          </Text>
        </View>

        <View style={cardShadowStyle} className="bg-white border border-gray-200 rounded-2xl p-5 mb-6">
          <SeoHeading level={2} className="text-black text-lg mb-2" style={{ fontFamily: 'Poppins_700Bold' }}>
            {content.whyThisMatters.title}
          </SeoHeading>
          <ParagraphStack paragraphs={content.whyThisMatters.paragraphs} />
        </View>

        <View style={cardShadowStyle} className="bg-white border border-gray-200 rounded-2xl p-5 mb-6">
          <SeoHeading level={2} className="text-black text-lg mb-2" style={{ fontFamily: 'Poppins_700Bold' }}>
            {content.buildMyHouseFit.title}
          </SeoHeading>
          <ParagraphStack paragraphs={content.buildMyHouseFit.paragraphs} />
        </View>

        <InternalLinksBlock title={content.relatedResources.title} links={content.relatedResources.links} />

        <View style={cardShadowStyle} className="bg-blue-50 border border-blue-200 rounded-2xl p-5 mb-6">
          <SeoHeading level={2} className="text-black text-xl mb-2" style={{ fontFamily: 'Poppins_700Bold' }}>
            {content.finalCta.title}
          </SeoHeading>
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

        <View className="mb-6">
          <SeoHeading level={2} className="text-black text-xl mb-3" style={{ fontFamily: 'Poppins_700Bold' }}>
            {content.faq.title}
          </SeoHeading>
          {content.faq.items.map((item) => (
            <View key={item.question} style={cardShadowStyle} className="bg-white border border-gray-200 rounded-2xl p-4 mb-3">
              <SeoHeading level={3} className="text-black text-sm mb-2" style={{ fontFamily: 'Poppins_600SemiBold' }}>
                {item.question}
              </SeoHeading>
              <Text className="text-gray-600 text-sm leading-6" style={{ fontFamily: 'Poppins_400Regular' }}>
                {item.answer}
              </Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}
