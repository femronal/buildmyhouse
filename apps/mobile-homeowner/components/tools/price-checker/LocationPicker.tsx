import { useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { ConsumerLocation } from '@/lib/price-checker/types';
import { pc } from './theme';

type Props = {
  locations: ConsumerLocation[];
  onSelect: (key: string, label: string) => void;
  disabled?: boolean;
};

export function LocationPicker({ locations, onSelect, disabled }: Props) {
  const [query, setQuery] = useState('');
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = locations.filter((l) => l.type === 'city' || l.type === 'state' || l.type === 'local_area');
    if (!q) {
      // Prefer cities first for a short starting list.
      return list.filter((l) => l.type === 'city').slice(0, 24);
    }
    return list.filter((l) => l.label.toLowerCase().includes(q) || l.key.toLowerCase().includes(q)).slice(0, 40);
  }, [locations, query]);

  return (
    <View style={{ marginBottom: 12, width: '100%', maxWidth: '100%', overflow: 'hidden' }}>
      <TextInput
        value={query}
        onChangeText={setQuery}
        placeholder="Search Lagos, Abuja, Benin City…"
        placeholderTextColor="#64748b"
        editable={!disabled}
        accessibilityLabel="Search location"
        style={{
          marginBottom: 10,
          minHeight: 40,
          borderRadius: 12,
          borderWidth: 1,
          borderColor: 'rgba(255,255,255,0.1)',
          paddingHorizontal: 12,
          fontSize: 14,
          color: '#fff',
          backgroundColor: pc.charcoalDeep,
          fontFamily: 'Poppins_400Regular',
          width: '100%',
          maxWidth: '100%',
        }}
      />
      <ScrollView style={{ maxHeight: 160 }} nestedScrollEnabled keyboardShouldPersistTaps="handled">
        {filtered.map((loc) => (
          <Pressable
            key={loc.key}
            onPress={() => onSelect(loc.key, loc.label)}
            disabled={disabled}
            accessibilityRole="button"
            accessibilityLabel={loc.label}
            className="min-h-[44px] justify-center border-b border-white/5 py-3"
          >
            <Text className="text-sm text-white" style={{ fontFamily: 'Poppins_500Medium' }}>
              {loc.label}
            </Text>
            <Text className="text-xs text-slate-500" style={{ fontFamily: 'Poppins_400Regular' }}>
              {loc.type.replace('_', ' ')}
            </Text>
          </Pressable>
        ))}
        {filtered.length === 0 ? (
          <Text className="py-3 text-sm text-slate-500">No matching locations. Try a state or city name.</Text>
        ) : null}
      </ScrollView>
    </View>
  );
}
