import React from "react";
import { View, Text } from "react-native";

// Stub component - Contractor screens are now in mobile-contractor app
const ContractorChatScreen = () => {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
      <Text style={{ fontSize: 16, textAlign: 'center' }}>
        Contractor Chat is now in the mobile-contractor app.
      </Text>
    </View>
  );
};

export default function ContractorChatStoryboard() {
  return <ContractorChatScreen />;
}
