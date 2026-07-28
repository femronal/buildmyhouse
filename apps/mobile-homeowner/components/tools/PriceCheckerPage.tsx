import { useMemo, useState } from 'react';
import { Link, useRouter } from 'expo-router';
import { Pressable, Text, View } from 'react-native';
import { ArrowLeft, ArrowUpRight, CheckCircle } from 'phosphor-react-native';
import { SeoHeading } from '@/components/seo/SeoHeading';
import { SeoContentColumn, SeoContentShell, seoContentTypography } from '@/components/seo/SeoContentLayout';
import { PLATFORM_SERVICE_FEE_OFFER, REPAIR_PRICING_GUIDE } from '@/lib/agent-seo-content';
import { getPropertyToolBySlug } from '@/lib/property-tools-catalog';
import { useWebSeo } from '@/lib/seo';
import { buildCanonical } from '@/lib/seo-schema';

function formatNgn(amount: number) {
  return `₦${amount.toLocaleString('en-NG')}`;
}

export default function PriceCheckerPage() {
  const router = useRouter();
  const tool = getPropertyToolBySlug('price-checker');
  const [selectedSlug, setSelectedSlug] = useState<string>(REPAIR_PRICING_GUIDE[0]?.slug ?? '');

  const selected = useMemo(
    () => REPAIR_PRICING_GUIDE.find((item) => item.slug === selectedSlug) ?? REPAIR_PRICING_GUIDE[0],
    [selectedSlug],
  );

  useWebSeo({
    title: 'Price Checker | Nigeria Repair Ranges | BuildMyHouse',
    description:
      'Compare directional Nigeria contractor repair price ranges before you request quotes. BuildMyHouse platform fee is free for now.',
    canonicalPath: '/tools/price-checker',
    robots: 'index,follow',
    jsonLd: {
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'WebApplication',
          name: 'BuildMyHouse Price Checker',
          description:
            'Directional Nigeria contractor repair price ranges for plumbing, electrical, roof leaks, drainage, and windows.',
          url: buildCanonical('/tools/price-checker'),
          applicationCategory: 'BusinessApplication',
          operatingSystem: 'Web',
          offers: {
            '@type': 'Offer',
            price: '0',
            priceCurrency: 'NGN',
          },
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Home', item: buildCanonical('/') },
            { '@type': 'ListItem', position: 2, name: 'Tools', item: buildCanonical('/tools') },
            { '@type': 'ListItem', position: 3, name: 'Price Checker', item: buildCanonical('/tools/price-checker') },
          ],
        },
      ],
    },
  });

  return (
    <SeoContentShell>
      <SeoContentColumn className="pt-10 pb-16">
        <Pressable
          onPress={() => (router.canGoBack() ? router.back() : router.push('/tools' as any))}
          className="w-9 h-9 mb-6 rounded-full border border-neutral-200 items-center justify-center"
          accessibilityLabel="Go back"
        >
          <ArrowLeft size={16} color="#171717" weight="bold" />
        </Pressable>

        <View className="flex-row items-center gap-2 mb-2">
          <CheckCircle size={14} color="#171717" weight="fill" />
          <Text className="text-xs text-neutral-800 uppercase tracking-wide" style={{ fontFamily: 'Poppins_600SemiBold' }}>
            Live now
          </Text>
        </View>

        <Text className={seoContentTypography.eyebrow} style={{ fontFamily: 'Poppins_600SemiBold' }}>
          Hiring, quotations & budgeting
        </Text>

        <SeoHeading level={1} className={seoContentTypography.title} style={{ fontFamily: 'Poppins_700Bold' }}>
          {tool?.title ?? 'Price Checker'}
        </SeoHeading>

        <Text className={seoContentTypography.description} style={{ fontFamily: 'Poppins_400Regular' }}>
          {tool?.description ??
            'Check typical contractor price bands for common Nigeria repairs before you request quotes.'}
        </Text>

        <Text className="text-sm text-neutral-500 mb-5" style={{ fontFamily: 'Poppins_400Regular' }}>
          Platform service fee: {formatNgn(PLATFORM_SERVICE_FEE_OFFER.price)} for now — you pay the verified contractor
          quote only.
        </Text>

        <Text className="text-xs uppercase tracking-wide text-neutral-500 mb-3" style={{ fontFamily: 'Poppins_600SemiBold' }}>
          Choose a repair type
        </Text>

        <View className="flex-row flex-wrap gap-2 mb-6">
          {REPAIR_PRICING_GUIDE.map((item) => {
            const active = item.slug === selected?.slug;
            return (
              <Pressable
                key={item.slug}
                onPress={() => setSelectedSlug(item.slug)}
                className={`px-3.5 py-2 rounded-lg border ${active ? 'bg-black border-black' : 'bg-white border-neutral-200'}`}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
              >
                <Text
                  className={`text-sm ${active ? 'text-white' : 'text-neutral-800'}`}
                  style={{ fontFamily: 'Poppins_500Medium' }}
                >
                  {item.service}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {selected ? (
          <View className="rounded-2xl border border-neutral-200 bg-neutral-50 p-6 mb-8">
            <Text className="text-black text-xl mb-2" style={{ fontFamily: 'Poppins_600SemiBold' }}>
              {selected.service}
            </Text>
            <Text className="text-neutral-900 text-2xl mb-2" style={{ fontFamily: 'JetBrainsMono_500Medium' }}>
              {formatNgn(selected.lowNgn)} – {formatNgn(selected.highNgn)}
            </Text>
            <Text className="text-neutral-500 text-sm mb-4" style={{ fontFamily: 'Poppins_400Regular' }}>
              {selected.unit}
            </Text>
            <Text className="text-neutral-600 text-base leading-7" style={{ fontFamily: 'Poppins_400Regular' }}>
              {selected.note}
            </Text>
          </View>
        ) : null}

        <View className="flex-col sm:flex-row gap-3">
          <Link href={'/book-repair' as any} asChild>
            <Pressable className="h-11 px-5 rounded-lg bg-black items-center justify-center">
              <Text className="text-white text-sm" style={{ fontFamily: 'Poppins_500Medium' }}>
                Book repair online
              </Text>
            </Pressable>
          </Link>
          <Link href={'/pricing/repairs' as any} asChild>
            <Pressable className="h-11 px-5 rounded-lg border border-neutral-200 bg-white items-center justify-center flex-row gap-2">
              <Text className="text-black text-sm" style={{ fontFamily: 'Poppins_500Medium' }}>
                Full pricing table
              </Text>
              <ArrowUpRight size={14} color="#171717" weight="bold" />
            </Pressable>
          </Link>
        </View>

        <Text className="mt-6 text-xs text-neutral-400 leading-5" style={{ fontFamily: 'Poppins_400Regular' }}>
          Ranges are directional contractor estimates for Nigeria, not fixed quotes. Final pricing depends on scope
          photos, access, materials, and site conditions.
        </Text>
      </SeoContentColumn>
    </SeoContentShell>
  );
}
