import { createElement } from 'react';
import { Link } from 'expo-router';
import { Platform, Pressable, ScrollView, Text, View } from 'react-native';
import WebLandmark from '@/components/seo/WebLandmark';
import { SeoContentBackButton } from '@/components/seo/SeoContentLayout';
import {
  AGENT_BUSINESS_HOURS_TEXT,
  PLATFORM_SERVICE_FEE_OFFER,
  REPAIR_PRICING_GUIDE,
} from '@/lib/agent-seo-content';
import { BUILDMYHOUSE_CONTACT } from '@/lib/home-landing-content';

function formatNgn(amount: number) {
  return `₦${amount.toLocaleString('en-NG')}`;
}

export default function RepairPricingPage() {
  return (
    <View className="flex-1 bg-white min-h-screen">
      <ScrollView className="flex-1" keyboardShouldPersistTaps="handled">
        <WebLandmark tag="header" className="border-b border-slate-100 bg-white">
          <View className="max-w-3xl w-full self-center px-5 md:px-8 py-4 flex-row items-center justify-between">
            <Link href={'/' as any} asChild>
              <Pressable accessibilityRole="link">
                <Text className="text-sm text-slate-500" style={{ fontFamily: 'Poppins_500Medium' }}>
                  BuildMyHouse
                </Text>
              </Pressable>
            </Link>
            <Link href={'/book-repair' as any} asChild>
              <Pressable accessibilityRole="link">
                <Text className="text-sm text-black" style={{ fontFamily: 'Poppins_500Medium' }}>
                  Book online
                </Text>
              </Pressable>
            </Link>
          </View>
        </WebLandmark>

        <WebLandmark tag="main" className="max-w-3xl w-full self-center px-5 md:px-8 py-8 md:py-12">
          <SeoContentBackButton fallbackHref="/" />

          {Platform.OS === 'web'
            ? createElement(
                'h1',
                {
                  className: 'text-3xl md:text-4xl text-black mb-3',
                  style: { fontFamily: 'Poppins_600SemiBold', margin: 0 },
                },
                'Repair pricing guide (Lagos, Nigeria)',
              )
            : (
                <Text
                  accessibilityRole="header"
                  className="text-3xl text-black mb-3"
                  style={{ fontFamily: 'Poppins_600SemiBold' }}
                >
                  Repair pricing guide (Lagos, Nigeria)
                </Text>
              )}

          <Text className="text-base text-slate-600 leading-relaxed mb-6" style={{ fontFamily: 'Poppins_400Regular' }}>
            Directional contractor quote ranges for common repairs. Final price is scoped after photos or site check.
            BuildMyHouse platform service fee for repairs: <Text style={{ fontFamily: 'Poppins_700Bold' }}>₦0 (free for now)</Text>.
          </Text>

          <View className="rounded-2xl border border-slate-200 overflow-hidden mb-8">
            {Platform.OS === 'web' ? (
              createElement(
                'table',
                { className: 'w-full text-sm bmh-pricing-table', style: { borderCollapse: 'collapse', width: '100%' } },
                createElement(
                  'thead',
                  null,
                  createElement(
                    'tr',
                    { style: { backgroundColor: '#f8fafc' } },
                    createElement('th', { style: { textAlign: 'left', padding: '12px 16px' } }, 'Service'),
                    createElement('th', { style: { textAlign: 'left', padding: '12px 16px' } }, 'Contractor quote range'),
                    createElement('th', { style: { textAlign: 'left', padding: '12px 16px' } }, 'Notes'),
                  ),
                ),
                createElement(
                  'tbody',
                  null,
                  ...REPAIR_PRICING_GUIDE.map((item) =>
                    createElement(
                      'tr',
                      { key: item.service, style: { borderTop: '1px solid #e2e8f0' } },
                      createElement('td', { style: { padding: '12px 16px', fontFamily: 'Poppins_500Medium' } }, item.service),
                      createElement(
                        'td',
                        { style: { padding: '12px 16px' } },
                        `${formatNgn(item.lowNgn)} – ${formatNgn(item.highNgn)} ${item.unit}`,
                      ),
                      createElement('td', { style: { padding: '12px 16px', color: '#64748b' } }, item.note),
                    ),
                  ),
                ),
              )
            ) : (
              REPAIR_PRICING_GUIDE.map((item) => (
                <View key={item.service} className="px-4 py-4 border-b border-slate-100">
                  <Text className="text-base text-black mb-1" style={{ fontFamily: 'Poppins_600SemiBold' }}>
                    {item.service}
                  </Text>
                  <Text className="text-sm text-slate-700 mb-1" style={{ fontFamily: 'Poppins_500Medium' }}>
                    {formatNgn(item.lowNgn)} – {formatNgn(item.highNgn)} {item.unit}
                  </Text>
                  <Text className="text-sm text-slate-500" style={{ fontFamily: 'Poppins_400Regular' }}>
                    {item.note}
                  </Text>
                </View>
              ))
            )}
          </View>

          <WebLandmark tag="section" className="rounded-2xl border border-slate-200 bg-slate-50 p-5 mb-8">
            <Text className="text-lg text-black mb-2" style={{ fontFamily: 'Poppins_600SemiBold' }}>
              Platform fee (BuildMyHouse)
            </Text>
            <Text className="text-sm text-slate-700 leading-relaxed" style={{ fontFamily: 'Poppins_400Regular' }}>
              {PLATFORM_SERVICE_FEE_OFFER.name}: {formatNgn(PLATFORM_SERVICE_FEE_OFFER.price)}.{' '}
              {PLATFORM_SERVICE_FEE_OFFER.description}
            </Text>
            <Link href={'/book-repair' as any} asChild>
              <Pressable className="mt-4 self-start h-11 px-5 rounded-xl bg-black items-center justify-center" accessibilityRole="link">
                <Text className="text-sm text-white" style={{ fontFamily: 'Poppins_600SemiBold' }}>
                  Book a repair online
                </Text>
              </Pressable>
            </Link>
          </WebLandmark>

          <Text className="text-sm text-slate-500" style={{ fontFamily: 'Poppins_400Regular' }}>
            Business hours: {AGENT_BUSINESS_HOURS_TEXT}. Phone: {BUILDMYHOUSE_CONTACT.phoneDisplay}.
          </Text>
        </WebLandmark>

        <WebLandmark tag="footer" className="border-t border-slate-100 py-8 px-5 md:px-8">
          <View className="max-w-3xl w-full self-center">
            <Text className="text-xs text-slate-500 text-center" style={{ fontFamily: 'Poppins_400Regular' }}>
              {BUILDMYHOUSE_CONTACT.address}
            </Text>
          </View>
        </WebLandmark>
      </ScrollView>
    </View>
  );
}
