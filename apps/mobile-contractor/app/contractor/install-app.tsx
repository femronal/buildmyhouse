import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { ArrowLeft, Smartphone, Monitor, Share2, EllipsisVertical } from "lucide-react-native";
import { useResponsivePadding } from "@/lib/responsive-layout";

type StepItem = {
  id: number;
  text: string;
  note?: string;
};

function StepList({ steps }: { steps: StepItem[] }) {
  return (
    <View>
      {steps.map((step) => (
        <View key={step.id} className="mb-4">
          <Text className="text-white text-sm leading-6" style={{ fontFamily: "Poppins_500Medium" }}>
            {step.id}. {step.text}
          </Text>
          {step.note ? (
            <Text className="text-gray-400 text-xs mt-1 leading-5" style={{ fontFamily: "Poppins_400Regular" }}>
              {step.note}
            </Text>
          ) : null}
        </View>
      ))}
    </View>
  );
}

export default function GCInstallAppScreen() {
  const router = useRouter();
  const { horizontalPad, headerPaddingTop, scrollBottomPadding } = useResponsivePadding("stack");

  return (
    <View className="flex-1 bg-[#0A1628]">
      <View
        className="pb-4 flex-row items-center"
        style={{ paddingTop: headerPaddingTop, paddingHorizontal: horizontalPad }}
      >
        <TouchableOpacity
          onPress={() => (router.canGoBack() ? router.back() : router.push("/contractor/gc-profile"))}
          className="w-10 h-10 bg-[#1E3A5F] rounded-full items-center justify-center mr-4"
        >
          <ArrowLeft size={22} color="#FFFFFF" strokeWidth={2} />
        </TouchableOpacity>
        <Text className="text-white text-xl" style={{ fontFamily: "Poppins_700Bold" }}>
          Install App
        </Text>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          paddingHorizontal: horizontalPad,
          paddingBottom: scrollBottomPadding,
        }}
      >
        <View className="mb-6">
          <Text className="text-white text-3xl mb-3" style={{ fontFamily: "Poppins_700Bold" }}>
            Get the BuildMyHouse GC App
          </Text>
          <Text className="text-gray-300 text-sm leading-6" style={{ fontFamily: "Poppins_400Regular" }}>
            Add the contractor app to your phone home screen for quick access to project updates and stage actions.
          </Text>
        </View>

        <View className="bg-[#1E3A5F] rounded-3xl p-5 border border-blue-900 mb-4">
          <View className="flex-row items-center mb-4">
            <Smartphone size={18} color="#FFFFFF" strokeWidth={2} />
            <Text className="text-white text-xl ml-2" style={{ fontFamily: "Poppins_700Bold" }}>
              iPhone & iPad
            </Text>
          </View>
          <StepList
            steps={[
              {
                id: 1,
                text: "Open Safari and go to gc.buildmyhouse.app. Log in and open your dashboard.",
                note: "For iOS, use Safari for this feature.",
              },
              {
                id: 2,
                text: "Tap the Share button at the bottom of Safari.",
              },
              {
                id: 3,
                text: "Scroll down and tap Add to Home Screen.",
              },
              {
                id: 4,
                text: "Tap Add in the top-right corner.",
              },
            ]}
          />
          <View className="flex-row items-center mt-2">
            <Share2 size={16} color="#9CA3AF" strokeWidth={2} />
            <Text className="text-gray-400 text-xs ml-2" style={{ fontFamily: "Poppins_400Regular" }}>
              Share icon
            </Text>
          </View>
        </View>

        <View className="bg-[#1E3A5F] rounded-3xl p-5 border border-blue-900 mb-6">
          <View className="flex-row items-center mb-4">
            <Monitor size={18} color="#FFFFFF" strokeWidth={2} />
            <Text className="text-white text-xl ml-2" style={{ fontFamily: "Poppins_700Bold" }}>
              Android
            </Text>
          </View>
          <StepList
            steps={[
              {
                id: 1,
                text: "Open Chrome and go to gc.buildmyhouse.app. Log in and open your dashboard.",
              },
              {
                id: 2,
                text: "Tap the three-dot menu at the top-right corner.",
              },
              {
                id: 3,
                text: 'Tap "Add to Home screen" or "Install app".',
              },
              {
                id: 4,
                text: 'Confirm by tapping "Add" or "Install".',
              },
            ]}
          />
          <View className="flex-row items-center mt-2">
            <EllipsisVertical size={16} color="#9CA3AF" strokeWidth={2} />
            <Text className="text-gray-400 text-xs ml-2" style={{ fontFamily: "Poppins_400Regular" }}>
              Three-dot menu
            </Text>
          </View>
        </View>

        <Text className="text-gray-400 text-xs leading-5" style={{ fontFamily: "Poppins_400Regular" }}>
          Tip: launch the GC app from your home screen after installation for a faster full-screen experience.
        </Text>
      </ScrollView>
    </View>
  );
}
