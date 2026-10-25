import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Linking, Platform, Pressable, Text, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { SeoContentColumn, SeoContentShell } from '@/components/seo/SeoContentLayout';
import { SeoHeading } from '@/components/seo/SeoHeading';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { API_BASE_URL, api } from '@/lib/api';
import { clearAuthToken } from '@/lib/auth';
import { useWebSeo } from '@/lib/seo';

const CONTRACTOR_APP_URL = 'https://gc.buildmyhouse.app/';

export default function ArtisanClaimPage() {
  const queryClient = useQueryClient();
  const { data: currentUser, isLoading: userLoading } = useCurrentUser();
  const params = useLocalSearchParams<{ token?: string | string[] }>();
  const token = useMemo(() => (Array.isArray(params.token) ? params.token[0] : params.token)?.trim() || '', [params.token]);
  const [preview, setPreview] = useState<any>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

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

  const openContractorApp = async (path: string) => {
    const url = `${CONTRACTOR_APP_URL}${path}`;
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      window.location.assign(url);
      return;
    }
    await Linking.openURL(url);
  };

  const claim = async () => {
    if (!token || userLoading) return;
    if (!currentUser) {
      await openContractorApp(`claim-listing/${encodeURIComponent(token)}`);
      return;
    }
    setError('');
    setBusy(true);
    try {
      await api.post(`/artisans/claim/${encodeURIComponent(token)}`, {});
      await clearAuthToken();
      queryClient.clear();
      await openContractorApp('');
    } catch (err: any) {
      setError(err?.message || 'Unable to claim this listing.');
      setBusy(false);
    }
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
        {preview ? (
          <View style={{ borderWidth: 1, borderColor: '#E5E5E5', borderRadius: 16, padding: 16 }}>
            <Text style={{ fontFamily: 'Poppins_700Bold', fontSize: 22 }}>{preview.displayName}</Text>
            <Text style={{ marginTop: 4 }}>{preview.trade}{preview.city ? ` · ${preview.city}` : ''}</Text>
            <Pressable onPress={claim} disabled={busy} style={{ marginTop: 16, backgroundColor: '#171717', borderRadius: 999, minHeight: 48, alignItems: 'center', justifyContent: 'center' }}>
              {busy ? <ActivityIndicator color="#fff" /> : (
                <Text style={{ color: '#fff', fontFamily: 'Poppins_600SemiBold' }}>
                  {currentUser ? 'Claim this listing' : 'Create artisan account and claim'}
                </Text>
              )}
            </Pressable>
          </View>
        ) : null}
      </SeoContentColumn>
    </SeoContentShell>
  );
}
