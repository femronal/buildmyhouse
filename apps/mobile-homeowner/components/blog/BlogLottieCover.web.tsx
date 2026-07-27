import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import Lottie from 'lottie-react';

const animationData = require('@/assets/lottie/construction-worker-building-wall.json');

type BlogLottieCoverProps = {
  className?: string;
};

export default function BlogLottieCover({ className = 'mb-8' }: BlogLottieCoverProps) {
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
      accessibilityLabel="Construction worker building a wall illustration"
      accessibilityRole="image"
    >
      <View className="w-full self-center max-w-[520px] mx-auto p-4 md:p-6">
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
