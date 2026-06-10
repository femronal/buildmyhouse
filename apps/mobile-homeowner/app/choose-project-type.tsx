import { View, Text, TouchableOpacity, Pressable, ScrollView, useWindowDimensions } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import {
  Airplane,
  ArrowLeft,
  ArrowUpRight,
  Camera,
  ChatCircleText,
  ClipboardText,
  Coins,
  FileText,
  HouseLine,
  Images,
  ListChecks,
  Ruler,
  ShieldCheck,
} from 'phosphor-react-native';
import Svg, { Path } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const CARD_BG = '#0A0A0A';

function IconBadge({ children, label }: { children: React.ReactNode; label: string }) {
  return (
    <View className="items-center gap-2.5">
      <View className="w-12 h-12 rounded-full bg-white/5 border border-white/10 items-center justify-center">
        {children}
      </View>
      <Text className="text-[11px] text-white/45 text-center" style={{ fontFamily: 'Poppins_500Medium' }}>
        {label}
      </Text>
    </View>
  );
}

/** Mini "project ideas" table preview — mirrors the template's data table graphic. */
function IdeasTablePreview() {
  return (
    <View className="w-full max-w-sm self-center mt-6">
      <View className="flex-row gap-3 mb-2.5 pl-2">
        {['Project', 'Stages', 'Status'].map((h) => (
          <Text
            key={h}
            className="flex-1 text-[10px] uppercase text-white/35"
            style={{ fontFamily: 'Poppins_500Medium', letterSpacing: 1.5 }}
          >
            {h}
          </Text>
        ))}
      </View>
      <View className="flex-row gap-3 py-2 pl-2 border-t border-white/5 bg-white/[0.02] rounded-lg">
        <Text className="flex-1 text-xs text-white/80" style={{ fontFamily: 'JetBrainsMono_500Medium' }}>
          2-bed reno
        </Text>
        <Text className="flex-1 text-xs text-white/80" style={{ fontFamily: 'JetBrainsMono_500Medium' }}>
          5
        </Text>
        <Text className="flex-1 text-xs text-white" style={{ fontFamily: 'JetBrainsMono_500Medium' }}>
          Verified
        </Text>
      </View>
      <View className="flex-row gap-3 py-2 pl-2 border-t border-white/5 opacity-40">
        <Text className="flex-1 text-xs text-white/60" style={{ fontFamily: 'JetBrainsMono_500Medium' }}>
          Roof repair
        </Text>
        <Text className="flex-1 text-xs text-white/60" style={{ fontFamily: 'JetBrainsMono_500Medium' }}>
          2
        </Text>
        <Text className="flex-1 text-xs text-white/60" style={{ fontFamily: 'JetBrainsMono_500Medium' }}>
          Verified
        </Text>
      </View>
    </View>
  );
}

/** Hub-and-spoke graphic — your photos, goals, and documents feeding one structured scope. */
function BriefHubGraphic() {
  const node = (Icon: typeof Camera, style: object) => (
    <View
      className="absolute w-10 h-10 rounded-full bg-white/5 border border-white/10 items-center justify-center"
      style={style}
    >
      <Icon size={16} color="rgba(255,255,255,0.55)" weight="regular" />
    </View>
  );

  return (
    <View className="w-full max-w-sm self-center" style={{ height: 210 }}>
      <Svg
        width="100%"
        height="100%"
        viewBox="0 0 400 300"
        style={{ position: 'absolute', inset: 0, opacity: 0.2 }}
      >
        <Path d="M200 150 C 200 100, 120 100, 120 80" stroke="white" fill="none" strokeWidth={1.5} />
        <Path d="M200 150 C 200 100, 280 100, 280 80" stroke="white" fill="none" strokeWidth={1.5} />
        <Path d="M200 150 C 200 150, 80 150, 80 140" stroke="white" fill="none" strokeWidth={1.5} />
        <Path d="M200 150 C 200 150, 320 150, 320 140" stroke="white" fill="none" strokeWidth={1.5} />
        <Path d="M200 150 L 200 90" stroke="white" fill="none" strokeWidth={1.5} />
      </Svg>

      {node(Camera, { top: '14%', left: '22%' })}
      {node(FileText, { top: '8%', left: '50%', marginLeft: -20 })}
      {node(ChatCircleText, { top: '14%', right: '22%' })}
      {node(Ruler, { top: '38%', left: '10%' })}
      {node(Images, { top: '38%', right: '10%' })}

      {/* Center hub */}
      <View
        className="absolute w-16 h-16 rounded-full border border-white/10 items-center justify-center"
        style={{ top: '50%', left: '50%', marginLeft: -32, marginTop: -16, backgroundColor: CARD_BG }}
      >
        <View className="w-12 h-12 rounded-full bg-white/10 border border-white/5 items-center justify-center">
          <ListChecks size={22} color="#ffffff" weight="regular" />
        </View>
      </View>
    </View>
  );
}

function CardFooterPill({ label }: { label: string }) {
  return (
    <View className="flex-row items-center justify-between px-5 py-3 rounded-xl border border-white/10 bg-white/5 mt-6">
      <Text className="text-sm text-white/70" style={{ fontFamily: 'Poppins_500Medium' }}>
        {label}
      </Text>
      <View className="w-8 h-8 rounded-lg bg-white items-center justify-center">
        <ArrowUpRight size={16} color="#000000" weight="bold" />
      </View>
    </View>
  );
}

export default function ChooseProjectTypeScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const isDesktop = width >= 1024;
  const isTablet = width >= 768;

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
    <View className="flex-1 bg-black">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          paddingTop: Math.max(20, insets.top + 10),
          paddingBottom: Math.max(40, insets.bottom + 24),
        }}
        showsVerticalScrollIndicator={false}
      >
        <View className="w-full max-w-6xl self-center px-5 md:px-8">
          <TouchableOpacity
            onPress={() => (router.canGoBack() ? router.back() : router.push('/(tabs)/home'))}
            className="w-10 h-10 rounded-full border border-white/15 items-center justify-center mb-8"
            accessibilityLabel="Go back"
          >
            <ArrowLeft size={20} color="#ffffff" weight="regular" />
          </TouchableOpacity>

          {/* Header */}
          <View className="items-center mb-10 md:mb-14">
            <Text
              className="text-3xl md:text-5xl text-white text-center tracking-tight mb-4"
              style={{ fontFamily: 'Poppins_600SemiBold' }}
            >
              Start Your Project
            </Text>
            <Text
              className="text-sm md:text-base text-white/45 text-center max-w-xl leading-relaxed"
              style={{ fontFamily: 'Poppins_400Regular' }}
            >
              Choose how you want to begin. Either way, you get a verified contractor, a clear scope, and staged
              payments — we'll guide the rest.
            </Text>
          </View>

          {/* Feature cards */}
          <View className="gap-5" style={{ flexDirection: isDesktop ? 'row' : 'column' }}>
            {/* Card 1: Browse verified project ideas */}
            <Pressable
              onPress={handleChooseDesign}
              className="flex-1 rounded-3xl border border-white/10 p-6 md:p-8 overflow-hidden active:opacity-85"
              style={{ backgroundColor: CARD_BG }}
              accessibilityRole="button"
            >
              <View className="flex-row justify-center gap-10 md:gap-14 pt-2">
                <IconBadge label="Verified GCs">
                  <ShieldCheck size={20} color="rgba(255,255,255,0.55)" weight="regular" />
                </IconBadge>
                <IconBadge label="Clear scope">
                  <ClipboardText size={20} color="rgba(255,255,255,0.55)" weight="regular" />
                </IconBadge>
                <IconBadge label="Cost guidance">
                  <Coins size={20} color="rgba(255,255,255,0.55)" weight="regular" />
                </IconBadge>
              </View>

              {/* connector */}
              <View className="items-center mt-3">
                <View className="w-px h-5 bg-white/10" />
              </View>

              <IdeasTablePreview />

              <View className="mt-6">
                <View className="flex-row items-center gap-2.5 mb-2">
                  <HouseLine size={18} color="#ffffff" weight="regular" />
                  <Text className="text-lg md:text-xl text-white" style={{ fontFamily: 'Poppins_600SemiBold' }}>
                    Browse Verified Project Ideas
                  </Text>
                </View>
                <Text className="text-sm text-white/45 leading-relaxed" style={{ fontFamily: 'Poppins_400Regular' }}>
                  Explore ready project options from verified General Contractors — with scope and cost already mapped
                  out — and kick off faster with proven direction.
                </Text>
              </View>

              <CardFooterPill label="Browse project ideas" />
            </Pressable>

            {/* Card 2: Upload your own brief */}
            <Pressable
              onPress={handleUploadPlan}
              className="flex-1 rounded-3xl border border-white/10 p-6 md:p-8 overflow-hidden active:opacity-85"
              style={{ backgroundColor: CARD_BG }}
              accessibilityRole="button"
            >
              <View className="flex-1 justify-center py-2">
                <BriefHubGraphic />
              </View>

              <View className="mt-6">
                <View className="flex-row items-center gap-2.5 mb-2">
                  <ListChecks size={18} color="#ffffff" weight="regular" />
                  <Text className="text-lg md:text-xl text-white" style={{ fontFamily: 'Poppins_600SemiBold' }}>
                    Upload Your Own Project Brief
                  </Text>
                </View>
                <Text className="text-sm text-white/45 leading-relaxed" style={{ fontFamily: 'Poppins_400Regular' }}>
                  Share your photos, goals, and project details. BuildMyHouse turns them into a structured scope you
                  can execute with confidence — repairs, upgrades, renovations, or full builds.
                </Text>
              </View>

              <CardFooterPill label="Upload your brief" />
            </Pressable>
          </View>

          {/* Supporting features */}
          <View
            className="mt-12 md:mt-16 gap-10 px-1"
            style={{ flexDirection: isTablet ? 'row' : 'column' }}
          >
            <View className="flex-1 gap-4">
              <View className="w-12 h-12 rounded-full bg-white/5 border border-white/10 items-center justify-center">
                <ShieldCheck size={20} color="rgba(255,255,255,0.6)" weight="regular" />
              </View>
              <View>
                <Text className="text-base md:text-lg text-white mb-2" style={{ fontFamily: 'Poppins_600SemiBold' }}>
                  Verified professionals only
                </Text>
                <Text className="text-sm text-white/45 leading-relaxed" style={{ fontFamily: 'Poppins_400Regular' }}>
                  Every contractor is verified at their workshop — tools, documents, and at least 3 years of real work —
                  before they can take your project.
                </Text>
              </View>
            </View>

            <View className="flex-1 gap-4">
              <View className="w-12 h-12 rounded-full bg-white/5 border border-white/10 items-center justify-center">
                <Camera size={20} color="rgba(255,255,255,0.6)" weight="regular" />
              </View>
              <View>
                <Text className="text-base md:text-lg text-white mb-2" style={{ fontFamily: 'Poppins_600SemiBold' }}>
                  Pay in stages, with evidence
                </Text>
                <Text className="text-sm text-white/45 leading-relaxed" style={{ fontFamily: 'Poppins_400Regular' }}>
                  Work is broken into stages. You see photos and progress before any payment moves — no lump sums, no
                  blind transfers.
                </Text>
              </View>
            </View>

            <View className="flex-1 gap-4">
              <View className="w-12 h-12 rounded-full bg-white/5 border border-white/10 items-center justify-center">
                <Airplane size={20} color="rgba(255,255,255,0.6)" weight="regular" />
              </View>
              <View>
                <Text className="text-base md:text-lg text-white mb-2" style={{ fontFamily: 'Poppins_600SemiBold' }}>
                  Track it from anywhere
                </Text>
                <Text className="text-sm text-white/45 leading-relaxed" style={{ fontFamily: 'Poppins_400Regular' }}>
                  On site in Lagos or abroad — follow stages, materials, files, and communication in one place, on any
                  device.
                </Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
