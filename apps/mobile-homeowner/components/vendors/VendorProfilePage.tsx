import { useMemo, useState, type ReactNode } from 'react';
import { Link } from 'expo-router';
import { Image, Linking, Pressable, ScrollView, Text, TextInput, View, useWindowDimensions } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import DirectorySiteHeader from '@/components/directory/DirectorySiteHeader';
import { SeoContentBackButton } from '@/components/seo/SeoContentLayout';
import { SeoHeading } from '@/components/seo/SeoHeading';
import { getBackendAssetUrl } from '@/lib/image';
import { LANDING_BORDER, LANDING_INK, LANDING_MUTED, LANDING_SURFACE } from '@/lib/home-landing-content';
import { initialsFromName } from '@/lib/directory-listing';
import {
  fetchPublicVendorBySlug,
  submitVendorQuoteRequest,
  vendorWhatsAppHref,
  type PublicVendorProfile,
} from '@/lib/public-vendors';
import { buildSeoJsonLd } from '@/lib/seo-schema';
import { useWebSeo } from '@/lib/seo';

type Props = { slug: string };
type Offering = PublicVendorProfile['offerings'][number];
type TabId = 'sell' | 'about';

function formatCategoryLabel(o: Offering): string {
  const raw = (o.customCategoryLabel || o.familyKey || 'Materials').replace(/[-_]/g, ' ');
  return raw.replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function Badge({ label, solid = false }: { label: string; solid?: boolean }) {
  return (
    <View
      accessibilityLabel={label}
      style={{
        backgroundColor: solid ? LANDING_INK : '#fff',
        borderWidth: 1,
        borderColor: solid ? LANDING_INK : LANDING_BORDER,
        borderRadius: 999,
        paddingHorizontal: 10,
        paddingVertical: 4,
        marginRight: 8,
        marginBottom: 8,
      }}
    >
      <Text style={{ fontFamily: 'Poppins_600SemiBold', fontSize: 12, color: solid ? '#fff' : LANDING_INK }}>{label}</Text>
    </View>
  );
}

function ActionButton({
  label,
  onPress,
  filled = false,
  disabled,
  flex,
}: {
  label: string;
  onPress: () => void;
  filled?: boolean;
  disabled?: boolean;
  flex?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      style={{
        backgroundColor: filled ? LANDING_INK : '#fff',
        borderWidth: 1,
        borderColor: LANDING_INK,
        borderRadius: 8,
        paddingHorizontal: 16,
        paddingVertical: 12,
        marginRight: flex ? 0 : 8,
        marginBottom: flex ? 0 : 8,
        opacity: disabled ? 0.5 : 1,
        flex: flex ? 1 : undefined,
        alignItems: 'center',
      }}
    >
      <Text style={{ fontFamily: 'Poppins_600SemiBold', fontSize: 14, color: filled ? '#fff' : LANDING_INK }}>{label}</Text>
    </Pressable>
  );
}

function Fact({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <View style={{ flexGrow: 1, flexBasis: 160, marginBottom: 14, paddingRight: 12 }}>
      <Text style={{ fontFamily: 'Poppins_500Medium', fontSize: 12, color: LANDING_MUTED }}>{label}</Text>
      <Text style={{ fontFamily: 'Poppins_600SemiBold', fontSize: 15, color: LANDING_INK, marginTop: 4 }}>{value}</Text>
    </View>
  );
}

function BrandTypeGrid({
  offerings,
  selectedIndex,
  onSelect,
}: {
  offerings: Offering[];
  selectedIndex: number;
  onSelect: (index: number) => void;
}) {
  const { width } = useWindowDimensions();
  const columns = width >= 900 ? 3 : width >= 640 ? 2 : 1;
  if (!offerings.length) {
    return (
      <Text style={{ fontFamily: 'Poppins_400Regular', fontSize: 14, color: LANDING_MUTED }}>
        This vendor has not published categories yet.
      </Text>
    );
  }
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -6 }}>
      {offerings.map((offering, index) => {
        const selected = index === selectedIndex;
        const count = (offering.brands?.length || 0) + (offering.productTypes?.length || 0);
        return (
          <Pressable
            key={`${formatCategoryLabel(offering)}-${index}`}
            onPress={() => onSelect(index)}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            style={{
              width: `${100 / columns}%`,
              padding: 6,
            }}
          >
            <View
              style={{
                borderWidth: 1,
                borderColor: selected ? LANDING_INK : LANDING_BORDER,
                backgroundColor: selected ? LANDING_INK : '#fff',
                borderRadius: 12,
                minHeight: 96,
                padding: 14,
                justifyContent: 'flex-end',
              }}
            >
              <Text style={{ fontFamily: 'Poppins_500Medium', fontSize: 12, color: selected ? '#D1D5DB' : LANDING_MUTED }}>
                {count > 0 ? `${count} item${count === 1 ? '' : 's'}` : 'Category'}
              </Text>
              <Text style={{ fontFamily: 'Poppins_700Bold', fontSize: 18, color: selected ? '#fff' : LANDING_INK, marginTop: 4 }}>
                {formatCategoryLabel(offering)}
              </Text>
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

function SelectedTypeDetail({ offering }: { offering: Offering }) {
  const brands = offering.brands || [];
  const productTypes = offering.productTypes || [];
  const flags = [
    offering.sellsRetail ? 'Retail' : null,
    offering.sellsWholesale ? 'Wholesale' : null,
    offering.normalUnit ? `Unit: ${offering.normalUnit}` : null,
    offering.minimumOrderQuantity != null
      ? `MOQ: ${offering.minimumOrderQuantity}${offering.minimumOrderUnit ? ` ${offering.minimumOrderUnit}` : ''}`
      : null,
    offering.deliveryAvailable ? 'Delivery' : null,
    offering.stockedNormally ? 'Regularly stocked' : null,
    offering.specialOrder ? 'Special order' : null,
  ].filter(Boolean) as string[];

  return (
    <View style={{ marginTop: 16 }}>
      <Text style={{ fontFamily: 'Poppins_600SemiBold', fontSize: 16, color: LANDING_INK }}>{formatCategoryLabel(offering)}</Text>
      {flags.length ? (
        <Text style={{ fontFamily: 'Poppins_400Regular', fontSize: 13, color: LANDING_MUTED, marginTop: 6 }}>{flags.join(' · ')}</Text>
      ) : null}
      {brands.length ? (
        <ChipRow title="Brands" items={brands} />
      ) : null}
      {productTypes.length ? <ChipRow title="Product types" items={productTypes} /> : null}
      {!brands.length && !productTypes.length ? (
        <Text style={{ fontFamily: 'Poppins_400Regular', fontSize: 14, color: LANDING_MUTED, marginTop: 8 }}>
          No individual brands listed for this category yet.
        </Text>
      ) : null}
      {offering.examplePriceAmount ? (
        <Text style={{ fontFamily: 'Poppins_400Regular', fontSize: 13, color: LANDING_INK, marginTop: 12 }}>
          Example price (vendor claim): ₦{offering.examplePriceAmount}
          {offering.examplePriceUnit ? ` / ${offering.examplePriceUnit}` : ''}. {offering.examplePriceDisclaimer}
        </Text>
      ) : null}
    </View>
  );
}

function ChipRow({ title, items }: { title: string; items: string[] }) {
  return (
    <View style={{ marginTop: 12 }}>
      <Text style={{ fontFamily: 'Poppins_500Medium', fontSize: 12, color: LANDING_MUTED, marginBottom: 8 }}>{title}</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
        {items.map((item) => (
          <View
            key={item}
            style={{
              borderWidth: 1,
              borderColor: LANDING_BORDER,
              borderRadius: 999,
              paddingHorizontal: 12,
              paddingVertical: 6,
              marginRight: 8,
              marginBottom: 8,
              backgroundColor: '#fff',
            }}
          >
            <Text style={{ fontFamily: 'Poppins_500Medium', fontSize: 13, color: LANDING_INK }}>{item}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

function QuoteForm({
  quoteProduct,
  setQuoteProduct,
  quoteQty,
  setQuoteQty,
  quoteLocation,
  setQuoteLocation,
  buyerName,
  setBuyerName,
  buyerPhone,
  setBuyerPhone,
  buyerEmail,
  setBuyerEmail,
  quoteNote,
  setQuoteNote,
  quoteBusy,
  onSend,
}: {
  quoteProduct: string;
  setQuoteProduct: (v: string) => void;
  quoteQty: string;
  setQuoteQty: (v: string) => void;
  quoteLocation: string;
  setQuoteLocation: (v: string) => void;
  buyerName: string;
  setBuyerName: (v: string) => void;
  buyerPhone: string;
  setBuyerPhone: (v: string) => void;
  buyerEmail: string;
  setBuyerEmail: (v: string) => void;
  quoteNote: string;
  setQuoteNote: (v: string) => void;
  quoteBusy: boolean;
  onSend: () => void;
}) {
  const fields = [
    ['Product / material *', quoteProduct, setQuoteProduct],
    ['Quantity', quoteQty, setQuoteQty],
    ['Delivery location', quoteLocation, setQuoteLocation],
    ['Your name *', buyerName, setBuyerName],
    ['Phone', buyerPhone, setBuyerPhone],
    ['Email', buyerEmail, setBuyerEmail],
  ] as const;
  return (
    <View style={{ marginTop: 16, borderWidth: 1, borderColor: LANDING_BORDER, borderRadius: 16, padding: 16, backgroundColor: '#fff' }}>
      <Text style={{ fontFamily: 'Poppins_700Bold', fontSize: 18, color: LANDING_INK, marginBottom: 12 }}>Request a quote</Text>
      {fields.map(([label, value, setter]) => (
        <View key={label} style={{ marginBottom: 10 }}>
          <Text style={{ fontFamily: 'Poppins_500Medium', fontSize: 12, color: LANDING_MUTED, marginBottom: 4 }}>{label}</Text>
          <TextInput
            value={value}
            onChangeText={setter}
            style={{
              borderWidth: 1,
              borderColor: LANDING_BORDER,
              borderRadius: 10,
              paddingHorizontal: 12,
              paddingVertical: 10,
              fontFamily: 'Poppins_400Regular',
              color: LANDING_INK,
            }}
          />
        </View>
      ))}
      <Text style={{ fontFamily: 'Poppins_500Medium', fontSize: 12, color: LANDING_MUTED, marginBottom: 4 }}>Note</Text>
      <TextInput
        value={quoteNote}
        onChangeText={setQuoteNote}
        multiline
        style={{
          borderWidth: 1,
          borderColor: LANDING_BORDER,
          borderRadius: 10,
          paddingHorizontal: 12,
          paddingVertical: 10,
          minHeight: 80,
          fontFamily: 'Poppins_400Regular',
          color: LANDING_INK,
          marginBottom: 12,
        }}
      />
      <ActionButton label={quoteBusy ? 'Sending…' : 'Send quote request'} filled disabled={quoteBusy} onPress={onSend} />
    </View>
  );
}

function AboutBlock({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <View style={{ marginBottom: 14 }}>
      <Text style={{ fontFamily: 'Poppins_600SemiBold', fontSize: 14, color: LANDING_INK }}>{label}</Text>
      <Text style={{ fontFamily: 'Poppins_400Regular', fontSize: 14, color: LANDING_MUTED, marginTop: 4, lineHeight: 22 }}>{value}</Text>
    </View>
  );
}

export default function VendorProfilePage({ slug }: Props) {
  const { width } = useWindowDimensions();
  const compact = width < 768;
  const [tab, setTab] = useState<TabId>('sell');
  const [showVerifiedHelp, setShowVerifiedHelp] = useState(false);
  const [quoteOpen, setQuoteOpen] = useState(false);
  const [quoteProduct, setQuoteProduct] = useState('');
  const [quoteQty, setQuoteQty] = useState('');
  const [quoteLocation, setQuoteLocation] = useState('');
  const [buyerName, setBuyerName] = useState('');
  const [buyerPhone, setBuyerPhone] = useState('');
  const [buyerEmail, setBuyerEmail] = useState('');
  const [quoteNote, setQuoteNote] = useState('');
  const [quoteStatus, setQuoteStatus] = useState<string | null>(null);
  const [quoteBusy, setQuoteBusy] = useState(false);
  const [selectedTypeIndex, setSelectedTypeIndex] = useState(0);
  const [logoFailed, setLogoFailed] = useState(false);

  const { data: vendor, isLoading, isError, error } = useQuery({
    queryKey: ['public-vendor', slug],
    queryFn: () => fetchPublicVendorBySlug(slug),
  });

  const offerings = vendor?.offerings || [];
  const selectedOffering = useMemo(() => {
    if (!offerings.length) return null;
    const idx = Math.min(Math.max(selectedTypeIndex, 0), offerings.length - 1);
    return offerings[idx];
  }, [offerings, selectedTypeIndex]);

  const notFound = isError && String((error as Error)?.message) === 'VENDOR_NOT_FOUND';
  const title = vendor ? vendor.tradingName : 'Vendor profile';
  const description = vendor?.description
    ? vendor.description.slice(0, 155)
    : 'Building-material vendor profile on BuildMyHouse.';

  useWebSeo({
    title: vendor ? `${vendor.tradingName} | BuildMyHouse Vendors` : 'Vendor | BuildMyHouse',
    description,
    canonicalPath: `/vendors/${slug}`,
    robots: vendor ? 'index,follow' : 'noindex,follow',
    jsonLd: vendor
      ? buildSeoJsonLd({
          path: `/vendors/${slug}`,
          title: vendor.tradingName,
          description,
          schemaType: 'Service',
          breadcrumbs: [
            { name: 'Home', path: '/' },
            { name: 'Vendors', path: '/vendors' },
            { name: vendor.tradingName, path: `/vendors/${slug}` },
          ],
        })
      : undefined,
  });

  const whatsappHref = vendorWhatsAppHref(vendor?.publicWhatsApp || vendor?.publicPhone);
  const location = [vendor?.cityLabel, vendor?.stateLabel].filter(Boolean).join(', ');
  const logoSrc = !logoFailed ? getBackendAssetUrl(vendor?.logoUrl) : null;
  const signal =
    vendor?.description?.trim() ||
    'Listed supplier. Contact them for a quote. Any prices are vendor claims, not BuildMyHouse estimates.';
  const sales = [
    vendor?.sellsRetail ? 'Retail' : null,
    vendor?.sellsWholesale ? 'Wholesale' : null,
    vendor?.pickupAvailable ? 'Pickup' : null,
    vendor?.deliveryAvailable ? 'Delivery' : vendor?.deliveryAvailable === false ? 'No delivery' : null,
    vendor?.interstateDelivery ? 'Interstate delivery' : null,
    vendor?.nationwideDelivery ? 'Nationwide delivery' : null,
    vendor?.installationAvailable ? 'Installation' : null,
  ]
    .filter(Boolean)
    .join(' · ');
  const coverage = vendor?.serviceAreas
    ?.map((area) => [area.cityLabel, area.stateLabel].filter(Boolean).join(', ') || area.coverageType)
    .filter(Boolean)
    .join(' · ');

  const sendQuote = async () => {
    setQuoteStatus(null);
    if (!quoteProduct.trim() || !buyerName.trim() || (!buyerPhone.trim() && !buyerEmail.trim())) {
      setQuoteStatus('Add product, your name, and a phone or email.');
      return;
    }
    setQuoteBusy(true);
    try {
      await submitVendorQuoteRequest(slug, {
        product: quoteProduct.trim(),
        quantity: quoteQty.trim() || undefined,
        deliveryLocation: quoteLocation.trim() || undefined,
        buyerName: buyerName.trim(),
        buyerPhone: buyerPhone.trim() || undefined,
        buyerEmail: buyerEmail.trim() || undefined,
        note: quoteNote.trim() || undefined,
      });
      setQuoteStatus('Quote request sent. The vendor and BuildMyHouse can follow up.');
      setQuoteOpen(false);
    } catch (e: any) {
      setQuoteStatus(e?.message || 'Could not send quote request.');
    } finally {
      setQuoteBusy(false);
    }
  };

  const openQuote = () => setQuoteOpen((open) => !open);

  const contactActions = vendor ? (
    <>
      {vendor.publicPhone ? (
        <ActionButton label="Call vendor" filled={!compact} flex={compact} onPress={() => Linking.openURL(`tel:${vendor.publicPhone}`)} />
      ) : null}
      {whatsappHref ? (
        <ActionButton label="WhatsApp" flex={compact} onPress={() => Linking.openURL(whatsappHref)} />
      ) : null}
      <ActionButton label={quoteOpen ? 'Close quote' : 'Request quote'} filled flex={compact} onPress={openQuote} />
    </>
  ) : null;

  let body: ReactNode = null;
  if (isLoading) {
    body = <Text style={{ fontFamily: 'Poppins_400Regular', color: LANDING_MUTED, padding: 24 }}>Loading vendor…</Text>;
  } else if (notFound) {
    body = (
      <View style={{ paddingHorizontal: 24, paddingVertical: 32 }}>
        <SeoHeading level={1} className="text-3xl" style={{ fontFamily: 'Poppins_700Bold', color: LANDING_INK }}>
          Not available
        </SeoHeading>
        <Text style={{ fontFamily: 'Poppins_400Regular', fontSize: 15, color: LANDING_MUTED, marginTop: 8, marginBottom: 16 }}>
          This profile is not publicly listed. It may be awaiting review, suspended, or internal-only.
        </Text>
        <Link href={'/vendors' as any} asChild>
          <Pressable accessibilityRole="link" style={{ alignSelf: 'flex-start', backgroundColor: LANDING_INK, borderRadius: 8, paddingHorizontal: 16, paddingVertical: 12 }}>
            <Text style={{ fontFamily: 'Poppins_600SemiBold', color: '#fff' }}>Browse vendors</Text>
          </Pressable>
        </Link>
      </View>
    );
  } else if (isError) {
    body = (
      <Text style={{ fontFamily: 'Poppins_400Regular', color: LANDING_INK, padding: 24 }}>Unable to load this vendor right now.</Text>
    );
  } else if (vendor) {
    body = (
      <>
        <View style={{ height: compact ? 120 : 168, backgroundColor: LANDING_INK }} accessibilityLabel="Vendor banner" />
        <View style={{ paddingHorizontal: 16, maxWidth: 1120, width: '100%', alignSelf: 'center' }}>
          <View
            style={{
              marginTop: -44,
              width: 88,
              height: 88,
              borderRadius: 16,
              backgroundColor: '#fff',
              borderWidth: 1,
              borderColor: LANDING_BORDER,
              overflow: 'hidden',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {logoSrc ? (
              <Image
                source={{ uri: logoSrc }}
                accessibilityLabel={`${vendor.tradingName} logo`}
                onError={() => setLogoFailed(true)}
                style={{ width: '78%', height: '78%' }}
                resizeMode="contain"
              />
            ) : (
              <Text style={{ fontFamily: 'Poppins_700Bold', fontSize: 28, color: LANDING_INK }}>{initialsFromName(vendor.tradingName)}</Text>
            )}
          </View>

          <SeoHeading level={1} className="text-3xl md:text-4xl mt-4" style={{ fontFamily: 'Poppins_700Bold', color: LANDING_INK }}>
            {title}
          </SeoHeading>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 10 }}>
            <Badge label="Listed" />
            {vendor.isBuildMyHouseVerified ? <Badge label="Verified" solid /> : null}
            {vendor.transparency.bmhRelationship?.startsWith('Previously') ? <Badge label="Used by BMH" /> : null}
          </View>
          <Text numberOfLines={3} style={{ fontFamily: 'Poppins_400Regular', fontSize: 15, color: LANDING_MUTED, marginTop: 4, lineHeight: 22 }}>
            {signal}
          </Text>
          {location ? (
            <Text style={{ fontFamily: 'Poppins_500Medium', fontSize: 14, color: LANDING_INK, marginTop: 8 }}>{location}</Text>
          ) : null}
          <Pressable onPress={() => setShowVerifiedHelp((open) => !open)} accessibilityRole="button" style={{ marginTop: 8, alignSelf: 'flex-start' }}>
            <Text style={{ fontFamily: 'Poppins_600SemiBold', fontSize: 14, color: LANDING_INK, textDecorationLine: 'underline' }}>
              What does Verified mean?
            </Text>
          </Pressable>
          {showVerifiedHelp ? (
            <Text style={{ fontFamily: 'Poppins_400Regular', fontSize: 14, color: LANDING_MUTED, marginTop: 8, lineHeight: 22, maxWidth: 640 }}>
              BuildMyHouse completed defined checks such as business identity, registration where applicable, representative identity, phone reachability, and location evidence. It does not mean the vendor is scam-proof, or that every product is guaranteed genuine. Listing is not the same as verification.
            </Text>
          ) : null}

          {!compact ? <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 16 }}>{contactActions}</View> : null}
          {vendor.publicEmail ? (
            <Pressable onPress={() => Linking.openURL(`mailto:${vendor.publicEmail}`)} accessibilityRole="link" style={{ marginTop: 4 }}>
              <Text style={{ fontFamily: 'Poppins_500Medium', fontSize: 14, color: LANDING_INK }}>Email vendor</Text>
            </Pressable>
          ) : null}
          {vendor.websiteUrl ? (
            <Pressable onPress={() => Linking.openURL(vendor.websiteUrl!)} accessibilityRole="link" style={{ marginTop: 6 }}>
              <Text style={{ fontFamily: 'Poppins_500Medium', fontSize: 14, color: LANDING_INK }}>Website</Text>
            </Pressable>
          ) : null}
          {quoteStatus ? (
            <Text style={{ fontFamily: 'Poppins_400Regular', fontSize: 14, color: LANDING_INK, marginTop: 8 }}>{quoteStatus}</Text>
          ) : null}
          {quoteOpen ? (
            <QuoteForm
              quoteProduct={quoteProduct}
              setQuoteProduct={setQuoteProduct}
              quoteQty={quoteQty}
              setQuoteQty={setQuoteQty}
              quoteLocation={quoteLocation}
              setQuoteLocation={setQuoteLocation}
              buyerName={buyerName}
              setBuyerName={setBuyerName}
              buyerPhone={buyerPhone}
              setBuyerPhone={setBuyerPhone}
              buyerEmail={buyerEmail}
              setBuyerEmail={setBuyerEmail}
              quoteNote={quoteNote}
              setQuoteNote={setQuoteNote}
              quoteBusy={quoteBusy}
              onSend={sendQuote}
            />
          ) : null}

          <View
            style={{
              marginTop: 20,
              borderWidth: 1,
              borderColor: LANDING_BORDER,
              borderRadius: 16,
              padding: 16,
              backgroundColor: LANDING_SURFACE,
              flexDirection: 'row',
              flexWrap: 'wrap',
            }}
          >
            <Fact label="Location" value={location || 'Nigeria'} />
            <Fact label="Sales" value={sales || null} />
            <Fact label="Coverage" value={coverage || null} />
            <Fact label="Listing status" value={vendor.transparency.verificationLabel || vendor.transparency.listingLabel} />
            <Fact label="Last updated" value={vendor.lastUpdatedAt ? new Date(vendor.lastUpdatedAt).toLocaleDateString('en-GB') : null} />
          </View>

          <View style={{ flexDirection: 'row', marginTop: 24, borderBottomWidth: 1, borderColor: LANDING_BORDER }}>
            {(
              [
                ['sell', 'What they sell'],
                ['about', 'About'],
              ] as const
            ).map(([id, label]) => {
              const active = tab === id;
              return (
                <Pressable
                  key={id}
                  onPress={() => setTab(id)}
                  accessibilityRole="tab"
                  accessibilityState={{ selected: active }}
                  style={{ paddingVertical: 12, marginRight: 20, borderBottomWidth: 2, borderBottomColor: active ? LANDING_INK : 'transparent' }}
                >
                  <Text style={{ fontFamily: active ? 'Poppins_600SemiBold' : 'Poppins_500Medium', fontSize: 15, color: active ? LANDING_INK : LANDING_MUTED }}>
                    {label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <View style={{ paddingVertical: 20 }}>
            {tab === 'sell' ? (
              <>
                <Text style={{ fontFamily: 'Poppins_400Regular', fontSize: 14, color: LANDING_MUTED, marginBottom: 12 }}>
                  Select a category to see brands and commercial details.
                </Text>
                <BrandTypeGrid
                  offerings={offerings}
                  selectedIndex={Math.min(selectedTypeIndex, Math.max(offerings.length - 1, 0))}
                  onSelect={setSelectedTypeIndex}
                />
                {selectedOffering ? <SelectedTypeDetail offering={selectedOffering} /> : null}
              </>
            ) : (
              <>
                <AboutBlock label="About" value={vendor.description} />
                <AboutBlock label="Business types" value={vendor.businessTypes.join(', ')} />
                <AboutBlock label="Years in business" value={vendor.yearsInBusiness != null ? `${vendor.yearsInBusiness}+ years` : null} />
                <AboutBlock label="Business hours" value={vendor.businessHours} />
                {vendor.representative ? (
                  <AboutBlock
                    label="Business representative"
                    value={`${vendor.representative.name}${vendor.representative.role ? ` — ${vendor.representative.role}` : ''}`}
                  />
                ) : null}
                <AboutBlock label="Business identity" value={vendor.transparency.businessIdentity} />
                <AboutBlock label="Location evidence" value={vendor.transparency.locationEvidence} />
                <AboutBlock label="Registration" value={vendor.transparency.registration} />
                <AboutBlock label="Pricing" value={vendor.transparency.pricingDisclaimer} />
                <AboutBlock label="BuildMyHouse relationship" value={vendor.transparency.bmhRelationship} />
                <Link href={'/tools/price-checker' as any} asChild>
                  <Pressable accessibilityRole="link" style={{ marginTop: 8, alignSelf: 'flex-start', borderWidth: 1, borderColor: LANDING_INK, borderRadius: 8, paddingHorizontal: 16, paddingVertical: 12 }}>
                    <Text style={{ fontFamily: 'Poppins_600SemiBold', fontSize: 14, color: LANDING_INK }}>Check market prices</Text>
                  </Pressable>
                </Link>
              </>
            )}
          </View>
        </View>
      </>
    );
  }

  return (
    <View className="flex-1 bg-white">
      <DirectorySiteHeader current="vendors" />
      <ScrollView
        className="flex-1"
        style={{ backgroundColor: '#fff' }}
        contentContainerStyle={{ paddingBottom: compact && vendor ? 96 : 32 }}
        keyboardShouldPersistTaps="handled"
      >
        <View style={{ paddingHorizontal: 16, paddingTop: 16, maxWidth: 1120, width: '100%', alignSelf: 'center' }}>
          <SeoContentBackButton fallbackHref="/vendors" />
        </View>
        {body}
      </ScrollView>
      {compact && vendor ? (
        <View
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: '#fff',
            borderTopWidth: 1,
            borderTopColor: LANDING_BORDER,
            flexDirection: 'row',
            gap: 8,
            paddingHorizontal: 12,
            paddingVertical: 10,
          }}
        >
          {contactActions}
        </View>
      ) : null}
    </View>
  );
}
