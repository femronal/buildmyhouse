import {
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { Text, TextInput } from "react-native";
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
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { InvestmentProvider } from '../contexts/InvestmentContext';
import { AppAlertProvider } from "../components/AppAlertProvider";
import { usePushTokenRegistration } from '@/hooks/usePushTokenRegistration';
import NotificationListener from '@/components/NotificationListener';

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

// Create a client
const queryClient = new QueryClient();

export default function RootLayout() {
  usePushTokenRegistration('contractor');

  const [loaded] = useFonts({
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
    Poppins_700Bold,
    Poppins_800ExtraBold,
    JetBrainsMono_500Medium,
  });

  useEffect(() => {
    if (loaded) {
      Text.defaultProps = Text.defaultProps || {};
      Text.defaultProps.style = [{ fontFamily: 'Poppins_400Regular' }, Text.defaultProps.style];

      TextInput.defaultProps = TextInput.defaultProps || {};
      TextInput.defaultProps.style = [{ fontFamily: 'Poppins_400Regular' }, TextInput.defaultProps.style];
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return (
    <InvestmentProvider>
      <QueryClientProvider client={queryClient}>
        <NotificationListener />
        <ThemeProvider value={DefaultTheme}>
          <AppAlertProvider>
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen name="index" options={{ headerShown: false }} />
              <Stack.Screen name="login" options={{ headerShown: false }} />
              <Stack.Screen name="contractor" options={{ headerShown: false }} />
              <Stack.Screen name="chat" options={{ headerShown: false }} />
            </Stack>
            <StatusBar style="auto" />
          </AppAlertProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </InvestmentProvider>
  );
}
