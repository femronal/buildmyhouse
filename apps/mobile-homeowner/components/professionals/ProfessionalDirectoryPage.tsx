import { useMemo } from 'react';
import { Link, useLocalSearchParams, useRouter } from 'expo-router';
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
import {
  fetchProfessionalMeta,
  fetchPublicProfessionals,
  type PublicProfessionalCard,
} from '@/lib/public-professionals';
import { buildSeoJsonLd } from '@/lib/seo-schema';
import { useWebSeo } from '@/lib/seo';

function FilterChip({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      className={`rounded-full px-3 py-1.5 mr-2 mb-2 border ${active ? 'bg-black' : 'bg-white'}`}
      style={{ borderColor: active ? '#000' : LANDING_BORDER }}
      accessibilityRole="button"
    >
      <Text className="text-xs" style={{ fontFamily: 'Poppins_600SemiBold', color: active ? '#fff' : LANDING_INK }}>
        {label}
      </Text>
    </Pressable>
  );
}

function TrustPills({ professional }: { professional: PublicProfessionalCard }) {
  const pills = [
    professional.trust.listingLabel,
    professional.trust.claimedLabel,
    professional.trust.credentialLabel,
    professional.trust.usedByBmhLabel,
  ].filter(Boolean) as string[];
  return (
    <View className="flex-row flex-wrap mt-2">
      {pills.map((label) => (
        <View
          key={label}
          className={`rounded-full px-2 py-0.5 mr-1 mb-1 ${label === 'Listed' && !professional.trust.credentialLabel ? 'border' : 'bg-black'}`}
          style={label === 'Listed' && !professional.trust.credentialLabel ? { borderColor: LANDING_BORDER } : undefined}
        >
          <Text
            className="text-[10px]"
            style={{
              fontFamily: 'Poppins_600SemiBold',
              color: label === 'Listed' && !professional.trust.credentialLabel ? LANDING_MUTED : '#fff',
            }}
          >
            {label}
          </Text>
        </View>
      ))}
    </View>
  );
}

function ProfessionalCard({ professional }: { professional: PublicProfessionalCard }) {
  const location = [professional.city, professional.state, ...(professional.serviceStates || [])]
    .filter(Boolean)
    .filter((item, index, arr) => arr.indexOf(item) === index)
    .slice(0, 3)
    .join(' · ');
  return (
    <Link href={`/professionals/${professional.slug}` as any} asChild>
      <Pressable className="border rounded-2xl p-4 mb-3" style={{ borderColor: LANDING_BORDER }} accessibilityRole="link">
        <Text className="text-base" style={{ fontFamily: 'Poppins_700Bold', color: LANDING_INK }}>
          {professional.displayName}
        </Text>
        <Text className="text-sm mt-1" style={{ fontFamily: 'Poppins_500Medium', color: LANDING_INK }}>
          {professional.profession?.label || 'Professional'}
        </Text>
        {professional.specialties.length > 0 && (
          <Text className="text-xs mt-1" style={{ fontFamily: 'Poppins_400Regular', color: LANDING_MUTED }}>
            {professional.specialties.slice(0, 3).map((s) => s.label).join(' · ')}
          </Text>
        )}
        {location ? (
          <Text className="text-xs mt-1" style={{ fontFamily: 'Poppins_400Regular', color: LANDING_MUTED }}>
            {location}
          </Text>
        ) : null}
        <TrustPills professional={professional} />
        <Text className="text-xs mt-2" style={{ fontFamily: 'Poppins_400Regular', color: LANDING_MUTED }}>
          {[
            professional.siteVisits ? 'Site inspections' : null,
            professional.remoteConsultation ? 'Remote consultation' : null,
            professional.canIssueSignedReport ? 'Signed reports' : null,
          ]
            .filter(Boolean)
            .join(' · ')}
        </Text>
        {professional.projectStages.length > 0 && (
          <Text className="text-xs mt-1" style={{ fontFamily: 'Poppins_400Regular', color: LANDING_MUTED }}>
            {professional.projectStages.slice(0, 3).map((s) => s.label).join(' · ')}
          </Text>
        )}
        <Text className="text-xs mt-3" style={{ fontFamily: 'Poppins_600SemiBold', color: LANDING_INK }}>
          View professional →
        </Text>
      </Pressable>
    </Link>
  );
}

export default function ProfessionalDirectoryPage() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    q?: string;
    profession?: string;
    need?: string;
    state?: string;
    credentialChecked?: string;
    usedByBmh?: string;
    siteVisits?: string;
    signedReport?: string;
    remoteConsultation?: string;
    type?: string;
  }>();

  const setParam = (key: string, value?: string) => {
    const next = { ...params, [key]: value || undefined };
    router.setParams(next as any);
  };

  const title = 'Construction Professionals in Nigeria';
  const summary =
    'Find architects, engineers, quantity surveyors, surveyors, property lawyers and other professionals by what you need done, where they operate, and whether BuildMyHouse has checked their credentials. Listing is not the same as verification.';

  useWebSeo({
    title: `${title} | BuildMyHouse`,
    description: summary,
    canonicalPath: '/professionals',
    robots: 'index,follow',
    jsonLd: buildSeoJsonLd({
      path: '/professionals',
      title,
      description: summary,
      schemaType: 'Service',
      breadcrumbs: [
        { name: 'Home', path: '/' },
        { name: 'Professionals', path: '/professionals' },
      ],
      faqs: [
        {
          question: 'Does listing mean BuildMyHouse verified this professional?',
          answer: 'No. Listing only means the professional appears in the directory. Credential checks and previous BuildMyHouse use are shown separately.',
        },
        {
          question: 'What does credential checked mean?',
          answer: 'BuildMyHouse reviewed the relevant registration or documents and recorded the date. It does not guarantee future performance.',
        },
      ],
    }),
  });

  const searchParams = useMemo(
    () => ({
      q: typeof params.q === 'string' ? params.q : undefined,
      profession: typeof params.profession === 'string' ? params.profession : undefined,
      need: typeof params.need === 'string' ? params.need : undefined,
      state: typeof params.state === 'string' ? params.state : undefined,
      credentialChecked: params.credentialChecked === '1' || undefined,
      usedByBmh: params.usedByBmh === '1' || undefined,
      siteVisits: params.siteVisits === '1' || undefined,
      signedReport: params.signedReport === '1' || undefined,
      remoteConsultation: params.remoteConsultation === '1' || undefined,
      professionalType: params.type === 'firm' || params.type === 'individual' ? params.type : undefined,
      limit: 30,
    }),
    [params],
  );

  const metaQuery = useQuery({ queryKey: ['professional-meta'], queryFn: fetchProfessionalMeta });
  const listQuery = useQuery({
    queryKey: ['public-professionals', searchParams],
    queryFn: () => fetchPublicProfessionals(searchParams),
  });
  const professionals = listQuery.data?.professionals ?? [];
  const needs = metaQuery.data?.needs || [];
  const professions = metaQuery.data?.professions || [];
  const states = metaQuery.data?.states || [];
  const featuredProfessions = professions.slice(0, 8);

  return (
    <SeoContentShell contentContainerStyle={{ paddingBottom: 48 }}>
      <SeoContentColumn className="pt-10 pb-2 md:pt-14 md:pb-4">
        <SeoContentBackButton fallbackHref="/" />
        <View className="border rounded-3xl p-6 mb-6" style={{ borderColor: LANDING_BORDER }}>
          <SeoHeading level={1} className={seoContentTypography.title} style={{ fontFamily: 'Poppins_700Bold', color: LANDING_INK }}>
            {title}
          </SeoHeading>
          <Text className={seoContentTypography.description} style={{ fontFamily: 'Poppins_400Regular', color: LANDING_MUTED }}>
            {summary}
          </Text>
          <View className="flex-row flex-wrap mt-3">
            <Link href={'/professionals/apply' as any} asChild>
              <Pressable className="rounded-full px-4 py-2.5 mr-3 mb-2 bg-black">
                <Text className="text-white text-sm" style={{ fontFamily: 'Poppins_700Bold' }}>List your professional practice</Text>
              </Pressable>
            </Link>
            <Link href={'/professionals/manage' as any} asChild>
              <Pressable className="rounded-full px-4 py-2.5 mr-3 mb-2 border" style={{ borderColor: LANDING_BORDER }}>
                <Text className="text-sm" style={{ fontFamily: 'Poppins_700Bold', color: LANDING_INK }}>Manage listing</Text>
              </Pressable>
            </Link>
            <Link href={'/book-repair' as any} asChild>
              <Pressable className="rounded-full px-4 py-2.5 mb-2 border" style={{ borderColor: LANDING_BORDER }}>
                <Text className="text-sm" style={{ fontFamily: 'Poppins_700Bold', color: LANDING_INK }}>Find someone for my project</Text>
              </Pressable>
            </Link>
          </View>
        </View>

        <Text className="text-sm mb-2" style={{ fontFamily: 'Poppins_600SemiBold', color: LANDING_INK }}>
          What do you need checked or done?
        </Text>
        <Text className="text-xs mb-2" style={{ fontFamily: 'Poppins_400Regular', color: LANDING_MUTED }}>
          These point to professionals commonly relevant to the task. They are not a legal or professional diagnosis.
        </Text>
        <View className="flex-row flex-wrap mb-4">
          {needs.map((need: any) => (
            <FilterChip
              key={need.key}
              label={need.label}
              active={searchParams.need === need.key}
              onPress={() => setParam('need', searchParams.need === need.key ? undefined : need.key)}
            />
          ))}
        </View>
        {listQuery.data?.appliedNeed && (
          <Text className="text-xs mb-4" style={{ fontFamily: 'Poppins_400Regular', color: LANDING_MUTED }}>
            {listQuery.data.appliedNeed.description}
          </Text>
        )}

        <TextInput
          value={searchParams.q || ''}
          onChangeText={(value) => setParam('q', value)}
          placeholder="Search BOQ, foundation inspection, COREN, Lagos…"
          placeholderTextColor="#9CA3AF"
          className="border rounded-2xl px-4 py-3 text-sm mb-3"
          style={{ borderColor: LANDING_BORDER, fontFamily: 'Poppins_400Regular', color: LANDING_INK, outlineStyle: 'none' as any }}
        />

        <Text className="text-sm mb-2" style={{ fontFamily: 'Poppins_600SemiBold', color: LANDING_INK }}>Profession</Text>
        <View className="flex-row flex-wrap mb-2">
          <FilterChip label="All" active={!searchParams.profession} onPress={() => setParam('profession')} />
          {featuredProfessions.map((item: any) => (
            <FilterChip
              key={item.key}
              label={item.label}
              active={searchParams.profession === item.key}
              onPress={() => setParam('profession', searchParams.profession === item.key ? undefined : item.key)}
            />
          ))}
        </View>

        <Text className="text-sm mb-2" style={{ fontFamily: 'Poppins_600SemiBold', color: LANDING_INK }}>Location</Text>
        <View className="flex-row flex-wrap mb-2">
          <FilterChip label="All states" active={!searchParams.state} onPress={() => setParam('state')} />
          {states.filter((s: any) => ['lagos', 'ogun', 'fct', 'edo', 'rivers', 'oyo'].includes(s.key)).map((item: any) => (
            <FilterChip
              key={item.key}
              label={item.label}
              active={searchParams.state === item.key}
              onPress={() => setParam('state', searchParams.state === item.key ? undefined : item.key)}
            />
          ))}
        </View>

        <Text className="text-sm mb-2" style={{ fontFamily: 'Poppins_600SemiBold', color: LANDING_INK }}>Trust and capability</Text>
        <View className="flex-row flex-wrap mb-4">
          <FilterChip label="Credential checked" active={!!searchParams.credentialChecked} onPress={() => setParam('credentialChecked', searchParams.credentialChecked ? undefined : '1')} />
          <FilterChip label="Used by BuildMyHouse" active={!!searchParams.usedByBmh} onPress={() => setParam('usedByBmh', searchParams.usedByBmh ? undefined : '1')} />
          <FilterChip label="Site visits" active={!!searchParams.siteVisits} onPress={() => setParam('siteVisits', searchParams.siteVisits ? undefined : '1')} />
          <FilterChip label="Remote consultation" active={!!searchParams.remoteConsultation} onPress={() => setParam('remoteConsultation', searchParams.remoteConsultation ? undefined : '1')} />
          <FilterChip label="Signed reports" active={!!searchParams.signedReport} onPress={() => setParam('signedReport', searchParams.signedReport ? undefined : '1')} />
          <FilterChip label="Individual" active={searchParams.professionalType === 'individual'} onPress={() => setParam('type', searchParams.professionalType === 'individual' ? undefined : 'individual')} />
          <FilterChip label="Firm" active={searchParams.professionalType === 'firm'} onPress={() => setParam('type', searchParams.professionalType === 'firm' ? undefined : 'firm')} />
        </View>

        {listQuery.isLoading && <Text style={{ fontFamily: 'Poppins_400Regular', color: LANDING_MUTED }}>Loading professionals…</Text>}
        {listQuery.isError && (
          <View className="border rounded-2xl p-4 mb-3" style={{ borderColor: LANDING_BORDER }}>
            <Text style={{ fontFamily: 'Poppins_500Medium', color: LANDING_INK }}>Unable to load professionals right now.</Text>
            <Pressable onPress={() => listQuery.refetch()} className="mt-2">
              <Text style={{ fontFamily: 'Poppins_600SemiBold', color: LANDING_INK }}>Retry</Text>
            </Pressable>
          </View>
        )}
        {!listQuery.isLoading && professionals.length === 0 && (
          <View className="border rounded-2xl p-5" style={{ borderColor: LANDING_BORDER }}>
            <Text style={{ fontFamily: 'Poppins_600SemiBold', color: LANDING_INK }}>No professionals match these filters yet.</Text>
            <Pressable onPress={() => router.replace('/professionals' as any)} className="mt-3">
              <Text style={{ fontFamily: 'Poppins_600SemiBold', color: LANDING_INK }}>Clear filters</Text>
            </Pressable>
            <Link href={'/book-repair' as any} asChild>
              <Pressable className="mt-2">
                <Text style={{ fontFamily: 'Poppins_600SemiBold', color: LANDING_INK }}>Request BuildMyHouse help →</Text>
              </Pressable>
            </Link>
          </View>
        )}
        {professionals.map((professional) => (
          <ProfessionalCard key={professional.id} professional={professional} />
        ))}
        <Link href={'/vendors' as any} asChild>
          <Pressable className="mt-6">
            <Text className="text-xs" style={{ fontFamily: 'Poppins_400Regular', color: LANDING_MUTED }}>
              Looking for building materials instead? See Vendors →
            </Text>
          </Pressable>
        </Link>
      </SeoContentColumn>
    </SeoContentShell>
  );
}
