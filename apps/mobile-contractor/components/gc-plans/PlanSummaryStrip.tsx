import { View, Text, TouchableOpacity } from 'react-native';
import type { PlanListStatus } from './plan-status';

const ITEMS: { key: Exclude<PlanListStatus, 'hidden'>; label: string }[] = [
  { key: 'live', label: 'Live' },
  { key: 'pending', label: 'Pending review' },
  { key: 'rejected', label: 'Rejected' },
  { key: 'draft', label: 'Draft' },
];

export function PlanSummaryStrip({
  counts,
  onSelect,
}: {
  counts: Record<string, number>;
  onSelect: (key: Exclude<PlanListStatus, 'hidden'>) => void;
}) {
  return (
    <View className="flex-row mb-4" style={{ gap: 8 }}>
      {ITEMS.map((item) => (
        <TouchableOpacity
          key={item.key}
          onPress={() => onSelect(item.key)}
          className="flex-1 rounded-xl px-2 py-3"
          style={{ backgroundColor: '#1E3A5F', borderWidth: 1, borderColor: '#1E40AF66' }}
        >
          <Text className="text-white text-center text-base" style={{ fontFamily: 'Poppins_700Bold' }}>
            {counts[item.key] || 0}
          </Text>
          <Text className="text-blue-200/70 text-center mt-1" style={{ fontFamily: 'Poppins_400Regular', fontSize: 12 }}>
            {item.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}
