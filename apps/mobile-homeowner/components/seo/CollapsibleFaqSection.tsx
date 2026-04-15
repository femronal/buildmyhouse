import { useState } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { ChevronDown, ChevronUp } from 'lucide-react-native';
import { SeoHeading } from '@/components/seo/SeoHeading';
import { cardShadowStyle } from '@/lib/card-styles';

export type CollapsibleFaqItem = {
  readonly question: string;
  readonly answer: string;
};

type CollapsibleFaqSectionProps = {
  title?: string;
  items: readonly CollapsibleFaqItem[];
  className?: string;
};

export default function CollapsibleFaqSection({
  title = 'Frequently asked questions',
  items,
  className = 'mb-6',
}: CollapsibleFaqSectionProps) {
  const [openQuestion, setOpenQuestion] = useState<string | null>(items[0]?.question ?? null);

  if (items.length === 0) return null;

  return (
    <View className={className}>
      <SeoHeading level={2} className="text-black text-xl mb-3" style={{ fontFamily: 'Poppins_700Bold' }}>
        {title}
      </SeoHeading>
      {items.map((item) => {
        const isOpen = openQuestion === item.question;
        return (
          <View key={item.question} style={cardShadowStyle} className="bg-white border border-gray-200 rounded-2xl mb-3 overflow-hidden">
            <TouchableOpacity
              onPress={() => setOpenQuestion(isOpen ? null : item.question)}
              className="px-4 py-3.5 flex-row items-center justify-between"
              accessibilityRole="button"
              accessibilityState={{ expanded: isOpen }}
            >
              <SeoHeading level={3} className="text-black text-sm pr-3 flex-1" style={{ fontFamily: 'Poppins_600SemiBold' }}>
                {item.question}
              </SeoHeading>
              {isOpen ? <ChevronUp size={18} color="#4b5563" /> : <ChevronDown size={18} color="#4b5563" />}
            </TouchableOpacity>
            {isOpen ? (
              <View className="px-4 pb-4">
                <Text className="text-gray-600 text-sm leading-6" style={{ fontFamily: 'Poppins_400Regular' }}>
                  {item.answer}
                </Text>
              </View>
            ) : null}
          </View>
        );
      })}
    </View>
  );
}
