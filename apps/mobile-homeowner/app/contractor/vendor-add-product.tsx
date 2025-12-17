import { View, Text, ScrollView, TouchableOpacity, TextInput, Image, Alert, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { 
  ArrowLeft, 
  Camera, 
  Package, 
  DollarSign, 
  Hash,
  Tag,
  FileText,
  ChevronDown,
  Plus,
  X
} from "lucide-react-native";
import { useState } from "react";
import * as ImagePicker from 'expo-image-picker';
import { useCreateMaterial } from '@/hooks/useVendor';

const categories = [
  { value: "cement", label: "Cement" },
  { value: "steel", label: "Steel" },
  { value: "wood", label: "Wood" },
  { value: "paint", label: "Paint & Finishes" },
  { value: "plumbing", label: "Plumbing" },
  { value: "electrical", label: "Electrical" },
  { value: "tiles", label: "Tiles" },
  { value: "fixtures", label: "Fixtures" },
  { value: "other", label: "Other" },
];

const units = [
  "bag (50kg)", "piece", "ton", "kg", "meter", "sqm", "liter", "roll", "box",
  "per meter", "per unit", "6 meters", "20 liters"
];

export default function VendorAddProductScreen() {
  const router = useRouter();
  const createMaterial = useCreateMaterial();
  
  const [formData, setFormData] = useState({
    name: "",
    brand: "",
    category: "",
    price: "",
    unit: "piece",
    stock: "",
    description: "",
  });
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [showUnitPicker, setShowUnitPicker] = useState(false);
  const [imageUri, setImageUri] = useState<string>("");

  const handlePickImage = async () => {
    // Request permissions
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please grant camera roll permissions to upload images');
      return;
    }

    // Pick image
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setImageUri(result.assets[0].uri);
    }
  };

  const handleTakePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please grant camera permissions');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setImageUri(result.assets[0].uri);
    }
  };

  const handleRemoveImage = () => {
    setImageUri("");
  };

  return (
    <View className="flex-1 bg-[#0A1628]">
      {/* Header */}
      <View className="pt-16 px-6 pb-4 flex-row items-center">
        <TouchableOpacity 
          onPress={() => router.back()}
          className="w-10 h-10 bg-[#1E3A5F] rounded-full items-center justify-center mr-4"
        >
          <ArrowLeft size={22} color="#FFFFFF" strokeWidth={2} />
        </TouchableOpacity>
        <Text className="text-white text-xl flex-1" style={{ fontFamily: 'Poppins_700Bold' }}>Add New Product</Text>
      </View>

      <ScrollView className="flex-1 px-6" showsVerticalScrollIndicator={false}>
        {/* Product Image */}
        <View className="mb-6">
          <Text className="text-white text-lg mb-3" style={{ fontFamily: 'Poppins_600SemiBold' }}>Product Image</Text>
          {imageUri ? (
            <View className="relative">
              <Image source={{ uri: imageUri }} className="w-full h-48 rounded-xl" resizeMode="cover" />
              <TouchableOpacity 
                onPress={handleRemoveImage}
                className="absolute top-2 right-2 w-8 h-8 bg-red-500 rounded-full items-center justify-center"
              >
                <X size={16} color="#FFFFFF" strokeWidth={2} />
              </TouchableOpacity>
            </View>
          ) : (
            <View className="flex-row">
              <TouchableOpacity 
                onPress={handlePickImage}
                className="flex-1 bg-[#1E3A5F] rounded-xl py-8 items-center justify-center border border-dashed border-blue-700 mr-2"
              >
                <Package size={32} color="#3B82F6" strokeWidth={2} />
                <Text className="text-blue-400 text-sm mt-2" style={{ fontFamily: 'Poppins_500Medium' }}>Gallery</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                onPress={handleTakePhoto}
                className="flex-1 bg-[#1E3A5F] rounded-xl py-8 items-center justify-center border border-dashed border-blue-700 ml-2"
              >
                <Camera size={32} color="#3B82F6" strokeWidth={2} />
                <Text className="text-blue-400 text-sm mt-2" style={{ fontFamily: 'Poppins_500Medium' }}>Camera</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Product Name */}
        <View className="mb-4">
          <Text className="text-gray-400 text-sm mb-2" style={{ fontFamily: 'Poppins_500Medium' }}>Product Name *</Text>
          <View className="bg-[#1E3A5F] rounded-xl px-4 py-4 flex-row items-center border border-blue-900">
            <Package size={20} color="#3B82F6" strokeWidth={2} />
            <TextInput
              className="flex-1 ml-3 text-white"
              style={{ fontFamily: 'Poppins_400Regular' }}
              placeholder="e.g., Premium Portland Cement"
              placeholderTextColor="#6B7280"
              value={formData.name}
              onChangeText={(text) => setFormData({ ...formData, name: text })}
            />
          </View>
        </View>

        {/* Brand */}
        <View className="mb-4">
          <Text className="text-gray-400 text-sm mb-2" style={{ fontFamily: 'Poppins_500Medium' }}>Brand *</Text>
          <View className="bg-[#1E3A5F] rounded-xl px-4 py-4 flex-row items-center border border-blue-900">
            <Tag size={20} color="#3B82F6" strokeWidth={2} />
            <TextInput
              className="flex-1 ml-3 text-white"
              style={{ fontFamily: 'Poppins_400Regular' }}
              placeholder="e.g., Dangote"
              placeholderTextColor="#6B7280"
              value={formData.brand}
              onChangeText={(text) => setFormData({ ...formData, brand: text })}
            />
          </View>
        </View>

        {/* Category */}
        <View className="mb-4">
          <Text className="text-gray-400 text-sm mb-2" style={{ fontFamily: 'Poppins_500Medium' }}>Category *</Text>
          <TouchableOpacity 
            onPress={() => setShowCategoryPicker(!showCategoryPicker)}
            className="bg-[#1E3A5F] rounded-xl px-4 py-4 flex-row items-center border border-blue-900"
          >
            <Tag size={20} color="#3B82F6" strokeWidth={2} />
            <Text className={`flex-1 ml-3 ${formData.category ? 'text-white' : 'text-gray-500'}`} style={{ fontFamily: 'Poppins_400Regular' }}>
              {categories.find(c => c.value === formData.category)?.label || "Select category"}
            </Text>
            <ChevronDown size={20} color="#6B7280" strokeWidth={2} />
          </TouchableOpacity>
          {showCategoryPicker && (
            <View className="bg-[#1E3A5F] rounded-xl mt-2 border border-blue-900 overflow-hidden">
              {categories.map((category) => (
                <TouchableOpacity
                  key={category.value}
                  onPress={() => {
                    setFormData({ ...formData, category: category.value });
                    setShowCategoryPicker(false);
                  }}
                  className={`px-4 py-3 border-b border-blue-900/50 ${formData.category === category.value ? 'bg-green-600/20' : ''}`}
                >
                  <Text className={`${formData.category === category.value ? 'text-green-400' : 'text-gray-300'}`} style={{ fontFamily: 'Poppins_400Regular' }}>
                    {category.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Price and Unit */}
        <View className="flex-row mb-4">
          <View className="flex-1 mr-2">
            <Text className="text-gray-400 text-sm mb-2" style={{ fontFamily: 'Poppins_500Medium' }}>Price *</Text>
            <View className="bg-[#1E3A5F] rounded-xl px-4 py-4 flex-row items-center border border-blue-900">
              <DollarSign size={20} color="#10B981" strokeWidth={2} />
              <TextInput
                className="flex-1 ml-3 text-white"
                style={{ fontFamily: 'JetBrainsMono_500Medium' }}
                placeholder="0.00"
                placeholderTextColor="#6B7280"
                keyboardType="decimal-pad"
                value={formData.price}
                onChangeText={(text) => setFormData({ ...formData, price: text })}
              />
            </View>
          </View>
          <View className="flex-1 ml-2">
            <Text className="text-gray-400 text-sm mb-2" style={{ fontFamily: 'Poppins_500Medium' }}>Unit *</Text>
            <TouchableOpacity 
              onPress={() => setShowUnitPicker(!showUnitPicker)}
              className="bg-[#1E3A5F] rounded-xl px-4 py-4 flex-row items-center border border-blue-900"
            >
              <Text className="flex-1 text-white" style={{ fontFamily: 'Poppins_400Regular' }}>{formData.unit}</Text>
              <ChevronDown size={20} color="#6B7280" strokeWidth={2} />
            </TouchableOpacity>
          </View>
        </View>

        {showUnitPicker && (
          <View className="bg-[#1E3A5F] rounded-xl mb-4 border border-blue-900 overflow-hidden">
            <View className="flex-row flex-wrap p-2">
              {units.map((unit) => (
                <TouchableOpacity
                  key={unit}
                  onPress={() => {
                    setFormData({ ...formData, unit });
                    setShowUnitPicker(false);
                  }}
                  className={`px-4 py-2 m-1 rounded-full ${formData.unit === unit ? 'bg-green-600' : 'bg-blue-900/50'}`}
                >
                  <Text className={`${formData.unit === unit ? 'text-white' : 'text-gray-300'}`} style={{ fontFamily: 'Poppins_500Medium' }}>
                    {unit}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Stock Quantity */}
        <View className="mb-4">
          <Text className="text-gray-400 text-sm mb-2" style={{ fontFamily: 'Poppins_500Medium' }}>Stock Quantity *</Text>
          <View className="bg-[#1E3A5F] rounded-xl px-4 py-4 flex-row items-center border border-blue-900">
            <Hash size={20} color="#3B82F6" strokeWidth={2} />
            <TextInput
              className="flex-1 ml-3 text-white"
              style={{ fontFamily: 'Poppins_400Regular' }}
              placeholder="0"
              placeholderTextColor="#6B7280"
              keyboardType="number-pad"
              value={formData.stock}
              onChangeText={(text) => setFormData({ ...formData, stock: text })}
            />
          </View>
        </View>

        {/* Description */}
        <View className="mb-6">
          <Text className="text-gray-400 text-sm mb-2" style={{ fontFamily: 'Poppins_500Medium' }}>Description</Text>
          <View className="bg-[#1E3A5F] rounded-xl px-4 py-4 border border-blue-900">
            <View className="flex-row items-start">
              <FileText size={20} color="#3B82F6" strokeWidth={2} />
              <TextInput
                className="flex-1 ml-3 text-white min-h-[100px]"
                style={{ fontFamily: 'Poppins_400Regular', textAlignVertical: 'top' }}
                placeholder="Describe your product specifications, quality, and any other relevant details..."
                placeholderTextColor="#6B7280"
                multiline
                value={formData.description}
                onChangeText={(text) => setFormData({ ...formData, description: text })}
              />
            </View>
          </View>
        </View>

        <View className="h-8" />
      </ScrollView>

      {/* Bottom Actions */}
      <View className="px-6 pb-8 pt-4 bg-[#0A1628] border-t border-blue-900">
        <TouchableOpacity 
          onPress={async () => {
            // Validation
            if (!formData.name.trim()) {
              Alert.alert('Required', 'Please enter product name');
              return;
            }
            if (!formData.brand.trim()) {
              Alert.alert('Required', 'Please enter brand name');
              return;
            }
            if (!formData.category) {
              Alert.alert('Required', 'Please select a category');
              return;
            }
            if (!formData.price || parseFloat(formData.price) <= 0) {
              Alert.alert('Required', 'Please enter a valid price');
              return;
            }

            try {
              console.log('🚀 Creating material:', {
                name: formData.name,
                brand: formData.brand,
                category: formData.category,
                price: parseFloat(formData.price),
              });

              const result = await createMaterial.mutateAsync({
                name: formData.name,
                brand: formData.brand,
                description: formData.description || undefined,
                category: formData.category,
                price: parseFloat(formData.price),
                unit: formData.unit,
                stock: formData.stock ? parseInt(formData.stock) : 0,
                imageUrl: imageUri || undefined,
              });

              console.log('✅ Material created:', result);

              Alert.alert(
                'Success! 🎉', 
                'Your product has been added and is now visible in the shop!',
                [{ text: 'OK', onPress: () => router.back() }]
              );
            } catch (error: any) {
              console.error('❌ Error creating material:', error);
              Alert.alert(
                'Error', 
                error.message || 'Failed to create product. Check console for details.'
              );
            }
          }}
          disabled={createMaterial.isPending}
          className="bg-green-600 rounded-full py-4 flex-row items-center justify-center"
        >
          {createMaterial.isPending ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <>
              <Plus size={20} color="#FFFFFF" strokeWidth={2} />
              <Text className="text-white text-lg ml-2" style={{ fontFamily: 'Poppins_700Bold' }}>Add Product</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}
