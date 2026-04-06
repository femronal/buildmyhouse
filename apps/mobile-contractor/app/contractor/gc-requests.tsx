import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { ArrowLeft, ChevronRight, FileText, MapPin, Calendar } from "lucide-react-native";
import { usePendingRequests } from "../../hooks/useGC";
import { useResponsivePadding } from "@/lib/responsive-layout";

function formatDate(dateString?: string) {
  if (!dateString) return "—";
  const d = new Date(dateString);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString();
}

export default function GCRequestsScreen() {
  const router = useRouter();
  const { data: pendingRequests = [], isLoading, refetch } = usePendingRequests();
  const { horizontalPad, headerPaddingTop, scrollBottomPadding } =
    useResponsivePadding("stack");

  return (
    <View className="flex-1 bg-[#0A1628]">
      {/* Header */}
      <View
        className="pb-4 border-b border-blue-900 flex-row items-center gap-2"
        style={{ paddingTop: headerPaddingTop, paddingHorizontal: horizontalPad }}
      >
        <TouchableOpacity
          onPress={() => (router.canGoBack() ? router.back() : router.replace("/contractor/gc-dashboard"))}
          className="w-10 h-10 bg-[#1E3A5F] rounded-full items-center justify-center mr-4"
        >
          <ArrowLeft size={22} color="#FFFFFF" strokeWidth={2} />
        </TouchableOpacity>
        <Text className="text-white text-lg flex-1 min-w-0" style={{ fontFamily: "Poppins_700Bold" }} numberOfLines={1}>
          Requests
        </Text>
        <TouchableOpacity
          onPress={() => refetch()}
          className="bg-blue-600/20 border border-blue-600/40 rounded-full px-3 py-2 flex-shrink-0"
        >
          <Text className="text-blue-300 text-sm" style={{ fontFamily: "Poppins_600SemiBold" }}>
            Refresh
          </Text>
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text className="text-gray-400 mt-4" style={{ fontFamily: "Poppins_400Regular" }}>
            Loading requests…
          </Text>
        </View>
      ) : (
        <ScrollView
          className="flex-1"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            paddingBottom: scrollBottomPadding,
            paddingHorizontal: horizontalPad,
            paddingTop: 24,
          }}
        >
          <View>
            <Text className="text-gray-400 text-sm mb-3" style={{ fontFamily: "Poppins_600SemiBold" }}>
              Pending Requests ({pendingRequests.length})
            </Text>

            {pendingRequests.length === 0 ? (
              <View className="bg-[#1E3A5F] rounded-2xl p-6 border border-blue-900 items-center">
                <Text className="text-white text-lg" style={{ fontFamily: "Poppins_700Bold" }}>
                  No pending requests
                </Text>
                <Text className="text-gray-400 text-sm mt-2 text-center" style={{ fontFamily: "Poppins_400Regular" }}>
                  When a homeowner sends a project request, it will show up here.
                </Text>
              </View>
            ) : (
              pendingRequests.map((req: any) => (
                <TouchableOpacity
                  key={req.id}
                  onPress={() => router.push(`/contractor/gc-request-detail?id=${req.id}`)}
                  className="bg-[#1E3A5F] rounded-2xl p-5 mb-4 border border-blue-900"
                  activeOpacity={0.8}
                >
                  <View className="flex-row items-start justify-between">
                    <View className="flex-1 pr-3">
                      <Text className="text-white text-lg" style={{ fontFamily: "Poppins_700Bold" }}>
                        {req.project?.name || "Project Request"}
                      </Text>
                      <View className="flex-row items-center mt-2">
                        <MapPin size={14} color="#9CA3AF" strokeWidth={2} />
                        <Text
                          className="text-gray-400 text-sm ml-2 flex-1"
                          style={{ fontFamily: "Poppins_400Regular" }}
                          numberOfLines={1}
                        >
                          {req.project?.address || "—"}
                        </Text>
                      </View>
                      <View className="flex-row items-center mt-2">
                        <Calendar size={14} color="#9CA3AF" strokeWidth={2} />
                        <Text className="text-gray-400 text-sm ml-2" style={{ fontFamily: "Poppins_400Regular" }}>
                          Sent: {formatDate(req.sentAt)}
                        </Text>
                      </View>
                      <View className="flex-row items-center mt-2">
                        <Text className="text-gray-400 text-sm" style={{ fontFamily: "Poppins_700Bold" }}>₦</Text>
                        <Text className="text-gray-400 text-sm ml-2" style={{ fontFamily: "Poppins_400Regular" }}>
                          Budget: {typeof req.estimatedBudget === "number" ? `₦${req.estimatedBudget.toLocaleString()}` : "—"}
                        </Text>
                      </View>
                      {req.project?.planPdfUrl ? (
                        <View className="flex-row items-center mt-2">
                          <FileText size={14} color="#3B82F6" strokeWidth={2} />
                          <Text className="text-blue-300 text-sm ml-2" style={{ fontFamily: "Poppins_600SemiBold" }}>
                            Plan attached
                          </Text>
                        </View>
                      ) : null}
                    </View>
                    <ChevronRight size={22} color="#6B7280" strokeWidth={2} />
                  </View>
                </TouchableOpacity>
              ))
            )}
          </View>
        </ScrollView>
      )}
    </View>
  );
}

