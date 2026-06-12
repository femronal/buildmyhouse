import { Pressable, Text, View } from 'react-native';
import { Link, useLocalSearchParams } from 'expo-router';
import {
  SeoContentBackButton,
  SeoContentColumn,
  SeoContentShell,
  seoContentTypography,
} from '@/components/seo/SeoContentLayout';
import { SeoHeading } from '@/components/seo/SeoHeading';
import { LANDING_BORDER, LANDING_INK, LANDING_MUTED, SERVICE_SEO_PAGES, type ServiceSeoSlug } from '@/lib/home-landing-content';
import { useWebSeo } from '@/lib/seo';

function isKnownSlug(value: string): value is ServiceSeoSlug {
  return value in SERVICE_SEO_PAGES;
}

export default function ServiceLandingPlaceholderPage() {
  const params = useLocalSearchParams<{ slug?: string }>();
  const slug = typeof params.slug === 'string' ? params.slug : '';
  const service = isKnownSlug(slug) ? SERVICE_SEO_PAGES[slug] : null;

  const title = service?.title || 'Property Services in Nigeria | BuildMyHouse';
  const description =
    service?.summary ||
    'Find verified property services in Nigeria with clearer scope, stage updates, and evidence-based approvals.';

  useWebSeo({
    title: `${title} | BuildMyHouse`,
    description,
    canonicalPath: `/services/${slug || ''}`,
    robots: 'index,follow',
  });

  return (
    <SeoContentShell contentContainerStyle={{ paddingBottom: 48 }}>
      <SeoContentColumn className="pt-10 pb-2 md:pt-14 md:pb-4">
        <SeoContentBackButton fallbackHref="/" />

        <View className="border rounded-3xl p-6" style={{ borderColor: LANDING_BORDER }}>
          <SeoHeading level={1} className={seoContentTypography.title} style={{ fontFamily: 'Poppins_700Bold', color: LANDING_INK }}>
            {title}
          </SeoHeading>
          <Text className={seoContentTypography.description} style={{ fontFamily: 'Poppins_400Regular', color: LANDING_MUTED }}>
            {description}
          </Text>
          <Text className={seoContentTypography.bodyParagraph} style={{ fontFamily: 'Poppins_400Regular', color: LANDING_MUTED }}>
            This service route is ready so homeowners can discover and request this category through BuildMyHouse.
          </Text>
          <View className="flex-row flex-wrap">
            <Link href={'/location?mode=explore' as any} asChild>
              <Pressable className="rounded-full px-4 py-2.5 mr-3 mb-2 bg-black" accessibilityRole="link">
                <Text className="text-white text-sm" style={{ fontFamily: 'Poppins_700Bold' }}>
                  Hire a Verified Worker
                </Text>
              </Pressable>
            </Link>
            <Link href={'/' as any} asChild>
              <Pressable className="rounded-full px-4 py-2.5 mb-2 border" style={{ borderColor: LANDING_BORDER }} accessibilityRole="link">
                <Text className="text-sm" style={{ fontFamily: 'Poppins_700Bold', color: LANDING_INK }}>
                  Back to homepage
                </Text>
              </Pressable>
            </Link>
          </View>
        </View>
      </SeoContentColumn>
    </SeoContentShell>
  );
}
