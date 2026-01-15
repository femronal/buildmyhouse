import { View, Text, TouchableOpacity, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { Home, Upload, Bell, ArrowLeft } from "lucide-react-native";
import { useEffect } from "react";
import { useCurrentUser } from "@/hooks/useCurrentUser";

export default function StartScreen() {
  const router = useRouter();
  const { data: currentUser, isLoading } = useCurrentUser();

  // Redirect authenticated users to the home tabs
  useEffect(() => {
    if (!isLoading && currentUser) {
      // User is authenticated, redirect to home tabs
      router.replace('/(tabs)/home');
    }
  }, [currentUser, isLoading, router]);

  // Show loading indicator while checking authentication
  if (isLoading) {
    return (
      <View className="flex-1 bg-white justify-center items-center">
        <ActivityIndicator size="large" color="#000000" />
      </View>
    );
  }

  // If user is authenticated, don't render the landing page (will redirect)
  if (currentUser) {
    return (
      <View className="flex-1 bg-white justify-center items-center">
        <ActivityIndicator size="large" color="#000000" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-white">
      {/* Header */}
      <View className="pt-16 px-6 pb-4 flex-row items-center justify-between">
        <View className="flex-row items-center gap-3">
          <TouchableOpacity 
            onPress={() => router.back()}
            className="w-10 h-10 bg-gray-100 rounded-full items-center justify-center"
          >
            <ArrowLeft size={20} color="#000000" strokeWidth={2} />
          </TouchableOpacity>
          
        <TouchableOpacity 
            onPress={() => router.push('/dashboard')}
            className="w-10 h-10 bg-gray-100 rounded-full items-center justify-center"
        >
            <Home size={20} color="#000000" strokeWidth={2} />
        </TouchableOpacity>
        </View>
        
        <Text 
          className="text-2xl text-black"
          style={{ fontFamily: 'Poppins_700Bold' }}
        >
          BuildMyHouse
        </Text>
        
        <TouchableOpacity 
          onPress={() => router.push('/notifications')}
          className="w-12 h-12 bg-gray-100 rounded-full items-center justify-center"
        >
          <Bell size={24} color="#000000" strokeWidth={2} />
          <View className="absolute top-2 right-2 w-3 h-3 bg-black rounded-full" />
        </TouchableOpacity>
      </View>

      <View className="flex-1 justify-center items-center px-8">
        {/* Logo */}
        <Text 
          className="text-6xl text-black mb-4 text-center"
          style={{ fontFamily: 'Poppins_800ExtraBold' }}
        >
          Build
        </Text>
        <Text 
          className="text-6xl text-black mb-4 text-center"
          style={{ fontFamily: 'Poppins_800ExtraBold' }}
        >
          My
        </Text>
        <Text 
          className="text-6xl text-black mb-8 text-center"
          style={{ fontFamily: 'Poppins_800ExtraBold' }}
        >
          House
        </Text>
        
        {/* Tagline */}
        <Text 
          className="text-lg text-gray-500 text-center mb-16 leading-7"
          style={{ fontFamily: 'Poppins_400Regular' }}
        >
          Your transparent journey from blueprint to home
        </Text>

        {/* CTAs */}
        <View className="w-full max-w-sm">
          <TouchableOpacity
            onPress={() => router.push('/location?mode=explore')}
            className="bg-black rounded-full py-5 px-8 mb-4"
          >
            <View className="flex-row items-center justify-center">
              <Home size={24} color="#FFFFFF" strokeWidth={2} />
              <Text 
                className="text-white text-lg ml-3"
                style={{ fontFamily: 'Poppins_700Bold' }}
              >
                Explore Designs
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.push('/location?mode=upload')}
            className="bg-white border-2 border-black rounded-full py-5 px-8"
          >
            <View className="flex-row items-center justify-center">
              <Upload size={24} color="#000000" strokeWidth={2} />
              <Text 
                className="text-black text-lg ml-3"
                style={{ fontFamily: 'Poppins_700Bold' }}
              >
                Upload Your Plan
              </Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>

      {/* Footer note */}
      <View className="pb-12 px-8">
        <Text 
          className="text-gray-400 text-center text-sm"
          style={{ fontFamily: 'Poppins_400Regular' }}
        >
          Track progress • Approve payments • Stay informed
        </Text>
      </View>
    </View>
  );
}
