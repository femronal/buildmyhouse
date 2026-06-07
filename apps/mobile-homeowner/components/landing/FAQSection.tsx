import { View } from 'react-native';
import CollapsibleFaqSection from '@/components/seo/CollapsibleFaqSection';
import { FAQ_ITEMS } from '@/lib/home-landing-content';

export default function FAQSection() {
  return (
    <View className="mt-14">
      <CollapsibleFaqSection title="Frequently asked questions" items={FAQ_ITEMS} className="mb-0" />
    </View>
  );
}
