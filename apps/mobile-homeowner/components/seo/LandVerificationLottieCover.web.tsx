import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import Lottie from 'lottie-react';

const animationData = require('@/assets/lottie/land-for-sale-duotone.json');

type LandVerificationLottieCoverProps = {
  className?: string;
};

export default function LandVerificationLottieCover({
  className = 'mb-8',
}: LandVerificationLottieCoverProps) {
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const sync = () => setReduceMotion(media.matches);
    sync();
    media.addEventListener?.('change', sync);
    return () => media.removeEventListener?.('change', sync);
  }, []);

  return (
    <View
      className={`overflow-hidden rounded-3xl border border-gray-200 bg-[#f4f6f4] ${className}`.trim()}
      accessibilityLabel="Land for sale duotone illustration for land verification guide"
      accessibilityRole="image"
    >
      <View className="w-full self-center max-w-[560px] mx-auto p-4 md:p-6">
        <Lottie
          animationData={animationData}
          loop={!reduceMotion}
          autoplay={!reduceMotion}
          style={{ width: '100%', height: 'auto' }}
          rendererSettings={{ preserveAspectRatio: 'xMidYMid meet' }}
        />
      </View>
      {reduceMotion ? (
        <Text
          className="text-center text-gray-500 text-xs pb-3"
          style={{ fontFamily: 'Poppins_400Regular' }}
        >
          Animation paused due to reduced-motion preference
        </Text>
      ) : null}
    </View>
  );
}
