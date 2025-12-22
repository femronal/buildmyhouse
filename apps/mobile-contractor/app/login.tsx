import { View, Text, TouchableOpacity, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { useState } from "react";
import { signInWithGoogle, storeAuthToken } from "@/lib/auth";
import { LogIn, ArrowRight, HardHat } from "lucide-react-native";

// Allowed roles for contractor app
const ALLOWED_ROLES = ['general_contractor', 'subcontractor', 'vendor', 'admin'];

export default function LoginScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      const result = await signInWithGoogle();
      if (result?.token && result?.user) {
        // ROLE VALIDATION: Only allow contractors, subs, vendors
        const userRole = result.user.role;
        if (!userRole || !ALLOWED_ROLES.includes(userRole)) {
          console.error('❌ Invalid role for contractor app:', userRole);
          alert(
            `This app is for contractors, subcontractors, and vendors only.\n\nYour account role: ${userRole || 'unknown'}\n\nPlease use the homeowner app to sign in.`
          );
          return;
        }
        
        await storeAuthToken(result.token);
        
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
        alert('Login failed. Please try again.');
      }
    } catch (error: any) {
      console.error('Login error:', error);
      alert(error?.message || 'Login failed. Please check your Google Cloud Console redirect URIs.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="flex-1 bg-[#0A1628]">
      {/* Header */}
      <View className="pt-20 px-8 pb-12">
        <View className="flex-row items-center mb-4">
          <HardHat size={40} color="#3B82F6" strokeWidth={2} />
          <Text 
            className="text-4xl text-white ml-3"
            style={{ fontFamily: 'Poppins_800ExtraBold' }}
          >
            BuildMyHouse
          </Text>
        </View>
        <Text 
          className="text-5xl text-white mb-3"
          style={{ fontFamily: 'Poppins_600SemiBold' }}
        >
          Welcome Back
        </Text>
        <Text 
          className="text-xl text-gray-400 leading-7"
          style={{ fontFamily: 'Poppins_400Regular' }}
        >
          Sign in to your contractor account
        </Text>
      </View>

      <View className="flex-1 justify-center px-8">
        {/* Google Sign In Button */}
        <TouchableOpacity
          onPress={handleGoogleSignIn}
          disabled={loading}
          className="bg-[#1E3A5F] border-2 border-blue-900 rounded-2xl py-5 px-6 mb-4 flex-row items-center justify-center"
        >
          {loading ? (
            <ActivityIndicator size="large" color="#3B82F6" />
          ) : (
            <>
              <Text 
                className="text-white text-xl flex-1 text-center"
                style={{ fontFamily: 'Poppins_600SemiBold' }}
              >
                Continue with Google
              </Text>
            </>
          )}
        </TouchableOpacity>

        {/* Divider */}
        <View className="flex-row items-center my-8">
          <View className="flex-1 h-px bg-gray-700" />
          <Text 
            className="mx-4 text-gray-500 text-base"
            style={{ fontFamily: 'Poppins_500Medium' }}
          >
            OR
          </Text>
          <View className="flex-1 h-px bg-gray-700" />
        </View>

        {/* Email/Password Option */}
        <TouchableOpacity
          onPress={() => router.push('/email-login')}
          className="bg-blue-600 rounded-2xl py-5 px-6 flex-row items-center justify-center"
        >
          <LogIn size={24} color="#FFFFFF" strokeWidth={2.5} />
          <Text 
            className="text-white text-xl ml-3"
            style={{ fontFamily: 'Poppins_600SemiBold' }}
          >
            Sign in with Email
          </Text>
          <ArrowRight size={20} color="#FFFFFF" strokeWidth={2.5} className="ml-2" />
        </TouchableOpacity>
      </View>

      {/* Footer */}
      <View className="pb-12 px-8">
        <Text 
          className="text-gray-500 text-center text-base leading-6"
          style={{ fontFamily: 'Poppins_400Regular' }}
        >
          By continuing, you agree to our Terms of Service and Privacy Policy
        </Text>
      </View>
    </View>
  );
}
