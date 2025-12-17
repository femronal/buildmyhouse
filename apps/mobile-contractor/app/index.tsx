import { View, Text, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { HardHat } from "lucide-react-native";

export default function ContractorStartScreen() {
  const router = useRouter();

  return (
    <View className="flex-1 bg-[#0A1628] justify-center items-center px-8">
      <HardHat size={64} color="#3B82F6" strokeWidth={2} />
      <Text 
        className="text-4xl text-white mt-6 mb-4 text-center"
        style={{ fontFamily: 'Poppins_800ExtraBold' }}
      >
        BuildMyHouse
      </Text>
      <Text 
        className="text-lg text-blue-400 mb-12 text-center"
        style={{ fontFamily: 'Poppins_600SemiBold' }}
      >
        Contractor & Vendor Portal
      </Text>
      
      <TouchableOpacity
        onPress={() => router.push('/contractor')}
        className="bg-blue-600 rounded-full py-5 px-8 w-full max-w-sm"
      >
        <Text 
          className="text-white text-lg text-center"
          style={{ fontFamily: 'Poppins_700Bold' }}
        >
          Get Started
        </Text>
      </TouchableOpacity>
    </View>
  );
}
