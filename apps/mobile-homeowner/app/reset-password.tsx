import { View, Text, TouchableOpacity, TextInput, ActivityIndicator, KeyboardAvoidingView, Platform, Alert } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { ArrowLeft, Lock } from "lucide-react-native";
import { api } from "@/lib/api";
import Logo from "@/components/Logo";

export default function ResetPasswordScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ token?: string }>();
  const token = Array.isArray(params.token) ? params.token[0] : params.token;
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
            Reset Password
          </Text>
        </View>
      </View>

      <View className="flex-1 px-8 pt-4 pb-6">
        <Text className="text-gray-500 text-base mb-8" style={{ fontFamily: 'Poppins_400Regular' }}>
          Choose a new password with at least 8 characters, including uppercase, lowercase, number, and special character.
        </Text>

        <View className="mb-4">
          <Text className="text-gray-700 mb-2 text-sm" style={{ fontFamily: 'Poppins_500Medium' }}>
            New password
          </Text>
          <View className="bg-gray-100 rounded-2xl px-4 py-4 flex-row items-center">
            <Lock size={20} color="#6B7280" strokeWidth={2} />
            <TextInput
              className="flex-1 ml-3 text-black text-base"
              style={{ fontFamily: 'Poppins_400Regular' }}
              placeholder="Enter new password"
              placeholderTextColor="#9CA3AF"
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
          <Text className="text-gray-700 mb-2 text-sm" style={{ fontFamily: 'Poppins_500Medium' }}>
            Confirm password
          </Text>
          <View className="bg-gray-100 rounded-2xl px-4 py-4 flex-row items-center">
            <Lock size={20} color="#6B7280" strokeWidth={2} />
            <TextInput
              className="flex-1 ml-3 text-black text-base"
              style={{ fontFamily: 'Poppins_400Regular' }}
              placeholder="Confirm new password"
              placeholderTextColor="#9CA3AF"
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
          className="bg-black rounded-2xl py-5 px-6 flex-row items-center justify-center"
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
          <Text className="text-red-600 text-sm text-center mt-4" style={{ fontFamily: 'Poppins_400Regular' }}>
            {formError}
          </Text>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}
