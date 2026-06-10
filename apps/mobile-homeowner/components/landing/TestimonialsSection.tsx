import { Platform, Pressable, ScrollView, Text, View } from 'react-native';
import { Link } from 'expo-router';
import { ArrowRight, Star } from 'phosphor-react-native';
import { LANDING_TESTIMONIALS, LANDING_TESTIMONIAL_STATS, type LandingTestimonial } from '@/lib/home-landing-content';

type TestimonialsSectionProps = {
  onHowItWorksPress?: () => void;
};

function StarRating() {
  return (
    <View className="flex-row items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, index) => (
        <Star key={index} size={14} color="#ffffff" weight="fill" />
      ))}
    </View>
  );
}

function TestimonialCard({ testimonial }: { testimonial: LandingTestimonial }) {
  return (
    <View className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 md:p-8 shrink-0">
      <Text className="text-lg text-white" style={{ fontFamily: 'Poppins_600SemiBold' }}>
        {testimonial.name}
      </Text>
      <Text className="text-xs text-slate-400 mt-0.5" style={{ fontFamily: 'Poppins_400Regular' }}>
        {testimonial.role}
      </Text>

      <View className="h-px bg-white/10 my-4" />

      <View className="flex-row items-center gap-2 mb-3">
        <Text className="text-sm text-white" style={{ fontFamily: 'Poppins_500Medium' }}>
          5.0
        </Text>
        <StarRating />
      </View>

      <Text className="text-sm md:text-base text-slate-300 leading-relaxed" style={{ fontFamily: 'Poppins_400Regular' }}>
        &ldquo;{testimonial.quote}&rdquo;
      </Text>

      <View className="flex-row flex-wrap items-center gap-2 mt-4">
        <View className="rounded-full px-2.5 py-1 border border-white/15 bg-white/5">
          <Text className="text-xs text-white" style={{ fontFamily: 'Poppins_500Medium' }}>
            {testimonial.tag}
          </Text>
        </View>
        <Text className="text-xs text-slate-500" style={{ fontFamily: 'Poppins_400Regular' }}>
          {testimonial.tagDetail}
        </Text>
      </View>
    </View>
  );
}

export default function TestimonialsSection({ onHowItWorksPress }: TestimonialsSectionProps) {
  const scrollItems = [...LANDING_TESTIMONIALS, ...LANDING_TESTIMONIALS];

  return (
    <View className="pb-24 pt-4 bg-black">
      <View className="max-w-7xl w-full self-center px-6 md:px-12">
        <View className="border border-white/10 rounded-3xl p-6 md:p-8">
          <View className="flex-row items-center gap-4 md:gap-6">
            <Text className="text-3xl md:text-4xl text-white" style={{ fontFamily: 'Poppins_600SemiBold' }}>
              Testimonials
            </Text>
            <View className="w-px h-8 md:h-10 bg-white/10" />
            <Text className="text-sm text-slate-400 lowercase" style={{ fontFamily: 'Poppins_400Regular' }}>
              real project stories
            </Text>
          </View>

          <View className="h-px bg-white/10 mt-4" />

          <View className="bmh-testimonials-grid mt-6 md:mt-8 flex-col gap-8 md:gap-10">
            <View className="bmh-testimonials-left w-full">
              <Text
                className="text-[36px] md:text-5xl lg:text-6xl text-white leading-tight tracking-tight"
                style={{ fontFamily: 'Poppins_600SemiBold' }}
              >
                When WhatsApp is not enough
              </Text>
              <Text
                className="mt-3 text-sm md:text-base text-slate-400 max-w-xl leading-relaxed"
                style={{ fontFamily: 'Poppins_400Regular' }}
              >
                For repairs, renovations, and builds in Lagos — whether you are on site or monitoring from abroad.
                Verified workers, staged updates, and evidence before you pay.
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
                <Link href={'/location?mode=explore' as any} asChild>
                  <Pressable
                    className="h-12 px-6 rounded-lg bg-white justify-center bmh-glass-btn bmh-glass-btn-light"
                    accessibilityRole="link"
                  >
                    <Text className="text-sm text-black" style={{ fontFamily: 'Poppins_500Medium' }}>
                      Start a tracked project
                    </Text>
                  </Pressable>
                </Link>
                <Pressable
                  onPress={onHowItWorksPress}
                  className="h-12 px-6 rounded-lg border border-white/15 bg-white/5 flex-row items-center gap-2 bmh-glass-btn bmh-glass-btn-dark"
                  accessibilityRole="button"
                >
                  <Text className="text-sm text-white" style={{ fontFamily: 'Poppins_500Medium' }}>
                    See how it works
                  </Text>
                  <ArrowRight size={16} color="#ffffff" weight="regular" />
                </Pressable>
              </View>
            </View>

            <View className="bmh-testimonials-right relative w-full overflow-hidden rounded-3xl h-[420px] md:h-[560px]">
              {Platform.OS === 'web' ? (
                <>
                  <View className="bmh-testimonial-scroll-inner flex-col gap-6">
                    {scrollItems.map((testimonial, index) => (
                      <TestimonialCard key={`${testimonial.name}-${index}`} testimonial={testimonial} />
                    ))}
                  </View>
                  <View className="absolute inset-x-0 top-0 h-24 md:h-32 bg-gradient-to-b from-black via-black/90 to-transparent pointer-events-none z-10" />
                  <View className="absolute inset-x-0 bottom-0 h-24 md:h-32 bg-gradient-to-t from-black via-black/90 to-transparent pointer-events-none z-10" />
                </>
              ) : (
                <ScrollView showsVerticalScrollIndicator={false} className="flex-1">
                  <View className="gap-6">
                    {LANDING_TESTIMONIALS.map((testimonial) => (
                      <TestimonialCard key={testimonial.name} testimonial={testimonial} />
                    ))}
                  </View>
                </ScrollView>
              )}
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}
