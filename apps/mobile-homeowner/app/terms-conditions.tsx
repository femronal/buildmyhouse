import { View, Text, ScrollView, TouchableOpacity, Linking } from "react-native";
import { useRouter } from "expo-router";
import { ArrowLeft, Mail } from "lucide-react-native";

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
  const supportEmail = "support@buildmyhouse.com";

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
        <View className="bg-gray-100 rounded-2xl p-4 mb-6 border border-gray-200">
          <Text className="text-gray-600 text-sm" style={{ fontFamily: "Poppins_400Regular" }}>
            By using BuildMyHouse, you agree to these terms. We keep them simple and clear.
          </Text>
        </View>

        <Section title="What we do">
          <Text className="text-gray-700 text-sm leading-6" style={{ fontFamily: "Poppins_400Regular" }}>
            BuildMyHouse connects homeowners with verified General Contractors (GCs) and helps manage construction projects. We hold deposits in escrow and release funds only after you approve each stage.
          </Text>
        </Section>

        <Section title="Your responsibilities">
          <View className="bg-gray-50 rounded-2xl p-4 border border-gray-200">
            <Text className="text-gray-700 text-sm leading-6" style={{ fontFamily: "Poppins_400Regular" }}>
              • Provide accurate project and contact information{"\n"}
              • Pay deposits as agreed (min 50%, 100% recommended){"\n"}
              • Communicate promptly with your GC and BuildMyHouse{"\n"}
              • Approve stages only when satisfied with the work
            </Text>
          </View>
        </Section>

        <Section title="Payments">
          <Text className="text-gray-700 text-sm leading-6" style={{ fontFamily: "Poppins_400Regular" }}>
            Deposits are held by BuildMyHouse. Funds are released to the GC only after you confirm each stage. Supported methods (Stripe, Wise, Paystack, Zelle) are processed securely.
          </Text>
        </Section>

        <Section title="Project outcomes">
          <Text className="text-gray-700 text-sm leading-6" style={{ fontFamily: "Poppins_400Regular" }}>
            BuildMyHouse facilitates connections and payments. We do not guarantee project outcomes. Disputes between you and your GC should be raised with us for mediation.
          </Text>
        </Section>

        <Section title="Changes">
          <Text className="text-gray-700 text-sm leading-6" style={{ fontFamily: "Poppins_400Regular" }}>
            We may update these terms. Continued use of the app means you accept the latest version. We will notify you of material changes.
          </Text>
        </Section>

        <TouchableOpacity
          onPress={() => Linking.openURL(`mailto:${supportEmail}`)}
          className="bg-black rounded-2xl p-4 flex-row items-center justify-center"
        >
          <Mail size={18} color="#FFFFFF" strokeWidth={2} />
          <Text className="text-white ml-2" style={{ fontFamily: "Poppins_600SemiBold" }}>
            Questions? {supportEmail}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}
