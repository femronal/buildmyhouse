import type { ReactNode } from 'react';
import { Link } from 'expo-router';
import { Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { X } from 'lucide-react-native';
import { LANDING_BORDER, LANDING_INK, LANDING_MUTED } from '@/lib/home-landing-content';

const INK = LANDING_INK;
const MUTED = LANDING_MUTED;
const LINE = LANDING_BORDER;

export type DirectoryChip = {
  key: string;
  label: string;
  active: boolean;
  href: string;
  onPress?: () => void;
};

export type DirectoryFilterSection = {
  id: string;
  title: string;
  hint?: string;
  chips: DirectoryChip[];
};

export function DirectoryChipButton({
  chip,
  flush = false,
}: {
  chip: DirectoryChip;
  flush?: boolean;
}) {
  const style = {
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginRight: 8,
    marginBottom: flush ? 0 : 8,
    borderWidth: 1,
    borderColor: chip.active ? INK : LINE,
    backgroundColor: chip.active ? INK : '#fff',
  } as const;
  const label = (
    <Text style={{ fontFamily: 'Poppins_600SemiBold', fontSize: 13, color: chip.active ? '#fff' : INK }}>
      {chip.label}
    </Text>
  );
  if (chip.onPress) {
    return (
      <Pressable accessibilityRole="button" accessibilityState={{ selected: chip.active }} onPress={chip.onPress} style={style}>
        {label}
      </Pressable>
    );
  }
  return (
    <Link href={chip.href as any} asChild>
      <Pressable accessibilityRole="link" accessibilityState={{ selected: chip.active }} style={style}>
        {label}
      </Pressable>
    </Link>
  );
}

export function DirectoryFilterSheet({
  visible,
  onClose,
  sections,
  clearHref,
  onClear,
  resultLabel,
  wide,
  bottomInset,
  children,
}: {
  visible: boolean;
  onClose: () => void;
  sections: DirectoryFilterSection[];
  clearHref?: string;
  onClear?: () => void;
  resultLabel: string;
  wide: boolean;
  bottomInset: number;
  children?: ReactNode;
}) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={{ flex: 1, justifyContent: wide ? 'center' : 'flex-end', backgroundColor: 'rgba(0,0,0,0.45)' }}>
        <Pressable accessibilityLabel="Close filters" onPress={onClose} style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 }} />
        <View
          style={{
            backgroundColor: '#fff',
            maxHeight: wide ? '80%' : '88%',
            width: wide ? 520 : '100%',
            alignSelf: wide ? 'center' : 'stretch',
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
            borderBottomLeftRadius: wide ? 20 : 0,
            borderBottomRightRadius: wide ? 20 : 0,
            paddingBottom: Math.max(bottomInset, 16),
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8 }}>
            <Text style={{ fontFamily: 'Poppins_700Bold', fontSize: 18, color: INK }}>Filters</Text>
            <Pressable onPress={onClose} accessibilityLabel="Close filters" hitSlop={8}>
              <X size={20} color={INK} />
            </Pressable>
          </View>
          <ScrollView style={{ flexShrink: 1, paddingHorizontal: 20 }} keyboardShouldPersistTaps="handled">
            {children}
            {sections.map((section) => (
              <View key={section.id} style={{ marginBottom: 16 }}>
                <Text style={{ fontFamily: 'Poppins_600SemiBold', fontSize: 14, color: INK, marginBottom: 4 }}>{section.title}</Text>
                {section.hint ? (
                  <Text style={{ fontFamily: 'Poppins_400Regular', fontSize: 12, color: MUTED, marginBottom: 8 }}>{section.hint}</Text>
                ) : null}
                <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                  {section.chips.map((chip) => (
                    <DirectoryChipButton key={chip.key} chip={chip} />
                  ))}
                </View>
              </View>
            ))}
          </ScrollView>
          <View style={{ flexDirection: 'row', paddingHorizontal: 20, paddingTop: 8 }}>
            {clearHref ? (
              <Link href={clearHref as any} asChild>
                <Pressable onPress={onClose} accessibilityRole="link" style={{ borderWidth: 1, borderColor: LINE, borderRadius: 999, paddingHorizontal: 16, paddingVertical: 12, marginRight: 8 }}>
                  <Text style={{ fontFamily: 'Poppins_600SemiBold', fontSize: 14, color: INK }}>Clear</Text>
                </Pressable>
              </Link>
            ) : (
              <Pressable
                onPress={() => {
                  onClear?.();
                  onClose();
                }}
                accessibilityRole="button"
                style={{ borderWidth: 1, borderColor: LINE, borderRadius: 999, paddingHorizontal: 16, paddingVertical: 12, marginRight: 8 }}
              >
                <Text style={{ fontFamily: 'Poppins_600SemiBold', fontSize: 14, color: INK }}>Clear</Text>
              </Pressable>
            )}
            <Pressable onPress={onClose} accessibilityRole="button" style={{ flex: 1, backgroundColor: INK, borderRadius: 999, paddingVertical: 12, alignItems: 'center' }}>
              <Text style={{ fontFamily: 'Poppins_700Bold', fontSize: 14, color: '#fff' }}>{resultLabel}</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}
