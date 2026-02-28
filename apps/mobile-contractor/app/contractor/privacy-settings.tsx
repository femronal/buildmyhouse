import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { ArrowLeft, ShieldCheck } from "lucide-react-native";

export default function PrivacySettingsScreen() {
  const router = useRouter();

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
          Privacy Settings
        </Text>
      </View>

      <ScrollView className="flex-1 px-6">
        <View className="bg-[#1E3A5F] rounded-2xl p-5 border border-blue-900 mb-4">
          <View className="flex-row items-center mb-3">
            <ShieldCheck size={18} color="#10B981" strokeWidth={2} />
            <Text className="text-white text-base ml-2" style={{ fontFamily: 'Poppins_700Bold' }}>
              Your data controls
            </Text>
          </View>
          <Text className="text-gray-300 text-sm leading-6" style={{ fontFamily: 'Poppins_400Regular' }}>
            BuildMyHouse uses your profile, project, and communication data only to deliver construction services,
            payments, dispute handling, and regulatory checks. We do not sell personal data.
          </Text>
        </View>

        {[
          ['Profile Visibility', 'Your name, rating, and verified status may be visible to homeowners you work with.'],
          ['Contact Data', 'Email and phone are used for account security, payment alerts, and project communication.'],
          ['Documents & Uploads', 'Files uploaded for verification and project stages are stored securely and access-controlled.'],
          ['Payments & Billing', 'Bank details and payment records are processed for disbursements, compliance, and audits.'],
          ['Retention', 'We retain records as required for legal, dispute-resolution, and fraud-prevention obligations.'],
          ['Account Requests', 'To request export or deletion of your data, contact support from Help & Support.'],
        ].map(([title, text]) => (
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
