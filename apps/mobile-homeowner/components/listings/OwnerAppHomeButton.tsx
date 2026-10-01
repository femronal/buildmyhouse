import { Pressable, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { House } from 'phosphor-react-native';

export default function OwnerAppHomeButton() {
  const router = useRouter();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Home"
      onPress={() => router.push('/(tabs)/home' as any)}
      style={{
        minHeight: 44,
        paddingHorizontal: 14,
        borderRadius: 999,
        borderWidth: 1,
        borderColor: '#E5E5E5',
        backgroundColor: '#FFFFFF',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
      }}
    >
      <House size={18} color="#171717" weight="bold" />
      <Text style={{ fontFamily: 'Poppins_600SemiBold', color: '#171717', fontSize: 14 }}>Home</Text>
    </Pressable>
  );
}
