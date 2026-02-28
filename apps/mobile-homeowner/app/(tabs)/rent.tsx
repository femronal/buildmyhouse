import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  Modal,
  useWindowDimensions,
  TextInput,
  Animated,
  NativeSyntheticEvent,
  NativeScrollEvent,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import {
  User,
  Filter,
  Search,
  Heart,
  Home,
  Building2,
  MapPin,
  Bed,
  Bath,
  Maximize,
  X,
  Check,
  FileCheck,
  Zap,
  Droplets,
  Shield,
  Wifi,
  Car,
  Lock,
  Clock,
} from "lucide-react-native";
import { useMemo, useRef, useState } from "react";
import ImageCarousel from '@/components/ImageCarousel';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useRentalsForLease } from '@/hooks/useRentalsForLease';
import { useRequestRentalInspection } from '@/hooks/useRentalInspection';
import { getBackendAssetUrl } from '@/lib/image';
import NotificationBell from '@/components/NotificationBell';

type RentalListing = {
  id: string;
  title: string;
  propertyType: string;
  location: string;
  annualRent: number;
  serviceCharge: number;
  cautionDeposit: number;
  legalFeePercent: number;
  agencyFeePercent: number;
  bedrooms: number;
  bathrooms: number;
  sizeSqm: number;
  furnishing?: string | null;
  paymentPattern?: string | null;
  power?: string | null;
  water?: string | null;
  internet?: string | null;
  parking?: string | null;
  security?: string | null;
  rules?: string | null;
  inspectionWindow?: string | null;
  verificationDocs: string[];
  images: { id?: string; url: string; label?: string | null; order?: number }[];
};

const formatNaira = (amount: number) => `₦${amount.toLocaleString()}`;

const rentalFilterTags = [
  'All',
  'Under ₦3M/yr',
  '₦3M-₦7M/yr',
  'Above ₦7M/yr',
  '1 Bedroom',
  '2 Bedrooms',
  '3+ Bedrooms',
  'Furnished',
  'Semi-furnished',
  'Unfurnished',
  'High Security',
  '2+ Parking',
];

export default function RentScreen() {
  const router = useRouter();
  const { width: screenWidth } = useWindowDimensions();
  const { data: currentUser } = useCurrentUser();
  const { data: rentalsForLease = [] } = useRentalsForLease();
  const requestInspectionMutation = useRequestRentalInspection();
  const userPicture = currentUser?.pictureUrl;

  const [favorites, setFavorites] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [activeFilter, setActiveFilter] = useState('All');
  const [activeTab, setActiveTab] = useState<'all' | 'house' | 'apartment'>('all');

  const [showRentModal, setShowRentModal] = useState(false);
  const [selectedRent, setSelectedRent] = useState<RentalListing | null>(null);
  const [rentRequestSuccess, setRentRequestSuccess] = useState(false);

  const filterAnim = useRef(new Animated.Value(0)).current;
  const lastScrollY = useRef(0);

  const cardWidth = (screenWidth - 48 - 12) / 2;

  const filterHeight = filterAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 60],
  });
  const filterOpacity = filterAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  const toggleFilters = () => {
    const toValue = showFilters ? 0 : 1;
    Animated.timing(filterAnim, {
      toValue,
      duration: 300,
      useNativeDriver: false,
    }).start();
    setShowFilters(!showFilters);
  };

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const currentScrollY = event.nativeEvent.contentOffset.y;
    if (currentScrollY > lastScrollY.current && currentScrollY > 40 && showFilters) {
      Animated.timing(filterAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: false,
      }).start();
      setShowFilters(false);
    }
    lastScrollY.current = currentScrollY;
  };

  const matchesFilter = (listing: RentalListing, filter: string) => {
    switch (filter) {
      case 'Under ₦3M/yr':
        return listing.annualRent < 3_000_000;
      case '₦3M-₦7M/yr':
        return listing.annualRent >= 3_000_000 && listing.annualRent <= 7_000_000;
      case 'Above ₦7M/yr':
        return listing.annualRent > 7_000_000;
      case '1 Bedroom':
        return listing.bedrooms === 1;
      case '2 Bedrooms':
        return listing.bedrooms === 2;
      case '3+ Bedrooms':
        return listing.bedrooms >= 3;
      case 'Furnished':
      case 'Semi-furnished':
      case 'Unfurnished':
        return String(listing.furnishing || '') === filter;
      case 'High Security':
        return /24\/7|cctv|guard|patrol|access control/i.test(String(listing.security || ''));
      case '2+ Parking':
        return /[2-9]/.test(String(listing.parking || ''));
      default:
        return true;
    }
  };

  const filteredListings = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return rentalsForLease.filter((listing: any) => {
      const type = String(listing.propertyType || '').toLowerCase();
      const tabMatch =
        activeTab === 'all' ||
        (activeTab === 'house' && type === 'house') ||
        (activeTab === 'apartment' && type === 'apartment');
      const queryMatch =
        !query ||
        listing.title.toLowerCase().includes(query) ||
        listing.location.toLowerCase().includes(query) ||
        String(listing.propertyType || '').toLowerCase().includes(query) ||
        String(listing.furnishing || '').toLowerCase().includes(query);
      const filterMatch = matchesFilter(listing, activeFilter);
      return tabMatch && queryMatch && filterMatch;
    });
  }, [activeTab, searchQuery, activeFilter, rentalsForLease]);

  const toggleFavorite = (id: string) => {
    setFavorites((prev) => (prev.includes(id) ? prev.filter((v) => v !== id) : [...prev, id]));
  };

  const openRentModal = (listing: RentalListing) => {
    setSelectedRent(listing);
    setRentRequestSuccess(false);
    setShowRentModal(true);
  };

  const requestRentInspection = async () => {
    if (!selectedRent?.id) return;
    try {
      await requestInspectionMutation.mutateAsync(selectedRent.id);
      setRentRequestSuccess(true);
      setTimeout(() => {
        setShowRentModal(false);
        setRentRequestSuccess(false);
      }, 2000);
    } catch (error: any) {
      Alert.alert('Request failed', error?.message || 'Could not request inspection. Please try again.');
    }
  };

  return (
    <View className="flex-1 bg-white">
      <View className="pt-16 px-6 pb-4 flex-row items-center justify-between">
        <TouchableOpacity
          onPress={() => router.push('/profile')}
          className="w-12 h-12 bg-black rounded-full items-center justify-center overflow-hidden"
        >
          {userPicture ? (
            <Image source={{ uri: getBackendAssetUrl(userPicture) }} className="w-full h-full" resizeMode="cover" />
          ) : (
            <User size={24} color="#FFFFFF" strokeWidth={2.5} />
          )}
        </TouchableOpacity>

        <Text className="text-2xl text-black" style={{ fontFamily: 'Poppins_600SemiBold' }}>
          Rent
        </Text>

        <NotificationBell />
      </View>

      <View className="px-6 mb-4">
        <View className="flex-row items-center">
          <View className="flex-1 bg-gray-100 rounded-2xl px-4 py-4 flex-row items-center mr-3">
            <Search size={20} color="#737373" strokeWidth={2} />
            <TextInput
              placeholder="Search rentals, areas, and budgets..."
              placeholderTextColor="#737373"
              value={searchQuery}
              onChangeText={setSearchQuery}
              className="flex-1 ml-3 text-gray-900"
              style={{ fontFamily: 'Poppins_400Regular' }}
            />
          </View>
          <TouchableOpacity
            onPress={toggleFilters}
            className={`w-12 h-12 rounded-full items-center justify-center ${showFilters ? 'bg-gray-200' : 'bg-gray-100'}`}
          >
            <Filter size={22} color="#000000" strokeWidth={2.5} />
          </TouchableOpacity>
        </View>
      </View>

      <View className="px-6 mb-4">
        <View className="flex-row bg-gray-100 rounded-2xl p-1">
          <TouchableOpacity
            onPress={() => setActiveTab('all')}
            className={`flex-1 py-2.5 px-4 rounded-xl items-center ${activeTab === 'all' ? 'bg-black' : ''}`}
          >
            <Text className={`text-sm ${activeTab === 'all' ? 'text-white' : 'text-gray-600'}`} style={{ fontFamily: 'Poppins_600SemiBold' }}>
              All
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setActiveTab('house')}
            className={`flex-1 py-2.5 px-4 rounded-xl items-center ${activeTab === 'house' ? 'bg-black' : ''}`}
          >
            <Text className={`text-sm ${activeTab === 'house' ? 'text-white' : 'text-gray-600'}`} style={{ fontFamily: 'Poppins_600SemiBold' }}>
              Houses
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setActiveTab('apartment')}
            className={`flex-1 py-2.5 px-4 rounded-xl items-center ${activeTab === 'apartment' ? 'bg-black' : ''}`}
          >
            <Text className={`text-sm ${activeTab === 'apartment' ? 'text-white' : 'text-gray-600'}`} style={{ fontFamily: 'Poppins_600SemiBold' }}>
              Apartments
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <Animated.View style={{ height: filterHeight, opacity: filterOpacity, overflow: 'hidden' }}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="px-6 pb-2">
          {rentalFilterTags.map((tag) => (
            <TouchableOpacity
              key={tag}
              onPress={() => setActiveFilter(tag)}
              className={`px-4 py-2 rounded-full mr-2 ${activeFilter === tag ? 'bg-black' : 'bg-gray-100'}`}
            >
              <Text className={activeFilter === tag ? 'text-white' : 'text-black'} style={{ fontFamily: 'Poppins_500Medium', fontSize: 12 }}>
                {tag}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </Animated.View>

      <View className="px-6 mb-3">
        <TouchableOpacity onPress={toggleFilters} className="flex-row items-center">
          <Text className="text-lg text-black" style={{ fontFamily: 'Poppins_600SemiBold' }}>{activeFilter}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        className="flex-1 px-6"
        contentContainerStyle={{ paddingBottom: 110 }}
        onScroll={handleScroll}
        scrollEventThrottle={16}
      >
        {filteredListings.length === 0 ? (
          <View className="items-center justify-center py-24">
            <Text className="text-gray-500 text-center text-lg" style={{ fontFamily: 'Poppins_600SemiBold' }}>
              No rentals match this filter
            </Text>
            <Text className="text-gray-400 text-center text-sm mt-2" style={{ fontFamily: 'Poppins_400Regular' }}>
              Try changing budget, bedrooms, or furnishing filters.
            </Text>
          </View>
        ) : (
          <View className="flex-row flex-wrap justify-between pb-6">
            {filteredListings.map((listing) => (
              <TouchableOpacity
                key={listing.id}
                onPress={() => openRentModal(listing)}
                className="mb-5 bg-white rounded-3xl overflow-hidden border border-gray-200"
                style={{ width: cardWidth }}
              >
                <View className="relative">
                  <Image
                    source={{
                      uri: listing.images?.[0]?.url
                        ? getBackendAssetUrl(listing.images[0].url)
                        : 'https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=1200&q=80',
                    }}
                    className="h-36"
                    style={{ width: cardWidth }}
                    resizeMode="cover"
                  />
                  <TouchableOpacity
                    onPress={() => toggleFavorite(listing.id)}
                    className="absolute top-3 right-3 w-8 h-8 bg-white/95 rounded-full items-center justify-center"
                  >
                    <Heart
                      size={16}
                      color={favorites.includes(listing.id) ? '#EF4444' : '#737373'}
                      strokeWidth={2}
                      fill={favorites.includes(listing.id) ? '#EF4444' : 'transparent'}
                    />
                  </TouchableOpacity>
                </View>

                <View className="p-3">
                  <Text className="text-lg text-black mb-1" style={{ fontFamily: 'Poppins_700Bold' }} numberOfLines={1}>
                    {listing.title}
                  </Text>
                  <View className="flex-row items-center mb-2">
                    <MapPin size={12} color="#737373" strokeWidth={2} />
                    <Text className="text-gray-500 ml-1 text-xs" style={{ fontFamily: 'Poppins_400Regular' }} numberOfLines={1}>
                      {listing.location}
                    </Text>
                  </View>
                  <View className="flex-row items-center mb-2">
                    <Bed size={12} color="#737373" strokeWidth={2} />
                    <Text className="text-gray-500 ml-1 mr-2 text-xs" style={{ fontFamily: 'Poppins_400Regular' }}>{listing.bedrooms}</Text>
                    <Bath size={12} color="#737373" strokeWidth={2} />
                    <Text className="text-gray-500 ml-1 mr-2 text-xs" style={{ fontFamily: 'Poppins_400Regular' }}>{listing.bathrooms}</Text>
                    <Maximize size={12} color="#737373" strokeWidth={2} />
                    <Text className="text-gray-500 ml-1 text-xs" style={{ fontFamily: 'Poppins_400Regular' }}>{listing.sizeSqm}m²</Text>
                  </View>
                  <Text className="text-black text-xl" style={{ fontFamily: 'JetBrainsMono_500Medium' }}>
                    {formatNaira(listing.annualRent)}/yr
                  </Text>
                  <View className="flex-row justify-between items-center mt-1">
                    <Text className="text-gray-500 text-xs" style={{ fontFamily: 'Poppins_400Regular' }}>
                      Service: {formatNaira(listing.serviceCharge)}
                    </Text>
                    <View className="bg-emerald-100 rounded-full px-2 py-0.5">
                      <Text className="text-emerald-700 text-xs" style={{ fontFamily: 'Poppins_600SemiBold' }}>
                        {listing.propertyType}
                      </Text>
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>

      <Modal
        visible={showRentModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowRentModal(false)}
      >
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-white rounded-t-3xl p-5 max-h-[90%]">
            <View className="w-12 h-1 bg-gray-300 rounded-full self-center mb-4" />
            {!rentRequestSuccess ? (
              <ScrollView showsVerticalScrollIndicator={false}>
                <View className="flex-row justify-between items-start mb-3">
                  <Text className="text-xl text-black flex-1" style={{ fontFamily: 'Poppins_600SemiBold' }}>
                    {selectedRent?.title}
                  </Text>
                  <TouchableOpacity onPress={() => setShowRentModal(false)}>
                    <X size={24} color="#000000" strokeWidth={2} />
                  </TouchableOpacity>
                </View>

                <ImageCarousel
                  images={
                    selectedRent?.images?.length
                      ? selectedRent.images.map((img: any, index: number) => ({
                          url: getBackendAssetUrl(img.url) || img.url,
                          label: img.label || (index === 0 ? 'Exterior' : 'Interior'),
                        }))
                      : [
                          {
                            url: 'https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=1200&q=80',
                            label: 'Exterior',
                          },
                        ]
                  }
                  height={192}
                />

                <View className="bg-blue-50 border border-blue-200 rounded-2xl p-3 mt-4 mb-3">
                  <Text className="text-blue-900 text-sm" style={{ fontFamily: 'Poppins_600SemiBold' }}>
                    Listed by original homeowner only. No extra middleman apart from BuildMyHouse.
                  </Text>
                  <Text className="text-blue-800 text-xs mt-1" style={{ fontFamily: 'Poppins_400Regular' }}>
                    BuildMyHouse agency fee is fixed at 2% of annual rent.
                  </Text>
                </View>

                <View className="bg-gray-50 rounded-2xl p-3 mb-3 border border-gray-200">
                  <Text className="text-black mb-2" style={{ fontFamily: 'Poppins_600SemiBold' }}>
                    Key Rent Breakdown
                  </Text>
                  <Text className="text-gray-700 text-sm mb-1" style={{ fontFamily: 'Poppins_400Regular' }}>
                    Annual rent: {formatNaira(selectedRent?.annualRent || 0)}
                  </Text>
                  <Text className="text-gray-700 text-sm mb-1" style={{ fontFamily: 'Poppins_400Regular' }}>
                    Service charge: {formatNaira(selectedRent?.serviceCharge || 0)}
                  </Text>
                  <Text className="text-gray-700 text-sm mb-1" style={{ fontFamily: 'Poppins_400Regular' }}>
                    Caution deposit: {formatNaira(selectedRent?.cautionDeposit || 0)}
                  </Text>
                  <Text className="text-gray-700 text-sm mb-1" style={{ fontFamily: 'Poppins_400Regular' }}>
                    Legal fee: {selectedRent?.legalFeePercent || 0}%
                  </Text>
                  <Text className="text-gray-700 text-sm" style={{ fontFamily: 'Poppins_600SemiBold' }}>
                    BuildMyHouse agency fee: {selectedRent?.agencyFeePercent || 2}%
                  </Text>
                </View>

                <View className="bg-gray-50 rounded-2xl p-3 mb-3 border border-gray-200">
                  <Text className="text-black mb-2" style={{ fontFamily: 'Poppins_600SemiBold' }}>
                    Confirm these features before going renting a new home.
                  </Text>
                  {[
                    { label: `Power: ${selectedRent?.power}`, icon: Zap },
                    { label: `Water: ${selectedRent?.water}`, icon: Droplets },
                    { label: `Security: ${selectedRent?.security}`, icon: Shield },
                    { label: `Internet: ${selectedRent?.internet}`, icon: Wifi },
                    { label: `Parking: ${selectedRent?.parking}`, icon: Car },
                    { label: `Rules: ${selectedRent?.rules}`, icon: Lock },
                    { label: `Inspection window: ${selectedRent?.inspectionWindow}`, icon: Clock },
                  ].map((item) => (
                    <View key={item.label} className="flex-row items-start mb-2">
                      <View className="w-6 h-6 rounded-full bg-gray-100 items-center justify-center mr-2 mt-0.5">
                        <item.icon size={13} color="#374151" strokeWidth={2.2} />
                      </View>
                      <Text className="text-gray-700 text-sm flex-1" style={{ fontFamily: 'Poppins_400Regular' }}>
                        {item.label}
                      </Text>
                    </View>
                  ))}
                </View>

                <View className="mb-4">
                  <Text className="text-black mb-2" style={{ fontFamily: 'Poppins_600SemiBold' }}>
                    BuildMyHouse Verification Checks
                  </Text>
                  <View className="flex-row flex-wrap">
                    {(selectedRent?.verificationDocs || []).map((doc: string) => (
                      <View key={doc} className="bg-black rounded-full px-3 py-1 mr-2 mb-2 flex-row items-center">
                        <FileCheck size={12} color="#FFFFFF" strokeWidth={2} />
                        <Text className="text-white text-xs ml-1" style={{ fontFamily: 'Poppins_500Medium' }}>
                          {doc}
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>

                <TouchableOpacity
                  onPress={requestRentInspection}
                  disabled={requestInspectionMutation.isPending}
                  className="bg-black rounded-full py-4 px-8 mb-2"
                >
                  <Text className="text-white text-base text-center" style={{ fontFamily: 'Poppins_600SemiBold' }}>
                    {requestInspectionMutation.isPending ? 'Submitting...' : 'Request Inspection'}
                  </Text>
                </TouchableOpacity>
                <Text className="text-gray-500 text-xs text-center" style={{ fontFamily: 'Poppins_400Regular' }}>
                  BuildMyHouse will coordinate inspection directly with the homeowner.
                </Text>
              </ScrollView>
            ) : (
              <View className="items-center py-8">
                <View className="w-16 h-16 bg-black rounded-full items-center justify-center mb-4">
                  <Check size={32} color="#FFFFFF" strokeWidth={2.5} />
                </View>
                <Text className="text-xl text-black mb-2 text-center" style={{ fontFamily: 'Poppins_600SemiBold' }}>
                  Inspection Requested!
                </Text>
                <Text className="text-gray-500 text-center text-sm" style={{ fontFamily: 'Poppins_400Regular' }}>
                  You will receive homeowner inspection details soon.
                </Text>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

