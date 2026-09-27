import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import Lottie from 'lottie-react';

const animationData = require('@/assets/lottie/house-renovation.json');

type HouseRenovationLottieCoverProps = {
  className?: string;
  height?: number;
};

export default function HouseRenovationLottieCover({
  className = 'mb-4',
  height = 220,
}: HouseRenovationLottieCoverProps) {
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
      className={`w-full overflow-hidden rounded-2xl border border-black bg-white ${className}`.trim()}
      style={{ height }}
      accessibilityLabel="House renovation illustration"
      accessibilityRole="image"
    >
      <Lottie
        animationData={animationData}
        loop={!reduceMotion}
        autoplay={!reduceMotion}
        style={{ width: '100%', height: '100%' }}
        rendererSettings={{ preserveAspectRatio: 'xMidYMid meet' }}
      />
      {reduceMotion ? (
        <Text className="text-center text-gray-500 text-xs pb-2" style={{ fontFamily: 'Poppins_400Regular' }}>
          Animation paused
        </Text>
      ) : null}
    </View>
  );
}
