import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';

const STEPS = [
  'The contractor contacts you to arrange a physical inspection.',
  'Agree the inspection fee before they come, and pay it to them on the spot at the inspection. This is the only payment you ever make directly to the contractor.',
  'Agree the price together. After the inspection, talk through the scope and price with the contractor. The plan\'s price is only an estimate, and the final price is the one you both agree.',
  'Get it in writing. Ask for an itemised quotation, with materials and labour listed separately, and sign it only when you\'re happy.',
  'Send us the signed quote. BuildMyHouse checks whether the price looks fair, and if it looks too high or too low, we\'ll advise you to renegotiate.',
  'Fund the project through BuildMyHouse, never the contractor\'s account. Money is released stage by stage, only after the contractor uploads proof and you approve each stage in the app.',
] as const;

const PREVIEW_COUNT = 2;

export default function RequestPendingNextSteps() {
  const [expanded, setExpanded] = useState(false);
  const visible = expanded ? STEPS : STEPS.slice(0, PREVIEW_COUNT);

  return (
    <View className="mt-3">
      <Text className="text-yellow-900 text-sm mb-2" style={{ fontFamily: 'Poppins_700Bold' }}>
        What happens next:
      </Text>
      {visible.map((step, index) => (
        <View key={step} className="flex-row items-start mb-2">
          <Text className="text-yellow-900 text-sm w-5" style={{ fontFamily: 'Poppins_600SemiBold', lineHeight: 20 }}>
            {index + 1}.
          </Text>
          <Text className="text-yellow-800 text-sm flex-1" style={{ fontFamily: 'Poppins_400Regular', lineHeight: 20 }}>
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
          <Text className="text-yellow-900 text-sm" style={{ fontFamily: 'Poppins_600SemiBold' }}>
            {expanded ? 'Show fewer steps' : 'Show all steps'}
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}
