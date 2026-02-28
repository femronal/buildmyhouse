import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { ArrowLeft, FileText } from "lucide-react-native";

export default function TermsConditionsScreen() {
  const router = useRouter();
  const sections: Array<[string, string]> = [
    ['Service Scope', 'BuildMyHouse provides a digital platform for project management, contractor engagement, verification, and payment workflows.'],
    ['Account Responsibility', 'You are responsible for maintaining accurate account information, credentials, and lawful use of the platform.'],
    ['Verification & Compliance', 'GC verification, document checks, and compliance review may be required before certain features are enabled.'],
    ['Project Content', 'You are responsible for the legality, accuracy, and ownership of files, plans, and project data you upload.'],
    ['Payments', 'Payment disbursements, fees, refunds, and holds are subject to platform policy, anti-fraud checks, and applicable law.'],
    ['Disputes & Holds', 'BuildMyHouse may pause projects, transactions, or account actions while disputes, fraud, or safety concerns are reviewed.'],
    ['Intellectual Property', 'You retain ownership of your original content, while granting BuildMyHouse rights necessary to operate the service.'],
    ['Liability Limits', 'To the extent permitted by law, platform liability is limited and excludes indirect, incidental, or consequential damages.'],
    ['Termination', 'We may suspend or terminate accounts for policy breaches, illegal activity, or repeated misuse.'],
    ['Updates', 'Terms may be updated over time; continued use after updates indicates acceptance.'],
  ];

  return (
    <View className="flex-1 bg-[#0A1628]">
      <View className="pt-16 px-6 pb-4 flex-row items-center">
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

      <ScrollView className="flex-1 px-6">
        <View className="bg-[#1E3A5F] rounded-2xl p-5 border border-blue-900 mb-4">
          <View className="flex-row items-center mb-2">
            <FileText size={18} color="#60A5FA" strokeWidth={2} />
            <Text className="text-white text-base ml-2" style={{ fontFamily: 'Poppins_700Bold' }}>
              Contractor Terms Summary
            </Text>
          </View>
          <Text className="text-gray-300 text-xs leading-5" style={{ fontFamily: 'Poppins_400Regular' }}>
            This is a product-ready summary for in-app guidance and does not replace signed legal agreements.
          </Text>
        </View>
        {sections.map(([title, text]) => (
          <View key={title} className="bg-[#1E3A5F] rounded-2xl p-5 border border-blue-900 mb-3">
            <Text className="text-white text-sm mb-2" style={{ fontFamily: 'Poppins_600SemiBold' }}>
              {title}
            </Text>
            <Text className="text-gray-400 text-xs leading-5" style={{ fontFamily: 'Poppins_400Regular' }}>
              {text}
            </Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}
