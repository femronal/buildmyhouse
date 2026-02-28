import { View, Text, ScrollView, TouchableOpacity, Image, Modal, TextInput, Alert, ActivityIndicator, Platform, Linking } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { ArrowLeft, Package, Users, FileText, CheckCircle, Star, File, Video, Image as ImageIcon, Music, ChevronRight, Home, Plus, Camera, X, Phone, Mail, Calendar, Upload, Download, Trash2, Check } from "lucide-react-native";
import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useProject, useUpdateStageStatus } from '@/hooks/useProjects';
import { stageDocumentationService } from '@/services/stageDocumentationService';
import * as ImagePicker from 'expo-image-picker';
import { uploadFile } from '@/utils/fileUpload';

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

export default function GCStageDetailScreen() {
  const router = useRouter();
  const { stageId, name, status, projectId } = useLocalSearchParams();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'materials' | 'team' | 'files'>('materials');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentRequested, setPaymentRequested] = useState(false);
  
  // Form modals
  const [showTeamModal, setShowTeamModal] = useState(false);
  const [showMaterialModal, setShowMaterialModal] = useState(false);
  const [showFileModal, setShowFileModal] = useState(false);
  
  // Delete confirmation modals
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [materialToDelete, setMaterialToDelete] = useState<{ id: string; name: string } | null>(null);
  const [showDeleteTeamModal, setShowDeleteTeamModal] = useState(false);
  const [teamMemberToDelete, setTeamMemberToDelete] = useState<{ id: string; name: string } | null>(null);
  const [showDeleteFileModal, setShowDeleteFileModal] = useState(false);
  const [fileToDelete, setFileToDelete] = useState<{ id: string; name: string; isMedia: boolean } | null>(null);
  const [showFileTooLargeModal, setShowFileTooLargeModal] = useState(false);
  
  // Mark as complete modal
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [confirmations, setConfirmations] = useState({
    stageComplete: false,
    homeownerSatisfied: false,
  });
  
  // Documentation requirements modal
  const [showDocsRequiredModal, setShowDocsRequiredModal] = useState(false);
  const [missingRequirements, setMissingRequirements] = useState<string[]>([]);
  
  // Update stage status mutation
  const updateStageStatusMutation = useUpdateStageStatus();
  
  // Form states
  const [teamForm, setTeamForm] = useState({
    name: '',
    role: '',
    phone: '',
    email: '',
    dailyRate: '',
    rateType: 'daily' as 'daily' | 'hourly' | 'fixed',
    notes: '',
    photoUri: '' as string | null,
    invoiceUri: '' as string | null,
    photoFile: null as File | null,
    invoiceFile: null as File | null,
    photoName: '' as string,
    invoiceName: '' as string,
  });
  
  const [materialForm, setMaterialForm] = useState({
    name: '',
    brand: '',
    quantity: '',
    unit: 'bags',
    unitPrice: '',
    supplier: '',
    supplierContact: '',
    notes: '',
    photoUri: '' as string | null,
    receiptUri: '' as string | null,
    photoFile: null as File | null,
    receiptFile: null as File | null,
    photoName: '' as string,
    receiptName: '' as string,
  });
  
  const [fileForm, setFileForm] = useState({
    type: 'photo' as 'photo' | 'video' | 'document',
    caption: '',
    fileUri: '' as string | null,
    fileFile: null as File | null,
    fileName: '' as string,
    fileMimeType: '' as string,
  });

  // Rename modal state
  const [showRenameModal, setShowRenameModal] = useState(false);
  const [renameType, setRenameType] = useState<'photo' | 'invoice' | 'receipt' | 'file' | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [pendingFileData, setPendingFileData] = useState<{ uri: string; fileName: string; file?: File; mimeType?: string } | null>(null);

  const isComplete = status === 'complete' || status === 'completed';
  const isInProgress = status === 'in-progress' || status === 'in_progress';

  // Fetch project to get stage data
  const { data: project, refetch: refetchProject } = useProject(projectId as string || null);

  const stage = project?.stages?.find((s: any) => s.id === stageId) as any;
  const materials = stage?.materials || [];
  const teamMembers = stage?.teamMembers || [];
  const media = stage?.media || [];
  const documents = stage?.documents || [];
  const allFiles = [
    ...media.map((m: any) => ({ ...m, fileType: m.type, isMedia: true, name: m.url?.split('/').pop() || 'Media' })),
    ...documents.map((d: any) => ({ ...d, fileType: d.type, isMedia: false, name: d.name || d.url?.split('/').pop() || 'Document' })),
  ];

  const openReceipt = (url?: string) => {
    if (!url) {
      Alert.alert('No receipt', 'This material has no receipt attached');
      return;
    }
    Linking.openURL(url).catch(() => Alert.alert('Error', 'Unable to open receipt'));
  };

  const callSupplier = (phone?: string) => {
    if (!phone) {
      Alert.alert('No contact', 'No supplier phone number provided');
      return;
    }
    const telUrl = `tel:${phone}`;
    Linking.openURL(telUrl).catch(() => Alert.alert('Error', 'Unable to start a call on this device'));
  };

  const callTeamMember = (phone?: string) => {
    if (!phone) {
      Alert.alert('No contact', 'No phone number provided');
      return;
    }
    Linking.openURL(`tel:${phone}`).catch(() => Alert.alert('Error', 'Unable to make call'));
  };

  const openInvoice = (url?: string) => {
    if (!url) {
      Alert.alert('No invoice', 'This team member has no invoice attached');
      return;
    }
    Linking.openURL(url).catch(() => Alert.alert('Error', 'Unable to open invoice'));
  };

  const downloadFile = (url?: string, fileName?: string) => {
    if (!url) {
      Alert.alert('No file', 'File URL not available');
      return;
    }
    Linking.openURL(url).catch(() => Alert.alert('Error', 'Unable to download file'));
  };

  const isFileTooLargeError = (error: any) => {
    const message = String(error?.message || '').toLowerCase();
    return (
      message.includes('file too large') ||
      message.includes('payload too large') ||
      message.includes('413')
    );
  };

  const handleRequestPayment = () => {
    setPaymentRequested(true);
    setTimeout(() => {
      setShowPaymentModal(false);
      router.canGoBack() ? router.back() : router.push(`/contractor/gc-project-detail?id=${projectId}`);
    }, 1500);
  };

  // Image picker handlers
  const pickImage = async (type: 'photo' | 'invoice' | 'receipt' | 'file') => {
    try {
      if (Platform.OS === 'web') {
        // For web, use a hidden file input
        const input = document.createElement('input');
        input.type = 'file';
        // Set accept based on type and current fileForm type
        if (type === 'file') {
          // For file uploads, check the current fileForm type
          if (fileForm.type === 'document') {
            input.accept = '.pdf,application/pdf';
          } else if (fileForm.type === 'video') {
            input.accept = 'video/*';
          } else {
            input.accept = 'image/*';
          }
        } else {
          input.accept = type === 'receipt' || type === 'invoice' ? 'application/pdf,image/*' : 'image/*';
        }
        input.multiple = false; // Only allow single file selection
        input.onchange = (e: any) => {
          const file = e.target.files?.[0];
          if (file) {
            const uri = URL.createObjectURL(file);
            const fileName = file.name;

            // Only "Files" should be renameable. Team/Material uploads are named by the form fields.
            if (type === 'file') {
              setPendingFileData({ uri, fileName, file, mimeType: file.type });
              setRenameType(type);
              setRenameValue(fileName);
              setShowRenameModal(true);
              return;
            }

            if (type === 'photo') {
              // Used by both Team photo and Material photo depending on which modal is open.
              // We set both; only the visible modal/form will use it.
              setTeamForm(prev => ({ ...prev, photoUri: uri, photoFile: file, photoName: fileName }));
              setMaterialForm(prev => ({ ...prev, photoUri: uri, photoFile: file, photoName: fileName }));
              return;
            }

            if (type === 'invoice') {
              setTeamForm(prev => ({ ...prev, invoiceUri: uri, invoiceFile: file, invoiceName: fileName }));
              return;
            }

            if (type === 'receipt') {
              setMaterialForm(prev => ({ ...prev, receiptUri: uri, receiptFile: file, receiptName: fileName }));
              return;
            }
          }
        };
        input.click();
        return;
      }

      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'We need camera roll permissions to upload images');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: type === 'file' 
          ? ImagePicker.MediaTypeOptions.All 
          : ImagePicker.MediaTypeOptions.Images,
        quality: 0.8,
        allowsMultipleSelection: false,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        const uri = asset.uri;
        const fileName = asset.fileName || asset.uri.split('/').pop() || `file-${Date.now()}`;

        // Only "Files" should be renameable. Team/Material uploads are named by the form fields.
        if (type === 'file') {
          setPendingFileData({ uri, fileName, mimeType: asset.mimeType || undefined });
          setRenameType(type);
          setRenameValue(fileName);
          setShowRenameModal(true);
          return;
        }

        if (type === 'photo') {
          // Used by both Team photo and Material photo depending on which modal is open.
          // We set both; only the visible modal/form will use it.
          setTeamForm(prev => ({ ...prev, photoUri: uri, photoName: fileName }));
          setMaterialForm(prev => ({ ...prev, photoUri: uri, photoName: fileName }));
          return;
        }

        if (type === 'invoice') {
          setTeamForm(prev => ({ ...prev, invoiceUri: uri, invoiceName: fileName }));
          return;
        }

        if (type === 'receipt') {
          setMaterialForm(prev => ({ ...prev, receiptUri: uri, receiptName: fileName }));
          return;
        }
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  // Add team member mutation
  const addTeamMemberMutation = useMutation({
    mutationFn: async (data: any) => {
      // Upload photos first
      let photoUrl: string | undefined;
      let invoiceUrl: string | undefined;
      
      try {
        if (data.photoUri) {
          if (Platform.OS === 'web' && data.photoFile) {
            const fileUri = await new Promise<string>((resolve) => {
              const reader = new FileReader();
              reader.onload = () => resolve(reader.result as string);
              reader.readAsDataURL(data.photoFile);
            });
            photoUrl = await uploadFile(fileUri, 'image', {
              fileName: data.photoName || data.photoFile?.name,
              mimeType: data.photoFile?.type,
            });
          } else {
            photoUrl = await uploadFile(data.photoUri, 'image');
          }
        }
        
        if (data.invoiceUri) {
          if (Platform.OS === 'web' && data.invoiceFile) {
            const fileUri = await new Promise<string>((resolve) => {
              const reader = new FileReader();
              reader.onload = () => resolve(reader.result as string);
              reader.readAsDataURL(data.invoiceFile);
            });
            invoiceUrl = await uploadFile(fileUri, 'document', {
              fileName: data.invoiceName || data.invoiceFile?.name,
              mimeType: data.invoiceFile?.type,
            });
          } else {
            invoiceUrl = await uploadFile(data.invoiceUri, 'document');
          }
        }
      } catch (error: any) {
        console.error('❌ Error uploading files:', error);
        throw new Error(`Failed to upload files: ${error.message}`);
      }
      
      // Now save the team member with uploaded URLs
      return stageDocumentationService.addTeamMember(projectId as string, stageId as string, {
        name: data.name,
        role: data.role,
        phone: data.phone || undefined,
        email: data.email || undefined,
        dailyRate: data.dailyRate ? parseFloat(data.dailyRate) : undefined,
        rateType: data.rateType,
        notes: data.notes || undefined,
        photoUrl,
        invoiceUrl,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project', projectId] });
      refetchProject();
      setShowTeamModal(false);
      setTeamForm({
        name: '',
        role: '',
        phone: '',
        email: '',
        dailyRate: '',
        rateType: 'daily',
        notes: '',
        photoUri: null,
        invoiceUri: null,
        photoFile: null,
        invoiceFile: null,
        photoName: '',
        invoiceName: '',
      });
      Alert.alert('Success', 'Team member added successfully');
    },
    onError: (error: any) => {
      Alert.alert('Error', error?.message || 'Failed to add team member');
    },
  });

  // Add material mutation
  const addMaterialMutation = useMutation({
    mutationFn: async (data: any) => {
      // Upload photos first
      let photoUrl: string | undefined;
      let receiptUrl: string | undefined;
      
      try {
        if (data.photoUri) {
          if (Platform.OS === 'web' && data.photoFile) {
            const fileUri = await new Promise<string>((resolve) => {
              const reader = new FileReader();
              reader.onload = () => resolve(reader.result as string);
              reader.readAsDataURL(data.photoFile);
            });
            photoUrl = await uploadFile(fileUri, 'image', {
              fileName: data.photoName || data.photoFile?.name,
              mimeType: data.photoFile?.type,
            });
          } else {
            photoUrl = await uploadFile(data.photoUri, 'image');
          }
        }
        
        if (data.receiptUri) {
          if (Platform.OS === 'web' && data.receiptFile) {
            const fileUri = await new Promise<string>((resolve) => {
              const reader = new FileReader();
              reader.onload = () => resolve(reader.result as string);
              reader.readAsDataURL(data.receiptFile);
            });
            receiptUrl = await uploadFile(fileUri, 'document', {
              fileName: data.receiptName || data.receiptFile?.name,
              mimeType: data.receiptFile?.type,
            });
          } else {
            receiptUrl = await uploadFile(data.receiptUri, 'document');
          }
        }
      } catch (error: any) {
        console.error('❌ Error uploading files:', error);
        throw new Error(`Failed to upload files: ${error.message}`);
      }
      
      const quantity = parseFloat(data.quantity) || 0;
      const unitPrice = parseFloat(data.unitPrice) || 0;
      
      // Now save the material with uploaded URLs
      return stageDocumentationService.addMaterial(projectId as string, stageId as string, {
        name: data.name,
        brand: data.brand || undefined,
        quantity,
        unit: data.unit,
        unitPrice,
        supplier: data.supplier || undefined,
        supplierContact: data.supplierContact || undefined,
        notes: data.notes || undefined,
        photoUrl,
        receiptUrl,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project', projectId] });
      refetchProject();
      setShowMaterialModal(false);
      setMaterialForm({
        name: '',
        brand: '',
        quantity: '',
        unit: 'bags',
        unitPrice: '',
        supplier: '',
        supplierContact: '',
        notes: '',
        photoUri: null,
        receiptUri: null,
        photoFile: null,
        receiptFile: null,
        photoName: '',
        receiptName: '',
      });
      Alert.alert('Success', 'Material added successfully');
    },
    onError: (error: any) => {
      Alert.alert('Error', error?.message || 'Failed to add material');
    },
  });

  // Add media/document mutation
  const addMediaMutation = useMutation({
    mutationFn: async (data: any) => {
      // Upload file first
      let fileUrl: string = '';
      
      try {
        if (data.fileUri) {
          if (data.type === 'document') {
            const uploadType = 'document'; // Use 'document' type for PDFs/documents
            if (Platform.OS === 'web' && data.fileFile) {
              const fileUri = await new Promise<string>((resolve) => {
                const reader = new FileReader();
                reader.onload = () => resolve(reader.result as string);
                reader.readAsDataURL(data.fileFile);
              });
              fileUrl = await uploadFile(fileUri, uploadType, {
                fileName: data.fileName || data.fileFile?.name,
                mimeType: data.fileMimeType || data.fileFile?.type,
              });
            } else {
              fileUrl = await uploadFile(data.fileUri, uploadType, {
                fileName: data.fileName,
                mimeType: data.fileMimeType || data.fileFile?.type,
              });
            }
          } else {
            const uploadType = data.type === 'video' ? 'media' : 'image';
            if (Platform.OS === 'web' && data.fileFile) {
              const fileUri = await new Promise<string>((resolve) => {
                const reader = new FileReader();
                reader.onload = () => resolve(reader.result as string);
                reader.readAsDataURL(data.fileFile);
              });
              fileUrl = await uploadFile(fileUri, uploadType, {
                fileName: data.fileName || data.fileFile?.name,
                mimeType: data.fileMimeType || data.fileFile?.type,
              });
            } else {
              fileUrl = await uploadFile(data.fileUri, uploadType, {
                fileName: data.fileName,
                mimeType: data.fileMimeType || data.fileFile?.type,
              });
            }
          }
        } else {
          throw new Error('No file selected');
        }
      } catch (error: any) {
        console.error('❌ Error uploading file:', error);
        throw new Error(`Failed to upload file: ${error.message}`);
      }
      
      // Save as document if PDF, otherwise save as media
      if (data.type === 'document') {
        return stageDocumentationService.addDocument(projectId as string, stageId as string, {
          type: 'other',
          name: data.fileName || 'Document',
          url: fileUrl,
          category: 'general',
          notes: data.caption || undefined,
        });
      } else {
        return stageDocumentationService.addMedia(projectId as string, stageId as string, {
          type: data.type,
          url: fileUrl,
          caption: data.caption || data.fileName || undefined,
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project', projectId] });
      refetchProject();
      setShowFileModal(false);
      setFileForm({
        type: 'photo',
        caption: '',
        fileUri: null,
        fileFile: null,
        fileName: '',
        fileMimeType: '',
      });
      Alert.alert('Success', 'File uploaded successfully');
    },
    onError: (error: any) => {
      if (isFileTooLargeError(error)) {
        setShowFileTooLargeModal(true);
        return;
      }
      Alert.alert('Error', error?.message || 'Failed to upload file');
    },
  });

  const handleAddTeamMember = () => {
    if (!teamForm.name || !teamForm.role) {
      Alert.alert('Required Fields', 'Name and role are required');
      return;
    }
    addTeamMemberMutation.mutate(teamForm);
  };

  const handleAddMaterial = () => {
    if (!materialForm.name || !materialForm.quantity || !materialForm.unitPrice) {
      Alert.alert('Required Fields', 'Name, quantity, and unit price are required');
      return;
    }
    addMaterialMutation.mutate(materialForm);
  };

  const handleAddFile = () => {
    if (!fileForm.fileUri) {
      Alert.alert('Required', 'Please select a file to upload');
      return;
    }
    addMediaMutation.mutate(fileForm);
  };

  // Delete material mutation
  const deleteMaterialMutation = useMutation({
    mutationFn: async (materialId: string) => {
      return stageDocumentationService.deleteMaterial(materialId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project', projectId] });
      refetchProject();
      Alert.alert('Success', 'Material deleted successfully');
    },
    onError: (error: any) => {
      console.error('❌ [Delete Material] Error:', error);
      Alert.alert('Error', error?.message || 'Failed to delete material');
    },
  });

  const handleDeleteMaterial = (materialId: string, materialName: string) => {
    if (!materialId) {
      console.error('❌ [Delete Material] No material ID provided');
      Alert.alert('Error', 'Cannot delete material: No ID found');
      return;
    }
    
    // Show custom delete confirmation modal
    setMaterialToDelete({ id: materialId, name: materialName });
    setShowDeleteModal(true);
  };

  const confirmDeleteMaterial = () => {
    if (materialToDelete) {
      deleteMaterialMutation.mutate(materialToDelete.id);
      setShowDeleteModal(false);
      setMaterialToDelete(null);
    }
  };

  const cancelDeleteMaterial = () => {
    setShowDeleteModal(false);
    setMaterialToDelete(null);
  };

  // Delete team member mutation
  const deleteTeamMemberMutation = useMutation({
    mutationFn: async (teamMemberId: string) => {
      return stageDocumentationService.deleteTeamMember(teamMemberId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project', projectId] });
      refetchProject();
      Alert.alert('Success', 'Team member deleted successfully');
    },
    onError: (error: any) => {
      console.error('❌ [Delete Team Member] Error:', error);
      Alert.alert('Error', error?.message || 'Failed to delete team member');
    },
  });

  const handleDeleteTeamMember = (teamMemberId: string, teamMemberName: string) => {
    if (!teamMemberId) {
      console.error('❌ [Delete Team Member] No team member ID provided');
      Alert.alert('Error', 'Cannot delete team member: No ID found');
      return;
    }
    
    // Show custom delete confirmation modal
    setTeamMemberToDelete({ id: teamMemberId, name: teamMemberName });
    setShowDeleteTeamModal(true);
  };

  const confirmDeleteTeamMember = () => {
    if (teamMemberToDelete) {
      deleteTeamMemberMutation.mutate(teamMemberToDelete.id);
      setShowDeleteTeamModal(false);
      setTeamMemberToDelete(null);
    }
  };

  const cancelDeleteTeamMember = () => {
    setShowDeleteTeamModal(false);
    setTeamMemberToDelete(null);
  };

  // Delete file mutation (for both media and documents)
  const deleteFileMutation = useMutation({
    mutationFn: async (data: { id: string; isMedia: boolean }) => {
      if (data.isMedia) {
        return stageDocumentationService.deleteMedia(data.id);
      } else {
        return stageDocumentationService.deleteDocument(data.id);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project', projectId] });
      refetchProject();
      Alert.alert('Success', 'File deleted successfully');
    },
    onError: (error: any) => {
      console.error('❌ [Delete File] Error:', error);
      Alert.alert('Error', error?.message || 'Failed to delete file');
    },
  });

  const handleDeleteFile = (fileId: string, fileName: string, isMedia: boolean) => {
    if (!fileId) {
      console.error('❌ [Delete File] No file ID provided');
      Alert.alert('Error', 'Cannot delete file: No ID found');
      return;
    }
    
    // Show custom delete confirmation modal
    setFileToDelete({ id: fileId, name: fileName, isMedia });
    setShowDeleteFileModal(true);
  };

  const confirmDeleteFile = () => {
    if (fileToDelete) {
      deleteFileMutation.mutate({ id: fileToDelete.id, isMedia: fileToDelete.isMedia });
      setShowDeleteFileModal(false);
      setFileToDelete(null);
    }
  };

  const cancelDeleteFile = () => {
    setShowDeleteFileModal(false);
    setFileToDelete(null);
  };

  return (
    <View className="flex-1 bg-[#0A1628]">
      <View className="pt-16 px-6 pb-4">
        <View className="flex-row items-center mb-4">
          <TouchableOpacity 
            onPress={() => router.canGoBack() ? router.back() : router.push(`/contractor/gc-project-detail?id=${projectId}`)} 
            className="w-10 h-10 bg-black/50 rounded-full items-center justify-center mr-3"
          >
            <ArrowLeft size={22} color="#FFFFFF" strokeWidth={2} />
          </TouchableOpacity>
          <TouchableOpacity 
            onPress={() => router.push('/contractor/gc-dashboard')} 
            className="w-10 h-10 bg-black/50 rounded-full items-center justify-center"
          >
            <Home size={20} color="#FFFFFF" strokeWidth={2} />
          </TouchableOpacity>
        </View>
        
        <Text 
          className="text-3xl text-white mb-2"
          style={{ fontFamily: 'Poppins_800ExtraBold' }}
        >
          {name}
        </Text>
        <View className={`rounded-full px-3 py-1 self-start ${isComplete ? 'bg-green-600' : 'bg-blue-600'}`}>
          <Text 
            className="text-xs text-white"
            style={{ fontFamily: 'Poppins_500Medium' }}
          >
            {isComplete ? 'Complete' : 'In Progress'}
          </Text>
        </View>
      </View>

      {/* Tab Navigation */}
      <View className="flex-row px-6 mb-4">
        <View className="flex-1 bg-[#1E3A5F] rounded-xl p-1 flex-row border border-blue-900">
          <TouchableOpacity
            onPress={() => setActiveTab('materials')}
            className={`flex-1 py-3 rounded-lg flex-row items-center justify-center ${
              activeTab === 'materials' ? 'bg-blue-600' : ''
            }`}
          >
            <Package size={16} color={activeTab === 'materials' ? '#FFFFFF' : '#6B7280'} strokeWidth={2} />
            <Text 
              className={`ml-2 text-sm ${activeTab === 'materials' ? 'text-white' : 'text-gray-400'}`}
              style={{ fontFamily: 'Poppins_600SemiBold' }}
            >
              Materials
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setActiveTab('team')}
            className={`flex-1 py-3 rounded-lg flex-row items-center justify-center ${
              activeTab === 'team' ? 'bg-blue-600' : ''
            }`}
          >
            <Users size={16} color={activeTab === 'team' ? '#FFFFFF' : '#6B7280'} strokeWidth={2} />
            <Text 
              className={`ml-2 text-sm ${activeTab === 'team' ? 'text-white' : 'text-gray-400'}`}
              style={{ fontFamily: 'Poppins_600SemiBold' }}
            >
              Team
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setActiveTab('files')}
            className={`flex-1 py-3 rounded-lg flex-row items-center justify-center ${
              activeTab === 'files' ? 'bg-blue-600' : ''
            }`}
          >
            <FileText size={16} color={activeTab === 'files' ? '#FFFFFF' : '#6B7280'} strokeWidth={2} />
            <Text 
              className={`ml-2 text-sm ${activeTab === 'files' ? 'text-white' : 'text-gray-400'}`}
              style={{ fontFamily: 'Poppins_600SemiBold' }}
            >
              Files
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView className="flex-1 px-6">
        {/* Materials Tab */}
        {activeTab === 'materials' && (
          <View className="pb-32">
            <TouchableOpacity
              onPress={() => setShowMaterialModal(true)}
              className="bg-blue-600 rounded-xl p-4 mb-4 flex-row items-center justify-center"
            >
              <Plus size={20} color="#FFFFFF" strokeWidth={2} />
              <Text className="text-white ml-2" style={{ fontFamily: 'Poppins_600SemiBold' }}>
                Add Material
              </Text>
            </TouchableOpacity>
            
            {materials.length === 0 ? (
              <View className="bg-[#1E3A5F] rounded-xl p-6 items-center border border-blue-900">
                <Package size={48} color="#6B7280" strokeWidth={1.5} />
                <Text className="text-gray-400 text-lg mt-4" style={{ fontFamily: 'Poppins_600SemiBold' }}>
                  No Materials Yet
                </Text>
                <Text className="text-gray-500 text-sm mt-2 text-center" style={{ fontFamily: 'Poppins_400Regular' }}>
                  Add materials for this stage
                </Text>
              </View>
            ) : (
              materials.map((material: any, index: number) => (
                <View key={material.id || index} className="bg-[#1E3A5F] rounded-xl mb-4 overflow-hidden border border-blue-900 relative">
                  <View className="flex-row p-4">
                    {material.photoUrl ? (
                      <Image
                        source={{ uri: material.photoUrl }}
                        className="w-24 h-24 bg-gray-700 rounded-xl"
                        resizeMode="cover"
                      />
                    ) : (
                      <View className="w-24 h-24 bg-gray-700 rounded-xl items-center justify-center">
                        <Package size={32} color="#6B7280" strokeWidth={2} />
                      </View>
                    )}
                    <View className="flex-1 p-4 justify-center">
                      <Text 
                        className="text-base text-white mb-1"
                        style={{ fontFamily: 'Poppins_700Bold' }}
                      >
                        {material.name}
                      </Text>
                      <Text 
                        className="text-gray-400 text-sm mb-2"
                        style={{ fontFamily: 'Poppins_400Regular' }}
                      >
                        {material.supplier || 'No supplier'} • {material.quantity} {material.unit}
                      </Text>
                      <Text 
                        className="text-white text-sm"
                        style={{ fontFamily: 'JetBrainsMono_500Medium' }}
                      >
                        ₦{(material.totalPrice || 0).toLocaleString()}
                      </Text>
                    </View>
                  </View>
                  {/* Quick actions - bottom right */}
                  <View className="absolute bottom-3 right-3 flex-row">
                    <TouchableOpacity
                      onPress={() => openReceipt(material.receiptUrl)}
                      className="w-9 h-9 rounded-full bg-blue-600 items-center justify-center mr-2"
                      accessibilityLabel="Download receipt"
                    >
                      <Download size={16} color="#FFFFFF" strokeWidth={2} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => callSupplier(material.supplierContact || material.supplierPhone)}
                      className="w-9 h-9 rounded-full bg-emerald-600 items-center justify-center mr-2"
                      accessibilityLabel="Call supplier"
                    >
                      <Phone size={16} color="#FFFFFF" strokeWidth={2} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => handleDeleteMaterial(material.id, material.name)}
                      className="w-9 h-9 rounded-full bg-red-600 items-center justify-center"
                      accessibilityLabel="Delete material"
                      disabled={deleteMaterialMutation.isPending}
                    >
                      {deleteMaterialMutation.isPending ? (
                        <ActivityIndicator size="small" color="#FFFFFF" />
                      ) : (
                        <Trash2 size={16} color="#FFFFFF" strokeWidth={2} />
                      )}
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            )}
          </View>
        )}

        {/* Team Tab */}
        {activeTab === 'team' && (
          <View className="pb-32">
            <TouchableOpacity
              onPress={() => setShowTeamModal(true)}
              className="bg-blue-600 rounded-xl p-4 mb-4 flex-row items-center justify-center"
            >
              <Plus size={20} color="#FFFFFF" strokeWidth={2} />
              <Text className="text-white ml-2" style={{ fontFamily: 'Poppins_600SemiBold' }}>
                Add Team Member
              </Text>
            </TouchableOpacity>
            
            {teamMembers.length === 0 ? (
              <View className="bg-[#1E3A5F] rounded-xl p-6 items-center border border-blue-900">
                <Users size={48} color="#6B7280" strokeWidth={1.5} />
                <Text className="text-gray-400 text-lg mt-4" style={{ fontFamily: 'Poppins_600SemiBold' }}>
                  No Team Members Yet
                </Text>
                <Text className="text-gray-500 text-sm mt-2 text-center" style={{ fontFamily: 'Poppins_400Regular' }}>
                  Add team members for this stage
                </Text>
              </View>
            ) : (
              teamMembers.map((member: any, index: number) => (
                <View key={member.id || index} className="bg-[#1E3A5F] rounded-xl mb-4 overflow-hidden border border-blue-900 relative">
                  <View className="flex-row p-4">
                    {member.photoUrl ? (
                      <Image
                        source={{ uri: member.photoUrl }}
                        className="w-20 h-20 rounded-xl bg-gray-700"
                        resizeMode="cover"
                      />
                    ) : (
                      <View className="w-20 h-20 bg-gray-700 rounded-xl items-center justify-center">
                        <Users size={32} color="#6B7280" strokeWidth={2} />
                      </View>
                    )}
                    <View className="flex-1 ml-4 justify-center">
                      <Text 
                        className="text-lg text-white mb-1"
                        style={{ fontFamily: 'Poppins_700Bold' }}
                      >
                        {member.name}
                      </Text>
                      <Text 
                        className="text-white mb-1"
                        style={{ fontFamily: 'Poppins_500Medium' }}
                      >
                        {member.role}
                      </Text>
                      {member.dailyRate && (
                        <Text 
                          className="text-gray-400 text-sm"
                          style={{ fontFamily: 'Poppins_400Regular' }}
                        >
                          ₦{member.dailyRate.toLocaleString()}/{member.rateType || 'day'}
                        </Text>
                      )}
                    </View>
                  </View>
                  {/* Quick actions - bottom right */}
                  <View className="absolute bottom-3 right-3 flex-row">
                    <TouchableOpacity
                      onPress={() => openInvoice(member.invoiceUrl)}
                      className="w-9 h-9 rounded-full bg-blue-600 items-center justify-center mr-2"
                      accessibilityLabel="Download invoice"
                    >
                      <Download size={16} color="#FFFFFF" strokeWidth={2} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => callTeamMember(member.phone)}
                      className="w-9 h-9 rounded-full bg-emerald-600 items-center justify-center mr-2"
                      accessibilityLabel="Call team member"
                    >
                      <Phone size={16} color="#FFFFFF" strokeWidth={2} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => handleDeleteTeamMember(member.id, member.name)}
                      className="w-9 h-9 rounded-full bg-red-600 items-center justify-center"
                      accessibilityLabel="Delete team member"
                      disabled={deleteTeamMemberMutation.isPending}
                    >
                      {deleteTeamMemberMutation.isPending ? (
                        <ActivityIndicator size="small" color="#FFFFFF" />
                      ) : (
                        <Trash2 size={16} color="#FFFFFF" strokeWidth={2} />
                      )}
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            )}
          </View>
        )}

        {/* Files Tab */}
        {activeTab === 'files' && (
          <View className="pb-32">
            <TouchableOpacity
              onPress={() => setShowFileModal(true)}
              className="bg-blue-600 rounded-xl p-4 mb-4 flex-row items-center justify-center"
            >
              <Plus size={20} color="#FFFFFF" strokeWidth={2} />
              <Text className="text-white ml-2" style={{ fontFamily: 'Poppins_600SemiBold' }}>
                Add File/Media
              </Text>
            </TouchableOpacity>
            
            {allFiles.length === 0 ? (
              <View className="bg-[#1E3A5F] rounded-xl p-6 items-center border border-blue-900">
                <FileText size={48} color="#6B7280" strokeWidth={1.5} />
                <Text className="text-gray-400 text-lg mt-4" style={{ fontFamily: 'Poppins_600SemiBold' }}>
                  No Files Yet
                </Text>
                <Text className="text-gray-500 text-sm mt-2 text-center" style={{ fontFamily: 'Poppins_400Regular' }}>
                  Upload files, photos, videos, and documents for this stage
                </Text>
              </View>
            ) : (
              allFiles.map((file: any, index: number) => (
                <View 
                  key={file.id || index}
                  className="bg-[#1E3A5F] rounded-xl p-4 mb-3 flex-row items-center border border-blue-900 relative"
                >
                  <View className="w-12 h-12 bg-blue-600 rounded-xl items-center justify-center">
                    {getFileIcon(file.fileType || 'file')}
                  </View>
                  <View className="flex-1 ml-4">
                    <Text 
                      className="text-white text-base"
                      style={{ fontFamily: 'Poppins_500Medium' }}
                      numberOfLines={1}
                    >
                      {file.name}
                    </Text>
                    <Text 
                      className="text-gray-400 text-sm"
                      style={{ fontFamily: 'Poppins_400Regular' }}
                    >
                      {file.uploadedAt ? new Date(file.uploadedAt).toLocaleDateString() : 'Recent'}
                    </Text>
                  </View>
                  {/* Quick actions - right side */}
                  <View className="flex-row items-center">
                    <TouchableOpacity
                      onPress={() => downloadFile(file.url, file.name)}
                      className="w-9 h-9 rounded-full bg-blue-600 items-center justify-center mr-2"
                      accessibilityLabel="Download file"
                    >
                      <Download size={16} color="#FFFFFF" strokeWidth={2} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => handleDeleteFile(file.id, file.name, file.isMedia)}
                      className="w-9 h-9 rounded-full bg-red-600 items-center justify-center"
                      accessibilityLabel="Delete file"
                      disabled={deleteFileMutation.isPending}
                    >
                      {deleteFileMutation.isPending ? (
                        <ActivityIndicator size="small" color="#FFFFFF" />
                      ) : (
                        <Trash2 size={16} color="#FFFFFF" strokeWidth={2} />
                      )}
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            )}
          </View>
        )}
      </ScrollView>

      {/* Fixed Bottom Section */}
      <View className="absolute bottom-0 left-0 right-0 bg-[#0A1628] px-6 py-6 border-t border-blue-900">
        {isComplete ? (
          <View className="bg-green-600 rounded-xl p-5">
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
              className="text-white/90 text-center text-sm"
              style={{ fontFamily: 'Poppins_400Regular' }}
            >
              Congratulations! This stage has been successfully completed.
            </Text>
          </View>
        ) : isInProgress ? (
          <>
            <TouchableOpacity
              onPress={() => setShowCompleteModal(true)}
              className="bg-green-600 rounded-full py-5 px-8"
            >
              <Text 
                className="text-white text-lg text-center"
                style={{ fontFamily: 'Poppins_700Bold' }}
              >
                Mark as Complete
              </Text>
            </TouchableOpacity>
            <Text 
              className="text-gray-400 text-xs text-center mt-3"
              style={{ fontFamily: 'Poppins_400Regular' }}
            >
              Confirm that this stage is complete and homeowner is satisfied
            </Text>
          </>
        ) : (
          <>
            <TouchableOpacity
              onPress={() => setShowPaymentModal(true)}
              className="bg-blue-600 rounded-full py-5 px-8"
            >
              <Text 
                className="text-white text-lg text-center"
                style={{ fontFamily: 'Poppins_700Bold' }}
              >
                Request Payment
              </Text>
            </TouchableOpacity>
            <Text 
              className="text-gray-400 text-xs text-center mt-3"
              style={{ fontFamily: 'Poppins_400Regular' }}
            >
              Request payment from homeowner for this stage
            </Text>
          </>
        )}
      </View>

      {/* Payment Request Modal */}
      <Modal
        visible={showPaymentModal}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setShowPaymentModal(false)}
      >
        <View className="flex-1 bg-black/50 justify-center items-center px-6">
          <View className="bg-[#1E3A5F] rounded-3xl p-8 w-full max-w-md border border-blue-900">
            {!paymentRequested ? (
              <>
                <Text 
                  className="text-3xl text-white mb-4 text-center"
                  style={{ fontFamily: 'Poppins_800ExtraBold' }}
                >
                  Request Payment
                </Text>
                
                <View className="bg-[#0A1628] rounded-xl p-6 mb-6 border border-blue-900">
                  <View className="flex-row justify-between mb-3">
                    <Text 
                      className="text-gray-400"
                      style={{ fontFamily: 'Poppins_400Regular' }}
                    >
                      Stage
                    </Text>
                    <Text 
                      className="text-white"
                      style={{ fontFamily: 'Poppins_500Medium' }}
                    >
                      {name}
                    </Text>
                  </View>
                  
                  <View className="flex-row justify-between">
                    <Text 
                      className="text-gray-400"
                      style={{ fontFamily: 'Poppins_400Regular' }}
                    >
                      Amount
                    </Text>
                    <Text 
                      className="text-2xl text-white"
                      style={{ fontFamily: 'JetBrainsMono_500Medium' }}
                    >
                      ₦{(stage?.estimatedCost || 0).toLocaleString()}
                    </Text>
                  </View>
                </View>

                <View className="bg-[#0A1628] rounded-xl p-4 mb-6 border border-blue-900">
                  <Text 
                    className="text-gray-400 text-sm text-center"
                    style={{ fontFamily: 'Poppins_400Regular' }}
                  >
                    A payment request will be sent to the homeowner for approval.
                  </Text>
                </View>

                <TouchableOpacity
                  onPress={handleRequestPayment}
                  className="bg-blue-600 rounded-full py-5 px-8 mb-3"
                >
                  <Text 
                    className="text-white text-lg text-center"
                    style={{ fontFamily: 'Poppins_700Bold' }}
                  >
                    Send Request
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => setShowPaymentModal(false)}
                  className="py-3"
                >
                  <Text 
                    className="text-gray-400 text-center"
                    style={{ fontFamily: 'Poppins_500Medium' }}
                  >
                    Cancel
                  </Text>
                </TouchableOpacity>
              </>
            ) : (
              <View className="items-center py-8">
                <CheckCircle size={80} color="#10B981" strokeWidth={2} fill="#10B981" />
                <Text 
                  className="text-2xl text-white mt-6 text-center"
                  style={{ fontFamily: 'Poppins_800ExtraBold' }}
                >
                  Payment Request Sent!
                </Text>
                <Text 
                  className="text-gray-400 mt-2 text-center"
                  style={{ fontFamily: 'Poppins_400Regular' }}
                >
                  The homeowner will be notified to approve the payment.
                </Text>
              </View>
            )}
          </View>
        </View>
      </Modal>

      {/* Add Team Member Modal */}
      <Modal
        visible={showTeamModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowTeamModal(false)}
      >
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-[#1E3A5F] rounded-t-3xl p-6 max-h-[90%] border-t border-blue-900">
            <View className="flex-row items-center justify-between mb-6">
              <Text className="text-2xl text-white" style={{ fontFamily: 'Poppins_700Bold' }}>
                Add Team Member
              </Text>
              <TouchableOpacity onPress={() => setShowTeamModal(false)}>
                <X size={24} color="#FFFFFF" strokeWidth={2} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Photo Upload */}
              <TouchableOpacity
                onPress={() => pickImage('photo')}
                className="bg-[#0A1628] rounded-xl p-6 mb-4 items-center border border-blue-900"
              >
                {teamForm.photoUri ? (
                  <Image source={{ uri: teamForm.photoUri }} className="w-24 h-24 rounded-xl" resizeMode="cover" />
                ) : (
                  <>
                    <Camera size={32} color="#6B7280" strokeWidth={2} />
                    <Text className="text-gray-400 mt-2" style={{ fontFamily: 'Poppins_500Medium' }}>
                      Add Photo
                    </Text>
                  </>
                )}
              </TouchableOpacity>

              {/* Name */}
              <Text className="text-gray-400 mb-2" style={{ fontFamily: 'Poppins_500Medium' }}>
                Name *
              </Text>
              <TextInput
                value={teamForm.name}
                onChangeText={(text) => setTeamForm(prev => ({ ...prev, name: text }))}
                placeholder="Enter team member name"
                placeholderTextColor="#6B7280"
                className="bg-[#0A1628] rounded-xl p-4 mb-4 text-white border border-blue-900"
                style={{ fontFamily: 'Poppins_400Regular' }}
              />

              {/* Role */}
              <Text className="text-gray-400 mb-2" style={{ fontFamily: 'Poppins_500Medium' }}>
                Role *
              </Text>
              <TextInput
                value={teamForm.role}
                onChangeText={(text) => setTeamForm(prev => ({ ...prev, role: text }))}
                placeholder="e.g., Foreman, Mason, Electrician"
                placeholderTextColor="#6B7280"
                className="bg-[#0A1628] rounded-xl p-4 mb-4 text-white border border-blue-900"
                style={{ fontFamily: 'Poppins_400Regular' }}
              />

              {/* Phone */}
              <Text className="text-gray-400 mb-2" style={{ fontFamily: 'Poppins_500Medium' }}>
                Phone
              </Text>
              <TextInput
                value={teamForm.phone}
                onChangeText={(text) => setTeamForm(prev => ({ ...prev, phone: text }))}
                placeholder="Enter phone number"
                placeholderTextColor="#6B7280"
                keyboardType="phone-pad"
                className="bg-[#0A1628] rounded-xl p-4 mb-4 text-white border border-blue-900"
                style={{ fontFamily: 'Poppins_400Regular' }}
              />

              {/* Email */}
              <Text className="text-gray-400 mb-2" style={{ fontFamily: 'Poppins_500Medium' }}>
                Email
              </Text>
              <TextInput
                value={teamForm.email}
                onChangeText={(text) => setTeamForm(prev => ({ ...prev, email: text }))}
                placeholder="Enter email address"
                placeholderTextColor="#6B7280"
                keyboardType="email-address"
                autoCapitalize="none"
                className="bg-[#0A1628] rounded-xl p-4 mb-4 text-white border border-blue-900"
                style={{ fontFamily: 'Poppins_400Regular' }}
              />

              {/* Daily Rate */}
              <Text className="text-gray-400 mb-2" style={{ fontFamily: 'Poppins_500Medium' }}>
                Daily Rate
              </Text>
              <TextInput
                value={teamForm.dailyRate}
                onChangeText={(text) => setTeamForm(prev => ({ ...prev, dailyRate: text }))}
                placeholder="Enter daily rate"
                placeholderTextColor="#6B7280"
                keyboardType="decimal-pad"
                className="bg-[#0A1628] rounded-xl p-4 mb-4 text-white border border-blue-900"
                style={{ fontFamily: 'Poppins_400Regular' }}
              />

              {/* Rate Type */}
              <Text className="text-gray-400 mb-2" style={{ fontFamily: 'Poppins_500Medium' }}>
                Rate Type
              </Text>
              <View className="flex-row mb-4">
                {(['daily', 'hourly', 'fixed'] as const).map((type) => (
                  <TouchableOpacity
                    key={type}
                    onPress={() => setTeamForm(prev => ({ ...prev, rateType: type }))}
                    className={`flex-1 py-3 rounded-xl mr-2 border ${
                      teamForm.rateType === type
                        ? 'bg-blue-600 border-blue-600'
                        : 'bg-[#0A1628] border-blue-900'
                    }`}
                  >
                    <Text
                      className={`text-center capitalize ${
                        teamForm.rateType === type ? 'text-white' : 'text-gray-400'
                      }`}
                      style={{ fontFamily: 'Poppins_500Medium' }}
                    >
                      {type}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Invoice Upload */}
              <TouchableOpacity
                onPress={() => pickImage('invoice')}
                className="bg-[#0A1628] rounded-xl p-4 mb-4 flex-row items-center border border-blue-900"
              >
                <FileText size={20} color="#6B7280" strokeWidth={2} />
                <View className="flex-1 ml-2">
                  <Text className="text-gray-400" style={{ fontFamily: 'Poppins_400Regular' }}>
                    {teamForm.invoiceUri ? (teamForm.invoiceName || 'Invoice uploaded') : 'Upload Invoice/Receipt'}
                  </Text>
                </View>
                {teamForm.invoiceUri && (
                  <View className="flex-row items-center">
                    <CheckCircle size={20} color="#10B981" strokeWidth={2} />
                    <TouchableOpacity
                      onPress={() => setTeamForm(prev => ({ ...prev, invoiceUri: null, invoiceFile: null, invoiceName: '' }))}
                      className="ml-2"
                    >
                      <X size={16} color="#EF4444" strokeWidth={2} />
                    </TouchableOpacity>
                  </View>
                )}
              </TouchableOpacity>

              {/* Notes */}
              <Text className="text-gray-400 mb-2" style={{ fontFamily: 'Poppins_500Medium' }}>
                Notes
              </Text>
              <TextInput
                value={teamForm.notes}
                onChangeText={(text) => setTeamForm(prev => ({ ...prev, notes: text }))}
                placeholder="Additional notes..."
                placeholderTextColor="#6B7280"
                multiline
                numberOfLines={3}
                className="bg-[#0A1628] rounded-xl p-4 mb-6 text-white border border-blue-900"
                style={{ fontFamily: 'Poppins_400Regular' }}
              />

              {/* Submit Button */}
              <TouchableOpacity
                onPress={handleAddTeamMember}
                disabled={addTeamMemberMutation.isPending}
                className="bg-blue-600 rounded-full py-4 mb-4"
              >
                {addTeamMemberMutation.isPending ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text className="text-white text-center" style={{ fontFamily: 'Poppins_600SemiBold' }}>
                    Add Team Member
                  </Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setShowTeamModal(false)}
                className="py-3"
              >
                <Text className="text-gray-400 text-center" style={{ fontFamily: 'Poppins_500Medium' }}>
                  Cancel
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Add Material Modal */}
      <Modal
        visible={showMaterialModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowMaterialModal(false)}
      >
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-[#1E3A5F] rounded-t-3xl p-6 max-h-[90%] border-t border-blue-900">
            <View className="flex-row items-center justify-between mb-6">
              <Text className="text-2xl text-white" style={{ fontFamily: 'Poppins_700Bold' }}>
                Add Material
              </Text>
              <TouchableOpacity onPress={() => setShowMaterialModal(false)}>
                <X size={24} color="#FFFFFF" strokeWidth={2} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Photo Upload */}
              <TouchableOpacity
                onPress={() => pickImage('photo')}
                className="bg-[#0A1628] rounded-xl p-6 mb-4 items-center border border-blue-900"
              >
                {materialForm.photoUri ? (
                  <View className="items-center">
                    <Image source={{ uri: materialForm.photoUri }} className="w-24 h-24 rounded-xl mb-2" resizeMode="cover" />
                    {materialForm.photoName && (
                      <Text className="text-gray-400 text-xs" style={{ fontFamily: 'Poppins_400Regular' }} numberOfLines={1}>
                        {materialForm.photoName}
                      </Text>
                    )}
                    <TouchableOpacity
                      onPress={() => setMaterialForm(prev => ({ ...prev, photoUri: null, photoFile: null, photoName: '' }))}
                      className="mt-2"
                    >
                      <Text className="text-red-400 text-xs" style={{ fontFamily: 'Poppins_500Medium' }}>
                        Remove
                      </Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <>
                    <Camera size={32} color="#6B7280" strokeWidth={2} />
                    <Text className="text-gray-400 mt-2" style={{ fontFamily: 'Poppins_500Medium' }}>
                      Add Material Photo
                    </Text>
                  </>
                )}
              </TouchableOpacity>

              {/* Name */}
              <Text className="text-gray-400 mb-2" style={{ fontFamily: 'Poppins_500Medium' }}>
                Material Name *
              </Text>
              <TextInput
                value={materialForm.name}
                onChangeText={(text) => setMaterialForm(prev => ({ ...prev, name: text }))}
                placeholder="Enter material name"
                placeholderTextColor="#6B7280"
                className="bg-[#0A1628] rounded-xl p-4 mb-4 text-white border border-blue-900"
                style={{ fontFamily: 'Poppins_400Regular' }}
              />

              {/* Brand */}
              <Text className="text-gray-400 mb-2" style={{ fontFamily: 'Poppins_500Medium' }}>
                Brand
              </Text>
              <TextInput
                value={materialForm.brand}
                onChangeText={(text) => setMaterialForm(prev => ({ ...prev, brand: text }))}
                placeholder="Enter brand name"
                placeholderTextColor="#6B7280"
                className="bg-[#0A1628] rounded-xl p-4 mb-4 text-white border border-blue-900"
                style={{ fontFamily: 'Poppins_400Regular' }}
              />

              {/* Quantity and Unit */}
              <View className="flex-row mb-4">
                <View className="flex-1 mr-2">
                  <Text className="text-gray-400 mb-2" style={{ fontFamily: 'Poppins_500Medium' }}>
                    Quantity *
                  </Text>
                  <TextInput
                    value={materialForm.quantity}
                    onChangeText={(text) => setMaterialForm(prev => ({ ...prev, quantity: text }))}
                    placeholder="0"
                    placeholderTextColor="#6B7280"
                    keyboardType="decimal-pad"
                    className="bg-[#0A1628] rounded-xl p-4 text-white border border-blue-900"
                    style={{ fontFamily: 'Poppins_400Regular' }}
                  />
                </View>
                <View className="flex-1 ml-2">
                  <Text className="text-gray-400 mb-2" style={{ fontFamily: 'Poppins_500Medium' }}>
                    Unit
                  </Text>
                  <View className="flex-row">
                    {['bags', 'kg', 'pieces', 'liters', 'meters'].map((unit) => (
                      <TouchableOpacity
                        key={unit}
                        onPress={() => setMaterialForm(prev => ({ ...prev, unit }))}
                        className={`flex-1 py-3 rounded-xl mr-1 border ${
                          materialForm.unit === unit
                            ? 'bg-blue-600 border-blue-600'
                            : 'bg-[#0A1628] border-blue-900'
                        }`}
                      >
                        <Text
                          className={`text-center text-xs ${
                            materialForm.unit === unit ? 'text-white' : 'text-gray-400'
                          }`}
                          style={{ fontFamily: 'Poppins_500Medium' }}
                        >
                          {unit}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              </View>

              {/* Unit Price */}
              <Text className="text-gray-400 mb-2" style={{ fontFamily: 'Poppins_500Medium' }}>
                Unit Price *
              </Text>
              <TextInput
                value={materialForm.unitPrice}
                onChangeText={(text) => setMaterialForm(prev => ({ ...prev, unitPrice: text }))}
                placeholder="Enter price per unit"
                placeholderTextColor="#6B7280"
                keyboardType="decimal-pad"
                className="bg-[#0A1628] rounded-xl p-4 mb-4 text-white border border-blue-900"
                style={{ fontFamily: 'Poppins_400Regular' }}
              />

              {/* Supplier */}
              <Text className="text-gray-400 mb-2" style={{ fontFamily: 'Poppins_500Medium' }}>
                Supplier
              </Text>
              <TextInput
                value={materialForm.supplier}
                onChangeText={(text) => setMaterialForm(prev => ({ ...prev, supplier: text }))}
                placeholder="Enter supplier name"
                placeholderTextColor="#6B7280"
                className="bg-[#0A1628] rounded-xl p-4 mb-4 text-white border border-blue-900"
                style={{ fontFamily: 'Poppins_400Regular' }}
              />

              {/* Supplier Contact */}
              <Text className="text-gray-400 mb-2" style={{ fontFamily: 'Poppins_500Medium' }}>
                Supplier Contact
              </Text>
              <TextInput
                value={materialForm.supplierContact}
                onChangeText={(text) => setMaterialForm(prev => ({ ...prev, supplierContact: text }))}
                placeholder="Enter supplier contact"
                placeholderTextColor="#6B7280"
                className="bg-[#0A1628] rounded-xl p-4 mb-4 text-white border border-blue-900"
                style={{ fontFamily: 'Poppins_400Regular' }}
              />

              {/* Receipt Upload */}
              <TouchableOpacity
                onPress={() => pickImage('receipt')}
                className="bg-[#0A1628] rounded-xl p-4 mb-4 flex-row items-center border border-blue-900"
              >
                <FileText size={20} color="#6B7280" strokeWidth={2} />
                <View className="flex-1 ml-2">
                  <Text className="text-gray-400" style={{ fontFamily: 'Poppins_400Regular' }}>
                    {materialForm.receiptUri ? (materialForm.receiptName || 'Receipt uploaded') : 'Upload Receipt'}
                  </Text>
                </View>
                {materialForm.receiptUri && (
                  <View className="flex-row items-center">
                    <CheckCircle size={20} color="#10B981" strokeWidth={2} />
                    <TouchableOpacity
                      onPress={() => setMaterialForm(prev => ({ ...prev, receiptUri: null, receiptFile: null, receiptName: '' }))}
                      className="ml-2"
                    >
                      <X size={16} color="#EF4444" strokeWidth={2} />
                    </TouchableOpacity>
                  </View>
                )}
              </TouchableOpacity>

              {/* Notes */}
              <Text className="text-gray-400 mb-2" style={{ fontFamily: 'Poppins_500Medium' }}>
                Notes
              </Text>
              <TextInput
                value={materialForm.notes}
                onChangeText={(text) => setMaterialForm(prev => ({ ...prev, notes: text }))}
                placeholder="Additional notes..."
                placeholderTextColor="#6B7280"
                multiline
                numberOfLines={3}
                className="bg-[#0A1628] rounded-xl p-4 mb-6 text-white border border-blue-900"
                style={{ fontFamily: 'Poppins_400Regular' }}
              />

              {/* Submit Button */}
              <TouchableOpacity
                onPress={handleAddMaterial}
                disabled={addMaterialMutation.isPending}
                className="bg-blue-600 rounded-full py-4 mb-4"
              >
                {addMaterialMutation.isPending ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text className="text-white text-center" style={{ fontFamily: 'Poppins_600SemiBold' }}>
                    Add Material
                  </Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setShowMaterialModal(false)}
                className="py-3"
              >
                <Text className="text-gray-400 text-center" style={{ fontFamily: 'Poppins_500Medium' }}>
                  Cancel
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Add File/Media Modal */}
      <Modal
        visible={showFileModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowFileModal(false)}
      >
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-[#1E3A5F] rounded-t-3xl p-6 max-h-[90%] border-t border-blue-900">
            <View className="flex-row items-center justify-between mb-6">
              <Text className="text-2xl text-white" style={{ fontFamily: 'Poppins_700Bold' }}>
                Add File/Media
              </Text>
              <TouchableOpacity onPress={() => setShowFileModal(false)}>
                <X size={24} color="#FFFFFF" strokeWidth={2} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* File Type */}
              <Text className="text-gray-400 mb-2" style={{ fontFamily: 'Poppins_500Medium' }}>
                File Type
              </Text>
              <View className="flex-row mb-4 gap-2">
                <TouchableOpacity
                  onPress={() => setFileForm(prev => ({ ...prev, type: 'photo' }))}
                  className={`flex-1 py-3 rounded-xl border ${
                    fileForm.type === 'photo'
                      ? 'bg-blue-600 border-blue-600'
                      : 'bg-[#0A1628] border-blue-900'
                  }`}
                >
                  <Text
                    className={`text-center ${fileForm.type === 'photo' ? 'text-white' : 'text-gray-400'}`}
                    style={{ fontFamily: 'Poppins_500Medium' }}
                  >
                    Photo
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setFileForm(prev => ({ ...prev, type: 'video' }))}
                  className={`flex-1 py-3 rounded-xl border ${
                    fileForm.type === 'video'
                      ? 'bg-blue-600 border-blue-600'
                      : 'bg-[#0A1628] border-blue-900'
                  }`}
                >
                  <Text
                    className={`text-center ${fileForm.type === 'video' ? 'text-white' : 'text-gray-400'}`}
                    style={{ fontFamily: 'Poppins_500Medium' }}
                  >
                    Video
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setFileForm(prev => ({ ...prev, type: 'document' }))}
                  className={`flex-1 py-3 rounded-xl border ${
                    fileForm.type === 'document'
                      ? 'bg-blue-600 border-blue-600'
                      : 'bg-[#0A1628] border-blue-900'
                  }`}
                >
                  <Text
                    className={`text-center ${fileForm.type === 'document' ? 'text-white' : 'text-gray-400'}`}
                    style={{ fontFamily: 'Poppins_500Medium' }}
                  >
                    PDF
                  </Text>
                </TouchableOpacity>
              </View>

              {/* File Upload */}
              <TouchableOpacity
                onPress={() => pickImage('file')}
                className="bg-[#0A1628] rounded-xl p-6 mb-4 items-center border border-blue-900"
              >
                {fileForm.fileUri ? (
                  <View className="items-center">
                    {fileForm.type === 'photo' ? (
                      <Image source={{ uri: fileForm.fileUri }} className="w-24 h-24 rounded-xl mb-2" resizeMode="cover" />
                    ) : fileForm.type === 'video' ? (
                      <View className="w-24 h-24 rounded-xl mb-2 bg-blue-600 items-center justify-center">
                        <Video size={32} color="#FFFFFF" strokeWidth={2} />
                      </View>
                    ) : (
                      <View className="w-24 h-24 rounded-xl mb-2 bg-red-600 items-center justify-center">
                        <FileText size={32} color="#FFFFFF" strokeWidth={2} />
                      </View>
                    )}
                    {fileForm.fileName && (
                      <Text className="text-gray-400 text-xs" style={{ fontFamily: 'Poppins_400Regular' }} numberOfLines={1}>
                        {fileForm.fileName}
                      </Text>
                    )}
                    <TouchableOpacity
                      onPress={() => setFileForm(prev => ({ ...prev, fileUri: null, fileFile: null, fileName: '', fileMimeType: '' }))}
                      className="mt-2"
                    >
                      <Text className="text-red-400 text-xs" style={{ fontFamily: 'Poppins_500Medium' }}>
                        Remove
                      </Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <>
                    <Upload size={32} color="#6B7280" strokeWidth={2} />
                    <Text className="text-gray-400 mt-2" style={{ fontFamily: 'Poppins_500Medium' }}>
                      Select {fileForm.type === 'document' ? 'PDF' : fileForm.type}
                    </Text>
                  </>
                )}
              </TouchableOpacity>

              {/* Caption */}
              <Text className="text-gray-400 mb-2" style={{ fontFamily: 'Poppins_500Medium' }}>
                Caption/Description
              </Text>
              <TextInput
                value={fileForm.caption}
                onChangeText={(text) => setFileForm(prev => ({ ...prev, caption: text }))}
                placeholder="Enter caption or description"
                placeholderTextColor="#6B7280"
                multiline
                numberOfLines={3}
                className="bg-[#0A1628] rounded-xl p-4 mb-6 text-white border border-blue-900"
                style={{ fontFamily: 'Poppins_400Regular' }}
              />

              {/* Submit Button */}
              <TouchableOpacity
                onPress={handleAddFile}
                disabled={addMediaMutation.isPending}
                className="bg-blue-600 rounded-full py-4 mb-4"
              >
                {addMediaMutation.isPending ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text className="text-white text-center" style={{ fontFamily: 'Poppins_600SemiBold' }}>
                    Upload File
                  </Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setShowFileModal(false)}
                className="py-3"
              >
                <Text className="text-gray-400 text-center" style={{ fontFamily: 'Poppins_500Medium' }}>
                  Cancel
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Rename File Modal */}
      <Modal
        visible={showRenameModal}
        animationType="fade"
        transparent={true}
        onRequestClose={() => {
          setShowRenameModal(false);
          setPendingFileData(null);
          setRenameType(null);
          setRenameValue('');
        }}
      >
        <View className="flex-1 bg-black/50 justify-center items-center px-6">
          <View className="bg-[#1E3A5F] rounded-2xl p-6 w-full max-w-md border border-blue-900">
            <Text className="text-xl text-white mb-4" style={{ fontFamily: 'Poppins_700Bold' }}>
              Rename File
            </Text>
            
            <Text className="text-gray-400 mb-4" style={{ fontFamily: 'Poppins_400Regular' }}>
              Enter a name for this file:
            </Text>
            
            <TextInput
              value={renameValue}
              onChangeText={setRenameValue}
              placeholder="File name"
              placeholderTextColor="#6B7280"
              className="bg-[#0A1628] rounded-xl p-4 mb-4 text-white border border-blue-900"
              style={{ fontFamily: 'Poppins_400Regular' }}
              autoFocus
            />
            
            <View className="flex-row gap-3">
              <TouchableOpacity
                onPress={() => {
                  setShowRenameModal(false);
                  setPendingFileData(null);
                  setRenameType(null);
                  setRenameValue('');
                }}
                className="flex-1 bg-[#0A1628] rounded-xl py-3 border border-blue-900"
              >
                <Text className="text-gray-400 text-center" style={{ fontFamily: 'Poppins_500Medium' }}>
                  Cancel
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                onPress={() => {
                  if (pendingFileData && renameType) {
                    const finalName = renameValue.trim() || pendingFileData.fileName;
                    
                    if (renameType === 'photo') {
                      setTeamForm(prev => ({ 
                        ...prev, 
                        photoUri: pendingFileData.uri, 
                        photoFile: pendingFileData.file || null,
                        photoName: finalName 
                      }));
                    } else if (renameType === 'invoice') {
                      setTeamForm(prev => ({ 
                        ...prev, 
                        invoiceUri: pendingFileData.uri, 
                        invoiceFile: pendingFileData.file || null,
                        invoiceName: finalName 
                      }));
                    } else if (renameType === 'receipt') {
                      setMaterialForm(prev => ({ 
                        ...prev, 
                        receiptUri: pendingFileData.uri, 
                        receiptFile: pendingFileData.file || null,
                        receiptName: finalName 
                      }));
                    } else if (renameType === 'file') {
                      setFileForm(prev => ({ 
                        ...prev, 
                        fileUri: pendingFileData.uri, 
                        fileFile: pendingFileData.file || null,
                        fileName: finalName,
                        fileMimeType: pendingFileData.mimeType || '' 
                      }));
                    }
                  }
                  
                  setShowRenameModal(false);
                  setPendingFileData(null);
                  setRenameType(null);
                  setRenameValue('');
                }}
                className="flex-1 bg-blue-600 rounded-xl py-3"
              >
                <Text className="text-white text-center" style={{ fontFamily: 'Poppins_600SemiBold' }}>
                  OK
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Delete Material Confirmation Modal */}
      <Modal
        visible={showDeleteModal}
        animationType="fade"
        transparent={true}
        onRequestClose={cancelDeleteMaterial}
      >
        <View className="flex-1 bg-black/50 justify-center items-center px-6">
          <View className="bg-[#1E3A5F] rounded-2xl p-6 w-full max-w-md border border-blue-900">
            <View className="items-center mb-6">
              <View className="w-16 h-16 rounded-full bg-red-600/20 items-center justify-center mb-4">
                <Trash2 size={32} color="#EF4444" strokeWidth={2} />
              </View>
              <Text className="text-2xl text-white mb-2" style={{ fontFamily: 'Poppins_700Bold' }}>
                Delete Material
              </Text>
              <Text className="text-gray-400 text-center" style={{ fontFamily: 'Poppins_400Regular' }}>
                Are you sure you want to delete "{materialToDelete?.name}"?
              </Text>
              <Text className="text-red-400 text-sm mt-2 text-center" style={{ fontFamily: 'Poppins_500Medium' }}>
                This action cannot be undone.
              </Text>
            </View>
            
            <View className="flex-row gap-3">
              <TouchableOpacity
                onPress={cancelDeleteMaterial}
                className="flex-1 bg-[#0A1628] rounded-xl py-3 border border-blue-900"
              >
                <Text className="text-gray-400 text-center" style={{ fontFamily: 'Poppins_500Medium' }}>
                  Cancel
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                onPress={confirmDeleteMaterial}
                disabled={deleteMaterialMutation.isPending}
                className="flex-1 bg-red-600 rounded-xl py-3"
              >
                {deleteMaterialMutation.isPending ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text className="text-white text-center" style={{ fontFamily: 'Poppins_600SemiBold' }}>
                    Delete
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Delete Team Member Confirmation Modal */}
      <Modal
        visible={showDeleteTeamModal}
        animationType="fade"
        transparent={true}
        onRequestClose={cancelDeleteTeamMember}
      >
        <View className="flex-1 bg-black/50 justify-center items-center px-6">
          <View className="bg-[#1E3A5F] rounded-2xl p-6 w-full max-w-md border border-blue-900">
            <View className="items-center mb-6">
              <View className="w-16 h-16 rounded-full bg-red-600/20 items-center justify-center mb-4">
                <Trash2 size={32} color="#EF4444" strokeWidth={2} />
              </View>
              <Text className="text-2xl text-white mb-2" style={{ fontFamily: 'Poppins_700Bold' }}>
                Delete Team Member
              </Text>
              <Text className="text-gray-400 text-center" style={{ fontFamily: 'Poppins_400Regular' }}>
                Are you sure you want to delete "{teamMemberToDelete?.name}"?
              </Text>
              <Text className="text-red-400 text-sm mt-2 text-center" style={{ fontFamily: 'Poppins_500Medium' }}>
                This action cannot be undone.
              </Text>
            </View>
            
            <View className="flex-row gap-3">
              <TouchableOpacity
                onPress={cancelDeleteTeamMember}
                className="flex-1 bg-[#0A1628] rounded-xl py-3 border border-blue-900"
              >
                <Text className="text-gray-400 text-center" style={{ fontFamily: 'Poppins_500Medium' }}>
                  Cancel
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                onPress={confirmDeleteTeamMember}
                disabled={deleteTeamMemberMutation.isPending}
                className="flex-1 bg-red-600 rounded-xl py-3"
              >
                {deleteTeamMemberMutation.isPending ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text className="text-white text-center" style={{ fontFamily: 'Poppins_600SemiBold' }}>
                    Delete
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Delete File Confirmation Modal */}
      <Modal
        visible={showDeleteFileModal}
        animationType="fade"
        transparent={true}
        onRequestClose={cancelDeleteFile}
      >
        <View className="flex-1 bg-black/50 justify-center items-center px-6">
          <View className="bg-[#1E3A5F] rounded-2xl p-6 w-full max-w-md border border-blue-900">
            <View className="items-center mb-6">
              <View className="w-16 h-16 rounded-full bg-red-600/20 items-center justify-center mb-4">
                <Trash2 size={32} color="#EF4444" strokeWidth={2} />
              </View>
              <Text className="text-2xl text-white mb-2" style={{ fontFamily: 'Poppins_700Bold' }}>
                Delete File
              </Text>
              <Text className="text-gray-400 text-center" style={{ fontFamily: 'Poppins_400Regular' }}>
                Are you sure you want to delete "{fileToDelete?.name}"?
              </Text>
              <Text className="text-red-400 text-sm mt-2 text-center" style={{ fontFamily: 'Poppins_500Medium' }}>
                This action cannot be undone.
              </Text>
            </View>
            
            <View className="flex-row gap-3">
              <TouchableOpacity
                onPress={cancelDeleteFile}
                className="flex-1 bg-[#0A1628] rounded-xl py-3 border border-blue-900"
              >
                <Text className="text-gray-400 text-center" style={{ fontFamily: 'Poppins_500Medium' }}>
                  Cancel
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                onPress={confirmDeleteFile}
                disabled={deleteFileMutation.isPending}
                className="flex-1 bg-red-600 rounded-xl py-3"
              >
                {deleteFileMutation.isPending ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text className="text-white text-center" style={{ fontFamily: 'Poppins_600SemiBold' }}>
                    Delete
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Mark as Complete Confirmation Modal */}
      <Modal
        visible={showCompleteModal}
        animationType="fade"
        transparent={true}
        onRequestClose={() => {
          setShowCompleteModal(false);
          setConfirmations({ stageComplete: false, homeownerSatisfied: false });
        }}
      >
        <View className="flex-1 bg-black/50 justify-center items-center px-6">
          <View className="bg-[#1E3A5F] rounded-2xl p-6 w-full max-w-md border border-blue-900 max-h-[90%]">
            <Text className="text-2xl text-white mb-4" style={{ fontFamily: 'Poppins_700Bold' }}>
              Confirm Stage Completion
            </Text>
            
            <Text className="text-gray-400 mb-6" style={{ fontFamily: 'Poppins_400Regular' }}>
              Please confirm the following before marking this stage as complete:
            </Text>

            <ScrollView showsVerticalScrollIndicator={false} className="max-h-96">
              <TouchableOpacity
                onPress={() => setConfirmations(prev => ({ ...prev, stageComplete: !prev.stageComplete }))}
                className="flex-row items-start p-4 bg-[#0A1628] rounded-xl border border-blue-900 mb-3"
              >
                <View className={`w-6 h-6 rounded border-2 mr-3 mt-0.5 items-center justify-center ${
                  confirmations.stageComplete ? 'bg-green-600 border-green-600' : 'border-gray-400'
                }`}>
                  {confirmations.stageComplete && (
                    <Check size={16} color="#FFFFFF" strokeWidth={3} />
                  )}
                </View>
                <View className="flex-1">
                  <Text className="text-white text-base mb-1" style={{ fontFamily: 'Poppins_600SemiBold' }}>
                    Stage is Truly Complete
                  </Text>
                  <Text className="text-gray-400 text-sm" style={{ fontFamily: 'Poppins_400Regular' }}>
                    I confirm that this stage of the building process has been fully completed according to specifications.
                  </Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setConfirmations(prev => ({ ...prev, homeownerSatisfied: !prev.homeownerSatisfied }))}
                className="flex-row items-start p-4 bg-[#0A1628] rounded-xl border border-blue-900 mb-6"
              >
                <View className={`w-6 h-6 rounded border-2 mr-3 mt-0.5 items-center justify-center ${
                  confirmations.homeownerSatisfied ? 'bg-green-600 border-green-600' : 'border-gray-400'
                }`}>
                  {confirmations.homeownerSatisfied && (
                    <Check size={16} color="#FFFFFF" strokeWidth={3} />
                  )}
                </View>
                <View className="flex-1">
                  <Text className="text-white text-base mb-1" style={{ fontFamily: 'Poppins_600SemiBold' }}>
                    Homeowner Has Reviewed Everything
                  </Text>
                  <Text className="text-gray-400 text-sm" style={{ fontFamily: 'Poppins_400Regular' }}>
                    I confirm that the homeowner has reviewed all videos, team members, materials, and files for this stage and is satisfied.
                  </Text>
                </View>
              </TouchableOpacity>
            </ScrollView>

            {/* Action Buttons */}
            <View className="flex-row gap-3 mt-4">
              <TouchableOpacity
                onPress={() => {
                  setShowCompleteModal(false);
                  setConfirmations({ stageComplete: false, homeownerSatisfied: false });
                }}
                className="flex-1 bg-[#0A1628] rounded-xl py-3 border border-blue-900"
              >
                <Text className="text-gray-400 text-center" style={{ fontFamily: 'Poppins_500Medium' }}>
                  Cancel
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={async () => {
                  if (!confirmations.stageComplete || !confirmations.homeownerSatisfied) {
                    Alert.alert('Required', 'Please confirm both statements before completing the stage');
                    return;
                  }
                  
                  try {
                    await updateStageStatusMutation.mutateAsync({
                      projectId: projectId as string,
                      stageId: stageId as string,
                      status: 'completed',
                    });
                    setShowCompleteModal(false);
                    setConfirmations({ stageComplete: false, homeownerSatisfied: false });
                    refetchProject();
                    Alert.alert('Success', 'Stage marked as complete!');
                  } catch (error: any) {
                    // Extract the error message and show it clearly
                    const errorMessage = error?.message || 'Failed to complete stage';
                    if (errorMessage.includes('Missing required documentation')) {
                      // Parse error message to extract missing requirements
                      const errorText = errorMessage.replace('Cannot complete stage. Missing required documentation: ', '');
                      const missingItems = errorText.split(';').map((item: string) => item.trim());
                      setMissingRequirements(missingItems);
                      setShowDocsRequiredModal(true);
                    } else {
                      Alert.alert('Error', errorMessage);
                    }
                  }
                }}
                disabled={!confirmations.stageComplete || !confirmations.homeownerSatisfied || updateStageStatusMutation.isPending}
                className={`flex-1 bg-green-600 rounded-xl py-3 ${
                  (!confirmations.stageComplete || !confirmations.homeownerSatisfied || updateStageStatusMutation.isPending) ? 'opacity-50' : ''
                }`}
              >
                {updateStageStatusMutation.isPending ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text className="text-white text-center" style={{ fontFamily: 'Poppins_600SemiBold' }}>
                    Confirm & Complete
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* File Too Large Modal */}
      <Modal
        visible={showFileTooLargeModal}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setShowFileTooLargeModal(false)}
      >
        <View className="flex-1 bg-black/50 justify-center items-center px-6">
          <View className="bg-[#1E3A5F] rounded-2xl p-6 w-full max-w-md border border-red-500/40">
            <Text className="text-2xl text-white mb-2" style={{ fontFamily: 'Poppins_700Bold' }}>
              File Too Large
            </Text>
            <Text className="text-gray-300 text-sm leading-6" style={{ fontFamily: 'Poppins_400Regular' }}>
              The file you selected is too large to upload. Please choose a smaller file and try again.
            </Text>
            <Text className="text-gray-400 text-xs mt-3" style={{ fontFamily: 'Poppins_400Regular' }}>
              Tip: compress videos or export documents with a smaller size.
            </Text>
            <TouchableOpacity
              onPress={() => setShowFileTooLargeModal(false)}
              className="mt-6 bg-blue-600 rounded-xl py-3"
            >
              <Text className="text-white text-center" style={{ fontFamily: 'Poppins_600SemiBold' }}>
                Okay
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Documentation Requirements Modal */}
      <Modal
        visible={showDocsRequiredModal}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setShowDocsRequiredModal(false)}
      >
        <View className="flex-1 bg-black/50 justify-center items-center px-6">
          <View className="bg-[#1E3A5F] rounded-2xl p-6 w-full max-w-md border border-blue-900 max-h-[90%]">
            <View className="items-center mb-4">
              <View className="w-16 h-16 rounded-full bg-yellow-600/20 items-center justify-center mb-4">
                <FileText size={32} color="#F59E0B" strokeWidth={2} />
              </View>
              <Text className="text-2xl text-white mb-2" style={{ fontFamily: 'Poppins_700Bold' }}>
                Missing Documentation
              </Text>
              <Text className="text-gray-400 text-center text-sm" style={{ fontFamily: 'Poppins_400Regular' }}>
                Please add the required documentation before marking this stage as complete.
              </Text>
            </View>

            <View className="bg-[#0A1628] rounded-xl p-4 mb-6 border border-blue-900">
              <Text className="text-white text-lg mb-3" style={{ fontFamily: 'Poppins_600SemiBold' }}>
                What You Need to Do:
              </Text>
              
              <ScrollView showsVerticalScrollIndicator={false}>
                <View className="space-y-3">
                  {missingRequirements.some(req => req.includes('photo') && req.includes('process')) && (
                    <View className="flex-row items-start">
                      <View className="w-2 h-2 rounded-full bg-blue-600 mt-2 mr-3" />
                      <Text className="text-gray-300 flex-1 text-sm" style={{ fontFamily: 'Poppins_400Regular' }}>
                        Upload at least one <Text className="text-blue-400" style={{ fontFamily: 'Poppins_600SemiBold' }}>photo</Text> in the Files/Media section (click "Add File/Media" → select "Photo")
                      </Text>
                    </View>
                  )}
                  
                  {missingRequirements.some(req => req.includes('video')) && (
                    <View className="flex-row items-start">
                      <View className="w-2 h-2 rounded-full bg-blue-600 mt-2 mr-3" />
                      <Text className="text-gray-300 flex-1 text-sm" style={{ fontFamily: 'Poppins_400Regular' }}>
                        Upload at least one <Text className="text-blue-400" style={{ fontFamily: 'Poppins_600SemiBold' }}>video</Text> in the Files/Media section (click "Add File/Media" → select "Video")
                      </Text>
                    </View>
                  )}
                  
                  {missingRequirements.some(req => req.toLowerCase().includes('team')) && (
                    <View className="flex-row items-start">
                      <View className="w-2 h-2 rounded-full bg-blue-600 mt-2 mr-3" />
                      <Text className="text-gray-300 flex-1 text-sm" style={{ fontFamily: 'Poppins_400Regular' }}>
                        Ensure team members have <Text className="text-blue-400" style={{ fontFamily: 'Poppins_600SemiBold' }}>photos and invoices</Text>
                      </Text>
                    </View>
                  )}
                  
                  {missingRequirements.some(req => req.toLowerCase().includes('material')) && (
                    <View className="flex-row items-start">
                      <View className="w-2 h-2 rounded-full bg-blue-600 mt-2 mr-3" />
                      <Text className="text-gray-300 flex-1 text-sm" style={{ fontFamily: 'Poppins_400Regular' }}>
                        Ensure materials have <Text className="text-blue-400" style={{ fontFamily: 'Poppins_600SemiBold' }}>receipts and photos</Text>
                      </Text>
                    </View>
                  )}
                </View>
              </ScrollView>
            </View>

            <Text className="text-gray-400 text-center text-sm mb-6" style={{ fontFamily: 'Poppins_400Regular' }}>
              Once all documentation is added, try "Mark as Complete" again. The system will verify everything is in place before allowing completion.
            </Text>

            <TouchableOpacity
              onPress={() => {
                setShowDocsRequiredModal(false);
                setMissingRequirements([]);
              }}
              className="bg-blue-600 rounded-xl py-3"
            >
              <Text className="text-white text-center" style={{ fontFamily: 'Poppins_600SemiBold' }}>
                Got It, I'll Add the Documentation
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

