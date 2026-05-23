import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, Star, X } from 'lucide-react-native';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getScreenHorizontalPadding } from '@/lib/responsive-layout';
import { getBackendAssetUrl } from '@/lib/image';

export default function ReviewContractorScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const params = useLocalSearchParams<{ contractorId?: string; projectId?: string }>();
  const { data: currentUser } = useCurrentUser();
  const contractorId = String(params.contractorId || '').trim();
  const projectId = String(params.projectId || '').trim();
  const horizontalPadding = getScreenHorizontalPadding(width);

  const [selectedRating, setSelectedRating] = useState(0);
  const [selectedReasons, setSelectedReasons] = useState<string[]>([]);
  const [otherReason, setOtherReason] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [submitFeedback, setSubmitFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);
  const didHydrateFromExisting = useRef(false);

  const { data: contractorSummary } = useQuery({
    queryKey: ['public-contractor-summary', contractorId],
    queryFn: () => api.get(`/contractors/public/${contractorId}`),
    enabled: !!contractorId,
  });

  const { data: contractorReviews, isLoading } = useQuery({
    queryKey: ['contractor-reviews-link', contractorId, projectId],
    queryFn: () =>
      api.get(
        `/marketplace/reviews/contractor/${contractorId}?limit=100${
          projectId ? `&projectId=${encodeURIComponent(projectId)}` : ''
        }`,
      ),
    enabled: !!contractorId && !!currentUser?.id,
  });

  const { data: reasonOptions } = useQuery({
    queryKey: ['contractor-review-reason-options', contractorId, selectedRating],
    queryFn: () =>
      api.get(
        `/marketplace/reviews/contractor/${contractorId}/reason-options?rating=${selectedRating}`,
      ),
    enabled: !!contractorId && selectedRating >= 1 && selectedRating <= 5,
  });

  const existingReview = useMemo(() => {
    const list = Array.isArray((contractorReviews as any)?.data)
      ? (contractorReviews as any).data
      : [];
    return list.find((item: any) => item?.user?.id === currentUser?.id) || null;
  }, [contractorReviews, currentUser?.id]);

  useEffect(() => {
    if (!existingReview || didHydrateFromExisting.current) return;
    setSelectedRating(Number(existingReview.rating || 0));
    setSelectedReasons(
      Array.isArray(existingReview.reasons)
        ? existingReview.reasons.map((reason: any) => String(reason || '').trim()).filter(Boolean)
        : [],
    );
    setOtherReason(String(existingReview.otherReason || existingReview.comment || ''));
    didHydrateFromExisting.current = true;
  }, [existingReview]);

  const otherWordCount = useMemo(() => {
    const normalized = String(otherReason || '').trim();
    if (!normalized) return 0;
    return normalized.split(/\s+/).filter(Boolean).length;
  }, [otherReason]);

  const isOtherSelected = useMemo(
    () => selectedReasons.some((reason) => reason.toLowerCase() === 'other'),
    [selectedReasons],
  );

  const canSubmit = useMemo(() => {
    if (selectedRating < 1 || selectedRating > 5) return false;
    if (otherWordCount > 500) return false;
    const hasReason = selectedReasons.length > 0 || otherWordCount > 0;
    if (!hasReason) return false;
    if (isOtherSelected && otherWordCount === 0) return false;
    return true;
  }, [isOtherSelected, otherWordCount, selectedRating, selectedReasons.length]);

  const toggleReason = useCallback((reason: string) => {
    if (submitFeedback) {
      setSubmitFeedback(null);
    }
    setSelectedReasons((prev) => {
      const exists = prev.some((item) => item === reason);
      if (exists) {
        return prev.filter((item) => item !== reason);
      }
      return [...prev, reason];
    });
  }, [submitFeedback]);

  const handleSubmit = useCallback(async () => {
    if (!currentUser?.id) {
      Alert.alert('Sign in required', 'Please sign in to submit your review.');
      router.push('/login');
      return;
    }
    if (!contractorId) {
      Alert.alert('Invalid link', 'This review link is missing contractor details.');
      return;
    }
    if (!canSubmit) {
      Alert.alert('Incomplete review', 'Please choose a rating and at least one reason.');
      return;
    }
    if (otherWordCount > 500) {
      Alert.alert('Too long', 'Other reason cannot exceed 500 words.');
      return;
    }

    setIsSaving(true);
    setSubmitFeedback(null);
    try {
      const normalizedOther = String(otherReason || '').trim();
      const payload = {
        contractorId,
        projectId: projectId || undefined,
        rating: selectedRating,
        reasons: selectedReasons,
        otherReason: normalizedOther || undefined,
        comment: normalizedOther || undefined,
      };

      if (existingReview?.id) {
        await api.patch(`/marketplace/reviews/${existingReview.id}`, payload);
        setSubmitFeedback({
          type: 'success',
          message: 'Review recorded. Thank you for sharing your feedback.',
        });
        Alert.alert('Review updated', 'Thank you for dropping a review.', [
          {
            text: 'OK',
            onPress: () => {
              if (projectId) {
                router.push(`/dashboard?projectId=${encodeURIComponent(projectId)}` as any);
              }
            },
          },
        ]);
      } else {
        await api.post('/marketplace/reviews', payload);
        setSubmitFeedback({
          type: 'success',
          message: 'Review recorded. Thank you for sharing your feedback.',
        });
        Alert.alert('Review recorded', 'Thank you for dropping a review.', [
          {
            text: 'OK',
            onPress: () => {
              if (projectId) {
                router.push(`/dashboard?projectId=${encodeURIComponent(projectId)}` as any);
              }
            },
          },
        ]);
      }
    } catch (error: any) {
      setSubmitFeedback({
        type: 'error',
        message: error?.message || 'Could not save your review. Please try again.',
      });
      Alert.alert('Could not submit', error?.message || 'Please try again.');
    } finally {
      setIsSaving(false);
    }
  }, [
    canSubmit,
    contractorId,
    currentUser?.id,
    existingReview?.id,
    otherReason,
    otherWordCount,
    projectId,
    router,
    selectedRating,
    selectedReasons,
  ]);

  const ratingPrompt = (reasonOptions as any)?.prompt || 'What went wrong?';
  const ratingTitle =
    (reasonOptions as any)?.title ||
    (selectedRating >= 4 ? (selectedRating === 5 ? "That's great!" : 'Good to hear that') : 'Sorry to hear that');
  const reasons = Array.isArray((reasonOptions as any)?.reasons) ? (reasonOptions as any).reasons : [];
  const contractorName = String((contractorSummary as any)?.fullName || 'this contractor').trim();
  const specialty = String((contractorSummary as any)?.specialty || 'General Contractor').trim();
  const pictureUrl = getBackendAssetUrl((contractorSummary as any)?.pictureUrl || '') || null;

  return (
    <View className="flex-1 bg-white">
      <View
        className="pb-4"
        style={{ paddingTop: Math.max(16, insets.top + 8), paddingHorizontal: horizontalPadding }}
      >
        <View className="flex-row items-center justify-between mb-5">
          <TouchableOpacity
            onPress={() =>
              projectId ? router.push(`/dashboard?projectId=${encodeURIComponent(projectId)}` as any) : router.back()
            }
            className="w-10 h-10 bg-gray-100 rounded-full items-center justify-center"
          >
            <ArrowLeft size={20} color="#000000" strokeWidth={2.4} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() =>
              projectId ? router.push(`/dashboard?projectId=${encodeURIComponent(projectId)}` as any) : router.back()
            }
            className="w-10 h-10 items-center justify-center"
          >
            <X size={20} color="#4B5563" strokeWidth={2.4} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: horizontalPadding, paddingBottom: Math.max(24, insets.bottom + 16) }}
        showsVerticalScrollIndicator={false}
      >
        <View className="items-center mb-4">
          {pictureUrl ? (
            <Image source={{ uri: pictureUrl }} className="w-20 h-20 rounded-full mb-3" resizeMode="cover" />
          ) : (
            <View className="w-20 h-20 rounded-full bg-gray-100 items-center justify-center mb-3">
              <Text className="text-gray-400 text-xl" style={{ fontFamily: 'Poppins_700Bold' }}>
                {(contractorName.charAt(0) || 'G').toUpperCase()}
              </Text>
            </View>
          )}
          <Text className="text-black text-2xl text-center" style={{ fontFamily: 'Poppins_700Bold' }}>
            How was {contractorName}&apos;s service?
          </Text>
          <Text className="text-gray-500 text-sm mt-1" style={{ fontFamily: 'Poppins_500Medium' }}>
            {specialty}
          </Text>
        </View>

        <View className="flex-row justify-center mb-5">
          {[1, 2, 3, 4, 5].map((value) => {
            const filled = selectedRating >= value;
            return (
              <TouchableOpacity
                key={value}
                onPress={() => {
                  if (submitFeedback) {
                    setSubmitFeedback(null);
                  }
                  setSelectedRating(value);
                  setSelectedReasons([]);
                  setOtherReason('');
                }}
                className="px-1 py-1"
              >
                <Star
                  size={34}
                  color={filled ? '#F59E0B' : '#D1D5DB'}
                  fill={filled ? '#F59E0B' : 'transparent'}
                  strokeWidth={1.7}
                />
              </TouchableOpacity>
            );
          })}
        </View>

        <View className="h-px bg-gray-200 mb-5" />

        {selectedRating > 0 && (
          <View className="mb-4">
            <Text className="text-black text-3xl mb-1" style={{ fontFamily: 'Poppins_700Bold' }}>
              {ratingTitle}
            </Text>
            <Text className="text-gray-500 text-base mb-3" style={{ fontFamily: 'Poppins_400Regular' }}>
              {ratingPrompt}
            </Text>
          </View>
        )}

        <View className="mb-4">
          {isLoading ? (
            <View className="py-6 items-center">
              <ActivityIndicator size="small" color="#111827" />
            </View>
          ) : (
            <>
              {selectedRating > 0 &&
                reasons.map((reason: string) => {
                  const selected = selectedReasons.includes(reason);
                  return (
                    <TouchableOpacity
                      key={reason}
                      onPress={() => toggleReason(reason)}
                      className={`rounded-xl border px-4 py-4 mb-3 ${
                        selected ? 'border-black bg-gray-100' : 'border-gray-200 bg-white'
                      }`}
                    >
                      <Text
                        className={`${selected ? 'text-gray-900' : 'text-gray-800'} text-base`}
                        style={{ fontFamily: selected ? 'Poppins_600SemiBold' : 'Poppins_500Medium' }}
                      >
                        {reason}
                      </Text>
                    </TouchableOpacity>
                  );
                })}

              {isOtherSelected && (
                <View className="mb-3">
                  <TextInput
                    value={otherReason}
                    onChangeText={(value) => {
                      if (submitFeedback) {
                        setSubmitFeedback(null);
                      }
                      setOtherReason(value);
                    }}
                    placeholder="Tell us more..."
                    placeholderTextColor="#9CA3AF"
                    multiline
                    numberOfLines={5}
                    textAlignVertical="top"
                    className="bg-white border border-gray-200 rounded-xl px-3 py-3 text-black min-h-[130px]"
                    style={{ fontFamily: 'Poppins_400Regular', fontSize: 14 }}
                  />
                  <Text
                    className={`text-xs mt-2 ${otherWordCount > 500 ? 'text-red-600' : 'text-gray-500'}`}
                    style={{ fontFamily: 'Poppins_500Medium' }}
                  >
                    {otherWordCount}/500 words
                  </Text>
                </View>
              )}

              {submitFeedback && (
                <View
                  className={`rounded-xl px-4 py-3 mt-2 mb-1 ${
                    submitFeedback.type === 'success'
                      ? 'bg-gray-900 border border-black'
                      : 'bg-red-50 border border-red-200'
                  }`}
                >
                  <Text
                    className={`${submitFeedback.type === 'success' ? 'text-white' : 'text-red-700'} text-sm`}
                    style={{ fontFamily: 'Poppins_600SemiBold' }}
                  >
                    {submitFeedback.message}
                  </Text>
                </View>
              )}

              <TouchableOpacity
                onPress={handleSubmit}
                disabled={isSaving || !canSubmit}
                className={`rounded-xl py-4 items-center mt-3 ${
                  isSaving || !canSubmit ? 'bg-gray-200' : 'bg-black'
                }`}
              >
                <Text
                  className={`${isSaving || !canSubmit ? 'text-gray-500' : 'text-white'} text-xl`}
                  style={{ fontFamily: 'Poppins_700Bold' }}
                >
                  {isSaving ? 'Saving...' : existingReview ? 'Update' : 'Update'}
                </Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </ScrollView>
    </View>
  );
}
