import { View, Text, TouchableOpacity, Image, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { useState } from "react";
import { signInWithGoogle, storeAuthToken } from "@/lib/auth";
import { LogIn, ArrowRight } from "lucide-react-native";

export default function LoginScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      const result = await signInWithGoogle();
      if (result?.token) {
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
    <View className="flex-1 bg-white">
      {/* Header */}
      <View className="pt-20 px-8 pb-12">
        <Text 
          className="text-5xl text-black mb-3"
          style={{ fontFamily: 'Poppins_600SemiBold' }}
        >
          Welcome Back
        </Text>
        <Text 
          className="text-xl text-gray-600 leading-7"
          style={{ fontFamily: 'Poppins_400Regular' }}
        >
          Sign in to continue your home building journey
        </Text>
      </View>

      <View className="flex-1 justify-center px-8">
        {/* Google Sign In Button */}
        <TouchableOpacity
          onPress={handleGoogleSignIn}
          disabled={loading}
          className="bg-white border-2 border-gray-300 rounded-2xl py-5 px-6 mb-4 flex-row items-center justify-center shadow-lg"
          style={{
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.1,
            shadowRadius: 8,
            elevation: 5,
          }}
        >
          {loading ? (
            <ActivityIndicator size="large" color="#4285F4" />
          ) : (
            <>
              <Image
                source={{ uri: 'https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg' }}
                style={{ width: 24, height: 24, marginRight: 12 }}
              />
              <Text 
                className="text-black text-xl flex-1 text-center"
                style={{ fontFamily: 'Poppins_600SemiBold' }}
              >
                Continue with Google
              </Text>
            </>
          )}
        </TouchableOpacity>

        {/* Divider */}
        <View className="flex-row items-center my-8">
          <View className="flex-1 h-px bg-gray-300" />
          <Text 
            className="mx-4 text-gray-500 text-base"
            style={{ fontFamily: 'Poppins_500Medium' }}
          >
            OR
          </Text>
          <View className="flex-1 h-px bg-gray-300" />
        </View>

        {/* Email/Password Option */}
        <TouchableOpacity
          onPress={() => router.push('/email-login')}
          className="bg-black rounded-2xl py-5 px-6 flex-row items-center justify-center"
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
