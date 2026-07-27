import { Text, View } from 'react-native';
import { Link } from 'expo-router';
import BlogLottieCover from '@/components/blog/BlogLottieCover';
import {
  SeoContentBackButton,
  SeoContentColumn,
  SeoContentShell,
  seoContentTypography,
} from '@/components/seo/SeoContentLayout';
import { SeoHeading } from '@/components/seo/SeoHeading';
import {
  AMALA_JOINT_TRACKING_STORY_PATH,
  amalaJointTrackingStoryHero,
  amalaJointTrackingStorySeo,
} from '@/lib/amala-joint-tracking-story';
import { useWebSeo } from '@/lib/seo';

export default function BlogIndexPage() {
  useWebSeo({
    title: 'BuildMyHouse Blog | Founder Stories & Property Guides',
    description:
      'Founder stories and practical guides on tracking repairs, renovations and construction projects in Nigeria from home or abroad.',
    canonicalPath: '/blog',
    robots: 'index,follow',
  });

  return (
    <SeoContentShell>
      <SeoContentColumn className="pt-10 pb-10 md:pt-14">
        <SeoContentBackButton fallbackHref="/" />
        <Text className={seoContentTypography.eyebrow} style={{ fontFamily: 'Poppins_600SemiBold' }}>
          BuildMyHouse Blog
        </Text>
        <SeoHeading level={1} className={seoContentTypography.title} style={{ fontFamily: 'Poppins_700Bold' }}>
          Stories and guides for property work in Nigeria
        </SeoHeading>
        <Text className={seoContentTypography.description} style={{ fontFamily: 'Poppins_400Regular' }}>
          Editorial writing on visibility, verification and remote project monitoring — for homeowners in Nigeria and
          abroad.
        </Text>

        <Link href={AMALA_JOINT_TRACKING_STORY_PATH as any} asChild>
          <View className="mt-4 rounded-3xl border border-gray-200 bg-white p-5 active:bg-gray-50 overflow-hidden">
            <BlogLottieCover className="mb-4" />
            <Text className="text-[11px] uppercase tracking-wide text-[#059669] mb-2" style={{ fontFamily: 'Poppins_600SemiBold' }}>
              Founder story
            </Text>
            <Text className="text-black text-xl mb-2" style={{ fontFamily: 'Poppins_700Bold' }}>
              {amalaJointTrackingStoryHero.h1}
            </Text>
            <Text className="text-gray-600 text-base leading-7 mb-3" style={{ fontFamily: 'Poppins_400Regular' }}>
              {amalaJointTrackingStorySeo.description}
            </Text>
            <Text className="text-gray-500 text-sm" style={{ fontFamily: 'Poppins_400Regular' }}>
              {amalaJointTrackingStorySeo.readingMinutes} min read · {amalaJointTrackingStorySeo.authorName}
            </Text>
          </View>
        </Link>
      </SeoContentColumn>
    </SeoContentShell>
  );
}
