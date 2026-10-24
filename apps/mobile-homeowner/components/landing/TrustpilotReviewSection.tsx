import { useCallback, type ReactNode } from 'react';
import { Linking, Platform, Pressable, Text, View } from 'react-native';
import { ArrowSquareOut } from 'phosphor-react-native';
import { GOOGLE_BUSINESS_REVIEW, TRUSTPILOT_REVIEW } from '@/lib/home-landing-content';
import { trustpilotBusinessUnitId } from '@/lib/review-widgets';
import TrustpilotCollector from '@/components/reviews/TrustpilotCollector';

function openInNewTab(url: string) {
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    window.open(url, '_blank', 'noopener,noreferrer');
    return;
  }
  Linking.openURL(url);
}

type ReviewColumnProps = {
  platformLabel: string;
  title: string;
  description: string;
  buttonLabel: string;
  buttonBgClass: string;
  onPress: () => void;
  accessibilityLabel: string;
  button?: ReactNode;
};

function ReviewColumn({
  platformLabel,
  title,
  description,
  buttonLabel,
  buttonBgClass,
  onPress,
  accessibilityLabel,
  button,
}: ReviewColumnProps) {
  return (
    <View className="flex-1 min-w-0">
      <Text className="text-xs uppercase tracking-widest text-slate-400 mb-4" style={{ fontFamily: 'Poppins_600SemiBold' }}>
        {platformLabel}
      </Text>

      <Text className="text-2xl md:text-3xl text-white leading-tight mb-3" style={{ fontFamily: 'Poppins_600SemiBold' }}>
        {title}
      </Text>

      <Text className="text-sm md:text-base text-slate-400 leading-relaxed" style={{ fontFamily: 'Poppins_400Regular' }}>
        {description}
      </Text>

      {button ?? (
        <Pressable
          onPress={onPress}
          className={`mt-6 h-11 md:h-12 px-4 md:px-6 rounded-lg self-start max-w-full flex-row items-center gap-2 bmh-glass-btn ${buttonBgClass}`}
          accessibilityRole="link"
          accessibilityLabel={accessibilityLabel}
        >
          <Text
            className="text-[11px] md:text-sm text-white shrink"
            style={{ fontFamily: 'Poppins_600SemiBold' }}
            numberOfLines={1}
          >
            {buttonLabel}
          </Text>
          <ArrowSquareOut size={16} color="#ffffff" weight="bold" />
        </Pressable>
      )}
    </View>
  );
}

export default function TrustpilotReviewSection() {
  const trustpilotWidget = trustpilotBusinessUnitId();
  const openTrustpilotReview = useCallback(() => {
    openInNewTab(TRUSTPILOT_REVIEW.evaluateUrl);
  }, []);

  const openGoogleReview = useCallback(() => {
    openInNewTab(GOOGLE_BUSINESS_REVIEW.reviewUrl);
  }, []);

  const openTrustpilotReviews = useCallback(() => {
    openInNewTab(TRUSTPILOT_REVIEW.profileUrl);
  }, []);

  return (
    <View className="bg-black border-t border-white/10 pb-20 pt-2">
      <View className="max-w-7xl w-full self-center px-6 md:px-12">
        <View className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 md:p-8">
          <View className="flex-col lg:flex-row gap-10 lg:gap-12">
            <ReviewColumn
              platformLabel="Trustpilot"
              title="Used BuildMyHouse? Drop us a review"
              description="Your feedback helps other homeowners in Nigeria and abroad choose verified workers with more confidence. It only takes a minute."
              buttonLabel="Review BuildMyHouse on Trustpilot"
              buttonBgClass="bg-[#00b67a]"
              onPress={openTrustpilotReview}
              accessibilityLabel="Leave a review on Trustpilot"
              button={trustpilotWidget ? <View className="mt-6 self-start"><TrustpilotCollector /></View> : undefined}
            />

            <View className="hidden lg:block w-px bg-white/10 self-stretch" />

            <View className="h-px bg-white/10 lg:hidden" />

            <ReviewColumn
              platformLabel="Google"
              title="Had a great experience with us?"
              description="Leave a review on our Google Business profile so local homeowners and diaspora clients can find BuildMyHouse with confidence."
              buttonLabel="Review BuildMyHouse on Google"
              buttonBgClass="bg-[#4285F4]"
              onPress={openGoogleReview}
              accessibilityLabel="Leave a review on Google"
            />
          </View>

          <Pressable
            onPress={openTrustpilotReviews}
            className="mt-8 self-start"
            accessibilityRole="link"
            accessibilityLabel="Read our reviews on Trustpilot"
          >
            <Text className="text-sm text-white underline" style={{ fontFamily: 'Poppins_500Medium' }}>
              Read our reviews on Trustpilot
            </Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}
