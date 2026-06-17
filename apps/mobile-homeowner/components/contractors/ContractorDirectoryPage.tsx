import { Pressable, Text, View } from 'react-native';
import { Link } from 'expo-router';
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
  CONTRACTOR_DIRECTORY_SPECIALTIES,
  CONTRACTOR_DIRECTORY_SPECIALTY_SLUGS,
  contractorDirectoryPath,
  fetchPublicContractors,
  type ContractorDirectorySpecialtySlug,
} from '@/lib/public-contractors';
import { buildSeoJsonLd } from '@/lib/seo-schema';
import { useWebSeo } from '@/lib/seo';

type ContractorDirectoryPageProps = {
  specialty?: ContractorDirectorySpecialtySlug;
};

function ContractorCard({
  name,
  specialty,
  rating,
  reviewCount,
  verified,
}: {
  name: string;
  specialty: string | null;
  rating: number | null;
  reviewCount: number;
  verified: boolean;
}) {
  return (
    <View className="border rounded-2xl p-4 mb-3" style={{ borderColor: LANDING_BORDER }}>
      <View className="flex-row items-center justify-between mb-1">
        <Text className="text-base" style={{ fontFamily: 'Poppins_700Bold', color: LANDING_INK }}>
          {name}
        </Text>
        {verified ? (
          <View className="rounded-full px-2 py-0.5 bg-black">
            <Text className="text-[10px] text-white" style={{ fontFamily: 'Poppins_600SemiBold' }}>
              Verified
            </Text>
          </View>
        ) : null}
      </View>
      {specialty ? (
        <Text className="text-sm mb-1" style={{ fontFamily: 'Poppins_500Medium', color: LANDING_MUTED }}>
          {specialty}
        </Text>
      ) : null}
      <Text className="text-xs" style={{ fontFamily: 'Poppins_400Regular', color: LANDING_MUTED }}>
        {rating != null ? `${rating.toFixed(1)} rating` : 'Rating pending'} · {reviewCount} review
        {reviewCount === 1 ? '' : 's'}
      </Text>
    </View>
  );
}

export default function ContractorDirectoryPage({ specialty }: ContractorDirectoryPageProps) {
  const config = specialty ? CONTRACTOR_DIRECTORY_SPECIALTIES[specialty] : null;
  const canonicalPath = contractorDirectoryPath(specialty);
  const title = config?.title ?? 'Verified Contractors in Lagos';
  const summary =
    config?.summary ??
    'Browse verified contractors serving Lagos on BuildMyHouse. Start a tracked repair when you are ready to assign work with evidence before payment.';

  const jsonLd = buildSeoJsonLd({
    path: canonicalPath,
    title,
    description: summary,
    schemaType: 'Service',
    breadcrumbs: [
      { name: 'Home', path: '/' },
      { name: 'Contractors in Lagos', path: '/contractors/lagos' },
      ...(config ? [{ name: config.title, path: canonicalPath }] : []),
    ],
    faqs: [
      {
        question: 'Are contractors in this directory verified?',
        answer:
          'BuildMyHouse lists verified contractors by default. Assign work through a tracked repair to add stage evidence and approval checkpoints.',
      },
      {
        question: 'How do I hire a contractor from the directory?',
        answer:
          'Browse listings, then use Start a Tracked Repair to define scope and run the job with staged updates and evidence before payment.',
      },
    ],
  });

  useWebSeo({
    title: `${title} | BuildMyHouse`,
    description: summary,
    canonicalPath,
    robots: 'index,follow',
    jsonLd,
  });

  const { data, isLoading, isError } = useQuery({
    queryKey: ['public-contractors', config?.marketplaceQuery ?? 'lagos'],
    queryFn: () =>
      fetchPublicContractors({
        query: config?.marketplaceQuery,
        limit: 24,
      }),
  });

  return (
    <SeoContentShell contentContainerStyle={{ paddingBottom: 48 }}>
      <SeoContentColumn className="pt-10 pb-2 md:pt-14 md:pb-4">
        <SeoContentBackButton fallbackHref="/" />

        <View className="border rounded-3xl p-6 mb-6" style={{ borderColor: LANDING_BORDER }}>
          <SeoHeading
            level={1}
            className={seoContentTypography.title}
            style={{ fontFamily: 'Poppins_700Bold', color: LANDING_INK }}
          >
            {title}
          </SeoHeading>
          <Text
            className={seoContentTypography.description}
            style={{ fontFamily: 'Poppins_400Regular', color: LANDING_MUTED }}
          >
            {summary}
          </Text>
          <Text
            className={seoContentTypography.bodyParagraph}
            style={{ fontFamily: 'Poppins_400Regular', color: LANDING_MUTED }}
          >
            This public directory shows verified contractor listings only — no private homeowner or project data.
            When you are ready, start a tracked repair to assign work with stage evidence before payment.
          </Text>

          <View className="flex-row flex-wrap mt-2">
            <Link href={'/start-repair' as any} asChild>
              <Pressable className="rounded-full px-4 py-2.5 mr-3 mb-2 bg-black" accessibilityRole="link">
                <Text className="text-white text-sm" style={{ fontFamily: 'Poppins_700Bold' }}>
                  Start a Tracked Repair
                </Text>
              </Pressable>
            </Link>
            {config?.servicePath ? (
              <Link href={config.servicePath as any} asChild>
                <Pressable
                  className="rounded-full px-4 py-2.5 mb-2 border"
                  style={{ borderColor: LANDING_BORDER }}
                  accessibilityRole="link"
                >
                  <Text className="text-sm" style={{ fontFamily: 'Poppins_700Bold', color: LANDING_INK }}>
                    Service guide
                  </Text>
                </Pressable>
              </Link>
            ) : null}
          </View>
        </View>

        {!specialty ? (
          <View className="mb-6">
            <Text className="text-sm mb-3" style={{ fontFamily: 'Poppins_600SemiBold', color: LANDING_INK }}>
              Browse by repair type
            </Text>
            <View className="flex-row flex-wrap">
              {CONTRACTOR_DIRECTORY_SPECIALTY_SLUGS.map((item) => (
                <Link key={item} href={contractorDirectoryPath(item) as any} asChild>
                  <Pressable
                    className="rounded-full px-4 py-2 mr-2 mb-2 border"
                    style={{ borderColor: LANDING_BORDER }}
                    accessibilityRole="link"
                  >
                    <Text className="text-sm" style={{ fontFamily: 'Poppins_600SemiBold', color: LANDING_INK }}>
                      {CONTRACTOR_DIRECTORY_SPECIALTIES[item].title.replace(' in Lagos', '')}
                    </Text>
                  </Pressable>
                </Link>
              ))}
            </View>
          </View>
        ) : null}

        <View className="border rounded-3xl p-6" style={{ borderColor: LANDING_BORDER }}>
          <SeoHeading
            level={2}
            className={seoContentTypography.sectionHeading}
            style={{ fontFamily: 'Poppins_700Bold', color: LANDING_INK }}
          >
            Verified listings
          </SeoHeading>

          {isLoading ? (
            <Text className="text-sm" style={{ fontFamily: 'Poppins_400Regular', color: LANDING_MUTED }}>
              Loading contractors…
            </Text>
          ) : null}

          {isError ? (
            <Text className="text-sm leading-6" style={{ fontFamily: 'Poppins_400Regular', color: LANDING_MUTED }}>
              We could not load listings right now. You can still start a tracked repair and we will help match a
              verified worker.
            </Text>
          ) : null}

          {!isLoading && !isError && data?.contractors.length === 0 ? (
            <Text className="text-sm leading-6" style={{ fontFamily: 'Poppins_400Regular', color: LANDING_MUTED }}>
              No verified listings matched this filter yet. Start a tracked repair and BuildMyHouse will help match
              verified workers for your scope.
            </Text>
          ) : null}

          {data?.contractors.map((contractor) => (
            <ContractorCard
              key={contractor.id}
              name={contractor.name}
              specialty={contractor.specialty}
              rating={contractor.rating}
              reviewCount={contractor.reviewCount}
              verified={contractor.verified}
            />
          ))}
        </View>
      </SeoContentColumn>
    </SeoContentShell>
  );
}
