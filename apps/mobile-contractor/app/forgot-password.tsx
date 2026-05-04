import { View, Text, TouchableOpacity, TextInput, ActivityIndicator, KeyboardAvoidingView, Platform, Alert } from "react-native";
import { useRouter } from "expo-router";
import { useState } from "react";
import { ArrowLeft, Mail } from "lucide-react-native";
import { api } from "@/lib/api";
import { useResponsivePadding } from "@/lib/responsive-layout";

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const { horizontalPad, headerPaddingTop, scrollBottomPadding } =
    useResponsivePadding("stack");
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const handleSubmit = async () => {
    const normalizedEmail = email.trim().toLowerCase();
    setMessage(null);
    setFormError(null);

    if (!normalizedEmail) {
      Alert.alert('Email required', 'Please enter the email address on your contractor account.');
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/auth/forgot-password', {
        email: normalizedEmail,
        appRole: 'general_contractor',
      });
      setMessage(response?.message || 'If an account exists for that email, a password reset link has been sent.');
    } catch (error: any) {
      setFormError(error?.message || 'Could not request a password reset. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      className="flex-1 bg-[#0A1628]"
    >
      <View
        className="pb-4 flex-row items-center"
        style={{ paddingTop: headerPaddingTop, paddingHorizontal: horizontalPad }}
      >
        <TouchableOpacity onPress={() => router.back()} className="mr-3 flex-shrink-0">
          <ArrowLeft size={26} color="#FFFFFF" strokeWidth={2} />
        </TouchableOpacity>
        <Text
          className="text-xl text-white flex-1 min-w-0"
          style={{ fontFamily: 'Poppins_600SemiBold' }}
          numberOfLines={1}
        >
          Forgot Password
        </Text>
      </View>

      <View className="flex-1 justify-center" style={{ paddingHorizontal: Math.max(horizontalPad, 20), paddingBottom: scrollBottomPadding }}>
        <Text className="text-4xl text-white mb-2" style={{ fontFamily: 'Poppins_700Bold' }}>
          Reset access
        </Text>
        <Text className="text-gray-400 text-base mb-8" style={{ fontFamily: 'Poppins_400Regular' }}>
          Enter the email address you used to create your contractor account. We will send a secure reset link.
        </Text>

        <View className="mb-6">
          <Text className="text-gray-300 mb-2 text-sm" style={{ fontFamily: 'Poppins_500Medium' }}>
            Email
          </Text>
          <View className="bg-[#1E3A5F] rounded-2xl px-4 py-4 flex-row items-center border border-blue-900">
            <Mail size={20} color="#6B7280" strokeWidth={2} />
            <TextInput
              className="flex-1 ml-3 text-white text-base"
              style={{ fontFamily: 'Poppins_400Regular' }}
              placeholder="Enter your email"
              placeholderTextColor="#6B7280"
              value={email}
              onChangeText={(text) => {
                setEmail(text);
                setFormError(null);
                setMessage(null);
              }}
              autoCapitalize="none"
              keyboardType="email-address"
              autoCorrect={false}
            />
          </View>
        </View>

        <TouchableOpacity
          onPress={handleSubmit}
          disabled={loading}
          className="bg-blue-600 rounded-2xl py-5 px-6 flex-row items-center justify-center"
        >
          {loading ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text className="text-white text-lg" style={{ fontFamily: 'Poppins_700Bold' }}>
              Send reset link
            </Text>
          )}
        </TouchableOpacity>

        {message && (
          <Text className="text-green-300 text-sm text-center mt-4" style={{ fontFamily: 'Poppins_400Regular' }}>
            {message}
          </Text>
        )}
        {formError && (
          <Text className="text-red-400 text-sm text-center mt-4" style={{ fontFamily: 'Poppins_400Regular' }}>
            {formError}
          </Text>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}
