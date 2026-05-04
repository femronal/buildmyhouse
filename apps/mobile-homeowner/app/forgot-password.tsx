import { View, Text, TouchableOpacity, TextInput, ActivityIndicator, KeyboardAvoidingView, Platform, Alert } from "react-native";
import { useRouter } from "expo-router";
import { useState } from "react";
import { ArrowLeft, Mail } from "lucide-react-native";
import { api } from "@/lib/api";
import Logo from "@/components/Logo";

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const handleSubmit = async () => {
    const normalizedEmail = email.trim().toLowerCase();
    setMessage(null);
    setFormError(null);

    if (!normalizedEmail) {
      Alert.alert('Email required', 'Please enter the email address on your homeowner account.');
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/auth/forgot-password', {
        email: normalizedEmail,
        appRole: 'homeowner',
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
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-white"
    >
      <View className="pt-16 px-6 pb-4">
        <View className="items-center mb-6">
          <Logo size="lg" />
        </View>
        <View className="flex-row items-center">
          <TouchableOpacity onPress={() => router.back()} className="mr-4">
            <ArrowLeft size={28} color="#000000" strokeWidth={2} />
          </TouchableOpacity>
          <Text className="text-2xl text-black" style={{ fontFamily: 'Poppins_600SemiBold' }}>
            Forgot Password
          </Text>
        </View>
      </View>

      <View className="flex-1 px-8 pt-4 pb-6">
        <Text className="text-gray-500 text-base mb-8" style={{ fontFamily: 'Poppins_400Regular' }}>
          Enter the email address you used to create your homeowner account. We will send a secure link to reset your password.
        </Text>

        <View className="mb-6">
          <Text className="text-gray-700 mb-2 text-sm" style={{ fontFamily: 'Poppins_500Medium' }}>
            Email
          </Text>
          <View className="bg-gray-100 rounded-2xl px-4 py-4 flex-row items-center">
            <Mail size={20} color="#6B7280" strokeWidth={2} />
            <TextInput
              className="flex-1 ml-3 text-black text-base"
              style={{ fontFamily: 'Poppins_400Regular' }}
              placeholder="Enter your email"
              placeholderTextColor="#9CA3AF"
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
          className="bg-black rounded-2xl py-5 px-6 flex-row items-center justify-center"
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
          <Text className="text-green-700 text-sm text-center mt-4" style={{ fontFamily: 'Poppins_400Regular' }}>
            {message}
          </Text>
        )}
        {formError && (
          <Text className="text-red-600 text-sm text-center mt-4" style={{ fontFamily: 'Poppins_400Regular' }}>
            {formError}
          </Text>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}
