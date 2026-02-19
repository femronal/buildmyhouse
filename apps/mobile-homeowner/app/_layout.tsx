import {
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import "react-native-reanimated";
import "../global.css";
import {
  Poppins_400Regular,
  Poppins_500Medium,
  Poppins_600SemiBold,
  Poppins_700Bold,
  Poppins_800ExtraBold,
} from '@expo-google-fonts/poppins';
import {
  JetBrainsMono_500Medium,
} from '@expo-google-fonts/jetbrains-mono';
import { InvestmentProvider } from '@/contexts/InvestmentContext';
import { StripeProvider } from '@/lib/stripe';

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();
const STRIPE_PUBLISHABLE_KEY = process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY;

export default function RootLayout() {
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
    Poppins_700Bold,
    Poppins_800ExtraBold,
    JetBrainsMono_500Medium,
  });

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  const app = (
    <InvestmentProvider>
      <ThemeProvider value={DefaultTheme}>
        <Stack
          screenOptions={{
            headerShown: false,
          }}
        >
          <Stack.Screen name="index" options={{ headerShown: false }} />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="location" options={{ headerShown: false }} />
          <Stack.Screen name="design-library" options={{ headerShown: false }} />
          <Stack.Screen name="upload-plan" options={{ headerShown: false }} />
          <Stack.Screen name="house-summary" options={{ headerShown: false }} />
          <Stack.Screen name="house-detail" options={{ headerShown: false }} />
          <Stack.Screen name="land-detail" options={{ headerShown: false }} />
          <Stack.Screen name="dashboard" options={{ headerShown: false }} />
          <Stack.Screen name="timeline" options={{ headerShown: false }} />
          <Stack.Screen name="stage-detail" options={{ headerShown: false }} />
          <Stack.Screen name="profile" options={{ headerShown: false }} />
          <Stack.Screen name="personal-information" options={{ headerShown: false }} />
          <Stack.Screen name="notification-settings" options={{ headerShown: false }} />
          <Stack.Screen name="billing-payments" options={{ headerShown: false }} />
          <Stack.Screen name="privacy-security" options={{ headerShown: false }} />
          <Stack.Screen name="terms-conditions" options={{ headerShown: false }} />
          <Stack.Screen name="help-support" options={{ headerShown: false }} />
          <Stack.Screen name="app-settings" options={{ headerShown: false }} />
          <Stack.Screen name="notifications" options={{ headerShown: false }} />
          <Stack.Screen name="chat" options={{ headerShown: false }} />
        </Stack>
        <StatusBar style="auto" />
      </ThemeProvider>
    </InvestmentProvider>
  );

  return (
    <QueryClientProvider client={queryClient}>
      {STRIPE_PUBLISHABLE_KEY ? (
        <StripeProvider publishableKey={STRIPE_PUBLISHABLE_KEY} urlScheme="buildmyhouse">
          {app}
        </StripeProvider>
      ) : (
        app
      )}
    </QueryClientProvider>
  );
}
