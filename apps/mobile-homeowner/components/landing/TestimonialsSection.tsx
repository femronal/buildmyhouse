import { Platform, Pressable, Text, View } from 'react-native';
import { Link } from 'expo-router';
import { ArrowRight } from 'phosphor-react-native';
import { LANDING_TESTIMONIAL_STATS, TESTIMONIALS_SECTION } from '@/lib/home-landing-content';
import { homeownerTrustindexId } from '@/lib/review-widgets';
import { trackWebEvent } from '@/lib/analytics';
import TrustindexReviews from '@/components/reviews/TrustindexReviews';

type TestimonialsSectionProps = {
  onHowItWorksPress?: () => void;
};

export default function TestimonialsSection({ onHowItWorksPress }: TestimonialsSectionProps) {
  const widgetId = homeownerTrustindexId();

  return (
    <View className="pb-6 pt-4 bg-black">
      <View className="max-w-7xl w-full self-center px-6 md:px-12">
        <View className="border border-white/10 rounded-3xl p-6 md:p-8">
          <View className="flex-row items-center gap-4 md:gap-6">
            <Text className="text-3xl md:text-4xl text-white" style={{ fontFamily: 'Poppins_600SemiBold' }}>
              Proof
            </Text>
            <View className="w-px h-8 md:h-10 bg-white/10" />
            <Text className="text-sm text-slate-400" style={{ fontFamily: 'Poppins_400Regular' }}>
              {TESTIMONIALS_SECTION.kicker}
            </Text>
          </View>

          <View className="h-px bg-white/10 mt-4" />

          <View className="bmh-testimonials-grid mt-6 md:mt-8 flex-col gap-8 md:gap-10">
            <View className="bmh-testimonials-left w-full">
              <Text
                className="text-[36px] md:text-5xl lg:text-6xl text-white leading-tight tracking-tight"
                style={{ fontFamily: 'Poppins_600SemiBold' }}
              >
                {TESTIMONIALS_SECTION.heading}
              </Text>
              <Text
                className="mt-3 text-sm md:text-base text-slate-400 max-w-xl leading-relaxed"
                style={{ fontFamily: 'Poppins_400Regular' }}
              >
                {TESTIMONIALS_SECTION.supporting}
              </Text>

              <View className="mt-6 flex-row flex-wrap gap-3">
                {LANDING_TESTIMONIAL_STATS.map((stat) => (
                  <View
                    key={stat.label}
                    className="flex-1 basis-0 min-w-[88px] rounded-2xl border border-white/10 bg-white/[0.04] p-3 md:p-5"
                  >
                    <Text
                      className="bmh-testimonial-stat-value text-lg md:text-3xl text-white"
                      style={{ fontFamily: 'Poppins_700Bold' }}
                      numberOfLines={1}
                      adjustsFontSizeToFit={Platform.OS !== 'web'}
                      minimumFontScale={0.85}
                    >
                      {stat.value}
                    </Text>
                    <Text
                      className="text-[11px] md:text-xs text-slate-400 mt-1 leading-snug"
                      style={{ fontFamily: 'Poppins_400Regular' }}
                    >
                      {stat.label}
                    </Text>
                  </View>
                ))}
              </View>

              <View className="h-px bg-white/10 mt-6" />

              <View className="flex-row flex-wrap items-center gap-3 mt-5">
                <Link href={'/start' as any} asChild>
                  <Pressable
                    onPress={() =>
                      trackWebEvent('homepage_primary_cta_clicked', {
                        placement: 'testimonials',
                        href: '/start',
                      })
                    }
                    className="h-12 px-6 rounded-lg bg-white justify-center bmh-glass-btn bmh-glass-btn-light"
                    accessibilityRole="link"
                  >
                    <Text className="text-sm text-black" style={{ fontFamily: 'Poppins_500Medium' }}>
                      Start a Tracked Project
                    </Text>
                  </Pressable>
                </Link>
                <Pressable
                  onPress={() => {
                    trackWebEvent('testimonial_engaged', { action: 'see_how_it_works' });
                    onHowItWorksPress?.();
                  }}
                  className="h-12 px-6 rounded-lg border border-white/15 bg-white/5 flex-row items-center gap-2 bmh-glass-btn bmh-glass-btn-dark"
                  accessibilityRole="button"
                >
                  <Text className="text-sm text-white" style={{ fontFamily: 'Poppins_500Medium' }}>
                    See How It Works
                  </Text>
                  <ArrowRight size={16} color="#ffffff" weight="regular" />
                </Pressable>
              </View>
            </View>

            <View className="bmh-testimonials-right relative w-full min-w-0">
              <TrustindexReviews widgetId={widgetId} />
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}
