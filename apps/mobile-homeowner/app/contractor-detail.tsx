import { View, Text, ScrollView, TouchableOpacity, Image, TextInput, Modal, Alert, ActivityIndicator, Linking } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { ArrowLeft, Star, Shield, Phone, Mail, MapPin, Home, X, Briefcase } from "lucide-react-native";
import { useState } from "react";
import { useContractor, useContractorReviews, useCreateReview } from '@/hooks/useMarketplace';
import { format } from 'date-fns';

export default function ContractorDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  
  const { data: contractor, isLoading } = useContractor(id || '');
  const { data: reviewsData } = useContractorReviews(id || '');
  const createReview = useCreateReview();
  
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");

  const handleCall = () => {
    if (contractor?.user.phone) {
      Linking.openURL(`tel:${contractor.user.phone}`);
    }
  };

  const handleEmail = () => {
    if (contractor?.user.email) {
      Linking.openURL(`mailto:${contractor.user.email}`);
    }
  };

  const handleHire = () => {
    Alert.alert(
      'Hire Contractor',
      `Would you like to add ${contractor?.name} to your project team?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Hire', onPress: () => Alert.alert('Success', 'Contractor added to your project team') },
      ]
    );
  };

  const handleSubmitReview = async () => {
    if (!id) return;
    
    try {
      await createReview.mutateAsync({
        contractorId: id,
        rating,
        comment: comment.trim() || undefined,
      });
      setShowReviewModal(false);
      setRating(5);
      setComment("");
      Alert.alert('Success', 'Review submitted successfully');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to submit review');
    }
  };

  if (isLoading) {
    return (
      <View className="flex-1 bg-white items-center justify-center">
        <ActivityIndicator size="large" color="#000000" />
      </View>
    );
  }

  if (!contractor) {
    return (
      <View className="flex-1 bg-white items-center justify-center px-6">
        <Text className="text-xl text-gray-500 text-center" style={{ fontFamily: 'Poppins_600SemiBold' }}>
          Contractor not found
        </Text>
      </View>
    );
  }

  const reviews = reviewsData?.data || [];

  return (
    <View className="flex-1 bg-white">
      <View className="pt-16 px-6 pb-4">
        <View className="flex-row items-center mb-4">
          <TouchableOpacity 
            onPress={() => router.canGoBack() ? router.back() : router.push('/(tabs)/shop')} 
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
      </View>

      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 120 }}>
        {/* Profile Image */}
        <View className="px-6 mb-6">
          <Image 
            source={{ uri: contractor.imageUrl || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&q=80' }} 
            className="w-full h-64 rounded-3xl bg-gray-100" 
            resizeMode="cover" 
          />
        </View>

        {/* Contractor Info */}
        <View className="px-6">
          <View className="flex-row justify-between items-start mb-3">
            <View className="flex-1">
              <Text className="text-3xl text-black mb-2" style={{ fontFamily: 'Poppins_600SemiBold' }}>
                {contractor.name}
              </Text>
              <Text className="text-gray-500 text-lg mb-2" style={{ fontFamily: 'Poppins_400Regular' }}>
                {contractor.specialty}
              </Text>
              {contractor.location && (
                <View className="flex-row items-center">
                  <MapPin size={16} color="#737373" strokeWidth={2} />
                  <Text className="text-gray-500 ml-1" style={{ fontFamily: 'Poppins_400Regular' }}>
                    {contractor.location}
                  </Text>
                </View>
              )}
            </View>
            {contractor.verified && (
              <View className="bg-black rounded-full px-3 py-1.5">
                <View className="flex-row items-center">
                  <Shield size={14} color="#FFFFFF" strokeWidth={2.5} />
                  <Text className="text-white text-xs ml-1" style={{ fontFamily: 'Poppins_600SemiBold' }}>
                    Verified
                  </Text>
                </View>
              </View>
            )}
          </View>

          {/* Rating */}
          <View className="flex-row items-center mb-6">
            <View className="flex-row">
              {[...Array(5)].map((_, i) => (
                <Star 
                  key={i} 
                  size={20} 
                  color="#000000" 
                  fill={i < Math.floor(contractor.rating) ? "#000000" : "transparent"} 
                  strokeWidth={2} 
                />
              ))}
            </View>
            <Text className="text-black ml-2 text-lg" style={{ fontFamily: 'Poppins_600SemiBold' }}>
              {contractor.rating.toFixed(1)}
            </Text>
            <Text className="text-gray-500 ml-1" style={{ fontFamily: 'Poppins_400Regular' }}>
              ({contractor.reviews} reviews)
            </Text>
          </View>

          {/* Description */}
          {contractor.description && (
            <View className="mb-6">
              <Text className="text-xl text-black mb-3" style={{ fontFamily: 'Poppins_600SemiBold' }}>
                About
              </Text>
              <Text className="text-gray-600 leading-6" style={{ fontFamily: 'Poppins_400Regular' }}>
                {contractor.description}
              </Text>
            </View>
          )}

          {/* Stats */}
          <View className="bg-gray-50 rounded-2xl p-5 mb-6 border border-gray-200">
            <View className="flex-row justify-between mb-3">
              <Text className="text-gray-500" style={{ fontFamily: 'Poppins_400Regular' }}>Projects Completed</Text>
              <Text className="text-black text-lg" style={{ fontFamily: 'JetBrainsMono_500Medium' }}>{contractor.projects}</Text>
            </View>
            <View className="flex-row justify-between mb-3">
              <Text className="text-gray-500" style={{ fontFamily: 'Poppins_400Regular' }}>Type</Text>
              <Text className="text-black" style={{ fontFamily: 'Poppins_500Medium' }}>
                {contractor.type === 'general_contractor' ? 'General Contractor' : 'Subcontractor'}
              </Text>
            </View>
            <View className="flex-row justify-between">
              <Text className="text-gray-500" style={{ fontFamily: 'Poppins_400Regular' }}>Hiring Fee</Text>
              <Text className="text-black text-lg" style={{ fontFamily: 'JetBrainsMono_500Medium' }}>₦{contractor.hiringFee.toLocaleString()}</Text>
            </View>
          </View>

          {/* Contact Buttons */}
          <View className="flex-row mb-6">
            <TouchableOpacity 
              onPress={handleCall}
              className="flex-1 bg-gray-100 rounded-2xl py-4 mr-2 flex-row items-center justify-center border border-gray-200"
            >
              <Phone size={20} color="#000000" strokeWidth={2} />
              <Text className="text-black ml-2" style={{ fontFamily: 'Poppins_600SemiBold' }}>Call</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              onPress={handleEmail}
              className="flex-1 bg-gray-100 rounded-2xl py-4 ml-2 flex-row items-center justify-center border border-gray-200"
            >
              <Mail size={20} color="#000000" strokeWidth={2} />
              <Text className="text-black ml-2" style={{ fontFamily: 'Poppins_600SemiBold' }}>Email</Text>
            </TouchableOpacity>
          </View>

          {/* Reviews Section */}
          <View className="mb-6">
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-2xl text-black" style={{ fontFamily: 'Poppins_600SemiBold' }}>
                Reviews
              </Text>
              <TouchableOpacity 
                onPress={() => setShowReviewModal(true)}
                className="bg-black rounded-full px-4 py-2"
              >
                <Text className="text-white text-sm" style={{ fontFamily: 'Poppins_600SemiBold' }}>
                  Write Review
                </Text>
              </TouchableOpacity>
            </View>

            {reviews.length > 0 ? (
              reviews.map((review: any) => (
                <View key={review.id} className="bg-gray-50 rounded-2xl p-4 mb-3 border border-gray-200">
                  <View className="flex-row items-center mb-2">
                    <View className="flex-row">
                      {[...Array(5)].map((_, i) => (
                        <Star 
                          key={i} 
                          size={14} 
                          color="#000000" 
                          fill={i < review.rating ? "#000000" : "transparent"} 
                          strokeWidth={2} 
                        />
                      ))}
                    </View>
                    <Text className="text-black ml-2 text-sm" style={{ fontFamily: 'Poppins_600SemiBold' }}>
                      {review.rating}/5
                    </Text>
                  </View>
                  {review.comment && (
                    <Text className="text-gray-600 mb-2" style={{ fontFamily: 'Poppins_400Regular' }}>
                      {review.comment}
                    </Text>
                  )}
                  <View className="flex-row items-center">
                    <Text className="text-gray-500 text-xs" style={{ fontFamily: 'Poppins_400Regular' }}>
                      {review.user.fullName}
                    </Text>
                    <Text className="text-gray-400 text-xs ml-2" style={{ fontFamily: 'Poppins_400Regular' }}>
                      • {format(new Date(review.createdAt), 'MMM dd, yyyy')}
                    </Text>
                  </View>
                </View>
              ))
            ) : (
              <View className="items-center py-8">
                <Star size={48} color="#D4D4D4" strokeWidth={1.5} />
                <Text className="text-gray-500 mt-4" style={{ fontFamily: 'Poppins_400Regular' }}>
                  No reviews yet
                </Text>
              </View>
            )}
          </View>
        </View>
      </ScrollView>

      {/* Fixed Bottom Bar */}
      <View className="absolute bottom-0 left-0 right-0 bg-white px-6 py-6 border-t border-gray-200">
        <TouchableOpacity 
          onPress={handleHire}
          className="bg-black rounded-full py-5 flex-row items-center justify-center"
        >
          <Briefcase size={20} color="#FFFFFF" strokeWidth={2} />
          <Text className="text-white text-lg ml-2" style={{ fontFamily: 'Poppins_600SemiBold' }}>
            Hire for ₦{contractor.hiringFee.toLocaleString()}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Review Modal */}
      <Modal
        visible={showReviewModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowReviewModal(false)}
      >
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-white rounded-t-3xl p-6">
            <View className="w-12 h-1 bg-gray-300 rounded-full self-center mb-6" />
            
            <View className="flex-row justify-between items-center mb-6">
              <Text className="text-2xl text-black" style={{ fontFamily: 'Poppins_600SemiBold' }}>
                Write Review
              </Text>
              <TouchableOpacity onPress={() => setShowReviewModal(false)}>
                <X size={24} color="#737373" strokeWidth={2} />
              </TouchableOpacity>
            </View>

            <Text className="text-gray-500 mb-3" style={{ fontFamily: 'Poppins_400Regular' }}>
              Rating
            </Text>
            <View className="flex-row mb-6">
              {[1, 2, 3, 4, 5].map((star) => (
                <TouchableOpacity 
                  key={star} 
                  onPress={() => setRating(star)}
                  className="mr-2"
                >
                  <Star 
                    size={36} 
                    color="#000000" 
                    fill={star <= rating ? "#000000" : "transparent"} 
                    strokeWidth={2} 
                  />
                </TouchableOpacity>
              ))}
            </View>

            <Text className="text-gray-500 mb-3" style={{ fontFamily: 'Poppins_400Regular' }}>
              Comment (optional)
            </Text>
            <TextInput
              value={comment}
              onChangeText={setComment}
              placeholder="Share your experience..."
              multiline
              numberOfLines={4}
              className="bg-gray-50 rounded-2xl p-4 mb-6 border border-gray-200 text-black"
              style={{ 
                fontFamily: 'Poppins_400Regular',
                textAlignVertical: 'top',
                minHeight: 100,
              }}
            />

            <TouchableOpacity
              onPress={handleSubmitReview}
              disabled={createReview.isPending}
              className="bg-black rounded-full py-5"
            >
              <Text className="text-white text-center text-lg" style={{ fontFamily: 'Poppins_600SemiBold' }}>
                {createReview.isPending ? 'Submitting...' : 'Submit Review'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}
