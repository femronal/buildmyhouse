import { View, Text, ScrollView, TouchableOpacity, Image, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { ArrowLeft, User, Settings, CreditCard, Crown, HelpCircle, LogOut, ChevronRight, Bell, Shield, FileText, Package } from "lucide-react-native";
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { clearAuthToken } from '@/lib/auth';

const menuItems = [
  { icon: User, label: "Personal Information", route: "/profile" },
  { icon: Bell, label: "Notification Settings", route: "/profile" },
  { icon: CreditCard, label: "Billing & Payments", route: "/profile" },
  { icon: Crown, label: "Upgrade to Premium", route: "/profile", highlight: true },
  { icon: Shield, label: "Privacy & Security", route: "/profile" },
  { icon: FileText, label: "Terms & Conditions", route: "/profile" },
  { icon: HelpCircle, label: "Help & Support", route: "/profile" },
  { icon: Settings, label: "App Settings", route: "/profile" },
];

export default function ProfileScreen() {
  const router = useRouter();
  const { data: currentUser, isLoading } = useCurrentUser();

  const handleLogout = async () => {
    await clearAuthToken();
    router.replace('/login');
  };

  const userName = currentUser?.fullName || 'User';
  const userEmail = currentUser?.email || '';
  const userPicture = currentUser?.pictureUrl;
  const userRole = currentUser?.role;

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
        {/* Vendor Dashboard Button */}
        {userRole === 'vendor' && (
          <TouchableOpacity
            onPress={() => router.push('/contractor/vendor-dashboard')}
            className="bg-green-600 rounded-2xl p-6 mb-6 flex-row items-center"
          >
            <View className="w-12 h-12 bg-white rounded-full items-center justify-center">
              <Package size={24} color="#10B981" strokeWidth={2.5} />
            </View>
            <View className="flex-1 ml-4">
              <Text className="text-white text-lg" style={{ fontFamily: 'Poppins_600SemiBold' }}>
                Vendor Dashboard
              </Text>
              <Text className="text-green-100 text-sm" style={{ fontFamily: 'Poppins_400Regular' }}>
                Manage your products & orders
              </Text>
            </View>
            <ChevronRight size={24} color="#FFFFFF" strokeWidth={2} />
          </TouchableOpacity>
        )}
        {/* Profile Card */}
        <View className="bg-black rounded-3xl p-6 mb-6 flex-row items-center">
          {isLoading ? (
            <View className="w-20 h-20 rounded-full bg-gray-800 items-center justify-center">
              <ActivityIndicator size="small" color="#FFFFFF" />
            </View>
          ) : userPicture ? (
            <Image
              source={{ uri: userPicture }}
              className="w-20 h-20 rounded-full"
              resizeMode="cover"
            />
          ) : (
            <View className="w-20 h-20 rounded-full bg-gray-800 items-center justify-center">
              <User size={32} color="#FFFFFF" strokeWidth={2} />
            </View>
          )}
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
                Premium Member
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
              2
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
              1
            </Text>
            <Text 
              className="text-gray-500 text-sm"
              style={{ fontFamily: 'Poppins_400Regular' }}
            >
              Completed
            </Text>
          </View>
        </View>

        {/* Menu Items */}
        <View className="mb-8">
          {menuItems.map((item, index) => (
            <TouchableOpacity
              key={index}
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
