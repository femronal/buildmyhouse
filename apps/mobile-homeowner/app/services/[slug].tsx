import { Pressable, Text, View } from 'react-native';
import { Link, useLocalSearchParams } from 'expo-router';
import ServiceExperiencePage from '@/components/service-experience/ServiceExperiencePage';
import { SERVICE_SEO_PAGES, type ServiceSeoSlug } from '@/lib/home-landing-content';
import { getServiceExperienceContent } from '@/lib/service-experience-content';
import { useWebSeo } from '@/lib/seo';

function isKnownSlug(value: string): value is ServiceSeoSlug {
  return value in SERVICE_SEO_PAGES;
}

export default function ServiceLandingPlaceholderPage() {
  const params = useLocalSearchParams<{ slug?: string }>();
  const slug = typeof params.slug === 'string' ? params.slug : '';
  const content = isKnownSlug(slug) ? getServiceExperienceContent(`/services/${slug}`) : null;

  useWebSeo({
    title: content?.metaTitle || 'Property Services in Nigeria | BuildMyHouse',
    description: content?.summary || 'Find verified property services in Nigeria with clearer scope, stage updates, and evidence-based approvals.',
    canonicalPath: `/services/${slug || ''}`,
    robots: content ? 'index,follow' : 'noindex,follow',
  });

  if (content) {
    return <ServiceExperiencePage content={content} />;
  }

  return (
    <View className="flex-1 bg-[#060706] items-center justify-center px-6">
      <Text className="text-[#f3f0e8] text-xl mb-4" style={{ fontFamily: 'Poppins_700Bold' }}>Service not found</Text>
      <Link href={'/start-repair' as any} asChild>
        <Pressable className="rounded-full px-4 py-2.5 bg-[#ff5a1f]">
          <Text className="text-sm" style={{ fontFamily: 'Poppins_700Bold', color: '#060706' }}>Start a Tracked Repair</Text>
        </Pressable>
      </Link>
    </View>
  );
}
