import { createElement } from 'react';
import { Link } from 'expo-router';
import { Platform, Pressable, Text, View } from 'react-native';
import WebLandmark from '@/components/seo/WebLandmark';
import { REPAIR_PRICING_GUIDE, PLATFORM_SERVICE_FEE_OFFER } from '@/lib/agent-seo-content';

function formatNgn(amount: number) {
  return `₦${amount.toLocaleString('en-NG')}`;
}

export default function AgentPricingSection() {
  return (
    <WebLandmark tag="section" id="pricing" className="py-16 md:py-24 bg-white border-t border-slate-100">
      <View className="max-w-7xl w-full self-center px-6 md:px-12">
        {Platform.OS === 'web'
          ? createElement(
              'h2',
              {
                className: 'text-2xl md:text-3xl text-black mb-3',
                style: { fontFamily: 'Poppins_600SemiBold', margin: 0 },
              },
              'Repair pricing you can compare',
            )
          : (
              <Text accessibilityRole="header" className="text-2xl text-black mb-3" style={{ fontFamily: 'Poppins_600SemiBold' }}>
                Repair pricing you can compare
              </Text>
            )}

        <Text className="text-base text-slate-600 max-w-2xl mb-6 leading-relaxed" style={{ fontFamily: 'Poppins_400Regular' }}>
          Directional Lagos contractor ranges below. BuildMyHouse service fee on repairs is{' '}
          <Text style={{ fontFamily: 'Poppins_700Bold' }}>free for now</Text> — you pay the verified contractor quote only.
        </Text>

        <View className="rounded-2xl border border-slate-200 overflow-hidden mb-6">
          {REPAIR_PRICING_GUIDE.map((item, index) => (
            <View
              key={item.service}
              className={`px-4 py-4 flex-col md:flex-row md:items-center md:justify-between gap-2 ${
                index > 0 ? 'border-t border-slate-100' : ''
              }`}
            >
              <Text className="text-sm text-black md:w-1/3" style={{ fontFamily: 'Poppins_600SemiBold' }}>
                {item.service}
              </Text>
              <Text className="text-sm text-slate-700 md:w-1/3" style={{ fontFamily: 'Poppins_500Medium' }}>
                {formatNgn(item.lowNgn)} – {formatNgn(item.highNgn)} {item.unit}
              </Text>
              <Text className="text-xs text-slate-500 md:w-1/3" style={{ fontFamily: 'Poppins_400Regular' }}>
                Platform fee: {formatNgn(PLATFORM_SERVICE_FEE_OFFER.price)}
              </Text>
            </View>
          ))}
        </View>

        <View className="flex-col sm:flex-row gap-3">
          <Link href={'/pricing/repairs' as any} asChild>
            <Pressable className="h-11 px-5 rounded-lg border border-slate-200 bg-white items-center justify-center" accessibilityRole="link">
              <Text className="text-sm text-black" style={{ fontFamily: 'Poppins_500Medium' }}>
                Full pricing guide
              </Text>
            </Pressable>
          </Link>
          <Link href={'/book-repair' as any} asChild>
            <Pressable className="h-11 px-5 rounded-lg bg-black items-center justify-center bmh-glass-btn bmh-glass-btn-dark" accessibilityRole="link">
              <Text className="text-sm text-white" style={{ fontFamily: 'Poppins_500Medium' }}>
                Book repair online
              </Text>
            </Pressable>
          </Link>
        </View>
      </View>
    </WebLandmark>
  );
}
