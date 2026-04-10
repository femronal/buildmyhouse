import { Image, type ImageSourcePropType, View } from 'react-native';

type SeoCoverImageProps = {
  source: ImageSourcePropType;
  alt: string;
  maxWidth?: number;
  aspectRatio?: number;
  className?: string;
};

export default function SeoCoverImage({
  source,
  alt,
  maxWidth = 920,
  aspectRatio = 4 / 3,
  className = 'mb-2',
}: SeoCoverImageProps) {
  return (
    <View
      className={`w-full rounded-3xl overflow-hidden items-center justify-center ${className}`}
      style={{ maxWidth, alignSelf: 'center', aspectRatio }}
    >
      <Image
        source={source}
        resizeMode="contain"
        style={{ width: '100%', height: '100%', alignSelf: 'center' }}
        accessibilityLabel={alt}
      />
    </View>
  );
}

