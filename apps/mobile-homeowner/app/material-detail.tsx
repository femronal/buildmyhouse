import { View, Text, ScrollView, TouchableOpacity, Image, TextInput, Modal, Alert, ActivityIndicator } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { ArrowLeft, Star, Shield, Package, ShoppingCart, Home, X } from "lucide-react-native";
import { useState } from "react";
import { useMaterial, useMaterialReviews, useCreateReview } from '@/hooks/useMarketplace';
import { format } from 'date-fns';

export default function MaterialDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  
  const { data: material, isLoading } = useMaterial(id || '');
  const { data: reviewsData } = useMaterialReviews(id || '');
  const createReview = useCreateReview();
  
  const [quantity, setQuantity] = useState(1);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");

  const handleAddToCart = () => {
    Alert.alert('Added to Cart', `${quantity} ${material?.unit} of ${material?.name} added to cart`);
  };

  const handleSubmitReview = async () => {
    if (!id) return;
    
    try {
      await createReview.mutateAsync({
        materialId: id,
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

  if (!material) {
    return (
      <View className="flex-1 bg-white items-center justify-center px-6">
        <Text className="text-xl text-gray-500 text-center" style={{ fontFamily: 'Poppins_600SemiBold' }}>
          Material not found
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
        {/* Product Image */}
        <Image 
          source={{ uri: material.imageUrl || 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80' }} 
          className="w-full h-64 bg-gray-100" 
          resizeMode="cover" 
        />

        {/* Product Info */}
        <View className="px-6 py-6">
          <View className="flex-row justify-between items-start mb-3">
            <View className="flex-1">
              <Text className="text-3xl text-black mb-2" style={{ fontFamily: 'Poppins_600SemiBold' }}>
                {material.name}
              </Text>
              <Text className="text-gray-500 text-lg" style={{ fontFamily: 'Poppins_400Regular' }}>
                {material.brand}
              </Text>
            </View>
            {material.verified && (
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
                  fill={i < Math.floor(material.rating) ? "#000000" : "transparent"} 
                  strokeWidth={2} 
                />
              ))}
            </View>
            <Text className="text-black ml-2 text-lg" style={{ fontFamily: 'Poppins_600SemiBold' }}>
              {material.rating.toFixed(1)}
            </Text>
            <Text className="text-gray-500 ml-1" style={{ fontFamily: 'Poppins_400Regular' }}>
              ({material.reviews} reviews)
            </Text>
          </View>

          {/* Description */}
          {material.description && (
            <View className="mb-6">
              <Text className="text-xl text-black mb-3" style={{ fontFamily: 'Poppins_600SemiBold' }}>
                Description
              </Text>
              <Text className="text-gray-600 leading-6" style={{ fontFamily: 'Poppins_400Regular' }}>
                {material.description}
              </Text>
            </View>
          )}

          {/* Details */}
          <View className="bg-gray-50 rounded-2xl p-5 mb-6 border border-gray-200">
            <View className="flex-row justify-between mb-3">
              <Text className="text-gray-500" style={{ fontFamily: 'Poppins_400Regular' }}>Category</Text>
              <Text className="text-black" style={{ fontFamily: 'Poppins_500Medium' }}>{material.category}</Text>
            </View>
            <View className="flex-row justify-between mb-3">
              <Text className="text-gray-500" style={{ fontFamily: 'Poppins_400Regular' }}>Unit</Text>
              <Text className="text-black" style={{ fontFamily: 'Poppins_500Medium' }}>{material.unit}</Text>
            </View>
            <View className="flex-row justify-between mb-3">
              <Text className="text-gray-500" style={{ fontFamily: 'Poppins_400Regular' }}>Stock</Text>
              <Text className="text-black" style={{ fontFamily: 'Poppins_500Medium' }}>{material.stock} available</Text>
            </View>
            <View className="flex-row justify-between">
              <Text className="text-gray-500" style={{ fontFamily: 'Poppins_400Regular' }}>Vendor</Text>
              <Text className="text-black" style={{ fontFamily: 'Poppins_500Medium' }}>{material.vendor.fullName}</Text>
            </View>
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
        <View className="flex-row items-center justify-between mb-4">
          <View>
            <Text className="text-gray-500 text-sm mb-1" style={{ fontFamily: 'Poppins_400Regular' }}>
              Total Price
            </Text>
            <Text className="text-3xl text-black" style={{ fontFamily: 'JetBrainsMono_500Medium' }}>
              ₦{(material.price * quantity).toLocaleString()}
            </Text>
          </View>
          <View className="flex-row items-center bg-gray-100 rounded-full p-2">
            <TouchableOpacity 
              onPress={() => setQuantity(Math.max(1, quantity - 1))}
              className="w-10 h-10 bg-white rounded-full items-center justify-center"
            >
              <Text className="text-black text-xl" style={{ fontFamily: 'Poppins_600SemiBold' }}>−</Text>
            </TouchableOpacity>
            <Text className="mx-4 text-lg text-black" style={{ fontFamily: 'JetBrainsMono_500Medium' }}>
              {quantity}
            </Text>
            <TouchableOpacity 
              onPress={() => setQuantity(Math.min(material.stock, quantity + 1))}
              className="w-10 h-10 bg-white rounded-full items-center justify-center"
            >
              <Text className="text-black text-xl" style={{ fontFamily: 'Poppins_600SemiBold' }}>+</Text>
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity 
          onPress={handleAddToCart}
          className="bg-black rounded-full py-5 flex-row items-center justify-center"
        >
          <ShoppingCart size={20} color="#FFFFFF" strokeWidth={2} />
          <Text className="text-white text-lg ml-2" style={{ fontFamily: 'Poppins_600SemiBold' }}>
            Add to Cart
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
