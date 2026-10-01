import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, Text, TextInput, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import * as ImagePicker from 'expo-image-picker';
import { SeoContentColumn, SeoContentShell } from '@/components/seo/SeoContentLayout';
import { SeoHeading } from '@/components/seo/SeoHeading';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { API_BASE_URL, api } from '@/lib/api';
import { uploadListingImage } from '@/lib/listing-image-upload';
import { requireAuthToContinue } from '@/lib/require-auth-to-continue';
import { useWebSeo } from '@/lib/seo';

export default function ArtisanClaimPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: currentUser, isLoading: userLoading } = useCurrentUser();
  const params = useLocalSearchParams<{ token?: string | string[] }>();
  const token = useMemo(() => (Array.isArray(params.token) ? params.token[0] : params.token)?.trim() || '', [params.token]);
  const [preview, setPreview] = useState<any>(null);
  const [listing, setListing] = useState<any>(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [phone, setPhone] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [bio, setBio] = useState('');
  const [areas, setAreas] = useState('');

  useWebSeo({
    title: 'Claim artisan listing | BuildMyHouse',
    description: 'Claim an artisan listing and update public details. Claiming is not verification.',
    canonicalPath: token ? `/artisans/claim/${token}` : '/artisans/claim',
    robots: 'noindex,nofollow',
  });

  useEffect(() => {
    if (!token) return;
    void fetch(`${API_BASE_URL}/artisans/claim/${encodeURIComponent(token)}`)
      .then(async (response) => {
        if (!response.ok) throw new Error('This claim link is invalid, expired, or already used.');
        setPreview(await response.json());
      })
      .catch((err) => setError(err.message));
  }, [token]);

  const claim = async () => {
    const canContinue = await requireAuthToContinue({
      router,
      currentUser,
      userLoading,
      destinationPath: `/artisans/claim/${token}`,
      promptTitle: 'Sign in to claim',
      promptMessage: 'Sign in to attach this artisan listing to your account. Claiming is not verification.',
    });
    if (!canContinue) return;
    setError('');
    try {
      const result = await api.post(`/artisans/claim/${encodeURIComponent(token)}`, {});
      await queryClient.invalidateQueries({ queryKey: ['currentUser'] });
      setListing(result.listing);
      setPhone(result.listing?.phone || '');
      setWhatsapp(result.listing?.whatsapp || '');
      setBio(result.listing?.bio || '');
      setNotice('Listing claimed. You can update public details. You cannot verify yourself.');
    } catch (err: any) {
      setError(err?.message || 'Unable to claim this listing.');
    }
  };

  const save = async () => {
    if (!listing?.id) return;
    const parts = areas.split(',').map((item) => item.trim()).filter(Boolean);
    const updated = await api.patch(`/artisans/my-listings/${listing.id}`, { phone, whatsapp, bio, serviceCities: parts });
    setListing(updated);
    setNotice('Public details saved. Verification stays with BuildMyHouse.');
  };

  const upload = async (mediaType: 'logo' | 'workshop_cover' | 'work_gallery', checkKey?: string) => {
    if (!listing?.id) return;
    const picked = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.85 });
    if (picked.canceled || !picked.assets?.[0]) return;
    const url = await uploadListingImage(picked.assets[0]);
    if (checkKey) {
      const updated = await api.post(`/artisans/my-listings/${listing.id}/verification`, { checkKey, evidenceFileRef: url });
      setListing(updated);
      setNotice('Document uploaded for BuildMyHouse review. It is not shown on the public listing.');
      return;
    }
    const updated = await api.post(`/artisans/my-listings/${listing.id}/media`, { mediaType, fileRef: url });
    setListing(updated);
    setNotice('Photo saved.');
  };

  return (
    <SeoContentShell>
      <SeoContentColumn>
        <SeoHeading level={1} style={{ fontFamily: 'Poppins_700Bold' }}>Claim your artisan listing</SeoHeading>
        <Text style={{ fontFamily: 'Poppins_400Regular', marginBottom: 16 }}>
          This invite attaches the listing to your account. Claiming is not verification, and you cannot mark yourself verified.
        </Text>
        {!preview && !error ? <ActivityIndicator /> : null}
        {error ? <Text style={{ color: '#B91C1C', marginBottom: 12 }}>{error}</Text> : null}
        {preview && !listing ? (
          <View style={{ borderWidth: 1, borderColor: '#E5E5E5', borderRadius: 16, padding: 16 }}>
            <Text style={{ fontFamily: 'Poppins_700Bold', fontSize: 22 }}>{preview.displayName}</Text>
            <Text style={{ marginTop: 4 }}>{preview.trade}{preview.city ? ` · ${preview.city}` : ''}</Text>
            <Pressable onPress={claim} style={{ marginTop: 16, backgroundColor: '#171717', borderRadius: 999, minHeight: 48, alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ color: '#fff', fontFamily: 'Poppins_600SemiBold' }}>{currentUser ? 'Claim this listing' : 'Sign in and claim'}</Text>
            </Pressable>
          </View>
        ) : null}
        {listing ? (
          <View>
            {notice ? <Text style={{ color: '#166534', marginBottom: 12 }}>{notice}</Text> : null}
            <Text style={{ fontFamily: 'Poppins_700Bold', fontSize: 20, marginBottom: 8 }}>{listing.displayName}</Text>
            <Text style={{ marginBottom: 8 }}>Trust score {listing.trustScore}%. This is not verification.</Text>
            {(listing.trustSuggestions || []).slice(0, 4).map((item: any) => (
              <Text key={item.key} style={{ marginBottom: 4 }}>+{item.points}% — {item.label}</Text>
            ))}
            <Field label="Phone" value={phone} onChangeText={setPhone} />
            <Field label="WhatsApp" value={whatsapp} onChangeText={setWhatsapp} />
            <Field label="Description" value={bio} onChangeText={setBio} />
            <Field label="Areas served" value={areas} onChangeText={setAreas} />
            <Pressable onPress={save} style={button}><Text style={buttonText}>Save public details</Text></Pressable>
            <Pressable onPress={() => upload('logo')} style={button}><Text style={buttonText}>Upload logo</Text></Pressable>
            <Pressable onPress={() => upload('workshop_cover')} style={button}><Text style={buttonText}>Upload workshop photo</Text></Pressable>
            <Pressable onPress={() => upload('work_gallery')} style={button}><Text style={buttonText}>Upload work photo</Text></Pressable>
            <Pressable onPress={() => upload('work_gallery', 'identity_checked')} style={button}><Text style={buttonText}>Upload ID for review</Text></Pressable>
            <Pressable onPress={() => upload('work_gallery', 'business_registration_checked')} style={button}><Text style={buttonText}>Upload CAC for review</Text></Pressable>
          </View>
        ) : null}
      </SeoContentColumn>
    </SeoContentShell>
  );
}

const button = { marginTop: 10, backgroundColor: '#171717', borderRadius: 999, minHeight: 44, alignItems: 'center' as const, justifyContent: 'center' as const };
const buttonText = { color: '#fff', fontFamily: 'Poppins_600SemiBold' };

function Field({ label, value, onChangeText }: { label: string; value: string; onChangeText: (value: string) => void }) {
  return (
    <View style={{ marginTop: 10 }}>
      <Text style={{ fontFamily: 'Poppins_600SemiBold', marginBottom: 4 }}>{label}</Text>
      <TextInput value={value} onChangeText={onChangeText} style={{ borderWidth: 1, borderColor: '#E5E5E5', borderRadius: 12, padding: 10 }} />
    </View>
  );
}
