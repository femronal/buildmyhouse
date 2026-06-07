import { useState } from 'react';
import { Platform, Pressable, Text, View } from 'react-native';
import { Camera, ClipboardText, ShieldCheck, User, type Icon } from 'phosphor-react-native';
import { HOW_IT_WORKS_STEPS } from '@/lib/home-landing-content';

const STEP_ICONS: Icon[] = [Camera, User, ClipboardText, ShieldCheck];

export default function HowItWorks() {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  return (
    <View className="mt-14">
      <Text className="text-3xl text-black mb-10 text-center" style={{ fontFamily: 'Poppins_600SemiBold' }}>
        How BuildMyHouse works
      </Text>

      <View className="bmh-how-steps-grid flex-row flex-wrap gap-4">
        {HOW_IT_WORKS_STEPS.map((step, index) => {
          const Icon = STEP_ICONS[index] ?? Camera;
          const isActive = activeIndex === index;

          return (
            <Pressable
              key={step.title}
              onPress={() => setActiveIndex(isActive ? null : index)}
              onHoverIn={Platform.OS === 'web' ? () => setActiveIndex(index) : undefined}
              onHoverOut={Platform.OS === 'web' ? () => setActiveIndex((current) => (current === index ? null : current)) : undefined}
              className={`bmh-how-step-card w-full md:w-[48%] lg:w-[23%] lg:flex-1 bg-black rounded-3xl px-6 py-10 border items-center ${
                isActive ? 'border-white/30 bmh-how-step-card-active' : 'border-white/10'
              }`}
              accessibilityRole="button"
            >
              <View className="bmh-how-step-icon mb-8 items-center justify-center">
                <Icon size={44} color="#ffffff" weight="light" />
              </View>
              <Text className="text-lg text-white mb-3 text-center" style={{ fontFamily: 'Poppins_600SemiBold' }}>
                {step.title}
              </Text>
              <Text className="text-sm text-slate-400 text-center leading-relaxed" style={{ fontFamily: 'Poppins_500Medium' }}>
                {step.description}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
