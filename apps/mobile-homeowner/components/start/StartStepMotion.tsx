import { useEffect, useRef } from 'react';
import { AccessibilityInfo, Animated, Easing, View } from 'react-native';
import { takeStartDirection } from '@/lib/start-project/motion';

export default function StartStepMotion({
  pathname,
  children,
}: {
  pathname: string;
  children: React.ReactNode;
}) {
  const motion = takeStartDirection(pathname);
  const progress = useRef(new Animated.Value(motion === 'none' ? 1 : 0)).current;

  useEffect(() => {
    let cancelled = false;
    AccessibilityInfo.isReduceMotionEnabled().then((reduce) => {
      if (cancelled) return;
      if (reduce || motion === 'none') {
        progress.setValue(1);
        return;
      }
      progress.setValue(0);
      Animated.timing(progress, {
        toValue: 1,
        duration: 320,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
    });
    return () => {
      cancelled = true;
    };
  }, [motion, pathname, progress]);

  const translateX = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [motion === 'back' ? -24 : 24, 0],
  });

  return (
    <Animated.View style={{ opacity: progress, transform: [{ translateX }] }}>
      <View>{children}</View>
    </Animated.View>
  );
}
