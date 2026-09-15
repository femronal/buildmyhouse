import { useState } from 'react';
import { Link } from 'expo-router';
import { Linking, Pressable, Text, TextInput, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import {
  SeoContentBackButton,
  SeoContentColumn,
  SeoContentShell,
  seoContentTypography,
} from '@/components/seo/SeoContentLayout';
import { SeoHeading } from '@/components/seo/SeoHeading';
import { LANDING_BORDER, LANDING_INK, LANDING_MUTED } from '@/lib/home-landing-content';
import {
  fetchPublicProfessional,
  professionalWhatsAppHref,
  submitProfessionalEnquiry,
  type PublicProfessionalProfile,
} from '@/lib/public-professionals';
import { buildSeoJsonLd } from '@/lib/seo-schema';
import { useWebSeo } from '@/lib/seo';

function formatCheckedOn(value?: string | null) {
  if (!value) return null;
  return new Date(value).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
}

export default function ProfessionalProfilePage({ slug }: { slug: string }) {
  const query = useQuery({
    queryKey: ['public-professional', slug],
    queryFn: () => fetchPublicProfessional(slug),
    enabled: !!slug && slug !== '__missing__',
  });
  const professional = query.data;
  const [openForm, setOpenForm] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [need, setNeed] = useState('');
  const [message, setMessage] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const title = professional
    ? `${professional.displayName} — ${professional.profession?.label || 'Professional'} in ${professional.state || 'Nigeria'}`
    : 'Professional | BuildMyHouse';

  useWebSeo({
    title: `${title} | BuildMyHouse`,
    description: professional?.bio || 'Construction professional on BuildMyHouse.',
    canonicalPath: `/professionals/${slug}`,
    robots: professional ? 'index,follow' : 'noindex,follow',
    jsonLd: professional
      ? buildSeoJsonLd({
          path: `/professionals/${slug}`,
          title,
          description: professional.bio || title,
          schemaType: 'Service',
          breadcrumbs: [
            { name: 'Home', path: '/' },
            { name: 'Professionals', path: '/professionals' },
            { name: professional.displayName, path: `/professionals/${slug}` },
          ],
        })
      : undefined,
  });

  const submit = async () => {
    setError('');
    try {
      await submitProfessionalEnquiry({
        slug,
        requesterName: name,
        email,
        whatDoYouNeed: need,
        message,
      });
      setSent(true);
    } catch (err) {
      setError((err as Error).message);
    }
  };

  return (
    <SeoContentShell contentContainerStyle={{ paddingBottom: 48 }}>
      <SeoContentColumn className="pt-10 pb-2 md:pt-14 md:pb-4">
        <SeoContentBackButton fallbackHref="/professionals" />
        {query.isLoading && <Text style={{ fontFamily: 'Poppins_400Regular', color: LANDING_MUTED }}>Loading profile…</Text>}
        {query.isError && <Text style={{ fontFamily: 'Poppins_500Medium', color: LANDING_INK }}>Unable to load this professional.</Text>}
        {!query.isLoading && !professional && (
          <Text style={{ fontFamily: 'Poppins_500Medium', color: LANDING_INK }}>This professional is not publicly listed.</Text>
        )}
        {professional && <ProfileBody professional={professional} />}

        {professional && (
          <View className="border rounded-2xl p-4 mt-4" style={{ borderColor: LANDING_BORDER }}>
            <Text style={{ fontFamily: 'Poppins_700Bold', color: LANDING_INK }}>Ask BuildMyHouse for help</Text>
            <Text className="text-sm mt-1" style={{ fontFamily: 'Poppins_400Regular', color: LANDING_MUTED }}>
              Request this professional through BuildMyHouse. This is not an automatic booking.
            </Text>
            {professional.contact.phone && (
              <Pressable onPress={() => Linking.openURL(`tel:${professional.contact.phone}`)} className="mt-3">
                <Text style={{ fontFamily: 'Poppins_600SemiBold', color: LANDING_INK }}>Call</Text>
              </Pressable>
            )}
            {professional.contact.whatsapp && (
              <Pressable onPress={() => Linking.openURL(professionalWhatsAppHref(professional.contact.whatsapp!))} className="mt-2">
                <Text style={{ fontFamily: 'Poppins_600SemiBold', color: LANDING_INK }}>WhatsApp</Text>
              </Pressable>
            )}
            {professional.contact.email && (
              <Pressable onPress={() => Linking.openURL(`mailto:${professional.contact.email}`)} className="mt-2">
                <Text style={{ fontFamily: 'Poppins_600SemiBold', color: LANDING_INK }}>Email</Text>
              </Pressable>
            )}
            <Pressable onPress={() => setOpenForm((v) => !v)} className="mt-3 rounded-full bg-black px-4 py-2 self-start">
              <Text className="text-white" style={{ fontFamily: 'Poppins_700Bold' }}>Request this professional</Text>
            </Pressable>
            {openForm && !sent && (
              <View className="mt-3">
                <TextInput value={name} onChangeText={setName} placeholder="Your name" className="border rounded-xl px-3 py-2 mb-2" style={{ borderColor: LANDING_BORDER }} />
                <TextInput value={email} onChangeText={setEmail} placeholder="Email" className="border rounded-xl px-3 py-2 mb-2" style={{ borderColor: LANDING_BORDER }} />
                <TextInput value={need} onChangeText={setNeed} placeholder="What do you need?" className="border rounded-xl px-3 py-2 mb-2" style={{ borderColor: LANDING_BORDER }} />
                <TextInput value={message} onChangeText={setMessage} placeholder="Message" multiline className="border rounded-xl px-3 py-2 mb-2 min-h-[80px]" style={{ borderColor: LANDING_BORDER }} />
                {error ? <Text className="text-red-600 text-xs mb-2">{error}</Text> : null}
                <Pressable onPress={submit} className="rounded-full bg-black px-4 py-2 self-start">
                  <Text className="text-white" style={{ fontFamily: 'Poppins_700Bold' }}>Send request</Text>
                </Pressable>
              </View>
            )}
            {sent && <Text className="mt-3" style={{ fontFamily: 'Poppins_500Medium', color: LANDING_INK }}>Request received. BuildMyHouse will follow up.</Text>}
            <Link href={'/book-repair' as any} asChild>
              <Pressable className="mt-3">
                <Text style={{ fontFamily: 'Poppins_600SemiBold', color: LANDING_INK }}>Start a project →</Text>
              </Pressable>
            </Link>
          </View>
        )}
      </SeoContentColumn>
    </SeoContentShell>
  );
}

function ProfileBody({ professional }: { professional: PublicProfessionalProfile }) {
  const checkedOn = formatCheckedOn(professional.trust.checkedOn);
  return (
    <View>
      <SeoHeading level={1} className={seoContentTypography.title} style={{ fontFamily: 'Poppins_700Bold', color: LANDING_INK }}>
        {professional.displayName}
      </SeoHeading>
      <Text className="mt-1" style={{ fontFamily: 'Poppins_500Medium', color: LANDING_INK }}>
        {professional.profession?.label} · {professional.professionalType === 'firm' ? 'Firm' : 'Individual'}
      </Text>
      <Text className="text-sm mt-1" style={{ fontFamily: 'Poppins_400Regular', color: LANDING_MUTED }}>
        {[professional.city, professional.state].filter(Boolean).join(', ') || 'Nigeria'}
        {professional.yearsExperience != null ? ` · ${professional.yearsExperience}+ years` : ''}
      </Text>

      <View className="border rounded-2xl p-4 mt-4" style={{ borderColor: LANDING_BORDER }}>
        <Text style={{ fontFamily: 'Poppins_700Bold', color: LANDING_INK }}>Trust</Text>
        <Text className="text-sm mt-2" style={{ fontFamily: 'Poppins_400Regular', color: LANDING_INK }}>Listed — appears in the directory. This is not verification.</Text>
        <Text className="text-sm mt-1" style={{ fontFamily: 'Poppins_400Regular', color: LANDING_INK }}>
          {professional.trust.claimedLabel ? 'Claimed — the practice demonstrated control of this listing.' : 'Unclaimed — BuildMyHouse may have researched this listing.'}
        </Text>
        <Text className="text-sm mt-1" style={{ fontFamily: 'Poppins_400Regular', color: LANDING_INK }}>
          {professional.trust.credentialLabel
            ? `${professional.trust.credentialLabel}${professional.trust.credentialDetail ? ` · ${professional.trust.credentialDetail}` : ''}${checkedOn ? `. Checked by BuildMyHouse on ${checkedOn}.` : ''}`
            : 'Credential not checked by BuildMyHouse yet.'}
        </Text>
        <Text className="text-sm mt-1" style={{ fontFamily: 'Poppins_400Regular', color: LANDING_INK }}>
          {professional.trust.usedByBmhLabel || 'Not recorded as used by BuildMyHouse.'}
        </Text>
        <Text className="text-xs mt-3" style={{ fontFamily: 'Poppins_400Regular', color: LANDING_MUTED }}>
          {professional.trust.disclaimer}
        </Text>
      </View>

      {professional.services.length > 0 && (
        <Section title="Services" items={professional.services.map((s) => s.label)} />
      )}
      {professional.deliverables.length > 0 && (
        <Section title="Deliverables" items={professional.deliverables.map((s) => s.label)} />
      )}
      {professional.projectStages.length > 0 && (
        <Section title="When they are useful" items={professional.projectStages.map((s) => s.label)} />
      )}
      <Section
        title="Coverage"
        items={[
          professional.city && professional.state ? `Office: ${professional.city}, ${professional.state}` : null,
          professional.serviceStates.length ? `States served: ${professional.serviceStates.join(', ')}` : null,
          professional.siteVisits ? 'Site visits' : null,
          professional.remoteConsultation ? 'Remote consultation' : null,
        ].filter(Boolean) as string[]}
      />
      {professional.bio ? (
        <View className="mt-4">
          <Text style={{ fontFamily: 'Poppins_700Bold', color: LANDING_INK }}>About</Text>
          <Text className="text-sm mt-2" style={{ fontFamily: 'Poppins_400Regular', color: LANDING_MUTED }}>{professional.bio}</Text>
        </View>
      ) : null}
    </View>
  );
}

function Section({ title, items }: { title: string; items: string[] }) {
  if (!items.length) return null;
  return (
    <View className="mt-4">
      <Text style={{ fontFamily: 'Poppins_700Bold', color: LANDING_INK }}>{title}</Text>
      <Text className="text-sm mt-2" style={{ fontFamily: 'Poppins_400Regular', color: LANDING_MUTED }}>{items.join(' · ')}</Text>
    </View>
  );
}
