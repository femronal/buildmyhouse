import { View, Text, ScrollView, TouchableOpacity, Image, ActivityIndicator, Alert } from "react-native";
import { useRouter } from "expo-router";
import { ArrowLeft, User, Settings, CreditCard, HelpCircle, LogOut, ChevronRight, Bell, Shield, FileText, Package, Briefcase, Clock } from "lucide-react-native";
import { useState } from "react";
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useUploadProfilePicture } from '@/hooks/useUploadProfilePicture';
import { useActiveProjects, usePendingProjects } from '@/hooks';
import { clearAuthToken } from '@/lib/auth';
import * as ImagePicker from 'expo-image-picker';
import { getBackendAssetUrl } from '@/lib/image';

type MenuItem = {
  icon: any;
  label: string;
  route: string | null;
  highlight?: boolean;
};

const menuItems: MenuItem[] = [
  { icon: User, label: "Personal Information", route: "/personal-information" },
  { icon: Bell, label: "Notification Settings", route: "/notification-settings" },
  { icon: CreditCard, label: "Billing & Payments", route: "/billing-payments" },
  { icon: Shield, label: "Privacy & Security", route: "/privacy-security" },
  { icon: FileText, label: "Terms & Conditions", route: "/terms-conditions" },
  { icon: HelpCircle, label: "Help & Support", route: "/help-support" },
  { icon: Settings, label: "App Settings", route: "/app-settings" },
];

export default function ProfileScreen() {
  const router = useRouter();
  const { data: currentUser, isLoading } = useCurrentUser();
  const uploadProfilePicture = useUploadProfilePicture();
  const { data: activeProjects = [] } = useActiveProjects();
  const { data: pendingProjects = [] } = usePendingProjects();
  const [activeTab, setActiveTab] = useState<'active' | 'completed' | 'pending'>('active');

  const handleLogout = async () => {
    await clearAuthToken();
    router.replace('/login');
  };

  const handleMenuPress = (item: MenuItem) => {
    if (item.route) {
      router.push(item.route as any);
      return;
    }
    Alert.alert('Coming soon', 'This section will be available in a future update.');
  };

  const userName = currentUser?.fullName || 'User';
  const userEmail = currentUser?.email || '';
  const userPicture = currentUser?.pictureUrl;
  const userRole = currentUser?.role;

  const isCompletedProject = (project: any) => {
    const progressValue = Number(project?.progress ?? 0);
    return project?.status === 'completed' || progressValue >= 100;
  };

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

      await uploadProfilePicture.mutateAsync({
        uri: asset.uri,
        name: fileName,
        type: mimeType,
      });

      Alert.alert('Updated', 'Your profile picture has been updated.');
    } catch (e: any) {
      Alert.alert('Upload failed', e?.message || 'Please try again.');
    }
  };
  
  // Completed = explicit completed status OR 100% progress.
  const completedProjects = activeProjects.filter((p: any) => isCompletedProject(p));
  const trulyActiveProjects = activeProjects.filter((p: any) => !isCompletedProject(p));

  return (
    <View className="flex-1 bg-white">
      {/* Header */}
      <View className="pt-16 px-6 pb-4 flex-row items-center">
        <TouchableOpacity onPress={() => router.canGoBack() ? router.back() : router.push('/(tabs)/home')} className="mr-4">
          <ArrowLeft size={28} color="#000000" strokeWidth={2} />
        </TouchableOpacity>
        <Text 
          className="text-2xl text-black"
          style={{ fontFamily: 'Poppins_600SemiBold' }}
        >
          Profile
        </Text>
      </View>

      <ScrollView className="flex-1 px-6">
        {/* General Contractor Dashboard Button */}
        {userRole === 'general_contractor' && (
          <TouchableOpacity
            onPress={() => router.push('/contractor/gc-dashboard' as any)}
            className="bg-blue-600 rounded-2xl p-6 mb-6 flex-row items-center"
          >
            <View className="w-12 h-12 bg-white rounded-full items-center justify-center">
              <Briefcase size={24} color="#3B82F6" strokeWidth={2.5} />
            </View>
            <View className="flex-1 ml-4">
              <Text className="text-white text-lg" style={{ fontFamily: 'Poppins_600SemiBold' }}>
                GC Dashboard
              </Text>
              <Text className="text-blue-100 text-sm" style={{ fontFamily: 'Poppins_400Regular' }}>
                Manage projects & requests
              </Text>
            </View>
            <ChevronRight size={24} color="#FFFFFF" strokeWidth={2} />
          </TouchableOpacity>
        )}

        {/* Vendor features removed for MVP */}
        {/* Profile Card */}
        <View className="bg-black rounded-3xl p-6 mb-6 flex-row items-center">
          <TouchableOpacity
            onPress={handlePickProfilePicture}
            disabled={isLoading || uploadProfilePicture.isPending}
            activeOpacity={0.8}
            className="w-20 h-20 rounded-full overflow-hidden items-center justify-center bg-gray-800"
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : userPicture ? (
              <Image
                source={{ uri: getBackendAssetUrl(userPicture) }}
                className="w-20 h-20 rounded-full"
                resizeMode="cover"
              />
            ) : (
              <User size={32} color="#FFFFFF" strokeWidth={2} />
            )}

            {uploadProfilePicture.isPending && (
              <View className="absolute inset-0 bg-black/50 items-center justify-center">
                <ActivityIndicator size="small" color="#FFFFFF" />
              </View>
            )}
          </TouchableOpacity>
          <View className="ml-4 flex-1">
            <Text 
              className="text-white text-xl"
              style={{ fontFamily: 'Poppins_600SemiBold' }}
            >
              {userName}
            </Text>
            <Text 
              className="text-white/70"
              style={{ fontFamily: 'Poppins_400Regular' }}
            >
              {userEmail}
            </Text>
            <View className="bg-white/20 rounded-full px-3 py-1 mt-2 self-start">
              <Text 
                className="text-white text-xs"
                style={{ fontFamily: 'Poppins_600SemiBold' }}
              >
                Home Owner
              </Text>
            </View>
          </View>
        </View>

        {/* Stats */}
        <View className="flex-row mb-6">
          <View className="flex-1 bg-gray-50 rounded-2xl p-4 mr-2 border border-gray-200">
            <Text 
              className="text-3xl text-black"
              style={{ fontFamily: 'Poppins_600SemiBold' }}
            >
              {trulyActiveProjects.length}
            </Text>
            <Text 
              className="text-gray-500 text-sm"
              style={{ fontFamily: 'Poppins_400Regular' }}
            >
              Active Projects
            </Text>
          </View>
          <View className="flex-1 bg-gray-50 rounded-2xl p-4 ml-2 border border-gray-200">
            <Text 
              className="text-3xl text-black"
              style={{ fontFamily: 'Poppins_600SemiBold' }}
            >
              {completedProjects.length}
            </Text>
            <Text 
              className="text-gray-500 text-sm"
              style={{ fontFamily: 'Poppins_400Regular' }}
            >
              Completed
            </Text>
          </View>
        </View>

        {/* Projects Section with Tabs */}
        <View className="mb-6">
          <Text 
            className="text-xl text-black mb-4"
            style={{ fontFamily: 'Poppins_700Bold' }}
          >
            My Projects
          </Text>
          
          {/* Tabs */}
          <View className="flex-row bg-gray-100 rounded-2xl p-1 mb-4">
            <TouchableOpacity
              onPress={() => setActiveTab('active')}
              className={`flex-1 py-2 px-4 rounded-xl ${activeTab === 'active' ? 'bg-black' : ''}`}
            >
              <Text 
                className={`text-center text-sm ${activeTab === 'active' ? 'text-white' : 'text-gray-600'}`}
                style={{ fontFamily: 'Poppins_600SemiBold' }}
              >
                Active ({trulyActiveProjects.length})
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setActiveTab('completed')}
              className={`flex-1 py-2 px-4 rounded-xl ${activeTab === 'completed' ? 'bg-black' : ''}`}
            >
              <Text 
                className={`text-center text-sm ${activeTab === 'completed' ? 'text-white' : 'text-gray-600'}`}
                style={{ fontFamily: 'Poppins_600SemiBold' }}
              >
                Completed ({completedProjects.length})
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => {
                setActiveTab('pending');
                router.push('/pending-projects');
              }}
              className={`flex-1 py-2 px-4 rounded-xl ${activeTab === 'pending' ? 'bg-black' : ''}`}
            >
              <View className="flex-row items-center justify-center">
                <Clock size={14} color={activeTab === 'pending' ? '#FFFFFF' : '#6B7280'} strokeWidth={2} />
                <Text 
                  className={`ml-1 text-sm ${activeTab === 'pending' ? 'text-white' : 'text-gray-600'}`}
                  style={{ fontFamily: 'Poppins_600SemiBold' }}
                >
                  Pending ({pendingProjects.length})
                </Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* Projects List */}
          {activeTab === 'active' && (
            <View>
              {trulyActiveProjects.length === 0 ? (
                <View className="bg-gray-50 rounded-2xl p-6 items-center border border-gray-200">
                  <Text className="text-gray-500 text-center" style={{ fontFamily: 'Poppins_400Regular' }}>
                    No active projects
                  </Text>
                </View>
              ) : (
                trulyActiveProjects.slice(0, 3).map((project: any) => (
                  <TouchableOpacity
                    key={project.id}
                    onPress={() => router.push(`/dashboard?projectId=${project.id}`)}
                    className="bg-gray-50 rounded-2xl p-4 mb-3 border border-gray-200"
                  >
                    <View className="flex-row items-center justify-between mb-1">
                      <Text className="text-black text-base flex-1 pr-2" style={{ fontFamily: 'Poppins_600SemiBold' }}>
                        {project.name}
                      </Text>
                      <View className="bg-blue-100 rounded-full px-2 py-1">
                        <Text className="text-blue-700 text-[10px]" style={{ fontFamily: 'Poppins_600SemiBold' }}>
                          Active
                        </Text>
                      </View>
                    </View>
                    <Text className="text-gray-500 text-sm" style={{ fontFamily: 'Poppins_400Regular' }}>
                      {project.address}
                    </Text>
                    <View className="flex-row items-center mt-2">
                      <Text className="text-gray-500 text-xs" style={{ fontFamily: 'Poppins_400Regular' }}>
                        Progress: {project.progress}%
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))
              )}
            </View>
          )}

          {activeTab === 'completed' && (
            <View>
              {completedProjects.length === 0 ? (
                <View className="bg-gray-50 rounded-2xl p-6 items-center border border-gray-200">
                  <Text className="text-gray-500 text-center" style={{ fontFamily: 'Poppins_400Regular' }}>
                    No completed projects
                  </Text>
                </View>
              ) : (
                completedProjects.slice(0, 3).map((project: any) => (
                  <TouchableOpacity
                    key={project.id}
                    onPress={() => router.push(`/dashboard?projectId=${project.id}`)}
                    className="bg-gray-50 rounded-2xl p-4 mb-3 border border-gray-200"
                  >
                    <View className="flex-row items-center justify-between mb-1">
                      <Text className="text-black text-base flex-1 pr-2" style={{ fontFamily: 'Poppins_600SemiBold' }}>
                        {project.name}
                      </Text>
                      <View className="bg-emerald-100 rounded-full px-2 py-1">
                        <Text className="text-emerald-700 text-[10px]" style={{ fontFamily: 'Poppins_600SemiBold' }}>
                          Completed
                        </Text>
                      </View>
                    </View>
                    <Text className="text-gray-500 text-sm" style={{ fontFamily: 'Poppins_400Regular' }}>
                      {project.address}
                    </Text>
                  </TouchableOpacity>
                ))
              )}
            </View>
          )}
        </View>

        {/* Menu Items */}
        <View className="mb-8">
          {menuItems.map((item, index) => (
            <TouchableOpacity
              key={index}
              onPress={() => handleMenuPress(item)}
              className={`flex-row items-center py-4 border-b border-gray-100 ${item.highlight ? 'bg-gray-50 -mx-4 px-4 rounded-2xl border-0 mb-2' : ''}`}
            >
              <View className={`w-10 h-10 rounded-full items-center justify-center ${item.highlight ? 'bg-black' : 'bg-gray-100'}`}>
                <item.icon size={20} color={item.highlight ? '#FFFFFF' : '#000000'} strokeWidth={2} />
              </View>
              <Text 
                className={`flex-1 ml-4 ${item.highlight ? 'text-black' : 'text-black'}`}
                style={{ fontFamily: item.highlight ? 'Poppins_600SemiBold' : 'Poppins_500Medium' }}
              >
                {item.label}
              </Text>
              <ChevronRight size={20} color="#A3A3A3" strokeWidth={2} />
            </TouchableOpacity>
          ))}
        </View>

        {/* Logout */}
        <TouchableOpacity 
          onPress={handleLogout}
          className="flex-row items-center py-4 mb-8"
        >
          <View className="w-10 h-10 bg-gray-100 rounded-full items-center justify-center">
            <LogOut size={20} color="#EF4444" strokeWidth={2} />
          </View>
          <Text 
            className="flex-1 ml-4 text-red-500"
            style={{ fontFamily: 'Poppins_500Medium' }}
          >
            Log Out
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}
