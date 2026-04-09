import { View, Text, ScrollView, TouchableOpacity, Animated, useWindowDimensions } from "react-native";
import { useRouter } from "expo-router";
import { User, Filter, CreditCard, Receipt, FileText, TrendingUp, ChevronRight, Building, ChevronDown } from "lucide-react-native";
import { useState, useRef, useMemo } from "react";
import { useInvestments } from '@/contexts/InvestmentContext';
import { useResponsivePadding } from "@/lib/responsive-layout";

const recentPayments = [
  { id: 1, project: "Modern Minimalist", stage: "Foundation", amount: 28500, date: "Dec 15, 2024", status: "completed" },
  { id: 2, project: "Modern Minimalist", stage: "Site Preparation", amount: 15000, date: "Dec 1, 2024", status: "completed" },
  { id: 3, project: "Classic Colonial", stage: "Electrical", amount: 35000, date: "Nov 28, 2024", status: "completed" },
];

const invoices = [
  { id: 1, project: "Modern Minimalist", invoiceNo: "INV-2024-001", amount: 142500, date: "Dec 15, 2024", type: "pdf" },
  { id: 2, project: "Classic Colonial", invoiceNo: "INV-2024-002", amount: 250250, date: "Nov 28, 2024", type: "pdf" },
];

const loanOptions = [
  { id: 1, name: "Home Construction Loan", provider: "First Bank", rate: "12.5%", maxAmount: "₦500,000", term: "Up to 25 years" },
  { id: 2, name: "Building Finance", provider: "GTBank", rate: "11.9%", maxAmount: "₦750,000", term: "Up to 20 years" },
];

export default function FinanceScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const { horizontalPad, headerPaddingTop, headerPaddingBottom, scrollBottomPadding, listingChrome } =
    useResponsivePadding("tab");
  const mw = listingChrome.mobileWeb;
  const { userInvestments, getTotalInvested, getTotalCurrentValue } = useInvestments();
  const [activeTab, setActiveTab] = useState<'overview' | 'payments' | 'invoices' | 'loans' | 'investments'>('overview');
  const [showFilters, setShowFilters] = useState(false);
  const filterAnim = useRef(new Animated.Value(0)).current;

  const totalInvested = getTotalInvested();
  const totalCurrentValue = getTotalCurrentValue();
  const totalReturns = totalInvested > 0 ? (((totalCurrentValue - totalInvested) / totalInvested) * 100).toFixed(2) : "0";

  const toggleFilters = () => {
    const toValue = showFilters ? 0 : 1;
    Animated.timing(filterAnim, { toValue, duration: 300, useNativeDriver: false }).start();
    setShowFilters(!showFilters);
  };

  const filterHeight = useMemo(
    () =>
      filterAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [0, mw ? 56 : 70],
      }),
    [filterAnim, mw],
  );
  const filterOpacity = filterAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 1] });

  return (
    <View className="flex-1 bg-white">
      <View
        className="flex-row items-center justify-between gap-2"
        style={{
          paddingTop: headerPaddingTop,
          paddingBottom: headerPaddingBottom,
          paddingHorizontal: horizontalPad,
        }}
      >
        <TouchableOpacity
          onPress={() => router.push('/profile')}
          className="bg-black rounded-full items-center justify-center flex-shrink-0"
          style={{ width: listingChrome.avatarSize, height: listingChrome.avatarSize }}
        >
          <User size={listingChrome.headerUserIconSize} color="#FFFFFF" strokeWidth={2.5} />
        </TouchableOpacity>
        <View className="flex-1 min-w-0 items-center">
          <Text
            className="text-black text-center"
            style={{ fontFamily: 'Poppins_700Bold', fontSize: listingChrome.titleFontSize }}
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.85}
          >
            Finance
          </Text>
        </View>
        <TouchableOpacity
          onPress={toggleFilters}
          className={`rounded-full items-center justify-center flex-shrink-0 ${showFilters ? 'bg-gray-200' : 'bg-gray-100'}`}
          style={{ width: listingChrome.avatarSize, height: listingChrome.avatarSize }}
        >
          <Filter size={mw ? 20 : 24} color="#000000" strokeWidth={2.5} />
        </TouchableOpacity>
      </View>

      {/* Animated Filter Tabs */}
      <Animated.View style={{ height: filterHeight, opacity: filterOpacity, overflow: 'hidden' }}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: horizontalPad }}
          className={mw ? 'pb-2' : 'pb-4'}
        >
          {[
            { key: 'overview', label: 'Overview', icon: TrendingUp },
            { key: 'payments', label: 'Payments', icon: CreditCard },
            { key: 'invoices', label: 'Invoices', icon: Receipt },
            { key: 'loans', label: 'Loans', icon: Building },
            { key: 'investments', label: 'Investments', icon: TrendingUp },
          ].map((tab) => (
            <TouchableOpacity key={tab.key} onPress={() => setActiveTab(tab.key as any)} className={`px-4 py-2 rounded-full mr-3 flex-row items-center ${activeTab === tab.key ? 'bg-black' : 'bg-gray-100'}`}>
              <tab.icon size={16} color={activeTab === tab.key ? '#FFFFFF' : '#000000'} strokeWidth={2} />
              <Text className={`ml-2 text-sm ${activeTab === tab.key ? 'text-white' : 'text-black'}`} style={{ fontFamily: 'Poppins_500Medium' }}>{tab.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </Animated.View>

      {/* Current Tab Indicator */}
      <View style={{ marginBottom: listingChrome.tabsSectionMarginBottom, paddingHorizontal: horizontalPad }}>
        <TouchableOpacity onPress={toggleFilters} className="flex-row items-center">
          <Text
            className="text-black"
            style={{ fontFamily: 'Poppins_700Bold', fontSize: mw ? 17 : 20 }}
          >
            {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
          </Text>
          <ChevronDown size={20} color="#000000" strokeWidth={2} style={{ marginLeft: 4 }} />
        </TouchableOpacity>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          paddingBottom: scrollBottomPadding,
          paddingHorizontal: horizontalPad,
        }}
      >
        {activeTab === 'overview' && (
          <View className={mw ? 'pb-4' : 'pb-8'}>
            <View
              className={`bg-black rounded-3xl ${mw ? 'mb-4' : 'mb-6'}`}
              style={{ padding: mw ? 16 : 24 }}
            >
              <Text
                className="text-white/70 mb-1"
                style={{ fontFamily: 'Poppins_400Regular', fontSize: mw ? 12 : 14 }}
              >
                Total Invested
              </Text>
              <Text
                className="text-white mb-3"
                style={{
                  fontFamily: 'JetBrainsMono_500Medium',
                  fontSize: mw ? 28 : width <= 390 ? 28 : 36,
                }}
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.7}
              >
                ₦321,500
              </Text>
              <View className="flex-row justify-between">
                <View>
                  <Text className="text-white/70 text-xs mb-1" style={{ fontFamily: 'Poppins_400Regular' }}>Active Projects</Text>
                  <Text className="text-white" style={{ fontFamily: 'Poppins_700Bold', fontSize: mw ? 18 : 20 }}>2</Text>
                </View>
                <View>
                  <Text className="text-white/70 text-xs mb-1" style={{ fontFamily: 'Poppins_400Regular' }}>Total Budget</Text>
                  <Text className="text-white" style={{ fontFamily: 'JetBrainsMono_500Medium', fontSize: mw ? 16 : 20 }}>₦670,000</Text>
                </View>
              </View>
            </View>
            <Text
              className="text-black mb-2"
              style={{ fontFamily: 'Poppins_700Bold', fontSize: mw ? 17 : 20 }}
            >
              Project Budgets
            </Text>
            {[{ name: "Modern Minimalist", budget: 285000, spent: 71250, percent: 25 }, { name: "Classic Colonial", budget: 385000, spent: 250250, percent: 65 }].map((p, i) => (
              <View key={i} className="bg-gray-50 rounded-3xl p-5 mb-4 border border-gray-200">
                <Text className="text-lg text-black mb-3" style={{ fontFamily: 'Poppins_700Bold' }}>{p.name}</Text>
                <View className="flex-row flex-wrap justify-between mb-3 gap-y-2" style={{ gap: 8 }}>
                  <View className="min-w-[30%] flex-1"><Text className="text-gray-500 text-xs mb-1" style={{ fontFamily: 'Poppins_400Regular' }}>Budget</Text><Text className="text-black" style={{ fontFamily: 'JetBrainsMono_500Medium' }}>₦{p.budget.toLocaleString()}</Text></View>
                  <View className="min-w-[30%] flex-1"><Text className="text-gray-500 text-xs mb-1" style={{ fontFamily: 'Poppins_400Regular' }}>Spent</Text><Text className="text-black" style={{ fontFamily: 'JetBrainsMono_500Medium' }}>₦{p.spent.toLocaleString()}</Text></View>
                  <View className="min-w-[30%] flex-1"><Text className="text-gray-500 text-xs mb-1" style={{ fontFamily: 'Poppins_400Regular' }}>Remaining</Text><Text className="text-black" style={{ fontFamily: 'JetBrainsMono_500Medium' }}>₦{(p.budget - p.spent).toLocaleString()}</Text></View>
                </View>
                <View className="h-3 bg-gray-200 rounded-full overflow-hidden"><View className="h-full bg-black rounded-full" style={{ width: `${p.percent}%` }} /></View>
                <Text className="text-gray-500 text-xs mt-2 text-right" style={{ fontFamily: 'Poppins_400Regular' }}>{p.percent}% spent</Text>
              </View>
            ))}
          </View>
        )}

        {activeTab === 'payments' && (
          <View className={mw ? 'pb-4' : 'pb-8'}>
            {recentPayments.map((payment) => (
              <TouchableOpacity key={payment.id} className="bg-gray-50 rounded-2xl p-4 mb-3 flex-row items-center border border-gray-200">
                <View className="w-12 h-12 bg-black rounded-full items-center justify-center flex-shrink-0"><Text className="text-white text-xl" style={{ fontFamily: 'Poppins_700Bold' }}>₦</Text></View>
                <View className="flex-1 ml-4 min-w-0">
                  <Text className="text-black text-base" style={{ fontFamily: 'Poppins_600SemiBold' }} numberOfLines={1}>{payment.project}</Text>
                  <Text className="text-gray-500 text-sm" style={{ fontFamily: 'Poppins_400Regular' }} numberOfLines={2}>{payment.stage} • {payment.date}</Text>
                </View>
                <Text className="text-black flex-shrink-0 ml-2" style={{ fontFamily: 'JetBrainsMono_500Medium' }}>₦{payment.amount.toLocaleString()}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {activeTab === 'invoices' && (
          <View className={mw ? 'pb-4' : 'pb-8'}>
            {invoices.map((invoice) => (
              <TouchableOpacity key={invoice.id} className="bg-gray-50 rounded-2xl p-4 mb-3 flex-row items-center border border-gray-200">
                <View className="w-12 h-12 bg-gray-200 rounded-xl items-center justify-center"><FileText size={24} color="#000000" strokeWidth={2} /></View>
                <View className="flex-1 ml-4">
                  <Text className="text-black text-base" style={{ fontFamily: 'Poppins_600SemiBold' }}>{invoice.invoiceNo}</Text>
                  <Text className="text-gray-500 text-sm" style={{ fontFamily: 'Poppins_400Regular' }}>{invoice.project} • {invoice.date}</Text>
                </View>
                <View className="items-end">
                  <Text className="text-black" style={{ fontFamily: 'JetBrainsMono_500Medium' }}>₦{invoice.amount.toLocaleString()}</Text>
                  <Text className="text-gray-500 text-xs" style={{ fontFamily: 'Poppins_400Regular' }}>PDF</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {activeTab === 'loans' && (
          <View className={mw ? 'pb-4' : 'pb-8'}>
            {loanOptions.map((loan) => (
              <TouchableOpacity key={loan.id} className="bg-gray-50 rounded-3xl p-5 mb-4 border border-gray-200">
                <View className="flex-row justify-between items-start mb-3 gap-2">
                  <View className="flex-1 min-w-0"><Text className="text-lg text-black" style={{ fontFamily: 'Poppins_700Bold' }} numberOfLines={2}>{loan.name}</Text><Text className="text-gray-500" style={{ fontFamily: 'Poppins_400Regular' }} numberOfLines={1}>{loan.provider}</Text></View>
                  <View className="flex-shrink-0">
                    <ChevronRight size={24} color="#000000" strokeWidth={2} />
                  </View>
                </View>
                <View className="flex-row flex-wrap justify-between" style={{ gap: 12 }}>
                  <View className="min-w-[28%]"><Text className="text-gray-500 text-xs mb-1" style={{ fontFamily: 'Poppins_400Regular' }}>Interest Rate</Text><Text className="text-black" style={{ fontFamily: 'JetBrainsMono_500Medium' }}>{loan.rate}</Text></View>
                  <View className="min-w-[28%]"><Text className="text-gray-500 text-xs mb-1" style={{ fontFamily: 'Poppins_400Regular' }}>Max Amount</Text><Text className="text-black" style={{ fontFamily: 'JetBrainsMono_500Medium' }}>{loan.maxAmount}</Text></View>
                  <View className="min-w-[28%]"><Text className="text-gray-500 text-xs mb-1" style={{ fontFamily: 'Poppins_400Regular' }}>Term</Text><Text className="text-black" style={{ fontFamily: 'Poppins_400Regular' }} numberOfLines={2}>{loan.term}</Text></View>
                </View>
              </TouchableOpacity>
            ))}
            <TouchableOpacity className="bg-black rounded-full py-5 px-8 mt-4"><Text className="text-white text-center text-lg" style={{ fontFamily: 'Poppins_700Bold' }}>Apply for Financing</Text></TouchableOpacity>
          </View>
        )}

        {activeTab === 'investments' && (
          <View className={mw ? 'pb-4' : 'pb-8'}>
            <View
              className={`bg-black rounded-3xl ${mw ? 'mb-4' : 'mb-6'}`}
              style={{ padding: mw ? 16 : 24 }}
            >
              <Text
                className="text-white/70 mb-1"
                style={{ fontFamily: 'Poppins_400Regular', fontSize: mw ? 12 : 14 }}
              >
                Total Invested
              </Text>
              <Text
                className="text-white mb-2"
                style={{ fontFamily: 'JetBrainsMono_500Medium', fontSize: mw ? 28 : 30 }}
              >
                ₦{totalInvested.toLocaleString()}
              </Text>
              <View className="flex-row justify-between">
                <View>
                  <Text className="text-white/70 text-xs mb-1" style={{ fontFamily: 'Poppins_400Regular' }}>Current Value</Text>
                  <Text className="text-white" style={{ fontFamily: 'JetBrainsMono_500Medium', fontSize: mw ? 16 : 18 }}>₦{totalCurrentValue.toLocaleString()}</Text>
                </View>
                <View>
                  <Text className="text-white/70 text-xs mb-1" style={{ fontFamily: 'Poppins_400Regular' }}>Total Returns</Text>
                  <Text className="text-white" style={{ fontFamily: 'Poppins_700Bold', fontSize: mw ? 16 : 18 }}>+{totalReturns}%</Text>
                </View>
              </View>
            </View>
            <Text className="text-lg text-black mb-4" style={{ fontFamily: 'Poppins_700Bold' }}>Your Investments</Text>
            {userInvestments.map((inv) => (
              <View key={inv.id} className="bg-gray-50 rounded-3xl p-5 mb-4 border border-gray-200">
                <View className="flex-row justify-between items-start mb-3">
                  <Text className="text-lg text-black flex-1" style={{ fontFamily: 'Poppins_700Bold' }}>{inv.name}</Text>
                  <View className="bg-black rounded-full px-3 py-1"><Text className="text-white text-xs" style={{ fontFamily: 'Poppins_600SemiBold' }}>{inv.status}</Text></View>
                </View>
                <View className="flex-row justify-between mb-3">
                  <View><Text className="text-gray-500 text-xs mb-1" style={{ fontFamily: 'Poppins_400Regular' }}>Invested</Text><Text className="text-black" style={{ fontFamily: 'JetBrainsMono_500Medium' }}>₦{inv.invested.toLocaleString()}</Text></View>
                  <View><Text className="text-gray-500 text-xs mb-1" style={{ fontFamily: 'Poppins_400Regular' }}>Current Value</Text><Text className="text-black" style={{ fontFamily: 'JetBrainsMono_500Medium' }}>₦{inv.currentValue.toLocaleString()}</Text></View>
                  <View><Text className="text-gray-500 text-xs mb-1" style={{ fontFamily: 'Poppins_400Regular' }}>ROI</Text><Text className="text-black" style={{ fontFamily: 'Poppins_700Bold' }}>+{inv.roi}</Text></View>
                </View>
                <Text className="text-gray-500 text-xs" style={{ fontFamily: 'Poppins_400Regular' }}>Maturity: {inv.maturity} • {inv.units} units</Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}
