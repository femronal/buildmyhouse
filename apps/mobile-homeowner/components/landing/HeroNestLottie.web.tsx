import { useEffect, useState } from 'react';
import { Text, View, useWindowDimensions } from 'react-native';
import Lottie from 'lottie-react';

const animationData = require('@/assets/lottie/woodpecker-nest.json');

export default function HeroNestLottie() {
  const { width } = useWindowDimensions();
  const isMobile = width < 768;
  const isDesktop = width >= 1024;
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const sync = () => setReduceMotion(media.matches);
    sync();
    media.addEventListener?.('change', sync);
    return () => media.removeEventListener?.('change', sync);
  }, []);

  // Mobile keeps the current compact size; desktop gets a much larger hero visual.
  const size = isMobile
    ? Math.min(width - 48, 300)
    : isDesktop
      ? Math.min(Math.round(width * 0.42), 680)
      : 480;

  return (
    <View className="w-full items-center justify-center" accessibilityRole="image">
      <View
        className="items-center justify-center rounded-full"
        style={{ width: size, height: size, maxWidth: '100%' }}
        accessibilityLabel="Woodpecker carefully building a nest. Intentional home-building from afar."
      >
        <Lottie
          animationData={animationData}
          loop={!reduceMotion}
          autoplay={!reduceMotion}
          style={{ width: '100%', height: '100%' }}
          rendererSettings={{ preserveAspectRatio: 'xMidYMid meet' }}
        />
      </View>
      <Text
        className="mt-3 text-center text-xs uppercase tracking-[0.16em] text-slate-400"
        style={{ fontFamily: 'Poppins_600SemiBold' }}
      >
        Building with care, from afar
      </Text>
    </View>
  );
}
