import { Pressable, Text, View } from 'react-native';
import { Link } from 'expo-router';
import LandingServiceSearchBar from '@/components/landing/LandingServiceSearchBar';
import { useLandingServiceLinks } from '@/hooks/useLandingServiceLinks';
import { LANDING_BORDER, LANDING_INK, LANDING_MUTED } from '@/lib/home-landing-content';

type ServiceSearchBarProps = {
  value: string;
  onChange: (text: string) => void;
};

export default function ServiceSearchBar(_props: ServiceSearchBarProps) {
  const { popularLinks, popularChips } = useLandingServiceLinks();

  return (
    <View className="mt-10">
      <LandingServiceSearchBar
        links={popularLinks}
        placeholder="What do you need fixed, upgraded, or built?"
        variant="default"
      />

      <View className="mt-4 flex-row flex-wrap items-center">
        <Text className="text-sm mr-2 mb-2" style={{ fontFamily: 'Poppins_600SemiBold', color: LANDING_MUTED }}>
          Popular:
        </Text>
        {popularChips.map((chip) => (
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
