import { useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { SeoContentColumn, SeoContentShell } from '@/components/seo/SeoContentLayout';
import { SeoHeading } from '@/components/seo/SeoHeading';
import { useWebSeo } from '@/lib/seo';

const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL ||
  (__DEV__ ? 'http://localhost:3001/api' : 'https://api.buildmyhouse.app/api');

export default function ArtisanApplyPage() {
  const [displayName, setDisplayName] = useState('');
  const [tradeKey, setTradeKey] = useState('plumber');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [bio, setBio] = useState('');
  const [companyFax, setCompanyFax] = useState('');
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');

  useWebSeo({
    title: 'List a repair business | BuildMyHouse',
    description: 'Add a repair business to the BuildMyHouse artisan directory.',
    canonicalPath: '/artisans/apply',
    robots: 'noindex,nofollow',
  });

  const submit = async () => {
    setError('');
    setNotice('');
    const response = await fetch(`${API_BASE_URL}/artisans/applications`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ displayName, tradeKey, phone, city, state, bio, companyFax }),
    });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) {
      setError(body?.message || 'Unable to list this business.');
      return;
    }
    setNotice('Application received. It is not public until BuildMyHouse reviews it.');
  };

  return (
    <SeoContentShell>
      <SeoContentColumn>
        <SeoHeading level={1} style={{ fontFamily: 'Poppins_700Bold' }}>List my repair business</SeoHeading>
        <Field label="Business or artisan name" value={displayName} onChangeText={setDisplayName} />
        <Field label="Trade key, for example plumber" value={tradeKey} onChangeText={setTradeKey} />
        <Field label="Phone" value={phone} onChangeText={setPhone} />
        <Field label="City" value={city} onChangeText={setCity} />
        <Field label="State" value={state} onChangeText={setState} />
        <Field label="Short description" value={bio} onChangeText={setBio} />
        <TextInput value={companyFax} onChangeText={setCompanyFax} accessibilityElementsHidden importantForAccessibility="no" style={{ position: 'absolute', left: -9999, height: 0, width: 0 }} />
        {error ? <Text style={{ color: '#B91C1C', marginBottom: 8 }}>{String(error)}</Text> : null}
        {notice ? <Text style={{ color: '#166534', marginBottom: 8 }}>{notice}</Text> : null}
        <Pressable onPress={submit} style={{ backgroundColor: '#171717', borderRadius: 999, minHeight: 48, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ color: '#fff', fontFamily: 'Poppins_600SemiBold' }}>Submit for review</Text>
        </Pressable>
      </SeoContentColumn>
    </SeoContentShell>
  );
}

function Field({ label, value, onChangeText }: { label: string; value: string; onChangeText: (value: string) => void }) {
  return (
    <View style={{ marginBottom: 12 }}>
      <Text style={{ fontFamily: 'Poppins_600SemiBold', marginBottom: 4 }}>{label}</Text>
      <TextInput value={value} onChangeText={onChangeText} style={{ borderWidth: 1, borderColor: '#E5E5E5', borderRadius: 12, padding: 12 }} />
    </View>
  );
}
