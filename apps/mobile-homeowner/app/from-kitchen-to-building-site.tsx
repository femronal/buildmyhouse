import { Redirect } from 'expo-router';
import { AMALA_JOINT_TRACKING_STORY_PATH } from '@/lib/amala-joint-tracking-story';
import { useWebSeo } from '@/lib/seo';

/** Legacy path referenced by earlier Amala Joint builds — permanent redirect to the founder story. */
export default function FromKitchenToBuildingSiteRedirect() {
  useWebSeo({
    title: 'Redirecting…',
    description: 'This page has moved to the BuildMyHouse founder story.',
    canonicalPath: AMALA_JOINT_TRACKING_STORY_PATH,
    robots: 'noindex,follow',
  });

  return <Redirect href={AMALA_JOINT_TRACKING_STORY_PATH as any} />;
}
