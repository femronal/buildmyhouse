import { useState, type ReactNode } from 'react';
import { Link } from 'expo-router';
import { Image, Linking, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { SeoHeading } from '@/components/seo/SeoHeading';
import { getBackendAssetUrl } from '@/lib/image';
import {
  fetchPublicVendorBySlug,
  submitVendorQuoteRequest,
  vendorWhatsAppHref,
} from '@/lib/public-vendors';
import { buildSeoJsonLd } from '@/lib/seo-schema';
import { useWebSeo } from '@/lib/seo';

type Props = { slug: string };

const INK = '#000000';
const PAPER = '#FFFFFF';
const RULE = '#000000';

function Rule({ heavy = false }: { heavy?: boolean }) {
  return (
    <View
      style={{
        height: heavy ? 4 : 1,
        backgroundColor: RULE,
        width: '100%',
      }}
    />
  );
}

function Label({ children }: { children: string }) {
  return (
    <Text
      className="text-[11px] mb-1 uppercase"
      style={{
        fontFamily: 'JetBrainsMono_500Medium',
        color: INK,
        letterSpacing: 2,
      }}
    >
      {children}
    </Text>
  );
}

function Value({ children }: { children: string }) {
  return (
    <Text
      className="text-lg md:text-xl leading-snug mb-5"
      style={{ fontFamily: 'Poppins_700Bold', color: INK }}
    >
      {children}
    </Text>
  );
}

function Info({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <View>
      <Label>{label}</Label>
      <Value>{value}</Value>
    </View>
  );
}

function BrutalButton({
  label,
  onPress,
  filled = false,
  disabled,
}: {
  label: string;
  onPress: () => void;
  filled?: boolean;
  disabled?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      className="px-5 py-3 mr-2 mb-2"
      style={{
        backgroundColor: filled ? INK : PAPER,
        borderWidth: 2,
        borderColor: INK,
        opacity: disabled ? 0.45 : 1,
      }}
    >
      <Text
        className="text-sm uppercase"
        style={{
          fontFamily: 'Poppins_800ExtraBold',
          color: filled ? PAPER : INK,
          letterSpacing: 1,
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View className="py-10 md:py-14">
      <SeoHeading
        level={2}
        className="text-3xl md:text-5xl leading-none mb-8 uppercase"
        style={{ fontFamily: 'Poppins_800ExtraBold', color: INK }}
      >
        {title}
      </SeoHeading>
      {children}
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

  const { data: vendor, isLoading, isError, error } = useQuery({
    queryKey: ['public-vendor', slug],
    queryFn: () => fetchPublicVendorBySlug(slug),
  });

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
    borderWidth: 2,
    borderColor: INK,
    fontFamily: 'Poppins_400Regular' as const,
    color: INK,
    backgroundColor: PAPER,
    outlineStyle: 'none' as any,
  };

  return (
    <ScrollView
      className="flex-1"
      style={{ backgroundColor: PAPER }}
      contentContainerStyle={{ paddingBottom: 48 }}
      keyboardShouldPersistTaps="handled"
    >
      <View className="w-full max-w-[1040px] self-center px-5 md:px-8 pt-8 pb-16">
        <Link href={'/vendors' as any} asChild>
          <Pressable
            accessibilityRole="link"
            accessibilityLabel="Back to vendors"
            className="w-12 h-12 items-center justify-center mb-8"
            style={{ borderWidth: 2, borderColor: INK, backgroundColor: PAPER }}
          >
            <Text style={{ fontFamily: 'Poppins_800ExtraBold', color: INK, fontSize: 22 }}>←</Text>
          </Pressable>
        </Link>

        {isLoading ? (
          <Text className="text-base uppercase" style={{ fontFamily: 'JetBrainsMono_500Medium', color: INK }}>
            Loading vendor…
          </Text>
        ) : null}

        {notFound ? (
          <View>
            <Rule heavy />
            <SeoHeading
              level={1}
              className="text-5xl md:text-7xl leading-none my-8 uppercase"
              style={{ fontFamily: 'Poppins_800ExtraBold', color: INK }}
            >
              Vendor not available
            </SeoHeading>
            <Text className="text-lg mb-8" style={{ fontFamily: 'Poppins_400Regular', color: INK }}>
              This profile is not publicly listed. It may be awaiting review, suspended, or internal-only.
            </Text>
            <Link href={'/vendors' as any} asChild>
              <Pressable
                className="px-5 py-3 self-start mb-8"
                style={{ backgroundColor: INK, borderWidth: 2, borderColor: INK }}
                accessibilityRole="link"
              >
                <Text
                  className="text-sm uppercase"
                  style={{ fontFamily: 'Poppins_800ExtraBold', color: PAPER, letterSpacing: 1 }}
                >
                  Browse vendors
                </Text>
              </Pressable>
            </Link>
            <Rule heavy />
          </View>
        ) : null}

        {isError && !notFound ? (
          <Text className="text-base" style={{ fontFamily: 'Poppins_400Regular', color: INK }}>
            Unable to load this vendor right now.
          </Text>
        ) : null}

        {vendor ? (
          <>
            {/* Hero */}
            <Rule heavy />
            <View className="py-10 md:py-14">
              <View className="flex-row flex-wrap items-stretch gap-6 mb-8">
                {logoSrc ? (
                  <View
                    className="w-28 h-28 md:w-40 md:h-40 overflow-hidden"
                    style={{ borderWidth: 3, borderColor: INK, backgroundColor: INK }}
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
                    className="w-28 h-28 md:w-40 md:h-40 items-center justify-center"
                    style={{ backgroundColor: INK }}
                  >
                    <Text
                      className="text-4xl md:text-5xl"
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
                        style={{ backgroundColor: INK }}
                      >
                        <Text
                          className="text-[10px] uppercase"
                          style={{ fontFamily: 'Poppins_800ExtraBold', color: PAPER, letterSpacing: 1 }}
                        >
                          BuildMyHouse Verified
                        </Text>
                      </Pressable>
                    ) : (
                      <View className="px-3 py-1" style={{ borderWidth: 2, borderColor: INK }}>
                        <Text
                          className="text-[10px] uppercase"
                          style={{ fontFamily: 'Poppins_800ExtraBold', color: INK, letterSpacing: 1 }}
                        >
                          Listed
                        </Text>
                      </View>
                    )}
                    <Pressable onPress={() => setShowVerifiedHelp((v) => !v)}>
                      <Text
                        className="text-xs uppercase underline"
                        style={{ fontFamily: 'JetBrainsMono_500Medium', color: INK }}
                      >
                        What does verified mean?
                      </Text>
                    </Pressable>
                  </View>

                  <SeoHeading
                    level={1}
                    className="text-4xl md:text-7xl leading-[0.95] uppercase"
                    style={{ fontFamily: 'Poppins_800ExtraBold', color: INK }}
                  >
                    {title}
                  </SeoHeading>
                </View>
              </View>

              {vendor.description ? (
                <Text
                  className="text-lg md:text-2xl leading-snug mb-8 max-w-[46rem]"
                  style={{ fontFamily: 'Poppins_400Regular', color: INK }}
                >
                  {vendor.description}
                </Text>
              ) : null}

              {showVerifiedHelp ? (
                <View className="mb-8 p-5" style={{ borderWidth: 2, borderColor: INK }}>
                  <Text
                    className="text-sm uppercase mb-3"
                    style={{ fontFamily: 'Poppins_800ExtraBold', color: INK, letterSpacing: 1 }}
                  >
                    What BuildMyHouse Verified means
                  </Text>
                  <Text className="text-base leading-6" style={{ fontFamily: 'Poppins_400Regular', color: INK }}>
                    BuildMyHouse completed defined checks such as business identity, registration where applicable,
                    representative identity, phone reachability, and location evidence. It does not mean the vendor is
                    scam-proof, or that every product is guaranteed genuine.
                  </Text>
                </View>
              ) : null}

              <View className="flex-row flex-wrap">
                {vendor.publicPhone ? (
                  <BrutalButton
                    label="Call vendor"
                    filled
                    onPress={() => Linking.openURL(`tel:${vendor.publicPhone}`)}
                  />
                ) : null}
                {whatsappHref ? (
                  <BrutalButton label="WhatsApp" onPress={() => Linking.openURL(whatsappHref)} />
                ) : null}
                {vendor.publicEmail ? (
                  <BrutalButton
                    label="Email"
                    onPress={() => Linking.openURL(`mailto:${vendor.publicEmail}`)}
                  />
                ) : null}
                {vendor.websiteUrl ? (
                  <BrutalButton label="Website" onPress={() => Linking.openURL(vendor.websiteUrl!)} />
                ) : null}
                <BrutalButton
                  label="Request a quote"
                  onPress={() => setQuoteOpen((v) => !v)}
                />
              </View>

              {quoteStatus ? (
                <Text className="text-sm mt-4" style={{ fontFamily: 'Poppins_400Regular', color: INK }}>
                  {quoteStatus}
                </Text>
              ) : null}

              {quoteOpen ? (
                <View className="mt-8 pt-8" style={{ borderTopWidth: 2, borderTopColor: INK }}>
                  <Text
                    className="text-xl uppercase mb-5"
                    style={{ fontFamily: 'Poppins_800ExtraBold', color: INK }}
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
                      <Label>{label}</Label>
                      <TextInput
                        value={value}
                        onChangeText={setter}
                        className="px-3 py-3 text-base"
                        style={inputStyle}
                      />
                    </View>
                  ))}
                  <Label>Note</Label>
                  <TextInput
                    value={quoteNote}
                    onChangeText={setQuoteNote}
                    multiline
                    className="px-3 py-3 text-base mb-4 min-h-[88px]"
                    style={inputStyle}
                  />
                  <BrutalButton
                    label={quoteBusy ? 'Sending…' : 'Send quote request'}
                    filled
                    disabled={quoteBusy}
                    onPress={sendQuote}
                  />
                </View>
              ) : null}
            </View>

            <Rule heavy />

            <Section title="Who they are">
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
            </Section>

            <Rule heavy />

            <Section title="What they sell">
              {(vendor.offerings || []).length === 0 ? (
                <Text className="text-lg" style={{ fontFamily: 'Poppins_400Regular', color: INK }}>
                  Categories will appear once the vendor completes their profile.
                </Text>
              ) : (
                vendor.offerings.map((o, idx) => (
                  <View
                    key={idx}
                    className="mb-6 pb-6"
                    style={{
                      borderBottomWidth: idx === vendor.offerings.length - 1 ? 0 : 2,
                      borderBottomColor: INK,
                    }}
                  >
                    <Text
                      className="text-2xl md:text-3xl uppercase mb-2"
                      style={{ fontFamily: 'Poppins_800ExtraBold', color: INK }}
                    >
                      {o.customCategoryLabel || o.familyKey || 'Materials'}
                    </Text>
                    {o.brands.length ? (
                      <Text className="text-base mb-2" style={{ fontFamily: 'Poppins_400Regular', color: INK }}>
                        Brands: {o.brands.join(', ')}
                      </Text>
                    ) : null}
                    <Text
                      className="text-xs uppercase"
                      style={{ fontFamily: 'JetBrainsMono_500Medium', color: INK, letterSpacing: 1 }}
                    >
                      {[
                        o.sellsRetail ? 'Retail' : null,
                        o.sellsWholesale ? 'Wholesale' : null,
                        o.normalUnit ? `Unit: ${o.normalUnit}` : null,
                        o.minimumOrderQuantity != null
                          ? `MOQ: ${o.minimumOrderQuantity}${o.minimumOrderUnit ? ` ${o.minimumOrderUnit}` : ''}`
                          : null,
                        o.deliveryAvailable ? 'Delivery' : null,
                        o.stockedNormally ? 'Regularly stocked' : null,
                        o.specialOrder ? 'Special order' : null,
                      ]
                        .filter(Boolean)
                        .join(' · ')}
                    </Text>
                    {o.examplePriceAmount ? (
                      <Text className="text-sm mt-3" style={{ fontFamily: 'Poppins_400Regular', color: INK }}>
                        Example price (vendor claim): ₦{o.examplePriceAmount}
                        {o.examplePriceUnit ? ` / ${o.examplePriceUnit}` : ''}. {o.examplePriceDisclaimer}
                      </Text>
                    ) : null}
                  </View>
                ))
              )}
            </Section>

            <Rule heavy />

            <Section title="Transparency">
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
            </Section>

            <Rule heavy />

            <View className="py-10 md:py-14">
              <Text
                className="text-lg md:text-xl mb-6 max-w-[36rem]"
                style={{ fontFamily: 'Poppins_400Regular', color: INK }}
              >
                Before contacting a supplier, you can compare independent market-price research.
              </Text>
              <Link href={'/tools/price-checker' as any} asChild>
                <Pressable
                  className="px-5 py-3 self-start"
                  style={{ backgroundColor: INK, borderWidth: 2, borderColor: INK }}
                  accessibilityRole="link"
                >
                  <Text
                    className="text-sm uppercase"
                    style={{ fontFamily: 'Poppins_800ExtraBold', color: PAPER, letterSpacing: 1 }}
                  >
                    Check the market price
                  </Text>
                </Pressable>
              </Link>
            </View>

            <Rule heavy />
          </>
        ) : null}
      </View>
    </ScrollView>
  );
}
