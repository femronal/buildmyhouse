import { View, Text, ScrollView, TouchableOpacity, Image } from "react-native";
import { useRouter } from "expo-router";
import { MessageCircle, Calendar, DollarSign, TrendingUp, ChevronRight, FileText, File, Video, Image as ImageIcon, Music, ArrowLeft, Home } from "lucide-react-native";

const recentFiles = [
  { id: 1, name: "Foundation_Progress.pdf", type: "pdf", stage: "Foundation", time: "2 hours ago" },
  { id: 2, name: "Site_Walkthrough.mp4", type: "video", stage: "Foundation", time: "1 day ago" },
  { id: 3, name: "Concrete_Pour.jpg", type: "image", stage: "Foundation", time: "2 days ago" },
  { id: 4, name: "Inspection_Report.docx", type: "doc", stage: "Foundation", time: "3 days ago" },
  { id: 5, name: "GC_Voice_Note.mp3", type: "audio", stage: "Foundation", time: "4 days ago" },
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

export default function DashboardScreen() {
  const router = useRouter();

  return (
    <View className="flex-1 bg-white">
      <View className="pt-16 px-6 pb-4">
        <View className="flex-row items-center mb-4">
          <TouchableOpacity 
            onPress={() => router.push('/(tabs)/home')} 
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
          className="text-3xl text-black mb-1"
          style={{ fontFamily: 'Poppins_800ExtraBold' }}
        >
          Project Dashboard
        </Text>
        <Text 
          className="text-sm text-gray-500"
          style={{ fontFamily: 'Poppins_400Regular' }}
        >
          Modern Minimalist • 123 Main St
        </Text>
      </View>

      <ScrollView className="flex-1 px-6">
        {/* Current Stage Card */}
        <View className="bg-black rounded-3xl p-6 mb-6">
          <View className="flex-row justify-between items-start mb-4">
            <View className="flex-1">
              <Text 
                className="text-sm text-white/50 mb-1"
                style={{ fontFamily: 'Poppins_400Regular' }}
              >
                Current Stage
              </Text>
              <Text 
                className="text-2xl text-white mb-2"
                style={{ fontFamily: 'Poppins_700Bold' }}
              >
                Foundation
              </Text>
              <View className="bg-white/20 rounded-full px-3 py-1 self-start">
                <Text 
                  className="text-white text-xs"
                  style={{ fontFamily: 'Poppins_500Medium' }}
                >
                  In Progress
                </Text>
              </View>
            </View>
            
            {/* Radial Progress */}
            <View className="items-center">
              <View className="w-24 h-24 rounded-full border-8 border-white/20 items-center justify-center">
                <View className="w-20 h-20 rounded-full border-8 border-white border-r-transparent border-b-transparent items-center justify-center" style={{ transform: [{ rotate: '45deg' }] }}>
                  <Text 
                    className="text-2xl text-white"
                    style={{ fontFamily: 'JetBrainsMono_500Medium', transform: [{ rotate: '-45deg' }] }}
                  >
                    25%
                  </Text>
                </View>
              </View>
            </View>
          </View>

          <TouchableOpacity 
            onPress={() => router.push('/timeline')}
            className="bg-white rounded-full py-4 px-6 flex-row items-center justify-center"
          >
            <Text 
              className="text-black text-base mr-2"
              style={{ fontFamily: 'Poppins_700Bold' }}
            >
              View Timeline
            </Text>
            <ChevronRight size={20} color="#000000" strokeWidth={2} />
          </TouchableOpacity>
        </View>

        {/* Financial Summary */}
        <View className="bg-gray-50 rounded-2xl p-6 mb-6 border border-gray-200">
          <View className="flex-row items-center mb-4">
            <DollarSign size={24} color="#000000" strokeWidth={2} />
            <Text 
              className="text-xl text-black ml-2"
              style={{ fontFamily: 'Poppins_700Bold' }}
            >
              Financial Summary
            </Text>
          </View>
          
          <View className="flex-row justify-between mb-3">
            <Text 
              className="text-gray-500"
              style={{ fontFamily: 'Poppins_400Regular' }}
            >
              Total Budget
            </Text>
            <Text 
              className="text-black"
              style={{ fontFamily: 'JetBrainsMono_500Medium' }}
            >
              $285,000
            </Text>
          </View>
          
          <View className="flex-row justify-between mb-3">
            <Text 
              className="text-gray-500"
              style={{ fontFamily: 'Poppins_400Regular' }}
            >
              Spent
            </Text>
            <Text 
              className="text-black"
              style={{ fontFamily: 'JetBrainsMono_500Medium' }}
            >
              $71,250
            </Text>
          </View>
          
          <View className="flex-row justify-between">
            <Text 
              className="text-gray-500"
              style={{ fontFamily: 'Poppins_400Regular' }}
            >
              Remaining
            </Text>
            <Text 
              className="text-black"
              style={{ fontFamily: 'JetBrainsMono_500Medium' }}
            >
              $213,750
            </Text>
          </View>

          {/* Progress Bar */}
          <View className="mt-4 h-3 bg-gray-200 rounded-full overflow-hidden">
            <View className="h-full bg-black rounded-full" style={{ width: '25%' }} />
          </View>
        </View>

        {/* Upcoming Stage */}
        <View className="bg-gray-50 rounded-2xl p-6 mb-6 border border-gray-200">
          <View className="flex-row items-center mb-3">
            <Calendar size={24} color="#000000" strokeWidth={2} />
            <Text 
              className="text-xl text-black ml-2"
              style={{ fontFamily: 'Poppins_700Bold' }}
            >
              Up Next
            </Text>
          </View>
          
          <Text 
            className="text-lg text-black mb-2"
            style={{ fontFamily: 'Poppins_500Medium' }}
          >
            Framing
          </Text>
          <Text 
            className="text-gray-500"
            style={{ fontFamily: 'Poppins_400Regular' }}
          >
            Estimated start: 2 weeks
          </Text>
        </View>

        {/* Recent Files */}
        <View className="mb-6">
          <View className="flex-row items-center justify-between mb-4">
            <View className="flex-row items-center">
              <FileText size={24} color="#000000" strokeWidth={2} />
              <Text 
                className="text-xl text-black ml-2"
                style={{ fontFamily: 'Poppins_700Bold' }}
              >
                Recent Files
              </Text>
            </View>
            <TouchableOpacity>
              <Text 
                className="text-black"
                style={{ fontFamily: 'Poppins_500Medium' }}
              >
                View All
              </Text>
            </TouchableOpacity>
          </View>
          
          {recentFiles.map((file) => (
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
                  {file.stage} • {file.time}
                </Text>
              </View>
              <ChevronRight size={20} color="#A3A3A3" strokeWidth={2} />
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {/* Floating Chat Button */}
      <TouchableOpacity 
        onPress={() => router.push('/chat')}
        className="absolute bottom-8 right-6 bg-black rounded-full p-5"
      >
        <MessageCircle size={28} color="#FFFFFF" strokeWidth={2} />
      </TouchableOpacity>
    </View>
  );
}
