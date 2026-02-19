import { View, Text, ScrollView, TouchableOpacity, Linking } from "react-native";
import { useRouter } from "expo-router";
import { ArrowLeft, HelpCircle, Mail, ChevronRight } from "lucide-react-native";

const FAQ_ITEMS = [
  {
    q: "How do I start a project?",
    a: "Choose a project type (homebuilding, renovation, or interior design), upload your plan or design, and get matched with verified GCs. After you select a GC and they confirm, admin will email you payment instructions.",
  },
  {
    q: "When do I pay?",
    a: "Deposit at least 50% (100% recommended) before work starts. BuildMyHouse holds the funds and releases them only after you approve each stage.",
  },
  {
    q: "How do I approve a stage?",
    a: "In your project dashboard, go to the timeline and tap the stage. Review the work and evidence, then approve. Funds for that stage are released to your GC.",
  },
  {
    q: "My project is paused. What happened?",
    a: "Admin may pause a project for inspection (e.g. a complaint or payment dispute). You’ll receive an email. Once resolved, the project will be activated again.",
  },
  {
    q: "I have a dispute with my GC.",
    a: "Contact us at support@buildmyhouse.com. We’ll review and help mediate.",
  },
];

function FaqItem({ q, a }: { q: string; a: string }) {
  return (
    <View className="bg-gray-50 rounded-2xl p-4 border border-gray-200 mb-3">
      <Text className="text-black text-sm mb-2" style={{ fontFamily: "Poppins_600SemiBold" }}>
        {q}
      </Text>
      <Text className="text-gray-600 text-sm leading-5" style={{ fontFamily: "Poppins_400Regular" }}>
        {a}
      </Text>
    </View>
  );
}

export default function HelpSupportScreen() {
  const router = useRouter();
  const supportEmail = "support@buildmyhouse.com";

  return (
    <View className="flex-1 bg-white">
      <View className="pt-16 px-6 pb-4 flex-row items-center">
        <TouchableOpacity onPress={() => (router.canGoBack() ? router.back() : router.push("/profile"))} className="mr-4">
          <ArrowLeft size={28} color="#000000" strokeWidth={2} />
        </TouchableOpacity>
        <Text className="text-2xl text-black" style={{ fontFamily: "Poppins_700Bold" }}>
          Help & Support
        </Text>
      </View>

      <ScrollView className="flex-1 px-6" contentContainerStyle={{ paddingBottom: 40 }}>
        <View className="bg-black rounded-3xl p-6 mb-6 flex-row items-start">
          <HelpCircle size={24} color="#FFFFFF" strokeWidth={2} />
          <Text className="text-white text-sm ml-3 flex-1" style={{ fontFamily: "Poppins_500Medium" }}>
            We’re here to help. Check the FAQ below or reach out directly.
          </Text>
        </View>

        <Text className="text-lg text-black mb-3" style={{ fontFamily: "Poppins_700Bold" }}>
          Frequently asked questions
        </Text>
        {FAQ_ITEMS.map((item, i) => (
          <FaqItem key={i} q={item.q} a={item.a} />
        ))}

        <Text className="text-lg text-black mb-3 mt-6" style={{ fontFamily: "Poppins_700Bold" }}>
          Quick links
        </Text>
        <TouchableOpacity
          onPress={() => router.push("/billing-payments" as any)}
          className="bg-gray-50 rounded-2xl p-4 border border-gray-200 mb-3 flex-row items-center justify-between"
        >
          <Text className="text-black" style={{ fontFamily: "Poppins_600SemiBold" }}>
            Billing & Payments
          </Text>
          <ChevronRight size={20} color="#737373" strokeWidth={2} />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => Linking.openURL(`mailto:${supportEmail}`)}
          className="bg-black rounded-2xl p-4 flex-row items-center justify-center mt-4"
        >
          <Mail size={18} color="#FFFFFF" strokeWidth={2} />
          <Text className="text-white ml-2" style={{ fontFamily: "Poppins_600SemiBold" }}>
            Email us: {supportEmail}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}
