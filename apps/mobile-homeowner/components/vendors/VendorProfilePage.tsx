import { useState } from 'react';
import { Link } from 'expo-router';
import { Linking, Pressable, Text, TextInput, View } from 'react-native';
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
  fetchPublicVendorBySlug,
  submitVendorQuoteRequest,
  vendorWhatsAppHref,
} from '@/lib/public-vendors';
import { buildSeoJsonLd } from '@/lib/seo-schema';
import { useWebSeo } from '@/lib/seo';

type Props = { slug: string };

function Info({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <View className="mb-3">
      <Text className="text-xs mb-0.5" style={{ fontFamily: 'Poppins_500Medium', color: LANDING_MUTED }}>
        {label}
      </Text>
      <Text className="text-sm" style={{ fontFamily: 'Poppins_400Regular', color: LANDING_INK }}>
        {value}
      </Text>
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

  return (
    <SeoContentShell contentContainerStyle={{ paddingBottom: 48 }}>
      <SeoContentColumn className="pt-10 pb-2 md:pt-14 md:pb-4">
        <SeoContentBackButton fallbackHref="/vendors" />

        {isLoading ? (
          <Text className="text-sm" style={{ fontFamily: 'Poppins_400Regular', color: LANDING_MUTED }}>
            Loading vendor…
          </Text>
        ) : null}

        {notFound ? (
          <View className="border rounded-3xl p-6" style={{ borderColor: LANDING_BORDER }}>
            <SeoHeading level={1} className={seoContentTypography.title} style={{ fontFamily: 'Poppins_700Bold' }}>
              Vendor not available
            </SeoHeading>
            <Text className="text-sm mt-2" style={{ fontFamily: 'Poppins_400Regular', color: LANDING_MUTED }}>
              This profile is not publicly listed. It may be awaiting review, suspended, or internal-only.
            </Text>
            <Link href={'/vendors' as any} asChild>
              <Pressable className="rounded-full px-4 py-2.5 mt-4 bg-black self-start" accessibilityRole="link">
                <Text className="text-white text-sm" style={{ fontFamily: 'Poppins_700Bold' }}>
                  Browse vendors
                </Text>
              </Pressable>
            </Link>
          </View>
        ) : null}

        {isError && !notFound ? (
          <Text className="text-sm" style={{ fontFamily: 'Poppins_400Regular', color: LANDING_MUTED }}>
            Unable to load this vendor right now.
          </Text>
        ) : null}

        {vendor ? (
          <>
            <View className="border rounded-3xl p-6 mb-5" style={{ borderColor: LANDING_BORDER }}>
              <View className="flex-row flex-wrap items-center gap-2 mb-2">
                {vendor.isBuildMyHouseVerified ? (
                  <Pressable
                    onPress={() => setShowVerifiedHelp((v) => !v)}
                    className="rounded-full px-2.5 py-1 bg-black"
                  >
                    <Text className="text-[10px] text-white" style={{ fontFamily: 'Poppins_600SemiBold' }}>
                      BuildMyHouse Verified
                    </Text>
                  </Pressable>
                ) : (
                  <View className="rounded-full px-2.5 py-1 border" style={{ borderColor: LANDING_BORDER }}>
                    <Text className="text-[10px]" style={{ fontFamily: 'Poppins_600SemiBold', color: LANDING_MUTED }}>
                      Listed
                    </Text>
                  </View>
                )}
                <Pressable onPress={() => setShowVerifiedHelp((v) => !v)}>
                  <Text className="text-xs underline" style={{ fontFamily: 'Poppins_400Regular', color: LANDING_MUTED }}>
                    What does verified mean?
                  </Text>
                </Pressable>
              </View>

              <SeoHeading
                level={1}
                className={seoContentTypography.title}
                style={{ fontFamily: 'Poppins_700Bold', color: LANDING_INK }}
              >
                {title}
              </SeoHeading>

              {vendor.description ? (
                <Text
                  className={seoContentTypography.description}
                  style={{ fontFamily: 'Poppins_400Regular', color: LANDING_MUTED }}
                >
                  {vendor.description}
                </Text>
              ) : null}

              {showVerifiedHelp ? (
                <View className="mt-3 rounded-2xl border p-4" style={{ borderColor: LANDING_BORDER, backgroundColor: '#FAFAFA' }}>
                  <Text className="text-sm mb-2" style={{ fontFamily: 'Poppins_600SemiBold', color: LANDING_INK }}>
                    What BuildMyHouse Verified means
                  </Text>
                  <Text className="text-sm" style={{ fontFamily: 'Poppins_400Regular', color: LANDING_MUTED }}>
                    BuildMyHouse completed defined checks such as business identity, registration where applicable,
                    representative identity, phone reachability, and location evidence. It does not mean the vendor is
                    scam-proof, or that every product is guaranteed genuine.
                  </Text>
                </View>
              ) : null}

              <View className="flex-row flex-wrap mt-4">
                {vendor.publicPhone ? (
                  <Pressable
                    onPress={() => Linking.openURL(`tel:${vendor.publicPhone}`)}
                    className="rounded-full px-4 py-2.5 mr-2 mb-2 bg-black"
                  >
                    <Text className="text-white text-sm" style={{ fontFamily: 'Poppins_700Bold' }}>
                      Call vendor
                    </Text>
                  </Pressable>
                ) : null}
                {whatsappHref ? (
                  <Pressable
                    onPress={() => Linking.openURL(whatsappHref)}
                    className="rounded-full px-4 py-2.5 mr-2 mb-2 border"
                    style={{ borderColor: LANDING_BORDER }}
                  >
                    <Text className="text-sm" style={{ fontFamily: 'Poppins_700Bold', color: LANDING_INK }}>
                      WhatsApp
                    </Text>
                  </Pressable>
                ) : null}
                {vendor.publicEmail ? (
                  <Pressable
                    onPress={() => Linking.openURL(`mailto:${vendor.publicEmail}`)}
                    className="rounded-full px-4 py-2.5 mr-2 mb-2 border"
                    style={{ borderColor: LANDING_BORDER }}
                  >
                    <Text className="text-sm" style={{ fontFamily: 'Poppins_700Bold', color: LANDING_INK }}>
                      Email
                    </Text>
                  </Pressable>
                ) : null}
                {vendor.websiteUrl ? (
                  <Pressable
                    onPress={() => Linking.openURL(vendor.websiteUrl!)}
                    className="rounded-full px-4 py-2.5 mr-2 mb-2 border"
                    style={{ borderColor: LANDING_BORDER }}
                  >
                    <Text className="text-sm" style={{ fontFamily: 'Poppins_700Bold', color: LANDING_INK }}>
                      Website
                    </Text>
                  </Pressable>
                ) : null}
                <Pressable
                  onPress={() => setQuoteOpen((v) => !v)}
                  className="rounded-full px-4 py-2.5 mb-2 border"
                  style={{ borderColor: LANDING_BORDER }}
                >
                  <Text className="text-sm" style={{ fontFamily: 'Poppins_700Bold', color: LANDING_INK }}>
                    Request a quote
                  </Text>
                </Pressable>
              </View>

              {quoteStatus ? (
                <Text className="text-sm mt-2" style={{ fontFamily: 'Poppins_400Regular', color: LANDING_MUTED }}>
                  {quoteStatus}
                </Text>
              ) : null}

              {quoteOpen ? (
                <View className="mt-4 border-t pt-4" style={{ borderColor: LANDING_BORDER }}>
                  <Text className="text-sm mb-3" style={{ fontFamily: 'Poppins_600SemiBold', color: LANDING_INK }}>
                    Request a quote
                  </Text>
                  {[
                    ['Product / material *', quoteProduct, setQuoteProduct],
                    ['Quantity', quoteQty, setQuoteQty],
                    ['Delivery location', quoteLocation, setQuoteLocation],
                    ['Your name *', buyerName, setBuyerName],
                    ['Phone', buyerPhone, setBuyerPhone],
                    ['Email', buyerEmail, setBuyerEmail],
                  ].map(([label, value, setter]) => (
                    <View key={String(label)} className="mb-2">
                      <Text className="text-xs mb-1" style={{ fontFamily: 'Poppins_500Medium', color: LANDING_MUTED }}>
                        {String(label)}
                      </Text>
                      <TextInput
                        value={String(value)}
                        onChangeText={setter as (t: string) => void}
                        className="border rounded-xl px-3 py-2 text-sm"
                        style={{ borderColor: LANDING_BORDER, fontFamily: 'Poppins_400Regular', color: LANDING_INK, outlineStyle: 'none' as any }}
                      />
                    </View>
                  ))}
                  <Text className="text-xs mb-1" style={{ fontFamily: 'Poppins_500Medium', color: LANDING_MUTED }}>
                    Note
                  </Text>
                  <TextInput
                    value={quoteNote}
                    onChangeText={setQuoteNote}
                    multiline
                    className="border rounded-xl px-3 py-2 text-sm mb-3 min-h-[72px]"
                    style={{ borderColor: LANDING_BORDER, fontFamily: 'Poppins_400Regular', color: LANDING_INK, outlineStyle: 'none' as any }}
                  />
                  <Pressable
                    onPress={sendQuote}
                    disabled={quoteBusy}
                    className="rounded-full px-4 py-2.5 bg-black self-start"
                  >
                    <Text className="text-white text-sm" style={{ fontFamily: 'Poppins_700Bold' }}>
                      {quoteBusy ? 'Sending…' : 'Send quote request'}
                    </Text>
                  </Pressable>
                </View>
              ) : null}
            </View>

            <View className="border rounded-3xl p-6 mb-5" style={{ borderColor: LANDING_BORDER }}>
              <SeoHeading level={2} className={seoContentTypography.sectionHeading} style={{ fontFamily: 'Poppins_700Bold' }}>
                Who they are
              </SeoHeading>
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
            </View>

            <View className="border rounded-3xl p-6 mb-5" style={{ borderColor: LANDING_BORDER }}>
              <SeoHeading level={2} className={seoContentTypography.sectionHeading} style={{ fontFamily: 'Poppins_700Bold' }}>
                What they sell
              </SeoHeading>
              {(vendor.offerings || []).length === 0 ? (
                <Text className="text-sm" style={{ fontFamily: 'Poppins_400Regular', color: LANDING_MUTED }}>
                  Categories will appear once the vendor completes their profile.
                </Text>
              ) : (
                vendor.offerings.map((o, idx) => (
                  <View key={idx} className="mb-4 pb-4 border-b" style={{ borderColor: LANDING_BORDER }}>
                    <Text className="text-sm mb-1" style={{ fontFamily: 'Poppins_600SemiBold', color: LANDING_INK }}>
                      {o.customCategoryLabel || o.familyKey || 'Materials'}
                    </Text>
                    {o.brands.length ? (
                      <Text className="text-sm" style={{ fontFamily: 'Poppins_400Regular', color: LANDING_MUTED }}>
                        Brands: {o.brands.join(', ')}
                      </Text>
                    ) : null}
                    <Text className="text-xs mt-1" style={{ fontFamily: 'Poppins_400Regular', color: LANDING_MUTED }}>
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
                      <Text className="text-xs mt-2" style={{ fontFamily: 'Poppins_400Regular', color: LANDING_MUTED }}>
                        Example price (vendor claim): ₦{o.examplePriceAmount}
                        {o.examplePriceUnit ? ` / ${o.examplePriceUnit}` : ''}. {o.examplePriceDisclaimer}
                      </Text>
                    ) : null}
                  </View>
                ))
              )}
            </View>

            <View className="border rounded-3xl p-6 mb-5" style={{ borderColor: LANDING_BORDER }}>
              <SeoHeading level={2} className={seoContentTypography.sectionHeading} style={{ fontFamily: 'Poppins_700Bold' }}>
                Transparency
              </SeoHeading>
              <Info label="Vendor status" value={vendor.transparency.verificationLabel} />
              <Info label="Information last updated" value={new Date(vendor.lastUpdatedAt).toLocaleDateString()} />
              <Info label="Business identity" value={vendor.transparency.businessIdentity} />
              <Info label="Location evidence" value={vendor.transparency.locationEvidence} />
              <Info label="Registration" value={vendor.transparency.registration} />
              <Info label="Pricing" value={vendor.transparency.pricingDisclaimer} />
              <Info label="BuildMyHouse relationship" value={vendor.transparency.bmhRelationship} />
            </View>

            <View className="border rounded-3xl p-6" style={{ borderColor: LANDING_BORDER }}>
              <Text className="text-sm mb-3" style={{ fontFamily: 'Poppins_400Regular', color: LANDING_MUTED }}>
                Before contacting a supplier, you can compare independent market-price research.
              </Text>
              <Link href={'/tools/price-checker' as any} asChild>
                <Pressable className="rounded-full px-4 py-2.5 bg-black self-start" accessibilityRole="link">
                  <Text className="text-white text-sm" style={{ fontFamily: 'Poppins_700Bold' }}>
                    Check the market price
                  </Text>
                </Pressable>
              </Link>
            </View>
          </>
        ) : null}
      </SeoContentColumn>
    </SeoContentShell>
  );
}
