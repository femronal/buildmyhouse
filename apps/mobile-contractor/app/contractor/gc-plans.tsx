import { View, Text, ScrollView, TouchableOpacity, Image, Alert, ActivityIndicator, Platform, Modal, TextInput } from "react-native";
import { useRouter } from "expo-router";
import { ArrowLeft, Camera, X, FileText, Bed, Bath, Maximize, DollarSign, Edit, Trash2, Plus, Info } from "lucide-react-native";
import { useState, useRef } from "react";
import * as ImagePicker from 'expo-image-picker';
import { designService } from '@/services/designService';
import { useMyDesigns, useDeleteDesign, useUpdateDesign } from '@/hooks/useDesigns';
import { useMutation, useQueryClient } from '@tanstack/react-query';

interface ImageWithLabel {
  uri: string;
  label: string;
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
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [bedrooms, setBedrooms] = useState("");
  const [bathrooms, setBathrooms] = useState("");
  const [squareFootage, setSquareFootage] = useState("");
  const [estimatedCost, setEstimatedCost] = useState("");
  const [floors, setFloors] = useState("");
  const [estimatedDuration, setEstimatedDuration] = useState("");
  const [rooms, setRooms] = useState("");
  const [materials, setMaterials] = useState("");
  const [features, setFeatures] = useState("");
  const [constructionPhases, setConstructionPhases] = useState("");
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
      console.log('📸 [GC Plans] Starting image picker...');
      console.log('📸 [GC Plans] Platform:', Platform.OS);
      
      // On web, the label handles the click automatically - no need to do anything here
      if (Platform.OS === 'web') {
        // The label will automatically trigger the file input when clicked
        // This is handled by the label's htmlFor attribute
        return;
      }
      
      // For iOS/Android, use expo-image-picker
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      console.log('📸 [GC Plans] Permission status:', status);
      
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'We need camera roll permissions to upload images');
        return;
      }

      console.log('📸 [GC Plans] Launching image library...');
      
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.8,
        allowsMultipleSelection: Platform.OS === 'ios', // iOS supports multiple selection
      });

      console.log('📸 [GC Plans] Image picker result:', result);

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
          console.log('📸 [GC Plans] Processing', selectedAssets.length, 'selected images...');
          const newImages = selectedAssets.map((asset, index) => ({
            uri: asset.uri,
            label: `Image ${images.length + index + 1}`,
          }));
          console.log('📸 [GC Plans] New images to add:', newImages);
          setImages([...images, ...newImages]);
          console.log('📸 [GC Plans] Images updated successfully. Total images:', images.length + newImages.length);
        } else {
          console.log('📸 [GC Plans] No valid image assets found in result');
        }
      } else {
        console.log('📸 [GC Plans] Image picker was canceled by user');
      }
    } catch (error: any) {
      console.error('❌ [GC Plans] Error picking images:', error);
      console.error('❌ [GC Plans] Error message:', error.message);
      console.error('❌ [GC Plans] Error stack:', error.stack);
      Alert.alert('Error', error.message || 'Failed to pick images. Please try again.');
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
    console.log('📤 [GC Plans] Upload button clicked');
    console.log('📤 [GC Plans] Form data:', { name, bedrooms, bathrooms, squareFootage, estimatedCost, imagesCount: images.length });
    
    if (!name.trim()) {
      console.log('❌ [GC Plans] Validation failed: name is empty');
      Alert.alert('Validation Error', 'Please enter a design name');
      return;
    }
    if (!bedrooms || parseInt(bedrooms) < 1) {
      console.log('❌ [GC Plans] Validation failed: invalid bedrooms');
      Alert.alert('Validation Error', 'Please enter a valid number of bedrooms');
      return;
    }
    if (!bathrooms || parseInt(bathrooms) < 1) {
      console.log('❌ [GC Plans] Validation failed: invalid bathrooms');
      Alert.alert('Validation Error', 'Please enter a valid number of bathrooms');
      return;
    }
    if (!squareFootage || parseFloat(squareFootage) < 1) {
      console.log('❌ [GC Plans] Validation failed: invalid square footage');
      Alert.alert('Validation Error', 'Please enter a valid square footage');
      return;
    }
    if (!estimatedCost || parseFloat(estimatedCost) < 0) {
      console.log('❌ [GC Plans] Validation failed: invalid estimated cost');
      Alert.alert('Validation Error', 'Please enter a valid estimated cost');
      return;
    }
    if (images.length === 0) {
      console.log('❌ [GC Plans] Validation failed: no images');
      Alert.alert('Validation Error', 'Please upload at least one image');
      return;
    }

    console.log('✅ [GC Plans] All validations passed, starting upload...');
    setIsSubmitting(true);

    try {
      // Prepare design data
      const designData = {
        name: name.trim(),
        description: description.trim() || undefined,
        bedrooms: parseInt(bedrooms, 10),
        bathrooms: parseInt(bathrooms, 10),
        squareFootage: parseFloat(squareFootage),
        estimatedCost: parseFloat(estimatedCost),
        floors: floors ? parseInt(floors, 10) : undefined,
        estimatedDuration: estimatedDuration.trim() || undefined,
        rooms: rooms.trim() || undefined,
        materials: materials.trim() || undefined,
        features: features.trim() || undefined,
        constructionPhases: constructionPhases.trim() || undefined,
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

      console.log('📤 [GC Plans] Calling mutation with:', {
        designDataKeys: Object.keys(designData),
        imageUrisCount: imageUris.length,
      });

      // Use mutate with promise wrapper to avoid React development mode issues
      await new Promise<void>((resolve, reject) => {
        createDesignMutation.mutate(
          { designData, imageUris },
          {
            onSuccess: () => {
              console.log('✅ [GC Plans] Mutation successful');
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
      setRooms("");
      setMaterials("");
      setFeatures("");
      setConstructionPhases("");
      setImages([]);

      Alert.alert(
        'Success! 🎉',
        'Your design plan has been uploaded successfully and is now visible to homeowners in the Explore section.',
        [{ text: 'OK' }],
        { cancelable: false }
      );
    } catch (error: any) {
      console.error('❌ [GC Plans] Error uploading design:', error);
      Alert.alert('Upload Failed', error.message || 'Failed to upload design. Please try again.');
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
              <DollarSign size={18} color="#6B7280" strokeWidth={2} />
              <TextInput
                className="flex-1 ml-3 text-white text-base"
                style={{ fontFamily: 'Poppins_400Regular' }}
                placeholder="Est. Cost"
                placeholderTextColor="#6B7280"
                value={estimatedCost}
                onChangeText={setEstimatedCost}
                keyboardType="numeric"
              />
            </View>
          </View>
        </View>
      </View>

      {/* Additional Details */}
      <View className="mb-6">
        <Text className="text-gray-300 text-sm mb-3" style={{ fontFamily: 'Poppins_500Medium' }}>
          Additional Details
        </Text>

        <View className="flex-row mb-3">
          <View className="flex-1 mr-2">
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
          
          <View className="flex-1 ml-2">
            <View className="bg-[#0A1628] rounded-xl px-4 py-3 flex-row items-center border border-blue-900">
              <TextInput
                className="flex-1 text-white text-base"
                style={{ fontFamily: 'Poppins_400Regular' }}
                placeholder="Duration (e.g., 8-10 months)"
                placeholderTextColor="#6B7280"
                value={estimatedDuration}
                onChangeText={setEstimatedDuration}
              />
            </View>
          </View>
        </View>

        <View className="mb-3">
          <TextInput
            className="bg-[#0A1628] rounded-xl px-4 py-3 text-white text-base border border-blue-900"
            style={{ fontFamily: 'Poppins_400Regular', minHeight: 50 }}
            placeholder="Rooms (comma-separated, e.g., Kitchen, Living Room, Master Bedroom)"
            placeholderTextColor="#6B7280"
            value={rooms}
            onChangeText={setRooms}
            multiline
          />
        </View>

        <View className="mb-3">
          <TextInput
            className="bg-[#0A1628] rounded-xl px-4 py-3 text-white text-base border border-blue-900"
            style={{ fontFamily: 'Poppins_400Regular', minHeight: 50 }}
            placeholder="Materials (comma-separated, e.g., Concrete, Steel, Wood)"
            placeholderTextColor="#6B7280"
            value={materials}
            onChangeText={setMaterials}
            multiline
          />
        </View>

        <View className="mb-3">
          <TextInput
            className="bg-[#0A1628] rounded-xl px-4 py-3 text-white text-base border border-blue-900"
            style={{ fontFamily: 'Poppins_400Regular', minHeight: 50 }}
            placeholder="Features (comma-separated, e.g., Solar Panels, Smart Home, Pool)"
            placeholderTextColor="#6B7280"
            value={features}
            onChangeText={setFeatures}
            multiline
          />
        </View>

        <View className="mb-3">
          <TextInput
            className="bg-[#0A1628] rounded-xl px-4 py-3 text-white text-base border border-blue-900"
            style={{ fontFamily: 'Poppins_400Regular', minHeight: 100 }}
            placeholder="Construction Phases (JSON format or description)"
            placeholderTextColor="#6B7280"
            value={constructionPhases}
            onChangeText={setConstructionPhases}
            multiline
          />
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
                  console.log('📸 [GC Plans] Files selected:', files.length);
                  
                  if (files.length > 0) {
                    setImages(prev => {
                      const newImages = files.map((file, index) => {
                        const uri = URL.createObjectURL(file);
                        return {
                          uri,
                          label: `Image ${prev.length + index + 1}`,
                        };
                      });
                      
                      console.log('📸 [GC Plans] New images to add:', newImages.length);
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
      <View className="flex-row mb-8" style={{ gap: 12 }}>
        <TouchableOpacity
          onPress={onCancel}
          disabled={isSubmitting}
          className="flex-1 bg-[#1E3A5F] rounded-full py-4 items-center"
        >
          <Text className="text-white text-lg" style={{ fontFamily: 'Poppins_700Bold' }}>
            Cancel
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={(e) => {
            console.log('🔘 [GC Plans] Upload button TouchableOpacity onPress fired', e);
            handleSubmit();
          }}
          disabled={isSubmitting}
          className={`flex-1 bg-blue-600 rounded-full py-4 items-center ${isSubmitting ? 'opacity-50' : ''}`}
          activeOpacity={0.7}
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
  const [name, setName] = useState(design.name || "");
  const [description, setDescription] = useState(design.description || "");
  const [bedrooms, setBedrooms] = useState(design.bedrooms?.toString() || "");
  const [bathrooms, setBathrooms] = useState(design.bathrooms?.toString() || "");
  const [squareFootage, setSquareFootage] = useState(design.squareFootage?.toString() || "");
  const [estimatedCost, setEstimatedCost] = useState(design.estimatedCost?.toString() || "");
  const [floors, setFloors] = useState(design.floors?.toString() || "");
  const [estimatedDuration, setEstimatedDuration] = useState(design.estimatedDuration || "");
  const [rooms, setRooms] = useState(Array.isArray(design.rooms) ? design.rooms.join(', ') : "");
  const [materials, setMaterials] = useState(Array.isArray(design.materials) ? design.materials.join(', ') : "");
  const [features, setFeatures] = useState(Array.isArray(design.features) ? design.features.join(', ') : "");
  const [constructionPhases, setConstructionPhases] = useState(
    design.constructionPhases ? (typeof design.constructionPhases === 'string' ? design.constructionPhases : JSON.stringify(design.constructionPhases)) : ""
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const updateDesignMutation = useUpdateDesign();

  const handleSubmit = async () => {
    if (!name.trim()) {
      Alert.alert('Validation Error', 'Please enter a design name');
      return;
    }
    if (!bedrooms || parseInt(bedrooms) < 1) {
      Alert.alert('Validation Error', 'Please enter a valid number of bedrooms');
      return;
    }
    if (!bathrooms || parseInt(bathrooms) < 1) {
      Alert.alert('Validation Error', 'Please enter a valid number of bathrooms');
      return;
    }
    if (!squareFootage || parseFloat(squareFootage) < 1) {
      Alert.alert('Validation Error', 'Please enter a valid square footage');
      return;
    }
    if (!estimatedCost || parseFloat(estimatedCost) < 0) {
      Alert.alert('Validation Error', 'Please enter a valid estimated cost');
      return;
    }

    setIsSubmitting(true);

    try {
      await updateDesignMutation.mutateAsync({
        designId: design.id,
        updateData: {
          name: name.trim(),
          description: description.trim() || undefined,
          bedrooms: parseInt(bedrooms),
          bathrooms: parseInt(bathrooms),
          squareFootage: parseFloat(squareFootage),
          estimatedCost: parseFloat(estimatedCost),
          floors: floors ? parseInt(floors) : undefined,
          estimatedDuration: estimatedDuration.trim() || undefined,
          rooms: rooms.trim() || undefined,
          materials: materials.trim() || undefined,
          features: features.trim() || undefined,
          constructionPhases: constructionPhases.trim() || undefined,
        },
      });
      
      Alert.alert('Success', 'Design updated successfully!', [{ text: 'OK', onPress: onSuccess }]);
    } catch (error: any) {
      console.error('❌ [Edit Form] Error updating design:', error);
      Alert.alert('Error', error.message || 'Failed to update design. Please try again.');
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
                <DollarSign size={18} color="#6B7280" strokeWidth={2} />
                <TextInput
                  className="flex-1 ml-3 text-white text-base"
                  style={{ fontFamily: 'Poppins_400Regular' }}
                  placeholder="Est. Cost"
                  placeholderTextColor="#6B7280"
                  value={estimatedCost}
                  onChangeText={setEstimatedCost}
                  keyboardType="numeric"
                />
            </View>
          </View>
        </View>
      </View>

      {/* Additional Details */}
      <View className="mb-4">
        <Text className="text-gray-300 text-sm mb-3" style={{ fontFamily: 'Poppins_500Medium' }}>
          Additional Details
        </Text>

        <View className="flex-row mb-3">
          <View className="flex-1 mr-2">
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
          
          <View className="flex-1 ml-2">
            <View className="bg-[#0A1628] rounded-xl px-4 py-3 flex-row items-center border border-blue-900">
              <TextInput
                className="flex-1 text-white text-base"
                style={{ fontFamily: 'Poppins_400Regular' }}
                placeholder="Duration (e.g., 8-10 months)"
                placeholderTextColor="#6B7280"
                value={estimatedDuration}
                onChangeText={setEstimatedDuration}
              />
            </View>
          </View>
        </View>

        <View className="mb-3">
          <TextInput
            className="bg-[#0A1628] rounded-xl px-4 py-3 text-white text-base border border-blue-900"
            style={{ fontFamily: 'Poppins_400Regular', minHeight: 50 }}
            placeholder="Rooms (comma-separated, e.g., Kitchen, Living Room, Master Bedroom)"
            placeholderTextColor="#6B7280"
            value={rooms}
            onChangeText={setRooms}
            multiline
          />
        </View>

        <View className="mb-3">
          <TextInput
            className="bg-[#0A1628] rounded-xl px-4 py-3 text-white text-base border border-blue-900"
            style={{ fontFamily: 'Poppins_400Regular', minHeight: 50 }}
            placeholder="Materials (comma-separated, e.g., Concrete, Steel, Wood)"
            placeholderTextColor="#6B7280"
            value={materials}
            onChangeText={setMaterials}
            multiline
          />
        </View>

        <View className="mb-3">
          <TextInput
            className="bg-[#0A1628] rounded-xl px-4 py-3 text-white text-base border border-blue-900"
            style={{ fontFamily: 'Poppins_400Regular', minHeight: 50 }}
            placeholder="Features (comma-separated, e.g., Solar Panels, Smart Home, Pool)"
            placeholderTextColor="#6B7280"
            value={features}
            onChangeText={setFeatures}
            multiline
          />
        </View>

        <View className="mb-3">
          <TextInput
            className="bg-[#0A1628] rounded-xl px-4 py-3 text-white text-base border border-blue-900"
            style={{ fontFamily: 'Poppins_400Regular', minHeight: 100 }}
            placeholder="Construction Phases (JSON format or description)"
            placeholderTextColor="#6B7280"
            value={constructionPhases}
            onChangeText={setConstructionPhases}
            multiline
          />
        </View>
      </View>

        {/* Buttons */}
        <View className="flex-row mt-4 mb-8" style={{ gap: 12 }}>
          <TouchableOpacity
            onPress={onCancel}
            disabled={isSubmitting}
            className="flex-1 bg-[#1E3A5F] rounded-full py-4 items-center"
          >
            <Text className="text-white text-lg" style={{ fontFamily: 'Poppins_700Bold' }}>
              Cancel
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleSubmit}
            disabled={isSubmitting}
            className={`flex-1 bg-blue-600 rounded-full py-4 items-center ${isSubmitting ? 'opacity-50' : ''}`}
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
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [editingDesign, setEditingDesign] = useState<any | null>(null);
  const [designToDelete, setDesignToDelete] = useState<any | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const { data: designs = [], isLoading } = useMyDesigns();
  const deleteDesignMutation = useDeleteDesign();

  const handleDelete = (design: any) => {
    console.log('🗑️ [GC Plans] Delete button clicked for design:', design.id, design.name);
    setDesignToDelete(design);
  };

  const confirmDelete = async () => {
    if (!designToDelete) return;

    setIsDeleting(true);
    try {
      console.log('🗑️ [GC Plans] Attempting to delete design:', designToDelete.id);
      await deleteDesignMutation.mutateAsync(designToDelete.id);
      console.log('✅ [GC Plans] Design deleted successfully');
      setDesignToDelete(null);
      setIsDeleting(false);
      
      // Show success message
      Alert.alert('Success', 'Design deleted successfully');
    } catch (error: any) {
      console.error('❌ [GC Plans] Error deleting design:', error);
      console.error('❌ [GC Plans] Error details:', {
        message: error.message,
        status: error.status,
        data: error.data,
      });
      setIsDeleting(false);
      Alert.alert('Error', error.message || 'Failed to delete design');
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
            console.log('🔘 [GC Plans] "Upload New Design Plan" button clicked', e);
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
