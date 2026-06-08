import { createElement, useEffect, useState } from 'react';
import { Platform, Text } from 'react-native';
import RotatingKeyword from '@/components/landing/RotatingKeyword';
import { HERO_KEYWORDS, LANDING_INK } from '@/lib/home-landing-content';

const headlineStyle = {
  fontFamily: 'Poppins_800ExtraBold',
  color: LANDING_INK,
  fontSize: 36,
  lineHeight: 44,
} as const;

const keywordStyle = {
  textDecorationLine: 'underline' as const,
  textDecorationColor: LANDING_INK,
  fontFamily: 'Poppins_800ExtraBold',
  color: LANDING_INK,
};

/**
 * Web: native <h1> with a <span> for the rotating keyword (no RN views inside h1).
 * Native: accessible Text header with RotatingKeyword.
 */
export default function HeroHeadline({ compact }: { compact?: boolean }) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (HERO_KEYWORDS.length <= 1) return undefined;
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % HERO_KEYWORDS.length);
    }, 5600);
    return () => clearInterval(timer);
  }, []);

  const fontSize = compact ? 30 : 40;
  const lineHeight = compact ? 38 : 48;

  if (Platform.OS === 'web') {
    return createElement(
      'h1',
      {
        className: compact ? 'text-3xl leading-tight' : 'text-4xl md:text-5xl leading-tight',
        style: { ...headlineStyle, fontSize, lineHeight, margin: 0 },
      },
      'Find verified ',
      createElement(
        'span',
        {
          style: { ...keywordStyle, fontSize, lineHeight },
          'aria-live': 'polite',
        },
        HERO_KEYWORDS[index],
      ),
      ' in Lagos, Nigeria.',
    );
  }

  return (
    <Text accessibilityRole="header" style={{ ...headlineStyle, fontSize, lineHeight }}>
      Find verified <RotatingKeyword words={HERO_KEYWORDS} /> in Lagos, Nigeria.
    </Text>
  );
}
