import { Pressable, Text, View } from 'react-native';
import { Link } from 'expo-router';
import {
  AUDIENCE_TABS,
  LANDING_ACCENT,
  LANDING_BORDER,
  LANDING_INK,
  LANDING_MUTED,
  LANDING_SURFACE,
  type AudienceTab,
} from '@/lib/home-landing-content';

type AudienceTabsProps = {
  selectedKey: AudienceTab['key'];
  onSelect: (key: AudienceTab['key']) => void;
};

export default function AudienceTabs({ selectedKey, onSelect }: AudienceTabsProps) {
  const activeTab = AUDIENCE_TABS.find((tab) => tab.key === selectedKey) ?? AUDIENCE_TABS[0];

  return (
    <View className="mt-8">
      <View className="flex-row flex-wrap mb-4 rounded-2xl p-1" style={{ backgroundColor: LANDING_SURFACE }}>
        {AUDIENCE_TABS.map((tab) => {
          const isActive = tab.key === selectedKey;
          return (
            <Pressable
              key={tab.key}
              onPress={() => onSelect(tab.key)}
              className="px-4 py-2.5 rounded-xl mr-2 mb-2"
              style={{
                backgroundColor: isActive ? LANDING_ACCENT : 'transparent',
              }}
              accessibilityRole="tab"
              accessibilityState={{ selected: isActive }}
            >
              <Text
                className="text-sm"
                style={{
                  fontFamily: isActive ? 'Poppins_700Bold' : 'Poppins_600SemiBold',
                  color: isActive ? '#FFFFFF' : LANDING_MUTED,
                }}
              >
                {tab.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <View className="rounded-2xl border bg-white p-4" style={{ borderColor: LANDING_BORDER }}>
        <Text className="text-base mb-2" style={{ fontFamily: 'Poppins_700Bold', color: LANDING_INK }}>
          {activeTab.title}
        </Text>
        <Text className="text-sm leading-6 mb-4" style={{ fontFamily: 'Poppins_400Regular', color: LANDING_MUTED }}>
          {activeTab.description}
        </Text>
        <Link href={activeTab.ctaHref as any} asChild>
          <Pressable
            className="self-start rounded-full px-4 py-2"
            style={{ backgroundColor: LANDING_ACCENT }}
            accessibilityRole="link"
          >
            <Text className="text-sm text-white" style={{ fontFamily: 'Poppins_700Bold' }}>
              {activeTab.ctaLabel}
            </Text>
          </Pressable>
        </Link>
      </View>
    </View>
  );
}
