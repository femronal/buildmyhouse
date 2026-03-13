/**
 * Expo app configuration.
 * Uses EXPO_PUBLIC_GOOGLE_MAPS_API_KEY for Google Maps - set in .env
 */
module.exports = {
  expo: {
    name: "test-tempo",
    slug: "test-tempo",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/images/icon.png",
    scheme: "buildmyhouse",
    userInterfaceStyle: "automatic",
    newArchEnabled: true,
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.buildmyhouse.app",
      config: {
        googleMapsApiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || "",
      },
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/images/adaptive-icon.png",
        backgroundColor: "#ffffff",
      },
      package: "com.buildmyhouse.app",
      config: {
        googleMaps: {
          apiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || "",
        },
      },
    },
    web: {
      bundler: "metro",
      output: "static",
      favicon: "./assets/images/favicon.png",
    },
    plugins: [
      "expo-router",
      [
        "expo-splash-screen",
        {
          image: "./assets/images/splash-icon.png",
          imageWidth: 200,
          resizeMode: "contain",
          backgroundColor: "#ffffff",
        },
      ],
      "expo-font",
      "expo-web-browser",
      "expo-notifications",
      [
        "@stripe/stripe-react-native",
        {
          merchantIdentifier: "merchant.com.buildmyhouse",
          enableGooglePay: false,
        },
      ],
    ],
    experiments: {
      typedRoutes: true,
    },
  },
};
