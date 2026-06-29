import { createElement, type ComponentProps, type ReactNode } from 'react';
import { Platform, View } from 'react-native';

type LandmarkTag = 'header' | 'nav' | 'main' | 'footer' | 'section' | 'form';

type WebLandmarkProps = {
  tag: LandmarkTag;
  className?: string;
  children: ReactNode;
  id?: string;
  role?: string;
  'aria-label'?: string;
  onSubmit?: ComponentProps<'form'>['onSubmit'];
};

export default function WebLandmark({
  tag,
  className,
  children,
  id,
  role,
  'aria-label': ariaLabel,
  onSubmit,
}: WebLandmarkProps) {
  if (Platform.OS === 'web') {
    const landmarkClass = ['bmh-web-landmark', className].filter(Boolean).join(' ');
    return createElement(
      tag,
      {
        className: landmarkClass,
        id,
        role,
        'aria-label': ariaLabel,
        onSubmit,
      },
      children,
    );
  }

  return <View className={className}>{children}</View>;
}
