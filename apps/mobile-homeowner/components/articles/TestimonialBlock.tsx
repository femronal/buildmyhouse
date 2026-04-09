import { Text, View } from 'react-native';
import { Quote } from 'lucide-react-native';
import { cardShadowStyle } from '@/lib/card-styles';

export default function TestimonialBlock() {
  return (
    <View
      style={cardShadowStyle}
      className="bg-white border border-gray-200 rounded-2xl p-5 mb-8 max-w-[680px] self-center w-full"
    >
      <View className="flex-row items-center mb-3">
        <View className="w-10 h-10 rounded-full bg-gray-100 items-center justify-center mr-3">
          <Quote size={20} color="#374151" strokeWidth={2} />
        </View>
        <View>
          <Text className="text-gray-900 text-sm" style={{ fontFamily: 'Poppins_600SemiBold' }}>
            Social proof
          </Text>
          <Text className="text-gray-500 text-xs" style={{ fontFamily: 'Poppins_400Regular' }}>
            Homeowners & families using BuildMyHouse
          </Text>
        </View>
      </View>
      <Text className="text-gray-800 text-[16px] leading-7 mb-3" style={{ fontFamily: 'Poppins_500Medium' }}>
        &ldquo;We needed visibility from abroad. Milestone updates and a single accountable contractor changed how
        confident we felt wiring each stage payment.&rdquo;
      </Text>
      <Text className="text-gray-500 text-xs" style={{ fontFamily: 'Poppins_400Regular' }}>
        — BuildMyHouse homeowner (Lagos project, 2025)
      </Text>
    </View>
  );
}
