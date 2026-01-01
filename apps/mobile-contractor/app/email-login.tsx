import { View, Text, TouchableOpacity, TextInput, ActivityIndicator, KeyboardAvoidingView, Platform, Alert } from "react-native";
import { useRouter } from "expo-router";
import { useState } from "react";
import { storeAuthToken } from "@/lib/auth";
import { ArrowLeft, Mail, Lock } from "lucide-react-native";

// Allowed roles for contractor app
const ALLOWED_ROLES = ['general_contractor', 'subcontractor', 'vendor', 'admin'];

export default function EmailLoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter both email and password');
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
        console.log('✅ Login successful, received token:', data.token ? 'Token exists' : 'NO TOKEN IN RESPONSE');
        console.log('👤 User:', data.user);
        console.log('🔑 User role:', data.user?.role);
        
        if (!data.token) {
          console.error('❌ Backend did not return a token!');
          Alert.alert('Error', 'Login error: No token received from server');
          return;
        }

        // ROLE VALIDATION: Only allow contractors, subs, vendors
        const userRole = data.user?.role;
        if (!userRole || !ALLOWED_ROLES.includes(userRole)) {
          console.error('❌ Invalid role for contractor app:', userRole);
          Alert.alert(
            'Access Denied',
            `This app is for contractors, subcontractors, and vendors only.\n\nYour account role: ${userRole || 'unknown'}\n\nPlease use the homeowner app to sign in.`,
            [{ text: 'OK' }]
          );
          return;
        }
        
        await storeAuthToken(data.token);
        console.log('✅ Token stored successfully');
        
        // Route based on role
        if (userRole === 'general_contractor') {
          router.replace('/contractor/gc-dashboard');
        } else if (userRole === 'subcontractor') {
          router.replace('/contractor/sub-dashboard');
        } else if (userRole === 'vendor') {
          router.replace('/contractor/vendor-dashboard');
        } else {
          router.replace('/contractor');
        }
      } else {
        const error = await response.json();
        console.error('❌ Login failed:', error);
        Alert.alert('Login Failed', error.message || 'Invalid email or password');
      }
    } catch (error: any) {
      console.error('Login error:', error);
      Alert.alert('Error', 'Login failed. Make sure backend is running.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-[#0A1628]"
    >
      {/* Header */}
      <View className="pt-16 px-6 pb-4 flex-row items-center">
        <TouchableOpacity onPress={() => router.back()} className="mr-4">
          <ArrowLeft size={28} color="#FFFFFF" strokeWidth={2} />
        </TouchableOpacity>
        <Text 
          className="text-2xl text-white"
          style={{ fontFamily: 'Poppins_600SemiBold' }}
        >
          Sign In
        </Text>
      </View>

      <View className="flex-1 justify-center px-8">
        <Text 
          className="text-4xl text-white mb-2"
          style={{ fontFamily: 'Poppins_700Bold' }}
        >
          Welcome Back
        </Text>
        <Text 
          className="text-gray-400 text-lg mb-8"
          style={{ fontFamily: 'Poppins_400Regular' }}
        >
          Sign in to your contractor account
        </Text>

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
              onChangeText={setEmail}
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
              onChangeText={setPassword}
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>
        </View>

        {/* Test Accounts Info */}
        <View className="bg-blue-900/30 rounded-2xl p-4 mb-6 border border-blue-800">
          <Text className="text-blue-300 text-sm mb-2" style={{ fontFamily: 'Poppins_600SemiBold' }}>
            Test Accounts:
          </Text>
          <Text className="text-blue-200 text-xs" style={{ fontFamily: 'Poppins_400Regular' }}>
            GC: gc@example.com{'\n'}
            Subcontractor: sub@example.com{'\n'}
            Vendor: vendor@example.com{'\n'}
            Password: password123
          </Text>
        </View>

        {/* Login Button */}
        <TouchableOpacity
          onPress={handleLogin}
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
              Sign In
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}


