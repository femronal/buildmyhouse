import { useEffect, useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { api } from '@/lib/api';
import { Platform } from 'react-native';

export default function ManageArtisanListingScreen() {
  const params = useLocalSearchParams<{ id?: string }>();
  const id = String(params.id || '');
  const [listing, setListing] = useState<any>(null);
  const [bio, setBio] = useState('');
  const [phone, setPhone] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [city, setCity] = useState('');
  const [stateName, setStateName] = useState('');
  const [areas, setAreas] = useState('');
  const [notice, setNotice] = useState('');

  const load = async () => {
    const data = await api.get(`/artisans/my-listings/${id}`);
    setListing(data);
    setBio(data.bio || '');
    setPhone(data.phone || '');
    setWhatsapp(data.whatsapp || '');
    setCity(data.city || '');
    setStateName(data.state || '');
    setAreas([...(data.serviceCities || []), ...(data.serviceStates || [])].join(', '));
  };

  useEffect(() => {
    if (id) void load().catch((error) => setNotice(error.message));
  }, [id]);

  const save = async () => {
    const parts = areas.split(',').map((item) => item.trim()).filter(Boolean);
    const updated = await api.patch(`/artisans/my-listings/${id}`, {
      bio,
      phone,
      whatsapp,
      city,
      state: stateName,
      serviceCities: parts,
    });
    setListing(updated);
    setNotice('Public listing updated.');
  };

  const upload = async (mediaType: 'logo' | 'workshop_cover' | 'work_gallery') => {
    const picked = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.85 });
    if (picked.canceled || !picked.assets?.[0]) return;
    const asset = picked.assets[0];
    const form = new FormData();
    if (Platform.OS === 'web') {
      const blob = await (await fetch(asset.uri)).blob();
      form.append('file', blob, asset.fileName || 'photo.jpg');
    } else {
      form.append('file', { uri: asset.uri, name: asset.fileName || 'photo.jpg', type: asset.mimeType || 'image/jpeg' } as any);
    }
    const uploaded = await api.post('/upload/image', form);
    const updated = await api.post(`/artisans/my-listings/${id}/media`, { mediaType, fileRef: uploaded.url });
    setListing(updated);
    setNotice('Photo added. The trust score uses the stored listing, not a typed number.');
  };

  if (!listing) return <View style={{ padding: 24 }}><Text>Loading listing…</Text></View>;

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#fff' }} contentContainerStyle={{ padding: 20, paddingBottom: 48 }}>
      <Text style={{ fontFamily: 'Poppins_700Bold', fontSize: 28 }}>{listing.displayName}</Text>
      <Text style={{ fontFamily: 'Poppins_700Bold', fontSize: 42, marginTop: 8 }}>{listing.trustScore}%</Text>
      <Text style={{ fontFamily: 'Poppins_600SemiBold' }}>Trust score</Text>
      <Text style={{ fontFamily: 'Poppins_400Regular', color: '#525252', marginTop: 6, lineHeight: 22 }}>{listing.trustExplanation}</Text>
      {(listing.trustSuggestions || []).map((item: any) => (
        <Text key={item.key} style={{ fontFamily: 'Poppins_500Medium', marginTop: 8 }}>+{item.points}% — {item.label}</Text>
      ))}
      {notice ? <Text style={{ marginTop: 12 }}>{notice}</Text> : null}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 16 }}>
        <Action label="Upload logo" onPress={() => upload('logo')} />
        <Action label="Workshop front" onPress={() => upload('workshop_cover')} />
        <Action label="Completed work" onPress={() => upload('work_gallery')} />
      </View>
      <Label text="Description" />
      <TextInput value={bio} onChangeText={setBio} multiline style={field} />
      <Label text="Phone" />
      <TextInput value={phone} onChangeText={setPhone} style={field} />
      <Label text="WhatsApp" />
      <TextInput value={whatsapp} onChangeText={setWhatsapp} style={field} />
      <Label text="City" />
      <TextInput value={city} onChangeText={setCity} style={field} />
      <Label text="State" />
      <TextInput value={stateName} onChangeText={setStateName} style={field} />
      <Label text="Areas served, comma separated" />
      <TextInput value={areas} onChangeText={setAreas} style={field} />
      <Pressable onPress={save} style={{ backgroundColor: '#171717', borderRadius: 999, minHeight: 48, alignItems: 'center', justifyContent: 'center', marginTop: 8 }}>
        <Text style={{ color: '#fff', fontFamily: 'Poppins_600SemiBold' }}>Save public details</Text>
      </Pressable>
      <Pressable
        onPress={async () => {
          const updated = await api.post(`/artisans/my-listings/${id}/verification`, { checkKey: 'identity_checked', notes: 'Identity document submitted from the contractor app.' });
          setListing(updated);
          setNotice('Verification evidence submitted for review. This does not verify the listing by itself.');
        }}
        style={{ marginTop: 12, minHeight: 44, justifyContent: 'center' }}
      >
        <Text style={{ fontFamily: 'Poppins_600SemiBold' }}>Submit verification</Text>
      </Pressable>
    </ScrollView>
  );
}

const field = { borderWidth: 1, borderColor: '#E5E5E5', borderRadius: 12, padding: 12, marginBottom: 12 } as const;

function Label({ text }: { text: string }) {
  return <Text style={{ fontFamily: 'Poppins_600SemiBold', marginBottom: 4 }}>{text}</Text>;
}

function Action({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={{ borderWidth: 1, borderColor: '#E5E5E5', borderRadius: 999, paddingHorizontal: 12, paddingVertical: 10, marginRight: 8, marginBottom: 8, minHeight: 44, justifyContent: 'center' }}>
      <Text style={{ fontFamily: 'Poppins_600SemiBold' }}>{label}</Text>
    </Pressable>
  );
}
