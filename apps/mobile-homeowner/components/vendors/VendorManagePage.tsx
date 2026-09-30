import { useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Link, useRouter } from 'expo-router';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import {
  SeoContentBackButton,
  SeoContentColumn,
  SeoContentShell,
  seoContentTypography,
} from '@/components/seo/SeoContentLayout';
import { SeoHeading } from '@/components/seo/SeoHeading';
import { LANDING_BORDER, LANDING_INK, LANDING_MUTED } from '@/lib/home-landing-content';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { api } from '@/lib/api';
import { getBackendAssetUrl } from '@/lib/image';
import { uploadListingImage } from '@/lib/listing-image-upload';
import { requireAuthToContinue } from '@/lib/require-auth-to-continue';
import { useWebSeo } from '@/lib/seo';
import { VENDOR_STATE_FILTERS } from '@/lib/public-vendors';
import {
  VENDOR_DOCUMENT_TYPES,
  addManagedVendorDocument,
  fetchManagedVendorProfile,
  formatListingStatus,
  submitVendorSensitiveChange,
  updateManagedVendorProfile,
  type ManagedVendorProfile,
} from '@/lib/vendor-manage';

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

function ToggleChip({
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

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View className="mb-8">
      <Text className="text-lg mb-3" style={{ fontFamily: 'Poppins_700Bold', color: LANDING_INK }}>
        {title}
      </Text>
      {children}
    </View>
  );
}

const PAYMENT_OPTIONS = ['transfer', 'cash', 'pos', 'cheque', 'credit'];

export default function VendorManagePage() {
  const router = useRouter();
  const { data: currentUser, isLoading: userLoading } = useCurrentUser();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [profile, setProfile] = useState<ManagedVendorProfile | null>(null);
  const [missingProfile, setMissingProfile] = useState(false);

  const [description, setDescription] = useState('');
  const [businessHours, setBusinessHours] = useState('');
  const [publicPhone, setPublicPhone] = useState('');
  const [publicWhatsApp, setPublicWhatsApp] = useState('');
  const [publicEmail, setPublicEmail] = useState('');
  const [showPublicPhone, setShowPublicPhone] = useState(true);
  const [showPublicWhatsApp, setShowPublicWhatsApp] = useState(true);
  const [showPublicEmail, setShowPublicEmail] = useState(false);
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [paymentMethods, setPaymentMethods] = useState<string[]>([]);
  const [pricesNegotiable, setPricesNegotiable] = useState(true);
  const [pickupAvailable, setPickupAvailable] = useState(true);
  const [interstateDelivery, setInterstateDelivery] = useState(false);
  const [nationwideDelivery, setNationwideDelivery] = useState(false);
  const [installationAvailable, setInstallationAvailable] = useState(false);

  const [familyKey, setFamilyKey] = useState('cement');
  const [categorySuggestion, setCategorySuggestion] = useState('');
  const [brands, setBrands] = useState('');
  const [sellsRetail, setSellsRetail] = useState(true);
  const [sellsWholesale, setSellsWholesale] = useState(false);
  const [normalUnit, setNormalUnit] = useState('');
  const [moq, setMoq] = useState('');
  const [offeringDelivery, setOfferingDelivery] = useState(true);

  const [serviceStateKeys, setServiceStateKeys] = useState<string[]>([]);

  const [sensitiveTradingName, setSensitiveTradingName] = useState('');
  const [sensitiveLegalName, setSensitiveLegalName] = useState('');
  const [sensitiveCac, setSensitiveCac] = useState('');
  const [sensitiveCity, setSensitiveCity] = useState('');
  const [sensitiveBusy, setSensitiveBusy] = useState(false);

  const [docType, setDocType] = useState('cac_certificate');

  useWebSeo({
    title: 'Manage vendor profile | BuildMyHouse',
    description: 'Update your BuildMyHouse vendor listing details.',
    canonicalPath: '/vendors/manage',
    robots: 'noindex,nofollow',
  });

  const hydrate = (data: ManagedVendorProfile) => {
    setProfile(data);
    setDescription(data.description || '');
    setBusinessHours(data.businessHours || '');
    setPublicPhone(data.publicPhone || '');
    setPublicWhatsApp(data.publicWhatsApp || '');
    setPublicEmail(data.publicEmail || '');
    setShowPublicPhone(data.showPublicPhone);
    setShowPublicWhatsApp(data.showPublicWhatsApp);
    setShowPublicEmail(data.showPublicEmail);
    setWebsiteUrl(data.websiteUrl || '');
    setLogoUrl(data.logoUrl || '');
    setPaymentMethods(data.paymentMethodsAccepted || []);
    setPricesNegotiable(data.pricesNegotiable);
    setPickupAvailable(data.pickupAvailable);
    setInterstateDelivery(data.interstateDelivery);
    setNationwideDelivery(data.nationwideDelivery);
    setInstallationAvailable(data.installationAvailable);

    const primary = data.offerings?.[0];
    if (primary) {
      setFamilyKey(primary.familyKey || 'cement');
      setBrands((primary.brands || []).join(', '));
      setSellsRetail(primary.sellsRetail !== false);
      setSellsWholesale(!!primary.sellsWholesale);
      setNormalUnit(primary.normalUnit || '');
      setMoq(
        primary.minimumOrderQuantity != null ? String(primary.minimumOrderQuantity) : '',
      );
      setOfferingDelivery(primary.deliveryAvailable !== false);
    }

    setServiceStateKeys(
      (data.serviceAreas || [])
        .map((a) => a.stateKey)
        .filter((k): k is string => Boolean(k)),
    );

    setSensitiveTradingName(data.tradingName || '');
    setSensitiveLegalName(data.legalName || '');
    setSensitiveCity(data.cityLabel || '');
  };

  useEffect(() => {
    let cancelled = false;

    (async () => {
      if (userLoading) return;

      const canContinue = await requireAuthToContinue({
        router,
        currentUser,
        userLoading,
        destinationPath: '/vendors/manage',
        promptTitle: 'Sign in to manage',
        promptMessage: 'Sign in with the account linked to your vendor profile.',
      });

      if (!canContinue) {
        if (!cancelled) {
          setLoading(false);
          setMissingProfile(true);
        }
        return;
      }

      try {
        const data = await fetchManagedVendorProfile();
        if (cancelled) return;
        hydrate(data);
        setMissingProfile(false);
      } catch (e: any) {
        if (cancelled) return;
        const message = String(e?.message || '');
        if (/no vendor profile/i.test(message) || /not found/i.test(message)) {
          setMissingProfile(true);
        } else {
          setError(message || 'Unable to load your vendor profile.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [currentUser, userLoading, router]);

  const readOnly =
    profile?.listingStatus === 'suspended' || profile?.listingStatus === 'rejected';

  const statusLabel = useMemo(() => {
    if (!profile) return '';
    return `${formatListingStatus(profile.listingStatus)} · ${formatListingStatus(profile.verificationStatus)}`;
  }, [profile]);

  const togglePayment = (method: string) => {
    setPaymentMethods((prev) =>
      prev.includes(method) ? prev.filter((m) => m !== method) : [...prev, method],
    );
  };

  const toggleServiceState = (stateKey: string) => {
    setServiceStateKeys((prev) =>
      prev.includes(stateKey) ? prev.filter((k) => k !== stateKey) : [...prev, stateKey],
    );
  };

  const handleSaveSafe = async () => {
    if (!profile || readOnly) return;
    setSaving(true);
    setError(null);
    setNotice(null);
    try {
      const brandList = brands
        .split(',')
        .map((b) => b.trim())
        .filter(Boolean);
      const updated = await updateManagedVendorProfile({
        description: description.trim() || undefined,
        businessHours: businessHours.trim() || undefined,
        publicPhone: publicPhone.trim() || undefined,
        publicWhatsApp: publicWhatsApp.trim() || undefined,
        publicEmail: publicEmail.trim() || undefined,
        showPublicPhone,
        showPublicWhatsApp,
        showPublicEmail,
        websiteUrl: websiteUrl.trim() || undefined,
        logoUrl: logoUrl.trim() || undefined,
        paymentMethodsAccepted: paymentMethods,
        pricesNegotiable,
        pickupAvailable,
        interstateDelivery,
        nationwideDelivery,
        installationAvailable,
        offerings: [
          {
            familyKey,
            brands: brandList,
            sellsRetail,
            sellsWholesale,
            normalUnit: normalUnit.trim() || undefined,
            minimumOrderQuantity: moq ? Number(moq) : undefined,
            deliveryAvailable: offeringDelivery,
          },
        ],
        serviceAreas: serviceStateKeys.map((stateKey) => ({
          stateKey,
          stateLabel: VENDOR_STATE_FILTERS.find((s) => s.stateKey === stateKey)?.label,
          coverageType: 'delivery',
        })),
      });
      hydrate(updated);
      setNotice('Public details saved.');
    } catch (e: any) {
      setError(e?.message || 'Unable to save changes.');
    } finally {
      setSaving(false);
    }
  };

  const handleSensitiveSubmit = async () => {
    if (!profile || readOnly) return;
    setSensitiveBusy(true);
    setError(null);
    setNotice(null);
    try {
      await submitVendorSensitiveChange({
        fieldGroup: 'identity',
        proposedPayload: {
          tradingName: sensitiveTradingName.trim(),
          legalName: sensitiveLegalName.trim() || null,
          cacNumber: sensitiveCac.trim() || null,
          cityLabel: sensitiveCity.trim() || null,
        },
      });
      const refreshed = await fetchManagedVendorProfile();
      hydrate(refreshed);
      setNotice('Change request submitted for BuildMyHouse review.');
    } catch (e: any) {
      setError(e?.message || 'Unable to submit change request.');
    } finally {
      setSensitiveBusy(false);
    }
  };

  const uploadShopPhoto = async (documentType: 'storefront_photo' | 'warehouse_photo') => {
    if (!profile || readOnly) return;
    setUploading(true);
    setError(null);
    setNotice(null);
    try {
      if (Platform.OS !== 'web') {
        const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!perm.granted) {
          Alert.alert('Permission required', 'Allow photo library access to add this image.');
          setUploading(false);
          return;
        }
      }
      const picked = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: documentType === 'storefront_photo',
        aspect: documentType === 'storefront_photo' ? [16, 9] : undefined,
        quality: 0.85,
      });
      if (picked.canceled || !picked.assets?.[0]?.uri) {
        setUploading(false);
        return;
      }
      const asset = picked.assets[0];
      const url = await uploadListingImage(asset);
      await addManagedVendorDocument({
        documentType,
        fileRef: url,
        isPublic: true,
        label: asset.fileName || (documentType === 'storefront_photo' ? 'Storefront' : 'Shop photo'),
        mimeType: asset.mimeType || 'image/jpeg',
      });
      const refreshed = await fetchManagedVendorProfile();
      hydrate(refreshed);
      setNotice(documentType === 'storefront_photo' ? 'Storefront photo added.' : 'Photo added.');
    } catch (e: any) {
      setError(e?.message || 'Unable to upload this photo.');
    } finally {
      setUploading(false);
    }
  };

  const handleUploadLogo = async () => {
    if (!profile || readOnly) return;
    setUploading(true);
    setError(null);
    setNotice(null);
    try {
      const picked = await DocumentPicker.getDocumentAsync({
        type: ['image/*'],
        copyToCacheDirectory: true,
        multiple: false,
      });
      if (picked.canceled || !picked.assets?.length) {
        setUploading(false);
        return;
      }
      const asset = picked.assets[0];
      const formData = new FormData();
      if (Platform.OS === 'web') {
        const response = await fetch(asset.uri);
        const blob = await response.blob();
        formData.append('file', blob, asset.name || 'vendor-logo.jpg');
      } else {
        formData.append('file', {
          uri: asset.uri,
          name: asset.name || `vendor-logo-${Date.now()}.jpg`,
          type: asset.mimeType || 'image/jpeg',
        } as any);
      }

      const uploadRes = await api.post('/upload/image', formData);
      const url = String(uploadRes?.url || '').trim();
      if (!url) throw new Error('Upload succeeded but no image URL was returned.');

      const updated = await updateManagedVendorProfile({ logoUrl: url });
      hydrate(updated);
      setNotice('Logo updated on your public profile.');
    } catch (e: any) {
      setError(e?.message || 'Unable to upload logo.');
    } finally {
      setUploading(false);
    }
  };

  const handleUploadDocument = async () => {
    if (!profile || readOnly) return;
    setUploading(true);
    setError(null);
    setNotice(null);
    try {
      const picked = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'image/*'],
        copyToCacheDirectory: true,
        multiple: false,
      });
      if (picked.canceled || !picked.assets?.length) {
        setUploading(false);
        return;
      }
      const asset = picked.assets[0];
      const formData = new FormData();
      if (Platform.OS === 'web') {
        const response = await fetch(asset.uri);
        const blob = await response.blob();
        formData.append('file', blob, asset.name || 'vendor-document.pdf');
      } else {
        formData.append('file', {
          uri: asset.uri,
          name: asset.name || `vendor-document-${Date.now()}.pdf`,
          type: asset.mimeType || 'application/pdf',
        } as any);
      }

      const uploadRes = await api.post('/upload/document', formData);
      const fileRef = String(uploadRes?.url || uploadRes?.key || '').trim();
      if (!fileRef) throw new Error('Upload succeeded but no file reference was returned.');

      await addManagedVendorDocument({
        documentType: docType,
        fileRef,
        label: asset.name || undefined,
        mimeType: asset.mimeType || uploadRes?.mimetype,
        fileSizeBytes: asset.size || uploadRes?.size,
      });
      const refreshed = await fetchManagedVendorProfile();
      hydrate(refreshed);
      setNotice('Document uploaded for review.');
    } catch (e: any) {
      setError(e?.message || 'Unable to upload document.');
    } finally {
      setUploading(false);
    }
  };

  if (loading || userLoading) {
    return (
      <SeoContentShell>
        <SeoContentColumn>
          <View className="py-16 items-center">
            <ActivityIndicator color={LANDING_INK} />
          </View>
        </SeoContentColumn>
      </SeoContentShell>
    );
  }

  if (missingProfile || !profile) {
    return (
      <SeoContentShell>
        <SeoContentColumn>
          <SeoContentBackButton fallbackHref="/vendors" />
          <SeoHeading level={1} className={seoContentTypography.title} style={{ fontFamily: 'Poppins_700Bold' }}>
            No vendor profile linked
          </SeoHeading>
          <Text className="text-base mb-4" style={{ fontFamily: 'Poppins_400Regular', color: LANDING_MUTED }}>
            This account is not linked to a vendor listing yet. Apply to be listed, or use a claim
            invite from BuildMyHouse if we already created your profile.
          </Text>
          {error ? (
            <Text className="text-sm mb-3" style={{ fontFamily: 'Poppins_500Medium', color: '#B91C1C' }}>
              {error}
            </Text>
          ) : null}
          <Link href={'/vendors/apply' as any} asChild>
            <Pressable className="rounded-full bg-black px-5 py-3 items-center mb-3">
              <Text className="text-white" style={{ fontFamily: 'Poppins_600SemiBold' }}>
                Apply to list your business
              </Text>
            </Pressable>
          </Link>
          <Link href={'/vendors' as any} asChild>
            <Pressable className="items-center py-2">
              <Text style={{ fontFamily: 'Poppins_600SemiBold', color: LANDING_INK }}>
                Browse vendor directory
              </Text>
            </Pressable>
          </Link>
        </SeoContentColumn>
      </SeoContentShell>
    );
  }

  return (
    <SeoContentShell>
      <SeoContentColumn>
        <SeoContentBackButton fallbackHref="/vendors" />
        <SeoHeading level={1} className={seoContentTypography.title} style={{ fontFamily: 'Poppins_700Bold' }}>
          Manage {profile.tradingName}
        </SeoHeading>
        <Text className="text-sm mb-2" style={{ fontFamily: 'Poppins_400Regular', color: LANDING_MUTED }}>
          {statusLabel} · Completeness {profile.profileCompleteness}%
        </Text>
        <Link href={`/vendors/${profile.slug}` as any} asChild>
          <Pressable className="mb-5">
            <Text style={{ fontFamily: 'Poppins_600SemiBold', color: LANDING_INK }}>
              View public profile →
            </Text>
          </Pressable>
        </Link>

        {profile.clarificationMessage ? (
          <View
            className="border rounded-2xl p-4 mb-5"
            style={{ borderColor: '#F59E0B', backgroundColor: '#FFFBEB' }}
          >
            <Text className="text-sm mb-1" style={{ fontFamily: 'Poppins_700Bold', color: LANDING_INK }}>
              Clarification requested
            </Text>
            <Text className="text-sm" style={{ fontFamily: 'Poppins_400Regular', color: LANDING_MUTED }}>
              {profile.clarificationMessage}
            </Text>
          </View>
        ) : null}

        {readOnly ? (
          <View className="border rounded-2xl p-4 mb-5" style={{ borderColor: LANDING_BORDER }}>
            <Text style={{ fontFamily: 'Poppins_500Medium', color: LANDING_INK }}>
              This profile is {formatListingStatus(profile.listingStatus)} and cannot be edited online.
              Contact BuildMyHouse support if you need help.
            </Text>
          </View>
        ) : null}

        {notice ? (
          <Text className="text-sm mb-3" style={{ fontFamily: 'Poppins_500Medium', color: '#047857' }}>
            {notice}
          </Text>
        ) : null}
        {error ? (
          <Text className="text-sm mb-3" style={{ fontFamily: 'Poppins_500Medium', color: '#B91C1C' }}>
            {error}
          </Text>
        ) : null}

        <Section title="Storefront and photos">
          <Text className="text-sm mb-3" style={{ fontFamily: 'Poppins_400Regular', color: LANDING_MUTED }}>
            The storefront is the main picture on your public page. Extra photos appear in the gallery.
            Pictures do not mean the business is verified.
          </Text>
          {(() => {
            const storefront = (profile.documents || []).find(
              (doc) => doc.documentType === 'storefront_photo' && doc.fileRef,
            );
            const extras = (profile.documents || []).filter(
              (doc) => doc.documentType === 'warehouse_photo' && doc.fileRef,
            );
            return (
              <>
                <View
                  style={{
                    height: 160,
                    borderRadius: 16,
                    overflow: 'hidden',
                    borderWidth: 1,
                    borderColor: LANDING_BORDER,
                    backgroundColor: '#F5F5F5',
                    marginBottom: 12,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {storefront?.fileRef ? (
                    <Image
                      source={{ uri: getBackendAssetUrl(storefront.fileRef) }}
                      style={{ width: '100%', height: 160 }}
                      resizeMode="cover"
                    />
                  ) : (
                    <Text style={{ fontFamily: 'Poppins_500Medium', color: LANDING_MUTED }}>No storefront photo yet</Text>
                  )}
                </View>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 12 }}>
                  <Pressable
                    onPress={() => uploadShopPhoto('storefront_photo')}
                    disabled={uploading || readOnly}
                    style={{ minHeight: 44, justifyContent: 'center', marginRight: 8, marginBottom: 8 }}
                  >
                    <Text style={{ fontFamily: 'Poppins_600SemiBold', color: LANDING_INK }}>
                      {storefront ? 'Replace storefront' : 'Add storefront'}
                    </Text>
                  </Pressable>
                  <Pressable
                    onPress={() => uploadShopPhoto('warehouse_photo')}
                    disabled={uploading || readOnly}
                    style={{ minHeight: 44, justifyContent: 'center', marginBottom: 8 }}
                  >
                    <Text style={{ fontFamily: 'Poppins_600SemiBold', color: LANDING_INK }}>Add another photo</Text>
                  </Pressable>
                </View>
                {extras.length > 0 ? (
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 8 }}>
                    {extras.map((photo) => (
                      <Image
                        key={photo.id}
                        source={{ uri: getBackendAssetUrl(photo.fileRef) }}
                        style={{ width: 120, height: 88, borderRadius: 12, marginRight: 8, backgroundColor: '#F5F5F5' }}
                      />
                    ))}
                  </ScrollView>
                ) : null}
              </>
            );
          })()}
        </Section>

        <Section title="Public contact & hours">
          <Text className="text-xs mb-2" style={{ fontFamily: 'Poppins_500Medium', color: LANDING_MUTED }}>
            Logo (shown on your public website)
          </Text>
          <View className="flex-row items-center mb-4 gap-3">
            <View
              className="w-16 h-16 items-center justify-center overflow-hidden"
              style={{ borderWidth: 1, borderColor: LANDING_BORDER, backgroundColor: '#000' }}
            >
              {logoUrl ? (
                <Image
                  source={{ uri: getBackendAssetUrl(logoUrl) }}
                  style={{ width: 64, height: 64 }}
                  resizeMode="cover"
                />
              ) : (
                <Text style={{ fontFamily: 'Poppins_700Bold', color: '#fff' }}>
                  {(profile.tradingName || 'V').slice(0, 1).toUpperCase()}
                </Text>
              )}
            </View>
            <Pressable
              onPress={handleUploadLogo}
              disabled={uploading || readOnly}
              className="rounded-full border px-4 py-2"
              style={{ borderColor: LANDING_BORDER }}
            >
              <Text style={{ fontFamily: 'Poppins_600SemiBold', color: LANDING_INK }}>
                {uploading ? 'Uploading…' : logoUrl ? 'Replace logo' : 'Upload logo'}
              </Text>
            </Pressable>
          </View>
          <Field label="Description" value={description} onChangeText={setDescription} multiline />
          <Field
            label="Business hours"
            value={businessHours}
            onChangeText={setBusinessHours}
            placeholder="Mon–Sat 8am–6pm"
          />
          <Field label="Public phone" value={publicPhone} onChangeText={setPublicPhone} />
          <Field label="Public WhatsApp" value={publicWhatsApp} onChangeText={setPublicWhatsApp} />
          <Field label="Public email" value={publicEmail} onChangeText={setPublicEmail} />
          <Field label="Website URL" value={websiteUrl} onChangeText={setWebsiteUrl} placeholder="https://" />
          <View className="flex-row flex-wrap mb-2">
            <ToggleChip label="Show phone" active={showPublicPhone} onPress={() => setShowPublicPhone((v) => !v)} />
            <ToggleChip
              label="Show WhatsApp"
              active={showPublicWhatsApp}
              onPress={() => setShowPublicWhatsApp((v) => !v)}
            />
            <ToggleChip label="Show email" active={showPublicEmail} onPress={() => setShowPublicEmail((v) => !v)} />
          </View>
        </Section>

        <Section title="How you sell">
          <View className="flex-row flex-wrap mb-2">
            <ToggleChip
              label="Prices negotiable"
              active={pricesNegotiable}
              onPress={() => setPricesNegotiable((v) => !v)}
            />
            <ToggleChip label="Pickup" active={pickupAvailable} onPress={() => setPickupAvailable((v) => !v)} />
            <ToggleChip
              label="Interstate delivery"
              active={interstateDelivery}
              onPress={() => setInterstateDelivery((v) => !v)}
            />
            <ToggleChip
              label="Nationwide"
              active={nationwideDelivery}
              onPress={() => setNationwideDelivery((v) => !v)}
            />
            <ToggleChip
              label="Installation"
              active={installationAvailable}
              onPress={() => setInstallationAvailable((v) => !v)}
            />
          </View>
          <Text className="text-xs mb-2" style={{ fontFamily: 'Poppins_500Medium', color: LANDING_MUTED }}>
            Payment methods
          </Text>
          <View className="flex-row flex-wrap mb-2">
            {PAYMENT_OPTIONS.map((method) => (
              <ToggleChip
                key={method}
                label={method}
                active={paymentMethods.includes(method)}
                onPress={() => togglePayment(method)}
              />
            ))}
          </View>
        </Section>

        <Section title="Categories">
          <Text className="text-sm mb-2" style={{ fontFamily: 'Poppins_500Medium', color: LANDING_INK }}>
            {(profile.offerings || []).map((offering) => offering.customCategoryLabel || (offering.familyKey || '').replace(/-/g, ' ')).filter(Boolean).join(', ') || 'No category yet'}
          </Text>
          <Text className="text-xs mb-2" style={{ fontFamily: 'Poppins_400Regular', color: LANDING_MUTED }}>
            Categories are set by BuildMyHouse. You can suggest one if yours is missing.
          </Text>
          <Field
            label="Suggest a category"
            value={categorySuggestion}
            onChangeText={setCategorySuggestion}
            placeholder="Insulation, paving stones…"
          />
          <Pressable
            onPress={async () => {
              const suggestion = categorySuggestion.trim();
              if (!suggestion) return;
              try {
                await submitVendorSensitiveChange({ fieldGroup: 'category', proposedPayload: { suggestion } });
                setCategorySuggestion('');
                setNotice('Category suggestion sent.');
              } catch (err) {
                setNotice(err instanceof Error ? err.message : 'Could not send the suggestion.');
              }
            }}
            className="self-start rounded-full px-4 py-2 mb-4"
            style={{ backgroundColor: LANDING_INK }}
          >
            <Text style={{ fontFamily: 'Poppins_600SemiBold', color: '#fff' }}>Send suggestion</Text>
          </Pressable>
        </Section>

        <Section title="Primary offering">
          <Field
            label="Brands (comma-separated)"
            value={brands}
            onChangeText={setBrands}
            placeholder="Dangote, BUA"
          />
          <Field label="Normal unit" value={normalUnit} onChangeText={setNormalUnit} placeholder="bag" />
          <Field label="Minimum order quantity" value={moq} onChangeText={setMoq} placeholder="50" />
          <View className="flex-row flex-wrap mb-2">
            <ToggleChip label="Retail" active={sellsRetail} onPress={() => setSellsRetail((v) => !v)} />
            <ToggleChip label="Wholesale" active={sellsWholesale} onPress={() => setSellsWholesale((v) => !v)} />
            <ToggleChip
              label="Delivers this category"
              active={offeringDelivery}
              onPress={() => setOfferingDelivery((v) => !v)}
            />
          </View>
          <Text className="text-xs mb-4" style={{ fontFamily: 'Poppins_400Regular', color: LANDING_MUTED }}>
            Saving updates brands and how you sell. Your category stays as BuildMyHouse set it.
          </Text>
        </Section>

        <Section title="Delivery / service areas">
          <View className="flex-row flex-wrap mb-2">
            {VENDOR_STATE_FILTERS.map((state) => (
              <ToggleChip
                key={state.stateKey}
                label={state.label}
                active={serviceStateKeys.includes(state.stateKey)}
                onPress={() => toggleServiceState(state.stateKey)}
              />
            ))}
          </View>
        </Section>

        <Pressable
          onPress={handleSaveSafe}
          disabled={saving || readOnly}
          className="rounded-full bg-black px-5 py-3 items-center mb-10"
        >
          {saving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text className="text-white" style={{ fontFamily: 'Poppins_600SemiBold' }}>
              Save public details
            </Text>
          )}
        </Pressable>

        <Section title="Identity changes (needs review)">
          <Text className="text-sm mb-3" style={{ fontFamily: 'Poppins_400Regular', color: LANDING_MUTED }}>
            Trading name, legal name, CAC, and main location do not go live until BuildMyHouse reviews
            them.
          </Text>
          <Field label="Trading name" value={sensitiveTradingName} onChangeText={setSensitiveTradingName} />
          <Field label="Legal name" value={sensitiveLegalName} onChangeText={setSensitiveLegalName} />
          <Field label="CAC number" value={sensitiveCac} onChangeText={setSensitiveCac} />
          <Field label="City" value={sensitiveCity} onChangeText={setSensitiveCity} />
          <Pressable
            onPress={handleSensitiveSubmit}
            disabled={sensitiveBusy || readOnly}
            className="rounded-full border px-5 py-3 items-center mb-4"
            style={{ borderColor: LANDING_BORDER }}
          >
            {sensitiveBusy ? (
              <ActivityIndicator color={LANDING_INK} />
            ) : (
              <Text style={{ fontFamily: 'Poppins_600SemiBold', color: LANDING_INK }}>
                Submit for review
              </Text>
            )}
          </Pressable>
          {(profile.changeRequests || []).length > 0 ? (
            <View className="border rounded-2xl p-3" style={{ borderColor: LANDING_BORDER }}>
              <Text className="text-xs mb-2" style={{ fontFamily: 'Poppins_600SemiBold', color: LANDING_MUTED }}>
                Pending requests
              </Text>
              {profile.changeRequests.map((req) => (
                <Text
                  key={req.id}
                  className="text-sm mb-1"
                  style={{ fontFamily: 'Poppins_400Regular', color: LANDING_INK }}
                >
                  {req.fieldGroup} · {req.status} · {new Date(req.createdAt).toLocaleDateString()}
                </Text>
              ))}
            </View>
          ) : null}
        </Section>

        <Section title="Documents">
          <Text className="text-sm mb-3" style={{ fontFamily: 'Poppins_400Regular', color: LANDING_MUTED }}>
            Uploads stay private and go to BuildMyHouse for review. They are never shown on your public
            profile.
          </Text>
          <Text className="text-xs mb-2" style={{ fontFamily: 'Poppins_500Medium', color: LANDING_MUTED }}>
            Document type
          </Text>
          <View className="flex-row flex-wrap mb-3">
            {VENDOR_DOCUMENT_TYPES.map((type) => (
              <ToggleChip
                key={type.value}
                label={type.label}
                active={docType === type.value}
                onPress={() => setDocType(type.value)}
              />
            ))}
          </View>
          <Pressable
            onPress={handleUploadDocument}
            disabled={uploading || readOnly}
            className="rounded-full border px-5 py-3 items-center mb-4"
            style={{ borderColor: LANDING_BORDER }}
          >
            {uploading ? (
              <ActivityIndicator color={LANDING_INK} />
            ) : (
              <Text style={{ fontFamily: 'Poppins_600SemiBold', color: LANDING_INK }}>
                Upload PDF or image
              </Text>
            )}
          </Pressable>
          {(profile.documents || []).length === 0 ? (
            <Text className="text-sm" style={{ fontFamily: 'Poppins_400Regular', color: LANDING_MUTED }}>
              No documents uploaded yet.
            </Text>
          ) : (
            profile.documents.map((doc) => (
              <View
                key={doc.id}
                className="border rounded-xl px-3 py-2 mb-2"
                style={{ borderColor: LANDING_BORDER }}
              >
                <Text style={{ fontFamily: 'Poppins_600SemiBold', color: LANDING_INK }}>
                  {VENDOR_DOCUMENT_TYPES.find((t) => t.value === doc.documentType)?.label ||
                    doc.documentType}
                </Text>
                <Text className="text-xs" style={{ fontFamily: 'Poppins_400Regular', color: LANDING_MUTED }}>
                  {doc.reviewStatus}
                  {doc.label ? ` · ${doc.label}` : ''}
                  {doc.rejectionReason ? ` · ${doc.rejectionReason}` : ''}
                </Text>
              </View>
            ))
          )}
        </Section>

        <Text className="text-xs mb-8" style={{ fontFamily: 'Poppins_400Regular', color: LANDING_MUTED }}>
          Vendors cannot verify or approve their own profiles. Listing and verification remain
          BuildMyHouse decisions.
        </Text>
      </SeoContentColumn>
    </SeoContentShell>
  );
}
