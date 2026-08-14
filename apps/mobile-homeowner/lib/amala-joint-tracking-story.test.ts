import { Platform } from 'react-native';
import {
  AMALA_JOINT_TRACKING_STORY_PATH,
  amalaJointTrackingStoryFaqs,
  amalaJointTrackingStoryHero,
  amalaJointTrackingStorySeo,
  buildAmalaJointTrackingStoryJsonLd,
  isAmalaJointVisitor,
  parseAmalaUtmParams,
  withPreservedCampaignParams,
} from '@/lib/amala-joint-tracking-story';
import {
  createAmalaStoryScrollTracker,
  resetAmalaStoryAnalyticsForTests,
  trackAmalaStoryEventOnce,
} from '@/lib/amala-joint-tracking-story-analytics';

describe('amala joint tracking story SEO', () => {
  it('uses the preferred blog route and metadata', () => {
    expect(AMALA_JOINT_TRACKING_STORY_PATH).toBe(
      '/blog/what-tracking-your-food-taught-me-about-building-in-nigeria',
    );
    expect(amalaJointTrackingStorySeo.title).toContain('Why I Built BuildMyHouse');
    expect(amalaJointTrackingStorySeo.canonicalPath).toBe(AMALA_JOINT_TRACKING_STORY_PATH);
    expect(amalaJointTrackingStoryHero.h1).toBe('Why I Built BuildMyHouse');
  });

  it('builds BlogPosting + FAQ JSON-LD that matches visible FAQs', () => {
    const graph = buildAmalaJointTrackingStoryJsonLd();
    const article = graph.find((node) => node['@type'] === 'BlogPosting');
    const faq = graph.find((node) => node['@type'] === 'FAQPage') as {
      mainEntity: Array<{ name: string; acceptedAnswer: { text: string } }>;
    };

    expect(article).toBeTruthy();
    expect(article?.author).toEqual({ '@type': 'Person', name: 'Femi Okunola' });
    expect(faq.mainEntity).toHaveLength(amalaJointTrackingStoryFaqs.length);
    expect(faq.mainEntity[0].name).toBe(amalaJointTrackingStoryFaqs[0].question);
    expect(faq.mainEntity[0].acceptedAnswer.text).toBe(amalaJointTrackingStoryFaqs[0].answer);
    expect(JSON.stringify(graph)).not.toContain('escrow');
  });
});

describe('amala joint visitor detection', () => {
  it('detects amala_joint utm_source', () => {
    const utm = parseAmalaUtmParams(
      '?utm_source=amala_joint&utm_medium=order_tracking&utm_campaign=kitchen_to_building_site&utm_content=ready',
    );
    expect(isAmalaJointVisitor(utm)).toBe(true);
    expect(utm.content).toBe('ready');
  });

  it('does not treat organic visitors as Amala Joint traffic', () => {
    expect(isAmalaJointVisitor(parseAmalaUtmParams(''))).toBe(false);
    expect(isAmalaJointVisitor(parseAmalaUtmParams('?utm_source=google'))).toBe(false);
  });

  it('preserves campaign params on CTA hrefs without leaking order ids', () => {
    const href = withPreservedCampaignParams('/location?mode=explore', {
      source: 'amala_joint',
      medium: 'order_tracking',
      campaign: 'kitchen_to_building_site',
      content: 'preparing',
    });
    const url = new URL(`https://buildmyhouse.app${href}`);
    expect(url.searchParams.get('mode')).toBe('explore');
    expect(url.searchParams.get('utm_source')).toBe('amala_joint');
    expect(url.searchParams.get('utm_content')).toBe('preparing');
    expect(href).not.toContain('orderId');
    expect(href).not.toContain('AJ-');
  });
});

describe('amala story analytics', () => {
  const gtagCalls: unknown[][] = [];
  const originalOs = Platform.OS;

  beforeEach(() => {
    resetAmalaStoryAnalyticsForTests();
    gtagCalls.length = 0;
    Object.defineProperty(Platform, 'OS', { configurable: true, get: () => 'web' });
    (global as any).window = {
      gtag: (...args: unknown[]) => {
        gtagCalls.push(args);
      },
    };
  });

  afterEach(() => {
    Object.defineProperty(Platform, 'OS', { configurable: true, get: () => originalOs });
    delete (global as any).window;
  });

  it('fires scroll thresholds once', () => {
    const tracker = createAmalaStoryScrollTracker({ source: 'amala_joint' });
    tracker(250, 1000, 0);
    tracker(500, 1000, 0);
    tracker(750, 1000, 0);
    tracker(900, 1000, 0);
    tracker(950, 1000, 0);

    const eventNames = gtagCalls.map((call) => call[1]);
    expect(eventNames.filter((name) => name === 'amala_joint_story_25_percent')).toHaveLength(1);
    expect(eventNames.filter((name) => name === 'amala_joint_story_50_percent')).toHaveLength(1);
    expect(eventNames.filter((name) => name === 'amala_joint_story_75_percent')).toHaveLength(1);
    expect(eventNames.filter((name) => name === 'amala_joint_story_90_percent')).toHaveLength(1);
  });

  it('does not throw when gtag fails', () => {
    (global as any).window.gtag = () => {
      throw new Error('analytics down');
    };
    expect(() =>
      trackAmalaStoryEventOnce('amala_joint_story_primary_cta_clicked', { source: 'amala_joint' }),
    ).not.toThrow();
  });
});
