import { View, Text, TouchableOpacity, Image, ActivityIndicator, Platform } from "react-native";
import { useRouter } from "expo-router";
import { useState } from "react";
import { signInWithGoogle, storeAuthToken } from "@/lib/auth";
import { LogIn, ArrowRight } from "lucide-react-native";
import Logo from "@/components/Logo";

export default function LoginScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      const result = await signInWithGoogle();

      // Web OAuth intentionally redirects current tab and returns null.
      if (Platform.OS === 'web' && !result) {
        return;
      }

      if (result?.token && result?.user) {
        // ROLE VALIDATION: Only allow homeowners
        const userRole = result.user.role;
        if (!userRole || userRole !== 'homeowner') {
          console.error('❌ Invalid role for homeowner app:', userRole);
          alert(
            `This app is for homeowners only.\n\nYour account role: ${userRole || 'unknown'}\n\nPlease use the contractor app to sign in.`
          );
          return;
        }
        
        await storeAuthToken(result.token);
        router.replace('/(tabs)/home');
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
    <View
      className="flex-1 bg-white"
      style={{
        overflow: "hidden",
        ...(Platform.OS === "web"
          ? { height: "100vh", maxHeight: "100vh" }
          : {}),
      }}
    >
      {/* Header */}
      <View className="pt-14 px-6 pb-6">
        <View className="items-center mb-4">
          <Logo size="xxl" />
        </View>
        <Text 
          className="text-4xl text-black mb-2"
          style={{ fontFamily: 'Poppins_600SemiBold' }}
        >
          Welcome Back
        </Text>
        <Text 
          className="text-base text-gray-600 leading-6"
          style={{ fontFamily: 'Poppins_400Regular' }}
        >
          Sign in or create an account to continue your home building journey
        </Text>
      </View>

      <View className="flex-1 justify-center px-6">
        {/* Google Sign In Button */}
        <TouchableOpacity
          onPress={handleGoogleSignIn}
          disabled={loading}
          className="bg-white border border-gray-300 rounded-xl py-3.5 px-4 mb-3 flex-row items-center justify-center shadow-sm"
          style={{
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.08,
            shadowRadius: 4,
            elevation: 2,
          }}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#4285F4" />
          ) : (
            <>
              <Image
                source={{ uri: 'https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg' }}
                style={{ width: 20, height: 20, marginRight: 10 }}
              />
              <Text 
                className="text-black text-base flex-1 text-center"
                style={{ fontFamily: 'Poppins_600SemiBold' }}
              >
                Continue with Google
              </Text>
            </>
          )}
        </TouchableOpacity>

        {/* Divider */}
        <View className="flex-row items-center my-4">
          <View className="flex-1 h-px bg-gray-300" />
          <Text 
            className="mx-3 text-gray-500 text-xs"
            style={{ fontFamily: 'Poppins_500Medium' }}
          >
            OR
          </Text>
          <View className="flex-1 h-px bg-gray-300" />
        </View>

        {/* Email Option */}
        <TouchableOpacity
          onPress={() => router.push('/email-login')}
          className="bg-black rounded-xl py-3.5 px-4 flex-row items-center justify-center"
        >
          <LogIn size={18} color="#FFFFFF" strokeWidth={2.3} />
          <Text 
            className="text-white text-base ml-2"
            style={{ fontFamily: 'Poppins_600SemiBold' }}
          >
            Continue with Email
          </Text>
          <ArrowRight size={16} color="#FFFFFF" strokeWidth={2.4} className="ml-1.5" />
        </TouchableOpacity>
      </View>

      {/* Footer */}
      <View className="pb-6 px-6">
        <Text 
          className="text-gray-500 text-center text-xs leading-5"
          style={{ fontFamily: 'Poppins_400Regular' }}
        >
          By continuing, you agree to our Terms of Service and Privacy Policy
        </Text>
      </View>
    </View>
  );
}
