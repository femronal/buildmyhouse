import { useEffect, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { api } from '@/lib/api';
import { InviteClientSheet } from '@/components/InviteClientSheet';

export default function MyListingsScreen() {
  const router = useRouter();
  const [rows, setRows] = useState<any[]>([]);
  const [error, setError] = useState('');
  const [showInvite, setShowInvite] = useState(false);

  useEffect(() => {
    void api.get('/artisans/my-listings').then(setRows).catch((err) => setError(err.message));
  }, []);

  return (
    <View style={{ flex: 1, backgroundColor: '#fff', padding: 20 }}>
      <Text style={{ fontFamily: 'Poppins_700Bold', fontSize: 28 }}>My listings</Text>
      <Text style={{ fontFamily: 'Poppins_400Regular', color: '#525252', marginTop: 6, marginBottom: 16 }}>
        Listings claimed by this account. A trust score is profile information, not verification.
      </Text>
      <Pressable onPress={() => setShowInvite(true)} style={{ borderWidth: 1, borderColor: '#111', borderRadius: 12, padding: 12, marginBottom: 16 }}>
        <Text style={{ fontFamily: 'Poppins_600SemiBold' }}>Invite your client</Text>
      </Pressable>
      <InviteClientSheet visible={showInvite} onClose={() => setShowInvite(false)} />
      {error ? <Text style={{ color: '#B91C1C' }}>{error}</Text> : null}
      {rows.map((row) => (
        <Pressable key={row.id} onPress={() => router.push(`/contractor/listings/${row.id}` as any)} style={{ borderWidth: 1, borderColor: '#E5E5E5', borderRadius: 16, padding: 14, marginBottom: 12 }}>
          <Text style={{ fontFamily: 'Poppins_700Bold', fontSize: 18 }}>{row.displayName}</Text>
          <Text style={{ fontFamily: 'Poppins_400Regular', marginTop: 4 }}>{row.trade?.label} · {row.listingStatus}</Text>
          <Text style={{ fontFamily: 'Poppins_600SemiBold', marginTop: 6 }}>Trust score {row.trustScore}% · {row.verificationStatus}</Text>
          <Text style={{ fontFamily: 'Poppins_600SemiBold', marginTop: 8 }}>Manage →</Text>
        </Pressable>
      ))}
      {!error && rows.length === 0 ? <Text style={{ fontFamily: 'Poppins_400Regular' }}>No claimed listings yet.</Text> : null}
    </View>
  );
}
