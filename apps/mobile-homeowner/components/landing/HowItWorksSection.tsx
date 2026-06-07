import { useState } from 'react';
import { Platform, Pressable, Text, View, type LayoutChangeEvent } from 'react-native';
import { Camera, ClipboardText, ShieldCheck, User, type Icon } from 'phosphor-react-native';
import { HOW_IT_WORKS_STEPS } from '@/lib/home-landing-content';

const STEP_ICONS: Icon[] = [Camera, User, ClipboardText, ShieldCheck];

type HowItWorksSectionProps = {
  onLayout?: (event: LayoutChangeEvent) => void;
};

export default function HowItWorksSection({ onLayout }: HowItWorksSectionProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  return (
    <View className="py-24 bg-white" onLayout={onLayout}>
      <View className="max-w-7xl w-full self-center px-6 md:px-12">
        <Text
          className="text-3xl md:text-4xl text-black mb-16 text-center tracking-tight"
          style={{ fontFamily: 'Poppins_600SemiBold' }}
        >
          How BuildMyHouse works
        </Text>

        <View className="bmh-how-steps-grid flex-row flex-wrap gap-4 md:gap-5">
          {HOW_IT_WORKS_STEPS.map((step, index) => {
            const Icon = STEP_ICONS[index] ?? Camera;
            const isActive = activeIndex === index;

            return (
              <Pressable
                key={step.title}
                onPress={() => setActiveIndex(isActive ? null : index)}
                onHoverIn={Platform.OS === 'web' ? () => setActiveIndex(index) : undefined}
                onHoverOut={Platform.OS === 'web' ? () => setActiveIndex((current) => (current === index ? null : current)) : undefined}
                className={`bmh-how-step-card w-full md:w-[48%] lg:w-[23%] lg:flex-1 lg:min-w-[200px] bg-black rounded-3xl px-6 py-10 border items-center ${
                  isActive ? 'border-white/30 bmh-how-step-card-active' : 'border-white/10'
                }`}
                accessibilityRole="button"
                accessibilityState={{ selected: isActive }}
              >
                <View className="bmh-how-step-icon mb-8 items-center justify-center">
                  <Icon size={44} color="#ffffff" weight="light" />
                </View>
                <Text
                  className="text-lg text-white mb-3 text-center"
                  style={{ fontFamily: 'Poppins_600SemiBold' }}
                >
                  {step.title}
                </Text>
                <Text
                  className="text-sm text-slate-400 text-center leading-relaxed"
                  style={{ fontFamily: 'Poppins_500Medium' }}
                >
                  {step.description}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>
    </View>
  );
}
