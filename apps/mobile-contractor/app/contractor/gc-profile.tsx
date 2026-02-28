import { View, Text, ScrollView, TouchableOpacity, Image, TextInput, Switch, Alert, Modal, ActivityIndicator, Platform } from "react-native";
import { useRouter, useNavigation } from "expo-router";
import { ArrowLeft, User, CreditCard, Settings, Shield, FileText, HelpCircle, LogOut, ChevronRight, Building2, Award, Mail, Phone, MapPin, Calendar, Banknote, CheckCircle, Edit2, Plus, Trash2 } from "lucide-react-native";
import { useState, useEffect } from "react";
import { clearAuthToken } from "@/lib/auth";
import { useQueryClient } from '@tanstack/react-query';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import {
  useGCProfile,
  useUpdateGCProfile,
  useCreateCertification,
  useUpsertVerificationDocument,
} from "@/hooks/useGCProfile";
import { useUpdateCurrentUser } from "@/hooks/useUpdateCurrentUser";
import { useChangePassword } from "@/hooks/useChangePassword";
import { useUploadProfilePicture } from "@/hooks/useUploadProfilePicture";
import { useBankAccounts, useBankAccount, useCreateBankAccount, useUpdateBankAccount, useDeleteBankAccount } from "@/hooks/useBankAccounts";
import { getBackendAssetUrl } from "@/lib/image";
import { uploadFile } from "@/utils/fileUpload";

export default function GCProfileScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const queryClient = useQueryClient();
  const { data: profileData, isLoading, error } = useGCProfile();
  const updateUser = useUpdateCurrentUser();
  const changePassword = useChangePassword();
  const uploadProfilePicture = useUploadProfilePicture();

  const [activeSection, setActiveSection] = useState<'overview' | 'billing' | 'settings' | 'professional'>('overview');
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(true);
  const [paymentNotifications, setPaymentNotifications] = useState(true);
  const [projectNotifications, setProjectNotifications] = useState(true);
  const [editModal, setEditModal] = useState<'company' | 'email' | 'phone' | 'experience' | null>(null);
  const [editValue, setEditValue] = useState('');
  const [certModalVisible, setCertModalVisible] = useState(false);
  const [certForm, setCertForm] = useState({ name: '', expiryYear: '' });
  const [pendingCertFile, setPendingCertFile] = useState<{ uri: string; name: string } | null>(null);
  const [bankModalVisible, setBankModalVisible] = useState(false);
  const [editingBankId, setEditingBankId] = useState<string | null>(null);
  const [deleteConfirmBankId, setDeleteConfirmBankId] = useState<string | null>(null);
  const [logoutModalVisible, setLogoutModalVisible] = useState(false);
  const [passwordModalVisible, setPasswordModalVisible] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [bankForm, setBankForm] = useState({ bankName: '', accountNumber: '', accountOwnerName: '' });

  const { data: bankAccounts = [] } = useBankAccounts();
  const { data: editingBankData } = useBankAccount(editingBankId);
  const createBankAccount = useCreateBankAccount();
  const updateBankAccount = useUpdateBankAccount();
  const deleteBankAccount = useDeleteBankAccount();
  const updateGCProfile = useUpdateGCProfile();
  const createCertification = useCreateCertification();
  const upsertVerificationDocument = useUpsertVerificationDocument();

  const certifications = (profileData?.certifications ?? []).filter(
    (cert) => profileData?.verified || !cert.documentType,
  );
  const requiredVerificationDocs = profileData?.verificationRequiredDocuments ?? [];

  const handlePickProfilePicture = async () => {
    try {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        Alert.alert('Permission required', 'Please allow photo library access to upload a profile picture.');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.85,
      });
      if (result.canceled) return;
      const asset = result.assets?.[0];
      if (!asset?.uri) return;
      const mimeType = (asset as any).mimeType || 'image/jpeg';
      const fileName = (asset as any).fileName || `profile-${Date.now()}.jpg`;
      await uploadProfilePicture.mutateAsync({ uri: asset.uri, name: fileName, type: mimeType });
      Alert.alert('Updated', 'Your profile picture has been updated.');
    } catch (e: any) {
      Alert.alert('Upload failed', e?.message || 'Please try again.');
    }
  };

  const openEditModal = (field: 'company' | 'email' | 'phone' | 'experience') => {
    setEditModal(field);
    if (field === 'company') setEditValue(profileData?.fullName ?? '');
    else if (field === 'email') setEditValue(profileData?.email ?? '');
    else if (field === 'phone') setEditValue(profileData?.phone ?? '');
    else setEditValue(String(profileData?.experienceYears ?? ''));
  };

  const saveEdit = async () => {
    if (!editModal) return;
    try {
      if (editModal === 'company') {
        await updateUser.mutateAsync({ fullName: editValue.trim() });
      } else if (editModal === 'email') {
        await updateUser.mutateAsync({ email: editValue.trim() });
      } else if (editModal === 'phone') {
        await updateUser.mutateAsync({ phone: editValue.trim() || undefined });
      } else if (editModal === 'experience') {
        const years = parseInt(editValue.trim(), 10);
        if (isNaN(years) || years < 0 || years > 100) {
          Alert.alert('Invalid input', 'Please enter a number between 0 and 100.');
          return;
        }
        await updateGCProfile.mutateAsync({ experienceYears: years });
      }
      setEditModal(null);
      Alert.alert('Saved', 'Your information has been updated.');
    } catch (e: any) {
      Alert.alert('Could not save', e?.message || 'Please try again.');
    }
  };

  const handleAddCertification = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
        copyToCacheDirectory: true,
      });
      if (result.canceled) return;
      const file = result.assets[0];
      const baseName = file.name?.replace(/\.[^/.]+$/, '') || 'Certification';
      setPendingCertFile({ uri: file.uri, name: file.name ?? '' });
      setCertForm({ name: baseName, expiryYear: '' });
      setCertModalVisible(true);
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Could not pick file.');
    }
  };

  const handleSaveCertification = async () => {
    if (!pendingCertFile || !certForm.name.trim()) {
      Alert.alert('Missing name', 'Please enter a name for the certification.');
      return;
    }
    try {
      const fileUrl = await uploadFile(pendingCertFile.uri, 'document', {
        fileName: pendingCertFile.name,
      });
      const urlPath = fileUrl.startsWith('http') ? new URL(fileUrl).pathname : fileUrl;
      await createCertification.mutateAsync({
        name: certForm.name.trim(),
        fileUrl: urlPath.startsWith('/') ? urlPath : `/${urlPath}`,
        expiryYear: certForm.expiryYear.trim() || undefined,
      });
      setCertModalVisible(false);
      setPendingCertFile(null);
      setCertForm({ name: '', expiryYear: '' });
      Alert.alert('Added', 'Your certification has been added.');
    } catch (e: any) {
      Alert.alert('Upload failed', e?.message || 'Please try again.');
    }
  };

  const handleUploadVerificationDocument = async (documentType: string, documentTitle: string) => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'image/*'],
        copyToCacheDirectory: true,
      });
      if (result.canceled) return;
      const file = result.assets[0];
      if (!file?.uri) return;

      const fileUrl = await uploadFile(file.uri, 'document', {
        fileName: file.name,
        mimeType: file.mimeType,
      });
      const urlPath = fileUrl.startsWith('http') ? new URL(fileUrl).pathname : fileUrl;
      await upsertVerificationDocument.mutateAsync({
        documentType,
        fileUrl: urlPath.startsWith('/') ? urlPath : `/${urlPath}`,
      });
      Alert.alert('Uploaded', `${documentTitle} uploaded successfully.`);
    } catch (e: any) {
      Alert.alert('Upload failed', e?.message || 'Please try again.');
    }
  };

  const handleAddBankAccount = () => {
    if (bankAccounts.length >= 2) {
      Alert.alert('Limit reached', 'You can add up to 2 bank accounts. Remove one first to add another.');
      return;
    }
    setEditingBankId(null);
    setBankForm({ bankName: '', accountNumber: '', accountOwnerName: '' });
    setBankModalVisible(true);
  };

  const handleEditBankAccount = (id: string) => {
    setEditingBankId(id);
    setBankForm({ bankName: '', accountNumber: '', accountOwnerName: '' });
    setBankModalVisible(true);
  };

  useEffect(() => {
    if (editingBankData && editingBankId) {
      setBankForm({
        bankName: editingBankData.bankName ?? '',
        accountNumber: editingBankData.accountNumber ?? '',
        accountOwnerName: editingBankData.accountOwnerName ?? '',
      });
    }
  }, [editingBankData, editingBankId]);

  const handleSaveBankAccount = async () => {
    const { bankName, accountNumber, accountOwnerName } = bankForm;
    if (!bankName.trim() || !accountNumber.trim() || !accountOwnerName.trim()) {
      Alert.alert('Missing fields', 'Please fill in Bank Name, Account Number, and Account Owner\'s Name.');
      return;
    }
    try {
      if (editingBankId) {
        await updateBankAccount.mutateAsync({
          id: editingBankId,
          data: { bankName: bankName.trim(), accountNumber: accountNumber.trim(), accountOwnerName: accountOwnerName.trim() },
        });
        setBankModalVisible(false);
        setEditingBankId(null);
        Alert.alert('Saved', 'Your bank account has been updated.');
      } else {
        await createBankAccount.mutateAsync({ bankName: bankName.trim(), accountNumber: accountNumber.trim(), accountOwnerName: accountOwnerName.trim() });
        setBankModalVisible(false);
        Alert.alert('Saved', 'Your bank account has been added.');
      }
    } catch (e: any) {
      Alert.alert('Could not save', e?.message || 'Please try again.');
    }
  };

  const handleDeletePress = (id: string) => {
    setDeleteConfirmBankId(id);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteConfirmBankId) return;
    try {
      await deleteBankAccount.mutateAsync(deleteConfirmBankId);
      setDeleteConfirmBankId(null);
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Could not remove bank account.');
    }
  };

  const performLogout = async () => {
    try {
      await clearAuthToken();
      queryClient.clear();
      if (Platform.OS === 'web') {
        // Full page reload ensures clean state on web
        window.location.replace('/login');
      } else {
        // Reset root stack to login - required when navigating from nested contractor stack
        try {
          const rootNav = navigation.getParent?.() ?? navigation;
          const reset = (rootNav as any).reset;
          if (typeof reset === 'function') {
            reset({ index: 0, routes: [{ name: 'login' }] });
          } else {
            router.replace('/login');
          }
        } catch {
          router.replace('/login');
        }
      }
    } catch (error) {
      console.error('Error during logout:', error);
      Alert.alert('Error', 'Failed to logout. Please try again.');
    }
  };

  const handleLogout = () => {
    setLogoutModalVisible(true);
  };

  const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/;

  const handleChangePassword = async () => {
    if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
      Alert.alert('Missing fields', 'Please fill in all password fields.');
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      Alert.alert('Password mismatch', 'New password and confirm password do not match.');
      return;
    }
    if (!strongPasswordRegex.test(passwordForm.newPassword)) {
      Alert.alert(
        'Weak password',
        'Use at least 8 characters including uppercase, lowercase, number, and special character.',
      );
      return;
    }
    try {
      await changePassword.mutateAsync({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });
      setPasswordModalVisible(false);
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      Alert.alert('Success', 'Password changed successfully.');
    } catch (e: any) {
      Alert.alert('Could not change password', e?.message || 'Please try again.');
    }
  };

  if (isLoading && !profileData) {
    return (
      <View className="flex-1 bg-[#0A1628] items-center justify-center">
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text className="text-gray-400 mt-4" style={{ fontFamily: 'Poppins_400Regular' }}>Loading profile...</Text>
      </View>
    );
  }

  if (error || !profileData) {
    return (
      <View className="flex-1 bg-[#0A1628] items-center justify-center p-6">
        <Text className="text-red-400 text-center" style={{ fontFamily: 'Poppins_500Medium' }}>
          Failed to load profile. Please try again.
        </Text>
        <TouchableOpacity onPress={() => router.back()} className="mt-4 px-6 py-2 bg-blue-600 rounded-lg">
          <Text className="text-white" style={{ fontFamily: 'Poppins_600SemiBold' }}>Go back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const profileImageUrl = profileData.pictureUrl ? getBackendAssetUrl(profileData.pictureUrl) : 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80';

  return (
    <View className="flex-1 bg-[#0A1628]">
      <View className="pt-16 px-6 pb-4 flex-row items-center">
        <TouchableOpacity
          onPress={() => router.canGoBack() ? router.back() : router.push('/contractor/gc-dashboard')}
          className="w-10 h-10 bg-[#1E3A5F] rounded-full items-center justify-center mr-4"
        >
          <ArrowLeft size={22} color="#FFFFFF" strokeWidth={2} />
        </TouchableOpacity>
        <Text className="text-white text-xl flex-1" style={{ fontFamily: 'Poppins_700Bold' }}>
          Profile & Settings
        </Text>
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="px-6 mb-6">
          <View className="bg-[#1E3A5F] rounded-3xl p-6 border border-blue-900">
            <View className="flex-row items-center mb-4">
              <TouchableOpacity className="relative" onPress={handlePickProfilePicture}>
                <Image
                  source={{ uri: profileImageUrl }}
                  className="w-20 h-20 rounded-full border-2 border-blue-600"
                  resizeMode="cover"
                />
                <View className="absolute bottom-0 right-0 w-6 h-6 bg-blue-600 rounded-full items-center justify-center border-2 border-[#1E3A5F]">
                  <Edit2 size={12} color="#FFFFFF" strokeWidth={2} />
                </View>
              </TouchableOpacity>
              <View className="ml-4 flex-1">
                <View className="flex-row items-center mb-1">
                  <Text className="text-white text-2xl mr-2" style={{ fontFamily: 'Poppins_700Bold' }}>
                    {profileData.fullName}
                  </Text>
                  {profileData.verified && (
                    <CheckCircle size={20} color="#10B981" strokeWidth={2} />
                  )}
                </View>
                <Text className="text-gray-400 text-sm mb-2" style={{ fontFamily: 'Poppins_400Regular' }}>
                  {profileData.specialty} • {profileData.experience || '—'}
                </Text>
                <View className="flex-row items-center">
                  <View className="bg-yellow-600/20 rounded-full px-2 py-1 mr-2">
                    <Text className="text-yellow-400 text-xs" style={{ fontFamily: 'Poppins_600SemiBold' }}>
                      ⭐ {profileData.rating?.toFixed(1) || '0'}
                    </Text>
                  </View>
                  <Text className="text-gray-500 text-xs" style={{ fontFamily: 'Poppins_400Regular' }}>
                    {profileData.totalProjects} projects
                  </Text>
                </View>
              </View>
            </View>

            <View className="flex-row pt-4 border-t border-blue-900">
              <View className="flex-1 items-center">
                <Text className="text-white text-xl" style={{ fontFamily: 'Poppins_700Bold' }}>
                  {profileData.activeProjects}
                </Text>
                <Text className="text-gray-400 text-xs" style={{ fontFamily: 'Poppins_400Regular' }}>Active</Text>
              </View>
              <View className="w-px bg-blue-900" />
              <View className="flex-1 items-center">
                <Text className="text-white text-xl" style={{ fontFamily: 'Poppins_700Bold' }}>
                  {profileData.completedProjects}
                </Text>
                <Text className="text-gray-400 text-xs" style={{ fontFamily: 'Poppins_400Regular' }}>Completed</Text>
              </View>
              <View className="w-px bg-blue-900" />
              <View className="flex-1 items-center">
                <Text className="text-white text-xl" style={{ fontFamily: 'Poppins_700Bold' }}>
                  ₦{(profileData.totalEarnings / 1000).toFixed(0)}K
                </Text>
                <Text className="text-gray-400 text-xs" style={{ fontFamily: 'Poppins_400Regular' }}>Total Earnings</Text>
              </View>
            </View>
          </View>
        </View>

        <View className="px-6 mb-6">
          <View className="flex-row bg-[#1E3A5F] rounded-2xl p-1 border border-blue-900">
            {[
              { key: 'overview' as const, label: 'Overview', icon: User },
              { key: 'billing' as const, label: 'Billing', icon: CreditCard },
              { key: 'professional' as const, label: 'Professional', icon: Award },
              { key: 'settings' as const, label: 'Settings', icon: Settings },
            ].map((tab) => (
              <TouchableOpacity
                key={tab.key}
                onPress={() => setActiveSection(tab.key)}
                className={`flex-1 flex-row items-center justify-center py-2 rounded-xl ${activeSection === tab.key ? 'bg-blue-600' : ''}`}
              >
                <tab.icon size={16} color={activeSection === tab.key ? '#FFFFFF' : '#6B7280'} strokeWidth={2} />
                <Text
                  className={`ml-1 text-xs ${activeSection === tab.key ? 'text-white' : 'text-gray-500'}`}
                  style={{ fontFamily: 'Poppins_600SemiBold' }}
                >
                  {tab.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {activeSection === 'overview' && (
          <View className="px-6 mb-6">
            <View className="bg-[#1E3A5F] rounded-2xl p-5 border border-blue-900 mb-4">
              <Text className="text-white text-lg mb-4" style={{ fontFamily: 'Poppins_700Bold' }}>
                Personal Information
              </Text>
              <View className="space-y-3">
                <View className="flex-row items-center py-3 border-b border-blue-900">
                  <Mail size={18} color="#6B7280" strokeWidth={2} />
                  <Text className="text-gray-400 text-sm ml-3 flex-1" style={{ fontFamily: 'Poppins_400Regular' }}>Email</Text>
                  <Text
                    className="text-white text-xs mr-2 flex-1"
                    style={{ fontFamily: 'Poppins_500Medium' }}
                    numberOfLines={1}
                    ellipsizeMode="tail"
                  >
                    {profileData.email}
                  </Text>
                  <TouchableOpacity className="p-1 flex-shrink-0" onPress={() => openEditModal('email')}>
                    <Edit2 size={14} color="#3B82F6" strokeWidth={2} />
                  </TouchableOpacity>
                </View>
                <View className="flex-row items-center py-3 border-b border-blue-900">
                  <Phone size={18} color="#6B7280" strokeWidth={2} />
                  <Text className="text-gray-400 text-sm ml-3 flex-1" style={{ fontFamily: 'Poppins_400Regular' }}>Phone</Text>
                  <Text className="text-white text-sm mr-2" style={{ fontFamily: 'Poppins_500Medium' }}>
                    {profileData.phone || '—'}
                  </Text>
                  <TouchableOpacity className="p-1 flex-shrink-0" onPress={() => openEditModal('phone')}>
                    <Edit2 size={14} color="#3B82F6" strokeWidth={2} />
                  </TouchableOpacity>
                </View>
                <View className="flex-row items-center py-3">
                  <MapPin size={18} color="#6B7280" strokeWidth={2} />
                  <Text className="text-gray-400 text-sm ml-3 flex-1" style={{ fontFamily: 'Poppins_400Regular' }}>Location</Text>
                  <Text className="text-white text-sm" style={{ fontFamily: 'Poppins_500Medium' }}>
                    {profileData.location || '—'}
                  </Text>
                </View>
              </View>
            </View>

            <View className="bg-[#1E3A5F] rounded-2xl p-5 border border-blue-900">
              <Text className="text-white text-lg mb-4" style={{ fontFamily: 'Poppins_700Bold' }}>Account Status</Text>
              <View className="flex-row items-center justify-between py-3">
                <View className="flex-row items-center">
                  <Shield size={18} color={profileData.verified ? "#10B981" : "#EF4444"} strokeWidth={2} />
                  <Text className="text-white text-sm ml-3" style={{ fontFamily: 'Poppins_500Medium' }}>Verification Status</Text>
                </View>
                <View className="flex-row items-center">
                  <CheckCircle size={18} color={profileData.verified ? "#10B981" : "#EF4444"} strokeWidth={2} />
                  <Text
                    className={`${profileData.verified ? 'text-green-400' : 'text-red-400'} text-sm ml-2`}
                    style={{ fontFamily: 'Poppins_600SemiBold' }}
                  >
                    {profileData.verified ? 'Verified' : 'Not Verified'}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        )}

        {activeSection === 'billing' && (
          <View className="px-6 mb-6">
            <View className="bg-blue-900/30 rounded-2xl p-4 mb-4 border border-blue-800">
              <Text className="text-blue-200 text-sm" style={{ fontFamily: 'Poppins_400Regular' }}>
                BuildMyHouse sends funds to your bank account after each stage completion. Please ensure your bank details are correct so you receive payments on time. You can add up to 2 bank accounts.
              </Text>
            </View>
            <View className="bg-[#1E3A5F] rounded-2xl p-5 border border-blue-900 mb-4">
              <View className="flex-row items-center justify-between mb-4">
                <Text className="text-white text-lg" style={{ fontFamily: 'Poppins_700Bold' }}>Bank Details</Text>
                <TouchableOpacity
                  onPress={handleAddBankAccount}
                  disabled={bankAccounts.length >= 2}
                  className={`flex-row items-center rounded-full px-4 py-2 ${
                    bankAccounts.length >= 2 ? 'bg-gray-600 opacity-60' : 'bg-blue-600'
                  }`}
                >
                  <Plus size={16} color="#FFFFFF" strokeWidth={2} />
                  <Text className="text-white text-sm ml-2" style={{ fontFamily: 'Poppins_600SemiBold' }}>Add</Text>
                </TouchableOpacity>
              </View>
              {bankAccounts.length === 0 && (
                <Text className="text-gray-400 text-sm py-4" style={{ fontFamily: 'Poppins_400Regular' }}>
                  No bank accounts added yet. Tap Add to add your bank details for receiving stage payments.
                </Text>
              )}
              {bankAccounts.map((account) => (
                <View key={account.id} className="bg-[#0A1628] rounded-xl p-4 mb-3 border border-blue-900 flex-row items-center justify-between">
                  <TouchableOpacity
                    onPress={() => handleEditBankAccount(account.id)}
                    activeOpacity={0.8}
                    className="flex-row items-center flex-1"
                  >
                    <Banknote size={20} color="#3B82F6" strokeWidth={2} />
                    <View className="ml-3 flex-1">
                      <Text className="text-white text-base" style={{ fontFamily: 'Poppins_600SemiBold' }}>{account.bankName}</Text>
                      <Text className="text-gray-400 text-xs" style={{ fontFamily: 'Poppins_400Regular' }}>
                        {account.maskedAccountNumber} • {account.accountOwnerName}
                      </Text>
                    </View>
                  </TouchableOpacity>
                  <View className="flex-row items-center">
                    {account.isDefault && (
                      <View className="bg-green-600/20 rounded-full px-2 py-1 mr-2">
                        <Text className="text-green-400 text-xs" style={{ fontFamily: 'Poppins_600SemiBold' }}>Default</Text>
                      </View>
                    )}
                    <TouchableOpacity onPress={() => handleDeletePress(account.id)} className="w-8 h-8 items-center justify-center">
                      <Trash2 size={18} color="#EF4444" strokeWidth={2} />
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
            <TouchableOpacity
              onPress={() => router.push('/contractor/gc-earnings')}
              className="bg-[#1E3A5F] rounded-2xl p-5 border border-blue-900 flex-row items-center justify-between"
            >
              <View>
                <Text className="text-white text-base mb-1" style={{ fontFamily: 'Poppins_600SemiBold' }}>Payment History</Text>
                <Text className="text-gray-400 text-sm" style={{ fontFamily: 'Poppins_400Regular' }}>View completed payments in Earnings</Text>
              </View>
              <ChevronRight size={20} color="#6B7280" strokeWidth={2} />
            </TouchableOpacity>
          </View>
        )}

        {activeSection === 'professional' && (
          <View className="px-6 mb-6">
            <View className="bg-[#1E3A5F] rounded-2xl p-5 border border-blue-900 mb-4">
              <View className="flex-row items-center justify-between mb-3">
                <Text className="text-white text-lg" style={{ fontFamily: 'Poppins_700Bold' }}>
                  Verification Documents
                </Text>
                <View className={`rounded-full px-3 py-1 ${profileData.hasUploadedAllVerificationDocuments ? 'bg-green-600/20' : 'bg-amber-600/20'}`}>
                  <Text
                    className={`text-xs ${profileData.hasUploadedAllVerificationDocuments ? 'text-green-400' : 'text-amber-300'}`}
                    style={{ fontFamily: 'Poppins_600SemiBold' }}
                  >
                    {profileData.verificationUploadedCount || 0}/{profileData.verificationRequiredCount || requiredVerificationDocs.length}
                  </Text>
                </View>
              </View>
              <Text className="text-gray-400 text-xs mb-3" style={{ fontFamily: 'Poppins_400Regular' }}>
                Upload all required legal/business files so admin can verify your account.
              </Text>
              {requiredVerificationDocs.map((doc) => (
                <View key={doc.type} className="bg-[#0A1628] rounded-xl p-3 mb-3 border border-blue-900">
                  <View className="flex-row items-start justify-between">
                    <View className="flex-1 pr-3">
                      <Text className="text-white text-sm" style={{ fontFamily: 'Poppins_600SemiBold' }}>
                        {doc.title}
                      </Text>
                      <Text className="text-gray-400 text-xs mt-1" style={{ fontFamily: 'Poppins_400Regular' }}>
                        {doc.description}
                      </Text>
                    </View>
                    <View className={`rounded-full px-2 py-1 ${doc.uploaded ? 'bg-green-600/20' : 'bg-gray-700'}`}>
                      <Text
                        className={`text-[10px] ${doc.uploaded ? 'text-green-400' : 'text-gray-300'}`}
                        style={{ fontFamily: 'Poppins_600SemiBold' }}
                      >
                        {doc.uploaded ? 'Uploaded' : 'Missing'}
                      </Text>
                    </View>
                  </View>
                  <TouchableOpacity
                    onPress={() => handleUploadVerificationDocument(doc.type, doc.title)}
                    disabled={upsertVerificationDocument.isPending}
                    className="mt-3 bg-blue-600/20 border border-blue-600 rounded-xl py-2 items-center"
                  >
                    <Text className="text-blue-400 text-xs" style={{ fontFamily: 'Poppins_600SemiBold' }}>
                      {doc.uploaded ? 'Replace File' : 'Upload File'}
                    </Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
            <View className="bg-[#1E3A5F] rounded-2xl p-5 border border-blue-900 mb-4">
              <Text className="text-white text-lg mb-4" style={{ fontFamily: 'Poppins_700Bold' }}>Certifications & Licenses</Text>
              {!profileData.verified && (
                <Text className="text-amber-300 text-xs mb-3" style={{ fontFamily: 'Poppins_500Medium' }}>
                  Verification document uploads are reviewed by admin and will appear here after your account is verified.
                </Text>
              )}
              {certifications.map((cert) => (
                <View key={cert.id} className="bg-[#0A1628] rounded-xl p-4 mb-3 border border-blue-900">
                  <View className="flex-row items-center mb-1">
                    <Award size={18} color="#3B82F6" strokeWidth={2} />
                    <Text className="text-white text-sm ml-2 flex-1" style={{ fontFamily: 'Poppins_600SemiBold' }}>{cert.name}</Text>
                  </View>
                  <Text className="text-gray-400 text-xs" style={{ fontFamily: 'Poppins_400Regular' }}>
                    {cert.expiryYear ? `Expires: ${cert.expiryYear}` : 'No expiry'}
                  </Text>
                </View>
              ))}
              <TouchableOpacity
                onPress={handleAddCertification}
                className="flex-row items-center justify-center py-3 border border-blue-600 rounded-xl mt-2"
              >
                <Plus size={18} color="#3B82F6" strokeWidth={2} />
                <Text className="text-blue-400 text-sm ml-2" style={{ fontFamily: 'Poppins_600SemiBold' }}>Add Certification</Text>
              </TouchableOpacity>
            </View>
            <View className="bg-[#1E3A5F] rounded-2xl p-5 border border-blue-900">
              <Text className="text-white text-lg mb-4" style={{ fontFamily: 'Poppins_700Bold' }}>Business Information</Text>
              <View className="space-y-3">
                <View className="flex-row items-center py-3 border-b border-blue-900">
                  <Building2 size={18} color="#6B7280" strokeWidth={2} />
                  <Text className="text-gray-400 text-sm ml-3 flex-1 mr-4" style={{ fontFamily: 'Poppins_400Regular' }}>Company Name</Text>
                  <Text className="text-white text-sm mr-2" style={{ fontFamily: 'Poppins_500Medium' }}>
                    {profileData.fullName || '—'}
                  </Text>
                  <TouchableOpacity className="p-1 flex-shrink-0" onPress={() => openEditModal('company')}>
                    <Edit2 size={14} color="#3B82F6" strokeWidth={2} />
                  </TouchableOpacity>
                </View>
                <View className="flex-row items-center py-3 border-b border-blue-900">
                  <FileText size={18} color="#6B7280" strokeWidth={2} />
                  <Text className="text-gray-400 text-sm ml-3 flex-1" style={{ fontFamily: 'Poppins_400Regular' }}>Business License</Text>
                  <Text
                    className={`${profileData.verified ? 'text-green-400' : 'text-red-400'} text-sm`}
                    style={{ fontFamily: 'Poppins_600SemiBold' }}
                  >
                    {profileData.verified ? 'Verified' : 'Not Verified'}
                  </Text>
                </View>
                <View className="flex-row items-center py-3">
                  <Calendar size={18} color="#6B7280" strokeWidth={2} />
                  <Text className="text-gray-400 text-sm ml-3 flex-1" style={{ fontFamily: 'Poppins_400Regular' }}>Years of Experience</Text>
                  <Text className="text-white text-sm mr-2" style={{ fontFamily: 'Poppins_500Medium' }}>
                    {profileData.experience || '—'}
                  </Text>
                  <TouchableOpacity className="p-1 flex-shrink-0" onPress={() => openEditModal('experience')}>
                    <Edit2 size={14} color="#3B82F6" strokeWidth={2} />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>
        )}

        {activeSection === 'settings' && (
          <View className="px-6 mb-6">
            <View className="bg-[#1E3A5F] rounded-2xl p-5 border border-blue-900 mb-4">
              <Text className="text-white text-lg mb-4" style={{ fontFamily: 'Poppins_700Bold' }}>Notifications</Text>
              <View className="space-y-3">
                <View className="flex-row items-center justify-between py-3 border-b border-blue-900">
                  <View className="flex-1">
                    <Text className="text-white text-sm mb-1" style={{ fontFamily: 'Poppins_500Medium' }}>Enable Notifications</Text>
                    <Text className="text-gray-400 text-xs" style={{ fontFamily: 'Poppins_400Regular' }}>Receive all notifications</Text>
                  </View>
                  <Switch value={notificationsEnabled} onValueChange={setNotificationsEnabled} trackColor={{ false: '#374151', true: '#3B82F6' }} thumbColor="#FFFFFF" />
                </View>
                <View className="flex-row items-center justify-between py-3 border-b border-blue-900">
                  <View className="flex-1">
                    <Text className="text-white text-sm mb-1" style={{ fontFamily: 'Poppins_500Medium' }}>Email Notifications</Text>
                    <Text className="text-gray-400 text-xs" style={{ fontFamily: 'Poppins_400Regular' }}>Receive updates via email</Text>
                  </View>
                  <Switch value={emailNotifications} onValueChange={setEmailNotifications} trackColor={{ false: '#374151', true: '#3B82F6' }} thumbColor="#FFFFFF" />
                </View>
                <View className="flex-row items-center justify-between py-3 border-b border-blue-900">
                  <View className="flex-1">
                    <Text className="text-white text-sm mb-1" style={{ fontFamily: 'Poppins_500Medium' }}>Push Notifications</Text>
                    <Text className="text-gray-400 text-xs" style={{ fontFamily: 'Poppins_400Regular' }}>Receive push notifications</Text>
                  </View>
                  <Switch value={pushNotifications} onValueChange={setPushNotifications} trackColor={{ false: '#374151', true: '#3B82F6' }} thumbColor="#FFFFFF" />
                </View>
                <View className="flex-row items-center justify-between py-3 border-b border-blue-900">
                  <View className="flex-1">
                    <Text className="text-white text-sm mb-1" style={{ fontFamily: 'Poppins_500Medium' }}>Payment Notifications</Text>
                    <Text className="text-gray-400 text-xs" style={{ fontFamily: 'Poppins_400Regular' }}>Get notified about payments</Text>
                  </View>
                  <Switch value={paymentNotifications} onValueChange={setPaymentNotifications} trackColor={{ false: '#374151', true: '#3B82F6' }} thumbColor="#FFFFFF" />
                </View>
                <View className="flex-row items-center justify-between py-3">
                  <View className="flex-1">
                    <Text className="text-white text-sm mb-1" style={{ fontFamily: 'Poppins_500Medium' }}>Project Updates</Text>
                    <Text className="text-gray-400 text-xs" style={{ fontFamily: 'Poppins_400Regular' }}>Get notified about project changes</Text>
                  </View>
                  <Switch value={projectNotifications} onValueChange={setProjectNotifications} trackColor={{ false: '#374151', true: '#3B82F6' }} thumbColor="#FFFFFF" />
                </View>
              </View>
            </View>
            <View className="bg-[#1E3A5F] rounded-2xl p-5 border border-blue-900 mb-4">
              <Text className="text-white text-lg mb-4" style={{ fontFamily: 'Poppins_700Bold' }}>Privacy & Security</Text>
              <TouchableOpacity
                onPress={() => setPasswordModalVisible(true)}
                className="flex-row items-center justify-between py-3 border-b border-blue-900"
              >
                <Text className="text-white text-sm" style={{ fontFamily: 'Poppins_500Medium' }}>Change Password</Text>
                <ChevronRight size={20} color="#6B7280" strokeWidth={2} />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => router.push('/contractor/privacy-settings')}
                className="flex-row items-center justify-between py-3"
              >
                <Text className="text-white text-sm" style={{ fontFamily: 'Poppins_500Medium' }}>Privacy Settings</Text>
                <ChevronRight size={20} color="#6B7280" strokeWidth={2} />
              </TouchableOpacity>
            </View>
            <View className="bg-[#1E3A5F] rounded-2xl p-5 border border-blue-900 mb-4">
              <TouchableOpacity
                onPress={() => router.push('/contractor/terms-conditions')}
                className="flex-row items-center justify-between py-3 border-b border-blue-900"
              >
                <View className="flex-row items-center">
                  <FileText size={18} color="#6B7280" strokeWidth={2} />
                  <Text className="text-white text-sm ml-3" style={{ fontFamily: 'Poppins_500Medium' }}>Terms & Conditions</Text>
                </View>
                <ChevronRight size={20} color="#6B7280" strokeWidth={2} />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => router.push('/contractor/help-support')}
                className="flex-row items-center justify-between py-3 border-b border-blue-900"
              >
                <View className="flex-row items-center">
                  <HelpCircle size={18} color="#6B7280" strokeWidth={2} />
                  <Text className="text-white text-sm ml-3" style={{ fontFamily: 'Poppins_500Medium' }}>Help & Support</Text>
                </View>
                <ChevronRight size={20} color="#6B7280" strokeWidth={2} />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => router.push('/contractor/about')}
                className="flex-row items-center justify-between py-3"
              >
                <View className="flex-row items-center">
                  <Shield size={18} color="#6B7280" strokeWidth={2} />
                  <Text className="text-white text-sm ml-3" style={{ fontFamily: 'Poppins_500Medium' }}>About</Text>
                </View>
                <ChevronRight size={20} color="#6B7280" strokeWidth={2} />
              </TouchableOpacity>
            </View>
            <TouchableOpacity
              onPress={handleLogout}
              className="bg-red-600/20 rounded-2xl p-5 border border-red-700/50 flex-row items-center justify-center"
            >
              <LogOut size={20} color="#EF4444" strokeWidth={2} />
              <Text className="text-red-400 text-base ml-2" style={{ fontFamily: 'Poppins_600SemiBold' }}>Logout</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      <Modal visible={!!editModal} transparent animationType="fade">
        <View className="flex-1 bg-black/50 justify-center items-center p-6">
          <View className="bg-[#1E3A5F] rounded-2xl p-6 w-full max-w-sm border border-blue-900">
            <Text className="text-white text-lg mb-4" style={{ fontFamily: 'Poppins_700Bold' }}>
              Edit {editModal === 'company' ? 'Company Name' : editModal === 'email' ? 'Email' : editModal === 'phone' ? 'Phone' : 'Years of Experience'}
            </Text>
            <TextInput
              value={editValue}
              onChangeText={setEditValue}
              placeholder={editModal === 'company' ? 'Company name' : editModal === 'email' ? 'Email address' : editModal === 'phone' ? 'Phone number' : 'e.g. 10'}
              placeholderTextColor="#6B7280"
              keyboardType={
                editModal === 'experience'
                  ? 'number-pad'
                  : editModal === 'email'
                    ? 'email-address'
                    : editModal === 'phone'
                      ? 'phone-pad'
                      : 'default'
              }
              autoCapitalize="none"
              className="bg-[#0A1628] rounded-xl px-4 py-3 text-white border border-blue-900 mb-4"
              style={{ fontFamily: 'Poppins_400Regular' }}
            />
            <View className="flex-row gap-3">
              <TouchableOpacity
                onPress={() => setEditModal(null)}
                className="flex-1 py-3 rounded-xl border border-blue-900 items-center"
              >
                <Text className="text-gray-400" style={{ fontFamily: 'Poppins_600SemiBold' }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={saveEdit}
                disabled={updateUser.isPending || updateGCProfile.isPending}
                className="flex-1 py-3 rounded-xl bg-blue-600 items-center"
              >
                {(updateUser.isPending || updateGCProfile.isPending) ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text className="text-white" style={{ fontFamily: 'Poppins_600SemiBold' }}>Save</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={certModalVisible} transparent animationType="fade">
        <View className="flex-1 bg-black/50 justify-center items-center p-6">
          <View className="bg-[#1E3A5F] rounded-2xl p-6 w-full max-w-sm border border-blue-900">
            <Text className="text-white text-lg mb-4" style={{ fontFamily: 'Poppins_700Bold' }}>Name Your Certification</Text>
            <Text className="text-gray-400 text-xs mb-2" style={{ fontFamily: 'Poppins_400Regular' }}>
              Rename the file before uploading. This name will be displayed in your certifications.
            </Text>
            <TextInput
              value={certForm.name}
              onChangeText={(t) => setCertForm((p) => ({ ...p, name: t }))}
              placeholder="e.g. Professional License Certificate"
              placeholderTextColor="#6B7280"
              className="bg-[#0A1628] rounded-xl px-4 py-3 text-white border border-blue-900 mb-3"
              style={{ fontFamily: 'Poppins_400Regular' }}
            />
            <TextInput
              value={certForm.expiryYear}
              onChangeText={(t) => setCertForm((p) => ({ ...p, expiryYear: t }))}
              placeholder="Expiry year (optional) e.g. 2026"
              placeholderTextColor="#6B7280"
              keyboardType="number-pad"
              className="bg-[#0A1628] rounded-xl px-4 py-3 text-white border border-blue-900 mb-4"
              style={{ fontFamily: 'Poppins_400Regular' }}
            />
            <View className="flex-row gap-3">
              <TouchableOpacity
                onPress={() => {
                  setCertModalVisible(false);
                  setPendingCertFile(null);
                  setCertForm({ name: '', expiryYear: '' });
                }}
                className="flex-1 py-3 rounded-xl border border-blue-900 items-center"
              >
                <Text className="text-gray-400" style={{ fontFamily: 'Poppins_600SemiBold' }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleSaveCertification}
                disabled={createCertification.isPending}
                className="flex-1 py-3 rounded-xl bg-blue-600 items-center"
              >
                {createCertification.isPending ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text className="text-white" style={{ fontFamily: 'Poppins_600SemiBold' }}>Upload</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={bankModalVisible} transparent animationType="fade">
        <View className="flex-1 bg-black/50 justify-center items-center p-6">
          <View className="bg-[#1E3A5F] rounded-2xl p-6 w-full max-w-sm border border-blue-900">
            <Text className="text-white text-lg mb-4" style={{ fontFamily: 'Poppins_700Bold' }}>
              {editingBankId ? 'Edit Bank Account' : 'Add Bank Account'}
            </Text>
            <TextInput
              value={bankForm.bankName}
              onChangeText={(t) => setBankForm((p) => ({ ...p, bankName: t }))}
              placeholder="Bank Name"
              placeholderTextColor="#6B7280"
              className="bg-[#0A1628] rounded-xl px-4 py-3 text-white border border-blue-900 mb-3"
              style={{ fontFamily: 'Poppins_400Regular' }}
            />
            <TextInput
              value={bankForm.accountNumber}
              onChangeText={(t) => setBankForm((p) => ({ ...p, accountNumber: t }))}
              placeholder="Account Number"
              placeholderTextColor="#6B7280"
              keyboardType="number-pad"
              className="bg-[#0A1628] rounded-xl px-4 py-3 text-white border border-blue-900 mb-3"
              style={{ fontFamily: 'Poppins_400Regular' }}
            />
            <TextInput
              value={bankForm.accountOwnerName}
              onChangeText={(t) => setBankForm((p) => ({ ...p, accountOwnerName: t }))}
              placeholder="Account Owner's Name"
              placeholderTextColor="#6B7280"
              className="bg-[#0A1628] rounded-xl px-4 py-3 text-white border border-blue-900 mb-4"
              style={{ fontFamily: 'Poppins_400Regular' }}
            />
            <View className="flex-row gap-3">
              <TouchableOpacity
                onPress={() => setBankModalVisible(false)}
                className="flex-1 py-3 rounded-xl border border-blue-900 items-center"
              >
                <Text className="text-gray-400" style={{ fontFamily: 'Poppins_600SemiBold' }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleSaveBankAccount}
                disabled={createBankAccount.isPending || updateBankAccount.isPending}
                className="flex-1 py-3 rounded-xl bg-blue-600 items-center"
              >
                {(createBankAccount.isPending || updateBankAccount.isPending) ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text className="text-white" style={{ fontFamily: 'Poppins_600SemiBold' }}>Save</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={!!deleteConfirmBankId} transparent animationType="fade">
        <View className="flex-1 bg-black/50 justify-center items-center p-6">
          <View className="bg-[#1E3A5F] rounded-2xl p-6 w-full max-w-sm border border-red-900/50">
            <Text className="text-red-400 text-lg mb-2" style={{ fontFamily: 'Poppins_700Bold' }}>Remove Bank Account</Text>
            <Text className="text-gray-300 text-sm mb-6" style={{ fontFamily: 'Poppins_400Regular' }}>
              Are you sure you want to remove this bank account? This action cannot be undone. You will need to add it again if you want to receive payments to this account.
            </Text>
            <View className="flex-row gap-3">
              <TouchableOpacity
                onPress={() => setDeleteConfirmBankId(null)}
                className="flex-1 py-3 rounded-xl border border-blue-900 items-center"
              >
                <Text className="text-gray-400" style={{ fontFamily: 'Poppins_600SemiBold' }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleDeleteConfirm}
                disabled={deleteBankAccount.isPending}
                className="flex-1 py-3 rounded-xl bg-red-600 items-center"
              >
                {deleteBankAccount.isPending ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text className="text-white" style={{ fontFamily: 'Poppins_600SemiBold' }}>Remove</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={logoutModalVisible} transparent animationType="fade">
        <View className="flex-1 bg-black/50 justify-center items-center p-6">
          <View className="bg-[#1E3A5F] rounded-2xl p-6 w-full max-w-sm border border-red-900/50">
            <View className="flex-row items-center mb-2">
              <View className="w-10 h-10 rounded-full bg-red-600/20 items-center justify-center mr-3">
                <LogOut size={18} color="#EF4444" strokeWidth={2.2} />
              </View>
              <Text className="text-white text-lg" style={{ fontFamily: 'Poppins_700Bold' }}>
                Logout
              </Text>
            </View>
            <Text className="text-gray-300 text-sm mb-6" style={{ fontFamily: 'Poppins_400Regular' }}>
              Are you sure you want to logout?
            </Text>
            <View className="flex-row gap-3">
              <TouchableOpacity
                onPress={() => setLogoutModalVisible(false)}
                className="flex-1 py-3 rounded-xl border border-blue-900 items-center"
              >
                <Text className="text-gray-400" style={{ fontFamily: 'Poppins_600SemiBold' }}>
                  Cancel
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={async () => {
                  setLogoutModalVisible(false);
                  await performLogout();
                }}
                className="flex-1 py-3 rounded-xl bg-red-600 items-center"
              >
                <Text className="text-white" style={{ fontFamily: 'Poppins_600SemiBold' }}>
                  Logout
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={passwordModalVisible} transparent animationType="fade">
        <View className="flex-1 bg-black/50 justify-center items-center p-6">
          <View className="bg-[#1E3A5F] rounded-2xl p-6 w-full max-w-sm border border-blue-900">
            <Text className="text-white text-lg mb-1" style={{ fontFamily: 'Poppins_700Bold' }}>
              Change Password
            </Text>
            <Text className="text-gray-400 text-xs mb-4" style={{ fontFamily: 'Poppins_400Regular' }}>
              Use at least 8 characters with uppercase, lowercase, number, and special character.
            </Text>
            <TextInput
              value={passwordForm.currentPassword}
              onChangeText={(t) => setPasswordForm((p) => ({ ...p, currentPassword: t }))}
              placeholder="Current password"
              placeholderTextColor="#6B7280"
              secureTextEntry
              className="bg-[#0A1628] rounded-xl px-4 py-3 text-white border border-blue-900 mb-3"
              style={{ fontFamily: 'Poppins_400Regular' }}
            />
            <TextInput
              value={passwordForm.newPassword}
              onChangeText={(t) => setPasswordForm((p) => ({ ...p, newPassword: t }))}
              placeholder="New password"
              placeholderTextColor="#6B7280"
              secureTextEntry
              className="bg-[#0A1628] rounded-xl px-4 py-3 text-white border border-blue-900 mb-3"
              style={{ fontFamily: 'Poppins_400Regular' }}
            />
            <TextInput
              value={passwordForm.confirmPassword}
              onChangeText={(t) => setPasswordForm((p) => ({ ...p, confirmPassword: t }))}
              placeholder="Confirm new password"
              placeholderTextColor="#6B7280"
              secureTextEntry
              className="bg-[#0A1628] rounded-xl px-4 py-3 text-white border border-blue-900 mb-4"
              style={{ fontFamily: 'Poppins_400Regular' }}
            />
            <View className="flex-row gap-3">
              <TouchableOpacity
                onPress={() => {
                  setPasswordModalVisible(false);
                  setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
                }}
                className="flex-1 py-3 rounded-xl border border-blue-900 items-center"
              >
                <Text className="text-gray-400" style={{ fontFamily: 'Poppins_600SemiBold' }}>
                  Cancel
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleChangePassword}
                disabled={changePassword.isPending}
                className="flex-1 py-3 rounded-xl bg-blue-600 items-center"
              >
                {changePassword.isPending ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text className="text-white" style={{ fontFamily: 'Poppins_600SemiBold' }}>
                    Update
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
