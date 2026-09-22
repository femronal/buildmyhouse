import { useCallback, useMemo, useState } from 'react';
import { Link, useLocalSearchParams, useRouter } from 'expo-router';
import { Image, Pressable, Text, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import DirectoryBrowse, {
  DirectoryActionLink,
  DirectoryPill,
  useDirectoryColumns,
  type DirectoryChip,
  type DirectoryFilterSection,
} from '@/components/directory/DirectoryBrowse';
import DirectorySiteHeader from '@/components/directory/DirectorySiteHeader';
import { SeoContentBackButton, SeoContentShell } from '@/components/seo/SeoContentLayout';
import { getBackendAssetUrl } from '@/lib/image';
import { LANDING_BORDER, LANDING_INK, LANDING_MUTED, LANDING_SURFACE } from '@/lib/home-landing-content';
import {
  DIRECTORY_PAGE_SIZE,
  VENDOR_DIRECTORY_SUMMARY,
  VENDOR_QUERY_ORDER,
  directoryCanonical,
  humanizeKey,
  initialsFromName,
  normalizeSearchParams,
  readFlag,
  readPage,
  readSort,
  toggleFilterHref,
  vendorDirectoryHeading,
  withDirectoryParams,
} from '@/lib/directory-listing';
import {
  VENDOR_CATEGORY_FILTERS,
  VENDOR_STATE_FILTERS,
  fetchPublicVendors,
  type PublicVendorCard,
} from '@/lib/public-vendors';
import { buildSeoJsonLd } from '@/lib/seo-schema';
import { usePageOwnedSeo, useWebSeo } from '@/lib/seo';

const PATH = '/vendors';

function placeLabel(stateKey?: string): string | undefined {
  if (!stateKey) return undefined;
  return VENDOR_STATE_FILTERS.find((item) => item.stateKey === stateKey)?.label || humanizeKey(stateKey.replace(/^ng-/, ''));
}

function categoryLabel(category?: string): string | undefined {
  if (!category) return undefined;
  return VENDOR_CATEGORY_FILTERS.find((item) => item.familyKey === category)?.label || humanizeKey(category);
}

function VendorMark({ name, logoUrl }: { name: string; logoUrl: string | null }) {
  const [failed, setFailed] = useState(false);
  const logo = !failed ? getBackendAssetUrl(logoUrl) : null;
  if (!logo) {
    return (
      <Text style={{ fontFamily: 'Poppins_700Bold', fontSize: 28, color: LANDING_INK }}>{initialsFromName(name)}</Text>
    );
  }
  return (
    <Image
      source={{ uri: logo }}
      accessibilityIgnoresInvertColors
      onError={() => setFailed(true)}
      style={{ width: '78%', height: '78%' }}
      resizeMode="contain"
    />
  );
}

function VendorCard({ vendor }: { vendor: PublicVendorCard }) {
  const location = [vendor.cityLabel, vendor.stateLabel].filter(Boolean).join(', ');
  const sales = [vendor.sellsRetail ? 'Retail' : null, vendor.sellsWholesale ? 'Wholesale' : null]
    .filter(Boolean)
    .join(' · ');
  const delivery =
    vendor.deliveryAvailable === true ? 'Delivery' : vendor.deliveryAvailable === false ? 'Pickup' : null;
  const meta = [location, sales, delivery, vendor.yearsInBusiness != null ? `${vendor.yearsInBusiness}+ yrs` : null]
    .filter(Boolean)
    .join(' · ');
  const status = vendor.isBuildMyHouseVerified ? 'BMH Verified' : 'Listed';

  return (
    <Link href={`/vendors/${vendor.slug}` as any} asChild>
      <Pressable
        accessibilityRole="link"
        accessibilityLabel={`${vendor.tradingName}, ${status}`}
        style={{
          borderWidth: 1,
          borderColor: LANDING_BORDER,
          borderRadius: 16,
          backgroundColor: '#fff',
          overflow: 'hidden',
        }}
      >
        <View style={{ aspectRatio: 4 / 3, backgroundColor: LANDING_SURFACE, alignItems: 'center', justifyContent: 'center' }}>
          <VendorMark name={vendor.tradingName} logoUrl={vendor.logoUrl} />
          <View style={{ position: 'absolute', top: 10, left: 10 }}>
            <DirectoryPill label={status} tone={vendor.isBuildMyHouseVerified ? 'solid' : 'outline'} />
          </View>
        </View>
        <View style={{ paddingHorizontal: 12, paddingTop: 12, paddingBottom: 14 }}>
          <Text numberOfLines={2} style={{ fontFamily: 'Poppins_700Bold', fontSize: 16, color: LANDING_INK }}>
            {vendor.tradingName}
          </Text>
          {meta ? (
            <Text numberOfLines={2} style={{ marginTop: 4, fontFamily: 'Poppins_400Regular', fontSize: 13, color: LANDING_MUTED }}>
              {meta}
            </Text>
          ) : null}
          {vendor.categories.length > 0 ? (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 10 }}>
              {vendor.categories.slice(0, 3).map((category) => (
                <DirectoryPill key={category} label={humanizeKey(category)} />
              ))}
            </View>
          ) : null}
          {vendor.brands.length > 0 ? (
            <Text numberOfLines={1} style={{ marginTop: 2, fontFamily: 'Poppins_400Regular', fontSize: 12, color: LANDING_MUTED }}>
              {vendor.brands.slice(0, 3).join(', ')}
            </Text>
          ) : null}
        </View>
      </Pressable>
    </Link>
  );
}

export default function VendorDirectoryPage() {
  usePageOwnedSeo();
  const router = useRouter();
  const raw = useLocalSearchParams();
  const params = useMemo(() => normalizeSearchParams(raw, VENDOR_QUERY_ORDER), [raw]);
  const columns = useDirectoryColumns('vendor');
  const page = readPage(params.page);
  const sort = readSort(params.sort);
  const title = vendorDirectoryHeading({
    categoryLabel: categoryLabel(params.category),
    stateLabel: placeLabel(params.state),
  });
  const canonicalPath = directoryCanonical(PATH, params, ['category', 'state']);

  const jsonLd = buildSeoJsonLd({
    path: canonicalPath,
    title,
    description: VENDOR_DIRECTORY_SUMMARY,
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
    description: VENDOR_DIRECTORY_SUMMARY,
    canonicalPath,
    robots: 'index,follow',
    jsonLd,
  });

  const searchParams = useMemo(
    () => ({
      query: params.q?.trim() || undefined,
      familyKey: params.category,
      stateKey: params.state,
      verifiedOnly: readFlag(params.verified) || undefined,
      wholesale: readFlag(params.wholesale) || undefined,
      delivery: readFlag(params.delivery) || undefined,
      sort: sort === 'name' ? ('name' as const) : undefined,
      page,
      limit: DIRECTORY_PAGE_SIZE,
    }),
    [page, params.category, params.delivery, params.q, params.state, params.verified, params.wholesale, sort],
  );

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['public-vendors', searchParams],
    queryFn: () => fetchPublicVendors(searchParams),
  });

  const onSearchChange = useCallback(
    (value: string) => {
      router.replace(
        withDirectoryParams(PATH, params, { q: value.trim() || undefined }, VENDOR_QUERY_ORDER) as any,
      );
    },
    [params, router],
  );

  const chip = (key: string, label: string, param: string, value: string): DirectoryChip => ({
    key,
    label,
    active: params[param] === value,
    href: toggleFilterHref(PATH, params, param, value, VENDOR_QUERY_ORDER),
  });

  const categoryChips = VENDOR_CATEGORY_FILTERS.map((item) =>
    chip(`category-${item.familyKey}`, item.label, 'category', item.familyKey),
  );
  const stateChips = VENDOR_STATE_FILTERS.map((item) => chip(`state-${item.stateKey}`, item.label, 'state', item.stateKey));
  const optionChips = [
    chip('verified', 'Verified only', 'verified', '1'),
    chip('wholesale', 'Wholesale', 'wholesale', '1'),
    chip('delivery', 'Delivery', 'delivery', '1'),
  ];
  if (params.category && !categoryChips.some((item) => item.active)) {
    categoryChips.push(chip(`category-${params.category}`, categoryLabel(params.category) || params.category, 'category', params.category));
  }
  if (params.state && !stateChips.some((item) => item.active)) {
    stateChips.push(chip(`state-${params.state}`, placeLabel(params.state) || params.state, 'state', params.state));
  }
  const sections: DirectoryFilterSection[] = [
    { id: 'category', title: 'Category', chips: categoryChips },
    { id: 'location', title: 'Location', chips: stateChips },
    { id: 'options', title: 'Listing', chips: optionChips },
  ];
  const activeFilterCount = [params.category, params.state, params.verified, params.wholesale, params.delivery].filter(
    Boolean,
  ).length;
  const pageHref = (nextPage: number) =>
    withDirectoryParams(
      PATH,
      params,
      { page: nextPage <= 1 ? undefined : String(nextPage) },
      VENDOR_QUERY_ORDER,
      false,
    );

  const vendors = data?.vendors ?? [];
  const total = data?.meta?.total ?? 0;
  const totalPages = data?.meta?.totalPages ?? 0;

  return (
    <View className="flex-1 bg-white">
      <DirectorySiteHeader current="vendors" />
      <SeoContentShell contentContainerStyle={{ paddingBottom: 96 }}>
      <View className="w-full max-w-[1120px] self-center px-4 md:px-6 pt-6 md:pt-10">
        <SeoContentBackButton fallbackHref="/" />
        <DirectoryBrowse
          title={title}
          summary={VENDOR_DIRECTORY_SUMMARY}
          searchValue={params.q || ''}
          onSearchChange={onSearchChange}
          searchPlaceholder="Search cement, plumbing, Dangote, Lagos…"
          quickChips={categoryChips}
          wideChips={[...stateChips, ...optionChips]}
          sections={sections}
          activeFilterCount={activeFilterCount}
          clearHref={PATH}
          resultCount={isLoading ? null : total}
          resultNoun="vendor"
          loading={isLoading}
          sort={sort}
          sortHrefs={{
            best: withDirectoryParams(PATH, params, { sort: undefined }, VENDOR_QUERY_ORDER),
            name: withDirectoryParams(PATH, params, { sort: 'name' }, VENDOR_QUERY_ORDER),
          }}
          page={page}
          totalPages={totalPages}
          pageHref={pageHref}
          columns={columns}
          actions={
            <>
              <DirectoryActionLink href="/vendors/apply" label="List your business" filled />
              <DirectoryActionLink href="/vendors/manage" label="Manage listing" />
              <DirectoryActionLink href="/professionals" label="Find a professional" />
              <DirectoryActionLink href="/tools/price-checker" label="Check market prices" />
            </>
          }
          error={
            isError ? (
              <View style={{ borderWidth: 1, borderColor: LANDING_BORDER, borderRadius: 16, padding: 16, marginBottom: 12 }}>
                <Text style={{ fontFamily: 'Poppins_500Medium', fontSize: 14, color: LANDING_INK }}>
                  Unable to load vendors right now. Please try again shortly.
                </Text>
                <Pressable onPress={() => refetch()} style={{ marginTop: 8 }}>
                  <Text style={{ fontFamily: 'Poppins_600SemiBold', fontSize: 14, color: LANDING_INK }}>Retry</Text>
                </Pressable>
              </View>
            ) : null
          }
          empty={
            <View style={{ borderWidth: 1, borderColor: LANDING_BORDER, borderRadius: 16, padding: 16, marginBottom: 12 }}>
              <Text style={{ fontFamily: 'Poppins_500Medium', fontSize: 14, color: LANDING_INK, marginBottom: 6 }}>
                No listed vendor currently matches this exact search.
              </Text>
              <Text style={{ fontFamily: 'Poppins_400Regular', fontSize: 14, color: LANDING_MUTED, marginBottom: 12 }}>
                Try nearby states, clear filters, check market prices, or ask BuildMyHouse for procurement help.
              </Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                <DirectoryActionLink href={PATH} label="Clear filters" />
                <DirectoryActionLink href="/tools/price-checker" label="Use Price Checker" filled />
              </View>
            </View>
          }
        >
          {vendors.map((vendor) => (
            <VendorCard key={vendor.id} vendor={vendor} />
          ))}
        </DirectoryBrowse>
        <Link href={'/professionals' as any} asChild>
          <Pressable style={{ marginTop: 8, marginBottom: 12 }}>
            <Text style={{ fontFamily: 'Poppins_400Regular', fontSize: 13, color: LANDING_MUTED }}>
              Looking for an architect, engineer, or surveyor? See Professionals →
            </Text>
          </Pressable>
        </Link>
      </View>
      </SeoContentShell>
    </View>
  );
}
