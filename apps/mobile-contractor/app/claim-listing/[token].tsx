import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { getAuthToken } from '@/lib/auth';

export default function ClaimListingScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const params = useLocalSearchParams<{ token?: string | string[] }>();
  const token = useMemo(() => (Array.isArray(params.token) ? params.token[0] : params.token) || '', [params.token]);
  const [preview, setPreview] = useState<any>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!token || token === 'request') return;
    void fetch(`${process.env.EXPO_PUBLIC_API_URL || 'https://api.buildmyhouse.app/api'}/artisans/claim/${encodeURIComponent(token)}`)
      .then(async (response) => {
        if (!response.ok) throw new Error('This claim link is invalid, expired, or already used.');
        setPreview(await response.json());
      })
      .catch((err) => setError(err.message));
  }, [token]);

  const claim = async () => {
    const auth = await getAuthToken();
    if (!auth) {
      router.push(`/email-login?claimToken=${encodeURIComponent(token)}&mode=signup` as any);
      return;
    }
    setBusy(true);
    setError('');
    try {
      await api.post(`/artisans/claim/${encodeURIComponent(token)}`, {});
      const me = await api.get('/auth/me');
      queryClient.setQueryData(['current-user'], me);
      router.replace('/contractor/gc-dashboard?listingIntro=1' as any);
    } catch (err: any) {
      setError(err?.message || 'Unable to claim this listing.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#fff', padding: 24, justifyContent: 'center' }}>
      <Text style={{ fontFamily: 'Poppins_700Bold', fontSize: 32, color: '#171717' }}>Claim your artisan listing</Text>
      <Text style={{ fontFamily: 'Poppins_400Regular', color: '#525252', marginTop: 8, lineHeight: 22 }}>
        Claiming connects the listing to your contractor account. It does not verify the business or mark it as used by BuildMyHouse.
      </Text>
      {preview ? (
        <View style={{ marginTop: 20, borderWidth: 1, borderColor: '#E5E5E5', borderRadius: 16, padding: 16 }}>
          <Text style={{ fontFamily: 'Poppins_700Bold', fontSize: 20 }}>{preview.displayName}</Text>
          <Text style={{ fontFamily: 'Poppins_400Regular', marginTop: 4 }}>{preview.trade}{preview.city ? ` · ${preview.city}` : ''}</Text>
        </View>
      ) : null}
      {error ? <Text style={{ color: '#B91C1C', marginTop: 12 }}>{error}</Text> : null}
      <Pressable onPress={claim} disabled={busy || !token || token === 'request'} style={{ marginTop: 20, backgroundColor: '#171717', borderRadius: 999, minHeight: 48, alignItems: 'center', justifyContent: 'center' }}>
        {busy ? <ActivityIndicator color="#fff" /> : <Text style={{ color: '#fff', fontFamily: 'Poppins_600SemiBold' }}>Claim this listing</Text>}
      </Pressable>
    </View>
  );
}
