import { useState } from 'react';
import { Link } from 'expo-router';
import { Pressable, Text, TextInput, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import {
  SeoContentBackButton,
  SeoContentColumn,
  SeoContentShell,
  seoContentTypography,
} from '@/components/seo/SeoContentLayout';
import { SeoHeading } from '@/components/seo/SeoHeading';
import { LANDING_BORDER, LANDING_INK, LANDING_MUTED } from '@/lib/home-landing-content';
import { fetchProfessionalMeta, submitProfessionalApplication } from '@/lib/public-professionals';
import { useWebSeo } from '@/lib/seo';

export default function ProfessionalApplyPage() {
  const meta = useQuery({ queryKey: ['professional-meta'], queryFn: fetchProfessionalMeta });
  const [form, setForm] = useState({
    professionalType: 'individual',
    displayName: '',
    professionKey: '',
    email: '',
    phone: '',
    whatsapp: '',
    website: '',
    state: '',
    city: '',
    registrationNumber: '',
    shortDescription: '',
  });
  const [done, setDone] = useState('');
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);

  useWebSeo({
    title: 'List your professional practice | BuildMyHouse',
    description: 'Apply to appear in the BuildMyHouse construction professionals directory. Submission is not approval or verification.',
    canonicalPath: '/professionals/apply',
    robots: 'index,follow',
  });

  const submit = async () => {
    setError('');
    setPending(true);
    try {
      const result = await submitProfessionalApplication(form);
      setDone(result.message);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setPending(false);
    }
  };

  return (
    <SeoContentShell contentContainerStyle={{ paddingBottom: 48 }}>
      <SeoContentColumn className="pt-10 md:pt-14">
        <SeoContentBackButton fallbackHref="/professionals" />
        <SeoHeading level={1} className={seoContentTypography.title} style={{ fontFamily: 'Poppins_700Bold', color: LANDING_INK }}>
          List your professional practice
        </SeoHeading>
        <Text className="mt-2 mb-4" style={{ fontFamily: 'Poppins_400Regular', color: LANDING_MUTED }}>
          Submission does not publish your listing and does not mean credentials have been checked.
        </Text>
        {done ? (
          <View className="border rounded-2xl p-4" style={{ borderColor: LANDING_BORDER }}>
            <Text style={{ fontFamily: 'Poppins_600SemiBold', color: LANDING_INK }}>{done}</Text>
            <Link href={'/professionals' as any} asChild>
              <Pressable className="mt-3"><Text style={{ fontFamily: 'Poppins_600SemiBold' }}>Back to directory</Text></Pressable>
            </Link>
          </View>
        ) : (
          <View>
            <Row>
              <Pressable onPress={() => setForm({ ...form, professionalType: 'individual' })} className={`px-3 py-2 mr-2 rounded-full border ${form.professionalType === 'individual' ? 'bg-black' : ''}`}>
                <Text style={{ color: form.professionalType === 'individual' ? '#fff' : LANDING_INK }}>Individual</Text>
              </Pressable>
              <Pressable onPress={() => setForm({ ...form, professionalType: 'firm' })} className={`px-3 py-2 rounded-full border ${form.professionalType === 'firm' ? 'bg-black' : ''}`}>
                <Text style={{ color: form.professionalType === 'firm' ? '#fff' : LANDING_INK }}>Firm</Text>
              </Pressable>
            </Row>
            <Field value={form.displayName} onChange={(displayName) => setForm({ ...form, displayName })} placeholder="Name or practice name" />
            <View className="flex-row flex-wrap mb-2">
              {(meta.data?.professions || []).map((p: any) => (
                <Pressable
                  key={p.key}
                  onPress={() => setForm({ ...form, professionKey: p.key })}
                  className={`px-3 py-1.5 mr-2 mb-2 rounded-full border ${form.professionKey === p.key ? 'bg-black' : 'bg-white'}`}
                >
                  <Text className="text-xs" style={{ color: form.professionKey === p.key ? '#fff' : LANDING_INK }}>{p.label}</Text>
                </Pressable>
              ))}
            </View>
            <Field value={form.email} onChange={(email) => setForm({ ...form, email })} placeholder="Email" />
            <Field value={form.phone} onChange={(phone) => setForm({ ...form, phone })} placeholder="Phone" />
            <Field value={form.whatsapp} onChange={(whatsapp) => setForm({ ...form, whatsapp })} placeholder="WhatsApp" />
            <Field value={form.website} onChange={(website) => setForm({ ...form, website })} placeholder="Website" />
            <Field value={form.city} onChange={(city) => setForm({ ...form, city })} placeholder="City" />
            <Field value={form.state} onChange={(state) => setForm({ ...form, state })} placeholder="State" />
            <Field value={form.registrationNumber} onChange={(registrationNumber) => setForm({ ...form, registrationNumber })} placeholder="Registration number if any" />
            <Field value={form.shortDescription} onChange={(shortDescription) => setForm({ ...form, shortDescription })} placeholder="Short description" />
            {error ? <Text className="text-red-600 text-xs mb-2">{error}</Text> : null}
            <Pressable disabled={pending} onPress={submit} className="rounded-full bg-black px-4 py-2.5 self-start">
              <Text className="text-white" style={{ fontFamily: 'Poppins_700Bold' }}>{pending ? 'Submitting…' : 'Submit application'}</Text>
            </Pressable>
          </View>
        )}
      </SeoContentColumn>
    </SeoContentShell>
  );
}

function Field({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) {
  return (
    <TextInput
      value={value}
      onChangeText={onChange}
      placeholder={placeholder}
      className="border rounded-xl px-3 py-2 mb-2"
      style={{ borderColor: LANDING_BORDER, fontFamily: 'Poppins_400Regular', color: LANDING_INK }}
    />
  );
}

function Row({ children }: { children: import('react').ReactNode }) {
  return <View className="flex-row mb-3">{children}</View>;
}
