import { View, Text, ScrollView, TouchableOpacity, Image, Modal, TextInput, useWindowDimensions } from "react-native";
import { useRouter } from "expo-router";
import { User, Bell, Plus, ChevronRight, MapPin, TrendingUp, X, Check, LandPlot, FileCheck } from "lucide-react-native";
import { useState, useCallback, useMemo } from "react";
import { useInvestments } from '@/contexts/InvestmentContext';
import { useResponsivePadding } from "@/lib/responsive-layout";
import { cardShadowStyle } from "@/lib/card-styles";

const projectImages = {
  1: [
    { url: "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=600&q=80", label: "Exterior" },
    { url: "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=600&q=80", label: "Living Room" },
    { url: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=600&q=80", label: "Kitchen" },
    { url: "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=600&q=80", label: "Bedroom" },
    { url: "https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?w=600&q=80", label: "Bathroom" },
  ],
};

const currentProjects = [
  {
    id: 1,
    name: "Modern Minimalist",
    address: "123 Main Street, Lagos",
    progress: 25,
    currentStage: "Foundation",
    status: "in-progress",
    budget: "₦285,000",
    spent: "₦71,250",
  },
];

const investments = [
  {
    id: 1,
    name: "Lekki Gardens Phase 3",
    location: "Lekki, Lagos",
    roi: "18%",
    minInvestment: 5000,
    totalUnits: 500,
    soldUnits: 342,
    duration: "24 months",
    image: "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=600&q=80",
    description: "Premium residential development in the heart of Lekki. Expected completion in 24 months with guaranteed ROI.",
  },
  {
    id: 2,
    name: "Abuja Smart City",
    location: "Abuja, FCT",
    roi: "22%",
    minInvestment: 10000,
    totalUnits: 1000,
    soldUnits: 678,
    duration: "36 months",
    image: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=600&q=80",
    description: "State-of-the-art smart city development with modern amenities. High-yield investment opportunity.",
  },
];

const landedProperties = [
  {
    id: 1,
    name: "Royal Gardens Estate",
    location: "Ibeju-Lekki, Lagos",
    pricePerPlot: 15000000,
    totalPlots: 200,
    soldPlots: 145,
    plotSize: "600 sqm",
    image: "https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=600&q=80",
    description: "Premium estate with C of O, survey plan, and deed of assignment. Gated community with 24/7 security.",
    documents: ["C of O", "Survey Plan", "Deed of Assignment"],
    amenities: ["Gated Community", "24/7 Security", "Good Road Network", "Electricity"],
  },
  {
    id: 2,
    name: "Sunrise Gardens",
    location: "Epe, Lagos",
    pricePerPlot: 8000000,
    totalPlots: 350,
    soldPlots: 210,
    plotSize: "500 sqm",
    image: "https://images.unsplash.com/photo-1628624747186-a941c476b7ef?w=600&q=80",
    description: "Affordable plots with verified documents. Strategic location with high appreciation potential.",
    documents: ["C of O", "Survey Plan", "Gazette"],
    amenities: ["Perimeter Fencing", "Drainage System", "Street Lights"],
  },
];

export default function HomeScreen() {
  const router = useRouter();
  const { width: screenWidth } = useWindowDimensions();
  const { horizontalPad, headerPaddingTop, headerPaddingBottom, scrollBottomPadding, listingChrome } =
    useResponsivePadding("tab");
  const compactTab = listingChrome.mobileWeb;
  const { addInvestment } = useInvestments();
  const [activeImageIndex, setActiveImageIndex] = useState<{[key: number]: number}>({1: 0});
  const [showInvestModal, setShowInvestModal] = useState(false);
  const [selectedInvestment, setSelectedInvestment] = useState<typeof investments[0] | null>(null);
  const [investUnits, setInvestUnits] = useState("1");
  const [investSuccess, setInvestSuccess] = useState(false);
  const [showLandModal, setShowLandModal] = useState(false);
  const [selectedLand, setSelectedLand] = useState<typeof landedProperties[0] | null>(null);
  const [plotCount, setPlotCount] = useState("1");
  const [landSuccess, setLandSuccess] = useState(false);
  const [projectCarouselWidth, setProjectCarouselWidth] = useState(0);

  const carouselSlideWidth = useMemo(() => {
    if (projectCarouselWidth > 0) return projectCarouselWidth;
    return Math.max(0, screenWidth - horizontalPad * 2);
  }, [projectCarouselWidth, screenWidth, horizontalPad]);

  const handleImageScroll = useCallback((projectId: number, event: any) => {
    const contentOffset = event.nativeEvent.contentOffset.x;
    const imageWidth = event.nativeEvent.layoutMeasurement.width;
    const index = Math.round(contentOffset / imageWidth);
    setActiveImageIndex(prev => ({ ...prev, [projectId]: index }));
  }, []);

  const handleInvest = (investment: typeof investments[0]) => {
    setSelectedInvestment(investment);
    setInvestUnits("1");
    setInvestSuccess(false);
    setShowInvestModal(true);
  };

  const confirmInvestment = () => {
    if (selectedInvestment) {
      addInvestment(selectedInvestment, parseInt(investUnits) || 1);
    }
    setInvestSuccess(true);
    setTimeout(() => {
      setShowInvestModal(false);
      setInvestSuccess(false);
    }, 2000);
  };

  const handleLandPurchase = (land: typeof landedProperties[0]) => {
    setSelectedLand(land);
    setPlotCount("1");
    setLandSuccess(false);
    setShowLandModal(true);
  };

  const confirmLandPurchase = () => {
    setLandSuccess(true);
    setTimeout(() => {
      setShowLandModal(false);
      setLandSuccess(false);
    }, 2000);
  };

  return (
    <View className="flex-1 bg-white">
      {/* Header */}
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
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          activeOpacity={0.7}
          className="bg-black rounded-full items-center justify-center flex-shrink-0"
          style={{ width: listingChrome.avatarSize, height: listingChrome.avatarSize }}
        >
          <User size={listingChrome.headerUserIconSize} color="#FFFFFF" strokeWidth={2.5} />
        </TouchableOpacity>

        <View className="flex-1 min-w-0 items-center justify-center px-1">
          <Text
            className="text-black text-center"
            style={{
              fontFamily: 'Poppins_700Bold',
              fontSize: listingChrome.titleFontSize,
            }}
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.85}
          >
            BuildMyHouse
          </Text>
        </View>

        <TouchableOpacity
          onPress={() => router.push('/notifications')}
          className="bg-gray-100 rounded-full items-center justify-center flex-shrink-0"
          style={{ width: listingChrome.avatarSize, height: listingChrome.avatarSize }}
        >
          <Bell size={listingChrome.headerUserIconSize} color="#000000" strokeWidth={2.5} />
          <View className="absolute top-2 right-2 w-3 h-3 bg-black rounded-full" />
        </TouchableOpacity>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          paddingBottom: scrollBottomPadding,
          paddingHorizontal: horizontalPad,
        }}
      >
        {/* Welcome Section */}
        <View className={compactTab ? 'mb-5' : 'mb-8'}>
          <Text
            className="text-black mb-1"
            style={{ fontFamily: 'Poppins_800ExtraBold', fontSize: compactTab ? 26 : 30 }}
          >
            Welcome back,
          </Text>
          <Text
            className="text-black"
            style={{ fontFamily: 'Poppins_800ExtraBold', fontSize: compactTab ? 26 : 30 }}
          >
            Ifeoma 👋
          </Text>
        </View>

        {/* Start New Project */}
        <TouchableOpacity
          onPress={() => router.push('/')}
          className={`bg-black rounded-3xl flex-row items-center justify-between ${compactTab ? 'mb-5' : 'mb-8'}`}
          style={{ padding: compactTab ? 16 : 24 }}
        >
          <View className="flex-1">
            <Text 
              className="text-white mb-1"
              style={{ fontFamily: 'Poppins_700Bold', fontSize: compactTab ? 17 : 20 }}
            >
              Start New Project
            </Text>
            <Text 
              className="text-white/70"
              style={{ fontFamily: 'Poppins_400Regular', fontSize: compactTab ? 13 : 14 }}
            >
              Build your dream home today
            </Text>
          </View>
          <View
            className="bg-white rounded-full items-center justify-center flex-shrink-0"
            style={{ width: compactTab ? 48 : 56, height: compactTab ? 48 : 56 }}
          >
            <Plus size={compactTab ? 24 : 28} color="#000000" strokeWidth={2.5} />
          </View>
        </TouchableOpacity>

        {/* Current Projects */}
        <View className={compactTab ? 'mb-5' : 'mb-8'}>
          <Text 
            className={`text-black ${compactTab ? 'mb-3' : 'mb-4'}`}
            style={{ fontFamily: 'Poppins_700Bold', fontSize: compactTab ? 20 : 24 }}
          >
            Your Projects
          </Text>

          {currentProjects.map((project) => {
            const images = projectImages[project.id as keyof typeof projectImages];
            return (
              <TouchableOpacity
                key={project.id}
                onPress={() => router.push('/dashboard')}
                style={cardShadowStyle}
                className="bg-gray-50 rounded-3xl mb-4 border border-gray-200"
                onLayout={(e) => {
                  const w = e.nativeEvent.layout.width;
                  if (w > 0 && Math.abs(w - projectCarouselWidth) > 1) {
                    setProjectCarouselWidth(w);
                  }
                }}
              >
                <View className="overflow-hidden rounded-3xl">
                {/* Image Carousel */}
                <View className="relative">
                  <ScrollView
                    horizontal
                    pagingEnabled
                    showsHorizontalScrollIndicator={false}
                    onScroll={(e) => handleImageScroll(project.id, e)}
                    scrollEventThrottle={16}
                  >
                    {images.map((image, index) => (
                      <View key={index} style={{ width: carouselSlideWidth }} className="relative">
                        <Image
                          source={{ uri: image.url }}
                          className="w-full h-40"
                          resizeMode="cover"
                        />
                        <View className="absolute bottom-2 left-2 bg-black/70 rounded-full px-3 py-1">
                          <Text 
                            className="text-white text-xs"
                            style={{ fontFamily: 'Poppins_500Medium' }}
                          >
                            {image.label}
                          </Text>
                        </View>
                      </View>
                    ))}
                  </ScrollView>
                  
                  {/* Dots Indicator */}
                  <View className="absolute bottom-2 right-2 flex-row">
                    {images.map((_, index) => (
                      <View
                        key={index}
                        className={`w-1.5 h-1.5 rounded-full mx-0.5 ${
                          index === (activeImageIndex[project.id] || 0) ? 'bg-white' : 'bg-white/50'
                        }`}
                      />
                    ))}
                  </View>
                </View>

                <View className="p-5">
                  <View className="flex-row justify-between items-start mb-3">
                    <View className="flex-1">
                      <Text 
                        className="text-xl text-black mb-1"
                        style={{ fontFamily: 'Poppins_700Bold' }}
                      >
                        {project.name}
                      </Text>
                      <View className="flex-row items-center">
                        <MapPin size={14} color="#737373" strokeWidth={2} />
                        <Text 
                          className="text-gray-500 ml-1 text-sm"
                          style={{ fontFamily: 'Poppins_400Regular' }}
                        >
                          {project.address}
                        </Text>
                      </View>
                    </View>
                    <ChevronRight size={24} color="#000000" strokeWidth={2} />
                  </View>

                  {/* Progress Bar */}
                  <View className="mb-3">
                    <View className="flex-row justify-between mb-2">
                      <Text 
                        className="text-black text-sm"
                        style={{ fontFamily: 'Poppins_600SemiBold' }}
                      >
                        {project.currentStage}
                      </Text>
                      <Text 
                        className="text-black"
                        style={{ fontFamily: 'JetBrainsMono_500Medium' }}
                      >
                        {project.progress}%
                      </Text>
                    </View>
                    <View className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <View 
                        className="h-full bg-black rounded-full" 
                        style={{ width: `${project.progress}%` }} 
                      />
                    </View>
                  </View>

                  {/* Budget Info */}
                  <View className="flex-row justify-between pt-3 border-t border-gray-200">
                    <View>
                      <Text 
                        className="text-gray-500 text-xs mb-1"
                        style={{ fontFamily: 'Poppins_400Regular' }}
                      >
                        Budget
                      </Text>
                      <Text 
                        className="text-black"
                        style={{ fontFamily: 'JetBrainsMono_500Medium' }}
                      >
                        {project.budget}
                      </Text>
                    </View>
                    <View>
                      <Text 
                        className="text-gray-500 text-xs mb-1"
                        style={{ fontFamily: 'Poppins_400Regular' }}
                      >
                        Spent
                      </Text>
                      <Text 
                        className="text-black"
                        style={{ fontFamily: 'JetBrainsMono_500Medium' }}
                      >
                        {project.spent}
                      </Text>
                    </View>
                  </View>
                </View>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Real Estate Investments */}
        <View className={compactTab ? 'mb-5' : 'mb-8'}>
          <View className={`flex-row items-center justify-between gap-2 ${compactTab ? 'mb-3' : 'mb-4'}`}>
            <View className="flex-1 min-w-0 flex-row items-center">
              <View className="flex-shrink-0">
                <TrendingUp size={22} color="#000000" strokeWidth={2.5} />
              </View>
              <Text
                className="text-xl text-black ml-2 flex-shrink"
                style={{ fontFamily: 'Poppins_700Bold' }}
                numberOfLines={2}
              >
                Investments
              </Text>
            </View>
            <View className="bg-black rounded-full px-3 py-1 flex-shrink-0">
              <Text
                className="text-white text-xs"
                style={{ fontFamily: 'Poppins_600SemiBold' }}
              >
                Verified
              </Text>
            </View>
          </View>

          <Text 
            className={`text-gray-500 ${compactTab ? 'mb-3' : 'mb-4'}`}
            style={{ fontFamily: 'Poppins_400Regular', fontSize: compactTab ? 14 : 16 }}
          >
            {"Can't build now? Invest in verified real estate opportunities"}
          </Text>

          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {investments.map((investment) => (
              <TouchableOpacity
                key={investment.id}
                onPress={() => handleInvest(investment)}
                style={[
                  cardShadowStyle,
                  {
                    width: Math.min(
                      280,
                      Math.max(220, screenWidth - horizontalPad * 2 - 12),
                    ),
                  },
                ]}
                className="bg-white rounded-3xl mr-4 border border-gray-200"
              >
                <View className="overflow-hidden rounded-3xl">
                <Image
                  source={{ uri: investment.image }}
                  className="w-full h-32"
                  resizeMode="cover"
                />
                <View className="p-3 min-w-0">
                  <Text
                    className="text-base text-black mb-1"
                    style={{ fontFamily: 'Poppins_700Bold' }}
                    numberOfLines={1}
                  >
                    {investment.name}
                  </Text>
                  <View className="flex-row items-center mb-2">
                    <MapPin size={12} color="#737373" strokeWidth={2} />
                    <Text 
                      className="text-gray-500 ml-1 text-xs"
                      style={{ fontFamily: 'Poppins_400Regular' }}
                    >
                      {investment.location}
                    </Text>
                  </View>

                  <View className="flex-row justify-between mb-2">
                    <View>
                      <Text className="text-gray-500 text-xs" style={{ fontFamily: 'Poppins_400Regular' }}>ROI</Text>
                      <Text className="text-black text-base" style={{ fontFamily: 'Poppins_700Bold' }}>{investment.roi}</Text>
                    </View>
                    <View>
                      <Text className="text-gray-500 text-xs" style={{ fontFamily: 'Poppins_400Regular' }}>Min.</Text>
                      <Text className="text-black text-sm" style={{ fontFamily: 'JetBrainsMono_500Medium' }}>₦{investment.minInvestment.toLocaleString()}</Text>
                    </View>
                  </View>

                  <View className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                    <View className="h-full bg-black rounded-full" style={{ width: `${(investment.soldUnits / investment.totalUnits) * 100}%` }} />
                  </View>
                </View>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Landed Properties Section */}
        <View className={compactTab ? 'mb-5' : 'mb-8'}>
          <View className={`flex-row items-center justify-between gap-2 ${compactTab ? 'mb-3' : 'mb-4'}`}>
            <View className="flex-1 min-w-0 flex-row items-center">
              <View className="flex-shrink-0">
                <LandPlot size={22} color="#000000" strokeWidth={2.5} />
              </View>
              <Text
                className="text-xl text-black ml-2 flex-shrink"
                style={{ fontFamily: 'Poppins_700Bold' }}
                numberOfLines={2}
              >
                Land for Sale
              </Text>
            </View>
            <View className="bg-black rounded-full px-3 py-1 flex-shrink-0">
              <Text
                className="text-white text-xs"
                style={{ fontFamily: 'Poppins_600SemiBold' }}
              >
                C of O
              </Text>
            </View>
          </View>

          <Text 
            className={`text-gray-500 ${compactTab ? 'mb-3' : 'mb-4'}`}
            style={{ fontFamily: 'Poppins_400Regular', fontSize: compactTab ? 14 : 16 }}
          >
            Verified estates with all legal documents
          </Text>

          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {landedProperties.map((land) => (
              <TouchableOpacity
                key={land.id}
                onPress={() => handleLandPurchase(land)}
                style={[
                  cardShadowStyle,
                  {
                    width: Math.min(
                      280,
                      Math.max(220, screenWidth - horizontalPad * 2 - 12),
                    ),
                  },
                ]}
                className="bg-white rounded-3xl mr-4 border border-gray-200"
              >
                <View className="overflow-hidden rounded-3xl">
                <Image
                  source={{ uri: land.image }}
                  className="w-full h-32"
                  resizeMode="cover"
                />
                <View className="p-3 min-w-0">
                  <Text
                    className="text-base text-black mb-1"
                    style={{ fontFamily: 'Poppins_700Bold' }}
                    numberOfLines={1}
                    ellipsizeMode="tail"
                  >
                    {land.name}
                  </Text>
                  <View className="flex-row items-center mb-2 min-w-0">
                    <MapPin size={12} color="#737373" strokeWidth={2} className="flex-shrink-0" />
                    <Text 
                      className="text-gray-500 ml-1 text-xs flex-1 min-w-0"
                      style={{ fontFamily: 'Poppins_400Regular' }}
                      numberOfLines={2}
                      ellipsizeMode="tail"
                    >
                      {land.location}
                    </Text>
                  </View>

                  <View className="flex-row justify-between mb-2">
                    <View>
                      <Text className="text-gray-500 text-xs" style={{ fontFamily: 'Poppins_400Regular' }}>Per Plot</Text>
                      <Text className="text-black text-sm" style={{ fontFamily: 'JetBrainsMono_500Medium' }}>₦{(land.pricePerPlot / 1000000).toFixed(1)}M</Text>
                    </View>
                    <View>
                      <Text className="text-gray-500 text-xs" style={{ fontFamily: 'Poppins_400Regular' }}>Size</Text>
                      <Text className="text-black text-sm" style={{ fontFamily: 'Poppins_600SemiBold' }}>{land.plotSize}</Text>
                    </View>
                  </View>

                  <View className="flex-row flex-wrap">
                    {land.documents.slice(0, 2).map((doc, i) => (
                      <View key={i} className="bg-gray-100 rounded-full px-2 py-0.5 mr-1 mb-1">
                        <Text className="text-black text-xs" style={{ fontFamily: 'Poppins_500Medium' }}>{doc}</Text>
                      </View>
                    ))}
                  </View>
                </View>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </ScrollView>

      {/* Investment Modal */}
      <Modal
        visible={showInvestModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowInvestModal(false)}
      >
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-white rounded-t-3xl p-6 max-h-[85%]">
            <View className="w-12 h-1 bg-gray-300 rounded-full self-center mb-6" />
            
            {!investSuccess ? (
              <ScrollView showsVerticalScrollIndicator={false}>
                <View className="flex-row justify-between items-start mb-4">
                  <Text 
                    className="text-2xl text-black flex-1"
                    style={{ fontFamily: 'Poppins_800ExtraBold' }}
                  >
                    {selectedInvestment?.name}
                  </Text>
                  <TouchableOpacity onPress={() => setShowInvestModal(false)}>
                    <X size={24} color="#000000" strokeWidth={2} />
                  </TouchableOpacity>
                </View>

                <Image
                  source={{ uri: selectedInvestment?.image }}
                  className="w-full h-48 rounded-2xl mb-4"
                  resizeMode="cover"
                />

                <Text 
                  className="text-gray-600 mb-4"
                  style={{ fontFamily: 'Poppins_400Regular' }}
                >
                  {selectedInvestment?.description}
                </Text>

                <View style={cardShadowStyle} className="bg-gray-50 rounded-2xl p-4 mb-4 border border-gray-200">
                  <View className="flex-row justify-between mb-3">
                    <View>
                      <Text className="text-gray-500 text-xs" style={{ fontFamily: 'Poppins_400Regular' }}>Expected ROI</Text>
                      <Text className="text-black text-xl" style={{ fontFamily: 'Poppins_700Bold' }}>{selectedInvestment?.roi}</Text>
                    </View>
                    <View>
                      <Text className="text-gray-500 text-xs" style={{ fontFamily: 'Poppins_400Regular' }}>Duration</Text>
                      <Text className="text-black text-xl" style={{ fontFamily: 'Poppins_700Bold' }}>{selectedInvestment?.duration}</Text>
                    </View>
                  </View>
                  <View className="flex-row justify-between">
                    <View>
                      <Text className="text-gray-500 text-xs" style={{ fontFamily: 'Poppins_400Regular' }}>Min. Investment</Text>
                      <Text className="text-black" style={{ fontFamily: 'JetBrainsMono_500Medium' }}>₦{selectedInvestment?.minInvestment.toLocaleString()}</Text>
                    </View>
                    <View>
                      <Text className="text-gray-500 text-xs" style={{ fontFamily: 'Poppins_400Regular' }}>Available Units</Text>
                      <Text className="text-black" style={{ fontFamily: 'JetBrainsMono_500Medium' }}>{(selectedInvestment?.totalUnits || 0) - (selectedInvestment?.soldUnits || 0)}</Text>
                    </View>
                  </View>
                </View>

                <View className="mb-4">
                  <Text 
                    className="text-black mb-2"
                    style={{ fontFamily: 'Poppins_600SemiBold' }}
                  >
                    Number of Units
                  </Text>
                  <View className="flex-row items-center">
                    <TouchableOpacity 
                      onPress={() => setInvestUnits(prev => Math.max(1, parseInt(prev) - 1).toString())}
                      className="w-10 h-10 bg-gray-100 rounded-xl items-center justify-center"
                    >
                      <Text className="text-black text-xl">-</Text>
                    </TouchableOpacity>
                    <TextInput
                      className="flex-1 mx-2 bg-gray-50 rounded-xl px-3 py-2 text-center text-black text-lg"
                      style={{ fontFamily: 'JetBrainsMono_500Medium' }}
                      value={investUnits}
                      onChangeText={setInvestUnits}
                      keyboardType="numeric"
                    />
                    <TouchableOpacity 
                      onPress={() => setInvestUnits(prev => (parseInt(prev) + 1).toString())}
                      className="w-10 h-10 bg-gray-100 rounded-xl items-center justify-center"
                    >
                      <Text className="text-black text-xl">+</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                <View className="bg-black rounded-2xl p-4 mb-4">
                  <View className="flex-row justify-between">
                    <Text className="text-white/70" style={{ fontFamily: 'Poppins_400Regular' }}>Total Investment</Text>
                    <Text className="text-white text-xl" style={{ fontFamily: 'JetBrainsMono_500Medium' }}>
                      ₦{((selectedInvestment?.minInvestment || 0) * parseInt(investUnits || "1")).toLocaleString()}
                    </Text>
                  </View>
                </View>

                <TouchableOpacity
                  onPress={confirmInvestment}
                  className="bg-black rounded-full py-5 px-8 mb-4"
                >
                  <Text 
                    className="text-white text-lg text-center"
                    style={{ fontFamily: 'Poppins_700Bold' }}
                  >
                    Invest
                  </Text>
                </TouchableOpacity>

                <Text 
                  className="text-gray-500 text-xs text-center"
                  style={{ fontFamily: 'Poppins_400Regular' }}
                >
                  Track your investment in the Finance tab
                </Text>
              </ScrollView>
            ) : (
              <View className="items-center py-8">
                <View className="w-16 h-16 bg-black rounded-full items-center justify-center mb-4">
                  <Check size={32} color="#FFFFFF" strokeWidth={2.5} />
                </View>
                <Text 
                  className="text-xl text-black mb-2 text-center"
                  style={{ fontFamily: 'Poppins_800ExtraBold' }}
                >
                  Investment Successful!
                </Text>
                <Text 
                  className="text-gray-500 text-center text-sm"
                  style={{ fontFamily: 'Poppins_400Regular' }}
                >
                  Track your investment in the Finance tab
                </Text>
              </View>
            )}
          </View>
        </View>
      </Modal>

      {/* Land Purchase Modal */}
      <Modal
        visible={showLandModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowLandModal(false)}
      >
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-white rounded-t-3xl p-5 max-h-[85%]">
            <View className="w-12 h-1 bg-gray-300 rounded-full self-center mb-4" />
            
            {!landSuccess ? (
              <ScrollView showsVerticalScrollIndicator={false}>
                <View className="flex-row justify-between items-start mb-3">
                  <Text 
                    className="text-xl text-black flex-1"
                    style={{ fontFamily: 'Poppins_800ExtraBold' }}
                  >
                    {selectedLand?.name}
                  </Text>
                  <TouchableOpacity onPress={() => setShowLandModal(false)}>
                    <X size={24} color="#000000" strokeWidth={2} />
                  </TouchableOpacity>
                </View>

                <Image
                  source={{ uri: selectedLand?.image }}
                  className="w-full h-40 rounded-2xl mb-3"
                  resizeMode="cover"
                />

                <Text 
                  className="text-gray-600 mb-3 text-sm"
                  style={{ fontFamily: 'Poppins_400Regular' }}
                >
                  {selectedLand?.description}
                </Text>

                <View style={cardShadowStyle} className="bg-gray-50 rounded-2xl p-3 mb-3 border border-gray-200">
                  <View className="flex-row justify-between mb-2">
                    <View>
                      <Text className="text-gray-500 text-xs" style={{ fontFamily: 'Poppins_400Regular' }}>Price/Plot</Text>
                      <Text className="text-black text-lg" style={{ fontFamily: 'JetBrainsMono_500Medium' }}>₦{((selectedLand?.pricePerPlot || 0) / 1000000).toFixed(1)}M</Text>
                    </View>
                    <View>
                      <Text className="text-gray-500 text-xs" style={{ fontFamily: 'Poppins_400Regular' }}>Plot Size</Text>
                      <Text className="text-black text-lg" style={{ fontFamily: 'Poppins_700Bold' }}>{selectedLand?.plotSize}</Text>
                    </View>
                  </View>
                  <View className="flex-row justify-between">
                    <View>
                      <Text className="text-gray-500 text-xs" style={{ fontFamily: 'Poppins_400Regular' }}>Available</Text>
                      <Text className="text-black" style={{ fontFamily: 'JetBrainsMono_500Medium' }}>{(selectedLand?.totalPlots || 0) - (selectedLand?.soldPlots || 0)} plots</Text>
                    </View>
                    <View>
                      <Text className="text-gray-500 text-xs" style={{ fontFamily: 'Poppins_400Regular' }}>Location</Text>
                      <Text className="text-black text-sm" style={{ fontFamily: 'Poppins_400Regular' }}>{selectedLand?.location}</Text>
                    </View>
                  </View>
                </View>

                <View className="mb-3">
                  <Text className="text-black mb-2 text-sm" style={{ fontFamily: 'Poppins_600SemiBold' }}>Verified Documents</Text>
                  <View className="flex-row flex-wrap">
                    {selectedLand?.documents.map((doc, i) => (
                      <View key={i} className="bg-black rounded-full px-3 py-1 mr-2 mb-2 flex-row items-center">
                        <FileCheck size={12} color="#FFFFFF" strokeWidth={2} />
                        <Text className="text-white text-xs ml-1" style={{ fontFamily: 'Poppins_500Medium' }}>{doc}</Text>
                      </View>
                    ))}
                  </View>
                </View>

                <View className="mb-3">
                  <Text className="text-black mb-2 text-sm" style={{ fontFamily: 'Poppins_600SemiBold' }}>Number of Plots</Text>
                  <View className="flex-row items-center">
                    <TouchableOpacity 
                      onPress={() => setPlotCount(prev => Math.max(1, parseInt(prev) - 1).toString())}
                      className="w-10 h-10 bg-gray-100 rounded-xl items-center justify-center"
                    >
                      <Text className="text-black text-xl">-</Text>
                    </TouchableOpacity>
                    <TextInput
                      className="flex-1 mx-2 bg-gray-50 rounded-xl px-3 py-2 text-center text-black text-lg"
                      style={{ fontFamily: 'JetBrainsMono_500Medium' }}
                      value={plotCount}
                      onChangeText={setPlotCount}
                      keyboardType="numeric"
                    />
                    <TouchableOpacity 
                      onPress={() => setPlotCount(prev => (parseInt(prev) + 1).toString())}
                      className="w-10 h-10 bg-gray-100 rounded-xl items-center justify-center"
                    >
                      <Text className="text-black text-xl">+</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                <View className="bg-black rounded-2xl p-3 mb-3">
                  <View className="flex-row justify-between">
                    <Text className="text-white/70 text-sm" style={{ fontFamily: 'Poppins_400Regular' }}>Total Price</Text>
                    <Text className="text-white text-lg" style={{ fontFamily: 'JetBrainsMono_500Medium' }}>
                      ₦{(((selectedLand?.pricePerPlot || 0) * parseInt(plotCount || "1")) / 1000000).toFixed(1)}M
                    </Text>
                  </View>
                </View>

                <TouchableOpacity
                  onPress={confirmLandPurchase}
                  className="bg-black rounded-full py-4 px-8 mb-3"
                >
                  <Text 
                    className="text-white text-base text-center"
                    style={{ fontFamily: 'Poppins_700Bold' }}
                  >
                    Purchase
                  </Text>
                </TouchableOpacity>

                <Text 
                  className="text-gray-500 text-xs text-center"
                  style={{ fontFamily: 'Poppins_400Regular' }}
                >
                  Our team will contact you within 24 hours
                </Text>
              </ScrollView>
            ) : (
              <View className="items-center py-8">
                <View className="w-16 h-16 bg-black rounded-full items-center justify-center mb-4">
                  <Check size={32} color="#FFFFFF" strokeWidth={2.5} />
                </View>
                <Text 
                  className="text-xl text-black mb-2 text-center"
                  style={{ fontFamily: 'Poppins_800ExtraBold' }}
                >
                  Purchase Request Sent!
                </Text>
                <Text 
                  className="text-gray-500 text-center text-sm"
                  style={{ fontFamily: 'Poppins_400Regular' }}
                >
                  Our team will contact you shortly
                </Text>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}
