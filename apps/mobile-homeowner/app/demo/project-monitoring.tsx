import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, ShieldCheck } from 'lucide-react-native';
import { SeoHeading } from '@/components/seo/SeoHeading';
import { trackWebEvent } from '@/lib/analytics';
import { projectMonitoringDemoData } from '@/lib/demo-project-monitoring';
import { useWebSeo } from '@/lib/seo';
import { buildSeoJsonLd } from '@/lib/seo-schema';
import { cardShadowStyle } from '@/lib/card-styles';

export default function ProjectMonitoringDemoPage() {
  const router = useRouter();
  const activeStage = projectMonitoringDemoData.stages.find((stage) => !stage.locked) ?? projectMonitoringDemoData.stages[0];
  const formatCurrency = (amount: number) => `NGN ${amount.toLocaleString('en-NG')}`;

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
            className="text-[10px] md:text-xs uppercase tracking-wide text-blue-700 mb-1"
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
            This demo shows how BuildMyHouse remote project monitoring can work for diaspora homeowners:
            GC-led execution, homeowner visibility, and satisfaction-based payment progression.
          </Text>
          <View className="flex-row items-start bg-blue-50 border border-blue-200 rounded-2xl p-3 mb-4">
            <ShieldCheck size={18} color="#1d4ed8" style={{ marginTop: 1, marginRight: 8 }} />
            <Text className="text-xs text-blue-900 flex-1 leading-5" style={{ fontFamily: 'Poppins_500Medium' }}>
              This is a demo experience with sample data, built for public preview.
            </Text>
          </View>

          <View className="flex-col md:flex-row gap-3 mb-2">
            <TouchableOpacity
              onPress={() => {
                trackWebEvent('demo_project_monitoring_cta_top_start', {
                  cta_href: '/projects/new',
                });
                router.push('/projects/new' as any);
              }}
              className="bg-blue-600 rounded-full py-3.5 px-5"
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

        <View style={cardShadowStyle} className="bg-white border border-gray-200 rounded-2xl p-4 mb-4">
          <SeoHeading level={2} className="text-black text-xl mb-2" style={{ fontFamily: 'Poppins_700Bold' }}>
            Project overview
          </SeoHeading>
          <Text className="text-gray-900 text-base mb-1" style={{ fontFamily: 'Poppins_600SemiBold' }}>
            {projectMonitoringDemoData.project.name}
          </Text>
          <Text className="text-gray-600 text-sm leading-6 mb-1" style={{ fontFamily: 'Poppins_400Regular' }}>
            {projectMonitoringDemoData.project.location}
          </Text>
          <Text className="text-gray-700 text-sm" style={{ fontFamily: 'Poppins_500Medium' }}>
            Progress: {projectMonitoringDemoData.project.progressLabel}
          </Text>
        </View>

        <View style={cardShadowStyle} className="bg-white border border-gray-200 rounded-2xl p-4 mb-4">
          <SeoHeading level={2} className="text-black text-xl mb-3" style={{ fontFamily: 'Poppins_700Bold' }}>
            Build timeline
          </SeoHeading>
          {projectMonitoringDemoData.stages.map((stage) => (
            <View key={stage.id} className="border-b border-gray-100 py-2.5 last:border-b-0">
              <Text className="text-black text-sm mb-1" style={{ fontFamily: 'Poppins_600SemiBold' }}>
                {stage.order}. {stage.name}
              </Text>
              <Text className="text-gray-600 text-xs mb-0.5" style={{ fontFamily: 'Poppins_400Regular' }}>
                Duration: {stage.duration}
              </Text>
              <Text className="text-gray-600 text-xs mb-0.5" style={{ fontFamily: 'Poppins_400Regular' }}>
                Budget: {formatCurrency(stage.budget)}
              </Text>
              <Text
                className={`text-xs ${stage.locked ? 'text-gray-500' : 'text-emerald-700'}`}
                style={{ fontFamily: 'Poppins_500Medium' }}
              >
                {stage.locked ? 'Locked until previous stage workflow completes' : 'Active stage'}
              </Text>
            </View>
          ))}
        </View>

        <View style={cardShadowStyle} className="bg-white border border-gray-200 rounded-2xl p-4 mb-4">
          <SeoHeading level={2} className="text-black text-xl mb-3" style={{ fontFamily: 'Poppins_700Bold' }}>
            Active stage details
          </SeoHeading>
          <Text className="text-black text-sm mb-1" style={{ fontFamily: 'Poppins_600SemiBold' }}>
            {activeStage.name}
          </Text>
          <Text className="text-gray-700 text-sm leading-6 mb-1" style={{ fontFamily: 'Poppins_400Regular' }}>
            GC drives execution and marks stage completion.
          </Text>
          <Text className="text-gray-700 text-sm leading-6 mb-1" style={{ fontFamily: 'Poppins_400Regular' }}>
            Homeowner watches progress, receives notifications, and confirms satisfaction before payment flow continues.
          </Text>
          <Text className="text-gray-700 text-sm leading-6" style={{ fontFamily: 'Poppins_400Regular' }}>
            {activeStage.completionRule}
          </Text>
        </View>

        <View style={cardShadowStyle} className="bg-white border border-gray-200 rounded-2xl p-4 mb-4">
          <SeoHeading level={2} className="text-black text-xl mb-3" style={{ fontFamily: 'Poppins_700Bold' }}>
            Stage materials/items
          </SeoHeading>
          {(activeStage.materials ?? []).map((material) => (
            <View key={`${material.name}-${material.supplier}`} className="bg-gray-50 rounded-xl p-3 mb-2 last:mb-0">
              <Text className="text-black text-sm" style={{ fontFamily: 'Poppins_600SemiBold' }}>
                {material.name} ({material.quantity})
              </Text>
              <Text className="text-gray-600 text-xs" style={{ fontFamily: 'Poppins_400Regular' }}>
                Supplier: {material.supplier}
              </Text>
              <Text className="text-gray-600 text-xs" style={{ fontFamily: 'Poppins_400Regular' }}>
                Brand: {material.brand}
              </Text>
              <Text className="text-gray-700 text-xs" style={{ fontFamily: 'Poppins_500Medium' }}>
                Cost: {formatCurrency(material.price)}
              </Text>
            </View>
          ))}
        </View>

        <View style={cardShadowStyle} className="bg-white border border-gray-200 rounded-2xl p-4 mb-4">
          <SeoHeading level={2} className="text-black text-xl mb-3" style={{ fontFamily: 'Poppins_700Bold' }}>
            Chat preview
          </SeoHeading>
          {(activeStage.chat ?? []).map((item, index) => (
            <View key={`${item.sender}-${index}`} className="border-b border-gray-100 py-2 last:border-b-0">
              <Text className="text-xs text-gray-500 mb-0.5" style={{ fontFamily: 'Poppins_500Medium' }}>
                {item.sender === 'gc' ? 'GC' : 'Homeowner'} • {item.date}
              </Text>
              <Text className="text-sm text-gray-700 leading-6" style={{ fontFamily: 'Poppins_400Regular' }}>
                {item.message}
              </Text>
            </View>
          ))}
        </View>

        <View style={cardShadowStyle} className="bg-blue-50 border border-blue-200 rounded-2xl p-4 mb-4">
          <SeoHeading level={2} className="text-black text-xl mb-3" style={{ fontFamily: 'Poppins_700Bold' }}>
            Payment and workflow explanation
          </SeoHeading>
          <Text className="text-blue-900 text-sm leading-6 mb-2" style={{ fontFamily: 'Poppins_400Regular' }}>
            Payment progression is controlled through homeowner satisfaction confirmation before the GC continues into the next paid stage.
          </Text>
          <Text className="text-blue-900 text-sm leading-6 mb-2" style={{ fontFamily: 'Poppins_400Regular' }}>
            The homeowner does not manually mark stages complete. The GC drives execution and marks stage completion in the workflow.
          </Text>
          <Text className="text-blue-900 text-sm leading-6 mb-2" style={{ fontFamily: 'Poppins_400Regular' }}>
            Current payment status: {activeStage.paymentStatus?.replace(/_/g, ' ') ?? 'N/A'}
          </Text>
          {(activeStage.notifications ?? []).map((notice) => (
            <Text key={notice} className="text-blue-900 text-sm leading-6" style={{ fontFamily: 'Poppins_500Medium' }}>
              • {notice}
            </Text>
          ))}
        </View>

        <View style={cardShadowStyle} className="bg-white border border-gray-200 rounded-2xl p-4 mb-5">
          <SeoHeading level={2} className="text-black text-xl mb-3" style={{ fontFamily: 'Poppins_700Bold' }}>
            Trust points
          </SeoHeading>
          {projectMonitoringDemoData.trustPoints.map((point) => (
            <Text key={point} className="text-gray-700 text-sm leading-6 mb-1" style={{ fontFamily: 'Poppins_400Regular' }}>
              • {point}
            </Text>
          ))}
        </View>

        <View className="bg-black rounded-3xl p-5 mb-3">
          <SeoHeading level={2} className="text-white text-xl mb-2" style={{ fontFamily: 'Poppins_700Bold' }}>
            Ready to build from abroad with more clarity?
          </SeoHeading>
          <Text className="text-white/85 text-sm leading-6 mb-4" style={{ fontFamily: 'Poppins_400Regular' }}>
            Use BuildMyHouse to follow progress confidently while the GC executes work and payment flow stays tied to homeowner satisfaction.
          </Text>
          <View className="flex-col md:flex-row gap-3">
            <TouchableOpacity
              onPress={() => {
                trackWebEvent('demo_project_monitoring_cta_bottom_start', {
                  cta_href: '/projects/new',
                });
                router.push('/projects/new' as any);
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
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

