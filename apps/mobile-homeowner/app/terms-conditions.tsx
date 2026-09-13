import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { ArrowLeft } from "lucide-react-native";
import { PLATFORM_TERMS_SECTIONS } from "@buildmyhouse/shared-utils";
import { cardShadowStyle } from "@/lib/card-styles";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View className="mb-6">
      <Text className="text-lg text-black mb-3" style={{ fontFamily: "Poppins_700Bold" }}>
        {title}
      </Text>
      {children}
    </View>
  );
}

export default function TermsConditionsScreen() {
  const router = useRouter();

  return (
    <View className="flex-1 bg-white">
      <View className="pt-16 px-6 pb-4 flex-row items-center">
        <TouchableOpacity onPress={() => (router.canGoBack() ? router.back() : router.push("/profile"))} className="mr-4">
          <ArrowLeft size={28} color="#000000" strokeWidth={2} />
        </TouchableOpacity>
        <Text className="text-2xl text-black" style={{ fontFamily: "Poppins_700Bold" }}>
          Terms & Conditions
        </Text>
      </View>

      <ScrollView className="flex-1 px-6" contentContainerStyle={{ paddingBottom: 40 }}>
        <View style={cardShadowStyle} className="bg-gray-100 rounded-2xl p-4 mb-6 border border-gray-200">
          <Text className="text-gray-600 text-sm" style={{ fontFamily: "Poppins_400Regular" }}>
            Full platform terms for homeowners and contractors.
          </Text>
        </View>

        {PLATFORM_TERMS_SECTIONS.map((section, index) => (
          <Section key={`${index}-${section.title}`} title={section.title}>
            <Text className="text-gray-700 text-sm leading-6" style={{ fontFamily: "Poppins_400Regular" }}>
              {section.body || " "}
            </Text>
          </Section>
        ))}
      </ScrollView>
    </View>
  );
}
