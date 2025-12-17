import { View, Text, ScrollView, TouchableOpacity, TextInput, Image } from "react-native";
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

const categories = [
  "Cement",
  "Steel",
  "Aggregates",
  "Sand",
  "Bricks & Blocks",
  "Roofing",
  "Plumbing",
  "Electrical",
  "Paint & Finishes",
  "Hardware",
];

const units = ["bag", "piece", "ton", "kg", "meter", "sqm", "liter", "roll", "box"];

export default function VendorAddProductScreen() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: "",
    category: "",
    price: "",
    unit: "piece",
    stock: "",
    description: "",
    minOrder: "1",
  });
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [showUnitPicker, setShowUnitPicker] = useState(false);
  const [images, setImages] = useState<string[]>([]);

  const handleAddImage = () => {
    // Simulate adding an image
    const newImage = `https://images.unsplash.com/photo-${Date.now()}?w=200&q=80`;
    setImages([...images, "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=200&q=80"]);
  };

  const handleRemoveImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
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
        {/* Product Images */}
        <View className="mb-6">
          <Text className="text-white text-lg mb-3" style={{ fontFamily: 'Poppins_600SemiBold' }}>Product Images</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {images.map((image, index) => (
              <View key={index} className="relative mr-3">
                <Image source={{ uri: image }} className="w-24 h-24 rounded-xl" resizeMode="cover" />
                <TouchableOpacity 
                  onPress={() => handleRemoveImage(index)}
                  className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full items-center justify-center"
                >
                  <X size={14} color="#FFFFFF" strokeWidth={2} />
                </TouchableOpacity>
              </View>
            ))}
            <TouchableOpacity 
              onPress={handleAddImage}
              className="w-24 h-24 bg-[#1E3A5F] rounded-xl items-center justify-center border border-dashed border-blue-700"
            >
              <Camera size={24} color="#3B82F6" strokeWidth={2} />
              <Text className="text-blue-400 text-xs mt-1" style={{ fontFamily: 'Poppins_500Medium' }}>Add</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>

        {/* Product Name */}
        <View className="mb-4">
          <Text className="text-gray-400 text-sm mb-2" style={{ fontFamily: 'Poppins_500Medium' }}>Product Name *</Text>
          <View className="bg-[#1E3A5F] rounded-xl px-4 py-4 flex-row items-center border border-blue-900">
            <Package size={20} color="#3B82F6" strokeWidth={2} />
            <TextInput
              className="flex-1 ml-3 text-white"
              style={{ fontFamily: 'Poppins_400Regular' }}
              placeholder="e.g., Portland Cement Grade 42.5"
              placeholderTextColor="#6B7280"
              value={formData.name}
              onChangeText={(text) => setFormData({ ...formData, name: text })}
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
              {formData.category || "Select category"}
            </Text>
            <ChevronDown size={20} color="#6B7280" strokeWidth={2} />
          </TouchableOpacity>
          {showCategoryPicker && (
            <View className="bg-[#1E3A5F] rounded-xl mt-2 border border-blue-900 overflow-hidden">
              {categories.map((category) => (
                <TouchableOpacity
                  key={category}
                  onPress={() => {
                    setFormData({ ...formData, category });
                    setShowCategoryPicker(false);
                  }}
                  className={`px-4 py-3 border-b border-blue-900/50 ${formData.category === category ? 'bg-green-600/20' : ''}`}
                >
                  <Text className={`${formData.category === category ? 'text-green-400' : 'text-gray-300'}`} style={{ fontFamily: 'Poppins_400Regular' }}>
                    {category}
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

        {/* Stock and Min Order */}
        <View className="flex-row mb-4">
          <View className="flex-1 mr-2">
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
          <View className="flex-1 ml-2">
            <Text className="text-gray-400 text-sm mb-2" style={{ fontFamily: 'Poppins_500Medium' }}>Min. Order</Text>
            <View className="bg-[#1E3A5F] rounded-xl px-4 py-4 flex-row items-center border border-blue-900">
              <TextInput
                className="flex-1 text-white"
                style={{ fontFamily: 'Poppins_400Regular' }}
                placeholder="1"
                placeholderTextColor="#6B7280"
                keyboardType="number-pad"
                value={formData.minOrder}
                onChangeText={(text) => setFormData({ ...formData, minOrder: text })}
              />
            </View>
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
          onPress={() => router.back()}
          className="bg-green-600 rounded-full py-4 flex-row items-center justify-center"
        >
          <Plus size={20} color="#FFFFFF" strokeWidth={2} />
          <Text className="text-white text-lg ml-2" style={{ fontFamily: 'Poppins_700Bold' }}>Add Product</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
