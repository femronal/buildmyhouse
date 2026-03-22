import { useEffect, useState } from "react";
import { ActivityIndicator, Text, TouchableOpacity, View } from "react-native";
import { useRouter } from "expo-router";
import { exchangeGoogleAuthCode, storeAuthToken } from "@/lib/auth";
import { useQueryClient } from "@tanstack/react-query";

const ALLOWED_ROLES = ["general_contractor", "admin"];

export default function GoogleCallbackScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
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

        if (!ALLOWED_ROLES.includes(result.user.role)) {
          throw new Error(
            `This app is for General Contractors only. Your account role: ${result.user.role || "unknown"}.`,
          );
        }

        await storeAuthToken(result.token);
        queryClient.setQueryData(["current-user"], result.user);
        await queryClient.invalidateQueries({ queryKey: ["current-user"] });
        router.replace("/contractor/gc-dashboard");
      } catch (error: any) {
        setMessage(error?.message || "Login failed. Please try again.");
      }
    };

    completeGoogleLogin();
  }, [router, queryClient]);

  return (
    <View className="flex-1 bg-[#0A1628] items-center justify-center px-8">
      {message === "Signing you in..." ? (
        <>
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text className="mt-4 text-gray-300">Completing Google sign-in...</Text>
        </>
      ) : (
        <>
          <Text className="text-center text-red-400 mb-4">{message}</Text>
          <TouchableOpacity
            className="bg-blue-600 rounded-xl px-5 py-3"
            onPress={() => router.replace("/login")}
          >
            <Text className="text-white">Back to Login</Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );
}

