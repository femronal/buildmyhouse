import { View, Text, ScrollView, TouchableOpacity, Image } from "react-native";
import { useRouter } from "expo-router";
import { 
  Bell, 
  Settings, 
  Package, 
  Clock, 
  CheckCircle, 
  DollarSign, 
  ChevronRight, 
  Plus,
  TrendingUp,
  ShoppingCart,
  Truck,
  BarChart3,
  Box
} from "lucide-react-native";
import { useState } from "react";

const products = [
  {
    id: 1,
    name: "Portland Cement (Grade 42.5)",
    category: "Cement",
    price: 12.50,
    unit: "bag",
    stock: 500,
    image: "https://images.unsplash.com/photo-1518709766631-a6a7f45921c3?w=200&q=80",
  },
  {
    id: 2,
    name: "Steel Reinforcement Bars (12mm)",
    category: "Steel",
    price: 8.75,
    unit: "piece",
    stock: 1200,
    image: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=200&q=80",
  },
  {
    id: 3,
    name: "Granite Aggregate (20mm)",
    category: "Aggregates",
    price: 45.00,
    unit: "ton",
    stock: 85,
    image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=200&q=80",
  },
  {
    id: 4,
    name: "Sharp Sand",
    category: "Sand",
    price: 35.00,
    unit: "ton",
    stock: 120,
    image: "https://images.unsplash.com/photo-1589939705384-5185137a7f0f?w=200&q=80",
  },
];

const orders = [
  {
    id: 1,
    gcName: "Chukwuemeka Okonkwo",
    projectName: "Modern Minimalist Villa",
    items: 3,
    total: 8500,
    status: "pending",
    date: "Dec 10, 2024",
  },
  {
    id: 2,
    gcName: "Adaeze Builders Ltd",
    projectName: "Classic Colonial Estate",
    items: 5,
    total: 15200,
    status: "processing",
    date: "Dec 8, 2024",
  },
  {
    id: 3,
    gcName: "Lagos Construction Co.",
    projectName: "Garden Villa",
    items: 2,
    total: 4800,
    status: "delivered",
    date: "Dec 5, 2024",
  },
];

const stats = {
  totalRevenue: 125000,
  ordersThisMonth: 24,
  productsListed: 45,
  avgRating: 4.9,
};

export default function VendorDashboardScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'products' | 'orders'>('orders');

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'delivered': return { bg: 'bg-green-600/20', text: 'text-green-400' };
      case 'processing': return { bg: 'bg-blue-600/20', text: 'text-blue-400' };
      default: return { bg: 'bg-yellow-600/20', text: 'text-yellow-400' };
    }
  };

  return (
    <View className="flex-1 bg-[#0A1628]">
      {/* Header */}
      <View className="pt-16 px-6 pb-4 flex-row items-center justify-between">
        <View className="flex-row items-center">
          <View className="w-12 h-12 bg-green-600 rounded-full items-center justify-center">
            <Package size={24} color="#FFFFFF" strokeWidth={2} />
          </View>
          <View className="ml-3">
            <Text className="text-gray-400 text-sm" style={{ fontFamily: 'Poppins_400Regular' }}>Welcome back,</Text>
            <Text className="text-white text-lg" style={{ fontFamily: 'Poppins_700Bold' }}>BuildMart Supplies</Text>
          </View>
        </View>
        <View className="flex-row">
          <TouchableOpacity className="w-10 h-10 bg-[#1E3A5F] rounded-full items-center justify-center mr-2">
            <Bell size={20} color="#3B82F6" strokeWidth={2} />
            <View className="absolute top-1 right-1 w-3 h-3 bg-red-500 rounded-full" />
          </TouchableOpacity>
          <TouchableOpacity className="w-10 h-10 bg-[#1E3A5F] rounded-full items-center justify-center">
            <Settings size={20} color="#3B82F6" strokeWidth={2} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Stats Cards */}
        <View className="px-6 mb-6">
          <View className="flex-row">
            <View className="flex-1 bg-green-600 rounded-2xl p-4 mr-2">
              <View className="flex-row items-center mb-2">
                <DollarSign size={18} color="#FFFFFF" strokeWidth={2} />
                <Text className="text-white/70 text-xs ml-2" style={{ fontFamily: 'Poppins_400Regular' }}>Revenue</Text>
              </View>
              <Text className="text-white text-xl" style={{ fontFamily: 'JetBrainsMono_500Medium' }}>${stats.totalRevenue.toLocaleString()}</Text>
              <View className="flex-row items-center mt-1">
                <TrendingUp size={12} color="#FFFFFF" strokeWidth={2} />
                <Text className="text-white/70 text-xs ml-1" style={{ fontFamily: 'Poppins_400Regular' }}>+18% this month</Text>
              </View>
            </View>
            <View className="flex-1 bg-[#1E3A5F] rounded-2xl p-4 ml-2 border border-blue-900">
              <View className="flex-row items-center mb-2">
                <ShoppingCart size={18} color="#F59E0B" strokeWidth={2} />
                <Text className="text-gray-400 text-xs ml-2" style={{ fontFamily: 'Poppins_400Regular' }}>Orders</Text>
              </View>
              <Text className="text-white text-xl" style={{ fontFamily: 'Poppins_800ExtraBold' }}>{stats.ordersThisMonth}</Text>
              <Text className="text-gray-500 text-xs mt-1" style={{ fontFamily: 'Poppins_400Regular' }}>This month</Text>
            </View>
          </View>

          <View className="flex-row mt-4">
            <View className="flex-1 bg-[#1E3A5F] rounded-2xl p-4 mr-2 border border-blue-900">
              <View className="flex-row items-center mb-2">
                <Box size={18} color="#3B82F6" strokeWidth={2} />
                <Text className="text-gray-400 text-xs ml-2" style={{ fontFamily: 'Poppins_400Regular' }}>Products</Text>
              </View>
              <Text className="text-white text-xl" style={{ fontFamily: 'Poppins_800ExtraBold' }}>{stats.productsListed}</Text>
            </View>
            <View className="flex-1 bg-[#1E3A5F] rounded-2xl p-4 ml-2 border border-blue-900">
              <View className="flex-row items-center mb-2">
                <BarChart3 size={18} color="#A855F7" strokeWidth={2} />
                <Text className="text-gray-400 text-xs ml-2" style={{ fontFamily: 'Poppins_400Regular' }}>Rating</Text>
              </View>
              <Text className="text-white text-xl" style={{ fontFamily: 'Poppins_800ExtraBold' }}>{stats.avgRating}</Text>
            </View>
          </View>
        </View>

        {/* Tabs */}
        <View className="px-6 mb-4">
          <View className="flex-row bg-[#1E3A5F] rounded-xl p-1">
            <TouchableOpacity 
              onPress={() => setActiveTab('orders')}
              className={`flex-1 py-3 rounded-lg ${activeTab === 'orders' ? 'bg-green-600' : ''}`}
            >
              <Text className={`text-center text-sm ${activeTab === 'orders' ? 'text-white' : 'text-gray-400'}`} style={{ fontFamily: 'Poppins_600SemiBold' }}>
                Orders
              </Text>
            </TouchableOpacity>
            <TouchableOpacity 
              onPress={() => setActiveTab('products')}
              className={`flex-1 py-3 rounded-lg ${activeTab === 'products' ? 'bg-green-600' : ''}`}
            >
              <Text className={`text-center text-sm ${activeTab === 'products' ? 'text-white' : 'text-gray-400'}`} style={{ fontFamily: 'Poppins_600SemiBold' }}>
                Products
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Tab Content */}
        <View className="px-6 pb-8">
          {activeTab === 'orders' ? (
            <View>
              {orders.map((order) => {
                const colors = getStatusColor(order.status);
                return (
                  <TouchableOpacity
                    key={order.id}
                    onPress={() => router.push(`/contractor/vendor-order-detail?id=${order.id}`)}
                    className="bg-[#1E3A5F] rounded-2xl p-4 mb-3 border border-blue-900"
                  >
                    <View className="flex-row justify-between items-start mb-3">
                      <View className="flex-1">
                        <Text className="text-white text-lg" style={{ fontFamily: 'Poppins_700Bold' }}>{order.gcName}</Text>
                        <Text className="text-gray-400 text-base" style={{ fontFamily: 'Poppins_500Medium' }}>{order.projectName}</Text>
                      </View>
                      <View className={`${colors.bg} rounded-full px-3 py-1`}>
                        <Text className={`${colors.text} text-xs capitalize`} style={{ fontFamily: 'Poppins_600SemiBold' }}>{order.status}</Text>
                      </View>
                    </View>
                    <View className="flex-row justify-between items-center">
                      <View className="flex-row items-center">
                        <Package size={14} color="#6B7280" strokeWidth={2} />
                        <Text className="text-gray-400 text-sm ml-2" style={{ fontFamily: 'Poppins_400Regular' }}>{order.items} items</Text>
                        <Text className="text-gray-600 mx-2">•</Text>
                        <Text className="text-gray-400 text-sm" style={{ fontFamily: 'Poppins_400Regular' }}>{order.date}</Text>
                      </View>
                      <Text className="text-white" style={{ fontFamily: 'JetBrainsMono_500Medium' }}>${order.total.toLocaleString()}</Text>
                    </View>
                    {order.status === 'pending' && (
                      <View className="flex-row mt-3">
                        <TouchableOpacity 
                          onPress={() => {
                            // Handle decline order
                            console.log('Decline order:', order.id);
                          }}
                          className="flex-1 bg-red-600/20 rounded-lg py-3 mr-2"
                        >
                          <Text className="text-red-400 text-center text-base" style={{ fontFamily: 'Poppins_700Bold' }}>Decline</Text>
                        </TouchableOpacity>
                        <TouchableOpacity 
                          onPress={() => {
                            // Handle accept order
                            console.log('Accept order:', order.id);
                            router.push(`/contractor/vendor-order-detail?id=${order.id}`);
                          }}
                          className="flex-1 bg-green-600 rounded-lg py-3 ml-2"
                        >
                          <Text className="text-white text-center text-base" style={{ fontFamily: 'Poppins_700Bold' }}>Accept</Text>
                        </TouchableOpacity>
                      </View>
                    )}
                    {order.status === 'processing' && (
                      <TouchableOpacity className="bg-blue-600 rounded-lg py-2 mt-3 flex-row items-center justify-center">
                        <Truck size={16} color="#FFFFFF" strokeWidth={2} />
                        <Text className="text-white text-center text-sm ml-2" style={{ fontFamily: 'Poppins_600SemiBold' }}>Mark as Shipped</Text>
                      </TouchableOpacity>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          ) : (
            <View>
              <TouchableOpacity 
                onPress={() => router.push('/contractor/vendor-add-product')}
                className="bg-green-600/20 border border-dashed border-green-600 rounded-xl p-4 mb-4 flex-row items-center justify-center"
              >
                <Plus size={20} color="#10B981" strokeWidth={2} />
                <Text className="text-green-400 ml-2" style={{ fontFamily: 'Poppins_600SemiBold' }}>Add New Product</Text>
              </TouchableOpacity>
              
              {products.map((product) => (
                <TouchableOpacity
                  key={product.id}
                  onPress={() => router.push(`/contractor/vendor-edit-product?id=${product.id}`)}
                  className="bg-[#1E3A5F] rounded-2xl p-4 mb-3 flex-row border border-blue-900"
                >
                  <Image source={{ uri: product.image }} className="w-16 h-16 rounded-xl" resizeMode="cover" />
                  <View className="flex-1 ml-3">
                    <Text className="text-white text-lg" style={{ fontFamily: 'Poppins_700Bold' }}>{product.name}</Text>
                    <Text className="text-gray-400 text-base" style={{ fontFamily: 'Poppins_500Medium' }}>{product.category}</Text>
                    <View className="flex-row items-center mt-2">
                      <Text className="text-green-400" style={{ fontFamily: 'JetBrainsMono_500Medium' }}>${product.price.toFixed(2)}</Text>
                      <Text className="text-gray-500 text-xs ml-1" style={{ fontFamily: 'Poppins_400Regular' }}>/{product.unit}</Text>
                      <View className="flex-1" />
                      <View className={`rounded-full px-2 py-1 ${product.stock > 100 ? 'bg-green-600/20' : product.stock > 20 ? 'bg-yellow-600/20' : 'bg-red-600/20'}`}>
                        <Text className={`text-xs ${product.stock > 100 ? 'text-green-400' : product.stock > 20 ? 'text-yellow-400' : 'text-red-400'}`} style={{ fontFamily: 'Poppins_500Medium' }}>
                          {product.stock} in stock
                        </Text>
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Bottom Navigation - Bigger, Clearer */}
      <View className="flex-row bg-[#0A1628] border-t border-blue-900 px-4 py-4">
        <TouchableOpacity 
          onPress={() => router.push('/contractor/vendor-dashboard')}
          className="flex-1 items-center active:opacity-70"
        >
          <View className="p-3 rounded-2xl bg-green-600/20 mb-1">
            <BarChart3 size={30} color="#10B981" strokeWidth={3} />
          </View>
          <Text className="text-green-400 text-base mt-1" style={{ fontFamily: 'Poppins_700Bold' }}>Dashboard</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          onPress={() => {
            setActiveTab('orders');
            router.push('/contractor/vendor-dashboard?tab=orders');
          }}
          className="flex-1 items-center active:opacity-70"
        >
          <View className="p-3 rounded-2xl bg-[#1E3A5F] mb-1">
            <ShoppingCart size={30} color="#6B7280" strokeWidth={2.5} />
          </View>
          <Text className="text-gray-500 text-base mt-1" style={{ fontFamily: 'Poppins_600SemiBold' }}>Orders</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          onPress={() => {
            setActiveTab('products');
            router.push('/contractor/vendor-dashboard?tab=products');
          }}
          className="flex-1 items-center active:opacity-70"
        >
          <View className="p-3 rounded-2xl bg-[#1E3A5F] mb-1">
            <Package size={30} color="#6B7280" strokeWidth={2.5} />
          </View>
          <Text className="text-gray-500 text-base mt-1" style={{ fontFamily: 'Poppins_600SemiBold' }}>Products</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          onPress={() => router.push('/contractor/vendor-deliveries')}
          className="flex-1 items-center active:opacity-70"
        >
          <View className="p-3 rounded-2xl bg-[#1E3A5F] mb-1">
            <Truck size={30} color="#6B7280" strokeWidth={2.5} />
          </View>
          <Text className="text-gray-500 text-base mt-1" style={{ fontFamily: 'Poppins_600SemiBold' }}>Deliveries</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
