import { ActivityIndicator, View } from 'react-native';
import { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { normalizeServicePageCanonicalPath } from '@buildmyhouse/shared-types';
import ServiceExperiencePage from '@/components/service-experience/ServiceExperiencePage';
import UnknownLagosServicePage from '@/components/service-experience/UnknownLagosServicePage';
import type { ServiceExperienceContent } from '@/lib/service-experience-content';
import { fetchPublishedServicePageByPath, mapCmsServicePageToExperience } from '@/lib/cms-service-pages';
import { getServiceExperienceContent } from '@/lib/service-experience-content';

type DynamicServiceExperiencePageProps = {
  canonicalPath: string;
};

export default function DynamicServiceExperiencePage({ canonicalPath }: DynamicServiceExperiencePageProps) {
  const router = useRouter();
  const resolvedPath = normalizeServicePageCanonicalPath(canonicalPath);
  const [content, setContent] = useState<ServiceExperienceContent | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (resolvedPath !== canonicalPath) {
      router.replace(resolvedPath as any);
    }
  }, [canonicalPath, resolvedPath, router]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      const cmsPage = await fetchPublishedServicePageByPath(resolvedPath);
      if (cancelled) return;

      if (cmsPage) {
        setContent(mapCmsServicePageToExperience(cmsPage));
      } else {
        setContent(getServiceExperienceContent(resolvedPath));
      }
      setLoading(false);
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [resolvedPath]);

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-black">
        <ActivityIndicator size="large" color="#ffffff" />
      </View>
    );
  }

  if (!content) {
    if (resolvedPath.startsWith('/services/lagos/')) {
      return <UnknownLagosServicePage />;
    }
    return null;
  }

  return <ServiceExperiencePage content={content} />;
}
