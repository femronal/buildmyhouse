import { Text, View } from 'react-native';
import { ShieldCheck, Users, FileCheck } from 'lucide-react-native';
import { cardShadowStyle } from '@/lib/card-styles';

const items = [
  {
    icon: ShieldCheck,
    title: 'Why BuildMyHouse exists',
    body: 'We help diaspora families build in Nigeria with structure—so progress is visible and payments align to real milestones.',
  },
  {
    icon: FileCheck,
    title: 'Avoid construction scams',
    body: 'Unverified contractors and informal agreements are common failure points. We emphasize documentation and stage approvals.',
  },
  {
    icon: Users,
    title: 'Verified contractors only',
    body: 'Work with vetted general contractors on our platform—not random referrals—with a clearer chain of accountability.',
  },
];

export default function TrustStrip() {
  return (
    <View
      style={cardShadowStyle}
      className="bg-blue-50 border border-blue-100 rounded-2xl p-4 mb-8 max-w-[680px] self-center w-full"
    >
      <Text className="text-blue-900 text-sm font-semibold mb-3" style={{ fontFamily: 'Poppins_600SemiBold' }}>
        Built for diaspora homeowners
      </Text>
      {items.map((item) => (
        <View key={item.title} className="flex-row items-start mb-3 last:mb-0">
          <View className="w-9 h-9 rounded-full bg-white items-center justify-center mr-3 border border-blue-100">
            <item.icon size={18} color="#1d4ed8" strokeWidth={2.2} />
          </View>
          <View className="flex-1 min-w-0">
            <Text className="text-gray-900 text-sm mb-0.5" style={{ fontFamily: 'Poppins_600SemiBold' }}>
              {item.title}
            </Text>
            <Text className="text-gray-700 text-[13px] leading-5" style={{ fontFamily: 'Poppins_400Regular' }}>
              {item.body}
            </Text>
          </View>
        </View>
      ))}
    </View>
  );
}
