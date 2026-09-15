import { useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import {
  SeoContentBackButton,
  SeoContentColumn,
  SeoContentShell,
  seoContentTypography,
} from '@/components/seo/SeoContentLayout';
import { SeoHeading } from '@/components/seo/SeoHeading';
import { LANDING_BORDER, LANDING_INK, LANDING_MUTED } from '@/lib/home-landing-content';
import { fetchPublicProfessionals, submitProfessionalClaim } from '@/lib/public-professionals';
import { useWebSeo } from '@/lib/seo';

export default function ProfessionalManagePage() {
  const [query, setQuery] = useState('');
  const [matches, setMatches] = useState<Array<{ id: string; slug: string; displayName: string }>>([]);
  const [selected, setSelected] = useState<{ id: string; slug: string; displayName: string } | null>(null);
  const [form, setForm] = useState({
    requesterName: '',
    relationshipToPractice: '',
    email: '',
    phone: '',
    proofMethod: 'email_domain',
    proofNotes: '',
  });
  const [done, setDone] = useState('');
  const [error, setError] = useState('');

  useWebSeo({
    title: 'Claim a professional listing | BuildMyHouse',
    description: 'Claim an existing BuildMyHouse professional listing. Claiming is not the same as credential verification.',
    canonicalPath: '/professionals/manage',
    robots: 'noindex,nofollow',
  });

  const search = async () => {
    const result = await fetchPublicProfessionals({ q: query, limit: 8 });
    setMatches(result.professionals.map((p) => ({ id: p.id, slug: p.slug, displayName: p.displayName })));
  };

  const submit = async () => {
    if (!selected) return;
    setError('');
    try {
      const result = await submitProfessionalClaim({ ...form, listingId: selected.id, slug: selected.slug });
      setDone(result.message);
    } catch (err) {
      setError((err as Error).message);
    }
  };

  return (
    <SeoContentShell contentContainerStyle={{ paddingBottom: 48 }}>
      <SeoContentColumn className="pt-10 md:pt-14">
        <SeoContentBackButton fallbackHref="/professionals" />
        <SeoHeading level={1} className={seoContentTypography.title} style={{ fontFamily: 'Poppins_700Bold', color: LANDING_INK }}>
          Manage or claim a listing
        </SeoHeading>
        <Text className="mt-2 mb-4" style={{ fontFamily: 'Poppins_400Regular', color: LANDING_MUTED }}>
          A professional can exist here without a BuildMyHouse account. Claiming proves control of the listing. It does not mean credentials were checked.
        </Text>
        {done ? (
          <Text style={{ fontFamily: 'Poppins_600SemiBold', color: LANDING_INK }}>{done}</Text>
        ) : (
          <View>
            <TextInput value={query} onChangeText={setQuery} placeholder="Search the listed name" className="border rounded-xl px-3 py-2 mb-2" style={{ borderColor: LANDING_BORDER }} />
            <Pressable onPress={search} className="mb-3">
              <Text style={{ fontFamily: 'Poppins_600SemiBold', color: LANDING_INK }}>Find listing</Text>
            </Pressable>
            {matches.map((row) => (
              <Pressable key={row.id} onPress={() => setSelected(row)} className="border rounded-xl p-3 mb-2" style={{ borderColor: selected?.id === row.id ? '#000' : LANDING_BORDER }}>
                <Text style={{ fontFamily: 'Poppins_600SemiBold' }}>{row.displayName}</Text>
                <Text className="text-xs" style={{ color: LANDING_MUTED }}>{row.slug}</Text>
              </Pressable>
            ))}
            {selected && (
              <View className="mt-3">
                <TextInput value={form.requesterName} onChangeText={(requesterName) => setForm({ ...form, requesterName })} placeholder="Your name" className="border rounded-xl px-3 py-2 mb-2" style={{ borderColor: LANDING_BORDER }} />
                <TextInput value={form.relationshipToPractice} onChangeText={(relationshipToPractice) => setForm({ ...form, relationshipToPractice })} placeholder="Relationship to the practice" className="border rounded-xl px-3 py-2 mb-2" style={{ borderColor: LANDING_BORDER }} />
                <TextInput value={form.email} onChangeText={(email) => setForm({ ...form, email })} placeholder="Email" className="border rounded-xl px-3 py-2 mb-2" style={{ borderColor: LANDING_BORDER }} />
                <TextInput value={form.phone} onChangeText={(phone) => setForm({ ...form, phone })} placeholder="Phone" className="border rounded-xl px-3 py-2 mb-2" style={{ borderColor: LANDING_BORDER }} />
                <TextInput value={form.proofNotes} onChangeText={(proofNotes) => setForm({ ...form, proofNotes })} placeholder="How you can prove control of this listing" className="border rounded-xl px-3 py-2 mb-2" style={{ borderColor: LANDING_BORDER }} />
                {error ? <Text className="text-red-600 text-xs mb-2">{error}</Text> : null}
                <Pressable onPress={submit} className="rounded-full bg-black px-4 py-2.5 self-start">
                  <Text className="text-white" style={{ fontFamily: 'Poppins_700Bold' }}>Submit claim</Text>
                </Pressable>
              </View>
            )}
          </View>
        )}
      </SeoContentColumn>
    </SeoContentShell>
  );
}
