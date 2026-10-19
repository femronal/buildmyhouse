import { View, Text, ScrollView, TouchableOpacity, Image, ActivityIndicator, Platform, Modal, TextInput } from "react-native";
import { useRouter } from "expo-router";
import { ArrowLeft, Camera, X, FileText, Bed, Bath, Maximize, Plus, Calendar, Edit3, Upload } from "lucide-react-native";
import { useState, useRef, useEffect } from "react";
import * as ImagePicker from 'expo-image-picker';
import { designService } from '@/services/designService';
import { useMyDesigns, useDeleteDesign, useUpdateDesign } from '@/hooks/useDesigns';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAppAlert } from "../../components/AppAlertProvider";
import { useGCProfile } from '@/hooks/useGCProfile';
import { useResponsivePadding } from '@/lib/responsive-layout';
import { uploadFile } from '@/utils/fileUpload';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AboutPlansBox } from '@/components/gc-plans/AboutPlansBox';
import { DraftPlanRow, PlanCard } from '@/components/gc-plans/PlanCard';
import { PlanFilterTabs } from '@/components/gc-plans/PlanFilterTabs';
import { PlanSummaryStrip } from '@/components/gc-plans/PlanSummaryStrip';
import { getPlanStatus } from '@/components/gc-plans/plan-status';

interface ImageWithLabel {
  uri: string;
  label: string;
  existingUrl?: string;
  fileName?: string;
  mimeType?: string;
}

type PlanType = 'repair' | 'upgrades' | 'renovation' | 'full_builds';
type ApiPlanType = 'homebuilding' | 'renovation' | 'interior_design';

const PLAN_TYPE_OPTIONS: { value: PlanType; label: string }[] = [
  { value: 'repair', label: 'Repair' },
  { value: 'upgrades', label: 'Upgrades' },
  { value: 'renovation', label: 'Renovation' },
  { value: 'full_builds', label: 'Full Builds' },
];

const CUSTOM_FILTER_VALUE = '__custom__';
const UPLOAD_FORM_DRAFT_STORAGE_KEY = 'gcPlans:uploadFormDraft:v1';

type ConstructionPhaseDraft = {
  name: string;
  description: string;
  estimatedDuration: string;
  estimatedCost: number;
};

type UploadFormDraft = {
  name: string;
  description: string;
  planType: PlanType;
  selectedPlanFilter: string;
  customPlanFilter: string;
  bedrooms: string;
  bathrooms: string;
  squareFootage: string;
  estimatedCost: string;
  floors: string;
  estimatedDuration: string;
  rooms: string[];
  materials: string[];
  features: string[];
  constructionPhases: ConstructionPhaseDraft[];
  images: ImageWithLabel[];
};

const PLAN_TYPE_FILTER_OPTIONS: Record<PlanType, string[]> = {
  repair: [
    'Electricals',
    'Plumbing Fixes',
    'Roof Leak Repair',
    'Drainage Fix',
    'Bathroom Repair',
    'Gate/Fence Repair',
  ],
  upgrades: [
    'Kitchen Upgrade',
    'Bedroom Upgrade',
    'Security Gate Upgrade',
    'Door Upgrade',
    'Bathroom Upgrade',
    'Lighting Upgrade',
  ],
  renovation: [
    'Room-by-Room',
    'Occupied Home',
    'Family Home Rehab',
    'Rental Prep',
    'Interior Refresh',
  ],
  full_builds: [
    'Bungalow Build',
    'Duplex Build',
    'Blockwork + Roofing',
    'Shell to Finish',
    'Turnkey Build',
  ],
};

function formatPlanTypeLabel(planType?: string | null): string {
  if (planType === 'repair') return 'Repair';
  if (planType === 'upgrades' || planType === 'interior_design') return 'Upgrades';
  if (planType === 'renovation') return 'Renovation';
  if (planType === 'full_builds' || planType === 'homebuilding') return 'Full Builds';
  return 'Repair';
}

function mapPlanTypeForApi(planType: PlanType): ApiPlanType {
  if (planType === 'upgrades') return 'interior_design';
  if (planType === 'full_builds') return 'homebuilding';
  // Keep both Repair and Renovation under backend's renovation type for now.
  return 'renovation';
}

function mapApiPlanTypeToUi(planType?: string | null): PlanType {
  if (planType === 'interior_design' || planType === 'upgrades') return 'upgrades';
  if (planType === 'homebuilding' || planType === 'full_builds') return 'full_builds';
  if (planType === 'renovation') return 'renovation';
  return 'repair';
}

function resolveUiPlanTypeFromDesign(design: any): PlanType {
  const tag = `${design?.projectTypeTag || ''}`.toLowerCase();
  if (tag === 'repair') return 'repair';
  if (tag === 'upgrades') return 'upgrades';
  if (tag === 'renovation') return 'renovation';
  if (tag === 'full_builds') return 'full_builds';
  return mapApiPlanTypeToUi(design?.planType);
}

function getProjectFilterSelection(planType: PlanType, savedFilter?: string | null) {
  const available = PLAN_TYPE_FILTER_OPTIONS[planType] || [];
  const normalizedSaved = (savedFilter || '').trim();
  if (!normalizedSaved) {
    return { selectedFilter: available[0] || CUSTOM_FILTER_VALUE, customFilter: '' };
  }
  const match = available.find((filter) => filter.toLowerCase() === normalizedSaved.toLowerCase());
  if (match) {
    return { selectedFilter: match, customFilter: '' };
  }
  return { selectedFilter: CUSTOM_FILTER_VALUE, customFilter: normalizedSaved };
}

function getPlanTypeTagClasses(planType?: string | null): { container: string; text: string } {
  const normalized = mapApiPlanTypeToUi(planType);
  if (normalized === 'repair') {
    return {
      container: 'bg-cyan-500/20 border-cyan-400',
      text: 'text-cyan-300',
    };
  }
  if (normalized === 'upgrades') {
    return {
      container: 'bg-purple-500/20 border-purple-400',
      text: 'text-purple-300',
    };
  }
  if (normalized === 'renovation') {
    return {
      container: 'bg-amber-500/20 border-amber-400',
      text: 'text-amber-300',
    };
  }
  return {
    container: 'bg-blue-600/20 border-blue-500',
    text: 'text-blue-300',
  };
}

function moneyToCents(value: unknown): number {
  const n =
    typeof value === 'number'
      ? value
      : typeof value === 'string'
        ? Number(value.replace(/[^0-9.-]/g, ''))
        : NaN;
  if (!Number.isFinite(n)) return NaN;
  return Math.round(n * 100);
}

function sumConstructionPhaseCents(
  phases: { estimatedCost: number }[],
): number {
  return phases.reduce((sum, p) => sum + (moneyToCents(p?.estimatedCost) || 0), 0);
}

function optionalSpec(value: string): number | null | undefined {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const parsed = Number(trimmed);
  if (!Number.isFinite(parsed) || parsed < 0) return undefined;
  return parsed;
}

function hasSpec(value: unknown) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0;
}

// Helper to get full image URL from backend
const getImageUrl = (imageUrl: string) => {
  if (imageUrl?.startsWith('http')) {
    return imageUrl;
  }
  const apiUrl = process.env.EXPO_PUBLIC_API_URL;
  const backendOrigin = apiUrl
    ? apiUrl.replace(/\/api\/?$/, '')
    : (__DEV__ ? 'http://localhost:3001' : 'https://api.buildmyhouse.app');
  return `${backendOrigin}${imageUrl}`;
};

function UploadForm({ onSuccess, onCancel }: { onSuccess: () => void; onCancel: () => void }) {
  const { showAlert } = useAppAlert();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [planType, setPlanType] = useState<PlanType>('repair');
  const [selectedPlanFilter, setSelectedPlanFilter] = useState<string>(
    PLAN_TYPE_FILTER_OPTIONS.repair[0],
  );
  const [customPlanFilter, setCustomPlanFilter] = useState("");
  const [bedrooms, setBedrooms] = useState("");
  const [bathrooms, setBathrooms] = useState("");
  const [squareFootage, setSquareFootage] = useState("");
  const [estimatedCost, setEstimatedCost] = useState("");
  const [floors, setFloors] = useState("");
  const [propertyDetailsOpen, setPropertyDetailsOpen] = useState(false);
  useEffect(() => {
    if (planType !== 'repair') setPropertyDetailsOpen(true);
  }, [planType]);
  const [estimatedDuration, setEstimatedDuration] = useState("");
  const [rooms, setRooms] = useState<string[]>([]);
  const [materials, setMaterials] = useState<string[]>([]);
  const [features, setFeatures] = useState<string[]>([]);
  const [constructionPhases, setConstructionPhases] = useState<{
    name: string;
    description: string;
    estimatedDuration: string;
    estimatedCost: number;
  }[]>([]);
  const [images, setImages] = useState<ImageWithLabel[]>([]);
  const [skippedDraftImageCount, setSkippedDraftImageCount] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [draftLoaded, setDraftLoaded] = useState(false);
  const queryClient = useQueryClient();
  const availablePlanFilters = PLAN_TYPE_FILTER_OPTIONS[planType] || [];
  const resolvedPlanFilter =
    selectedPlanFilter === CUSTOM_FILTER_VALUE
      ? customPlanFilter.trim()
      : selectedPlanFilter.trim();

  const createDesignMutation = useMutation({
    mutationFn: ({ designData, imageUris }: { designData: any; imageUris: any[] }) =>
      designService.createDesign(designData, imageUris),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['designs', 'my-designs'] });
      queryClient.invalidateQueries({ queryKey: ['designs'] });
      void AsyncStorage.removeItem(UPLOAD_FORM_DRAFT_STORAGE_KEY);
      onSuccess();
    },
  });

  useEffect(() => {
    let isMounted = true;
    const loadDraft = async () => {
      try {
        const rawDraft = await AsyncStorage.getItem(UPLOAD_FORM_DRAFT_STORAGE_KEY);
        if (!rawDraft) return;
        const parsedDraft = JSON.parse(rawDraft) as Partial<UploadFormDraft>;

        if (!isMounted) return;
        const nextPlanType: PlanType = PLAN_TYPE_OPTIONS.some(
          (option) => option.value === parsedDraft.planType,
        )
          ? (parsedDraft.planType as PlanType)
          : 'repair';

        setName(typeof parsedDraft.name === 'string' ? parsedDraft.name : '');
        setDescription(typeof parsedDraft.description === 'string' ? parsedDraft.description : '');
        setPlanType(nextPlanType);
        setSelectedPlanFilter(
          typeof parsedDraft.selectedPlanFilter === 'string' && parsedDraft.selectedPlanFilter.trim()
            ? parsedDraft.selectedPlanFilter
            : PLAN_TYPE_FILTER_OPTIONS[nextPlanType][0],
        );
        setCustomPlanFilter(
          typeof parsedDraft.customPlanFilter === 'string' ? parsedDraft.customPlanFilter : '',
        );
        setBedrooms(typeof parsedDraft.bedrooms === 'string' ? parsedDraft.bedrooms : '');
        setBathrooms(typeof parsedDraft.bathrooms === 'string' ? parsedDraft.bathrooms : '');
        setSquareFootage(typeof parsedDraft.squareFootage === 'string' ? parsedDraft.squareFootage : '');
        setEstimatedCost(typeof parsedDraft.estimatedCost === 'string' ? parsedDraft.estimatedCost : '');
        setFloors(typeof parsedDraft.floors === 'string' ? parsedDraft.floors : '');
        setEstimatedDuration(
          typeof parsedDraft.estimatedDuration === 'string' ? parsedDraft.estimatedDuration : '',
        );
        setRooms(Array.isArray(parsedDraft.rooms) ? parsedDraft.rooms.filter((r): r is string => typeof r === 'string') : []);
        setMaterials(
          Array.isArray(parsedDraft.materials)
            ? parsedDraft.materials.filter((m): m is string => typeof m === 'string')
            : [],
        );
        setFeatures(
          Array.isArray(parsedDraft.features)
            ? parsedDraft.features.filter((f): f is string => typeof f === 'string')
            : [],
        );
        setConstructionPhases(
          Array.isArray(parsedDraft.constructionPhases)
            ? parsedDraft.constructionPhases.map((phase) => ({
                name: typeof phase?.name === 'string' ? phase.name : '',
                description: typeof phase?.description === 'string' ? phase.description : '',
                estimatedDuration:
                  typeof phase?.estimatedDuration === 'string' ? phase.estimatedDuration : '',
                estimatedCost:
                  typeof phase?.estimatedCost === 'number' && Number.isFinite(phase.estimatedCost)
                    ? phase.estimatedCost
                    : 0,
              }))
            : [],
        );
        const restoredDraftImages = Array.isArray(parsedDraft.images)
          ? parsedDraft.images.filter(
              (image): image is ImageWithLabel =>
                !!image && typeof image.uri === 'string' && image.uri.trim().length > 0,
            )
          : [];
        const usableDraftImages =
          Platform.OS === 'web'
            ? restoredDraftImages.filter((image) => !image.uri.startsWith('blob:'))
            : restoredDraftImages;
        setSkippedDraftImageCount(
          Math.max(0, restoredDraftImages.length - usableDraftImages.length),
        );
        setImages(
          usableDraftImages.map((image, index) => ({
            uri: image.uri,
            label:
              typeof image.label === 'string' && image.label.trim()
                ? image.label
                : `Image ${index + 1}`,
            existingUrl: image.existingUrl,
            fileName: image.fileName,
            mimeType: image.mimeType,
          })),
        );
      } catch {
        // Ignore corrupted drafts and continue with a clean form.
      } finally {
        if (isMounted) setDraftLoaded(true);
      }
    };
    void loadDraft();
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!draftLoaded) return;
    const draft: UploadFormDraft = {
      name,
      description,
      planType,
      selectedPlanFilter,
      customPlanFilter,
      bedrooms,
      bathrooms,
      squareFootage,
      estimatedCost,
      floors,
      estimatedDuration,
      rooms,
      materials,
      features,
      constructionPhases,
      images,
    };

    const isEffectivelyEmpty =
      !name.trim() &&
      !description.trim() &&
      planType === 'repair' &&
      selectedPlanFilter === PLAN_TYPE_FILTER_OPTIONS.repair[0] &&
      !customPlanFilter.trim() &&
      !bedrooms.trim() &&
      !bathrooms.trim() &&
      !squareFootage.trim() &&
      !estimatedCost.trim() &&
      !floors.trim() &&
      !estimatedDuration.trim() &&
      rooms.length === 0 &&
      materials.length === 0 &&
      features.length === 0 &&
      constructionPhases.length === 0 &&
      images.length === 0;

    if (isEffectivelyEmpty) {
      void AsyncStorage.removeItem(UPLOAD_FORM_DRAFT_STORAGE_KEY);
      return;
    }

    void AsyncStorage.setItem(UPLOAD_FORM_DRAFT_STORAGE_KEY, JSON.stringify(draft));
  }, [
    draftLoaded,
    name,
    description,
    planType,
    selectedPlanFilter,
    customPlanFilter,
    bedrooms,
    bathrooms,
    squareFootage,
    estimatedCost,
    floors,
    estimatedDuration,
    rooms,
    materials,
    features,
    constructionPhases,
    images,
  ]);

  // Note: We create the file input synchronously in handlePickImage
  // to ensure it's part of the trusted user event

  const handlePickImage = async () => {
    try {
      // On web, the label handles the click automatically - no need to do anything here
      if (Platform.OS === 'web') {
        // The label will automatically trigger the file input when clicked
        // This is handled by the label's htmlFor attribute
        return;
      }
      
      // For iOS/Android, use expo-image-picker
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        showAlert('Permission needed', 'We need camera roll permissions to upload images');
        return;
      }
      
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.8,
        allowsMultipleSelection: Platform.OS === 'ios', // iOS supports multiple selection
        preferredAssetRepresentationMode: ImagePicker.UIImagePickerPreferredAssetRepresentationMode.Current,
      });

      // Handle both new API (assets array) and old API (uri directly)
      if (!result.canceled) {
        let selectedAssets: any[] = [];
        
        if (result.assets && result.assets.length > 0) {
          // New API - multiple selection
          selectedAssets = result.assets;
        } else if ((result as any).uri) {
          // Old API - single selection (Android fallback)
          selectedAssets = [{ uri: (result as any).uri }];
        }

        if (selectedAssets.length > 0) {
          const newImages = selectedAssets.map((asset, index) => ({
            uri: asset.uri,
            label: `Image ${images.length + index + 1}`,
            fileName: asset.fileName,
            mimeType: asset.mimeType,
          }));
          setImages([...images, ...newImages]);
        }
      }
    } catch (error: any) {
      console.error('❌ [GC Plans] Error picking images:', error);
      showAlert('Error', error.message || 'Failed to pick images. Please try again.');
    }
  };

  const handleRemoveImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const handleUpdateImageLabel = (index: number, label: string) => {
    const updated = [...images];
    updated[index].label = label;
    setImages(updated);
  };

  const handleSubmit = async () => {
    if (!name.trim()) {
      showAlert('Validation Error', 'Please enter a design name');
      return;
    }
    if (!description.trim()) {
      showAlert('Validation Error', 'Please enter a design description');
      return;
    }
    const bedroomCount = optionalSpec(bedrooms);
    const bathroomCount = optionalSpec(bathrooms);
    const area = optionalSpec(squareFootage);
    const floorCount = optionalSpec(floors);
    if (bedroomCount === undefined || bathroomCount === undefined || area === undefined || floorCount === undefined) {
      showAlert('Validation Error', 'Property details must be zero or a positive number, or left blank.');
      return;
    }
    if (!estimatedCost || parseFloat(estimatedCost) <= 0) {
      showAlert('Validation Error', 'Please enter a valid estimated cost');
      return;
    }
    if (!estimatedDuration.trim()) {
      showAlert('Validation Error', 'Please enter an estimated duration');
      return;
    }
    if (!resolvedPlanFilter) {
      showAlert('Validation Error', 'Please select a project filter or enter a custom one');
      return;
    }
    if (rooms.length === 0 || rooms.some((r) => !r.trim())) {
      showAlert('Validation Error', 'Please add rooms and ensure none are empty');
      return;
    }
    if (materials.length === 0 || materials.some((m) => !m.trim())) {
      showAlert('Validation Error', 'Please add materials and ensure none are empty');
      return;
    }
    if (features.length === 0 || features.some((f) => !f.trim())) {
      showAlert('Validation Error', 'Please add features and ensure none are empty');
      return;
    }
    if (constructionPhases.length === 0) {
      showAlert('Validation Error', 'Please add at least one construction phase');
      return;
    }
    for (let i = 0; i < constructionPhases.length; i++) {
      const p = constructionPhases[i];
      if (!p.name?.trim()) {
        showAlert('Validation Error', `Please enter a name for phase ${i + 1}`);
        return;
      }
      if (!p.description?.trim()) {
        showAlert('Validation Error', `Please enter a description for phase ${i + 1}`);
        return;
      }
      if (!p.estimatedDuration?.trim()) {
        showAlert('Validation Error', `Please enter a duration for phase ${i + 1}`);
        return;
      }
      const cents = moneyToCents(p.estimatedCost);
      if (!Number.isFinite(cents) || cents <= 0) {
        showAlert('Validation Error', `Please enter a valid cost for phase ${i + 1}`);
        return;
      }
    }
    if (images.length === 0) {
      showAlert('Validation Error', 'Please upload at least one image');
      return;
    }
    if (images.some((img) => !img?.label?.trim())) {
      showAlert('Validation Error', 'Please provide a label for every image');
      return;
    }

    // Budget integrity check: sum of phase costs must equal estimatedCost
    const estCostCents = moneyToCents(estimatedCost);
    const totalPhaseCents = sumConstructionPhaseCents(constructionPhases);
    if (!Number.isFinite(estCostCents) || totalPhaseCents !== estCostCents) {
      showAlert(
        'Validation Error',
        `The total of all phase costs must equal the estimated cost.\n\nPhase total: ₦${(totalPhaseCents / 100).toLocaleString()}\nEstimated cost: ₦${(estCostCents / 100).toLocaleString()}`
      );
      return;
    }

    setIsSubmitting(true);

    try {
      // Prepare design data
      const designData = {
        name: name.trim(),
        description: description.trim(),
        planType: mapPlanTypeForApi(planType),
        projectTypeTag: planType,
        projectTypeFilter: resolvedPlanFilter,
        bedrooms: optionalSpec(bedrooms),
        bathrooms: optionalSpec(bathrooms),
        squareFootage: optionalSpec(squareFootage),
        estimatedCost: parseFloat(estimatedCost),
        floors: optionalSpec(floors),
        estimatedDuration: estimatedDuration.trim(),
        // Convert arrays to comma-separated strings for backend compatibility
        rooms: rooms.filter(r => r.trim()).map(r => r.trim()).join(', '),
        materials: materials.filter(m => m.trim()).map(m => m.trim()).join(', '),
        features: features.filter(f => f.trim()).map(f => f.trim()).join(', '),
        constructionPhases: JSON.stringify(constructionPhases.map(p => ({
          name: p.name.trim(),
          description: p.description.trim(),
          estimatedDuration: p.estimatedDuration.trim(),
          estimatedCost: p.estimatedCost,
        }))),
        images: images.map((img, index) => ({
          uri: img.uri,
          label: img.label || `Image ${index + 1}`,
          order: index,
        })),
      };

      const imageUris = images.map((img) => ({ 
        uri: img.uri, 
        label: img.label || 'Image',
        fileName: img.fileName,
        mimeType: img.mimeType,
      }));

      // Use mutate with promise wrapper to avoid React development mode issues
      await new Promise<void>((resolve, reject) => {
        createDesignMutation.mutate(
          { designData, imageUris },
          {
            onSuccess: () => {
              resolve();
            },
            onError: (error) => {
              console.error('❌ [GC Plans] Mutation error:', error);
              reject(error);
            },
          }
        );
      });

      // Reset form
      setName("");
      setDescription("");
      setPlanType('repair');
      setSelectedPlanFilter(PLAN_TYPE_FILTER_OPTIONS.repair[0]);
      setCustomPlanFilter("");
      setBedrooms("");
      setBathrooms("");
      setSquareFootage("");
      setEstimatedCost("");
      setFloors("");
      setEstimatedDuration("");
      setRooms([]);
      setMaterials([]);
      setFeatures([]);
      setConstructionPhases([]);
      setImages([]);

      showAlert(
        'Success! 🎉',
        'Your design plan has been uploaded successfully. It has been sent for admin verification and will go live only after approval for required standards.',
        [{ text: 'OK' }],
      );
    } catch (error: any) {
      console.error('❌ [GC Plans] Error uploading design:', error);
      showAlert('Upload Failed', error.message || 'Failed to upload design. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ScrollView className="flex-1" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 32 }}>
      {/* Design Name */}
      <View className="mb-4">
        <Text className="text-gray-300 text-sm mb-2" style={{ fontFamily: 'Poppins_500Medium' }}>
          Design Name *
        </Text>
        <View className="bg-[#0A1628] rounded-xl px-4 py-3 flex-row items-center border border-blue-900">
          <FileText size={20} color="#6B7280" strokeWidth={2} />
          <TextInput
            className="flex-1 ml-3 text-white text-base"
            style={{ fontFamily: 'Poppins_400Regular' }}
            placeholder="e.g., Modern Minimalist"
            placeholderTextColor="#6B7280"
            value={name}
            onChangeText={setName}
          />
        </View>
      </View>

      {/* Description */}
      <View className="mb-4">
        <Text className="text-gray-300 text-sm mb-2" style={{ fontFamily: 'Poppins_500Medium' }}>
          Description
        </Text>
        <TextInput
          className="bg-[#0A1628] rounded-xl px-4 py-3 text-white text-base border border-blue-900"
          style={{ fontFamily: 'Poppins_400Regular', minHeight: 100 }}
          placeholder="Describe this design plan..."
          placeholderTextColor="#6B7280"
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={4}
        />
      </View>

      <View className="mb-4">
        <Text className="text-gray-300 text-sm mb-2" style={{ fontFamily: 'Poppins_500Medium' }}>
          Plan Type *
        </Text>
        <View className="flex-row" style={{ gap: 8 }}>
          {PLAN_TYPE_OPTIONS.map((option) => {
            const isActive = planType === option.value;
            return (
              <TouchableOpacity
                key={option.value}
                onPress={() => {
                  setPlanType(option.value);
                  setSelectedPlanFilter(PLAN_TYPE_FILTER_OPTIONS[option.value][0]);
                  setCustomPlanFilter('');
                }}
                className={`rounded-full px-4 py-2 border ${isActive ? 'bg-blue-600 border-blue-500' : 'bg-[#0A1628] border-blue-900'}`}
                activeOpacity={0.8}
              >
                <Text
                  className={isActive ? 'text-white' : 'text-gray-300'}
                  style={{ fontFamily: 'Poppins_500Medium', fontSize: 12 }}
                >
                  {option.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      <View className="mb-4">
        <Text className="text-gray-300 text-sm mb-2" style={{ fontFamily: 'Poppins_500Medium' }}>
          Project Filter *
        </Text>
        <View className="flex-row flex-wrap" style={{ gap: 8 }}>
          {availablePlanFilters.map((filter) => {
            const isActive = selectedPlanFilter === filter;
            return (
              <TouchableOpacity
                key={filter}
                onPress={() => setSelectedPlanFilter(filter)}
                className={`rounded-full px-4 py-2 border ${isActive ? 'bg-blue-600 border-blue-500' : 'bg-[#0A1628] border-blue-900'}`}
                activeOpacity={0.8}
              >
                <Text
                  className={isActive ? 'text-white' : 'text-gray-300'}
                  style={{ fontFamily: 'Poppins_500Medium', fontSize: 12 }}
                >
                  {filter}
                </Text>
              </TouchableOpacity>
            );
          })}
          <TouchableOpacity
            onPress={() => setSelectedPlanFilter(CUSTOM_FILTER_VALUE)}
            className={`rounded-full px-4 py-2 border ${selectedPlanFilter === CUSTOM_FILTER_VALUE ? 'bg-blue-600 border-blue-500' : 'bg-[#0A1628] border-blue-900'}`}
            activeOpacity={0.8}
          >
            <Text
              className={selectedPlanFilter === CUSTOM_FILTER_VALUE ? 'text-white' : 'text-gray-300'}
              style={{ fontFamily: 'Poppins_500Medium', fontSize: 12 }}
            >
              Custom
            </Text>
          </TouchableOpacity>
        </View>
        {selectedPlanFilter === CUSTOM_FILTER_VALUE && (
          <TextInput
            className="mt-3 bg-[#0A1628] rounded-xl px-4 py-3 text-white text-base border border-blue-900"
            style={{ fontFamily: 'Poppins_400Regular' }}
            placeholder="Enter custom filter (e.g., POP ceiling repairs)"
            placeholderTextColor="#6B7280"
            value={customPlanFilter}
            onChangeText={setCustomPlanFilter}
          />
        )}
      </View>

      <View className="mb-4">
        {planType === 'repair' && !propertyDetailsOpen ? (
          <TouchableOpacity onPress={() => setPropertyDetailsOpen(true)} className="bg-[#0A1628] rounded-xl px-4 py-3 border border-blue-900">
            <Text className="text-gray-300 text-sm" style={{ fontFamily: 'Poppins_500Medium' }}>
              Property details (optional)
            </Text>
          </TouchableOpacity>
        ) : (
        <>
        <Text className="text-gray-300 text-sm mb-3" style={{ fontFamily: 'Poppins_500Medium' }}>
          {planType === 'repair' ? 'Property details (optional)' : 'Specifications (optional)'}
        </Text>
        
        <View className="flex-row mb-3">
          <View className="flex-1 mr-2">
            <View className="bg-[#0A1628] rounded-xl px-4 py-3 flex-row items-center border border-blue-900">
              <Bed size={18} color="#6B7280" strokeWidth={2} />
              <TextInput
                className="flex-1 ml-3 text-white text-base"
                style={{ fontFamily: 'Poppins_400Regular' }}
                placeholder="Bedrooms"
                placeholderTextColor="#6B7280"
                value={bedrooms}
                onChangeText={setBedrooms}
                keyboardType="numeric"
              />
            </View>
          </View>
          
          <View className="flex-1 ml-2">
            <View className="bg-[#0A1628] rounded-xl px-4 py-3 flex-row items-center border border-blue-900">
              <Bath size={18} color="#6B7280" strokeWidth={2} />
              <TextInput
                className="flex-1 ml-3 text-white text-base"
                style={{ fontFamily: 'Poppins_400Regular' }}
                placeholder="Bathrooms"
                placeholderTextColor="#6B7280"
                value={bathrooms}
                onChangeText={setBathrooms}
                keyboardType="numeric"
              />
            </View>
          </View>
        </View>

        <View className="flex-row mb-3">
          <View className="flex-1 mr-2">
            <View className="bg-[#0A1628] rounded-xl px-4 py-3 flex-row items-center border border-blue-900">
              <Maximize size={18} color="#6B7280" strokeWidth={2} />
              <TextInput
                className="flex-1 ml-3 text-white text-base"
                style={{ fontFamily: 'Poppins_400Regular' }}
                placeholder="Square Feet"
                placeholderTextColor="#6B7280"
                value={squareFootage}
                onChangeText={setSquareFootage}
                keyboardType="numeric"
              />
            </View>
          </View>
          
          <View className="flex-1 ml-2">
            <View className="bg-[#0A1628] rounded-xl px-4 py-3 flex-row items-center border border-blue-900">
              <TextInput
                className="flex-1 text-white text-base"
                style={{ fontFamily: 'Poppins_400Regular' }}
                placeholder="Floors"
                placeholderTextColor="#6B7280"
                value={floors}
                onChangeText={setFloors}
                keyboardType="numeric"
              />
            </View>
          </View>
        </View>
        </>
        )}
      </View>

      {/* Edit Project Analysis Section - Matching Review Project Page Format */}
      <View className="bg-[#1E3A5F] rounded-2xl mb-4 border-2 border-yellow-600/30" style={{ padding: 20 }}>
        <View className="flex-row items-center justify-between mb-4">
          <View className="flex-row items-center">
            <Edit3 size={20} color="#F59E0B" strokeWidth={2} />
            <Text className="text-yellow-400 text-lg ml-2" style={{ fontFamily: 'Poppins_700Bold' }}>
              Edit Project Analysis
            </Text>
          </View>
        </View>

        {/* Budget */}
        <View className="mb-4">
          <Text className="text-gray-300 text-sm mb-2" style={{ fontFamily: 'Poppins_500Medium' }}>
            Estimated Budget *
          </Text>
          <View className="bg-[#0A1628] rounded-xl px-4 py-3 flex-row items-center border border-blue-900">
            <Text className="text-gray-500 text-base" style={{ fontFamily: 'Poppins_600SemiBold' }}>
              ₦
            </Text>
            <TextInput
              className="flex-1 ml-3 text-white text-base"
              style={{ fontFamily: 'Poppins_400Regular' }}
              placeholder="Enter estimated budget"
              placeholderTextColor="#6B7280"
              value={estimatedCost}
              onChangeText={setEstimatedCost}
              keyboardType="numeric"
            />
          </View>
        </View>

        {/* Duration */}
        <View className="mb-4">
          <Text className="text-gray-300 text-sm mb-2" style={{ fontFamily: 'Poppins_500Medium' }}>
            Estimated Duration *
          </Text>
          <View className="bg-[#0A1628] rounded-xl px-4 py-3 flex-row items-center border border-blue-900">
            <Calendar size={20} color="#6B7280" strokeWidth={2} />
            <TextInput
              className="flex-1 ml-3 text-white text-base"
              style={{ fontFamily: 'Poppins_400Regular' }}
              placeholder="e.g., 6-8 months"
              placeholderTextColor="#6B7280"
              value={estimatedDuration}
              onChangeText={setEstimatedDuration}
            />
          </View>
        </View>

        {/* Rooms */}
        <View className="mb-4">
          <Text className="text-gray-300 text-sm mb-2" style={{ fontFamily: 'Poppins_500Medium' }}>
            Rooms
          </Text>
          {rooms.map((room, index) => (
            <View key={index} className="flex-row items-center mb-2 w-full" style={{ gap: 8 }}>
              <TextInput
                className="bg-[#0A1628] rounded-xl px-3 py-2.5 text-white text-sm border border-blue-900"
                style={{ fontFamily: 'Poppins_400Regular', flex: 1, minWidth: 0 }}
                placeholder="Room name (e.g., Kitchen, Living Room)"
                placeholderTextColor="#6B7280"
                value={room}
                onChangeText={(value) => {
                  const updated = [...rooms];
                  updated[index] = value;
                  setRooms(updated);
                }}
              />
              <TouchableOpacity
                onPress={() => setRooms(rooms.filter((_, i) => i !== index))}
                className="bg-red-600/20 rounded-lg items-center justify-center"
                style={{ width: 36, height: 36, flexShrink: 0 }}
              >
                <X size={16} color="#F87171" strokeWidth={2} />
              </TouchableOpacity>
            </View>
          ))}
          <TouchableOpacity
            onPress={() => setRooms([...rooms, ''])}
            className="bg-blue-600/20 border border-blue-600 rounded-xl px-4 py-3"
          >
            <Text className="text-blue-400 text-center" style={{ fontFamily: 'Poppins_600SemiBold' }}>
              + Add Room
            </Text>
          </TouchableOpacity>
        </View>

        {/* Materials */}
        <View className="mb-4">
          <Text className="text-gray-300 text-sm mb-2" style={{ fontFamily: 'Poppins_500Medium' }}>
            Key Materials
          </Text>
          {materials.map((material, index) => (
            <View key={index} className="flex-row items-center mb-2 w-full" style={{ gap: 8 }}>
              <TextInput
                className="bg-[#0A1628] rounded-xl px-3 py-2.5 text-white text-sm border border-blue-900"
                style={{ fontFamily: 'Poppins_400Regular', flex: 1, minWidth: 0 }}
                placeholder="Material name (e.g., Concrete, Steel, Wood)"
                placeholderTextColor="#6B7280"
                value={material}
                onChangeText={(value) => {
                  const updated = [...materials];
                  updated[index] = value;
                  setMaterials(updated);
                }}
              />
              <TouchableOpacity
                onPress={() => setMaterials(materials.filter((_, i) => i !== index))}
                className="bg-red-600/20 rounded-lg items-center justify-center"
                style={{ width: 36, height: 36, flexShrink: 0 }}
              >
                <X size={16} color="#F87171" strokeWidth={2} />
              </TouchableOpacity>
            </View>
          ))}
          <TouchableOpacity
            onPress={() => setMaterials([...materials, ''])}
            className="bg-blue-600/20 border border-blue-600 rounded-xl px-4 py-3"
          >
            <Text className="text-blue-400 text-center" style={{ fontFamily: 'Poppins_600SemiBold' }}>
              + Add Material
            </Text>
          </TouchableOpacity>
        </View>

        {/* Features */}
        <View className="mb-4">
          <Text className="text-gray-300 text-sm mb-2" style={{ fontFamily: 'Poppins_500Medium' }}>
            Features
          </Text>
          {features.map((feature, index) => (
            <View key={index} className="flex-row items-center mb-2 w-full" style={{ gap: 8 }}>
              <TextInput
                className="bg-[#0A1628] rounded-xl px-3 py-2.5 text-white text-sm border border-blue-900"
                style={{ fontFamily: 'Poppins_400Regular', flex: 1, minWidth: 0 }}
                placeholder="Feature name (e.g., Solar Panels, Smart Home)"
                placeholderTextColor="#6B7280"
                value={feature}
                onChangeText={(value) => {
                  const updated = [...features];
                  updated[index] = value;
                  setFeatures(updated);
                }}
              />
              <TouchableOpacity
                onPress={() => setFeatures(features.filter((_, i) => i !== index))}
                className="bg-red-600/20 rounded-lg items-center justify-center"
                style={{ width: 36, height: 36, flexShrink: 0 }}
              >
                <X size={16} color="#F87171" strokeWidth={2} />
              </TouchableOpacity>
            </View>
          ))}
          <TouchableOpacity
            onPress={() => setFeatures([...features, ''])}
            className="bg-blue-600/20 border border-blue-600 rounded-xl px-4 py-3"
          >
            <Text className="text-blue-400 text-center" style={{ fontFamily: 'Poppins_600SemiBold' }}>
              + Add Feature
            </Text>
          </TouchableOpacity>
        </View>

        {/* Construction Phases */}
        <View className="mb-4">
          <Text className="text-gray-300 text-sm mb-2" style={{ fontFamily: 'Poppins_500Medium' }}>
            Construction Phases
          </Text>
          {constructionPhases.map((phase, index) => (
            <View key={index} className="bg-[#0A1628] rounded-xl p-4 mb-3 border border-blue-900">
              <TextInput
                className="bg-[#1E3A5F] rounded-lg px-3 py-2 text-white text-base mb-2"
                style={{ fontFamily: 'Poppins_600SemiBold' }}
                placeholder="Phase name (e.g., Foundation, Framing)"
                placeholderTextColor="#6B7280"
                value={phase.name}
                onChangeText={(value) => {
                  const updated = [...constructionPhases];
                  updated[index] = { ...updated[index], name: value };
                  setConstructionPhases(updated);
                }}
              />
              <TextInput
                className="bg-[#1E3A5F] rounded-lg px-3 py-2 text-white text-sm mb-2"
                style={{ fontFamily: 'Poppins_400Regular', minHeight: 60 }}
                placeholder="Description"
                placeholderTextColor="#6B7280"
                value={phase.description}
                onChangeText={(value) => {
                  const updated = [...constructionPhases];
                  updated[index] = { ...updated[index], description: value };
                  setConstructionPhases(updated);
                }}
                multiline
              />
              <View className="flex-row items-center gap-3 min-w-0">
                <TextInput
                  className="flex-1 bg-[#1E3A5F] rounded-lg px-3 py-2 text-white text-sm min-w-0"
                  style={{ fontFamily: 'Poppins_400Regular' }}
                  placeholder="Duration (e.g., 4-6 weeks)"
                  placeholderTextColor="#6B7280"
                  value={phase.estimatedDuration}
                  onChangeText={(value) => {
                    const updated = [...constructionPhases];
                    updated[index] = { ...updated[index], estimatedDuration: value };
                    setConstructionPhases(updated);
                  }}
                />
                <View className="flex-1 relative min-w-0">
                  <Text
                    className="absolute left-3 top-2 text-gray-400 text-sm z-10"
                    style={{ fontFamily: 'Poppins_600SemiBold' }}
                  >
                    ₦
                  </Text>
                  <TextInput
                    className="bg-[#1E3A5F] rounded-lg pl-7 pr-3 py-2 text-white text-sm"
                    style={{ fontFamily: 'Poppins_400Regular' }}
                    placeholder="Cost"
                    placeholderTextColor="#6B7280"
                    value={phase.estimatedCost > 0 ? phase.estimatedCost.toString() : ''}
                    onChangeText={(value) => {
                      const updated = [...constructionPhases];
                      updated[index] = { ...updated[index], estimatedCost: parseFloat(value) || 0 };
                      setConstructionPhases(updated);
                    }}
                    keyboardType="numeric"
                  />
                </View>
                <TouchableOpacity
                  onPress={() => setConstructionPhases(constructionPhases.filter((_, i) => i !== index))}
                  className="bg-red-600/20 rounded-lg justify-center items-center"
                  style={{ width: 36, height: 36, flexShrink: 0 }}
                >
                  <X size={16} color="#F87171" strokeWidth={2} />
                </TouchableOpacity>
              </View>
            </View>
          ))}
          <TouchableOpacity
            onPress={() => setConstructionPhases([...constructionPhases, { name: '', description: '', estimatedDuration: '', estimatedCost: 0 }])}
            className="bg-blue-600/20 border border-blue-600 rounded-xl px-4 py-3"
          >
            <Text className="text-blue-400 text-center" style={{ fontFamily: 'Poppins_600SemiBold' }}>
              + Add Construction Phase
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Images */}
      <View className="mb-6">
        <Text className="text-gray-300 text-sm mb-3" style={{ fontFamily: 'Poppins_500Medium' }}>
          Design Photos * (Kitchen, Bathroom, Exterior, etc.)
        </Text>
        {skippedDraftImageCount > 0 && (
          <View className="bg-amber-900/30 border border-amber-700 rounded-xl p-3 mb-3">
            <Text className="text-amber-200 text-xs leading-5" style={{ fontFamily: 'Poppins_500Medium' }}>
              Please reselect photos after browser refresh. {skippedDraftImageCount} saved draft photo
              {skippedDraftImageCount > 1 ? 's were' : ' was'} not restorable.
            </Text>
          </View>
        )}
        
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-3">
          {images.map((image, index) => (
            <View key={index} className="mr-3 relative">
              <Image 
                source={{ uri: image.uri }} 
                className="w-32 h-32 rounded-xl" 
                resizeMode="cover"
              />
              <TouchableOpacity
                onPress={() => handleRemoveImage(index)}
                className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full items-center justify-center"
              >
                <X size={14} color="#FFFFFF" strokeWidth={2} />
              </TouchableOpacity>
              <TextInput
                className="bg-black/70 rounded-lg px-2 py-1 mt-1 text-white text-xs"
                style={{ fontFamily: 'Poppins_400Regular', width: 128 }}
                placeholder="Label (e.g., Kitchen)"
                placeholderTextColor="#9CA3AF"
                value={image.label}
                onChangeText={(label) => handleUpdateImageLabel(index, label)}
              />
            </View>
          ))}
          
          {Platform.OS === 'web' ? (
            <label
              htmlFor="file-input-gc-plans"
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                width: 128,
                height: 128,
                backgroundColor: '#1E3A5F',
                borderRadius: 12,
                borderWidth: 1,
                borderStyle: 'dashed',
                borderColor: '#1E40AF',
                cursor: 'pointer',
              }}
            >
              <input
                id="file-input-gc-plans"
                ref={fileInputRef as any}
                type="file"
                accept="image/*"
                multiple
                style={{
                  display: 'none',
                }}
                onChange={(e: any) => {
                  const files = Array.from(e.target.files || []) as File[];
                  
                  if (files.length > 0) {
                    setImages(prev => {
                      const newImages = files.map((file, index) => {
                        const uri = URL.createObjectURL(file);
                        return {
                          uri,
                          label: `Image ${prev.length + index + 1}`,
                          fileName: file.name,
                          mimeType: file.type,
                        };
                      });
                      return [...prev, ...newImages];
                    });
                  }
                  
                  // Reset input
                  if (e.target) {
                    e.target.value = '';
                  }
                }}
              />
              <Camera size={24} color="#3B82F6" strokeWidth={2} />
              <Text className="text-blue-400 text-xs mt-2 text-center" style={{ fontFamily: 'Poppins_500Medium' }}>
                Add Photo
              </Text>
            </label>
          ) : (
            <TouchableOpacity
              onPress={handlePickImage}
              className="w-32 h-32 bg-[#1E3A5F] rounded-xl items-center justify-center border border-dashed border-blue-700"
              activeOpacity={0.7}
            >
              <Camera size={24} color="#3B82F6" strokeWidth={2} />
              <Text className="text-blue-400 text-xs mt-2 text-center" style={{ fontFamily: 'Poppins_500Medium' }}>
                Add Photo
              </Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      </View>

      {/* Buttons */}
      <View className="flex-row mb-8 px-0" style={{ gap: 12 }}>
        <TouchableOpacity
          onPress={onCancel}
          disabled={isSubmitting}
          className="flex-1 bg-[#1E3A5F] rounded-full py-4 items-center justify-center"
          style={{ marginRight: 6 }}
        >
          <Text className="text-white text-lg" style={{ fontFamily: 'Poppins_700Bold' }}>
            Cancel
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={(e) => {
            handleSubmit();
          }}
          disabled={isSubmitting}
          className={`flex-1 bg-blue-600 rounded-full py-4 items-center justify-center ${isSubmitting ? 'opacity-50' : ''}`}
          activeOpacity={0.7}
          style={{ marginLeft: 6 }}
        >
          {isSubmitting ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <View className="w-10 h-10 rounded-full bg-white/15 items-center justify-center border border-white/25">
              <Upload size={20} color="#FFFFFF" strokeWidth={2.5} />
            </View>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

function EditForm({ design, onSuccess, onCancel }: { design: any; onSuccess: () => void; onCancel: () => void }) {
  const { showAlert } = useAppAlert();
  const initialPlanType = resolveUiPlanTypeFromDesign(design);
  const initialProjectFilterSelection = getProjectFilterSelection(initialPlanType, design.projectTypeFilter);
  const [name, setName] = useState(design.name || "");
  const [description, setDescription] = useState(design.description || "");
  const [planType, setPlanType] = useState<PlanType>(initialPlanType);
  const [selectedPlanFilter, setSelectedPlanFilter] = useState<string>(initialProjectFilterSelection.selectedFilter);
  const [customPlanFilter, setCustomPlanFilter] = useState<string>(initialProjectFilterSelection.customFilter);
  const [bedrooms, setBedrooms] = useState(design.bedrooms?.toString() || "");
  const [bathrooms, setBathrooms] = useState(design.bathrooms?.toString() || "");
  const [squareFootage, setSquareFootage] = useState(design.squareFootage?.toString() || "");
  const [estimatedCost, setEstimatedCost] = useState(design.estimatedCost?.toString() || "");
  const [floors, setFloors] = useState(design.floors?.toString() || "");
  const [propertyDetailsOpen, setPropertyDetailsOpen] = useState(initialPlanType !== 'repair' || hasSpec(design.bedrooms) || hasSpec(design.bathrooms) || hasSpec(design.squareFootage) || hasSpec(design.floors));
  useEffect(() => {
    if (planType !== 'repair') setPropertyDetailsOpen(true);
  }, [planType]);
  const [estimatedDuration, setEstimatedDuration] = useState(design.estimatedDuration || "");
  const [rooms, setRooms] = useState<string[]>(Array.isArray(design.rooms) ? design.rooms : (design.rooms ? design.rooms.split(',').map((r: string) => r.trim()).filter((r: string) => r) : []));
  const [materials, setMaterials] = useState<string[]>(Array.isArray(design.materials) ? design.materials : (design.materials ? design.materials.split(',').map((m: string) => m.trim()).filter((m: string) => m) : []));
  const [features, setFeatures] = useState<string[]>(Array.isArray(design.features) ? design.features : (design.features ? design.features.split(',').map((f: string) => f.trim()).filter((f: string) => f) : []));
  const [constructionPhases, setConstructionPhases] = useState<{
    name: string;
    description: string;
    estimatedDuration: string;
    estimatedCost: number;
  }[]>(() => {
    if (!design.constructionPhases) return [];
    try {
      const phases = typeof design.constructionPhases === 'string' 
        ? JSON.parse(design.constructionPhases) 
        : design.constructionPhases;
      return Array.isArray(phases) ? phases : [];
    } catch {
      return [];
    }
  });
  const [images, setImages] = useState<ImageWithLabel[]>(() =>
    Array.isArray(design.images)
      ? design.images.map((image: any, index: number) => ({
          uri: getImageUrl(image.url),
          existingUrl: image.url,
          label: image.label || `Image ${index + 1}`,
        }))
      : [],
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const updateDesignMutation = useUpdateDesign();
  const availablePlanFilters = PLAN_TYPE_FILTER_OPTIONS[planType] || [];
  const resolvedPlanFilter =
    selectedPlanFilter === CUSTOM_FILTER_VALUE
      ? customPlanFilter.trim()
      : selectedPlanFilter.trim();

  const handleSubmit = async () => {
    if (!name.trim()) {
      showAlert('Validation Error', 'Please enter a design name');
      return;
    }
    if (!description.trim()) {
      showAlert('Validation Error', 'Please enter a design description');
      return;
    }
    const bedroomCount = optionalSpec(bedrooms);
    const bathroomCount = optionalSpec(bathrooms);
    const area = optionalSpec(squareFootage);
    const floorCount = optionalSpec(floors);
    if (bedroomCount === undefined || bathroomCount === undefined || area === undefined || floorCount === undefined) {
      showAlert('Validation Error', 'Property details must be zero or a positive number, or left blank.');
      return;
    }
    if (!estimatedCost || parseFloat(estimatedCost) <= 0) {
      showAlert('Validation Error', 'Please enter a valid estimated cost');
      return;
    }
    if (!estimatedDuration.trim()) {
      showAlert('Validation Error', 'Please enter an estimated duration');
      return;
    }
    if (!resolvedPlanFilter) {
      showAlert('Validation Error', 'Please select a project filter or enter a custom one');
      return;
    }
    if (rooms.length === 0 || rooms.some((r) => !r.trim())) {
      showAlert('Validation Error', 'Please add rooms and ensure none are empty');
      return;
    }
    if (materials.length === 0 || materials.some((m) => !m.trim())) {
      showAlert('Validation Error', 'Please add materials and ensure none are empty');
      return;
    }
    if (features.length === 0 || features.some((f) => !f.trim())) {
      showAlert('Validation Error', 'Please add features and ensure none are empty');
      return;
    }
    if (constructionPhases.length === 0) {
      showAlert('Validation Error', 'Please add at least one construction phase');
      return;
    }
    for (let i = 0; i < constructionPhases.length; i++) {
      const p = constructionPhases[i];
      if (!p.name?.trim()) {
        showAlert('Validation Error', `Please enter a name for phase ${i + 1}`);
        return;
      }
      if (!p.description?.trim()) {
        showAlert('Validation Error', `Please enter a description for phase ${i + 1}`);
        return;
      }
      if (!p.estimatedDuration?.trim()) {
        showAlert('Validation Error', `Please enter a duration for phase ${i + 1}`);
        return;
      }
      const cents = moneyToCents(p.estimatedCost);
      if (!Number.isFinite(cents) || cents <= 0) {
        showAlert('Validation Error', `Please enter a valid cost for phase ${i + 1}`);
        return;
      }
    }
    if (images.length === 0) {
      showAlert('Validation Error', 'Please keep at least one design photo');
      return;
    }
    if (images.some((img) => !img?.label?.trim())) {
      showAlert('Validation Error', 'Please provide a label for every photo');
      return;
    }

    // Budget integrity check: sum of phase costs must equal estimatedCost
    const estCostCents = moneyToCents(estimatedCost);
    const totalPhaseCents = sumConstructionPhaseCents(constructionPhases);
    if (!Number.isFinite(estCostCents) || totalPhaseCents !== estCostCents) {
      showAlert(
        'Validation Error',
        `The total of all phase costs must equal the estimated cost.\n\nPhase total: ₦${(totalPhaseCents / 100).toLocaleString()}\nEstimated cost: ₦${(estCostCents / 100).toLocaleString()}`
      );
      return;
    }

    setIsSubmitting(true);

    try {
      const imagePayload = [];
      for (let i = 0; i < images.length; i++) {
        const image = images[i];
        let url = image.existingUrl;
        if (!url) {
          const uploadedUrl = await uploadFile(image.uri, 'image', {
            fileName: image.fileName,
            mimeType: image.mimeType,
          });
          url = uploadedUrl.startsWith('http') ? new URL(uploadedUrl).pathname : uploadedUrl;
        }
        imagePayload.push({
          url,
          label: image.label.trim() || `Image ${i + 1}`,
          order: i,
        });
      }

      await updateDesignMutation.mutateAsync({
        designId: design.id,
        updateData: {
          name: name.trim(),
          description: description.trim(),
          planType: mapPlanTypeForApi(planType),
          projectTypeTag: planType,
          projectTypeFilter: resolvedPlanFilter,
          bedrooms: optionalSpec(bedrooms),
          bathrooms: optionalSpec(bathrooms),
          squareFootage: optionalSpec(squareFootage),
          estimatedCost: parseFloat(estimatedCost),
          floors: optionalSpec(floors),
          estimatedDuration: estimatedDuration.trim(),
          // Convert arrays to comma-separated strings for backend compatibility
          rooms: rooms.filter(r => r.trim()).map(r => r.trim()).join(', '),
          materials: materials.filter(m => m.trim()).map(m => m.trim()).join(', '),
          features: features.filter(f => f.trim()).map(f => f.trim()).join(', '),
          constructionPhases: JSON.stringify(constructionPhases.map(p => ({
            name: p.name.trim(),
            description: p.description.trim(),
            estimatedDuration: p.estimatedDuration.trim(),
            estimatedCost: p.estimatedCost,
          }))),
          images: imagePayload,
        },
      });
      
      showAlert('Success', 'Design updated successfully!', [{ text: 'OK', onPress: onSuccess }]);
    } catch (error: any) {
      console.error('❌ [Edit Form] Error updating design:', error);
      showAlert('Error', error.message || 'Failed to update design. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePickImage = async () => {
    try {
      if (Platform.OS === 'web') return;

      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        showAlert('Permission needed', 'We need camera roll permissions to update design photos');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.8,
        allowsMultipleSelection: Platform.OS === 'ios',
        preferredAssetRepresentationMode: ImagePicker.UIImagePickerPreferredAssetRepresentationMode.Current,
      });

      if (!result.canceled) {
        const selectedAssets =
          result.assets && result.assets.length > 0
            ? result.assets
            : (result as any).uri
              ? [{ uri: (result as any).uri }]
              : [];

        if (selectedAssets.length > 0) {
          setImages((prev) => [
            ...prev,
            ...selectedAssets.map((asset: any, index: number) => ({
              uri: asset.uri,
              label: `Image ${prev.length + index + 1}`,
              fileName: asset.fileName,
              mimeType: asset.mimeType,
            })),
          ]);
        }
      }
    } catch (error: any) {
      console.error('❌ [Edit Form] Error picking images:', error);
      showAlert('Error', error.message || 'Failed to pick images. Please try again.');
    }
  };

  const handleRemoveImage = (index: number) => {
    setImages((prev) => prev.filter((_, imageIndex) => imageIndex !== index));
  };

  const handleUpdateImageLabel = (index: number, label: string) => {
    setImages((prev) =>
      prev.map((image, imageIndex) => (imageIndex === index ? { ...image, label } : image)),
    );
  };

  return (
    <ScrollView className="flex-1" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 32 }}>
      <View className="pt-4 pb-2 w-full max-w-full">
        {/* Design Name */}
        <View className="mb-4">
          <Text className="text-gray-300 text-sm mb-2" style={{ fontFamily: 'Poppins_500Medium' }}>
            Design Name *
          </Text>
          <View className="bg-[#0A1628] rounded-xl px-4 py-3 flex-row items-center border border-blue-900">
            <FileText size={20} color="#6B7280" strokeWidth={2} />
            <TextInput
              className="flex-1 ml-3 text-white text-base"
              style={{ fontFamily: 'Poppins_400Regular', minWidth: 0 }}
              placeholder="e.g., Modern Minimalist"
              placeholderTextColor="#6B7280"
              value={name}
              onChangeText={setName}
            />
          </View>
        </View>

        {/* Description */}
        <View className="mb-4">
          <Text className="text-gray-300 text-sm mb-2" style={{ fontFamily: 'Poppins_500Medium' }}>
            Description
          </Text>
          <TextInput
            className="bg-[#0A1628] rounded-xl px-4 py-3 text-white text-base border border-blue-900"
            style={{ fontFamily: 'Poppins_400Regular', minHeight: 100 }}
            placeholder="Describe this design plan..."
            placeholderTextColor="#6B7280"
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={4}
          />
        </View>

        {/* Images */}
        <View className="mb-6">
          <Text className="text-gray-300 text-sm mb-3" style={{ fontFamily: 'Poppins_500Medium' }}>
            Design Photos *
          </Text>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-3">
            {images.map((image, index) => (
              <View key={`${image.existingUrl || image.uri}-${index}`} className="mr-3 relative">
                <Image
                  source={{ uri: image.uri }}
                  className="w-32 h-32 rounded-xl"
                  resizeMode="cover"
                />
                <TouchableOpacity
                  onPress={() => handleRemoveImage(index)}
                  className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full items-center justify-center"
                >
                  <X size={14} color="#FFFFFF" strokeWidth={2} />
                </TouchableOpacity>
                <TextInput
                  className="bg-black/70 rounded-lg px-2 py-1 mt-1 text-white text-xs"
                  style={{ fontFamily: 'Poppins_400Regular', width: 128 }}
                  placeholder="Label"
                  placeholderTextColor="#9CA3AF"
                  value={image.label}
                  onChangeText={(label) => handleUpdateImageLabel(index, label)}
                />
              </View>
            ))}

            {Platform.OS === 'web' ? (
              <label
                htmlFor="file-input-edit-gc-plan"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 128,
                  height: 128,
                  backgroundColor: '#1E3A5F',
                  borderRadius: 12,
                  borderWidth: 1,
                  borderStyle: 'dashed',
                  borderColor: '#1E40AF',
                  cursor: 'pointer',
                }}
              >
                <input
                  id="file-input-edit-gc-plan"
                  type="file"
                  accept="image/*"
                  multiple
                  style={{ display: 'none' }}
                  onChange={(e: any) => {
                    const files = Array.from(e.target.files || []) as File[];
                    if (files.length > 0) {
                      setImages((prev) => [
                        ...prev,
                        ...files.map((file, index) => ({
                          uri: URL.createObjectURL(file),
                          label: `Image ${prev.length + index + 1}`,
                          fileName: file.name,
                          mimeType: file.type,
                        })),
                      ]);
                    }
                    if (e.target) e.target.value = '';
                  }}
                />
                <Camera size={24} color="#3B82F6" strokeWidth={2} />
                <Text className="text-blue-400 text-xs mt-2 text-center" style={{ fontFamily: 'Poppins_500Medium' }}>
                  Add Photo
                </Text>
              </label>
            ) : (
              <TouchableOpacity
                onPress={handlePickImage}
                className="w-32 h-32 bg-[#1E3A5F] rounded-xl items-center justify-center border border-dashed border-blue-700"
                activeOpacity={0.7}
              >
                <Camera size={24} color="#3B82F6" strokeWidth={2} />
                <Text className="text-blue-400 text-xs mt-2 text-center" style={{ fontFamily: 'Poppins_500Medium' }}>
                  Add Photo
                </Text>
              </TouchableOpacity>
            )}
          </ScrollView>
          <Text className="text-gray-500 text-xs" style={{ fontFamily: 'Poppins_400Regular' }}>
            You can update photos anytime, even after the plan is live.
          </Text>
        </View>

        <View className="mb-4">
          <Text className="text-gray-300 text-sm mb-2" style={{ fontFamily: 'Poppins_500Medium' }}>
            Plan Type *
          </Text>
          <View className="flex-row" style={{ gap: 8 }}>
            {PLAN_TYPE_OPTIONS.map((option) => {
              const isActive = planType === option.value;
              return (
                <TouchableOpacity
                  key={option.value}
                  onPress={() => {
                    setPlanType(option.value);
                    setSelectedPlanFilter(PLAN_TYPE_FILTER_OPTIONS[option.value][0]);
                    setCustomPlanFilter('');
                  }}
                  className={`rounded-full px-4 py-2 border ${isActive ? 'bg-blue-600 border-blue-500' : 'bg-[#0A1628] border-blue-900'}`}
                  activeOpacity={0.8}
                >
                  <Text
                    className={isActive ? 'text-white' : 'text-gray-300'}
                    style={{ fontFamily: 'Poppins_500Medium', fontSize: 12 }}
                  >
                    {option.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <View className="mb-4">
          <Text className="text-gray-300 text-sm mb-2" style={{ fontFamily: 'Poppins_500Medium' }}>
            Project Filter *
          </Text>
          <View className="flex-row flex-wrap" style={{ gap: 8 }}>
            {availablePlanFilters.map((filter) => {
              const isActive = selectedPlanFilter === filter;
              return (
                <TouchableOpacity
                  key={filter}
                  onPress={() => setSelectedPlanFilter(filter)}
                  className={`rounded-full px-4 py-2 border ${isActive ? 'bg-blue-600 border-blue-500' : 'bg-[#0A1628] border-blue-900'}`}
                  activeOpacity={0.8}
                >
                  <Text
                    className={isActive ? 'text-white' : 'text-gray-300'}
                    style={{ fontFamily: 'Poppins_500Medium', fontSize: 12 }}
                  >
                    {filter}
                  </Text>
                </TouchableOpacity>
              );
            })}
            <TouchableOpacity
              onPress={() => setSelectedPlanFilter(CUSTOM_FILTER_VALUE)}
              className={`rounded-full px-4 py-2 border ${selectedPlanFilter === CUSTOM_FILTER_VALUE ? 'bg-blue-600 border-blue-500' : 'bg-[#0A1628] border-blue-900'}`}
              activeOpacity={0.8}
            >
              <Text
                className={selectedPlanFilter === CUSTOM_FILTER_VALUE ? 'text-white' : 'text-gray-300'}
                style={{ fontFamily: 'Poppins_500Medium', fontSize: 12 }}
              >
                Custom
              </Text>
            </TouchableOpacity>
          </View>
          {selectedPlanFilter === CUSTOM_FILTER_VALUE && (
            <TextInput
              className="mt-3 bg-[#0A1628] rounded-xl px-4 py-3 text-white text-base border border-blue-900"
              style={{ fontFamily: 'Poppins_400Regular' }}
              placeholder="Enter custom filter (e.g., POP ceiling repairs)"
              placeholderTextColor="#6B7280"
              value={customPlanFilter}
              onChangeText={setCustomPlanFilter}
            />
          )}
        </View>

        <View className="mb-4">
          {planType === 'repair' && !propertyDetailsOpen ? (
            <TouchableOpacity onPress={() => setPropertyDetailsOpen(true)} className="bg-[#0A1628] rounded-xl px-4 py-3 border border-blue-900">
              <Text className="text-gray-300 text-sm" style={{ fontFamily: 'Poppins_500Medium' }}>
                Property details (optional)
              </Text>
            </TouchableOpacity>
          ) : (
          <>
          <Text className="text-gray-300 text-sm mb-3" style={{ fontFamily: 'Poppins_500Medium' }}>
            {planType === 'repair' ? 'Property details (optional)' : 'Specifications (optional)'}
          </Text>
          
          <View className="flex-row mb-3">
            <View className="flex-1 mr-2">
              <View className="bg-[#0A1628] rounded-xl px-4 py-3 flex-row items-center border border-blue-900">
                <Bed size={18} color="#6B7280" strokeWidth={2} />
                <TextInput
                  className="flex-1 ml-3 text-white text-base"
                  style={{ fontFamily: 'Poppins_400Regular' }}
                  placeholder="Bedrooms"
                  placeholderTextColor="#6B7280"
                  value={bedrooms}
                  onChangeText={setBedrooms}
                  keyboardType="numeric"
                />
              </View>
            </View>
            
            <View className="flex-1 ml-2">
              <View className="bg-[#0A1628] rounded-xl px-4 py-3 flex-row items-center border border-blue-900">
                <Bath size={18} color="#6B7280" strokeWidth={2} />
                <TextInput
                  className="flex-1 ml-3 text-white text-base"
                  style={{ fontFamily: 'Poppins_400Regular' }}
                  placeholder="Bathrooms"
                  placeholderTextColor="#6B7280"
                  value={bathrooms}
                  onChangeText={setBathrooms}
                  keyboardType="numeric"
                />
              </View>
            </View>
          </View>

          <View className="flex-row mb-3">
            <View className="flex-1 mr-2">
              <View className="bg-[#0A1628] rounded-xl px-4 py-3 flex-row items-center border border-blue-900">
                <Maximize size={18} color="#6B7280" strokeWidth={2} />
                <TextInput
                  className="flex-1 ml-3 text-white text-base"
                  style={{ fontFamily: 'Poppins_400Regular' }}
                  placeholder="Square Feet"
                  placeholderTextColor="#6B7280"
                  value={squareFootage}
                  onChangeText={setSquareFootage}
                  keyboardType="numeric"
                />
              </View>
            </View>
            
            <View className="flex-1 ml-2">
              <View className="bg-[#0A1628] rounded-xl px-4 py-3 flex-row items-center border border-blue-900">
                <TextInput
                  className="flex-1 text-white text-base"
                  style={{ fontFamily: 'Poppins_400Regular' }}
                  placeholder="Floors"
                  placeholderTextColor="#6B7280"
                  value={floors}
                  onChangeText={setFloors}
                  keyboardType="numeric"
                />
              </View>
            </View>
          </View>
        </>
        )}
        </View>

        {/* Edit Project Analysis Section - Matching Review Project Page */}
        <View className="bg-[#1E3A5F] rounded-2xl mb-4 border-2 border-yellow-600/30" style={{ padding: 20 }}>
          <View className="flex-row items-center justify-between mb-4">
          <View className="flex-row items-center">
            <Edit3 size={20} color="#F59E0B" strokeWidth={2} />
            <Text className="text-yellow-400 text-lg ml-2" style={{ fontFamily: 'Poppins_700Bold' }}>
              Edit Project Analysis
            </Text>
          </View>
        </View>

        {/* Budget */}
        <View className="mb-4">
          <Text className="text-gray-300 text-sm mb-2" style={{ fontFamily: 'Poppins_500Medium' }}>
            Estimated Budget *
          </Text>
          <View className="bg-[#0A1628] rounded-xl px-4 py-3 flex-row items-center border border-blue-900">
            <Text className="text-gray-500 text-base" style={{ fontFamily: 'Poppins_600SemiBold' }}>
              ₦
            </Text>
            <TextInput
              className="flex-1 ml-3 text-white text-base"
              style={{ fontFamily: 'Poppins_400Regular' }}
              placeholder="Enter estimated budget"
              placeholderTextColor="#6B7280"
              value={estimatedCost}
              onChangeText={setEstimatedCost}
              keyboardType="numeric"
            />
          </View>
        </View>

        {/* Duration */}
        <View className="mb-4">
          <Text className="text-gray-300 text-sm mb-2" style={{ fontFamily: 'Poppins_500Medium' }}>
            Estimated Duration *
          </Text>
          <View className="bg-[#0A1628] rounded-xl px-4 py-3 flex-row items-center border border-blue-900">
            <Calendar size={20} color="#6B7280" strokeWidth={2} />
            <TextInput
              className="flex-1 ml-3 text-white text-base"
              style={{ fontFamily: 'Poppins_400Regular' }}
              placeholder="e.g., 6-8 months"
              placeholderTextColor="#6B7280"
              value={estimatedDuration}
              onChangeText={setEstimatedDuration}
            />
          </View>
        </View>

        {/* Rooms */}
        <View className="mb-4">
          <Text className="text-gray-300 text-sm mb-2" style={{ fontFamily: 'Poppins_500Medium' }}>
            Rooms
          </Text>
          {rooms.map((room, index) => (
            <View key={index} className="flex-row items-center mb-2 w-full" style={{ gap: 8 }}>
              <TextInput
                className="bg-[#0A1628] rounded-xl px-3 py-2.5 text-white text-sm border border-blue-900"
                style={{ fontFamily: 'Poppins_400Regular', flex: 1, minWidth: 0 }}
                placeholder="Room name (e.g., Kitchen, Living Room)"
                placeholderTextColor="#6B7280"
                value={room}
                onChangeText={(value) => {
                  const updated = [...rooms];
                  updated[index] = value;
                  setRooms(updated);
                }}
              />
              <TouchableOpacity
                onPress={() => setRooms(rooms.filter((_, i) => i !== index))}
                className="bg-red-600/20 rounded-lg items-center justify-center"
                style={{ width: 36, height: 36, flexShrink: 0 }}
              >
                <X size={16} color="#F87171" strokeWidth={2} />
              </TouchableOpacity>
            </View>
          ))}
          <TouchableOpacity
            onPress={() => setRooms([...rooms, ''])}
            className="bg-blue-600/20 border border-blue-600 rounded-xl px-4 py-3"
          >
            <Text className="text-blue-400 text-center" style={{ fontFamily: 'Poppins_600SemiBold' }}>
              + Add Room
            </Text>
          </TouchableOpacity>
        </View>

        {/* Materials */}
        <View className="mb-4">
          <Text className="text-gray-300 text-sm mb-2" style={{ fontFamily: 'Poppins_500Medium' }}>
            Key Materials
          </Text>
          {materials.map((material, index) => (
            <View key={index} className="flex-row items-center mb-2 w-full" style={{ gap: 8 }}>
              <TextInput
                className="bg-[#0A1628] rounded-xl px-3 py-2.5 text-white text-sm border border-blue-900"
                style={{ fontFamily: 'Poppins_400Regular', flex: 1, minWidth: 0 }}
                placeholder="Material name (e.g., Concrete, Steel, Wood)"
                placeholderTextColor="#6B7280"
                value={material}
                onChangeText={(value) => {
                  const updated = [...materials];
                  updated[index] = value;
                  setMaterials(updated);
                }}
              />
              <TouchableOpacity
                onPress={() => setMaterials(materials.filter((_, i) => i !== index))}
                className="bg-red-600/20 rounded-lg items-center justify-center"
                style={{ width: 36, height: 36, flexShrink: 0 }}
              >
                <X size={16} color="#F87171" strokeWidth={2} />
              </TouchableOpacity>
            </View>
          ))}
          <TouchableOpacity
            onPress={() => setMaterials([...materials, ''])}
            className="bg-blue-600/20 border border-blue-600 rounded-xl px-4 py-3"
          >
            <Text className="text-blue-400 text-center" style={{ fontFamily: 'Poppins_600SemiBold' }}>
              + Add Material
            </Text>
          </TouchableOpacity>
        </View>

        {/* Features */}
        <View className="mb-4">
          <Text className="text-gray-300 text-sm mb-2" style={{ fontFamily: 'Poppins_500Medium' }}>
            Features
          </Text>
          {features.map((feature, index) => (
            <View key={index} className="flex-row items-center mb-2 w-full" style={{ gap: 8 }}>
              <TextInput
                className="bg-[#0A1628] rounded-xl px-3 py-2.5 text-white text-sm border border-blue-900"
                style={{ fontFamily: 'Poppins_400Regular', flex: 1, minWidth: 0 }}
                placeholder="Feature name (e.g., Solar Panels, Smart Home)"
                placeholderTextColor="#6B7280"
                value={feature}
                onChangeText={(value) => {
                  const updated = [...features];
                  updated[index] = value;
                  setFeatures(updated);
                }}
              />
              <TouchableOpacity
                onPress={() => setFeatures(features.filter((_, i) => i !== index))}
                className="bg-red-600/20 rounded-lg items-center justify-center"
                style={{ width: 36, height: 36, flexShrink: 0 }}
              >
                <X size={16} color="#F87171" strokeWidth={2} />
              </TouchableOpacity>
            </View>
          ))}
          <TouchableOpacity
            onPress={() => setFeatures([...features, ''])}
            className="bg-blue-600/20 border border-blue-600 rounded-xl px-4 py-3"
          >
            <Text className="text-blue-400 text-center" style={{ fontFamily: 'Poppins_600SemiBold' }}>
              + Add Feature
            </Text>
          </TouchableOpacity>
        </View>

          {/* Construction Phases */}
          <View className="mb-4">
            <Text className="text-gray-300 text-sm mb-2" style={{ fontFamily: 'Poppins_500Medium' }}>
              Construction Phases
            </Text>
            {constructionPhases.map((phase, index) => (
              <View key={index} className="bg-[#0A1628] rounded-xl mb-3 border border-blue-900" style={{ padding: 16 }}>
                <TextInput
                  className="bg-[#1E3A5F] rounded-lg px-3 py-2 text-white text-base mb-2"
                  style={{ fontFamily: 'Poppins_600SemiBold' }}
                  placeholder="Phase name (e.g., Foundation, Framing)"
                  placeholderTextColor="#6B7280"
                  value={phase.name}
                  onChangeText={(value) => {
                    const updated = [...constructionPhases];
                    updated[index] = { ...updated[index], name: value };
                    setConstructionPhases(updated);
                  }}
                />
                <TextInput
                  className="bg-[#1E3A5F] rounded-lg px-3 py-2 text-white text-sm mb-2"
                  style={{ fontFamily: 'Poppins_400Regular', minHeight: 60 }}
                  placeholder="Description"
                  placeholderTextColor="#6B7280"
                  value={phase.description}
                  onChangeText={(value) => {
                    const updated = [...constructionPhases];
                    updated[index] = { ...updated[index], description: value };
                    setConstructionPhases(updated);
                  }}
                  multiline
                />
                <View className="flex-row items-center gap-3 min-w-0">
                  <TextInput
                    className="flex-1 bg-[#1E3A5F] rounded-lg px-3 py-2 text-white text-sm min-w-0"
                    style={{ fontFamily: 'Poppins_400Regular' }}
                    placeholder="Duration (e.g., 4-6 weeks)"
                    placeholderTextColor="#6B7280"
                    value={phase.estimatedDuration}
                    onChangeText={(value) => {
                      const updated = [...constructionPhases];
                      updated[index] = { ...updated[index], estimatedDuration: value };
                      setConstructionPhases(updated);
                    }}
                  />
                  <View className="flex-1 relative min-w-0">
                    <Text
                      className="absolute left-3 top-2 text-gray-400 text-sm z-10"
                      style={{ fontFamily: 'Poppins_600SemiBold' }}
                    >
                      ₦
                    </Text>
                    <TextInput
                      className="bg-[#1E3A5F] rounded-lg pl-7 pr-3 py-2 text-white text-sm"
                      style={{ fontFamily: 'Poppins_400Regular' }}
                      placeholder="Cost"
                      placeholderTextColor="#6B7280"
                      value={phase.estimatedCost > 0 ? phase.estimatedCost.toString() : ''}
                      onChangeText={(value) => {
                        const updated = [...constructionPhases];
                        updated[index] = { ...updated[index], estimatedCost: parseFloat(value) || 0 };
                        setConstructionPhases(updated);
                      }}
                      keyboardType="numeric"
                    />
                  </View>
                  <TouchableOpacity
                    onPress={() => setConstructionPhases(constructionPhases.filter((_, i) => i !== index))}
                    className="bg-red-600/20 rounded-lg justify-center items-center"
                    style={{ width: 36, height: 36, flexShrink: 0 }}
                  >
                    <X size={16} color="#F87171" strokeWidth={2} />
                  </TouchableOpacity>
                </View>
              </View>
            ))}
            <TouchableOpacity
              onPress={() => setConstructionPhases([...constructionPhases, { name: '', description: '', estimatedDuration: '', estimatedCost: 0 }])}
              className="bg-blue-600/20 border border-blue-600 rounded-xl px-4 py-3"
            >
              <Text className="text-blue-400 text-center" style={{ fontFamily: 'Poppins_600SemiBold' }}>
                + Add Construction Phase
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Buttons */}
        <View className="flex-row mt-4 mb-8 px-0" style={{ gap: 12 }}>
          <TouchableOpacity
            onPress={onCancel}
            disabled={isSubmitting}
            className="flex-1 bg-[#1E3A5F] rounded-full py-4 items-center justify-center"
            style={{ marginRight: 6 }}
          >
            <Text className="text-white text-lg" style={{ fontFamily: 'Poppins_700Bold' }}>
              Cancel
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleSubmit}
            disabled={isSubmitting}
            className={`flex-1 bg-blue-600 rounded-full py-4 items-center justify-center ${isSubmitting ? 'opacity-50' : ''}`}
            style={{ marginLeft: 6 }}
          >
            {isSubmitting ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text className="text-white text-lg" style={{ fontFamily: 'Poppins_700Bold' }}>
                Save Changes
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

export default function GCPlansScreen() {
  const router = useRouter();
  const { showAlert } = useAppAlert();
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [editingDesign, setEditingDesign] = useState<any | null>(null);
  const [designToDelete, setDesignToDelete] = useState<any | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const { data: designs = [], isLoading } = useMyDesigns();
  const { data: profileData } = useGCProfile();
  const deleteDesignMutation = useDeleteDesign();
  const { horizontalPad, headerPaddingTop, scrollBottomPadding, width } =
    useResponsivePadding("stack");

  const isVerifiedGC = !!profileData?.verified;
  const [planTab, setPlanTab] = useState<'all' | 'live' | 'pending' | 'rejected' | 'draft'>('all');
  const [hasDraft, setHasDraft] = useState(false);
  const [showAbout, setShowAbout] = useState(false);
  const [aboutReady, setAboutReady] = useState(false);

  useEffect(() => {
    let mounted = true;
    void (async () => {
      const [draft, dismissed] = await Promise.all([
        AsyncStorage.getItem(UPLOAD_FORM_DRAFT_STORAGE_KEY),
        AsyncStorage.getItem('gc_plans_about_dismissed'),
      ]);
      if (!mounted) return;
      setHasDraft(Boolean(draft));
      setShowAbout(dismissed !== 'true');
      setAboutReady(true);
    })();
    return () => {
      mounted = false;
    };
  }, [showUploadForm]);

  const dismissAbout = () => {
    setShowAbout(false);
    void AsyncStorage.setItem('gc_plans_about_dismissed', 'true');
  };

  const handleDelete = (design: any) => {
    setDesignToDelete(design);
  };

  const confirmDelete = async () => {
    if (!designToDelete) return;

    setIsDeleting(true);
    try {
      await deleteDesignMutation.mutateAsync(designToDelete.id);
      setDesignToDelete(null);
      setIsDeleting(false);
      
      // Show success message
      showAlert('Success', 'Design deleted successfully');
    } catch (error: any) {
      console.error('❌ [GC Plans] Error deleting design:', error);
      setIsDeleting(false);
      showAlert('Error', error.message || 'Failed to delete design');
    }
  };

  const cancelDelete = () => {
    setDesignToDelete(null);
    setIsDeleting(false);
  };

  const handleEdit = (design: any) => {
    setEditingDesign(design);
  };

  if (showUploadForm) {
    return (
      <View className="flex-1 bg-[#0A1628]">
        <View
          className="pb-4 flex-row items-center"
          style={{ paddingTop: headerPaddingTop, paddingHorizontal: horizontalPad }}
        >
          <TouchableOpacity 
            onPress={() => setShowUploadForm(false)}
            className="w-10 h-10 bg-[#1E3A5F] rounded-full items-center justify-center mr-4 flex-shrink-0"
          >
            <ArrowLeft size={22} color="#FFFFFF" strokeWidth={2} />
          </TouchableOpacity>
          <Text className="text-white text-lg flex-1 min-w-0" style={{ fontFamily: 'Poppins_700Bold' }} numberOfLines={2}>
            Upload Design Plan
          </Text>
        </View>
        <UploadForm 
          onSuccess={() => setShowUploadForm(false)} 
          onCancel={() => setShowUploadForm(false)} 
        />
      </View>
    );
  }

  const sortedDesigns = [...designs].sort(
    (a: any, b: any) => new Date(b.updatedAt || b.createdAt || 0).getTime() - new Date(a.updatedAt || a.createdAt || 0).getTime(),
  );
  const counts = {
    live: sortedDesigns.filter((design: any) => getPlanStatus(design) === 'live').length,
    pending: sortedDesigns.filter((design: any) => getPlanStatus(design) === 'pending').length,
    rejected: sortedDesigns.filter((design: any) => getPlanStatus(design) === 'rejected').length,
    draft: hasDraft ? 1 : 0,
    all: sortedDesigns.length + (hasDraft ? 1 : 0),
  };
  const visibleDesigns = sortedDesigns.filter((design: any) => {
    const status = getPlanStatus(design);
    if (planTab === 'all') return true;
    return status === planTab;
  });
  const showDraftRow = hasDraft && (planTab === 'all' || planTab === 'draft');
  const twoColumns = width > 768;
  const emptyCopy =
    planTab === 'pending'
      ? 'No plans waiting for review.'
      : planTab === 'live'
        ? 'No live plans.'
        : planTab === 'rejected'
          ? 'No rejected plans.'
          : planTab === 'draft'
            ? 'No unfinished plan.'
            : '';

  return (
    <View className="flex-1 bg-[#0A1628]">
      <View
        className="pb-4 flex-row items-center border-b border-blue-900"
        style={{ paddingTop: headerPaddingTop, paddingHorizontal: horizontalPad }}
      >
        <TouchableOpacity
          onPress={() => {
            if (router.canGoBack()) {
              router.back();
            } else {
              router.push('/contractor/gc-dashboard');
            }
          }}
          className="w-10 h-10 bg-[#1E3A5F] rounded-full items-center justify-center mr-4 flex-shrink-0"
        >
          <ArrowLeft size={22} color="#FFFFFF" strokeWidth={2} />
        </TouchableOpacity>
        <Text className="text-white text-lg flex-1 min-w-0" style={{ fontFamily: 'Poppins_700Bold' }} numberOfLines={2}>
          My project plans
        </Text>
      </View>

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: horizontalPad,
          paddingBottom: scrollBottomPadding,
        }}
      >
        <TouchableOpacity
          onPress={() => setShowUploadForm(true)}
          className="rounded-2xl py-4 mb-4 flex-row items-center justify-center bg-blue-600"
          activeOpacity={0.7}
        >
          <Plus size={20} color="#FFFFFF" strokeWidth={2.5} />
          <Text className="text-white text-base ml-2" style={{ fontFamily: 'Poppins_700Bold' }}>
            Upload a plan
          </Text>
        </TouchableOpacity>
        {!isVerifiedGC && (
          <View className="rounded-xl p-4 mb-4" style={{ backgroundColor: '#1E3A5F', borderWidth: 1, borderColor: '#1E40AF66' }}>
            <Text className="text-blue-100" style={{ fontFamily: 'Poppins_500Medium', fontSize: 13, lineHeight: 20 }}>
              You can upload plans now. Your account is not verified yet, so BuildMyHouse will keep a closer eye on projects that start from your plans. Finish your verification in Profile to get the Verified badge.
            </Text>
          </View>
        )}
        {aboutReady && showAbout ? <AboutPlansBox onDismiss={dismissAbout} /> : null}
        <PlanSummaryStrip counts={counts} onSelect={setPlanTab} />
        <PlanFilterTabs selected={planTab} counts={counts} onSelect={setPlanTab} />

        {isLoading ? (
          <View className="items-center justify-center py-20">
            <ActivityIndicator size="large" color="#60A5FA" />
          </View>
        ) : counts.all === 0 ? (
          <View className="items-center justify-center py-16 px-4">
            <Text className="text-white text-center text-lg" style={{ fontFamily: 'Poppins_700Bold' }}>
              No plans yet
            </Text>
            <Text className="text-blue-200/70 text-center mt-2" style={{ fontFamily: 'Poppins_400Regular', fontSize: 14, lineHeight: 22 }}>
              Upload the jobs you do best so homeowners can find and request you.
            </Text>
            <TouchableOpacity
              onPress={() => setShowUploadForm(true)}
              className="rounded-full bg-blue-600 px-5 py-3 mt-5"
            >
              <Text className="text-white" style={{ fontFamily: 'Poppins_600SemiBold' }}>Upload a plan</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View className={twoColumns ? 'flex-row flex-wrap justify-between' : ''}>
            {showDraftRow ? (
              <View style={twoColumns ? { width: '48%' } : undefined}>
                <DraftPlanRow onPress={() => setShowUploadForm(true)} />
              </View>
            ) : null}
            {visibleDesigns.map((design: any) => {
              const image = design.images?.[0];
              const imageUrl = image?.thumbnailUrl
                ? getImageUrl(image.thumbnailUrl)
                : image?.url
                  ? getImageUrl(image.url)
                  : null;
              return (
                <View key={design.id} style={twoColumns ? { width: '48%' } : undefined}>
                  <PlanCard
                    design={design}
                    imageUrl={imageUrl}
                    onEdit={() => handleEdit(design)}
                    onDelete={() => handleDelete(design)}
                  />
                </View>
              );
            })}
            {!showDraftRow && visibleDesigns.length === 0 ? (
              <Text className="text-blue-200/70 py-8" style={{ fontFamily: 'Poppins_400Regular', fontSize: 14 }}>{emptyCopy}</Text>
            ) : null}
          </View>
        )}
      </ScrollView>

      {/* Edit Modal */}
      <Modal
        visible={editingDesign !== null}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setEditingDesign(null)}
      >
        <View className="flex-1 bg-[#0A1628]">
          <View
            className="pb-4 flex-row items-center border-b border-blue-900"
            style={{ paddingTop: headerPaddingTop, paddingHorizontal: horizontalPad }}
          >
            <TouchableOpacity 
              onPress={() => setEditingDesign(null)}
              className="w-10 h-10 bg-[#1E3A5F] rounded-full items-center justify-center mr-4 flex-shrink-0"
            >
              <ArrowLeft size={22} color="#FFFFFF" strokeWidth={2} />
            </TouchableOpacity>
            <Text className="text-white text-lg flex-1 min-w-0" style={{ fontFamily: 'Poppins_700Bold' }} numberOfLines={2}>
              Edit Design Plan
            </Text>
          </View>
          {editingDesign && (
            <EditForm
              design={editingDesign}
              onSuccess={() => setEditingDesign(null)}
              onCancel={() => setEditingDesign(null)}
            />
          )}
        </View>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        visible={designToDelete !== null}
        transparent={true}
        animationType="fade"
        onRequestClose={cancelDelete}
      >
        <View className="flex-1 bg-black/50 items-center justify-center px-6">
          <View className="bg-white rounded-3xl p-6 w-full max-w-md">
            <Text className="text-black text-xl text-center mb-2" style={{ fontFamily: 'Poppins_700Bold' }}>
              Delete this plan?
            </Text>
            <Text className="text-gray-700 text-sm text-center leading-5 mb-6" style={{ fontFamily: 'Poppins_400Regular' }}>
              Homeowners will no longer see it. This cannot be undone.
            </Text>

            {/* Action Buttons */}
            <View className="flex-row gap-3">
              <TouchableOpacity
                onPress={cancelDelete}
                disabled={isDeleting}
                className="flex-1 bg-white border border-gray-300 rounded-xl py-4 items-center"
              >
                <Text className="text-black text-base" style={{ fontFamily: 'Poppins_600SemiBold' }}>
                  Cancel
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={confirmDelete}
                disabled={isDeleting}
                className={`flex-1 bg-red-600 rounded-xl py-4 items-center ${isDeleting ? 'opacity-50' : ''}`}
              >
                {isDeleting ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text className="text-white text-base" style={{ fontFamily: 'Poppins_700Bold' }}>
                    Delete
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
