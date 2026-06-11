import { Pressable, ScrollView, Text, View } from 'react-native';

export type UnderlineTabItem<K extends string = string> = { key: K; label: string };

export type ProjectTypeTabKey = 'repairs' | 'upgrades' | 'renovation' | 'full_builds';

const PROJECT_TABS: UnderlineTabItem<ProjectTypeTabKey>[] = [
  { key: 'repairs', label: 'Repairs' },
  { key: 'upgrades', label: 'Upgrades' },
  { key: 'renovation', label: 'Renovation' },
  { key: 'full_builds', label: 'Full Builds' },
];

type ProjectTypeTabsProps<K extends string> = {
  /** Defaults to the four project-type tabs. */
  tabs?: UnderlineTabItem<K>[];
  activeTab: K;
  onSelect: (key: K) => void;
  /** Render inside a horizontal scroller (for long tab sets). */
  scrollable?: boolean;
  /** White-on-dark variant for dark pages. */
  dark?: boolean;
};

/** Editorial text tabs with an underline on the active item (template style). */
export default function ProjectTypeTabs<K extends string = ProjectTypeTabKey>({
  tabs = PROJECT_TABS as unknown as UnderlineTabItem<K>[],
  activeTab,
  onSelect,
  scrollable,
  dark,
}: ProjectTypeTabsProps<K>) {
  const activeColor = dark ? '#ffffff' : '#000000';
  const inactiveColor = dark ? '#4f4f4f' : '#c4c4c4';
  const rowBorderClass = dark ? 'border-white/10' : 'border-gray-100';

  const items = tabs.map((tab) => {
    const active = tab.key === activeTab;
    return (
      <Pressable
        key={tab.key}
        onPress={() => onSelect(tab.key)}
        accessibilityRole="tab"
        accessibilityState={{ selected: active }}
        className="pb-1.5"
        style={
          active
            ? { borderBottomWidth: 2, borderBottomColor: activeColor, marginBottom: -1 }
            : undefined
        }
      >
        <Text
          className="text-sm md:text-lg"
          style={{
            fontFamily: active ? 'Poppins_600SemiBold' : 'Poppins_400Regular',
            color: active ? activeColor : inactiveColor,
          }}
        >
          {tab.label}
        </Text>
      </Pressable>
    );
  });

  if (scrollable) {
    return (
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        className="self-end max-w-full md:mr-12"
        style={{ flexGrow: 0 }}
      >
        <View className={`flex-row items-end border-b ${rowBorderClass}`} style={{ columnGap: 18 }}>
          {items}
        </View>
      </ScrollView>
    );
  }

  return (
    <View
      className={`flex-row items-end border-b ${rowBorderClass} self-end max-w-full md:mr-12`}
      style={{ columnGap: 18 }}
    >
      {items}
    </View>
  );
}
