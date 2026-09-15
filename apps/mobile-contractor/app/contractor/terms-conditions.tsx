import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { ArrowLeft, FileText } from "lucide-react-native";
import { PLATFORM_TERMS_SECTIONS } from "@buildmyhouse/shared-utils";
import { useResponsivePadding } from "@/lib/responsive-layout";
import { useWebSeo } from "@/lib/seo";

export default function TermsConditionsScreen() {
  const router = useRouter();
  const { horizontalPad, headerPaddingTop, scrollBottomPadding } =
    useResponsivePadding("stack");

  useWebSeo({
    title: 'Contractor Terms & Conditions | BuildMyHouse',
    description:
      'BuildMyHouse contractor terms: registration, verification, project acceptance, stage mobilisation, evidence and payment progression for general contractors in Nigeria.',
    canonicalPath: '/terms-conditions',
  });

  return (
    <View className="flex-1 bg-[#0A1628]">
      <View
        className="pb-4 flex-row items-center"
        style={{ paddingTop: headerPaddingTop, paddingHorizontal: horizontalPad }}
      >
        <TouchableOpacity
          onPress={() => (router.canGoBack() ? router.back() : router.push('/contractor/gc-profile'))}
          className="w-10 h-10 bg-[#1E3A5F] rounded-full items-center justify-center mr-4"
        >
          <ArrowLeft size={22} color="#FFFFFF" strokeWidth={2} />
        </TouchableOpacity>
        <Text className="text-white text-xl" style={{ fontFamily: 'Poppins_700Bold' }}>
          Terms & Conditions
        </Text>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          paddingHorizontal: horizontalPad,
          paddingBottom: scrollBottomPadding,
        }}
      >
        <View className="bg-[#1E3A5F] rounded-2xl p-5 border border-blue-900 mb-4">
          <View className="flex-row items-center mb-2">
            <FileText size={18} color="#60A5FA" strokeWidth={2} />
            <Text className="text-white text-base ml-2" style={{ fontFamily: 'Poppins_700Bold' }}>
              Contractor Terms Summary
            </Text>
          </View>
          <Text className="text-gray-300 text-xs leading-5" style={{ fontFamily: 'Poppins_400Regular' }}>
            Full platform terms for homeowners and contractors.
          </Text>
        </View>
        {PLATFORM_TERMS_SECTIONS.map((section, index) => (
          <View key={`${index}-${section.title}`} className="bg-[#1E3A5F] rounded-2xl p-5 border border-blue-900 mb-3">
            <Text className="text-white text-sm mb-2" style={{ fontFamily: 'Poppins_600SemiBold' }}>
              {section.title}
            </Text>
            <Text className="text-gray-400 text-xs leading-5" style={{ fontFamily: 'Poppins_400Regular' }}>
              {section.body}
            </Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}
