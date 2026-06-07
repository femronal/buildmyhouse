import { Linking, Pressable, Text, View } from 'react-native';
import SocialBrandIcon, { type SocialBrandId } from '@/components/landing/SocialBrandIcon';
import { BUILDMYHOUSE_SOCIALS } from '@/lib/home-landing-content';

export default function SocialLinksStrip() {
  return (
    <View className="py-10 bg-white border-t border-slate-100">
      <View className="max-w-7xl w-full self-center px-6 md:px-12 flex-row flex-wrap items-center justify-between gap-y-4">
        <Text className="text-sm text-black" style={{ fontFamily: 'Poppins_500Medium' }}>
          Follow BuildMyHouse
        </Text>
        <View className="flex-row flex-wrap items-center gap-3">
          {BUILDMYHOUSE_SOCIALS.map((social) => (
            <Pressable
              key={social.id}
              onPress={() => Linking.openURL(social.href)}
              accessibilityRole="link"
              accessibilityLabel={social.label}
              className="w-11 h-11 rounded-full border border-slate-200 bg-white items-center justify-center"
            >
              <SocialBrandIcon brand={social.id as SocialBrandId} size={20} color="#000000" />
            </Pressable>
          ))}
        </View>
      </View>
    </View>
  );
}
