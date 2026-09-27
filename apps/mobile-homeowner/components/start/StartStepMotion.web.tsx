import { View } from 'react-native';
import { takeStartDirection, type StartMotion } from '@/lib/start-project/motion';

export default function StartStepMotion({
  pathname,
  children,
}: {
  pathname: string;
  children: React.ReactNode;
}) {
  const reduce =
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const motion: StartMotion = reduce ? 'none' : takeStartDirection(pathname);

  return (
    <View
      key={pathname}
      className={motion === 'none' ? undefined : `bmh-start-step bmh-start-step-${motion}`}
    >
      {children}
    </View>
  );
}
