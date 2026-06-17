import ServiceExperiencePage from '@/components/service-experience/ServiceExperiencePage';
import { getServiceExperienceContent } from '@/lib/service-experience-content';
import type { ServiceSeoSlug } from '@/lib/home-landing-content';
import { SeoContentShell, SeoContentColumn } from '@/components/seo/SeoContentLayout';
import { Text, View } from 'react-native';
import { Link } from 'expo-router';
import { Pressable } from 'react-native';

type ServiceRoutePageProps = {
  slug: ServiceSeoSlug;
};

export default function ServiceRoutePage({ slug }: ServiceRoutePageProps) {
  const content = getServiceExperienceContent(`/services/${slug}`);

  if (!content) {
    return (
      <SeoContentShell>
        <SeoContentColumn>
          <View className="py-16">
            <Text className="text-xl text-black mb-4" style={{ fontFamily: 'Poppins_700Bold' }}>Service not found</Text>
            <Link href={'/start-repair' as any} asChild>
              <Pressable className="rounded-full px-4 py-2.5 bg-black self-start">
                <Text className="text-white text-sm" style={{ fontFamily: 'Poppins_700Bold' }}>Start a Tracked Repair</Text>
              </Pressable>
            </Link>
          </View>
        </SeoContentColumn>
      </SeoContentShell>
    );
  }

  return <ServiceExperiencePage content={content} />;
}
