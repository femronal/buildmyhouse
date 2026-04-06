import { View, Text, TouchableOpacity, TextInput, ActivityIndicator, KeyboardAvoidingView, Platform, Alert } from "react-native";
import { useRouter } from "expo-router";
import { useState } from "react";
import { storeAuthToken } from "@/lib/auth";
import { useResponsivePadding } from "@/lib/responsive-layout";
import { api } from "@/lib/api";
import { ArrowLeft, Mail, Lock, User } from "lucide-react-native";
import { useQueryClient } from "@tanstack/react-query";

// Allowed roles for contractor app (MVP: GC + admin only)
const ALLOWED_ROLES = ['general_contractor', 'admin'];

export default function EmailLoginScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { horizontalPad, headerPaddingTop, scrollBottomPadding } =
    useResponsivePadding("stack");
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const clearError = () => setFormError(null);

  const handleSubmit = async () => {
    setFormError(null);
    if (!email || !password || (mode === 'signup' && !fullName.trim())) {
      Alert.alert(
        'Error',
        mode === 'signup'
          ? 'Please enter your full name, email, and password'
          : 'Please enter both email and password'
      );
      return;
    }

    setLoading(true);
    try {
      const data =
        mode === 'signup'
          ? await api.post('/auth/register', {
              fullName: fullName.trim(),
              email: email.trim().toLowerCase(),
              password,
              role: 'general_contractor',
            })
          : await api.post('/auth/login', {
              email: email.trim().toLowerCase(),
              password,
            });

      if (!data?.token) {
        Alert.alert(
          'Error',
          `${mode === 'signup' ? 'Signup' : 'Login'} error: No token received from server`
        );
        return;
      }

      // ROLE VALIDATION: Only allow GCs (and admin)
      const userRole = data.user?.role;
      if (!userRole || !ALLOWED_ROLES.includes(userRole)) {
        Alert.alert(
          'Access Denied',
          `This app is for General Contractors only.\n\nYour account role: ${userRole || 'unknown'}\n\nPlease use the homeowner app to sign in.`,
          [{ text: 'OK' }]
        );
        return;
      }

      await storeAuthToken(data.token);
      queryClient.setQueryData(['current-user'], data.user);
      await queryClient.invalidateQueries({ queryKey: ['current-user'] });
      router.replace('/contractor/gc-dashboard');
    } catch (error: any) {
      const message = error?.data?.message ?? error?.message ?? 'Something went wrong. Please try again.';
      setFormError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      className="flex-1 bg-[#0A1628]"
      style={{
        overflow: "hidden",
        ...(Platform.OS === "web"
          ? { height: "100vh", maxHeight: "100vh" }
          : {}),
      }}
    >
      {/* Header */}
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
          {mode === 'signup' ? 'Create Account' : 'Sign In'}
        </Text>
      </View>

      <View className="flex-1 justify-center" style={{ paddingHorizontal: Math.max(horizontalPad, 20), paddingBottom: scrollBottomPadding }}>
        <View className="flex-row bg-[#1E3A5F] rounded-2xl p-1 mb-8">
          <TouchableOpacity
            onPress={() => { setMode('signin'); clearError(); }}
            className={`flex-1 rounded-xl py-3 ${mode === 'signin' ? 'bg-blue-600' : ''}`}
          >
            <Text
              className={`text-center ${mode === 'signin' ? 'text-white' : 'text-gray-400'}`}
              style={{ fontFamily: 'Poppins_600SemiBold' }}
            >
              Sign In
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => { setMode('signup'); clearError(); }}
            className={`flex-1 rounded-xl py-3 ${mode === 'signup' ? 'bg-blue-600' : ''}`}
          >
            <Text
              className={`text-center ${mode === 'signup' ? 'text-white' : 'text-gray-400'}`}
              style={{ fontFamily: 'Poppins_600SemiBold' }}
            >
              Sign Up
            </Text>
          </TouchableOpacity>
        </View>

        <Text 
          className="text-4xl text-white mb-2"
          style={{ fontFamily: 'Poppins_700Bold' }}
        >
          {mode === 'signup' ? 'Create your account' : 'Welcome Back'}
        </Text>
        <Text 
          className="text-gray-400 text-lg mb-8"
          style={{ fontFamily: 'Poppins_400Regular' }}
        >
          {mode === 'signup' ? 'Sign up with your email to get started as a contractor' : 'Sign in to your contractor account'}
        </Text>

        {mode === 'signup' && (
          <View className="mb-4">
            <Text className="text-gray-300 mb-2 text-sm" style={{ fontFamily: 'Poppins_500Medium' }}>
              Full name
            </Text>
            <View className="bg-[#1E3A5F] rounded-2xl px-4 py-4 flex-row items-center border border-blue-900">
              <User size={20} color="#6B7280" strokeWidth={2} />
              <TextInput
                className="flex-1 ml-3 text-white text-base"
                style={{ fontFamily: 'Poppins_400Regular' }}
                placeholder="Enter your full name"
                placeholderTextColor="#6B7280"
              value={fullName}
              onChangeText={(t) => { setFullName(t); clearError(); }}
                autoCapitalize="words"
                autoCorrect={false}
              />
            </View>
          </View>
        )}

        {/* Email Input */}
        <View className="mb-4">
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
              onChangeText={(t) => { setEmail(t); clearError(); }}
              autoCapitalize="none"
              keyboardType="email-address"
              autoCorrect={false}
            />
          </View>
        </View>

        {/* Password Input */}
        <View className="mb-6">
          <Text className="text-gray-300 mb-2 text-sm" style={{ fontFamily: 'Poppins_500Medium' }}>
            Password
          </Text>
          <View className="bg-[#1E3A5F] rounded-2xl px-4 py-4 flex-row items-center border border-blue-900">
            <Lock size={20} color="#6B7280" strokeWidth={2} />
            <TextInput
              className="flex-1 ml-3 text-white text-base"
              style={{ fontFamily: 'Poppins_400Regular' }}
              placeholder="Enter your password"
              placeholderTextColor="#6B7280"
              value={password}
              onChangeText={(t) => { setPassword(t); clearError(); }}
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>
        </View>

        {/* Auth Button */}
        <TouchableOpacity
          onPress={handleSubmit}
          disabled={loading}
          className="bg-blue-600 rounded-2xl py-5 px-6 flex-row items-center justify-center"
        >
          {loading ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text 
              className="text-white text-lg"
              style={{ fontFamily: 'Poppins_700Bold' }}
            >
              {mode === 'signup' ? 'Create Account' : 'Sign In'}
            </Text>
          )}
        </TouchableOpacity>

        {formError && (
          <Text 
            className="text-red-400 text-sm text-center mt-4"
            style={{ fontFamily: 'Poppins_400Regular' }}
          >
            {formError}
          </Text>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}


