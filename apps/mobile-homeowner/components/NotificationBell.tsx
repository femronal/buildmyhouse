import { View , TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { Bell } from "phosphor-react-native";
import { useUnreadCount } from "@/hooks/useNotifications";
import { useCurrentUser } from "@/hooks/useCurrentUser";

type NotificationBellProps = {
  /** White-on-dark variant for dark pages. */
  dark?: boolean;
};

export default function NotificationBell({ dark }: NotificationBellProps) {
  const router = useRouter();
  const { isSuccess: isAuthenticated } = useCurrentUser();
  const { data } = useUnreadCount(isAuthenticated);

  const unreadCount = data?.unreadCount ?? 0;
  const showBadge = isAuthenticated && unreadCount > 0;

  return (
    <TouchableOpacity
      onPress={() => router.push("/notifications")}
      className={`w-10 h-10 rounded-full items-center justify-center ${
        dark ? 'bg-white/10 border border-white/15' : 'bg-gray-100'
      }`}
    >
      <Bell size={20} color={dark ? '#FFFFFF' : '#000000'} weight="regular" />
      {showBadge && (
        <View
          className={`absolute top-1 right-1 w-3 h-3 bg-red-500 rounded-full border-2 ${
            dark ? 'border-black' : 'border-white'
          }`}
        />
      )}
    </TouchableOpacity>
  );
}
