import { useCallback, useMemo, useState } from 'react';
import {
  Alert,
  Image,
  Modal,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  AlertTriangle,
  ArrowLeft,
  Bath,
  Bed,
  Calendar,
  Check,
  CheckCircle,
  ChevronRight,
  Clock,
  CreditCard,
  Download,
  FileText,
  HardHat,
  Home,
  Image as ImageIcon,
  Lock,
  MapPin,
  Maximize,
  MessageCircle,
  Package,
  Paperclip,
  Phone,
  Send,
  ShieldCheck,
  Users,
  Video,
} from 'lucide-react-native';
import { SeoHeading } from '@/components/seo/SeoHeading';
import { trackWebEvent } from '@/lib/analytics';
import {
  type DemoStage,
  getDemoCurrentStageForDashboard,
  getDemoStageById,
  projectMonitoringDemoData,
} from '@/lib/demo-project-monitoring';
import { useWebSeo } from '@/lib/seo';
import { buildSeoJsonLd } from '@/lib/seo-schema';
import { cardShadowStyle } from '@/lib/card-styles';

type DemoRoute =
  | { name: 'home' }
  | { name: 'dashboard' }
  | { name: 'timeline' }
  | { name: 'stage'; stageId: string }
  | { name: 'chat' };

type StageTab = 'materials' | 'team' | 'files';

const DEMO_DEVICE_INNER_HEIGHT = 720;
const DEMO_NOTCH_HEIGHT = 22;
const DEMO_HORIZONTAL_PAD = 16;

const completedStagesCount = projectMonitoringDemoData.stages.filter((s) => s.uiStatus === 'completed').length;

function getTimelineSpineIcon(status: DemoStage['uiStatus']) {
  switch (status) {
    case 'completed':
      return <CheckCircle size={24} color="#000000" strokeWidth={2} fill="#000000" />;
    case 'in_progress':
      return <Clock size={24} color="#000000" strokeWidth={2} />;
    default:
      return <Lock size={24} color="#D4D4D4" strokeWidth={2} />;
  }
}

function getTimelineBadge(status: DemoStage['uiStatus']) {
  switch (status) {
    case 'completed':
      return (
        <View className="bg-black rounded-full px-3 py-1">
          <Text className="text-white text-xs" style={{ fontFamily: 'Poppins_500Medium' }}>
            Complete
          </Text>
        </View>
      );
    case 'in_progress':
      return (
        <View className="bg-gray-100 rounded-full px-3 py-1 border border-black">
          <Text className="text-black text-xs" style={{ fontFamily: 'Poppins_500Medium' }}>
            In Progress
          </Text>
        </View>
      );
    default:
      return (
        <View className="bg-gray-100 rounded-full px-3 py-1">
          <Text className="text-gray-400 text-xs" style={{ fontFamily: 'Poppins_500Medium' }}>
            Not Started
          </Text>
        </View>
      );
  }
}

function getDashboardStageCardStyle(status: DemoStage['uiStatus']) {
  switch (status) {
    case 'completed':
      return 'bg-green-100 border-green-300';
    case 'in_progress':
      return 'bg-blue-100 border-blue-300';
    default:
      return 'bg-gray-100 border-gray-300';
  }
}

function getDashboardStageIcon(status: DemoStage['uiStatus']) {
  switch (status) {
    case 'completed':
      return <CheckCircle size={20} color="#10b981" strokeWidth={2} />;
    case 'in_progress':
      return <Clock size={20} color="#3b82f6" strokeWidth={2} />;
    default:
      return <Lock size={20} color="#9ca3af" strokeWidth={2} />;
  }
}

function DemoNavRow(props: {
  showAlert?: boolean;
  onBack: () => void;
  onHome: () => void;
  onAlert?: () => void;
}) {
  return (
    <View className="flex-row items-center justify-between mb-3">
      <View className="flex-row items-center">
        <TouchableOpacity
          onPress={props.onBack}
          className="w-10 h-10 bg-gray-100 rounded-full items-center justify-center mr-3"
        >
          <ArrowLeft size={22} color="#000000" strokeWidth={2} />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={props.onHome}
          className="w-10 h-10 bg-black rounded-full items-center justify-center"
        >
          <Home size={20} color="#FFFFFF" strokeWidth={2} />
        </TouchableOpacity>
      </View>
      {props.showAlert ? (
        <TouchableOpacity
          onPress={props.onAlert}
          className="w-9 h-9 rounded-full border border-red-200 bg-red-50 items-center justify-center"
        >
          <AlertTriangle size={16} color="#DC2626" strokeWidth={2.2} />
        </TouchableOpacity>
      ) : (
        <View className="w-9 h-9" />
      )}
    </View>
  );
}

function FileRowIcon(fileType: 'image' | 'video' | 'pdf') {
  if (fileType === 'video') {
    return <Video size={20} color="#FFFFFF" strokeWidth={2} />;
  }
  if (fileType === 'image') {
    return <ImageIcon size={20} color="#FFFFFF" strokeWidth={2} />;
  }
  return <FileText size={20} color="#FFFFFF" strokeWidth={2} />;
}

export default function ProjectMonitoringDemoPage() {
  const router = useRouter();
  const [route, setRoute] = useState<DemoRoute>({ name: 'home' });
  const [stageTab, setStageTab] = useState<StageTab>('materials');
  const [disputeOpen, setDisputeOpen] = useState(false);
  const [disputeSelected, setDisputeSelected] = useState<string[]>([]);

  const goHome = useCallback(() => {
    setRoute({ name: 'home' });
    setDisputeOpen(false);
    setDisputeSelected([]);
  }, []);

  const openStage = useCallback((stageId: string) => {
    setStageTab('materials');
    setRoute({ name: 'stage', stageId });
  }, []);

  const dashboardStage = useMemo(() => getDemoCurrentStageForDashboard(), []);
  const activeStageForRoute = route.name === 'stage' ? getDemoStageById(route.stageId) : undefined;

  const toggleDispute = (id: string) => {
    setDisputeSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

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

  const renderFloatingChat = () => (
    <TouchableOpacity
      onPress={() => setRoute({ name: 'chat' })}
      className="absolute right-3 bg-black rounded-full p-4 shadow-lg"
      style={{ bottom: route.name === 'stage' ? 112 : 16 }}
      accessibilityLabel="Open chat (demo)"
    >
      <MessageCircle size={26} color="#FFFFFF" strokeWidth={2} />
    </TouchableOpacity>
  );

  const renderHome = () => {
    const p = projectMonitoringDemoData.project;
    return (
      <View style={{ flex: 1, minHeight: 0 }}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            paddingHorizontal: DEMO_HORIZONTAL_PAD,
            paddingTop: 12,
            paddingBottom: 24,
          }}
        >
          <Text
            className="text-3xl text-black mb-4"
            style={{ fontFamily: 'Poppins_800ExtraBold' }}
          >
            Your Projects
          </Text>
          <TouchableOpacity
            activeOpacity={0.92}
            onPress={() => setRoute({ name: 'dashboard' })}
            style={cardShadowStyle}
            className="bg-gray-50 rounded-3xl mb-2 border border-gray-200 overflow-hidden"
          >
            <Image source={{ uri: p.coverImageUrl }} className="w-full h-36" resizeMode="cover" />
            <View className="p-5">
              <View className="flex-row justify-between items-start mb-3">
                <View className="flex-1 min-w-0">
                  <View className="flex-row items-center mb-1 min-w-0">
                    <Text
                      className="text-xl text-black flex-shrink"
                      style={{ fontFamily: 'Poppins_700Bold' }}
                      numberOfLines={1}
                    >
                      {p.name}
                    </Text>
                    <View className="ml-2 rounded-full px-2 py-1 flex-shrink-0 bg-blue-100">
                      <Text
                        className="text-xs text-blue-700"
                        style={{ fontFamily: 'Poppins_600SemiBold' }}
                      >
                        Active
                      </Text>
                    </View>
                  </View>
                  <View className="flex-row items-center">
                    <MapPin size={14} color="#737373" strokeWidth={2} />
                    <Text
                      className="text-gray-500 ml-1 text-sm flex-1"
                      style={{ fontFamily: 'Poppins_400Regular' }}
                      numberOfLines={2}
                    >
                      {p.address}
                    </Text>
                  </View>
                </View>
                <ChevronRight size={24} color="#000000" strokeWidth={2} />
              </View>
              <View className="mb-3">
                <View className="flex-row justify-between mb-2">
                  <Text className="text-black text-sm" style={{ fontFamily: 'Poppins_600SemiBold' }}>
                    {p.listProgressStageLabel}
                  </Text>
                  <Text className="text-black" style={{ fontFamily: 'JetBrainsMono_500Medium' }}>
                    {p.progressPercent}%
                  </Text>
                </View>
                <View className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <View
                    className="h-full bg-black rounded-full"
                    style={{ width: `${p.progressPercent}%` }}
                  />
                </View>
              </View>
              <View className="flex-row justify-between pt-3 border-t border-gray-200">
                <View>
                  <Text
                    className="text-gray-500 text-xs mb-1"
                    style={{ fontFamily: 'Poppins_400Regular' }}
                  >
                    Budget
                  </Text>
                  <Text className="text-black" style={{ fontFamily: 'JetBrainsMono_500Medium' }}>
                    ₦{p.totalBudget.toLocaleString()}
                  </Text>
                </View>
                <View>
                  <Text
                    className="text-gray-500 text-xs mb-1"
                    style={{ fontFamily: 'Poppins_400Regular' }}
                  >
                    Spent
                  </Text>
                  <Text className="text-black" style={{ fontFamily: 'JetBrainsMono_500Medium' }}>
                    ₦{p.spent.toLocaleString()}
                  </Text>
                </View>
              </View>
            </View>
          </TouchableOpacity>
          <Text className="text-xs text-gray-500 mt-2 text-center" style={{ fontFamily: 'Poppins_400Regular' }}>
            Demo only — tap the project to explore the in-app layout.
          </Text>
        </ScrollView>
      </View>
    );
  };

  const renderDashboard = () => {
    const p = projectMonitoringDemoData.project;
    const stages = projectMonitoringDemoData.stages;
    const progress = p.progressPercent;
    const remaining = p.totalBudget - p.spent;
    const spentRatio = p.totalBudget > 0 ? Math.min((p.spent / p.totalBudget) * 100, 100) : 0;

    return (
      <View style={{ flex: 1, minHeight: 0 }}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            paddingHorizontal: DEMO_HORIZONTAL_PAD,
            paddingBottom: 88,
          }}
        >
          <DemoNavRow
            onBack={goHome}
            onHome={goHome}
          />
          <Text className="text-3xl text-black mb-1" style={{ fontFamily: 'Poppins_800ExtraBold' }}>
            {p.name}
          </Text>
          <View className="flex-row items-start mb-4">
            <MapPin size={14} color="#737373" strokeWidth={2} style={{ marginTop: 3 }} />
            <Text className="text-sm text-gray-500 ml-1 flex-1" style={{ fontFamily: 'Poppins_400Regular' }}>
              {p.address}
            </Text>
          </View>

          <View className="bg-black rounded-3xl p-5 mb-5">
            <View className="flex-row justify-between items-start mb-4">
              <View className="flex-1 pr-2">
                <Text className="text-sm text-white/50 mb-1" style={{ fontFamily: 'Poppins_400Regular' }}>
                  Current Stage
                </Text>
                <Text className="text-2xl text-white mb-2" style={{ fontFamily: 'Poppins_700Bold' }}>
                  {dashboardStage.name}
                </Text>
                <View className="bg-white/20 rounded-full px-3 py-1 self-start mt-1">
                  <Text className="text-white text-xs" style={{ fontFamily: 'Poppins_500Medium' }}>
                    In Progress
                  </Text>
                </View>
              </View>
              <View className="items-center">
                <View className="w-24 h-24 rounded-full border-8 border-white/20 items-center justify-center">
                  <Text className="text-2xl text-white" style={{ fontFamily: 'JetBrainsMono_500Medium' }}>
                    {progress}%
                  </Text>
                </View>
              </View>
            </View>
            <View className="bg-white/10 rounded-2xl p-4 mb-4">
              <View className="flex-row items-center mb-2">
                <HardHat size={18} color="#FFFFFF" strokeWidth={2} />
                <Text className="text-white/80 text-sm ml-2" style={{ fontFamily: 'Poppins_400Regular' }}>
                  General Contractor
                </Text>
              </View>
              <Text className="text-white text-base" style={{ fontFamily: 'Poppins_600SemiBold' }}>
                {p.gcName}
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => setRoute({ name: 'timeline' })}
              className="rounded-full py-4 px-6 flex-row items-center justify-center bg-white"
            >
              <Text className="text-black text-base mr-2" style={{ fontFamily: 'Poppins_700Bold' }}>
                View Full Timeline
              </Text>
              <ChevronRight size={20} color="#000000" strokeWidth={2} />
            </TouchableOpacity>
          </View>

          <View style={cardShadowStyle} className="bg-gray-50 rounded-2xl p-5 mb-5 border border-gray-200">
            <View className="flex-row items-center mb-4">
              <HardHat size={24} color="#000000" strokeWidth={2} />
              <Text className="text-xl text-black ml-2" style={{ fontFamily: 'Poppins_700Bold' }}>
                Project Summary
              </Text>
            </View>
            <View className="flex-row flex-wrap mb-4">
              <View className="bg-white rounded-full px-4 py-2 mr-2 mb-2 flex-row items-center border border-gray-200">
                <Bed size={16} color="#000000" strokeWidth={2} />
                <Text className="text-black ml-2 text-sm" style={{ fontFamily: 'Poppins_500Medium' }}>
                  {p.aiAnalysis.bedrooms} Bed
                </Text>
              </View>
              <View className="bg-white rounded-full px-4 py-2 mr-2 mb-2 flex-row items-center border border-gray-200">
                <Bath size={16} color="#000000" strokeWidth={2} />
                <Text className="text-black ml-2 text-sm" style={{ fontFamily: 'Poppins_500Medium' }}>
                  {p.aiAnalysis.bathrooms} Bath
                </Text>
              </View>
              <View className="bg-white rounded-full px-4 py-2 mr-2 mb-2 flex-row items-center border border-gray-200">
                <Maximize size={16} color="#000000" strokeWidth={2} />
                <Text className="text-black ml-2 text-sm" style={{ fontFamily: 'Poppins_500Medium' }}>
                  {p.aiAnalysis.squareFootage} sqft
                </Text>
              </View>
            </View>
            <View className="bg-black rounded-2xl p-4">
              <Text className="text-white text-sm mb-2" style={{ fontFamily: 'Poppins_600SemiBold' }}>
                GC Project Summary
              </Text>
              <Text className="text-gray-200 text-sm leading-6" style={{ fontFamily: 'Poppins_400Regular' }}>
                {p.aiAnalysis.summary}
              </Text>
            </View>
          </View>

          <View style={cardShadowStyle} className="bg-gray-50 rounded-2xl p-5 mb-5 border border-gray-200">
            <View className="flex-row items-center mb-4">
              <Text className="text-black text-2xl" style={{ fontFamily: 'Poppins_700Bold' }}>
                ₦
              </Text>
              <Text className="text-xl text-black ml-2" style={{ fontFamily: 'Poppins_700Bold' }}>
                Financial Summary
              </Text>
            </View>
            <View className="flex-row justify-between mb-3">
              <Text className="text-gray-500" style={{ fontFamily: 'Poppins_400Regular' }}>
                Total Budget
              </Text>
              <Text className="text-black" style={{ fontFamily: 'JetBrainsMono_500Medium' }}>
                ₦{p.totalBudget.toLocaleString()}
              </Text>
            </View>
            <View className="flex-row justify-between mb-3">
              <Text className="text-gray-500" style={{ fontFamily: 'Poppins_400Regular' }}>
                Spent
              </Text>
              <Text className="text-black" style={{ fontFamily: 'JetBrainsMono_500Medium' }}>
                ₦{p.spent.toLocaleString()}
              </Text>
            </View>
            <View className="flex-row justify-between mb-3">
              <Text className="text-gray-500" style={{ fontFamily: 'Poppins_400Regular' }}>
                Remaining
              </Text>
              <Text className="text-black" style={{ fontFamily: 'JetBrainsMono_500Medium' }}>
                ₦{remaining.toLocaleString()}
              </Text>
            </View>
            <View className="mt-2 h-3 bg-gray-200 rounded-full overflow-hidden">
              <View className="h-full bg-black rounded-full" style={{ width: `${spentRatio}%` }} />
            </View>
          </View>

          <View className="mb-4">
            <View className="flex-row items-center justify-between mb-3">
              <View className="flex-row items-center">
                <Calendar size={24} color="#000000" strokeWidth={2} />
                <Text className="text-xl text-black ml-2" style={{ fontFamily: 'Poppins_700Bold' }}>
                  Progress Timeline
                </Text>
              </View>
              <Text className="text-gray-500 text-sm" style={{ fontFamily: 'Poppins_400Regular' }}>
                {completedStagesCount}/{stages.length} Complete
              </Text>
            </View>
            {stages.map((stage, index) => (
              <TouchableOpacity
                key={stage.id}
                activeOpacity={stage.uiStatus === 'not_started' ? 1 : 0.88}
                onPress={() => {
                  if (stage.uiStatus === 'completed' || stage.uiStatus === 'in_progress') {
                    openStage(stage.id);
                  }
                }}
                className={`${getDashboardStageCardStyle(stage.uiStatus)} rounded-2xl p-4 mb-3 border`}
              >
                <View className="flex-row items-start justify-between">
                  <View className="flex-1 mr-3">
                    <View className="flex-row items-center mb-2">
                      {getDashboardStageIcon(stage.uiStatus)}
                      <Text
                        className="text-black text-base ml-2"
                        style={{ fontFamily: 'Poppins_600SemiBold' }}
                      >
                        {index + 1}. {stage.name}
                      </Text>
                    </View>
                    <View className="flex-row items-center mt-2">
                      <View className="flex-row items-center mr-4">
                        <Clock size={14} color="#6b7280" strokeWidth={2} />
                        <Text
                          className="text-gray-600 text-xs ml-1"
                          style={{ fontFamily: 'Poppins_400Regular' }}
                        >
                          {stage.estimatedDuration}
                        </Text>
                      </View>
                      <Text className="text-black text-sm" style={{ fontFamily: 'JetBrainsMono_500Medium' }}>
                        ₦{stage.estimatedCost.toLocaleString()}
                      </Text>
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>

          <View style={cardShadowStyle} className="bg-gray-50 rounded-2xl p-5 mb-2 border border-gray-200">
            <View className="flex-row items-center mb-3">
              <Calendar size={24} color="#000000" strokeWidth={2} />
              <Text className="text-xl text-black ml-2" style={{ fontFamily: 'Poppins_700Bold' }}>
                Timeline
              </Text>
            </View>
            <Text className="text-gray-500 text-sm mb-1" style={{ fontFamily: 'Poppins_400Regular' }}>
              Start Date
            </Text>
            <Text className="text-black" style={{ fontFamily: 'Poppins_500Medium' }}>
              {p.startDateLabel}
            </Text>
          </View>
        </ScrollView>
        {renderFloatingChat()}
      </View>
    );
  };

  const renderBuildTimeline = () => (
    <View style={{ flex: 1, minHeight: 0 }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: DEMO_HORIZONTAL_PAD,
          paddingBottom: 88,
        }}
      >
        <DemoNavRow
          onBack={() => setRoute({ name: 'dashboard' })}
          onHome={goHome}
        />
        <Text className="text-3xl text-black mb-1" style={{ fontFamily: 'Poppins_800ExtraBold' }}>
          Build Timeline
        </Text>
        <Text className="text-sm text-gray-500 mb-5" style={{ fontFamily: 'Poppins_400Regular' }}>
          Track your construction progress
        </Text>
        {projectMonitoringDemoData.stages.map((stage, index) => {
          const clickable = stage.uiStatus === 'completed' || stage.uiStatus === 'in_progress';
          return (
            <View key={stage.id} className="flex-row mb-5">
              <View className="items-center mr-3">
                {getTimelineSpineIcon(stage.uiStatus)}
                {index < projectMonitoringDemoData.stages.length - 1 ? (
                  <View
                    className={`w-0.5 flex-1 mt-2 ${stage.uiStatus === 'completed' ? 'bg-black' : 'bg-gray-200'}`}
                    style={{ minHeight: 40 }}
                  />
                ) : null}
              </View>
              <TouchableOpacity
                onPress={() => clickable && openStage(stage.id)}
                disabled={!clickable}
                className={`flex-1 rounded-2xl p-4 border ${
                  clickable ? 'bg-white border-gray-200' : 'bg-gray-50 border-gray-100'
                }`}
                style={{ opacity: clickable ? 1 : 0.6 }}
              >
                <View className="flex-row justify-between items-start mb-2">
                  <Text
                    className={`text-lg flex-1 pr-2 ${clickable ? 'text-black' : 'text-gray-400'}`}
                    style={{ fontFamily: 'Poppins_700Bold' }}
                  >
                    {stage.name}
                  </Text>
                  {getTimelineBadge(stage.uiStatus)}
                </View>
                <View className="flex-row items-center">
                  <Clock size={16} color={clickable ? '#737373' : '#D4D4D4'} strokeWidth={2} />
                  <Text
                    className={`text-sm ml-2 ${clickable ? 'text-gray-500' : 'text-gray-300'}`}
                    style={{ fontFamily: 'Poppins_400Regular' }}
                  >
                    {stage.estimatedDuration}
                  </Text>
                  {!clickable ? (
                    <View className="flex-row items-center ml-auto">
                      <Lock size={14} color="#D4D4D4" strokeWidth={2} />
                      <Text
                        className="text-gray-300 text-xs ml-1"
                        style={{ fontFamily: 'Poppins_400Regular' }}
                      >
                        Locked
                      </Text>
                    </View>
                  ) : null}
                </View>
              </TouchableOpacity>
            </View>
          );
        })}
      </ScrollView>
      {renderFloatingChat()}
    </View>
  );

  const renderStage = () => {
    const stage = activeStageForRoute;
    if (!stage) {
      return (
        <View className="flex-1 items-center justify-center px-6">
          <Text className="text-gray-600" style={{ fontFamily: 'Poppins_400Regular' }}>
            Stage not found (demo)
          </Text>
        </View>
      );
    }
    const isComplete = stage.uiStatus === 'completed';
    const isInProgress = stage.uiStatus === 'in_progress';

    return (
      <View style={{ flex: 1, minHeight: 0 }}>
        <View style={{ paddingHorizontal: DEMO_HORIZONTAL_PAD, paddingTop: 8 }}>
          <DemoNavRow
            showAlert={isComplete}
            onBack={() => setRoute({ name: 'timeline' })}
            onHome={goHome}
            onAlert={() => {
              setDisputeSelected([]);
              setDisputeOpen(true);
            }}
          />
          <Text className="text-3xl text-black mb-2" style={{ fontFamily: 'Poppins_800ExtraBold' }}>
            {stage.shortTitle}
          </Text>
          <View
            className={`rounded-full px-3 py-1 self-start mb-2 ${
              isComplete ? 'bg-black' : isInProgress ? 'bg-green-100 border border-green-600' : 'bg-gray-100 border border-black'
            }`}
          >
            <Text
              className={`text-xs ${isComplete ? 'text-white' : isInProgress ? 'text-green-700' : 'text-black'}`}
              style={{ fontFamily: 'Poppins_500Medium' }}
            >
              {isComplete ? 'Complete' : isInProgress ? 'Work in Progress' : 'Pending'}
            </Text>
          </View>
        </View>

        <View className="flex-row px-4 mb-2" style={{ paddingHorizontal: DEMO_HORIZONTAL_PAD }}>
          {(['materials', 'team', 'files'] as const).map((tab) => (
            <TouchableOpacity
              key={tab}
              onPress={() => setStageTab(tab)}
              className={`flex-1 py-3 border-b-2 ${stageTab === tab ? 'border-black' : 'border-gray-200'}`}
            >
              <View className="flex-row items-center justify-center">
                {tab === 'materials' ? (
                  <Package size={18} color={stageTab === tab ? '#000000' : '#A3A3A3'} strokeWidth={2} />
                ) : tab === 'team' ? (
                  <Users size={18} color={stageTab === tab ? '#000000' : '#A3A3A3'} strokeWidth={2} />
                ) : (
                  <FileText size={18} color={stageTab === tab ? '#000000' : '#A3A3A3'} strokeWidth={2} />
                )}
                <Text
                  className={`ml-2 capitalize ${stageTab === tab ? 'text-black' : 'text-gray-400'}`}
                  style={{ fontFamily: 'Poppins_500Medium' }}
                >
                  {tab}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{
            paddingHorizontal: DEMO_HORIZONTAL_PAD,
            paddingBottom: isComplete || isInProgress ? 120 : 16,
          }}
          showsVerticalScrollIndicator={false}
        >
          {stageTab === 'materials' ? (
            stage.materials.length === 0 ? (
              <View className="bg-gray-50 rounded-2xl p-6 items-center border border-gray-200">
                <Package size={48} color="#D4D4D4" strokeWidth={1.5} />
                <Text className="text-gray-400 text-lg mt-4" style={{ fontFamily: 'Poppins_600SemiBold' }}>
                  No Materials Yet
                </Text>
                <Text
                  className="text-gray-500 text-sm mt-2 text-center"
                  style={{ fontFamily: 'Poppins_400Regular' }}
                >
                  Materials will appear here once the GC adds them
                </Text>
              </View>
            ) : (
              stage.materials.map((m, i) => (
                <View
                  key={`${m.name}-${i}`}
                  className="bg-white rounded-2xl mb-3 overflow-hidden border border-gray-200 relative pb-3"
                >
                  <View className="flex-row items-center pt-3">
                    <View className="w-24 h-24 ml-3 rounded-xl overflow-hidden bg-gray-100">
                      <Image source={{ uri: m.photoUrl }} className="w-full h-full" resizeMode="cover" />
                    </View>
                    <View className="flex-1 p-3 justify-center">
                      <Text className="text-base text-black mb-1" style={{ fontFamily: 'Poppins_700Bold' }}>
                        {m.name}
                      </Text>
                      <Text className="text-gray-500 text-sm mb-1" style={{ fontFamily: 'Poppins_400Regular' }}>
                        {m.supplier} • {m.quantity} {m.unit}
                      </Text>
                      <Text className="text-gray-500 text-xs mb-1" style={{ fontFamily: 'Poppins_400Regular' }}>
                        Brand: {m.brand}
                      </Text>
                      <Text className="text-black text-sm" style={{ fontFamily: 'JetBrainsMono_500Medium' }}>
                        ₦{m.totalPrice.toLocaleString()}
                      </Text>
                    </View>
                  </View>
                  <View className="absolute bottom-3 right-3 flex-row">
                    <View className="w-8 h-8 rounded-full bg-black/80 items-center justify-center mr-2">
                      <Download size={16} color="#FFFFFF" strokeWidth={2} />
                    </View>
                    <View className="w-8 h-8 rounded-full bg-emerald-600 items-center justify-center">
                      <Phone size={16} color="#FFFFFF" strokeWidth={2} />
                    </View>
                  </View>
                </View>
              ))
            )
          ) : null}

          {stageTab === 'team' ? (
            stage.team.length === 0 ? (
              <View className="bg-gray-50 rounded-2xl p-6 items-center border border-gray-200">
                <Users size={48} color="#D4D4D4" strokeWidth={1.5} />
                <Text className="text-gray-400 text-lg mt-4" style={{ fontFamily: 'Poppins_600SemiBold' }}>
                  No Team Members Yet
                </Text>
                <Text
                  className="text-gray-500 text-sm mt-2 text-center"
                  style={{ fontFamily: 'Poppins_400Regular' }}
                >
                  Team members will appear here once the GC adds them
                </Text>
              </View>
            ) : (
              stage.team.map((member, i) => (
                <View
                  key={`${member.name}-${i}`}
                  className="bg-white rounded-2xl mb-3 overflow-hidden border border-gray-200 relative pb-3"
                >
                  <View className="flex-row p-4">
                    {member.photoUrl ? (
                      <Image
                        source={{ uri: member.photoUrl }}
                        className="w-20 h-20 rounded-2xl bg-white"
                        resizeMode="cover"
                      />
                    ) : (
                      <View className="w-20 h-20 bg-gray-100 rounded-2xl items-center justify-center">
                        <Users size={32} color="#A3A3A3" strokeWidth={2} />
                      </View>
                    )}
                    <View className="flex-1 ml-3 justify-center">
                      <Text className="text-lg text-black mb-1" style={{ fontFamily: 'Poppins_700Bold' }}>
                        {member.name}
                      </Text>
                      <Text className="text-black mb-1" style={{ fontFamily: 'Poppins_500Medium' }}>
                        {member.role}
                      </Text>
                      {member.email ? (
                        <Text className="text-gray-500 text-sm mb-1" style={{ fontFamily: 'Poppins_400Regular' }}>
                          ✉️ {member.email}
                        </Text>
                      ) : null}
                      {member.compensationLabel ? (
                        <Text className="text-gray-500 text-xs mt-1" style={{ fontFamily: 'Poppins_400Regular' }}>
                          {member.compensationLabel}
                        </Text>
                      ) : null}
                    </View>
                  </View>
                  <View className="absolute bottom-3 right-3 flex-row">
                    <View className="w-8 h-8 rounded-full bg-black/80 items-center justify-center mr-2">
                      <Download size={16} color="#FFFFFF" strokeWidth={2} />
                    </View>
                    <View className="w-8 h-8 rounded-full bg-emerald-600 items-center justify-center">
                      <Phone size={16} color="#FFFFFF" strokeWidth={2} />
                    </View>
                  </View>
                </View>
              ))
            )
          ) : null}

          {stageTab === 'files' ? (
            stage.files.length === 0 ? (
              <View className="bg-gray-50 rounded-2xl p-6 items-center border border-gray-200">
                <FileText size={48} color="#D4D4D4" strokeWidth={1.5} />
                <Text className="text-gray-400 text-lg mt-4" style={{ fontFamily: 'Poppins_600SemiBold' }}>
                  No Files Yet
                </Text>
                <Text
                  className="text-gray-500 text-sm mt-2 text-center"
                  style={{ fontFamily: 'Poppins_400Regular' }}
                >
                  Files, photos, and videos will appear here once the GC uploads them
                </Text>
              </View>
            ) : (
              stage.files.map((file) => (
                <View
                  key={file.id}
                  className="bg-gray-50 rounded-2xl p-3 mb-3 flex-row items-center border border-gray-200"
                >
                  <View className="w-12 h-12 bg-black rounded-xl items-center justify-center">
                    {FileRowIcon(file.fileType)}
                  </View>
                  <View className="flex-1 ml-3">
                    <Text
                      className="text-black text-base"
                      style={{ fontFamily: 'Poppins_500Medium' }}
                      numberOfLines={1}
                    >
                      {file.name}
                    </Text>
                    <Text className="text-gray-500 text-sm" style={{ fontFamily: 'Poppins_400Regular' }}>
                      {file.dateLabel}
                    </Text>
                  </View>
                  <View className="w-9 h-9 rounded-full bg-black items-center justify-center">
                    <Download size={16} color="#FFFFFF" strokeWidth={2} />
                  </View>
                </View>
              ))
            )
          ) : null}
        </ScrollView>

        {isComplete ? (
          <View
            className="absolute bottom-0 left-0 right-0 bg-white px-4 pt-2 pb-3 border-t border-gray-200"
            style={{ paddingHorizontal: DEMO_HORIZONTAL_PAD }}
          >
            <View className="bg-black rounded-2xl p-4">
              <View className="flex-row items-center justify-center mb-1">
                <CheckCircle size={22} color="#FFFFFF" strokeWidth={2} fill="#FFFFFF" />
                <Text className="text-white text-base ml-2" style={{ fontFamily: 'Poppins_700Bold' }}>
                  Stage Completed!
                </Text>
              </View>
              <Text
                className="text-white/70 text-center text-xs"
                style={{ fontFamily: 'Poppins_400Regular' }}
              >
                Congratulations! This stage has been successfully completed.
              </Text>
            </View>
          </View>
        ) : null}

        {isInProgress ? (
          <View
            className="absolute bottom-0 left-0 right-0 bg-white px-4 pt-2 pb-3 border-t border-gray-200"
            style={{ paddingHorizontal: DEMO_HORIZONTAL_PAD }}
          >
            <View className="bg-green-100 rounded-2xl p-3 border border-green-600">
              <View className="flex-row items-center justify-center mb-1">
                <CheckCircle size={16} color="#16A34A" strokeWidth={2} fill="#16A34A" />
                <Text className="text-green-700 text-sm ml-2" style={{ fontFamily: 'Poppins_700Bold' }}>
                  Payment Approved... Work in Progress
                </Text>
              </View>
              <Text
                className="text-green-600 text-center text-[11px]"
                style={{ fontFamily: 'Poppins_400Regular' }}
              >
                The GC is now working on this stage. It will be marked complete when finished.
              </Text>
            </View>
          </View>
        ) : null}

        {renderFloatingChat()}
      </View>
    );
  };

  const renderChat = () => {
    const p = projectMonitoringDemoData.project;
    const thread = projectMonitoringDemoData.chatThread;
    return (
      <View style={{ flex: 1, minHeight: 0 }}>
        <View
          className="border-b border-gray-200 pb-3"
          style={{ paddingHorizontal: DEMO_HORIZONTAL_PAD, paddingTop: 8 }}
        >
          <DemoNavRow
            onBack={() => setRoute({ name: 'dashboard' })}
            onHome={goHome}
          />
          <View className="flex-row items-center mt-1">
            <Image
              source={{ uri: p.gcAvatarUrl }}
              className="w-11 h-11 rounded-full bg-gray-100"
            />
            <View className="ml-3 flex-1">
              <Text className="text-base text-black" style={{ fontFamily: 'Poppins_700Bold' }}>
                {p.gcName}
              </Text>
              <View className="flex-row items-center">
                <Text className="text-gray-500 text-xs" style={{ fontFamily: 'Poppins_400Regular' }}>
                  GC • Online
                </Text>
                <View className="w-2 h-2 rounded-full bg-green-500 ml-1" />
              </View>
            </View>
          </View>
        </View>

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{
            paddingHorizontal: DEMO_HORIZONTAL_PAD,
            paddingVertical: 12,
            paddingBottom: 80,
          }}
          showsVerticalScrollIndicator={false}
        >
          <View className="items-center mb-4">
            <View className="bg-gray-100 rounded-full px-3 py-1">
              <Text className="text-gray-600 text-xs" style={{ fontFamily: 'Poppins_500Medium' }}>
                {thread.stageLabel}
              </Text>
            </View>
          </View>
          {thread.messages.map((msg) => {
            const isOwner = msg.sender === 'homeowner';
            return (
              <View key={msg.id} className={`mb-3 ${isOwner ? 'items-end' : 'items-start'}`}>
                <View
                  className={`max-w-[85%] rounded-2xl px-3 py-2 ${
                    isOwner ? 'bg-black' : 'bg-gray-100'
                  }`}
                >
                  <Text
                    className={`text-sm leading-5 ${isOwner ? 'text-white' : 'text-black'}`}
                    style={{ fontFamily: 'Poppins_400Regular' }}
                  >
                    {msg.message}
                  </Text>
                </View>
                <View className={`flex-row items-center mt-1 ${isOwner ? 'justify-end' : 'justify-start'}`}>
                  <Text className="text-[11px] text-gray-400 mr-1" style={{ fontFamily: 'Poppins_400Regular' }}>
                    {msg.dateLabel}
                  </Text>
                  {isOwner && msg.read ? (
                    <Text className="text-[11px] text-blue-500" style={{ fontFamily: 'Poppins_600SemiBold' }}>
                      ✓✓
                    </Text>
                  ) : null}
                </View>
              </View>
            );
          })}
        </ScrollView>

        <View
          className="border-t border-gray-200 bg-white px-3 py-2 flex-row items-center"
          style={{ paddingHorizontal: DEMO_HORIZONTAL_PAD }}
        >
          <TouchableOpacity className="w-9 h-9 rounded-full border border-gray-300 items-center justify-center mr-2">
            <Paperclip size={18} color="#525252" strokeWidth={2} />
          </TouchableOpacity>
          <TextInput
            editable={false}
            placeholder="Type a message..."
            placeholderTextColor="#9CA3AF"
            className="flex-1 bg-gray-100 rounded-full px-4 py-2 text-black text-sm"
            style={{ fontFamily: 'Poppins_400Regular' }}
          />
          <TouchableOpacity className="w-9 h-9 rounded-full bg-gray-400 items-center justify-center ml-2">
            <Send size={16} color="#FFFFFF" strokeWidth={2} />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderPhoneScreen = () => {
    switch (route.name) {
      case 'home':
        return renderHome();
      case 'dashboard':
        return renderDashboard();
      case 'timeline':
        return renderBuildTimeline();
      case 'stage':
        return renderStage();
      case 'chat':
        return renderChat();
      default:
        return renderHome();
    }
  };

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
              <View style={{ flex: 1, minHeight: 0 }}>{renderPhoneScreen()}</View>
            </View>
          </View>
        </View>

        <Modal visible={disputeOpen} transparent animationType="fade" onRequestClose={() => setDisputeOpen(false)}>
          <View className="flex-1 bg-black/50 justify-center items-center px-4">
            <View className="bg-white rounded-3xl p-5 w-full max-w-md max-h-[80%]">
              <Text className="text-xl text-black mb-2" style={{ fontFamily: 'Poppins_700Bold' }}>
                Report Stage Dispute
              </Text>
              <Text className="text-gray-600 text-sm mb-3" style={{ fontFamily: 'Poppins_400Regular' }}>
                Select one or more reasons for disputing this stage.
              </Text>
              <ScrollView className="max-h-64 mb-3" showsVerticalScrollIndicator={false}>
                {projectMonitoringDemoData.disputeReasons.map((reason) => {
                  const on = disputeSelected.includes(reason.id);
                  return (
                    <TouchableOpacity
                      key={reason.id}
                      onPress={() => toggleDispute(reason.id)}
                      className={`rounded-2xl border p-3 mb-2 flex-row items-start ${
                        on ? 'bg-black border-black' : 'bg-gray-50 border-gray-200'
                      }`}
                    >
                      <View
                        className={`w-5 h-5 rounded border mt-0.5 mr-3 items-center justify-center ${
                          on ? 'border-white bg-white' : 'border-gray-400 bg-white'
                        }`}
                      >
                        {on ? <Check size={13} color="#000000" strokeWidth={3} /> : null}
                      </View>
                      <Text
                        className={`flex-1 text-sm ${on ? 'text-white' : 'text-gray-800'}`}
                        style={{ fontFamily: 'Poppins_400Regular' }}
                      >
                        {reason.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
              <View className="flex-row gap-2">
                <TouchableOpacity
                  onPress={() => setDisputeOpen(false)}
                  className="flex-1 py-3 rounded-xl border border-gray-300"
                >
                  <Text className="text-center text-gray-700" style={{ fontFamily: 'Poppins_600SemiBold' }}>
                    Cancel
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => {
                    if (disputeSelected.length === 0) {
                      Alert.alert('Demo', 'Select at least one reason (demo only).');
                      return;
                    }
                    setDisputeOpen(false);
                    Alert.alert('Demo', 'Dispute submitted (demo only — no data is sent).');
                  }}
                  className="flex-1 py-3 rounded-xl bg-black"
                >
                  <Text className="text-center text-white" style={{ fontFamily: 'Poppins_600SemiBold' }}>
                    Submit Dispute
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

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
              onPress={() => {
                trackWebEvent('demo_project_monitoring_cta_bottom_open_payment', {
                  cta_action: 'open_payment_workflow',
                });
                goHome();
                setRoute({ name: 'dashboard' });
              }}
              className="border border-white/35 rounded-full py-3.5 px-5"
            >
              <View className="flex-row items-center justify-center">
                <CreditCard size={16} color="#ffffff" />
                <Text className="text-white text-center text-base ml-2" style={{ fontFamily: 'Poppins_600SemiBold' }}>
                  Open demo dashboard
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
