import { Image, Pressable, ScrollView, Text, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, ArrowUpRight } from 'phosphor-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const PAGE_BG = '#000000';
const CARD_BG = '#151515';
const CARD_BORDER = 'rgba(255,255,255,0.08)';
const TEXT_PRIMARY = '#FFFFFF';
const TEXT_MUTED = 'rgba(255,255,255,0.55)';

const PREBUILT_IMAGE = require('@/assets/images/repair.jpg');
const OWN_JOB_IMAGE = require('@/assets/images/worried-woman-dealing-with-a-plumbing-emergency-2026-03-25-08-24-07-utc.jpg');

type ProjectStartCardProps = {
  tag: string;
  title: string;
  subtitle: string;
  image: number;
  onPress: () => void;
  isWide: boolean;
};

function ProjectStartCard({ tag, title, subtitle, image, onPress, isWide }: ProjectStartCardProps) {
  return (
    <Pressable
      onPress={onPress}
      className="p-4 rounded-[28px] active:opacity-95 bmh-project-start-card overflow-hidden"
      style={{
        flex: isWide ? 1 : undefined,
        width: isWide ? undefined : '100%',
        backgroundColor: CARD_BG,
        borderWidth: 1,
        borderColor: CARD_BORDER,
      }}
      accessibilityRole="button"
      accessibilityLabel={`${title}. ${subtitle}`}
    >
      <View className="rounded-[22px] overflow-hidden mb-5 relative bg-black" style={{ aspectRatio: 4 / 3 }}>
        <Image
          source={image}
          className="bmh-project-start-card-img"
          style={{ width: '100%', height: '100%', opacity: 0.92 }}
          resizeMode="cover"
        />
        <View pointerEvents="none" className="bmh-project-start-card-fade absolute left-0 right-0 bottom-0 h-[55%]" />
        <View className="absolute bottom-4 left-4">
          <View className="px-3 py-1 rounded-full bg-white">
            <Text className="text-[11px] text-black" style={{ fontFamily: 'Poppins_600SemiBold' }}>
              {tag}
            </Text>
          </View>
        </View>
      </View>

      <View className="flex-row items-start justify-between px-1 pb-1 gap-3">
        <View className="flex-1">
          <Text
            className="text-[22px] md:text-2xl mb-2 leading-tight tracking-tight"
            style={{ fontFamily: 'Poppins_600SemiBold', color: TEXT_PRIMARY }}
          >
            {title}
          </Text>
          <Text className="text-sm md:text-base leading-relaxed" style={{ fontFamily: 'Poppins_400Regular', color: TEXT_MUTED }}>
            {subtitle}
          </Text>
        </View>
        <View className="w-11 h-11 rounded-full items-center justify-center mt-0.5 border border-white/15 bg-white/5 bmh-project-start-card-arrow">
          <ArrowUpRight size={20} color={TEXT_PRIMARY} weight="bold" />
        </View>
      </View>
    </Pressable>
  );
}

export default function ChooseProjectTypeScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const isWide = width >= 768;

  const addressData = {
    address: params.address as string,
    street: params.street as string,
    city: params.city as string,
    state: params.state as string,
    zipCode: params.zipCode as string,
    country: params.country as string,
    latitude: params.latitude as string,
    longitude: params.longitude as string,
  };

  const handleChooseDesign = () => {
    router.push({ pathname: '/design-library', params: addressData });
  };

  const handleUploadPlan = () => {
    router.push({ pathname: '/upload-plan', params: addressData });
  };

  return (
    <View className="flex-1" style={{ backgroundColor: PAGE_BG }}>
      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          paddingTop: Math.max(16, insets.top + 8),
          paddingBottom: Math.max(32, insets.bottom + 24),
        }}
        showsVerticalScrollIndicator={false}
      >
        <View className="w-full max-w-6xl self-center px-5 md:px-8">
          <TouchableOpacity
            onPress={() => (router.canGoBack() ? router.back() : router.push('/(tabs)/home'))}
            className="w-10 h-10 rounded-full items-center justify-center mb-8 border border-white/15 bg-white/5"
            accessibilityLabel="Go back"
          >
            <ArrowLeft size={20} color={TEXT_PRIMARY} weight="regular" />
          </TouchableOpacity>

          <View
            className="mb-10 md:mb-14"
            style={{ flexDirection: isWide ? 'row' : 'column', alignItems: isWide ? 'flex-end' : 'flex-start', justifyContent: 'space-between' }}
          >
            <View className="flex-1">
              <Text
                className="text-[10px] text-white/40 uppercase mb-4"
                style={{ fontFamily: 'Poppins_500Medium', letterSpacing: 3 }}
              >
                How to start
              </Text>
              <Text
                className="text-3xl md:text-5xl leading-tight tracking-tight max-w-2xl"
                style={{ fontFamily: 'Poppins_600SemiBold', color: TEXT_PRIMARY }}
                accessibilityRole="header"
              >
                Pick one way to begin your project
              </Text>
              <Text
                className="text-base md:text-lg mt-4 max-w-xl leading-relaxed"
                style={{ fontFamily: 'Poppins_400Regular', color: TEXT_MUTED }}
              >
                No long forms first. Tap the option that matches you — both give you a verified worker and step-by-step
                payments.
              </Text>
            </View>
          </View>

          <View style={{ flexDirection: isWide ? 'row' : 'column', gap: isWide ? 24 : 16 }}>
            <ProjectStartCard
              tag="Ready plan"
              title="Use a ready-made plan"
              subtitle="See price, stages, and location already set by a verified contractor. Good if you want to start fast."
              image={PREBUILT_IMAGE}
              onPress={handleChooseDesign}
              isWide={isWide}
            />
            <ProjectStartCard
              tag="Your own job"
              title="Describe your own job"
              subtitle="Send photos and tell us the problem. We turn it into a clear plan for repairs, upgrades, or building."
              image={OWN_JOB_IMAGE}
              onPress={handleUploadPlan}
              isWide={isWide}
            />
          </View>

          <View className="mt-10 md:mt-14 px-4 py-4 rounded-2xl bg-white/5 border border-white/10">
            <Text className="text-sm text-center leading-relaxed" style={{ fontFamily: 'Poppins_500Medium', color: TEXT_MUTED }}>
              Verified workers only · Pay in stages after photo proof · Track from Nigeria or abroad
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
