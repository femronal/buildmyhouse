import { Pressable, Text, View } from 'react-native';
import { Link } from 'expo-router';
import {
  SeoContentBackButton,
  SeoContentColumn,
  SeoContentShell,
  seoContentTypography,
} from '@/components/seo/SeoContentLayout';
import { SeoHeading } from '@/components/seo/SeoHeading';
import { LANDING_BORDER, LANDING_INK, LANDING_MUTED } from '@/lib/home-landing-content';
import { LAGOS_REPAIR_SLUGS, LAGOS_REPAIR_SERVICES, lagosServicePath } from '@/lib/lagos-repair-services';
import { contractorDirectoryPath } from '@/lib/public-contractors';
import { buildSeoJsonLd } from '@/lib/seo-schema';
import { useWebSeo } from '@/lib/seo';

const INTAKE_FAQS = [
  {
    question: 'What is a tracked repair on BuildMyHouse?',
    answer:
      'A tracked repair breaks work into stages with photo evidence and approval checkpoints so you pay after verified progress — not on vague promises.',
  },
  {
    question: 'Who is this for?',
    answer:
      'Homeowners in Lagos and diaspora clients managing property remotely who want verified workers and clearer repair accountability.',
  },
  {
    question: 'What happens after I continue?',
    answer:
      'You choose how to start — browse verified project ideas or upload your brief — then scope the repair and assign verified workers.',
  },
] as const;

export default function StartRepairPage() {
  const canonicalPath = '/start-repair';
  const title = 'Start a Tracked Repair in Lagos';
  const description =
    'Start a tracked repair in Lagos with verified workers, stage updates, and evidence before payment. Plumbing, electrical, roof leaks, drainage, painting, and maintenance.';

  const jsonLd = buildSeoJsonLd({
    path: canonicalPath,
    title,
    description,
    schemaType: 'Service',
    faqs: [...INTAKE_FAQS],
    breadcrumbs: [
      { name: 'Home', path: '/' },
      { name: 'Start a tracked repair', path: canonicalPath },
    ],
  });

  useWebSeo({
    title: `${title} | BuildMyHouse`,
    description,
    canonicalPath,
    robots: 'index,follow',
    jsonLd,
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
            {description}
          </Text>
          <Text
            className={seoContentTypography.bodyParagraph}
            style={{ fontFamily: 'Poppins_400Regular', color: LANDING_MUTED }}
          >
            Tell us what needs fixing, match verified workers, and track each stage with evidence before you approve
            payment. Built for urgent Lagos repairs and remote owners who need visibility — not blind transfers.
          </Text>

          <View className="flex-row flex-wrap mt-2">
            <Link href={'/choose-project-type' as any} asChild>
              <Pressable className="rounded-full px-4 py-2.5 mr-3 mb-2 bg-black" accessibilityRole="link">
                <Text className="text-white text-sm" style={{ fontFamily: 'Poppins_700Bold' }}>
                  Continue to repair intake
                </Text>
              </Pressable>
            </Link>
            <Link href={contractorDirectoryPath() as any} asChild>
              <Pressable
                className="rounded-full px-4 py-2.5 mb-2 border"
                style={{ borderColor: LANDING_BORDER }}
                accessibilityRole="link"
              >
                <Text className="text-sm" style={{ fontFamily: 'Poppins_700Bold', color: LANDING_INK }}>
                  Browse Lagos contractors
                </Text>
              </Pressable>
            </Link>
          </View>
        </View>

        <View className="border rounded-3xl p-6 mb-6" style={{ borderColor: LANDING_BORDER }}>
          <SeoHeading
            level={2}
            className={seoContentTypography.sectionHeading}
            style={{ fontFamily: 'Poppins_700Bold', color: LANDING_INK }}
          >
            Popular repair types in Lagos
          </SeoHeading>
          <View className="flex-row flex-wrap">
            {LAGOS_REPAIR_SLUGS.map((slug) => (
              <Link key={slug} href={lagosServicePath(slug) as any} asChild>
                <Pressable
                  className="rounded-full px-4 py-2 mr-2 mb-2 border"
                  style={{ borderColor: LANDING_BORDER }}
                  accessibilityRole="link"
                >
                  <Text className="text-sm" style={{ fontFamily: 'Poppins_600SemiBold', color: LANDING_INK }}>
                    {LAGOS_REPAIR_SERVICES[slug].title}
                  </Text>
                </Pressable>
              </Link>
            ))}
          </View>
        </View>

        <View className="border rounded-3xl p-6" style={{ borderColor: LANDING_BORDER }}>
          <SeoHeading
            level={2}
            className={seoContentTypography.sectionHeading}
            style={{ fontFamily: 'Poppins_700Bold', color: LANDING_INK }}
          >
            How tracked repairs work
          </SeoHeading>
          {[
            'Define the repair scope — what is broken, where, and urgency.',
            'Match verified workers or browse the Lagos contractor directory.',
            'Approve stages with photo evidence before major payments.',
          ].map((step, index) => (
            <Text
              key={step}
              className="text-sm leading-6 mb-2"
              style={{ fontFamily: 'Poppins_400Regular', color: LANDING_MUTED }}
            >
              {index + 1}. {step}
            </Text>
          ))}
        </View>
      </SeoContentColumn>
    </SeoContentShell>
  );
}
