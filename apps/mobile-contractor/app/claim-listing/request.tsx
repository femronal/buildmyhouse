import { useMemo, useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { api } from '@/lib/api';
import { getAuthToken } from '@/lib/auth';

export default function RequestArtisanClaimScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ slug?: string | string[] }>();
  const slug = useMemo(() => (Array.isArray(params.slug) ? params.slug[0] : params.slug) || '', [params.slug]);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');

  const submit = async () => {
    const auth = await getAuthToken();
    if (!auth) {
      router.push(`/email-login?mode=signup&claimToken=request&slug=${encodeURIComponent(slug)}` as any);
      return;
    }
    setError('');
    try {
      await api.post('/artisans/claims', { slug, requesterName: name, email, phone });
      setNotice('Claim request sent. BuildMyHouse will review it before the listing is linked. This is not instant verification.');
    } catch (err: any) {
      setError(err?.message || 'Unable to send this claim request.');
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#fff', padding: 24 }}>
      <Text style={{ fontFamily: 'Poppins_700Bold', fontSize: 32 }}>Claim this listing</Text>
      <Text style={{ fontFamily: 'Poppins_400Regular', color: '#525252', marginTop: 8, lineHeight: 22 }}>
        A public claim is reviewed. It does not take over the listing immediately, and it does not verify the business.
      </Text>
      <Text style={{ marginTop: 16, fontFamily: 'Poppins_600SemiBold' }}>Listing</Text>
      <Text style={{ fontFamily: 'Poppins_400Regular' }}>{slug || 'Missing listing'}</Text>
      <TextInput value={name} onChangeText={setName} placeholder="Your name" style={field} />
      <TextInput value={email} onChangeText={setEmail} placeholder="Email" autoCapitalize="none" style={field} />
      <TextInput value={phone} onChangeText={setPhone} placeholder="Phone" style={field} />
      {error ? <Text style={{ color: '#B91C1C' }}>{error}</Text> : null}
      {notice ? <Text style={{ color: '#166534', marginTop: 8 }}>{notice}</Text> : null}
      <Pressable onPress={submit} style={{ marginTop: 16, backgroundColor: '#171717', borderRadius: 999, minHeight: 48, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ color: '#fff', fontFamily: 'Poppins_600SemiBold' }}>Send claim request</Text>
      </Pressable>
    </View>
  );
}

const field = { borderWidth: 1, borderColor: '#E5E5E5', borderRadius: 12, padding: 12, marginTop: 12 } as const;
