import { useEffect, useMemo, useState } from 'react';
import {
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { CaretDown, Check, MagnifyingGlass } from 'phosphor-react-native';
import { NIGERIA_STATES, type NigeriaState } from '@/lib/nigeria-location';

type NigeriaStateDropdownProps = {
  value: NigeriaState;
  onChange: (state: NigeriaState) => void;
  disabled?: boolean;
};

/**
 * Branded state picker — black/white glass matching the location globe card.
 */
export default function NigeriaStateDropdown({
  value,
  onChange,
  disabled = false,
}: NigeriaStateDropdownProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [...NIGERIA_STATES];
    return NIGERIA_STATES.filter((state) => state.toLowerCase().includes(q));
  }, [query]);

  useEffect(() => {
    if (!open) setQuery('');
  }, [open]);

  const select = (state: NigeriaState) => {
    onChange(state);
    setOpen(false);
  };

  const list = (
    <View className="rounded-2xl border border-white/15 bg-[#0a0a0a] overflow-hidden">
      <View className="px-3.5 pt-3 pb-2 border-b border-white/10">
        <Text
          className="text-white/40 text-[10px] uppercase mb-2"
          style={{ fontFamily: 'Poppins_500Medium', letterSpacing: 2 }}
        >
          All Nigerian states
        </Text>
        <View className="flex-row items-center h-10 rounded-xl border border-white/12 bg-white/5 px-3">
          <MagnifyingGlass size={14} color="rgba(255,255,255,0.4)" weight="regular" />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search state"
            placeholderTextColor="rgba(255,255,255,0.35)"
            className="flex-1 ml-2 text-sm text-white"
            style={{ fontFamily: 'Poppins_400Regular', outlineStyle: 'none' } as any}
            autoFocus={Platform.OS === 'web'}
          />
        </View>
      </View>
      <ScrollView
        keyboardShouldPersistTaps="handled"
        nestedScrollEnabled
        style={{ maxHeight: Platform.OS === 'web' ? 260 : 320 }}
      >
        {filtered.length === 0 ? (
          <View className="px-4 py-6">
            <Text className="text-white/45 text-sm text-center" style={{ fontFamily: 'Poppins_500Medium' }}>
              No matching state
            </Text>
          </View>
        ) : (
          filtered.map((state) => {
            const active = state === value;
            return (
              <Pressable
                key={state}
                onPress={() => select(state)}
                className={`px-4 py-3 flex-row items-center justify-between border-b border-white/[0.06] ${
                  active ? 'bg-white/10' : ''
                }`}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
              >
                <Text
                  className={`text-sm ${active ? 'text-white' : 'text-white/75'}`}
                  style={{ fontFamily: active ? 'Poppins_600SemiBold' : 'Poppins_500Medium' }}
                >
                  {state}
                </Text>
                {active ? <Check size={16} color="#ffffff" weight="bold" /> : null}
              </Pressable>
            );
          })
        )}
      </ScrollView>
    </View>
  );

  return (
    <View className="relative z-30">
      <Pressable
        onPress={() => !disabled && setOpen((prev) => !prev)}
        disabled={disabled}
        accessibilityRole="button"
        accessibilityLabel={`State: ${value}. Choose Nigerian state`}
        accessibilityState={{ expanded: open, disabled }}
        className={`h-12 min-w-[108px] px-3.5 rounded-xl border flex-row items-center justify-center gap-1.5 ${
          open ? 'border-white/40 bg-white/10' : 'border-white/15 bg-white/5'
        } ${disabled ? 'opacity-50' : ''}`}
      >
        <Text className="text-sm text-white" style={{ fontFamily: 'Poppins_500Medium' }} numberOfLines={1}>
          {value}
        </Text>
        <CaretDown size={14} color="rgba(255,255,255,0.65)" weight="bold" />
      </Pressable>

      {Platform.OS === 'web' && open ? (
        <>
          <Pressable
            style={{ position: 'fixed', inset: 0, zIndex: 40 } as any}
            onPress={() => setOpen(false)}
          />
          <View className="absolute top-[52px] right-0 z-50 w-[260px]">{list}</View>
        </>
      ) : null}

      {Platform.OS !== 'web' ? (
        <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
          <Pressable className="flex-1 bg-black/70 justify-end" onPress={() => setOpen(false)}>
            <Pressable onPress={(e) => e.stopPropagation()} className="px-4 pb-8 pt-2">
              <View className="w-10 h-1 rounded-full bg-white/25 self-center mb-3" />
              {list}
            </Pressable>
          </Pressable>
        </Modal>
      ) : null}
    </View>
  );
}
