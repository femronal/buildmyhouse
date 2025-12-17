import { View, Text, TouchableOpacity, Animated } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Clock, CheckCircle, XCircle, FileSearch, ArrowRight } from "lucide-react-native";
import { useState, useEffect, useRef } from "react";

export default function VerificationScreen() {
  const router = useRouter();
  const { type } = useLocalSearchParams<{ type: 'gc' | 'sub' | 'vendor' }>();
  const [status, setStatus] = useState<'pending' | 'approved' | 'rejected'>('pending');
  const pulseAnim = useRef(new Animated.Value(1)).current;

  const accountType = type || 'gc';

  const getDashboardRoute = () => {
    switch (accountType) {
      case 'sub': return '/contractor/sub-dashboard';
      case 'vendor': return '/contractor/vendor-dashboard';
      default: return '/contractor/gc-dashboard';
    }
  };

  useEffect(() => {
    // Pulse animation for pending status
    if (status === 'pending') {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.1, duration: 1000, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
        ])
      ).start();
    }

    // Simulate approval after 3 seconds for demo
    const timer = setTimeout(() => {
      setStatus('approved');
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  const getStatusContent = () => {
    switch (status) {
      case 'pending':
        return {
          icon: <Clock size={48} color="#F59E0B" strokeWidth={2} />,
          title: "Verification Pending",
          description: "Your application is being reviewed by our team. This usually takes 2-3 business days.",
          bgColor: "bg-yellow-900/30",
          borderColor: "border-yellow-700",
          iconBg: "bg-yellow-600",
        };
      case 'approved':
        return {
          icon: <CheckCircle size={48} color="#10B981" strokeWidth={2} />,
          title: "Verification Approved!",
          description: "Congratulations! Your account has been verified. You can now access the contractor portal.",
          bgColor: "bg-green-900/30",
          borderColor: "border-green-700",
          iconBg: "bg-green-600",
        };
      case 'rejected':
        return {
          icon: <XCircle size={48} color="#EF4444" strokeWidth={2} />,
          title: "Verification Rejected",
          description: "Unfortunately, your application was not approved. Please review the feedback and resubmit.",
          bgColor: "bg-red-900/30",
          borderColor: "border-red-700",
          iconBg: "bg-red-600",
        };
    }
  };

  const content = getStatusContent();

  return (
    <View className="flex-1 bg-[#0A1628] px-6 pt-16">
      {/* Status Card */}
      <View className="flex-1 items-center justify-center">
        <Animated.View 
          style={{ transform: [{ scale: status === 'pending' ? pulseAnim : 1 }] }}
          className={`w-28 h-28 ${content.iconBg} rounded-full items-center justify-center mb-8`}
        >
          {content.icon}
        </Animated.View>

        <Text 
          className="text-white text-2xl text-center mb-4"
          style={{ fontFamily: 'Poppins_800ExtraBold' }}
        >
          {content.title}
        </Text>

        <Text 
          className="text-gray-400 text-center text-base leading-6 mb-8 px-4"
          style={{ fontFamily: 'Poppins_400Regular' }}
        >
          {content.description}
        </Text>

        {/* Status Details */}
        <View className={`${content.bgColor} rounded-2xl p-5 w-full border ${content.borderColor}`}>
          <View className="flex-row items-center mb-4">
            <FileSearch size={20} color="#3B82F6" strokeWidth={2} />
            <Text 
              className="text-white ml-3"
              style={{ fontFamily: 'Poppins_600SemiBold' }}
            >
              Application Status
            </Text>
          </View>

          <View className="space-y-3">
            <View className="flex-row justify-between items-center py-2 border-b border-blue-900/50">
              <Text className="text-gray-400 text-sm" style={{ fontFamily: 'Poppins_400Regular' }}>Documents</Text>
              <Text className="text-green-400 text-sm" style={{ fontFamily: 'Poppins_600SemiBold' }}>Received</Text>
            </View>
            <View className="flex-row justify-between items-center py-2 border-b border-blue-900/50">
              <Text className="text-gray-400 text-sm" style={{ fontFamily: 'Poppins_400Regular' }}>Identity Check</Text>
              <Text className={`text-sm ${status === 'pending' ? 'text-yellow-400' : 'text-green-400'}`} style={{ fontFamily: 'Poppins_600SemiBold' }}>
                {status === 'pending' ? 'In Progress' : 'Verified'}
              </Text>
            </View>
            <View className="flex-row justify-between items-center py-2 border-b border-blue-900/50">
              <Text className="text-gray-400 text-sm" style={{ fontFamily: 'Poppins_400Regular' }}>License Verification</Text>
              <Text className={`text-sm ${status === 'pending' ? 'text-yellow-400' : 'text-green-400'}`} style={{ fontFamily: 'Poppins_600SemiBold' }}>
                {status === 'pending' ? 'Pending' : 'Verified'}
              </Text>
            </View>
            <View className="flex-row justify-between items-center py-2">
              <Text className="text-gray-400 text-sm" style={{ fontFamily: 'Poppins_400Regular' }}>Background Check</Text>
              <Text className={`text-sm ${status === 'pending' ? 'text-gray-500' : 'text-green-400'}`} style={{ fontFamily: 'Poppins_600SemiBold' }}>
                {status === 'pending' ? 'Queued' : 'Cleared'}
              </Text>
            </View>
          </View>
        </View>

        {/* Estimated Time */}
        {status === 'pending' && (
          <View className="mt-6 flex-row items-center">
            <Clock size={16} color="#6B7280" strokeWidth={2} />
            <Text 
              className="text-gray-500 ml-2 text-sm"
              style={{ fontFamily: 'Poppins_400Regular' }}
            >
              Estimated completion: 24-48 hours
            </Text>
          </View>
        )}
      </View>

      {/* Bottom Button */}
      <View className="pb-8">
        {status === 'approved' ? (
          <TouchableOpacity
            onPress={() => router.push(getDashboardRoute())}
            className="bg-blue-600 rounded-full py-4 px-8 flex-row items-center justify-center"
          >
            <Text 
              className="text-white text-lg mr-2"
              style={{ fontFamily: 'Poppins_700Bold' }}
            >
              Go to Dashboard
            </Text>
            <ArrowRight size={22} color="#FFFFFF" strokeWidth={2} />
          </TouchableOpacity>
        ) : status === 'rejected' ? (
          <TouchableOpacity
            onPress={() => router.push(`/contractor/onboarding?type=${accountType}`)}
            className="bg-blue-600 rounded-full py-4 px-8"
          >
            <Text 
              className="text-white text-center text-lg"
              style={{ fontFamily: 'Poppins_700Bold' }}
            >
              Resubmit Application
            </Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            onPress={() => router.push('/contractor')}
            className="bg-[#1E3A5F] rounded-full py-4 px-8"
          >
            <Text 
              className="text-white text-center text-lg"
              style={{ fontFamily: 'Poppins_600SemiBold' }}
            >
              Back to Home
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}
