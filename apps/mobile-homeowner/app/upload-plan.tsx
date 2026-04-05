import { View, Text, TouchableOpacity, TextInput, Animated, Alert, ScrollView, ActivityIndicator, Image, Platform, useWindowDimensions } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { ArrowLeft, FileText, Upload, Home, X, CheckCircle, AlertCircle } from "lucide-react-native";
import { useState, useRef, useEffect, useMemo } from "react";
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { useUploadPlan } from '@/hooks/usePlan';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { api } from '@/lib/api';
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { getScreenHorizontalPadding } from "@/lib/responsive-layout";

export default function UploadPlanScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const horizontalPadding = useMemo(() => getScreenHorizontalPadding(width), [width]);
  const { data: currentUser, isLoading: userLoading } = useCurrentUser();
  
  const [projectName, setProjectName] = useState("");
  const [budget, setBudget] = useState("");
  const [selectedProjectType, setSelectedProjectType] = useState<'homebuilding' | 'renovation' | 'interior_design' | null>(null);
  const [selectedPlanPhoto, setSelectedPlanPhoto] = useState<any>(null);
  const [selectedPdf, setSelectedPdf] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const uploadPlanMutation = useUploadPlan();

  // Get address from location screen
  const address = params.address as string || "";
  const latitude = params.latitude ? parseFloat(params.latitude as string) : null;
  const longitude = params.longitude ? parseFloat(params.longitude as string) : null;

  useEffect(() => {
    if (isProcessing) {
      Animated.loop(
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: false,
        })
      ).start();
    }
  }, [isProcessing]);

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const handlePickPdf = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/pdf',
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const file = result.assets[0];
        setSelectedPdf(file);
      }
    } catch (error) {
      console.error('Error picking PDF:', error);
      Alert.alert('Error', 'Failed to select PDF file');
    }
  };

  const handleRemovePdf = () => {
    setSelectedPdf(null);
  };

  const handlePickPlanPhoto = async () => {
    try {
      if (Platform.OS !== 'web') {
        const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!perm.granted) {
          Alert.alert('Permission required', 'Please allow photo library access to upload a plan photo.');
          return;
        }
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [16, 9],
        quality: 0.85,
      });

      if (result.canceled || !result.assets?.length) return;
      setSelectedPlanPhoto(result.assets[0]);
    } catch (error) {
      console.error('Error picking plan photo:', error);
      Alert.alert('Error', 'Failed to select plan photo');
    }
  };

  const handleRemovePlanPhoto = () => {
    setSelectedPlanPhoto(null);
  };

  const uploadPlanCoverImage = async (asset: any): Promise<string> => {
    const formData = new FormData();
    const fileName = asset?.fileName || `project-cover-${Date.now()}.jpg`;
    const mimeType = asset?.mimeType || 'image/jpeg';

    if (Platform.OS === 'web') {
      const res = await fetch(asset.uri);
      const blob = await res.blob();
      formData.append('file', blob, fileName);
    } else {
      formData.append('file', {
        uri: asset.uri,
        name: fileName,
        type: mimeType,
      } as any);
    }

    const uploadRes = await api.post('/upload/image', formData);
    const imageUrl = String(uploadRes?.url || '').trim();
    if (!imageUrl) {
      throw new Error('Plan cover upload succeeded but no URL was returned');
    }
    return imageUrl;
  };

  const handleUpload = async () => {
    if (!projectName.trim()) {
      Alert.alert('Project Name Required', 'Please enter a project name');
      return;
    }

    if (!budget || parseFloat(budget) <= 0) {
      Alert.alert('Budget Required', 'Please enter a valid budget');
      return;
    }

    if (!selectedProjectType) {
      Alert.alert('Project Type Required', 'Please select a project type');
      return;
    }

    if (!selectedPlanPhoto?.uri) {
      Alert.alert('Plan Photo Required', 'Please select one beautiful project photo');
      return;
    }

    if (!selectedPdf) {
      Alert.alert('PDF Required', 'Please upload your architectural plan PDF');
      return;
    }

    if (!address) {
      Alert.alert('Address Required', 'Please go back and select a project location');
      return;
    }

    setIsProcessing(true);
    setUploadProgress(0);

    let progressInterval: ReturnType<typeof setInterval> | null = null;

    try {
      // Simulate upload progress
      progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            if (progressInterval) clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      // Prepare upload data
      const planImageUrl = await uploadPlanCoverImage(selectedPlanPhoto);
      const uploadData = {
        name: projectName,
        address: address,
        street: address.split(',')[0] || '',
        city: address.split(',')[1]?.trim() || '',
        state: address.split(',')[2]?.trim() || '',
        zipCode: address.split(',')[3]?.trim() || '',
        country: address.split(',')[4]?.trim() || 'Nigeria',
        latitude: latitude || undefined,
        longitude: longitude || undefined,
        budget: parseFloat(budget),
        projectType: selectedProjectType,
        planImageUrl,
      };

      // Call real API
      const result = await uploadPlanMutation.mutateAsync({
        planData: uploadData,
        pdfFile: selectedPdf,
      });

      // Complete progress
      setUploadProgress(100);
      if (progressInterval) clearInterval(progressInterval);

      // Get project ID from response
      // Backend returns: { project: { id, ... }, aiAnalysis: {...} }
      const projectId = result?.project?.id || result?.id || result?.projectId;
      
      if (!projectId) {
        console.error('❌ No project ID in response:', result);
        throw new Error('No project ID returned from server. Please try again.');
      }

      // Wait a moment for AI processing to start
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Navigate to house summary with project data
      router.push({
        pathname: '/house-summary',
        params: {
          projectId: projectId, // CRITICAL: Pass the real projectId
          projectName,
          budget,
          address,
          latitude: latitude?.toString(),
          longitude: longitude?.toString(),
          pdfName: selectedPdf.name,
          projectType: selectedProjectType,
          planImageUrl: uploadData.planImageUrl,
        },
      });
    } catch (error: any) {
      console.error('❌ Upload error:', error);
      if (progressInterval) clearInterval(progressInterval);
      Alert.alert(
        'Upload Failed',
        error?.message || 'There was an error uploading your plan. Please try again.'
      );
      setIsProcessing(false);
      setUploadProgress(0);
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
          {uploadProgress < 100 ? 'Uploading your plan...' : 'Analyzing with AI...'}
        </Text>
        
        <Text 
          className="text-base text-gray-500 mt-4 text-center mb-6"
          style={{ fontFamily: 'Poppins_400Regular' }}
        >
          {uploadProgress < 100 
            ? 'Uploading PDF to secure storage' 
            : 'Extracting details from architectural drawings'}
        </Text>

        {/* Progress Bar */}
        <View className="w-full max-w-xs bg-gray-200 rounded-full h-2 overflow-hidden">
          <View 
            className="bg-black h-full transition-all duration-300"
            style={{ width: `${uploadProgress}%` }}
          />
        </View>
        <Text 
          className="text-sm text-gray-500 mt-2"
          style={{ fontFamily: 'Poppins_500Medium' }}
        >
          {uploadProgress}%
        </Text>
      </View>
    );
  }

  // Show sign-in prompt for unauthenticated users
  if (!userLoading && !currentUser) {
    return (
      <View className="flex-1 bg-white">
        <View
          className="pb-4"
          style={{ paddingTop: Math.max(16, insets.top + 8), paddingHorizontal: horizontalPadding }}
        >
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
            Upload your complete architectural plan as a single PDF
          </Text>
        </View>
        <View className="flex-1 justify-center items-center py-20" style={{ paddingHorizontal: horizontalPadding }}>
          <Text className="text-gray-500 text-center text-lg mb-4" style={{ fontFamily: 'Poppins_600SemiBold' }}>
            Sign in to upload your plan
          </Text>
          <Text className="text-gray-400 text-center text-sm mb-6" style={{ fontFamily: 'Poppins_400Regular' }}>
            Create an account or log in to upload your architectural plan and get AI-powered analysis.
          </Text>
          <TouchableOpacity
            onPress={() => router.push('/login')}
            className="bg-black rounded-full py-3 px-6"
          >
            <Text className="text-white" style={{ fontFamily: 'Poppins_600SemiBold' }}>
              Sign up / Log in
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <ScrollView
      className="flex-1 bg-white"
      contentContainerStyle={{ paddingBottom: Math.max(24, insets.bottom + 16) }}
    >
      <View
        className="pb-4"
        style={{ paddingTop: Math.max(16, insets.top + 8), paddingHorizontal: horizontalPadding }}
      >
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
          Upload your complete architectural plan as a single PDF
        </Text>
      </View>

      <View className="pb-8" style={{ paddingHorizontal: horizontalPadding }}>
        {/* Important Notice */}
        <View className="bg-blue-50 border border-blue-200 rounded-2xl p-4 mb-6">
          <View className="flex-row items-start">
            <AlertCircle size={20} color="#2563eb" strokeWidth={2} className="mr-2 mt-0.5" />
            <View className="flex-1">
              <Text className="text-blue-900 text-sm mb-1" style={{ fontFamily: 'Poppins_600SemiBold' }}>
                Important: Single PDF Only
              </Text>
              <Text className="text-blue-800 text-xs leading-5" style={{ fontFamily: 'Poppins_400Regular' }}>
                Please merge all your architectural drawings, floor plans, and specifications into one PDF file before uploading. This ensures accurate AI analysis.
              </Text>
            </View>
          </View>
        </View>

        {/* Project Name Input */}
        <View className="mb-4">
          <Text 
            className="text-sm text-gray-700 mb-2"
            style={{ fontFamily: 'Poppins_500Medium' }}
          >
            Project Name *
          </Text>
          <View className="bg-gray-50 rounded-2xl p-5 border border-gray-200">
            <TextInput
              className="text-base text-black"
              style={{ fontFamily: 'Poppins_400Regular' }}
              placeholder="e.g., My Dream Home"
              placeholderTextColor="#A3A3A3"
              value={projectName}
              onChangeText={setProjectName}
            />
          </View>
        </View>

        {/* Budget Input */}
        <View className="mb-4">
          <Text
            className="text-sm text-gray-700 mb-2"
            style={{ fontFamily: 'Poppins_500Medium' }}
          >
            Project Type *
          </Text>
          <View className="flex-row" style={{ gap: 8 }}>
            <TouchableOpacity
              onPress={() => setSelectedProjectType('homebuilding')}
              className={`flex-1 rounded-2xl py-3 px-3 border ${
                selectedProjectType === 'homebuilding'
                  ? 'bg-black border-black'
                  : 'bg-gray-50 border-gray-200'
              }`}
            >
              <Text
                className={`text-center text-xs ${
                  selectedProjectType === 'homebuilding' ? 'text-white' : 'text-gray-700'
                }`}
                style={{ fontFamily: 'Poppins_600SemiBold' }}
              >
                Building
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setSelectedProjectType('renovation')}
              className={`flex-1 rounded-2xl py-3 px-3 border ${
                selectedProjectType === 'renovation'
                  ? 'bg-black border-black'
                  : 'bg-gray-50 border-gray-200'
              }`}
            >
              <Text
                className={`text-center text-xs ${
                  selectedProjectType === 'renovation' ? 'text-white' : 'text-gray-700'
                }`}
                style={{ fontFamily: 'Poppins_600SemiBold' }}
              >
                Renovation
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setSelectedProjectType('interior_design')}
              className={`flex-1 rounded-2xl py-3 px-3 border ${
                selectedProjectType === 'interior_design'
                  ? 'bg-black border-black'
                  : 'bg-gray-50 border-gray-200'
              }`}
            >
              <Text
                className={`text-center text-[11px] ${
                  selectedProjectType === 'interior_design' ? 'text-white' : 'text-gray-700'
                }`}
                style={{ fontFamily: 'Poppins_600SemiBold' }}
              >
                Interior Design
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Budget Input */}
        <View className="mb-4">
          <Text 
            className="text-sm text-gray-700 mb-2"
            style={{ fontFamily: 'Poppins_500Medium' }}
          >
            Estimated Budget (₦) *
          </Text>
          <View className="bg-gray-50 rounded-2xl p-5 border border-gray-200">
            <TextInput
              className="text-base text-black"
              style={{ fontFamily: 'Poppins_400Regular' }}
              placeholder="e.g., 250000"
              placeholderTextColor="#A3A3A3"
              value={budget}
              onChangeText={setBudget}
              keyboardType="numeric"
            />
          </View>
        </View>

        {/* Address Display */}
        {address && (
          <View className="mb-6 bg-green-50 border border-green-200 rounded-2xl p-4">
            <View className="flex-row items-start">
              <CheckCircle size={20} color="#059669" strokeWidth={2} className="mr-2 mt-0.5" />
              <View className="flex-1">
                <Text className="text-green-900 text-sm mb-1" style={{ fontFamily: 'Poppins_600SemiBold' }}>
                  Project Location
                </Text>
                <Text className="text-green-800 text-xs" style={{ fontFamily: 'Poppins_400Regular' }}>
                  {address}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* PDF Upload Zone */}
        <View className="mb-6">
          <Text
            className="text-sm text-gray-700 mb-2"
            style={{ fontFamily: 'Poppins_500Medium' }}
          >
            Project Cover Photo *
          </Text>

          {!selectedPlanPhoto ? (
            <TouchableOpacity
              onPress={handlePickPlanPhoto}
              className="bg-gray-50 rounded-2xl border-2 border-dashed border-gray-300 p-6"
            >
              <View className="items-center">
                <View className="bg-black rounded-full p-3 mb-3">
                  <Upload size={24} color="#FFFFFF" strokeWidth={2} />
                </View>
                <Text
                  className="text-black text-sm mb-1"
                  style={{ fontFamily: 'Poppins_600SemiBold' }}
                >
                  Select one beautiful photo
                </Text>
                <Text
                  className="text-gray-500 text-xs text-center"
                  style={{ fontFamily: 'Poppins_400Regular' }}
                >
                  This photo will be used as the project background after GC acceptance
                </Text>
              </View>
            </TouchableOpacity>
          ) : (
            <View className="bg-green-50 border border-green-200 rounded-2xl p-3">
              <Image
                source={{ uri: selectedPlanPhoto.uri }}
                className="w-full h-40 rounded-xl mb-3"
                resizeMode="cover"
              />
              <View className="flex-row items-center justify-between">
                <Text className="text-green-900 text-xs flex-1 mr-3" style={{ fontFamily: 'Poppins_500Medium' }}>
                  {selectedPlanPhoto.fileName || 'Project cover selected'}
                </Text>
                <TouchableOpacity onPress={handleRemovePlanPhoto}>
                  <X size={22} color="#dc2626" strokeWidth={2} />
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>

        {/* PDF Upload Zone */}
        <View className="mb-6">
          <Text 
            className="text-sm text-gray-700 mb-2"
            style={{ fontFamily: 'Poppins_500Medium' }}
          >
            Architectural Plan (PDF) *
          </Text>
          
          {!selectedPdf ? (
            <TouchableOpacity 
              onPress={handlePickPdf}
              className="bg-gray-50 rounded-2xl border-2 border-dashed border-gray-300 p-8"
            >
              <View className="items-center">
                <View className="bg-black rounded-full p-4 mb-4">
                  <Upload size={32} color="#FFFFFF" strokeWidth={2} />
                </View>
                
                <Text 
                  className="text-lg text-black mb-2 text-center"
                  style={{ fontFamily: 'Poppins_700Bold' }}
                >
                  Tap to Select PDF
                </Text>
                
                <Text 
                  className="text-sm text-gray-500 text-center"
                  style={{ fontFamily: 'Poppins_400Regular' }}
                >
                  Upload your complete plan as a single PDF file
                </Text>

                <View className="bg-white rounded-xl px-4 py-3 flex-row items-center mt-4 border border-gray-200">
                  <FileText size={20} color="#000000" strokeWidth={2} />
                  <Text 
                    className="text-black ml-2"
                    style={{ fontFamily: 'Poppins_500Medium' }}
                  >
                    PDF Only
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          ) : (
            <View className="bg-green-50 border border-green-200 rounded-2xl p-4">
              <View className="flex-row items-start justify-between">
                <View className="flex-row items-start flex-1">
                  <FileText size={24} color="#059669" strokeWidth={2} className="mr-3" />
                  <View className="flex-1">
                    <Text className="text-green-900 text-sm mb-1" style={{ fontFamily: 'Poppins_600SemiBold' }}>
                      {selectedPdf.name}
                    </Text>
                    <Text className="text-green-700 text-xs" style={{ fontFamily: 'Poppins_400Regular' }}>
                      {(selectedPdf.size / 1024 / 1024).toFixed(2)} MB
                    </Text>
                  </View>
                </View>
                <TouchableOpacity onPress={handleRemovePdf} className="ml-2">
                  <X size={24} color="#dc2626" strokeWidth={2} />
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>

        {/* Process Button */}
        <TouchableOpacity
          onPress={handleUpload}
          disabled={!projectName || !budget || !selectedPdf || !selectedProjectType || !selectedPlanPhoto}
          className={`rounded-full py-5 px-8 ${
            (projectName && budget && selectedPdf && selectedProjectType && selectedPlanPhoto) ? 'bg-black' : 'bg-gray-200'
          }`}
        >
          <Text 
            className={`text-lg text-center ${
              (projectName && budget && selectedPdf && selectedProjectType && selectedPlanPhoto) ? 'text-white' : 'text-gray-400'
            }`}
            style={{ fontFamily: 'Poppins_700Bold' }}
          >
            Process Plan with AI
          </Text>
        </TouchableOpacity>

        <Text 
          className="text-xs text-gray-400 text-center mt-3"
          style={{ fontFamily: 'Poppins_400Regular' }}
        >
          AI will analyze your plan and generate a detailed project summary
        </Text>
      </View>
    </ScrollView>
  );
}
