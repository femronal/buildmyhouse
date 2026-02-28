import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import {
  ArrowLeft,
  Package,
  MessageCircle,
  Home,
  AlertCircle,
  CheckCircle,
  Clock,
  Banknote,
  FileWarning,
  Building2,
} from "lucide-react-native";
import { formatDistanceToNow } from "date-fns";
import {
  useNotifications,
  useMarkNotificationRead,
  useMarkAllNotificationsRead,
  type NotificationItem,
} from "@/hooks/useNotifications";

function getNotificationIcon(item: NotificationItem) {
  const t = item.type?.toLowerCase() ?? "";
  if (t.includes("message") || t.includes("chat")) return MessageCircle;
  if (t.includes("payment") || t.includes("manual")) return Banknote;
  if (t.includes("stage") || t.includes("complete")) return CheckCircle;
  if (t.includes("dispute")) return FileWarning;
  if (t.includes("project") || t.includes("delivery")) return Package;
  if (t.includes("design") || t.includes("recommendation")) return Home;
  if (t.includes("alert") || t.includes("advisory")) return AlertCircle;
  if (t.includes("house_viewing") || t.includes("land_viewing") || t.includes("rental_viewing")) return CheckCircle;
  return Clock;
}

function getNotificationLink(item: NotificationItem): string | null {
  const data = item.data as Record<string, unknown> | undefined;
  if (!data) return null;
  const projectId = data.projectId as string | undefined;
  const stageId = data.stageId as string | undefined;
  const outcomeStatus = data.outcomeStatus as string | undefined;

  // Project-related: dashboard, stage detail, or billing
  if (projectId) {
    if (
      stageId &&
      (item.type?.includes("dispute") ||
        data.disputeId ||
        item.type?.includes("stage_material") ||
        item.type?.includes("stage_team") ||
        item.type?.includes("stage_media") ||
        item.type?.includes("stage_document") ||
        item.type === "stage_update")
    ) {
      return `/stage-detail?stageId=${stageId}&projectId=${projectId}`;
    }
    // Payment-related notifications → Finance > Payments
    if (
      item.type === "payment_success" ||
      item.type === "payment_failed" ||
      item.type === "manual_payment_confirmed"
    ) {
      return "/(tabs)/finance?tab=payments";
    }
    return `/dashboard?projectId=${projectId}`;
  }

  // Property viewing outcomes → Finance with relevant tab
  if (item.type === "house_viewing_outcome") {
    return outcomeStatus === "purchased"
      ? "/(tabs)/finance?tab=homePurchases"
      : "/(tabs)/explore";
  }
  if (item.type === "land_viewing_outcome") {
    return outcomeStatus === "purchased"
      ? "/(tabs)/finance?tab=landPurchases"
      : "/(tabs)/explore";
  }
  if (item.type === "rental_viewing_outcome") {
    return outcomeStatus === "purchased"
      ? "/(tabs)/finance?tab=rentals"
      : "/(tabs)/rent";
  }

  // Viewing requests (not outcome) → explore or rent
  if (data.houseForSaleId && item.type === "house_viewing_request") {
    return "/(tabs)/explore";
  }
  if (data.landForSaleId && item.type === "land_viewing_request") {
    return "/(tabs)/explore";
  }
  return null;
}

export default function NotificationsScreen() {
  const router = useRouter();
  const { data, isLoading, error } = useNotifications();
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();

  const items: NotificationItem[] = data?.items ?? [];
  const unreadCount = data?.unreadCount ?? 0;
  const unread = items.filter((n) => !n.isRead);
  const read = items.filter((n) => n.isRead);

  const handleItemPress = (item: NotificationItem) => {
    if (!item.isRead) {
      markRead.mutate(item.id);
    }
    const href = getNotificationLink(item);
    if (href) {
      router.push(href as any);
    }
  };

  const handleMarkAllRead = () => {
    if (unreadCount > 0) {
      markAllRead.mutate();
    }
  };

  if (isLoading) {
    return (
      <View className="flex-1 bg-white items-center justify-center">
        <ActivityIndicator size="large" color="#000000" />
      </View>
    );
  }

  if (error) {
    return (
      <View className="flex-1 bg-white px-6 pt-16">
        <TouchableOpacity
          onPress={() => (router.canGoBack() ? router.back() : router.push("/(tabs)/home"))}
          className="mb-6"
        >
          <ArrowLeft size={28} color="#000000" strokeWidth={2} />
        </TouchableOpacity>
        <Text className="text-gray-600" style={{ fontFamily: "Poppins_400Regular" }}>
          Unable to load notifications. Please try again.
        </Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-white">
      <View className="pt-16 px-6 pb-4 flex-row items-center justify-between">
        <View className="flex-row items-center">
          <TouchableOpacity
            onPress={() => (router.canGoBack() ? router.back() : router.push("/(tabs)/home"))}
            className="mr-4"
          >
            <ArrowLeft size={28} color="#000000" strokeWidth={2} />
          </TouchableOpacity>
          <Text className="text-2xl text-black" style={{ fontFamily: "Poppins_700Bold" }}>
            Notifications
          </Text>
        </View>
        <TouchableOpacity
          onPress={handleMarkAllRead}
          disabled={unreadCount === 0 || markAllRead.isPending}
        >
          <Text
            className={`${unreadCount === 0 ? "text-gray-400" : "text-black"}`}
            style={{ fontFamily: "Poppins_600SemiBold" }}
          >
            Mark all read
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView className="flex-1 px-6" contentContainerStyle={{ paddingBottom: 40 }}>
        {items.length === 0 ? (
          <View className="py-16 items-center">
            <Text
              className="text-gray-500 text-center"
              style={{ fontFamily: "Poppins_400Regular" }}
            >
              No notifications yet
            </Text>
          </View>
        ) : (
          <>
            {unread.length > 0 && (
              <>
                <Text
                  className="text-lg text-black mb-4"
                  style={{ fontFamily: "Poppins_700Bold" }}
                >
                  New
                </Text>
                {unread.map((item) => {
                  const Icon = getNotificationIcon(item);
                  return (
                    <TouchableOpacity
                      key={item.id}
                      onPress={() => handleItemPress(item)}
                      className="bg-gray-50 rounded-2xl p-4 mb-3 flex-row border border-gray-200"
                    >
                      <View className="w-12 h-12 bg-black rounded-full items-center justify-center">
                        <Icon size={24} color="#FFFFFF" strokeWidth={2} />
                      </View>
                      <View className="flex-1 ml-4">
                        <Text
                          className="text-black text-base mb-1"
                          style={{ fontFamily: "Poppins_600SemiBold" }}
                        >
                          {item.title}
                        </Text>
                        <Text
                          className="text-gray-600 text-sm mb-2"
                          style={{ fontFamily: "Poppins_400Regular" }}
                          numberOfLines={2}
                        >
                          {item.message}
                        </Text>
                        <Text
                          className="text-gray-400 text-xs"
                          style={{ fontFamily: "Poppins_400Regular" }}
                        >
                          {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}
                        </Text>
                      </View>
                      <View className="w-3 h-3 bg-black rounded-full self-center" />
                    </TouchableOpacity>
                  );
                })}
              </>
            )}

            {read.length > 0 && (
              <>
                <Text
                  className="text-lg text-black mb-4 mt-6"
                  style={{ fontFamily: "Poppins_700Bold" }}
                >
                  Earlier
                </Text>
                {read.map((item) => {
                  const Icon = getNotificationIcon(item);
                  return (
                    <TouchableOpacity
                      key={item.id}
                      onPress={() => handleItemPress(item)}
                      className="bg-white rounded-2xl p-4 mb-3 flex-row border border-gray-200"
                    >
                      <View className="w-12 h-12 bg-gray-100 rounded-full items-center justify-center">
                        <Icon size={24} color="#737373" strokeWidth={2} />
                      </View>
                      <View className="flex-1 ml-4">
                        <Text
                          className="text-gray-700 text-base mb-1"
                          style={{ fontFamily: "Poppins_500Medium" }}
                        >
                          {item.title}
                        </Text>
                        <Text
                          className="text-gray-500 text-sm mb-2"
                          style={{ fontFamily: "Poppins_400Regular" }}
                          numberOfLines={2}
                        >
                          {item.message}
                        </Text>
                        <Text
                          className="text-gray-400 text-xs"
                          style={{ fontFamily: "Poppins_400Regular" }}
                        >
                          {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}
