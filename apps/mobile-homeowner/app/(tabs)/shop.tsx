import { View, Text, ScrollView, TouchableOpacity, Image, Modal, TextInput, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { User, ShoppingCart, Star, Package, HardHat, Wrench, Shield, Plus, Minus, X, Check, MapPin, Search } from "lucide-react-native";
import { useState, useEffect } from "react";
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useMaterials, useContractors } from '@/hooks/useMarketplace';

type CartItem = { id: string; name: string; price?: number; hiringFee?: number; quantity: number; type: string; image: string; };

export default function ShopScreen() {
  const router = useRouter();
  const { data: currentUser } = useCurrentUser();
  const [activeSection, setActiveSection] = useState<'materials' | 'gc' | 'sub'>('materials');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showCart, setShowCart] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [checkoutSuccess, setCheckoutSuccess] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  
  const userPicture = currentUser?.pictureUrl;

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery), 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fetch data with search
  const { data: materialsData, isLoading: materialsLoading, error: materialsError } = useMaterials({ 
    query: debouncedSearch,
    limit: 20 
  });
  
  const { data: contractorsData, isLoading: contractorsLoading } = useContractors({ 
    query: debouncedSearch,
    category: activeSection === 'gc' ? 'general_contractor' : activeSection === 'sub' ? 'subcontractor' : undefined,
    limit: 20 
  });

  const materials = materialsData?.data || [];
  const contractors = contractorsData?.data || [];
  const generalContractors = contractors.filter((c: any) => c.type === 'general_contractor');
  const subContractors = contractors.filter((c: any) => c.type === 'subcontractor');

  const addToCart = (item: any) => {
    const existingItem = cart.find(c => c.id === item.id);
    if (existingItem) {
      if (item.type === 'material') setCart(cart.map(c => c.id === item.id ? { ...c, quantity: c.quantity + 1 } : c));
    } else {
      setCart([...cart, { 
        id: item.id, 
        name: item.name, 
        price: item.price, 
        hiringFee: item.hiringFee, 
        quantity: 1, 
        type: item.type || 'material', 
        image: item.imageUrl || item.image || 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&q=80'
      }]);
    }
  };

  const removeFromCart = (id: string) => setCart(cart.filter(c => c.id !== id));
  const updateQuantity = (id: string, delta: number) => setCart(cart.map(c => c.id === id && c.type === 'material' ? { ...c, quantity: Math.max(1, c.quantity + delta) } : c));
  const isInCart = (id: string) => cart.some(c => c.id === id);
  const getTotal = () => cart.reduce((sum, item) => sum + (item.type === 'material' ? (item.price || 0) * item.quantity : (item.hiringFee || 0)), 0);

  const handleCheckout = () => {
    if (termsAccepted && deliveryAddress) {
      setCheckoutSuccess(true);
      setTimeout(() => { setShowCheckout(false); setShowCart(false); setCart([]); setCheckoutSuccess(false); setTermsAccepted(false); setDeliveryAddress(""); }, 2000);
    }
  };

  return (
    <View className="flex-1 bg-white">
      <View className="pt-16 px-6 pb-4 flex-row items-center justify-between">
        <TouchableOpacity onPress={() => router.push('/profile')} className="w-12 h-12 bg-black rounded-full items-center justify-center overflow-hidden">
          {userPicture ? (
            <Image 
              source={{ uri: userPicture }} 
              className="w-full h-full"
              resizeMode="cover"
            />
          ) : (
            <User size={24} color="#FFFFFF" strokeWidth={2.5} />
          )}
        </TouchableOpacity>
        <Text className="text-2xl text-black" style={{ fontFamily: 'Poppins_600SemiBold' }}>Shop</Text>
        <TouchableOpacity onPress={() => setShowCart(true)} className="w-12 h-12 bg-gray-100 rounded-full items-center justify-center">
          <ShoppingCart size={24} color="#000000" strokeWidth={2.5} />
          {cart.length > 0 && <View className="absolute -top-1 -right-1 w-5 h-5 bg-black rounded-full items-center justify-center"><Text className="text-white text-xs" style={{ fontFamily: 'Poppins_600SemiBold' }}>{cart.length}</Text></View>}
        </TouchableOpacity>
      </View>

      <View className="flex-row px-6 mb-4">
        {[{ key: 'materials', icon: Package, label: 'Materials' }, { key: 'gc', icon: HardHat, label: 'GC' }, { key: 'sub', icon: Wrench, label: 'Sub' }].map((tab, i) => (
          <TouchableOpacity key={tab.key} onPress={() => setActiveSection(tab.key as any)} className={`flex-1 py-4 rounded-2xl items-center ${i < 2 ? 'mr-2' : ''} ${activeSection === tab.key ? 'bg-black' : 'bg-gray-100'}`}>
            <tab.icon size={20} color={activeSection === tab.key ? '#FFFFFF' : '#000000'} strokeWidth={2.5} />
            <Text className={`mt-1 text-xs ${activeSection === tab.key ? 'text-white' : 'text-black'}`} style={{ fontFamily: 'Poppins_500Medium' }}>{tab.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View className="mx-6 mb-4 bg-gray-50 rounded-2xl p-4 flex-row items-center border border-gray-200">
        <Shield size={24} color="#000000" strokeWidth={2.5} />
        <View className="ml-3 flex-1">
          <Text className="text-black text-sm" style={{ fontFamily: 'Poppins_600SemiBold' }}>All vendors are verified</Text>
          <Text className="text-gray-500 text-xs" style={{ fontFamily: 'Poppins_400Regular' }}>Quality assured by BuildMyHouse</Text>
        </View>
      </View>

      {/* Search Bar */}
      <View className="mx-6 mb-4">
        <View className="bg-gray-100 rounded-2xl px-4 py-3 flex-row items-center">
          <Search size={20} color="#737373" strokeWidth={2} />
          <TextInput
            className="flex-1 ml-3 text-black"
            style={{ fontFamily: 'Poppins_400Regular' }}
            placeholder={activeSection === 'materials' ? "Search materials..." : activeSection === 'gc' ? "Search contractors..." : "Search subcontractors..."}
            placeholderTextColor="#A3A3A3"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      <ScrollView className="flex-1 px-6" contentContainerStyle={{ paddingBottom: 100 }}>
        {activeSection === 'materials' && <View className="pb-8">
          <Text className="text-xl text-black mb-4" style={{ fontFamily: 'Poppins_600SemiBold' }}>Construction Materials</Text>
          
          {materialsLoading && (
            <View className="items-center py-12">
              <ActivityIndicator size="large" color="#000000" />
              <Text className="text-gray-500 mt-4" style={{ fontFamily: 'Poppins_400Regular' }}>Loading materials...</Text>
            </View>
          )}
          
          {materialsError && (
            <View className="items-center py-12">
              <Package size={48} color="#EF4444" strokeWidth={1.5} />
              <Text className="text-red-500 mt-4" style={{ fontFamily: 'Poppins_600SemiBold' }}>Error loading materials</Text>
              <Text className="text-gray-400 text-sm mt-2 px-4 text-center" style={{ fontFamily: 'Poppins_400Regular' }}>{(materialsError as Error).message}</Text>
              <Text className="text-gray-400 text-xs mt-2" style={{ fontFamily: 'Poppins_400Regular' }}>Make sure backend is running</Text>
            </View>
          )}
          
          {!materialsLoading && !materialsError && materials.length === 0 && (
            <View className="items-center py-12">
              <Package size={48} color="#9CA3AF" strokeWidth={1.5} />
              <Text className="text-gray-500 mt-4" style={{ fontFamily: 'Poppins_600SemiBold' }}>No materials found</Text>
              <Text className="text-gray-400 text-sm mt-2" style={{ fontFamily: 'Poppins_400Regular' }}>Try adjusting your search</Text>
            </View>
          )}
          
          {!materialsLoading && materials.map((item: any) => (
            <TouchableOpacity
              key={item.id}
              onPress={() => router.push(`/material-detail?id=${item.id}`)}
              className="bg-white rounded-3xl mb-4 overflow-hidden border border-gray-200 flex-row"
            >
              <Image source={{ uri: item.imageUrl || 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&q=80' }} className="w-28 h-28 bg-gray-100" resizeMode="cover" />
              <View className="flex-1 p-4 justify-center">
                <View className="flex-row items-center mb-1"><Text className="text-base text-black" style={{ fontFamily: 'Poppins_600SemiBold' }}>{item.name}</Text>{item.verified && <View className="ml-2 bg-black rounded-full px-2 py-0.5"><Text className="text-white text-xs" style={{ fontFamily: 'Poppins_600SemiBold' }}>✓</Text></View>}</View>
                <Text className="text-gray-500 text-sm mb-2" style={{ fontFamily: 'Poppins_400Regular' }}>{item.brand}</Text>
                <View className="flex-row items-center mb-2"><Star size={14} color="#000000" strokeWidth={2} fill="#000000" /><Text className="text-black ml-1 text-sm" style={{ fontFamily: 'Poppins_600SemiBold' }}>{item.rating}</Text><Text className="text-gray-500 ml-1 text-xs" style={{ fontFamily: 'Poppins_400Regular' }}>({item.reviews})</Text></View>
                <View className="flex-row items-center justify-between">
                  <Text className="text-black text-lg" style={{ fontFamily: 'JetBrainsMono_500Medium' }}>₦{item.price.toLocaleString()}</Text>
                  <TouchableOpacity onPress={(e) => { e.stopPropagation(); isInCart(item.id) ? removeFromCart(item.id) : addToCart(item); }} className={`px-3 py-2 rounded-xl ${isInCart(item.id) ? 'bg-gray-200' : 'bg-black'}`}><Text className={`text-xs ${isInCart(item.id) ? 'text-black' : 'text-white'}`} style={{ fontFamily: 'Poppins_600SemiBold' }}>{isInCart(item.id) ? 'Remove' : 'Add'}</Text></TouchableOpacity>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>}

        {activeSection === 'gc' && <View className="pb-8">
          <Text className="text-xl text-black mb-4" style={{ fontFamily: 'Poppins_600SemiBold' }}>General Contractors</Text>
          {generalContractors.map((gc: any) => (
            <View key={gc.id} className="bg-white rounded-3xl mb-4 overflow-hidden border border-gray-200">
              <View className="flex-row p-4">
                <Image source={{ uri: gc.imageUrl || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80' }} className="w-20 h-20 rounded-2xl bg-gray-100" resizeMode="cover" />
                <View className="flex-1 ml-4 justify-center">
                  <View className="flex-row items-center mb-1"><Text className="text-lg text-black" style={{ fontFamily: 'Poppins_600SemiBold' }}>{gc.name}</Text>{gc.verified && <View className="ml-2 bg-black rounded-full px-2 py-0.5"><Text className="text-white text-xs" style={{ fontFamily: 'Poppins_600SemiBold' }}>✓</Text></View>}</View>
                  <Text className="text-gray-500 text-sm mb-2" style={{ fontFamily: 'Poppins_400Regular' }}>{gc.specialty}</Text>
                  <View className="flex-row items-center"><Star size={14} color="#000000" strokeWidth={2} fill="#000000" /><Text className="text-black ml-1 text-sm" style={{ fontFamily: 'Poppins_600SemiBold' }}>{gc.rating}</Text><Text className="text-gray-500 ml-1 text-xs" style={{ fontFamily: 'Poppins_400Regular' }}>({gc.reviews}) • {gc.projects} projects</Text></View>
                </View>
              </View>
              <View className="px-4 pb-4 flex-row items-center justify-between border-t border-gray-100 pt-3">
                <View><Text className="text-gray-500 text-xs" style={{ fontFamily: 'Poppins_400Regular' }}>Hiring Fee</Text><Text className="text-black text-lg" style={{ fontFamily: 'JetBrainsMono_500Medium' }}>${gc.hiringFee.toLocaleString()}</Text></View>
                <TouchableOpacity onPress={() => isInCart(gc.id) ? removeFromCart(gc.id) : addToCart(gc)} className={`px-4 py-2 rounded-xl ${isInCart(gc.id) ? 'bg-gray-200' : 'bg-black'}`}><Text className={`text-sm ${isInCart(gc.id) ? 'text-black' : 'text-white'}`} style={{ fontFamily: 'Poppins_600SemiBold' }}>{isInCart(gc.id) ? 'Remove' : 'Hire'}</Text></TouchableOpacity>
              </View>
            </View>
          ))}
        </View>}

        {activeSection === 'sub' && <View className="pb-8">
          <Text className="text-xl text-black mb-4" style={{ fontFamily: 'Poppins_700Bold' }}>Sub-Contractors</Text>
          {subContractors.map((sub: any) => (
            <View key={sub.id} className="bg-white rounded-3xl mb-4 overflow-hidden border border-gray-200">
              <View className="flex-row p-4">
                <Image source={{ uri: sub.imageUrl || 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&q=80' }} className="w-20 h-20 rounded-2xl bg-gray-100" resizeMode="cover" />
                <View className="flex-1 ml-4 justify-center">
                  <View className="flex-row items-center mb-1"><Text className="text-lg text-black" style={{ fontFamily: 'Poppins_600SemiBold' }}>{sub.name}</Text>{sub.verified && <View className="ml-2 bg-black rounded-full px-2 py-0.5"><Text className="text-white text-xs" style={{ fontFamily: 'Poppins_600SemiBold' }}>✓</Text></View>}</View>
                  <Text className="text-gray-500 text-sm mb-2" style={{ fontFamily: 'Poppins_400Regular' }}>{sub.specialty}</Text>
                  <View className="flex-row items-center"><Star size={14} color="#000000" strokeWidth={2} fill="#000000" /><Text className="text-black ml-1 text-sm" style={{ fontFamily: 'Poppins_600SemiBold' }}>{sub.rating}</Text><Text className="text-gray-500 ml-1 text-xs" style={{ fontFamily: 'Poppins_400Regular' }}>({sub.reviews})</Text></View>
                </View>
              </View>
              <View className="px-4 pb-4 flex-row items-center justify-between border-t border-gray-100 pt-3">
                <View><Text className="text-gray-500 text-xs" style={{ fontFamily: 'Poppins_400Regular' }}>Hiring Fee</Text><Text className="text-black text-lg" style={{ fontFamily: 'JetBrainsMono_500Medium' }}>${sub.hiringFee.toLocaleString()}</Text></View>
                <TouchableOpacity onPress={() => isInCart(sub.id) ? removeFromCart(sub.id) : addToCart(sub)} className={`px-4 py-2 rounded-xl ${isInCart(sub.id) ? 'bg-gray-200' : 'bg-black'}`}><Text className={`text-sm ${isInCart(sub.id) ? 'text-black' : 'text-white'}`} style={{ fontFamily: 'Poppins_600SemiBold' }}>{isInCart(sub.id) ? 'Remove' : 'Hire'}</Text></TouchableOpacity>
              </View>
            </View>
          ))}
        </View>}
      </ScrollView>

      <Modal visible={showCart} animationType="slide" transparent={true} onRequestClose={() => setShowCart(false)}>
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-white rounded-t-3xl p-6 max-h-[85%]">
            <View className="w-12 h-1 bg-gray-300 rounded-full self-center mb-6" />
            <View className="flex-row justify-between items-center mb-4"><Text className="text-2xl text-black" style={{ fontFamily: 'Poppins_800ExtraBold' }}>Your Cart</Text><TouchableOpacity onPress={() => setShowCart(false)}><X size={24} color="#000000" strokeWidth={2} /></TouchableOpacity></View>
            {cart.length === 0 ? <View className="items-center py-12"><ShoppingCart size={48} color="#A3A3A3" strokeWidth={1.5} /><Text className="text-gray-500 mt-4" style={{ fontFamily: 'Poppins_400Regular' }}>Your cart is empty</Text></View> : (
              <ScrollView showsVerticalScrollIndicator={false}>
                {cart.map((item) => (
                  <View key={item.id} className="flex-row items-center py-4 border-b border-gray-100">
                    <Image source={{ uri: item.image }} className="w-16 h-16 rounded-xl" resizeMode="cover" />
                    <View className="flex-1 ml-4">
                      <Text className="text-black" style={{ fontFamily: 'Poppins_600SemiBold' }}>{item.name}</Text>
                      <Text className="text-gray-500 text-sm" style={{ fontFamily: 'Poppins_400Regular' }}>{item.type === 'material' ? `₦${item.price?.toLocaleString()}` : `Hiring Fee: $${item.hiringFee?.toLocaleString()}`}</Text>
                      {item.type !== 'material' && <Text className="text-gray-400 text-xs mt-1" style={{ fontFamily: 'Poppins_400Regular' }}>Service fee charged separately</Text>}
                    </View>
                    {item.type === 'material' ? (
                      <View className="flex-row items-center">
                        <TouchableOpacity onPress={() => updateQuantity(item.id, -1)} className="w-8 h-8 bg-gray-100 rounded-lg items-center justify-center"><Minus size={16} color="#000000" strokeWidth={2} /></TouchableOpacity>
                        <Text className="mx-3 text-black" style={{ fontFamily: 'JetBrainsMono_500Medium' }}>{item.quantity}</Text>
                        <TouchableOpacity onPress={() => updateQuantity(item.id, 1)} className="w-8 h-8 bg-gray-100 rounded-lg items-center justify-center"><Plus size={16} color="#000000" strokeWidth={2} /></TouchableOpacity>
                      </View>
                    ) : <TouchableOpacity onPress={() => removeFromCart(item.id)}><X size={20} color="#A3A3A3" strokeWidth={2} /></TouchableOpacity>}
                  </View>
                ))}
                <View className="bg-black rounded-2xl p-4 mt-4 mb-4"><View className="flex-row justify-between"><Text className="text-white/70" style={{ fontFamily: 'Poppins_400Regular' }}>Total</Text><Text className="text-white text-xl" style={{ fontFamily: 'JetBrainsMono_500Medium' }}>${getTotal().toLocaleString()}</Text></View></View>
                <TouchableOpacity onPress={() => { setShowCart(false); setShowCheckout(true); }} className="bg-black rounded-full py-5 px-8"><Text className="text-white text-lg text-center" style={{ fontFamily: 'Poppins_700Bold' }}>Checkout</Text></TouchableOpacity>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      <Modal visible={showCheckout} animationType="slide" transparent={true} onRequestClose={() => setShowCheckout(false)}>
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-white rounded-t-3xl p-6 max-h-[90%]">
            <View className="w-12 h-1 bg-gray-300 rounded-full self-center mb-6" />
            {!checkoutSuccess ? (
              <ScrollView showsVerticalScrollIndicator={false}>
                <View className="flex-row justify-between items-center mb-6"><Text className="text-2xl text-black" style={{ fontFamily: 'Poppins_800ExtraBold' }}>Checkout</Text><TouchableOpacity onPress={() => setShowCheckout(false)}><X size={24} color="#000000" strokeWidth={2} /></TouchableOpacity></View>
                <View className="mb-4"><Text className="text-black mb-2" style={{ fontFamily: 'Poppins_600SemiBold' }}>Delivery Address</Text><View className="bg-gray-50 rounded-2xl p-4 flex-row items-center border border-gray-200"><MapPin size={20} color="#737373" strokeWidth={2} /><TextInput className="flex-1 ml-3 text-black" style={{ fontFamily: 'Poppins_400Regular' }} placeholder="Enter delivery address" placeholderTextColor="#A3A3A3" value={deliveryAddress} onChangeText={setDeliveryAddress} /></View></View>
                <View className="bg-gray-50 rounded-2xl p-4 mb-4 border border-gray-200">
                  <Text className="text-black mb-3" style={{ fontFamily: 'Poppins_600SemiBold' }}>Order Summary</Text>
                  {cart.map((item) => <View key={item.id} className="flex-row justify-between mb-2"><Text className="text-gray-600 flex-1" style={{ fontFamily: 'Poppins_400Regular' }}>{item.name} {item.type === 'material' ? `x${item.quantity}` : '(Hiring)'}</Text><Text className="text-black" style={{ fontFamily: 'JetBrainsMono_500Medium' }}>${item.type === 'material' ? ((item.price || 0) * item.quantity).toLocaleString() : item.hiringFee?.toLocaleString()}</Text></View>)}
                  <View className="border-t border-gray-200 mt-3 pt-3 flex-row justify-between"><Text className="text-black" style={{ fontFamily: 'Poppins_600SemiBold' }}>Total</Text><Text className="text-black text-lg" style={{ fontFamily: 'JetBrainsMono_500Medium' }}>${getTotal().toLocaleString()}</Text></View>
                </View>
                {cart.some(item => item.type !== 'material') && <View className="bg-gray-50 rounded-2xl p-4 mb-4 border border-gray-200"><Text className="text-black mb-2" style={{ fontFamily: 'Poppins_600SemiBold' }}>Service Notice</Text><Text className="text-gray-600 text-sm" style={{ fontFamily: 'Poppins_400Regular' }}>The hiring fee is a one-time fee to engage the contractor. Service fees for actual work performed will be charged separately based on the scope of work at your delivery location.</Text></View>}
                <TouchableOpacity onPress={() => setTermsAccepted(!termsAccepted)} className="flex-row items-center mb-6">
                  <View className={`w-6 h-6 rounded-lg border-2 items-center justify-center ${termsAccepted ? 'bg-black border-black' : 'border-gray-300'}`}>{termsAccepted && <Check size={16} color="#FFFFFF" strokeWidth={2.5} />}</View>
                  <Text className="text-gray-600 ml-3 flex-1" style={{ fontFamily: 'Poppins_400Regular' }}>I agree to the Terms of Service and understand the billing terms</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleCheckout} disabled={!termsAccepted || !deliveryAddress} className={`rounded-full py-5 px-8 ${termsAccepted && deliveryAddress ? 'bg-black' : 'bg-gray-200'}`}><Text className={`text-lg text-center ${termsAccepted && deliveryAddress ? 'text-white' : 'text-gray-400'}`} style={{ fontFamily: 'Poppins_700Bold' }}>Pay ${getTotal().toLocaleString()}</Text></TouchableOpacity>
              </ScrollView>
            ) : (
              <View className="items-center py-12"><View className="w-20 h-20 bg-black rounded-full items-center justify-center mb-6"><Check size={40} color="#FFFFFF" strokeWidth={2.5} /></View><Text className="text-2xl text-black mb-2 text-center" style={{ fontFamily: 'Poppins_800ExtraBold' }}>Order Placed!</Text><Text className="text-gray-500 text-center" style={{ fontFamily: 'Poppins_400Regular' }}>Your order has been successfully placed</Text></View>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}
