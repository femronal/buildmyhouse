import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Image, Platform, Pressable, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
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
import {
  addManagedProfessionalDocument,
  fetchManagedProfessionalProfile,
  updateManagedProfessionalCredential,
  updateManagedProfessionalProfile,
  type ManagedProfessionalProfile,
} from '@/lib/professional-manage';

const DOC_TYPES = [
  { value: 'licence', label: 'Practising licence' },
  { value: 'cac', label: 'CAC' },
  { value: 'other', label: 'Other' },
] as const;

function credentialStatusLabel(status?: string | null) {
  if (status === 'checked') return 'Credential checked';
  if (status === 'needs_recheck') return 'Needs re-check';
  if (status === 'pending') return 'Pending review';
  if (status === 'rejected') return 'Rejected';
  if (status === 'expired') return 'Expired';
  return 'Not checked';
}

export default function ProfessionalManagePage() {
  const router = useRouter();
  const { data: currentUser, isLoading: userLoading } = useCurrentUser();
  const [profile, setProfile] = useState<ManagedProfessionalProfile | null>(null);
  const [services, setServices] = useState<Array<{ id: string; label: string }>>([]);
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [photoUrl, setPhotoUrl] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [bio, setBio] = useState('');
  const [phone, setPhone] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [website, setWebsite] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [states, setStates] = useState('');
  const [cities, setCities] = useState('');
  const [numbers, setNumbers] = useState<Record<string, string>>({});
  const [docType, setDocType] = useState<(typeof DOC_TYPES)[number]['value']>('licence');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const [missing, setMissing] = useState(false);

  useWebSeo({
    title: 'Manage professional listing | BuildMyHouse',
    description: 'Update the public details on a professional listing you have claimed.',
    canonicalPath: '/professionals/manage',
    robots: 'noindex,nofollow',
  });

  const hydrate = (next: ManagedProfessionalProfile) => {
    setProfile(next);
    setPhotoUrl(next.photoUrl || '');
    setLogoUrl(next.logoUrl || '');
    setBio(next.bio || '');
    setPhone(next.phone || '');
    setWhatsapp(next.whatsapp || '');
    setWebsite(next.website || '');
    setEmail(next.email || '');
    setAddress(next.address || '');
    setStates((next.serviceStates || []).join(', '));
    setCities((next.serviceCities || []).join(', '));
    setSelectedServices((next.services || []).map((service) => service.id).filter(Boolean));
    const nextNumbers: Record<string, string> = {};
    (next.credentials || []).forEach((cred) => {
      nextNumbers[cred.id] = cred.registrationNumber || '';
    });
    setNumbers(nextNumbers);
  };

  useEffect(() => {
    if (userLoading) return;
    if (!currentUser) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const [mine, meta] = await Promise.all([
          fetchManagedProfessionalProfile(),
          api.get<{ services?: Array<{ id: string; label: string }> }>('/professionals/meta'),
        ]);
        if (cancelled) return;
        hydrate(mine);
        setServices(meta.services || []);
      } catch (e: any) {
        if (cancelled) return;
        if (String(e?.message || '').toLowerCase().includes('does not manage')) {
          setMissing(true);
        } else {
          setError(e?.message || 'Unable to load this listing.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [currentUser, userLoading]);

  const splitList = (value: string) =>
    value
      .split(',')
      .map((part) => part.trim())
      .filter(Boolean);

  const saveProfile = async () => {
    setSaving(true);
    setError('');
    setNotice('');
    try {
      const updated = await updateManagedProfessionalProfile({
        photoUrl,
        logoUrl,
        bio,
        phone,
        whatsapp,
        website,
        email,
        address,
        serviceStates: splitList(states),
        serviceCities: splitList(cities),
        serviceIds: selectedServices,
      });
      hydrate(updated);
      setNotice('Public profile updated.');
    } catch (e: any) {
      setError(e?.message || 'Unable to save this listing.');
    } finally {
      setSaving(false);
    }
  };

  const saveCredential = async (credentialId: string) => {
    setSaving(true);
    setError('');
    setNotice('');
    try {
      const updated = await updateManagedProfessionalCredential(credentialId, numbers[credentialId] || '');
      hydrate(updated);
      setNotice('Registration number saved. A previously checked number is sent back for review.');
    } catch (e: any) {
      setError(e?.message || 'Unable to save this registration number.');
    } finally {
      setSaving(false);
    }
  };

  const uploadImage = async (field: 'photoUrl' | 'logoUrl') => {
    setSaving(true);
    setError('');
    setNotice('');
    try {
      if (Platform.OS !== 'web') {
        const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!perm.granted) {
          Alert.alert('Permission required', 'Allow photo library access to add this image.');
          setSaving(false);
          return;
        }
      }
      const picked = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.85,
      });
      if (picked.canceled || !picked.assets?.[0]?.uri) {
        setSaving(false);
        return;
      }
      const url = await uploadListingImage(picked.assets[0]);
      const updated = await updateManagedProfessionalProfile(field === 'photoUrl' ? { photoUrl: url } : { logoUrl: url });
      hydrate(updated);
      setNotice(field === 'photoUrl' ? 'Profile picture updated.' : 'Logo updated.');
    } catch (e: any) {
      setError(e?.message || 'Unable to upload this image.');
    } finally {
      setSaving(false);
    }
  };

  const uploadDocument = async () => {
    setSaving(true);
    setError('');
    setNotice('');
    try {
      const picked = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'image/*'],
        copyToCacheDirectory: true,
        multiple: false,
      });
      if (picked.canceled || !picked.assets?.length) {
        setSaving(false);
        return;
      }
      const asset = picked.assets[0];
      const formData = new FormData();
      if (Platform.OS === 'web') {
        const response = await fetch(asset.uri);
        const blob = await response.blob();
        formData.append('file', blob, asset.name || 'licence.pdf');
      } else {
        formData.append('file', {
          uri: asset.uri,
          name: asset.name || `licence-${Date.now()}.pdf`,
          type: asset.mimeType || 'application/pdf',
        } as any);
      }
      const uploadRes = await api.post('/upload/document', formData);
      const fileRef = String(uploadRes?.url || uploadRes?.key || '').trim();
      if (!fileRef) throw new Error('Upload succeeded but no file reference was returned.');
      await addManagedProfessionalDocument({
        documentType: docType,
        fileRef,
        label: asset.name || undefined,
        mimeType: asset.mimeType || uploadRes?.mimetype,
        fileSizeBytes: asset.size || uploadRes?.size,
      });
      const refreshed = await fetchManagedProfessionalProfile();
      hydrate(refreshed);
      setNotice('Document uploaded for BuildMyHouse review. It stays private.');
    } catch (e: any) {
      setError(e?.message || 'Unable to upload this document.');
    } finally {
      setSaving(false);
    }
  };

  const fieldStyle = {
    borderWidth: 1,
    borderColor: LANDING_BORDER,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 12,
    fontFamily: 'Poppins_400Regular',
    color: LANDING_INK,
  } as const;

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

  if (!currentUser) {
    return (
      <SeoContentShell>
        <SeoContentColumn>
          <SeoContentBackButton fallbackHref="/professionals" />
          <SeoHeading level={1} className={seoContentTypography.title} style={{ fontFamily: 'Poppins_700Bold' }}>
            Manage your listing
          </SeoHeading>
          <Pressable
            onPress={() =>
              requireAuthToContinue({
                router,
                currentUser,
                userLoading,
                destinationPath: '/professionals/manage',
                promptTitle: 'Sign in to manage',
                promptMessage: 'Sign in with the account that claimed this professional listing.',
              })
            }
            className="rounded-full bg-black px-5 py-3 items-center mt-4"
          >
            <Text className="text-white" style={{ fontFamily: 'Poppins_600SemiBold' }}>
              Sign in
            </Text>
          </Pressable>
        </SeoContentColumn>
      </SeoContentShell>
    );
  }

  if (missing || !profile) {
    return (
      <SeoContentShell>
        <SeoContentColumn>
          <SeoContentBackButton fallbackHref="/professionals" />
          <SeoHeading level={1} className={seoContentTypography.title} style={{ fontFamily: 'Poppins_700Bold' }}>
            No listing on this account
          </SeoHeading>
          <Text style={{ fontFamily: 'Poppins_400Regular', color: LANDING_MUTED, marginTop: 8 }}>
            {error || 'Claiming a professional listing is by invite only. Open the link BuildMyHouse sent you.'}
          </Text>
        </SeoContentColumn>
      </SeoContentShell>
    );
  }

  return (
    <SeoContentShell>
      <SeoContentColumn>
        <SeoContentBackButton fallbackHref={`/professionals/${profile.slug}`} />
        <SeoHeading level={1} className={seoContentTypography.title} style={{ fontFamily: 'Poppins_700Bold' }}>
          {profile.displayName}
        </SeoHeading>
        <Text className="text-sm mb-6" style={{ fontFamily: 'Poppins_400Regular', color: LANDING_MUTED }}>
          Update the public profile. Licence files stay private until BuildMyHouse reviews them. You cannot change
          Listed, Credential checked, BMH Verified, or Used by BMH.
        </Text>

        {notice ? <Text style={{ fontFamily: 'Poppins_500Medium', color: '#166534', marginBottom: 12 }}>{notice}</Text> : null}
        {error ? <Text style={{ fontFamily: 'Poppins_500Medium', color: '#B91C1C', marginBottom: 12 }}>{error}</Text> : null}

        <Text style={{ fontFamily: 'Poppins_700Bold', color: LANDING_INK, fontSize: 18, marginBottom: 8 }}>
          Profile picture and logo
        </Text>
        <Text className="text-sm mb-3" style={{ fontFamily: 'Poppins_400Regular', color: LANDING_MUTED }}>
          These appear on the public listing. A picture does not mean the listing is verified.
        </Text>
        <View style={{ flexDirection: 'row', marginBottom: 20 }}>
          <Pressable onPress={() => uploadImage('photoUrl')} disabled={saving} style={{ marginRight: 16, alignItems: 'center' }}>
            <View
              style={{
                width: 88,
                height: 88,
                borderRadius: 44,
                overflow: 'hidden',
                borderWidth: 1,
                borderColor: LANDING_BORDER,
                backgroundColor: '#F5F5F5',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {photoUrl ? (
                <Image source={{ uri: getBackendAssetUrl(photoUrl) }} style={{ width: 88, height: 88 }} resizeMode="cover" />
              ) : (
                <Text style={{ fontFamily: 'Poppins_600SemiBold', color: LANDING_INK, fontSize: 12 }}>Photo</Text>
              )}
            </View>
            <Text style={{ fontFamily: 'Poppins_600SemiBold', color: LANDING_INK, marginTop: 8, fontSize: 13 }}>
              {photoUrl ? 'Change photo' : 'Add photo'}
            </Text>
          </Pressable>
          <Pressable onPress={() => uploadImage('logoUrl')} disabled={saving} style={{ alignItems: 'center' }}>
            <View
              style={{
                width: 88,
                height: 88,
                borderRadius: 16,
                overflow: 'hidden',
                borderWidth: 1,
                borderColor: LANDING_BORDER,
                backgroundColor: '#fff',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {logoUrl ? (
                <Image source={{ uri: getBackendAssetUrl(logoUrl) }} style={{ width: 72, height: 72 }} resizeMode="contain" />
              ) : (
                <Text style={{ fontFamily: 'Poppins_600SemiBold', color: LANDING_INK, fontSize: 12 }}>Logo</Text>
              )}
            </View>
            <Text style={{ fontFamily: 'Poppins_600SemiBold', color: LANDING_INK, marginTop: 8, fontSize: 13 }}>
              {logoUrl ? 'Change logo' : 'Add logo'}
            </Text>
          </Pressable>
        </View>

        <Text style={{ fontFamily: 'Poppins_600SemiBold', color: LANDING_INK, marginBottom: 6 }}>Description</Text>
        <TextInput value={bio} onChangeText={setBio} multiline style={{ ...fieldStyle, minHeight: 120 }} />
        <Text style={{ fontFamily: 'Poppins_600SemiBold', color: LANDING_INK, marginBottom: 6 }}>Phone</Text>
        <TextInput value={phone} onChangeText={setPhone} style={fieldStyle} />
        <Text style={{ fontFamily: 'Poppins_600SemiBold', color: LANDING_INK, marginBottom: 6 }}>WhatsApp</Text>
        <TextInput value={whatsapp} onChangeText={setWhatsapp} style={fieldStyle} />
        <Text style={{ fontFamily: 'Poppins_600SemiBold', color: LANDING_INK, marginBottom: 6 }}>Email</Text>
        <TextInput value={email} onChangeText={setEmail} autoCapitalize="none" style={fieldStyle} />
        <Text style={{ fontFamily: 'Poppins_600SemiBold', color: LANDING_INK, marginBottom: 6 }}>Website</Text>
        <TextInput value={website} onChangeText={setWebsite} autoCapitalize="none" style={fieldStyle} />
        <Text style={{ fontFamily: 'Poppins_600SemiBold', color: LANDING_INK, marginBottom: 6 }}>Address</Text>
        <TextInput value={address} onChangeText={setAddress} style={fieldStyle} />
        <Text style={{ fontFamily: 'Poppins_600SemiBold', color: LANDING_INK, marginBottom: 6 }}>States served</Text>
        <TextInput value={states} onChangeText={setStates} placeholder="Lagos, Ogun" style={fieldStyle} />
        <Text style={{ fontFamily: 'Poppins_600SemiBold', color: LANDING_INK, marginBottom: 6 }}>Cities served</Text>
        <TextInput value={cities} onChangeText={setCities} placeholder="Ikeja, Lekki" style={fieldStyle} />

        <Text style={{ fontFamily: 'Poppins_600SemiBold', color: LANDING_INK, marginBottom: 8 }}>Services</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 16 }}>
          {services.map((service) => {
            const active = selectedServices.includes(service.id);
            return (
              <Pressable
                key={service.id}
                onPress={() =>
                  setSelectedServices((current) =>
                    active ? current.filter((id) => id !== service.id) : [...current, service.id],
                  )
                }
                style={{
                  borderWidth: 1,
                  borderColor: LANDING_BORDER,
                  borderRadius: 999,
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  marginRight: 8,
                  marginBottom: 8,
                  backgroundColor: active ? LANDING_INK : 'transparent',
                }}
              >
                <Text style={{ fontFamily: 'Poppins_500Medium', color: active ? '#fff' : LANDING_INK, fontSize: 12 }}>
                  {service.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <Pressable onPress={saveProfile} disabled={saving} className="rounded-full bg-black px-5 py-3 items-center mb-8">
          <Text className="text-white" style={{ fontFamily: 'Poppins_600SemiBold' }}>
            {saving ? 'Saving…' : 'Save public profile'}
          </Text>
        </Pressable>

        <Text style={{ fontFamily: 'Poppins_700Bold', color: LANDING_INK, fontSize: 18, marginBottom: 8 }}>
          Registration numbers
        </Text>
        <Text className="text-sm mb-3" style={{ fontFamily: 'Poppins_400Regular', color: LANDING_MUTED }}>
          Changing a number that BuildMyHouse already checked sends that credential back to needs re-check.
        </Text>
        {(profile.credentials || []).map((cred) => (
          <View key={cred.id} style={{ marginBottom: 16 }}>
            <Text style={{ fontFamily: 'Poppins_500Medium', color: LANDING_INK, marginBottom: 4 }}>
              {cred.regulatorLabel || 'Registration'} · {credentialStatusLabel(cred.verificationStatus)}
            </Text>
            <TextInput
              value={numbers[cred.id] || ''}
              onChangeText={(value) => setNumbers((current) => ({ ...current, [cred.id]: value }))}
              style={fieldStyle}
            />
            <Pressable onPress={() => saveCredential(cred.id)} disabled={saving} className="rounded-full border px-4 py-2 items-center">
              <Text style={{ fontFamily: 'Poppins_600SemiBold', color: LANDING_INK }}>Save number</Text>
            </Pressable>
          </View>
        ))}

        <Text style={{ fontFamily: 'Poppins_700Bold', color: LANDING_INK, fontSize: 18, marginTop: 12, marginBottom: 8 }}>
          Private documents
        </Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 12 }}>
          {DOC_TYPES.map((item) => (
            <Pressable
              key={item.value}
              onPress={() => setDocType(item.value)}
              style={{
                borderWidth: 1,
                borderColor: LANDING_BORDER,
                borderRadius: 999,
                paddingHorizontal: 12,
                paddingVertical: 6,
                marginRight: 8,
                marginBottom: 8,
                backgroundColor: docType === item.value ? LANDING_INK : 'transparent',
              }}
            >
              <Text style={{ color: docType === item.value ? '#fff' : LANDING_INK, fontFamily: 'Poppins_500Medium', fontSize: 12 }}>
                {item.label}
              </Text>
            </Pressable>
          ))}
        </View>
        <Pressable onPress={uploadDocument} disabled={saving} className="rounded-full bg-black px-5 py-3 items-center mb-4">
          <Text className="text-white" style={{ fontFamily: 'Poppins_600SemiBold' }}>
            Upload PDF or image
          </Text>
        </Pressable>
        {(profile.documents || []).map((doc) => (
          <Text key={doc.id} style={{ fontFamily: 'Poppins_400Regular', color: LANDING_MUTED, marginBottom: 6 }}>
            {doc.label || doc.documentType} · {doc.reviewStatus}
          </Text>
        ))}
      </SeoContentColumn>
    </SeoContentShell>
  );
}
