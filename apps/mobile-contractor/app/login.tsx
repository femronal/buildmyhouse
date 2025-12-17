import { View, Text, TouchableOpacity, Image, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { useState } from "react";
import { signInWithGoogle, storeAuthToken } from "@/lib/auth";
import { LogIn, ArrowRight, HardHat } from "lucide-react-native";

export default function ContractorLoginScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      const result = await signInWithGoogle();
      if (result?.token) {
        await storeAuthToken(result.token);
        router.replace('/contractor');
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
          <HardHat size={40} color="#3B82F6" strokeWidth={2.5} />
          <Text 
            className="text-5xl text-white ml-3"
            style={{ fontFamily: 'Poppins_800ExtraBold' }}
          >
            BuildMyHouse
          </Text>
        </View>
        <Text 
          className="text-2xl text-blue-400 mb-2"
          style={{ fontFamily: 'Poppins_700Bold' }}
        >
          Professional Portal
        </Text>
        <Text 
          className="text-lg text-gray-400 leading-6"
          style={{ fontFamily: 'Poppins_400Regular' }}
        >
          Sign in to access your projects and grow your business
        </Text>
      </View>

      <View className="flex-1 justify-center px-8">
        {/* Google Sign In Button */}
        <TouchableOpacity
          onPress={handleGoogleSignIn}
          disabled={loading}
          className="bg-white rounded-2xl py-6 px-6 mb-4 flex-row items-center justify-center shadow-lg"
          style={{
            shadowColor: '#3B82F6',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
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
                style={{ width: 28, height: 28, marginRight: 12 }}
              />
              <Text 
                className="text-black text-xl flex-1 text-center"
                style={{ fontFamily: 'Poppins_700Bold' }}
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
            className="mx-4 text-gray-500 text-lg"
            style={{ fontFamily: 'Poppins_500Medium' }}
          >
            OR
          </Text>
          <View className="flex-1 h-px bg-gray-700" />
        </View>

        {/* Email/Password Option */}
        <TouchableOpacity
          onPress={() => {/* Will implement later */}}
          className="bg-blue-600 rounded-2xl py-6 px-6 flex-row items-center justify-center"
        >
          <LogIn size={24} color="#FFFFFF" strokeWidth={2.5} />
          <Text 
            className="text-white text-xl ml-3"
            style={{ fontFamily: 'Poppins_700Bold' }}
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
          Secure professional access • Verified contractors only
        </Text>
      </View>
    </View>
  );
}
