import { useMemo, useState } from 'react';
import { Link } from 'expo-router';
import { Linking, Platform, Pressable, ScrollView, Share, Text, TextInput, View, useWindowDimensions } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import DirectorySiteHeader from '@/components/directory/DirectorySiteHeader';
import { SeoContentBackButton } from '@/components/seo/SeoContentLayout';
import { SeoHeading } from '@/components/seo/SeoHeading';
import { LANDING_BORDER, LANDING_INK, LANDING_MUTED, LANDING_SURFACE } from '@/lib/home-landing-content';
import { initialsFromName } from '@/lib/directory-listing';
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

type TabId = 'about' | 'services' | 'deliverables' | 'useful' | 'coverage';

function Badge({ label, solid = false }: { label: string; solid?: boolean }) {
  return (
    <View
      accessibilityLabel={label}
      style={{
        alignSelf: 'flex-start',
        backgroundColor: solid ? LANDING_INK : '#fff',
        borderWidth: 1,
        borderColor: solid ? LANDING_INK : LANDING_BORDER,
        borderRadius: 999,
        paddingHorizontal: 10,
        paddingVertical: 4,
        marginRight: 8,
        marginBottom: 8,
      }}
    >
      <Text style={{ fontFamily: 'Poppins_600SemiBold', fontSize: 12, color: solid ? '#fff' : LANDING_INK }}>{label}</Text>
    </View>
  );
}

function ActionButton({
  label,
  onPress,
  filled = false,
  flex,
}: {
  label: string;
  onPress: () => void;
  filled?: boolean;
  flex?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={{
        backgroundColor: filled ? LANDING_INK : '#fff',
        borderWidth: 1,
        borderColor: LANDING_INK,
        borderRadius: 8,
        paddingHorizontal: 14,
        paddingVertical: 12,
        marginRight: flex ? 0 : 8,
        marginBottom: flex ? 0 : 8,
        alignItems: 'center',
        flex: flex ? 1 : undefined,
      }}
    >
      <Text style={{ fontFamily: 'Poppins_600SemiBold', fontSize: 14, color: filled ? '#fff' : LANDING_INK }}>{label}</Text>
    </Pressable>
  );
}

function ChipList({ items }: { items: string[] }) {
  if (!items.length) return null;
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
      {items.map((item) => (
        <View
          key={item}
          style={{
            borderWidth: 1,
            borderColor: LANDING_BORDER,
            borderRadius: 999,
            paddingHorizontal: 12,
            paddingVertical: 6,
            marginRight: 8,
            marginBottom: 8,
            backgroundColor: '#fff',
          }}
        >
          <Text style={{ fontFamily: 'Poppins_500Medium', fontSize: 13, color: LANDING_INK }}>{item}</Text>
        </View>
      ))}
    </View>
  );
}

export default function ProfessionalProfilePage({ slug }: { slug: string }) {
  const { width } = useWindowDimensions();
  const compact = width < 960;
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
  const [tab, setTab] = useState<TabId>('about');

  const seoTitle = professional
    ? `${professional.displayName} — ${professional.profession?.label || 'Professional'} in ${professional.state || 'Nigeria'}`
    : 'Professional';

  useWebSeo({
    title: `${seoTitle} | BuildMyHouse`,
    description: professional?.bio || 'Construction professional on BuildMyHouse.',
    canonicalPath: `/professionals/${slug}`,
    robots: professional ? 'index,follow' : 'noindex,follow',
    jsonLd: professional
      ? buildSeoJsonLd({
          path: `/professionals/${slug}`,
          title: seoTitle,
          description: professional.bio || seoTitle,
          schemaType: 'Service',
          breadcrumbs: [
            { name: 'Home', path: '/' },
            { name: 'Professionals', path: '/professionals' },
            { name: professional.displayName, path: `/professionals/${slug}` },
          ],
        })
      : undefined,
  });

  const tabs = useMemo(() => {
    if (!professional) return [] as Array<{ id: TabId; label: string }>;
    const next: Array<{ id: TabId; label: string }> = [];
    if (professional.bio) next.push({ id: 'about', label: 'About' });
    if (professional.services.length || professional.specialties.length) next.push({ id: 'services', label: 'Services' });
    if (professional.deliverables.length) next.push({ id: 'deliverables', label: 'Deliverables' });
    if (professional.projectStages.length) next.push({ id: 'useful', label: 'When they are useful' });
    const hasCoverage =
      !!(professional.city || professional.state) ||
      professional.serviceStates.length > 0 ||
      professional.siteVisits ||
      professional.remoteConsultation ||
      professional.canIssueSignedReport;
    if (hasCoverage) next.push({ id: 'coverage', label: 'Coverage' });
    if (!next.length) next.push({ id: 'about', label: 'About' });
    return next;
  }, [professional]);

  const activeTab = tabs.some((item) => item.id === tab) ? tab : tabs[0]?.id || 'about';

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

  const share = async () => {
    const url = `https://buildmyhouse.app/professionals/${slug}`;
    try {
      await Share.share(Platform.OS === 'web' ? { message: url } : { message: professional?.displayName || 'Professional', url });
    } catch {
      // user dismissed share
    }
  };

  return (
    <View className="flex-1 bg-white">
      <DirectorySiteHeader current="professionals" />
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: compact && professional ? 96 : 40 }}
        keyboardShouldPersistTaps="handled"
      >
        <View style={{ width: '100%', maxWidth: 1120, alignSelf: 'center', paddingHorizontal: 16, paddingTop: 16 }}>
          <SeoContentBackButton fallbackHref="/professionals" />
          {query.isLoading && <Text style={{ fontFamily: 'Poppins_400Regular', color: LANDING_MUTED }}>Loading profile…</Text>}
          {query.isError && <Text style={{ fontFamily: 'Poppins_500Medium', color: LANDING_INK }}>Unable to load this professional.</Text>}
          {!query.isLoading && !query.isError && !professional && (
            <Text style={{ fontFamily: 'Poppins_500Medium', color: LANDING_INK }}>This professional is not publicly listed.</Text>
          )}
          {professional ? (
            <View style={{ flexDirection: compact ? 'column' : 'row', alignItems: 'flex-start', gap: 24 }}>
              <SummaryCard
                professional={professional}
                compact={compact}
                openForm={openForm}
                setOpenForm={setOpenForm}
                sent={sent}
                error={error}
                name={name}
                setName={setName}
                email={email}
                setEmail={setEmail}
                need={need}
                setNeed={setNeed}
                message={message}
                setMessage={setMessage}
                onSubmit={submit}
                onShare={share}
              />
              <View style={{ flex: 1, minWidth: 0, width: compact ? '100%' : undefined }}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ borderBottomWidth: 1, borderBottomColor: LANDING_BORDER }}>
                  <View style={{ flexDirection: 'row' }}>
                    {tabs.map((item) => {
                      const active = item.id === activeTab;
                      return (
                        <Pressable
                          key={item.id}
                          onPress={() => setTab(item.id)}
                          accessibilityRole="tab"
                          accessibilityState={{ selected: active }}
                          style={{ paddingVertical: 12, marginRight: 18, borderBottomWidth: 2, borderBottomColor: active ? LANDING_INK : 'transparent' }}
                        >
                          <Text style={{ fontFamily: active ? 'Poppins_600SemiBold' : 'Poppins_500Medium', fontSize: 14, color: active ? LANDING_INK : LANDING_MUTED }}>
                            {item.label}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </ScrollView>
                <View style={{ paddingTop: 18 }}>
                  {activeTab === 'about' ? (
                    <Text style={{ fontFamily: 'Poppins_400Regular', fontSize: 15, color: LANDING_MUTED, lineHeight: 24 }}>
                      {professional.bio || 'BuildMyHouse has not published a longer about section for this listing yet.'}
                    </Text>
                  ) : null}
                  {activeTab === 'services' ? (
                    <>
                      {professional.specialties.length ? (
                        <View style={{ marginBottom: 16 }}>
                          <Text style={{ fontFamily: 'Poppins_600SemiBold', fontSize: 14, color: LANDING_INK, marginBottom: 8 }}>Specialties</Text>
                          <ChipList items={professional.specialties.map((item) => item.label)} />
                        </View>
                      ) : null}
                      <ChipList items={professional.services.map((item) => item.label)} />
                    </>
                  ) : null}
                  {activeTab === 'deliverables' ? <ChipList items={professional.deliverables.map((item) => item.label)} /> : null}
                  {activeTab === 'useful' ? <ChipList items={professional.projectStages.map((item) => item.label)} /> : null}
                  {activeTab === 'coverage' ? (
                    <View>
                      {[
                        professional.city && professional.state ? `Office: ${professional.city}, ${professional.state}` : null,
                        professional.serviceStates.length ? `States served: ${professional.serviceStates.join(', ')}` : null,
                        professional.siteVisits ? 'Site visits' : null,
                        professional.remoteConsultation ? 'Remote consultation' : null,
                        professional.canIssueSignedReport ? 'Can issue signed reports' : null,
                        professional.yearsExperience != null ? `${professional.yearsExperience}+ years of experience` : null,
                      ]
                        .filter(Boolean)
                        .map((line) => (
                          <Text key={String(line)} style={{ fontFamily: 'Poppins_400Regular', fontSize: 15, color: LANDING_INK, marginBottom: 8 }}>
                            {line}
                          </Text>
                        ))}
                    </View>
                  ) : null}
                </View>
              </View>
            </View>
          ) : null}
        </View>
      </ScrollView>
      {compact && professional ? (
        <View
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: '#fff',
            borderTopWidth: 1,
            borderTopColor: LANDING_BORDER,
            paddingHorizontal: 12,
            paddingVertical: 10,
          }}
        >
          {openForm ? (
            <View style={{ marginBottom: 10 }}>
              <Text style={{ fontFamily: 'Poppins_700Bold', fontSize: 15, color: LANDING_INK }}>Ask BuildMyHouse for help</Text>
              <Text style={{ fontFamily: 'Poppins_400Regular', fontSize: 13, color: LANDING_MUTED, marginTop: 4, marginBottom: 8, lineHeight: 20 }}>
                Request this professional through BuildMyHouse. This is not an automatic booking.
              </Text>
              {sent ? (
                <Text style={{ fontFamily: 'Poppins_500Medium', fontSize: 14, color: LANDING_INK }}>Request received. BuildMyHouse will follow up.</Text>
              ) : (
                <>
                  <Field value={name} onChange={setName} placeholder="Your name" />
                  <Field value={email} onChange={setEmail} placeholder="Email" />
                  <Field value={need} onChange={setNeed} placeholder="What do you need?" />
                  <Field value={message} onChange={setMessage} placeholder="Message" multiline />
                  {error ? <Text style={{ color: '#B91C1C', fontSize: 12, marginBottom: 8 }}>{error}</Text> : null}
                  <ActionButton label="Send request" filled onPress={submit} />
                </>
              )}
            </View>
          ) : null}
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <ActionButton label={openForm ? 'Close' : 'Hire for project'} filled flex onPress={() => setOpenForm((open) => !open)} />
            {professional.contact.whatsapp ? (
              <ActionButton label="WhatsApp" flex onPress={() => Linking.openURL(professionalWhatsAppHref(professional.contact.whatsapp!))} />
            ) : null}
            {!openForm && professional.contact.phone ? (
              <ActionButton label="Call" flex onPress={() => Linking.openURL(`tel:${professional.contact.phone}`)} />
            ) : null}
          </View>
        </View>
      ) : null}
    </View>
  );
}

function SummaryCard({
  professional,
  compact,
  openForm,
  setOpenForm,
  sent,
  error,
  name,
  setName,
  email,
  setEmail,
  need,
  setNeed,
  message,
  setMessage,
  onSubmit,
  onShare,
}: {
  professional: PublicProfessionalProfile;
  compact: boolean;
  openForm: boolean;
  setOpenForm: (value: boolean | ((current: boolean) => boolean)) => void;
  sent: boolean;
  error: string;
  name: string;
  setName: (value: string) => void;
  email: string;
  setEmail: (value: string) => void;
  need: string;
  setNeed: (value: string) => void;
  message: string;
  setMessage: (value: string) => void;
  onSubmit: () => void;
  onShare: () => void;
}) {
  const checkedOn = formatCheckedOn(professional.trust.checkedOn);
  const location = [professional.city, professional.state].filter(Boolean).join(', ') || 'Nigeria';
  const whatsapp = professional.contact.whatsapp;

  return (
    <View
      style={{
        width: compact ? '100%' : 340,
        borderWidth: 1,
        borderColor: LANDING_BORDER,
        borderRadius: 16,
        padding: 16,
        backgroundColor: '#fff',
        ...(compact || Platform.OS !== 'web' ? {} : ({ position: 'sticky', top: 16 } as object)),
      }}
    >
      <View
        style={{
          width: 72,
          height: 72,
          borderRadius: 16,
          backgroundColor: LANDING_SURFACE,
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 12,
        }}
      >
        <Text style={{ fontFamily: 'Poppins_700Bold', fontSize: 24, color: LANDING_INK }}>{initialsFromName(professional.displayName)}</Text>
      </View>
      <SeoHeading level={1} className="text-2xl" style={{ fontFamily: 'Poppins_700Bold', color: LANDING_INK }}>
        {professional.displayName}
      </SeoHeading>
      <Text style={{ fontFamily: 'Poppins_500Medium', fontSize: 14, color: LANDING_INK, marginTop: 4 }}>
        {professional.profession?.label || 'Professional'} · {professional.professionalType === 'firm' ? 'Firm' : 'Individual'}
      </Text>
      <Text style={{ fontFamily: 'Poppins_400Regular', fontSize: 14, color: LANDING_MUTED, marginTop: 4 }}>{location}</Text>

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 12 }}>
        <Badge label={professional.trust.listingLabel || 'Listed'} />
        {professional.verificationStatus === 'verified' ? <Badge label="Verified" solid /> : null}
        <Badge label={professional.trust.claimedLabel || 'Unclaimed'} />
        {professional.trust.usedByBmhLabel ? <Badge label="Used by BMH" /> : null}
      </View>

      <View style={{ marginTop: 4, backgroundColor: LANDING_SURFACE, borderRadius: 12, padding: 12 }}>
        <Text style={{ fontFamily: 'Poppins_400Regular', fontSize: 13, color: LANDING_INK, lineHeight: 20 }}>
          Listed — appears in the directory. This is not verification.
        </Text>
        <Text style={{ fontFamily: 'Poppins_400Regular', fontSize: 13, color: LANDING_INK, lineHeight: 20, marginTop: 6 }}>
          {professional.trust.claimedLabel
            ? 'Claimed — the practice demonstrated control of this listing.'
            : 'Unclaimed — BuildMyHouse may have researched this listing.'}
        </Text>
        <Text style={{ fontFamily: 'Poppins_400Regular', fontSize: 13, color: LANDING_INK, lineHeight: 20, marginTop: 6 }}>
          {professional.trust.credentialLabel
            ? `${professional.trust.credentialLabel}${professional.trust.credentialDetail ? ` · ${professional.trust.credentialDetail}` : ''}${checkedOn ? `. Checked by BuildMyHouse on ${checkedOn}.` : ''}`
            : 'Credential not checked by BuildMyHouse yet.'}
        </Text>
        <Text style={{ fontFamily: 'Poppins_400Regular', fontSize: 13, color: LANDING_INK, lineHeight: 20, marginTop: 6 }}>
          {professional.trust.usedByBmhLabel || 'Not recorded as used by BuildMyHouse.'}
        </Text>
        <Text style={{ fontFamily: 'Poppins_400Regular', fontSize: 12, color: LANDING_MUTED, lineHeight: 18, marginTop: 8 }}>
          {professional.trust.disclaimer}
        </Text>
      </View>

      {!compact ? (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 14 }}>
          <ActionButton label="Hire for project" filled onPress={() => setOpenForm((open) => !open)} />
          {professional.contact.phone ? (
            <ActionButton label="Call professional" onPress={() => Linking.openURL(`tel:${professional.contact.phone}`)} />
          ) : null}
          {whatsapp ? (
            <ActionButton label="WhatsApp" onPress={() => Linking.openURL(professionalWhatsAppHref(whatsapp))} />
          ) : null}
        </View>
      ) : null}
      {professional.contact.email ? (
        <Pressable onPress={() => Linking.openURL(`mailto:${professional.contact.email}`)} accessibilityRole="link" style={{ marginTop: 4 }}>
          <Text style={{ fontFamily: 'Poppins_500Medium', fontSize: 14, color: LANDING_INK }}>Email</Text>
        </Pressable>
      ) : null}
      {professional.contact.website || professional.website ? (
        <Pressable
          onPress={() => Linking.openURL((professional.contact.website || professional.website)!)}
          accessibilityRole="link"
          style={{ marginTop: 8 }}
        >
          <Text style={{ fontFamily: 'Poppins_500Medium', fontSize: 14, color: LANDING_INK }}>Website</Text>
        </Pressable>
      ) : null}
      <Pressable onPress={onShare} accessibilityRole="button" style={{ marginTop: 8 }}>
        <Text style={{ fontFamily: 'Poppins_500Medium', fontSize: 14, color: LANDING_INK }}>Share</Text>
      </Pressable>
      <Link href={'/book-repair' as any} asChild>
        <Pressable accessibilityRole="link" style={{ marginTop: 8 }}>
          <Text style={{ fontFamily: 'Poppins_600SemiBold', fontSize: 14, color: LANDING_INK }}>Start a project</Text>
        </Pressable>
      </Link>

      {!compact && openForm ? (
        <View style={{ marginTop: 14 }}>
          <Text style={{ fontFamily: 'Poppins_700Bold', fontSize: 15, color: LANDING_INK }}>Ask BuildMyHouse for help</Text>
          <Text style={{ fontFamily: 'Poppins_400Regular', fontSize: 13, color: LANDING_MUTED, marginTop: 4, lineHeight: 20 }}>
            Request this professional through BuildMyHouse. This is not an automatic booking.
          </Text>
          {!sent ? (
            <View style={{ marginTop: 10 }}>
              <Field value={name} onChange={setName} placeholder="Your name" />
              <Field value={email} onChange={setEmail} placeholder="Email" />
              <Field value={need} onChange={setNeed} placeholder="What do you need?" />
              <Field value={message} onChange={setMessage} placeholder="Message" multiline />
              {error ? <Text style={{ color: '#B91C1C', fontSize: 12, marginBottom: 8 }}>{error}</Text> : null}
              <ActionButton label="Send request" filled onPress={onSubmit} />
            </View>
          ) : null}
          {sent ? (
            <Text style={{ fontFamily: 'Poppins_500Medium', fontSize: 14, color: LANDING_INK, marginTop: 8 }}>
              Request received. BuildMyHouse will follow up.
            </Text>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

function Field({
  value,
  onChange,
  placeholder,
  multiline,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  multiline?: boolean;
}) {
  return (
    <TextInput
      value={value}
      onChangeText={onChange}
      placeholder={placeholder}
      multiline={multiline}
      style={{
        borderWidth: 1,
        borderColor: LANDING_BORDER,
        borderRadius: 10,
        paddingHorizontal: 12,
        paddingVertical: 10,
        marginBottom: 8,
        minHeight: multiline ? 80 : undefined,
        fontFamily: 'Poppins_400Regular',
        color: LANDING_INK,
      }}
    />
  );
}
