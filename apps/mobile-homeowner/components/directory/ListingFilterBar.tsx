import { useState } from 'react';
import { Pressable, ScrollView, Text, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SlidersHorizontal } from 'lucide-react-native';
import { DirectoryFilterSheet, type DirectoryChip, type DirectoryFilterSection } from '@/components/directory/DirectoryFilterSheet';
import { DirectoryStateLgaFilter } from '@/components/directory/DirectoryStateLgaFilter';
import { areasForState as areasForStateFromMap } from '@/lib/nigeria-lgas';

export function areasForState(state: string) {
  return areasForStateFromMap(state);
}

type Option = { label: string; value: string; count: number };

export function ListingFilterBar({
  quick,
  serviceTitle,
  serviceOptions,
  serviceValue,
  onService,
  stateValue,
  onState,
  areaValue,
  onArea,
  extraSections = [],
  activeCount,
  resultCount,
  noun,
  onClear,
}: {
  quick: Option[];
  serviceTitle: string;
  serviceOptions: Option[];
  serviceValue: string;
  onService: (value: string) => void;
  stateValue: string;
  onState: (value: string) => void;
  areaValue: string;
  onArea: (value: string) => void;
  extraSections?: DirectoryFilterSection[];
  activeCount: number;
  resultCount: number;
  noun: string;
  onClear: () => void;
}) {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const [open, setOpen] = useState(false);
  const visibleServices = serviceOptions.filter((item) => item.count > 0 || item.value === serviceValue);
  const serviceChips: DirectoryChip[] = visibleServices.map((item) => ({
    key: item.value,
    label: item.label,
    active: serviceValue === item.value,
    href: '',
    onPress: () => onService(item.value),
  }));
  const sections: DirectoryFilterSection[] = [
    { id: 'service', title: serviceTitle, chips: serviceChips },
    ...extraSections,
  ];
  const showLabel = `Show ${resultCount.toLocaleString('en-US')} ${resultCount === 1 ? noun : `${noun}s`}`;

  return (
    <View style={{ marginTop: 0, marginBottom: 8, paddingTop: 0 }}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{ flexGrow: 0 }}
        contentContainerStyle={{ alignItems: 'center', paddingRight: 8, paddingTop: 4, paddingBottom: 4, gap: 10 }}
      >
        <Pressable
          onPress={() => setOpen(true)}
          accessibilityRole="button"
          accessibilityLabel="Open filters"
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            borderRadius: 999,
            paddingHorizontal: 14,
            paddingVertical: 8,
            marginRight: 0,
            backgroundColor: activeCount > 0 ? '#fff' : 'transparent',
            borderWidth: 1,
            borderColor: '#fff',
          }}
        >
          <SlidersHorizontal size={14} color={activeCount > 0 ? '#111' : '#fff'} />
          <Text style={{ marginLeft: 6, fontFamily: 'Poppins_600SemiBold', fontSize: 13, color: activeCount > 0 ? '#111' : '#fff' }}>
            Filters{activeCount > 0 ? ` ${activeCount}` : ''}
          </Text>
        </Pressable>
        {quick.slice(0, 6).map((item) => (
          <Pressable
            key={item.value}
            onPress={() => onService(serviceValue === item.value ? 'All' : item.value)}
            style={{
              borderRadius: 999,
              paddingHorizontal: 14,
              paddingVertical: 8,
              marginRight: 0,
              backgroundColor: serviceValue === item.value ? '#fff' : 'rgba(255,255,255,0.08)',
            }}
          >
            <Text style={{ fontFamily: 'Poppins_600SemiBold', fontSize: 13, color: serviceValue === item.value ? '#111' : '#fff' }}>{item.label}</Text>
          </Pressable>
        ))}
      </ScrollView>
      <DirectoryFilterSheet
        visible={open}
        onClose={() => setOpen(false)}
        sections={sections}
        onClear={onClear}
        resultLabel={showLabel}
        wide={width >= 768}
        bottomInset={insets.bottom}
      >
        <DirectoryStateLgaFilter stateValue={stateValue} areaValue={areaValue} onState={onState} onArea={onArea} />
      </DirectoryFilterSheet>
    </View>
  );
}
