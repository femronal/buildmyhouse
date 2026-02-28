import { View, Text, ScrollView, TouchableOpacity, Image, ActivityIndicator, Alert } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { ArrowLeft, Bed, Bath, Maximize, Car, Check } from "lucide-react-native";
import { useState } from "react";
import { useHouseForSale } from "@/hooks/useHousesForSale";
import { useScheduleHouseViewing } from "@/hooks/useHouseViewing";
import { getBackendAssetUrl } from "@/lib/image";
import ImageCarousel from "@/components/ImageCarousel";

export default function HouseDetailScreen() {
  const router = useRouter();
  const { houseId } = useLocalSearchParams<{ houseId: string }>();
  const { data: house, isLoading, error } = useHouseForSale(houseId ?? null);
  const [viewingScheduled, setViewingScheduled] = useState(false);
  const scheduleViewingMutation = useScheduleHouseViewing();

  const getImageUrl = (url: string) => getBackendAssetUrl(url) ?? '';

  if (isLoading || !house) {
    return (
      <View className="flex-1 bg-white justify-center items-center">
        <ActivityIndicator size="large" color="#000" />
        <Text className="text-gray-500 mt-4" style={{ fontFamily: 'Poppins_400Regular' }}>
          Loading...
        </Text>
      </View>
    );
  }

  if (error) {
    return (
      <View className="flex-1 bg-white justify-center items-center p-6">
        <Text className="text-red-500 text-center" style={{ fontFamily: 'Poppins_500Medium' }}>
          Failed to load house details
        </Text>
        <TouchableOpacity onPress={() => router.back()} className="mt-4 px-6 py-2 bg-black rounded-lg">
          <Text className="text-white" style={{ fontFamily: 'Poppins_600SemiBold' }}>Go back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const carouselImages =
    house.images && house.images.length > 0
      ? house.images.map((img) => ({
          url: getImageUrl(img.url),
          label: img.label || "Photo",
        }))
      : [
          {
            url: "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=600&q=80",
            label: "Exterior",
          },
        ];

  const handleScheduleViewing = async () => {
    if (!house?.id) return;
    try {
      await scheduleViewingMutation.mutateAsync(house.id);
      setViewingScheduled(true);
    } catch (err: any) {
      Alert.alert(
        "Could not schedule viewing",
        err?.message || "Please try again.",
      );
    }
  };

  return (
    <View className="flex-1 bg-white">
      <View className="pt-16 px-6 pb-4 flex-row items-center">
        <TouchableOpacity onPress={() => router.back()} className="mr-4">
          <ArrowLeft size={28} color="#000000" strokeWidth={2} />
        </TouchableOpacity>
        <Text className="text-2xl text-black flex-1" style={{ fontFamily: 'Poppins_600SemiBold' }}>
          {house.name}
        </Text>
      </View>

      <ScrollView className="flex-1 px-6" showsVerticalScrollIndicator={false}>
        <View className="-mx-6 mb-4">
          <ImageCarousel images={carouselImages} height={256} />
        </View>

        <Text className="text-gray-600 mb-4" style={{ fontFamily: 'Poppins_400Regular' }}>
          {house.description}
        </Text>

        <View className="bg-gray-50 rounded-2xl p-4 mb-4 border border-gray-200">
          <View className="flex-row justify-between mb-3">
            <View className="flex-row items-center">
              <Bed size={18} color="#737373" strokeWidth={2} />
              <Text className="text-black ml-2" style={{ fontFamily: 'Poppins_600SemiBold' }}>
                {house.bedrooms} Bedrooms
              </Text>
            </View>
            <View className="flex-row items-center">
              <Bath size={18} color="#737373" strokeWidth={2} />
              <Text className="text-black ml-2" style={{ fontFamily: 'Poppins_600SemiBold' }}>
                {house.bathrooms} Bathrooms
              </Text>
            </View>
          </View>
          <View className="flex-row justify-between">
            <View className="flex-row items-center">
              <Maximize size={18} color="#737373" strokeWidth={2} />
              <Text className="text-black ml-2" style={{ fontFamily: 'Poppins_600SemiBold' }}>
                {(house.squareMeters ?? house.squareFootage)}m²
              </Text>
            </View>
            <View className="flex-row items-center">
              <Car size={18} color="#737373" strokeWidth={2} />
              <Text className="text-black ml-2" style={{ fontFamily: 'Poppins_600SemiBold' }}>
                {house.parking ?? 0} Parking
              </Text>
            </View>
          </View>
        </View>

        {(house.propertyType || house.yearBuilt || house.condition) && (
          <View className="bg-gray-50 rounded-2xl p-4 mb-4 border border-gray-200">
            <Text className="text-black mb-3" style={{ fontFamily: 'Poppins_600SemiBold' }}>
              Property Details
            </Text>
            <View className="space-y-2">
              {house.propertyType && (
                <View className="flex-row justify-between">
                  <Text className="text-gray-500 text-sm" style={{ fontFamily: 'Poppins_400Regular' }}>Property Type</Text>
                  <Text className="text-black text-sm" style={{ fontFamily: 'Poppins_500Medium' }}>{house.propertyType}</Text>
                </View>
              )}
              {house.yearBuilt && (
                <View className="flex-row justify-between">
                  <Text className="text-gray-500 text-sm" style={{ fontFamily: 'Poppins_400Regular' }}>Year Built</Text>
                  <Text className="text-black text-sm" style={{ fontFamily: 'Poppins_500Medium' }}>{house.yearBuilt}</Text>
                </View>
              )}
              {house.condition && (
                <View className="flex-row justify-between">
                  <Text className="text-gray-500 text-sm" style={{ fontFamily: 'Poppins_400Regular' }}>Condition</Text>
                  <Text className="text-black text-sm" style={{ fontFamily: 'Poppins_500Medium' }}>{house.condition}</Text>
                </View>
              )}
            </View>
          </View>
        )}

        {house.documents && house.documents.length > 0 && (
          <View className="mb-4">
            <Text className="text-black mb-2" style={{ fontFamily: 'Poppins_600SemiBold' }}>
              Documents Available
            </Text>
            <View className="flex-row flex-wrap">
              {house.documents.map((doc: string, i: number) => (
                <View key={i} className="bg-gray-100 rounded-full px-3 py-1 mr-2 mb-2">
                  <Text className="text-black text-xs" style={{ fontFamily: 'Poppins_500Medium' }}>{doc}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {house.amenities && house.amenities.length > 0 && (
          <View className="mb-4">
            <Text className="text-black mb-2" style={{ fontFamily: 'Poppins_600SemiBold' }}>
              Amenities
            </Text>
            <View className="flex-row flex-wrap">
              {house.amenities.map((a: string, i: number) => (
                <View key={i} className="bg-gray-100 rounded-full px-3 py-1 mr-2 mb-2">
                  <Text className="text-black text-xs" style={{ fontFamily: 'Poppins_500Medium' }}>{a}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {house.nearbyFacilities && house.nearbyFacilities.length > 0 && (
          <View className="mb-4">
            <Text className="text-black mb-2" style={{ fontFamily: 'Poppins_600SemiBold' }}>
              Nearby Facilities
            </Text>
            {house.nearbyFacilities.map((f: string, i: number) => (
              <Text key={i} className="text-gray-600 text-sm mb-1" style={{ fontFamily: 'Poppins_400Regular' }}>
                • {f}
              </Text>
            ))}
          </View>
        )}

        <View className="bg-black rounded-2xl p-4 mb-4">
          <View className="flex-row justify-between items-center">
            <Text className="text-white/70 text-sm" style={{ fontFamily: 'Poppins_400Regular' }}>Price</Text>
            <Text className="text-white text-2xl" style={{ fontFamily: 'JetBrainsMono_500Medium' }}>
              ₦{house.price.toLocaleString()}
            </Text>
          </View>
        </View>

        {(house.contactName || house.contactPhone) && (
          <View className="bg-gray-50 rounded-2xl p-4 mb-4 border border-gray-200">
            <Text className="text-black mb-2" style={{ fontFamily: 'Poppins_600SemiBold' }}>
              Contact for Viewing
            </Text>
            {house.contactName && (
              <Text className="text-black text-sm mb-1" style={{ fontFamily: 'Poppins_500Medium' }}>
                {house.contactName}
              </Text>
            )}
            {house.contactPhone && (
              <Text className="text-gray-600 text-sm" style={{ fontFamily: 'Poppins_400Regular' }}>
                {house.contactPhone}
              </Text>
            )}
          </View>
        )}

        {!viewingScheduled ? (
          <>
            <TouchableOpacity
              onPress={handleScheduleViewing}
              disabled={scheduleViewingMutation.isPending}
              className="bg-black rounded-full py-5 px-8 mb-4"
            >
              <Text className="text-white text-lg text-center" style={{ fontFamily: 'Poppins_600SemiBold' }}>
                {scheduleViewingMutation.isPending ? "Scheduling..." : "Schedule Viewing"}
              </Text>
            </TouchableOpacity>
            <Text className="text-gray-500 text-xs text-center mb-8" style={{ fontFamily: 'Poppins_400Regular' }}>
              Contact the seller to schedule a viewing or make an offer
            </Text>
          </>
        ) : (
          <View className="items-center py-8 mb-8">
            <View className="w-16 h-16 bg-black rounded-full items-center justify-center mb-4">
              <Check size={32} color="#FFFFFF" strokeWidth={2.5} />
            </View>
            <Text className="text-xl text-black mb-2 text-center" style={{ fontFamily: 'Poppins_600SemiBold' }}>
              Viewing Scheduled!
            </Text>
            <Text className="text-gray-500 text-center text-sm" style={{ fontFamily: 'Poppins_400Regular' }}>
              The seller will contact you shortly to confirm your viewing.
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}
