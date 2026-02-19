import { View, Text, ScrollView, TouchableOpacity, Linking } from "react-native";
import { useRouter } from "expo-router";
import { ArrowLeft, Shield, Lock, Mail } from "lucide-react-native";

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

export default function PrivacySecurityScreen() {
  const router = useRouter();
  const supportEmail = "support@buildmyhouse.com";

  return (
    <View className="flex-1 bg-white">
      <View className="pt-16 px-6 pb-4 flex-row items-center">
        <TouchableOpacity onPress={() => (router.canGoBack() ? router.back() : router.push("/profile"))} className="mr-4">
          <ArrowLeft size={28} color="#000000" strokeWidth={2} />
        </TouchableOpacity>
        <Text className="text-2xl text-black" style={{ fontFamily: "Poppins_700Bold" }}>
          Privacy & Security
        </Text>
      </View>

      <ScrollView className="flex-1 px-6" contentContainerStyle={{ paddingBottom: 40 }}>
        <View className="bg-black rounded-3xl p-6 mb-6 flex-row items-start">
          <Shield size={24} color="#FFFFFF" strokeWidth={2} />
          <Text className="text-white text-sm ml-3 flex-1" style={{ fontFamily: "Poppins_500Medium" }}>
            We take your privacy seriously. Your data is used only to connect you with contractors and manage your projects.
          </Text>
        </View>

        <Section title="What we collect">
          <View className="bg-gray-50 rounded-2xl p-4 border border-gray-200">
            <Text className="text-gray-700 text-sm leading-6" style={{ fontFamily: "Poppins_400Regular" }}>
              • Name, email, phone (to manage your account and communicate with you){"\n"}
              • Project details and address (to connect you with GCs and track progress){"\n"}
              • Payment information (processed securely; we do not store full card details)
            </Text>
          </View>
        </Section>

        <Section title="How we use it">
          <View className="bg-gray-50 rounded-2xl p-4 border border-gray-200">
            <Text className="text-gray-700 text-sm leading-6" style={{ fontFamily: "Poppins_400Regular" }}>
              • To match you with verified General Contractors{"\n"}
              • To hold deposits and release funds as you approve each stage{"\n"}
              • To send project updates and payment instructions
            </Text>
          </View>
        </Section>

        <Section title="Who we share with">
          <View className="bg-gray-50 rounded-2xl p-4 border border-gray-200">
            <Text className="text-gray-700 text-sm leading-6" style={{ fontFamily: "Poppins_400Regular" }}>
              • Your GC (project details, contact info needed for the build){"\n"}
              • Payment processors (Stripe, Wise, Paystack, Zelle) for deposits{"\n"}
              • BuildMyHouse admin (for support and dispute resolution)
            </Text>
          </View>
        </Section>

        <Section title="Your data is protected">
          <View className="bg-gray-50 rounded-2xl p-4 border border-gray-200 flex-row items-start">
            <Lock size={18} color="#059669" strokeWidth={2} />
            <Text className="text-gray-700 text-sm leading-6 ml-2 flex-1" style={{ fontFamily: "Poppins_400Regular" }}>
              We use industry-standard encryption and secure storage. Deposits are held in escrow and released only after your stage-by-stage approval.
            </Text>
          </View>
        </Section>

        <Section title="Your rights">
          <View className="bg-gray-50 rounded-2xl p-4 border border-gray-200">
            <Text className="text-gray-700 text-sm leading-6" style={{ fontFamily: "Poppins_400Regular" }}>
              You can request access to your data, corrections, or deletion. Contact us at the email below.
            </Text>
          </View>
        </Section>

        <TouchableOpacity
          onPress={() => Linking.openURL(`mailto:${supportEmail}`)}
          className="bg-black rounded-2xl p-4 flex-row items-center justify-center"
        >
          <Mail size={18} color="#FFFFFF" strokeWidth={2} />
          <Text className="text-white ml-2" style={{ fontFamily: "Poppins_600SemiBold" }}>
            Contact: {supportEmail}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}
