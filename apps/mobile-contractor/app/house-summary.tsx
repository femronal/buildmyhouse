import { View, Text, ScrollView, TouchableOpacity, Image, Modal } from "react-native";
import { useRouter } from "expo-router";
import { ArrowLeft, Home, Bed, Bath, Maximize, ChevronDown, ChevronUp, Calendar, DollarSign, Star, Users, HardHat } from "lucide-react-native";
import { useState } from "react";

const subcontractors = [
  { name: "PowerLine Electricals", specialty: "Electrical", rating: 4.9 },
  { name: "AquaFlow Plumbing", specialty: "Plumbing", rating: 4.8 },
  { name: "CoolAir HVAC", specialty: "HVAC", rating: 4.7 },
  { name: "Smith Concrete Co", specialty: "Foundation", rating: 4.9 },
];

export default function HouseSummaryScreen() {
  const router = useRouter();
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  const handleStartBuilding = () => {
    setShowPaymentModal(true);
  };

  const handlePayment = () => {
    setShowPaymentModal(false);
    router.push('/dashboard');
  };

  return (
    <View className="flex-1 bg-white">
      <View className="pt-16 px-6 pb-4">
        <View className="flex-row items-center mb-4">
          <TouchableOpacity 
            onPress={() => router.canGoBack() ? router.back() : router.push('/(tabs)/home')} 
            className="w-10 h-10 bg-gray-100 rounded-full items-center justify-center mr-3"
          >
            <ArrowLeft size={22} color="#000000" strokeWidth={2} />
          </TouchableOpacity>
          <TouchableOpacity 
            onPress={() => router.push('/(tabs)/home')} 
            className="w-10 h-10 bg-black rounded-full items-center justify-center"
          >
            <Home size={20} color="#FFFFFF" strokeWidth={2} />
          </TouchableOpacity>
        </View>
        
        <Text 
          className="text-3xl text-black mb-2"
          style={{ fontFamily: 'Poppins_800ExtraBold' }}
        >
          Your Project
        </Text>
        <Text 
          className="text-sm text-gray-500"
          style={{ fontFamily: 'Poppins_400Regular' }}
        >
          Review your house specifications
        </Text>
      </View>

      <ScrollView className="flex-1 px-6">
        {/* Hero Card */}
        <View className="bg-gray-50 rounded-3xl p-6 mb-6 border border-gray-200">
          <Image
            source={{ uri: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&q=80" }}
            className="w-full h-48 rounded-2xl mb-6"
            resizeMode="cover"
          />
          
          <Text 
            className="text-2xl text-black mb-4"
            style={{ fontFamily: 'Poppins_700Bold' }}
          >
            Modern Minimalist
          </Text>

          {/* Specs Pills */}
          <View className="flex-row flex-wrap mb-6">
            <View className="bg-white rounded-full px-4 py-3 mr-3 mb-3 flex-row items-center border border-gray-200">
              <Bed size={18} color="#000000" strokeWidth={2} />
              <Text 
                className="text-black ml-2"
                style={{ fontFamily: 'Poppins_500Medium' }}
              >
                3 Rooms
              </Text>
            </View>
            
            <View className="bg-white rounded-full px-4 py-3 mr-3 mb-3 flex-row items-center border border-gray-200">
              <Bath size={18} color="#000000" strokeWidth={2} />
              <Text 
                className="text-black ml-2"
                style={{ fontFamily: 'Poppins_500Medium' }}
              >
                2 Baths
              </Text>
            </View>
            
            <View className="bg-white rounded-full px-4 py-3 mr-3 mb-3 flex-row items-center border border-gray-200">
              <Maximize size={18} color="#000000" strokeWidth={2} />
              <Text 
                className="text-black ml-2"
                style={{ fontFamily: 'Poppins_500Medium' }}
              >
                180 m²
              </Text>
            </View>

            <View className="bg-white rounded-full px-4 py-3 mr-3 mb-3 flex-row items-center border border-gray-200">
              <Home size={18} color="#000000" strokeWidth={2} />
              <Text 
                className="text-black ml-2"
                style={{ fontFamily: 'Poppins_500Medium' }}
              >
                2 Floors
              </Text>
            </View>
          </View>

          {/* Cost & Duration */}
          <View className="flex-row justify-between mb-4">
            <View>
              <Text 
                className="text-sm text-gray-500 mb-1"
                style={{ fontFamily: 'Poppins_400Regular' }}
              >
                Estimated Cost
              </Text>
              <Text 
                className="text-2xl text-black"
                style={{ fontFamily: 'JetBrainsMono_500Medium' }}
              >
                $285,000
              </Text>
            </View>
            
            <View>
              <Text 
                className="text-sm text-gray-500 mb-1"
                style={{ fontFamily: 'Poppins_400Regular' }}
              >
                Duration
              </Text>
              <Text 
                className="text-2xl text-black"
                style={{ fontFamily: 'JetBrainsMono_500Medium' }}
              >
                8-10 months
              </Text>
            </View>
          </View>
        </View>

        {/* GC Info Card */}
        <View className="bg-black rounded-3xl p-6 mb-4">
          <View className="flex-row items-center mb-4">
            <HardHat size={24} color="#FFFFFF" strokeWidth={2} />
            <Text 
              className="text-lg text-white ml-2"
              style={{ fontFamily: 'Poppins_700Bold' }}
            >
              Your General Contractor
            </Text>
          </View>
          
          <View className="flex-row items-center">
            <Image
              source={{ uri: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400&q=80" }}
              className="w-20 h-20 rounded-2xl"
              resizeMode="cover"
            />
            <View className="ml-4 flex-1">
              <Text 
                className="text-xl text-white mb-1"
                style={{ fontFamily: 'Poppins_700Bold' }}
              >
                John Smith
              </Text>
              <Text 
                className="text-white/70 mb-2"
                style={{ fontFamily: 'Poppins_400Regular' }}
              >
                BuildRight Contractors
              </Text>
              <View className="flex-row items-center">
                <Star size={16} color="#FFFFFF" strokeWidth={2} fill="#FFFFFF" />
                <Text 
                  className="text-white ml-1"
                  style={{ fontFamily: 'Poppins_600SemiBold' }}
                >
                  4.9
                </Text>
                <Text 
                  className="text-white/70 ml-1"
                  style={{ fontFamily: 'Poppins_400Regular' }}
                >
                  (156 reviews) • 89 projects
                </Text>
              </View>
            </View>
          </View>
          
          <View className="flex-row mt-4 pt-4 border-t border-white/20">
            <View className="flex-1">
              <Text className="text-white/70 text-xs" style={{ fontFamily: 'Poppins_400Regular' }}>Specialty</Text>
              <Text className="text-white" style={{ fontFamily: 'Poppins_500Medium' }}>Residential</Text>
            </View>
            <View className="flex-1">
              <Text className="text-white/70 text-xs" style={{ fontFamily: 'Poppins_400Regular' }}>Experience</Text>
              <Text className="text-white" style={{ fontFamily: 'Poppins_500Medium' }}>15+ years</Text>
            </View>
            <View className="flex-1">
              <Text className="text-white/70 text-xs" style={{ fontFamily: 'Poppins_400Regular' }}>Verified</Text>
              <Text className="text-white" style={{ fontFamily: 'Poppins_500Medium' }}>✓ Yes</Text>
            </View>
          </View>
        </View>

        {/* Floor Plan Accordion */}
        <TouchableOpacity 
          onPress={() => toggleSection('floorplan')}
          className="bg-gray-50 rounded-2xl p-5 mb-4 border border-gray-200"
        >
          <View className="flex-row justify-between items-center">
            <Text 
              className="text-lg text-black"
              style={{ fontFamily: 'Poppins_700Bold' }}
            >
              Floor Plan
            </Text>
            {expandedSection === 'floorplan' ? (
              <ChevronUp size={24} color="#000000" strokeWidth={2} />
            ) : (
              <ChevronDown size={24} color="#000000" strokeWidth={2} />
            )}
          </View>
          
          {expandedSection === 'floorplan' && (
            <View className="mt-4">
              <Image
                source={{ uri: "https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=800&q=80" }}
                className="w-full h-64 rounded-xl"
                resizeMode="contain"
              />
            </View>
          )}
        </TouchableOpacity>

        {/* Materials Accordion */}
        <TouchableOpacity 
          onPress={() => toggleSection('materials')}
          className="bg-gray-50 rounded-2xl p-5 mb-4 border border-gray-200"
        >
          <View className="flex-row justify-between items-center">
            <Text 
              className="text-lg text-black"
              style={{ fontFamily: 'Poppins_700Bold' }}
            >
              Materials Overview
            </Text>
            {expandedSection === 'materials' ? (
              <ChevronUp size={24} color="#000000" strokeWidth={2} />
            ) : (
              <ChevronDown size={24} color="#000000" strokeWidth={2} />
            )}
          </View>
          
          {expandedSection === 'materials' && (
            <View className="mt-4">
              {['Foundation: Concrete slab', 'Framing: Wood studs', 'Roofing: Asphalt shingles', 'Exterior: Fiber cement siding'].map((item, index) => (
                <View key={index} className="bg-white rounded-xl p-3 mb-2 border border-gray-200">
                  <Text 
                    className="text-black"
                    style={{ fontFamily: 'Poppins_400Regular' }}
                  >
                    {item}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </TouchableOpacity>

        {/* Subcontractors Accordion */}
        <TouchableOpacity 
          onPress={() => toggleSection('subcontractors')}
          className="bg-gray-50 rounded-2xl p-5 mb-6 border border-gray-200"
        >
          <View className="flex-row justify-between items-center">
            <Text 
              className="text-lg text-black"
              style={{ fontFamily: 'Poppins_700Bold' }}
            >
              Subcontractors Overview
            </Text>
            {expandedSection === 'subcontractors' ? (
              <ChevronUp size={24} color="#000000" strokeWidth={2} />
            ) : (
              <ChevronDown size={24} color="#000000" strokeWidth={2} />
            )}
          </View>
          
          {expandedSection === 'subcontractors' && (
            <View className="mt-4">
              {subcontractors.map((sub, index) => (
                <View key={index} className="bg-white rounded-xl p-4 mb-2 flex-row items-center border border-gray-200">
                  <View className="w-10 h-10 bg-black rounded-full items-center justify-center">
                    <Users size={20} color="#FFFFFF" strokeWidth={2} />
                  </View>
                  <View className="ml-3 flex-1">
                    <Text 
                      className="text-black"
                      style={{ fontFamily: 'Poppins_600SemiBold' }}
                    >
                      {sub.name}
                    </Text>
                    <Text 
                      className="text-gray-500 text-sm"
                      style={{ fontFamily: 'Poppins_400Regular' }}
                    >
                      {sub.specialty}
                    </Text>
                  </View>
                  <View className="flex-row items-center">
                    <Star size={14} color="#000000" strokeWidth={2} fill="#000000" />
                    <Text 
                      className="text-black ml-1"
                      style={{ fontFamily: 'Poppins_600SemiBold' }}
                    >
                      {sub.rating}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          )}
        </TouchableOpacity>

        {/* Start Building Button */}
        <TouchableOpacity
          onPress={handleStartBuilding}
          className="bg-black rounded-full py-5 px-8 mb-8"
        >
          <Text 
            className="text-white text-lg text-center"
            style={{ fontFamily: 'Poppins_700Bold' }}
          >
            Start Building
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Payment Modal */}
      <Modal
        visible={showPaymentModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowPaymentModal(false)}
      >
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-white rounded-t-3xl p-6">
            <View className="w-12 h-1 bg-gray-300 rounded-full self-center mb-6" />
            
            <Text 
              className="text-3xl text-black mb-2 text-center"
              style={{ fontFamily: 'Poppins_800ExtraBold' }}
            >
              Service Charge
            </Text>
            <Text 
              className="text-gray-500 text-center mb-6"
              style={{ fontFamily: 'Poppins_400Regular' }}
            >
              Pay 50% down payment to start the building process
            </Text>

            <View className="bg-gray-50 rounded-2xl p-6 mb-6 border border-gray-200">
              <View className="flex-row justify-between mb-4">
                <Text 
                  className="text-gray-500"
                  style={{ fontFamily: 'Poppins_400Regular' }}
                >
                  Total Project Cost
                </Text>
                <Text 
                  className="text-black"
                  style={{ fontFamily: 'JetBrainsMono_500Medium' }}
                >
                  $285,000
                </Text>
              </View>
              
              <View className="flex-row justify-between mb-4">
                <Text 
                  className="text-gray-500"
                  style={{ fontFamily: 'Poppins_400Regular' }}
                >
                  Down Payment (50%)
                </Text>
                <Text 
                  className="text-black text-xl"
                  style={{ fontFamily: 'JetBrainsMono_500Medium' }}
                >
                  $142,500
                </Text>
              </View>

              <View className="border-t border-gray-200 pt-4">
                <Text 
                  className="text-gray-500 text-sm"
                  style={{ fontFamily: 'Poppins_400Regular' }}
                >
                  This payment will officially start your project and unlock your project dashboard.
                </Text>
              </View>
            </View>

            <TouchableOpacity
              onPress={handlePayment}
              className="bg-black rounded-full py-5 px-8 mb-3"
            >
              <Text 
                className="text-white text-lg text-center"
                style={{ fontFamily: 'Poppins_700Bold' }}
              >
                Pay $142,500
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setShowPaymentModal(false)}
              className="py-3"
            >
              <Text 
                className="text-gray-500 text-center"
                style={{ fontFamily: 'Poppins_500Medium' }}
              >
                Cancel
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}
