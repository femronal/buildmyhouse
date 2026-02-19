import { View, Text, ScrollView, TouchableOpacity, Image, Modal, useWindowDimensions, ActivityIndicator, Alert } from "react-native";
import { useRouter } from "expo-router";
import { User, Bell, Plus, ChevronRight, MapPin, Home, X, Check, LandPlot, FileCheck, Clock, Bed, Bath, Maximize, Car, Lock } from "lucide-react-native";
import { useState } from "react";
import { useQueryClient } from '@tanstack/react-query';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useActiveProjects, usePendingProjects, usePausedProjects, useHousesForSale, useLandsForSale } from '@/hooks';
import { useScheduleHouseViewing } from '@/hooks/useHouseViewing';
import { useScheduleLandViewing } from '@/hooks/useLandViewing';
import { useCreatePaymentIntent } from '@/hooks/usePayment';
import { useActivateProject } from '@/hooks';
import PaymentModal from '@/components/PaymentModal';
import ImageCarousel from '@/components/ImageCarousel';
import { getBackendAssetUrl } from '@/lib/image';

export default function HomeScreen() {
  const router = useRouter();
  const { width: screenWidth } = useWindowDimensions();
  const { data: currentUser, isLoading: userLoading } = useCurrentUser();
  const { data: housesForSale = [], isLoading: loadingHouses } = useHousesForSale();
  const { data: landsForSale = [], isLoading: loadingLands } = useLandsForSale();
  const { data: activeProjects = [], isLoading: loadingActive } = useActiveProjects();
  const { data: pendingProjects = [], isLoading: loadingPending } = usePendingProjects();
  const { data: pausedProjects = [], isLoading: loadingPaused } = usePausedProjects();
  const createPaymentIntentMutation = useCreatePaymentIntent();
  const activateProjectMutation = useActivateProject();
  const scheduleViewingMutation = useScheduleHouseViewing();
  const scheduleLandViewingMutation = useScheduleLandViewing();
  const queryClient = useQueryClient();
  
  const [showBuyModal, setShowBuyModal] = useState(false);
  const [selectedHome, setSelectedHome] = useState<any | null>(null);
  const [buySuccess, setBuySuccess] = useState(false);
  const [showLandModal, setShowLandModal] = useState(false);
  const [selectedLand, setSelectedLand] = useState<any | null>(null);
  const [landSuccess, setLandSuccess] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedProjectForPayment, setSelectedProjectForPayment] = useState<any>(null);
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [projectBudget, setProjectBudget] = useState<number>(0);
  const [paymentClientSecret, setPaymentClientSecret] = useState<string | null>(null);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [showPausedModal, setShowPausedModal] = useState(false);
  const [selectedPausedProject, setSelectedPausedProject] = useState<any>(null);
  
  const userName = currentUser?.fullName || 'User';
  const userPicture = currentUser?.pictureUrl;
  
  // Combine active and pending projects for display, ensuring no duplicates
  // IMPORTANT: Use actual project.status to determine if paid, not just which array it came from
  const activeProjectsWithStatus = activeProjects.map((p: any) => ({ 
    ...p, 
    // Only mark as paid if status is actually 'active'
    isPaid: p.status === 'active',
    uniqueKey: `active-${p.id || p.projectId || Math.random()}`
  }));
  const pendingProjectsWithStatus = pendingProjects.map((p: any) => ({ 
    ...p, 
    // Only mark as unpaid if status is actually 'pending_payment'
    isPaid: p.status === 'active', // Check actual status, not array source
    uniqueKey: `pending-${p.id || p.projectId || Math.random()}`
  }));

  const pausedProjectsWithStatus = pausedProjects.map((p: any) => ({
    ...p,
    // Paused projects should never be treated as "paid/openable"
    isPaid: false,
    uniqueKey: `paused-${p.id || p.projectId || Math.random()}`,
  }));
  
  // Filter out duplicates by project ID (in case a project appears in both arrays)
  // Prefer the one with status='active' if there's a conflict
  const projectIds = new Set<string>();
  const allProjects = [
    ...activeProjectsWithStatus,
    ...pendingProjectsWithStatus,
    ...pausedProjectsWithStatus,
  ].filter((project: any) => {
    const projectId = project.id || project.projectId;
    if (!projectId) return false; // Skip projects without IDs
    if (projectIds.has(projectId)) {
      // If duplicate, prefer the one with status='active'
      return false;
    }
    projectIds.add(projectId);
    return true;
  }).map((project: any) => {
    // Ensure isPaid is based on actual status, not array source
    return {
      ...project,
      isPaid: project.status === 'active'
    };
  });

  const handleProjectPress = async (project: any) => {
    if (project.status === 'paused') {
      setSelectedPausedProject(project);
      setShowPausedModal(true);
      return;
    }
    if (project.isPaid) {
      // Active project - go to dashboard
      router.push(`/dashboard?projectId=${project.id || project.projectId}`);
    } else {
      // Unpaid project - show payment modal
      const budget = project.budget || project.acceptedRequest?.estimatedBudget || project.gcEditedAnalysis?.budget || 0;
      let amount = budget * 1.0;
      
      // Stripe maximum amount is $999,999.99 (in dollars, not cents)
      const STRIPE_MAX_AMOUNT = 999999.99;
      if (amount > STRIPE_MAX_AMOUNT) {
        setPaymentError(`Payment amount ($${amount.toLocaleString()}) exceeds the maximum allowed amount of $${STRIPE_MAX_AMOUNT.toLocaleString()}. Please contact support.`);
        setShowPaymentModal(true);
        setIsProcessingPayment(false);
        return;
      }
      
      if (amount <= 0) {
        return;
      }

      setSelectedProjectForPayment(project);
      setPaymentAmount(amount);
      setProjectBudget(budget);
      setPaymentClientSecret(null);
      setIsProcessingPayment(true);
      setShowPaymentModal(true);
      setPaymentError(null);

      try {
        const paymentResult = await createPaymentIntentMutation.mutateAsync({
          amount,
          projectId: project.id || project.projectId,
          currency: 'usd',
          description: `Project activation payment - ${project.name || 'Project'}`,
        });

        if (paymentResult?.paymentIntent?.clientSecret) {
          setPaymentClientSecret(paymentResult.paymentIntent.clientSecret);
          setIsProcessingPayment(false);
        } else {
          setPaymentError('Payment intent created but no client secret received.');
          setIsProcessingPayment(false);
        }
      } catch (error: any) {
        setPaymentError(error?.message || 'Failed to create payment intent');
        setIsProcessingPayment(false);
      }
    }
  };

  const handlePaymentSuccess = async () => {
    if (!selectedProjectForPayment) return;

    try {
      await activateProjectMutation.mutateAsync(selectedProjectForPayment.id || selectedProjectForPayment.projectId);
      
      // Invalidate all project queries to ensure UI updates
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['projects', 'active'] });
      queryClient.invalidateQueries({ queryKey: ['projects', 'pending'] });
      
      setShowPaymentModal(false);
      setSelectedProjectForPayment(null);
      router.push(`/dashboard?projectId=${selectedProjectForPayment.id || selectedProjectForPayment.projectId}`);
    } catch (error: any) {
      setPaymentError(error?.message || 'Failed to activate project');
    }
  };

  const handlePaymentError = (error: string) => {
    setPaymentError(error);
    setIsProcessingPayment(false);
  };

  const getHouseImageUrl = (house: any) => {
    const firstImg = house?.images?.[0]?.url;
    return firstImg ? getBackendAssetUrl(firstImg) : 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=600&q=80';
  };

  const handleBuyHome = (home: any) => {
    setSelectedHome(home);
    setBuySuccess(false);
    setShowBuyModal(true);
  };

  const confirmBuyHome = async () => {
    if (!selectedHome?.id) return;
    try {
      await scheduleViewingMutation.mutateAsync(selectedHome.id);
      setBuySuccess(true);
      setTimeout(() => {
        setShowBuyModal(false);
        setBuySuccess(false);
      }, 2000);
    } catch (error: any) {
      Alert.alert(
        'Could not schedule viewing',
        error?.message || 'Please try again.',
      );
    }
  };

  const handleLandPurchase = (land: any) => {
    setSelectedLand(land);
    setLandSuccess(false);
    setShowLandModal(true);
  };

  const confirmLandPurchase = async () => {
    if (!selectedLand?.id) return;
    try {
      await scheduleLandViewingMutation.mutateAsync(selectedLand.id);
      setLandSuccess(true);
      setTimeout(() => {
        setShowLandModal(false);
        setLandSuccess(false);
      }, 2000);
    } catch (error: any) {
      Alert.alert(
        'Could not schedule land viewing',
        error?.message || 'Please try again.',
      );
    }
  };

  return (
    <View className="flex-1 bg-white">
      {/* Header */}
      <View className="pt-16 px-6 pb-4 flex-row items-center justify-between">
        <TouchableOpacity 
          onPress={() => router.push('/profile')}
          className="w-12 h-12 bg-black rounded-full items-center justify-center overflow-hidden"
        >
          {userPicture ? (
            <Image 
              source={{ uri: getBackendAssetUrl(userPicture) }} 
              className="w-full h-full"
              resizeMode="cover"
            />
          ) : (
            <User size={24} color="#FFFFFF" strokeWidth={2.5} />
          )}
        </TouchableOpacity>
        
        <Text 
          className="text-2xl text-black"
          style={{ fontFamily: 'Poppins_600SemiBold' }}
        >
          BuildMyHouse
        </Text>
        
        <TouchableOpacity 
          onPress={() => router.push('/notifications')}
          className="w-12 h-12 bg-gray-100 rounded-full items-center justify-center"
        >
          <Bell size={24} color="#000000" strokeWidth={2.5} />
          <View className="absolute top-2 right-2 w-3 h-3 bg-black rounded-full" />
        </TouchableOpacity>
      </View>

      <ScrollView className="flex-1 px-6" contentContainerStyle={{ paddingBottom: 100 }}>
        {/* Welcome Section */}
        <View className="mb-8">
          <Text 
            className="text-4xl text-black mb-2"
            style={{ fontFamily: 'Poppins_600SemiBold' }}
          >
            Welcome back,
          </Text>
          <Text 
            className="text-4xl text-black"
            style={{ fontFamily: 'Poppins_600SemiBold' }}
          >
            {userName.split(' ')[0]} 👋
          </Text>
        </View>

        {/* Start New Project */}
        <TouchableOpacity
          onPress={() => router.push('/location?mode=explore')}
          className="bg-black rounded-3xl p-6 mb-8 flex-row items-center justify-between"
        >
          <View className="flex-1">
          <Text 
            className="text-white text-xl mb-2"
            style={{ fontFamily: 'Poppins_600SemiBold' }}
          >
            Start New Project
          </Text>
            <Text 
              className="text-white/70"
              style={{ fontFamily: 'Poppins_400Regular' }}
            >
              Build your dream home today
            </Text>
          </View>
          <View className="w-14 h-14 bg-white rounded-full items-center justify-center">
            <Plus size={28} color="#000000" strokeWidth={2.5} />
          </View>
        </TouchableOpacity>

        {/* Current Projects */}
        <View className="mb-8">
          <Text 
            className="text-2xl text-black mb-4"
            style={{ fontFamily: 'Poppins_600SemiBold' }}
          >
            Your Projects
          </Text>

          {(loadingActive || loadingPending || loadingPaused) ? (
            <View className="bg-gray-50 rounded-3xl p-8 items-center border border-gray-200">
              <ActivityIndicator size="small" color="#000" />
              <Text className="text-gray-500 mt-2" style={{ fontFamily: 'Poppins_400Regular' }}>
                Loading projects...
              </Text>
            </View>
          ) : allProjects.length === 0 ? (
            <View className="bg-gray-50 rounded-3xl p-8 items-center border border-gray-200">
              {!currentUser && !userLoading ? (
                <>
                  <Text className="text-gray-500 text-center mb-4" style={{ fontFamily: 'Poppins_400Regular' }}>
                    Sign up to start a new project and build your dream home.
                  </Text>
                  <TouchableOpacity
                    onPress={() => router.push('/login')}
                    className="bg-black rounded-full py-3 px-6"
                  >
                    <Text className="text-white" style={{ fontFamily: 'Poppins_600SemiBold' }}>
                      Sign up / Log in
                    </Text>
                  </TouchableOpacity>
                </>
              ) : (
                <Text className="text-gray-500 text-center" style={{ fontFamily: 'Poppins_400Regular' }}>
                  No projects yet. Start a new project to get started!
                </Text>
              )}
            </View>
          ) : (
            allProjects.map((project: any, index: number) => {
              const projectId = project.id || project.projectId || `project-${index}`;
              const uniqueKey = project.uniqueKey || `${project.isPaid ? 'active' : 'pending'}-${projectId}`;
              const isPaid = project.isPaid;
              const isPaused = project.status === 'paused';
              const statusLabel = isPaused ? 'Paused' : isPaid ? 'Active' : 'Unpaid';
              const statusBg = isPaused ? 'bg-orange-100' : isPaid ? 'bg-green-100' : 'bg-yellow-100';
              const statusText = isPaused ? 'text-orange-700' : isPaid ? 'text-green-700' : 'text-yellow-700';
              const budget = project.budget || project.acceptedRequest?.estimatedBudget || project.gcEditedAnalysis?.budget || 0;
              const paymentAmount = budget * 1.0;
              
              return (
                <TouchableOpacity
                  key={uniqueKey}
                  onPress={() => handleProjectPress(project)}
                  className={`bg-gray-50 rounded-3xl mb-4 overflow-hidden border ${
                    isPaused ? 'border-orange-200' : 'border-gray-200'
                  }`}
                >
                  <View className="p-5">
                    <View className="flex-row justify-between items-start mb-3">
                      <View className="flex-1">
                        <View className="flex-row items-center mb-1">
                          <Text 
                            className="text-xl text-black"
                            style={{ fontFamily: 'Poppins_700Bold' }}
                          >
                            {project.name || 'Untitled Project'}
                          </Text>
                          <View className={`ml-2 rounded-full px-2 py-1 ${statusBg}`}>
                            <Text 
                              className={`text-xs ${statusText}`}
                              style={{ fontFamily: 'Poppins_600SemiBold' }}
                            >
                              {statusLabel}
                            </Text>
                          </View>
                        </View>
                        <View className="flex-row items-center">
                          <MapPin size={14} color="#737373" strokeWidth={2} />
                          <Text 
                            className="text-gray-500 ml-1 text-sm"
                            style={{ fontFamily: 'Poppins_400Regular' }}
                          >
                            {project.address || 'Address not available'}
                          </Text>
                        </View>
                      </View>
                      {isPaused ? (
                        <Lock size={22} color="#F97316" strokeWidth={2} />
                      ) : (
                        <ChevronRight size={24} color="#000000" strokeWidth={2} />
                      )}
                    </View>

                    {isPaused ? (
                      <View className="bg-orange-50 rounded-2xl p-4 mb-1 border border-orange-200">
                        <Text className="text-orange-800 text-sm" style={{ fontFamily: 'Poppins_600SemiBold' }}>
                          This project has been paused by admin
                        </Text>
                        <Text className="text-orange-700 text-xs mt-1" style={{ fontFamily: 'Poppins_400Regular' }}>
                          Tap to learn why and what to do next.
                        </Text>
                      </View>
                    ) : isPaid ? (
                      <>
                        {/* Progress Bar for Active Projects */}
                        <View className="mb-3">
                          <View className="flex-row justify-between mb-2">
                            <Text 
                              className="text-black text-sm"
                              style={{ fontFamily: 'Poppins_600SemiBold' }}
                            >
                              {project.currentStage || 'In Progress'}
                            </Text>
                            <Text 
                              className="text-black"
                              style={{ fontFamily: 'JetBrainsMono_500Medium' }}
                            >
                              {project.progress || 0}%
                            </Text>
                          </View>
                          <View className="h-2 bg-gray-200 rounded-full overflow-hidden">
                            <View 
                              className="h-full bg-black rounded-full" 
                              style={{ width: `${project.progress || 0}%` }} 
                            />
                          </View>
                        </View>

                        {/* Budget Info for Active Projects */}
                        <View className="flex-row justify-between pt-3 border-t border-gray-200">
                          <View>
                            <Text 
                              className="text-gray-500 text-xs mb-1"
                              style={{ fontFamily: 'Poppins_400Regular' }}
                            >
                              Budget
                            </Text>
                            <Text 
                              className="text-black"
                              style={{ fontFamily: 'JetBrainsMono_500Medium' }}
                            >
                              ${budget.toLocaleString()}
                            </Text>
                          </View>
                          <View>
                            <Text 
                              className="text-gray-500 text-xs mb-1"
                              style={{ fontFamily: 'Poppins_400Regular' }}
                            >
                              Spent
                            </Text>
                            <Text 
                              className="text-black"
                              style={{ fontFamily: 'JetBrainsMono_500Medium' }}
                            >
                              ${(project.spent || 0).toLocaleString()}
                            </Text>
                          </View>
                        </View>
                      </>
                    ) : (
                      <>
                        {/* Payment Info for Unpaid Projects */}
                        <View className="bg-yellow-50 rounded-2xl p-4 mb-3 border border-yellow-200">
                          <View className="flex-row items-center mb-2">
                            <Clock size={18} color="#d97706" strokeWidth={2} />
                            <Text 
                              className="text-yellow-900 ml-2"
                              style={{ fontFamily: 'Poppins_600SemiBold' }}
                            >
                              Payment Required
                            </Text>
                          </View>
                          <Text 
                            className="text-yellow-800 text-sm mb-2"
                            style={{ fontFamily: 'Poppins_400Regular' }}
                          >
                            GC has reviewed your project. Pay 100% to start building.
                          </Text>
                          <View className="flex-row justify-between items-center">
                            <Text 
                              className="text-yellow-900"
                              style={{ fontFamily: 'Poppins_500Medium' }}
                            >
                              Amount Due:
                            </Text>
                            <Text 
                              className="text-yellow-900 text-lg"
                              style={{ fontFamily: 'JetBrainsMono_500Medium' }}
                            >
                              ${paymentAmount.toLocaleString()}
                            </Text>
                          </View>
                        </View>
                      </>
                    )}
                  </View>
                </TouchableOpacity>
              );
            })
          )}
        </View>

        {/* Paused Project Modal */}
        <Modal
          visible={showPausedModal}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowPausedModal(false)}
        >
          <View className="flex-1 bg-black/50 items-center justify-center px-6">
            <View className="bg-white rounded-3xl p-6 w-full max-w-md">
              <View className="flex-row items-center justify-between mb-2">
                <Text className="text-xl text-black" style={{ fontFamily: 'Poppins_700Bold' }}>
                  Project paused
                </Text>
                <TouchableOpacity onPress={() => setShowPausedModal(false)} className="w-10 h-10 bg-gray-100 rounded-full items-center justify-center">
                  <X size={18} color="#000000" strokeWidth={2.5} />
                </TouchableOpacity>
              </View>

              <Text className="text-gray-700 text-sm mb-4" style={{ fontFamily: 'Poppins_400Regular' }}>
                Admin has temporarily paused{selectedPausedProject?.name ? ` “${selectedPausedProject.name}”` : ' this project'} to protect both parties while an issue is reviewed.
              </Text>

              <View className="bg-orange-50 border border-orange-200 rounded-2xl p-4 mb-4">
                <Text className="text-orange-900 text-sm mb-2" style={{ fontFamily: 'Poppins_700Bold' }}>
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
                    <View className="w-2 h-2 bg-orange-500 rounded-full mt-2 mr-2" />
                    <Text className="text-orange-800 text-xs flex-1" style={{ fontFamily: 'Poppins_400Regular' }}>
                      {reason}
                    </Text>
                  </View>
                ))}
              </View>

              <View className="bg-gray-50 border border-gray-200 rounded-2xl p-4">
                <Text className="text-gray-900 text-sm" style={{ fontFamily: 'Poppins_600SemiBold' }}>
                  What you should do now
                </Text>
                <Text className="text-gray-600 text-xs mt-1" style={{ fontFamily: 'Poppins_400Regular' }}>
                  Please wait while admin resolves the issue. You’ll be able to continue once the project is activated again.
                </Text>
              </View>

              <TouchableOpacity
                onPress={() => setShowPausedModal(false)}
                className="bg-black rounded-2xl py-4 items-center mt-5"
              >
                <Text className="text-white text-base" style={{ fontFamily: 'Poppins_700Bold' }}>
                  Okay, I’ll wait for admin
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* Buy a Home Section */}
        <View className="mb-8">
          <View className="flex-row items-center justify-between mb-4">
            <View className="flex-row items-center">
              <Home size={24} color="#000000" strokeWidth={2.5} />
              <Text 
                className="text-2xl text-black ml-2"
                style={{ fontFamily: 'Poppins_600SemiBold' }}
              >
                Buy
              </Text>
            </View>
            <View className="bg-black rounded-full px-3 py-1">
              <Text 
                className="text-white text-xs"
                style={{ fontFamily: 'Poppins_600SemiBold' }}
              >
                Verified
              </Text>
            </View>
          </View>

          <Text 
            className="text-gray-500 mb-4"
            style={{ fontFamily: 'Poppins_400Regular' }}
          >
            Don’t want to wait? Buy a move-in ready home today
          </Text>

          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {(loadingHouses ? [] : housesForSale).map((home) => (
              <TouchableOpacity
                key={home.id}
                onPress={() => handleBuyHome(home)}
                className="bg-white rounded-3xl mr-4 overflow-hidden border border-gray-200"
                style={{ width: Math.min(280, screenWidth * 0.75) }}
              >
                <Image
                  source={{ uri: getHouseImageUrl(home) }}
                  className="w-full h-32"
                  resizeMode="cover"
                />
                <View className="p-3">
                  <Text 
                    className="text-base text-black mb-1"
                    style={{ fontFamily: 'Poppins_600SemiBold' }}
                    numberOfLines={1}
                  >
                    {home.name}
                  </Text>
                  <View className="flex-row items-center mb-2">
                    <MapPin size={12} color="#737373" strokeWidth={2} />
                    <Text 
                      className="text-gray-500 ml-1 text-xs"
                      style={{ fontFamily: 'Poppins_400Regular' }}
                    >
                      {home.location}
                    </Text>
                  </View>

                  <View className="flex-row items-center mb-2">
                    <Bed size={12} color="#737373" strokeWidth={2} />
                    <Text className="text-gray-500 ml-1 mr-2 text-xs" style={{ fontFamily: 'Poppins_400Regular' }}>
                      {home.bedrooms}
                    </Text>
                    <Bath size={12} color="#737373" strokeWidth={2} />
                    <Text className="text-gray-500 ml-1 mr-2 text-xs" style={{ fontFamily: 'Poppins_400Regular' }}>
                      {home.bathrooms}
                    </Text>
                    <Maximize size={12} color="#737373" strokeWidth={2} />
                    <Text className="text-gray-500 ml-1 text-xs" style={{ fontFamily: 'Poppins_400Regular' }}>
                      {home.squareMeters ?? home.squareFootage}m²
                    </Text>
                  </View>

                  <View className="flex-row justify-between items-center">
                    <Text className="text-black text-base" style={{ fontFamily: 'JetBrainsMono_500Medium' }}>
                      ${home.price.toLocaleString()}
                    </Text>
                    <View className="bg-green-100 rounded-full px-2 py-0.5">
                      <Text className="text-green-700 text-xs" style={{ fontFamily: 'Poppins_600SemiBold' }}>
                        {home.condition || 'For Sale'}
                      </Text>
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Landed Properties Section */}
        <View className="mb-8">
          <View className="flex-row items-center justify-between mb-4">
            <View className="flex-row items-center">
              <LandPlot size={24} color="#000000" strokeWidth={2.5} />
              <Text 
                className="text-2xl text-black ml-2"
                style={{ fontFamily: 'Poppins_600SemiBold' }}
              >
                Land for Sale
              </Text>
            </View>
            <View className="bg-black rounded-full px-3 py-1">
              <Text 
                className="text-white text-xs"
                style={{ fontFamily: 'Poppins_600SemiBold' }}
              >
                C of O
              </Text>
            </View>
          </View>

          <Text 
            className="text-gray-500 mb-4"
            style={{ fontFamily: 'Poppins_400Regular' }}
          >
            Verified estates with all legal documents
          </Text>

          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {(loadingLands ? [] : landsForSale).map((land) => (
              <TouchableOpacity
                key={land.id}
                onPress={() => handleLandPurchase(land)}
                className="bg-white rounded-3xl mr-4 overflow-hidden border border-gray-200"
                style={{ width: Math.min(280, screenWidth * 0.75) }}
              >
                <Image
                  source={{ uri: land.images?.[0]?.url ? getBackendAssetUrl(land.images[0].url) : 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=600&q=80' }}
                  className="w-full h-32"
                  resizeMode="cover"
                />
                <View className="p-3">
                  <Text 
                    className="text-base text-black mb-1"
                    style={{ fontFamily: 'Poppins_600SemiBold' }}
                    numberOfLines={1}
                  >
                    {land.name}
                  </Text>
                  <View className="flex-row items-center mb-2">
                    <MapPin size={12} color="#737373" strokeWidth={2} />
                    <Text 
                      className="text-gray-500 ml-1 text-xs"
                      style={{ fontFamily: 'Poppins_400Regular' }}
                    >
                      {land.location}
                    </Text>
                  </View>

                  <View className="flex-row justify-between mb-2">
                    <View>
                      <Text className="text-gray-500 text-xs" style={{ fontFamily: 'Poppins_400Regular' }}>Per Plot</Text>
                      <Text className="text-black text-sm" style={{ fontFamily: 'JetBrainsMono_500Medium' }}>₦{(land.price / 1000000).toFixed(1)}M</Text>
                    </View>
                    <View>
                      <Text className="text-gray-500 text-xs" style={{ fontFamily: 'Poppins_400Regular' }}>Size</Text>
                      <Text className="text-black text-sm" style={{ fontFamily: 'Poppins_600SemiBold' }}>{land.sizeSqm} sqm</Text>
                    </View>
                  </View>

                  <View className="flex-row flex-wrap">
                    {(land.documents || []).slice(0, 2).map((doc: string, i: number) => (
                      <View key={i} className="bg-gray-100 rounded-full px-2 py-0.5 mr-1 mb-1">
                        <Text className="text-black text-xs" style={{ fontFamily: 'Poppins_500Medium' }}>{doc}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </ScrollView>

      {/* Buy Home Modal */}
      <Modal
        visible={showBuyModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowBuyModal(false)}
      >
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-white rounded-t-3xl p-6 max-h-[90%]">
            <View className="w-12 h-1 bg-gray-300 rounded-full self-center mb-6" />
            
            {!buySuccess ? (
              <ScrollView showsVerticalScrollIndicator={false}>
                <View className="flex-row justify-between items-start mb-4">
                  <Text 
                    className="text-2xl text-black flex-1"
                    style={{ fontFamily: 'Poppins_600SemiBold' }}
                  >
                    {selectedHome?.name}
                  </Text>
                  <TouchableOpacity onPress={() => setShowBuyModal(false)}>
                    <X size={24} color="#000000" strokeWidth={2} />
                  </TouchableOpacity>
                </View>

                <View className="-mx-6 mb-4">
                  <ImageCarousel
                    images={
                      selectedHome?.images && selectedHome.images.length > 0
                        ? selectedHome.images.map((img: any) => ({
                            url: getBackendAssetUrl(img.url) || img.url || getHouseImageUrl(selectedHome),
                            label: img.label || 'Photo',
                          }))
                        : [{ url: getHouseImageUrl(selectedHome), label: 'Exterior' }]
                    }
                    height={192}
                  />
                </View>

                <Text 
                  className="text-gray-600 mb-4"
                  style={{ fontFamily: 'Poppins_400Regular' }}
                >
                  {selectedHome?.description}
                </Text>

                {/* Key Details */}
                <View className="bg-gray-50 rounded-2xl p-4 mb-4 border border-gray-200">
                  <View className="flex-row justify-between mb-3">
                    <View className="flex-row items-center">
                      <Bed size={18} color="#737373" strokeWidth={2} />
                      <Text className="text-black ml-2" style={{ fontFamily: 'Poppins_600SemiBold' }}>
                        {selectedHome?.bedrooms} Bedrooms
                      </Text>
                    </View>
                    <View className="flex-row items-center">
                      <Bath size={18} color="#737373" strokeWidth={2} />
                      <Text className="text-black ml-2" style={{ fontFamily: 'Poppins_600SemiBold' }}>
                        {selectedHome?.bathrooms} Bathrooms
                      </Text>
                    </View>
                  </View>
                  <View className="flex-row justify-between">
                    <View className="flex-row items-center">
                      <Maximize size={18} color="#737373" strokeWidth={2} />
                      <Text className="text-black ml-2" style={{ fontFamily: 'Poppins_600SemiBold' }}>
                        {(selectedHome?.squareMeters ?? selectedHome?.squareFootage)}m²
                      </Text>
                    </View>
                    <View className="flex-row items-center">
                      <Car size={18} color="#737373" strokeWidth={2} />
                      <Text className="text-black ml-2" style={{ fontFamily: 'Poppins_600SemiBold' }}>
                        {selectedHome?.parking} Parking
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Property Info */}
                <View className="bg-gray-50 rounded-2xl p-4 mb-4 border border-gray-200">
                  <Text className="text-black mb-3" style={{ fontFamily: 'Poppins_600SemiBold' }}>
                    Property Details
                  </Text>
                  <View className="space-y-2">
                    <View className="flex-row justify-between">
                      <Text className="text-gray-500 text-sm" style={{ fontFamily: 'Poppins_400Regular' }}>Property Type</Text>
                      <Text className="text-black text-sm" style={{ fontFamily: 'Poppins_500Medium' }}>{selectedHome?.propertyType}</Text>
                    </View>
                    <View className="flex-row justify-between">
                      <Text className="text-gray-500 text-sm" style={{ fontFamily: 'Poppins_400Regular' }}>Year Built</Text>
                      <Text className="text-black text-sm" style={{ fontFamily: 'Poppins_500Medium' }}>{selectedHome?.yearBuilt}</Text>
                    </View>
                    <View className="flex-row justify-between">
                      <Text className="text-gray-500 text-sm" style={{ fontFamily: 'Poppins_400Regular' }}>Condition</Text>
                      <Text className="text-black text-sm" style={{ fontFamily: 'Poppins_500Medium' }}>{selectedHome?.condition}</Text>
                    </View>
                  </View>
                </View>

                {/* Documents */}
                {selectedHome?.documents && selectedHome.documents.length > 0 && (
                  <View className="mb-4">
                    <Text className="text-black mb-2" style={{ fontFamily: 'Poppins_600SemiBold' }}>
                      Documents Available
                    </Text>
                    <View className="flex-row flex-wrap">
                      {selectedHome.documents.map((doc, i) => (
                        <View key={i} className="bg-gray-100 rounded-full px-3 py-1 mr-2 mb-2">
                          <Text className="text-black text-xs" style={{ fontFamily: 'Poppins_500Medium' }}>{doc}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                )}

                {/* Amenities */}
                {selectedHome?.amenities && selectedHome.amenities.length > 0 && (
                  <View className="mb-4">
                    <Text className="text-black mb-2" style={{ fontFamily: 'Poppins_600SemiBold' }}>
                      Amenities
                    </Text>
                    <View className="flex-row flex-wrap">
                      {selectedHome.amenities.map((amenity, i) => (
                        <View key={i} className="bg-gray-100 rounded-full px-3 py-1 mr-2 mb-2">
                          <Text className="text-black text-xs" style={{ fontFamily: 'Poppins_500Medium' }}>{amenity}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                )}

                {/* Nearby Facilities */}
                {selectedHome?.nearbyFacilities && selectedHome.nearbyFacilities.length > 0 && (
                  <View className="mb-4">
                    <Text className="text-black mb-2" style={{ fontFamily: 'Poppins_600SemiBold' }}>
                      Nearby Facilities
                    </Text>
                    {selectedHome.nearbyFacilities.map((facility, i) => (
                      <Text key={i} className="text-gray-600 text-sm mb-1" style={{ fontFamily: 'Poppins_400Regular' }}>
                        • {facility}
                      </Text>
                    ))}
                  </View>
                )}

                {/* Price */}
                <View className="bg-black rounded-2xl p-4 mb-4">
                  <View className="flex-row justify-between items-center">
                    <Text className="text-white/70 text-sm" style={{ fontFamily: 'Poppins_400Regular' }}>Price</Text>
                    <Text className="text-white text-2xl" style={{ fontFamily: 'JetBrainsMono_500Medium' }}>
                      ${selectedHome?.price.toLocaleString()}
                    </Text>
                  </View>
                </View>

                {/* Contact Info */}
                <View className="bg-gray-50 rounded-2xl p-4 mb-4 border border-gray-200">
                  <Text className="text-black mb-2" style={{ fontFamily: 'Poppins_600SemiBold' }}>
                    Contact for Viewing
                  </Text>
                  <Text className="text-black text-sm mb-1" style={{ fontFamily: 'Poppins_500Medium' }}>
                    {selectedHome?.contactName}
                  </Text>
                  <Text className="text-gray-600 text-sm" style={{ fontFamily: 'Poppins_400Regular' }}>
                    {selectedHome?.contactPhone}
                  </Text>
                </View>

                <TouchableOpacity
                  onPress={confirmBuyHome}
                  disabled={scheduleViewingMutation.isPending}
                  className="bg-black rounded-full py-5 px-8 mb-4"
                >
                  <Text 
                    className="text-white text-lg text-center"
                    style={{ fontFamily: 'Poppins_600SemiBold' }}
                  >
                    {scheduleViewingMutation.isPending ? 'Scheduling...' : 'Schedule Viewing'}
                  </Text>
                </TouchableOpacity>

                <Text 
                  className="text-gray-500 text-xs text-center"
                  style={{ fontFamily: 'Poppins_400Regular' }}
                >
                  Contact the seller to schedule a viewing or make an offer
                </Text>
              </ScrollView>
            ) : (
              <View className="items-center py-8">
                <View className="w-16 h-16 bg-black rounded-full items-center justify-center mb-4">
                  <Check size={32} color="#FFFFFF" strokeWidth={2.5} />
                </View>
                  <Text 
                    className="text-xl text-black mb-2 text-center"
                    style={{ fontFamily: 'Poppins_600SemiBold' }}
                  >
                    Viewing Scheduled!
                  </Text>
                <Text 
                  className="text-gray-500 text-center text-sm"
                  style={{ fontFamily: 'Poppins_400Regular' }}
                >
                  The seller will contact you soon to confirm details
                </Text>
              </View>
            )}
          </View>
        </View>
      </Modal>

      {/* Land Viewing Modal */}
      <Modal
        visible={showLandModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowLandModal(false)}
      >
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-white rounded-t-3xl p-5 max-h-[85%]">
            <View className="w-12 h-1 bg-gray-300 rounded-full self-center mb-4" />
            
            {!landSuccess ? (
              <ScrollView showsVerticalScrollIndicator={false}>
                <View className="flex-row justify-between items-start mb-3">
                  <Text 
                    className="text-xl text-black flex-1"
                    style={{ fontFamily: 'Poppins_600SemiBold' }}
                  >
                    {selectedLand?.name}
                  </Text>
                  <TouchableOpacity onPress={() => setShowLandModal(false)}>
                    <X size={24} color="#000000" strokeWidth={2} />
                  </TouchableOpacity>
                </View>

                <Image
                  source={{ uri: selectedLand?.images?.[0]?.url ? getBackendAssetUrl(selectedLand.images[0].url) : 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=600&q=80' }}
                  className="w-full h-40 rounded-2xl mb-3"
                  resizeMode="cover"
                />

                <Text 
                  className="text-gray-600 mb-3 text-sm"
                  style={{ fontFamily: 'Poppins_400Regular' }}
                >
                  {selectedLand?.description}
                </Text>

                <View className="bg-gray-50 rounded-2xl p-3 mb-3 border border-gray-200">
                  <View className="flex-row justify-between mb-2">
                    <View>
                      <Text className="text-gray-500 text-xs" style={{ fontFamily: 'Poppins_400Regular' }}>Price</Text>
                      <Text className="text-black text-lg" style={{ fontFamily: 'JetBrainsMono_500Medium' }}>₦{(selectedLand?.price || 0).toLocaleString()}</Text>
                    </View>
                    <View>
                      <Text className="text-gray-500 text-xs" style={{ fontFamily: 'Poppins_400Regular' }}>Land Size</Text>
                      <Text className="text-black text-lg" style={{ fontFamily: 'Poppins_600SemiBold' }}>{selectedLand?.sizeSqm} sqm</Text>
                    </View>
                  </View>
                  <View className="flex-row justify-between">
                    <View>
                      <Text className="text-gray-500 text-xs" style={{ fontFamily: 'Poppins_400Regular' }}>Title</Text>
                      <Text className="text-black" style={{ fontFamily: 'Poppins_500Medium' }}>{selectedLand?.titleDocument || 'N/A'}</Text>
                    </View>
                    <View>
                      <Text className="text-gray-500 text-xs" style={{ fontFamily: 'Poppins_400Regular' }}>Location</Text>
                      <Text className="text-black text-sm" style={{ fontFamily: 'Poppins_400Regular' }}>{selectedLand?.location}</Text>
                    </View>
                  </View>
                </View>

                <View className="mb-3">
                  <Text className="text-black mb-2 text-sm" style={{ fontFamily: 'Poppins_600SemiBold' }}>Verified Documents</Text>
                  <View className="flex-row flex-wrap">
                    {selectedLand?.documents?.map((doc: string, i: number) => (
                      <View key={i} className="bg-black rounded-full px-3 py-1 mr-2 mb-2 flex-row items-center">
                        <FileCheck size={12} color="#FFFFFF" strokeWidth={2} />
                        <Text className="text-white text-xs ml-1" style={{ fontFamily: 'Poppins_500Medium' }}>{doc}</Text>
                      </View>
                    ))}
                  </View>
                </View>

                <TouchableOpacity
                  onPress={confirmLandPurchase}
                  disabled={scheduleLandViewingMutation.isPending}
                  className="bg-black rounded-full py-4 px-8 mb-3"
                >
                  <Text 
                    className="text-white text-base text-center"
                    style={{ fontFamily: 'Poppins_600SemiBold' }}
                  >
                    {scheduleLandViewingMutation.isPending ? 'Scheduling...' : 'Schedule Viewing'}
                  </Text>
                </TouchableOpacity>

                <Text 
                  className="text-gray-500 text-xs text-center"
                  style={{ fontFamily: 'Poppins_400Regular' }}
                >
                  BuildMyHouse team will contact you to confirm site inspection
                </Text>
              </ScrollView>
            ) : (
              <View className="items-center py-8">
                <View className="w-16 h-16 bg-black rounded-full items-center justify-center mb-4">
                  <Check size={32} color="#FFFFFF" strokeWidth={2.5} />
                </View>
                  <Text 
                    className="text-xl text-black mb-2 text-center"
                    style={{ fontFamily: 'Poppins_600SemiBold' }}
                  >
                    Viewing Request Sent!
                  </Text>
                <Text 
                  className="text-gray-500 text-center text-sm"
                  style={{ fontFamily: 'Poppins_400Regular' }}
                >
                  Admin will contact you shortly to arrange the site visit.
                </Text>
              </View>
            )}
          </View>
        </View>
      </Modal>

      {/* Payment Modal */}
      <PaymentModal
        visible={showPaymentModal}
        onClose={() => {
          setShowPaymentModal(false);
          setIsProcessingPayment(false);
          setPaymentClientSecret(null);
          setPaymentError(null);
          setSelectedProjectForPayment(null);
        }}
        amount={paymentAmount}
        projectBudget={projectBudget}
        projectName={selectedProjectForPayment?.name || 'Project'}
        onPaymentSuccess={handlePaymentSuccess}
        onPaymentError={handlePaymentError}
        clientSecret={paymentClientSecret || undefined}
        externalError={paymentError || undefined}
      />
    </View>
  );
}
