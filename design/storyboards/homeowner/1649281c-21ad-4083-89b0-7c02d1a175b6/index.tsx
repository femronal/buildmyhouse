import React from "react";
import { View, Text } from "react-native";

// Stub component - Contractor screens are now in mobile-contractor app
const GCDashboardScreen = () => {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
      <Text style={{ fontSize: 16, textAlign: 'center' }}>
        GC Dashboard is now in the mobile-contractor app.
      </Text>
    </View>
  );
};

export default function GCDashboardStoryboard() {
  return <GCDashboardScreen />;
}
