import { Platform } from 'react-native';
import { trackWebEvent } from '@/lib/analytics';
import type { AmalaUtmParams } from '@/lib/amala-joint-tracking-story';

const fired = new Set<string>();

function safeTrack(eventName: string, params?: Record<string, string | undefined>) {
  try {
    if (Platform.OS !== 'web') return;
    trackWebEvent(eventName, {
      page_path: '/blog/what-tracking-your-food-taught-me-about-building-in-nigeria',
      source: params?.source,
      medium: params?.medium,
      campaign: params?.campaign,
      content_variant: params?.content,
      destination_type: params?.destination_type,
    });
  } catch {
    // Analytics must never break rendering or navigation.
  }
}

export function trackAmalaStoryEventOnce(
  eventName: string,
  utm: AmalaUtmParams,
  extra?: { destination_type?: string },
) {
  if (fired.has(eventName)) return;
  fired.add(eventName);
  safeTrack(eventName, {
    source: utm.source,
    medium: utm.medium,
    campaign: utm.campaign,
    content: utm.content,
    destination_type: extra?.destination_type,
  });
}

/** Reset only for tests. */
export function resetAmalaStoryAnalyticsForTests() {
  fired.clear();
}

export function createAmalaStoryScrollTracker(utm: AmalaUtmParams) {
  const thresholds = [
    { ratio: 0.25, event: 'amala_joint_story_25_percent' },
    { ratio: 0.5, event: 'amala_joint_story_50_percent' },
    { ratio: 0.75, event: 'amala_joint_story_75_percent' },
    { ratio: 0.9, event: 'amala_joint_story_90_percent' },
  ] as const;

  return (scrollY: number, contentHeight: number, layoutHeight: number) => {
    const traversable = Math.max(1, contentHeight - layoutHeight);
    const progress = Math.min(1, Math.max(0, scrollY / traversable));
    for (const item of thresholds) {
      if (progress >= item.ratio) {
        trackAmalaStoryEventOnce(item.event, utm);
      }
    }
  };
}
