import { View, Text, TouchableOpacity } from 'react-native';
import { Info, X } from 'lucide-react-native';

export function AboutPlansBox({ onDismiss }: { onDismiss: () => void }) {
  return (
    <View
      className="rounded-xl p-4 mb-4 flex-row"
      style={{ backgroundColor: '#1E3A5F', borderWidth: 1, borderColor: '#1E40AF66' }}
    >
      <Info size={18} color="#93C5FD" strokeWidth={2} />
      <View className="flex-1 mx-3">
        <Text className="text-white text-sm mb-1" style={{ fontFamily: 'Poppins_600SemiBold' }}>
          About your project plans
        </Text>
        <Text className="text-blue-100/80" style={{ fontFamily: 'Poppins_400Regular', fontSize: 13, lineHeight: 20 }}>
          Upload the jobs you do best, with clear stages, a price and photos. Homeowners in Nigeria and abroad browse these plans and tap Work with this contractor to request you. You agree the scope with the homeowner, the homeowner pays before work starts, and you upload photo evidence at each stage. The homeowner approves each stage in the app, so every finished job builds your track record on BuildMyHouse.
        </Text>
      </View>
      <TouchableOpacity onPress={onDismiss} accessibilityLabel="Dismiss about your project plans">
        <X size={18} color="#93C5FD" strokeWidth={2} />
      </TouchableOpacity>
    </View>
  );
}
