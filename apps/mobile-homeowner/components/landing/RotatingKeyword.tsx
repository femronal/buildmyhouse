import { useEffect, useRef, useState } from 'react';
import { Animated } from 'react-native';
import { LANDING_INK } from '@/lib/home-landing-content';

type RotatingKeywordProps = {
  words: readonly string[];
  intervalMs?: number;
};

export default function RotatingKeyword({ words, intervalMs = 5600 }: RotatingKeywordProps) {
  const [index, setIndex] = useState(0);
  const opacity = useRef(new Animated.Value(1)).current;
  const translateY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (words.length <= 1) return undefined;

    const timer = setInterval(() => {
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 0,
          duration: 180,
          useNativeDriver: false,
        }),
        Animated.timing(translateY, {
          toValue: -4,
          duration: 180,
          useNativeDriver: false,
        }),
      ]).start(({ finished }) => {
        if (!finished) return;
        setIndex((prev) => (prev + 1) % words.length);
        translateY.setValue(4);
        Animated.parallel([
          Animated.timing(opacity, {
            toValue: 1,
            duration: 220,
            useNativeDriver: false,
          }),
          Animated.timing(translateY, {
            toValue: 0,
            duration: 220,
            useNativeDriver: false,
          }),
        ]).start();
      });
    }, intervalMs);

    return () => clearInterval(timer);
  }, [intervalMs, opacity, translateY, words]);

  const currentWord = words[index] || '';

  return (
    <Animated.Text
      style={{
        opacity,
        transform: [{ translateY }],
        color: LANDING_INK,
        textDecorationLine: 'underline',
        textDecorationColor: LANDING_INK,
        textDecorationStyle: 'solid',
      }}
      accessibilityLabel={currentWord}
    >
      {currentWord}
    </Animated.Text>
  );
}
