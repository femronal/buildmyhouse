import { View, Text, TouchableOpacity, TextInput, ActivityIndicator, KeyboardAvoidingView, Platform } from "react-native";
import { useRouter } from "expo-router";
import { useState } from "react";
import { storeAuthToken } from "@/lib/auth";
import { api } from "@/lib/api";
import { ArrowLeft, Mail, Lock, User } from "lucide-react-native";
import Logo from "@/components/Logo";

export default function EmailLoginScreen() {
  const router = useRouter();
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
      alert(mode === 'signup' ? 'Please enter your full name, email, and password' : 'Please enter both email and password');
      return;
    }

    setLoading(true);
    try {
      const data = mode === 'signup'
        ? await api.post('/auth/register', {
            fullName: fullName.trim(),
            email: email.trim().toLowerCase(),
            password,
            role: 'homeowner',
          })
        : await api.post('/auth/login', {
            email: email.trim().toLowerCase(),
            password,
          });

      if (!data?.token) {
        alert(`${mode === 'signup' ? 'Signup' : 'Login'} error: No token received from server`);
        return;
      }

      // ROLE VALIDATION: Only allow homeowners
      const userRole = data.user?.role;
      if (!userRole || userRole !== 'homeowner') {
        alert(
          `This app is for homeowners only.\n\nYour account role: ${userRole || 'unknown'}\n\nPlease use the contractor app to sign in.`
        );
        return;
      }
      
      await storeAuthToken(data.token);
      router.replace('/(tabs)/home');
    } catch (error: any) {
      const message = error?.data?.message ?? error?.message ?? 'Something went wrong. Please try again.';
      setFormError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-white"
    >
      {/* Header */}
      <View className="pt-16 px-6 pb-4">
        <View className="items-center mb-6">
          <Logo size="lg" />
        </View>
        <View className="flex-row items-center">
          <TouchableOpacity onPress={() => router.back()} className="mr-4">
          <ArrowLeft size={28} color="#000000" strokeWidth={2} />
        </TouchableOpacity>
        <Text 
          className="text-2xl text-black"
          style={{ fontFamily: 'Poppins_600SemiBold' }}
        >
          {mode === 'signup' ? 'Create Account' : 'Sign In'}
        </Text>
        </View>
      </View>

      <View className="flex-1 justify-center px-8">
        <View className="flex-row bg-gray-100 rounded-2xl p-1 mb-8">
          <TouchableOpacity
            onPress={() => { setMode('signin'); clearError(); }}
            className={`flex-1 rounded-xl py-3 ${mode === 'signin' ? 'bg-white' : ''}`}
          >
            <Text
              className={`text-center ${mode === 'signin' ? 'text-black' : 'text-gray-500'}`}
              style={{ fontFamily: 'Poppins_600SemiBold' }}
            >
              Sign In
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => { setMode('signup'); clearError(); }}
            className={`flex-1 rounded-xl py-3 ${mode === 'signup' ? 'bg-white' : ''}`}
          >
            <Text
              className={`text-center ${mode === 'signup' ? 'text-black' : 'text-gray-500'}`}
              style={{ fontFamily: 'Poppins_600SemiBold' }}
            >
              Sign Up
            </Text>
          </TouchableOpacity>
        </View>

        <Text 
          className="text-4xl text-black mb-2"
          style={{ fontFamily: 'Poppins_700Bold' }}
        >
          {mode === 'signup' ? 'Create your account' : 'Welcome Back'}
        </Text>
        <Text 
          className="text-gray-500 text-lg mb-8"
          style={{ fontFamily: 'Poppins_400Regular' }}
        >
          {mode === 'signup' ? 'Sign up with your email to get started' : 'Sign in to continue'}
        </Text>

        {mode === 'signup' && (
          <View className="mb-4">
            <Text className="text-gray-700 mb-2 text-sm" style={{ fontFamily: 'Poppins_500Medium' }}>
              Full name
            </Text>
            <View className="bg-gray-100 rounded-2xl px-4 py-4 flex-row items-center">
              <User size={20} color="#6B7280" strokeWidth={2} />
              <TextInput
                className="flex-1 ml-3 text-black text-base"
                style={{ fontFamily: 'Poppins_400Regular' }}
                placeholder="Enter your full name"
                placeholderTextColor="#9CA3AF"
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
              onChangeText={(t) => { setEmail(t); clearError(); }}
              autoCapitalize="none"
              keyboardType="email-address"
              autoCorrect={false}
            />
          </View>
        </View>

        {/* Password Input */}
        <View className="mb-6">
          <Text className="text-gray-700 mb-2 text-sm" style={{ fontFamily: 'Poppins_500Medium' }}>
            Password
          </Text>
          <View className="bg-gray-100 rounded-2xl px-4 py-4 flex-row items-center">
            <Lock size={20} color="#6B7280" strokeWidth={2} />
            <TextInput
              className="flex-1 ml-3 text-black text-base"
              style={{ fontFamily: 'Poppins_400Regular' }}
              placeholder="Enter your password"
              placeholderTextColor="#9CA3AF"
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
          className="bg-black rounded-2xl py-5 px-6 flex-row items-center justify-center"
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
            className="text-red-600 text-sm text-center mt-4"
            style={{ fontFamily: 'Poppins_400Regular' }}
          >
            {formError}
          </Text>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}



