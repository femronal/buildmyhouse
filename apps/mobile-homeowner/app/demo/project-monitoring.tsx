import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, ShieldCheck } from 'lucide-react-native';
import ProjectOverviewCard from '@/components/seo/ProjectOverviewCard';
import StageTrackerPreview from '@/components/seo/StageTrackerPreview';
import ProofOfProcessDemoSection from '@/components/seo/ProofOfProcessDemoSection';
import { SeoHeading } from '@/components/seo/SeoHeading';
import { trackWebEvent } from '@/lib/analytics';
import { projectMonitoringDemoContent } from '@/lib/demo-project-monitoring';
import { useWebSeo } from '@/lib/seo';
import { buildSeoJsonLd } from '@/lib/seo-schema';

export default function ProjectMonitoringDemoPage() {
  const router = useRouter();
  const content = projectMonitoringDemoContent;

  useWebSeo({
    title: content.title,
    description: content.description,
    canonicalPath: '/demo/project-monitoring',
    robots: 'index,follow',
    jsonLd: buildSeoJsonLd({
      path: '/demo/project-monitoring',
      title: content.title,
      description: content.description,
      schemaType: 'SoftwareApplication',
      breadcrumbs: [
        { name: 'Home', path: '/' },
        { name: 'Demo', path: '/demo/project-monitoring' },
        { name: 'Project Monitoring', path: '/demo/project-monitoring' },
      ],
    }),
  });

  return (
    <View className="flex-1 bg-white">
      <ScrollView className="flex-1 px-5 md:px-6" contentContainerStyle={{ paddingBottom: 40 }}>
        <View className="pt-10 pb-3 md:pt-14">
          <TouchableOpacity
            onPress={() => (router.canGoBack() ? router.back() : router.push('/login'))}
            className="w-9 h-9 bg-gray-100 rounded-full items-center justify-center mb-3 md:w-10 md:h-10"
          >
            <ArrowLeft size={18} color="#000000" strokeWidth={2.5} />
          </TouchableOpacity>

          <Text
            className="text-[10px] md:text-xs uppercase tracking-wide text-blue-700 mb-1"
            style={{ fontFamily: 'Poppins_600SemiBold' }}
          >
            {content.eyebrow}
          </Text>
          <SeoHeading
            level={1}
            className="text-2xl leading-tight text-black mb-2 md:text-4xl"
            style={{ fontFamily: 'Poppins_700Bold' }}
          >
            Try BuildMyHouse Project Monitoring
          </SeoHeading>
          <Text className="text-sm text-gray-600 leading-6 mb-4" style={{ fontFamily: 'Poppins_400Regular' }}>
            See how remote project oversight can feel with stage tracking, proof-based milestone logic,
            and structured updates before signup.
          </Text>

          <TouchableOpacity
            onPress={() => {
              trackWebEvent('demo_project_monitoring_cta_top', {
                cta_href: content.ctaHref,
              });
              router.push(content.ctaHref as any);
            }}
            className="bg-blue-600 rounded-full py-3.5 px-5 mb-2"
          >
            <Text className="text-white text-center text-base" style={{ fontFamily: 'Poppins_700Bold' }}>
              {content.ctaLabel}
            </Text>
          </TouchableOpacity>
        </View>

        <ProjectOverviewCard overview={content.overview} />
        <StageTrackerPreview items={content.stages} />

        <View className="flex-row items-start bg-blue-50 border border-blue-200 rounded-2xl p-3 mb-4">
          <ShieldCheck size={18} color="#1d4ed8" style={{ marginTop: 1, marginRight: 8 }} />
          <Text className="text-xs text-blue-900 flex-1 leading-5" style={{ fontFamily: 'Poppins_500Medium' }}>
            {content.trustMessage}
          </Text>
        </View>

        <ProofOfProcessDemoSection content={content.proofDemo} />

        <TouchableOpacity
          onPress={() => {
            trackWebEvent('demo_project_monitoring_cta_bottom', {
              cta_href: content.ctaHref,
            });
            router.push(content.ctaHref as any);
          }}
          className="bg-black rounded-full py-4 px-5 mb-3"
        >
          <Text className="text-white text-center text-base" style={{ fontFamily: 'Poppins_700Bold' }}>
            Start a tracked project with BuildMyHouse
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

