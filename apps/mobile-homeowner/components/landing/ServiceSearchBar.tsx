import { Pressable, Text, TextInput, View } from 'react-native';
import { Link } from 'expo-router';
import { MagnifyingGlass } from 'phosphor-react-native';
import { LANDING_BORDER, LANDING_INK, LANDING_MUTED, POPULAR_CHIPS } from '@/lib/home-landing-content';

type ServiceSearchBarProps = {
  value: string;
  onChange: (text: string) => void;
};

export default function ServiceSearchBar({ value, onChange }: ServiceSearchBarProps) {
  return (
    <View className="mt-10">
      <View className="rounded-[22px] border bg-white px-4 py-2 flex-row items-center" style={{ borderColor: LANDING_BORDER }}>
        <TextInput
          value={value}
          onChangeText={onChange}
          placeholder="What do you need fixed, upgraded, or built?"
          placeholderTextColor="#9CA3AF"
          className="flex-1 text-base py-2"
          style={{ fontFamily: 'Poppins_400Regular', color: LANDING_INK }}
          accessibilityLabel="Search service type"
        />
        <Link href={'/location?mode=explore' as any} asChild>
          <Pressable className="w-10 h-10 rounded-full items-center justify-center bg-black" accessibilityRole="link">
            <MagnifyingGlass size={18} color="#FFFFFF" weight="bold" />
          </Pressable>
        </Link>
      </View>

      <View className="mt-4 flex-row flex-wrap items-center">
        <Text className="text-sm mr-2 mb-2" style={{ fontFamily: 'Poppins_600SemiBold', color: LANDING_MUTED }}>
          Popular:
        </Text>
        {POPULAR_CHIPS.map((chip) => (
          <Link key={chip.href} href={chip.href as any} asChild>
            <Pressable
              className="rounded-full px-3 py-1.5 mr-2 mb-2 border"
              style={{ borderColor: LANDING_BORDER }}
              accessibilityRole="link"
            >
              <Text className="text-xs" style={{ fontFamily: 'Poppins_500Medium', color: LANDING_INK }}>
                {chip.label}
              </Text>
            </Pressable>
          </Link>
        ))}
      </View>
    </View>
  );
}
