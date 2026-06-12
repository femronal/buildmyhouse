import { useCallback } from 'react';
import { Linking, Pressable, Text, View } from 'react-native';
import { ArrowSquareOut, Star } from 'phosphor-react-native';
import { GOOGLE_BUSINESS_REVIEW, TRUSTPILOT_REVIEW } from '@/lib/home-landing-content';

const TRUSTPILOT_GREEN = '#00b67a';
const GOOGLE_GOLD = '#FBBC04';

function StarRating({ color }: { color: string }) {
  return (
    <View className="flex-row items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, index) => (
        <Star key={index} size={18} color={color} weight="fill" />
      ))}
    </View>
  );
}

type ReviewColumnProps = {
  platformLabel: string;
  starColor: string;
  title: string;
  description: string;
  buttonLabel: string;
  buttonBgClass: string;
  onPress: () => void;
  accessibilityLabel: string;
};

function ReviewColumn({
  platformLabel,
  starColor,
  title,
  description,
  buttonLabel,
  buttonBgClass,
  onPress,
  accessibilityLabel,
}: ReviewColumnProps) {
  return (
    <View className="flex-1 min-w-0">
      <View className="flex-row items-center gap-3 mb-4">
        <StarRating color={starColor} />
        <Text className="text-xs uppercase tracking-widest text-slate-400" style={{ fontFamily: 'Poppins_600SemiBold' }}>
          {platformLabel}
        </Text>
      </View>

      <Text className="text-2xl md:text-3xl text-white leading-tight mb-3" style={{ fontFamily: 'Poppins_600SemiBold' }}>
        {title}
      </Text>

      <Text className="text-sm md:text-base text-slate-400 leading-relaxed" style={{ fontFamily: 'Poppins_400Regular' }}>
        {description}
      </Text>

      <Pressable
        onPress={onPress}
        className={`mt-6 h-12 px-6 rounded-lg self-start flex-row items-center gap-2 bmh-glass-btn ${buttonBgClass}`}
        accessibilityRole="link"
        accessibilityLabel={accessibilityLabel}
      >
        <Text className="text-sm text-white" style={{ fontFamily: 'Poppins_600SemiBold' }}>
          {buttonLabel}
        </Text>
        <ArrowSquareOut size={16} color="#ffffff" weight="bold" />
      </Pressable>
    </View>
  );
}

export default function TrustpilotReviewSection() {
  const openTrustpilotReview = useCallback(() => {
    Linking.openURL(TRUSTPILOT_REVIEW.evaluateUrl);
  }, []);

  const openGoogleReview = useCallback(() => {
    Linking.openURL(GOOGLE_BUSINESS_REVIEW.reviewUrl);
  }, []);

  return (
    <View className="bg-black border-t border-white/10 pb-20 pt-2">
      <View className="max-w-7xl w-full self-center px-6 md:px-12">
        <View className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 md:p-8">
          <View className="flex-col lg:flex-row gap-10 lg:gap-12">
            <ReviewColumn
              platformLabel="Trustpilot"
              starColor={TRUSTPILOT_GREEN}
              title="Used BuildMyHouse? Drop us a review"
              description="Your feedback helps other homeowners in Lagos and abroad choose verified workers with more confidence. It only takes a minute."
              buttonLabel="Review BuildMyHouse on Trustpilot"
              buttonBgClass="bg-[#00b67a]"
              onPress={openTrustpilotReview}
              accessibilityLabel="Leave a review on Trustpilot"
            />

            <View className="hidden lg:block w-px bg-white/10 self-stretch" />

            <View className="h-px bg-white/10 lg:hidden" />

            <ReviewColumn
              platformLabel="Google"
              starColor={GOOGLE_GOLD}
              title="Had a great experience with us?"
              description="Leave a review on our Google Business profile so local homeowners and diaspora clients can find BuildMyHouse with confidence."
              buttonLabel="Review BuildMyHouse on Google"
              buttonBgClass="bg-[#4285F4]"
              onPress={openGoogleReview}
              accessibilityLabel="Leave a review on Google"
            />
          </View>
        </View>
      </View>
    </View>
  );
}
