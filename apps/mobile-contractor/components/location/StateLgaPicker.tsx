import { useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { NIGERIA_STATES, areasForState } from '@/lib/nigeria-lgas';

type Props = {
  stateValue: string;
  lgaValue: string;
  onState: (state: string) => void;
  onLga: (lga: string) => void;
  dark?: boolean;
};

export function StateLgaPicker({ stateValue, lgaValue, onState, onLga, dark = true }: Props) {
  const [stateQuery, setStateQuery] = useState('');
  const text = dark ? '#fff' : '#111';
  const muted = dark ? '#9CA3AF' : '#6B7280';
  const border = dark ? '#1E3A5F' : '#E5E5E5';
  const chipBg = dark ? '#0A1628' : '#fff';
  const chipActive = dark ? '#fff' : '#111';
  const chipActiveText = dark ? '#0A1628' : '#fff';

  const states = useMemo(() => {
    const q = stateQuery.trim().toLowerCase();
    return NIGERIA_STATES.filter((state) => !q || state.toLowerCase().includes(q));
  }, [stateQuery]);

  const areas = stateValue ? areasForState(stateValue) : [];

  return (
    <View style={{ marginBottom: 12 }}>
      <Text style={{ fontFamily: 'Poppins_500Medium', fontSize: 14, color: muted, marginBottom: 6 }}>
        State where you work
      </Text>
      <TextInput
        value={stateQuery}
        onChangeText={setStateQuery}
        placeholder="Search states"
        placeholderTextColor={muted}
        style={{
          borderWidth: 1,
          borderColor: border,
          borderRadius: 12,
          paddingHorizontal: 12,
          paddingVertical: 10,
          fontFamily: 'Poppins_400Regular',
          color: text,
          marginBottom: 8,
          backgroundColor: chipBg,
        }}
      />
      <ScrollView style={{ maxHeight: 140 }} nestedScrollEnabled>
        {states.map((state) => (
          <Pressable
            key={state}
            onPress={() => {
              onState(state);
              onLga('');
              setStateQuery('');
            }}
            style={{ paddingVertical: 8 }}
          >
            <Text
              style={{
                fontFamily: stateValue === state ? 'Poppins_600SemiBold' : 'Poppins_400Regular',
                color: text,
              }}
            >
              {state}
            </Text>
          </Pressable>
        ))}
      </ScrollView>
      {stateValue ? (
        <View style={{ marginTop: 12 }}>
          <Text style={{ fontFamily: 'Poppins_500Medium', fontSize: 14, color: muted, marginBottom: 8 }}>
            Area (LGA) — {stateValue}
          </Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
            {areas.map((area) => {
              const active = lgaValue === area;
              return (
                <Pressable
                  key={area}
                  onPress={() => onLga(area)}
                  style={{
                    borderRadius: 999,
                    paddingHorizontal: 12,
                    paddingVertical: 8,
                    marginRight: 8,
                    marginBottom: 8,
                    borderWidth: 1,
                    borderColor: active ? chipActive : border,
                    backgroundColor: active ? chipActive : chipBg,
                  }}
                >
                  <Text
                    style={{
                      fontFamily: 'Poppins_600SemiBold',
                      fontSize: 12,
                      color: active ? chipActiveText : text,
                    }}
                  >
                    {area}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      ) : null}
    </View>
  );
}
