import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  buildLandingServiceLinks,
  buildPopularServiceChips,
} from '@buildmyhouse/shared-types';
import { fetchPublishedServicePages } from '@/lib/cms-service-pages';

export function useLandingServiceLinks() {
  const { data: cmsPages = [] } = useQuery({
    queryKey: ['cms-service-pages', 'published'],
    queryFn: fetchPublishedServicePages,
    staleTime: 5 * 60 * 1000,
  });

  const popularLinks = useMemo(() => buildLandingServiceLinks(cmsPages), [cmsPages]);
  const popularChips = useMemo(() => buildPopularServiceChips(cmsPages), [cmsPages]);

  return { popularLinks, popularChips };
}
