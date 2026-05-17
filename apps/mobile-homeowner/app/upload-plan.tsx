import { View, Text, TouchableOpacity, TextInput, Animated, Alert, ScrollView, Image, Platform, useWindowDimensions } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { ArrowLeft, FileText, Upload, Home, X, AlertCircle } from "lucide-react-native";
import { useState, useRef, useEffect, useMemo } from "react";
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { useUploadPlan } from '@/hooks/usePlan';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { api } from '@/lib/api';
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { getScreenHorizontalPadding } from "@/lib/responsive-layout";
import { ensureImageWithinUploadLimit } from "@/lib/image-upload";

type ProjectType = 'repair' | 'upgrades' | 'renovation' | 'full_builds';

const MAX_PLAN_PHOTOS = 5;
const MAX_IMAGE_UPLOAD_BYTES = 50 * 1024 * 1024;
const MAX_IMAGE_UPLOAD_MB = 50;
const IMAGE_EXTENSIONS = new Set([
  'jpg', 'jpeg', 'jpe', 'png', 'webp', 'gif', 'heic', 'heif', 'dng', 'tif', 'tiff', 'bmp', 'avif', 'jfif', 'jxl',
]);

function getExtensionFromName(name?: string | null) {
  if (!name) return '';
  const clean = name.split('?')[0];
  const dot = clean.lastIndexOf('.');
  if (dot < 0) return '';
  return clean.slice(dot + 1).toLowerCase();
}

function isImageLikeAsset(asset: any) {
  const mime = String(asset?.mimeType || '').toLowerCase();
  if (mime.startsWith('image/')) return true;
  const ext = getExtensionFromName(asset?.name || asset?.fileName || asset?.uri);
  return IMAGE_EXTENSIONS.has(ext);
}

function normalizeImageAssetMeta(asset: any, fallbackBase: string) {
  const ext = getExtensionFromName(asset?.fileName || asset?.name || asset?.uri);
  const mime = String(asset?.mimeType || '').toLowerCase();
  const safeExt = ext || (mime.startsWith('image/') ? mime.replace('image/', '') : 'jpg');
  const normalizedExt = safeExt || 'jpg';
  const fileName =
    asset?.fileName ||
    asset?.name ||
    `${fallbackBase}-${Date.now()}.${normalizedExt}`;
  const mimeType = mime || `image/${normalizedExt === 'jpg' ? 'jpeg' : normalizedExt}`;
  return { fileName, mimeType };
}

const PROJECT_TYPE_FILTERS: Record<ProjectType, string[]> = {
  repair: [
    'Water leakage',
    'Electrical fault',
    'Plumbing issue',
    'Roof or ceiling',
    'Doors and windows',
    'Wall cracks',
  ],
  upgrades: [
    'Kitchen upgrade',
    'Bathroom upgrade',
    'Lighting upgrade',
    'Security upgrade',
    'Energy efficiency',
    'Smart home',
  ],
  renovation: [
    'Whole home',
    'Single room',
    'Structural changes',
    'Space extension',
    'Interior refresh',
    'Exterior refresh',
  ],
  full_builds: [
    'Bungalow',
    'Duplex',
    'Apartment',
    'Commercial',
    'Mixed-use',
    'Estate development',
  ],
};

const PROJECT_TYPE_TO_API: Record<ProjectType, 'renovation' | 'interior_design' | 'homebuilding'> = {
  repair: 'renovation',
  upgrades: 'interior_design',
  renovation: 'renovation',
  full_builds: 'homebuilding',
};

const PROJECT_TYPE_DESCRIPTION_PROMPTS: Record<ProjectType, string> = {
  repair: 'Briefly describe the issue *',
  upgrades: 'Describe what you are upgrading and why *',
  renovation: 'Describe what you want renovated *',
  full_builds: 'Describe what you want to build *',
};

const PROJECT_TYPE_DESCRIPTION_PLACEHOLDERS: Record<ProjectType, string> = {
  repair: 'Example: The living room ceiling leaks whenever it rains.',
  upgrades: 'Example: I want to upgrade kitchen storage and appliances for daily use.',
  renovation: 'Example: Renovate the entire ground floor with a modern layout.',
  full_builds: 'Example: Build a 4-bedroom duplex with parking and service quarters.',
};

function getProjectTypeLabel(projectType: ProjectType | null) {
  if (projectType === 'repair') return 'Repair';
  if (projectType === 'upgrades') return 'Upgrades';
  if (projectType === 'renovation') return 'Renovation';
  if (projectType === 'full_builds') return 'Full Builds';
  return '';
}

export default function UploadPlanScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const horizontalPadding = useMemo(() => getScreenHorizontalPadding(width), [width]);
  const { data: currentUser, isLoading: userLoading } = useCurrentUser();

  const [projectName, setProjectName] = useState("");
  const [budget, setBudget] = useState("");
  const [selectedProjectType, setSelectedProjectType] = useState<ProjectType | null>(null);
  const [selectedProjectFilter, setSelectedProjectFilter] = useState("");
  const [selectedPlanPhotos, setSelectedPlanPhotos] = useState<any[]>([]);
  const [planPhotoSizeMessage, setPlanPhotoSizeMessage] = useState<string | null>(null);
  const [selectedPdf, setSelectedPdf] = useState<any | null>(null);
  const [projectDescription, setProjectDescription] = useState("");
  const [successCriteria, setSuccessCriteria] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const uploadPlanMutation = useUploadPlan();

  const address = params.address as string || "";
  const latitude = params.latitude ? parseFloat(params.latitude as string) : null;
  const longitude = params.longitude ? parseFloat(params.longitude as string) : null;

  useEffect(() => {
    setSelectedProjectFilter("");
  }, [selectedProjectType]);

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
  }, [isProcessing, rotateAnim]);

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
        setSelectedPdf(result.assets[0]);
      }
    } catch (error) {
      console.error('Error picking PDF:', error);
      Alert.alert('Error', 'Failed to select PDF file');
    }
  };

  const handleRemovePdf = () => {
    setSelectedPdf(null);
  };

  const handlePickPlanPhotos = async () => {
    try {
      setPlanPhotoSizeMessage(null);
      if (Platform.OS === 'web') {
        const remainingSlots = MAX_PLAN_PHOTOS - selectedPlanPhotos.length;
        if (remainingSlots <= 0) {
          Alert.alert('Limit reached', `You can upload up to ${MAX_PLAN_PHOTOS} photos.`);
          return;
        }

        const result = await DocumentPicker.getDocumentAsync({
          type: '*/*',
          copyToCacheDirectory: true,
          multiple: true,
        });
        if (result.canceled || !result.assets?.length) return;

        const imageAssets = result.assets.filter(isImageLikeAsset);
        if (!imageAssets.length) {
          Alert.alert('No images selected', 'Please choose image files (including formats like HEIC, HEIF, or DNG).');
          return;
        }

        const processedAssets: any[] = [];
        let autoCompressedCount = 0;
        let rejectedCount = 0;
        for (const asset of imageAssets) {
          const prepared = await ensureImageWithinUploadLimit(asset);
          if (prepared.exceedsLimit) {
            rejectedCount += 1;
            continue;
          }
          processedAssets.push(prepared.asset);
          if (prepared.wasCompressed) autoCompressedCount += 1;
        }

        if (rejectedCount > 0) {
          setPlanPhotoSizeMessage(
            `Some images are still above ${MAX_IMAGE_UPLOAD_MB}MB after auto-compression. Please choose smaller photos.`,
          );
        }
        if (autoCompressedCount > 0) {
          Alert.alert(
            'Large image optimized',
            `${autoCompressedCount} image${autoCompressedCount > 1 ? 's were' : ' was'} automatically compressed for upload.`,
          );
        }

        const nextAssets = processedAssets.slice(0, remainingSlots);
        if (!nextAssets.length) {
          Alert.alert('Image too large', `Please select image files below ${MAX_IMAGE_UPLOAD_MB}MB each.`);
          return;
        }
        setSelectedPlanPhotos((prev) => {
          const merged = [...prev, ...nextAssets];
          const deduped = merged.filter(
            (asset, index, arr) => arr.findIndex((candidate) => candidate.uri === asset.uri) === index,
          );
          return deduped.slice(0, MAX_PLAN_PHOTOS);
        });
        return;
      }

      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        Alert.alert('Permission required', 'Please allow photo library access to upload project photos.');
        return;
      }

      const remainingSlots = MAX_PLAN_PHOTOS - selectedPlanPhotos.length;
      if (remainingSlots <= 0) {
        Alert.alert('Limit reached', `You can upload up to ${MAX_PLAN_PHOTOS} photos.`);
        return;
      }

      const source = await new Promise<'camera' | 'library' | null>((resolve) => {
        Alert.alert(
          'Add project photo',
          'Choose how you want to add photos',
          [
            { text: 'Take Photo', onPress: () => resolve('camera') },
            { text: 'Choose from Library', onPress: () => resolve('library') },
            { text: 'Cancel', style: 'cancel', onPress: () => resolve(null) },
          ],
          { cancelable: true, onDismiss: () => resolve(null) },
        );
      });
      if (!source) return;

      const result =
        source === 'camera'
          ? await ImagePicker.launchCameraAsync({
              mediaTypes: ImagePicker.MediaTypeOptions.Images,
              allowsEditing: false,
              quality: 0.9,
            })
          : await ImagePicker.launchImageLibraryAsync({
              mediaTypes: ImagePicker.MediaTypeOptions.Images,
              allowsEditing: false,
              quality: 0.85,
              allowsMultipleSelection: true,
              selectionLimit: remainingSlots,
              preferredAssetRepresentationMode: ImagePicker.UIImagePickerPreferredAssetRepresentationMode.Compatible,
            });

      if (result.canceled || !result.assets?.length) return;

      const processedAssets: any[] = [];
      let autoCompressedCount = 0;
      let rejectedCount = 0;

      for (const asset of result.assets) {
        const prepared = await ensureImageWithinUploadLimit(asset);
        if (prepared.exceedsLimit) {
          rejectedCount += 1;
          continue;
        }
        processedAssets.push(prepared.asset);
        if (prepared.wasCompressed) autoCompressedCount += 1;
      }

      if (rejectedCount > 0) {
        setPlanPhotoSizeMessage(
          `Some images are still above ${MAX_IMAGE_UPLOAD_MB}MB after auto-compression. Please choose smaller photos.`,
        );
      }
      if (autoCompressedCount > 0) {
        Alert.alert(
          'Large image optimized',
          `${autoCompressedCount} image${autoCompressedCount > 1 ? 's were' : ' was'} automatically compressed for upload.`,
        );
      }

      const nextAssets = processedAssets.slice(0, remainingSlots);
      if (!nextAssets.length) {
        Alert.alert('Image too large', `Please select image files below ${MAX_IMAGE_UPLOAD_MB}MB each, or lower camera quality.`);
        return;
      }
      setSelectedPlanPhotos((prev) => {
        const merged = [...prev, ...nextAssets];
        const deduped = merged.filter(
          (asset, index, arr) => arr.findIndex((candidate) => candidate.uri === asset.uri) === index,
        );
        return deduped.slice(0, MAX_PLAN_PHOTOS);
      });
    } catch (error) {
      console.error('Error picking plan photos:', error);
      Alert.alert('Error', 'Failed to select project photos');
    }
  };

  const handleRemovePlanPhoto = (indexToRemove: number) => {
    setSelectedPlanPhotos((prev) => {
      const next = prev.filter((_, index) => index !== indexToRemove);
      if (!next.length) setPlanPhotoSizeMessage(null);
      return next;
    });
  };

  const uploadPlanImage = async (asset: any): Promise<string> => {
    const prepared = await ensureImageWithinUploadLimit(asset);
    if (prepared.exceedsLimit) {
      throw new Error(`Image too large. Please upload files below ${MAX_IMAGE_UPLOAD_MB}MB.`);
    }
    const preparedAsset = prepared.asset;

    const formData = new FormData();
    const { fileName, mimeType } = normalizeImageAssetMeta(preparedAsset, 'project-image');

    if (Platform.OS === 'web') {
      const res = await fetch(preparedAsset.uri);
      const blob = await res.blob();
      if (blob.size > MAX_IMAGE_UPLOAD_BYTES) {
        throw new Error(`Image too large. Please upload files below ${MAX_IMAGE_UPLOAD_MB}MB.`);
      }
      const file = new File([blob], fileName, { type: mimeType || blob.type || 'image/jpeg' });
      formData.append('file', file);
    } else {
      formData.append('file', {
        uri: preparedAsset.uri,
        name: fileName,
        type: mimeType,
      } as any);
    }

    const uploadRes = await api.post('/upload/image', formData);
    const imageUrl = String(uploadRes?.url || '').trim();
    if (!imageUrl) {
      throw new Error('Image upload succeeded but no URL was returned');
    }
    return imageUrl;
  };

  const selectedTypeLabel = useMemo(
    () => getProjectTypeLabel(selectedProjectType),
    [selectedProjectType],
  );

  const projectDescriptionPrompt = useMemo(() => {
    if (!selectedProjectType) {
      return 'Describe your project briefly *';
    }
    return PROJECT_TYPE_DESCRIPTION_PROMPTS[selectedProjectType];
  }, [selectedProjectType]);

  const projectDescriptionPlaceholder = useMemo(() => {
    if (!selectedProjectType) {
      return 'Share the core details of what you want done.';
    }
    return PROJECT_TYPE_DESCRIPTION_PLACEHOLDERS[selectedProjectType];
  }, [selectedProjectType]);

  const canSubmit = useMemo(() => {
    return (
      !!projectName.trim() &&
      !!budget &&
      parseFloat(budget) > 0 &&
      !!selectedProjectType &&
      !!selectedProjectFilter.trim() &&
      !!projectDescription.trim() &&
      !!successCriteria.trim() &&
      !!address
    );
  }, [
    address,
    budget,
    projectDescription,
    projectName,
    selectedProjectFilter,
    selectedProjectType,
    successCriteria,
  ]);

  const validateOneSentence = (value: string) => {
    const sentenceCount = value
      .trim()
      .split(/[.!?]+/)
      .map((part) => part.trim())
      .filter(Boolean).length;
    return sentenceCount <= 1;
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

    if (!selectedProjectFilter.trim()) {
      Alert.alert('Project Focus Required', 'Please choose or enter a project sub-filter');
      return;
    }

    if (!projectDescription.trim()) {
      Alert.alert('Description Required', 'Please describe your project briefly');
      return;
    }

    if (!successCriteria.trim()) {
      Alert.alert('Success Goal Required', 'Please enter what success looks like for you');
      return;
    }

    if (!validateOneSentence(successCriteria)) {
      Alert.alert('One sentence only', 'Please keep the success goal to one clear sentence.');
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
      progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 90) {
            if (progressInterval) clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      const uploadedPhotoUrls: string[] = [];
      for (const photo of selectedPlanPhotos) {
        const photoUrl = await uploadPlanImage(photo);
        uploadedPhotoUrls.push(photoUrl);
      }

      const uploadData = {
        name: projectName.trim(),
        address: address,
        street: address.split(',')[0] || '',
        city: address.split(',')[1]?.trim() || '',
        state: address.split(',')[2]?.trim() || '',
        zipCode: address.split(',')[3]?.trim() || '',
        country: address.split(',')[4]?.trim() || 'Nigeria',
        latitude: latitude || undefined,
        longitude: longitude || undefined,
        budget: parseFloat(budget),
        projectType: PROJECT_TYPE_TO_API[selectedProjectType],
        planImageUrl: uploadedPhotoUrls[0],
        planImageUrls: uploadedPhotoUrls,
        projectTypeTag: selectedTypeLabel,
        projectTypeFilter: selectedProjectFilter.trim(),
        projectDescription: projectDescription.trim(),
        successCriteria: successCriteria.trim(),
      };

      const result = await uploadPlanMutation.mutateAsync({
        planData: uploadData,
        pdfFile: selectedPdf || undefined,
      });

      setUploadProgress(100);
      if (progressInterval) clearInterval(progressInterval);

      const projectId = result?.project?.id || result?.id || result?.projectId;
      if (!projectId) {
        console.error('❌ No project ID in response:', result);
        throw new Error('No project ID returned from server. Please try again.');
      }

      await new Promise((resolve) => setTimeout(resolve, 1000));

      router.push({
        pathname: '/house-summary',
        params: {
          projectId,
          projectName,
          budget,
          address,
          latitude: latitude?.toString(),
          longitude: longitude?.toString(),
          projectType: selectedProjectType,
          projectTypeFilter: selectedProjectFilter.trim(),
          projectDescription: projectDescription.trim(),
          successCriteria: successCriteria.trim(),
          planImageUrl: uploadedPhotoUrls[0] || '',
          planImageCount: uploadedPhotoUrls.length.toString(),
          pdfName: selectedPdf?.name || '',
        },
      });
    } catch (error: any) {
      console.error('❌ Upload error:', error);
      if (progressInterval) clearInterval(progressInterval);
      Alert.alert(
        'Upload Failed',
        error?.message || 'There was an error uploading your project. Please try again.'
      );
      const message = String(error?.message || '').toLowerCase();
      if (message.includes('large') || message.includes('413') || message.includes('payload')) {
        setPlanPhotoSizeMessage(`Some selected images are still above ${MAX_IMAGE_UPLOAD_MB}MB. Please choose smaller photos.`);
      }
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
          {uploadProgress < 100 ? 'Preparing your project brief...' : 'Finalizing your project scope...'}
        </Text>

        <Text
          className="text-base text-gray-500 mt-4 text-center mb-6"
          style={{ fontFamily: 'Poppins_400Regular' }}
        >
          {uploadProgress < 100
            ? 'Uploading photos and project details'
            : 'Saving your project for AI scope generation'}
        </Text>

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
            Share project details to generate an AI-ready scope.
          </Text>
        </View>
        <View className="flex-1 justify-center items-center py-20" style={{ paddingHorizontal: horizontalPadding }}>
          <Text className="text-gray-500 text-center text-lg mb-4" style={{ fontFamily: 'Poppins_600SemiBold' }}>
            Sign in to continue
          </Text>
          <Text className="text-gray-400 text-center text-sm mb-6" style={{ fontFamily: 'Poppins_400Regular' }}>
            Create an account or log in to upload your project and generate a detailed scope.
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

  const availableFilters = selectedProjectType ? PROJECT_TYPE_FILTERS[selectedProjectType] : [];
  const expectsProblemPhotos = selectedProjectType === 'repair';

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
          Keep it simple: add photos, describe your project, and define success.
        </Text>
      </View>

      <View className="pb-8" style={{ paddingHorizontal: horizontalPadding }}>
        <View className="bg-gray-50 border border-gray-200 rounded-2xl p-4 mb-6">
          <View className="flex-row items-start">
            <AlertCircle size={20} color="#374151" strokeWidth={2} className="mr-2 mt-0.5" />
            <View className="flex-1">
              <Text className="text-gray-900 text-sm mb-1" style={{ fontFamily: 'Poppins_600SemiBold' }}>
                AI-ready upload checklist
              </Text>
              <Text className="text-gray-600 text-xs leading-5" style={{ fontFamily: 'Poppins_400Regular' }}>
                Upload up to {MAX_PLAN_PHOTOS} clear photos, choose a project focus, describe your needs, and add one sentence for your success goal.
              </Text>
            </View>
          </View>
        </View>

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

        <View className="mb-4">
          <Text
            className="text-sm text-gray-700 mb-2"
            style={{ fontFamily: 'Poppins_500Medium' }}
          >
            Project Type *
          </Text>
          <View className="flex-row flex-wrap" style={{ gap: 8 }}>
            {(['repair', 'upgrades', 'renovation', 'full_builds'] as ProjectType[]).map((type) => (
              <TouchableOpacity
                key={type}
                onPress={() => setSelectedProjectType(type)}
                className={`flex-1 rounded-2xl py-3 px-3 border ${
                  selectedProjectType === type ? 'bg-black border-black' : 'bg-gray-50 border-gray-200'
                }`}
                style={{ minWidth: '47%' }}
              >
                <Text
                  className={`text-center text-xs ${
                    selectedProjectType === type ? 'text-white' : 'text-gray-700'
                  }`}
                  style={{ fontFamily: 'Poppins_600SemiBold' }}
                >
                  {getProjectTypeLabel(type)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {!!selectedProjectType && (
          <View className="mb-4">
            <Text
              className="text-sm text-gray-700 mb-2"
              style={{ fontFamily: 'Poppins_500Medium' }}
            >
              Project Sub-filter *
            </Text>
            <View className="flex-row flex-wrap mb-3" style={{ gap: 8 }}>
              {availableFilters.map((filter) => (
                <TouchableOpacity
                  key={filter}
                  onPress={() => setSelectedProjectFilter(filter)}
                  className={`rounded-full px-4 py-2 border ${
                    selectedProjectFilter === filter ? 'bg-black border-black' : 'bg-white border-gray-300'
                  }`}
                >
                  <Text
                    className={`text-xs ${selectedProjectFilter === filter ? 'text-white' : 'text-gray-700'}`}
                    style={{ fontFamily: 'Poppins_500Medium' }}
                  >
                    {filter}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <View className="bg-gray-50 rounded-2xl p-5 border border-gray-200">
              <TextInput
                className="text-base text-black"
                style={{ fontFamily: 'Poppins_400Regular' }}
                placeholder="Type a custom sub-filter if needed"
                placeholderTextColor="#A3A3A3"
                value={selectedProjectFilter}
                onChangeText={setSelectedProjectFilter}
              />
            </View>
          </View>
        )}

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

        {address && (
          <View className="mb-6 bg-gray-50 border border-gray-200 rounded-2xl p-4">
            <Text className="text-gray-900 text-sm mb-1" style={{ fontFamily: 'Poppins_600SemiBold' }}>
              Project Location
            </Text>
            <Text className="text-gray-600 text-xs" style={{ fontFamily: 'Poppins_400Regular' }}>
              {address}
            </Text>
          </View>
        )}

        <View className="mb-6">
          <Text
            className="text-sm text-gray-700 mb-2"
            style={{ fontFamily: 'Poppins_500Medium' }}
          >
            {expectsProblemPhotos ? 'Photos of Problem Areas (Optional)' : `Project Photos (${MAX_PLAN_PHOTOS} max, optional)`}
          </Text>

          <TouchableOpacity
            onPress={handlePickPlanPhotos}
            className="bg-gray-50 rounded-2xl border-2 border-dashed border-gray-300 p-6 mb-3"
          >
            <View className="items-center">
              <View className="bg-black rounded-full p-3 mb-3">
                <Upload size={24} color="#FFFFFF" strokeWidth={2} />
              </View>
              <Text
                className="text-black text-sm mb-1"
                style={{ fontFamily: 'Poppins_600SemiBold' }}
              >
                Upload photos ({selectedPlanPhotos.length}/{MAX_PLAN_PHOTOS})
              </Text>
              <Text
                className="text-gray-500 text-xs text-center"
                style={{ fontFamily: 'Poppins_400Regular' }}
              >
                Use clear photos so the AI can interpret the scope accurately.
              </Text>
            </View>
          </TouchableOpacity>

          {planPhotoSizeMessage ? (
            <View className="bg-red-50 border border-red-200 rounded-xl px-3 py-2.5 mb-3">
              <Text className="text-red-700 text-xs leading-5" style={{ fontFamily: 'Poppins_500Medium' }}>
                {planPhotoSizeMessage}
              </Text>
            </View>
          ) : null}

          {selectedPlanPhotos.length > 0 && (
            <View className="flex-row flex-wrap" style={{ gap: 8 }}>
              {selectedPlanPhotos.map((photo, index) => (
                <View
                  key={`${photo.uri}-${index}`}
                  className="bg-gray-100 rounded-xl p-1 border border-gray-200"
                  style={{ width: '31%' }}
                >
                  <Image
                    source={{ uri: photo.uri }}
                    className="w-full h-24 rounded-lg"
                    resizeMode="cover"
                  />
                  <TouchableOpacity
                    onPress={() => handleRemovePlanPhoto(index)}
                    className="absolute top-2 right-2 bg-white rounded-full p-1"
                  >
                    <X size={14} color="#111827" strokeWidth={2} />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
        </View>

        <View className="mb-6">
          <Text
            className="text-sm text-gray-700 mb-2"
            style={{ fontFamily: 'Poppins_500Medium' }}
          >
            Architectural Plan (PDF) {expectsProblemPhotos ? '(Optional)' : '(Optional but recommended)'}
          </Text>

          {!selectedPdf ? (
            <TouchableOpacity
              onPress={handlePickPdf}
              className="bg-gray-50 rounded-2xl border-2 border-dashed border-gray-300 p-6"
            >
              <View className="items-center">
                <View className="bg-black rounded-full p-3 mb-3">
                  <Upload size={24} color="#FFFFFF" strokeWidth={2} />
                </View>
                <Text
                  className="text-black text-sm mb-1 text-center"
                  style={{ fontFamily: 'Poppins_600SemiBold' }}
                >
                  Add PDF (optional)
                </Text>
                <Text
                  className="text-gray-500 text-xs text-center"
                  style={{ fontFamily: 'Poppins_400Regular' }}
                >
                  If you have drawings/specs, attach one PDF to improve future AI analysis.
                </Text>
              </View>
            </TouchableOpacity>
          ) : (
            <View className="bg-gray-50 border border-gray-200 rounded-2xl p-4">
              <View className="flex-row items-start justify-between">
                <View className="flex-row items-start flex-1">
                  <FileText size={22} color="#111827" strokeWidth={2} className="mr-3" />
                  <View className="flex-1">
                    <Text className="text-gray-900 text-sm mb-1" style={{ fontFamily: 'Poppins_600SemiBold' }}>
                      {selectedPdf.name}
                    </Text>
                    <Text className="text-gray-600 text-xs" style={{ fontFamily: 'Poppins_400Regular' }}>
                      {(selectedPdf.size / 1024 / 1024).toFixed(2)} MB
                    </Text>
                  </View>
                </View>
                <TouchableOpacity onPress={handleRemovePdf} className="ml-2">
                  <X size={22} color="#111827" strokeWidth={2} />
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>

        <View className="mb-4">
          <Text
            className="text-sm text-gray-700 mb-2"
            style={{ fontFamily: 'Poppins_500Medium' }}
          >
            {projectDescriptionPrompt}
          </Text>
          <View className="bg-gray-50 rounded-2xl p-5 border border-gray-200">
            <TextInput
              className="text-base text-black"
              style={{ fontFamily: 'Poppins_400Regular', minHeight: 96, textAlignVertical: 'top' }}
              placeholder={projectDescriptionPlaceholder}
              placeholderTextColor="#A3A3A3"
              value={projectDescription}
              onChangeText={setProjectDescription}
              multiline
              maxLength={1200}
            />
          </View>
        </View>

        <View className="mb-6">
          <Text
            className="text-sm text-gray-700 mb-2"
            style={{ fontFamily: 'Poppins_500Medium' }}
          >
            One-sentence success goal *
          </Text>
          <View className="bg-gray-50 rounded-2xl p-5 border border-gray-200">
            <TextInput
              className="text-base text-black"
              style={{ fontFamily: 'Poppins_400Regular' }}
              placeholder="Example: I want this home leak-free and durable before rainy season."
              placeholderTextColor="#A3A3A3"
              value={successCriteria}
              onChangeText={setSuccessCriteria}
              maxLength={240}
            />
          </View>
        </View>

        <TouchableOpacity
          onPress={handleUpload}
          disabled={!canSubmit}
          className={`rounded-full py-5 px-8 ${canSubmit ? 'bg-black' : 'bg-gray-200'}`}
        >
          <Text
            className={`text-lg text-center ${canSubmit ? 'text-white' : 'text-gray-400'}`}
            style={{ fontFamily: 'Poppins_700Bold' }}
          >
            Process Plan with AI
          </Text>
        </TouchableOpacity>

        <Text
          className="text-xs text-gray-400 text-center mt-3"
          style={{ fontFamily: 'Poppins_400Regular' }}
        >
          Your details are saved now. AI scope generation will expand as integrations go live.
        </Text>
      </View>
    </ScrollView>
  );
}
