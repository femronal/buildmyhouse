import { View, Text, TouchableOpacity, TextInput, ActivityIndicator, KeyboardAvoidingView, Platform, Alert } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { ArrowLeft, Lock } from "lucide-react-native";
import { api } from "@/lib/api";
import { useResponsivePadding } from "@/lib/responsive-layout";

export default function ResetPasswordScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ token?: string }>();
  const token = Array.isArray(params.token) ? params.token[0] : params.token;
  const { horizontalPad, headerPaddingTop, scrollBottomPadding } =
    useResponsivePadding("stack");
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const handleSubmit = async () => {
    setFormError(null);

    if (!token) {
      setFormError('This reset link is missing a token. Please request a new password reset link.');
      return;
    }
    if (!newPassword || !confirmPassword) {
      Alert.alert('Password required', 'Please enter and confirm your new password.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setFormError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      await api.post('/auth/reset-password', {
        token,
        newPassword,
      });
      Alert.alert('Password reset', 'Your password has been updated. Please sign in with your new password.', [
        { text: 'Sign in', onPress: () => router.replace('/email-login') },
      ]);
    } catch (error: any) {
      setFormError(error?.message || 'Could not reset your password. Please request a new link.');
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
          Reset Password
        </Text>
      </View>

      <View className="flex-1 justify-center" style={{ paddingHorizontal: Math.max(horizontalPad, 20), paddingBottom: scrollBottomPadding }}>
        <Text className="text-4xl text-white mb-2" style={{ fontFamily: 'Poppins_700Bold' }}>
          Create new password
        </Text>
        <Text className="text-gray-400 text-base mb-8" style={{ fontFamily: 'Poppins_400Regular' }}>
          Use at least 8 characters, including uppercase, lowercase, number, and special character.
        </Text>

        <View className="mb-4">
          <Text className="text-gray-300 mb-2 text-sm" style={{ fontFamily: 'Poppins_500Medium' }}>
            New password
          </Text>
          <View className="bg-[#1E3A5F] rounded-2xl px-4 py-4 flex-row items-center border border-blue-900">
            <Lock size={20} color="#6B7280" strokeWidth={2} />
            <TextInput
              className="flex-1 ml-3 text-white text-base"
              style={{ fontFamily: 'Poppins_400Regular' }}
              placeholder="Enter new password"
              placeholderTextColor="#6B7280"
              value={newPassword}
              onChangeText={(text) => {
                setNewPassword(text);
                setFormError(null);
              }}
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>
        </View>

        <View className="mb-6">
          <Text className="text-gray-300 mb-2 text-sm" style={{ fontFamily: 'Poppins_500Medium' }}>
            Confirm password
          </Text>
          <View className="bg-[#1E3A5F] rounded-2xl px-4 py-4 flex-row items-center border border-blue-900">
            <Lock size={20} color="#6B7280" strokeWidth={2} />
            <TextInput
              className="flex-1 ml-3 text-white text-base"
              style={{ fontFamily: 'Poppins_400Regular' }}
              placeholder="Confirm new password"
              placeholderTextColor="#6B7280"
              value={confirmPassword}
              onChangeText={(text) => {
                setConfirmPassword(text);
                setFormError(null);
              }}
              secureTextEntry
              autoCapitalize="none"
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
              Reset password
            </Text>
          )}
        </TouchableOpacity>

        {formError && (
          <Text className="text-red-400 text-sm text-center mt-4" style={{ fontFamily: 'Poppins_400Regular' }}>
            {formError}
          </Text>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}
