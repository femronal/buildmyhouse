import { useMemo, useState } from 'react';
import { Link } from 'expo-router';
import { Pressable, Text, TextInput, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { SeoContentShell, SeoContentColumn } from '@/components/seo/SeoContentLayout';
import { SeoHeading } from '@/components/seo/SeoHeading';
import DirectorySiteHeader from '@/components/directory/DirectorySiteHeader';
import { LANDING_BORDER, LANDING_INK, LANDING_MUTED } from '@/lib/home-landing-content';
import { fetchArtisanMeta, fetchArtisans, type ArtisanCard, type ArtisanProblem } from '@/lib/public-artisans';
import { useWebSeo } from '@/lib/seo';
import { TrustRing } from './TrustRing';

const FEATURED_PROBLEMS = [
  'Leaking pipe',
  'Broken window',
  'Roof leak',
  'Blocked drainage',
  'Cracked wall',
  'Damaged gate',
  'Electrical fault',
  'Water pump not working',
  'Broken tiles',
  'Damaged ceiling',
  'AC not cooling',
  'Inverter problem',
  'Door or lock problem',
  'Painting/repainting',
  'Plumbing problem',
];

function problemKey(label: string) {
  return label.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

export default function ArtisanDirectoryPage() {
  const [q, setQ] = useState('');
  const [problem, setProblem] = useState('');
  const [trade, setTrade] = useState('');
  const [state, setState] = useState('');
  const meta = useQuery({ queryKey: ['artisan-meta'], queryFn: fetchArtisanMeta });
  const list = useQuery({
    queryKey: ['artisans', q, problem, trade, state],
    queryFn: () => fetchArtisans({ q, problem: problem || undefined, trade: trade || undefined, state: state || undefined, limit: 24 }),
  });

  useWebSeo({
    title: 'Artisans & Repair Technicians in Nigeria | BuildMyHouse',
    description: 'Find plumbers, bricklayers, electricians, roofers, painters, repair technicians and other artisans in Nigeria by what needs fixing, location and BuildMyHouse trust information.',
    canonicalPath: '/artisans',
  });

  const selectedProblem = useMemo(
    () => meta.data?.problems?.find((item) => item.key === problem) || null,
    [meta.data, problem],
  );

  return (
    <SeoContentShell>
      <DirectorySiteHeader />
      <SeoContentColumn>
        <SeoHeading level={1} className="text-3xl md:text-5xl" style={{ fontFamily: 'Poppins_700Bold', color: LANDING_INK }}>
          Artisans and repair technicians in Nigeria
        </SeoHeading>
        <Text style={{ fontFamily: 'Poppins_400Regular', color: LANDING_MUTED, fontSize: 16, lineHeight: 24, marginBottom: 16 }}>
          Start with what is wrong with the property. A listing can be public while the profile is still thin. Listed does not mean verified.
        </Text>
        <Text style={{ fontFamily: 'Poppins_700Bold', color: LANDING_INK, marginBottom: 8 }}>What needs fixing?</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 16 }}>
          {FEATURED_PROBLEMS.map((label) => {
            const key = problemKey(label);
            const active = problem === key;
            return (
              <Pressable
                key={key}
                onPress={() => setProblem(active ? '' : key)}
                style={{
                  borderWidth: 1,
                  borderColor: active ? LANDING_INK : LANDING_BORDER,
                  backgroundColor: active ? LANDING_INK : '#fff',
                  borderRadius: 999,
                  paddingHorizontal: 12,
                  paddingVertical: 8,
                  marginRight: 8,
                  marginBottom: 8,
                  minHeight: 44,
                  justifyContent: 'center',
                }}
              >
                <Text style={{ fontFamily: 'Poppins_600SemiBold', color: active ? '#fff' : LANDING_INK, fontSize: 13 }}>{label}</Text>
              </Pressable>
            );
          })}
        </View>
        {selectedProblem?.professionalNote ? (
          <View style={{ borderWidth: 1, borderColor: LANDING_BORDER, borderRadius: 16, padding: 14, marginBottom: 16 }}>
            <Text style={{ fontFamily: 'Poppins_400Regular', color: LANDING_INK, lineHeight: 22 }}>{selectedProblem.professionalNote}</Text>
            {selectedProblem.professionalHref ? (
              <Link href={selectedProblem.professionalHref as any}>
                <Text style={{ fontFamily: 'Poppins_600SemiBold', color: LANDING_INK, marginTop: 8 }}>See professionals →</Text>
              </Link>
            ) : null}
          </View>
        ) : null}
        <TextInput
          value={q}
          onChangeText={setQ}
          placeholder="plumber Mowe, roof leak Lekki, broken window Lagos"
          placeholderTextColor="#A3A3A3"
          style={{ borderWidth: 1, borderColor: LANDING_BORDER, borderRadius: 12, padding: 12, marginBottom: 12, fontFamily: 'Poppins_400Regular' }}
        />
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 16 }}>
          <FilterChip label="All trades" active={!trade} onPress={() => setTrade('')} />
          {(meta.data?.trades || []).slice(0, 12).map((item) => (
            <FilterChip key={item.key} label={item.label} active={trade === item.key} onPress={() => setTrade(trade === item.key ? '' : item.key)} />
          ))}
        </View>
        <TextInput
          value={state}
          onChangeText={setState}
          placeholder="State, for example Lagos"
          placeholderTextColor="#A3A3A3"
          style={{ borderWidth: 1, borderColor: LANDING_BORDER, borderRadius: 12, padding: 12, marginBottom: 20, fontFamily: 'Poppins_400Regular' }}
        />
        {(list.data?.data || []).map((artisan) => (
          <ArtisanCardView key={artisan.id} artisan={artisan} />
        ))}
        {list.isLoading ? <Text style={{ fontFamily: 'Poppins_400Regular', color: LANDING_MUTED }}>Loading artisans…</Text> : null}
        {!list.isLoading && (list.data?.data || []).length === 0 ? (
          <Text style={{ fontFamily: 'Poppins_400Regular', color: LANDING_MUTED }}>No artisans match this search yet.</Text>
        ) : null}
        <Link href={'/artisans/apply' as any} style={{ marginTop: 24, marginBottom: 32 }}>
          <Text style={{ fontFamily: 'Poppins_600SemiBold', color: LANDING_INK }}>List my repair business →</Text>
        </Link>
      </SeoContentColumn>
    </SeoContentShell>
  );
}

function FilterChip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={{ borderWidth: 1, borderColor: LANDING_BORDER, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 8, marginRight: 8, marginBottom: 8, backgroundColor: active ? '#171717' : '#fff', minHeight: 40, justifyContent: 'center' }}>
      <Text style={{ fontFamily: 'Poppins_600SemiBold', color: active ? '#fff' : LANDING_INK, fontSize: 12 }}>{label}</Text>
    </Pressable>
  );
}

function ArtisanCardView({ artisan }: { artisan: ArtisanCard }) {
  const place = [artisan.city, artisan.state].filter(Boolean).join(', ');
  return (
    <Link href={`/artisans/${artisan.slug}` as any} style={{ marginBottom: 12 }}>
      <View style={{ borderWidth: 1, borderColor: LANDING_BORDER, borderRadius: 16, padding: 14, backgroundColor: '#fff' }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <View style={{ flex: 1, paddingRight: 12 }}>
            <Text style={{ fontFamily: 'Poppins_700Bold', fontSize: 18, color: LANDING_INK }}>{artisan.displayName}</Text>
            <Text style={{ fontFamily: 'Poppins_500Medium', color: LANDING_INK, marginTop: 2 }}>{artisan.trade?.label || 'Artisan'}</Text>
            {place ? <Text style={{ fontFamily: 'Poppins_400Regular', color: LANDING_MUTED, marginTop: 2 }}>{place}</Text> : null}
            {artisan.services.length ? (
              <Text style={{ fontFamily: 'Poppins_400Regular', color: LANDING_MUTED, marginTop: 8 }}>{artisan.services.join(' · ')}</Text>
            ) : null}
            <Text style={{ fontFamily: 'Poppins_600SemiBold', color: LANDING_INK, marginTop: 10 }}>
              Listed{artisan.usedByBmh ? ' · Used by BuildMyHouse' : ''}{artisan.verificationStatus === 'verified' ? ' · Verified for BMH repair work' : ''}
            </Text>
            <Text style={{ fontFamily: 'Poppins_600SemiBold', color: LANDING_INK, marginTop: 8 }}>View artisan →</Text>
          </View>
          <TrustRing score={artisan.trustScore} />
        </View>
      </View>
    </Link>
  );
}

export type { ArtisanProblem };
