import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, CreditCard, ShieldCheck } from 'lucide-react-native';
import ProjectMonitoringDemoPhone from '@/components/demo/ProjectMonitoringDemoPhone';
import { SeoHeading } from '@/components/seo/SeoHeading';
import { trackWebEvent } from '@/lib/analytics';
import { projectMonitoringDemoData } from '@/lib/demo-project-monitoring';
import { useWebSeo } from '@/lib/seo';
import { buildSeoJsonLd } from '@/lib/seo-schema';
import { cardShadowStyle } from '@/lib/card-styles';

const DEMO_DEVICE_INNER_HEIGHT = 720;
const DEMO_NOTCH_HEIGHT = 22;

export default function ProjectMonitoringDemoPage() {
  const router = useRouter();

  const seoTitle = 'Remote Project Monitoring Demo | BuildMyHouse';
  const seoDescription =
    'Preview how BuildMyHouse helps diaspora homeowners watch stage progress, receive notifications, and stay in control of payment flow while the GC drives project execution.';

  useWebSeo({
    title: seoTitle,
    description: seoDescription,
    canonicalPath: '/demo/project-monitoring',
    robots: 'index,follow',
    jsonLd: buildSeoJsonLd({
      path: '/demo/project-monitoring',
      title: seoTitle,
      description: seoDescription,
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
            className="text-[10px] md:text-xs uppercase tracking-wide text-gray-500 mb-1"
            style={{ fontFamily: 'Poppins_600SemiBold' }}
          >
            Interactive Demo
          </Text>
          <SeoHeading
            level={1}
            className="text-2xl leading-tight text-black mb-2 md:text-4xl"
            style={{ fontFamily: 'Poppins_700Bold' }}
          >
            Public Preview: Remote Project Monitoring
          </SeoHeading>
          <Text className="text-sm text-gray-600 leading-6 mb-4" style={{ fontFamily: 'Poppins_400Regular' }}>
            This demo mirrors the in-app homeowner experience using sample data: project list, dashboard, build
            timeline, stage materials/team/files, and GC chat.
          </Text>
          <View className="flex-row items-start bg-gray-100 border border-gray-300 rounded-2xl p-3 mb-4">
            <ShieldCheck size={18} color="#1f2937" style={{ marginTop: 1, marginRight: 8 }} />
            <Text className="text-xs text-gray-800 flex-1 leading-5" style={{ fontFamily: 'Poppins_500Medium' }}>
              This is a demo experience with sample data, built for public preview.
            </Text>
          </View>

          <View className="flex-col md:flex-row gap-3 mb-2">
            <TouchableOpacity
              onPress={() => {
                trackWebEvent('demo_project_monitoring_cta_top_start', {
                  cta_href: '/location?mode=explore',
                });
                router.push('/location?mode=explore' as any);
              }}
              className="bg-black rounded-full py-3.5 px-5"
            >
              <Text className="text-white text-center text-base" style={{ fontFamily: 'Poppins_700Bold' }}>
                Start a Tracked Project
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => {
                trackWebEvent('demo_project_monitoring_cta_top_learn', {
                  cta_href: '/diaspora/build-in-nigeria-from-abroad',
                });
                router.push('/diaspora/build-in-nigeria-from-abroad' as any);
              }}
              className="border border-gray-300 rounded-full py-3.5 px-5"
            >
              <Text className="text-gray-900 text-center text-base" style={{ fontFamily: 'Poppins_600SemiBold' }}>
                Learn How Building From Abroad Works
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View className="items-center mb-5">
          <View style={cardShadowStyle} className="w-full max-w-[390px] bg-black rounded-[30px] p-2.5">
            <View
              className="bg-white rounded-[24px] overflow-hidden"
              style={{ height: DEMO_DEVICE_INNER_HEIGHT }}
            >
              <View style={{ height: DEMO_NOTCH_HEIGHT }} className="items-center justify-center">
                <View className="w-24 h-1.5 rounded-full bg-gray-300" />
              </View>
              <ProjectMonitoringDemoPhone
                initialRoute={{ name: 'home' }}
                homeRoute={{ name: 'home' }}
                innerHeight={DEMO_DEVICE_INNER_HEIGHT - DEMO_NOTCH_HEIGHT}
              />
            </View>
          </View>
        </View>

        <View style={cardShadowStyle} className="bg-gray-100 border border-gray-300 rounded-2xl p-4 mb-4">
          <SeoHeading level={2} className="text-black text-xl mb-3" style={{ fontFamily: 'Poppins_700Bold' }}>
            Payment and workflow explanation
          </SeoHeading>
          <Text className="text-gray-800 text-sm leading-6 mb-2" style={{ fontFamily: 'Poppins_400Regular' }}>
            Payment progression is controlled through homeowner satisfaction confirmation before the GC continues into
            the next paid stage.
          </Text>
          <Text className="text-gray-800 text-sm leading-6 mb-2" style={{ fontFamily: 'Poppins_400Regular' }}>
            The homeowner does not manually mark stages complete. The GC drives execution and marks stage completion in
            the workflow.
          </Text>
        </View>

        <View style={cardShadowStyle} className="bg-white border border-gray-200 rounded-2xl p-4 mb-5">
          <SeoHeading level={2} className="text-black text-xl mb-3" style={{ fontFamily: 'Poppins_700Bold' }}>
            Trust points
          </SeoHeading>
          {projectMonitoringDemoData.trustPoints.map((point) => (
            <Text
              key={point}
              className="text-gray-700 text-sm leading-6 mb-1"
              style={{ fontFamily: 'Poppins_400Regular' }}
            >
              • {point}
            </Text>
          ))}
        </View>

        <View className="bg-black rounded-3xl p-5 mb-3">
          <SeoHeading level={2} className="text-white text-xl mb-2" style={{ fontFamily: 'Poppins_700Bold' }}>
            Ready to build from abroad with more clarity?
          </SeoHeading>
          <Text className="text-white/85 text-sm leading-6 mb-4" style={{ fontFamily: 'Poppins_400Regular' }}>
            Use BuildMyHouse to follow progress confidently while the GC executes work and payment flow stays tied to
            homeowner satisfaction.
          </Text>
          <View className="flex-col md:flex-row gap-3">
            <TouchableOpacity
              onPress={() => {
                trackWebEvent('demo_project_monitoring_cta_bottom_start', {
                  cta_href: '/location?mode=explore',
                });
                router.push('/location?mode=explore' as any);
              }}
              className="bg-white rounded-full py-3.5 px-5"
            >
              <Text className="text-black text-center text-base" style={{ fontFamily: 'Poppins_700Bold' }}>
                Start a Tracked Project
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => {
                trackWebEvent('demo_project_monitoring_cta_bottom_learn', {
                  cta_href: '/diaspora/build-in-nigeria-from-abroad',
                });
                router.push('/diaspora/build-in-nigeria-from-abroad' as any);
              }}
              className="border border-white/35 rounded-full py-3.5 px-5"
            >
              <Text className="text-white text-center text-base" style={{ fontFamily: 'Poppins_600SemiBold' }}>
                Learn How Building From Abroad Works
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => router.push('/demo/project-monitoring' as any)}
              className="border border-white/35 rounded-full py-3.5 px-5"
            >
              <View className="flex-row items-center justify-center">
                <CreditCard size={16} color="#ffffff" />
                <Text className="text-white text-center text-base ml-2" style={{ fontFamily: 'Poppins_600SemiBold' }}>
                  Open full demo
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
