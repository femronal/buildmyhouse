import { useMemo, useState } from 'react';
import { Image, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, Bell, ClipboardList, CreditCard, FileText, Layers3, MessageSquare, Package, ShieldCheck, Users } from 'lucide-react-native';
import { SeoHeading } from '@/components/seo/SeoHeading';
import { trackWebEvent } from '@/lib/analytics';
import { projectMonitoringDemoData } from '@/lib/demo-project-monitoring';
import { useWebSeo } from '@/lib/seo';
import { buildSeoJsonLd } from '@/lib/seo-schema';
import { cardShadowStyle } from '@/lib/card-styles';

type DemoPanel = 'overview' | 'timeline' | 'active' | 'materials' | 'chat' | 'trust';
type CoachStep = 'timeline' | 'active' | 'confirm' | 'done';
type StageDetailsTab = 'materials' | 'team' | 'files';

export default function ProjectMonitoringDemoPage() {
  const router = useRouter();
  const [activePanel, setActivePanel] = useState<DemoPanel | null>(null);
  const [selectedStageId, setSelectedStageId] = useState(projectMonitoringDemoData.stages[0]?.id ?? '');
  const [satisfactionConfirmed, setSatisfactionConfirmed] = useState(false);
  const [coachStep, setCoachStep] = useState<CoachStep>('timeline');
  const [showCoach, setShowCoach] = useState(true);
  const [stageDetailsTab, setStageDetailsTab] = useState<StageDetailsTab>('materials');
  const [selectedFileId, setSelectedFileId] = useState<string | null>(null);
  const activeStage = useMemo(
    () => projectMonitoringDemoData.stages.find((stage) => stage.id === selectedStageId) ?? projectMonitoringDemoData.stages[0],
    [selectedStageId],
  );
  const selectedFile = (activeStage.files ?? []).find((file) => file.id === selectedFileId) ?? null;
  const formatCurrency = (amount: number) => `NGN ${amount.toLocaleString('en-NG')}`;
  const coachMessage =
    coachStep === 'timeline'
      ? 'Step 1: Tap Timeline to explore project stages.'
      : coachStep === 'active'
        ? 'Step 2: Tap Active Stage to simulate homeowner review.'
        : coachStep === 'confirm'
          ? 'Step 3: Use Confirm Satisfaction to unlock next stage payment flow.'
          : 'Nice. You have completed the guided demo path.';
  const coachTargetPanel: DemoPanel | null =
    coachStep === 'timeline' ? 'timeline' : coachStep === 'active' ? 'active' : null;

  const handlePanelOpen = (panel: DemoPanel) => {
    setActivePanel(panel);
    if (!showCoach) return;
    if (coachStep === 'timeline' && panel === 'timeline') {
      setCoachStep('active');
    } else if (coachStep === 'active' && panel === 'active') {
      setCoachStep('confirm');
    }
  };

  const handleSatisfactionToggle = () => {
    setSatisfactionConfirmed((prev) => {
      const next = !prev;
      if (next && showCoach && coachStep === 'confirm') {
        setCoachStep('done');
      }
      return next;
    });
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

        <View className="items-center mb-5">
          <View style={cardShadowStyle} className="w-full max-w-[390px] bg-black rounded-[30px] p-2.5">
            <View className="bg-[#f7f8fb] rounded-[24px] overflow-hidden min-h-[620px]">
              <View className="pt-2 pb-1 items-center">
                <View className="w-24 h-1.5 rounded-full bg-gray-300" />
              </View>

              <View className="px-4 pb-3">
                <Text className="text-[11px] uppercase tracking-wide text-blue-700 mb-1" style={{ fontFamily: 'Poppins_600SemiBold' }}>
                  Your Project (Demo)
                </Text>
                <Text className="text-black text-lg mb-1" style={{ fontFamily: 'Poppins_700Bold' }}>
                  {projectMonitoringDemoData.project.name}
                </Text>
                <Text className="text-gray-600 text-xs leading-5 mb-2" style={{ fontFamily: 'Poppins_400Regular' }}>
                  {projectMonitoringDemoData.project.location}
                </Text>
                <View className="self-start bg-emerald-50 border border-emerald-200 rounded-full px-3 py-1">
                  <Text className="text-emerald-700 text-xs" style={{ fontFamily: 'Poppins_600SemiBold' }}>
                    {projectMonitoringDemoData.project.progressLabel}
                  </Text>
                </View>
              </View>

              <View className="px-3 pb-2">
                <Text className="text-xs text-gray-500 mb-2" style={{ fontFamily: 'Poppins_500Medium' }}>
                  Tap any area to explore the live demo flow
                </Text>
                {!showCoach ? (
                  <TouchableOpacity
                    onPress={() => {
                      setShowCoach(true);
                      setCoachStep('timeline');
                      setActivePanel(null);
                    }}
                    className="self-start mb-2 rounded-full border border-gray-300 px-2.5 py-1"
                  >
                    <Text className="text-[10px] text-gray-700" style={{ fontFamily: 'Poppins_600SemiBold' }}>
                      Restart guide
                    </Text>
                  </TouchableOpacity>
                ) : null}
                {showCoach ? (
                  <View className="bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 mb-2">
                    <Text className="text-amber-900 text-xs leading-5" style={{ fontFamily: 'Poppins_600SemiBold' }}>
                      {coachMessage}
                    </Text>
                    <View className="flex-row mt-1.5">
                      <TouchableOpacity onPress={() => setShowCoach(false)} className="mr-3">
                        <Text className="text-[11px] text-amber-800" style={{ fontFamily: 'Poppins_600SemiBold' }}>
                          Skip guide
                        </Text>
                      </TouchableOpacity>
                      {coachStep === 'done' ? (
                        <TouchableOpacity onPress={() => setShowCoach(false)}>
                          <Text className="text-[11px] text-amber-800" style={{ fontFamily: 'Poppins_600SemiBold' }}>
                            Dismiss
                          </Text>
                        </TouchableOpacity>
                      ) : null}
                    </View>
                  </View>
                ) : null}
                <View className="flex-row flex-wrap gap-2">
                  {[
                    { id: 'overview' as const, label: 'Overview', icon: ClipboardList },
                    { id: 'timeline' as const, label: 'Timeline', icon: Layers3 },
                    { id: 'active' as const, label: 'Active Stage', icon: Bell },
                    { id: 'materials' as const, label: 'Materials', icon: Package },
                    { id: 'chat' as const, label: 'Chat', icon: MessageSquare },
                    { id: 'trust' as const, label: 'Trust', icon: ShieldCheck },
                  ].map((item) => {
                    const Icon = item.icon;
                    const selected = activePanel === item.id;
                    const coachTarget = showCoach && coachTargetPanel === item.id;
                    return (
                      <TouchableOpacity
                        key={item.id}
                        onPress={() => handlePanelOpen(item.id)}
                        className={`rounded-full px-3 py-2 border ${
                          selected
                            ? 'bg-blue-600 border-blue-600'
                            : coachTarget
                              ? 'bg-amber-50 border-amber-400'
                              : 'bg-white border-gray-300'
                        }`}
                      >
                        <View className="flex-row items-center">
                          <Icon size={14} color={selected ? '#ffffff' : coachTarget ? '#92400e' : '#1f2937'} />
                          <Text
                            className={`text-xs ml-1.5 ${selected ? 'text-white' : coachTarget ? 'text-amber-900' : 'text-gray-700'}`}
                            style={{ fontFamily: 'Poppins_600SemiBold' }}
                          >
                            {item.label}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              <View className="px-3 pb-4">
                {activePanel === null ? (
                  <View className="rounded-2xl border border-dashed border-gray-300 bg-white p-4">
                    <Text className="text-gray-700 text-sm leading-6" style={{ fontFamily: 'Poppins_500Medium' }}>
                      Click any action chip above to simulate a logged-in homeowner experience.
                    </Text>
                  </View>
                ) : null}

                {activePanel === 'overview' ? (
                  <View className="bg-white border border-gray-200 rounded-2xl p-4">
                    <Text className="text-black text-base mb-2" style={{ fontFamily: 'Poppins_700Bold' }}>
                      Project overview
                    </Text>
                    <Text className="text-gray-700 text-sm leading-6" style={{ fontFamily: 'Poppins_400Regular' }}>
                      This project is currently on Stage 1. The GC handles execution while the homeowner tracks updates and receives notifications as new items are added.
                    </Text>
                  </View>
                ) : null}

                {activePanel === 'timeline' ? (
                  <View className="bg-white border border-gray-200 rounded-2xl p-4">
                    <Text className="text-black text-base mb-2" style={{ fontFamily: 'Poppins_700Bold' }}>
                      Build timeline
                    </Text>
                    {projectMonitoringDemoData.stages.map((stage) => {
                      const selected = selectedStageId === stage.id;
                      const stageLocked = stage.locked && !(satisfactionConfirmed && stage.order === 2);
                      return (
                        <TouchableOpacity
                          key={stage.id}
                          onPress={() => setSelectedStageId(stage.id)}
                          className={`rounded-xl border p-3 mb-2 ${selected ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-gray-50'}`}
                        >
                          <Text className="text-black text-sm" style={{ fontFamily: 'Poppins_600SemiBold' }}>
                            {stage.order}. {stage.name}
                          </Text>
                          <Text className="text-gray-600 text-xs" style={{ fontFamily: 'Poppins_400Regular' }}>
                            Duration: {stage.duration} | Budget: {formatCurrency(stage.budget)}
                          </Text>
                          <Text className={`text-xs ${stageLocked ? 'text-gray-500' : 'text-emerald-700'}`} style={{ fontFamily: 'Poppins_500Medium' }}>
                            {stageLocked ? 'Locked' : 'Available'}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                ) : null}

                {activePanel === 'active' ? (
                  <View className="bg-white border border-gray-200 rounded-2xl p-4">
                    <Text className="text-black text-base mb-2" style={{ fontFamily: 'Poppins_700Bold' }}>
                      Active stage details
                    </Text>
                    <Text className="text-black text-sm mb-1" style={{ fontFamily: 'Poppins_600SemiBold' }}>
                      {activeStage.name}
                    </Text>
                    <Text className="text-gray-700 text-sm leading-6 mb-2" style={{ fontFamily: 'Poppins_400Regular' }}>
                      {activeStage.completionRule ?? 'The GC executes stage work while the homeowner tracks and confirms satisfaction before the next payment flow.'}
                    </Text>
                    <TouchableOpacity
                      onPress={handleSatisfactionToggle}
                      className={`rounded-full px-4 py-2 self-start ${satisfactionConfirmed ? 'bg-emerald-600' : 'bg-blue-600'}`}
                    >
                      <Text className="text-white text-xs" style={{ fontFamily: 'Poppins_700Bold' }}>
                        {satisfactionConfirmed ? 'Satisfaction Confirmed (Demo)' : 'Confirm Satisfaction (Demo)'}
                      </Text>
                    </TouchableOpacity>
                    {showCoach && coachStep === 'confirm' ? (
                      <Text className="text-[11px] text-blue-700 mt-2" style={{ fontFamily: 'Poppins_500Medium' }}>
                        Tip: confirming satisfaction demonstrates how next-stage payment flow can continue.
                      </Text>
                    ) : null}
                  </View>
                ) : null}

                {activePanel === 'materials' ? (
                  <View className="bg-white border border-gray-200 rounded-2xl p-4">
                    <Text className="text-black text-base mb-2" style={{ fontFamily: 'Poppins_700Bold' }}>
                      Stage details
                    </Text>
                    <View className="flex-row mb-3">
                      <TouchableOpacity
                        onPress={() => setStageDetailsTab('materials')}
                        className={`mr-2 rounded-full px-3 py-1.5 border ${stageDetailsTab === 'materials' ? 'border-black bg-black' : 'border-gray-300 bg-white'}`}
                      >
                        <View className="flex-row items-center">
                          <Package size={12} color={stageDetailsTab === 'materials' ? '#ffffff' : '#374151'} />
                          <Text
                            className={`text-xs ml-1 ${stageDetailsTab === 'materials' ? 'text-white' : 'text-gray-700'}`}
                            style={{ fontFamily: 'Poppins_600SemiBold' }}
                          >
                            Materials
                          </Text>
                        </View>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => setStageDetailsTab('team')}
                        className={`mr-2 rounded-full px-3 py-1.5 border ${stageDetailsTab === 'team' ? 'border-black bg-black' : 'border-gray-300 bg-white'}`}
                      >
                        <View className="flex-row items-center">
                          <Users size={12} color={stageDetailsTab === 'team' ? '#ffffff' : '#374151'} />
                          <Text
                            className={`text-xs ml-1 ${stageDetailsTab === 'team' ? 'text-white' : 'text-gray-700'}`}
                            style={{ fontFamily: 'Poppins_600SemiBold' }}
                          >
                            Team
                          </Text>
                        </View>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => setStageDetailsTab('files')}
                        className={`rounded-full px-3 py-1.5 border ${stageDetailsTab === 'files' ? 'border-black bg-black' : 'border-gray-300 bg-white'}`}
                      >
                        <View className="flex-row items-center">
                          <FileText size={12} color={stageDetailsTab === 'files' ? '#ffffff' : '#374151'} />
                          <Text
                            className={`text-xs ml-1 ${stageDetailsTab === 'files' ? 'text-white' : 'text-gray-700'}`}
                            style={{ fontFamily: 'Poppins_600SemiBold' }}
                          >
                            Files
                          </Text>
                        </View>
                      </TouchableOpacity>
                    </View>

                    {stageDetailsTab === 'materials'
                      ? (activeStage.materials ?? []).map((material) => (
                          <View key={`${material.name}-${material.supplier}`} className="bg-gray-50 rounded-xl p-3 mb-2 last:mb-0">
                            <View className="flex-row">
                              <Image
                                source={{ uri: material.imageUrl }}
                                className="w-16 h-16 rounded-xl mr-3"
                                resizeMode="cover"
                              />
                              <View className="flex-1">
                                <Text className="text-black text-sm" style={{ fontFamily: 'Poppins_600SemiBold' }}>
                                  {material.name}
                                </Text>
                                <Text className="text-gray-600 text-xs" style={{ fontFamily: 'Poppins_400Regular' }}>
                                  {material.supplier} • {material.quantity}
                                </Text>
                                <Text className="text-gray-600 text-xs" style={{ fontFamily: 'Poppins_400Regular' }}>
                                  Brand: {material.brand}
                                </Text>
                                <Text className="text-gray-700 text-xs mt-1" style={{ fontFamily: 'Poppins_500Medium' }}>
                                  {formatCurrency(material.price)}
                                </Text>
                              </View>
                            </View>
                          </View>
                        ))
                      : null}

                    {stageDetailsTab === 'team'
                      ? (activeStage.team ?? []).map((member) => (
                          <View key={`${member.name}-${member.role}`} className="bg-gray-50 rounded-xl p-3 mb-2">
                            <Text className="text-black text-sm" style={{ fontFamily: 'Poppins_600SemiBold' }}>
                              {member.name}
                            </Text>
                            <Text className="text-gray-600 text-xs" style={{ fontFamily: 'Poppins_400Regular' }}>
                              {member.role}
                            </Text>
                          </View>
                        ))
                      : null}

                    {stageDetailsTab === 'files' ? (
                      <View>
                        {(activeStage.files ?? []).map((file) => (
                          <TouchableOpacity
                            key={file.id}
                            onPress={() => setSelectedFileId(file.id)}
                            className={`rounded-xl p-3 mb-2 border ${selectedFileId === file.id ? 'bg-blue-50 border-blue-300' : 'bg-gray-50 border-gray-200'}`}
                          >
                            <Text className="text-black text-sm" style={{ fontFamily: 'Poppins_600SemiBold' }}>
                              {file.name}
                            </Text>
                            <Text className="text-gray-600 text-xs" style={{ fontFamily: 'Poppins_400Regular' }}>
                              Uploaded by GC • {file.uploadedAt}
                            </Text>
                          </TouchableOpacity>
                        ))}
                        {selectedFile ? (
                          <View className="bg-white border border-gray-200 rounded-xl p-2">
                            <Image
                              source={{ uri: selectedFile.previewImageUrl }}
                              className="w-full h-28 rounded-lg"
                              resizeMode="cover"
                            />
                            <Text className="text-gray-700 text-xs mt-1.5" style={{ fontFamily: 'Poppins_500Medium' }}>
                              Previewing: {selectedFile.name}
                            </Text>
                          </View>
                        ) : null}
                      </View>
                    ) : null}
                  </View>
                ) : null}

                {activePanel === 'chat' ? (
                  <View className="bg-white border border-gray-200 rounded-2xl p-4">
                    <Text className="text-black text-base mb-2" style={{ fontFamily: 'Poppins_700Bold' }}>
                      Chat preview
                    </Text>
                    {(activeStage.chat ?? []).map((item, index) => (
                      <View key={`${item.sender}-${index}`} className="mb-2">
                        <Text className="text-[11px] text-gray-500 mb-0.5" style={{ fontFamily: 'Poppins_500Medium' }}>
                          {item.sender === 'gc' ? 'GC' : 'Homeowner'} • {item.date}
                        </Text>
                        <View className={`rounded-xl px-3 py-2 ${item.sender === 'gc' ? 'bg-gray-100' : 'bg-blue-50'}`}>
                          <Text className="text-sm text-gray-700 leading-6" style={{ fontFamily: 'Poppins_400Regular' }}>
                            {item.message}
                          </Text>
                        </View>
                      </View>
                    ))}
                  </View>
                ) : null}

                {activePanel === 'trust' ? (
                  <View className="bg-white border border-gray-200 rounded-2xl p-4">
                    <Text className="text-black text-base mb-2" style={{ fontFamily: 'Poppins_700Bold' }}>
                      Trust points
                    </Text>
                    {projectMonitoringDemoData.trustPoints.map((point) => (
                      <Text key={point} className="text-gray-700 text-sm leading-6 mb-1" style={{ fontFamily: 'Poppins_400Regular' }}>
                        • {point}
                      </Text>
                    ))}
                  </View>
                ) : null}
              </View>
            </View>
          </View>
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
            Current payment status: {satisfactionConfirmed ? 'satisfaction confirmed - stage 2 payment flow can proceed (demo)' : activeStage.paymentStatus?.replace(/_/g, ' ') ?? 'N/A'}
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
            <TouchableOpacity
              onPress={() => {
                trackWebEvent('demo_project_monitoring_cta_bottom_open_payment', {
                  cta_action: 'open_payment_workflow',
                });
                setActivePanel('active');
                if (showCoach && coachStep === 'timeline') {
                  setCoachStep('active');
                }
              }}
              className="border border-white/35 rounded-full py-3.5 px-5"
            >
              <View className="flex-row items-center justify-center">
                <CreditCard size={16} color="#ffffff" />
                <Text className="text-white text-center text-base ml-2" style={{ fontFamily: 'Poppins_600SemiBold' }}>
                  Try Payment Flow Demo
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

