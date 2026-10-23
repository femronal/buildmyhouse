import { useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { NIGERIA_STATES, areasForState } from '@/lib/nigeria-lgas';

function pill(active: boolean, label: string, onPress: () => void) {
  return (
    <Pressable
      key={label}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      style={{
        borderRadius: 999,
        paddingHorizontal: 14,
        paddingVertical: 8,
        marginRight: 8,
        marginBottom: 8,
        borderWidth: 1,
        borderColor: active ? '#111' : '#E5E5E5',
        backgroundColor: active ? '#111' : '#fff',
      }}
    >
      <Text style={{ fontFamily: 'Poppins_600SemiBold', fontSize: 13, color: active ? '#fff' : '#111' }}>{label}</Text>
    </Pressable>
  );
}

/** Same state search and LGA list used on project plans and opportunities. */
export function DirectoryStateLgaFilter({
  stateValue,
  areaValue,
  onState,
  onArea,
}: {
  stateValue: string;
  areaValue: string;
  onState: (value: string) => void;
  onArea: (value: string) => void;
}) {
  const [stateQuery, setStateQuery] = useState('');
  const states = useMemo(() => {
    const q = stateQuery.trim().toLowerCase();
    return NIGERIA_STATES.filter((state) => !q || state.toLowerCase().includes(q));
  }, [stateQuery]);
  const areas = stateValue !== 'All' ? areasForState(stateValue).filter(Boolean) : [];

  return (
    <View style={{ marginBottom: 16 }}>
      <Text style={{ fontFamily: 'Poppins_600SemiBold', fontSize: 14, color: '#111', marginBottom: 8 }}>Location</Text>
      <TextInput
        value={stateQuery}
        onChangeText={setStateQuery}
        placeholder="Search states"
        placeholderTextColor="#9CA3AF"
        style={{
          borderWidth: 1,
          borderColor: '#E5E5E5',
          borderRadius: 12,
          paddingHorizontal: 12,
          paddingVertical: 10,
          fontFamily: 'Poppins_400Regular',
          marginBottom: 8,
        }}
      />
      <ScrollView style={{ maxHeight: 160 }} nestedScrollEnabled keyboardShouldPersistTaps="handled">
        <Pressable onPress={() => onState('All')} accessibilityRole="button" style={{ paddingVertical: 8 }}>
          <Text style={{ fontFamily: stateValue === 'All' ? 'Poppins_600SemiBold' : 'Poppins_400Regular', color: '#111' }}>
            All states
          </Text>
        </Pressable>
        {states.map((state) => (
          <Pressable key={state} onPress={() => onState(state)} accessibilityRole="button" style={{ paddingVertical: 8 }}>
            <Text style={{ fontFamily: stateValue === state ? 'Poppins_600SemiBold' : 'Poppins_400Regular', color: '#111' }}>
              {state}
            </Text>
          </Pressable>
        ))}
      </ScrollView>
      {stateValue !== 'All' && areas.length > 0 ? (
        <View style={{ marginTop: 12 }}>
          <Text style={{ fontFamily: 'Poppins_600SemiBold', fontSize: 14, color: '#111', marginBottom: 8 }}>{stateValue}</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
            {pill(areaValue === 'All', 'All areas', () => onArea('All'))}
            {areas.map((area) => pill(areaValue === area, area, () => onArea(area)))}
          </View>
        </View>
      ) : null}
    </View>
  );
}
