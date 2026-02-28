import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import {
  ArrowLeft,
  Bell,
  CheckCircle,
  MessageCircle,
  AlertCircle,
  FileText,
  Clock,
  Building2,
  Award,
} from "lucide-react-native";
import { useState, useMemo } from "react";
import {
  useNotifications,
  useMarkNotificationRead,
  useMarkAllNotificationsRead,
  type NotificationItem,
} from "@/hooks/useNotifications";

function getNotificationIcon(item: NotificationItem) {
  const t = item.type?.toLowerCase() ?? "";
  if (t.includes("message") || t === "new_message") return MessageCircle;
  if (t.includes("payment") || t.includes("manual") || t.includes("payout")) return FileText;
  if (t.includes("stage") || t.includes("complete")) return CheckCircle;
  if (t.includes("dispute")) return AlertCircle;
  if (t.includes("project") || t.includes("request")) return Building2;
  if (t.includes("verification")) return Award;
  if (t.includes("review")) return Award;
  return Clock;
}

function getNotificationLink(item: NotificationItem): string | null {
  const data = item.data as Record<string, unknown> | undefined;
  if (!data) return null;

  const projectId = data.projectId as string | undefined;
  const stageId = data.stageId as string | undefined;
  const disputeId = data.disputeId as string | undefined;
  const conversationId = data.conversationId as string | undefined;
  const requestId = data.requestId as string | undefined;

  // Chat/message → chat list (user finds conversation)
  if (item.type === "new_message" || item.type?.includes("message")) {
    return "/contractor/chat";
  }

  // Dispute → stage detail
  if (disputeId && projectId && stageId) {
    return `/contractor/stage-detail?stageId=${stageId}&projectId=${projectId}`;
  }

  // Project + stage (no dispute) → stage or project detail
  if (projectId && stageId) {
    return `/contractor/stage-detail?stageId=${stageId}&projectId=${projectId}`;
  }

  // Project request (requestId is for gc-request-detail)
  if (requestId) {
    return `/contractor/gc-request-detail?id=${requestId}`;
  }

  // Payment or project → project detail or earnings
  if (projectId) {
    return `/contractor/gc-project-detail?id=${projectId}`;
  }

  return null;
}

function formatTimeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

function categorizeNotification(item: NotificationItem): "payment" | "project" | "messages" | "system" {
  const t = item.type?.toLowerCase() ?? "";
  if (t.includes("payment") || t.includes("manual") || t.includes("payout")) return "payment";
  if (t.includes("message") || t === "new_message") return "messages";
  if (t.includes("dispute") || t.includes("stage") || t.includes("project") || t.includes("complete")) return "project";
  if (t.includes("verification") || t.includes("review")) return "system";
  return "project";
}

export default function GCNotificationsScreen() {
  const router = useRouter();
  const { data, isLoading, error } = useNotifications();
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();

  const [activeFilter, setActiveFilter] = useState<string>("all");

  const items: NotificationItem[] = data?.items ?? [];
  const unreadCount = data?.unreadCount ?? 0;

  const notificationTypes = useMemo(() => {
    const payment = items.filter((n) => categorizeNotification(n) === "payment").length;
    const project = items.filter((n) => categorizeNotification(n) === "project").length;
    const messages = items.filter((n) => categorizeNotification(n) === "messages").length;
    const system = items.filter((n) => categorizeNotification(n) === "system").length;
    return [
      { key: "all", label: "All", count: items.length },
      { key: "payment", label: "Payments", count: payment },
      { key: "project", label: "Projects", count: project },
      { key: "messages", label: "Messages", count: messages },
      { key: "system", label: "System", count: system },
    ];
  }, [items]);

  const filteredNotifications = useMemo(() => {
    if (activeFilter === "all") return items;
    return items.filter((n) => categorizeNotification(n) === activeFilter);
  }, [items, activeFilter]);

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
      <View className="flex-1 bg-[#0A1628] items-center justify-center">
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text className="text-gray-400 mt-4" style={{ fontFamily: "Poppins_400Regular" }}>
          Loading notifications...
        </Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-[#0A1628]">
      {/* Header */}
      <View className="pt-16 px-6 pb-4 flex-row items-center">
        <TouchableOpacity
          onPress={() => (router.canGoBack() ? router.back() : router.push("/contractor/gc-dashboard"))}
          className="w-10 h-10 bg-[#1E3A5F] rounded-full items-center justify-center mr-4"
        >
          <ArrowLeft size={22} color="#FFFFFF" strokeWidth={2} />
        </TouchableOpacity>
        <View className="flex-1">
          <Text className="text-white text-xl" style={{ fontFamily: "Poppins_700Bold" }}>
            Notifications
          </Text>
          {unreadCount > 0 && (
            <Text className="text-gray-400 text-xs mt-1" style={{ fontFamily: "Poppins_400Regular" }}>
              {unreadCount} unread
            </Text>
          )}
        </View>
        {unreadCount > 0 && (
          <TouchableOpacity
            onPress={handleMarkAllRead}
            disabled={markAllRead.isPending}
            className="bg-blue-600 rounded-full px-4 py-2"
          >
            <Text className="text-white text-xs" style={{ fontFamily: "Poppins_600SemiBold" }}>
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
                  activeFilter === type.key ? "bg-blue-600" : "bg-[#1E3A5F]"
                }`}
              >
                <Text
                  className={`text-sm ${activeFilter === type.key ? "text-white" : "text-gray-400"}`}
                  style={{ fontFamily: "Poppins_600SemiBold" }}
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
              <Text className="text-gray-400 text-lg mt-4" style={{ fontFamily: "Poppins_600SemiBold" }}>
                No Notifications
              </Text>
              <Text className="text-gray-500 text-sm mt-2 text-center" style={{ fontFamily: "Poppins_400Regular" }}>
                You're all caught up! New notifications will appear here.
              </Text>
            </View>
          ) : (
            filteredNotifications.map((item) => {
              const IconComponent = getNotificationIcon(item);
              const amount = (item.data as Record<string, unknown>)?.amount as number | undefined;
              return (
                <TouchableOpacity
                  key={item.id}
                  onPress={() => handleItemPress(item)}
                  className={`bg-[#1E3A5F] rounded-2xl p-4 mb-3 border ${
                    item.isRead ? "border-blue-900" : "border-blue-600"
                  }`}
                >
                  <View className="flex-row">
                    <View
                      className={`w-12 h-12 rounded-full items-center justify-center ${
                        item.isRead ? "bg-blue-900/30" : "bg-blue-600/20"
                      }`}
                    >
                      <IconComponent size={24} color="#3B82F6" strokeWidth={2} />
                    </View>
                    <View className="flex-1 ml-3">
                      <View className="flex-row items-start justify-between mb-1">
                        <Text
                          className={`text-base flex-1 ${item.isRead ? "text-gray-400" : "text-white"}`}
                          style={{ fontFamily: "Poppins_600SemiBold" }}
                        >
                          {item.title}
                        </Text>
                        {!item.isRead && (
                          <View className="w-2 h-2 bg-blue-600 rounded-full ml-2" />
                        )}
                      </View>
                      <Text
                        className="text-gray-500 text-sm mb-2"
                        style={{ fontFamily: "Poppins_400Regular" }}
                        numberOfLines={2}
                      >
                        {item.message}
                      </Text>
                      <View className="flex-row items-center justify-between">
                        <Text
                          className="text-gray-600 text-xs"
                          style={{ fontFamily: "Poppins_400Regular" }}
                        >
                          {formatTimeAgo(item.createdAt)}
                        </Text>
                        {amount != null && (
                          <View className="bg-green-600/20 rounded-full px-2 py-1">
                            <Text
                              className="text-green-400 text-xs"
                              style={{ fontFamily: "Poppins_600SemiBold" }}
                            >
                              ₦{Number(amount).toLocaleString()}
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
