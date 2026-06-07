import { Pressable, Text, View } from 'react-native';
import { Link } from 'expo-router';
import { SeoHeading } from '@/components/seo/SeoHeading';
import { LANDING_BORDER, LANDING_INK, LANDING_MUTED, SERVICE_SEO_PAGES, type ServiceSeoSlug } from '@/lib/home-landing-content';
import { useWebSeo } from '@/lib/seo';

type ServiceRoutePageProps = {
  slug: ServiceSeoSlug;
};

export default function ServiceRoutePage({ slug }: ServiceRoutePageProps) {
  const service = SERVICE_SEO_PAGES[slug];

  useWebSeo({
    title: `${service.title} | BuildMyHouse`,
    description: service.summary,
    canonicalPath: `/services/${slug}`,
    robots: 'index,follow',
  });

  return (
    <View className="flex-1 bg-white px-5 py-10 md:px-10">
      <View className="max-w-3xl w-full self-center border rounded-3xl p-6" style={{ borderColor: LANDING_BORDER }}>
        <SeoHeading level={1} className="text-3xl mb-2" style={{ fontFamily: 'Poppins_700Bold', color: LANDING_INK }}>
          {service.title}
        </SeoHeading>
        <Text className="text-base leading-7 mb-5" style={{ fontFamily: 'Poppins_400Regular', color: LANDING_MUTED }}>
          {service.summary}
        </Text>
        <Text className="text-sm leading-6 mb-6" style={{ fontFamily: 'Poppins_400Regular', color: LANDING_MUTED }}>
          BuildMyHouse helps owners clarify scope, choose verified workers, and monitor execution with better stage
          visibility before major payment decisions.
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
    </View>
  );
}
