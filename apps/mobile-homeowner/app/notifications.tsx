import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { ArrowLeft, Package, MessageCircle, Home, AlertCircle, CheckCircle, Clock } from "lucide-react-native";

const notifications = [
  {
    id: 1,
    type: "delivery",
    title: "Materials Delivered",
    message: "Cement and steel rods have been delivered to your site for the Foundation stage.",
    time: "2 hours ago",
    read: false,
    icon: Package,
  },
  {
    id: 2,
    type: "message",
    title: "New Message from GC",
    message: "John Smith sent you a message about the foundation inspection.",
    time: "5 hours ago",
    read: false,
    icon: MessageCircle,
  },
  {
    id: 3,
    type: "alert",
    title: "Weather Advisory",
    message: "Heavy rain expected tomorrow. Foundation work may be delayed by 1 day.",
    time: "1 day ago",
    read: true,
    icon: AlertCircle,
  },
  {
    id: 4,
    type: "recommendation",
    title: "New Home Design for You",
    message: "Based on your preferences, check out the 'Coastal Modern' design - $295,000",
    time: "2 days ago",
    read: true,
    icon: Home,
  },
  {
    id: 5,
    type: "complete",
    title: "Stage Completed",
    message: "Site Preparation has been marked as complete. Ready for Foundation stage.",
    time: "3 days ago",
    read: true,
    icon: CheckCircle,
  },
  {
    id: 6,
    type: "payment",
    title: "Payment Reminder",
    message: "Foundation stage payment of $28,500 is due in 3 days.",
    time: "4 days ago",
    read: true,
    icon: Clock,
  },
];

export default function NotificationsScreen() {
  const router = useRouter();

  return (
    <View className="flex-1 bg-white">
      {/* Header */}
      <View className="pt-16 px-6 pb-4 flex-row items-center justify-between">
        <View className="flex-row items-center">
          <TouchableOpacity onPress={() => router.canGoBack() ? router.back() : router.push('/(tabs)/home')} className="mr-4">
            <ArrowLeft size={28} color="#000000" strokeWidth={2} />
          </TouchableOpacity>
          <Text 
            className="text-2xl text-black"
            style={{ fontFamily: 'Poppins_700Bold' }}
          >
            Notifications
          </Text>
        </View>
        <TouchableOpacity>
          <Text 
            className="text-black"
            style={{ fontFamily: 'Poppins_600SemiBold' }}
          >
            Mark all read
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView className="flex-1 px-6">
        {/* Unread Section */}
        <Text 
          className="text-lg text-black mb-4"
          style={{ fontFamily: 'Poppins_700Bold' }}
        >
          New
        </Text>
        {notifications.filter(n => !n.read).map((notification) => (
          <TouchableOpacity
            key={notification.id}
            className="bg-gray-50 rounded-2xl p-4 mb-3 flex-row border border-gray-200"
          >
            <View className="w-12 h-12 bg-black rounded-full items-center justify-center">
              <notification.icon size={24} color="#FFFFFF" strokeWidth={2} />
            </View>
            <View className="flex-1 ml-4">
              <Text 
                className="text-black text-base mb-1"
                style={{ fontFamily: 'Poppins_600SemiBold' }}
              >
                {notification.title}
              </Text>
              <Text 
                className="text-gray-600 text-sm mb-2"
                style={{ fontFamily: 'Poppins_400Regular' }}
                numberOfLines={2}
              >
                {notification.message}
              </Text>
              <Text 
                className="text-gray-400 text-xs"
                style={{ fontFamily: 'Poppins_400Regular' }}
              >
                {notification.time}
              </Text>
            </View>
            <View className="w-3 h-3 bg-black rounded-full" />
          </TouchableOpacity>
        ))}

        {/* Read Section */}
        <Text 
          className="text-lg text-black mb-4 mt-6"
          style={{ fontFamily: 'Poppins_700Bold' }}
        >
          Earlier
        </Text>
        {notifications.filter(n => n.read).map((notification) => (
          <TouchableOpacity
            key={notification.id}
            className="bg-white rounded-2xl p-4 mb-3 flex-row border border-gray-200"
          >
            <View className="w-12 h-12 bg-gray-100 rounded-full items-center justify-center">
              <notification.icon size={24} color="#737373" strokeWidth={2} />
            </View>
            <View className="flex-1 ml-4">
              <Text 
                className="text-gray-700 text-base mb-1"
                style={{ fontFamily: 'Poppins_500Medium' }}
              >
                {notification.title}
              </Text>
              <Text 
                className="text-gray-500 text-sm mb-2"
                style={{ fontFamily: 'Poppins_400Regular' }}
                numberOfLines={2}
              >
                {notification.message}
              </Text>
              <Text 
                className="text-gray-400 text-xs"
                style={{ fontFamily: 'Poppins_400Regular' }}
              >
                {notification.time}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}
