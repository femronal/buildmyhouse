import { Text, View } from 'react-native';
import { TESTIMONIALS_SECTION } from '@/lib/home-landing-content';
import { homeownerTrustindexId } from '@/lib/review-widgets';
import TrustindexReviews from '@/components/reviews/TrustindexReviews';

export default function TestimonialsSection() {
  const widgetId = homeownerTrustindexId();

  return (
    <View className="bg-black px-6 py-16 md:px-12 md:py-24">
      <View className="w-full max-w-7xl self-center">
        <Text
          className="mb-10 max-w-4xl self-center text-center text-3xl leading-tight text-white md:mb-14 md:text-4xl"
          style={{ fontFamily: 'Poppins_600SemiBold' }}
        >
          {TESTIMONIALS_SECTION.heading}
        </Text>
        <TrustindexReviews widgetId={widgetId} />
      </View>
    </View>
  );
}
