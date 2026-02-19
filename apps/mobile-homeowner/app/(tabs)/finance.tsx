import { View, Text, ScrollView, TouchableOpacity, Image, Animated } from "react-native";
import { useRouter } from "expo-router";
import { User, Filter, CreditCard, Receipt, FileText, Home, DollarSign, ChevronDown, Landmark, ChevronRight } from "lucide-react-native";
import { useState, useRef } from "react";
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useActiveProjects, usePendingProjects, useUserPaymentsStructured } from '@/hooks';
import { useHomePurchases, useLandPurchases } from '@/hooks/usePropertyPurchases';
import { getBackendAssetUrl } from '@/lib/image';

type TabKey = 'overview' | 'payments' | 'invoices' | 'landPurchases' | 'homePurchases';

function formatDate(dateStr: string) {
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  } catch {
    return dateStr;
  }
}

export default function FinanceScreen() {
  const router = useRouter();
  const { data: currentUser } = useCurrentUser();
  const { data: activeProjects = [] } = useActiveProjects();
  const { data: pendingProjects = [] } = usePendingProjects();
  const { data: structuredPayments = [] } = useUserPaymentsStructured();
  const { data: homePurchases = [] } = useHomePurchases();
  const { data: landPurchases = [] } = useLandPurchases();

  const [activeTab, setActiveTab] = useState<TabKey>('overview');
  const [showFilters, setShowFilters] = useState(false);
  const [expandedProjectId, setExpandedProjectId] = useState<string | null>(null);
  const filterAnim = useRef(new Animated.Value(0)).current;

  // Only show projects with activation payment or sub-payments
  const paymentsWithData = structuredPayments.filter(
    (g) => g.activationPayment || (g.subPayments && g.subPayments.length > 0)
  );

  const userPicture = currentUser?.pictureUrl;

  // Combine active + pending for overview
  const allProjects = [...activeProjects, ...pendingProjects].filter(
    (p, i, arr) => arr.findIndex((x) => x.id === p.id) === i
  );

  const totalInvested = allProjects.reduce((sum, p) => sum + (p.spent ?? 0), 0);
  const totalBudget = allProjects.reduce((sum, p) => sum + (p.budget ?? 0), 0);
  const activeCount = allProjects.length;

  const toggleFilters = () => {
    const toValue = showFilters ? 0 : 1;
    Animated.timing(filterAnim, { toValue, duration: 300, useNativeDriver: false }).start();
    setShowFilters(!showFilters);
  };

  const filterHeight = filterAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 70] });
  const filterOpacity = filterAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 1] });

  const tabLabel = activeTab === 'landPurchases' ? 'Land Purchases' : activeTab.charAt(0).toUpperCase() + activeTab.slice(1);

  return (
    <View className="flex-1 bg-white">
      <View className="pt-16 px-6 pb-4 flex-row items-center justify-between">
        <TouchableOpacity onPress={() => router.push('/profile')} className="w-12 h-12 bg-black rounded-full items-center justify-center overflow-hidden">
          {userPicture ? (
            <Image
              source={{ uri: getBackendAssetUrl(userPicture) }}
              className="w-full h-full"
              resizeMode="cover"
            />
          ) : (
            <User size={24} color="#FFFFFF" strokeWidth={2.5} />
          )}
        </TouchableOpacity>
        <Text className="text-2xl text-black" style={{ fontFamily: 'Poppins_600SemiBold' }}>Finance</Text>
        <TouchableOpacity onPress={toggleFilters} className={`w-12 h-12 rounded-full items-center justify-center ${showFilters ? 'bg-gray-200' : 'bg-gray-100'}`}>
          <Filter size={24} color="#000000" strokeWidth={2.5} />
        </TouchableOpacity>
      </View>

      {/* Animated Filter Tabs */}
      <Animated.View style={{ height: filterHeight, opacity: filterOpacity, overflow: 'hidden' }}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="px-6 pb-4">
          {[
            { key: 'overview' as TabKey, label: 'Overview', icon: Home },
            { key: 'payments' as TabKey, label: 'Payments', icon: CreditCard },
            { key: 'invoices' as TabKey, label: 'Invoices', icon: Receipt },
            { key: 'landPurchases' as TabKey, label: 'Land Purchases', icon: Landmark },
            { key: 'homePurchases' as TabKey, label: 'Home Purchases', icon: Home },
          ].map((tab) => (
            <TouchableOpacity key={tab.key} onPress={() => setActiveTab(tab.key)} className={`px-4 py-2 rounded-full mr-3 flex-row items-center ${activeTab === tab.key ? 'bg-black' : 'bg-gray-100'}`}>
              <tab.icon size={16} color={activeTab === tab.key ? '#FFFFFF' : '#000000'} strokeWidth={2} />
              <Text className={`ml-2 text-sm ${activeTab === tab.key ? 'text-white' : 'text-black'}`} style={{ fontFamily: 'Poppins_500Medium' }}>{tab.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </Animated.View>

      {/* Current Tab Indicator */}
      <View className="px-6 mb-4">
        <TouchableOpacity onPress={toggleFilters} className="flex-row items-center">
          <Text className="text-xl text-black" style={{ fontFamily: 'Poppins_600SemiBold' }}>{tabLabel}</Text>
          <ChevronDown size={20} color="#000000" strokeWidth={2} style={{ marginLeft: 4 }} />
        </TouchableOpacity>
      </View>

      <ScrollView className="flex-1 px-6" contentContainerStyle={{ paddingBottom: 100 }}>
        {activeTab === 'overview' && (
          <View className="pb-8">
            <View className="bg-black rounded-3xl p-6 mb-6">
              <Text className="text-white/70 mb-2" style={{ fontFamily: 'Poppins_400Regular' }}>Total Invested</Text>
              <Text className="text-white text-4xl mb-4" style={{ fontFamily: 'JetBrainsMono_500Medium' }}>${totalInvested.toLocaleString()}</Text>
              <View className="flex-row justify-between">
                <View><Text className="text-white/70 text-xs mb-1" style={{ fontFamily: 'Poppins_400Regular' }}>Active Projects</Text><Text className="text-white text-xl" style={{ fontFamily: 'Poppins_600SemiBold' }}>{activeCount}</Text></View>
                <View><Text className="text-white/70 text-xs mb-1" style={{ fontFamily: 'Poppins_400Regular' }}>Total Budget</Text><Text className="text-white text-xl" style={{ fontFamily: 'JetBrainsMono_500Medium' }}>${totalBudget.toLocaleString()}</Text></View>
              </View>
            </View>
            <Text className="text-xl text-black mb-4" style={{ fontFamily: 'Poppins_600SemiBold' }}>Project Budgets</Text>
            {allProjects.length === 0 ? (
              <View className="bg-gray-50 rounded-3xl p-8 border border-gray-200 items-center">
                <Text className="text-gray-500 text-center" style={{ fontFamily: 'Poppins_400Regular' }}>No projects yet. Start a project to see your budget breakdown here.</Text>
              </View>
            ) : (
              allProjects.map((p) => {
                const budget = p.budget ?? 0;
                const spent = p.spent ?? 0;
                const remaining = budget - spent;
                const percent = budget > 0 ? Math.round((spent / budget) * 100) : 0;
                return (
                  <View key={p.id} className="bg-gray-50 rounded-3xl p-5 mb-4 border border-gray-200">
                    <Text className="text-lg text-black mb-3" style={{ fontFamily: 'Poppins_700Bold' }}>{p.name}</Text>
                    <View className="flex-row justify-between mb-3">
                      <View><Text className="text-gray-500 text-xs mb-1" style={{ fontFamily: 'Poppins_400Regular' }}>Budget</Text><Text className="text-black" style={{ fontFamily: 'JetBrainsMono_500Medium' }}>${budget.toLocaleString()}</Text></View>
                      <View><Text className="text-gray-500 text-xs mb-1" style={{ fontFamily: 'Poppins_400Regular' }}>Spent</Text><Text className="text-black" style={{ fontFamily: 'JetBrainsMono_500Medium' }}>${spent.toLocaleString()}</Text></View>
                      <View><Text className="text-gray-500 text-xs mb-1" style={{ fontFamily: 'Poppins_400Regular' }}>Remaining</Text><Text className="text-black" style={{ fontFamily: 'JetBrainsMono_500Medium' }}>${remaining.toLocaleString()}</Text></View>
                    </View>
                    <View className="h-3 bg-gray-200 rounded-full overflow-hidden"><View className="h-full bg-black rounded-full" style={{ width: `${Math.min(percent, 100)}%` }} /></View>
                    <Text className="text-gray-500 text-xs mt-2 text-right" style={{ fontFamily: 'Poppins_400Regular' }}>{percent}% spent</Text>
                  </View>
                );
              })
            )}
          </View>
        )}

        {activeTab === 'payments' && (
          <View className="pb-8">
            {paymentsWithData.length === 0 ? (
              <View className="bg-gray-50 rounded-3xl p-8 border border-gray-200 items-center">
                <DollarSign size={48} color="#9CA3AF" strokeWidth={2} style={{ marginBottom: 12 }} />
                <Text className="text-gray-500 text-center" style={{ fontFamily: 'Poppins_400Regular' }}>No payments yet. Materials and team costs recorded by your GC will appear here.</Text>
              </View>
            ) : (
              paymentsWithData.map((group) => {
                const isExpanded = expandedProjectId === group.projectId;
                const activation = group.activationPayment;
                const subPayments = group.subPayments ?? [];
                const total = subPayments.reduce((s, p) => s + p.amount, 0);
                const subCount = subPayments.length;
                const hasActivation = !!activation;
                return (
                  <View key={group.projectId} className="bg-gray-50 rounded-2xl mb-3 border border-gray-200 overflow-hidden">
                    <TouchableOpacity
                      onPress={() => setExpandedProjectId(isExpanded ? null : group.projectId)}
                      className="p-4 flex-row items-center"
                      activeOpacity={0.7}
                    >
                      <View className="w-12 h-12 bg-black rounded-full items-center justify-center">
                        <DollarSign size={24} color="#FFFFFF" strokeWidth={2} />
                      </View>
                      <View className="flex-1 ml-4">
                        <Text className="text-black text-base" style={{ fontFamily: 'Poppins_600SemiBold' }}>{group.projectName}</Text>
                        <Text className="text-gray-500 text-sm" style={{ fontFamily: 'Poppins_400Regular' }}>
                          {hasActivation ? 'Project paid • ' : ''}{subCount > 0 ? `${subCount} material/team cost${subCount !== 1 ? 's' : ''}` : hasActivation ? 'No materials/team recorded yet' : ''}
                        </Text>
                      </View>
                      <View className="items-end">
                        <Text className="text-black" style={{ fontFamily: 'JetBrainsMono_500Medium' }}>${total.toLocaleString()}</Text>
                        <ChevronRight size={20} color="#6B7280" strokeWidth={2} style={{ transform: [{ rotate: isExpanded ? '90deg' : '0deg' }] }} />
                      </View>
                    </TouchableOpacity>
                    {isExpanded && (
                      <View className="border-t border-gray-200 pt-2 pb-2">
                        {subPayments.length === 0 ? (
                          <View className="px-4 py-3 pl-16">
                            <Text className="text-gray-500 text-sm" style={{ fontFamily: 'Poppins_400Regular' }}>No materials or team costs recorded by the GC yet.</Text>
                          </View>
                        ) : (
                          subPayments.map((sp) => (
                            <View key={sp.id} className="flex-row items-center px-4 py-2 pl-16">
                              <Text className="flex-1 text-gray-600 text-sm" style={{ fontFamily: 'Poppins_400Regular' }}>
                                {sp.type === 'material' ? 'Material' : 'Team'} • {sp.stageName} • {sp.description}
                              </Text>
                              <Text className="text-black text-sm" style={{ fontFamily: 'JetBrainsMono_500Medium' }}>${sp.amount.toLocaleString()}</Text>
                            </View>
                          ))
                        )}
                      </View>
                    )}
                  </View>
                );
              })
            )}
          </View>
        )}

        {activeTab === 'invoices' && (
          <View className="pb-8">
            <View className="bg-gray-50 rounded-3xl p-8 border border-gray-200 items-center">
              <FileText size={48} color="#9CA3AF" strokeWidth={2} style={{ marginBottom: 12 }} />
              <Text className="text-gray-500 text-center" style={{ fontFamily: 'Poppins_400Regular' }}>Invoices coming soon. Your invoices will appear here once available.</Text>
            </View>
          </View>
        )}

        {activeTab === 'landPurchases' && (
          <View className="pb-8">
            {landPurchases.length === 0 ? (
              <View className="bg-gray-50 rounded-3xl p-8 border border-gray-200 items-center">
                <Landmark size={48} color="#9CA3AF" strokeWidth={2} style={{ marginBottom: 12 }} />
                <Text className="text-gray-500 text-center" style={{ fontFamily: 'Poppins_400Regular' }}>
                  No land purchase records yet.
                </Text>
              </View>
            ) : (
              landPurchases.map((purchase: any) => (
                <View key={purchase.id} className="bg-gray-50 rounded-2xl p-4 mb-3 border border-gray-200">
                  <Text className="text-black text-base mb-1" style={{ fontFamily: 'Poppins_600SemiBold' }}>
                    {purchase.landForSale?.name || 'Land'}
                  </Text>
                  <Text className="text-gray-500 text-sm mb-2" style={{ fontFamily: 'Poppins_400Regular' }}>
                    {purchase.landForSale?.location}
                  </Text>
                  <View className="flex-row justify-between items-center">
                    <Text className="text-black" style={{ fontFamily: 'JetBrainsMono_500Medium' }}>
                      ₦{(purchase.purchaseAmount ?? purchase.landForSale?.price ?? 0).toLocaleString()}
                    </Text>
                    <Text className="text-gray-500 text-xs" style={{ fontFamily: 'Poppins_400Regular' }}>
                      {formatDate(purchase.purchaseMarkedAt || purchase.createdAt)}
                    </Text>
                  </View>
                </View>
              ))
            )}
          </View>
        )}

        {activeTab === 'homePurchases' && (
          <View className="pb-8">
            {homePurchases.length === 0 ? (
              <View className="bg-gray-50 rounded-3xl p-8 border border-gray-200 items-center">
                <Home size={48} color="#9CA3AF" strokeWidth={2} style={{ marginBottom: 12 }} />
                <Text className="text-gray-500 text-center" style={{ fontFamily: 'Poppins_400Regular' }}>
                  No home purchase records yet.
                </Text>
              </View>
            ) : (
              homePurchases.map((purchase: any) => (
                <View key={purchase.id} className="bg-gray-50 rounded-2xl p-4 mb-3 border border-gray-200">
                  <Text className="text-black text-base mb-1" style={{ fontFamily: 'Poppins_600SemiBold' }}>
                    {purchase.houseForSale?.name || 'House'}
                  </Text>
                  <Text className="text-gray-500 text-sm mb-2" style={{ fontFamily: 'Poppins_400Regular' }}>
                    {purchase.houseForSale?.location}
                  </Text>
                  <View className="flex-row justify-between items-center">
                    <Text className="text-black" style={{ fontFamily: 'JetBrainsMono_500Medium' }}>
                      ${(purchase.purchaseAmount ?? purchase.houseForSale?.price ?? 0).toLocaleString()}
                    </Text>
                    <Text className="text-gray-500 text-xs" style={{ fontFamily: 'Poppins_400Regular' }}>
                      {formatDate(purchase.purchaseMarkedAt || purchase.createdAt)}
                    </Text>
                  </View>
                </View>
              ))
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
}
