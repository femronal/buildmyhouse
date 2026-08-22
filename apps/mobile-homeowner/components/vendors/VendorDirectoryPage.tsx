import { useMemo, useState } from 'react';
import { Link } from 'expo-router';
import { Pressable, Text, TextInput, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import {
  SeoContentBackButton,
  SeoContentColumn,
  SeoContentShell,
  seoContentTypography,
} from '@/components/seo/SeoContentLayout';
import { SeoHeading } from '@/components/seo/SeoHeading';
import { LANDING_BORDER, LANDING_INK, LANDING_MUTED } from '@/lib/home-landing-content';
import {
  VENDOR_CATEGORY_FILTERS,
  VENDOR_STATE_FILTERS,
  fetchPublicVendors,
  type PublicVendorCard,
} from '@/lib/public-vendors';
import { buildSeoJsonLd } from '@/lib/seo-schema';
import { useWebSeo } from '@/lib/seo';

function FilterChip({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      className={`rounded-full px-3 py-1.5 mr-2 mb-2 border ${active ? 'bg-black' : 'bg-white'}`}
      style={{ borderColor: active ? '#000' : LANDING_BORDER }}
      accessibilityRole="button"
    >
      <Text
        className="text-xs"
        style={{ fontFamily: 'Poppins_600SemiBold', color: active ? '#fff' : LANDING_INK }}
      >
        {label}
      </Text>
    </Pressable>
  );
}

function VendorCard({ vendor }: { vendor: PublicVendorCard }) {
  const location = [vendor.cityLabel, vendor.stateLabel].filter(Boolean).join(', ');
  const sales = [
    vendor.sellsRetail ? 'Retail' : null,
    vendor.sellsWholesale ? 'Wholesale' : null,
  ]
    .filter(Boolean)
    .join(' · ');
  const delivery =
    vendor.deliveryAvailable === true
      ? 'Delivery available'
      : vendor.deliveryAvailable === false
        ? 'Pickup / enquiry'
        : null;

  return (
    <Link href={`/vendors/${vendor.slug}` as any} asChild>
      <Pressable
        className="border rounded-2xl p-4 mb-3"
        style={{ borderColor: LANDING_BORDER }}
        accessibilityRole="link"
      >
        <View className="flex-row items-start justify-between mb-1 gap-2">
          <Text
            className="text-base flex-1"
            style={{ fontFamily: 'Poppins_700Bold', color: LANDING_INK }}
          >
            {vendor.tradingName}
          </Text>
          {vendor.isBuildMyHouseVerified ? (
            <View className="rounded-full px-2 py-0.5 bg-black">
              <Text className="text-[10px] text-white" style={{ fontFamily: 'Poppins_600SemiBold' }}>
                BMH Verified
              </Text>
            </View>
          ) : (
            <View className="rounded-full px-2 py-0.5 border" style={{ borderColor: LANDING_BORDER }}>
              <Text className="text-[10px]" style={{ fontFamily: 'Poppins_600SemiBold', color: LANDING_MUTED }}>
                Listed
              </Text>
            </View>
          )}
        </View>

        {vendor.description ? (
          <Text
            className="text-sm mb-2"
            numberOfLines={2}
            style={{ fontFamily: 'Poppins_400Regular', color: LANDING_MUTED }}
          >
            {vendor.description}
          </Text>
        ) : null}

        {vendor.categories.length > 0 ? (
          <Text className="text-xs mb-1" style={{ fontFamily: 'Poppins_500Medium', color: LANDING_INK }}>
            {vendor.categories.slice(0, 4).join(' · ')}
          </Text>
        ) : null}

        {vendor.brands.length > 0 ? (
          <Text className="text-xs mb-1" style={{ fontFamily: 'Poppins_400Regular', color: LANDING_MUTED }}>
            Brands: {vendor.brands.slice(0, 4).join(', ')}
          </Text>
        ) : null}

        <Text className="text-xs" style={{ fontFamily: 'Poppins_400Regular', color: LANDING_MUTED }}>
          {[location || null, sales || null, delivery, vendor.yearsInBusiness != null ? `${vendor.yearsInBusiness}+ years` : null]
            .filter(Boolean)
            .join(' · ')}
        </Text>

        <Text className="text-xs mt-3" style={{ fontFamily: 'Poppins_600SemiBold', color: LANDING_INK }}>
          View vendor →
        </Text>
      </Pressable>
    </Link>
  );
}

export default function VendorDirectoryPage() {
  const [query, setQuery] = useState('');
  const [familyKey, setFamilyKey] = useState('');
  const [stateKey, setStateKey] = useState('');
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [wholesale, setWholesale] = useState(false);
  const [delivery, setDelivery] = useState(false);

  const title = 'Building Material Vendors in Nigeria';
  const summary =
    'Discover listed building-material suppliers by what they sell, where they operate, and whether BuildMyHouse has verified their business identity. Listing is not the same as verification.';

  const jsonLd = buildSeoJsonLd({
    path: '/vendors',
    title,
    description: summary,
    schemaType: 'Service',
    breadcrumbs: [
      { name: 'Home', path: '/' },
      { name: 'Vendors', path: '/vendors' },
    ],
    faqs: [
      {
        question: 'What does BuildMyHouse Verified mean for vendors?',
        answer:
          'It means BuildMyHouse completed defined business and identity checks. It is not a guarantee of product quality or every future transaction.',
      },
      {
        question: 'Are all listed vendors verified?',
        answer:
          'No. A vendor may be publicly listed after review without being BuildMyHouse Verified. The profile shows the distinction clearly.',
      },
    ],
  });

  useWebSeo({
    title: `${title} | BuildMyHouse`,
    description: summary,
    canonicalPath: '/vendors',
    robots: 'index,follow',
    jsonLd,
  });

  const searchParams = useMemo(
    () => ({
      query: query.trim() || undefined,
      familyKey: familyKey || undefined,
      stateKey: stateKey || undefined,
      verifiedOnly: verifiedOnly || undefined,
      wholesale: wholesale || undefined,
      delivery: delivery || undefined,
      limit: 30,
    }),
    [delivery, familyKey, query, stateKey, verifiedOnly, wholesale],
  );

  const { data, isLoading, isError } = useQuery({
    queryKey: ['public-vendors', searchParams],
    queryFn: () => fetchPublicVendors(searchParams),
  });

  const vendors = data?.vendors ?? [];
  const total = data?.meta?.total ?? 0;

  return (
    <SeoContentShell contentContainerStyle={{ paddingBottom: 48 }}>
      <SeoContentColumn className="pt-10 pb-2 md:pt-14 md:pb-4">
        <SeoContentBackButton fallbackHref="/" />

        <View className="border rounded-3xl p-6 mb-6" style={{ borderColor: LANDING_BORDER }}>
          <SeoHeading
            level={1}
            className={seoContentTypography.title}
            style={{ fontFamily: 'Poppins_700Bold', color: LANDING_INK }}
          >
            {title}
          </SeoHeading>
          <Text
            className={seoContentTypography.description}
            style={{ fontFamily: 'Poppins_400Regular', color: LANDING_MUTED }}
          >
            {summary}
          </Text>

          <View className="flex-row flex-wrap mt-3">
            <Link href={'/vendors/apply' as any} asChild>
              <Pressable className="rounded-full px-4 py-2.5 mr-3 mb-2 bg-black" accessibilityRole="link">
                <Text className="text-white text-sm" style={{ fontFamily: 'Poppins_700Bold' }}>
                  List your business
                </Text>
              </Pressable>
            </Link>
            <Link href={'/vendors/manage' as any} asChild>
              <Pressable
                className="rounded-full px-4 py-2.5 mr-3 mb-2 border"
                style={{ borderColor: LANDING_BORDER }}
                accessibilityRole="link"
              >
                <Text className="text-sm" style={{ fontFamily: 'Poppins_700Bold', color: LANDING_INK }}>
                  Manage listing
                </Text>
              </Pressable>
            </Link>
            <Link href={'/tools/price-checker' as any} asChild>
              <Pressable
                className="rounded-full px-4 py-2.5 mb-2 border"
                style={{ borderColor: LANDING_BORDER }}
                accessibilityRole="link"
              >
                <Text className="text-sm" style={{ fontFamily: 'Poppins_700Bold', color: LANDING_INK }}>
                  Check market prices
                </Text>
              </Pressable>
            </Link>
          </View>
        </View>

        <View className="mb-4">
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search cement, plumbing, Dangote, Lagos…"
            placeholderTextColor="#9CA3AF"
            className="border rounded-2xl px-4 py-3 text-sm mb-3"
            style={{
              borderColor: LANDING_BORDER,
              fontFamily: 'Poppins_400Regular',
              color: LANDING_INK,
              outlineStyle: 'none' as any,
            }}
          />

          <Text className="text-sm mb-2" style={{ fontFamily: 'Poppins_600SemiBold', color: LANDING_INK }}>
            Category
          </Text>
          <View className="flex-row flex-wrap mb-2">
            <FilterChip label="All" active={!familyKey} onPress={() => setFamilyKey('')} />
            {VENDOR_CATEGORY_FILTERS.map((item) => (
              <FilterChip
                key={item.familyKey}
                label={item.label}
                active={familyKey === item.familyKey}
                onPress={() => setFamilyKey(familyKey === item.familyKey ? '' : item.familyKey)}
              />
            ))}
          </View>

          <Text className="text-sm mb-2" style={{ fontFamily: 'Poppins_600SemiBold', color: LANDING_INK }}>
            Location
          </Text>
          <View className="flex-row flex-wrap mb-2">
            <FilterChip label="All states" active={!stateKey} onPress={() => setStateKey('')} />
            {VENDOR_STATE_FILTERS.map((item) => (
              <FilterChip
                key={item.stateKey}
                label={item.label}
                active={stateKey === item.stateKey}
                onPress={() => setStateKey(stateKey === item.stateKey ? '' : item.stateKey)}
              />
            ))}
          </View>

          <View className="flex-row flex-wrap">
            <FilterChip
              label="Verified only"
              active={verifiedOnly}
              onPress={() => setVerifiedOnly((v) => !v)}
            />
            <FilterChip label="Wholesale" active={wholesale} onPress={() => setWholesale((v) => !v)} />
            <FilterChip label="Delivery" active={delivery} onPress={() => setDelivery((v) => !v)} />
          </View>
        </View>

        <View className="border rounded-3xl p-6" style={{ borderColor: LANDING_BORDER }}>
          <SeoHeading
            level={2}
            className={seoContentTypography.sectionHeading}
            style={{ fontFamily: 'Poppins_700Bold', color: LANDING_INK }}
          >
            {isLoading ? 'Loading vendors…' : `${total} vendor${total === 1 ? '' : 's'}`}
          </SeoHeading>

          {isError ? (
            <Text className="text-sm mt-3" style={{ fontFamily: 'Poppins_400Regular', color: LANDING_MUTED }}>
              Unable to load vendors right now. Please try again shortly.
            </Text>
          ) : null}

          {!isLoading && !isError && vendors.length === 0 ? (
            <View className="mt-3">
              <Text className="text-sm mb-2" style={{ fontFamily: 'Poppins_500Medium', color: LANDING_INK }}>
                No listed vendor currently matches this exact search.
              </Text>
              <Text className="text-sm mb-4" style={{ fontFamily: 'Poppins_400Regular', color: LANDING_MUTED }}>
                Try nearby states, clear filters, check market prices, or ask BuildMyHouse for procurement help.
              </Text>
              <View className="flex-row flex-wrap">
                <Pressable
                  onPress={() => {
                    setFamilyKey('');
                    setStateKey('');
                    setVerifiedOnly(false);
                    setWholesale(false);
                    setDelivery(false);
                    setQuery('');
                  }}
                  className="rounded-full px-4 py-2.5 mr-3 mb-2 border"
                  style={{ borderColor: LANDING_BORDER }}
                >
                  <Text className="text-sm" style={{ fontFamily: 'Poppins_700Bold', color: LANDING_INK }}>
                    Clear filters
                  </Text>
                </Pressable>
                <Link href={'/tools/price-checker' as any} asChild>
                  <Pressable className="rounded-full px-4 py-2.5 mb-2 bg-black" accessibilityRole="link">
                    <Text className="text-white text-sm" style={{ fontFamily: 'Poppins_700Bold' }}>
                      Use Price Checker
                    </Text>
                  </Pressable>
                </Link>
              </View>
            </View>
          ) : null}

          <View className="mt-4">
            {vendors.map((vendor) => (
              <VendorCard key={vendor.id} vendor={vendor} />
            ))}
          </View>
        </View>
      </SeoContentColumn>
    </SeoContentShell>
  );
}
