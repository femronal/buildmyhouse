import { View, Text, ScrollView, TouchableOpacity, TextInput, Alert, ActivityIndicator, Modal } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { ArrowLeft, Home, FileText, DollarSign, Clock, MapPin, User, CheckCircle, XCircle, Bed, Bath, Maximize, ChevronDown, ChevronUp } from "lucide-react-native";
import { useState, useEffect } from "react";
import { usePendingRequests, useAcceptRequest, useRejectRequest } from '@/hooks';

export default function GCRequestDetailScreen() {
  const router = useRouter();
  const { requestId } = useLocalSearchParams();
  
  const { data: pendingRequests = [], isLoading } = usePendingRequests();
  const acceptRequest = useAcceptRequest();
  const rejectRequest = useRejectRequest();

  const request = pendingRequests.find(r => r.id === requestId);
  
  // Editable estimates
  const [estimatedBudget, setEstimatedBudget] = useState('');
  const [estimatedDuration, setEstimatedDuration] = useState('');
  const [gcNotes, setGcNotes] = useState('');
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  useEffect(() => {
    if (request) {
      setEstimatedBudget(request.project.budget.toString());
      const aiAnalysis = request.project.aiAnalysis as any;
      setEstimatedDuration(aiAnalysis?.estimatedDuration || '6-8 months');
    }
  }, [request]);

  if (isLoading) {
    return (
      <View className="flex-1 bg-white items-center justify-center">
        <ActivityIndicator size="large" color="#000" />
        <Text className="text-gray-500 mt-4" style={{ fontFamily: 'Poppins_500Medium' }}>
          Loading request...
        </Text>
      </View>
    );
  }

  if (!request) {
    return (
      <View className="flex-1 bg-white items-center justify-center px-6">
        <FileText size={64} color="#ef4444" strokeWidth={2} />
        <Text className="text-xl text-black mt-4 text-center" style={{ fontFamily: 'Poppins_700Bold' }}>
          Request Not Found
        </Text>
        <TouchableOpacity
          onPress={() => router.back()}
          className="bg-black rounded-full px-8 py-4 mt-6"
        >
          <Text className="text-white" style={{ fontFamily: 'Poppins_600SemiBold' }}>
            Go Back
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  const project = request.project;
  const aiAnalysis = project.aiAnalysis as any;

  const handleAccept = async () => {
    if (!estimatedBudget || parseFloat(estimatedBudget) <= 0) {
      Alert.alert('Budget Required', 'Please enter a valid estimated budget');
      return;
    }

    if (!estimatedDuration.trim()) {
      Alert.alert('Duration Required', 'Please enter an estimated duration');
      return;
    }

    try {
      await acceptRequest.mutateAsync({
        requestId: request.id,
        data: {
          estimatedBudget: parseFloat(estimatedBudget),
          estimatedDuration,
          gcNotes: gcNotes || undefined,
        },
      });

      Alert.alert(
        'Request Accepted!',
        'The homeowner will be notified. The project has been added to your active projects.',
        [
          {
            text: 'OK',
            onPress: () => router.push('/contractor/gc-dashboard'),
          },
        ]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to accept request. Please try again.');
    }
  };

  const handleReject = async () => {
    try {
      await rejectRequest.mutateAsync({
        requestId: request.id,
        reason: rejectReason || undefined,
      });

      setShowRejectModal(false);
      
      Alert.alert(
        'Request Rejected',
        'The homeowner will be notified.',
        [
          {
            text: 'OK',
            onPress: () => router.push('/contractor/gc-dashboard'),
          },
        ]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to reject request. Please try again.');
    }
  };

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  return (
    <View className="flex-1 bg-white">
      <View className="pt-16 px-6 pb-4">
        <View className="flex-row items-center mb-4">
          <TouchableOpacity 
            onPress={() => router.back()} 
            className="w-10 h-10 bg-gray-100 rounded-full items-center justify-center mr-3"
          >
            <ArrowLeft size={22} color="#000000" strokeWidth={2} />
          </TouchableOpacity>
          <TouchableOpacity 
            onPress={() => router.push('/contractor/gc-dashboard')} 
            className="w-10 h-10 bg-black rounded-full items-center justify-center"
          >
            <Home size={20} color="#FFFFFF" strokeWidth={2} />
          </TouchableOpacity>
        </View>
        
        <Text 
          className="text-3xl text-black mb-2"
          style={{ fontFamily: 'Poppins_800ExtraBold' }}
        >
          Project Request
        </Text>
        <Text 
          className="text-sm text-gray-500"
          style={{ fontFamily: 'Poppins_400Regular' }}
        >
          Review and respond to this project
        </Text>
      </View>

      <ScrollView className="flex-1 px-6">
        {/* Project Overview */}
        <View className="bg-blue-50 border border-blue-200 rounded-2xl p-5 mb-6">
          <Text className="text-blue-900 text-2xl mb-2" style={{ fontFamily: 'Poppins_700Bold' }}>
            {project.name}
          </Text>
          
          <View className="flex-row items-center mb-3">
            <User size={16} color="#3b82f6" strokeWidth={2} />
            <Text className="text-blue-800 ml-2" style={{ fontFamily: 'Poppins_500Medium' }}>
              {project.homeowner.fullName}
            </Text>
          </View>

          <View className="flex-row items-center mb-3">
            <MapPin size={16} color="#3b82f6" strokeWidth={2} />
            <Text className="text-blue-700 text-sm ml-2" style={{ fontFamily: 'Poppins_400Regular' }}>
              {project.address}
            </Text>
          </View>

          {aiAnalysis && (
            <View className="flex-row flex-wrap mt-2">
              <View className="bg-white rounded-full px-3 py-2 mr-2 mb-2 border border-blue-200">
                <Text className="text-blue-900 text-xs" style={{ fontFamily: 'Poppins_500Medium' }}>
                  <Bed size={12} color="#1e40af" /> {aiAnalysis.bedrooms} Bedrooms
                </Text>
              </View>
              <View className="bg-white rounded-full px-3 py-2 mr-2 mb-2 border border-blue-200">
                <Text className="text-blue-900 text-xs" style={{ fontFamily: 'Poppins_500Medium' }}>
                  <Bath size={12} color="#1e40af" /> {aiAnalysis.bathrooms} Baths
                </Text>
              </View>
              <View className="bg-white rounded-full px-3 py-2 mr-2 mb-2 border border-blue-200">
                <Text className="text-blue-900 text-xs" style={{ fontFamily: 'Poppins_500Medium' }}>
                  <Maximize size={12} color="#1e40af" /> {aiAnalysis.squareFootage} sqft
                </Text>
              </View>
            </View>
          )}
        </View>

        {/* AI Analysis Summary */}
        {aiAnalysis && (
          <TouchableOpacity 
            onPress={() => toggleSection('analysis')}
            className="bg-gray-50 rounded-2xl p-5 mb-4 border border-gray-200"
          >
            <View className="flex-row justify-between items-center">
              <Text className="text-lg text-black" style={{ fontFamily: 'Poppins_700Bold' }}>
                AI Analysis
              </Text>
              {expandedSection === 'analysis' ? (
                <ChevronUp size={24} color="#000000" strokeWidth={2} />
              ) : (
                <ChevronDown size={24} color="#000000" strokeWidth={2} />
              )}
            </View>
            
            {expandedSection === 'analysis' && (
              <View className="mt-4">
                <Text className="text-gray-600 text-sm mb-4" style={{ fontFamily: 'Poppins_400Regular' }}>
                  {aiAnalysis.notes}
                </Text>

                <Text className="text-black text-sm mb-2" style={{ fontFamily: 'Poppins_600SemiBold' }}>
                  Construction Phases ({aiAnalysis.phases?.length || 0}):
                </Text>
                {aiAnalysis.phases?.map((phase: any, index: number) => (
                  <View key={index} className="bg-white rounded-xl p-3 mb-2 border border-gray-200">
                    <Text className="text-black text-sm" style={{ fontFamily: 'Poppins_600SemiBold' }}>
                      {index + 1}. {phase.name}
                    </Text>
                    <Text className="text-gray-600 text-xs mt-1" style={{ fontFamily: 'Poppins_400Regular' }}>
                      {phase.description}
                    </Text>
                    <View className="flex-row justify-between mt-2">
                      <Text className="text-gray-500 text-xs" style={{ fontFamily: 'Poppins_400Regular' }}>
                        ⏱️ {phase.estimatedDuration}
                      </Text>
                      <Text className="text-black text-xs" style={{ fontFamily: 'JetBrainsMono_500Medium' }}>
                        ${phase.estimatedCost?.toLocaleString()}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </TouchableOpacity>
        )}

        {/* Your Estimates */}
        <View className="mb-6">
          <Text className="text-2xl text-black mb-4" style={{ fontFamily: 'Poppins_700Bold' }}>
            Your Estimates
          </Text>

          <View className="mb-4">
            <Text className="text-sm text-gray-700 mb-2" style={{ fontFamily: 'Poppins_500Medium' }}>
              Estimated Budget ($) *
            </Text>
            <View className="bg-gray-50 rounded-2xl p-5 border border-gray-200">
              <TextInput
                className="text-base text-black"
                style={{ fontFamily: 'Poppins_400Regular' }}
                placeholder="e.g., 275000"
                placeholderTextColor="#A3A3A3"
                value={estimatedBudget}
                onChangeText={setEstimatedBudget}
                keyboardType="numeric"
              />
            </View>
            <Text className="text-xs text-gray-500 mt-1" style={{ fontFamily: 'Poppins_400Regular' }}>
              AI suggested: ${aiAnalysis?.estimatedBudget?.toLocaleString()}
            </Text>
          </View>

          <View className="mb-4">
            <Text className="text-sm text-gray-700 mb-2" style={{ fontFamily: 'Poppins_500Medium' }}>
              Estimated Duration *
            </Text>
            <View className="bg-gray-50 rounded-2xl p-5 border border-gray-200">
              <TextInput
                className="text-base text-black"
                style={{ fontFamily: 'Poppins_400Regular' }}
                placeholder="e.g., 7 months"
                placeholderTextColor="#A3A3A3"
                value={estimatedDuration}
                onChangeText={setEstimatedDuration}
              />
            </View>
            <Text className="text-xs text-gray-500 mt-1" style={{ fontFamily: 'Poppins_400Regular' }}>
              AI suggested: {aiAnalysis?.estimatedDuration}
            </Text>
          </View>

          <View className="mb-4">
            <Text className="text-sm text-gray-700 mb-2" style={{ fontFamily: 'Poppins_500Medium' }}>
              Notes (Optional)
            </Text>
            <View className="bg-gray-50 rounded-2xl p-5 border border-gray-200">
              <TextInput
                className="text-base text-black"
                style={{ fontFamily: 'Poppins_400Regular' }}
                placeholder="Any modifications or comments..."
                placeholderTextColor="#A3A3A3"
                value={gcNotes}
                onChangeText={setGcNotes}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        <View className="mb-8">
          <TouchableOpacity
            onPress={handleAccept}
            disabled={acceptRequest.isPending}
            className="bg-green-600 rounded-full py-5 px-8 mb-3 flex-row items-center justify-center"
          >
            {acceptRequest.isPending ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <CheckCircle size={20} color="#FFFFFF" strokeWidth={2} />
                <Text className="text-white text-lg ml-2" style={{ fontFamily: 'Poppins_700Bold' }}>
                  Accept Project
                </Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setShowRejectModal(true)}
            disabled={rejectRequest.isPending}
            className="bg-red-600 rounded-full py-5 px-8 flex-row items-center justify-center"
          >
            {rejectRequest.isPending ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <XCircle size={20} color="#FFFFFF" strokeWidth={2} />
                <Text className="text-white text-lg ml-2" style={{ fontFamily: 'Poppins_700Bold' }}>
                  Reject Request
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Reject Modal */}
      <Modal
        visible={showRejectModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowRejectModal(false)}
      >
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-white rounded-t-3xl p-6">
            <View className="w-12 h-1 bg-gray-300 rounded-full self-center mb-6" />
            
            <Text className="text-2xl text-black mb-2" style={{ fontFamily: 'Poppins_700Bold' }}>
              Reject Request
            </Text>
            <Text className="text-gray-500 mb-6" style={{ fontFamily: 'Poppins_400Regular' }}>
              Please provide a reason (optional)
            </Text>

            <View className="bg-gray-50 rounded-2xl p-5 mb-6 border border-gray-200">
              <TextInput
                className="text-base text-black"
                style={{ fontFamily: 'Poppins_400Regular' }}
                placeholder="e.g., Schedule conflict, budget too low..."
                placeholderTextColor="#A3A3A3"
                value={rejectReason}
                onChangeText={setRejectReason}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            </View>

            <TouchableOpacity
              onPress={handleReject}
              className="bg-red-600 rounded-full py-5 px-8 mb-3"
            >
              <Text className="text-white text-lg text-center" style={{ fontFamily: 'Poppins_700Bold' }}>
                Confirm Rejection
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setShowRejectModal(false)}
              className="py-3"
            >
              <Text className="text-gray-500 text-center" style={{ fontFamily: 'Poppins_500Medium' }}>
                Cancel
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

