import { Pressable, Text, View } from 'react-native';
import { LANDING_BORDER, LANDING_INK, LANDING_MUTED } from '@/lib/home-landing-content';

export const CHOOSE_CATEGORY_LABEL = 'Choose a category';

type CategoryOption = { slug: string; label: string };

export function VendorCategoryField({
  value,
  options,
  onChange,
}: {
  value: string;
  options: CategoryOption[];
  onChange: (slug: string) => void;
}) {
  return (
    <View className="mb-3">
      <Text className="text-xs mb-2" style={{ fontFamily: 'Poppins_500Medium', color: LANDING_MUTED }}>
        Category
      </Text>
      <Pressable
        onPress={() => onChange('')}
        accessibilityRole="button"
        accessibilityLabel={CHOOSE_CATEGORY_LABEL}
        accessibilityState={{ selected: value === '' }}
        className="rounded-xl border px-3 py-2.5 mb-2"
        style={{ borderColor: value === '' ? '#000' : LANDING_BORDER, backgroundColor: value === '' ? '#F3F4F6' : '#fff' }}
      >
        <Text style={{ fontFamily: 'Poppins_500Medium', color: value === '' ? LANDING_INK : LANDING_MUTED }}>
          {CHOOSE_CATEGORY_LABEL}
        </Text>
      </Pressable>
      <View className="flex-row flex-wrap">
        {options.map((option) => {
          const selected = value === option.slug;
          return (
            <Pressable
              key={option.slug}
              onPress={() => onChange(option.slug)}
              accessibilityRole="button"
              accessibilityLabel={option.label}
              accessibilityState={{ selected }}
              className="rounded-full border px-3 py-1.5 mr-2 mb-2"
              style={{ borderColor: selected ? '#000' : LANDING_BORDER, backgroundColor: selected ? '#000' : '#fff' }}
            >
              <Text style={{ fontFamily: 'Poppins_600SemiBold', color: selected ? '#fff' : LANDING_INK }}>
                {option.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
