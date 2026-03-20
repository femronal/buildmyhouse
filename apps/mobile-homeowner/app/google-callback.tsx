import { useEffect, useState } from "react";
import { ActivityIndicator, Text, TouchableOpacity, View } from "react-native";
import { useRouter } from "expo-router";
import { exchangeGoogleAuthCode, storeAuthToken } from "@/lib/auth";

export default function GoogleCallbackScreen() {
  const router = useRouter();
  const [message, setMessage] = useState("Signing you in...");

  useEffect(() => {
    const completeGoogleLogin = async () => {
      try {
        const params = new URLSearchParams(window.location.search);
        const code = params.get("code");
        const oauthError = params.get("error");

        if (oauthError) {
          throw new Error(`Google sign-in failed: ${oauthError}`);
        }
        if (!code) {
          throw new Error("Missing Google auth code.");
        }

        const redirectUri = `${window.location.origin.replace(/\/$/, "")}/google-callback`;
        const result = await exchangeGoogleAuthCode(code, redirectUri);

        if (!result?.token || !result?.user) {
          throw new Error("Login failed. Please try again.");
        }

        if (result.user.role !== "homeowner") {
          throw new Error(
            `This app is for homeowners only. Your account role: ${result.user.role || "unknown"}.`,
          );
        }

        await storeAuthToken(result.token);
        router.replace("/(tabs)/home");
      } catch (error: any) {
        setMessage(error?.message || "Login failed. Please try again.");
      }
    };

    completeGoogleLogin();
  }, [router]);

  return (
    <View className="flex-1 bg-white items-center justify-center px-6">
      {message === "Signing you in..." ? (
        <>
          <ActivityIndicator size="large" color="#000000" />
          <Text className="mt-4 text-gray-700">Completing Google sign-in...</Text>
        </>
      ) : (
        <>
          <Text className="text-center text-red-600 mb-4">{message}</Text>
          <TouchableOpacity
            className="bg-black rounded-xl px-5 py-3"
            onPress={() => router.replace("/login")}
          >
            <Text className="text-white">Back to Login</Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );
}

