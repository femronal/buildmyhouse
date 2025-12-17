import { View, Text, TouchableOpacity, ImageBackground } from "react-native";
import { useRouter } from "expo-router";
import { Home, Upload, User, Bell } from "lucide-react-native";

export default function StartScreen() {
  const router = useRouter();

  return (
    <View className="flex-1 bg-white">
      {/* Header */}
      <View className="pt-16 px-6 pb-4 flex-row items-center justify-between">
        <TouchableOpacity 
          onPress={() => router.push('/profile')}
          className="w-12 h-12 bg-black rounded-full items-center justify-center"
        >
          <User size={24} color="#FFFFFF" strokeWidth={2} />
        </TouchableOpacity>
        
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
