import { useState } from 'react';
import { Linking, Pressable, Text, View } from 'react-native';
import { Image } from 'expo-image';

export function StoredImage({ uri, className }: { uri: string; className?: string }) {
  const [failed, setFailed] = useState(false);
  if (!uri || failed) {
    return (
      <Pressable
        onPress={() => {
          if (uri) void Linking.openURL(uri);
        }}
        className={className}
        style={{ alignItems: 'center', justifyContent: 'center', backgroundColor: '#E5E7EB' }}
      >
        <Text style={{ color: '#111827', fontSize: 12, textAlign: 'center' }}>Open file</Text>
      </Pressable>
    );
  }
  return (
    <View className={className}>
      <Image
        source={uri}
        style={{ width: '100%', height: '100%' }}
        contentFit="cover"
        onError={() => setFailed(true)}
      />
    </View>
  );
}
