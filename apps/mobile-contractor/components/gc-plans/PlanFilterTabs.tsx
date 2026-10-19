import { ScrollView, Text, TouchableOpacity, View } from 'react-native';

const TABS = [
  { key: 'all', label: 'All' },
  { key: 'live', label: 'Live' },
  { key: 'pending', label: 'Pending review' },
  { key: 'rejected', label: 'Rejected' },
  { key: 'draft', label: 'Draft' },
] as const;

export function PlanFilterTabs({
  selected,
  counts,
  onSelect,
}: {
  selected: string;
  counts: Record<string, number>;
  onSelect: (key: (typeof TABS)[number]['key']) => void;
}) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4" contentContainerStyle={{ gap: 16 }}>
      {TABS.map((tab) => {
        const active = selected === tab.key;
        const count = tab.key === 'all' ? counts.all : counts[tab.key] || 0;
        return (
          <TouchableOpacity key={tab.key} onPress={() => onSelect(tab.key)} className="pb-2">
            <Text
              style={{
                fontFamily: active ? 'Poppins_600SemiBold' : 'Poppins_400Regular',
                fontSize: 14,
                color: active ? '#111111' : '#6B7280',
              }}
            >
              {tab.label} {count}
            </Text>
            {active ? <View style={{ height: 2, backgroundColor: '#111111', marginTop: 6 }} /> : null}
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}
