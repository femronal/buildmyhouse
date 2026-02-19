import { View, Text, ScrollView, TouchableOpacity, Image, ActivityIndicator, Modal, Alert } from "react-native";
import { useRouter } from "expo-router";
import { ArrowLeft, Home, DollarSign, Trash2, Bed, Bath, Maximize, Calendar, HardHat, Star, MapPin, ChevronRight, Clock, X, ExternalLink, CreditCard, CheckCircle2 } from "lucide-react-native";
import { useState } from "react";
import { usePendingProjects, useDeletePendingProject, useDeclareManualPayment } from '@/hooks';
import { useCreatePaymentIntent } from '@/hooks/usePayment';
import { useActivateProject } from '@/hooks';
import PaymentModal from '@/components/PaymentModal';
import * as WebBrowser from 'expo-web-browser';

export default function PendingProjectsScreen() {
  const router = useRouter();
  const { data: pendingProjects = [], isLoading, refetch } = usePendingProjects();
  const deleteProjectMutation = useDeletePendingProject();
  const createPaymentIntentMutation = useCreatePaymentIntent();
  const activateProjectMutation = useActivateProject();
  const declareManualPaymentMutation = useDeclareManualPayment();
  
  const [selectedProject, setSelectedProject] = useState<any>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<any | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [projectBudget, setProjectBudget] = useState<number>(0);
  const [paymentClientSecret, setPaymentClientSecret] = useState<string | null>(null);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  // Helper function to extract project ID from various possible locations
  const getProjectId = (project: any): string | null => {
    return (
      project?.id || 
      project?.projectId || 
      project?.project?.id ||
      project?.acceptedRequest?.projectId ||
      project?.acceptedRequest?.project?.id ||
      null
    );
  };

  const handleViewProject = (project: any) => {
    setSelectedProject(project);
  };

  const handlePay = async (project: any) => {
    const budget = project.budget || project.gcEditedAnalysis?.budget || project.gcEditedAnalysis?.estimatedBudget || project.acceptedRequest?.estimatedBudget || 0;
    let amount = budget * 1.0;
    
    if (amount <= 0) {
      Alert.alert('Error', 'Budget information is missing. Cannot proceed with payment.');
      return;
    }

    // Stripe maximum amount is $999,999.99 (in dollars, not cents)
    const STRIPE_MAX_AMOUNT = 999999.99;
    if (amount > STRIPE_MAX_AMOUNT) {
      setPaymentError(`Payment amount ($${amount.toLocaleString()}) exceeds the maximum allowed amount of $${STRIPE_MAX_AMOUNT.toLocaleString()}. Please contact support.`);
      setShowPaymentModal(true);
      setIsProcessingPayment(false);
      return;
    }

    setSelectedProject(project);
    setPaymentAmount(amount);
    setProjectBudget(budget);
    setPaymentClientSecret(null);
    setIsProcessingPayment(true);
    setShowPaymentModal(true);
    setPaymentError(null);

    // Create payment intent
    try {
      const paymentResult = await createPaymentIntentMutation.mutateAsync({
        amount,
        projectId: project.projectId || project.id,
        currency: 'usd',
        description: `Project activation payment - ${project.name || 'Project'}`,
      });

      if (paymentResult?.paymentIntent?.clientSecret) {
        setPaymentClientSecret(paymentResult.paymentIntent.clientSecret);
        setIsProcessingPayment(false);
      } else {
        setPaymentError('Payment intent created but no client secret received. Please try again.');
        setIsProcessingPayment(false);
      }
    } catch (error: any) {
      setPaymentError(error?.message || 'Failed to create payment intent');
      setIsProcessingPayment(false);
    }
  };

  const handleOpenExternalLink = async (url?: string) => {
    if (!url) return;
    try {
      await WebBrowser.openBrowserAsync(url);
    } catch {
      Alert.alert('Could not open link', 'Please try again.');
    }
  };

  const handleDeclarePaid = async (projectId: string) => {
    Alert.alert(
      'Confirm payment',
      "Only tap 'I paid' after you’ve completed the deposit using the payment instructions (Stripe invoice, Wise, Paystack, or Zelle).",
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'I paid',
          onPress: async () => {
            try {
              await declareManualPaymentMutation.mutateAsync(projectId);
              Alert.alert('Submitted', 'We’ll review your payment and notify you when tracking is unlocked.');
              refetch();
            } catch (e: any) {
              Alert.alert('Could not submit', e?.message || 'Please try again.');
            }
          },
        },
      ],
    );
  };

  const handlePaymentSuccess = async () => {
    if (!selectedProject) return;

    try {
      await activateProjectMutation.mutateAsync(selectedProject.projectId || selectedProject.id);
      setShowPaymentModal(false);
      setSelectedProject(null);
      refetch();
      router.push('/(tabs)/home');
    } catch (error: any) {
      setPaymentError(error?.message || 'Failed to activate project');
    }
  };

  const handlePaymentError = (error: string) => {
    setPaymentError(error);
    setIsProcessingPayment(false);
  };

  const handleDelete = (project: any) => {
    const projectId = getProjectId(project);
    
    if (!projectId) {
      Alert.alert('Error', 'Unable to identify project. Please try again.');
      return;
    }
    
    setProjectToDelete(project);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (!projectToDelete) return;

    setIsDeleting(true);
    try {
      const projectId = getProjectId(projectToDelete);

      if (!projectId) {
        throw new Error('Project ID not found. Cannot delete project.');
      }

      await deleteProjectMutation.mutateAsync(projectId);
      setShowDeleteConfirm(false);
      setProjectToDelete(null);
      setIsDeleting(false);
      refetch();
    } catch (error: any) {
      console.error('❌ [Pending Projects] Error deleting project:', error);
      setIsDeleting(false);
      Alert.alert('Error', error?.message || 'Failed to delete project');
    }
  };

  const cancelDelete = () => {
    setShowDeleteConfirm(false);
    setProjectToDelete(null);
    setIsDeleting(false);
  };

  if (isLoading) {
    return (
      <View className="flex-1 bg-white items-center justify-center">
        <ActivityIndicator size="large" color="#000" />
        <Text className="text-gray-500 mt-4" style={{ fontFamily: 'Poppins_500Medium' }}>
          Loading pending projects...
        </Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-white">
      <View className="pt-16 px-6 pb-4">
        <View className="flex-row items-center mb-4">
          <TouchableOpacity 
            onPress={() => {
              if (router.canGoBack()) {
                router.back();
              } else {
                router.push('/(tabs)/home');
              }
            }} 
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
          Pending Projects
        </Text>
        <Text 
          className="text-sm text-gray-500"
          style={{ fontFamily: 'Poppins_400Regular' }}
        >
          Projects reviewed by GC, awaiting payment
        </Text>
      </View>

      <ScrollView className="flex-1 px-6">
        {pendingProjects.length === 0 ? (
          <View className="items-center justify-center py-20">
            <Clock size={64} color="#D4D4D4" strokeWidth={1.5} />
            <Text 
              className="text-xl text-gray-500 mt-4 text-center"
              style={{ fontFamily: 'Poppins_600SemiBold' }}
            >
              No Pending Projects
            </Text>
            <Text 
              className="text-gray-400 text-sm mt-2 text-center"
              style={{ fontFamily: 'Poppins_400Regular' }}
            >
              Projects reviewed by GCs will appear here
            </Text>
          </View>
        ) : (
          pendingProjects.map((project: any, index: number) => {
            const gcAnalysis = project.gcEditedAnalysis || project.acceptedRequest?.gcEditedAnalysis || project.aiAnalysis;
            const budget = project.budget || project.acceptedRequest?.estimatedBudget || gcAnalysis?.budget || gcAnalysis?.estimatedBudget || 0;
            const paymentAmount = budget * 1.0;
            const gc = project.acceptedRequest?.contractor || project.acceptedRequest?.contractorProfile;
            const projectId = project.id || project.projectId || `pending-${index}`;
            const uniqueKey = `pending-${projectId}-${index}`;
            const projectType = project.projectType as string | undefined;
            const isHomebuilding = projectType === 'homebuilding';
            const externalPaymentLink = project.externalPaymentLink as string | undefined;
            const paymentConfirmationStatus =
              (project.paymentConfirmationStatus as string | undefined) || 'not_declared';
            const declaredAt = project.paymentDeclaredAt ? new Date(project.paymentDeclaredAt) : null;

            return (
              <View
                key={uniqueKey}
                className="bg-gray-50 rounded-3xl mb-4 overflow-hidden border border-gray-200"
              >
                <View className="p-5">
                  <View className="flex-row justify-between items-start mb-3">
                    <View className="flex-1">
                      <Text 
                        className="text-xl text-black mb-1"
                        style={{ fontFamily: 'Poppins_700Bold' }}
                      >
                        {project.name || 'Untitled Project'}
                      </Text>
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
                    {isHomebuilding && paymentConfirmationStatus === 'declared' ? (
                      <View className="bg-yellow-100 rounded-full px-3 py-1">
                        <Text className="text-yellow-700 text-xs" style={{ fontFamily: 'Poppins_600SemiBold' }}>
                          Under review
                        </Text>
                      </View>
                    ) : (
                      <View className="bg-yellow-100 rounded-full px-3 py-1">
                        <Text className="text-yellow-700 text-xs" style={{ fontFamily: 'Poppins_600SemiBold' }}>
                          Unpaid
                        </Text>
                      </View>
                    )}
                  </View>

                  {/* GC Info */}
                  {gc && (
                    <View className="bg-white rounded-2xl p-3 mb-3 border border-gray-200">
                      <View className="flex-row items-center">
                        <HardHat size={18} color="#000000" strokeWidth={2} />
                        <Text 
                          className="text-black ml-2 flex-1"
                          style={{ fontFamily: 'Poppins_600SemiBold' }}
                        >
                          {gc.name || gc.fullName || 'General Contractor'}
                        </Text>
                        {gc.rating && (
                          <View className="flex-row items-center">
                            <Star size={14} color="#000000" strokeWidth={2} fill="#000000" />
                            <Text 
                              className="text-black ml-1 text-sm"
                              style={{ fontFamily: 'Poppins_600SemiBold' }}
                            >
                              {gc.rating}
                            </Text>
                          </View>
                        )}
                      </View>
                    </View>
                  )}

                  {/* Project Specs */}
                  {gcAnalysis && (
                    <View className="flex-row flex-wrap mb-3">
                      {gcAnalysis.bedrooms && (
                        <View className="bg-white rounded-full px-3 py-2 mr-2 mb-2 flex-row items-center border border-gray-200">
                          <Bed size={14} color="#000000" strokeWidth={2} />
                          <Text className="text-black ml-1 text-xs" style={{ fontFamily: 'Poppins_500Medium' }}>
                            {gcAnalysis.bedrooms} Beds
                          </Text>
                        </View>
                      )}
                      {gcAnalysis.bathrooms && (
                        <View className="bg-white rounded-full px-3 py-2 mr-2 mb-2 flex-row items-center border border-gray-200">
                          <Bath size={14} color="#000000" strokeWidth={2} />
                          <Text className="text-black ml-1 text-xs" style={{ fontFamily: 'Poppins_500Medium' }}>
                            {gcAnalysis.bathrooms} Baths
                          </Text>
                        </View>
                      )}
                      {gcAnalysis.squareFootage && (
                        <View className="bg-white rounded-full px-3 py-2 mr-2 mb-2 flex-row items-center border border-gray-200">
                          <Maximize size={14} color="#000000" strokeWidth={2} />
                          <Text className="text-black ml-1 text-xs" style={{ fontFamily: 'Poppins_500Medium' }}>
                            {gcAnalysis.squareFootage} sqft
                          </Text>
                        </View>
                      )}
                    </View>
                  )}

                  {/* Budget Info */}
                  <View className="bg-black rounded-2xl p-4 mb-3">
                    <View className="flex-row justify-between items-center">
                      <View>
                        <Text 
                          className="text-white/70 text-xs mb-1"
                          style={{ fontFamily: 'Poppins_400Regular' }}
                        >
                          GC’s Estimated Budget
                        </Text>
                        <Text 
                          className="text-white text-xl"
                          style={{ fontFamily: 'JetBrainsMono_500Medium' }}
                        >
                          ${budget.toLocaleString()}
                        </Text>
                      </View>
                      <View>
                        <Text 
                          className="text-white/70 text-xs mb-1"
                          style={{ fontFamily: 'Poppins_400Regular' }}
                        >
                          {isHomebuilding ? 'Payment instructions' : 'Payment Required'}
                        </Text>
                        <Text 
                          className="text-white text-xl"
                          style={{ fontFamily: 'JetBrainsMono_500Medium' }}
                        >
                          {isHomebuilding ? 'External transfer' : `$${paymentAmount.toLocaleString()}`}
                        </Text>
                      </View>
                    </View>
                  </View>

                  {/* Homebuilding manual payment instructions */}
                  {isHomebuilding && (
                    <View className="bg-white rounded-2xl p-4 mb-3 border border-gray-200">
                      <View className="flex-row items-center mb-2">
                        {paymentConfirmationStatus === 'confirmed' ? (
                          <CheckCircle2 size={18} color="#059669" strokeWidth={2.5} />
                        ) : paymentConfirmationStatus === 'declared' ? (
                          <Clock size={18} color="#F59E0B" strokeWidth={2.5} />
                        ) : (
                          <CreditCard size={18} color="#111827" strokeWidth={2.5} />
                        )}
                        <Text className="text-black text-sm ml-2" style={{ fontFamily: 'Poppins_600SemiBold' }}>
                          {paymentConfirmationStatus === 'confirmed'
                            ? 'Payment confirmed'
                            : paymentConfirmationStatus === 'declared'
                              ? 'Payment under review'
                              : paymentConfirmationStatus === 'rejected'
                                ? 'Payment rejected'
                                : 'Awaiting payment'}
                        </Text>
                      </View>
                      <Text className="text-gray-600 text-sm" style={{ fontFamily: 'Poppins_400Regular' }}>
                        {paymentConfirmationStatus === 'declared'
                          ? `Declared on ${declaredAt ? declaredAt.toLocaleDateString() : '—'}. Admin review in progress (up to 72 hours).`
                          : paymentConfirmationStatus === 'rejected'
                            ? 'Your payment was rejected. Please re-check the transfer and declare again after paying.'
                            : externalPaymentLink
                              ? 'Use the payment instructions (Stripe invoice, Wise, Paystack, or Zelle). Then tap “I paid”.'
                              : 'Waiting for BuildMyHouse/GC to email payment instructions.'}
                      </Text>
                    </View>
                  )}

                  {/* Action Buttons */}
                  <View className="gap-3">
                    <View className="flex-row gap-3">
                      <TouchableOpacity
                        onPress={(e) => {
                          e.stopPropagation();
                          handleDelete(project);
                        }}
                        activeOpacity={0.7}
                        className="flex-1 bg-gray-200 rounded-full py-3 px-4 flex-row items-center justify-center"
                      >
                        <Trash2 size={18} color="#000000" strokeWidth={2} />
                        <Text className="text-black ml-2" style={{ fontFamily: 'Poppins_600SemiBold' }}>
                          Delete
                        </Text>
                      </TouchableOpacity>

                      {isHomebuilding ? (
                        <TouchableOpacity
                          onPress={(e) => {
                            e.stopPropagation();
                            handleOpenExternalLink(externalPaymentLink);
                          }}
                          activeOpacity={0.7}
                          disabled={!externalPaymentLink}
                          className={`flex-1 rounded-full py-3 px-4 flex-row items-center justify-center ${
                            externalPaymentLink ? 'bg-black' : 'bg-gray-300'
                          }`}
                        >
                          <ExternalLink size={18} color="#FFFFFF" strokeWidth={2} />
                          <Text className="text-white ml-2" style={{ fontFamily: 'Poppins_600SemiBold' }}>
                            Payment link
                          </Text>
                        </TouchableOpacity>
                      ) : (
                        <TouchableOpacity
                          onPress={(e) => {
                            e.stopPropagation();
                            handlePay(project);
                          }}
                          activeOpacity={0.7}
                          className="flex-1 bg-black rounded-full py-3 px-4 flex-row items-center justify-center"
                        >
                          <DollarSign size={18} color="#FFFFFF" strokeWidth={2} />
                          <Text className="text-white ml-2" style={{ fontFamily: 'Poppins_600SemiBold' }}>
                            Pay ${paymentAmount.toLocaleString()}
                          </Text>
                        </TouchableOpacity>
                      )}
                    </View>

                    {isHomebuilding && (paymentConfirmationStatus === 'not_declared' || paymentConfirmationStatus === 'rejected') && (
                      <TouchableOpacity
                        onPress={(e) => {
                          e.stopPropagation();
                          const id = getProjectId(project);
                          if (!id) {
                            Alert.alert('Error', 'Unable to identify project. Please try again.');
                            return;
                          }
                          handleDeclarePaid(id);
                        }}
                        disabled={!externalPaymentLink || declareManualPaymentMutation.isPending}
                        className={`rounded-full py-3 px-4 flex-row items-center justify-center ${
                          !externalPaymentLink || declareManualPaymentMutation.isPending ? 'bg-gray-200' : 'bg-white border border-gray-300'
                        }`}
                      >
                        <Text
                          className={`text-sm ${!externalPaymentLink || declareManualPaymentMutation.isPending ? 'text-gray-500' : 'text-gray-900'}`}
                          style={{ fontFamily: 'Poppins_600SemiBold' }}
                        >
                          I paid
                        </Text>
                      </TouchableOpacity>
                    )}

                    {isHomebuilding && paymentConfirmationStatus === 'declared' && (
                      <TouchableOpacity
                        onPress={(e) => {
                          e.stopPropagation();
                          router.push('/billing-payments');
                        }}
                        className="bg-white border border-gray-300 rounded-full py-3 px-4 flex-row items-center justify-center"
                      >
                        <Text className="text-gray-900 text-sm" style={{ fontFamily: 'Poppins_600SemiBold' }}>
                          View payment status
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>

      {/* Project Detail Modal */}
      {selectedProject && !showPaymentModal && (
        <Modal
          visible={!!selectedProject}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setSelectedProject(null)}
        >
          <View className="flex-1 bg-black/50 justify-end">
            <View className="bg-white rounded-t-3xl p-6 max-h-[90%]">
              <View className="w-12 h-1 bg-gray-300 rounded-full self-center mb-4" />
              
              <ScrollView showsVerticalScrollIndicator={false}>
                <Text 
                  className="text-2xl text-black mb-4"
                  style={{ fontFamily: 'Poppins_800ExtraBold' }}
                >
                  {selectedProject.name || 'Project Details'}
                </Text>

                {/* Full project details here - similar to house-summary */}
                {/* GC Analysis, phases, materials, etc. */}
                
                <TouchableOpacity
                  onPress={() => setSelectedProject(null)}
                  className="bg-gray-100 rounded-full py-4 px-8 mt-4"
                >
                  <Text className="text-black text-center" style={{ fontFamily: 'Poppins_600SemiBold' }}>
                    Close
                  </Text>
                </TouchableOpacity>
              </ScrollView>
            </View>
          </View>
        </Modal>
      )}

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
        projectName={selectedProject?.name || 'Project'}
        onPaymentSuccess={handlePaymentSuccess}
        onPaymentError={handlePaymentError}
        clientSecret={paymentClientSecret || undefined}
        externalError={paymentError || undefined}
      />

      {/* Delete Confirmation Modal */}
      <Modal
        visible={showDeleteConfirm}
        transparent={true}
        animationType="fade"
        onRequestClose={cancelDelete}
      >
        <View className="flex-1 bg-black/50 items-center justify-center px-6">
          <View className="bg-white rounded-3xl p-6 w-full max-w-md border border-red-600/50">
            {/* Warning Icon */}
            <View className="items-center mb-4">
              <View className="w-16 h-16 bg-red-600/20 rounded-full items-center justify-center mb-3">
                <Trash2 size={32} color="#EF4444" strokeWidth={2} />
              </View>
              <Text className="text-black text-xl text-center mb-2" style={{ fontFamily: 'Poppins_700Bold' }}>
                Delete Project?
              </Text>
              <Text className="text-gray-600 text-sm text-center leading-5" style={{ fontFamily: 'Poppins_400Regular' }}>
                Are you sure you want to delete “{projectToDelete?.name || 'this project'}”? This action cannot be undone and will permanently remove the project from your account.
              </Text>
            </View>

            {/* Warning Message */}
            <View className="bg-red-50 border border-red-200 rounded-xl p-3 mb-6">
              <View className="flex-row items-start">
                <View className="mr-2 mt-0.5">
                  <X size={18} color="#EF4444" strokeWidth={2} />
                </View>
                <Text className="text-red-700 text-xs flex-1 leading-4" style={{ fontFamily: 'Poppins_400Regular' }}>
                  This will permanently delete the project, including all associated data, GC reviews, and payment information. This action cannot be reversed.
                </Text>
              </View>
            </View>

            {/* Project Info */}
            {projectToDelete && (
              <View className="bg-gray-50 rounded-xl p-4 mb-6 border border-gray-200">
                <Text className="text-gray-500 text-xs mb-2" style={{ fontFamily: 'Poppins_400Regular' }}>
                  Project Details
                </Text>
                <Text className="text-black text-base mb-1" style={{ fontFamily: 'Poppins_600SemiBold' }}>
                  {projectToDelete.name || 'Untitled Project'}
                </Text>
                <Text className="text-gray-600 text-sm mb-2" style={{ fontFamily: 'Poppins_400Regular' }}>
                  {projectToDelete.address || 'Address not available'}
                </Text>
                {projectToDelete.budget && (
                  <View className="flex-row items-center justify-between pt-2 border-t border-gray-200">
                    <Text className="text-gray-500 text-xs" style={{ fontFamily: 'Poppins_400Regular' }}>
                      Budget
                    </Text>
                    <Text className="text-black text-sm" style={{ fontFamily: 'JetBrainsMono_500Medium' }}>
                      ${(projectToDelete.budget || 0).toLocaleString()}
                    </Text>
                  </View>
                )}
              </View>
            )}

            {/* Action Buttons */}
            <View className="flex-row gap-3">
              <TouchableOpacity
                onPress={cancelDelete}
                disabled={isDeleting}
                className="flex-1 bg-gray-200 border border-gray-300 rounded-xl py-4 items-center"
              >
                <Text className="text-gray-700 text-base" style={{ fontFamily: 'Poppins_600SemiBold' }}>
                  Cancel
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={confirmDelete}
                disabled={isDeleting}
                className={`flex-1 bg-red-600 rounded-xl py-4 items-center ${isDeleting ? 'opacity-50' : ''}`}
              >
                {isDeleting ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text className="text-white text-base" style={{ fontFamily: 'Poppins_700Bold' }}>
                    Delete
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

