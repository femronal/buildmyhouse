import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { ArrowLeft, Check, Info, Upload } from "lucide-react-native";
import * as ImagePicker from "expo-image-picker";
import * as DocumentPicker from "expo-document-picker";
import { useResponsivePadding } from "@/lib/responsive-layout";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useUpdateCurrentUser } from "@/hooks/useUpdateCurrentUser";
import { useUploadProfilePicture } from "@/hooks/useUploadProfilePicture";
import {
  useGCProfile,
  useUpdateGCProfile,
  useUpsertVerificationDocument,
} from "@/hooks/useGCProfile";
import { useBankAccounts, useCreateBankAccount } from "@/hooks/useBankAccounts";
import { getBackendAssetUrl } from "@/lib/image";
import { uploadFile } from "@/utils/fileUpload";
import { needsContractorIntroOnboarding } from "@/lib/onboarding";

type Step = "overview" | "billing" | "professional";

function InfoLabel(props: { label: string; info: string }) {
  return (
    <View className="flex-row items-center mb-2">
      <Text className="text-gray-300 text-sm" style={{ fontFamily: "Poppins_500Medium" }}>
        {props.label}
      </Text>
      <TouchableOpacity onPress={() => Alert.alert(props.label, props.info)} className="ml-2">
        <Info size={14} color="#93C5FD" strokeWidth={2.2} />
      </TouchableOpacity>
    </View>
  );
}

export default function OnboardingScreen() {
  const router = useRouter();
  const { horizontalPad, headerPaddingTop, scrollBottomPadding } = useResponsivePadding("stack");
  const { data: currentUser, isLoading: loadingUser } = useCurrentUser();
  const { data: profileData, isLoading: loadingProfile } = useGCProfile();
  const { data: bankAccounts = [] } = useBankAccounts();

  const updateUser = useUpdateCurrentUser();
  const updateGCProfile = useUpdateGCProfile();
  const uploadProfilePicture = useUploadProfilePicture();
  const createBankAccount = useCreateBankAccount();
  const upsertVerificationDocument = useUpsertVerificationDocument();

  const [step, setStep] = useState<Step>("overview");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [location, setLocation] = useState("");
  const [agreeTerms, setAgreeTerms] = useState(false);

  const [bankName, setBankName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [accountOwnerName, setAccountOwnerName] = useState("");

  useEffect(() => {
    if (!currentUser) return;
    setFullName(String(currentUser.fullName || ""));
    setEmail(String(currentUser.email || ""));
    setPhone(String(currentUser.phone || ""));
    setAgreeTerms(!!currentUser.gcTermsAcceptedAt);
  }, [currentUser]);

  useEffect(() => {
    if (!profileData) return;
    setLocation(String(profileData.location || ""));
  }, [profileData]);

  useEffect(() => {
    if (!currentUser) return;
    if (!needsContractorIntroOnboarding(currentUser)) {
      router.replace("/contractor/gc-dashboard");
    }
  }, [currentUser, router]);

  const hasProfilePhoto = !!String(currentUser?.pictureUrl || "").trim();
  const isBusy =
    updateUser.isPending ||
    updateGCProfile.isPending ||
    uploadProfilePicture.isPending ||
    createBankAccount.isPending ||
    upsertVerificationDocument.isPending;

  const progress = step === "overview" ? 34 : step === "billing" ? 67 : 100;

  const goBack = () => {
    if (step === "professional") {
      setStep("billing");
      return;
    }
    if (step === "billing") {
      setStep("overview");
      return;
    }
    router.replace("/contractor/gc-dashboard");
  };

  const handlePickProfilePicture = async () => {
    try {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        Alert.alert("Permission required", "Please allow photo library access to upload your logo/photo.");
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.85,
      });
      if (result.canceled) return;
      const asset = result.assets?.[0];
      if (!asset?.uri) return;
      await uploadProfilePicture.mutateAsync({
        uri: asset.uri,
        name: asset.fileName || `gc-profile-${Date.now()}.jpg`,
        type: asset.mimeType || "image/jpeg",
      });
      Alert.alert("Uploaded", "Profile image uploaded successfully.");
    } catch (e: any) {
      Alert.alert("Upload failed", e?.message || "Please try again.");
    }
  };

  const handleOverviewContinue = async () => {
    if (!fullName.trim() || !email.trim() || !phone.trim() || !location.trim()) {
      Alert.alert("Required details", "Fill all required overview fields to continue.");
      return;
    }
    if (!hasProfilePhoto) {
      Alert.alert("Profile photo required", "Please upload your profile photo/logo to continue.");
      return;
    }
    try {
      await Promise.all([
        updateUser.mutateAsync({
          fullName: fullName.trim(),
          email: email.trim().toLowerCase(),
          phone: phone.trim(),
        }),
        updateGCProfile.mutateAsync({ location: location.trim() }),
      ]);
      setStep("billing");
    } catch (e: any) {
      Alert.alert("Could not save", e?.message || "Please try again.");
    }
  };

  const handleAddBank = async () => {
    if (!bankName.trim() || !accountNumber.trim() || !accountOwnerName.trim()) {
      Alert.alert("Missing details", "Fill bank name, account number, and account owner name.");
      return;
    }
    try {
      await createBankAccount.mutateAsync({
        bankName: bankName.trim(),
        accountNumber: accountNumber.trim(),
        accountOwnerName: accountOwnerName.trim(),
      });
      setBankName("");
      setAccountNumber("");
      setAccountOwnerName("");
      Alert.alert("Added", "Bank account added successfully.");
    } catch (e: any) {
      Alert.alert("Could not add bank account", e?.message || "Please try again.");
    }
  };

  const handleBillingContinue = async () => {
    if (bankAccounts.length < 1) {
      Alert.alert("Bank details required", "Add at least one bank account before you continue.");
      return;
    }
    if (!agreeTerms) {
      Alert.alert("Terms required", "Please agree to GC Terms & Policies before continuing.");
      return;
    }
    setStep("professional");
  };

  const completeOnboarding = async (professionalSkipped: boolean) => {
    try {
      await Promise.all([
        updateGCProfile.mutateAsync({
          professionalOnboardingSkipped: professionalSkipped,
          professionalOnboardingCompleted: !professionalSkipped,
        }),
        updateUser.mutateAsync({
          fullName: fullName.trim(),
          email: email.trim().toLowerCase(),
          phone: phone.trim(),
          acceptGCTerms: agreeTerms,
          completeProfileSetup: true,
        }),
      ]);
      Alert.alert("Setup complete", "Your account setup is saved. You can now access the app.", [
        { text: "Continue", onPress: () => router.replace("/contractor/gc-dashboard") },
      ]);
    } catch (e: any) {
      Alert.alert("Could not complete setup", e?.message || "Please try again.");
    }
  };

  const handleSkipProfessional = () => {
    Alert.alert(
      "Skip professional documents?",
      "You will remain unverified and may not be recommended to international clients. You can upload what you have now and add the rest later from your profile.",
      [
        { text: "Go Back", style: "cancel" },
        { text: "Skip for now", onPress: () => void completeOnboarding(true) },
      ],
    );
  };

  const handleUploadVerificationDocument = async (documentType: string, title: string) => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: [
          "application/pdf",
          "application/msword",
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          "image/*",
        ],
        copyToCacheDirectory: true,
      });
      if (result.canceled) return;
      const file = result.assets?.[0];
      if (!file?.uri) return;
      const fileUrl = await uploadFile(file.uri, "document", {
        fileName: file.name || `${documentType}.pdf`,
        mimeType: file.mimeType || "application/pdf",
      });
      await upsertVerificationDocument.mutateAsync({ documentType, fileUrl });
      Alert.alert("Uploaded", `${title} uploaded successfully.`);
    } catch (e: any) {
      Alert.alert("Upload failed", e?.message || "Please try again.");
    }
  };

  const requiredDocs = profileData?.verificationRequiredDocuments || [];
  const loading = loadingUser || loadingProfile;

  if (loading) {
    return (
      <View className="flex-1 bg-[#0A1628] items-center justify-center">
        <ActivityIndicator size="large" color="#3B82F6" />
      </View>
    );
  }

  if (!currentUser?.id) {
    return (
      <View className="flex-1 bg-[#0A1628] items-center justify-center px-6">
        <Text className="text-gray-300 text-center mb-4" style={{ fontFamily: "Poppins_500Medium" }}>
          Please sign in to continue.
        </Text>
        <TouchableOpacity onPress={() => router.replace("/login")} className="bg-blue-600 rounded-full px-6 py-3">
          <Text className="text-white" style={{ fontFamily: "Poppins_600SemiBold" }}>
            Go to Login
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-[#0A1628]">
      <View className="pb-4 flex-row items-center" style={{ paddingTop: headerPaddingTop, paddingHorizontal: horizontalPad }}>
        <TouchableOpacity onPress={goBack} className="w-10 h-10 bg-[#1E3A5F] rounded-full items-center justify-center mr-3">
          <ArrowLeft size={20} color="#FFFFFF" strokeWidth={2} />
        </TouchableOpacity>
        <View className="flex-1">
          <Text className="text-white text-xl" style={{ fontFamily: "Poppins_700Bold" }}>
            Contractor Setup
          </Text>
          <Text className="text-gray-400 text-xs" style={{ fontFamily: "Poppins_400Regular" }}>
            {step === "overview" ? "Step 1 of 3" : step === "billing" ? "Step 2 of 3" : "Step 3 of 3"}
          </Text>
        </View>
      </View>

      <View className="mb-5" style={{ paddingHorizontal: horizontalPad }}>
        <View className="h-2 rounded-full bg-[#1E3A5F] overflow-hidden">
          <View className="h-full bg-blue-500" style={{ width: `${progress}%` }} />
        </View>
      </View>

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: horizontalPad, paddingBottom: scrollBottomPadding }}
      >
        {step === "overview" && (
          <View className="pb-6">
            <Text className="text-white text-lg mb-2" style={{ fontFamily: "Poppins_700Bold" }}>
              Overview (Required)
            </Text>
            <Text className="text-gray-400 text-sm mb-5" style={{ fontFamily: "Poppins_400Regular" }}>
              These details are required before you can use the app.
            </Text>

            <View className="mb-4">
              <InfoLabel
                label="Profile photo / logo"
                info="BuildMyHouse uses this to identify your business in project requests and admin verification."
              />
              <TouchableOpacity onPress={handlePickProfilePicture} className="rounded-xl border border-blue-900 bg-[#1E3A5F] p-3 flex-row items-center">
                {hasProfilePhoto ? (
                  <Image
                    source={{ uri: getBackendAssetUrl(currentUser.pictureUrl || "") || String(currentUser.pictureUrl) }}
                    className="w-11 h-11 rounded-full mr-3"
                  />
                ) : (
                  <View className="w-11 h-11 rounded-full bg-[#0A1628] items-center justify-center mr-3">
                    <Upload size={16} color="#93C5FD" strokeWidth={2.2} />
                  </View>
                )}
                <Text className="text-white text-sm" style={{ fontFamily: "Poppins_500Medium" }}>
                  {hasProfilePhoto ? "Profile photo uploaded" : "Upload profile photo/logo"}
                </Text>
              </TouchableOpacity>
            </View>

            <View className="mb-4">
              <InfoLabel label="Full name" info="This name appears on your profile and in homeowner project requests." />
              <TextInput
                value={fullName}
                onChangeText={setFullName}
                placeholder="Enter full name"
                placeholderTextColor="#6B7280"
                className="rounded-xl border border-blue-900 bg-[#1E3A5F] px-4 py-3 text-white"
                style={{ fontFamily: "Poppins_400Regular" }}
              />
            </View>

            <View className="mb-4">
              <InfoLabel label="Email" info="Used for project notifications, payment notices, and account security." />
              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder="Enter email"
                placeholderTextColor="#6B7280"
                autoCapitalize="none"
                keyboardType="email-address"
                className="rounded-xl border border-blue-900 bg-[#1E3A5F] px-4 py-3 text-white"
                style={{ fontFamily: "Poppins_400Regular" }}
              />
            </View>

            <View className="mb-4">
              <InfoLabel label="Phone number" info="Used for urgent project communication and support escalation." />
              <TextInput
                value={phone}
                onChangeText={setPhone}
                placeholder="+234..."
                placeholderTextColor="#6B7280"
                keyboardType="phone-pad"
                className="rounded-xl border border-blue-900 bg-[#1E3A5F] px-4 py-3 text-white"
                style={{ fontFamily: "Poppins_400Regular" }}
              />
            </View>

            <View className="mb-6">
              <InfoLabel
                label="Business location"
                info="Location helps BuildMyHouse match you to nearby jobs and verify service coverage."
              />
              <TextInput
                value={location}
                onChangeText={setLocation}
                placeholder="e.g. Lagos, Nigeria"
                placeholderTextColor="#6B7280"
                className="rounded-xl border border-blue-900 bg-[#1E3A5F] px-4 py-3 text-white"
                style={{ fontFamily: "Poppins_400Regular" }}
              />
            </View>

            <TouchableOpacity
              onPress={handleOverviewContinue}
              disabled={isBusy}
              className={`rounded-full py-4 items-center ${isBusy ? "bg-gray-600" : "bg-blue-600"}`}
            >
              {isBusy ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text className="text-white text-base" style={{ fontFamily: "Poppins_700Bold" }}>
                  Continue to Billing
                </Text>
              )}
            </TouchableOpacity>
          </View>
        )}

        {step === "billing" && (
          <View className="pb-6">
            <Text className="text-white text-lg mb-2" style={{ fontFamily: "Poppins_700Bold" }}>
              Billing (Required)
            </Text>
            <Text className="text-gray-400 text-sm mb-4" style={{ fontFamily: "Poppins_400Regular" }}>
              Add at least one bank account to receive payments.
            </Text>

            <View className="mb-3">
              <InfoLabel
                label="Bank name"
                info="Your bank name is used to route stage payments correctly."
              />
              <TextInput
                value={bankName}
                onChangeText={setBankName}
                placeholder="Bank name"
                placeholderTextColor="#6B7280"
                className="rounded-xl border border-blue-900 bg-[#1E3A5F] px-4 py-3 text-white"
                style={{ fontFamily: "Poppins_400Regular" }}
              />
            </View>

            <View className="mb-3">
              <InfoLabel
                label="Account number"
                info="Required for payout processing after approved stage milestones."
              />
              <TextInput
                value={accountNumber}
                onChangeText={setAccountNumber}
                placeholder="Account number"
                placeholderTextColor="#6B7280"
                keyboardType="number-pad"
                className="rounded-xl border border-blue-900 bg-[#1E3A5F] px-4 py-3 text-white"
                style={{ fontFamily: "Poppins_400Regular" }}
              />
            </View>

            <View className="mb-3">
              <InfoLabel
                label="Account owner name"
                info="This must match your registered payout account holder to avoid transfer delays."
              />
              <TextInput
                value={accountOwnerName}
                onChangeText={setAccountOwnerName}
                placeholder="Account owner name"
                placeholderTextColor="#6B7280"
                className="rounded-xl border border-blue-900 bg-[#1E3A5F] px-4 py-3 text-white"
                style={{ fontFamily: "Poppins_400Regular" }}
              />
            </View>

            <TouchableOpacity
              onPress={handleAddBank}
              disabled={isBusy}
              className={`rounded-xl py-3 items-center mb-4 ${isBusy ? "bg-gray-600" : "bg-blue-700"}`}
            >
              <Text className="text-white text-sm" style={{ fontFamily: "Poppins_600SemiBold" }}>
                Add bank account
              </Text>
            </TouchableOpacity>

            <View className="bg-[#1E3A5F] rounded-xl border border-blue-900 p-3 mb-4">
              <Text className="text-white text-sm mb-2" style={{ fontFamily: "Poppins_600SemiBold" }}>
                Added bank accounts ({bankAccounts.length})
              </Text>
              {bankAccounts.length === 0 ? (
                <Text className="text-gray-400 text-xs" style={{ fontFamily: "Poppins_400Regular" }}>
                  No bank account added yet.
                </Text>
              ) : (
                bankAccounts.map((item) => (
                  <Text key={item.id} className="text-gray-300 text-xs mb-1" style={{ fontFamily: "Poppins_400Regular" }}>
                    {item.bankName} • {item.maskedAccountNumber} • {item.accountOwnerName}
                  </Text>
                ))
              )}
            </View>

            <TouchableOpacity
              onPress={() => setAgreeTerms((prev) => !prev)}
              className="flex-row items-start rounded-xl border border-blue-800 bg-[#122746] px-3 py-3 mb-2"
            >
              <View
                className={`w-5 h-5 rounded border items-center justify-center mr-3 mt-0.5 ${
                  agreeTerms ? "bg-blue-600 border-blue-600" : "bg-[#0A1628] border-blue-900"
                }`}
              >
                {agreeTerms ? <Check size={13} color="#FFFFFF" strokeWidth={3} /> : null}
              </View>
              <Text className="text-xs text-gray-300 flex-1 leading-5" style={{ fontFamily: "Poppins_400Regular" }}>
                I agree to BuildMyHouse General Contractor Terms & Policies.
              </Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => router.push("/contractor/terms-conditions")} className="mb-6">
              <Text className="text-blue-300 text-xs underline" style={{ fontFamily: "Poppins_500Medium" }}>
                View GC Terms & Policies
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleBillingContinue}
              disabled={isBusy}
              className={`rounded-full py-4 items-center ${isBusy ? "bg-gray-600" : "bg-blue-600"}`}
            >
              <Text className="text-white text-base" style={{ fontFamily: "Poppins_700Bold" }}>
                Continue to Professional (Optional)
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {step === "professional" && (
          <View className="pb-6">
            <Text className="text-white text-lg mb-2" style={{ fontFamily: "Poppins_700Bold" }}>
              Professional (Optional)
            </Text>
            <Text className="text-gray-400 text-sm mb-4" style={{ fontFamily: "Poppins_400Regular" }}>
              Upload any verification documents you can lay your hands on now. You can upload the rest later.
            </Text>

            <View className="bg-amber-900/30 rounded-xl border border-amber-700 px-3 py-3 mb-4">
              <Text className="text-amber-200 text-xs leading-5" style={{ fontFamily: "Poppins_500Medium" }}>
                If you skip this page, you will remain unverified and may not be recommended to international clients.
              </Text>
            </View>

            {requiredDocs.map((doc) => (
              <View key={doc.type} className="bg-[#1E3A5F] rounded-xl border border-blue-900 p-3 mb-3">
                <Text className="text-white text-sm mb-1" style={{ fontFamily: "Poppins_600SemiBold" }}>
                  {doc.title}
                </Text>
                <Text className="text-gray-400 text-xs mb-2" style={{ fontFamily: "Poppins_400Regular" }}>
                  {doc.description}
                </Text>
                <TouchableOpacity
                  onPress={() => handleUploadVerificationDocument(doc.type, doc.title)}
                  disabled={isBusy}
                  className="rounded-lg border border-blue-700 bg-[#122746] py-2 items-center"
                >
                  <Text className="text-blue-300 text-xs" style={{ fontFamily: "Poppins_600SemiBold" }}>
                    {doc.uploaded ? "Replace file" : "Upload file"}
                  </Text>
                </TouchableOpacity>
              </View>
            ))}

            <TouchableOpacity
              onPress={() => void completeOnboarding(false)}
              disabled={isBusy}
              className={`rounded-full py-4 items-center mb-3 ${isBusy ? "bg-gray-600" : "bg-blue-600"}`}
            >
              {isBusy ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text className="text-white text-base" style={{ fontFamily: "Poppins_700Bold" }}>
                  Complete setup
                </Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity onPress={handleSkipProfessional} disabled={isBusy} className="rounded-full py-4 items-center bg-[#1E3A5F] border border-blue-900">
              <Text className="text-gray-200 text-base" style={{ fontFamily: "Poppins_600SemiBold" }}>
                Skip for now
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </View>
  );
}
