import { useCallback, useMemo } from 'react';
import { Link, useLocalSearchParams, useRouter } from 'expo-router';
import { Pressable, Text, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import DirectoryBrowse, {
  DirectoryActionLink,
  DirectoryPill,
  useDirectoryColumns,
  type DirectoryChip,
  type DirectoryFilterSection,
} from '@/components/directory/DirectoryBrowse';
import DirectorySiteHeader from '@/components/directory/DirectorySiteHeader';
import { SeoContentBackButton, SeoContentShell } from '@/components/seo/SeoContentLayout';
import { LANDING_BORDER, LANDING_INK, LANDING_MUTED, LANDING_SURFACE } from '@/lib/home-landing-content';
import {
  DIRECTORY_PAGE_SIZE,
  PROFESSIONAL_DIRECTORY_SUMMARY,
  PROFESSIONAL_QUERY_ORDER,
  directoryCanonical,
  humanizeKey,
  initialsFromName,
  normalizeSearchParams,
  professionalDirectoryHeading,
  readFlag,
  readPage,
  readSort,
  toggleFilterHref,
  withDirectoryParams,
} from '@/lib/directory-listing';
import {
  fetchProfessionalMeta,
  fetchPublicProfessionals,
  type PublicProfessionalCard,
} from '@/lib/public-professionals';
import { buildSeoJsonLd } from '@/lib/seo-schema';
import { usePageOwnedSeo, useWebSeo } from '@/lib/seo';

const PATH = '/professionals';
const FEATURED_STATE_KEYS = ['lagos', 'ogun', 'fct', 'edo', 'rivers', 'oyo'];

function ProfessionalCard({ professional }: { professional: PublicProfessionalCard }) {
  const location = [professional.city, professional.state, ...(professional.serviceStates || [])]
    .filter(Boolean)
    .filter((item, index, all) => all.indexOf(item) === index)
    .slice(0, 3)
    .join(' · ');
  const capabilities = [
    professional.siteVisits ? 'Site inspections' : null,
    professional.remoteConsultation ? 'Remote consultation' : null,
    professional.canIssueSignedReport ? 'Signed reports' : null,
  ].filter(Boolean) as string[];
  const badges = [
    { label: professional.trust.listingLabel, tone: 'outline' as const },
    professional.trust.claimedLabel ? { label: professional.trust.claimedLabel, tone: 'solid' as const } : null,
    professional.trust.credentialLabel ? { label: professional.trust.credentialLabel, tone: 'solid' as const } : null,
    professional.trust.usedByBmhLabel ? { label: professional.trust.usedByBmhLabel, tone: 'solid' as const } : null,
  ].filter(Boolean) as Array<{ label: string; tone: 'outline' | 'solid' }>;
  const role = [
    professional.profession?.label || 'Professional',
    professional.professionalType === 'firm' ? 'Firm' : 'Individual',
  ].join(' · ');

  return (
    <Link href={`/professionals/${professional.slug}` as any} asChild>
      <Pressable
        accessibilityRole="link"
        accessibilityLabel={`${professional.displayName}, ${professional.trust.listingLabel}`}
        style={{
          borderWidth: 1,
          borderColor: LANDING_BORDER,
          borderRadius: 16,
          backgroundColor: '#fff',
          padding: 14,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
          <View
            style={{
              width: 56,
              height: 56,
              borderRadius: professional.professionalType === 'firm' ? 12 : 28,
              backgroundColor: LANDING_SURFACE,
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: 12,
            }}
          >
            <Text style={{ fontFamily: 'Poppins_700Bold', fontSize: 16, color: LANDING_INK }}>
              {initialsFromName(professional.displayName)}
            </Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text numberOfLines={2} style={{ fontFamily: 'Poppins_700Bold', fontSize: 16, color: LANDING_INK }}>
              {professional.displayName}
            </Text>
            <Text style={{ marginTop: 2, fontFamily: 'Poppins_500Medium', fontSize: 13, color: LANDING_INK }}>{role}</Text>
            {location ? (
              <Text style={{ marginTop: 2, fontFamily: 'Poppins_400Regular', fontSize: 13, color: LANDING_MUTED }}>
                {location}
              </Text>
            ) : null}
          </View>
        </View>
        {professional.specialties.length > 0 ? (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 12 }}>
            {professional.specialties.slice(0, 4).map((specialty) => (
              <DirectoryPill key={specialty.key} label={specialty.label} />
            ))}
          </View>
        ) : null}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 6 }}>
          {badges.map((badge) => (
            <DirectoryPill key={badge.label} label={badge.label} tone={badge.tone} />
          ))}
        </View>
        {capabilities.length > 0 ? (
          <Text style={{ marginTop: 4, fontFamily: 'Poppins_400Regular', fontSize: 12, color: LANDING_MUTED }}>
            {capabilities.join(' · ')}
          </Text>
        ) : null}
      </Pressable>
    </Link>
  );
}

export default function ProfessionalDirectoryPage() {
  usePageOwnedSeo();
  const router = useRouter();
  const raw = useLocalSearchParams();
  const params = useMemo(() => normalizeSearchParams(raw, PROFESSIONAL_QUERY_ORDER), [raw]);
  const columns = useDirectoryColumns('professional');
  const page = readPage(params.page);
  const sort = readSort(params.sort);
  const metaQuery = useQuery({ queryKey: ['professional-meta'], queryFn: fetchProfessionalMeta });
  const professions = metaQuery.data?.professions || [];
  const needs = metaQuery.data?.needs || [];
  const states = (metaQuery.data?.states || []).filter((state: { key: string }) =>
    FEATURED_STATE_KEYS.includes(state.key),
  );
  const professionLabel = params.profession
    ? professions.find((item: { key: string; label: string }) => item.key === params.profession)?.label ||
      humanizeKey(params.profession)
    : undefined;
  const stateLabel = params.state
    ? (metaQuery.data?.states || []).find((item: { key: string; label: string }) => item.key === params.state)?.label ||
      humanizeKey(params.state)
    : undefined;
  const needLabel = params.need
    ? needs.find((item: { key: string; label: string }) => item.key === params.need)?.label || humanizeKey(params.need)
    : undefined;
  const title = professionalDirectoryHeading({ professionLabel, stateLabel, needLabel });
  const canonicalPath = directoryCanonical(PATH, params, ['profession', 'need', 'state']);

  useWebSeo({
    title: `${title} | BuildMyHouse`,
    description: PROFESSIONAL_DIRECTORY_SUMMARY,
    canonicalPath,
    robots: 'index,follow',
    jsonLd: buildSeoJsonLd({
      path: canonicalPath,
      title,
      description: PROFESSIONAL_DIRECTORY_SUMMARY,
      schemaType: 'Service',
      breadcrumbs: [
        { name: 'Home', path: '/' },
        { name: 'Professionals', path: '/professionals' },
      ],
      faqs: [
        {
          question: 'Does listing mean BuildMyHouse verified this professional?',
          answer:
            'No. Listing only means the professional appears in the directory. Credential checks and previous BuildMyHouse use are shown separately.',
        },
        {
          question: 'What does credential checked mean?',
          answer:
            'BuildMyHouse reviewed the relevant registration or documents and recorded the date. It does not guarantee future performance.',
        },
      ],
    }),
  });

  const searchParams = useMemo(
    () => ({
      q: params.q?.trim() || undefined,
      profession: params.profession,
      need: params.need,
      state: params.state,
      credentialChecked: readFlag(params.credentialChecked) || undefined,
      usedByBmh: readFlag(params.usedByBmh) || undefined,
      siteVisits: readFlag(params.siteVisits) || undefined,
      signedReport: readFlag(params.signedReport) || undefined,
      remoteConsultation: readFlag(params.remoteConsultation) || undefined,
      professionalType:
        params.type === 'firm' || params.type === 'individual' ? (params.type as 'firm' | 'individual') : undefined,
      sort: sort === 'name' ? ('name' as const) : undefined,
      page,
      limit: DIRECTORY_PAGE_SIZE,
    }),
    [page, params, sort],
  );

  const listQuery = useQuery({
    queryKey: ['public-professionals', searchParams],
    queryFn: () => fetchPublicProfessionals(searchParams),
  });

  const onSearchChange = useCallback(
    (value: string) => {
      router.replace(
        withDirectoryParams(PATH, params, { q: value.trim() || undefined }, PROFESSIONAL_QUERY_ORDER) as any,
      );
    },
    [params, router],
  );

  const chip = (key: string, label: string, param: string, value: string): DirectoryChip => ({
    key,
    label,
    active: params[param] === value,
    href: toggleFilterHref(PATH, params, param, value, PROFESSIONAL_QUERY_ORDER),
  });

  const needChips: DirectoryChip[] = needs.map((need: { key: string; label: string }) =>
    chip(`need-${need.key}`, need.label, 'need', need.key),
  );
  const featuredProfessions = professions.slice(0, 8) as Array<{ key: string; label: string }>;
  const professionSource = (professions.length ? professions : featuredProfessions) as Array<{ key: string; label: string }>;
  const professionChips: DirectoryChip[] = professionSource.map((item) =>
    chip(`profession-${item.key}`, item.label, 'profession', item.key),
  );
  const quickProfessions: DirectoryChip[] = featuredProfessions.map((item) =>
    chip(`profession-${item.key}`, item.label, 'profession', item.key),
  );
  if (params.profession && !quickProfessions.some((item) => item.active)) {
    quickProfessions.unshift(
      chip(`profession-${params.profession}`, professionLabel || params.profession, 'profession', params.profession),
    );
  }
  const stateChips: DirectoryChip[] = states.map((item: { key: string; label: string }) =>
    chip(`state-${item.key}`, item.label, 'state', item.key),
  );
  const capabilityChips = [
    chip('credential', 'Credential checked', 'credentialChecked', '1'),
    chip('used', 'Used by BuildMyHouse', 'usedByBmh', '1'),
    chip('visits', 'Site visits', 'siteVisits', '1'),
    chip('remote', 'Remote consultation', 'remoteConsultation', '1'),
    chip('signed', 'Signed reports', 'signedReport', '1'),
    chip('individual', 'Individual', 'type', 'individual'),
    chip('firm', 'Firm', 'type', 'firm'),
  ];
  if (params.profession && !professionChips.some((item) => item.active)) {
    professionChips.unshift(chip(`profession-${params.profession}`, professionLabel || params.profession, 'profession', params.profession));
  }
  if (params.need && !needChips.some((item) => item.active)) {
    needChips.unshift(chip(`need-${params.need}`, needLabel || params.need, 'need', params.need));
  }
  if (params.state && !stateChips.some((item) => item.active)) {
    stateChips.unshift(chip(`state-${params.state}`, stateLabel || params.state, 'state', params.state));
  }

  const sections: DirectoryFilterSection[] = [
    {
      id: 'need',
      title: 'What do you need checked or done?',
      hint: 'These point to professionals commonly relevant to the task. They are not a legal or professional diagnosis.',
      chips: needChips,
    },
    { id: 'profession', title: 'Profession', chips: professionChips },
    { id: 'location', title: 'Location', chips: stateChips },
    { id: 'trust', title: 'Trust and capability', chips: capabilityChips },
  ];
  const activeFilterCount = [
    params.profession,
    params.need,
    params.state,
    params.credentialChecked,
    params.usedByBmh,
    params.siteVisits,
    params.remoteConsultation,
    params.signedReport,
    params.type,
  ].filter(Boolean).length;

  const professionals = listQuery.data?.professionals ?? [];
  const total = listQuery.data?.meta?.total ?? 0;
  const totalPages = listQuery.data?.meta?.totalPages ?? 0;
  const pageHref = (nextPage: number) =>
    withDirectoryParams(
      PATH,
      params,
      { page: nextPage <= 1 ? undefined : String(nextPage) },
      PROFESSIONAL_QUERY_ORDER,
      false,
    );

  return (
    <View className="flex-1 bg-white">
      <DirectorySiteHeader current="professionals" />
      <SeoContentShell contentContainerStyle={{ paddingBottom: 96 }}>
      <View className="w-full max-w-[1120px] self-center px-4 md:px-6 pt-6 md:pt-10">
        <SeoContentBackButton fallbackHref="/" />
        <DirectoryBrowse
          title={title}
          summary={PROFESSIONAL_DIRECTORY_SUMMARY}
          searchValue={params.q || ''}
          onSearchChange={onSearchChange}
          searchPlaceholder="Search BOQ, foundation inspection, COREN, Lagos…"
          quickChips={needChips}
          wideChips={[...quickProfessions, ...stateChips, ...capabilityChips]}
          sections={sections}
          activeFilterCount={activeFilterCount}
          clearHref={PATH}
          resultCount={listQuery.isLoading ? null : total}
          resultNoun="professional"
          loading={listQuery.isLoading}
          sort={sort}
          sortHrefs={{
            best: withDirectoryParams(PATH, params, { sort: undefined }, PROFESSIONAL_QUERY_ORDER),
            name: withDirectoryParams(PATH, params, { sort: 'name' }, PROFESSIONAL_QUERY_ORDER),
          }}
          page={page}
          totalPages={totalPages}
          pageHref={pageHref}
          columns={columns}
          actions={
            <>
              <DirectoryActionLink href="/professionals/apply" label="List your professional practice" filled />
              <DirectoryActionLink href="/professionals/manage" label="Manage listing" />
              <DirectoryActionLink href="/book-repair" label="Find someone for my project" />
            </>
          }
          notice={
            listQuery.data?.appliedNeed ? (
              <Text style={{ fontFamily: 'Poppins_400Regular', fontSize: 13, color: LANDING_MUTED, marginBottom: 12 }}>
                {listQuery.data.appliedNeed.description}
              </Text>
            ) : null
          }
          error={
            listQuery.isError ? (
              <View style={{ borderWidth: 1, borderColor: LANDING_BORDER, borderRadius: 16, padding: 16, marginBottom: 12 }}>
                <Text style={{ fontFamily: 'Poppins_500Medium', fontSize: 14, color: LANDING_INK }}>
                  Unable to load professionals right now.
                </Text>
                <Pressable onPress={() => listQuery.refetch()} accessibilityRole="button" style={{ marginTop: 8 }}>
                  <Text style={{ fontFamily: 'Poppins_600SemiBold', fontSize: 14, color: LANDING_INK }}>Retry</Text>
                </Pressable>
              </View>
            ) : null
          }
          empty={
            <View style={{ borderWidth: 1, borderColor: LANDING_BORDER, borderRadius: 16, padding: 16 }}>
              <Text style={{ fontFamily: 'Poppins_600SemiBold', fontSize: 14, color: LANDING_INK }}>
                No professionals match these filters yet.
              </Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 12 }}>
                <DirectoryActionLink href={PATH} label="Clear filters" />
                <DirectoryActionLink href="/book-repair" label="Request BuildMyHouse help" filled />
              </View>
            </View>
          }
        >
          {professionals.map((professional) => (
            <ProfessionalCard key={professional.id} professional={professional} />
          ))}
        </DirectoryBrowse>
        <Link href={'/vendors' as any} asChild>
          <Pressable style={{ marginTop: 8, marginBottom: 12 }}>
            <Text style={{ fontFamily: 'Poppins_400Regular', fontSize: 13, color: LANDING_MUTED }}>
              Looking for building materials instead? See Vendors →
            </Text>
          </Pressable>
        </Link>
      </View>
      </SeoContentShell>
    </View>
  );
}
