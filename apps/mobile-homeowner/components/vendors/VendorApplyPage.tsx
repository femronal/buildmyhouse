import { useMemo, useState } from 'react';
import { Link } from 'expo-router';
import { Pressable, Text, TextInput, View } from 'react-native';
import {
  SeoContentBackButton,
  SeoContentColumn,
  SeoContentShell,
  seoContentTypography,
} from '@/components/seo/SeoContentLayout';
import { SeoHeading } from '@/components/seo/SeoHeading';
import { LANDING_BORDER, LANDING_INK, LANDING_MUTED } from '@/lib/home-landing-content';
import {
  VENDOR_APPLY_FAMILY_OPTIONS,
  VENDOR_STATE_FILTERS,
  submitVendorApplication,
} from '@/lib/public-vendors';
import { buildSeoJsonLd } from '@/lib/seo-schema';
import { useWebSeo } from '@/lib/seo';

const STEPS = ['Business', 'What you sell', 'How you sell', 'Contact', 'Verification', 'Review'] as const;

function Field({
  label,
  value,
  onChangeText,
  placeholder,
  multiline,
}: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  multiline?: boolean;
}) {
  return (
    <View className="mb-3">
      <Text className="text-xs mb-1" style={{ fontFamily: 'Poppins_500Medium', color: LANDING_MUTED }}>
        {label}
      </Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#9CA3AF"
        multiline={multiline}
        className={`border rounded-xl px-3 py-2.5 text-sm ${multiline ? 'min-h-[88px]' : ''}`}
        style={{
          borderColor: LANDING_BORDER,
          fontFamily: 'Poppins_400Regular',
          color: LANDING_INK,
          outlineStyle: 'none' as any,
        }}
      />
    </View>
  );
}

function Chip({
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
    >
      <Text className="text-xs" style={{ fontFamily: 'Poppins_600SemiBold', color: active ? '#fff' : LANDING_INK }}>
        {label}
      </Text>
    </Pressable>
  );
}

export default function VendorApplyPage() {
  const [step, setStep] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reference, setReference] = useState<string | null>(null);

  const [tradingName, setTradingName] = useState('');
  const [description, setDescription] = useState('');
  const [yearEstablished, setYearEstablished] = useState('');
  const [businessTypes, setBusinessTypes] = useState<string[]>(['retailer']);
  const [stateKey, setStateKey] = useState('ng-lagos');
  const [cityLabel, setCityLabel] = useState('');

  const [familyKey, setFamilyKey] = useState('cement');
  const [brands, setBrands] = useState('');
  const [sellsRetail, setSellsRetail] = useState(true);
  const [sellsWholesale, setSellsWholesale] = useState(false);
  const [normalUnit, setNormalUnit] = useState('');
  const [moq, setMoq] = useState('');

  const [pickupAvailable, setPickupAvailable] = useState(true);
  const [interstateDelivery, setInterstateDelivery] = useState(false);
  const [nationwideDelivery, setNationwideDelivery] = useState(false);
  const [installationAvailable, setInstallationAvailable] = useState(false);
  const [acceptsBulkOrders, setAcceptsBulkOrders] = useState(true);
  const [acceptsProjectQuotations, setAcceptsProjectQuotations] = useState(true);
  const [pricesNegotiable, setPricesNegotiable] = useState(true);
  const [paymentMethods, setPaymentMethods] = useState<string[]>(['transfer']);

  const [publicPhone, setPublicPhone] = useState('');
  const [publicWhatsApp, setPublicWhatsApp] = useState('');
  const [publicEmail, setPublicEmail] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [preferredContact, setPreferredContact] = useState<'phone' | 'whatsapp' | 'email'>('whatsapp');

  const [repName, setRepName] = useState('');
  const [repRole, setRepRole] = useState('');
  const [legalName, setLegalName] = useState('');
  const [cacNumber, setCacNumber] = useState('');

  const [accuracyConfirmed, setAccuracyConfirmed] = useState(false);
  const [contactConsent, setContactConsent] = useState(false);
  const [publicDisplayConsent, setPublicDisplayConsent] = useState(false);
  const [noGuaranteeAcknowledged, setNoGuaranteeAcknowledged] = useState(false);

  const title = 'List your building-material business on BuildMyHouse';
  const summary =
    'Tell BuildMyHouse what you sell. Prove who you are. Become easier for serious buyers to find. Submission does not guarantee approval or verification.';

  useWebSeo({
    title: `${title} | BuildMyHouse`,
    description: summary,
    canonicalPath: '/vendors/apply',
    robots: 'index,follow',
    jsonLd: buildSeoJsonLd({
      path: '/vendors/apply',
      title,
      description: summary,
      schemaType: 'Service',
      breadcrumbs: [
        { name: 'Home', path: '/' },
        { name: 'Vendors', path: '/vendors' },
        { name: 'Apply', path: '/vendors/apply' },
      ],
    }),
  });

  const stateLabel = useMemo(
    () => VENDOR_STATE_FILTERS.find((s) => s.stateKey === stateKey)?.label || stateKey,
    [stateKey],
  );

  const toggleType = (value: string) => {
    setBusinessTypes((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value],
    );
  };

  const togglePayment = (value: string) => {
    setPaymentMethods((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value],
    );
  };

  const validateStep = (): string | null => {
    if (step === 0 && tradingName.trim().length < 2) return 'Enter your company / trading name.';
    if (step === 1 && !familyKey) return 'Choose at least one product category.';
    if (step === 3 && !publicPhone.trim() && !publicWhatsApp.trim() && !publicEmail.trim()) {
      return 'Provide at least one business contact channel.';
    }
    if (step === 5) {
      if (!accuracyConfirmed || !contactConsent || !publicDisplayConsent || !noGuaranteeAcknowledged) {
        return 'Confirm all acknowledgements before submitting.';
      }
    }
    return null;
  };

  const next = () => {
    setError(null);
    const issue = validateStep();
    if (issue) {
      setError(issue);
      return;
    }
    setStep((s) => Math.min(STEPS.length - 1, s + 1));
  };

  const back = () => {
    setError(null);
    setStep((s) => Math.max(0, s - 1));
  };

  const submit = async () => {
    setError(null);
    const issue = validateStep();
    if (issue) {
      setError(issue);
      return;
    }
    setBusy(true);
    try {
      const result = await submitVendorApplication({
        tradingName: tradingName.trim(),
        legalName: legalName.trim() || undefined,
        description: description.trim() || undefined,
        yearEstablished: yearEstablished ? Number(yearEstablished) : undefined,
        businessTypes,
        stateKey,
        stateLabel,
        cityLabel: cityLabel.trim() || undefined,
        publicPhone: publicPhone.trim() || undefined,
        publicWhatsApp: publicWhatsApp.trim() || publicPhone.trim() || undefined,
        publicEmail: publicEmail.trim() || undefined,
        websiteUrl: websiteUrl.trim() || undefined,
        preferredContactMethod: preferredContact,
        acceptsBulkOrders,
        acceptsProjectQuotations,
        pickupAvailable,
        interstateDelivery,
        nationwideDelivery,
        installationAvailable,
        paymentMethodsAccepted: paymentMethods,
        pricesNegotiable,
        cacNumber: cacNumber.trim() || undefined,
        offerings: [
          {
            familyKey,
            brands: brands
              .split(',')
              .map((b) => b.trim())
              .filter(Boolean),
            sellsRetail,
            sellsWholesale,
            normalUnit: normalUnit.trim() || undefined,
            minimumOrderQuantity: moq ? Number(moq) : undefined,
            deliveryAvailable: interstateDelivery || nationwideDelivery,
          },
        ],
        serviceAreas: [{ stateKey, stateLabel, coverageType: 'delivery' }],
        representative: repName.trim()
          ? {
              name: repName.trim(),
              role: repRole.trim() || undefined,
              phone: publicPhone.trim() || undefined,
              email: publicEmail.trim() || undefined,
              showPublicly: false,
            }
          : undefined,
        accuracyConfirmed,
        contactConsent,
        publicDisplayConsent,
        noGuaranteeAcknowledged,
      });
      setReference(result.applicationReference || result.id);
    } catch (e: any) {
      setError(e?.message || 'Submission failed');
    } finally {
      setBusy(false);
    }
  };

  if (reference) {
    return (
      <SeoContentShell contentContainerStyle={{ paddingBottom: 48 }}>
        <SeoContentColumn className="pt-10 pb-2 md:pt-14 md:pb-4">
          <SeoContentBackButton fallbackHref="/vendors" />
          <View className="border rounded-3xl p-6" style={{ borderColor: LANDING_BORDER }}>
            <SeoHeading level={1} className={seoContentTypography.title} style={{ fontFamily: 'Poppins_700Bold' }}>
              Application received
            </SeoHeading>
            <Text className="text-sm mt-3" style={{ fontFamily: 'Poppins_400Regular', color: LANDING_MUTED }}>
              Thank you. BuildMyHouse will review your submission. Listing is not automatic, and verification is a
              separate step.
            </Text>
            <Text className="text-sm mt-4" style={{ fontFamily: 'Poppins_600SemiBold', color: LANDING_INK }}>
              Reference: {reference}
            </Text>
            <View className="flex-row flex-wrap mt-6">
              <Link href={'/vendors' as any} asChild>
                <Pressable className="rounded-full px-4 py-2.5 mr-3 mb-2 bg-black" accessibilityRole="link">
                  <Text className="text-white text-sm" style={{ fontFamily: 'Poppins_700Bold' }}>
                    Back to vendors
                  </Text>
                </Pressable>
              </Link>
              <Link href={'/vendors/manage' as any} asChild>
                <Pressable
                  className="rounded-full px-4 py-2.5 mb-2 border"
                  style={{ borderColor: LANDING_BORDER }}
                  accessibilityRole="link"
                >
                  <Text className="text-sm" style={{ fontFamily: 'Poppins_700Bold', color: LANDING_INK }}>
                    Manage listing
                  </Text>
                </Pressable>
              </Link>
            </View>
          </View>
        </SeoContentColumn>
      </SeoContentShell>
    );
  }

  return (
    <SeoContentShell contentContainerStyle={{ paddingBottom: 48 }}>
      <SeoContentColumn className="pt-10 pb-2 md:pt-14 md:pb-4">
        <SeoContentBackButton fallbackHref="/vendors" />

        <View className="border rounded-3xl p-6 mb-5" style={{ borderColor: LANDING_BORDER }}>
          <SeoHeading level={1} className={seoContentTypography.title} style={{ fontFamily: 'Poppins_700Bold' }}>
            {title}
          </SeoHeading>
          <Text className={seoContentTypography.description} style={{ fontFamily: 'Poppins_400Regular', color: LANDING_MUTED }}>
            {summary}
          </Text>

          <View className="flex-row flex-wrap mt-4">
            {STEPS.map((label, index) => (
              <View
                key={label}
                className={`rounded-full px-2.5 py-1 mr-2 mb-2 border ${index === step ? 'bg-black' : 'bg-white'}`}
                style={{ borderColor: index === step ? '#000' : LANDING_BORDER }}
              >
                <Text
                  className="text-[10px]"
                  style={{ fontFamily: 'Poppins_600SemiBold', color: index === step ? '#fff' : LANDING_MUTED }}
                >
                  {index + 1}. {label}
                </Text>
              </View>
            ))}
          </View>
        </View>

        <View className="border rounded-3xl p-6" style={{ borderColor: LANDING_BORDER }}>
          {step === 0 ? (
            <>
              <Field label="Company / trading name *" value={tradingName} onChangeText={setTradingName} />
              <Field label="Short description" value={description} onChangeText={setDescription} multiline />
              <Field label="Year established" value={yearEstablished} onChangeText={setYearEstablished} placeholder="e.g. 2015" />
              <Text className="text-xs mb-2" style={{ fontFamily: 'Poppins_500Medium', color: LANDING_MUTED }}>
                Business type
              </Text>
              <View className="flex-row flex-wrap mb-3">
                {['retailer', 'wholesaler', 'distributor', 'manufacturer', 'importer'].map((t) => (
                  <Chip key={t} label={t} active={businessTypes.includes(t)} onPress={() => toggleType(t)} />
                ))}
              </View>
              <Text className="text-xs mb-2" style={{ fontFamily: 'Poppins_500Medium', color: LANDING_MUTED }}>
                State
              </Text>
              <View className="flex-row flex-wrap mb-3">
                {VENDOR_STATE_FILTERS.map((s) => (
                  <Chip key={s.stateKey} label={s.label} active={stateKey === s.stateKey} onPress={() => setStateKey(s.stateKey)} />
                ))}
              </View>
              <Field label="City / area" value={cityLabel} onChangeText={setCityLabel} placeholder="e.g. Ikeja, Mowe" />
            </>
          ) : null}

          {step === 1 ? (
            <>
              <Text className="text-xs mb-2" style={{ fontFamily: 'Poppins_500Medium', color: LANDING_MUTED }}>
                Primary category
              </Text>
              <View className="flex-row flex-wrap mb-3">
                {VENDOR_APPLY_FAMILY_OPTIONS.map((f) => (
                  <Chip key={f.familyKey} label={f.label} active={familyKey === f.familyKey} onPress={() => setFamilyKey(f.familyKey)} />
                ))}
              </View>
              <Field label="Brands stocked (comma-separated)" value={brands} onChangeText={setBrands} placeholder="Dangote, BUA" />
              <View className="flex-row flex-wrap mb-3">
                <Chip label="Retail" active={sellsRetail} onPress={() => setSellsRetail((v) => !v)} />
                <Chip label="Wholesale" active={sellsWholesale} onPress={() => setSellsWholesale((v) => !v)} />
              </View>
              <Field label="Normal selling unit" value={normalUnit} onChangeText={setNormalUnit} placeholder="50 kg bag" />
              <Field label="Minimum wholesale quantity" value={moq} onChangeText={setMoq} placeholder="100" />
            </>
          ) : null}

          {step === 2 ? (
            <>
              <View className="flex-row flex-wrap mb-3">
                <Chip label="Pickup" active={pickupAvailable} onPress={() => setPickupAvailable((v) => !v)} />
                <Chip label="Interstate delivery" active={interstateDelivery} onPress={() => setInterstateDelivery((v) => !v)} />
                <Chip label="Nationwide" active={nationwideDelivery} onPress={() => setNationwideDelivery((v) => !v)} />
                <Chip label="Installation" active={installationAvailable} onPress={() => setInstallationAvailable((v) => !v)} />
                <Chip label="Bulk orders" active={acceptsBulkOrders} onPress={() => setAcceptsBulkOrders((v) => !v)} />
                <Chip label="Project quotations" active={acceptsProjectQuotations} onPress={() => setAcceptsProjectQuotations((v) => !v)} />
                <Chip label="Prices negotiable" active={pricesNegotiable} onPress={() => setPricesNegotiable((v) => !v)} />
              </View>
              <Text className="text-xs mb-2" style={{ fontFamily: 'Poppins_500Medium', color: LANDING_MUTED }}>
                Payment methods
              </Text>
              <View className="flex-row flex-wrap">
                {['transfer', 'cash', 'pos', 'cheque'].map((m) => (
                  <Chip key={m} label={m} active={paymentMethods.includes(m)} onPress={() => togglePayment(m)} />
                ))}
              </View>
            </>
          ) : null}

          {step === 3 ? (
            <>
              <Field label="Business phone" value={publicPhone} onChangeText={setPublicPhone} />
              <Field label="WhatsApp" value={publicWhatsApp} onChangeText={setPublicWhatsApp} placeholder="Defaults to phone" />
              <Field label="Business email" value={publicEmail} onChangeText={setPublicEmail} />
              <Field label="Website" value={websiteUrl} onChangeText={setWebsiteUrl} placeholder="https://" />
              <Text className="text-xs mb-2" style={{ fontFamily: 'Poppins_500Medium', color: LANDING_MUTED }}>
                Preferred contact
              </Text>
              <View className="flex-row flex-wrap">
                {(['whatsapp', 'phone', 'email'] as const).map((m) => (
                  <Chip key={m} label={m} active={preferredContact === m} onPress={() => setPreferredContact(m)} />
                ))}
              </View>
            </>
          ) : null}

          {step === 4 ? (
            <>
              <Text className="text-sm mb-3" style={{ fontFamily: 'Poppins_400Regular', color: LANDING_MUTED }}>
                Verification details stay private. You can add documents later after approval.
              </Text>
              <Field label="Legal / registered name" value={legalName} onChangeText={setLegalName} />
              <Field label="CAC / registration number (optional)" value={cacNumber} onChangeText={setCacNumber} />
              <Field label="Owner / representative name" value={repName} onChangeText={setRepName} />
              <Field label="Representative role" value={repRole} onChangeText={setRepRole} placeholder="Managing Director" />
            </>
          ) : null}

          {step === 5 ? (
            <>
              <Text className="text-sm mb-3" style={{ fontFamily: 'Poppins_500Medium', color: LANDING_INK }}>
                Review before submit
              </Text>
              <Text className="text-sm mb-1" style={{ fontFamily: 'Poppins_400Regular', color: LANDING_MUTED }}>
                {tradingName} · {cityLabel || stateLabel} · {familyKey}
              </Text>
              <Text className="text-sm mb-4" style={{ fontFamily: 'Poppins_400Regular', color: LANDING_MUTED }}>
                Contact: {publicWhatsApp || publicPhone || publicEmail || '—'}
              </Text>
              {[
                ['Information is accurate', accuracyConfirmed, setAccuracyConfirmed],
                ['BuildMyHouse may contact me for verification', contactConsent, setContactConsent],
                ['Approved public information may be displayed', publicDisplayConsent, setPublicDisplayConsent],
                ['Submission does not guarantee approval or verification', noGuaranteeAcknowledged, setNoGuaranteeAcknowledged],
              ].map(([label, value, setter]) => (
                <Pressable
                  key={String(label)}
                  onPress={() => (setter as (v: boolean) => void)(!(value as boolean))}
                  className="flex-row items-start mb-3"
                >
                  <View
                    className="w-5 h-5 rounded border mr-3 mt-0.5 items-center justify-center"
                    style={{ borderColor: LANDING_BORDER, backgroundColor: value ? '#000' : '#fff' }}
                  >
                    {value ? (
                      <Text className="text-white text-[10px]" style={{ fontFamily: 'Poppins_700Bold' }}>
                        ✓
                      </Text>
                    ) : null}
                  </View>
                  <Text className="flex-1 text-sm" style={{ fontFamily: 'Poppins_400Regular', color: LANDING_INK }}>
                    {String(label)}
                  </Text>
                </Pressable>
              ))}
            </>
          ) : null}

          {error ? (
            <Text className="text-sm mt-2" style={{ fontFamily: 'Poppins_400Regular', color: '#B91C1C' }}>
              {error}
            </Text>
          ) : null}

          <View className="flex-row flex-wrap mt-5">
            {step > 0 ? (
              <Pressable
                onPress={back}
                className="rounded-full px-4 py-2.5 mr-3 mb-2 border"
                style={{ borderColor: LANDING_BORDER }}
              >
                <Text className="text-sm" style={{ fontFamily: 'Poppins_700Bold', color: LANDING_INK }}>
                  Back
                </Text>
              </Pressable>
            ) : null}
            {step < STEPS.length - 1 ? (
              <Pressable onPress={next} className="rounded-full px-4 py-2.5 mb-2 bg-black">
                <Text className="text-white text-sm" style={{ fontFamily: 'Poppins_700Bold' }}>
                  Continue
                </Text>
              </Pressable>
            ) : (
              <Pressable onPress={submit} disabled={busy} className="rounded-full px-4 py-2.5 mb-2 bg-black">
                <Text className="text-white text-sm" style={{ fontFamily: 'Poppins_700Bold' }}>
                  {busy ? 'Submitting…' : 'Submit application'}
                </Text>
              </Pressable>
            )}
          </View>
        </View>
      </SeoContentColumn>
    </SeoContentShell>
  );
}
