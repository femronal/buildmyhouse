import { View, Text, TouchableOpacity, TextInput, Animated } from "react-native";
import { useRouter } from "expo-router";
import { ArrowLeft, Camera, FileText, Upload, Home } from "lucide-react-native";
import { useState, useRef, useEffect } from "react";

export default function UploadPlanScreen() {
  const router = useRouter();
  const [projectName, setProjectName] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isProcessing) {
      Animated.loop(
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        })
      ).start();

      // Simulate processing
      setTimeout(() => {
        setIsProcessing(false);
        router.push('/house-summary');
      }, 3000);
    }
  }, [isProcessing]);

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const handleUpload = () => {
    if (projectName) {
      setIsProcessing(true);
    }
  };

  if (isProcessing) {
    return (
      <View className="flex-1 bg-white items-center justify-center px-6">
        <Animated.View style={{ transform: [{ rotate: spin }] }}>
          <View className="w-32 h-32 rounded-full border-4 border-black border-t-transparent" />
        </Animated.View>
        <Text 
          className="text-2xl text-black mt-8 text-center"
          style={{ fontFamily: 'Poppins_700Bold' }}
        >
          Analyzing your plan...
        </Text>
        <Text 
          className="text-base text-gray-500 mt-4 text-center"
          style={{ fontFamily: 'Poppins_400Regular' }}
        >
          Converting architectural drawings into build stages
        </Text>
      </View>
    );
  }

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
          Upload Your Plan
        </Text>
        <Text 
          className="text-sm text-gray-500"
          style={{ fontFamily: 'Poppins_400Regular' }}
        >
          Share your architectural drawings to get started
        </Text>
      </View>

      <View className="flex-1 px-6">
        {/* Project Name Input */}
        <View className="mb-6">
          <Text 
            className="text-sm text-gray-500 mb-2"
            style={{ fontFamily: 'Poppins_500Medium' }}
          >
            Project Name
          </Text>
          <View className="bg-gray-50 rounded-2xl p-5 border border-gray-200">
            <TextInput
              className="text-base text-black"
              style={{ fontFamily: 'Poppins_400Regular' }}
              placeholder="My Dream Home"
              placeholderTextColor="#A3A3A3"
              value={projectName}
              onChangeText={setProjectName}
            />
          </View>
        </View>

        {/* Upload Zone */}
        <View className="flex-1 mb-6">
          <TouchableOpacity 
            className="flex-1 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-300 items-center justify-center p-8"
          >
            <View className="items-center">
              <View className="bg-black rounded-full p-6 mb-6">
                <Upload size={48} color="#FFFFFF" strokeWidth={2} />
              </View>
              
              <Text 
                className="text-xl text-black mb-3 text-center"
                style={{ fontFamily: 'Poppins_700Bold' }}
              >
                Drop files here
              </Text>
              
              <Text 
                className="text-sm text-gray-500 mb-6 text-center"
                style={{ fontFamily: 'Poppins_400Regular' }}
              >
                or tap to browse
              </Text>

              <View className="flex-row">
                <View className="bg-white rounded-xl px-4 py-3 flex-row items-center mr-3 border border-gray-200">
                  <Camera size={20} color="#000000" strokeWidth={2} />
                  <Text 
                    className="text-black ml-2"
                    style={{ fontFamily: 'Poppins_500Medium' }}
                  >
                    Camera
                  </Text>
                </View>
                
                <View className="bg-white rounded-xl px-4 py-3 flex-row items-center border border-gray-200">
                  <FileText size={20} color="#000000" strokeWidth={2} />
                  <Text 
                    className="text-black ml-2"
                    style={{ fontFamily: 'Poppins_500Medium' }}
                  >
                    PDF/Image
                  </Text>
                </View>
              </View>
            </View>
          </TouchableOpacity>
        </View>

        {/* Upload Button */}
        <TouchableOpacity
          onPress={handleUpload}
          disabled={!projectName}
          className={`rounded-full py-5 px-8 mb-8 ${
            projectName ? 'bg-black' : 'bg-gray-200'
          }`}
        >
          <Text 
            className={`text-lg text-center ${projectName ? 'text-white' : 'text-gray-400'}`}
            style={{ fontFamily: 'Poppins_700Bold' }}
          >
            Process Plan
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
