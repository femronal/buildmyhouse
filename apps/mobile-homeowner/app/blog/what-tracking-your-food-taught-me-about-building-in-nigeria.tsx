import AmalaJointTrackingStoryPage from '@/components/blog/AmalaJointTrackingStoryPage';
import {
  amalaJointTrackingStorySeo,
  buildAmalaJointTrackingStoryJsonLd,
} from '@/lib/amala-joint-tracking-story';
import { useWebSeo } from '@/lib/seo';

export default function AmalaJointTrackingStoryRoute() {
  useWebSeo({
    title: amalaJointTrackingStorySeo.title,
    description: amalaJointTrackingStorySeo.description,
    canonicalPath: amalaJointTrackingStorySeo.canonicalPath,
    robots: 'index,follow',
    ogImage: amalaJointTrackingStorySeo.ogImage,
    jsonLd: buildAmalaJointTrackingStoryJsonLd(),
  });

  return <AmalaJointTrackingStoryPage />;
}
