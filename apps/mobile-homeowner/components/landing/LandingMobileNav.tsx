import { Pressable, Text, View } from 'react-native';
import { Link } from 'expo-router';
import { NAV_ITEMS } from '@/lib/home-landing-content';

type LandingMobileNavProps = {
  onNavPress: (href: string) => void;
};

export default function LandingMobileNav({ onNavPress }: LandingMobileNavProps) {
  return (
    <View className="pb-3 px-6 w-full bmh-mobile-nav-row">
      {NAV_ITEMS.map((item) => {
        const pill = (
          <View className="rounded-full px-3 py-1.5 border border-slate-200 bg-white">
            <Text className="text-xs text-slate-700 text-center" style={{ fontFamily: 'Poppins_500Medium' }}>
              {item.label}
            </Text>
          </View>
        );

        if (item.href.startsWith('#')) {
          return (
            <Pressable key={item.label} onPress={() => onNavPress(item.href)} accessibilityRole="button">
              {pill}
            </Pressable>
          );
        }

        return (
          <Link key={item.label} href={item.href as any} asChild>
            <Pressable accessibilityRole="link">{pill}</Pressable>
          </Link>
        );
      })}
    </View>
  );
}
