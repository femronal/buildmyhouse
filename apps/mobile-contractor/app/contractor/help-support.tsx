import { View, Text, ScrollView, TouchableOpacity, Linking } from "react-native";
import { useRouter } from "expo-router";
import { ArrowLeft, HelpCircle, Mail, MessageCircle, Phone } from "lucide-react-native";
import type { ReactNode } from "react";

export default function HelpSupportScreen() {
  const router = useRouter();

  const Item = ({
    icon,
    title,
    text,
    actionLabel,
    onPress,
  }: {
    icon: ReactNode;
    title: string;
    text: string;
    actionLabel?: string;
    onPress?: () => void;
  }) => (
    <View className="bg-[#1E3A5F] rounded-2xl p-5 border border-blue-900 mb-3">
      <View className="flex-row items-center mb-2">
        {icon}
        <Text className="text-white text-sm ml-2" style={{ fontFamily: 'Poppins_600SemiBold' }}>
          {title}
        </Text>
      </View>
      <Text className="text-gray-400 text-xs leading-5" style={{ fontFamily: 'Poppins_400Regular' }}>
        {text}
      </Text>
      {actionLabel && onPress && (
        <TouchableOpacity onPress={onPress} className="mt-3 bg-blue-600/20 border border-blue-600 rounded-lg py-2 px-3 self-start">
          <Text className="text-blue-400 text-xs" style={{ fontFamily: 'Poppins_600SemiBold' }}>
            {actionLabel}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );

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
          Help & Support
        </Text>
      </View>

      <ScrollView className="flex-1 px-6">
        <View className="bg-[#1E3A5F] rounded-2xl p-5 border border-blue-900 mb-4">
          <View className="flex-row items-center mb-2">
            <HelpCircle size={18} color="#60A5FA" strokeWidth={2} />
            <Text className="text-white text-base ml-2" style={{ fontFamily: 'Poppins_700Bold' }}>
              Need assistance?
            </Text>
          </View>
          <Text className="text-gray-300 text-xs leading-5" style={{ fontFamily: 'Poppins_400Regular' }}>
            We can help with account access, verification docs, payouts, disputes, and technical issues.
          </Text>
        </View>

        <Item
          icon={<Mail size={18} color="#93C5FD" strokeWidth={2} />}
          title="Email Support"
          text="For account and policy questions, contact support and include your account email and issue summary."
          actionLabel="Email support@buildmyhouse.com"
          onPress={() => Linking.openURL('mailto:support@buildmyhouse.com')}
        />
        <Item
          icon={<MessageCircle size={18} color="#93C5FD" strokeWidth={2} />}
          title="In-App Chat"
          text="For project-specific issues, use the app chat so support can see project context and timestamps."
          actionLabel="Open Chat"
          onPress={() => router.push('/contractor/chat')}
        />
        <Item
          icon={<Phone size={18} color="#93C5FD" strokeWidth={2} />}
          title="Urgent Escalation"
          text="For urgent payment/fraud/safety concerns, call our escalation line during business hours."
          actionLabel="Call +1 (555) 010-2026"
          onPress={() => Linking.openURL('tel:+15550102026')}
        />
      </ScrollView>
    </View>
  );
}
