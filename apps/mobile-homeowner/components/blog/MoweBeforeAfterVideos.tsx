import { createElement } from 'react';
import { Image, Platform, Text, View } from 'react-native';

const beforeSource = require('@/assets/images/before-the-repair.mp4');
const afterSource = require('@/assets/images/after-the-repair.mp4');

function resolveAssetUri(source: number | { uri?: string } | string): string | undefined {
  if (typeof source === 'string') return source;
  if (typeof source === 'object' && source && 'uri' in source && source.uri) return source.uri;
  if (typeof source === 'number') {
    const resolved = Image.resolveAssetSource(source);
    return resolved?.uri;
  }
  return undefined;
}

function LabeledVideo({
  label,
  source,
  accessibilityLabel,
}: {
  label: string;
  source: number;
  accessibilityLabel: string;
}) {
  const uri = resolveAssetUri(source);

  return (
    <View className="flex-1 min-w-0">
      <Text
        className="text-[11px] uppercase tracking-[0.14em] text-gray-500 mb-2"
        style={{ fontFamily: 'Poppins_600SemiBold' }}
      >
        {label}
      </Text>
      <View className="overflow-hidden rounded-2xl border border-gray-200 bg-black">
        {Platform.OS === 'web' && uri
          ? createElement('video', {
              src: uri,
              controls: true,
              playsInline: true,
              preload: 'metadata',
              style: {
                width: '100%',
                display: 'block',
                aspectRatio: '9 / 16',
                maxHeight: 420,
                objectFit: 'cover',
                backgroundColor: '#000',
              },
              'aria-label': accessibilityLabel,
            })
          : (
            <View className="aspect-[9/16] max-h-[420px] items-center justify-center px-4">
              <Text className="text-white text-sm text-center" style={{ fontFamily: 'Poppins_400Regular' }}>
                {label} video is available on the web article.
              </Text>
            </View>
          )}
      </View>
    </View>
  );
}

/** Side-by-side before/after evidence from the Mowe repair project. */
export default function MoweBeforeAfterVideos() {
  return (
    <View
      className="my-6"
      accessibilityLabel="Before and after videos from the Mowe repair project"
    >
      <View className="flex-row gap-3 md:gap-4">
        <LabeledVideo
          label="Before"
          source={beforeSource}
          accessibilityLabel="Before the repair video from the Mowe project"
        />
        <LabeledVideo
          label="After"
          source={afterSource}
          accessibilityLabel="After the repair video from the Mowe project"
        />
      </View>
    </View>
  );
}
