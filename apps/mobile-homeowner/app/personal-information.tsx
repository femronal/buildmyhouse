import { View, Text, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, Alert } from "react-native";
import { useRouter } from "expo-router";
import { ArrowLeft, ShieldCheck, ShieldX } from "lucide-react-native";
import { useEffect, useMemo, useState } from "react";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useUpdateCurrentUser } from "@/hooks/useUpdateCurrentUser";
import { useActiveProjects, usePendingProjects } from "@/hooks";

function Field(props: {
  label: string;
  value: string;
  onChangeText?: (t: string) => void;
  placeholder?: string;
  editable?: boolean;
  helperText?: string;
  keyboardType?: "default" | "email-address" | "phone-pad";
  autoCapitalize?: "none" | "sentences" | "words" | "characters";
}) {
  const editable = props.editable ?? true;
  return (
    <View className="mb-4">
      <Text className="text-sm text-gray-600 mb-2" style={{ fontFamily: "Poppins_500Medium" }}>
        {props.label}
      </Text>
      <TextInput
        value={props.value}
        onChangeText={props.onChangeText}
        placeholder={props.placeholder}
        editable={editable}
        keyboardType={props.keyboardType || "default"}
        autoCapitalize={props.autoCapitalize ?? "sentences"}
        className={`rounded-2xl px-4 py-4 border ${
          editable ? "bg-white border-gray-200 text-gray-900" : "bg-gray-50 border-gray-200 text-gray-600"
        }`}
        style={{ fontFamily: "Poppins_400Regular" }}
      />
      {!!props.helperText && (
        <Text className="text-xs text-gray-400 mt-2" style={{ fontFamily: "Poppins_400Regular" }}>
          {props.helperText}
        </Text>
      )}
    </View>
  );
}

export default function PersonalInformationScreen() {
  const router = useRouter();
  const { data: currentUser, isLoading } = useCurrentUser();
  const { data: activeProjects = [] } = useActiveProjects();
  const { data: pendingProjects = [] } = usePendingProjects();
  const updateMe = useUpdateCurrentUser();

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [country, setCountry] = useState("");

  useEffect(() => {
    if (!currentUser) return;
    setFullName(currentUser.fullName || "");
    setPhone(currentUser.phone || "");
  }, [currentUser]);

  const completedProjects = useMemo(
    () => activeProjects.filter((p: any) => p.status === "completed"),
    [activeProjects],
  );
  const trulyActiveProjects = useMemo(
    () => activeProjects.filter((p: any) => p.status === "active"),
    [activeProjects],
  );

  const primaryBuildAddress = useMemo(() => {
    const candidates = [...trulyActiveProjects, ...pendingProjects, ...completedProjects];
    const firstWithAddress = candidates.find((p: any) => !!p?.address);
    return firstWithAddress?.address || "";
  }, [completedProjects, pendingProjects, trulyActiveProjects]);

  const email = currentUser?.email || "";
  const verified = !!currentUser?.verified;

  const canSave =
    !!currentUser &&
    (fullName.trim() !== (currentUser.fullName || "").trim() || (phone || "").trim() !== (currentUser.phone || "").trim());

  useEffect(() => {
    // Prefill address fields from the most recent project address, if available.
    // This is a "best effort" parse; users can edit the fields.
    if (!primaryBuildAddress) return;
    setAddress(primaryBuildAddress);
    const parts = primaryBuildAddress.split(",").map((p) => p.trim()).filter(Boolean);
    if (parts.length >= 2) setCity(parts[parts.length - 2] || "");
    if (parts.length >= 1) setCountry(parts[parts.length - 1] || "");
  }, [primaryBuildAddress]);

  const handleSave = async () => {
    try {
      await updateMe.mutateAsync({
        fullName: fullName.trim(),
        phone: phone.trim() ? phone.trim() : undefined,
      });
      Alert.alert("Saved", "Your profile information has been updated.");
      router.back();
    } catch (e: any) {
      Alert.alert("Could not save", e?.message || "Please try again.");
    }
  };

  return (
    <View className="flex-1 bg-white">
      {/* Header */}
      <View className="pt-16 px-6 pb-4 flex-row items-center">
        <TouchableOpacity onPress={() => (router.canGoBack() ? router.back() : router.push("/profile"))} className="mr-4">
          <ArrowLeft size={28} color="#000000" strokeWidth={2} />
        </TouchableOpacity>
        <Text className="text-2xl text-black" style={{ fontFamily: "Poppins_600SemiBold" }}>
          Personal Information
        </Text>
      </View>

      <ScrollView className="flex-1 px-6" contentContainerStyle={{ paddingBottom: 56 }}>
        {/* Loading */}
        {isLoading && (
          <View className="items-center justify-center py-10">
            <ActivityIndicator size="large" color="#000" />
            <Text className="text-gray-500 mt-3" style={{ fontFamily: "Poppins_400Regular" }}>
              Loading your information...
            </Text>
          </View>
        )}

        {/* Form */}
        {!isLoading && (
          <>
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-lg text-black" style={{ fontFamily: "Poppins_700Bold" }}>
                Basic Information
              </Text>
              <View className={`flex-row items-center px-3 py-1 rounded-full ${verified ? "bg-green-100" : "bg-amber-100"}`}>
                {verified ? (
                  <ShieldCheck size={14} color="#15803D" strokeWidth={2} />
                ) : (
                  <ShieldX size={14} color="#B45309" strokeWidth={2} />
                )}
                <Text
                  className={`ml-1 text-xs ${verified ? "text-green-700" : "text-amber-700"}`}
                  style={{ fontFamily: "Poppins_600SemiBold" }}
                >
                  {verified ? "Verified" : "Not verified"}
                </Text>
              </View>
            </View>

            <Field
              label="Full name"
              value={fullName}
              onChangeText={setFullName}
              placeholder="Enter your full name"
              autoCapitalize="words"
            />

            <Field
              label="Email"
              value={email}
              editable={false}
              placeholder="email@example.com"
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <Field
              label="Phone number"
              value={phone}
              onChangeText={setPhone}
              placeholder="+234..."
              keyboardType="phone-pad"
              autoCapitalize="none"
            />

            <Field
              label="Address"
              value={address}
              editable={false}
              onChangeText={setAddress}
              placeholder="House number, street, area"
              helperText="From your most recent project address."
            />

            <Field
              label="City"
              value={city}
              editable={false}
              onChangeText={setCity}
              placeholder="e.g. Lagos"
              autoCapitalize="words"
            />

            <Field
              label="State"
              value={state}
              editable={false}
              onChangeText={setState}
              placeholder="e.g. Lagos State"
              autoCapitalize="words"
            />

            <Field
              label="Country"
              value={country}
              editable={false}
              onChangeText={setCountry}
              placeholder="e.g. Nigeria"
              autoCapitalize="words"
            />

            <TouchableOpacity
              onPress={handleSave}
              disabled={!canSave || updateMe.isPending}
              className={`mt-4 rounded-2xl py-4 items-center ${
                !canSave || updateMe.isPending ? "bg-gray-200" : "bg-black"
              }`}
            >
              {updateMe.isPending ? (
                <ActivityIndicator color={canSave ? "#FFFFFF" : "#000000"} />
              ) : (
                <Text
                  className={`${!canSave ? "text-gray-500" : "text-white"} text-base`}
                  style={{ fontFamily: "Poppins_600SemiBold" }}
                >
                  Save
                </Text>
              )}
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </View>
  );
}

