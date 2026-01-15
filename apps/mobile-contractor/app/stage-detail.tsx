import { View, Text, ScrollView, TouchableOpacity, Image, Modal } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { ArrowLeft, Package, Users, FileText, CheckCircle, Star, File, Video, Image as ImageIcon, Music, ChevronRight, Home } from "lucide-react-native";
import { useState } from "react";

const materials = [
  { 
    name: "Premium Concrete Mix", 
    quantity: "15 cubic yards", 
    supplier: "Dangote Cement",
    rating: 4.9,
    reviews: 2341,
    image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&q=80"
  },
  { 
    name: "Rebar Steel 12mm", 
    quantity: "2000 lbs", 
    supplier: "BUA Steel",
    rating: 4.8,
    reviews: 1892,
    image: "https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?w=400&q=80"
  },
  { 
    name: "Waterproofing Membrane", 
    quantity: "500 sq ft", 
    supplier: "BuildCo Supply",
    rating: 4.7,
    reviews: 987,
    image: "https://images.unsplash.com/photo-1632759145351-1d592919f522?w=400&q=80"
  },
  { 
    name: "Gravel Base", 
    quantity: "10 tons", 
    supplier: "Local Quarry",
    rating: 4.6,
    reviews: 654,
    image: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&q=80"
  },
];

const team = [
  { 
    name: "John Smith", 
    role: "Foundation Specialist", 
    company: "Smith Concrete Co",
    rating: 4.9,
    reviews: 156,
    image: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400&q=80"
  },
  { 
    name: "Mike Johnson", 
    role: "Site Supervisor", 
    company: "BuildRight Contractors",
    rating: 4.8,
    reviews: 124,
    image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&q=80"
  },
  { 
    name: "David Williams", 
    role: "Concrete Technician", 
    company: "Smith Concrete Co",
    rating: 4.7,
    reviews: 89,
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80"
  },
];

const files = [
  { id: 1, name: "Foundation_Progress_Report.pdf", type: "pdf", date: "2 days ago" },
  { id: 2, name: "Site_Walkthrough.mp4", type: "video", date: "3 days ago" },
  { id: 3, name: "Concrete_Pour_Photo.jpg", type: "image", date: "4 days ago" },
  { id: 4, name: "Inspection_Notes.docx", type: "doc", date: "5 days ago" },
  { id: 5, name: "GC_Voice_Update.mp3", type: "audio", date: "1 week ago" },
  { id: 6, name: "Rebar_Installation.png", type: "image", date: "1 week ago" },
];

const getFileIcon = (type: string) => {
  switch (type) {
    case "pdf":
    case "doc":
      return <FileText size={20} color="#FFFFFF" strokeWidth={2} />;
    case "video":
      return <Video size={20} color="#FFFFFF" strokeWidth={2} />;
    case "image":
      return <ImageIcon size={20} color="#FFFFFF" strokeWidth={2} />;
    case "audio":
      return <Music size={20} color="#FFFFFF" strokeWidth={2} />;
    default:
      return <File size={20} color="#FFFFFF" strokeWidth={2} />;
  }
};

export default function StageDetailScreen() {
  const router = useRouter();
  const { name, status } = useLocalSearchParams();
  const [activeTab, setActiveTab] = useState<'materials' | 'team' | 'files'>('materials');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentApproved, setPaymentApproved] = useState(false);

  const isComplete = status === 'complete';
  const isInProgress = status === 'in-progress';

  const handleApprovePayment = () => {
    setPaymentApproved(true);
    setTimeout(() => {
      setShowPaymentModal(false);
      router.canGoBack() ? router.back() : router.push('/(tabs)/home');
    }, 1500);
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
          {name}
        </Text>
        <View className={`rounded-full px-3 py-1 self-start ${isComplete ? 'bg-black' : 'bg-gray-100 border border-black'}`}>
          <Text 
            className={`text-xs ${isComplete ? 'text-white' : 'text-black'}`}
            style={{ fontFamily: 'Poppins_500Medium' }}
          >
            {isComplete ? 'Complete' : 'In Progress'}
          </Text>
        </View>
      </View>

      {/* Tab Navigation */}
      <View className="flex-row px-6 mb-4">
        <TouchableOpacity
          onPress={() => setActiveTab('materials')}
          className={`flex-1 py-3 border-b-2 ${
            activeTab === 'materials' ? 'border-black' : 'border-gray-200'
          }`}
        >
          <View className="flex-row items-center justify-center">
            <Package size={20} color={activeTab === 'materials' ? '#000000' : '#A3A3A3'} strokeWidth={2} />
            <Text 
              className={`ml-2 ${activeTab === 'materials' ? 'text-black' : 'text-gray-400'}`}
              style={{ fontFamily: 'Poppins_500Medium' }}
            >
              Materials
            </Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setActiveTab('team')}
          className={`flex-1 py-3 border-b-2 ${
            activeTab === 'team' ? 'border-black' : 'border-gray-200'
          }`}
        >
          <View className="flex-row items-center justify-center">
            <Users size={20} color={activeTab === 'team' ? '#000000' : '#A3A3A3'} strokeWidth={2} />
            <Text 
              className={`ml-2 ${activeTab === 'team' ? 'text-black' : 'text-gray-400'}`}
              style={{ fontFamily: 'Poppins_500Medium' }}
            >
              Team
            </Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setActiveTab('files')}
          className={`flex-1 py-3 border-b-2 ${
            activeTab === 'files' ? 'border-black' : 'border-gray-200'
          }`}
        >
          <View className="flex-row items-center justify-center">
            <FileText size={20} color={activeTab === 'files' ? '#000000' : '#A3A3A3'} strokeWidth={2} />
            <Text 
              className={`ml-2 ${activeTab === 'files' ? 'text-black' : 'text-gray-400'}`}
              style={{ fontFamily: 'Poppins_500Medium' }}
            >
              Files
            </Text>
          </View>
        </TouchableOpacity>
      </View>

      <ScrollView className="flex-1 px-6">
        {/* Materials Tab */}
        {activeTab === 'materials' && (
          <View className="pb-32">
            {materials.map((material, index) => (
              <View key={index} className="bg-white rounded-2xl mb-4 overflow-hidden border border-gray-200">
                <View className="flex-row">
                  <Image
                    source={{ uri: material.image }}
                    className="w-24 h-24 bg-white"
                    resizeMode="cover"
                  />
                  <View className="flex-1 p-4 justify-center">
                    <Text 
                      className="text-base text-black mb-1"
                      style={{ fontFamily: 'Poppins_700Bold' }}
                    >
                      {material.name}
                    </Text>
                    <Text 
                      className="text-gray-500 text-sm mb-2"
                      style={{ fontFamily: 'Poppins_400Regular' }}
                    >
                      {material.supplier} • {material.quantity}
                    </Text>
                    <View className="flex-row items-center">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star 
                          key={star} 
                          size={14} 
                          color="#000000" 
                          strokeWidth={2} 
                          fill={star <= Math.floor(material.rating) ? "#000000" : "transparent"} 
                        />
                      ))}
                      <Text 
                        className="text-black ml-2 text-sm"
                        style={{ fontFamily: 'Poppins_600SemiBold' }}
                      >
                        {material.rating}
                      </Text>
                      <Text 
                        className="text-gray-500 ml-1 text-xs"
                        style={{ fontFamily: 'Poppins_400Regular' }}
                      >
                        ({material.reviews})
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Team Tab */}
        {activeTab === 'team' && (
          <View className="pb-32">
            {team.map((member, index) => (
              <View key={index} className="bg-white rounded-2xl mb-4 overflow-hidden border border-gray-200">
                <View className="flex-row p-4">
                  <Image
                    source={{ uri: member.image }}
                    className="w-20 h-20 rounded-2xl bg-white"
                    resizeMode="cover"
                  />
                  <View className="flex-1 ml-4 justify-center">
                    <Text 
                      className="text-lg text-black mb-1"
                      style={{ fontFamily: 'Poppins_700Bold' }}
                    >
                      {member.name}
                    </Text>
                    <Text 
                      className="text-black mb-1"
                      style={{ fontFamily: 'Poppins_500Medium' }}
                    >
                      {member.role}
                    </Text>
                    <Text 
                      className="text-gray-500 text-sm mb-2"
                      style={{ fontFamily: 'Poppins_400Regular' }}
                    >
                      {member.company}
                    </Text>
                    <View className="flex-row items-center">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star 
                          key={star} 
                          size={14} 
                          color="#000000" 
                          strokeWidth={2} 
                          fill={star <= Math.floor(member.rating) ? "#000000" : "transparent"} 
                        />
                      ))}
                      <Text 
                        className="text-black ml-2 text-sm"
                        style={{ fontFamily: 'Poppins_600SemiBold' }}
                      >
                        {member.rating}
                      </Text>
                      <Text 
                        className="text-gray-500 ml-1 text-xs"
                        style={{ fontFamily: 'Poppins_400Regular' }}
                      >
                        ({member.reviews})
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Files Tab */}
        {activeTab === 'files' && (
          <View className="pb-32">
            {files.map((file) => (
              <TouchableOpacity 
                key={file.id}
                className="bg-gray-50 rounded-2xl p-4 mb-3 flex-row items-center border border-gray-200"
              >
                <View className="w-12 h-12 bg-black rounded-xl items-center justify-center">
                  {getFileIcon(file.type)}
                </View>
                <View className="flex-1 ml-4">
                  <Text 
                    className="text-black text-base"
                    style={{ fontFamily: 'Poppins_500Medium' }}
                    numberOfLines={1}
                  >
                    {file.name}
                  </Text>
                  <Text 
                    className="text-gray-500 text-sm"
                    style={{ fontFamily: 'Poppins_400Regular' }}
                  >
                    {file.date}
                  </Text>
                </View>
                <ChevronRight size={20} color="#A3A3A3" strokeWidth={2} />
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Fixed Bottom Section */}
      <View className="absolute bottom-0 left-0 right-0 bg-white px-6 py-6 border-t border-gray-200">
        {isComplete ? (
          <View className="bg-black rounded-2xl p-5">
            <View className="flex-row items-center justify-center mb-2">
              <CheckCircle size={24} color="#FFFFFF" strokeWidth={2} fill="#FFFFFF" />
              <Text 
                className="text-white text-lg ml-2"
                style={{ fontFamily: 'Poppins_700Bold' }}
              >
                Stage Completed!
              </Text>
            </View>
            <Text 
              className="text-white/70 text-center text-sm"
              style={{ fontFamily: 'Poppins_400Regular' }}
            >
              Congratulations! This stage has been successfully completed.
            </Text>
          </View>
        ) : (
          <>
            <TouchableOpacity
              onPress={() => setShowPaymentModal(true)}
              className="bg-black rounded-full py-5 px-8"
            >
              <Text 
                className="text-white text-lg text-center"
                style={{ fontFamily: 'Poppins_700Bold' }}
              >
                Approve Payment
              </Text>
            </TouchableOpacity>
            <Text 
              className="text-gray-500 text-xs text-center mt-3"
              style={{ fontFamily: 'Poppins_400Regular' }}
            >
              Your GC will mark this stage complete
            </Text>
          </>
        )}
      </View>

      {/* Payment Modal */}
      <Modal
        visible={showPaymentModal}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setShowPaymentModal(false)}
      >
        <View className="flex-1 bg-black/50 justify-center items-center px-6">
          <View className="bg-white rounded-3xl p-8 w-full max-w-md">
            {!paymentApproved ? (
              <>
                <Text 
                  className="text-3xl text-black mb-4 text-center"
                  style={{ fontFamily: 'Poppins_800ExtraBold' }}
                >
                  Approve Payment
                </Text>
                
                <View className="bg-gray-50 rounded-2xl p-6 mb-6 border border-gray-200">
                  <View className="flex-row justify-between mb-3">
                    <Text 
                      className="text-gray-500"
                      style={{ fontFamily: 'Poppins_400Regular' }}
                    >
                      Stage
                    </Text>
                    <Text 
                      className="text-black"
                      style={{ fontFamily: 'Poppins_500Medium' }}
                    >
                      {name}
                    </Text>
                  </View>
                  
                  <View className="flex-row justify-between">
                    <Text 
                      className="text-gray-500"
                      style={{ fontFamily: 'Poppins_400Regular' }}
                    >
                      Amount
                    </Text>
                    <Text 
                      className="text-2xl text-black"
                      style={{ fontFamily: 'JetBrainsMono_500Medium' }}
                    >
                      $28,500
                    </Text>
                  </View>
                </View>

                <View className="bg-gray-50 rounded-xl p-4 mb-6 border border-gray-200">
                  <Text 
                    className="text-gray-600 text-sm text-center"
                    style={{ fontFamily: 'Poppins_400Regular' }}
                  >
                    Once payment is approved, all materials and team members will be deployed to the site ASAP.
                  </Text>
                </View>

                <TouchableOpacity
                  onPress={handleApprovePayment}
                  className="bg-black rounded-full py-5 px-8 mb-3"
                >
                  <Text 
                    className="text-white text-lg text-center"
                    style={{ fontFamily: 'Poppins_700Bold' }}
                  >
                    Confirm Payment
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
              </>
            ) : (
              <View className="items-center py-8">
                <CheckCircle size={80} color="#000000" strokeWidth={2} fill="#000000" />
                <Text 
                  className="text-2xl text-black mt-6 text-center"
                  style={{ fontFamily: 'Poppins_800ExtraBold' }}
                >
                  Payment Approved!
                </Text>
                <Text 
                  className="text-gray-500 mt-2 text-center"
                  style={{ fontFamily: 'Poppins_400Regular' }}
                >
                  Materials and team will be deployed shortly.
                </Text>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}
