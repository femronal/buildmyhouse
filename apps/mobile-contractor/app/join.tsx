import { Linking, Platform, Pressable, Text, View } from 'react-native';

const HOME = process.env.EXPO_PUBLIC_HOMEOWNER_WEB_URL || 'https://buildmyhouse.app';
const TARGET = `${HOME}/join?from=gc`;

export default function JoinHandoff() {
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    window.location.replace(TARGET);
  } else {
    void Linking.openURL(TARGET);
  }
  return (
    <View style={{ flex: 1, backgroundColor: '#fff', padding: 24, justifyContent: 'center' }}>
      <Text style={{ fontFamily: 'Poppins_600SemiBold', fontSize: 18, marginBottom: 12 }}>Taking you to BuildMyHouse…</Text>
      <Pressable accessibilityRole="link" onPress={() => Linking.openURL(TARGET)} style={{ minHeight: 44, justifyContent: 'center' }}>
        <Text>Open Join BuildMyHouse</Text>
      </Pressable>
    </View>
  );
}
