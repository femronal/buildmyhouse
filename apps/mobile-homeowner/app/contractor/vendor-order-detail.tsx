import { View, Text, ScrollView, TouchableOpacity, Image } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { 
  ArrowLeft, 
  MapPin, 
  Calendar, 
  DollarSign, 
  Package, 
  MessageCircle,
  Phone,
  Truck,
  CheckCircle,
  Clock,
  FileText
} from "lucide-react-native";

const orderData = {
  id: 1,
  orderNumber: "ORD-2024-001",
  gcName: "Chukwuemeka Okonkwo",
  gcPhone: "+234 801 234 5678",
  gcAvatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&q=80",
  projectName: "Modern Minimalist Villa",
  deliveryAddress: "123 Main Street, Lekki, Lagos",
  status: "pending",
  orderDate: "Dec 10, 2024",
  deliveryDate: "Dec 15, 2024",
  items: [
    { id: 1, name: "Portland Cement (Grade 42.5)", quantity: 50, unit: "bags", price: 12.50, total: 625 },
    { id: 2, name: "Steel Reinforcement Bars (12mm)", quantity: 200, unit: "pcs", price: 8.75, total: 1750 },
    { id: 3, name: "Granite Aggregate (20mm)", quantity: 10, unit: "tons", price: 45.00, total: 450 },
  ],
  subtotal: 2825,
  deliveryFee: 150,
  total: 2975,
  notes: "Please deliver before 10 AM. Site supervisor will be available to receive.",
};

export default function VendorOrderDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();

  const getStatusInfo = () => {
    switch (orderData.status) {
      case 'delivered':
        return { bg: 'bg-green-600/20', text: 'text-green-400', label: 'Delivered', icon: CheckCircle, iconColor: '#10B981' };
      case 'processing':
        return { bg: 'bg-blue-600/20', text: 'text-blue-400', label: 'Processing', icon: Package, iconColor: '#3B82F6' };
      case 'shipped':
        return { bg: 'bg-purple-600/20', text: 'text-purple-400', label: 'Shipped', icon: Truck, iconColor: '#A855F7' };
      default:
        return { bg: 'bg-yellow-600/20', text: 'text-yellow-400', label: 'Pending', icon: Clock, iconColor: '#F59E0B' };
    }
  };

  const statusInfo = getStatusInfo();
  const StatusIcon = statusInfo.icon;

  return (
    <View className="flex-1 bg-[#0A1628]">
      {/* Header */}
      <View className="pt-16 px-6 pb-4 flex-row items-center justify-between">
        <TouchableOpacity 
          onPress={() => router.back()}
          className="w-10 h-10 bg-[#1E3A5F] rounded-full items-center justify-center"
        >
          <ArrowLeft size={22} color="#FFFFFF" strokeWidth={2} />
        </TouchableOpacity>
        <Text className="text-white text-lg" style={{ fontFamily: 'Poppins_700Bold' }}>Order Details</Text>
        <TouchableOpacity className="w-10 h-10 bg-[#1E3A5F] rounded-full items-center justify-center">
          <MessageCircle size={20} color="#3B82F6" strokeWidth={2} />
        </TouchableOpacity>
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Order Header */}
        <View className="px-6 mb-6">
          <View className="flex-row items-center justify-between mb-4">
            <View>
              <Text className="text-gray-400 text-sm" style={{ fontFamily: 'Poppins_400Regular' }}>Order Number</Text>
              <Text className="text-white text-xl" style={{ fontFamily: 'JetBrainsMono_500Medium' }}>{orderData.orderNumber}</Text>
            </View>
            <View className={`${statusInfo.bg} rounded-full px-4 py-2 flex-row items-center`}>
              <StatusIcon size={16} color={statusInfo.iconColor} strokeWidth={2} />
              <Text className={`${statusInfo.text} text-sm ml-2`} style={{ fontFamily: 'Poppins_600SemiBold' }}>{statusInfo.label}</Text>
            </View>
          </View>

          {/* GC Contact */}
          <View className="bg-[#1E3A5F] rounded-xl p-4 flex-row items-center border border-blue-900">
            <Image source={{ uri: orderData.gcAvatar }} className="w-12 h-12 rounded-full" resizeMode="cover" />
            <View className="flex-1 ml-3">
              <Text className="text-gray-400 text-xs" style={{ fontFamily: 'Poppins_400Regular' }}>General Contractor</Text>
              <Text className="text-white" style={{ fontFamily: 'Poppins_600SemiBold' }}>{orderData.gcName}</Text>
            </View>
            <TouchableOpacity className="w-10 h-10 bg-green-600 rounded-full items-center justify-center mr-2">
              <Phone size={18} color="#FFFFFF" strokeWidth={2} />
            </TouchableOpacity>
            <TouchableOpacity className="w-10 h-10 bg-blue-600/20 rounded-full items-center justify-center">
              <MessageCircle size={18} color="#3B82F6" strokeWidth={2} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Project & Delivery Info */}
        <View className="px-6 mb-6">
          <View className="bg-[#1E3A5F] rounded-xl p-4 border border-blue-900">
            <View className="mb-4">
              <Text className="text-gray-400 text-xs" style={{ fontFamily: 'Poppins_400Regular' }}>Project</Text>
              <Text className="text-white" style={{ fontFamily: 'Poppins_600SemiBold' }}>{orderData.projectName}</Text>
            </View>
            <View className="flex-row items-start mb-4">
              <MapPin size={16} color="#3B82F6" strokeWidth={2} />
              <View className="flex-1 ml-2">
                <Text className="text-gray-400 text-xs" style={{ fontFamily: 'Poppins_400Regular' }}>Delivery Address</Text>
                <Text className="text-white text-sm" style={{ fontFamily: 'Poppins_400Regular' }}>{orderData.deliveryAddress}</Text>
              </View>
            </View>
            <View className="flex-row">
              <View className="flex-1">
                <View className="flex-row items-center">
                  <Calendar size={14} color="#6B7280" strokeWidth={2} />
                  <Text className="text-gray-400 text-xs ml-2" style={{ fontFamily: 'Poppins_400Regular' }}>Order Date</Text>
                </View>
                <Text className="text-white text-sm mt-1" style={{ fontFamily: 'Poppins_500Medium' }}>{orderData.orderDate}</Text>
              </View>
              <View className="flex-1">
                <View className="flex-row items-center">
                  <Truck size={14} color="#6B7280" strokeWidth={2} />
                  <Text className="text-gray-400 text-xs ml-2" style={{ fontFamily: 'Poppins_400Regular' }}>Delivery Date</Text>
                </View>
                <Text className="text-white text-sm mt-1" style={{ fontFamily: 'Poppins_500Medium' }}>{orderData.deliveryDate}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Order Items */}
        <View className="px-6 mb-6">
          <Text className="text-white text-lg mb-3" style={{ fontFamily: 'Poppins_700Bold' }}>Order Items</Text>
          {orderData.items.map((item) => (
            <View key={item.id} className="bg-[#1E3A5F] rounded-xl p-4 mb-2 border border-blue-900">
              <View className="flex-row justify-between items-start mb-2">
                <View className="flex-1">
                  <Text className="text-white" style={{ fontFamily: 'Poppins_500Medium' }}>{item.name}</Text>
                  <Text className="text-gray-400 text-sm" style={{ fontFamily: 'Poppins_400Regular' }}>
                    {item.quantity} {item.unit} × ${item.price.toFixed(2)}
                  </Text>
                </View>
                <Text className="text-white" style={{ fontFamily: 'JetBrainsMono_500Medium' }}>${item.total.toFixed(2)}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Order Notes */}
        {orderData.notes && (
          <View className="px-6 mb-6">
            <Text className="text-white text-lg mb-3" style={{ fontFamily: 'Poppins_700Bold' }}>Delivery Notes</Text>
            <View className="bg-yellow-900/30 rounded-xl p-4 border border-yellow-700/50">
              <View className="flex-row items-start">
                <FileText size={18} color="#F59E0B" strokeWidth={2} />
                <Text className="text-gray-300 text-sm ml-3 flex-1" style={{ fontFamily: 'Poppins_400Regular' }}>
                  {orderData.notes}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Order Summary */}
        <View className="px-6 mb-6">
          <Text className="text-white text-lg mb-3" style={{ fontFamily: 'Poppins_700Bold' }}>Order Summary</Text>
          <View className="bg-[#1E3A5F] rounded-xl p-4 border border-blue-900">
            <View className="flex-row justify-between mb-2">
              <Text className="text-gray-400" style={{ fontFamily: 'Poppins_400Regular' }}>Subtotal</Text>
              <Text className="text-white" style={{ fontFamily: 'JetBrainsMono_500Medium' }}>${orderData.subtotal.toFixed(2)}</Text>
            </View>
            <View className="flex-row justify-between mb-2">
              <Text className="text-gray-400" style={{ fontFamily: 'Poppins_400Regular' }}>Delivery Fee</Text>
              <Text className="text-white" style={{ fontFamily: 'JetBrainsMono_500Medium' }}>${orderData.deliveryFee.toFixed(2)}</Text>
            </View>
            <View className="h-px bg-blue-900 my-3" />
            <View className="flex-row justify-between">
              <Text className="text-white text-lg" style={{ fontFamily: 'Poppins_700Bold' }}>Total</Text>
              <Text className="text-green-400 text-lg" style={{ fontFamily: 'JetBrainsMono_500Medium' }}>${orderData.total.toFixed(2)}</Text>
            </View>
          </View>
        </View>

        <View className="h-8" />
      </ScrollView>

      {/* Bottom Actions */}
      <View className="px-6 pb-8 pt-4 bg-[#0A1628] border-t border-blue-900">
        {orderData.status === 'pending' && (
          <View className="flex-row">
            <TouchableOpacity className="flex-1 bg-red-600/20 rounded-full py-4 mr-2">
              <Text className="text-red-400 text-center text-lg" style={{ fontFamily: 'Poppins_700Bold' }}>Decline</Text>
            </TouchableOpacity>
            <TouchableOpacity className="flex-1 bg-green-600 rounded-full py-4 ml-2">
              <Text className="text-white text-center text-lg" style={{ fontFamily: 'Poppins_700Bold' }}>Accept Order</Text>
            </TouchableOpacity>
          </View>
        )}
        {orderData.status === 'processing' && (
          <TouchableOpacity className="bg-blue-600 rounded-full py-4 flex-row items-center justify-center">
            <Truck size={20} color="#FFFFFF" strokeWidth={2} />
            <Text className="text-white text-lg ml-2" style={{ fontFamily: 'Poppins_700Bold' }}>Mark as Shipped</Text>
          </TouchableOpacity>
        )}
        {orderData.status === 'shipped' && (
          <TouchableOpacity className="bg-green-600 rounded-full py-4 flex-row items-center justify-center">
            <CheckCircle size={20} color="#FFFFFF" strokeWidth={2} />
            <Text className="text-white text-lg ml-2" style={{ fontFamily: 'Poppins_700Bold' }}>Confirm Delivery</Text>
          </TouchableOpacity>
        )}
        {orderData.status === 'delivered' && (
          <View className="bg-green-600/20 rounded-full py-4 flex-row items-center justify-center">
            <CheckCircle size={20} color="#10B981" strokeWidth={2} />
            <Text className="text-green-400 text-lg ml-2" style={{ fontFamily: 'Poppins_700Bold' }}>Order Completed</Text>
          </View>
        )}
      </View>
    </View>
  );
}
