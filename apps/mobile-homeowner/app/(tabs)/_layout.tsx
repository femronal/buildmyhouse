import { Tabs } from "expo-router";
import { House, Compass, Hammer, Wallet } from "phosphor-react-native";
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

  const renderIcon = (Icon: any) =>
    ({ color, focused }: { color: string; focused: boolean }) => (
      <View
        className={`rounded-xl items-center justify-center ${focused ? 'bg-black' : 'bg-transparent'}`}
        style={{ paddingVertical: 6, paddingHorizontal: 8 }}
      >
        <Icon
          size={width <= 390 ? 22 : 24}
          color={focused ? '#FFFFFF' : color}
          weight={focused ? 'fill' : 'regular'}
        />
      </View>
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
          backgroundColor: Platform.OS === 'ios' ? 'transparent' : 'rgba(255,255,255,0.78)',
          borderRadius: metrics.borderRadius,
          borderTopWidth: 0,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.3,
          shadowRadius: 16,
          elevation: 10,
          paddingHorizontal: width <= 390 ? 6 : 10,
          ...(Platform.OS === 'web'
            ? ({
                backdropFilter: 'blur(18px) saturate(160%)',
                WebkitBackdropFilter: 'blur(18px) saturate(160%)',
                borderWidth: 1,
                borderColor: 'rgba(255,255,255,0.65)',
                boxShadow:
                  '0 8px 32px rgba(0, 0, 0, 0.35), inset 0 1px 0 rgba(255, 255, 255, 0.8)',
              } as any)
            : null),
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
        tabBarInactiveTintColor: '#737373',
        /** Space between icon row and label — prevents active pill overlapping text */
        tabBarIconStyle: {
          marginBottom: width <= 390 ? 6 : 8,
        },
        tabBarLabelStyle: {
          fontFamily: 'Poppins_600SemiBold',
          fontSize: width <= 390 ? 11 : 13,
          marginTop: 0,
          fontWeight: '600',
          lineHeight: width <= 390 ? 14 : 16,
        },
        tabBarItemStyle: {
          paddingTop: width <= 390 ? 6 : 8,
          paddingBottom: width <= 390 ? 4 : 6,
        },
      }}
    >
      <Tabs.Screen name="home" options={{ title: "Home", tabBarIcon: renderIcon(House) }} />
      <Tabs.Screen name="explore" options={{ title: "Projects", tabBarIcon: renderIcon(Compass) }} />
      <Tabs.Screen name="rent" options={{ title: "Build", tabBarIcon: renderIcon(Hammer) }} />
      <Tabs.Screen name="finance" options={{ title: "Finance", tabBarIcon: renderIcon(Wallet) }} />
    </Tabs>
  );
}
