import { useState } from 'react';
import { Pressable, Text, View, Platform } from 'react-native';
import Svg, { Path } from 'react-native-svg';

const ARROW_PATH =
  'M16.1716 10.9999L10.8076 5.63589L12.2218 4.22168L20 11.9999L12.2218 19.778L10.8076 18.3638L16.1716 12.9999H4V10.9999H16.1716Z';

type AnimatedCtaButtonProps = {
  label: string;
  onPress: () => void;
  /** Compact sizing when projects are listed above the button. */
  compact?: boolean;
};

function ArrowIcon({ fill }: { fill: string }) {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24">
      <Path d={ARROW_PATH} fill={fill} />
    </Svg>
  );
}

/** Aura.build animated CTA — white ring + expanding fill on hover/press. */
export default function AnimatedCtaButton({ label, onPress, compact }: AnimatedCtaButtonProps) {
  const [active, setActive] = useState(false);
  const arrowFill = active ? '#000000' : '#ffffff';
  const isNative = Platform.OS !== 'web';

  return (
    <Pressable
      onPress={onPress}
      onHoverIn={() => setActive(true)}
      onHoverOut={() => setActive(false)}
      onPressIn={() => setActive(true)}
      onPressOut={() => setActive(false)}
      accessibilityRole="button"
      className={`bmh-animated-cta self-center ${active ? 'bmh-animated-cta-active' : ''} ${compact ? 'bmh-animated-cta-compact' : ''}`}
    >
      <View
        className="bmh-animated-cta-arr bmh-animated-cta-arr-2"
        pointerEvents="none"
        style={isNative ? (active ? { left: 16 } : { left: -60 }) : undefined}
      >
        <ArrowIcon fill={arrowFill} />
      </View>

      <Text
        className={`bmh-animated-cta-text ${active ? 'bmh-animated-cta-text-active' : ''}`}
        style={{
          fontFamily: 'Poppins_600SemiBold',
          ...(isNative
            ? {
                color: active ? '#000000' : '#ffffff',
                transform: [{ translateX: active ? 12 : -12 }],
              }
            : null),
        }}
      >
        {label}
      </Text>

      <View
        className={`bmh-animated-cta-circle ${active ? 'bmh-animated-cta-circle-active' : ''}`}
        style={
          isNative
            ? active
              ? { width: 220, height: 220, marginTop: -110, marginLeft: -110, opacity: 1 }
              : { width: 20, height: 20, marginTop: -10, marginLeft: -10, opacity: 0 }
            : undefined
        }
      />

      <View
        className="bmh-animated-cta-arr bmh-animated-cta-arr-1"
        pointerEvents="none"
        style={isNative ? (active ? { right: -60 } : { right: 16 }) : undefined}
      >
        <ArrowIcon fill={arrowFill} />
      </View>
    </Pressable>
  );
}
