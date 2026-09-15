import { createElement } from 'react';
import { Image, Platform } from 'react-native';
import { GC_PILLAR_COVER_ALT, GC_PILLAR_COVER_PATH, getGcPillarCoverUri } from '@/lib/gc-pillar-article';

type GcPillarCoverImageProps = {
  height: number;
};

export default function GcPillarCoverImage({ height }: GcPillarCoverImageProps) {
  if (Platform.OS === 'web') {
    return createElement('img', {
      src: GC_PILLAR_COVER_PATH,
      alt: GC_PILLAR_COVER_ALT,
      style: { width: '100%', height, objectFit: 'cover', display: 'block' },
    });
  }

  return (
    <Image
      source={{ uri: getGcPillarCoverUri() }}
      accessibilityLabel={GC_PILLAR_COVER_ALT}
      className="w-full"
      style={{ height }}
      resizeMode="cover"
    />
  );
}
