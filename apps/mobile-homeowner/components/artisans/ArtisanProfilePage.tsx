import { Link } from 'expo-router';
import { Image, Text, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import DirectorySiteHeader from '@/components/directory/DirectorySiteHeader';
import { SeoContentColumn, SeoContentShell } from '@/components/seo/SeoContentLayout';
import { SeoHeading } from '@/components/seo/SeoHeading';
import { LANDING_BORDER, LANDING_INK, LANDING_MUTED } from '@/lib/home-landing-content';
import { fetchArtisan } from '@/lib/public-artisans';
import { useWebSeo } from '@/lib/seo';
import { TrustRing } from './TrustRing';

export default function ArtisanProfilePage({ slug }: { slug: string }) {
  const query = useQuery({ queryKey: ['artisan', slug], queryFn: () => fetchArtisan(slug), enabled: slug !== '__missing__' });
  const artisan = query.data;
  const title = artisan
    ? `${artisan.displayName} — ${artisan.trade?.label || 'Artisan'} in ${artisan.city || artisan.state || 'Nigeria'} | BuildMyHouse`
    : 'Artisan | BuildMyHouse';
  useWebSeo({
    title,
    description: artisan?.bio || 'Artisan and repair technician listing on BuildMyHouse.',
    canonicalPath: `/artisans/${slug}`,
  });
  const place = [artisan?.city, artisan?.state].filter(Boolean).join(', ');

  return (
    <SeoContentShell>
      <DirectorySiteHeader current="artisans" />
      <SeoContentColumn>
        {query.isLoading ? <Text style={{ fontFamily: 'Poppins_400Regular' }}>Loading artisan…</Text> : null}
        {!query.isLoading && !artisan ? (
          <SeoHeading level={1} style={{ fontFamily: 'Poppins_700Bold' }}>This artisan listing is not public.</SeoHeading>
        ) : null}
        {artisan ? (
          <>
            {artisan.coverUrl ? (
              <Image source={{ uri: artisan.coverUrl }} style={{ width: '100%', height: 180, borderRadius: 16, marginBottom: 16, backgroundColor: '#F5F5F5' }} resizeMode="cover" />
            ) : null}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <View style={{ width: 64, height: 64, borderRadius: 16, backgroundColor: '#171717', alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                {artisan.logoUrl ? (
                  <Image source={{ uri: artisan.logoUrl }} style={{ width: 64, height: 64, borderRadius: 16 }} resizeMode="cover" />
                ) : (
                  <Text style={{ color: '#fff', fontFamily: 'Poppins_700Bold', fontSize: 20 }}>{String(artisan.displayName || 'A').slice(0, 1)}</Text>
                )}
              </View>
              <View style={{ flex: 1, paddingRight: 12 }}>
                <SeoHeading level={1} className="text-3xl md:text-5xl" style={{ fontFamily: 'Poppins_700Bold', color: LANDING_INK, marginBottom: 0 }}>
                  {artisan.displayName}
                </SeoHeading>
                <Text style={{ fontFamily: 'Poppins_500Medium', marginTop: 6 }}>{artisan.trade?.label}</Text>
                {place ? <Text style={{ fontFamily: 'Poppins_400Regular', color: LANDING_MUTED, marginTop: 4 }}>{place}</Text> : null}
              </View>
              <TrustRing score={artisan.trustScore} size={72} />
            </View>
            <Text style={{ fontFamily: 'Poppins_400Regular', color: LANDING_MUTED, marginTop: 8, lineHeight: 20 }}>{artisan.trustExplanation}</Text>
            <Text style={{ fontFamily: 'Poppins_600SemiBold', marginTop: 12 }}>
              Listed
              {artisan.claimStatus === 'claimed' ? ' · Claimed' : ' · Unclaimed'}
              {artisan.verificationStatus === 'verified' ? ' · Verified for BMH repair work' : ' · Unverified'}
              {artisan.usedByBmh ? ' · Used by BuildMyHouse' : ''}
            </Text>
            {artisan.bio ? <Text style={{ fontFamily: 'Poppins_400Regular', marginTop: 16, lineHeight: 24 }}>{artisan.bio}</Text> : null}
            <Section title="What they fix" items={(artisan.problemsHandled || []).map((item: { label: string }) => item.label)} />
            <Section title="Services" items={(artisan.repairServices || []).map((item: { label: string; professionalNote?: string }) => item.professionalNote ? `${item.label}. ${item.professionalNote}` : item.label)} />
            <Section title="Specialties" items={(artisan.specialties || []).map((item: { label: string }) => item.label)} />
            <Section title="Areas served" items={[...(artisan.serviceCities || []), ...(artisan.serviceStates || [])]} />
            {artisan.address ? <Text style={{ marginTop: 12, fontFamily: 'Poppins_400Regular' }}>Workshop / work base: {artisan.address}</Text> : null}
            {artisan.workingHours ? <Text style={{ marginTop: 8, fontFamily: 'Poppins_400Regular' }}>Hours: {artisan.workingHours}</Text> : null}
            {artisan.contact?.phone || artisan.contact?.whatsapp || artisan.contact?.website || artisan.contact?.instagram || artisan.contact?.facebook ? (
              <Text style={{ marginTop: 8, fontFamily: 'Poppins_400Regular' }}>
                {[artisan.contact.phone, artisan.contact.whatsapp, artisan.contact.website, artisan.contact.instagram, artisan.contact.facebook].filter(Boolean).join(' · ')}
              </Text>
            ) : null}
            <View style={{ marginTop: 24 }}>
              <Link href={'/start' as any}>
                <Text style={{ fontFamily: 'Poppins_600SemiBold', backgroundColor: '#171717', color: '#fff', overflow: 'hidden', paddingHorizontal: 18, paddingVertical: 12, borderRadius: 999 }}>Start a repair</Text>
              </Link>
            </View>
            <Text style={{ fontFamily: 'Poppins_400Regular', color: LANDING_MUTED, marginTop: 16, marginBottom: 32 }}>
              A low trust score does not hide this listing. Listing is not verification.
            </Text>
          </>
        ) : null}
      </SeoContentColumn>
    </SeoContentShell>
  );
}

function Section({ title, items }: { title: string; items: string[] }) {
  if (!items.length) return null;
  return (
    <View style={{ marginTop: 18 }}>
      <Text style={{ fontFamily: 'Poppins_700Bold', fontSize: 18, marginBottom: 6 }}>{title}</Text>
      {items.map((item) => (
        <Text key={item} style={{ fontFamily: 'Poppins_400Regular', color: LANDING_INK, marginBottom: 4, borderWidth: 1, borderColor: LANDING_BORDER, borderRadius: 10, padding: 8 }}>
          {item}
        </Text>
      ))}
    </View>
  );
}
