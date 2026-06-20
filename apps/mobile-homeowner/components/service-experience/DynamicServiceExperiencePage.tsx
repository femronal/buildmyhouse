import { ActivityIndicator, View } from 'react-native';
import { useEffect, useState } from 'react';
import ServiceExperiencePage from '@/components/service-experience/ServiceExperiencePage';
import UnknownLagosServicePage from '@/components/service-experience/UnknownLagosServicePage';
import type { ServiceExperienceContent } from '@/lib/service-experience-content';
import { fetchPublishedServicePageByPath, mapCmsServicePageToExperience } from '@/lib/cms-service-pages';
import { getServiceExperienceContent } from '@/lib/service-experience-content';

type DynamicServiceExperiencePageProps = {
  canonicalPath: string;
};

export default function DynamicServiceExperiencePage({ canonicalPath }: DynamicServiceExperiencePageProps) {
  const [content, setContent] = useState<ServiceExperienceContent | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      const cmsPage = await fetchPublishedServicePageByPath(canonicalPath);
      if (cancelled) return;

      if (cmsPage) {
        setContent(mapCmsServicePageToExperience(cmsPage));
      } else {
        setContent(getServiceExperienceContent(canonicalPath));
      }
      setLoading(false);
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [canonicalPath]);

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-black">
        <ActivityIndicator size="large" color="#ffffff" />
      </View>
    );
  }

  if (!content) {
    if (canonicalPath.startsWith('/services/lagos/')) {
      return <UnknownLagosServicePage />;
    }
    return null;
  }

  return <ServiceExperiencePage content={content} />;
}
