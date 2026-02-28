import { View } from "react-native";
import { useRouter } from "expo-router";
import { Bell } from "lucide-react-native";
import { TouchableOpacity } from "react-native";
import { useUnreadCount } from "@/hooks/useNotifications";
import { useCurrentUser } from "@/hooks/useCurrentUser";

export default function NotificationBell() {
  const router = useRouter();
  const { isSuccess: isAuthenticated } = useCurrentUser();
  const { data } = useUnreadCount(isAuthenticated);

  const unreadCount = data?.unreadCount ?? 0;
  const showBadge = isAuthenticated && unreadCount > 0;

  return (
    <TouchableOpacity
      onPress={() => router.push("/notifications")}
      className="w-12 h-12 bg-gray-100 rounded-full items-center justify-center"
    >
      <Bell size={24} color="#000000" strokeWidth={2.5} />
      {showBadge && (
        <View className="absolute top-1 right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white" />
      )}
    </TouchableOpacity>
  );
}
