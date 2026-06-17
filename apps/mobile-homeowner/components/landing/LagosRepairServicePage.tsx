import { Pressable, Text, View } from 'react-native';
import { Link } from 'expo-router';
import {
  SeoContentBackButton,
  SeoContentColumn,
  SeoContentShell,
  seoContentTypography,
} from '@/components/seo/SeoContentLayout';
import { SeoHeading } from '@/components/seo/SeoHeading';
import { LANDING_BORDER, LANDING_INK, LANDING_MUTED } from '@/lib/home-landing-content';
import {
  LAGOS_REPAIR_SERVICES,
  type LagosRepairSlug,
  lagosServicePath,
} from '@/lib/lagos-repair-services';
import { contractorDirectoryPath } from '@/lib/public-contractors';
import { buildSeoJsonLd } from '@/lib/seo-schema';
import { useWebSeo } from '@/lib/seo';

type LagosRepairServicePageProps = {
  slug: LagosRepairSlug;
};

export default function LagosRepairServicePage({ slug }: LagosRepairServicePageProps) {
  const service = LAGOS_REPAIR_SERVICES[slug];
  const canonicalPath = lagosServicePath(slug);

  const jsonLd = buildSeoJsonLd({
    path: canonicalPath,
    title: service.metaTitle,
    description: service.summary,
    schemaType: 'Service',
    faqs: [...service.faqs],
    breadcrumbs: [
      { name: 'Home', path: '/' },
      { name: 'Lagos repair services', path: '/services/lagos/plumbing-repair' },
      { name: service.title, path: canonicalPath },
    ],
  });

  useWebSeo({
    title: `${service.metaTitle} | BuildMyHouse`,
    description: service.summary,
    canonicalPath,
    robots: 'index,follow',
    jsonLd,
  });

  return (
    <SeoContentShell contentContainerStyle={{ paddingBottom: 48 }}>
      <SeoContentColumn className="pt-10 pb-2 md:pt-14 md:pb-4">
        <SeoContentBackButton fallbackHref="/" />

        <View className="border rounded-3xl p-6 mb-6" style={{ borderColor: LANDING_BORDER }}>
          <SeoHeading
            level={1}
            className={seoContentTypography.title}
            style={{ fontFamily: 'Poppins_700Bold', color: LANDING_INK }}
          >
            {service.title}
          </SeoHeading>
          <Text
            className={seoContentTypography.description}
            style={{ fontFamily: 'Poppins_400Regular', color: LANDING_MUTED }}
          >
            {service.summary}
          </Text>
          <Text
            className={seoContentTypography.bodyParagraph}
            style={{ fontFamily: 'Poppins_400Regular', color: LANDING_MUTED }}
          >
            {service.intro}
          </Text>

          {service.bullets.map((bullet) => (
            <View key={bullet} className="flex-row items-start mb-2">
              <Text className="mr-2" style={{ color: LANDING_INK }}>
                •
              </Text>
              <Text
                className="flex-1 text-sm leading-6"
                style={{ fontFamily: 'Poppins_400Regular', color: LANDING_MUTED }}
              >
                {bullet}
              </Text>
            </View>
          ))}

          <View className="flex-row flex-wrap mt-4">
            <Link href={'/start-repair' as any} asChild>
              <Pressable className="rounded-full px-4 py-2.5 mr-3 mb-2 bg-black" accessibilityRole="link">
                <Text className="text-white text-sm" style={{ fontFamily: 'Poppins_700Bold' }}>
                  Start a Tracked Repair
                </Text>
              </Pressable>
            </Link>
            {service.contractorDirectorySlug ? (
              <Link href={contractorDirectoryPath(service.contractorDirectorySlug) as any} asChild>
                <Pressable
                  className="rounded-full px-4 py-2.5 mr-3 mb-2 border"
                  style={{ borderColor: LANDING_BORDER }}
                  accessibilityRole="link"
                >
                  <Text className="text-sm" style={{ fontFamily: 'Poppins_700Bold', color: LANDING_INK }}>
                    Browse verified contractors
                  </Text>
                </Pressable>
              </Link>
            ) : null}
            {service.relatedNigeriaSlug ? (
              <Link href={`/services/${service.relatedNigeriaSlug}` as any} asChild>
                <Pressable
                  className="rounded-full px-4 py-2.5 mb-2 border"
                  style={{ borderColor: LANDING_BORDER }}
                  accessibilityRole="link"
                >
                  <Text className="text-sm" style={{ fontFamily: 'Poppins_600SemiBold', color: LANDING_MUTED }}>
                    Nigeria-wide page
                  </Text>
                </Pressable>
              </Link>
            ) : null}
          </View>
        </View>

        <View className="border rounded-3xl p-6" style={{ borderColor: LANDING_BORDER }}>
          <SeoHeading
            level={2}
            className={seoContentTypography.sectionHeading}
            style={{ fontFamily: 'Poppins_700Bold', color: LANDING_INK }}
          >
            Frequently asked questions
          </SeoHeading>
          {service.faqs.map((faq) => (
            <View key={faq.question} className="mb-5">
              <Text className="text-base mb-1" style={{ fontFamily: 'Poppins_600SemiBold', color: LANDING_INK }}>
                {faq.question}
              </Text>
              <Text className="text-sm leading-6" style={{ fontFamily: 'Poppins_400Regular', color: LANDING_MUTED }}>
                {faq.answer}
              </Text>
            </View>
          ))}
        </View>
      </SeoContentColumn>
    </SeoContentShell>
  );
}
