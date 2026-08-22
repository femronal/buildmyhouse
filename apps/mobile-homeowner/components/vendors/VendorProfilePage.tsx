import { useMemo, useState, type ReactNode } from 'react';
import { Link } from 'expo-router';
import { Image, Linking, Pressable, ScrollView, Text, TextInput, View, useWindowDimensions } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { SeoHeading } from '@/components/seo/SeoHeading';
import { getBackendAssetUrl } from '@/lib/image';
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

const INK = '#000000';
const PAPER = '#FFFFFF';
const STROKE = 3;

function formatCategoryLabel(o: Offering): string {
  const raw = (o.customCategoryLabel || o.familyKey || 'Materials').replace(/[-_]/g, ' ');
  return raw.toUpperCase();
}

function Rule() {
  return <View style={{ height: STROKE, backgroundColor: INK, width: '100%' }} />;
}

function MonoLabel({
  children,
  color = INK,
}: {
  children: string;
  color?: string;
}) {
  return (
    <Text
      className="text-[11px] uppercase"
      style={{
        fontFamily: 'JetBrainsMono_500Medium',
        color,
        letterSpacing: 2,
      }}
    >
      {children}
    </Text>
  );
}

function Info({ label, value, invert = false }: { label: string; value?: string | null; invert?: boolean }) {
  if (!value) return null;
  const color = invert ? PAPER : INK;
  return (
    <View className="mb-5">
      <MonoLabel color={color}>{label}</MonoLabel>
      <Text
        className="text-lg md:text-xl leading-snug mt-1"
        style={{ fontFamily: 'Poppins_700Bold', color }}
      >
        {value}
      </Text>
    </View>
  );
}

function SystemButton({
  label,
  onPress,
  /** On black hero: white fill. On white paper: black fill. */
  onDark = false,
  outline = false,
  disabled,
}: {
  label: string;
  onPress: () => void;
  onDark?: boolean;
  outline?: boolean;
  disabled?: boolean;
}) {
  const filled = !outline;
  const bg = filled ? (onDark ? PAPER : INK) : onDark ? INK : PAPER;
  const fg = filled ? (onDark ? INK : PAPER) : onDark ? PAPER : INK;
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      className="px-5 py-3 mr-2 mb-2"
      style={{
        backgroundColor: bg,
        borderWidth: STROKE,
        borderColor: onDark ? PAPER : INK,
        opacity: disabled ? 0.4 : 1,
      }}
    >
      <Text
        className="text-xs uppercase"
        style={{
          fontFamily: 'JetBrainsMono_500Medium',
          color: fg,
          letterSpacing: 1.5,
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}

function PaperSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View style={{ backgroundColor: PAPER }}>
      <Rule />
      <View className="px-5 md:px-10 py-10 md:py-14 w-full max-w-[1100px] self-center">
        <SeoHeading
          level={2}
          className="text-3xl md:text-5xl leading-none mb-8 uppercase"
          style={{ fontFamily: 'Poppins_800ExtraBold', color: INK }}
        >
          {title}
        </SeoHeading>
        {children}
      </View>
    </View>
  );
}

/**
 * Bottom grid: one card per offering category / brand type.
 * Click selects that type and lists its brands + commercial details below.
 */
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
  const columns = width >= 900 ? Math.min(4, Math.max(offerings.length, 1)) : width >= 640 ? 2 : 1;

  if (!offerings.length) {
    return (
      <View style={{ borderTopWidth: STROKE, borderColor: INK }}>
        <View className="min-h-[140px] px-5 py-8 justify-end" style={{ borderBottomWidth: STROKE, borderColor: INK }}>
          <Text
            className="text-2xl uppercase"
            style={{ fontFamily: 'Poppins_800ExtraBold', color: INK }}
          >
            No categories yet
          </Text>
          <MonoLabel>Vendor has not published brand types</MonoLabel>
        </View>
      </View>
    );
  }

  return (
    <View
      className="flex-row flex-wrap"
      style={{ borderTopWidth: STROKE, borderColor: INK }}
    >
      {offerings.map((o, idx) => {
        const selected = idx === selectedIndex;
        const brandCount = o.brands?.length || 0;
        const itemCount = (o.productTypes?.length || 0) + brandCount;
        return (
          <Pressable
            key={`${formatCategoryLabel(o)}-${idx}`}
            onPress={() => onSelect(idx)}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            className="min-h-[160px] md:min-h-[200px] px-5 py-5 justify-end"
            style={{
              width: `${100 / columns}%`,
              backgroundColor: selected ? INK : PAPER,
              borderBottomWidth: STROKE,
              borderRightWidth: (idx + 1) % columns === 0 ? 0 : STROKE,
              borderColor: INK,
            }}
          >
            <MonoLabel color={selected ? PAPER : INK}>
              {itemCount > 0 ? `${itemCount} ITEM${itemCount === 1 ? '' : 'S'}` : 'CATEGORY'}
            </MonoLabel>
            <Text
              className="text-2xl md:text-3xl uppercase mt-2"
              style={{
                fontFamily: 'Poppins_800ExtraBold',
                color: selected ? PAPER : INK,
              }}
            >
              {formatCategoryLabel(o)}
            </Text>
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

  const items =
    brands.length > 0
      ? brands.map((b) => ({ kind: 'BRAND', label: b }))
      : productTypes.length > 0
        ? productTypes.map((p) => ({ kind: 'TYPE', label: p }))
        : [{ kind: 'LINE', label: formatCategoryLabel(offering) }];

  // If both brands and product types exist, list brands first then types.
  const rows =
    brands.length && productTypes.length
      ? [
          ...brands.map((b) => ({ kind: 'BRAND', label: b })),
          ...productTypes.map((p) => ({ kind: 'TYPE', label: p })),
        ]
      : items;

  return (
    <View style={{ backgroundColor: PAPER, borderBottomWidth: STROKE, borderColor: INK }}>
      <View className="px-5 md:px-10 py-8 w-full max-w-[1100px] self-center">
        <MonoLabel>Selected brand type</MonoLabel>
        <Text
          className="text-3xl md:text-4xl uppercase mt-2 mb-6"
          style={{ fontFamily: 'Poppins_800ExtraBold', color: INK }}
        >
          {formatCategoryLabel(offering)}
        </Text>

        {flags.length ? (
          <Text
            className="text-xs uppercase mb-6"
            style={{ fontFamily: 'JetBrainsMono_500Medium', color: INK, letterSpacing: 1 }}
          >
            {flags.join(' · ')}
          </Text>
        ) : null}

        <View style={{ borderTopWidth: STROKE, borderColor: INK }}>
          {rows.map((row, i) => (
            <View
              key={`${row.kind}-${row.label}-${i}`}
              className="flex-row items-end justify-between py-4"
              style={{ borderBottomWidth: STROKE, borderColor: INK }}
            >
              <View className="flex-1 pr-4">
                <MonoLabel>{row.kind}</MonoLabel>
                <Text
                  className="text-xl md:text-2xl uppercase mt-1"
                  style={{ fontFamily: 'Poppins_800ExtraBold', color: INK }}
                >
                  {row.label.toUpperCase()}
                </Text>
              </View>
            </View>
          ))}
        </View>

        {offering.examplePriceAmount ? (
          <Text className="text-sm mt-6" style={{ fontFamily: 'Poppins_400Regular', color: INK }}>
            Example price (vendor claim): ₦{offering.examplePriceAmount}
            {offering.examplePriceUnit ? ` / ${offering.examplePriceUnit}` : ''}.{' '}
            {offering.examplePriceDisclaimer}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

export default function VendorProfilePage({ slug }: Props) {
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
  const logoSrc = getBackendAssetUrl(vendor?.logoUrl);

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

  const inputStyle = {
    borderWidth: STROKE,
    borderColor: PAPER,
    fontFamily: 'Poppins_400Regular' as const,
    color: PAPER,
    backgroundColor: INK,
    outlineStyle: 'none' as any,
  };

  return (
    <ScrollView
      className="flex-1"
      style={{ backgroundColor: PAPER }}
      contentContainerStyle={{ paddingBottom: 0 }}
      keyboardShouldPersistTaps="handled"
    >
      {/* Header — white bar, thick black rules */}
      <View style={{ backgroundColor: PAPER }}>
        <Rule />
        <View className="px-5 md:px-10 py-4 flex-row items-center justify-between w-full max-w-[1100px] self-center">
          <Link href={'/' as any} asChild>
            <Pressable accessibilityRole="link">
              <Text
                className="text-sm md:text-base uppercase"
                style={{ fontFamily: 'Poppins_800ExtraBold', color: INK, letterSpacing: 1 }}
              >
                BuildMyHouse
              </Text>
            </Pressable>
          </Link>
          <View className="flex-row items-center gap-5">
            <Link href={'/vendors' as any} asChild>
              <Pressable accessibilityRole="link">
                <MonoLabel>Index</MonoLabel>
              </Pressable>
            </Link>
            <Link href={'/tools/price-checker' as any} asChild>
              <Pressable accessibilityRole="link">
                <MonoLabel>Prices</MonoLabel>
              </Pressable>
            </Link>
          </View>
        </View>
        <Rule />
      </View>

      {isLoading ? (
        <View className="px-5 py-16" style={{ backgroundColor: INK }}>
          <MonoLabel color={PAPER}>Loading vendor…</MonoLabel>
        </View>
      ) : null}

      {notFound ? (
        <View style={{ backgroundColor: INK }} className="px-5 md:px-10 py-16">
          <SeoHeading
            level={1}
            className="text-5xl md:text-7xl leading-none uppercase mb-6"
            style={{ fontFamily: 'Poppins_800ExtraBold', color: PAPER }}
          >
            Not available
          </SeoHeading>
          <Text className="text-base mb-8 max-w-[32rem]" style={{ fontFamily: 'Poppins_400Regular', color: PAPER }}>
            This profile is not publicly listed. It may be awaiting review, suspended, or internal-only.
          </Text>
          <Link href={'/vendors' as any} asChild>
            <Pressable
              className="px-5 py-3 self-start"
              style={{ backgroundColor: PAPER, borderWidth: STROKE, borderColor: PAPER }}
              accessibilityRole="link"
            >
              <Text
                className="text-xs uppercase"
                style={{ fontFamily: 'JetBrainsMono_500Medium', color: INK, letterSpacing: 1.5 }}
              >
                Browse_vendors
              </Text>
            </Pressable>
          </Link>
        </View>
      ) : null}

      {isError && !notFound ? (
        <View className="px-5 py-10">
          <Text style={{ fontFamily: 'Poppins_400Regular', color: INK }}>
            Unable to load this vendor right now.
          </Text>
        </View>
      ) : null}

      {vendor ? (
        <>
          {/* Black hero */}
          <View style={{ backgroundColor: INK }}>
            <View className="px-5 md:px-10 py-12 md:py-16 w-full max-w-[1100px] self-center">
              <View className="flex-row flex-wrap items-start gap-6 mb-8">
                {logoSrc ? (
                  <View
                    className="w-24 h-24 md:w-32 md:h-32 overflow-hidden"
                    style={{ borderWidth: STROKE, borderColor: PAPER }}
                  >
                    <Image
                      source={{ uri: logoSrc }}
                      style={{ width: '100%', height: '100%' }}
                      resizeMode="cover"
                      accessibilityLabel={`${vendor.tradingName} logo`}
                    />
                  </View>
                ) : (
                  <View
                    className="w-24 h-24 md:w-32 md:h-32 items-center justify-center"
                    style={{ borderWidth: STROKE, borderColor: PAPER }}
                  >
                    <Text
                      className="text-4xl"
                      style={{ fontFamily: 'Poppins_800ExtraBold', color: PAPER }}
                    >
                      {(vendor.tradingName || 'V').slice(0, 1).toUpperCase()}
                    </Text>
                  </View>
                )}

                <View className="flex-1 min-w-[220px]">
                  <View className="flex-row flex-wrap items-center gap-3 mb-4">
                    {vendor.isBuildMyHouseVerified ? (
                      <Pressable
                        onPress={() => setShowVerifiedHelp((v) => !v)}
                        className="px-3 py-1"
                        style={{ backgroundColor: PAPER }}
                      >
                        <Text
                          className="text-[10px] uppercase"
                          style={{
                            fontFamily: 'JetBrainsMono_500Medium',
                            color: INK,
                            letterSpacing: 1,
                          }}
                        >
                          Verified
                        </Text>
                      </Pressable>
                    ) : (
                      <View className="px-3 py-1" style={{ borderWidth: 2, borderColor: PAPER }}>
                        <Text
                          className="text-[10px] uppercase"
                          style={{
                            fontFamily: 'JetBrainsMono_500Medium',
                            color: PAPER,
                            letterSpacing: 1,
                          }}
                        >
                          Listed
                        </Text>
                      </View>
                    )}
                    <Pressable onPress={() => setShowVerifiedHelp((v) => !v)}>
                      <Text
                        className="text-[10px] uppercase underline"
                        style={{ fontFamily: 'JetBrainsMono_500Medium', color: PAPER }}
                      >
                        What does verified mean?
                      </Text>
                    </Pressable>
                  </View>

                  <SeoHeading
                    level={1}
                    className="text-5xl md:text-7xl leading-[0.92] uppercase"
                    style={{ fontFamily: 'Poppins_800ExtraBold', color: PAPER }}
                  >
                    {title}
                  </SeoHeading>
                </View>
              </View>

              {vendor.description ? (
                <View className="flex-row mb-8 max-w-[40rem]">
                  <View style={{ width: STROKE, backgroundColor: PAPER, marginRight: 16 }} />
                  <Text
                    className="text-base md:text-lg leading-6 flex-1 uppercase"
                    style={{ fontFamily: 'Poppins_400Regular', color: PAPER }}
                  >
                    {vendor.description}
                  </Text>
                </View>
              ) : (
                <View className="flex-row mb-8 max-w-[40rem]">
                  <View style={{ width: STROKE, backgroundColor: PAPER, marginRight: 16 }} />
                  <Text
                    className="text-base md:text-lg leading-6 flex-1 uppercase"
                    style={{ fontFamily: 'Poppins_400Regular', color: PAPER }}
                  >
                    Stripped supplier signal. Contact for quotes. Prices are vendor claims.
                  </Text>
                </View>
              )}

              {showVerifiedHelp ? (
                <View className="mb-8 p-5" style={{ borderWidth: STROKE, borderColor: PAPER }}>
                  <MonoLabel color={PAPER}>What BuildMyHouse Verified means</MonoLabel>
                  <Text className="text-sm mt-3 leading-5" style={{ fontFamily: 'Poppins_400Regular', color: PAPER }}>
                    BuildMyHouse completed defined checks such as business identity, registration where applicable,
                    representative identity, phone reachability, and location evidence. It does not mean the vendor is
                    scam-proof, or that every product is guaranteed genuine.
                  </Text>
                </View>
              ) : null}

              <View className="flex-row flex-wrap">
                {vendor.publicPhone ? (
                  <SystemButton
                    label="Call_vendor"
                    onDark
                    onPress={() => Linking.openURL(`tel:${vendor.publicPhone}`)}
                  />
                ) : null}
                {whatsappHref ? (
                  <SystemButton label="WhatsApp" onDark outline onPress={() => Linking.openURL(whatsappHref)} />
                ) : null}
                {vendor.publicEmail ? (
                  <SystemButton
                    label="Email"
                    onDark
                    outline
                    onPress={() => Linking.openURL(`mailto:${vendor.publicEmail}`)}
                  />
                ) : null}
                {vendor.websiteUrl ? (
                  <SystemButton
                    label="Website"
                    onDark
                    outline
                    onPress={() => Linking.openURL(vendor.websiteUrl!)}
                  />
                ) : null}
                <SystemButton
                  label={quoteOpen ? 'Close_quote' : 'Request_quote'}
                  onDark
                  outline={quoteOpen}
                  onPress={() => setQuoteOpen((v) => !v)}
                />
              </View>

              {quoteStatus ? (
                <Text className="text-sm mt-4" style={{ fontFamily: 'Poppins_400Regular', color: PAPER }}>
                  {quoteStatus}
                </Text>
              ) : null}

              {quoteOpen ? (
                <View className="mt-8 pt-8" style={{ borderTopWidth: STROKE, borderTopColor: PAPER }}>
                  <Text
                    className="text-xl uppercase mb-5"
                    style={{ fontFamily: 'Poppins_800ExtraBold', color: PAPER }}
                  >
                    Request a quote
                  </Text>
                  {(
                    [
                      ['Product / material *', quoteProduct, setQuoteProduct],
                      ['Quantity', quoteQty, setQuoteQty],
                      ['Delivery location', quoteLocation, setQuoteLocation],
                      ['Your name *', buyerName, setBuyerName],
                      ['Phone', buyerPhone, setBuyerPhone],
                      ['Email', buyerEmail, setBuyerEmail],
                    ] as const
                  ).map(([label, value, setter]) => (
                    <View key={label} className="mb-3">
                      <MonoLabel color={PAPER}>{label}</MonoLabel>
                      <TextInput
                        value={value}
                        onChangeText={setter}
                        className="px-3 py-3 text-base mt-1"
                        style={inputStyle}
                        placeholderTextColor="#888"
                      />
                    </View>
                  ))}
                  <MonoLabel color={PAPER}>Note</MonoLabel>
                  <TextInput
                    value={quoteNote}
                    onChangeText={setQuoteNote}
                    multiline
                    className="px-3 py-3 text-base mt-1 mb-4 min-h-[88px]"
                    style={inputStyle}
                  />
                  <SystemButton
                    label={quoteBusy ? 'Sending…' : 'Send_quote_request'}
                    onDark
                    disabled={quoteBusy}
                    onPress={sendQuote}
                  />
                </View>
              ) : null}
            </View>
          </View>

          {/* Who they are */}
          <PaperSection title="Who they are">
            <Info label="Location" value={location} />
            <Info label="Business types" value={vendor.businessTypes.join(', ')} />
            <Info
              label="Years in business"
              value={vendor.yearsInBusiness != null ? `${vendor.yearsInBusiness}+ years` : null}
            />
            <Info label="Business hours" value={vendor.businessHours} />
            {vendor.representative ? (
              <Info
                label="Business representative"
                value={`${vendor.representative.name}${vendor.representative.role ? ` — ${vendor.representative.role}` : ''}`}
              />
            ) : null}
            <Info
              label="Sales"
              value={[
                vendor.sellsRetail ? 'Retail' : null,
                vendor.sellsWholesale ? 'Wholesale' : null,
                vendor.pickupAvailable ? 'Pickup' : null,
                vendor.deliveryAvailable ? 'Delivery' : null,
                vendor.interstateDelivery ? 'Interstate delivery' : null,
                vendor.nationwideDelivery ? 'Nationwide delivery' : null,
                vendor.installationAvailable ? 'Installation' : null,
              ]
                .filter(Boolean)
                .join(' · ')}
            />
          </PaperSection>

          {/* What they sell — brand-type cards + item list */}
          <View style={{ backgroundColor: PAPER }}>
            <Rule />
            <View className="px-5 md:px-10 py-10 md:py-12 w-full max-w-[1100px] self-center">
              <SeoHeading
                level={2}
                className="text-3xl md:text-5xl leading-none uppercase"
                style={{ fontFamily: 'Poppins_800ExtraBold', color: INK }}
              >
                What they sell
              </SeoHeading>
              <Text className="text-sm mt-3 mb-2 uppercase" style={{ fontFamily: 'JetBrainsMono_500Medium', color: INK }}>
                Select a brand type to list items
              </Text>
            </View>
            <BrandTypeGrid
              offerings={offerings}
              selectedIndex={Math.min(selectedTypeIndex, Math.max(offerings.length - 1, 0))}
              onSelect={setSelectedTypeIndex}
            />
            {selectedOffering ? <SelectedTypeDetail offering={selectedOffering} /> : null}
          </View>

          {/* Transparency */}
          <PaperSection title="Transparency">
            <Info label="Vendor status" value={vendor.transparency.verificationLabel} />
            <Info
              label="Information last updated"
              value={new Date(vendor.lastUpdatedAt).toLocaleDateString()}
            />
            <Info label="Business identity" value={vendor.transparency.businessIdentity} />
            <Info label="Location evidence" value={vendor.transparency.locationEvidence} />
            <Info label="Registration" value={vendor.transparency.registration} />
            <Info label="Pricing" value={vendor.transparency.pricingDisclaimer} />
            <Info label="BuildMyHouse relationship" value={vendor.transparency.bmhRelationship} />
          </PaperSection>

          {/* Price checker CTA */}
          <View style={{ backgroundColor: INK }}>
            <View className="px-5 md:px-10 py-12 w-full max-w-[1100px] self-center">
              <Text
                className="text-lg md:text-xl mb-6 max-w-[36rem] uppercase"
                style={{ fontFamily: 'Poppins_400Regular', color: PAPER }}
              >
                Before contacting a supplier, you can compare independent market-price research.
              </Text>
              <Link href={'/tools/price-checker' as any} asChild>
                <Pressable
                  className="px-5 py-3 self-start"
                  style={{ backgroundColor: PAPER, borderWidth: STROKE, borderColor: PAPER }}
                  accessibilityRole="link"
                >
                  <Text
                    className="text-xs uppercase"
                    style={{ fontFamily: 'JetBrainsMono_500Medium', color: INK, letterSpacing: 1.5 }}
                  >
                    Check_market_price
                  </Text>
                </Pressable>
              </Link>
            </View>
            <Rule />
          </View>
        </>
      ) : null}
    </ScrollView>
  );
}
