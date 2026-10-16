import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';

const STEPS = [
  'Contact the homeowner within 24 to 48 hours to book a physical inspection.',
  'Agree your inspection fee with the homeowner before you go, and collect it on site.',
  'Inspect, then agree the final scope and price directly with the homeowner. Don\'t accept based on the estimate alone.',
  'Send an itemised quotation, with materials and labour listed separately, exact materials and sizes, and the stages. The homeowner signs it.',
  'All project payments go through BuildMyHouse. Never ask the homeowner to pay into your own account for the project. If you do, you lose BuildMyHouse protection and your listing.',
  'You\'re paid per stage. Upload photos when each stage is done, and once the homeowner approves, that stage\'s payment is released.',
  'Your reviews bring you more jobs. Every homeowner rates you at handover, and good ratings get you more projects on BuildMyHouse.',
] as const;

const PREVIEW_COUNT = 2;

export default function BeforeAcceptingNextSteps() {
  const [expanded, setExpanded] = useState(false);
  const visible = expanded ? STEPS : STEPS.slice(0, PREVIEW_COUNT);

  return (
    <View className="mt-3">
      {visible.map((step, index) => (
        <View key={step} className="flex-row items-start mb-2">
          <Text className="text-amber-200 text-sm w-5" style={{ fontFamily: 'Poppins_600SemiBold', lineHeight: 20 }}>
            {index + 1}.
          </Text>
          <Text className="text-amber-100 text-sm flex-1" style={{ fontFamily: 'Poppins_400Regular', lineHeight: 20 }}>
            {step}
          </Text>
        </View>
      ))}
      {STEPS.length > PREVIEW_COUNT ? (
        <Pressable
          accessibilityRole="button"
          onPress={() => setExpanded((open) => !open)}
          className="mt-1 py-1"
        >
          <Text className="text-amber-200 text-sm" style={{ fontFamily: 'Poppins_600SemiBold' }}>
            {expanded ? 'Show fewer steps' : 'Show all steps'}
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}
