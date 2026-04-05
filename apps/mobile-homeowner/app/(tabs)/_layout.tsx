import { Tabs } from "expo-router";
import { Home, Compass, Wallet, Building2 } from "lucide-react-native";
import { View, Platform, useWindowDimensions } from "react-native";
import { BlurView } from "expo-blur";
import { useMemo } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { getFloatingTabBarMetrics } from "@/lib/responsive-layout";

export default function TabsLayout() {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const metrics = useMemo(
    () => getFloatingTabBarMetrics(width, insets.bottom),
    [width, insets.bottom],
  );

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          position: 'absolute',
          bottom: metrics.bottomInset,
          left: metrics.sideInset,
          right: metrics.sideInset,
          height: metrics.height,
          backgroundColor: Platform.OS === 'ios' ? 'transparent' : 'rgba(255,255,255,0.85)',
          borderRadius: metrics.borderRadius,
          borderTopWidth: 0,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.15,
          shadowRadius: 12,
          elevation: 8,
          paddingHorizontal: width <= 390 ? 6 : 10,
        },
        tabBarBackground: () => (
          Platform.OS === 'ios' ? (
            <BlurView
              intensity={80}
              tint="light"
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                borderRadius: metrics.borderRadius,
                overflow: 'hidden',
              }}
            />
          ) : null
        ),
        tabBarActiveTintColor: '#000000',
        tabBarInactiveTintColor: '#A3A3A3',
        tabBarLabelStyle: {
          fontFamily: 'Poppins_600SemiBold',
          fontSize: width <= 390 ? 12 : 14,
          marginTop: width <= 390 ? 4 : 6,
          fontWeight: '600',
        },
        tabBarItemStyle: {
          paddingVertical: width <= 390 ? 8 : 10,
        },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: "Home",
          tabBarIcon: ({ color, focused }) => (
            <View className={`p-3 rounded-xl ${focused ? 'bg-black' : 'bg-transparent'}`}>
              <Home size={28} color={focused ? '#FFFFFF' : color} strokeWidth={focused ? 3 : 2.5} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: "Projects",
          tabBarIcon: ({ color, focused }) => (
            <View className={`p-3 rounded-xl ${focused ? 'bg-black' : 'bg-transparent'}`}>
              <Compass size={28} color={focused ? '#FFFFFF' : color} strokeWidth={focused ? 3 : 2.5} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="rent"
        options={{
          title: "Build",
          tabBarIcon: ({ color, focused }) => (
            <View className={`p-3 rounded-xl ${focused ? 'bg-black' : 'bg-transparent'}`}>
              <Building2 size={28} color={focused ? '#FFFFFF' : color} strokeWidth={focused ? 3 : 2.5} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="finance"
        options={{
          title: "Finance",
          tabBarIcon: ({ color, focused }) => (
            <View className={`p-3 rounded-xl ${focused ? 'bg-black' : 'bg-transparent'}`}>
              <Wallet size={28} color={focused ? '#FFFFFF' : color} strokeWidth={focused ? 3 : 2.5} />
            </View>
          ),
        }}
      />
    </Tabs>
  );
}
