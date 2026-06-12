import { Platform, View, useWindowDimensions, type ViewStyle } from 'react-native';
import LogoTextWhiteIcon from '@/assets/images/logo-text-white.svg';
import LogoTextBlackIcon from '@/assets/images/logo-text-black.svg';

type LogoTextVariant = 'white' | 'black';
type LogoTextSize = 'sm' | 'md' | 'lg' | 'xl';

/** Wordmark aspect ratio after SVG viewBox crop (342 × 42). */
const ASPECT_RATIO = 342 / 42;

const baseWidths: Record<LogoTextSize, number> = {
  sm: 180,
  md: 220,
  lg: 260,
  xl: 300,
};

type LogoTextProps = {
  variant?: LogoTextVariant;
  size?: LogoTextSize;
  style?: ViewStyle;
};

export default function LogoText({ variant = 'black', size = 'md', style }: LogoTextProps) {
  const { width: viewportWidth } = useWindowDimensions();
  const baseWidth = baseWidths[size];

  const maxWidth =
    size === 'xl'
      ? Math.min(320, Math.max(240, Math.floor(viewportWidth * 0.62)))
      : Math.min(baseWidth, Math.max(baseWidth * 0.9, Math.floor(viewportWidth * 0.5)));

  const height = Math.round(maxWidth / ASPECT_RATIO);
  const Icon = variant === 'white' ? LogoTextWhiteIcon : LogoTextBlackIcon;

  return (
    <View style={[{ width: maxWidth, height }, style]}>
      <Icon width={maxWidth} height={height} />
    </View>
  );
}
