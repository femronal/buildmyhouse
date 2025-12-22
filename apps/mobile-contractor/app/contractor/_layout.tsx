import { Stack } from "expo-router";

export default function ContractorLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="onboarding" />
      <Stack.Screen name="verification" />
      <Stack.Screen name="gc-dashboard" />
      <Stack.Screen name="gc-requests" />
      <Stack.Screen name="gc-request-detail" />
      <Stack.Screen name="gc-project-detail" />
      <Stack.Screen name="gc-stage-management" />
      <Stack.Screen name="sub-dashboard" />
      <Stack.Screen name="sub-job-detail" />
      <Stack.Screen name="vendor-dashboard" />
      <Stack.Screen name="vendor-products" />
      <Stack.Screen name="vendor-orders" />
      <Stack.Screen name="chat" />
    </Stack>
  );
}
