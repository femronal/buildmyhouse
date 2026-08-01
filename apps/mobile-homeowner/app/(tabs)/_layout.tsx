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
  const isCompact = width <= 390;
  const isDesktopTab = width >= 768;

  const renderIcon = (Icon: any) =>
    function TabIcon({ color, focused }: { color: string; focused: boolean }) {
      return (
        <View
          className={`rounded-xl items-center justify-center ${focused ? 'bg-black' : 'bg-transparent'}`}
          style={{
            width: isDesktopTab ? 32 : undefined,
            height: isDesktopTab ? 32 : undefined,
            paddingVertical: isDesktopTab ? 0 : 6,
            paddingHorizontal: isDesktopTab ? 0 : 8,
          }}
        >
          <Icon
            size={isCompact ? 22 : 24}
            color={focused ? '#FFFFFF' : color}
            weight={focused ? 'fill' : 'regular'}
          />
        </View>
      );
    };

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarLabelPosition: isDesktopTab ? 'beside-icon' : 'below-icon',
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
          paddingHorizontal: isCompact ? 6 : 10,
          ...(Platform.OS === 'web' && isDesktopTab
            ? ({
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-around',
              } as any)
            : null),
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
        /** Space between icon row and label — desktop uses beside-icon so no gap needed */
        tabBarIconStyle: {
          marginBottom: isDesktopTab ? 0 : isCompact ? 6 : 8,
        },
        tabBarLabelStyle: {
          fontFamily: 'Poppins_600SemiBold',
          fontSize: isCompact ? 11 : 13,
          marginTop: 0,
          marginLeft: isDesktopTab ? 2 : 0,
          fontWeight: '600',
          lineHeight: isDesktopTab ? 20 : isCompact ? 14 : 16,
          ...(isDesktopTab ? { alignSelf: 'center' as const } : null),
        },
        tabBarItemStyle: {
          flexDirection: isDesktopTab ? 'row' : 'column',
          alignItems: 'center',
          justifyContent: 'center',
          paddingTop: isCompact ? 6 : 8,
          paddingBottom: isCompact ? 4 : 6,
          ...(isDesktopTab ? { gap: 6 } : null),
        },
      }}
    >
      <Tabs.Screen name="home" options={{ title: "Home", tabBarIcon: renderIcon(House) }} />
      <Tabs.Screen name="property-projects-nigeria" options={{ title: "Projects", tabBarIcon: renderIcon(Compass) }} />
      <Tabs.Screen name="build-opportunities-nigeria" options={{ title: "Build", tabBarIcon: renderIcon(Hammer) }} />
      <Tabs.Screen name="finance" options={{ title: "Finance", tabBarIcon: renderIcon(Wallet) }} />
    </Tabs>
  );
}
