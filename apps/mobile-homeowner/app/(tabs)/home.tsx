import { View, Text, ScrollView, TouchableOpacity, Image, Dimensions, Modal, TextInput, useWindowDimensions, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { User, Bell, Plus, ChevronRight, MapPin, Home, X, Check, LandPlot, FileCheck, Clock, DollarSign, Bed, Bath, Maximize, Shield, Car } from "lucide-react-native";
import { useState, useCallback, useEffect } from "react";
import { useQueryClient } from '@tanstack/react-query';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useActiveProjects, usePendingProjects } from '@/hooks';
import { useCreatePaymentIntent } from '@/hooks/usePayment';
import { useActivateProject } from '@/hooks';
import PaymentModal from '@/components/PaymentModal';

const projectImages = {
  1: [
    { url: "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=600&q=80", label: "Exterior" },
    { url: "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=600&q=80", label: "Living Room" },
    { url: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=600&q=80", label: "Kitchen" },
    { url: "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=600&q=80", label: "Bedroom" },
    { url: "https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?w=600&q=80", label: "Bathroom" },
  ],
};

// Mock data removed - using real data from API

const homesForSale = [
  {
    id: 1,
    name: "Luxury Modern Villa",
    location: "Victoria Island, Lagos",
    price: 285000,
    bedrooms: 4,
    bathrooms: 3,
    squareFootage: 2800,
    squareMeters: 260,
    propertyType: "Detached House",
    yearBuilt: 2020,
    condition: "Move-in Ready",
    parking: 2,
    image: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=600&q=80",
    description: "Beautifully designed modern villa in prime Victoria Island location. Fully furnished with premium finishes and smart home features.",
    documents: ["Title Deed", "Survey Plan", "Building Approval"],
    amenities: ["24/7 Security", "Swimming Pool", "Garden", "Gym", "Parking"],
    nearbyFacilities: ["Schools: 2km", "Shopping: 1.5km", "Hospital: 3km"],
    contactName: "John Real Estate",
    contactPhone: "+234 801 234 5678",
  },
  {
    id: 2,
    name: "Contemporary Family Home",
    location: "Lekki Phase 1, Lagos",
    price: 195000,
    bedrooms: 3,
    bathrooms: 2,
    squareFootage: 2200,
    squareMeters: 204,
    propertyType: "Semi-Detached",
    yearBuilt: 2019,
    condition: "Newly Renovated",
    parking: 2,
    image: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=600&q=80",
    description: "Spacious family home in a secure gated community. Recently renovated with modern kitchen and bathrooms. Perfect for families.",
    documents: ["Title Deed", "Survey Plan", "C of O"],
    amenities: ["Gated Community", "24/7 Security", "Playground", "Parking"],
    nearbyFacilities: ["Schools: 1km", "Market: 2km", "Beach: 5km"],
    contactName: "Sarah Properties",
    contactPhone: "+234 802 345 6789",
  },
  {
    id: 3,
    name: "Elegant Townhouse",
    location: "Ikoyi, Lagos",
    price: 425000,
    bedrooms: 5,
    bathrooms: 4,
    squareFootage: 3500,
    squareMeters: 325,
    propertyType: "Townhouse",
    yearBuilt: 2021,
    condition: "Move-in Ready",
    parking: 3,
    image: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=600&q=80",
    description: "Luxury townhouse in exclusive Ikoyi neighborhood. Features include private pool, home office, and rooftop terrace with city views.",
    documents: ["Title Deed", "Survey Plan", "Building Approval", "C of O"],
    amenities: ["Private Pool", "Rooftop Terrace", "Home Office", "24/7 Security", "Gym"],
    nearbyFacilities: ["International Schools: 2km", "Shopping Mall: 1km", "Hospital: 3km"],
    contactName: "Elite Realty",
    contactPhone: "+234 803 456 7890",
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
  const { data: currentUser, isLoading: userLoading } = useCurrentUser();
  const { data: activeProjects = [], isLoading: loadingActive } = useActiveProjects();
  const { data: pendingProjects = [], isLoading: loadingPending } = usePendingProjects();
  const createPaymentIntentMutation = useCreatePaymentIntent();
  const activateProjectMutation = useActivateProject();
  const queryClient = useQueryClient();
  
  const [activeImageIndex, setActiveImageIndex] = useState<{[key: string]: number}>({});
  const [showBuyModal, setShowBuyModal] = useState(false);
  const [selectedHome, setSelectedHome] = useState<typeof homesForSale[0] | null>(null);
  const [buySuccess, setBuySuccess] = useState(false);
  const [showLandModal, setShowLandModal] = useState(false);
  const [selectedLand, setSelectedLand] = useState<typeof landedProperties[0] | null>(null);
  const [plotCount, setPlotCount] = useState("1");
  const [landSuccess, setLandSuccess] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedProjectForPayment, setSelectedProjectForPayment] = useState<any>(null);
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [projectBudget, setProjectBudget] = useState<number>(0);
  const [paymentClientSecret, setPaymentClientSecret] = useState<string | null>(null);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  
  const userName = currentUser?.fullName || 'User';
  const userPicture = currentUser?.pictureUrl;
  
  // Combine active and pending projects for display, ensuring no duplicates
  // IMPORTANT: Use actual project.status to determine if paid, not just which array it came from
  const activeProjectsWithStatus = activeProjects.map((p: any) => ({ 
    ...p, 
    // Only mark as paid if status is actually 'active'
    isPaid: p.status === 'active',
    uniqueKey: `active-${p.id || p.projectId || Math.random()}`
  }));
  const pendingProjectsWithStatus = pendingProjects.map((p: any) => ({ 
    ...p, 
    // Only mark as unpaid if status is actually 'pending_payment'
    isPaid: p.status === 'active', // Check actual status, not array source
    uniqueKey: `pending-${p.id || p.projectId || Math.random()}`
  }));
  
  // Filter out duplicates by project ID (in case a project appears in both arrays)
  // Prefer the one with status='active' if there's a conflict
  const projectIds = new Set<string>();
  const allProjects = [
    ...activeProjectsWithStatus,
    ...pendingProjectsWithStatus,
  ].filter((project: any) => {
    const projectId = project.id || project.projectId;
    if (!projectId) return false; // Skip projects without IDs
    if (projectIds.has(projectId)) {
      // If duplicate, prefer the one with status='active'
      return false;
    }
    projectIds.add(projectId);
    return true;
  }).map((project: any) => {
    // Ensure isPaid is based on actual status, not array source
    return {
      ...project,
      isPaid: project.status === 'active'
    };
  });

  const handleImageScroll = useCallback((projectId: string, event: any) => {
    const contentOffset = event.nativeEvent.contentOffset.x;
    const imageWidth = event.nativeEvent.layoutMeasurement.width;
    const index = Math.round(contentOffset / imageWidth);
    setActiveImageIndex(prev => ({ ...prev, [projectId]: index }));
  }, []);

  const handleProjectPress = async (project: any) => {
    if (project.isPaid) {
      // Active project - go to dashboard
      router.push(`/dashboard?projectId=${project.id || project.projectId}`);
    } else {
      // Unpaid project - show payment modal
      const budget = project.budget || project.acceptedRequest?.estimatedBudget || project.gcEditedAnalysis?.budget || 0;
      let amount = budget * 1.0;
      
      // Stripe maximum amount is $999,999.99 (in dollars, not cents)
      const STRIPE_MAX_AMOUNT = 999999.99;
      if (amount > STRIPE_MAX_AMOUNT) {
        setPaymentError(`Payment amount ($${amount.toLocaleString()}) exceeds the maximum allowed amount of $${STRIPE_MAX_AMOUNT.toLocaleString()}. Please contact support.`);
        setShowPaymentModal(true);
        setIsProcessingPayment(false);
        return;
      }
      
      if (amount <= 0) {
        return;
      }

      setSelectedProjectForPayment(project);
      setPaymentAmount(amount);
      setProjectBudget(budget);
      setPaymentClientSecret(null);
      setIsProcessingPayment(true);
      setShowPaymentModal(true);
      setPaymentError(null);

      try {
        const paymentResult = await createPaymentIntentMutation.mutateAsync({
          amount,
          projectId: project.id || project.projectId,
          currency: 'usd',
          description: `Project activation payment - ${project.name || 'Project'}`,
        });

        if (paymentResult?.paymentIntent?.clientSecret) {
          setPaymentClientSecret(paymentResult.paymentIntent.clientSecret);
          setIsProcessingPayment(false);
        } else {
          setPaymentError('Payment intent created but no client secret received.');
          setIsProcessingPayment(false);
        }
      } catch (error: any) {
        setPaymentError(error?.message || 'Failed to create payment intent');
        setIsProcessingPayment(false);
      }
    }
  };

  const handlePaymentSuccess = async () => {
    if (!selectedProjectForPayment) return;

    try {
      await activateProjectMutation.mutateAsync(selectedProjectForPayment.id || selectedProjectForPayment.projectId);
      
      // Invalidate all project queries to ensure UI updates
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['projects', 'active'] });
      queryClient.invalidateQueries({ queryKey: ['projects', 'pending'] });
      
      setShowPaymentModal(false);
      setSelectedProjectForPayment(null);
      router.push(`/dashboard?projectId=${selectedProjectForPayment.id || selectedProjectForPayment.projectId}`);
    } catch (error: any) {
      setPaymentError(error?.message || 'Failed to activate project');
    }
  };

  const handlePaymentError = (error: string) => {
    setPaymentError(error);
    setIsProcessingPayment(false);
  };

  const handleBuyHome = (home: typeof homesForSale[0]) => {
    setSelectedHome(home);
    setBuySuccess(false);
    setShowBuyModal(true);
  };

  const confirmBuyHome = () => {
    // In the future, this will handle the purchase flow
    setBuySuccess(true);
    setTimeout(() => {
      setShowBuyModal(false);
      setBuySuccess(false);
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
      <View className="pt-16 px-6 pb-4 flex-row items-center justify-between">
        <TouchableOpacity 
          onPress={() => router.push('/profile')}
          className="w-12 h-12 bg-black rounded-full items-center justify-center overflow-hidden"
        >
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
        
        <Text 
          className="text-2xl text-black"
          style={{ fontFamily: 'Poppins_600SemiBold' }}
        >
          BuildMyHouse
        </Text>
        
        <TouchableOpacity 
          onPress={() => router.push('/notifications')}
          className="w-12 h-12 bg-gray-100 rounded-full items-center justify-center"
        >
          <Bell size={24} color="#000000" strokeWidth={2.5} />
          <View className="absolute top-2 right-2 w-3 h-3 bg-black rounded-full" />
        </TouchableOpacity>
      </View>

      <ScrollView className="flex-1 px-6" contentContainerStyle={{ paddingBottom: 100 }}>
        {/* Welcome Section */}
        <View className="mb-8">
          <Text 
            className="text-4xl text-black mb-2"
            style={{ fontFamily: 'Poppins_600SemiBold' }}
          >
            Welcome back,
          </Text>
          <Text 
            className="text-4xl text-black"
            style={{ fontFamily: 'Poppins_600SemiBold' }}
          >
            {userName.split(' ')[0]} 👋
          </Text>
        </View>

        {/* Start New Project */}
        <TouchableOpacity
          onPress={() => router.push('/location?mode=explore')}
          className="bg-black rounded-3xl p-6 mb-8 flex-row items-center justify-between"
        >
          <View className="flex-1">
          <Text 
            className="text-white text-xl mb-2"
            style={{ fontFamily: 'Poppins_600SemiBold' }}
          >
            Start New Project
          </Text>
            <Text 
              className="text-white/70"
              style={{ fontFamily: 'Poppins_400Regular' }}
            >
              Build your dream home today
            </Text>
          </View>
          <View className="w-14 h-14 bg-white rounded-full items-center justify-center">
            <Plus size={28} color="#000000" strokeWidth={2.5} />
          </View>
        </TouchableOpacity>

        {/* Current Projects */}
        <View className="mb-8">
          <Text 
            className="text-2xl text-black mb-4"
            style={{ fontFamily: 'Poppins_600SemiBold' }}
          >
            Your Projects
          </Text>

          {(loadingActive || loadingPending) ? (
            <View className="bg-gray-50 rounded-3xl p-8 items-center border border-gray-200">
              <ActivityIndicator size="small" color="#000" />
              <Text className="text-gray-500 mt-2" style={{ fontFamily: 'Poppins_400Regular' }}>
                Loading projects...
              </Text>
            </View>
          ) : allProjects.length === 0 ? (
            <View className="bg-gray-50 rounded-3xl p-8 items-center border border-gray-200">
              <Text className="text-gray-500 text-center" style={{ fontFamily: 'Poppins_400Regular' }}>
                No projects yet. Start a new project to get started!
              </Text>
            </View>
          ) : (
            allProjects.map((project: any, index: number) => {
              const projectId = project.id || project.projectId || `project-${index}`;
              const uniqueKey = project.uniqueKey || `${project.isPaid ? 'active' : 'pending'}-${projectId}`;
              const isPaid = project.isPaid;
              const budget = project.budget || project.acceptedRequest?.estimatedBudget || project.gcEditedAnalysis?.budget || 0;
              const paymentAmount = budget * 1.0;
              
              return (
                <TouchableOpacity
                  key={uniqueKey}
                  onPress={() => handleProjectPress(project)}
                  className="bg-gray-50 rounded-3xl mb-4 overflow-hidden border border-gray-200"
                >
                  <View className="p-5">
                    <View className="flex-row justify-between items-start mb-3">
                      <View className="flex-1">
                        <View className="flex-row items-center mb-1">
                          <Text 
                            className="text-xl text-black"
                            style={{ fontFamily: 'Poppins_700Bold' }}
                          >
                            {project.name || 'Untitled Project'}
                          </Text>
                          <View className={`ml-2 rounded-full px-2 py-1 ${
                            isPaid ? 'bg-green-100' : 'bg-yellow-100'
                          }`}>
                            <Text 
                              className={`text-xs ${
                                isPaid ? 'text-green-700' : 'text-yellow-700'
                              }`}
                              style={{ fontFamily: 'Poppins_600SemiBold' }}
                            >
                              {isPaid ? 'Active' : 'Unpaid'}
                            </Text>
                          </View>
                        </View>
                        <View className="flex-row items-center">
                          <MapPin size={14} color="#737373" strokeWidth={2} />
                          <Text 
                            className="text-gray-500 ml-1 text-sm"
                            style={{ fontFamily: 'Poppins_400Regular' }}
                          >
                            {project.address || 'Address not available'}
                          </Text>
                        </View>
                      </View>
                      <ChevronRight size={24} color="#000000" strokeWidth={2} />
                    </View>

                    {isPaid ? (
                      <>
                        {/* Progress Bar for Active Projects */}
                        <View className="mb-3">
                          <View className="flex-row justify-between mb-2">
                            <Text 
                              className="text-black text-sm"
                              style={{ fontFamily: 'Poppins_600SemiBold' }}
                            >
                              {project.currentStage || 'In Progress'}
                            </Text>
                            <Text 
                              className="text-black"
                              style={{ fontFamily: 'JetBrainsMono_500Medium' }}
                            >
                              {project.progress || 0}%
                            </Text>
                          </View>
                          <View className="h-2 bg-gray-200 rounded-full overflow-hidden">
                            <View 
                              className="h-full bg-black rounded-full" 
                              style={{ width: `${project.progress || 0}%` }} 
                            />
                          </View>
                        </View>

                        {/* Budget Info for Active Projects */}
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
                              ${budget.toLocaleString()}
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
                              ${(project.spent || 0).toLocaleString()}
                            </Text>
                          </View>
                        </View>
                      </>
                    ) : (
                      <>
                        {/* Payment Info for Unpaid Projects */}
                        <View className="bg-yellow-50 rounded-2xl p-4 mb-3 border border-yellow-200">
                          <View className="flex-row items-center mb-2">
                            <Clock size={18} color="#d97706" strokeWidth={2} />
                            <Text 
                              className="text-yellow-900 ml-2"
                              style={{ fontFamily: 'Poppins_600SemiBold' }}
                            >
                              Payment Required
                            </Text>
                          </View>
                          <Text 
                            className="text-yellow-800 text-sm mb-2"
                            style={{ fontFamily: 'Poppins_400Regular' }}
                          >
                            GC has reviewed your project. Pay 100% to start building.
                          </Text>
                          <View className="flex-row justify-between items-center">
                            <Text 
                              className="text-yellow-900"
                              style={{ fontFamily: 'Poppins_500Medium' }}
                            >
                              Amount Due:
                            </Text>
                            <Text 
                              className="text-yellow-900 text-lg"
                              style={{ fontFamily: 'JetBrainsMono_500Medium' }}
                            >
                              ${paymentAmount.toLocaleString()}
                            </Text>
                          </View>
                        </View>
                      </>
                    )}
                  </View>
                </TouchableOpacity>
              );
            })
          )}
        </View>

        {/* Buy a Home Section */}
        <View className="mb-8">
          <View className="flex-row items-center justify-between mb-4">
            <View className="flex-row items-center">
              <Home size={24} color="#000000" strokeWidth={2.5} />
              <Text 
                className="text-2xl text-black ml-2"
                style={{ fontFamily: 'Poppins_600SemiBold' }}
              >
                Buy
              </Text>
            </View>
            <View className="bg-black rounded-full px-3 py-1">
              <Text 
                className="text-white text-xs"
                style={{ fontFamily: 'Poppins_600SemiBold' }}
              >
                Verified
              </Text>
            </View>
          </View>

          <Text 
            className="text-gray-500 mb-4"
            style={{ fontFamily: 'Poppins_400Regular' }}
          >
            Don't want to wait? Buy a move-in ready home today
          </Text>

          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {homesForSale.map((home) => (
              <TouchableOpacity
                key={home.id}
                onPress={() => handleBuyHome(home)}
                className="bg-white rounded-3xl mr-4 overflow-hidden border border-gray-200"
                style={{ width: Math.min(280, screenWidth * 0.75) }}
              >
                <Image
                  source={{ uri: home.image }}
                  className="w-full h-32"
                  resizeMode="cover"
                />
                <View className="p-3">
                  <Text 
                    className="text-base text-black mb-1"
                    style={{ fontFamily: 'Poppins_600SemiBold' }}
                    numberOfLines={1}
                  >
                    {home.name}
                  </Text>
                  <View className="flex-row items-center mb-2">
                    <MapPin size={12} color="#737373" strokeWidth={2} />
                    <Text 
                      className="text-gray-500 ml-1 text-xs"
                      style={{ fontFamily: 'Poppins_400Regular' }}
                    >
                      {home.location}
                    </Text>
                  </View>

                  <View className="flex-row items-center mb-2">
                    <Bed size={12} color="#737373" strokeWidth={2} />
                    <Text className="text-gray-500 ml-1 mr-2 text-xs" style={{ fontFamily: 'Poppins_400Regular' }}>
                      {home.bedrooms}
                    </Text>
                    <Bath size={12} color="#737373" strokeWidth={2} />
                    <Text className="text-gray-500 ml-1 mr-2 text-xs" style={{ fontFamily: 'Poppins_400Regular' }}>
                      {home.bathrooms}
                    </Text>
                    <Maximize size={12} color="#737373" strokeWidth={2} />
                    <Text className="text-gray-500 ml-1 text-xs" style={{ fontFamily: 'Poppins_400Regular' }}>
                      {home.squareMeters}m²
                    </Text>
                  </View>

                  <View className="flex-row justify-between items-center">
                    <Text className="text-black text-base" style={{ fontFamily: 'JetBrainsMono_500Medium' }}>
                      ${home.price.toLocaleString()}
                    </Text>
                    <View className="bg-green-100 rounded-full px-2 py-0.5">
                      <Text className="text-green-700 text-xs" style={{ fontFamily: 'Poppins_600SemiBold' }}>
                        {home.condition}
                      </Text>
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Landed Properties Section */}
        <View className="mb-8">
          <View className="flex-row items-center justify-between mb-4">
            <View className="flex-row items-center">
              <LandPlot size={24} color="#000000" strokeWidth={2.5} />
              <Text 
                className="text-2xl text-black ml-2"
                style={{ fontFamily: 'Poppins_600SemiBold' }}
              >
                Land for Sale
              </Text>
            </View>
            <View className="bg-black rounded-full px-3 py-1">
              <Text 
                className="text-white text-xs"
                style={{ fontFamily: 'Poppins_600SemiBold' }}
              >
                C of O
              </Text>
            </View>
          </View>

          <Text 
            className="text-gray-500 mb-4"
            style={{ fontFamily: 'Poppins_400Regular' }}
          >
            Verified estates with all legal documents
          </Text>

          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {landedProperties.map((land) => (
              <TouchableOpacity
                key={land.id}
                onPress={() => handleLandPurchase(land)}
                className="bg-white rounded-3xl mr-4 overflow-hidden border border-gray-200"
                style={{ width: Math.min(280, screenWidth * 0.75) }}
              >
                <Image
                  source={{ uri: land.image }}
                  className="w-full h-32"
                  resizeMode="cover"
                />
                <View className="p-3">
                  <Text 
                    className="text-base text-black mb-1"
                    style={{ fontFamily: 'Poppins_600SemiBold' }}
                    numberOfLines={1}
                  >
                    {land.name}
                  </Text>
                  <View className="flex-row items-center mb-2">
                    <MapPin size={12} color="#737373" strokeWidth={2} />
                    <Text 
                      className="text-gray-500 ml-1 text-xs"
                      style={{ fontFamily: 'Poppins_400Regular' }}
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
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </ScrollView>

      {/* Buy Home Modal */}
      <Modal
        visible={showBuyModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowBuyModal(false)}
      >
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-white rounded-t-3xl p-6 max-h-[90%]">
            <View className="w-12 h-1 bg-gray-300 rounded-full self-center mb-6" />
            
            {!buySuccess ? (
              <ScrollView showsVerticalScrollIndicator={false}>
                <View className="flex-row justify-between items-start mb-4">
                  <Text 
                    className="text-2xl text-black flex-1"
                    style={{ fontFamily: 'Poppins_600SemiBold' }}
                  >
                    {selectedHome?.name}
                  </Text>
                  <TouchableOpacity onPress={() => setShowBuyModal(false)}>
                    <X size={24} color="#000000" strokeWidth={2} />
                  </TouchableOpacity>
                </View>

                <Image
                  source={{ uri: selectedHome?.image }}
                  className="w-full h-48 rounded-2xl mb-4"
                  resizeMode="cover"
                />

                <Text 
                  className="text-gray-600 mb-4"
                  style={{ fontFamily: 'Poppins_400Regular' }}
                >
                  {selectedHome?.description}
                </Text>

                {/* Key Details */}
                <View className="bg-gray-50 rounded-2xl p-4 mb-4 border border-gray-200">
                  <View className="flex-row justify-between mb-3">
                    <View className="flex-row items-center">
                      <Bed size={18} color="#737373" strokeWidth={2} />
                      <Text className="text-black ml-2" style={{ fontFamily: 'Poppins_600SemiBold' }}>
                        {selectedHome?.bedrooms} Bedrooms
                      </Text>
                    </View>
                    <View className="flex-row items-center">
                      <Bath size={18} color="#737373" strokeWidth={2} />
                      <Text className="text-black ml-2" style={{ fontFamily: 'Poppins_600SemiBold' }}>
                        {selectedHome?.bathrooms} Bathrooms
                      </Text>
                    </View>
                  </View>
                  <View className="flex-row justify-between">
                    <View className="flex-row items-center">
                      <Maximize size={18} color="#737373" strokeWidth={2} />
                      <Text className="text-black ml-2" style={{ fontFamily: 'Poppins_600SemiBold' }}>
                        {selectedHome?.squareMeters}m²
                      </Text>
                    </View>
                    <View className="flex-row items-center">
                      <Car size={18} color="#737373" strokeWidth={2} />
                      <Text className="text-black ml-2" style={{ fontFamily: 'Poppins_600SemiBold' }}>
                        {selectedHome?.parking} Parking
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Property Info */}
                <View className="bg-gray-50 rounded-2xl p-4 mb-4 border border-gray-200">
                  <Text className="text-black mb-3" style={{ fontFamily: 'Poppins_600SemiBold' }}>
                    Property Details
                  </Text>
                  <View className="space-y-2">
                    <View className="flex-row justify-between">
                      <Text className="text-gray-500 text-sm" style={{ fontFamily: 'Poppins_400Regular' }}>Property Type</Text>
                      <Text className="text-black text-sm" style={{ fontFamily: 'Poppins_500Medium' }}>{selectedHome?.propertyType}</Text>
                    </View>
                    <View className="flex-row justify-between">
                      <Text className="text-gray-500 text-sm" style={{ fontFamily: 'Poppins_400Regular' }}>Year Built</Text>
                      <Text className="text-black text-sm" style={{ fontFamily: 'Poppins_500Medium' }}>{selectedHome?.yearBuilt}</Text>
                    </View>
                    <View className="flex-row justify-between">
                      <Text className="text-gray-500 text-sm" style={{ fontFamily: 'Poppins_400Regular' }}>Condition</Text>
                      <Text className="text-black text-sm" style={{ fontFamily: 'Poppins_500Medium' }}>{selectedHome?.condition}</Text>
                    </View>
                  </View>
                </View>

                {/* Documents */}
                {selectedHome?.documents && selectedHome.documents.length > 0 && (
                  <View className="mb-4">
                    <Text className="text-black mb-2" style={{ fontFamily: 'Poppins_600SemiBold' }}>
                      Documents Available
                    </Text>
                    <View className="flex-row flex-wrap">
                      {selectedHome.documents.map((doc, i) => (
                        <View key={i} className="bg-gray-100 rounded-full px-3 py-1 mr-2 mb-2">
                          <Text className="text-black text-xs" style={{ fontFamily: 'Poppins_500Medium' }}>{doc}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                )}

                {/* Amenities */}
                {selectedHome?.amenities && selectedHome.amenities.length > 0 && (
                  <View className="mb-4">
                    <Text className="text-black mb-2" style={{ fontFamily: 'Poppins_600SemiBold' }}>
                      Amenities
                    </Text>
                    <View className="flex-row flex-wrap">
                      {selectedHome.amenities.map((amenity, i) => (
                        <View key={i} className="bg-gray-100 rounded-full px-3 py-1 mr-2 mb-2">
                          <Text className="text-black text-xs" style={{ fontFamily: 'Poppins_500Medium' }}>{amenity}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                )}

                {/* Nearby Facilities */}
                {selectedHome?.nearbyFacilities && selectedHome.nearbyFacilities.length > 0 && (
                  <View className="mb-4">
                    <Text className="text-black mb-2" style={{ fontFamily: 'Poppins_600SemiBold' }}>
                      Nearby Facilities
                    </Text>
                    {selectedHome.nearbyFacilities.map((facility, i) => (
                      <Text key={i} className="text-gray-600 text-sm mb-1" style={{ fontFamily: 'Poppins_400Regular' }}>
                        • {facility}
                      </Text>
                    ))}
                  </View>
                )}

                {/* Price */}
                <View className="bg-black rounded-2xl p-4 mb-4">
                  <View className="flex-row justify-between items-center">
                    <Text className="text-white/70 text-sm" style={{ fontFamily: 'Poppins_400Regular' }}>Price</Text>
                    <Text className="text-white text-2xl" style={{ fontFamily: 'JetBrainsMono_500Medium' }}>
                      ${selectedHome?.price.toLocaleString()}
                    </Text>
                  </View>
                </View>

                {/* Contact Info */}
                <View className="bg-gray-50 rounded-2xl p-4 mb-4 border border-gray-200">
                  <Text className="text-black mb-2" style={{ fontFamily: 'Poppins_600SemiBold' }}>
                    Contact for Viewing
                  </Text>
                  <Text className="text-black text-sm mb-1" style={{ fontFamily: 'Poppins_500Medium' }}>
                    {selectedHome?.contactName}
                  </Text>
                  <Text className="text-gray-600 text-sm" style={{ fontFamily: 'Poppins_400Regular' }}>
                    {selectedHome?.contactPhone}
                  </Text>
                </View>

                <TouchableOpacity
                  onPress={confirmBuyHome}
                  className="bg-black rounded-full py-5 px-8 mb-4"
                >
                  <Text 
                    className="text-white text-lg text-center"
                    style={{ fontFamily: 'Poppins_600SemiBold' }}
                  >
                    Schedule Viewing
                  </Text>
                </TouchableOpacity>

                <Text 
                  className="text-gray-500 text-xs text-center"
                  style={{ fontFamily: 'Poppins_400Regular' }}
                >
                  Contact the seller to schedule a viewing or make an offer
                </Text>
              </ScrollView>
            ) : (
              <View className="items-center py-8">
                <View className="w-16 h-16 bg-black rounded-full items-center justify-center mb-4">
                  <Check size={32} color="#FFFFFF" strokeWidth={2.5} />
                </View>
                  <Text 
                    className="text-xl text-black mb-2 text-center"
                    style={{ fontFamily: 'Poppins_600SemiBold' }}
                  >
                    Viewing Scheduled!
                  </Text>
                <Text 
                  className="text-gray-500 text-center text-sm"
                  style={{ fontFamily: 'Poppins_400Regular' }}
                >
                  The seller will contact you soon to confirm details
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
                    style={{ fontFamily: 'Poppins_600SemiBold' }}
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

                <View className="bg-gray-50 rounded-2xl p-3 mb-3 border border-gray-200">
                  <View className="flex-row justify-between mb-2">
                    <View>
                      <Text className="text-gray-500 text-xs" style={{ fontFamily: 'Poppins_400Regular' }}>Price/Plot</Text>
                      <Text className="text-black text-lg" style={{ fontFamily: 'JetBrainsMono_500Medium' }}>₦{((selectedLand?.pricePerPlot || 0) / 1000000).toFixed(1)}M</Text>
                    </View>
                    <View>
                      <Text className="text-gray-500 text-xs" style={{ fontFamily: 'Poppins_400Regular' }}>Plot Size</Text>
                      <Text className="text-black text-lg" style={{ fontFamily: 'Poppins_600SemiBold' }}>{selectedLand?.plotSize}</Text>
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
                    style={{ fontFamily: 'Poppins_600SemiBold' }}
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
                    style={{ fontFamily: 'Poppins_600SemiBold' }}
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

      {/* Payment Modal */}
      <PaymentModal
        visible={showPaymentModal}
        onClose={() => {
          setShowPaymentModal(false);
          setIsProcessingPayment(false);
          setPaymentClientSecret(null);
          setPaymentError(null);
          setSelectedProjectForPayment(null);
        }}
        amount={paymentAmount}
        projectBudget={projectBudget}
        projectName={selectedProjectForPayment?.name || 'Project'}
        onPaymentSuccess={handlePaymentSuccess}
        onPaymentError={handlePaymentError}
        clientSecret={paymentClientSecret || undefined}
        externalError={paymentError || undefined}
      />
    </View>
  );
}
