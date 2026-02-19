import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ArrowLeft, Check, FileCheck, LandPlot, MapPin } from "lucide-react-native";
import { useState } from "react";
import ImageCarousel from "@/components/ImageCarousel";
import { getBackendAssetUrl } from "@/lib/image";
import { useLandForSale } from "@/hooks/useLandsForSale";
import { useScheduleLandViewing } from "@/hooks/useLandViewing";

export default function LandDetailScreen() {
  const router = useRouter();
  const { landId } = useLocalSearchParams<{ landId: string }>();
  const { data: land, isLoading, error } = useLandForSale(landId ?? null);
  const scheduleMutation = useScheduleLandViewing();
  const [scheduled, setScheduled] = useState(false);

  if (isLoading || !land) {
    return (
      <View className="flex-1 bg-white justify-center items-center">
        <ActivityIndicator size="large" color="#000" />
      </View>
    );
  }

  if (error) {
    return (
      <View className="flex-1 bg-white justify-center items-center p-6">
        <Text className="text-red-500 text-center" style={{ fontFamily: 'Poppins_500Medium' }}>
          Failed to load land details
        </Text>
      </View>
    );
  }

  const carouselImages =
    land.images && land.images.length > 0
      ? land.images.map((img) => ({
          url: getBackendAssetUrl(img.url) || img.url,
          label: img.label || "Photo",
        }))
      : [{ url: "https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=600&q=80", label: "Site" }];

  const handleScheduleViewing = async () => {
    try {
      await scheduleMutation.mutateAsync(land.id);
      setScheduled(true);
    } catch (err: any) {
      Alert.alert("Could not schedule viewing", err?.message || "Please try again.");
    }
  };

  return (
    <View className="flex-1 bg-white">
      <View className="pt-16 px-6 pb-4 flex-row items-center">
        <TouchableOpacity onPress={() => router.back()} className="mr-4">
          <ArrowLeft size={28} color="#000000" strokeWidth={2} />
        </TouchableOpacity>
        <Text className="text-2xl text-black flex-1" style={{ fontFamily: 'Poppins_600SemiBold' }}>
          {land.name}
        </Text>
      </View>

      <ScrollView className="flex-1 px-6" showsVerticalScrollIndicator={false}>
        <View className="-mx-6 mb-4">
          <ImageCarousel images={carouselImages} height={256} />
        </View>

        {land.description ? (
          <Text className="text-gray-600 mb-4" style={{ fontFamily: 'Poppins_400Regular' }}>
            {land.description}
          </Text>
        ) : null}

        <View className="bg-gray-50 rounded-2xl p-4 mb-4 border border-gray-200">
          <View className="flex-row justify-between mb-3">
            <View className="flex-row items-center">
              <LandPlot size={18} color="#737373" strokeWidth={2} />
              <Text className="text-black ml-2" style={{ fontFamily: 'Poppins_600SemiBold' }}>
                {land.sizeSqm} sqm
              </Text>
            </View>
            <View className="flex-row items-center">
              <MapPin size={18} color="#737373" strokeWidth={2} />
              <Text className="text-black ml-2" style={{ fontFamily: 'Poppins_600SemiBold' }}>
                {land.location}
              </Text>
            </View>
          </View>
          <View className="grid">
            <Text className="text-gray-500 text-sm" style={{ fontFamily: 'Poppins_400Regular' }}>Title</Text>
            <Text className="text-black text-sm mb-2" style={{ fontFamily: 'Poppins_500Medium' }}>{land.titleDocument || 'N/A'}</Text>
            <Text className="text-gray-500 text-sm" style={{ fontFamily: 'Poppins_400Regular' }}>Zoning</Text>
            <Text className="text-black text-sm mb-2" style={{ fontFamily: 'Poppins_500Medium' }}>{land.zoningType || 'N/A'}</Text>
            <Text className="text-gray-500 text-sm" style={{ fontFamily: 'Poppins_400Regular' }}>Road Access</Text>
            <Text className="text-black text-sm" style={{ fontFamily: 'Poppins_500Medium' }}>{land.roadAccess || 'N/A'}</Text>
          </View>
        </View>

        {land.documents?.length > 0 && (
          <View className="mb-4">
            <Text className="text-black mb-2" style={{ fontFamily: 'Poppins_600SemiBold' }}>
              Documents Available
            </Text>
            <View className="flex-row flex-wrap">
              {land.documents.map((doc: string, i: number) => (
                <View key={i} className="bg-gray-100 rounded-full px-3 py-1 mr-2 mb-2 flex-row items-center">
                  <FileCheck size={12} color="#000" strokeWidth={2} />
                  <Text className="text-black text-xs ml-1" style={{ fontFamily: 'Poppins_500Medium' }}>{doc}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        <View className="bg-black rounded-2xl p-4 mb-4">
          <View className="flex-row justify-between items-center">
            <Text className="text-white/70 text-sm" style={{ fontFamily: 'Poppins_400Regular' }}>Price</Text>
            <Text className="text-white text-2xl" style={{ fontFamily: 'JetBrainsMono_500Medium' }}>
              ₦{land.price.toLocaleString()}
            </Text>
          </View>
        </View>

        {!scheduled ? (
          <>
            <TouchableOpacity
              onPress={handleScheduleViewing}
              disabled={scheduleMutation.isPending}
              className="bg-black rounded-full py-5 px-8 mb-4"
            >
              <Text className="text-white text-lg text-center" style={{ fontFamily: 'Poppins_600SemiBold' }}>
                {scheduleMutation.isPending ? 'Scheduling...' : 'Schedule Viewing'}
              </Text>
            </TouchableOpacity>
            <Text className="text-gray-500 text-xs text-center mb-8" style={{ fontFamily: 'Poppins_400Regular' }}>
              BuildMyHouse will contact you to arrange site inspection
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
              Admin will contact you shortly to confirm your site visit.
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}
