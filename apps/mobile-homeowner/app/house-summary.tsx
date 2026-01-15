import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Alert, Modal, Keyboard, Platform, TextInput } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { ArrowLeft, Home, Bed, Bath, Maximize, ChevronDown, ChevronUp, Calendar, DollarSign, Star, HardHat, Send, CheckCircle, Clock, AlertCircle, MapPin, Search, X } from "lucide-react-native";
import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useQueryClient } from '@tanstack/react-query';
import { GOOGLE_MAPS_CONFIG } from '@/config/maps';
import { reverseGeocode, AddressDetails } from '@/services/addressService';

// Conditionally import GooglePlacesAutocomplete only on native platforms
let GooglePlacesAutocomplete: any = null;
if (Platform.OS !== 'web') {
  try {
    const GPA = require('react-native-google-places-autocomplete');
    GooglePlacesAutocomplete = GPA.default || GPA.GooglePlacesAutocomplete;
  } catch (e) {
    console.warn('GooglePlacesAutocomplete not available:', e);
  }
}
import { useRecommendedGCs, useSendGCRequests, useCheckGCAcceptance, useActivateProject, useSaveProjectForLater, useDesign, useCreateProjectFromDesign } from '@/hooks';
import { useProjectAnalysis } from '@/hooks/usePlan';
import { useCreatePaymentIntent } from '@/hooks/usePayment';
import PaymentModal from '@/components/PaymentModal';

export default function HouseSummaryScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const queryClient = useQueryClient();
  
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const [selectedGCs, setSelectedGCs] = useState<Set<string>>(new Set());
  const [isSendingRequests, setIsSendingRequests] = useState(false);
  const [projectId, setProjectId] = useState<string | null>(null);
  const [gcRequestStatus, setGcRequestStatus] = useState<'none' | 'pending' | 'accepted'>('none');
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [projectBudget, setProjectBudget] = useState<number>(0);
  const [paymentClientSecret, setPaymentClientSecret] = useState<string | null>(null);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState<AddressDetails | null>(null);
  const autocompleteRef = useRef<any>(null);

  // Check if this is a design selection flow (designId present) or project flow (projectId present)
  const designId = params.designId as string | undefined;
  const isDesignSelection = !!designId;

  // Fetch design if designId is present
  const { data: designData, isLoading: loadingDesign } = useDesign(designId);

  // Get projectId from params (only if not design selection)
  useEffect(() => {
    if (!isDesignSelection) {
    const paramProjectId = params.projectId as string;
    if (paramProjectId) {
      setProjectId(paramProjectId);
    } else {
      setProjectId('test-project-123');
    }
    }
  }, [params.projectId, isDesignSelection]);

  // Use real data from design for design selection flow
  const designAnalysis = useMemo(() => {
    if (!designData) return null;
    
    return {
      bedrooms: designData.bedrooms,
      bathrooms: designData.bathrooms,
      squareFootage: designData.squareFootage,
      floors: designData.floors || Math.ceil(designData.bedrooms / 4) || 2,
      estimatedBudget: designData.estimatedCost,
      estimatedDuration: designData.estimatedDuration || '12-18 months',
      confidence: 95,
      notes: 'Detailed analysis based on design specifications',
      phases: (() => {
        if (!designData.constructionPhases) return [];
        
        let phasesData = designData.constructionPhases;
        
        // If it's a string, try to parse it
        if (typeof phasesData === 'string') {
          try {
            phasesData = JSON.parse(phasesData);
          } catch {
            return [];
          }
        }
        
        // If it's an object with construction_phases property, extract it
        if (phasesData && typeof phasesData === 'object' && !Array.isArray(phasesData)) {
          if ('construction_phases' in phasesData && Array.isArray(phasesData.construction_phases)) {
            phasesData = phasesData.construction_phases;
          } else {
            return [];
          }
        }
        
        // If it's an array, map to expected format
        if (Array.isArray(phasesData)) {
          return phasesData.map((phase: any) => ({
            name: phase.name || phase.phase_name || phase.phaseName || '',
            description: phase.description || '',
            estimatedDuration: phase.estimatedDuration || phase.time_period || phase.timePeriod || '',
            estimatedCost: phase.estimatedCost || phase.estimated_cost || 0,
          }));
        }
        
        return [];
      })(),
      rooms: designData.rooms || [],
      materials: designData.materials || [],
      features: designData.features || [],
    };
  }, [designData]);

  // Fetch real project analysis - refetch when GC accepts (only for project flow)
  const { data: projectAnalysisData, isLoading: loadingAnalysis, error: analysisError, isFetching: fetchingAnalysis, refetch: refetchAnalysis } = useProjectAnalysis(isDesignSelection ? null : projectId);
  // Backend returns project with aiAnalysis nested inside
  const originalAiAnalysis = projectAnalysisData?.aiAnalysis || null;
  
  // Get accepted GC's edited analysis from project request
  // Only get requests with status 'accepted'
  const acceptedRequest = projectAnalysisData?.projectRequests?.find((req: any) => req.status === 'accepted');
  const pendingRequests = projectAnalysisData?.projectRequests?.filter((req: any) => req.status === 'pending') || [];
  let gcEditedAnalysis: any = null;
  let acceptedGC: any = null;
  
  if (acceptedRequest && acceptedRequest.status === 'accepted') {
    // Parse the edited analysis from gcNotes
    if (acceptedRequest.gcNotes) {
      try {
        // Format: "[Edited AI Analysis]\n{JSON}" or just "{JSON}" if notes start with it
        let jsonString = '';
        const notesMatch = acceptedRequest.gcNotes.match(/\[Edited AI Analysis\]\s*\n(.*)/s);
        if (notesMatch && notesMatch[1]) {
          jsonString = notesMatch[1].trim();
        } else {
          // Try to find JSON in the notes (might be at the end)
          const jsonMatch = acceptedRequest.gcNotes.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            jsonString = jsonMatch[0];
          }
        }
        
        if (jsonString) {
          gcEditedAnalysis = JSON.parse(jsonString);
        }
      } catch (error) {
        // Silently fail - use original analysis if parsing fails
      }
    }
    
    // Get accepted GC info - contractorProfile is nested under contractor
    acceptedGC = acceptedRequest.contractor?.contractorProfile || null;
  }
  
  // Use GC's edited analysis if available, otherwise use original AI analysis
  // For design selection, use real design data
  const aiAnalysis = isDesignSelection ? designAnalysis : (gcEditedAnalysis || originalAiAnalysis);

  // For design selection, show only the GC who uploaded the design
  // For project flow, fetch recommended GCs
  const { data: recommendedGCsData = [], isLoading: loadingGCs, error: gcError } = useRecommendedGCs(isDesignSelection ? null : projectId);
  const recommendedGCs = recommendedGCsData || [];

  // Create GC object from design creator for design selection flow
  const designGC = useMemo(() => {
    if (!isDesignSelection || !designData?.createdBy) return null;
    
    const contractorProfile = (designData.createdBy as any)?.contractorProfile;
    
    return {
      id: designData.createdBy.id,
      name: contractorProfile?.name || designData.createdBy.fullName,
      specialty: contractorProfile?.specialty || 'General Construction',
      location: contractorProfile?.location || 'Lagos, Nigeria',
      verified: contractorProfile?.verified || false,
      rating: contractorProfile?.rating || 4.8,
      reviews: contractorProfile?.reviews || 24,
      projects: contractorProfile?.projects || 15,
      matchScore: 98, // High match since they created the design
      email: designData.createdBy.email,
    };
  }, [isDesignSelection, designData]);

  // Check GC acceptance status - poll every 5 seconds if we haven't detected acceptance yet
  // Keep polling until we detect acceptance OR we're already in 'accepted' state
  const shouldPoll = gcRequestStatus !== 'accepted' && !!projectId;
  const { data: gcAcceptanceData, isLoading: loadingAcceptance } = useCheckGCAcceptance(
    projectId,
    shouldPoll ? 5000 : undefined // Poll every 5 seconds if not accepted yet
  );

  const activateProjectMutation = useActivateProject();
  const createPaymentIntentMutation = useCreatePaymentIntent();
  const saveProjectForLaterMutation = useSaveProjectForLater();
  const createProjectFromDesignMutation = useCreateProjectFromDesign();

  // Check initial project status and update when GC accepts or when request is pending
  useEffect(() => {
    if (!gcAcceptanceData || !projectId) return;
    // Only update status if there's actual acceptance
    // Check accepted requests FIRST - this is the most reliable indicator
    // Only show "accepted" if there's actually an accepted request (acceptedRequestsCount > 0)
    // generalContractorId is set when GC accepts, but we also need confirmed accepted request
    if (gcAcceptanceData.acceptedRequestsCount > 0) {
      // GC has actually accepted - update status to accepted
      if (gcRequestStatus !== 'accepted') {
        setGcRequestStatus('accepted');
        
        // Invalidate and refetch project analysis query to get GC's edited data
        queryClient.invalidateQueries({ queryKey: ['projects', projectId, 'analysis'] });
        // Force refetch immediately
        setTimeout(() => {
          refetchAnalysis();
        }, 500);
      }
    } else if (gcAcceptanceData.hasPendingRequest && gcRequestStatus === 'none') {
      // Request has been sent but not yet accepted - update status to pending
      setGcRequestStatus('pending');
    } else if (!gcAcceptanceData.hasPendingRequest && !gcAcceptanceData.hasAcceptedGC && gcRequestStatus !== 'none') {
      // No pending or accepted requests found - might have been rejected
      // Don't automatically reset - let user see the rejection or wait for next poll
    }
  }, [gcAcceptanceData, gcRequestStatus, projectId, queryClient, refetchAnalysis]);

  // Refetch analysis when status changes to accepted (to get GC edits)
  useEffect(() => {
    if (gcRequestStatus === 'accepted' && projectId) {
      // Small delay to ensure backend has processed the acceptance
      const timeoutId = setTimeout(() => {
        refetchAnalysis();
      }, 1000);
      return () => clearTimeout(timeoutId);
    }
  }, [gcRequestStatus, projectId, refetchAnalysis]);

  // Only show loading if we're truly loading for the first time AND don't have analysis yet
  // Don't show loading during background refetches (polling)
  // For design selection, check if design is loading
  const isLoading = isDesignSelection 
    ? (loadingDesign && !designData)
    : ((loadingAnalysis && !projectAnalysisData) || (loadingGCs && recommendedGCs.length === 0) || (loadingAcceptance && !gcAcceptanceData));

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  const toggleGCSelection = (gcId: string) => {
    const newSelected = new Set(selectedGCs);
    if (newSelected.has(gcId)) {
      newSelected.delete(gcId);
    } else {
      newSelected.add(gcId);
    }
    setSelectedGCs(newSelected);
  };

  const sendGCRequestsMutation = useSendGCRequests();

  const handleSendRequests = async () => {
    if (selectedGCs.size === 0) {
      return;
    }

    if (!projectId) {
      return;
    }

    setIsSendingRequests(true);

    try {
      await sendGCRequestsMutation.mutateAsync({
        projectId,
        contractorIds: Array.from(selectedGCs),
      });

      // Don't set status here - let the polling check determine it
      // Wait a moment for backend to save the request, then invalidate and poll
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ['projects', projectId, 'gc-acceptance'] });
        queryClient.invalidateQueries({ queryKey: ['projects', projectId, 'analysis'] });
      }, 1000); // Wait 1 second for backend to process
    } catch (error) {
      // Error handled by mutation
    } finally {
      setIsSendingRequests(false);
    }
  };

  const handlePaymentError = useCallback((error: string) => {
    // Don't close modal on error - let user see the error and retry
    setIsProcessingPayment(false);
    setPaymentError(error);
    
    // If authentication error, suggest logging in
    if (error?.includes('401') || error?.includes('Unauthorized') || error?.includes('Authentication')) {
      // Error message will be shown in modal
      // User can close modal and log in again
    }
  }, []);

  const handleCreatePaymentIntent = useCallback(async () => {
    const currentProjectId = projectId;
    const currentPaymentAmount = paymentAmount;
    
    if (!currentProjectId) {
      handlePaymentError('Project ID is missing. Please refresh the page and try again.');
      return;
    }
    
    if (!currentPaymentAmount || currentPaymentAmount <= 0) {
      // Try to recalculate budget from available sources
      // Priority: GC's edited analysis > acceptedRequest.estimatedBudget > AI analysis > project data
      const gcEditedBudget = gcEditedAnalysis?.budget || gcEditedAnalysis?.estimatedBudget;
      const recalculatedBudget = gcEditedBudget || acceptedRequest?.estimatedBudget || aiAnalysis?.estimatedBudget || aiAnalysis?.budget || projectAnalysisData?.budget || gcAcceptanceData?.project?.budget || 0;
      const recalculatedAmount = recalculatedBudget * 1.0;
      
      if (recalculatedAmount > 0) {
        // Update state with recalculated values
        setPaymentAmount(recalculatedAmount);
        setProjectBudget(recalculatedBudget);
        // Retry with new values
        setTimeout(() => {
          handleCreatePaymentIntent();
        }, 100);
        return;
      }
      
      handlePaymentError(`Invalid payment amount (${currentPaymentAmount}). Budget information may be missing. Please contact support.`);
      return;
    }

    try {
      setIsProcessingPayment(true);
      setPaymentError(null); // Clear previous errors
      
      // Use the current payment amount (either from state or recalculated)
      const amountToUse = currentPaymentAmount;
      
      // Create payment intent
      const paymentResult = await createPaymentIntentMutation.mutateAsync({
        amount: amountToUse,
        projectId: currentProjectId,
        currency: 'usd',
        description: `Project activation payment - ${projectAnalysisData?.name || 'Project'}`,
      });

      // Store client secret for Stripe payment
      if (paymentResult?.paymentIntent?.clientSecret) {
        setPaymentClientSecret(paymentResult.paymentIntent.clientSecret);
        setIsProcessingPayment(false);
        setPaymentError(null); // Clear any errors
      } else {
        // Don't close modal, error will be shown in modal
        setPaymentClientSecret(null);
        setIsProcessingPayment(false);
        handlePaymentError('Payment intent created but no client secret received. Please try again.');
      }
    } catch (error: any) {
      // Don't close modal on error - let user see the error and retry
      setPaymentClientSecret(null);
      setIsProcessingPayment(false);
      
      // If it's a 401 error, the user needs to log in again
      const errorMessage = error?.message || 'Failed to create payment intent';
      if (errorMessage.includes('401') || errorMessage.includes('Unauthorized')) {
        handlePaymentError('Authentication required. Please log out and log in again to continue with payment.');
      } else {
        handlePaymentError(errorMessage);
      }
    }
  }, [projectId, paymentAmount, projectAnalysisData, acceptedRequest, aiAnalysis, gcAcceptanceData, createPaymentIntentMutation, handlePaymentError]);

  const handlePaymentSuccess = useCallback(async () => {
    const currentProjectId = projectId;
    if (!currentProjectId) {
      setIsProcessingPayment(false);
      setShowPaymentModal(false);
      setPaymentClientSecret(null);
      return;
    }

    try {
      // Activate project after successful payment - this marks it as "active" and "paid"
      await activateProjectMutation.mutateAsync(currentProjectId);
      
      // Invalidate all project queries to refresh the lists
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['projects', 'active'] });
      queryClient.invalidateQueries({ queryKey: ['projects', 'pending'] });
      queryClient.invalidateQueries({ queryKey: ['projects', currentProjectId] });
      
      // Don't close modal here - the PaymentModal will handle closing after showing success
      // The modal shows success for 3 seconds, then calls this handler, then we close
      setIsProcessingPayment(false);
      
      // Close modal and navigate after a brief delay to ensure everything is processed
      setTimeout(() => {
        setShowPaymentModal(false);
        setPaymentClientSecret(null);
        // Navigate to dashboard/home to see the updated project list
        router.replace('/(tabs)/home');
      }, 500);
    } catch (error: any) {
      console.error('Error activating project after payment:', error);
      // If activation fails, still close modal but show error
      setIsProcessingPayment(false);
      setShowPaymentModal(false);
      setPaymentClientSecret(null);
      setPaymentError(error?.message || 'Failed to activate project. Please contact support.');
      // Error will be shown via toast or alert
    }
  }, [projectId, activateProjectMutation, router, queryClient]);

  const handleSaveForLater = useCallback(async () => {
    if (!projectId || gcRequestStatus !== 'accepted') {
      return;
    }

    try {
      // Prepare project data to save
      const projectDataToSave = {
        projectId,
        name: params.projectName || projectAnalysisData?.name,
        address: params.address || projectAnalysisData?.address,
        gcEditedAnalysis: gcEditedAnalysis || aiAnalysis,
        acceptedRequest: {
          estimatedBudget: acceptedRequest?.estimatedBudget,
          estimatedDuration: acceptedRequest?.estimatedDuration,
          contractor: acceptedGC,
        },
        budget: acceptedRequest?.estimatedBudget || gcEditedAnalysis?.budget || gcEditedAnalysis?.estimatedBudget || aiAnalysis?.estimatedBudget || 0,
        paymentAmount: (acceptedRequest?.estimatedBudget || gcEditedAnalysis?.budget || gcEditedAnalysis?.estimatedBudget || aiAnalysis?.estimatedBudget || 0) * 1.0,
      };

      await saveProjectForLaterMutation.mutateAsync({
        projectId,
        projectData: projectDataToSave,
      });

      // Invalidate queries to refresh pending projects list
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['projects', 'pending'] });
      queryClient.invalidateQueries({ queryKey: ['projects', projectId] });

      // Show success and navigate to home
      setTimeout(() => {
        router.push('/(tabs)/home');
      }, 300);
    } catch (error: any) {
      console.error('Error saving project for later:', error);
      // Error will be handled by mutation
    }
  }, [projectId, gcRequestStatus, params, projectAnalysisData, gcEditedAnalysis, aiAnalysis, acceptedRequest, acceptedGC, designGC, designData, designAnalysis, saveProjectForLaterMutation, router, queryClient]);

  const handleStartBuilding = useCallback(() => {
    // Prevent multiple calls
    if (isProcessingPayment) {
      return;
    }
    
    if (gcRequestStatus !== 'accepted') {
      return;
    }

    if (!projectId) {
      return;
    }

    // Calculate payment amount - 100% of GC's estimated budget
    // Priority: GC's edited analysis > acceptedRequest.estimatedBudget > AI analysis > project data
    const gcEditedBudget = gcEditedAnalysis?.budget || gcEditedAnalysis?.estimatedBudget;
    const calculatedBudget = gcEditedBudget || acceptedRequest?.estimatedBudget || aiAnalysis?.estimatedBudget || aiAnalysis?.budget || projectAnalysisData?.budget || gcAcceptanceData?.project?.budget || 0;
    const calculatedAmount = calculatedBudget * 1.0; // 100% full payment

    if (calculatedAmount <= 0 || calculatedBudget <= 0) {
      // Show error in modal instead of silently returning
      setShowPaymentModal(true);
      setPaymentError(`Budget information is missing or invalid (Budget: ${calculatedBudget}). Please ensure the GC has set an estimated budget.`);
      return;
    }

    // Store payment details and show modal (simulated payment - no clientSecret needed)
    setPaymentAmount(calculatedAmount);
    setProjectBudget(calculatedBudget);
    setPaymentClientSecret('simulated'); // Set a dummy value so modal works
    setIsProcessingPayment(false); // Don't set to true, let modal handle it
    setShowPaymentModal(true);
  }, [isProcessingPayment, gcRequestStatus, projectId, acceptedRequest, aiAnalysis, projectAnalysisData, gcAcceptanceData, gcEditedAnalysis, handleCreatePaymentIntent]);

  // Show loading state only if we don't have analysis yet AND we're actually loading
  // Don't block rendering if we're just polling in the background
  if (isLoading && !aiAnalysis) {
    return (
      <View className="flex-1 bg-white items-center justify-center">
        <ActivityIndicator size="large" color="#000" />
        <Text className="text-gray-500 mt-4" style={{ fontFamily: 'Poppins_500Medium' }}>
          {isDesignSelection ? 'Loading design details...' : 'Loading project analysis...'}
        </Text>
        {!isDesignSelection && projectId && (
          <Text className="text-gray-400 text-sm mt-2" style={{ fontFamily: 'Poppins_400Regular' }}>
            AI is analyzing your plan...
          </Text>
        )}
      </View>
    );
  }

  // Allow page to render even if analysis isn't ready yet
  // This prevents constant reloading - we'll show a message instead

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
          Project Summary
        </Text>
        <Text 
          className="text-sm text-gray-500"
          style={{ fontFamily: 'Poppins_400Regular' }}
        >
          {isDesignSelection 
            ? `Detailed specifications for ${params.designName || designData?.name || 'selected design'}`
            : `AI-analyzed specifications for ${params.projectName || 'your project'}`}
        </Text>
      </View>

      <ScrollView className="flex-1 px-6">
        {/* Analysis Badge - Show if edited by GC or original AI (hide for design selection) */}
        {!isDesignSelection && aiAnalysis ? (
          <View className={`${gcEditedAnalysis ? 'bg-blue-50 border-blue-200' : 'bg-green-50 border-green-200'} border rounded-2xl p-4 mb-6 flex-row items-center`}>
            {gcEditedAnalysis ? (
              <>
                <HardHat size={24} color="#2563eb" strokeWidth={2} />
                <View className="ml-3 flex-1">
                  <Text className="text-blue-900 text-sm" style={{ fontFamily: 'Poppins_600SemiBold' }}>
                    Project Summary (Reviewed & Updated by GC) ✏️
                  </Text>
                  <Text className="text-blue-700 text-xs" style={{ fontFamily: 'Poppins_400Regular' }}>
                    Your General Contractor has reviewed and updated the project analysis with their professional estimates. The details below reflect their changes.
                  </Text>
                </View>
              </>
            ) : (
              <>
                <CheckCircle size={24} color="#059669" strokeWidth={2} />
                <View className="ml-3 flex-1">
                  <Text className="text-green-900 text-sm" style={{ fontFamily: 'Poppins_600SemiBold' }}>
                    AI Analysis Complete ({aiAnalysis?.confidence || 0}% confident)
                  </Text>
                  <Text className="text-green-700 text-xs" style={{ fontFamily: 'Poppins_400Regular' }}>
                    {aiAnalysis?.notes || 'AI analysis complete'}
                  </Text>
                </View>
              </>
            )}
          </View>
        ) : !isDesignSelection && !aiAnalysis ? (
          <View className="bg-yellow-50 border border-yellow-200 rounded-2xl p-4 mb-6 flex-row items-center">
            <Clock size={24} color="#d97706" strokeWidth={2} />
            <View className="ml-3 flex-1">
              <Text className="text-yellow-900 text-sm" style={{ fontFamily: 'Poppins_600SemiBold' }}>
                AI Analysis In Progress
              </Text>
              <Text className="text-yellow-700 text-xs" style={{ fontFamily: 'Poppins_400Regular' }}>
                Your plan is being analyzed. This page will update automatically when ready.
              </Text>
            </View>
          </View>
        ) : null}

        {/* Project Overview */}
        <View className="bg-gray-50 rounded-3xl p-6 mb-6 border border-gray-200">
          <Text 
            className="text-2xl text-black mb-4"
            style={{ fontFamily: 'Poppins_700Bold' }}
          >
            {isDesignSelection ? (params.designName || designData?.name || 'Design Plan') : (params.projectName || 'Project')}
          </Text>

          <Text 
            className="text-sm text-gray-600 mb-4"
            style={{ fontFamily: 'Poppins_400Regular' }}
          >
            📍 {params.address || (isDesignSelection ? 'Location to be determined' : 'Address not available')}
          </Text>

          {/* Specs Pills */}
          <View className="flex-row flex-wrap mb-6">
            <View className="bg-white rounded-full px-4 py-3 mr-3 mb-3 flex-row items-center border border-gray-200">
              <Bed size={18} color="#000000" strokeWidth={2} />
              <Text className="text-black ml-2" style={{ fontFamily: 'Poppins_500Medium' }}>
                {aiAnalysis?.bedrooms || 'N/A'} Bedrooms
              </Text>
            </View>
            
            <View className="bg-white rounded-full px-4 py-3 mr-3 mb-3 flex-row items-center border border-gray-200">
              <Bath size={18} color="#000000" strokeWidth={2} />
              <Text className="text-black ml-2" style={{ fontFamily: 'Poppins_500Medium' }}>
                {aiAnalysis?.bathrooms || 'N/A'} Bathrooms
              </Text>
            </View>
            
            <View className="bg-white rounded-full px-4 py-3 mr-3 mb-3 flex-row items-center border border-gray-200">
              <Maximize size={18} color="#000000" strokeWidth={2} />
              <Text className="text-black ml-2" style={{ fontFamily: 'Poppins_500Medium' }}>
                {aiAnalysis?.squareFootage || 'N/A'} sqft
              </Text>
            </View>

            <View className="bg-white rounded-full px-4 py-3 mr-3 mb-3 flex-row items-center border border-gray-200">
              <Home size={18} color="#000000" strokeWidth={2} />
              <Text className="text-black ml-2" style={{ fontFamily: 'Poppins_500Medium' }}>
                {aiAnalysis?.floors || 'N/A'} Floors
              </Text>
            </View>
          </View>

          {/* Cost & Duration */}
          <View className="flex-row justify-between">
            <View>
              <Text className="text-sm text-gray-500 mb-1" style={{ fontFamily: 'Poppins_400Regular' }}>
                Estimated Cost
              </Text>
              <Text className="text-2xl text-black" style={{ fontFamily: 'JetBrainsMono_500Medium' }}>
                ${(isDesignSelection 
                  ? (aiAnalysis?.estimatedBudget || designData?.estimatedCost || 0)
                  : (acceptedRequest?.estimatedBudget || aiAnalysis?.estimatedBudget || projectAnalysisData?.budget || 0)
                ).toLocaleString()}
              </Text>
            </View>
            
            <View>
              <Text className="text-sm text-gray-500 mb-1" style={{ fontFamily: 'Poppins_400Regular' }}>
                Duration
              </Text>
              <Text className="text-2xl text-black" style={{ fontFamily: 'JetBrainsMono_500Medium' }}>
                {isDesignSelection
                  ? (aiAnalysis?.estimatedDuration || '12-18 months')
                  : (acceptedRequest?.estimatedDuration || aiAnalysis?.estimatedDuration || aiAnalysis?.timeline || 'N/A')}
              </Text>
            </View>
          </View>
        </View>

        {/* Construction Phases Accordion */}
        <TouchableOpacity 
          onPress={() => toggleSection('phases')}
          className="bg-gray-50 rounded-2xl p-5 mb-4 border border-gray-200"
        >
          <View className="flex-row justify-between items-center">
            <Text className="text-lg text-black" style={{ fontFamily: 'Poppins_700Bold' }}>
              Construction Phases ({Array.isArray(aiAnalysis?.phases) ? aiAnalysis.phases.length : 0})
            </Text>
            {expandedSection === 'phases' ? (
              <ChevronUp size={24} color="#000000" strokeWidth={2} />
            ) : (
              <ChevronDown size={24} color="#000000" strokeWidth={2} />
            )}
          </View>
          
          {expandedSection === 'phases' && (
            <View className="mt-4">
              {Array.isArray(aiAnalysis?.phases) && aiAnalysis.phases.length > 0 ? (
                aiAnalysis.phases.map((phase: any, index: number) => (
                <View key={index} className="bg-white rounded-xl p-4 mb-3 border border-gray-200">
                  <Text className="text-black text-base mb-1" style={{ fontFamily: 'Poppins_600SemiBold' }}>
                    {index + 1}. {phase.name}
                  </Text>
                  <Text className="text-gray-600 text-sm mb-2" style={{ fontFamily: 'Poppins_400Regular' }}>
                    {phase.description}
                  </Text>
                  <View className="flex-row justify-between">
                    <View className="flex-row items-center">
                      <Clock size={14} color="#6b7280" strokeWidth={2} />
                      <Text className="text-gray-500 text-xs ml-1" style={{ fontFamily: 'Poppins_400Regular' }}>
                        {phase.estimatedDuration}
                      </Text>
                    </View>
                    <Text className="text-black text-sm" style={{ fontFamily: 'JetBrainsMono_500Medium' }}>
                      ${phase.estimatedCost.toLocaleString()}
                    </Text>
                  </View>
                </View>
                ))
              ) : (
                <Text className="text-gray-500 text-sm text-center py-4" style={{ fontFamily: 'Poppins_400Regular' }}>
                  No construction phases available
                </Text>
              )}
            </View>
          )}
        </TouchableOpacity>

        {/* Materials & Features */}
        <TouchableOpacity 
          onPress={() => toggleSection('details')}
          className="bg-gray-50 rounded-2xl p-5 mb-6 border border-gray-200"
        >
          <View className="flex-row justify-between items-center">
            <Text className="text-lg text-black" style={{ fontFamily: 'Poppins_700Bold' }}>
              Materials & Features
            </Text>
            {expandedSection === 'details' ? (
              <ChevronUp size={24} color="#000000" strokeWidth={2} />
            ) : (
              <ChevronDown size={24} color="#000000" strokeWidth={2} />
            )}
          </View>
          
          {expandedSection === 'details' && (
            <View className="mt-4">
              <Text className="text-black text-sm mb-2" style={{ fontFamily: 'Poppins_600SemiBold' }}>
                Rooms:
              </Text>
              <View className="flex-row flex-wrap mb-4">
                {(aiAnalysis?.rooms || []).map((room: string, index: number) => (
                  <View key={index} className="bg-white rounded-full px-3 py-2 mr-2 mb-2 border border-gray-200">
                    <Text className="text-gray-700 text-xs" style={{ fontFamily: 'Poppins_400Regular' }}>
                      {room}
                    </Text>
                  </View>
                ))}
              </View>

              <Text className="text-black text-sm mb-2" style={{ fontFamily: 'Poppins_600SemiBold' }}>
                Key Materials:
              </Text>
              <View className="mb-4">
                {(aiAnalysis?.materials || []).map((material: string, index: number) => (
                  <Text key={index} className="text-gray-600 text-sm mb-1" style={{ fontFamily: 'Poppins_400Regular' }}>
                    • {material}
                  </Text>
                ))}
              </View>

              <Text className="text-black text-sm mb-2" style={{ fontFamily: 'Poppins_600SemiBold' }}>
                Features:
              </Text>
              <View>
                {(aiAnalysis?.features || []).map((feature: string, index: number) => (
                  <Text key={index} className="text-gray-600 text-sm mb-1" style={{ fontFamily: 'Poppins_400Regular' }}>
                    • {feature}
                  </Text>
                ))}
              </View>
            </View>
          )}
        </TouchableOpacity>

        {/* GC Section - Show accepted GC or recommended GCs */}
        {/* For design selection, show only the GC who uploaded the design */}
        {isDesignSelection && designGC ? (
          <View className="mb-6">
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-2xl text-black" style={{ fontFamily: 'Poppins_700Bold' }}>
                Design Creator
              </Text>
              <View className="bg-blue-100 rounded-full px-3 py-1">
                <Text className="text-blue-700 text-xs" style={{ fontFamily: 'Poppins_600SemiBold' }}>
                  Design Owner
                </Text>
              </View>
            </View>

            <View className="bg-blue-50 border-2 border-blue-200 rounded-2xl p-5 mb-4">
              <View className="flex-row items-start justify-between mb-3">
                <View className="flex-1">
                  <View className="flex-row items-center mb-1">
                    <Text className="text-lg text-black" style={{ fontFamily: 'Poppins_700Bold' }}>
                      {designGC.name}
                    </Text>
                    {designGC.verified && (
                      <View className="ml-2 bg-green-500 rounded-full w-5 h-5 items-center justify-center">
                        <Text className="text-white text-xs">✓</Text>
                      </View>
                    )}
                  </View>
                  <Text className="text-sm mb-2 text-gray-600" style={{ fontFamily: 'Poppins_400Regular' }}>
                    {designGC.specialty}
                  </Text>
                  {designGC.location && (
                    <Text className="text-xs text-gray-500 mt-1" style={{ fontFamily: 'Poppins_400Regular' }}>
                      📍 {designGC.location}
                    </Text>
                  )}
                  {designGC.email && (
                    <Text className="text-xs text-gray-500 mt-1" style={{ fontFamily: 'Poppins_400Regular' }}>
                      📧 {designGC.email}
                    </Text>
                  )}
                </View>
              </View>

              <View className="flex-row items-center mb-3">
                <Star size={16} color="#000" strokeWidth={2} fill="#000" />
                <Text className="ml-1 text-black" style={{ fontFamily: 'Poppins_600SemiBold' }}>
                  {designGC.rating.toFixed(1)}
                </Text>
                <Text className="ml-1 text-gray-500" style={{ fontFamily: 'Poppins_400Regular' }}>
                  ({designGC.reviews} reviews) • {designGC.projects} projects
                </Text>
              </View>

              <View className="mt-3 pt-3 border-t border-blue-200">
                <Text className="text-blue-800 text-sm mb-1" style={{ fontFamily: 'Poppins_600SemiBold' }}>
                  This contractor created and uploaded this design plan
                </Text>
                <Text className="text-blue-700 text-xs" style={{ fontFamily: 'Poppins_400Regular' }}>
                  They have expertise in this design type
                </Text>
              </View>
            </View>

          </View>
        ) : gcRequestStatus === 'accepted' && acceptedRequest && acceptedRequest.status === 'accepted' && gcAcceptanceData?.acceptedRequestsCount > 0 && projectAnalysisData?.generalContractorId ? (
          <View className="mb-6">
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-2xl text-black" style={{ fontFamily: 'Poppins_700Bold' }}>
                Your General Contractor
              </Text>
              <View className="bg-green-100 rounded-full px-3 py-1">
                <Text className="text-green-700 text-xs" style={{ fontFamily: 'Poppins_600SemiBold' }}>
                  Accepted ✅
                </Text>
              </View>
            </View>

            <View className="bg-green-50 border-2 border-green-200 rounded-2xl p-5 mb-4">
              <View className="flex-row items-start justify-between mb-3">
                <View className="flex-1">
                  <View className="flex-row items-center mb-1">
                    <Text className="text-lg text-black" style={{ fontFamily: 'Poppins_700Bold' }}>
                      {acceptedGC?.name || acceptedRequest.contractor?.fullName || 'General Contractor'}
                    </Text>
                    {(acceptedGC?.verified || false) && (
                      <View className="ml-2 bg-green-500 rounded-full w-5 h-5 items-center justify-center">
                        <Text className="text-white text-xs">✓</Text>
                      </View>
                    )}
                  </View>
                  <Text className="text-sm mb-2 text-gray-600" style={{ fontFamily: 'Poppins_400Regular' }}>
                    {acceptedGC?.specialty || 'General Construction'}
                  </Text>
                  {acceptedGC?.location && (
                    <Text className="text-xs text-gray-500 mt-1" style={{ fontFamily: 'Poppins_400Regular' }}>
                      📍 {acceptedGC.location}
                    </Text>
                  )}
                  {acceptedRequest.contractor?.email && (
                    <Text className="text-xs text-gray-500 mt-1" style={{ fontFamily: 'Poppins_400Regular' }}>
                      📧 {acceptedRequest.contractor.email}
                    </Text>
                  )}
                </View>
              </View>

              {(acceptedGC?.rating || acceptedGC?.reviews || acceptedGC?.projects) && (
                <View className="flex-row items-center mb-3">
                  <Star size={16} color="#000" strokeWidth={2} fill="#000" />
                  <Text className="ml-1 text-black" style={{ fontFamily: 'Poppins_600SemiBold' }}>
                    {acceptedGC?.rating?.toFixed(1) || 'N/A'}
                  </Text>
                  <Text className="ml-1 text-gray-500" style={{ fontFamily: 'Poppins_400Regular' }}>
                    ({acceptedGC?.reviews || 0} reviews) • {acceptedGC?.projects || 0} projects
                  </Text>
                </View>
              )}

              <View className="mt-3 pt-3 border-t border-green-200">
                <Text className="text-green-800 text-sm mb-1" style={{ fontFamily: 'Poppins_600SemiBold' }}>
                  GC's Estimated Budget: ${(acceptedRequest.estimatedBudget || projectAnalysisData?.budget || 0).toLocaleString()}
                </Text>
                {acceptedRequest.estimatedDuration && (
                  <Text className="text-green-700 text-sm" style={{ fontFamily: 'Poppins_400Regular' }}>
                    Estimated Duration: {acceptedRequest.estimatedDuration}
                  </Text>
                )}
              </View>
            </View>
          </View>
        ) : (
          <View className="mb-6">
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-2xl text-black" style={{ fontFamily: 'Poppins_700Bold' }}>
                Recommended GCs
              </Text>
              <View className="bg-blue-100 rounded-full px-3 py-1">
                <Text className="text-blue-700 text-xs" style={{ fontFamily: 'Poppins_600SemiBold' }}>
                  Top {recommendedGCs.length} Matches
                </Text>
              </View>
            </View>

            <Text className="text-gray-500 text-sm mb-4" style={{ fontFamily: 'Poppins_400Regular' }}>
              Based on your location, project type, and budget. Select 2-3 to send your project request.
            </Text>

          {loadingGCs ? (
            <View className="bg-gray-50 rounded-2xl p-6 items-center">
              <ActivityIndicator size="small" color="#000" />
              <Text className="text-gray-500 mt-2" style={{ fontFamily: 'Poppins_400Regular' }}>
                Loading recommended GCs...
              </Text>
            </View>
          ) : recommendedGCs.length === 0 ? (
            <View className="bg-yellow-50 border border-yellow-200 rounded-2xl p-6">
              <Text className="text-yellow-900 text-center" style={{ fontFamily: 'Poppins_600SemiBold' }}>
                No GCs Available
              </Text>
              <Text className="text-yellow-700 text-sm text-center mt-2" style={{ fontFamily: 'Poppins_400Regular' }}>
                {gcError 
                  ? `Error loading GCs: ${gcError.message || 'Unknown error'}. Please try again later.`
                  : 'No General Contractors are currently available. Please check back later or contact support.'}
              </Text>
              {gcError && (
                <TouchableOpacity
                  onPress={() => {
                    // Force refetch
                    window.location.reload();
                  }}
                  className="bg-yellow-600 rounded-full px-6 py-3 mt-4 self-center"
                >
                  <Text className="text-white" style={{ fontFamily: 'Poppins_600SemiBold' }}>
                    Retry
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          ) : (
            recommendedGCs.map((gc) => {
            // Use user.id (not contractor profile id) for sending requests
            const gcUserId = gc.user?.id || gc.userId || gc.id;
            return (
            <TouchableOpacity
              key={gc.id}
              onPress={() => toggleGCSelection(gcUserId)}
              className={`rounded-2xl p-5 mb-4 border-2 ${
                selectedGCs.has(gcUserId) 
                  ? 'bg-black border-black' 
                  : 'bg-white border-gray-200'
              }`}
            >
              <View className="flex-row items-start justify-between mb-3">
                <View className="flex-1">
                  <View className="flex-row items-center mb-1">
                    <Text 
                      className={`text-lg ${selectedGCs.has(gcUserId) ? 'text-white' : 'text-black'}`}
                      style={{ fontFamily: 'Poppins_700Bold' }}
                    >
                      {gc.name}
                    </Text>
                    {gc.verified && (
                      <View className="ml-2 bg-green-500 rounded-full w-5 h-5 items-center justify-center">
                        <Text className="text-white text-xs">✓</Text>
                      </View>
                    )}
                  </View>
                  <Text 
                    className={`text-sm mb-2 ${selectedGCs.has(gcUserId) ? 'text-white/70' : 'text-gray-600'}`}
                    style={{ fontFamily: 'Poppins_400Regular' }}
                  >
                    {gc.specialty}
                  </Text>
                </View>
                <View className={`rounded-full px-3 py-1 ${
                  selectedGCs.has(gcUserId) ? 'bg-white/20' : 'bg-green-100'
                }`}>
                  <Text 
                    className={`text-xs ${selectedGCs.has(gcUserId) ? 'text-white' : 'text-green-700'}`}
                    style={{ fontFamily: 'Poppins_600SemiBold' }}
                  >
                    {gc.matchScore}% Match
                  </Text>
                </View>
              </View>

              <View className="flex-row items-center mb-3">
                <Star size={16} color={selectedGCs.has(gcUserId) ? '#fff' : '#000'} strokeWidth={2} fill={selectedGCs.has(gcUserId) ? '#fff' : '#000'} />
                <Text 
                  className={`ml-1 ${selectedGCs.has(gcUserId) ? 'text-white' : 'text-black'}`}
                  style={{ fontFamily: 'Poppins_600SemiBold' }}
                >
                  {gc.rating}
                </Text>
                <Text 
                  className={`ml-1 ${selectedGCs.has(gcUserId) ? 'text-white/70' : 'text-gray-500'}`}
                  style={{ fontFamily: 'Poppins_400Regular' }}
                >
                  ({gc.reviews} reviews) • {gc.projects} projects
                </Text>
              </View>

              <View className="flex-row justify-between pt-3 border-t border-white/20">
                <View>
                  <Text className={`text-xs ${selectedGCs.has(gcUserId) ? 'text-white/70' : 'text-gray-500'}`} style={{ fontFamily: 'Poppins_400Regular' }}>
                    Experience
                  </Text>
                  <Text className={`${selectedGCs.has(gcUserId) ? 'text-white' : 'text-black'}`} style={{ fontFamily: 'Poppins_500Medium' }}>
                    {gc.projects}+ projects
                  </Text>
                </View>
                <View>
                  <Text className={`text-xs ${selectedGCs.has(gcUserId) ? 'text-white/70' : 'text-gray-500'}`} style={{ fontFamily: 'Poppins_400Regular' }}>
                    Location
                  </Text>
                  <Text className={`${selectedGCs.has(gcUserId) ? 'text-white' : 'text-black'}`} style={{ fontFamily: 'Poppins_500Medium' }}>
                    {gc.location || 'N/A'}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
            );
          })
          )}
          </View>
        )}

        {/* Action Buttons */}
        {/* For design selection, create project and send request to GC */}
        {isDesignSelection && designGC && gcRequestStatus === 'none' && (
          <TouchableOpacity
            onPress={async () => {
              if (!designId) {
                console.error('❌ [house-summary] No designId found');
                Alert.alert('Error', 'Design ID is missing. Please try again.');
                return;
              }
              
              try {
                setIsSendingRequests(true);
                
                // Get address from params (passed from explore/design-library)
                const address = params.address as string;
                
                if (!address) {
                  setIsSendingRequests(false);
                  setShowAddressModal(true);
                  return;
                }
                
                const projectData = {
                  designId,
                  address,
                  street: params.street as string,
                  city: params.city as string,
                  state: params.state as string,
                  zipCode: params.zipCode as string,
                  country: params.country as string,
                  latitude: params.latitude ? parseFloat(params.latitude as string) : undefined,
                  longitude: params.longitude ? parseFloat(params.longitude as string) : undefined,
                };
                
                // Create project from design and send request to GC
                const project = await createProjectFromDesignMutation.mutateAsync(projectData);
                
                // Set project ID - status will be updated by polling
                setProjectId(project.id);
                // Don't set status here - let the polling check determine it
                // The status will be set to 'pending' once the checkGCAcceptance hook detects a pending request
                // Wait a moment for backend to save the request, then invalidate and poll
                setTimeout(() => {
                  queryClient.invalidateQueries({ queryKey: ['projects', project.id, 'gc-acceptance'] });
                  queryClient.invalidateQueries({ queryKey: ['projects', project.id, 'analysis'] });
                }, 1000); // Wait 1 second for backend to process
              } catch (error: any) {
                console.error('❌ [house-summary] Error creating project from design:', error);
                console.error('❌ [house-summary] Error details:', {
                  message: error?.message,
                  response: error?.response,
                  stack: error?.stack,
                });
                Alert.alert(
                  'Error',
                  error?.message || 'Failed to send request to contractor. Please try again.',
                  [{ text: 'OK' }]
                );
              } finally {
                setIsSendingRequests(false);
              }
            }}
            disabled={createProjectFromDesignMutation.isPending || isSendingRequests}
            className={`bg-black rounded-full py-5 px-8 mb-4 ${(createProjectFromDesignMutation.isPending || isSendingRequests) ? 'opacity-50' : ''}`}
            activeOpacity={0.7}
          >
            {createProjectFromDesignMutation.isPending || isSendingRequests ? (
              <View className="flex-row items-center justify-center">
                <ActivityIndicator size="small" color="#FFFFFF" />
                <Text className="text-white text-lg ml-2" style={{ fontFamily: 'Poppins_700Bold' }}>
                  Sending Request...
                </Text>
              </View>
            ) : (
              <Text className="text-white text-lg text-center" style={{ fontFamily: 'Poppins_700Bold' }}>
                Work with This Contractor
              </Text>
            )}
          </TouchableOpacity>
        )}

        {!isDesignSelection && gcRequestStatus === 'none' && (
          <TouchableOpacity
            onPress={handleSendRequests}
            disabled={selectedGCs.size === 0 || isSendingRequests}
            className={`rounded-full py-5 px-8 mb-4 flex-row items-center justify-center ${
              selectedGCs.size > 0 && !isSendingRequests ? 'bg-blue-600' : 'bg-gray-200'
            }`}
          >
            {isSendingRequests ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Send size={20} color={selectedGCs.size > 0 ? "#FFFFFF" : "#A3A3A3"} strokeWidth={2} />
                <Text 
                  className={`text-lg ml-2 ${selectedGCs.size > 0 ? 'text-white' : 'text-gray-400'}`}
                  style={{ fontFamily: 'Poppins_700Bold' }}
                >
                  Send Request to {selectedGCs.size} GC{selectedGCs.size !== 1 ? 's' : ''}
                </Text>
              </>
            )}
          </TouchableOpacity>
        )}

        {gcRequestStatus === 'pending' && (
          <View className="bg-yellow-50 border border-yellow-200 rounded-2xl p-5 mb-4">
            <View className="flex-row items-center mb-2">
              <Clock size={20} color="#d97706" strokeWidth={2} />
              <Text className="text-yellow-900 text-lg ml-2" style={{ fontFamily: 'Poppins_700Bold' }}>
                Request Pending Review
              </Text>
            </View>
            <Text className="text-yellow-800 text-sm mb-2" style={{ fontFamily: 'Poppins_400Regular' }}>
              {isDesignSelection 
                ? 'Your request has been sent to the contractor. They will review and respond within 24-48 hours.'
                : `Your request has been sent to ${gcAcceptanceData?.pendingRequestsCount || selectedGCs.size || 1} contractor(s). They will review your project and respond soon.`}
            </Text>
            <Text className="text-yellow-700 text-xs mt-2" style={{ fontFamily: 'Poppins_400Regular', fontStyle: 'italic' }}>
              You'll be notified as soon as a contractor accepts your project.
            </Text>
          </View>
        )}

        {gcRequestStatus === 'accepted' && (
          <View className="bg-green-50 border border-green-200 rounded-2xl p-5 mb-4">
            <View className="flex-row items-center mb-2">
              <CheckCircle size={20} color="#059669" strokeWidth={2} />
              <Text className="text-green-900 text-lg ml-2" style={{ fontFamily: 'Poppins_700Bold' }}>
                {isDesignSelection ? 'Ready to Build!' : 'GC Accepted!'}
              </Text>
            </View>
            <Text className="text-green-800 text-sm mb-3" style={{ fontFamily: 'Poppins_400Regular' }}>
              {isDesignSelection 
                ? 'You\'ve selected this contractor to build your design. Review the details and proceed to payment.'
                : 'A contractor has accepted your project. You can now start building!'}
            </Text>
            {!isDesignSelection && (
            <View className="bg-yellow-50 border border-yellow-200 rounded-xl p-3 mt-3">
              <View className="flex-row items-start">
                <AlertCircle size={16} color="#d97706" strokeWidth={2} className="mt-0.5" />
                <Text className="text-yellow-900 text-xs ml-2 flex-1" style={{ fontFamily: 'Poppins_500Medium' }}>
                  <Text style={{ fontFamily: 'Poppins_700Bold' }}>Important:</Text> Please review the project summary above as your General Contractor may have made changes to the initial AI analysis (budget, timeline, materials, phases, etc.) before accepting your project.
                </Text>
              </View>
            </View>
            )}
          </View>
        )}

        {/* Action Buttons - Pay and Save for Later */}
        {/* Show for both design selection and project flow when GC is accepted */}
        {/* Only show if status is accepted AND we have an accepted request with status 'accepted' AND confirmed acceptance */}
        {gcRequestStatus === 'accepted' && (isDesignSelection || (acceptedRequest && acceptedRequest.status === 'accepted' && gcAcceptanceData?.acceptedRequestsCount > 0 && projectAnalysisData?.generalContractorId)) && (
          <View className="flex-row gap-3 mb-8">
            <TouchableOpacity
              onPress={handleSaveForLater}
              disabled={saveProjectForLaterMutation.isPending}
              className="flex-1 rounded-full py-5 px-8 border-2 border-black bg-white"
            >
              {saveProjectForLaterMutation.isPending ? (
                <View className="flex-row items-center justify-center">
                  <ActivityIndicator size="small" color="#000000" />
                  <Text className="text-black text-lg ml-2" style={{ fontFamily: 'Poppins_700Bold' }}>
                    Saving...
                  </Text>
                </View>
              ) : (
                <Text className="text-black text-lg text-center" style={{ fontFamily: 'Poppins_700Bold' }}>
                  Save for Later
                </Text>
              )}
            </TouchableOpacity>
            
            <TouchableOpacity
              onPress={handleStartBuilding}
              disabled={isProcessingPayment || createPaymentIntentMutation.isPending || activateProjectMutation.isPending}
              className={`flex-1 rounded-full py-5 px-8 ${
                (!createPaymentIntentMutation.isPending && !activateProjectMutation.isPending) 
                  ? 'bg-black' 
                  : 'bg-gray-200'
              }`}
            >
              {(createPaymentIntentMutation.isPending || activateProjectMutation.isPending) ? (
                <View className="flex-row items-center justify-center">
                  <ActivityIndicator size="small" color="#FFFFFF" />
                  <Text className="text-white text-lg ml-2" style={{ fontFamily: 'Poppins_700Bold' }}>
                    Processing...
                  </Text>
                </View>
              ) : (
                <Text className="text-white text-lg text-center" style={{ fontFamily: 'Poppins_700Bold' }}>
                  Pay & Start Building
                </Text>
              )}
            </TouchableOpacity>
          </View>
        )}
        
      </ScrollView>

      {/* Payment Modal */}
      <PaymentModal
        visible={showPaymentModal}
        onClose={() => {
          setShowPaymentModal(false);
          setIsProcessingPayment(false);
          setPaymentClientSecret(null);
          setPaymentError(null);
        }}
        amount={paymentAmount}
        projectBudget={projectBudget}
        projectName={projectAnalysisData?.name || 'Project'}
        onPaymentSuccess={handlePaymentSuccess}
        onPaymentError={handlePaymentError}
        clientSecret={paymentClientSecret || undefined}
        externalError={paymentError || undefined}
      />

      {/* Address Input Modal */}
      <Modal
        visible={showAddressModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowAddressModal(false)}
      >
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-white rounded-t-3xl px-6 pt-6 pb-8 max-h-[90%]">
            {/* Header */}
            <View className="flex-row items-center justify-between mb-6">
              <View className="flex-1">
                <Text className="text-2xl text-black mb-1" style={{ fontFamily: 'Poppins_700Bold' }}>
                  Enter Project Location
                </Text>
                <Text className="text-sm text-gray-500" style={{ fontFamily: 'Poppins_400Regular' }}>
                  Search for an address where you want to build
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => {
                  setShowAddressModal(false);
                  setSelectedAddress(null);
                }}
                className="ml-4"
              >
                <X size={24} color="#000000" strokeWidth={2} />
              </TouchableOpacity>
            </View>

            {/* Address Input */}
            <View className="mb-4">
              {GooglePlacesAutocomplete ? (
                <GooglePlacesAutocomplete
                  ref={autocompleteRef}
                  placeholder="Search for an address..."
                  fetchDetails={true}
                  onPress={async (data: any, details: any) => {
                    if (!details?.geometry?.location) return;

                    const { lat, lng } = details.geometry.location;
                    
                    // Get full address details
                    const addressDetails = await reverseGeocode(lat, lng);
                    
                    if (addressDetails) {
                      setSelectedAddress(addressDetails);
                      Keyboard.dismiss();
                    }
                  }}
                  query={{
                    key: GOOGLE_MAPS_CONFIG.apiKey,
                    language: 'en',
                    components: 'country:ng',
                  }}
                  styles={{
                    container: {
                      flex: 0,
                    },
                    textInputContainer: {
                      backgroundColor: '#F9FAFB',
                      borderRadius: 16,
                      borderWidth: 1,
                      borderColor: '#E5E7EB',
                      paddingHorizontal: 4,
                    },
                    textInput: {
                      height: 48,
                      color: '#000',
                      fontSize: 16,
                      fontFamily: 'Poppins_400Regular',
                      backgroundColor: 'transparent',
                    },
                    predefinedPlacesDescription: {
                      color: '#1faadb',
                    },
                    listView: {
                      backgroundColor: 'white',
                      borderRadius: 12,
                      marginTop: 4,
                      elevation: 3,
                      shadowColor: '#000',
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: 0.1,
                      shadowRadius: 4,
                      maxHeight: 200,
                    },
                    row: {
                      padding: 12,
                      height: 'auto',
                      minHeight: 48,
                    },
                    description: {
                      fontFamily: 'Poppins_400Regular',
                      fontSize: 14,
                    },
                  }}
                  enablePoweredByContainer={false}
                  renderLeftButton={() => (
                    <View className="absolute left-4 top-3 z-10">
                      <Search size={20} color="#9CA3AF" strokeWidth={2} />
                    </View>
                  )}
                  textInputProps={{
                    placeholderTextColor: '#A3A3A3',
                    style: { paddingLeft: 36 },
                  }}
                />
              ) : (
                // Web fallback: Simple text input
                <View className="bg-gray-100 rounded-2xl px-4 py-3 flex-row items-center border border-gray-300">
                  <Search size={20} color="#9CA3AF" strokeWidth={2} />
                  <TextInput
                    placeholder="Enter address (e.g., 123 Main St, Lagos, Nigeria)"
                    placeholderTextColor="#A3A3A3"
                    value={selectedAddress?.formattedAddress || ''}
                    onChangeText={(text) => {
                      if (text.trim()) {
                        // Create a basic address object for web
                        const parts = text.split(',');
                        setSelectedAddress({
                          formattedAddress: text,
                          street: parts[0]?.trim() || '',
                          city: parts[1]?.trim() || '',
                          state: parts[2]?.trim() || '',
                          zipCode: '',
                          country: 'Nigeria',
                          latitude: 0,
                          longitude: 0,
                        });
                      } else {
                        setSelectedAddress(null);
                      }
                    }}
                    className="flex-1 ml-3 text-black text-base"
                    style={{ fontFamily: 'Poppins_400Regular' }}
                  />
                </View>
              )}
            </View>

            {/* Selected Address Display */}
            {selectedAddress && (
              <View className="bg-gray-50 rounded-2xl p-4 mb-4 border border-gray-200">
                <View className="flex-row items-start mb-2">
                  <MapPin size={20} color="#059669" strokeWidth={2} className="mt-0.5" />
                  <View className="flex-1 ml-3">
                    <Text className="text-black text-base mb-1" style={{ fontFamily: 'Poppins_600SemiBold' }}>
                      {selectedAddress.formattedAddress}
                    </Text>
                    <Text className="text-gray-500 text-sm" style={{ fontFamily: 'Poppins_400Regular' }}>
                      {selectedAddress.city}, {selectedAddress.state} {selectedAddress.zipCode}
                    </Text>
                  </View>
                </View>
              </View>
            )}

            {/* Continue Button */}
            <TouchableOpacity
              onPress={async () => {
                if (!selectedAddress) {
                  Alert.alert('Address Required', 'Please select an address from the search results');
                  return;
                }

                try {
                  setIsSendingRequests(true);
                  setShowAddressModal(false);
                  
                  const projectData = {
                    designId,
                    address: selectedAddress.formattedAddress,
                    street: selectedAddress.street,
                    city: selectedAddress.city,
                    state: selectedAddress.state,
                    zipCode: selectedAddress.zipCode,
                    country: selectedAddress.country,
                    latitude: selectedAddress.latitude,
                    longitude: selectedAddress.longitude,
                  };
                  
                  // Create project from design and send request to GC
                  const project = await createProjectFromDesignMutation.mutateAsync(projectData);
                  
                  // Set project ID and status to pending
                  setProjectId(project.id);
                  setGcRequestStatus('pending');
                  setSelectedAddress(null);
                } catch (error: any) {
                  console.error('❌ [house-summary] Error creating project from design:', error);
                  Alert.alert(
                    'Error',
                    error?.message || 'Failed to send request to contractor. Please try again.',
                    [{ text: 'OK' }]
                  );
                } finally {
                  setIsSendingRequests(false);
                }
              }}
              disabled={!selectedAddress || createProjectFromDesignMutation.isPending || isSendingRequests}
              className={`rounded-full py-4 px-8 ${
                selectedAddress && !createProjectFromDesignMutation.isPending && !isSendingRequests
                  ? 'bg-black'
                  : 'bg-gray-200'
              }`}
            >
              {createProjectFromDesignMutation.isPending || isSendingRequests ? (
                <View className="flex-row items-center justify-center">
                  <ActivityIndicator size="small" color="#FFFFFF" />
                  <Text className="text-white text-lg ml-2" style={{ fontFamily: 'Poppins_700Bold' }}>
                    Sending Request...
                  </Text>
                </View>
              ) : (
                <Text
                  className={`text-lg text-center ${
                    selectedAddress ? 'text-white' : 'text-gray-400'
                  }`}
                  style={{ fontFamily: 'Poppins_700Bold' }}
                >
                  Continue
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}
