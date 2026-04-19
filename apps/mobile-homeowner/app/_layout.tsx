import {
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { useFonts } from "expo-font";
import { Stack, usePathname } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { Platform, Text, TextInput } from "react-native";
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
import { usePushTokenRegistration } from '@/hooks/usePushTokenRegistration';
import NotificationListener from '@/components/NotificationListener';
import { getDefaultSeoForPath, useWebSeo } from '@/lib/seo';
import {
  initialWindowMetrics,
  SafeAreaProvider,
} from 'react-native-safe-area-context';
import type { Metrics } from 'react-native-safe-area-context';

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();
const STRIPE_PUBLISHABLE_KEY = process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY;

/**
 * Web: `initialWindowMetrics` is null, so SafeAreaProvider falls back to `Dimensions` for the first
 * frame — Node/prerender often disagrees with the real viewport → React hydration #418. Pin a stable
 * initial frame; NativeSafeAreaProvider.web’s effect then applies real insets after hydration.
 */
const WEB_SAFE_AREA_INITIAL: Metrics = {
  frame: { x: 0, y: 0, width: 393, height: 852 },
  insets: { top: 0, left: 0, right: 0, bottom: 0 },
};

export default function RootLayout() {
  const pathname = usePathname();
  usePushTokenRegistration('homeowner');

  const [loaded] = useFonts({
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
    Poppins_700Bold,
    Poppins_800ExtraBold,
    JetBrainsMono_500Medium,
  });

  useEffect(() => {
    if (Platform.OS === 'web') {
      void SplashScreen.hideAsync();
    }
  }, []);

  useEffect(() => {
    if (loaded) {
      Text.defaultProps = Text.defaultProps || {};
      Text.defaultProps.style = [{ fontFamily: 'Poppins_400Regular' }, Text.defaultProps.style];

      TextInput.defaultProps = TextInput.defaultProps || {};
      TextInput.defaultProps.style = [{ fontFamily: 'Poppins_400Regular' }, TextInput.defaultProps.style];
      if (Platform.OS !== 'web') {
        void SplashScreen.hideAsync();
      }
    }
  }, [loaded]);

  /**
   * On web, `useFonts` often flips to `loaded` after the first paint, while static export / SSR already
   * emitted the real route tree. Returning `null` until fonts load makes the client’s first render differ
   * from that HTML and triggers hydration error #418. Native still waits on the splash gate.
   */
  const blockRenderUntilFonts = Platform.OS !== 'web';

  const defaultSeo = getDefaultSeoForPath(pathname);
  useWebSeo({
    ...defaultSeo,
    gscVerificationToken: process.env.EXPO_PUBLIC_GSC_VERIFICATION,
    jsonLd:
      Platform.OS === 'web'
        ? {
            '@context': 'https://schema.org',
            '@type': 'Organization',
            name: 'BuildMyHouse',
            url: process.env.EXPO_PUBLIC_WEB_URL || 'https://buildmyhouse.app',
            logo: `${(process.env.EXPO_PUBLIC_WEB_URL || 'https://buildmyhouse.app').replace(/\/+$/, '')}/assets/images/icon.png`,
            sameAs: ['https://buildmyhouse.app'],
          }
        : undefined,
  });

  if (!loaded && blockRenderUntilFonts) {
    return null;
  }

  const safeAreaInitialMetrics: Metrics | null | undefined =
    Platform.OS === 'web' ? WEB_SAFE_AREA_INITIAL : initialWindowMetrics;

  const app = (
    <SafeAreaProvider initialMetrics={safeAreaInitialMetrics ?? undefined}>
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
          <Stack.Screen name="articles/index" options={{ headerShown: false }} />
          <Stack.Screen name="articles/[slug]" options={{ headerShown: false }} />
          <Stack.Screen name="timeline" options={{ headerShown: false }} />
          <Stack.Screen name="stage-detail" options={{ headerShown: false }} />
          <Stack.Screen name="construction/nigeria" options={{ headerShown: false }} />
          <Stack.Screen name="construction/lagos" options={{ headerShown: false }} />
          <Stack.Screen name="construction/abuja" options={{ headerShown: false }} />
          <Stack.Screen name="construction/port-harcourt" options={{ headerShown: false }} />
          <Stack.Screen name="renovation/nigeria" options={{ headerShown: false }} />
          <Stack.Screen name="interior-design/nigeria" options={{ headerShown: false }} />
          <Stack.Screen name="homes-for-rent/nigeria" options={{ headerShown: false }} />
          <Stack.Screen name="houses-for-sale/nigeria" options={{ headerShown: false }} />
          <Stack.Screen name="land-for-sale/nigeria" options={{ headerShown: false }} />
          <Stack.Screen name="diaspora/build-in-nigeria-from-abroad" options={{ headerShown: false }} />
          <Stack.Screen name="diaspora/renovate-in-nigeria-from-abroad" options={{ headerShown: false }} />
          <Stack.Screen name="diaspora/build-in-nigeria-from-uk" options={{ headerShown: false }} />
          <Stack.Screen name="diaspora/build-in-nigeria-from-usa-canada" options={{ headerShown: false }} />
          <Stack.Screen name="diaspora/build-in-nigeria-from-uae" options={{ headerShown: false }} />
          <Stack.Screen name="diaspora/uk/build-in-nigeria" options={{ headerShown: false }} />
          <Stack.Screen name="diaspora/uk/renovate-parents-house" options={{ headerShown: false }} />
          <Stack.Screen name="guides/lagos-building-permits-and-stage-inspections" options={{ headerShown: false }} />
          <Stack.Screen name="guides/contractor-vetting-nigeria-diaspora" options={{ headerShown: false }} />
          <Stack.Screen name="downloads/remote-renovation-scope-worksheet" options={{ headerShown: false }} />
          <Stack.Screen name="downloads/lagos-permit-starter-checklist" options={{ headerShown: false }} />
          <Stack.Screen name="tools/milestone-payment-schedule" options={{ headerShown: false }} />
          <Stack.Screen name="tools/renovation-budget-planner" options={{ headerShown: false }} />
          <Stack.Screen name="demo/project-monitoring" options={{ headerShown: false }} />
          <Stack.Screen name="mistakes-nigerians-in-diaspora-make-when-building" options={{ headerShown: false }} />
          <Stack.Screen name="how-to-choose-a-general-contractor-in-nigeria" options={{ headerShown: false }} />
          <Stack.Screen name="land-verification-in-nigeria-guide" options={{ headerShown: false }} />
          <Stack.Screen name="building-permit-in-lagos-nigeria-guide" options={{ headerShown: false }} />
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
    </SafeAreaProvider>
  );

  return (
    <QueryClientProvider client={queryClient}>
      <NotificationListener />
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
