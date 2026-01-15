import { View, Text, ScrollView, TouchableOpacity, Image, TextInput, Switch, Alert } from "react-native";
import { useRouter } from "expo-router";
import { ArrowLeft, User, CreditCard, Settings, Shield, Bell, FileText, HelpCircle, LogOut, ChevronRight, Building2, Award, Mail, Phone, MapPin, Calendar, DollarSign, Banknote, CheckCircle, XCircle, Edit2, Plus, Trash2 } from "lucide-react-native";
import { useState } from "react";
import { clearAuthToken } from "@/lib/auth";
import { useQueryClient } from '@tanstack/react-query';

export default function GCProfileScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [activeSection, setActiveSection] = useState<'overview' | 'billing' | 'settings' | 'professional'>('overview');
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(true);
  const [paymentNotifications, setPaymentNotifications] = useState(true);
  const [projectNotifications, setProjectNotifications] = useState(true);

  // Mock data
  const profileData = {
    name: "Chukwuemeka O.",
    email: "chukwuemeka@buildmyhouse.com",
    phone: "+234 801 234 5678",
    location: "Lagos, Nigeria",
    specialty: "General Contractor",
    experience: "15 years",
    verified: true,
    rating: 4.8,
    totalProjects: 47,
    completedProjects: 42,
    activeProjects: 5,
    totalEarnings: 1250000,
    profileImage: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80",
  };

  const paymentMethods = [
    {
      id: 1,
      type: 'card',
      last4: '4242',
      brand: 'Visa',
      expiry: '12/25',
      isDefault: true,
    },
    {
      id: 2,
      type: 'bank',
      bankName: 'First Bank of Nigeria',
      accountNumber: '****5678',
      accountName: 'Chukwuemeka O.',
      isDefault: false,
    },
  ];

  const certifications = [
    { id: 1, name: "Nigerian Institute of Building (NIOB)", verified: true, expiry: "2026" },
    { id: 2, name: "COREN Registered Engineer", verified: true, expiry: "2025" },
    { id: 3, name: "OSHA Safety Certification", verified: true, expiry: "2024" },
  ];

  const handleAddPaymentMethod = () => {
    Alert.alert('Add Payment Method', 'This feature will be available soon');
  };

  const handleDeletePaymentMethod = (id: number) => {
    Alert.alert('Delete Payment Method', 'Are you sure you want to remove this payment method?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => {} },
    ]);
  };

  const handleLogout = async () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      { 
        text: 'Logout', 
        style: 'destructive', 
        onPress: async () => {
          try {
            // Clear auth token
            await clearAuthToken();
            // Clear all cached queries
            queryClient.clear();
            // Navigate to contractor landing page
            router.replace('/contractor');
          } catch (error) {
            console.error('Error during logout:', error);
            Alert.alert('Error', 'Failed to logout. Please try again.');
          }
        }
      },
    ]);
  };

  return (
    <View className="flex-1 bg-[#0A1628]">
      {/* Header */}
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
        {/* Profile Header */}
        <View className="px-6 mb-6">
          <View className="bg-[#1E3A5F] rounded-3xl p-6 border border-blue-900">
            <View className="flex-row items-center mb-4">
              <Image
                source={{ uri: profileData.profileImage }}
                className="w-20 h-20 rounded-full border-2 border-blue-600"
                resizeMode="cover"
              />
              <View className="ml-4 flex-1">
                <View className="flex-row items-center mb-1">
                  <Text className="text-white text-2xl mr-2" style={{ fontFamily: 'Poppins_700Bold' }}>
                    {profileData.name}
                  </Text>
                  {profileData.verified && (
                    <CheckCircle size={20} color="#10B981" strokeWidth={2} />
                  )}
                </View>
                <Text className="text-gray-400 text-sm mb-2" style={{ fontFamily: 'Poppins_400Regular' }}>
                  {profileData.specialty} • {profileData.experience}
                </Text>
                <View className="flex-row items-center">
                  <View className="bg-yellow-600/20 rounded-full px-2 py-1 mr-2">
                    <Text className="text-yellow-400 text-xs" style={{ fontFamily: 'Poppins_600SemiBold' }}>
                      ⭐ {profileData.rating}
                    </Text>
                  </View>
                  <Text className="text-gray-500 text-xs" style={{ fontFamily: 'Poppins_400Regular' }}>
                    {profileData.totalProjects} projects
                  </Text>
                </View>
              </View>
              <TouchableOpacity className="w-10 h-10 bg-blue-600/20 rounded-full items-center justify-center">
                <Edit2 size={18} color="#3B82F6" strokeWidth={2} />
              </TouchableOpacity>
            </View>

            <View className="flex-row pt-4 border-t border-blue-900">
              <View className="flex-1 items-center">
                <Text className="text-white text-xl" style={{ fontFamily: 'Poppins_700Bold' }}>
                  {profileData.activeProjects}
                </Text>
                <Text className="text-gray-400 text-xs" style={{ fontFamily: 'Poppins_400Regular' }}>
                  Active
                </Text>
              </View>
              <View className="w-px bg-blue-900" />
              <View className="flex-1 items-center">
                <Text className="text-white text-xl" style={{ fontFamily: 'Poppins_700Bold' }}>
                  {profileData.completedProjects}
                </Text>
                <Text className="text-gray-400 text-xs" style={{ fontFamily: 'Poppins_400Regular' }}>
                  Completed
                </Text>
              </View>
              <View className="w-px bg-blue-900" />
              <View className="flex-1 items-center">
                <Text className="text-white text-xl" style={{ fontFamily: 'Poppins_700Bold' }}>
                  ${(profileData.totalEarnings / 1000).toFixed(0)}K
                </Text>
                <Text className="text-gray-400 text-xs" style={{ fontFamily: 'Poppins_400Regular' }}>
                  Total Earnings
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Navigation Tabs */}
        <View className="px-6 mb-6">
          <View className="flex-row bg-[#1E3A5F] rounded-2xl p-1 border border-blue-900">
            {[
              { key: 'overview', label: 'Overview', icon: User },
              { key: 'billing', label: 'Billing', icon: CreditCard },
              { key: 'professional', label: 'Professional', icon: Award },
              { key: 'settings', label: 'Settings', icon: Settings },
            ].map((tab) => (
              <TouchableOpacity
                key={tab.key}
                onPress={() => setActiveSection(tab.key as any)}
                className={`flex-1 flex-row items-center justify-center py-2 rounded-xl ${
                  activeSection === tab.key ? 'bg-blue-600' : ''
                }`}
              >
                <tab.icon 
                  size={16} 
                  color={activeSection === tab.key ? '#FFFFFF' : '#6B7280'} 
                  strokeWidth={2} 
                />
                <Text 
                  className={`ml-1 text-xs ${
                    activeSection === tab.key ? 'text-white' : 'text-gray-500'
                  }`}
                  style={{ fontFamily: 'Poppins_600SemiBold' }}
                >
                  {tab.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Overview Section */}
        {activeSection === 'overview' && (
          <View className="px-6 mb-6">
            <View className="bg-[#1E3A5F] rounded-2xl p-5 border border-blue-900 mb-4">
              <Text className="text-white text-lg mb-4" style={{ fontFamily: 'Poppins_700Bold' }}>
                Personal Information
              </Text>
              <View className="space-y-3">
                <View className="flex-row items-center py-3 border-b border-blue-900">
                  <Mail size={18} color="#6B7280" strokeWidth={2} />
                  <Text className="text-gray-400 text-sm ml-3 flex-1" style={{ fontFamily: 'Poppins_400Regular' }}>
                    Email
                  </Text>
                  <Text className="text-white text-sm" style={{ fontFamily: 'Poppins_500Medium' }}>
                    {profileData.email}
                  </Text>
                </View>
                <View className="flex-row items-center py-3 border-b border-blue-900">
                  <Phone size={18} color="#6B7280" strokeWidth={2} />
                  <Text className="text-gray-400 text-sm ml-3 flex-1" style={{ fontFamily: 'Poppins_400Regular' }}>
                    Phone
                  </Text>
                  <Text className="text-white text-sm" style={{ fontFamily: 'Poppins_500Medium' }}>
                    {profileData.phone}
                  </Text>
                </View>
                <View className="flex-row items-center py-3">
                  <MapPin size={18} color="#6B7280" strokeWidth={2} />
                  <Text className="text-gray-400 text-sm ml-3 flex-1" style={{ fontFamily: 'Poppins_400Regular' }}>
                    Location
                  </Text>
                  <Text className="text-white text-sm" style={{ fontFamily: 'Poppins_500Medium' }}>
                    {profileData.location}
                  </Text>
                </View>
              </View>
            </View>

            <View className="bg-[#1E3A5F] rounded-2xl p-5 border border-blue-900">
              <Text className="text-white text-lg mb-4" style={{ fontFamily: 'Poppins_700Bold' }}>
                Account Status
              </Text>
              <View className="flex-row items-center justify-between py-3">
                <View className="flex-row items-center">
                  <Shield size={18} color="#10B981" strokeWidth={2} />
                  <Text className="text-white text-sm ml-3" style={{ fontFamily: 'Poppins_500Medium' }}>
                    Verification Status
                  </Text>
                </View>
                <View className="flex-row items-center">
                  <CheckCircle size={18} color="#10B981" strokeWidth={2} />
                  <Text className="text-green-400 text-sm ml-2" style={{ fontFamily: 'Poppins_600SemiBold' }}>
                    Verified
                  </Text>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* Billing Section */}
        {activeSection === 'billing' && (
          <View className="px-6 mb-6">
            <View className="bg-[#1E3A5F] rounded-2xl p-5 border border-blue-900 mb-4">
              <View className="flex-row items-center justify-between mb-4">
                <Text className="text-white text-lg" style={{ fontFamily: 'Poppins_700Bold' }}>
                  Payment Methods
                </Text>
                <TouchableOpacity
                  onPress={handleAddPaymentMethod}
                  className="flex-row items-center bg-blue-600 rounded-full px-4 py-2"
                >
                  <Plus size={16} color="#FFFFFF" strokeWidth={2} />
                  <Text className="text-white text-sm ml-2" style={{ fontFamily: 'Poppins_600SemiBold' }}>
                    Add
                  </Text>
                </TouchableOpacity>
              </View>

              {paymentMethods.map((method) => (
                <View
                  key={method.id}
                  className="bg-[#0A1628] rounded-xl p-4 mb-3 border border-blue-900"
                >
                  <View className="flex-row items-center justify-between mb-3">
                    <View className="flex-row items-center">
                      {method.type === 'card' ? (
                        <CreditCard size={20} color="#3B82F6" strokeWidth={2} />
                      ) : (
                        <Banknote size={20} color="#3B82F6" strokeWidth={2} />
                      )}
                      <View className="ml-3">
                        {method.type === 'card' ? (
                          <>
                            <Text className="text-white text-base" style={{ fontFamily: 'Poppins_600SemiBold' }}>
                              {method.brand} •••• {method.last4}
                            </Text>
                            <Text className="text-gray-400 text-xs" style={{ fontFamily: 'Poppins_400Regular' }}>
                              Expires {method.expiry}
                            </Text>
                          </>
                        ) : (
                          <>
                            <Text className="text-white text-base" style={{ fontFamily: 'Poppins_600SemiBold' }}>
                              {method.bankName}
                            </Text>
                            <Text className="text-gray-400 text-xs" style={{ fontFamily: 'Poppins_400Regular' }}>
                              {method.accountNumber} • {method.accountName}
                            </Text>
                          </>
                        )}
                      </View>
                    </View>
                    <View className="flex-row items-center">
                      {method.isDefault && (
                        <View className="bg-green-600/20 rounded-full px-2 py-1 mr-2">
                          <Text className="text-green-400 text-xs" style={{ fontFamily: 'Poppins_600SemiBold' }}>
                            Default
                          </Text>
                        </View>
                      )}
                      <TouchableOpacity
                        onPress={() => handleDeletePaymentMethod(method.id)}
                        className="w-8 h-8 items-center justify-center"
                      >
                        <Trash2 size={18} color="#EF4444" strokeWidth={2} />
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              ))}
            </View>

            <View className="bg-[#1E3A5F] rounded-2xl p-5 border border-blue-900">
              <Text className="text-white text-lg mb-4" style={{ fontFamily: 'Poppins_700Bold' }}>
                Payout Settings
              </Text>
              <View className="space-y-3">
                <View className="flex-row items-center justify-between py-3 border-b border-blue-900">
                  <Text className="text-gray-400 text-sm" style={{ fontFamily: 'Poppins_400Regular' }}>
                    Auto Payout
                  </Text>
                  <Switch
                    value={true}
                    onValueChange={() => {}}
                    trackColor={{ false: '#374151', true: '#3B82F6' }}
                    thumbColor="#FFFFFF"
                  />
                </View>
                <View className="flex-row items-center justify-between py-3">
                  <View>
                    <Text className="text-white text-sm mb-1" style={{ fontFamily: 'Poppins_500Medium' }}>
                      Payout Frequency
                    </Text>
                    <Text className="text-gray-400 text-xs" style={{ fontFamily: 'Poppins_400Regular' }}>
                      Weekly
                    </Text>
                  </View>
                  <ChevronRight size={20} color="#6B7280" strokeWidth={2} />
                </View>
              </View>
            </View>
          </View>
        )}

        {/* Professional Section */}
        {activeSection === 'professional' && (
          <View className="px-6 mb-6">
            <View className="bg-[#1E3A5F] rounded-2xl p-5 border border-blue-900 mb-4">
              <Text className="text-white text-lg mb-4" style={{ fontFamily: 'Poppins_700Bold' }}>
                Certifications & Licenses
              </Text>
              {certifications.map((cert) => (
                <View
                  key={cert.id}
                  className="bg-[#0A1628] rounded-xl p-4 mb-3 border border-blue-900"
                >
                  <View className="flex-row items-center justify-between">
                    <View className="flex-1">
                      <View className="flex-row items-center mb-1">
                        <Award size={18} color="#3B82F6" strokeWidth={2} />
                        <Text className="text-white text-sm ml-2" style={{ fontFamily: 'Poppins_600SemiBold' }}>
                          {cert.name}
                        </Text>
                        {cert.verified && (
                          <CheckCircle size={16} color="#10B981" strokeWidth={2} className="ml-2" />
                        )}
                      </View>
                      <Text className="text-gray-400 text-xs" style={{ fontFamily: 'Poppins_400Regular' }}>
                        Expires: {cert.expiry}
                      </Text>
                    </View>
                  </View>
                </View>
              ))}
              <TouchableOpacity className="flex-row items-center justify-center py-3 border border-blue-600 rounded-xl mt-2">
                <Plus size={18} color="#3B82F6" strokeWidth={2} />
                <Text className="text-blue-400 text-sm ml-2" style={{ fontFamily: 'Poppins_600SemiBold' }}>
                  Add Certification
                </Text>
              </TouchableOpacity>
            </View>

            <View className="bg-[#1E3A5F] rounded-2xl p-5 border border-blue-900">
              <Text className="text-white text-lg mb-4" style={{ fontFamily: 'Poppins_700Bold' }}>
                Business Information
              </Text>
              <View className="space-y-3">
                <View className="flex-row items-center py-3 border-b border-blue-900">
                  <Building2 size={18} color="#6B7280" strokeWidth={2} />
                  <Text className="text-gray-400 text-sm ml-3 flex-1" style={{ fontFamily: 'Poppins_400Regular' }}>
                    Company Name
                  </Text>
                  <Text className="text-white text-sm" style={{ fontFamily: 'Poppins_500Medium' }}>
                    Chukwuemeka Construction Ltd
                  </Text>
                </View>
                <View className="flex-row items-center py-3 border-b border-blue-900">
                  <FileText size={18} color="#6B7280" strokeWidth={2} />
                  <Text className="text-gray-400 text-sm ml-3 flex-1" style={{ fontFamily: 'Poppins_400Regular' }}>
                    Business License
                  </Text>
                  <Text className="text-green-400 text-sm" style={{ fontFamily: 'Poppins_600SemiBold' }}>
                    Verified
                  </Text>
                </View>
                <View className="flex-row items-center py-3">
                  <Calendar size={18} color="#6B7280" strokeWidth={2} />
                  <Text className="text-gray-400 text-sm ml-3 flex-1" style={{ fontFamily: 'Poppins_400Regular' }}>
                    Years of Experience
                  </Text>
                  <Text className="text-white text-sm" style={{ fontFamily: 'Poppins_500Medium' }}>
                    {profileData.experience}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* Settings Section */}
        {activeSection === 'settings' && (
          <View className="px-6 mb-6">
            <View className="bg-[#1E3A5F] rounded-2xl p-5 border border-blue-900 mb-4">
              <Text className="text-white text-lg mb-4" style={{ fontFamily: 'Poppins_700Bold' }}>
                Notifications
              </Text>
              <View className="space-y-3">
                <View className="flex-row items-center justify-between py-3 border-b border-blue-900">
                  <View className="flex-1">
                    <Text className="text-white text-sm mb-1" style={{ fontFamily: 'Poppins_500Medium' }}>
                      Enable Notifications
                    </Text>
                    <Text className="text-gray-400 text-xs" style={{ fontFamily: 'Poppins_400Regular' }}>
                      Receive all notifications
                    </Text>
                  </View>
                  <Switch
                    value={notificationsEnabled}
                    onValueChange={setNotificationsEnabled}
                    trackColor={{ false: '#374151', true: '#3B82F6' }}
                    thumbColor="#FFFFFF"
                  />
                </View>
                <View className="flex-row items-center justify-between py-3 border-b border-blue-900">
                  <View className="flex-1">
                    <Text className="text-white text-sm mb-1" style={{ fontFamily: 'Poppins_500Medium' }}>
                      Email Notifications
                    </Text>
                    <Text className="text-gray-400 text-xs" style={{ fontFamily: 'Poppins_400Regular' }}>
                      Receive updates via email
                    </Text>
                  </View>
                  <Switch
                    value={emailNotifications}
                    onValueChange={setEmailNotifications}
                    trackColor={{ false: '#374151', true: '#3B82F6' }}
                    thumbColor="#FFFFFF"
                  />
                </View>
                <View className="flex-row items-center justify-between py-3 border-b border-blue-900">
                  <View className="flex-1">
                    <Text className="text-white text-sm mb-1" style={{ fontFamily: 'Poppins_500Medium' }}>
                      Push Notifications
                    </Text>
                    <Text className="text-gray-400 text-xs" style={{ fontFamily: 'Poppins_400Regular' }}>
                      Receive push notifications
                    </Text>
                  </View>
                  <Switch
                    value={pushNotifications}
                    onValueChange={setPushNotifications}
                    trackColor={{ false: '#374151', true: '#3B82F6' }}
                    thumbColor="#FFFFFF"
                  />
                </View>
                <View className="flex-row items-center justify-between py-3 border-b border-blue-900">
                  <View className="flex-1">
                    <Text className="text-white text-sm mb-1" style={{ fontFamily: 'Poppins_500Medium' }}>
                      Payment Notifications
                    </Text>
                    <Text className="text-gray-400 text-xs" style={{ fontFamily: 'Poppins_400Regular' }}>
                      Get notified about payments
                    </Text>
                  </View>
                  <Switch
                    value={paymentNotifications}
                    onValueChange={setPaymentNotifications}
                    trackColor={{ false: '#374151', true: '#3B82F6' }}
                    thumbColor="#FFFFFF"
                  />
                </View>
                <View className="flex-row items-center justify-between py-3">
                  <View className="flex-1">
                    <Text className="text-white text-sm mb-1" style={{ fontFamily: 'Poppins_500Medium' }}>
                      Project Updates
                    </Text>
                    <Text className="text-gray-400 text-xs" style={{ fontFamily: 'Poppins_400Regular' }}>
                      Get notified about project changes
                    </Text>
                  </View>
                  <Switch
                    value={projectNotifications}
                    onValueChange={setProjectNotifications}
                    trackColor={{ false: '#374151', true: '#3B82F6' }}
                    thumbColor="#FFFFFF"
                  />
                </View>
              </View>
            </View>

            <View className="bg-[#1E3A5F] rounded-2xl p-5 border border-blue-900 mb-4">
              <Text className="text-white text-lg mb-4" style={{ fontFamily: 'Poppins_700Bold' }}>
                Privacy & Security
              </Text>
              <TouchableOpacity className="flex-row items-center justify-between py-3 border-b border-blue-900">
                <Text className="text-white text-sm" style={{ fontFamily: 'Poppins_500Medium' }}>
                  Change Password
                </Text>
                <ChevronRight size={20} color="#6B7280" strokeWidth={2} />
              </TouchableOpacity>
              <TouchableOpacity className="flex-row items-center justify-between py-3 border-b border-blue-900">
                <Text className="text-white text-sm" style={{ fontFamily: 'Poppins_500Medium' }}>
                  Two-Factor Authentication
                </Text>
                <Switch
                  value={false}
                  onValueChange={() => {}}
                  trackColor={{ false: '#374151', true: '#3B82F6' }}
                  thumbColor="#FFFFFF"
                />
              </TouchableOpacity>
              <TouchableOpacity className="flex-row items-center justify-between py-3">
                <Text className="text-white text-sm" style={{ fontFamily: 'Poppins_500Medium' }}>
                  Privacy Settings
                </Text>
                <ChevronRight size={20} color="#6B7280" strokeWidth={2} />
              </TouchableOpacity>
            </View>

            <View className="bg-[#1E3A5F] rounded-2xl p-5 border border-blue-900 mb-4">
              <TouchableOpacity className="flex-row items-center justify-between py-3 border-b border-blue-900">
                <View className="flex-row items-center">
                  <FileText size={18} color="#6B7280" strokeWidth={2} />
                  <Text className="text-white text-sm ml-3" style={{ fontFamily: 'Poppins_500Medium' }}>
                    Terms & Conditions
                  </Text>
                </View>
                <ChevronRight size={20} color="#6B7280" strokeWidth={2} />
              </TouchableOpacity>
              <TouchableOpacity className="flex-row items-center justify-between py-3 border-b border-blue-900">
                <View className="flex-row items-center">
                  <HelpCircle size={18} color="#6B7280" strokeWidth={2} />
                  <Text className="text-white text-sm ml-3" style={{ fontFamily: 'Poppins_500Medium' }}>
                    Help & Support
                  </Text>
                </View>
                <ChevronRight size={20} color="#6B7280" strokeWidth={2} />
              </TouchableOpacity>
              <TouchableOpacity className="flex-row items-center justify-between py-3">
                <View className="flex-row items-center">
                  <Shield size={18} color="#6B7280" strokeWidth={2} />
                  <Text className="text-white text-sm ml-3" style={{ fontFamily: 'Poppins_500Medium' }}>
                    About
                  </Text>
                </View>
                <ChevronRight size={20} color="#6B7280" strokeWidth={2} />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              onPress={handleLogout}
              className="bg-red-600/20 rounded-2xl p-5 border border-red-700/50 flex-row items-center justify-center"
            >
              <LogOut size={20} color="#EF4444" strokeWidth={2} />
              <Text className="text-red-400 text-base ml-2" style={{ fontFamily: 'Poppins_600SemiBold' }}>
                Logout
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

