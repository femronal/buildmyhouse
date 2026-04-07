import type { ViewStyle } from 'react-native';

/**
 * Consistent elevation for bordered cards (listing tiles, panels, empty states).
 * Use on the outermost card container; pair with an inner `overflow-hidden` + matching radius when clipping images.
 */
export const cardShadowStyle: ViewStyle = {
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.08,
  shadowRadius: 8,
  elevation: 4,
};
