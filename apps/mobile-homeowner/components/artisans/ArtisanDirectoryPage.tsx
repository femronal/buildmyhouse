import { useCallback, useMemo, useState } from 'react';
import { Link, useLocalSearchParams, useRouter } from 'expo-router';
import { Image, Pressable, Text, View } from 'react-native';
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
import { TrustRing } from '@/components/artisans/TrustRing';
import { getBackendAssetUrl } from '@/lib/image';
import { LANDING_BORDER, LANDING_INK, LANDING_MUTED, LANDING_SURFACE } from '@/lib/home-landing-content';
import {
  ARTISAN_QUERY_ORDER,
  DIRECTORY_PAGE_SIZE,
  artisanDirectoryHeading,
  artisanDirectorySummary,
  directoryCanonical,
  humanizeKey,
  initialsFromName,
  normalizeSearchParams,
  readFlag,
  readPage,
  readSort,
  toggleFilterHref,
  withDirectoryParams,
} from '@/lib/directory-listing';
import { fetchArtisanMeta, fetchArtisans, type ArtisanCard, type ArtisanProblem } from '@/lib/public-artisans';
import { buildSeoJsonLd } from '@/lib/seo-schema';
import { usePageOwnedSeo, useWebSeo } from '@/lib/seo';

const PATH = '/artisans';
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
const FEATURED_STATES = ['Lagos', 'Ogun', 'FCT', 'Edo', 'Rivers', 'Oyo'];

function problemKey(label: string) {
  return label.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function dedupedProblems(problems: ArtisanProblem[]): ArtisanProblem[] {
  const seen = new Set<string>();
  const rows: ArtisanProblem[] = [];
  for (const item of problems) {
    if (seen.has(item.key)) continue;
    seen.add(item.key);
    rows.push(item);
  }
  if (!rows.length) {
    return FEATURED_PROBLEMS.map((label) => ({ key: problemKey(label), label, tradeKey: '', tradeLabel: '' }));
  }
  const featured = FEATURED_PROBLEMS.map((label) => rows.find((item) => item.key === problemKey(label))).filter(
    (item): item is ArtisanProblem => !!item,
  );
  const featuredKeys = new Set(featured.map((item) => item.key));
  return [...featured, ...rows.filter((item) => !featuredKeys.has(item.key))];
}

function ArtisanMark({ name, logoUrl }: { name: string; logoUrl: string | null }) {
  const [failed, setFailed] = useState(false);
  const logo = !failed ? getBackendAssetUrl(logoUrl) : null;
  if (!logo) {
    return <Text style={{ fontFamily: 'Poppins_700Bold', fontSize: 28, color: LANDING_INK }}>{initialsFromName(name)}</Text>;
  }
  return (
    <Image
      source={{ uri: logo }}
      accessibilityIgnoresInvertColors
      onError={() => setFailed(true)}
      style={{ width: '78%', height: '78%' }}
      resizeMode="contain"
    />
  );
}

function ArtisanResultCard({ artisan }: { artisan: ArtisanCard }) {
  const place = [artisan.city, artisan.state].filter(Boolean).join(', ');
  const meta = [artisan.trade?.label, place].filter(Boolean).join(' · ');
  const reasons = artisan.problems.length > 0 ? artisan.problems : artisan.services;
  return (
    <Link href={`/artisans/${artisan.slug}` as any} asChild>
      <Pressable
        accessibilityRole="link"
        accessibilityLabel={`${artisan.displayName}, Listed`}
        style={{ borderWidth: 1, borderColor: LANDING_BORDER, borderRadius: 16, backgroundColor: '#fff', overflow: 'hidden' }}
      >
        <View style={{ aspectRatio: 4 / 3, backgroundColor: LANDING_SURFACE, alignItems: 'center', justifyContent: 'center' }}>
          <ArtisanMark name={artisan.displayName} logoUrl={artisan.logoUrl} />
          <View style={{ position: 'absolute', top: 10, left: 10, flexDirection: 'row', flexWrap: 'wrap' }}>
            <DirectoryPill label="Listed" />
            {artisan.claimStatus === 'claimed' ? <DirectoryPill label="Claimed" /> : null}
            {artisan.verificationStatus === 'verified' ? <DirectoryPill label="Verified" tone="solid" /> : null}
            {artisan.usedByBmh ? <DirectoryPill label="Used by BMH" /> : null}
          </View>
          <View style={{ position: 'absolute', top: 8, right: 8, backgroundColor: '#fff', borderRadius: 999 }}>
            <TrustRing score={artisan.trustScore} size={44} />
          </View>
        </View>
        <View style={{ paddingHorizontal: 12, paddingTop: 12, paddingBottom: 14 }}>
          <Text numberOfLines={2} style={{ fontFamily: 'Poppins_700Bold', fontSize: 16, color: LANDING_INK }}>
            {artisan.displayName}
          </Text>
          {meta ? (
            <Text numberOfLines={2} style={{ marginTop: 4, fontFamily: 'Poppins_400Regular', fontSize: 13, color: LANDING_MUTED }}>
              {meta}
            </Text>
          ) : null}
          {reasons.length > 0 ? (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 10 }}>
              {reasons.slice(0, 2).map((label) => (
                <DirectoryPill key={label} label={label} />
              ))}
              {reasons.length > 2 ? <DirectoryPill label={`+${reasons.length - 2} more`} /> : null}
            </View>
          ) : null}
        </View>
      </Pressable>
    </Link>
  );
}

export default function ArtisanDirectoryPage() {
  usePageOwnedSeo();
  const router = useRouter();
  const raw = useLocalSearchParams();
  const params = useMemo(() => normalizeSearchParams(raw, ARTISAN_QUERY_ORDER), [raw]);
  const columns = useDirectoryColumns('artisan');
  const page = readPage(params.page);
  const sort = readSort(params.sort);
  const metaQuery = useQuery({ queryKey: ['artisan-meta'], queryFn: fetchArtisanMeta });
  const trades = metaQuery.data?.trades || [];
  const problems = metaQuery.data?.problems || [];
  const selectedProblem = problems.find((item) => item.key === params.problem);
  const selectedTrade = trades.find((item) => item.key === params.trade);
  const featuredLabel = FEATURED_PROBLEMS.find((label) => problemKey(label) === params.problem);
  const problemLabel = selectedProblem?.label || featuredLabel || (params.problem ? humanizeKey(params.problem) : undefined);
  const title = artisanDirectoryHeading({
    problemLabel,
    tradeLabel: selectedTrade?.label,
    stateLabel: params.state,
  });
  const summary = artisanDirectorySummary(problemLabel);

  useWebSeo({
    title: `${title} | BuildMyHouse`,
    description: summary,
    canonicalPath: directoryCanonical(PATH, params, ['problem', 'trade', 'state']),
    robots: 'index,follow',
    jsonLd: buildSeoJsonLd({
      path: directoryCanonical(PATH, params, ['problem', 'trade', 'state']),
      title,
      description: summary,
      schemaType: 'Service',
      breadcrumbs: [
        { name: 'Home', path: '/' },
        { name: 'Artisans', path: '/artisans' },
      ],
      faqs: [
        {
          question: 'How do I find an artisan for a repair?',
          answer:
            'Choose what needs fixing, or choose the trade. The results are artisans listed for that kind of repair. Choosing a problem is not a diagnosis.',
        },
        {
          question: 'Does a listed artisan mean BuildMyHouse verified them?',
          answer: 'No. Listing only means the artisan appears in the directory. Verification and previous BuildMyHouse use are shown separately.',
        },
      ],
    }),
  });

  const searchParams = useMemo(
    () => ({
      q: params.q?.trim() || undefined,
      problem: params.problem,
      trade: params.trade,
      state: params.state,
      verifiedOnly: readFlag(params.verified) || undefined,
      usedByBmh: readFlag(params.usedByBmh) || undefined,
      claimed: readFlag(params.claimed) || undefined,
      hasWorkshop: readFlag(params.workshop) || undefined,
      sort,
      page,
      limit: DIRECTORY_PAGE_SIZE,
    }),
    [page, params, sort],
  );

  const listQuery = useQuery({
    queryKey: ['public-artisans', searchParams],
    queryFn: () => fetchArtisans(searchParams),
  });

  const onSearchChange = useCallback(
    (value: string) => {
      router.replace(withDirectoryParams(PATH, params, { q: value.trim() || undefined }, ARTISAN_QUERY_ORDER) as any);
    },
    [params, router],
  );

  const chip = (key: string, label: string, param: string, value: string): DirectoryChip => ({
    key,
    label,
    active: params[param] === value,
    href: toggleFilterHref(PATH, params, param, value, ARTISAN_QUERY_ORDER),
  });

  const allProblems = dedupedProblems(problems);
  const featuredKeys = new Set(FEATURED_PROBLEMS.map(problemKey));
  const problemChips = allProblems.map((item) => chip(`problem-${item.key}`, item.label, 'problem', item.key));
  const quickProblemChips = problemChips.filter((item) => featuredKeys.has(item.key.replace('problem-', '')));
  const visibleQuickProblems = quickProblemChips.length ? quickProblemChips : problemChips;
  if (params.problem && !visibleQuickProblems.some((item) => item.active)) {
    visibleQuickProblems.unshift(chip(`problem-${params.problem}`, problemLabel || params.problem, 'problem', params.problem));
  }
  if (params.problem && !problemChips.some((item) => item.active)) {
    problemChips.unshift(chip(`problem-${params.problem}`, problemLabel || params.problem, 'problem', params.problem));
  }
  const tradeChips = trades.map((trade) => chip(`trade-${trade.key}`, trade.label, 'trade', trade.key));
  if (params.trade && !tradeChips.some((item) => item.active)) {
    tradeChips.unshift(chip(`trade-${params.trade}`, selectedTrade?.label || params.trade, 'trade', params.trade));
  }
  const stateChips = FEATURED_STATES.map((label) => chip(`state-${label}`, label, 'state', label));
  const trustChips = [
    chip('verified', 'Verified', 'verified', '1'),
    chip('used', 'Used by BuildMyHouse', 'usedByBmh', '1'),
    chip('claimed', 'Claimed', 'claimed', '1'),
    chip('workshop', 'Workshop photo', 'workshop', '1'),
  ];

  const sections: DirectoryFilterSection[] = [
    {
      id: 'problem',
      title: 'What needs fixing?',
      hint: 'These point to artisans who handle that kind of repair. They are not a diagnosis.',
      chips: problemChips,
    },
    { id: 'trade', title: 'Trade', chips: tradeChips },
    { id: 'location', title: 'Location', chips: stateChips },
    { id: 'trust', title: 'Listing details', chips: trustChips },
  ];
  const activeFilterCount = [params.problem, params.trade, params.state, params.verified, params.usedByBmh, params.claimed, params.workshop].filter(Boolean).length;
  const artisans = listQuery.data?.data ?? [];
  const total = listQuery.data?.total ?? 0;
  const totalPages = Math.ceil(total / DIRECTORY_PAGE_SIZE);
  const pageHref = (nextPage: number) =>
    withDirectoryParams(PATH, params, { page: nextPage <= 1 ? undefined : String(nextPage) }, ARTISAN_QUERY_ORDER, false);

  return (
    <View className="flex-1 bg-white">
      <DirectorySiteHeader current="artisans" />
      <SeoContentShell contentContainerStyle={{ paddingBottom: 96 }}>
        <View className="w-full max-w-[1120px] self-center px-4 md:px-6 pt-6 md:pt-10">
          <SeoContentBackButton fallbackHref="/" />
          <DirectoryBrowse
            title={title}
            summary={summary}
            searchValue={params.q || ''}
            onSearchChange={onSearchChange}
            searchPlaceholder="plumber Mowe, roof leak Lekki, broken window Lagos"
            quickChips={visibleQuickProblems}
            wideChips={[...tradeChips, ...stateChips, ...trustChips]}
            sections={sections}
            activeFilterCount={activeFilterCount}
            clearHref={PATH}
            resultCount={listQuery.isLoading ? null : total}
            resultNoun="artisan"
            loading={listQuery.isLoading}
            sort={sort}
            sortHrefs={{
              best: withDirectoryParams(PATH, params, { sort: undefined }, ARTISAN_QUERY_ORDER),
              name: withDirectoryParams(PATH, params, { sort: 'name' }, ARTISAN_QUERY_ORDER),
            }}
            page={page}
            totalPages={totalPages}
            pageHref={pageHref}
            columns={columns}
            actions={
              <>
                <DirectoryActionLink href="/artisans/apply" label="List my repair business" filled />
                <DirectoryActionLink href="/professionals" label="Find a professional" />
                <DirectoryActionLink href="/start" label="Start a repair" />
              </>
            }
            notice={
              selectedProblem?.professionalNote ? (
                <View style={{ borderWidth: 1, borderColor: LANDING_BORDER, borderRadius: 16, padding: 14, marginBottom: 12 }}>
                  <Text style={{ fontFamily: 'Poppins_400Regular', fontSize: 14, color: LANDING_INK, lineHeight: 22 }}>
                    {selectedProblem.professionalNote}
                  </Text>
                  {selectedProblem.professionalHref ? (
                    <Link href={selectedProblem.professionalHref as any}>
                      <Text style={{ fontFamily: 'Poppins_600SemiBold', color: LANDING_INK, marginTop: 8 }}>See professionals →</Text>
                    </Link>
                  ) : null}
                </View>
              ) : null
            }
            error={
              listQuery.isError ? (
                <View style={{ borderWidth: 1, borderColor: LANDING_BORDER, borderRadius: 16, padding: 16, marginBottom: 12 }}>
                  <Text style={{ fontFamily: 'Poppins_500Medium', fontSize: 14, color: LANDING_INK }}>Unable to load artisans right now.</Text>
                  <Pressable onPress={() => listQuery.refetch()} accessibilityRole="button" style={{ marginTop: 8 }}>
                    <Text style={{ fontFamily: 'Poppins_600SemiBold', fontSize: 14, color: LANDING_INK }}>Retry</Text>
                  </Pressable>
                </View>
              ) : null
            }
            empty={
              <View style={{ borderWidth: 1, borderColor: LANDING_BORDER, borderRadius: 16, padding: 16 }}>
                <Text style={{ fontFamily: 'Poppins_600SemiBold', fontSize: 14, color: LANDING_INK }}>
                  {problemLabel ? `No artisans are listed for ${problemLabel} yet.` : 'No artisans match these filters yet.'}
                </Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 12 }}>
                  <DirectoryActionLink href={PATH} label="Clear filters" />
                  <DirectoryActionLink href="/artisans/apply" label="List my repair business" filled />
                </View>
              </View>
            }
          >
            {artisans.map((artisan) => (
              <ArtisanResultCard key={artisan.id} artisan={artisan} />
            ))}
          </DirectoryBrowse>
        </View>
      </SeoContentShell>
    </View>
  );
}
