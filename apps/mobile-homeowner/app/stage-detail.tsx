import { View, Text, ScrollView, TouchableOpacity, Image, Modal, ActivityIndicator, Linking, Alert } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { ArrowLeft, Package, Users, FileText, CheckCircle, Star, File, Video, Image as ImageIcon, Music, ChevronRight, Home, Phone, Download, Lock, CreditCard, Clock } from "lucide-react-native";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useProject } from '@/hooks/useProject';
import { projectService } from '@/services/projectService';

const getFileIcon = (type: string) => {
  switch (type) {
    case "pdf":
    case "doc":
      return <FileText size={20} color="#FFFFFF" strokeWidth={2} />;
    case "video":
      return <Video size={20} color="#FFFFFF" strokeWidth={2} />;
    case "image":
      return <ImageIcon size={20} color="#FFFFFF" strokeWidth={2} />;
    case "audio":
      return <Music size={20} color="#FFFFFF" strokeWidth={2} />;
    default:
      return <File size={20} color="#FFFFFF" strokeWidth={2} />;
  }
};

export default function StageDetailScreen() {
  const router = useRouter();
  const { id, stageId, name, status, projectId } = useLocalSearchParams();
  const actualStageId = stageId || id; // Handle both 'id' and 'stageId' params
  const [activeTab, setActiveTab] = useState<'materials' | 'team' | 'files'>('materials');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentApproved, setPaymentApproved] = useState(false);
  
  const queryClient = useQueryClient();
  
  // Approve payment mutation
  const approvePaymentMutation = useMutation({
    mutationFn: async () => {
      const projId = typeof projectId === 'string' ? projectId : projectId?.[0] || '';
      const stageIdValue = typeof actualStageId === 'string' ? actualStageId : actualStageId?.[0] || '';
      if (!projId || !stageIdValue) {
        throw new Error('Missing project ID or stage ID');
      }
      return projectService.approveStagePayment(projId, stageIdValue);
    },
    onSuccess: (_, variables) => {
      const projId = typeof projectId === 'string' ? projectId : projectId?.[0] || '';
      queryClient.invalidateQueries({ queryKey: ['project', projId] });
      setPaymentApproved(true);
      Alert.alert('Success', 'Payment approved! Work has begun on this stage.');
    },
    onError: (error: any) => {
      Alert.alert('Error', error?.message || 'Failed to approve payment');
    },
  });

  // Fetch project to get stage data
  const { data: project, isLoading: loadingProject } = useProject(projectId as string || '');

  const stage = project?.stages?.find((s: any) => s.id === actualStageId) as any;
  
  // Use actual stage status from project data, fallback to URL param
  const actualStatus = stage?.status || status;
  const isComplete = actualStatus === 'complete' || actualStatus === 'completed';
  const isInProgress = actualStatus === 'in-progress' || actualStatus === 'in_progress';
  const materials = stage?.materials || [];
  const teamMembers = stage?.teamMembers || [];
  const media = stage?.media || [];
  const documents = stage?.documents || [];

  const openReceipt = (url?: string) => {
    if (!url) return;
    Linking.openURL(url).catch(() => {});
  };

  const callSupplier = (phone?: string) => {
    if (!phone) return;
    Linking.openURL(`tel:${phone}`).catch(() => {});
  };

  const callTeamMember = (phone?: string) => {
    if (!phone) return;
    Linking.openURL(`tel:${phone}`).catch(() => {});
  };

  const openInvoice = (url?: string) => {
    if (!url) return;
    Linking.openURL(url).catch(() => {});
  };

  const downloadFile = (url?: string, fileName?: string) => {
    if (!url) return;
    Linking.openURL(url).catch(() => {});
  };
  const allFiles = [
    ...media.map((m: any) => ({ 
      ...m, 
      fileType: m.type === 'photo' ? 'image' : m.type === 'video' ? 'video' : 'file',
      isMedia: true, 
      name: m.caption || m.url?.split('/').pop() || 'Media',
      date: m.createdAt ? new Date(m.createdAt).toLocaleDateString() : 'Recent'
    })),
    ...documents.map((d: any) => ({ 
      ...d, 
      fileType: d.type === 'receipt' || d.type === 'invoice' ? 'pdf' : d.type === 'contract' ? 'doc' : 'file',
      isMedia: false, 
      name: d.name || d.url?.split('/').pop() || 'Document',
      date: d.createdAt ? new Date(d.createdAt).toLocaleDateString() : 'Recent'
    })),
  ];

  const handleApprovePayment = async () => {
    try {
      await approvePaymentMutation.mutateAsync();
      setTimeout(() => {
        setShowPaymentModal(false);
        router.canGoBack() ? router.back() : router.push('/(tabs)/home');
      }, 1500);
    } catch (error) {
      // Error is handled in mutation onError
    }
  };

  if (loadingProject) {
    return (
      <View className="flex-1 bg-white items-center justify-center">
        <ActivityIndicator size="large" color="#000000" />
        <Text className="text-gray-500 mt-4" style={{ fontFamily: 'Poppins_400Regular' }}>
          Loading stage details...
        </Text>
      </View>
    );
  }

  // Homebuilding manual payment gating (tracking locked until payment is confirmed)
  const projectType = (project as any)?.projectType as string | undefined;
  const paymentConfirmationStatus =
    ((project as any)?.paymentConfirmationStatus as string | undefined) || 'not_declared';
  const isTrackingLocked = projectType === 'homebuilding' && paymentConfirmationStatus !== 'confirmed';

  if (isTrackingLocked) {
    return (
      <View className="flex-1 bg-white items-center justify-center px-6">
        <View className="w-16 h-16 bg-gray-100 rounded-full items-center justify-center mb-4">
          <Lock size={28} color="#000000" strokeWidth={2} />
        </View>
        <Text className="text-black text-xl text-center" style={{ fontFamily: 'Poppins_700Bold' }}>
          Tracking locked
        </Text>
        <Text className="text-gray-600 text-sm text-center mt-2" style={{ fontFamily: 'Poppins_400Regular' }}>
          {paymentConfirmationStatus === 'declared'
            ? 'Your payment is under review (up to 72 hours). Tracking unlocks once confirmed.'
            : 'Complete your payment first to unlock stage tracking.'}
        </Text>

        <TouchableOpacity
          onPress={() => router.push('/billing-payments')}
          className="bg-black rounded-full py-4 px-8 mt-6"
        >
          <View className="flex-row items-center justify-center">
            {paymentConfirmationStatus === 'declared' ? (
              <Clock size={18} color="#FFFFFF" strokeWidth={2} />
            ) : (
              <CreditCard size={18} color="#FFFFFF" strokeWidth={2} />
            )}
            <Text className="text-white ml-2" style={{ fontFamily: 'Poppins_600SemiBold' }}>
              Billing & Payments
            </Text>
          </View>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-white">
      <View className="pt-16 px-6 pb-4">
        <View className="flex-row items-center mb-4">
          <TouchableOpacity 
            onPress={() => router.canGoBack() ? router.back() : router.push('/(tabs)/home')} 
            className="w-10 h-10 bg-gray-100 rounded-full items-center justify-center mr-3"
          >
            <ArrowLeft size={22} color="#000000" strokeWidth={2} />
          </TouchableOpacity>
          <TouchableOpacity 
            onPress={() => router.push('/(tabs)/home')} 
            className="w-10 h-10 bg-black rounded-full items-center justify-center"
          >
            <Home size={20} color="#FFFFFF" strokeWidth={2} />
          </TouchableOpacity>
        </View>
        
        <Text 
          className="text-3xl text-black mb-2"
          style={{ fontFamily: 'Poppins_800ExtraBold' }}
        >
          {name}
        </Text>
        <View className={`rounded-full px-3 py-1 self-start ${isComplete ? 'bg-black' : isInProgress ? 'bg-green-100 border border-green-600' : 'bg-gray-100 border border-black'}`}>
          <Text 
            className={`text-xs ${isComplete ? 'text-white' : isInProgress ? 'text-green-700' : 'text-black'}`}
            style={{ fontFamily: 'Poppins_500Medium' }}
          >
            {isComplete ? 'Complete' : isInProgress ? 'Work in Progress' : 'Pending Payment'}
          </Text>
        </View>
      </View>

      {/* Tab Navigation */}
      <View className="flex-row px-6 mb-4">
        <TouchableOpacity
          onPress={() => setActiveTab('materials')}
          className={`flex-1 py-3 border-b-2 ${
            activeTab === 'materials' ? 'border-black' : 'border-gray-200'
          }`}
        >
          <View className="flex-row items-center justify-center">
            <Package size={20} color={activeTab === 'materials' ? '#000000' : '#A3A3A3'} strokeWidth={2} />
            <Text 
              className={`ml-2 ${activeTab === 'materials' ? 'text-black' : 'text-gray-400'}`}
              style={{ fontFamily: 'Poppins_500Medium' }}
            >
              Materials
            </Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setActiveTab('team')}
          className={`flex-1 py-3 border-b-2 ${
            activeTab === 'team' ? 'border-black' : 'border-gray-200'
          }`}
        >
          <View className="flex-row items-center justify-center">
            <Users size={20} color={activeTab === 'team' ? '#000000' : '#A3A3A3'} strokeWidth={2} />
            <Text 
              className={`ml-2 ${activeTab === 'team' ? 'text-black' : 'text-gray-400'}`}
              style={{ fontFamily: 'Poppins_500Medium' }}
            >
              Team
            </Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setActiveTab('files')}
          className={`flex-1 py-3 border-b-2 ${
            activeTab === 'files' ? 'border-black' : 'border-gray-200'
          }`}
        >
          <View className="flex-row items-center justify-center">
            <FileText size={20} color={activeTab === 'files' ? '#000000' : '#A3A3A3'} strokeWidth={2} />
            <Text 
              className={`ml-2 ${activeTab === 'files' ? 'text-black' : 'text-gray-400'}`}
              style={{ fontFamily: 'Poppins_500Medium' }}
            >
              Files
            </Text>
          </View>
        </TouchableOpacity>
      </View>

      <ScrollView className="flex-1 px-6">
        {/* Materials Tab */}
        {activeTab === 'materials' && (
          <View className="pb-32">
            {materials.length === 0 ? (
              <View className="bg-gray-50 rounded-2xl p-6 items-center border border-gray-200">
                <Package size={48} color="#D4D4D4" strokeWidth={1.5} />
                <Text className="text-gray-400 text-lg mt-4" style={{ fontFamily: 'Poppins_600SemiBold' }}>
                  No Materials Yet
                </Text>
                <Text className="text-gray-500 text-sm mt-2 text-center" style={{ fontFamily: 'Poppins_400Regular' }}>
                  Materials will appear here once your GC adds them
                </Text>
              </View>
            ) : (
              materials.map((material: any, index: number) => (
                <View key={material.id || index} className="bg-white rounded-2xl mb-4 overflow-hidden border border-gray-200 relative">
                  <View className="flex-row">
                    {material.photoUrl ? (
                      <Image
                        source={{ uri: material.photoUrl }}
                        className="w-24 h-24 bg-gray-100"
                        resizeMode="cover"
                      />
                    ) : (
                      <View className="w-24 h-24 bg-gray-100 items-center justify-center">
                        <Package size={32} color="#A3A3A3" strokeWidth={2} />
                      </View>
                    )}
                    <View className="flex-1 p-4 justify-center">
                      <Text 
                        className="text-base text-black mb-1"
                        style={{ fontFamily: 'Poppins_700Bold' }}
                      >
                        {material.name}
                      </Text>
                      <Text 
                        className="text-gray-500 text-sm mb-2"
                        style={{ fontFamily: 'Poppins_400Regular' }}
                      >
                        {material.supplier || 'No supplier'} • {material.quantity} {material.unit}
                      </Text>
                      {material.brand && (
                        <Text 
                          className="text-gray-500 text-xs mb-2"
                          style={{ fontFamily: 'Poppins_400Regular' }}
                        >
                          Brand: {material.brand}
                        </Text>
                      )}
                      <Text 
                        className="text-black text-sm"
                        style={{ fontFamily: 'JetBrainsMono_500Medium' }}
                      >
                        ${(material.totalPrice || 0).toLocaleString()}
                      </Text>
                    </View>
                  </View>
                  {/* Quick actions - bottom right */}
                  <View className="absolute bottom-3 right-3 flex-row">
                    <TouchableOpacity
                      onPress={() => openReceipt(material.receiptUrl)}
                      className="w-8 h-8 rounded-full bg-black/80 items-center justify-center mr-2"
                      accessibilityLabel="Download receipt"
                    >
                      <Download size={16} color="#FFFFFF" strokeWidth={2} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => callSupplier(material.supplierContact || material.supplierPhone)}
                      className="w-8 h-8 rounded-full bg-emerald-600 items-center justify-center"
                      accessibilityLabel="Call supplier"
                    >
                      <Phone size={16} color="#FFFFFF" strokeWidth={2} />
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            )}
          </View>
        )}

        {/* Team Tab */}
        {activeTab === 'team' && (
          <View className="pb-32">
            {teamMembers.length === 0 ? (
              <View className="bg-gray-50 rounded-2xl p-6 items-center border border-gray-200">
                <Users size={48} color="#D4D4D4" strokeWidth={1.5} />
                <Text className="text-gray-400 text-lg mt-4" style={{ fontFamily: 'Poppins_600SemiBold' }}>
                  No Team Members Yet
                </Text>
                <Text className="text-gray-500 text-sm mt-2 text-center" style={{ fontFamily: 'Poppins_400Regular' }}>
                  Team members will appear here once your GC adds them
                </Text>
              </View>
            ) : (
              teamMembers.map((member: any, index: number) => (
                <View key={member.id || index} className="bg-white rounded-2xl mb-4 overflow-hidden border border-gray-200 relative">
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
                    <View className="flex-1 ml-4 justify-center">
                      <Text 
                        className="text-lg text-black mb-1"
                        style={{ fontFamily: 'Poppins_700Bold' }}
                      >
                        {member.name}
                      </Text>
                      <Text 
                        className="text-black mb-1"
                        style={{ fontFamily: 'Poppins_500Medium' }}
                      >
                        {member.role}
                      </Text>
                      {member.email && (
                        <Text 
                          className="text-gray-500 text-sm mb-1"
                          style={{ fontFamily: 'Poppins_400Regular' }}
                        >
                          ✉️ {member.email}
                        </Text>
                      )}
                      {member.dailyRate && (
                        <Text 
                          className="text-gray-500 text-xs mt-1"
                          style={{ fontFamily: 'Poppins_400Regular' }}
                        >
                          ${member.dailyRate.toLocaleString()}/{member.rateType || 'day'}
                        </Text>
                      )}
                    </View>
                  </View>
                  {/* Quick actions - bottom right */}
                  <View className="absolute bottom-3 right-3 flex-row">
                    <TouchableOpacity
                      onPress={() => openInvoice(member.invoiceUrl)}
                      className="w-8 h-8 rounded-full bg-black/80 items-center justify-center mr-2"
                      accessibilityLabel="Download invoice"
                    >
                      <Download size={16} color="#FFFFFF" strokeWidth={2} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => callTeamMember(member.phone)}
                      className="w-8 h-8 rounded-full bg-emerald-600 items-center justify-center"
                      accessibilityLabel="Call sub-contractor"
                    >
                      <Phone size={16} color="#FFFFFF" strokeWidth={2} />
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            )}
          </View>
        )}

        {/* Files Tab */}
        {activeTab === 'files' && (
          <View className="pb-32">
            {allFiles.length === 0 ? (
              <View className="bg-gray-50 rounded-2xl p-6 items-center border border-gray-200">
                <FileText size={48} color="#D4D4D4" strokeWidth={1.5} />
                <Text className="text-gray-400 text-lg mt-4" style={{ fontFamily: 'Poppins_600SemiBold' }}>
                  No Files Yet
                </Text>
                <Text className="text-gray-500 text-sm mt-2 text-center" style={{ fontFamily: 'Poppins_400Regular' }}>
                  Files, photos, and videos will appear here once your GC uploads them
                </Text>
              </View>
            ) : (
              allFiles.map((file: any, index: number) => (
                <View 
                  key={file.id || index}
                  className="bg-gray-50 rounded-2xl p-4 mb-3 flex-row items-center border border-gray-200"
                >
                  <View className="w-12 h-12 bg-black rounded-xl items-center justify-center">
                    {getFileIcon(file.fileType || 'file')}
                  </View>
                  <View className="flex-1 ml-4">
                    <Text 
                      className="text-black text-base"
                      style={{ fontFamily: 'Poppins_500Medium' }}
                      numberOfLines={1}
                    >
                      {file.name}
                    </Text>
                    <Text 
                      className="text-gray-500 text-sm"
                      style={{ fontFamily: 'Poppins_400Regular' }}
                    >
                      {file.date}
                    </Text>
                  </View>
                  {/* Download button */}
                  <TouchableOpacity
                    onPress={() => downloadFile(file.url, file.name)}
                    className="w-9 h-9 rounded-full bg-black items-center justify-center"
                    accessibilityLabel="Download file"
                  >
                    <Download size={16} color="#FFFFFF" strokeWidth={2} />
                  </TouchableOpacity>
                </View>
              ))
            )}
          </View>
        )}
      </ScrollView>

      {/* Fixed Bottom Section */}
      <View className="absolute bottom-0 left-0 right-0 bg-white px-6 py-6 border-t border-gray-200">
        {isComplete ? (
          <View className="bg-black rounded-2xl p-5">
            <View className="flex-row items-center justify-center mb-2">
              <CheckCircle size={24} color="#FFFFFF" strokeWidth={2} fill="#FFFFFF" />
              <Text 
                className="text-white text-lg ml-2"
                style={{ fontFamily: 'Poppins_700Bold' }}
              >
                Stage Completed!
              </Text>
            </View>
            <Text 
              className="text-white/70 text-center text-sm"
              style={{ fontFamily: 'Poppins_400Regular' }}
            >
              Congratulations! This stage has been successfully completed.
            </Text>
          </View>
        ) : isInProgress ? (
          <View className="bg-green-100 rounded-2xl p-5 border border-green-600">
            <View className="flex-row items-center justify-center mb-2">
              <CheckCircle size={24} color="#16A34A" strokeWidth={2} fill="#16A34A" />
              <Text 
                className="text-green-700 text-lg ml-2"
                style={{ fontFamily: 'Poppins_700Bold' }}
              >
                Payment Approved... Work in Progress
              </Text>
            </View>
            <Text 
              className="text-green-600 text-center text-sm"
              style={{ fontFamily: 'Poppins_400Regular' }}
            >
              Your GC is now working on this stage. They will mark it complete when finished.
            </Text>
          </View>
        ) : (
          <>
            <TouchableOpacity
              onPress={() => setShowPaymentModal(true)}
              className="bg-black rounded-full py-5 px-8"
              disabled={approvePaymentMutation.isPending}
            >
              {approvePaymentMutation.isPending ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text 
                  className="text-white text-lg text-center"
                  style={{ fontFamily: 'Poppins_700Bold' }}
                >
                  Approve Payment
                </Text>
              )}
            </TouchableOpacity>
            <Text 
              className="text-gray-500 text-xs text-center mt-3"
              style={{ fontFamily: 'Poppins_400Regular' }}
            >
              Approve payment to allow your GC to commence work on this stage
            </Text>
          </>
        )}
      </View>

      {/* Payment Modal */}
      <Modal
        visible={showPaymentModal}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setShowPaymentModal(false)}
      >
        <View className="flex-1 bg-black/50 justify-center items-center px-6">
          <View className="bg-white rounded-3xl p-8 w-full max-w-md">
            {!paymentApproved ? (
              <>
                <Text 
                  className="text-3xl text-black mb-4 text-center"
                  style={{ fontFamily: 'Poppins_800ExtraBold' }}
                >
                  Approve Payment
                </Text>
                
                <View className="bg-gray-50 rounded-2xl p-6 mb-6 border border-gray-200">
                  <View className="flex-row justify-between mb-3">
                    <Text 
                      className="text-gray-500"
                      style={{ fontFamily: 'Poppins_400Regular' }}
                    >
                      Stage
                    </Text>
                    <Text 
                      className="text-black"
                      style={{ fontFamily: 'Poppins_500Medium' }}
                    >
                      {name}
                    </Text>
                  </View>
                  
                  <View className="flex-row justify-between">
                    <Text 
                      className="text-gray-500"
                      style={{ fontFamily: 'Poppins_400Regular' }}
                    >
                      Amount
                    </Text>
                    <Text 
                      className="text-2xl text-black"
                      style={{ fontFamily: 'JetBrainsMono_500Medium' }}
                    >
                      ${(stage?.estimatedCost || 0).toLocaleString()}
                    </Text>
                  </View>
                </View>

                <View className="bg-gray-50 rounded-xl p-4 mb-6 border border-gray-200">
                  <Text 
                    className="text-gray-600 text-sm text-center"
                    style={{ fontFamily: 'Poppins_400Regular' }}
                  >
                    Once payment is approved, all materials and team members will be deployed to the site ASAP.
                  </Text>
                </View>

                <TouchableOpacity
                  onPress={handleApprovePayment}
                  className="bg-black rounded-full py-5 px-8 mb-3"
                >
                  <Text 
                    className="text-white text-lg text-center"
                    style={{ fontFamily: 'Poppins_700Bold' }}
                  >
                    Confirm Payment
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => setShowPaymentModal(false)}
                  className="py-3"
                >
                  <Text 
                    className="text-gray-500 text-center"
                    style={{ fontFamily: 'Poppins_500Medium' }}
                  >
                    Cancel
                  </Text>
                </TouchableOpacity>
              </>
            ) : (
              <View className="items-center py-8">
                <CheckCircle size={80} color="#000000" strokeWidth={2} fill="#000000" />
                <Text 
                  className="text-2xl text-black mt-6 text-center"
                  style={{ fontFamily: 'Poppins_800ExtraBold' }}
                >
                  Payment Approved!
                </Text>
                <Text 
                  className="text-gray-500 mt-2 text-center"
                  style={{ fontFamily: 'Poppins_400Regular' }}
                >
                  Materials and team will be deployed shortly.
                </Text>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}
