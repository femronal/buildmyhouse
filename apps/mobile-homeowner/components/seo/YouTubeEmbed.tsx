import { Platform, Text, TouchableOpacity, View } from 'react-native';
import * as Linking from 'expo-linking';

type YouTubeEmbedProps = {
  videoId: string;
  title: string;
  caption?: string;
};

export default function YouTubeEmbed({ videoId, title, caption }: YouTubeEmbedProps) {
  const watchUrl = `https://www.youtube.com/watch?v=${videoId}`;
  const embedUrl = `https://www.youtube.com/embed/${videoId}`;
  const IframeTag = 'iframe' as any;

  return (
    <View className="mb-5">
      <View className="rounded-2xl overflow-hidden bg-black" style={{ height: 220 }}>
        {Platform.OS === 'web' ? (
          <IframeTag
            title={title}
            src={embedUrl}
            width="100%"
            height="100%"
            style={{ border: 0 }}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            loading="lazy"
          />
        ) : (
          <TouchableOpacity
            className="flex-1 items-center justify-center px-4"
            onPress={() => Linking.openURL(watchUrl)}
          >
            <Text className="text-white text-base text-center mb-1" style={{ fontFamily: 'Poppins_600SemiBold' }}>
              Watch on YouTube
            </Text>
            <Text className="text-white/70 text-xs text-center" style={{ fontFamily: 'Poppins_400Regular' }}>
              {title}
            </Text>
          </TouchableOpacity>
        )}
      </View>
      {caption ? (
        <Text className="text-gray-500 text-xs mt-2" style={{ fontFamily: 'Poppins_400Regular' }}>
          {caption}
        </Text>
      ) : null}
    </View>
  );
}
