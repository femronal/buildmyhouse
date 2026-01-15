import { View, Text, ScrollView, TouchableOpacity, Image, Alert, ActivityIndicator, Platform, Modal, TextInput } from "react-native";
import { useRouter } from "expo-router";
import { ArrowLeft, Camera, X, FileText, Bed, Bath, Maximize, DollarSign, Edit, Trash2, Plus, Info, Calendar, Edit3 } from "lucide-react-native";
import { useState, useRef } from "react";
import * as ImagePicker from 'expo-image-picker';
import { designService } from '@/services/designService';
import { useMyDesigns, useDeleteDesign, useUpdateDesign } from '@/hooks/useDesigns';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAppAlert } from "../../components/AppAlertProvider";

interface ImageWithLabel {
  uri: string;
  label: string;
}

function moneyToCents(value: unknown): number {
  const n =
    typeof value === 'number'
      ? value
      : typeof value === 'string'
        ? Number(value.replace(/[^0-9.-]/g, ''))
        : NaN;
  if (!Number.isFinite(n)) return NaN;
  return Math.round(n * 100);
}

function sumConstructionPhaseCents(
  phases: Array<{ estimatedCost: number }>,
): number {
  return phases.reduce((sum, p) => sum + (moneyToCents(p?.estimatedCost) || 0), 0);
}

// Helper to get full image URL from backend
const getImageUrl = (imageUrl: string) => {
  if (imageUrl?.startsWith('http')) {
    return imageUrl;
  }
  const API_BASE_URL = __DEV__ 
    ? 'http://localhost:3001' 
    : 'https://api.buildmyhouse.com';
  return `${API_BASE_URL}${imageUrl}`;
};

function UploadForm({ onSuccess, onCancel }: { onSuccess: () => void; onCancel: () => void }) {
  const router = useRouter();
  const { showAlert } = useAppAlert();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [bedrooms, setBedrooms] = useState("");
  const [bathrooms, setBathrooms] = useState("");
  const [squareFootage, setSquareFootage] = useState("");
  const [estimatedCost, setEstimatedCost] = useState("");
  const [floors, setFloors] = useState("");
  const [estimatedDuration, setEstimatedDuration] = useState("");
  const [rooms, setRooms] = useState<string[]>([]);
  const [materials, setMaterials] = useState<string[]>([]);
  const [features, setFeatures] = useState<string[]>([]);
  const [constructionPhases, setConstructionPhases] = useState<Array<{
    name: string;
    description: string;
    estimatedDuration: string;
    estimatedCost: number;
  }>>([]);
  const [images, setImages] = useState<ImageWithLabel[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const queryClient = useQueryClient();

  const createDesignMutation = useMutation({
    mutationFn: ({ designData, imageUris }: { designData: any; imageUris: any[] }) =>
      designService.createDesign(designData, imageUris),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['designs', 'my-designs'] });
      queryClient.invalidateQueries({ queryKey: ['designs'] });
      onSuccess();
    },
  });

  // Note: We create the file input synchronously in handlePickImage
  // to ensure it's part of the trusted user event

  const handlePickImage = async () => {
    try {
      // On web, the label handles the click automatically - no need to do anything here
      if (Platform.OS === 'web') {
        // The label will automatically trigger the file input when clicked
        // This is handled by the label's htmlFor attribute
        return;
      }
      
      // For iOS/Android, use expo-image-picker
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        showAlert('Permission needed', 'We need camera roll permissions to upload images');
        return;
      }
      
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.8,
        allowsMultipleSelection: Platform.OS === 'ios', // iOS supports multiple selection
      });

      // Handle both new API (assets array) and old API (uri directly)
      if (!result.canceled) {
        let selectedAssets: any[] = [];
        
        if (result.assets && result.assets.length > 0) {
          // New API - multiple selection
          selectedAssets = result.assets;
        } else if ((result as any).uri) {
          // Old API - single selection (Android fallback)
          selectedAssets = [{ uri: (result as any).uri }];
        }

        if (selectedAssets.length > 0) {
          const newImages = selectedAssets.map((asset, index) => ({
            uri: asset.uri,
            label: `Image ${images.length + index + 1}`,
          }));
          setImages([...images, ...newImages]);
        }
      }
    } catch (error: any) {
      console.error('❌ [GC Plans] Error picking images:', error);
      showAlert('Error', error.message || 'Failed to pick images. Please try again.');
    }
  };

  const handleRemoveImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const handleUpdateImageLabel = (index: number, label: string) => {
    const updated = [...images];
    updated[index].label = label;
    setImages(updated);
  };

  const handleSubmit = async () => {
    if (!name.trim()) {
      showAlert('Validation Error', 'Please enter a design name');
      return;
    }
    if (!description.trim()) {
      showAlert('Validation Error', 'Please enter a design description');
      return;
    }
    if (!bedrooms || parseInt(bedrooms) < 1) {
      showAlert('Validation Error', 'Please enter a valid number of bedrooms');
      return;
    }
    if (!bathrooms || parseInt(bathrooms) < 1) {
      showAlert('Validation Error', 'Please enter a valid number of bathrooms');
      return;
    }
    if (!squareFootage || parseFloat(squareFootage) < 1) {
      showAlert('Validation Error', 'Please enter a valid square footage');
      return;
    }
    if (!estimatedCost || parseFloat(estimatedCost) <= 0) {
      showAlert('Validation Error', 'Please enter a valid estimated cost');
      return;
    }
    if (!floors || parseInt(floors) < 1) {
      showAlert('Validation Error', 'Please enter the number of floors');
      return;
    }
    if (!estimatedDuration.trim()) {
      showAlert('Validation Error', 'Please enter an estimated duration');
      return;
    }
    if (rooms.length === 0 || rooms.some((r) => !r.trim())) {
      showAlert('Validation Error', 'Please add rooms and ensure none are empty');
      return;
    }
    if (materials.length === 0 || materials.some((m) => !m.trim())) {
      showAlert('Validation Error', 'Please add materials and ensure none are empty');
      return;
    }
    if (features.length === 0 || features.some((f) => !f.trim())) {
      showAlert('Validation Error', 'Please add features and ensure none are empty');
      return;
    }
    if (constructionPhases.length === 0) {
      showAlert('Validation Error', 'Please add at least one construction phase');
      return;
    }
    for (let i = 0; i < constructionPhases.length; i++) {
      const p = constructionPhases[i];
      if (!p.name?.trim()) {
        showAlert('Validation Error', `Please enter a name for phase ${i + 1}`);
        return;
      }
      if (!p.description?.trim()) {
        showAlert('Validation Error', `Please enter a description for phase ${i + 1}`);
        return;
      }
      if (!p.estimatedDuration?.trim()) {
        showAlert('Validation Error', `Please enter a duration for phase ${i + 1}`);
        return;
      }
      const cents = moneyToCents(p.estimatedCost);
      if (!Number.isFinite(cents) || cents <= 0) {
        showAlert('Validation Error', `Please enter a valid cost for phase ${i + 1}`);
        return;
      }
    }
    if (images.length === 0) {
      showAlert('Validation Error', 'Please upload at least one image');
      return;
    }
    if (images.some((img) => !img?.label?.trim())) {
      showAlert('Validation Error', 'Please provide a label for every image');
      return;
    }

    // Budget integrity check: sum of phase costs must equal estimatedCost
    const estCostCents = moneyToCents(estimatedCost);
    const totalPhaseCents = sumConstructionPhaseCents(constructionPhases);
    if (!Number.isFinite(estCostCents) || totalPhaseCents !== estCostCents) {
      showAlert(
        'Validation Error',
        `The total of all phase costs must equal the estimated cost.\n\nPhase total: $${(totalPhaseCents / 100).toLocaleString()}\nEstimated cost: $${(estCostCents / 100).toLocaleString()}`
      );
      return;
    }

    setIsSubmitting(true);

    try {
      // Prepare design data
      const designData = {
        name: name.trim(),
        description: description.trim(),
        bedrooms: parseInt(bedrooms, 10),
        bathrooms: parseInt(bathrooms, 10),
        squareFootage: parseFloat(squareFootage),
        estimatedCost: parseFloat(estimatedCost),
        floors: parseInt(floors, 10),
        estimatedDuration: estimatedDuration.trim(),
        // Convert arrays to comma-separated strings for backend compatibility
        rooms: rooms.filter(r => r.trim()).map(r => r.trim()).join(', '),
        materials: materials.filter(m => m.trim()).map(m => m.trim()).join(', '),
        features: features.filter(f => f.trim()).map(f => f.trim()).join(', '),
        constructionPhases: JSON.stringify(constructionPhases.map(p => ({
          name: p.name.trim(),
          description: p.description.trim(),
          estimatedDuration: p.estimatedDuration.trim(),
          estimatedCost: p.estimatedCost,
        }))),
        images: images.map((img, index) => ({
          uri: img.uri,
          label: img.label || `Image ${index + 1}`,
          order: index,
        })),
      };

      const imageUris = images.map((img) => ({ 
        uri: img.uri, 
        label: img.label || 'Image' 
      }));

      // Use mutate with promise wrapper to avoid React development mode issues
      await new Promise<void>((resolve, reject) => {
        createDesignMutation.mutate(
          { designData, imageUris },
          {
            onSuccess: () => {
              resolve();
            },
            onError: (error) => {
              console.error('❌ [GC Plans] Mutation error:', error);
              reject(error);
            },
          }
        );
      });

      // Reset form
      setName("");
      setDescription("");
      setBedrooms("");
      setBathrooms("");
      setSquareFootage("");
      setEstimatedCost("");
      setFloors("");
      setEstimatedDuration("");
      setRooms([]);
      setMaterials([]);
      setFeatures([]);
      setConstructionPhases([]);
      setImages([]);

      showAlert(
        'Success! 🎉',
        'Your design plan has been uploaded successfully and is now visible to homeowners in the Explore section.',
        [{ text: 'OK' }],
      );
    } catch (error: any) {
      console.error('❌ [GC Plans] Error uploading design:', error);
      showAlert('Upload Failed', error.message || 'Failed to upload design. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ScrollView className="flex-1 px-6" showsVerticalScrollIndicator={false}>
      {/* Design Name */}
      <View className="mb-4">
        <Text className="text-gray-300 text-sm mb-2" style={{ fontFamily: 'Poppins_500Medium' }}>
          Design Name *
        </Text>
        <View className="bg-[#0A1628] rounded-xl px-4 py-3 flex-row items-center border border-blue-900">
          <FileText size={20} color="#6B7280" strokeWidth={2} />
          <TextInput
            className="flex-1 ml-3 text-white text-base"
            style={{ fontFamily: 'Poppins_400Regular' }}
            placeholder="e.g., Modern Minimalist"
            placeholderTextColor="#6B7280"
            value={name}
            onChangeText={setName}
          />
        </View>
      </View>

      {/* Description */}
      <View className="mb-4">
        <Text className="text-gray-300 text-sm mb-2" style={{ fontFamily: 'Poppins_500Medium' }}>
          Description
        </Text>
        <TextInput
          className="bg-[#0A1628] rounded-xl px-4 py-3 text-white text-base border border-blue-900"
          style={{ fontFamily: 'Poppins_400Regular', minHeight: 100 }}
          placeholder="Describe this design plan..."
          placeholderTextColor="#6B7280"
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={4}
        />
      </View>

      {/* Specifications */}
      <View className="mb-4">
        <Text className="text-gray-300 text-sm mb-3" style={{ fontFamily: 'Poppins_500Medium' }}>
          Specifications *
        </Text>
        
        <View className="flex-row mb-3">
          <View className="flex-1 mr-2">
            <View className="bg-[#0A1628] rounded-xl px-4 py-3 flex-row items-center border border-blue-900">
              <Bed size={18} color="#6B7280" strokeWidth={2} />
              <TextInput
                className="flex-1 ml-3 text-white text-base"
                style={{ fontFamily: 'Poppins_400Regular' }}
                placeholder="Bedrooms"
                placeholderTextColor="#6B7280"
                value={bedrooms}
                onChangeText={setBedrooms}
                keyboardType="numeric"
              />
            </View>
          </View>
          
          <View className="flex-1 ml-2">
            <View className="bg-[#0A1628] rounded-xl px-4 py-3 flex-row items-center border border-blue-900">
              <Bath size={18} color="#6B7280" strokeWidth={2} />
              <TextInput
                className="flex-1 ml-3 text-white text-base"
                style={{ fontFamily: 'Poppins_400Regular' }}
                placeholder="Bathrooms"
                placeholderTextColor="#6B7280"
                value={bathrooms}
                onChangeText={setBathrooms}
                keyboardType="numeric"
              />
            </View>
          </View>
        </View>

        <View className="flex-row mb-3">
          <View className="flex-1 mr-2">
            <View className="bg-[#0A1628] rounded-xl px-4 py-3 flex-row items-center border border-blue-900">
              <Maximize size={18} color="#6B7280" strokeWidth={2} />
              <TextInput
                className="flex-1 ml-3 text-white text-base"
                style={{ fontFamily: 'Poppins_400Regular' }}
                placeholder="Square Feet"
                placeholderTextColor="#6B7280"
                value={squareFootage}
                onChangeText={setSquareFootage}
                keyboardType="numeric"
              />
            </View>
          </View>
          
          <View className="flex-1 ml-2">
            <View className="bg-[#0A1628] rounded-xl px-4 py-3 flex-row items-center border border-blue-900">
              <TextInput
                className="flex-1 text-white text-base"
                style={{ fontFamily: 'Poppins_400Regular' }}
                placeholder="Floors"
                placeholderTextColor="#6B7280"
                value={floors}
                onChangeText={setFloors}
                keyboardType="numeric"
              />
            </View>
          </View>
        </View>
      </View>

      {/* Edit Project Analysis Section - Matching Review Project Page Format */}
      <View className="bg-[#1E3A5F] rounded-2xl mb-4 border-2 border-yellow-600/30" style={{ padding: 20 }}>
        <View className="flex-row items-center justify-between mb-4">
          <View className="flex-row items-center">
            <Edit3 size={20} color="#F59E0B" strokeWidth={2} />
            <Text className="text-yellow-400 text-lg ml-2" style={{ fontFamily: 'Poppins_700Bold' }}>
              Edit Project Analysis
            </Text>
          </View>
        </View>

        {/* Budget */}
        <View className="mb-4">
          <Text className="text-gray-300 text-sm mb-2" style={{ fontFamily: 'Poppins_500Medium' }}>
            Estimated Budget *
          </Text>
          <View className="bg-[#0A1628] rounded-xl px-4 py-3 flex-row items-center border border-blue-900">
            <DollarSign size={20} color="#6B7280" strokeWidth={2} />
            <TextInput
              className="flex-1 ml-3 text-white text-base"
              style={{ fontFamily: 'Poppins_400Regular' }}
              placeholder="Enter estimated budget"
              placeholderTextColor="#6B7280"
              value={estimatedCost}
              onChangeText={setEstimatedCost}
              keyboardType="numeric"
            />
          </View>
        </View>

        {/* Duration */}
        <View className="mb-4">
          <Text className="text-gray-300 text-sm mb-2" style={{ fontFamily: 'Poppins_500Medium' }}>
            Estimated Duration *
          </Text>
          <View className="bg-[#0A1628] rounded-xl px-4 py-3 flex-row items-center border border-blue-900">
            <Calendar size={20} color="#6B7280" strokeWidth={2} />
            <TextInput
              className="flex-1 ml-3 text-white text-base"
              style={{ fontFamily: 'Poppins_400Regular' }}
              placeholder="e.g., 6-8 months"
              placeholderTextColor="#6B7280"
              value={estimatedDuration}
              onChangeText={setEstimatedDuration}
            />
          </View>
        </View>

        {/* Rooms */}
        <View className="mb-4">
          <Text className="text-gray-300 text-sm mb-2" style={{ fontFamily: 'Poppins_500Medium' }}>
            Rooms
          </Text>
          {rooms.map((room, index) => (
            <View key={index} className="flex-row items-center mb-2">
              <TextInput
                className="flex-1 bg-[#0A1628] rounded-xl px-4 py-3 text-white text-base border border-blue-900"
                style={{ fontFamily: 'Poppins_400Regular' }}
                placeholder="Room name (e.g., Kitchen, Living Room)"
                placeholderTextColor="#6B7280"
                value={room}
                onChangeText={(value) => {
                  const updated = [...rooms];
                  updated[index] = value;
                  setRooms(updated);
                }}
              />
              <TouchableOpacity
                onPress={() => setRooms(rooms.filter((_, i) => i !== index))}
                className="ml-2 bg-red-600/20 rounded-xl px-4 py-3"
              >
                <X size={20} color="#F87171" strokeWidth={2} />
              </TouchableOpacity>
            </View>
          ))}
          <TouchableOpacity
            onPress={() => setRooms([...rooms, ''])}
            className="bg-blue-600/20 border border-blue-600 rounded-xl px-4 py-3"
          >
            <Text className="text-blue-400 text-center" style={{ fontFamily: 'Poppins_600SemiBold' }}>
              + Add Room
            </Text>
          </TouchableOpacity>
        </View>

        {/* Materials */}
        <View className="mb-4">
          <Text className="text-gray-300 text-sm mb-2" style={{ fontFamily: 'Poppins_500Medium' }}>
            Key Materials
          </Text>
          {materials.map((material, index) => (
            <View key={index} className="flex-row items-center mb-2">
              <TextInput
                className="flex-1 bg-[#0A1628] rounded-xl px-4 py-3 text-white text-base border border-blue-900"
                style={{ fontFamily: 'Poppins_400Regular' }}
                placeholder="Material name (e.g., Concrete, Steel, Wood)"
                placeholderTextColor="#6B7280"
                value={material}
                onChangeText={(value) => {
                  const updated = [...materials];
                  updated[index] = value;
                  setMaterials(updated);
                }}
              />
              <TouchableOpacity
                onPress={() => setMaterials(materials.filter((_, i) => i !== index))}
                className="ml-2 bg-red-600/20 rounded-xl px-4 py-3"
              >
                <X size={20} color="#F87171" strokeWidth={2} />
              </TouchableOpacity>
            </View>
          ))}
          <TouchableOpacity
            onPress={() => setMaterials([...materials, ''])}
            className="bg-blue-600/20 border border-blue-600 rounded-xl px-4 py-3"
          >
            <Text className="text-blue-400 text-center" style={{ fontFamily: 'Poppins_600SemiBold' }}>
              + Add Material
            </Text>
          </TouchableOpacity>
        </View>

        {/* Features */}
        <View className="mb-4">
          <Text className="text-gray-300 text-sm mb-2" style={{ fontFamily: 'Poppins_500Medium' }}>
            Features
          </Text>
          {features.map((feature, index) => (
            <View key={index} className="flex-row items-center mb-2">
              <TextInput
                className="flex-1 bg-[#0A1628] rounded-xl px-4 py-3 text-white text-base border border-blue-900"
                style={{ fontFamily: 'Poppins_400Regular' }}
                placeholder="Feature name (e.g., Solar Panels, Smart Home)"
                placeholderTextColor="#6B7280"
                value={feature}
                onChangeText={(value) => {
                  const updated = [...features];
                  updated[index] = value;
                  setFeatures(updated);
                }}
              />
              <TouchableOpacity
                onPress={() => setFeatures(features.filter((_, i) => i !== index))}
                className="ml-2 bg-red-600/20 rounded-xl px-4 py-3"
              >
                <X size={20} color="#F87171" strokeWidth={2} />
              </TouchableOpacity>
            </View>
          ))}
          <TouchableOpacity
            onPress={() => setFeatures([...features, ''])}
            className="bg-blue-600/20 border border-blue-600 rounded-xl px-4 py-3"
          >
            <Text className="text-blue-400 text-center" style={{ fontFamily: 'Poppins_600SemiBold' }}>
              + Add Feature
            </Text>
          </TouchableOpacity>
        </View>

        {/* Construction Phases */}
        <View className="mb-4">
          <Text className="text-gray-300 text-sm mb-2" style={{ fontFamily: 'Poppins_500Medium' }}>
            Construction Phases
          </Text>
          {constructionPhases.map((phase, index) => (
            <View key={index} className="bg-[#0A1628] rounded-xl p-4 mb-3 border border-blue-900">
              <TextInput
                className="bg-[#1E3A5F] rounded-lg px-3 py-2 text-white text-base mb-2"
                style={{ fontFamily: 'Poppins_600SemiBold' }}
                placeholder="Phase name (e.g., Foundation, Framing)"
                placeholderTextColor="#6B7280"
                value={phase.name}
                onChangeText={(value) => {
                  const updated = [...constructionPhases];
                  updated[index] = { ...updated[index], name: value };
                  setConstructionPhases(updated);
                }}
              />
              <TextInput
                className="bg-[#1E3A5F] rounded-lg px-3 py-2 text-white text-sm mb-2"
                style={{ fontFamily: 'Poppins_400Regular', minHeight: 60 }}
                placeholder="Description"
                placeholderTextColor="#6B7280"
                value={phase.description}
                onChangeText={(value) => {
                  const updated = [...constructionPhases];
                  updated[index] = { ...updated[index], description: value };
                  setConstructionPhases(updated);
                }}
                multiline
              />
              <View className="flex-row items-center" style={{ gap: 8 }}>
                <TextInput
                  className="flex-1 bg-[#1E3A5F] rounded-lg px-3 py-2 text-white text-sm"
                  style={{ fontFamily: 'Poppins_400Regular', marginRight: 8 }}
                  placeholder="Duration (e.g., 4-6 weeks)"
                  placeholderTextColor="#6B7280"
                  value={phase.estimatedDuration}
                  onChangeText={(value) => {
                    const updated = [...constructionPhases];
                    updated[index] = { ...updated[index], estimatedDuration: value };
                    setConstructionPhases(updated);
                  }}
                />
                <TextInput
                  className="flex-1 bg-[#1E3A5F] rounded-lg px-3 py-2 text-white text-sm"
                  style={{ fontFamily: 'Poppins_400Regular', marginRight: 8 }}
                  placeholder="Cost"
                  placeholderTextColor="#6B7280"
                  value={phase.estimatedCost > 0 ? phase.estimatedCost.toString() : ''}
                  onChangeText={(value) => {
                    const updated = [...constructionPhases];
                    updated[index] = { ...updated[index], estimatedCost: parseFloat(value) || 0 };
                    setConstructionPhases(updated);
                  }}
                  keyboardType="numeric"
                />
                <TouchableOpacity
                  onPress={() => setConstructionPhases(constructionPhases.filter((_, i) => i !== index))}
                  className="bg-red-600/20 rounded-lg px-3 py-2 justify-center items-center"
                  style={{ minWidth: 40 }}
                >
                  <X size={18} color="#F87171" strokeWidth={2} />
                </TouchableOpacity>
              </View>
            </View>
          ))}
          <TouchableOpacity
            onPress={() => setConstructionPhases([...constructionPhases, { name: '', description: '', estimatedDuration: '', estimatedCost: 0 }])}
            className="bg-blue-600/20 border border-blue-600 rounded-xl px-4 py-3"
          >
            <Text className="text-blue-400 text-center" style={{ fontFamily: 'Poppins_600SemiBold' }}>
              + Add Construction Phase
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Images */}
      <View className="mb-6">
        <Text className="text-gray-300 text-sm mb-3" style={{ fontFamily: 'Poppins_500Medium' }}>
          Design Photos * (Kitchen, Bathroom, Exterior, etc.)
        </Text>
        
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-3">
          {images.map((image, index) => (
            <View key={index} className="mr-3 relative">
              <Image 
                source={{ uri: image.uri }} 
                className="w-32 h-32 rounded-xl" 
                resizeMode="cover"
              />
              <TouchableOpacity
                onPress={() => handleRemoveImage(index)}
                className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full items-center justify-center"
              >
                <X size={14} color="#FFFFFF" strokeWidth={2} />
              </TouchableOpacity>
              <TextInput
                className="bg-black/70 rounded-lg px-2 py-1 mt-1 text-white text-xs"
                style={{ fontFamily: 'Poppins_400Regular', width: 128 }}
                placeholder="Label (e.g., Kitchen)"
                placeholderTextColor="#9CA3AF"
                value={image.label}
                onChangeText={(label) => handleUpdateImageLabel(index, label)}
              />
            </View>
          ))}
          
          {Platform.OS === 'web' ? (
            <label
              htmlFor="file-input-gc-plans"
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                width: 128,
                height: 128,
                backgroundColor: '#1E3A5F',
                borderRadius: 12,
                borderWidth: 1,
                borderStyle: 'dashed',
                borderColor: '#1E40AF',
                cursor: 'pointer',
              }}
            >
              <input
                id="file-input-gc-plans"
                ref={fileInputRef as any}
                type="file"
                accept="image/*"
                multiple
                style={{
                  display: 'none',
                }}
                onChange={(e: any) => {
                  const files = Array.from(e.target.files || []) as File[];
                  
                  if (files.length > 0) {
                    setImages(prev => {
                      const newImages = files.map((file, index) => {
                        const uri = URL.createObjectURL(file);
                        return {
                          uri,
                          label: `Image ${prev.length + index + 1}`,
                        };
                      });
                      return [...prev, ...newImages];
                    });
                  }
                  
                  // Reset input
                  if (e.target) {
                    e.target.value = '';
                  }
                }}
              />
              <Camera size={24} color="#3B82F6" strokeWidth={2} />
              <Text className="text-blue-400 text-xs mt-2 text-center" style={{ fontFamily: 'Poppins_500Medium' }}>
                Add Photo
              </Text>
            </label>
          ) : (
            <TouchableOpacity
              onPress={handlePickImage}
              className="w-32 h-32 bg-[#1E3A5F] rounded-xl items-center justify-center border border-dashed border-blue-700"
              activeOpacity={0.7}
            >
              <Camera size={24} color="#3B82F6" strokeWidth={2} />
              <Text className="text-blue-400 text-xs mt-2 text-center" style={{ fontFamily: 'Poppins_500Medium' }}>
                Add Photo
              </Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      </View>

      {/* Buttons */}
      <View className="flex-row mb-8 px-0" style={{ gap: 12 }}>
        <TouchableOpacity
          onPress={onCancel}
          disabled={isSubmitting}
          className="flex-1 bg-[#1E3A5F] rounded-full py-4 items-center justify-center"
          style={{ marginRight: 6 }}
        >
          <Text className="text-white text-lg" style={{ fontFamily: 'Poppins_700Bold' }}>
            Cancel
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={(e) => {
            handleSubmit();
          }}
          disabled={isSubmitting}
          className={`flex-1 bg-blue-600 rounded-full py-4 items-center justify-center ${isSubmitting ? 'opacity-50' : ''}`}
          activeOpacity={0.7}
          style={{ marginLeft: 6 }}
        >
          {isSubmitting ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text className="text-white text-lg" style={{ fontFamily: 'Poppins_700Bold' }}>
              Upload Design Plan
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

function EditForm({ design, onSuccess, onCancel }: { design: any; onSuccess: () => void; onCancel: () => void }) {
  const { showAlert } = useAppAlert();
  const [name, setName] = useState(design.name || "");
  const [description, setDescription] = useState(design.description || "");
  const [bedrooms, setBedrooms] = useState(design.bedrooms?.toString() || "");
  const [bathrooms, setBathrooms] = useState(design.bathrooms?.toString() || "");
  const [squareFootage, setSquareFootage] = useState(design.squareFootage?.toString() || "");
  const [estimatedCost, setEstimatedCost] = useState(design.estimatedCost?.toString() || "");
  const [floors, setFloors] = useState(design.floors?.toString() || "");
  const [estimatedDuration, setEstimatedDuration] = useState(design.estimatedDuration || "");
  const [rooms, setRooms] = useState<string[]>(Array.isArray(design.rooms) ? design.rooms : (design.rooms ? design.rooms.split(',').map((r: string) => r.trim()).filter((r: string) => r) : []));
  const [materials, setMaterials] = useState<string[]>(Array.isArray(design.materials) ? design.materials : (design.materials ? design.materials.split(',').map((m: string) => m.trim()).filter((m: string) => m) : []));
  const [features, setFeatures] = useState<string[]>(Array.isArray(design.features) ? design.features : (design.features ? design.features.split(',').map((f: string) => f.trim()).filter((f: string) => f) : []));
  const [constructionPhases, setConstructionPhases] = useState<Array<{
    name: string;
    description: string;
    estimatedDuration: string;
    estimatedCost: number;
  }>>(() => {
    if (!design.constructionPhases) return [];
    try {
      const phases = typeof design.constructionPhases === 'string' 
        ? JSON.parse(design.constructionPhases) 
        : design.constructionPhases;
      return Array.isArray(phases) ? phases : [];
    } catch {
      return [];
    }
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const updateDesignMutation = useUpdateDesign();

  const handleSubmit = async () => {
    if (!name.trim()) {
      showAlert('Validation Error', 'Please enter a design name');
      return;
    }
    if (!description.trim()) {
      showAlert('Validation Error', 'Please enter a design description');
      return;
    }
    if (!bedrooms || parseInt(bedrooms) < 1) {
      showAlert('Validation Error', 'Please enter a valid number of bedrooms');
      return;
    }
    if (!bathrooms || parseInt(bathrooms) < 1) {
      showAlert('Validation Error', 'Please enter a valid number of bathrooms');
      return;
    }
    if (!squareFootage || parseFloat(squareFootage) < 1) {
      showAlert('Validation Error', 'Please enter a valid square footage');
      return;
    }
    if (!estimatedCost || parseFloat(estimatedCost) <= 0) {
      showAlert('Validation Error', 'Please enter a valid estimated cost');
      return;
    }
    if (!floors || parseInt(floors) < 1) {
      showAlert('Validation Error', 'Please enter the number of floors');
      return;
    }
    if (!estimatedDuration.trim()) {
      showAlert('Validation Error', 'Please enter an estimated duration');
      return;
    }
    if (rooms.length === 0 || rooms.some((r) => !r.trim())) {
      showAlert('Validation Error', 'Please add rooms and ensure none are empty');
      return;
    }
    if (materials.length === 0 || materials.some((m) => !m.trim())) {
      showAlert('Validation Error', 'Please add materials and ensure none are empty');
      return;
    }
    if (features.length === 0 || features.some((f) => !f.trim())) {
      showAlert('Validation Error', 'Please add features and ensure none are empty');
      return;
    }
    if (constructionPhases.length === 0) {
      showAlert('Validation Error', 'Please add at least one construction phase');
      return;
    }
    for (let i = 0; i < constructionPhases.length; i++) {
      const p = constructionPhases[i];
      if (!p.name?.trim()) {
        showAlert('Validation Error', `Please enter a name for phase ${i + 1}`);
        return;
      }
      if (!p.description?.trim()) {
        showAlert('Validation Error', `Please enter a description for phase ${i + 1}`);
        return;
      }
      if (!p.estimatedDuration?.trim()) {
        showAlert('Validation Error', `Please enter a duration for phase ${i + 1}`);
        return;
      }
      const cents = moneyToCents(p.estimatedCost);
      if (!Number.isFinite(cents) || cents <= 0) {
        showAlert('Validation Error', `Please enter a valid cost for phase ${i + 1}`);
        return;
      }
    }

    // Budget integrity check: sum of phase costs must equal estimatedCost
    const estCostCents = moneyToCents(estimatedCost);
    const totalPhaseCents = sumConstructionPhaseCents(constructionPhases);
    if (!Number.isFinite(estCostCents) || totalPhaseCents !== estCostCents) {
      showAlert(
        'Validation Error',
        `The total of all phase costs must equal the estimated cost.\n\nPhase total: $${(totalPhaseCents / 100).toLocaleString()}\nEstimated cost: $${(estCostCents / 100).toLocaleString()}`
      );
      return;
    }

    setIsSubmitting(true);

    try {
      await updateDesignMutation.mutateAsync({
        designId: design.id,
        updateData: {
          name: name.trim(),
          description: description.trim(),
          bedrooms: parseInt(bedrooms),
          bathrooms: parseInt(bathrooms),
          squareFootage: parseFloat(squareFootage),
          estimatedCost: parseFloat(estimatedCost),
          floors: parseInt(floors),
          estimatedDuration: estimatedDuration.trim(),
          // Convert arrays to comma-separated strings for backend compatibility
          rooms: rooms.filter(r => r.trim()).map(r => r.trim()).join(', '),
          materials: materials.filter(m => m.trim()).map(m => m.trim()).join(', '),
          features: features.filter(f => f.trim()).map(f => f.trim()).join(', '),
          constructionPhases: JSON.stringify(constructionPhases.map(p => ({
            name: p.name.trim(),
            description: p.description.trim(),
            estimatedDuration: p.estimatedDuration.trim(),
            estimatedCost: p.estimatedCost,
          }))),
        },
      });
      
      showAlert('Success', 'Design updated successfully!', [{ text: 'OK', onPress: onSuccess }]);
    } catch (error: any) {
      console.error('❌ [Edit Form] Error updating design:', error);
      showAlert('Error', error.message || 'Failed to update design. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
      <View className="p-6">
        {/* Design Name */}
        <View className="mb-4">
          <Text className="text-gray-300 text-sm mb-2" style={{ fontFamily: 'Poppins_500Medium' }}>
            Design Name *
          </Text>
          <View className="bg-[#0A1628] rounded-xl px-4 py-3 flex-row items-center border border-blue-900">
            <FileText size={20} color="#6B7280" strokeWidth={2} />
            <TextInput
              className="flex-1 ml-3 text-white text-base"
              style={{ fontFamily: 'Poppins_400Regular' }}
              placeholder="e.g., Modern Minimalist"
              placeholderTextColor="#6B7280"
              value={name}
              onChangeText={setName}
            />
          </View>
        </View>

        {/* Description */}
        <View className="mb-4">
          <Text className="text-gray-300 text-sm mb-2" style={{ fontFamily: 'Poppins_500Medium' }}>
            Description
          </Text>
          <TextInput
            className="bg-[#0A1628] rounded-xl px-4 py-3 text-white text-base border border-blue-900"
            style={{ fontFamily: 'Poppins_400Regular', minHeight: 100 }}
            placeholder="Describe this design plan..."
            placeholderTextColor="#6B7280"
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={4}
          />
        </View>

        {/* Specifications */}
        <View className="mb-4">
          <Text className="text-gray-300 text-sm mb-3" style={{ fontFamily: 'Poppins_500Medium' }}>
            Specifications *
          </Text>
          
          <View className="flex-row mb-3">
            <View className="flex-1 mr-2">
              <View className="bg-[#0A1628] rounded-xl px-4 py-3 flex-row items-center border border-blue-900">
                <Bed size={18} color="#6B7280" strokeWidth={2} />
                <TextInput
                  className="flex-1 ml-3 text-white text-base"
                  style={{ fontFamily: 'Poppins_400Regular' }}
                  placeholder="Bedrooms"
                  placeholderTextColor="#6B7280"
                  value={bedrooms}
                  onChangeText={setBedrooms}
                  keyboardType="numeric"
                />
              </View>
            </View>
            
            <View className="flex-1 ml-2">
              <View className="bg-[#0A1628] rounded-xl px-4 py-3 flex-row items-center border border-blue-900">
                <Bath size={18} color="#6B7280" strokeWidth={2} />
                <TextInput
                  className="flex-1 ml-3 text-white text-base"
                  style={{ fontFamily: 'Poppins_400Regular' }}
                  placeholder="Bathrooms"
                  placeholderTextColor="#6B7280"
                  value={bathrooms}
                  onChangeText={setBathrooms}
                  keyboardType="numeric"
                />
              </View>
            </View>
          </View>

          <View className="flex-row mb-3">
            <View className="flex-1 mr-2">
              <View className="bg-[#0A1628] rounded-xl px-4 py-3 flex-row items-center border border-blue-900">
                <Maximize size={18} color="#6B7280" strokeWidth={2} />
                <TextInput
                  className="flex-1 ml-3 text-white text-base"
                  style={{ fontFamily: 'Poppins_400Regular' }}
                  placeholder="Square Feet"
                  placeholderTextColor="#6B7280"
                  value={squareFootage}
                  onChangeText={setSquareFootage}
                  keyboardType="numeric"
                />
              </View>
            </View>
            
            <View className="flex-1 ml-2">
              <View className="bg-[#0A1628] rounded-xl px-4 py-3 flex-row items-center border border-blue-900">
                <TextInput
                  className="flex-1 text-white text-base"
                  style={{ fontFamily: 'Poppins_400Regular' }}
                  placeholder="Floors"
                  placeholderTextColor="#6B7280"
                  value={floors}
                  onChangeText={setFloors}
                  keyboardType="numeric"
                />
              </View>
            </View>
          </View>
        </View>

        {/* Edit Project Analysis Section - Matching Review Project Page */}
        <View className="bg-[#1E3A5F] rounded-2xl mb-4 border-2 border-yellow-600/30" style={{ padding: 20 }}>
          <View className="flex-row items-center justify-between mb-4">
          <View className="flex-row items-center">
            <Edit3 size={20} color="#F59E0B" strokeWidth={2} />
            <Text className="text-yellow-400 text-lg ml-2" style={{ fontFamily: 'Poppins_700Bold' }}>
              Edit Project Analysis
            </Text>
          </View>
        </View>

        {/* Budget */}
        <View className="mb-4">
          <Text className="text-gray-300 text-sm mb-2" style={{ fontFamily: 'Poppins_500Medium' }}>
            Estimated Budget *
          </Text>
          <View className="bg-[#0A1628] rounded-xl px-4 py-3 flex-row items-center border border-blue-900">
            <DollarSign size={20} color="#6B7280" strokeWidth={2} />
            <TextInput
              className="flex-1 ml-3 text-white text-base"
              style={{ fontFamily: 'Poppins_400Regular' }}
              placeholder="Enter estimated budget"
              placeholderTextColor="#6B7280"
              value={estimatedCost}
              onChangeText={setEstimatedCost}
              keyboardType="numeric"
            />
          </View>
        </View>

        {/* Duration */}
        <View className="mb-4">
          <Text className="text-gray-300 text-sm mb-2" style={{ fontFamily: 'Poppins_500Medium' }}>
            Estimated Duration *
          </Text>
          <View className="bg-[#0A1628] rounded-xl px-4 py-3 flex-row items-center border border-blue-900">
            <Calendar size={20} color="#6B7280" strokeWidth={2} />
            <TextInput
              className="flex-1 ml-3 text-white text-base"
              style={{ fontFamily: 'Poppins_400Regular' }}
              placeholder="e.g., 6-8 months"
              placeholderTextColor="#6B7280"
              value={estimatedDuration}
              onChangeText={setEstimatedDuration}
            />
          </View>
        </View>

        {/* Rooms */}
        <View className="mb-4">
          <Text className="text-gray-300 text-sm mb-2" style={{ fontFamily: 'Poppins_500Medium' }}>
            Rooms
          </Text>
          {rooms.map((room, index) => (
            <View key={index} className="flex-row items-center mb-2">
              <TextInput
                className="flex-1 bg-[#0A1628] rounded-xl px-4 py-3 text-white text-base border border-blue-900"
                style={{ fontFamily: 'Poppins_400Regular' }}
                placeholder="Room name (e.g., Kitchen, Living Room)"
                placeholderTextColor="#6B7280"
                value={room}
                onChangeText={(value) => {
                  const updated = [...rooms];
                  updated[index] = value;
                  setRooms(updated);
                }}
              />
              <TouchableOpacity
                onPress={() => setRooms(rooms.filter((_, i) => i !== index))}
                className="ml-2 bg-red-600/20 rounded-xl px-4 py-3"
              >
                <X size={20} color="#F87171" strokeWidth={2} />
              </TouchableOpacity>
            </View>
          ))}
          <TouchableOpacity
            onPress={() => setRooms([...rooms, ''])}
            className="bg-blue-600/20 border border-blue-600 rounded-xl px-4 py-3"
          >
            <Text className="text-blue-400 text-center" style={{ fontFamily: 'Poppins_600SemiBold' }}>
              + Add Room
            </Text>
          </TouchableOpacity>
        </View>

        {/* Materials */}
        <View className="mb-4">
          <Text className="text-gray-300 text-sm mb-2" style={{ fontFamily: 'Poppins_500Medium' }}>
            Key Materials
          </Text>
          {materials.map((material, index) => (
            <View key={index} className="flex-row items-center mb-2">
              <TextInput
                className="flex-1 bg-[#0A1628] rounded-xl px-4 py-3 text-white text-base border border-blue-900"
                style={{ fontFamily: 'Poppins_400Regular' }}
                placeholder="Material name (e.g., Concrete, Steel, Wood)"
                placeholderTextColor="#6B7280"
                value={material}
                onChangeText={(value) => {
                  const updated = [...materials];
                  updated[index] = value;
                  setMaterials(updated);
                }}
              />
              <TouchableOpacity
                onPress={() => setMaterials(materials.filter((_, i) => i !== index))}
                className="ml-2 bg-red-600/20 rounded-xl px-4 py-3"
              >
                <X size={20} color="#F87171" strokeWidth={2} />
              </TouchableOpacity>
            </View>
          ))}
          <TouchableOpacity
            onPress={() => setMaterials([...materials, ''])}
            className="bg-blue-600/20 border border-blue-600 rounded-xl px-4 py-3"
          >
            <Text className="text-blue-400 text-center" style={{ fontFamily: 'Poppins_600SemiBold' }}>
              + Add Material
            </Text>
          </TouchableOpacity>
        </View>

        {/* Features */}
        <View className="mb-4">
          <Text className="text-gray-300 text-sm mb-2" style={{ fontFamily: 'Poppins_500Medium' }}>
            Features
          </Text>
          {features.map((feature, index) => (
            <View key={index} className="flex-row items-center mb-2">
              <TextInput
                className="flex-1 bg-[#0A1628] rounded-xl px-4 py-3 text-white text-base border border-blue-900"
                style={{ fontFamily: 'Poppins_400Regular' }}
                placeholder="Feature name (e.g., Solar Panels, Smart Home)"
                placeholderTextColor="#6B7280"
                value={feature}
                onChangeText={(value) => {
                  const updated = [...features];
                  updated[index] = value;
                  setFeatures(updated);
                }}
              />
              <TouchableOpacity
                onPress={() => setFeatures(features.filter((_, i) => i !== index))}
                className="ml-2 bg-red-600/20 rounded-xl px-4 py-3"
              >
                <X size={20} color="#F87171" strokeWidth={2} />
              </TouchableOpacity>
            </View>
          ))}
          <TouchableOpacity
            onPress={() => setFeatures([...features, ''])}
            className="bg-blue-600/20 border border-blue-600 rounded-xl px-4 py-3"
          >
            <Text className="text-blue-400 text-center" style={{ fontFamily: 'Poppins_600SemiBold' }}>
              + Add Feature
            </Text>
          </TouchableOpacity>
        </View>

          {/* Construction Phases */}
          <View className="mb-4">
            <Text className="text-gray-300 text-sm mb-2" style={{ fontFamily: 'Poppins_500Medium' }}>
              Construction Phases
            </Text>
            {constructionPhases.map((phase, index) => (
              <View key={index} className="bg-[#0A1628] rounded-xl mb-3 border border-blue-900" style={{ padding: 16 }}>
                <TextInput
                  className="bg-[#1E3A5F] rounded-lg px-3 py-2 text-white text-base mb-2"
                  style={{ fontFamily: 'Poppins_600SemiBold' }}
                  placeholder="Phase name (e.g., Foundation, Framing)"
                  placeholderTextColor="#6B7280"
                  value={phase.name}
                  onChangeText={(value) => {
                    const updated = [...constructionPhases];
                    updated[index] = { ...updated[index], name: value };
                    setConstructionPhases(updated);
                  }}
                />
                <TextInput
                  className="bg-[#1E3A5F] rounded-lg px-3 py-2 text-white text-sm mb-2"
                  style={{ fontFamily: 'Poppins_400Regular', minHeight: 60 }}
                  placeholder="Description"
                  placeholderTextColor="#6B7280"
                  value={phase.description}
                  onChangeText={(value) => {
                    const updated = [...constructionPhases];
                    updated[index] = { ...updated[index], description: value };
                    setConstructionPhases(updated);
                  }}
                  multiline
                />
                <View className="flex-row items-center" style={{ gap: 8 }}>
                  <TextInput
                    className="flex-1 bg-[#1E3A5F] rounded-lg px-3 py-2 text-white text-sm"
                    style={{ fontFamily: 'Poppins_400Regular', marginRight: 8 }}
                    placeholder="Duration (e.g., 4-6 weeks)"
                    placeholderTextColor="#6B7280"
                    value={phase.estimatedDuration}
                    onChangeText={(value) => {
                      const updated = [...constructionPhases];
                      updated[index] = { ...updated[index], estimatedDuration: value };
                      setConstructionPhases(updated);
                    }}
                  />
                  <TextInput
                    className="flex-1 bg-[#1E3A5F] rounded-lg px-3 py-2 text-white text-sm"
                    style={{ fontFamily: 'Poppins_400Regular', marginRight: 8 }}
                    placeholder="Cost"
                    placeholderTextColor="#6B7280"
                    value={phase.estimatedCost > 0 ? phase.estimatedCost.toString() : ''}
                    onChangeText={(value) => {
                      const updated = [...constructionPhases];
                      updated[index] = { ...updated[index], estimatedCost: parseFloat(value) || 0 };
                      setConstructionPhases(updated);
                    }}
                    keyboardType="numeric"
                  />
                  <TouchableOpacity
                    onPress={() => setConstructionPhases(constructionPhases.filter((_, i) => i !== index))}
                    className="bg-red-600/20 rounded-lg px-3 py-2 justify-center items-center"
                    style={{ minWidth: 40 }}
                  >
                    <X size={18} color="#F87171" strokeWidth={2} />
                  </TouchableOpacity>
                </View>
              </View>
            ))}
            <TouchableOpacity
              onPress={() => setConstructionPhases([...constructionPhases, { name: '', description: '', estimatedDuration: '', estimatedCost: 0 }])}
              className="bg-blue-600/20 border border-blue-600 rounded-xl px-4 py-3"
            >
              <Text className="text-blue-400 text-center" style={{ fontFamily: 'Poppins_600SemiBold' }}>
                + Add Construction Phase
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Buttons */}
        <View className="flex-row mt-4 mb-8 px-0" style={{ gap: 12 }}>
          <TouchableOpacity
            onPress={onCancel}
            disabled={isSubmitting}
            className="flex-1 bg-[#1E3A5F] rounded-full py-4 items-center justify-center"
            style={{ marginRight: 6 }}
          >
            <Text className="text-white text-lg" style={{ fontFamily: 'Poppins_700Bold' }}>
              Cancel
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleSubmit}
            disabled={isSubmitting}
            className={`flex-1 bg-blue-600 rounded-full py-4 items-center justify-center ${isSubmitting ? 'opacity-50' : ''}`}
            style={{ marginLeft: 6 }}
          >
            {isSubmitting ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text className="text-white text-lg" style={{ fontFamily: 'Poppins_700Bold' }}>
                Save Changes
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

export default function GCPlansScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { showAlert } = useAppAlert();
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [editingDesign, setEditingDesign] = useState<any | null>(null);
  const [designToDelete, setDesignToDelete] = useState<any | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const { data: designs = [], isLoading } = useMyDesigns();
  const deleteDesignMutation = useDeleteDesign();

  const handleDelete = (design: any) => {
    setDesignToDelete(design);
  };

  const confirmDelete = async () => {
    if (!designToDelete) return;

    setIsDeleting(true);
    try {
      await deleteDesignMutation.mutateAsync(designToDelete.id);
      setDesignToDelete(null);
      setIsDeleting(false);
      
      // Show success message
      showAlert('Success', 'Design deleted successfully');
    } catch (error: any) {
      console.error('❌ [GC Plans] Error deleting design:', error);
      setIsDeleting(false);
      showAlert('Error', error.message || 'Failed to delete design');
    }
  };

  const cancelDelete = () => {
    setDesignToDelete(null);
    setIsDeleting(false);
  };

  const handleEdit = (design: any) => {
    setEditingDesign(design);
  };

  if (showUploadForm) {
    return (
      <View className="flex-1 bg-[#0A1628]">
        <View className="pt-16 px-6 pb-4 flex-row items-center">
          <TouchableOpacity 
            onPress={() => setShowUploadForm(false)}
            className="w-10 h-10 bg-[#1E3A5F] rounded-full items-center justify-center mr-4"
          >
            <ArrowLeft size={22} color="#FFFFFF" strokeWidth={2} />
          </TouchableOpacity>
          <Text className="text-white text-xl flex-1" style={{ fontFamily: 'Poppins_700Bold' }}>
            Upload Design Plan
          </Text>
        </View>
        <UploadForm 
          onSuccess={() => setShowUploadForm(false)} 
          onCancel={() => setShowUploadForm(false)} 
        />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-[#0A1628]">
      {/* Header */}
      <View className="pt-16 px-6 pb-4 flex-row items-center">
        <TouchableOpacity 
          onPress={() => {
            if (router.canGoBack()) {
              router.back();
            } else {
              router.push('/contractor/gc-dashboard');
            }
          }}
          className="w-10 h-10 bg-[#1E3A5F] rounded-full items-center justify-center mr-4"
        >
          <ArrowLeft size={22} color="#FFFFFF" strokeWidth={2} />
        </TouchableOpacity>
        <Text className="text-white text-xl flex-1" style={{ fontFamily: 'Poppins_700Bold' }}>
          My Design Plans
        </Text>
      </View>

      <ScrollView className="flex-1 px-6" showsVerticalScrollIndicator={false}>
        {/* Upload Button */}
        <TouchableOpacity
          onPress={(e) => {
            setShowUploadForm(true);
          }}
          className="bg-blue-600 rounded-2xl p-6 mb-6 flex-row items-center justify-center"
          activeOpacity={0.7}
        >
          <Plus size={24} color="#FFFFFF" strokeWidth={2.5} />
          <Text className="text-white text-lg ml-3" style={{ fontFamily: 'Poppins_700Bold' }}>
            Upload New Design Plan
          </Text>
        </TouchableOpacity>

        {/* Info Message */}
        <View className="bg-blue-900/30 border border-blue-700 rounded-xl p-4 mb-6 flex-row">
          <Info size={20} color="#60A5FA" strokeWidth={2} className="mr-3 mt-0.5" />
          <View className="flex-1">
            <Text className="text-blue-300 text-sm mb-1" style={{ fontFamily: 'Poppins_600SemiBold' }}>
              About Design Plans
            </Text>
            <Text className="text-blue-200 text-xs leading-5" style={{ fontFamily: 'Poppins_400Regular' }}>
              Your design plans can be purchased by homeowners who are interested in them. Once purchased, 
              homeowners can either build using our app's construction management system or build outside of the app.
            </Text>
          </View>
        </View>

        {/* Designs List */}
        {isLoading ? (
          <View className="items-center justify-center py-20">
            <ActivityIndicator size="large" color="#3B82F6" />
            <Text className="text-gray-400 mt-4" style={{ fontFamily: 'Poppins_400Regular' }}>
              Loading your designs...
            </Text>
          </View>
        ) : designs.length === 0 ? (
          <View className="items-center justify-center py-20">
            <FileText size={48} color="#6B7280" strokeWidth={1.5} />
            <Text className="text-gray-400 text-center text-lg mt-4" style={{ fontFamily: 'Poppins_600SemiBold' }}>
              No design plans yet
            </Text>
            <Text className="text-gray-500 text-center text-sm mt-2" style={{ fontFamily: 'Poppins_400Regular' }}>
              Upload your first design plan to get started
            </Text>
          </View>
        ) : (
          <View className="mb-8">
            {designs.map((design: any) => (
              <View key={design.id} className="bg-[#1E3A5F] rounded-2xl mb-4 overflow-hidden border border-blue-900/50">
                {/* Image Carousel */}
                {design.images && design.images.length > 0 ? (
                  <View className="relative">
                    <ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false}>
                      {design.images.map((image: any, index: number) => (
                        <Image
                          key={image.id || index}
                          source={{ uri: getImageUrl(image.url) }}
                          className="w-full h-48"
                          style={{ width: 400 }}
                          resizeMode="cover"
                        />
                      ))}
                    </ScrollView>
                    {design.images[0]?.label && (
                      <View className="absolute bottom-2 left-2 bg-black/70 rounded-full px-3 py-1">
                        <Text className="text-white text-xs" style={{ fontFamily: 'Poppins_500Medium' }}>
                          {design.images[0].label}
                        </Text>
                      </View>
                    )}
                  </View>
                ) : (
                  <View className="w-full h-48 bg-[#0A1628] items-center justify-center">
                    <FileText size={48} color="#6B7280" strokeWidth={1.5} />
                  </View>
                )}

                {/* Design Info */}
                <View className="p-4">
                  <Text className="text-white text-lg mb-2" style={{ fontFamily: 'Poppins_700Bold' }}>
                    {design.name}
                  </Text>
                  
                  {design.description && (
                    <Text className="text-gray-400 text-sm mb-3" style={{ fontFamily: 'Poppins_400Regular' }}>
                      {design.description}
                    </Text>
                  )}

                  <View className="flex-row items-center mb-3">
                    <Bed size={14} color="#9CA3AF" strokeWidth={2} />
                    <Text className="text-gray-400 text-xs ml-1 mr-4" style={{ fontFamily: 'Poppins_400Regular' }}>
                      {design.bedrooms}
                    </Text>
                    <Bath size={14} color="#9CA3AF" strokeWidth={2} />
                    <Text className="text-gray-400 text-xs ml-1 mr-4" style={{ fontFamily: 'Poppins_400Regular' }}>
                      {design.bathrooms}
                    </Text>
                    <Maximize size={14} color="#9CA3AF" strokeWidth={2} />
                    <Text className="text-gray-400 text-xs ml-1" style={{ fontFamily: 'Poppins_400Regular' }}>
                      {Math.round(design.squareMeters || design.squareFootage * 0.092903)}m²
                    </Text>
                  </View>

                  <Text className="text-blue-400 text-lg mb-4" style={{ fontFamily: 'JetBrainsMono_500Medium' }}>
                    ${design.estimatedCost.toLocaleString()}
                  </Text>

                  {/* Action Buttons */}
                  <View className="flex-row gap-3">
                    <TouchableOpacity
                      onPress={() => handleEdit(design)}
                      className="flex-1 bg-blue-600/20 border border-blue-600 rounded-xl py-3 flex-row items-center justify-center"
                      activeOpacity={0.7}
                    >
                      <Edit size={16} color="#60A5FA" strokeWidth={2} />
                      <Text className="text-blue-400 text-sm ml-2" style={{ fontFamily: 'Poppins_600SemiBold' }}>
                        Edit
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => handleDelete(design)}
                      className="flex-1 bg-red-600/20 border border-red-600 rounded-xl py-3 flex-row items-center justify-center"
                      activeOpacity={0.7}
                    >
                      <Trash2 size={16} color="#F87171" strokeWidth={2} />
                      <Text className="text-red-400 text-sm ml-2" style={{ fontFamily: 'Poppins_600SemiBold' }}>
                        Delete
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Edit Modal */}
      <Modal
        visible={editingDesign !== null}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setEditingDesign(null)}
      >
        <View className="flex-1 bg-[#0A1628]">
          <View className="pt-16 px-6 pb-4 flex-row items-center border-b border-blue-900">
            <TouchableOpacity 
              onPress={() => setEditingDesign(null)}
              className="w-10 h-10 bg-[#1E3A5F] rounded-full items-center justify-center mr-4"
            >
              <ArrowLeft size={22} color="#FFFFFF" strokeWidth={2} />
            </TouchableOpacity>
            <Text className="text-white text-xl flex-1" style={{ fontFamily: 'Poppins_700Bold' }}>
              Edit Design Plan
            </Text>
          </View>
          {editingDesign && (
            <EditForm
              design={editingDesign}
              onSuccess={() => setEditingDesign(null)}
              onCancel={() => setEditingDesign(null)}
            />
          )}
        </View>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        visible={designToDelete !== null}
        transparent={true}
        animationType="fade"
        onRequestClose={cancelDelete}
      >
        <View className="flex-1 bg-black/50 items-center justify-center px-6">
          <View className="bg-[#1E3A5F] rounded-3xl p-6 w-full max-w-md border border-red-600/50">
            {/* Warning Icon */}
            <View className="items-center mb-4">
              <View className="w-16 h-16 bg-red-600/20 rounded-full items-center justify-center mb-3">
                <Trash2 size={32} color="#F87171" strokeWidth={2} />
              </View>
              <Text className="text-white text-xl text-center mb-2" style={{ fontFamily: 'Poppins_700Bold' }}>
                Delete Design Plan?
              </Text>
              <Text className="text-gray-300 text-sm text-center leading-5" style={{ fontFamily: 'Poppins_400Regular' }}>
                Are you sure you want to delete "{designToDelete?.name}"? This action cannot be undone and will permanently remove it from both your plans page and the Explore page.
              </Text>
            </View>

            {/* Warning Message */}
            <View className="bg-red-900/30 border border-red-700/50 rounded-xl p-3 mb-6">
              <View className="flex-row items-start">
                <X size={18} color="#F87171" strokeWidth={2} className="mr-2 mt-0.5" />
                <Text className="text-red-300 text-xs flex-1 leading-4" style={{ fontFamily: 'Poppins_400Regular' }}>
                  This will remove the design from the database and it will no longer be visible to homeowners.
                </Text>
              </View>
            </View>

            {/* Action Buttons */}
            <View className="flex-row gap-3">
              <TouchableOpacity
                onPress={cancelDelete}
                disabled={isDeleting}
                className="flex-1 bg-[#0A1628] border border-gray-700 rounded-xl py-4 items-center"
              >
                <Text className="text-gray-300 text-base" style={{ fontFamily: 'Poppins_600SemiBold' }}>
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
