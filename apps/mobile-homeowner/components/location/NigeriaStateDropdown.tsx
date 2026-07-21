import { useEffect, useMemo, useState } from 'react';
import {
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from 'react-native';
import { CaretDown, Check, MagnifyingGlass, X } from 'phosphor-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NIGERIA_STATES, type NigeriaState } from '@/lib/nigeria-location';

type NigeriaStateDropdownProps = {
  value: NigeriaState;
  onChange: (state: NigeriaState) => void;
  disabled?: boolean;
};

/**
 * Branded state picker — opens a centered in-app modal (search + scroll + close).
 */
export default function NigeriaStateDropdown({
  value,
  onChange,
  disabled = false,
}: NigeriaStateDropdownProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [...NIGERIA_STATES];
    return NIGERIA_STATES.filter((state) => state.toLowerCase().includes(q));
  }, [query]);

  useEffect(() => {
    if (!open) setQuery('');
  }, [open]);

  useEffect(() => {
    if (!open || Platform.OS !== 'web' || typeof window === 'undefined') return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        setOpen(false);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open]);

  const select = (state: NigeriaState) => {
    onChange(state);
    setOpen(false);
  };

  const close = () => setOpen(false);

  const isCompact = width < 420;
  const panelWidth = Math.min(width - 32, 420);
  const listMaxHeight = Math.min(Math.max(280, height * 0.52), 440);

  return (
    <>
      <Pressable
        onPress={() => !disabled && setOpen(true)}
        disabled={disabled}
        accessibilityRole="button"
        accessibilityLabel={`State: ${value}. Choose Nigerian state`}
        accessibilityState={{ expanded: open, disabled }}
        className={`h-12 shrink-0 px-3 rounded-xl border flex-row items-center justify-center gap-1 ${
          open ? 'border-white/40 bg-white/10' : 'border-white/15 bg-white/5'
        } ${disabled ? 'opacity-50' : ''}`}
        style={{ maxWidth: isCompact ? 112 : 132 }}
      >
        <Text
          className="text-sm text-white"
          style={{ fontFamily: 'Poppins_500Medium', flexShrink: 1 }}
          numberOfLines={1}
        >
          {value}
        </Text>
        <CaretDown size={14} color="rgba(255,255,255,0.65)" weight="bold" />
      </Pressable>

      <Modal
        visible={open}
        transparent
        animationType="fade"
        onRequestClose={close}
        statusBarTranslucent
      >
        <View
          className="flex-1 items-center justify-center"
          style={{
            backgroundColor: 'rgba(0,0,0,0.82)',
            paddingTop: Math.max(16, insets.top + 8),
            paddingBottom: Math.max(16, insets.bottom + 8),
            paddingHorizontal: 16,
          }}
        >
          {/* Dismiss backdrop */}
          <Pressable
            accessibilityLabel="Dismiss state picker"
            onPress={close}
            style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 }}
          />

          <View
            className="overflow-hidden border border-white/15 bg-[#0a0a0a]"
            style={{
              width: panelWidth,
              maxHeight: height - Math.max(32, insets.top + insets.bottom + 32),
              borderRadius: 24,
              zIndex: 2,
              ...(Platform.OS === 'web'
                ? ({ boxShadow: '0 24px 80px rgba(0,0,0,0.65)' } as any)
                : {
                    shadowColor: '#000',
                    shadowOpacity: 0.45,
                    shadowRadius: 28,
                    shadowOffset: { width: 0, height: 16 },
                    elevation: 24,
                  }),
            }}
          >
            {/* Header */}
            <View className="px-5 pt-5 pb-4 border-b border-white/10 flex-row items-start justify-between gap-3">
              <View className="flex-1 pr-2">
                <Text
                  className="text-white/40 text-[10px] uppercase mb-1.5"
                  style={{ fontFamily: 'Poppins_500Medium', letterSpacing: 2.2 }}
                >
                  Project location
                </Text>
                <Text
                  className="text-white text-xl leading-7"
                  style={{ fontFamily: 'Poppins_600SemiBold' }}
                >
                  Choose your state
                </Text>
                <Text
                  className="text-white/45 text-xs mt-1.5 leading-4"
                  style={{ fontFamily: 'Poppins_400Regular' }}
                >
                  All 36 states and FCT across Nigeria
                </Text>
              </View>
              <Pressable
                onPress={close}
                accessibilityRole="button"
                accessibilityLabel="Close"
                className="w-10 h-10 rounded-full border border-white/15 bg-white/5 items-center justify-center"
                hitSlop={8}
              >
                <X size={18} color="#ffffff" weight="bold" />
              </Pressable>
            </View>

            {/* Search */}
            <View className="px-5 pt-4 pb-3">
              <View className="flex-row items-center h-12 rounded-xl border border-white/15 bg-white/[0.04] px-3.5">
                <MagnifyingGlass size={16} color="rgba(255,255,255,0.45)" weight="regular" />
                <TextInput
                  value={query}
                  onChangeText={setQuery}
                  placeholder="Search state"
                  placeholderTextColor="rgba(255,255,255,0.35)"
                  className="flex-1 ml-2.5 text-sm text-white"
                  style={
                    {
                      fontFamily: 'Poppins_400Regular',
                      outlineStyle: 'none',
                      minWidth: 0,
                    } as any
                  }
                  autoFocus={Platform.OS === 'web'}
                  returnKeyType="search"
                  clearButtonMode="while-editing"
                />
                {query.length > 0 ? (
                  <Pressable onPress={() => setQuery('')} hitSlop={8} accessibilityLabel="Clear search">
                    <X size={14} color="rgba(255,255,255,0.45)" weight="bold" />
                  </Pressable>
                ) : null}
              </View>
            </View>

            {/* State list */}
            <ScrollView
              keyboardShouldPersistTaps="handled"
              nestedScrollEnabled
              style={{ maxHeight: listMaxHeight }}
              contentContainerStyle={{ paddingBottom: 8 }}
            >
              {filtered.length === 0 ? (
                <View className="px-5 py-10">
                  <Text
                    className="text-white/45 text-sm text-center"
                    style={{ fontFamily: 'Poppins_500Medium' }}
                  >
                    No matching state
                  </Text>
                </View>
              ) : (
                filtered.map((state, index) => {
                  const active = state === value;
                  const isLast = index === filtered.length - 1;
                  return (
                    <Pressable
                      key={state}
                      onPress={() => select(state)}
                      className={`mx-3 px-4 py-3.5 flex-row items-center justify-between ${
                        active ? 'bg-white/10 rounded-xl' : ''
                      } ${!active && !isLast ? 'border-b border-white/[0.06]' : ''}`}
                      accessibilityRole="button"
                      accessibilityState={{ selected: active }}
                    >
                      <Text
                        className={`text-[15px] ${active ? 'text-white' : 'text-white/80'}`}
                        style={{
                          fontFamily: active ? 'Poppins_600SemiBold' : 'Poppins_500Medium',
                        }}
                      >
                        {state}
                      </Text>
                      {active ? <Check size={18} color="#ffffff" weight="bold" /> : null}
                    </Pressable>
                  );
                })
              )}
            </ScrollView>

            <View className="px-5 py-3.5 border-t border-white/10">
              <Text
                className="text-white/35 text-[11px] text-center"
                style={{ fontFamily: 'Poppins_400Regular' }}
              >
                Tap a state to select · ✕ to cancel
              </Text>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}
