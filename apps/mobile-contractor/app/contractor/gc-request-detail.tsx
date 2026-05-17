import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, TextInput, Linking, Modal, Image } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { ArrowLeft, FileText, MapPin, User, Calendar, CheckCircle, XCircle, Download, Edit3, X, Phone, Image as ImageIcon } from "lucide-react-native";
import { useState, useEffect } from "react";
import { usePendingRequests, useAcceptRequest, useRejectRequest } from "../../hooks/useGC";
import { useAppAlert } from "../../components/AppAlertProvider";
import { getBackendAssetUrl } from "@/lib/image";
import { api } from "@/lib/api";
import { useResponsivePadding } from "@/lib/responsive-layout";

const REJECTION_REASONS = [
  'Currently too busy',
  'Not available in the requested timeline',
  'Project location is too far',
  'Project scope is outside my specialty',
  'Budget may not match the required work',
  'Need more project information before quoting',
];

function moneyToCents(value: unknown): number {
  const n =
    typeof value === "number"
      ? value
      : typeof value === "string"
        ? Number(value.replace(/[^0-9.-]/g, ""))
        : NaN;
  if (!Number.isFinite(n)) return NaN;
  return Math.round(n * 100);
}

function sumPhaseCostCents(phases: any[]): number {
  return phases.reduce((sum, p) => {
    const cents = moneyToCents(p?.estimatedCost);
    return sum + (Number.isFinite(cents) ? cents : 0);
  }, 0);
}

export default function GCRequestDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { showAlert } = useAppAlert();
  const { data: pendingRequests = [], refetch, isLoading } = usePendingRequests();
  const acceptRequestMutation = useAcceptRequest();
  const rejectRequestMutation = useRejectRequest();
  const { horizontalPad, headerPaddingTop, scrollBottomPadding } =
    useResponsivePadding("stack");

  // Find the specific request
  const request = pendingRequests.find((r) => r.id === id);

  // Editable AI Analysis fields
  const [editedAnalysis, setEditedAnalysis] = useState<any>(null);
  const [estimatedBudget, setEstimatedBudget] = useState<string>('');
  const [estimatedDuration, setEstimatedDuration] = useState<string>('');
  const [gcNotes, setGcNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [selectedRejectReasons, setSelectedRejectReasons] = useState<string[]>([]);
  const [customRejectReason, setCustomRejectReason] = useState('');

  // Initialize editable fields from AI analysis
  useEffect(() => {
    if (request?.project) {
      const analysis = request.project.aiAnalysis as any || {};
      setEditedAnalysis(analysis);
      
      // Pre-fill budget and duration
      setEstimatedBudget(analysis.budget?.toString() || request.project.budget?.toString() || '');
      setEstimatedDuration(analysis.estimatedDuration || analysis.timeline || '');
    }
  }, [request]);

  const updateAnalysisField = (field: string, value: any) => {
    setEditedAnalysis((prev: any) => ({
      ...prev,
      [field]: value,
    }));
  };

  const updateArrayField = (field: string, index: number, value: string) => {
    setEditedAnalysis((prev: any) => {
      const arr = Array.isArray(prev?.[field]) ? [...prev[field]] : [];
      arr[index] = value;
      return { ...prev, [field]: arr };
    });
  };

  const addArrayItem = (field: string) => {
    setEditedAnalysis((prev: any) => {
      const arr = Array.isArray(prev?.[field]) ? [...prev[field]] : [];
      arr.push('');
      return { ...prev, [field]: arr };
    });
  };

  const removeArrayItem = (field: string, index: number) => {
    setEditedAnalysis((prev: any) => {
      const arr = Array.isArray(prev?.[field]) ? [...prev[field]] : [];
      arr.splice(index, 1);
      return { ...prev, [field]: arr };
    });
  };

  const handleAccept = async () => {
    if (!request) {
      showAlert('Error', 'Request not found. Please go back and try again.');
      return;
    }
    const req = request;

    const budgetCents = moneyToCents(estimatedBudget);
    if (!estimatedBudget || !Number.isFinite(budgetCents) || budgetCents <= 0) {
      showAlert('Required Fields', 'Please provide a valid estimated budget.');
      return;
    }
    if (!estimatedDuration?.trim()) {
      showAlert('Required Fields', 'Please provide an estimated duration.');
      return;
    }

    // Enforce all visible/expected analysis fields (GC Notes is optional)
    const analysis = editedAnalysis || {};
    const rooms = analysis.rooms;
    const materials = analysis.materials;
    const features = analysis.features;
    const phases = analysis.phases;
    const summary = analysis.summary;

    if (!Array.isArray(rooms) || rooms.length === 0 || rooms.some((r: any) => !String(r || '').trim())) {
      showAlert('Required Fields', 'Please fill in all Rooms (and ensure none are empty).');
      return;
    }
    if (!Array.isArray(materials) || materials.length === 0 || materials.some((m: any) => !String(m || '').trim())) {
      showAlert('Required Fields', 'Please fill in all Key Materials (and ensure none are empty).');
      return;
    }
    if (!Array.isArray(features) || features.length === 0 || features.some((f: any) => !String(f || '').trim())) {
      showAlert('Required Fields', 'Please fill in all Features (and ensure none are empty).');
      return;
    }
    if (!Array.isArray(phases) || phases.length === 0) {
      showAlert('Required Fields', 'Please add at least one Construction Phase.');
      return;
    }
    for (let i = 0; i < phases.length; i++) {
      const p = phases[i];
      if (!String(p?.name || '').trim()) {
        showAlert('Required Fields', `Please provide a name for phase ${i + 1}.`);
        return;
      }
      if (!String(p?.description || '').trim()) {
        showAlert('Required Fields', `Please provide a description for phase ${i + 1}.`);
        return;
      }
      if (!String(p?.estimatedDuration || '').trim()) {
        showAlert('Required Fields', `Please provide a duration for phase ${i + 1}.`);
        return;
      }
      const costCents = moneyToCents(p?.estimatedCost);
      if (!Number.isFinite(costCents) || costCents <= 0) {
        showAlert('Required Fields', `Please provide a valid cost for phase ${i + 1}.`);
        return;
      }
    }
    if (!String(summary || '').trim()) {
      showAlert('Required Fields', 'Please fill in the Project Summary.');
      return;
    }

    // Budget integrity check: sum of phase costs must equal project estimated budget
    const totalPhaseCents = sumPhaseCostCents(phases);
    if (totalPhaseCents !== budgetCents) {
      showAlert(
        'Validation Error',
        `The total of all phase costs must equal the estimated project budget.\n\nPhase total: ₦${(totalPhaseCents / 100).toLocaleString()}\nBudget: ₦${(budgetCents / 100).toLocaleString()}`
      );
      return;
    }

    if (isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    
    // Safety timeout - if mutation takes longer than 30 seconds, reset state
    let timeoutId: ReturnType<typeof setTimeout> | null = setTimeout(() => {
      setIsSubmitting(false);
      showAlert(
        'Request Timeout',
        'The request is taking longer than expected. Please check your connection and try again.',
        [{ text: 'OK' }]
      );
    }, 30000);

    try {
      // Include edited AI analysis in notes as JSON
      const notesWithAnalysis = gcNotes 
        ? `${gcNotes}\n\n[Edited AI Analysis]\n${JSON.stringify(editedAnalysis, null, 2)}`
        : `[Edited AI Analysis]\n${JSON.stringify(editedAnalysis, null, 2)}`;

      const acceptData = {
        requestId: req.id,
        data: {
          estimatedBudget: parseFloat(estimatedBudget),
          estimatedDuration,
          gcNotes: notesWithAnalysis,
        },
      };

      await acceptRequestMutation.mutateAsync(acceptData);

      // Clear timeout since we succeeded
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }

      // Show success and navigate immediately (don't wait for refetch)
      showAlert(
        'Project Accepted! ✅',
        'You have successfully accepted this project request. The homeowner has been notified and can now proceed with the project.',
        [
          {
            text: 'OK',
            onPress: () => {
              // Navigate immediately - don't wait for refetch
              // Use setTimeout to ensure navigation happens after alert dismisses
              setTimeout(() => {
                router.replace('/contractor/gc-dashboard');
              }, 100);
              
              // Refetch in background (don't await)
              setTimeout(() => {
                refetch().catch((refetchError) => {
                  // Background refetch failure shouldn't block navigation.
                });
              }, 500);
            },
          },
        ]
      );
    } catch (error: any) {
      console.error('❌ [handleAccept] Failed to accept request:', error);
      
      let errorMessage = 'Failed to accept request. Please try again.';
      if (error?.message) {
        errorMessage = error.message;
      } else if (error?.data?.message) {
        errorMessage = error.data.message;
      } else if (error?.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      }

      // Clear timeout on error
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }

      showAlert('Error Accepting Request', errorMessage, [{ text: 'OK' }]);
    } finally {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      setIsSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (!request) return;

    setSelectedRejectReasons([]);
    setCustomRejectReason('');
    setShowRejectModal(true);
  };

  const toggleRejectReason = (reason: string) => {
    setSelectedRejectReasons((prev) =>
      prev.includes(reason) ? prev.filter((item) => item !== reason) : [...prev, reason],
    );
  };

  const submitRejectRequest = async () => {
    if (!request) return;

    const customReason = customRejectReason.trim();
    const reasons = customReason ? [...selectedRejectReasons, customReason] : selectedRejectReasons;
    if (reasons.length === 0) {
      showAlert('Reason Required', 'Please select at least one reason before declining the request.');
      return;
    }

    setIsSubmitting(true);
    try {
      await rejectRequestMutation.mutateAsync({
        requestId: request.id,
        reason: reasons.join('; '),
      });
      setShowRejectModal(false);
      showAlert(
        'Request Rejected',
        'The homeowner has been notified with your reason.',
        [
          {
            text: 'OK',
            onPress: () => router.replace('/contractor/gc-dashboard'),
          },
        ]
      );
    } catch (error: any) {
      console.error('Error rejecting request:', error);
      showAlert('Error', error.message || 'Failed to reject request. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDownloadPDF = async () => {
    const projectId = request?.project?.id;
    if (!projectId) {
      showAlert('No Plan Available', 'The project plan PDF is not available.');
      return;
    }

    try {
      const result = await api.get(`/plans/${projectId}/download-url`);
      const rawUrl =
        result?.url ||
        request?.project?.homeownerFiles?.pdfUrl ||
        request?.project?.planPdfUrl;
      const pdfUrl = getBackendAssetUrl(rawUrl);

      const supported = await Linking.canOpenURL(pdfUrl);
      if (supported) {
        await Linking.openURL(pdfUrl);
      } else {
        showAlert('Error', 'Cannot open PDF URL');
      }
    } catch (error) {
      console.error('Error opening PDF:', error);
      // Fallback to old URL path for backward compatibility.
      const fallbackRawUrl =
        request?.project?.homeownerFiles?.pdfUrl || request?.project?.planPdfUrl;
      const fallbackUrl = fallbackRawUrl
        ? getBackendAssetUrl(fallbackRawUrl)
        : null;
      if (fallbackUrl) {
        try {
          const supported = await Linking.canOpenURL(fallbackUrl);
          if (supported) {
            await Linking.openURL(fallbackUrl);
            return;
          }
        } catch {}
      }
      showAlert('Error', 'Failed to open PDF. Please try again.');
    }
  };

  const handleCallHomeowner = async () => {
    const homeownerPhone = request?.project?.homeowner?.phone?.trim();
    if (!homeownerPhone) {
      showAlert('Phone Not Available', 'No phone number is available yet for this homeowner.');
      return;
    }
    const callUrl = `tel:${homeownerPhone}`;
    const canOpen = await Linking.canOpenURL(callUrl);
    if (!canOpen) {
      showAlert('Unable to Dial', 'This device cannot place a call right now.');
      return;
    }
    await Linking.openURL(callUrl);
  };

  const handleOpenPhoto = async (rawUrl?: string | null) => {
    const normalized = getBackendAssetUrl(rawUrl);
    if (!normalized) {
      showAlert('Photo Not Available', 'This project photo is not available right now.');
      return;
    }
    try {
      const canOpen = await Linking.canOpenURL(normalized);
      if (!canOpen) {
        showAlert('Unable to Open', 'Unable to open this photo on your device.');
        return;
      }
      await Linking.openURL(normalized);
    } catch {
      showAlert('Unable to Open', 'Unable to open this photo on your device.');
    }
  };

  // If still loading, show loading state
  if (isLoading) {
    return (
      <View className="flex-1 bg-[#0A1628] items-center justify-center">
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text className="text-gray-400 mt-4" style={{ fontFamily: 'Poppins_400Regular' }}>
          Loading request details...
        </Text>
      </View>
    );
  }

  // If not loading but request not found, it might have been accepted/rejected
  if (!request && !isLoading) {
    return (
      <View className="flex-1 bg-[#0A1628] items-center justify-center" style={{ paddingHorizontal: horizontalPad }}>
        <Text className="text-white text-xl mb-2 text-center" style={{ fontFamily: 'Poppins_700Bold' }}>
          Request Not Found
        </Text>
        <Text className="text-gray-400 text-center mb-6" style={{ fontFamily: 'Poppins_400Regular' }}>
          This request may have been accepted, rejected, or is no longer available.
        </Text>
        <TouchableOpacity
          onPress={() => router.replace('/contractor/gc-dashboard')}
          className="bg-blue-600 rounded-xl px-6 py-3"
        >
          <Text className="text-white" style={{ fontFamily: 'Poppins_600SemiBold' }}>
            Back to Dashboard
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  // At this point request is guaranteed by the guard above (TS doesn't narrow across JSX well),
  // so we bind a non-null reference for the render path.
  const req = request!;
  const aiAnalysis = editedAnalysis || req.project.aiAnalysis || {};
  const homeownerPhotoUrls = Array.isArray(req?.project?.homeownerFiles?.photoUrls)
    ? req.project.homeownerFiles.photoUrls
    : Array.isArray(req?.project?.homeownerFiles?.photos)
      ? req.project.homeownerFiles.photos
          .map((photo: any) => String(photo?.url || '').trim())
          .filter(Boolean)
      : Array.isArray(aiAnalysis?.projectImageUrls)
        ? aiAnalysis.projectImageUrls
            .map((url: any) => String(url || '').trim())
            .filter(Boolean)
        : [];
  const homeownerHasPdf =
    !!req?.project?.homeownerFiles?.hasPdf || !!req?.project?.planPdfUrl;
  const homeownerPdfFileName =
    req?.project?.homeownerFiles?.pdfFileName || req?.project?.planFileName || 'plan.pdf';
  const homeownerProjectBrief = String(aiAnalysis?.homeownerProjectDescription || '').trim();
  const homeownerSuccessGoal = String(aiAnalysis?.successCriteria || '').trim();

  return (
    <View className="flex-1 bg-[#0A1628]">
      {/* Header */}
      <View
        className="pb-4 border-b border-blue-900"
        style={{ paddingTop: headerPaddingTop, paddingHorizontal: horizontalPad }}
      >
        <View className="flex-row items-center justify-between mb-2">
          <TouchableOpacity 
            onPress={() => {
              if (router.canGoBack()) {
                router.back();
              } else {
                router.replace('/contractor/gc-requests');
              }
            }}
            className="w-10 h-10 bg-[#1E3A5F] rounded-full items-center justify-center"
          >
            <ArrowLeft size={20} color="#3B82F6" strokeWidth={2.5} />
          </TouchableOpacity>
          <Text className="text-white text-xl flex-1 text-center" style={{ fontFamily: 'Poppins_700Bold' }}>
            Review Project
          </Text>
          <View className="w-10" />
        </View>
      </View>

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingBottom: scrollBottomPadding,
          paddingHorizontal: horizontalPad,
          paddingTop: 24,
        }}
      >
        <View>
          {/* Project Header */}
          <View className="bg-[#1E3A5F] rounded-2xl p-5 mb-4 border border-blue-900">
            <Text className="text-white text-2xl mb-2" style={{ fontFamily: 'Poppins_800ExtraBold' }}>
              {req.project.name || 'New Project'}
            </Text>
            <View className="flex-row items-center mb-3">
              <User size={16} color="#9CA3AF" strokeWidth={2} />
              <Text className="text-gray-400 text-base ml-2" style={{ fontFamily: 'Poppins_400Regular' }}>
                {req.project.homeowner.fullName}
              </Text>
            </View>
            <View className="flex-row items-center">
              <MapPin size={16} color="#9CA3AF" strokeWidth={2} />
              <Text className="text-gray-400 text-sm ml-2 flex-1" style={{ fontFamily: 'Poppins_400Regular' }}>
                {req.project.address}
              </Text>
            </View>
          </View>

          {(homeownerProjectBrief || homeownerSuccessGoal) && (
            <View className="bg-[#1E3A5F] rounded-2xl p-5 mb-4 border border-blue-900">
              <Text className="text-white text-lg mb-3" style={{ fontFamily: 'Poppins_700Bold' }}>
                Homeowner Request Details
              </Text>
              {homeownerProjectBrief ? (
                <View className="mb-3">
                  <Text className="text-blue-300 text-xs mb-1" style={{ fontFamily: 'Poppins_600SemiBold' }}>
                    Project Brief
                  </Text>
                  <Text className="text-gray-300 text-sm leading-6" style={{ fontFamily: 'Poppins_400Regular' }}>
                    {homeownerProjectBrief}
                  </Text>
                </View>
              ) : null}
              {homeownerSuccessGoal ? (
                <View>
                  <Text className="text-blue-300 text-xs mb-1" style={{ fontFamily: 'Poppins_600SemiBold' }}>
                    Success Goal
                  </Text>
                  <Text className="text-gray-300 text-sm leading-6" style={{ fontFamily: 'Poppins_400Regular' }}>
                    {homeownerSuccessGoal}
                  </Text>
                </View>
              ) : null}
            </View>
          )}

          {/* Plan PDF Section */}
          {homeownerHasPdf && (
            <View className="bg-[#1E3A5F] rounded-2xl p-5 mb-4 border border-blue-900">
              <View className="flex-row items-center justify-between mb-3 gap-2">
                <View className="flex-row items-center flex-1">
                  <FileText size={24} color="#3B82F6" strokeWidth={2} />
                  <Text className="text-white text-lg ml-3" style={{ fontFamily: 'Poppins_700Bold' }}>
                    Architectural Plan
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={handleDownloadPDF}
                  className="bg-blue-600 rounded-full px-3 py-1.5 flex-row items-center flex-shrink-0"
                >
                  <Download size={14} color="#FFFFFF" strokeWidth={2} />
                  <Text className="text-white text-xs ml-1.5" style={{ fontFamily: 'Poppins_600SemiBold' }}>
                    Download PDF
                  </Text>
                </TouchableOpacity>
              </View>
              {homeownerPdfFileName && (
                <Text className="text-gray-400 text-sm" style={{ fontFamily: 'Poppins_400Regular' }}>
                  {homeownerPdfFileName}
                </Text>
              )}
              <Text className="text-gray-500 text-xs mt-2" style={{ fontFamily: 'Poppins_400Regular' }}>
                Review the plan PDF before accepting the project
              </Text>
            </View>
          )}

          {/* Homeowner Photo References */}
          {homeownerPhotoUrls.length > 0 && (
            <View className="bg-[#1E3A5F] rounded-2xl p-5 mb-4 border border-blue-900">
              <View className="flex-row items-center mb-3">
                <ImageIcon size={20} color="#60A5FA" strokeWidth={2} />
                <Text className="text-white text-lg ml-2" style={{ fontFamily: 'Poppins_700Bold' }}>
                  Homeowner Reference Photos ({homeownerPhotoUrls.length})
                </Text>
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {homeownerPhotoUrls.map((url: string, index: number) => {
                  const assetUrl = getBackendAssetUrl(url);
                  return (
                    <TouchableOpacity
                      key={`${url}-${index}`}
                      onPress={() => handleOpenPhoto(assetUrl)}
                      className="mr-3"
                      activeOpacity={0.85}
                    >
                      <View className="w-28 h-28 rounded-xl overflow-hidden bg-[#0A1628] border border-blue-900">
                        <Image source={{ uri: assetUrl }} className="w-full h-full" resizeMode="cover" />
                      </View>
                      <Text
                        className="text-gray-400 text-xs mt-1 max-w-[112px]"
                        style={{ fontFamily: 'Poppins_400Regular' }}
                        numberOfLines={1}
                      >
                        Photo {index + 1}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
              <Text className="text-gray-500 text-xs mt-3" style={{ fontFamily: 'Poppins_400Regular' }}>
                Tap a photo to open it in full view.
              </Text>
            </View>
          )}

          {/* Editable AI Analysis Section */}
          <View className="bg-[#1E3A5F] rounded-2xl mb-4 border-2 border-yellow-600/30" style={{ padding: 20 }}>
            <View className="flex-row items-center justify-between mb-4">
              <View className="flex-row items-center">
                <Edit3 size={20} color="#F59E0B" strokeWidth={2} />
                <Text className="text-yellow-400 text-lg ml-2" style={{ fontFamily: 'Poppins_700Bold' }}>
                  Edit Project Analysis
                </Text>
              </View>
            </View>

            {/* Budget */}
            <View className="mb-4">
              <Text className="text-gray-300 text-sm mb-2" style={{ fontFamily: 'Poppins_500Medium' }}>
                Estimated Budget *
              </Text>
              <View className="bg-[#0A1628] rounded-xl px-4 py-3 flex-row items-center border border-blue-900">
                <Text className="text-gray-500 text-base" style={{ fontFamily: 'Poppins_600SemiBold' }}>₦</Text>
                <TextInput
                  className="flex-1 ml-3 text-white text-base"
                  style={{ fontFamily: 'Poppins_400Regular' }}
                  placeholder="Enter estimated budget"
                  placeholderTextColor="#6B7280"
                  value={estimatedBudget}
                  onChangeText={setEstimatedBudget}
                  keyboardType="numeric"
                />
              </View>
            </View>

            {/* Duration */}
            <View className="mb-4">
              <Text className="text-gray-300 text-sm mb-2" style={{ fontFamily: 'Poppins_500Medium' }}>
                Estimated Duration *
              </Text>
              <View className="bg-[#0A1628] rounded-xl px-4 py-3 flex-row items-center border border-blue-900">
                <Calendar size={20} color="#6B7280" strokeWidth={2} />
                <TextInput
                  className="flex-1 ml-3 text-white text-base"
                  style={{ fontFamily: 'Poppins_400Regular' }}
                  placeholder="e.g., 6-8 months"
                  placeholderTextColor="#6B7280"
                  value={estimatedDuration}
                  onChangeText={setEstimatedDuration}
                />
              </View>
            </View>

            {/* Rooms */}
            {Array.isArray(aiAnalysis.rooms) && (
              <View className="mb-4">
                <Text className="text-gray-300 text-sm mb-2" style={{ fontFamily: 'Poppins_500Medium' }}>
                  Rooms
                </Text>
                {aiAnalysis.rooms.map((room: string, index: number) => (
                  <View key={index} className="flex-row items-center mb-2">
                    <TextInput
                      className="flex-1 bg-[#0A1628] rounded-xl px-4 py-3 text-white text-base border border-blue-900"
                      style={{ fontFamily: 'Poppins_400Regular' }}
                      placeholder="Room name"
                      placeholderTextColor="#6B7280"
                      value={room}
                      onChangeText={(value) => updateArrayField('rooms', index, value)}
                    />
                    <TouchableOpacity
                      onPress={() => removeArrayItem('rooms', index)}
                      className="ml-2 bg-red-600/20 rounded-xl px-4 py-3"
                    >
                      <Text className="text-red-400" style={{ fontFamily: 'Poppins_600SemiBold' }}>×</Text>
                    </TouchableOpacity>
                  </View>
                ))}
                <TouchableOpacity
                  onPress={() => addArrayItem('rooms')}
                  className="bg-blue-600/20 border border-blue-600 rounded-xl px-4 py-3"
                >
                  <Text className="text-blue-400 text-center" style={{ fontFamily: 'Poppins_600SemiBold' }}>
                    + Add Room
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Materials */}
            {Array.isArray(aiAnalysis.materials) && (
              <View className="mb-4">
                <Text className="text-gray-300 text-sm mb-2" style={{ fontFamily: 'Poppins_500Medium' }}>
                  Key Materials
                </Text>
                {aiAnalysis.materials.map((material: string, index: number) => (
                  <View key={index} className="flex-row items-center mb-2">
                    <TextInput
                      className="flex-1 bg-[#0A1628] rounded-xl px-4 py-3 text-white text-base border border-blue-900"
                      style={{ fontFamily: 'Poppins_400Regular' }}
                      placeholder="Material name"
                      placeholderTextColor="#6B7280"
                      value={material}
                      onChangeText={(value) => updateArrayField('materials', index, value)}
                    />
                    <TouchableOpacity
                      onPress={() => removeArrayItem('materials', index)}
                      className="ml-2 bg-red-600/20 rounded-xl px-4 py-3"
                    >
                      <Text className="text-red-400" style={{ fontFamily: 'Poppins_600SemiBold' }}>×</Text>
                    </TouchableOpacity>
                  </View>
                ))}
                <TouchableOpacity
                  onPress={() => addArrayItem('materials')}
                  className="bg-blue-600/20 border border-blue-600 rounded-xl px-4 py-3"
                >
                  <Text className="text-blue-400 text-center" style={{ fontFamily: 'Poppins_600SemiBold' }}>
                    + Add Material
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Features */}
            {Array.isArray(aiAnalysis.features) && (
              <View className="mb-4">
                <Text className="text-gray-300 text-sm mb-2" style={{ fontFamily: 'Poppins_500Medium' }}>
                  Features
                </Text>
                {aiAnalysis.features.map((feature: string, index: number) => (
                  <View key={index} className="flex-row items-center mb-2">
                    <TextInput
                      className="flex-1 bg-[#0A1628] rounded-xl px-4 py-3 text-white text-base border border-blue-900"
                      style={{ fontFamily: 'Poppins_400Regular' }}
                      placeholder="Feature name"
                      placeholderTextColor="#6B7280"
                      value={feature}
                      onChangeText={(value) => updateArrayField('features', index, value)}
                    />
                    <TouchableOpacity
                      onPress={() => removeArrayItem('features', index)}
                      className="ml-2 bg-red-600/20 rounded-xl px-4 py-3"
                    >
                      <Text className="text-red-400" style={{ fontFamily: 'Poppins_600SemiBold' }}>×</Text>
                    </TouchableOpacity>
                  </View>
                ))}
                <TouchableOpacity
                  onPress={() => addArrayItem('features')}
                  className="bg-blue-600/20 border border-blue-600 rounded-xl px-4 py-3"
                >
                  <Text className="text-blue-400 text-center" style={{ fontFamily: 'Poppins_600SemiBold' }}>
                    + Add Feature
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Phases */}
            {Array.isArray(aiAnalysis.phases) && (
              <View className="mb-4">
                <Text className="text-gray-300 text-sm mb-2" style={{ fontFamily: 'Poppins_500Medium' }}>
                  Construction Phases
                </Text>
                {aiAnalysis.phases.map((phase: any, index: number) => (
                  <View key={index} className="bg-[#0A1628] rounded-xl mb-3 border border-blue-900" style={{ padding: 16 }}>
                    <TextInput
                      className="bg-[#1E3A5F] rounded-lg px-3 py-2 text-white text-base mb-2"
                      style={{ fontFamily: 'Poppins_600SemiBold' }}
                      placeholder="Phase name"
                      placeholderTextColor="#6B7280"
                      value={phase.name || ''}
                      onChangeText={(value) => {
                        const phases = [...(aiAnalysis.phases || [])];
                        phases[index] = { ...phases[index], name: value };
                        updateAnalysisField('phases', phases);
                      }}
                    />
                    <TextInput
                      className="bg-[#1E3A5F] rounded-lg px-3 py-2 text-white text-sm mb-2"
                      style={{ fontFamily: 'Poppins_400Regular' }}
                      placeholder="Description"
                      placeholderTextColor="#6B7280"
                      value={phase.description || ''}
                      onChangeText={(value) => {
                        const phases = [...(aiAnalysis.phases || [])];
                        phases[index] = { ...phases[index], description: value };
                        updateAnalysisField('phases', phases);
                      }}
                      multiline
                    />
                    <View className="flex-row items-center gap-3 min-w-0">
                      <TextInput
                        className="flex-1 bg-[#1E3A5F] rounded-lg px-3 py-2 text-white text-sm min-w-0"
                        style={{ fontFamily: 'Poppins_400Regular' }}
                        placeholder="Duration"
                        placeholderTextColor="#6B7280"
                        value={phase.estimatedDuration || ''}
                        onChangeText={(value) => {
                          const phases = [...(aiAnalysis.phases || [])];
                          phases[index] = { ...phases[index], estimatedDuration: value };
                          updateAnalysisField('phases', phases);
                        }}
                      />
                      <TextInput
                        className="flex-1 bg-[#1E3A5F] rounded-lg px-3 py-2 text-white text-sm min-w-0"
                        style={{ fontFamily: 'Poppins_400Regular' }}
                        placeholder="Cost"
                        placeholderTextColor="#6B7280"
                        value={phase.estimatedCost?.toString() || ''}
                        onChangeText={(value) => {
                          const phases = [...(aiAnalysis.phases || [])];
                          phases[index] = { ...phases[index], estimatedCost: parseFloat(value) || 0 };
                          updateAnalysisField('phases', phases);
                        }}
                        keyboardType="numeric"
                      />
                      <TouchableOpacity
                        onPress={() => {
                          const phases = [...(aiAnalysis.phases || [])];
                          phases.splice(index, 1);
                          updateAnalysisField('phases', phases);
                        }}
                        className="bg-red-600/20 rounded-lg px-3 py-2 justify-center items-center flex-shrink-0"
                        style={{ minWidth: 40 }}
                      >
                        <X size={18} color="#F87171" strokeWidth={2} />
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
                <TouchableOpacity
                  onPress={() => {
                    const phases = [...(aiAnalysis.phases || [])];
                    phases.push({ name: '', description: '', estimatedDuration: '', estimatedCost: 0 });
                    updateAnalysisField('phases', phases);
                  }}
                  className="bg-blue-600/20 border border-blue-600 rounded-xl px-4 py-3"
                >
                  <Text className="text-blue-400 text-center" style={{ fontFamily: 'Poppins_600SemiBold' }}>
                    + Add Phase
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Summary */}
            <View className="mb-4">
              <Text className="text-gray-300 text-sm mb-2" style={{ fontFamily: 'Poppins_500Medium' }}>
                Project Summary
              </Text>
              <TextInput
                className="bg-[#0A1628] rounded-xl px-4 py-3 text-white text-base border border-blue-900"
                style={{ fontFamily: 'Poppins_400Regular', minHeight: 100, textAlignVertical: 'top' }}
                placeholder="Edit project summary..."
                placeholderTextColor="#6B7280"
                value={aiAnalysis.summary || ''}
                onChangeText={(value) => updateAnalysisField('summary', value)}
                multiline
                numberOfLines={4}
              />
            </View>

            {/* GC Notes */}
            <View className="mb-4">
              <Text className="text-gray-300 text-sm mb-2" style={{ fontFamily: 'Poppins_500Medium' }}>
                Additional Notes (Optional)
              </Text>
              <TextInput
                className="bg-[#0A1628] rounded-xl px-4 py-3 text-white text-base border border-blue-900"
                style={{ fontFamily: 'Poppins_400Regular', minHeight: 100, textAlignVertical: 'top' }}
                placeholder="Add any comments or modifications to the project..."
                placeholderTextColor="#6B7280"
                value={gcNotes}
                onChangeText={setGcNotes}
                multiline
                numberOfLines={4}
              />
            </View>
          </View>

          {/* Contact Info */}
          <View className="bg-[#1E3A5F] rounded-2xl p-5 mb-6 border border-blue-900">
            <Text className="text-white text-lg mb-3" style={{ fontFamily: 'Poppins_700Bold' }}>
              Contact Information
            </Text>
            <View className="bg-amber-500/10 border border-amber-500/30 rounded-xl px-3 py-3 mb-4">
              <Text className="text-amber-300 text-sm" style={{ fontFamily: 'Poppins_600SemiBold' }}>
                Before accepting:
              </Text>
              <Text className="text-amber-200 text-sm mt-1 leading-5" style={{ fontFamily: 'Poppins_400Regular' }}>
                Contact the homeowner for a physical inspection first, then confirm final scope and pricing.
              </Text>
            </View>
            <Text className="text-blue-400 text-base mb-1" style={{ fontFamily: 'Poppins_500Medium' }}>
              {req.project.homeowner.email}
            </Text>
            <View className="flex-row items-center justify-between mt-1">
              <Text className="text-gray-300 text-base flex-1" style={{ fontFamily: 'Poppins_400Regular' }}>
                {req.project.homeowner.phone || 'Phone number not provided yet'}
              </Text>
              {!!req.project.homeowner.phone && (
                <TouchableOpacity
                  onPress={handleCallHomeowner}
                  className="ml-3 bg-blue-600/20 border border-blue-600 rounded-full px-3 py-2 flex-row items-center"
                >
                  <Phone size={14} color="#60A5FA" strokeWidth={2.5} />
                  <Text className="text-blue-300 text-xs ml-1" style={{ fontFamily: 'Poppins_600SemiBold' }}>
                    Call
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Action Buttons */}
          <View className="flex-row mb-8" style={{ gap: 12 }}>
            <TouchableOpacity
              onPress={handleReject}
              disabled={isSubmitting}
              className="flex-1 bg-red-600/20 border border-red-600/50 rounded-xl py-4 flex-row items-center justify-center"
              style={{ marginRight: 6 }}
            >
              <XCircle size={20} color="#EF4444" strokeWidth={2.5} />
              <Text className="text-red-400 text-base ml-2" style={{ fontFamily: 'Poppins_700Bold' }}>
                Decline
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleAccept}
              // Keep this clickable so validation can show alerts instead of "nothing happens"
              disabled={isSubmitting}
              className="flex-1 bg-blue-600 rounded-xl py-4 flex-row items-center justify-center"
              style={{
                opacity: (isSubmitting) ? 0.5 : 1,
                marginLeft: 6,
              }}
            >
              {isSubmitting ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <CheckCircle size={20} color="#FFFFFF" strokeWidth={2.5} />
                  <Text className="text-white text-base ml-2" style={{ fontFamily: 'Poppins_700Bold' }}>
                    Accept
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      <Modal
        visible={showRejectModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowRejectModal(false)}
      >
        <View className="flex-1 bg-black/60 justify-end">
          <View
            className="bg-[#1E3A5F] rounded-t-3xl border border-blue-900"
            style={{ paddingHorizontal: horizontalPad, paddingTop: 24, paddingBottom: scrollBottomPadding }}
          >
            <View className="flex-row items-start justify-between mb-4">
              <View className="flex-1 pr-3">
                <Text className="text-white text-xl" style={{ fontFamily: 'Poppins_700Bold' }}>
                  Decline Request
                </Text>
                <Text className="text-gray-300 text-sm mt-1" style={{ fontFamily: 'Poppins_400Regular' }}>
                  Select the reason so the homeowner understands why this request was declined.
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setShowRejectModal(false)}
                disabled={isSubmitting}
                className="w-10 h-10 bg-[#0A1628] rounded-full items-center justify-center"
              >
                <X size={20} color="#FFFFFF" strokeWidth={2} />
              </TouchableOpacity>
            </View>

            <View className="mb-4">
              {REJECTION_REASONS.map((reason) => {
                const selected = selectedRejectReasons.includes(reason);
                return (
                  <TouchableOpacity
                    key={reason}
                    onPress={() => toggleRejectReason(reason)}
                    disabled={isSubmitting}
                    className={`mb-2 rounded-xl border px-4 py-3 flex-row items-center ${
                      selected ? 'bg-red-600/20 border-red-500' : 'bg-[#0A1628] border-blue-900'
                    }`}
                    activeOpacity={0.8}
                  >
                    <View
                      className={`w-5 h-5 rounded border mr-3 items-center justify-center ${
                        selected ? 'bg-red-500 border-red-500' : 'border-gray-500'
                      }`}
                    >
                      {selected && (
                        <Text className="text-white text-xs" style={{ fontFamily: 'Poppins_700Bold' }}>
                          ✓
                        </Text>
                      )}
                    </View>
                    <Text className="text-white text-sm flex-1" style={{ fontFamily: 'Poppins_500Medium' }}>
                      {reason}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <TextInput
              className="bg-[#0A1628] rounded-xl px-4 py-3 text-white text-sm border border-blue-900 mb-5"
              style={{ fontFamily: 'Poppins_400Regular', minHeight: 76, textAlignVertical: 'top' }}
              placeholder="Optional extra detail"
              placeholderTextColor="#6B7280"
              value={customRejectReason}
              onChangeText={setCustomRejectReason}
              multiline
            />

            <View className="flex-row" style={{ gap: 12 }}>
              <TouchableOpacity
                onPress={() => setShowRejectModal(false)}
                disabled={isSubmitting}
                className="flex-1 bg-[#0A1628] rounded-xl py-4 items-center justify-center border border-blue-900"
              >
                <Text className="text-white text-base" style={{ fontFamily: 'Poppins_700Bold' }}>
                  Cancel
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={submitRejectRequest}
                disabled={isSubmitting}
                className="flex-1 bg-red-600 rounded-xl py-4 items-center justify-center"
                style={{ opacity: isSubmitting ? 0.6 : 1 }}
              >
                {isSubmitting ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text className="text-white text-base" style={{ fontFamily: 'Poppins_700Bold' }}>
                    Decline
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}


