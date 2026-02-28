import { Tabs } from "expo-router";
import { Home, Compass, Wallet, Building2 } from "lucide-react-native";
import { View, Text, Platform } from "react-native";
import { BlurView } from "expo-blur";

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          position: 'absolute',
          bottom: 20,
          left: 20,
          right: 20,
          height: 80,
          backgroundColor: Platform.OS === 'ios' ? 'transparent' : 'rgba(255,255,255,0.85)',
          borderRadius: 35,
          borderTopWidth: 0,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.15,
          shadowRadius: 12,
          elevation: 8,
          paddingHorizontal: 10,
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
                borderRadius: 35,
                overflow: 'hidden',
              }}
            />
          ) : null
        ),
        tabBarActiveTintColor: '#000000',
        tabBarInactiveTintColor: '#A3A3A3',
        tabBarLabelStyle: {
          fontFamily: 'Poppins_600SemiBold',
          fontSize: 14,
          marginTop: 6,
          fontWeight: '600',
        },
        tabBarItemStyle: {
          paddingVertical: 10,
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
          title: "Explore",
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
          title: "Rent",
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
