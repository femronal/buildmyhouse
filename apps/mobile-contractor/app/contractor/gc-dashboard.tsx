import { View, Text, ScrollView, TouchableOpacity, Image, ActivityIndicator, Modal } from "react-native";
import { useRouter } from "expo-router";
import { Bell, Settings, Briefcase, Clock, CheckCircle, DollarSign, Users, ChevronRight, Plus, MessageCircle, TrendingUp, Calendar, FileText, User, AlertCircle, X, Trash2, Lock } from "lucide-react-native";
import { useState, useMemo } from "react";
import { usePendingRequests } from "../../hooks/useGC";
import { useActiveProjects, useUnpaidProjects, useDeleteProject } from "../../hooks/useProjects";
import { useUserConversations } from "../../hooks/useChat";
import { useAppAlert } from "../../components/AppAlertProvider";
import { useGCProfile } from "@/hooks/useGCProfile";
import { getBackendAssetUrl } from "@/lib/image";

export default function GCDashboardScreen() {
  const router = useRouter();
  const { showAlert } = useAppAlert();
  const { data: profileData } = useGCProfile();
  const [activeTab, setActiveTab] = useState<'active' | 'pending'>('active');
  const [showUnpaidModal, setShowUnpaidModal] = useState(false);
  const [selectedUnpaidProject, setSelectedUnpaidProject] = useState<any | null>(null);
  const [showPausedModal, setShowPausedModal] = useState(false);
  const [selectedPausedProject, setSelectedPausedProject] = useState<any | null>(null);
  const deleteProjectMutation = useDeleteProject();
  
  // Fetch real pending requests
  const { data: pendingRequests = [], isLoading: loadingPendingRequests } = usePendingRequests();

  // Fetch real projects
  const { data: activeProjects = [], isLoading: loadingActive } = useActiveProjects();
  const { data: unpaidProjects = [], isLoading: loadingUnpaid } = useUnpaidProjects();
  
  // Fetch conversations with unread counts
  const { data: conversations = [] } = useUserConversations();
  const totalUnreadCount = useMemo(() => {
    return conversations.reduce((sum: number, conv: any) => sum + (conv.unreadCount || 0), 0);
  }, [conversations]);

  const handleUnpaidProjectPress = (project: any) => {
    setSelectedUnpaidProject(project);
    setShowUnpaidModal(true);
  };

  const handleCloseModal = () => {
    setShowUnpaidModal(false);
    setSelectedUnpaidProject(null);
  };

  const handlePausedProjectPress = (project: any) => {
    setSelectedPausedProject(project);
    setShowPausedModal(true);
  };

  const handleDeleteSelectedUnpaidProject = async () => {
    if (!selectedUnpaidProject?.id) return;

    showAlert(
      'Delete Unpaid Project?',
      `This will permanently delete "${selectedUnpaidProject.name}".\n\nOnly do this if the homeowner has taken too long to pay. This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteProjectMutation.mutateAsync(selectedUnpaidProject.id);
              showAlert('Deleted', 'Project deleted successfully.', [{ text: 'OK' }]);
              handleCloseModal();
            } catch (error: any) {
              showAlert('Delete Failed', error?.message || 'Failed to delete project. Please try again.', [
                { text: 'OK' },
              ]);
            }
          },
        },
      ],
    );
  };

  // Calculate totals from real data
  const totalEarnings = useMemo(() => {
    return activeProjects.reduce((sum, p) => sum + (p.spent || 0), 0);
  }, [activeProjects]);

  const totalBudget = useMemo(() => {
    return activeProjects.reduce((sum, p) => sum + (p.budget || 0), 0);
  }, [activeProjects]);

  // Format date helper
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    const month = date.toLocaleDateString('en-US', { month: 'short' });
    const year = date.getFullYear();
    return `${month} ${year}`;
  };

  // Get project image - use plan PDF or default
  const getProjectImage = (project: any) => {
    if (project.planPdfUrl) {
      // If there's a plan PDF, we could use a thumbnail
      // For now, use a default image based on project name
      return "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=400&q=80";
    }
    return "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=400&q=80";
  };

  return (
    <View className="flex-1 bg-[#0A1628]">
      {/* Header */}
      <View className="pt-16 px-6 pb-4 flex-row items-center justify-between">
        <View className="flex-row items-center">
          <Image
            source={{
              uri: profileData?.pictureUrl
                ? getBackendAssetUrl(profileData.pictureUrl)
                : "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80",
            }}
            className="w-12 h-12 rounded-full"
            resizeMode="cover"
          />
          <View className="ml-3">
            <Text className="text-gray-400 text-sm" style={{ fontFamily: 'Poppins_400Regular' }}>Welcome back,</Text>
            <Text className="text-white text-lg" style={{ fontFamily: 'Poppins_700Bold' }}>
              {profileData?.fullName
                ? (() => {
                    const [first, last] = profileData.fullName.split(' ');
                    return last ? `${first} ${last[0]}.` : first || '—';
                  })()
                : '—'}
            </Text>
          </View>
        </View>
        <View className="flex-row">
          <TouchableOpacity 
            onPress={() => router.push('/contractor/chat')}
            className="w-10 h-10 bg-[#1E3A5F] rounded-full items-center justify-center mr-2"
          >
            <MessageCircle size={20} color="#3B82F6" strokeWidth={2} />
            {totalUnreadCount > 0 && (
              <View className="absolute -top-1 -right-1 w-5 h-5 bg-red-600 rounded-full items-center justify-center border-2 border-[#0A1628]">
                <Text className="text-white text-xs" style={{ fontFamily: 'Poppins_700Bold' }}>
                  {totalUnreadCount > 9 ? '9+' : totalUnreadCount}
                </Text>
              </View>
            )}
          </TouchableOpacity>
          <TouchableOpacity 
            onPress={() => router.push('/contractor/gc-notifications')}
            className="w-10 h-10 bg-[#1E3A5F] rounded-full items-center justify-center mr-2"
          >
            <Bell size={20} color="#3B82F6" strokeWidth={2} />
          </TouchableOpacity>
          <TouchableOpacity 
            onPress={() => router.push('/contractor/gc-profile')}
            className="w-10 h-10 bg-[#1E3A5F] rounded-full items-center justify-center"
          >
            <User size={20} color="#3B82F6" strokeWidth={2} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Stats Cards */}
        <View className="px-6 mb-6">
          <View className="flex-row">
            <View className="flex-1 bg-blue-600 rounded-2xl p-4 mr-2">
              <View className="flex-row items-center mb-2">
                <Briefcase size={18} color="#FFFFFF" strokeWidth={2} />
                <Text className="text-white/70 text-xs ml-2" style={{ fontFamily: 'Poppins_400Regular' }}>Active Projects</Text>
              </View>
              <Text className="text-white text-2xl" style={{ fontFamily: 'Poppins_800ExtraBold' }}>{activeProjects.length}</Text>
            </View>
            <View className="flex-1 bg-[#1E3A5F] rounded-2xl p-4 ml-2 border border-blue-900">
              <View className="flex-row items-center mb-2">
                <Clock size={18} color="#F59E0B" strokeWidth={2} />
                <Text className="text-gray-400 text-xs ml-2" style={{ fontFamily: 'Poppins_400Regular' }}>Unpaid</Text>
              </View>
              <Text className="text-white text-2xl" style={{ fontFamily: 'Poppins_800ExtraBold' }}>{unpaidProjects.length}</Text>
            </View>
          </View>

          <View className="bg-[#1E3A5F] rounded-2xl p-5 mt-4 border border-blue-900">
            <View className="flex-row justify-between items-start mb-4">
              <View>
                <Text className="text-gray-400 text-xs" style={{ fontFamily: 'Poppins_400Regular' }}>Total Earnings</Text>
                <Text className="text-white text-2xl" style={{ fontFamily: 'JetBrainsMono_500Medium' }}>${totalEarnings.toLocaleString()}</Text>
              </View>
              <View className="bg-green-600/20 rounded-full px-3 py-1 flex-row items-center">
                <TrendingUp size={14} color="#10B981" strokeWidth={2} />
                <Text className="text-green-400 text-xs ml-1" style={{ fontFamily: 'Poppins_600SemiBold' }}>+12.5%</Text>
              </View>
            </View>
            <View className="h-2 bg-blue-900 rounded-full overflow-hidden">
              <View className="h-full bg-blue-600 rounded-full" style={{ width: `${(totalEarnings / totalBudget) * 100}%` }} />
            </View>
            <Text className="text-gray-500 text-xs mt-2" style={{ fontFamily: 'Poppins_400Regular' }}>
              ${totalEarnings.toLocaleString()} of ${totalBudget.toLocaleString()} total project value
            </Text>
          </View>
        </View>

        {/* Projects Section */}
        <View className="px-6 mb-6">
          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-white text-3xl" style={{ fontFamily: 'Poppins_800ExtraBold' }}>Projects</Text>
            <View className="flex-row bg-[#1E3A5F] rounded-full p-1">
              <TouchableOpacity 
                onPress={() => setActiveTab('active')}
                className={`px-4 py-2 rounded-full ${activeTab === 'active' ? 'bg-blue-600' : ''}`}
              >
                <Text className={`text-xs ${activeTab === 'active' ? 'text-white' : 'text-gray-400'}`} style={{ fontFamily: 'Poppins_600SemiBold' }}>Active</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                onPress={() => setActiveTab('pending')}
                className={`px-4 py-2 rounded-full ${activeTab === 'pending' ? 'bg-blue-600' : ''}`}
              >
                <Text className={`text-xs ${activeTab === 'pending' ? 'text-white' : 'text-gray-400'}`} style={{ fontFamily: 'Poppins_600SemiBold' }}>Unpaid</Text>
              </TouchableOpacity>
            </View>
          </View>

          {activeTab === 'active' ? (
            loadingActive ? (
              <View className="py-10 items-center">
                <ActivityIndicator size="large" color="#3B82F6" />
                <Text className="text-gray-400 mt-4" style={{ fontFamily: 'Poppins_400Regular' }}>
                  Loading active projects...
                </Text>
              </View>
            ) : activeProjects.length === 0 ? (
              <View className="items-center py-10">
                <Briefcase size={48} color="#6B7280" strokeWidth={1.5} />
                <Text className="text-gray-400 text-lg mt-4" style={{ fontFamily: 'Poppins_600SemiBold' }}>
                  No Active Projects
                </Text>
                <Text className="text-gray-500 text-sm mt-2" style={{ fontFamily: 'Poppins_400Regular' }}>
                  Projects you've reviewed and been paid for will appear here
                </Text>
              </View>
            ) : (
            activeProjects.map((project) => (
              <TouchableOpacity
                key={project.id}
                onPress={() => {
                  if (project.status === 'paused') {
                    handlePausedProjectPress(project);
                    return;
                  }
                  router.push(`/contractor/gc-project-detail?id=${project.id}`);
                }}
                className="bg-[#1E3A5F] rounded-2xl mb-4 overflow-hidden border border-blue-900"
              >
                  <Image source={{ uri: getProjectImage(project) }} className="w-full h-32" resizeMode="cover" />
                <View className="p-4">
                  <View className="flex-row justify-between items-start mb-2">
                    <View className="flex-1">
                      <Text className="text-white text-2xl" style={{ fontFamily: 'Poppins_800ExtraBold' }}>{project.name}</Text>
                        <Text className="text-gray-400 text-lg" style={{ fontFamily: 'Poppins_500Medium' }}>
                          {project.homeowner?.fullName || 'Unknown Client'}
                        </Text>
                      </View>
                      <View className={`${project.status === 'paused' ? 'bg-orange-600/20' : 'bg-green-600/20'} rounded-full px-3 py-1 flex-row items-center`}>
                        {project.status === 'paused' && <Lock size={12} color="#F59E0B" strokeWidth={2.5} />}
                        <Text
                          className={`${project.status === 'paused' ? 'text-orange-300' : 'text-green-400'} text-xs ${project.status === 'paused' ? 'ml-1' : ''}`}
                          style={{ fontFamily: 'Poppins_600SemiBold' }}
                        >
                          {project.status === 'paused' ? 'Paused' : 'Active'}
                        </Text>
                      </View>
                    </View>
                    
                    {project.currentStage && (
                      <View className="mb-2">
                        <View className="bg-blue-600/20 rounded-full px-3 py-1 self-start">
                      <Text className="text-blue-400 text-xs" style={{ fontFamily: 'Poppins_600SemiBold' }}>{project.currentStage}</Text>
                    </View>
                  </View>
                    )}
                  
                  <View className="mb-3">
                    <View className="flex-row justify-between mb-1">
                      <Text className="text-gray-500 text-xs" style={{ fontFamily: 'Poppins_400Regular' }}>Progress</Text>
                        <Text className="text-white text-xs" style={{ fontFamily: 'Poppins_600SemiBold' }}>{project.progress || 0}%</Text>
                    </View>
                    <View className="h-2 bg-blue-900 rounded-full overflow-hidden">
                        <View className="h-full bg-blue-600 rounded-full" style={{ width: `${project.progress || 0}%` }} />
                    </View>
                  </View>

                    <View className="flex-row justify-between items-center">
                    <View>
                      <Text className="text-gray-500 text-xs" style={{ fontFamily: 'Poppins_400Regular' }}>Earned</Text>
                        <Text className="text-white" style={{ fontFamily: 'JetBrainsMono_500Medium' }}>${(project.spent || 0).toLocaleString()}</Text>
                      </View>
                      <View>
                        <Text className="text-gray-500 text-xs" style={{ fontFamily: 'Poppins_400Regular' }}>Budget</Text>
                        <Text className="text-white" style={{ fontFamily: 'JetBrainsMono_500Medium' }}>${(project.budget || 0).toLocaleString()}</Text>
                    </View>
                    <View>
                      <Text className="text-gray-500 text-xs" style={{ fontFamily: 'Poppins_400Regular' }}>Due Date</Text>
                        <Text className="text-white" style={{ fontFamily: 'Poppins_500Medium' }}>{formatDate(project.dueDate)}</Text>
                    </View>
                    <ChevronRight size={24} color="#3B82F6" strokeWidth={2} />
                  </View>
                </View>
              </TouchableOpacity>
            ))
            )
          ) : loadingUnpaid ? (
            <View className="py-10 items-center">
              <ActivityIndicator size="large" color="#3B82F6" />
              <Text className="text-gray-400 mt-4" style={{ fontFamily: 'Poppins_400Regular' }}>
                Loading unpaid projects...
              </Text>
            </View>
          ) : unpaidProjects.length === 0 ? (
            <View className="items-center py-10">
              <Clock size={48} color="#6B7280" strokeWidth={1.5} />
              <Text className="text-gray-400 text-lg mt-4" style={{ fontFamily: 'Poppins_600SemiBold' }}>
                No Unpaid Projects
              </Text>
              <Text className="text-gray-500 text-sm mt-2" style={{ fontFamily: 'Poppins_400Regular' }}>
                Projects you've reviewed but haven't been paid for will appear here
              </Text>
            </View>
          ) : (
            unpaidProjects.map((project) => (
              <TouchableOpacity
                key={project.id}
                onPress={() => handleUnpaidProjectPress(project)}
                className="bg-[#1E3A5F] rounded-2xl mb-4 overflow-hidden border border-orange-900"
              >
                <Image source={{ uri: getProjectImage(project) }} className="w-full h-32" resizeMode="cover" />
                <View className="p-4">
                  <View className="flex-row justify-between items-start mb-2">
                  <View className="flex-1">
                      <Text className="text-white text-2xl" style={{ fontFamily: 'Poppins_800ExtraBold' }}>{project.name}</Text>
                      <Text className="text-gray-400 text-lg" style={{ fontFamily: 'Poppins_500Medium' }}>
                        {project.homeowner?.fullName || 'Unknown Client'}
                    </Text>
                  </View>
                    <View className="bg-orange-600/20 rounded-full px-3 py-1">
                      <Text className="text-orange-400 text-xs" style={{ fontFamily: 'Poppins_600SemiBold' }}>Unpaid</Text>
                    </View>
                  </View>
                  
                <Text className="text-gray-500 text-sm mb-3" style={{ fontFamily: 'Poppins_400Regular' }}>
                    {project.address}
                </Text>

                <View className="flex-row justify-between items-center">
                  <View>
                    <Text className="text-gray-500 text-xs" style={{ fontFamily: 'Poppins_400Regular' }}>Budget</Text>
                      <Text className="text-white" style={{ fontFamily: 'JetBrainsMono_500Medium' }}>${(project.budget || 0).toLocaleString()}</Text>
                    </View>
                    <View>
                      <Text className="text-gray-500 text-xs" style={{ fontFamily: 'Poppins_400Regular' }}>Status</Text>
                      <Text className="text-orange-400 text-sm" style={{ fontFamily: 'Poppins_600SemiBold' }}>
                        {project.status === 'pending_payment' ? 'Pending Payment' : project.status}
                    </Text>
                  </View>
                    <ChevronRight size={24} color="#3B82F6" strokeWidth={2} />
                  </View>
                </View>
              </TouchableOpacity> 
            )) 
          )} 
        </View>
      </ScrollView>

      {/* Unpaid Project Modal */}
      <Modal
        visible={showUnpaidModal}
        transparent={true}
        animationType="fade"
        onRequestClose={handleCloseModal}
      >
        <View className="flex-1 bg-black/50 items-center justify-center px-6">
          <View className="bg-[#1E3A5F] rounded-3xl p-6 w-full max-w-md border border-orange-600/50">
            {/* Warning Icon */}
            <View className="items-center mb-4">
              <View className="w-16 h-16 bg-orange-600/20 rounded-full items-center justify-center mb-3">
                <AlertCircle size={32} color="#F59E0B" strokeWidth={2} />
              </View>
              <Text className="text-white text-xl text-center mb-2" style={{ fontFamily: 'Poppins_700Bold' }}>
                Project Dashboard Unavailable
              </Text>
              <Text className="text-gray-300 text-sm text-center leading-5" style={{ fontFamily: 'Poppins_400Regular' }}>
                The project dashboard for "{selectedUnpaidProject?.name || 'this project'}" cannot be accessed at this time.
              </Text>
            </View>

            {/* Warning Message */}
            <View className="bg-orange-900/30 border border-orange-700/50 rounded-xl p-4 mb-6">
              <View className="flex-row items-start">
                <View className="mr-2 mt-0.5">
                  <DollarSign size={18} color="#F59E0B" strokeWidth={2} />
                </View>
                <View className="flex-1">
                  <Text className="text-orange-300 text-sm leading-5" style={{ fontFamily: 'Poppins_500Medium' }}>
                    The homeowner has not yet paid 100% of the project fees. Once payment is received and the project status becomes active, you'll be able to access the full project dashboard.
                  </Text>
                </View>
              </View>
            </View>

            {/* Project Info */}
            {selectedUnpaidProject && (
              <View className="bg-[#0A1628] rounded-xl p-4 mb-6 border border-blue-900">
                <Text className="text-gray-400 text-xs mb-2" style={{ fontFamily: 'Poppins_400Regular' }}>
                  Project Details
                </Text>
                <Text className="text-white text-base mb-1" style={{ fontFamily: 'Poppins_600SemiBold' }}>
                  {selectedUnpaidProject.name}
                </Text>
                <Text className="text-gray-400 text-sm mb-2" style={{ fontFamily: 'Poppins_400Regular' }}>
                  {selectedUnpaidProject.homeowner?.fullName || 'Unknown Client'}
                </Text>
                <View className="flex-row items-center justify-between pt-2 border-t border-blue-900">
                  <Text className="text-gray-500 text-xs" style={{ fontFamily: 'Poppins_400Regular' }}>
                    Budget
                  </Text>
                  <Text className="text-white text-sm" style={{ fontFamily: 'JetBrainsMono_500Medium' }}>
                    ${(selectedUnpaidProject.budget || 0).toLocaleString()}
                  </Text>
                </View>
              </View>
            )}

            {/* Action Buttons */}
            <View className="flex-row" style={{ gap: 12 }}>
              <TouchableOpacity
                onPress={handleCloseModal}
                disabled={deleteProjectMutation.isPending}
                className="flex-1 bg-blue-600 rounded-xl py-4 items-center"
                style={{ opacity: deleteProjectMutation.isPending ? 0.6 : 1 }}
              >
                <Text className="text-white text-base" style={{ fontFamily: 'Poppins_700Bold' }}>
                  Close
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleDeleteSelectedUnpaidProject}
                disabled={deleteProjectMutation.isPending}
                className="flex-1 bg-red-600/20 border border-red-600/50 rounded-xl py-4 items-center flex-row justify-center"
                style={{ opacity: deleteProjectMutation.isPending ? 0.6 : 1 }}
              >
                {deleteProjectMutation.isPending ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Trash2 size={18} color="#EF4444" strokeWidth={2.5} />
                    <Text className="text-red-400 text-base ml-2" style={{ fontFamily: 'Poppins_700Bold' }}>
                      Delete
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Paused Project Modal */}
      <Modal
        visible={showPausedModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowPausedModal(false)}
      >
        <View className="flex-1 bg-black/50 items-center justify-center px-6">
          <View className="bg-[#1E3A5F] rounded-3xl p-6 w-full max-w-md border border-orange-600/50">
            <View className="flex-row items-center justify-between mb-2">
              <Text className="text-white text-xl" style={{ fontFamily: 'Poppins_700Bold' }}>
                Project paused
              </Text>
              <TouchableOpacity
                onPress={() => setShowPausedModal(false)}
                className="w-10 h-10 bg-black/30 rounded-full items-center justify-center"
              >
                <X size={18} color="#FFFFFF" strokeWidth={2.5} />
              </TouchableOpacity>
            </View>

            <Text className="text-gray-300 text-sm mb-4" style={{ fontFamily: 'Poppins_400Regular' }}>
              Admin has temporarily paused{selectedPausedProject?.name ? ` “${selectedPausedProject.name}”` : ' this project'} while an issue is reviewed.
            </Text>

            <View className="bg-orange-900/30 border border-orange-700/50 rounded-2xl p-4 mb-4">
              <Text className="text-orange-200 text-sm mb-2" style={{ fontFamily: 'Poppins_700Bold' }}>
                Common real‑life reasons projects get paused
              </Text>
              {[
                'A complaint from the homeowner or contractor that needs investigation',
                'A payment dispute or suspected fraudulent transaction',
                'Missing/invalid documents (permits, invoices, proof of delivery)',
                'Quality or safety concerns reported on-site',
                'Major change-order disagreement (scope or cost)',
                'Suspicious activity on the account or unusual behavior',
              ].map((reason) => (
                <View key={reason} className="flex-row items-start mb-2">
                  <View className="w-2 h-2 bg-orange-400 rounded-full mt-2 mr-2" />
                  <Text className="text-orange-100 text-xs flex-1" style={{ fontFamily: 'Poppins_400Regular' }}>
                    {reason}
                  </Text>
                </View>
              ))}
            </View>

            <View className="bg-[#0A1628] border border-blue-900 rounded-2xl p-4">
              <Text className="text-white text-sm" style={{ fontFamily: 'Poppins_600SemiBold' }}>
                What you should do now
              </Text>
              <Text className="text-gray-400 text-xs mt-1" style={{ fontFamily: 'Poppins_400Regular' }}>
                Please wait while admin resolves the issue. You’ll be able to continue once the project is activated again.
              </Text>
            </View>

            <TouchableOpacity
              onPress={() => setShowPausedModal(false)}
              className="bg-blue-600 rounded-2xl py-4 items-center mt-5"
            >
              <Text className="text-white text-base" style={{ fontFamily: 'Poppins_700Bold' }}>
                Okay, I’ll wait for admin
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Bottom Navigation - Bigger, Clearer */}
      <View className="flex-row bg-[#0A1628] border-t border-blue-900 px-4 py-4">
        <TouchableOpacity 
          onPress={() => router.push('/contractor/gc-dashboard')}
          className="flex-1 items-center active:opacity-70"
        >
          <View className="p-3 rounded-2xl bg-blue-600/20 mb-1">
            <Briefcase size={30} color="#3B82F6" strokeWidth={3} />
          </View>
          <Text className="text-blue-400 text-base mt-1" style={{ fontFamily: 'Poppins_700Bold' }}>Projects</Text>
        </TouchableOpacity>
        <TouchableOpacity  
          onPress={() => router.push('/contractor/chat')}
          className="flex-1 items-center active:opacity-70"
        >
          <View className="p-3 rounded-2xl bg-[#1E3A5F] mb-1">
            <Users size={30} color="#6B7280" strokeWidth={2.5} />
          </View>
        
          <Text className="text-gray-500 text-base mt-1" style={{ fontFamily: 'Poppins_600SemiBold' }}>Clients</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          onPress={() => {
            router.push('/contractor/gc-requests');
          }}
          className="flex-1 items-center active:opacity-70"
        >
          <View className="p-3 rounded-2xl bg-[#1E3A5F] mb-1 relative">
            <Bell size={30} color="#6B7280" strokeWidth={2.5} />
            {pendingRequests.length > 0 && (
              <View className="absolute -top-1 -right-1 bg-red-500 rounded-full w-4 h-4 items-center justify-center border-2 border-[#0A1628]">
              </View>
            )}
          </View>
          <Text className="text-gray-500 text-base mt-1" style={{ fontFamily: 'Poppins_600SemiBold' }}>
            Requests
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          onPress={() => router.push('/contractor/gc-plans')}
          className="flex-1 items-center active:opacity-70"
        >
          <View className="p-3 rounded-2xl bg-[#1E3A5F] mb-1">
            <FileText size={30} color="#6B7280" strokeWidth={2.5} />
          </View>
          <Text className="text-gray-500 text-base mt-1" style={{ fontFamily: 'Poppins_600SemiBold' }}>Plans</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          onPress={() => router.push('/contractor/gc-earnings')}
          className="flex-1 items-center active:opacity-70"
        >
          <View className="p-3 rounded-2xl bg-[#1E3A5F] mb-1">
            <DollarSign size={30} color="#6B7280" strokeWidth={2.5} />
          </View>
          <Text className="text-gray-500 text-base mt-1" style={{ fontFamily: 'Poppins_600SemiBold' }}>Earnings</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
