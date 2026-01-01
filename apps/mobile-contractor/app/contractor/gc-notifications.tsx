import { View, Text, ScrollView, TouchableOpacity, Image, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { ArrowLeft, Bell, DollarSign, CheckCircle, MessageCircle, AlertCircle, FileText, Clock, User, Building2, Award, CreditCard, X } from "lucide-react-native";
import { useState } from "react";

// Mock notification data
const notifications = [
  {
    id: 1,
    type: 'payment',
    title: 'Payment Received',
    message: 'You received $25,000 for "Garden of Eden" project - Foundation stage',
    time: '2 hours ago',
    read: false,
    projectId: '1',
    amount: 25000,
    icon: DollarSign,
    color: '#10B981',
  },
  {
    id: 2,
    type: 'project_request',
    title: 'New Project Request',
    message: 'John Homeowner sent you a new project request for "Modern Villa"',
    time: '5 hours ago',
    read: false,
    projectId: '2',
    icon: Building2,
    color: '#3B82F6',
  },
  {
    id: 3,
    type: 'stage_completion',
    title: 'Stage Completed',
    message: 'Foundation stage for "Garden of Eden" has been marked as complete',
    time: '1 day ago',
    read: true,
    projectId: '1',
    icon: CheckCircle,
    color: '#10B981',
  },
  {
    id: 4,
    type: 'message',
    title: 'New Message',
    message: 'Ifeoma Obi-Uchendu sent you a message about "Classic Colonial Estate"',
    time: '1 day ago',
    read: true,
    projectId: '3',
    icon: MessageCircle,
    color: '#3B82F6',
  },
  {
    id: 5,
    type: 'payment_pending',
    title: 'Payment Pending Approval',
    message: 'Payment of $15,000 for "Luxury Penthouse" is pending homeowner approval',
    time: '2 days ago',
    read: true,
    projectId: '4',
    amount: 15000,
    icon: Clock,
    color: '#F59E0B',
  },
  {
    id: 6,
    type: 'verification',
    title: 'Verification Approved',
    message: 'Your business license verification has been approved',
    time: '3 days ago',
    read: true,
    icon: Award,
    color: '#10B981',
  },
  {
    id: 7,
    type: 'payout',
    title: 'Payout Processed',
    message: '$50,000 has been transferred to your bank account',
    time: '4 days ago',
    read: true,
    amount: 50000,
    icon: CreditCard,
    color: '#10B981',
  },
  {
    id: 8,
    type: 'project_update',
    title: 'Project Update',
    message: 'Homeowner updated the budget for "Modern Villa" project',
    time: '5 days ago',
    read: true,
    projectId: '2',
    icon: FileText,
    color: '#3B82F6',
  },
  {
    id: 9,
    type: 'alert',
    title: 'Action Required',
    message: 'Please review and accept the project request for "Beach House"',
    time: '1 week ago',
    read: true,
    projectId: '5',
    icon: AlertCircle,
    color: '#EF4444',
  },
  {
    id: 10,
    type: 'review',
    title: 'New Review',
    message: 'You received a 5-star review from Adaeze Nwosu for "Classic Colonial Estate"',
    time: '1 week ago',
    read: true,
    projectId: '3',
    icon: User,
    color: '#F59E0B',
  },
];

const notificationTypes = [
  { key: 'all', label: 'All', count: notifications.length },
  { key: 'payment', label: 'Payments', count: notifications.filter(n => n.type.includes('payment')).length },
  { key: 'project', label: 'Projects', count: notifications.filter(n => n.type.includes('project') || n.type.includes('stage')).length },
  { key: 'messages', label: 'Messages', count: notifications.filter(n => n.type === 'message').length },
  { key: 'system', label: 'System', count: notifications.filter(n => ['verification', 'payout', 'review'].includes(n.type)).length },
];

export default function GCNotificationsScreen() {
  const router = useRouter();
  const [activeFilter, setActiveFilter] = useState('all');
  const [unreadCount] = useState(notifications.filter(n => !n.read).length);

  const getFilteredNotifications = () => {
    if (activeFilter === 'all') return notifications;
    if (activeFilter === 'payment') return notifications.filter(n => n.type.includes('payment'));
    if (activeFilter === 'project') return notifications.filter(n => n.type.includes('project') || n.type.includes('stage'));
    if (activeFilter === 'messages') return notifications.filter(n => n.type === 'message');
    if (activeFilter === 'system') return notifications.filter(n => ['verification', 'payout', 'review'].includes(n.type));
    return notifications;
  };

  const handleNotificationPress = (notification: any) => {
    // Navigate based on notification type
    if (notification.projectId) {
      router.push(`/contractor/gc-project-detail?id=${notification.projectId}`);
    } else if (notification.type === 'project_request') {
      router.push(`/contractor/gc-request-detail?id=${notification.projectId}`);
    }
  };

  const filteredNotifications = getFilteredNotifications();

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
        <View className="flex-1">
          <Text className="text-white text-xl" style={{ fontFamily: 'Poppins_700Bold' }}>
            Notifications
          </Text>
          {unreadCount > 0 && (
            <Text className="text-gray-400 text-xs mt-1" style={{ fontFamily: 'Poppins_400Regular' }}>
              {unreadCount} unread
            </Text>
          )}
        </View>
        {unreadCount > 0 && (
          <TouchableOpacity className="bg-blue-600 rounded-full px-4 py-2">
            <Text className="text-white text-xs" style={{ fontFamily: 'Poppins_600SemiBold' }}>
              Mark all read
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Filter Tabs */}
      <View className="px-6 mb-4">
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View className="flex-row">
            {notificationTypes.map((type) => (
              <TouchableOpacity
                key={type.key}
                onPress={() => setActiveFilter(type.key)}
                className={`mr-2 px-4 py-2 rounded-full ${
                  activeFilter === type.key ? 'bg-blue-600' : 'bg-[#1E3A5F]'
                }`}
              >
                <Text
                  className={`text-sm ${
                    activeFilter === type.key ? 'text-white' : 'text-gray-400'
                  }`}
                  style={{ fontFamily: 'Poppins_600SemiBold' }}
                >
                  {type.label} ({type.count})
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </View>

      {/* Notifications List */}
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="px-6 pb-6">
          {filteredNotifications.length === 0 ? (
            <View className="items-center py-20">
              <Bell size={64} color="#6B7280" strokeWidth={1.5} />
              <Text className="text-gray-400 text-lg mt-4" style={{ fontFamily: 'Poppins_600SemiBold' }}>
                No Notifications
              </Text>
              <Text className="text-gray-500 text-sm mt-2 text-center" style={{ fontFamily: 'Poppins_400Regular' }}>
                You're all caught up! New notifications will appear here.
              </Text>
            </View>
          ) : (
            filteredNotifications.map((notification) => {
              const IconComponent = notification.icon;
              return (
                <TouchableOpacity
                  key={notification.id}
                  onPress={() => handleNotificationPress(notification)}
                  className={`bg-[#1E3A5F] rounded-2xl p-4 mb-3 border ${
                    notification.read ? 'border-blue-900' : 'border-blue-600'
                  }`}
                >
                  <View className="flex-row">
                    <View
                      className={`w-12 h-12 rounded-full items-center justify-center ${
                        notification.read ? 'bg-blue-900/30' : 'bg-blue-600/20'
                      }`}
                    >
                      <IconComponent size={24} color={notification.color} strokeWidth={2} />
                    </View>
                    <View className="flex-1 ml-3">
                      <View className="flex-row items-start justify-between mb-1">
                        <Text
                          className={`text-base flex-1 ${
                            notification.read ? 'text-gray-400' : 'text-white'
                          }`}
                          style={{ fontFamily: 'Poppins_600SemiBold' }}
                        >
                          {notification.title}
                        </Text>
                        {!notification.read && (
                          <View className="w-2 h-2 bg-blue-600 rounded-full ml-2" />
                        )}
                      </View>
                      <Text
                        className="text-gray-500 text-sm mb-2"
                        style={{ fontFamily: 'Poppins_400Regular' }}
                      >
                        {notification.message}
                      </Text>
                      <View className="flex-row items-center justify-between">
                        <Text
                          className="text-gray-600 text-xs"
                          style={{ fontFamily: 'Poppins_400Regular' }}
                        >
                          {notification.time}
                        </Text>
                        {notification.amount && (
                          <View className="bg-green-600/20 rounded-full px-2 py-1">
                            <Text
                              className="text-green-400 text-xs"
                              style={{ fontFamily: 'Poppins_600SemiBold' }}
                            >
                              ${notification.amount.toLocaleString()}
                            </Text>
                          </View>
                        )}
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })
          )}
        </View>
      </ScrollView>
    </View>
  );
}

