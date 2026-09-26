import { useEffect, useState } from 'react';
import { View } from 'react-native';
import Lottie from 'lottie-react';

const animationData = require('@/assets/lottie/repair-wrench.json');

const SIZE = 48;

export default function StartRepairIcon() {
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
    <View style={{ width: SIZE, height: SIZE }} accessibilityRole="image" accessibilityLabel="Repair">
      <Lottie
        animationData={animationData}
        loop={!reduceMotion}
        autoplay={!reduceMotion}
        style={{ width: SIZE, height: SIZE }}
        rendererSettings={{ preserveAspectRatio: 'xMidYMid meet' }}
      />
    </View>
  );
}
