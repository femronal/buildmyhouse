import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { ArrowLeft, CheckCircle, Clock, Lock, Home } from "lucide-react-native";

const stages = [
  { id: 1, name: "Site Preparation", status: "complete", duration: "1 week" },
  { id: 2, name: "Foundation", status: "in-progress", duration: "2 weeks" },
  { id: 3, name: "Framing", status: "not-started", duration: "3 weeks" },
  { id: 4, name: "Roofing", status: "not-started", duration: "1 week" },
  { id: 5, name: "Exterior Walls", status: "not-started", duration: "2 weeks" },
  { id: 6, name: "Plumbing", status: "not-started", duration: "2 weeks" },
  { id: 7, name: "Electrical", status: "not-started", duration: "2 weeks" },
  { id: 8, name: "HVAC", status: "not-started", duration: "1 week" },
  { id: 9, name: "Insulation", status: "not-started", duration: "1 week" },
  { id: 10, name: "Drywall", status: "not-started", duration: "2 weeks" },
  { id: 11, name: "Interior Finishes", status: "not-started", duration: "3 weeks" },
  { id: 12, name: "Final Inspection", status: "not-started", duration: "1 week" },
];

export default function TimelineScreen() {
  const router = useRouter();

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "complete":
        return <CheckCircle size={24} color="#000000" strokeWidth={2} fill="#000000" />;
      case "in-progress":
        return <Clock size={24} color="#000000" strokeWidth={2} />;
      default:
        return <Lock size={24} color="#D4D4D4" strokeWidth={2} />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "complete":
        return (
          <View className="bg-black rounded-full px-3 py-1">
            <Text 
              className="text-white text-xs"
              style={{ fontFamily: 'Poppins_500Medium' }}
            >
              Complete
            </Text>
          </View>
        );
      case "in-progress":
        return (
          <View className="bg-gray-100 rounded-full px-3 py-1 border border-black">
            <Text 
              className="text-black text-xs"
              style={{ fontFamily: 'Poppins_500Medium' }}
            >
              In Progress
            </Text>
          </View>
        );
      default:
        return (
          <View className="bg-gray-100 rounded-full px-3 py-1">
            <Text 
              className="text-gray-400 text-xs"
              style={{ fontFamily: 'Poppins_500Medium' }}
            >
              Not Started
            </Text>
          </View>
        );
    }
  };

  const handleStagePress = (stage: typeof stages[0]) => {
    // Only allow clicking on complete or in-progress stages
    if (stage.status === 'complete' || stage.status === 'in-progress') {
      router.push(`/stage-detail?id=${stage.id}&name=${stage.name}&status=${stage.status}`);
    }
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
          Build Timeline
        </Text>
        <Text 
          className="text-sm text-gray-500"
          style={{ fontFamily: 'Poppins_400Regular' }}
        >
          Track your construction progress
        </Text>
      </View>

      <ScrollView className="flex-1 px-6" contentContainerStyle={{ paddingBottom: 100 }}>
        <View className="pb-8">
          {stages.map((stage, index) => {
            const isClickable = stage.status === 'complete' || stage.status === 'in-progress';
            
            return (
              <View key={stage.id} className="flex-row mb-6">
                {/* Timeline Spine */}
                <View className="items-center mr-4">
                  {getStatusIcon(stage.status)}
                  {index < stages.length - 1 && (
                    <View 
                      className={`w-0.5 flex-1 mt-2 ${
                        stage.status === 'complete' ? 'bg-black' : 'bg-gray-200'
                      }`}
                      style={{ minHeight: 40 }}
                    />
                  )}
                </View>

                {/* Stage Card */}
                <TouchableOpacity
                  onPress={() => handleStagePress(stage)}
                  disabled={!isClickable}
                  className={`flex-1 rounded-2xl p-5 border ${
                    isClickable 
                      ? 'bg-white border-gray-200' 
                      : 'bg-gray-50 border-gray-100'
                  }`}
                  style={{ opacity: isClickable ? 1 : 0.6 }}
                >
                  <View className="flex-row justify-between items-start mb-3">
                    <Text 
                      className={`text-lg flex-1 ${isClickable ? 'text-black' : 'text-gray-400'}`}
                      style={{ fontFamily: 'Poppins_700Bold' }}
                    >
                      {stage.name}
                    </Text>
                    {getStatusBadge(stage.status)}
                  </View>
                  
                  <View className="flex-row items-center">
                    <Clock size={16} color={isClickable ? "#737373" : "#D4D4D4"} strokeWidth={2} />
                    <Text 
                      className={`text-sm ml-2 ${isClickable ? 'text-gray-500' : 'text-gray-300'}`}
                      style={{ fontFamily: 'Poppins_400Regular' }}
                    >
                      {stage.duration}
                    </Text>
                    {!isClickable && (
                      <View className="flex-row items-center ml-auto">
                        <Lock size={14} color="#D4D4D4" strokeWidth={2} />
                        <Text 
                          className="text-gray-300 text-xs ml-1"
                          style={{ fontFamily: 'Poppins_400Regular' }}
                        >
                          Locked
                        </Text>
                      </View>
                    )}
                  </View>
                </TouchableOpacity>
              </View>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}
