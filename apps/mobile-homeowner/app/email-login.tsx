import { View, Text, TouchableOpacity, TextInput, ActivityIndicator, KeyboardAvoidingView, Platform } from "react-native";
import { useRouter } from "expo-router";
import { useState } from "react";
import { storeAuthToken } from "@/lib/auth";
import { ArrowLeft, Mail, Lock } from "lucide-react-native";

export default function EmailLoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      alert('Please enter both email and password');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('http://localhost:3001/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (response.ok) {
        const data = await response.json();
        
        if (!data.token) {
          alert('Login error: No token received from server');
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
      } else {
        const error = await response.json();
        alert(error.message || 'Login failed');
      }
    } catch (error: any) {
      alert('Login failed. Make sure backend is running.');
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
      <View className="pt-16 px-6 pb-4 flex-row items-center">
        <TouchableOpacity onPress={() => router.back()} className="mr-4">
          <ArrowLeft size={28} color="#000000" strokeWidth={2} />
        </TouchableOpacity>
        <Text 
          className="text-2xl text-black"
          style={{ fontFamily: 'Poppins_600SemiBold' }}
        >
          Sign In
        </Text>
      </View>

      <View className="flex-1 justify-center px-8">
        <Text 
          className="text-4xl text-black mb-2"
          style={{ fontFamily: 'Poppins_700Bold' }}
        >
          Welcome Back
        </Text>
        <Text 
          className="text-gray-500 text-lg mb-8"
          style={{ fontFamily: 'Poppins_400Regular' }}
        >
          Sign in to continue
        </Text>

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
              onChangeText={setEmail}
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
              onChangeText={setPassword}
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>
        </View>

        {/* Test Accounts Info */}
        <View className="bg-blue-50 rounded-2xl p-4 mb-6 border border-blue-200">
          <Text className="text-blue-900 text-sm mb-2" style={{ fontFamily: 'Poppins_600SemiBold' }}>
            Test Accounts:
          </Text>
          <Text className="text-blue-800 text-xs" style={{ fontFamily: 'Poppins_400Regular' }}>
            Homeowner: homeowner@example.com{'\n'}
            Vendor: vendor@example.com{'\n'}
            Password: password123
          </Text>
        </View>

        {/* Login Button */}
        <TouchableOpacity
          onPress={handleLogin}
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
              Sign In
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}
